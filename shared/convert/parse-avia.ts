import { parse, type HTMLElement, type Node } from 'node-html-parser'
import { hashSource } from '../page-model/hash-gate'
import { PRESETS } from '../page-model/presets'
import type { IdFactory } from '../page-model/workspace'
import { createRow } from '../page-model/workspace'
import type {
  ColumnItem,
  PageDocument,
  PictureWrap,
  Row,
  RowPreset,
  SeoFields,
  SourceOnlyRegion,
  TextBlock,
} from '../page-model/types'

const FRACTION_CLASS: Record<string, { key: string }> = {
  av_one_full: { key: '1' },
  av_one_half: { key: '1/2' },
  av_one_third: { key: '1/3' },
  av_two_third: { key: '2/3' },
  av_one_fourth: { key: '1/4' },
  av_three_fourth: { key: '3/4' },
  av_two_fifth: { key: '2/5' },
  av_three_fifth: { key: '3/5' },
}

export interface ParsedPage {
  seo: SeoFields
  sourceHash: string
  rows: Row[]
  sourceOnly: SourceOnlyRegion[]
  families: string[]
  converterFamily: string
  waterjet: boolean
  medicalFloat: boolean
  heading: string
  imageUrls: string[]
  linkHrefs: string[]
}

export function parseAviaHtml(html: string, ids: IdFactory): ParsedPage {
  const root = parse(html)
  const seo = readSeo(root, html)
  const styleText = root.querySelectorAll('style').map((node) => node.text).join('\n')
  const waterjet = isWaterjetCss(styleText)
  const sourceOnly: SourceOnlyRegion[] = []
  const columns = root.querySelectorAll('.flex_column_div').filter((node) => {
    const cls = node.getAttribute('class') ?? ''
    return cls.includes('flex_column_div') && !cls.includes('grid-entry') && !inChrome(node) && !insideAnotherColumn(node)
  })
  if (columns.length === 0) throw new Error('No entry content on this page')
  const groups = groupRows(columns)
  let rows = groups.map((group) => rowFromColumns(group, ids, sourceOnly))
  if (waterjet) rows = rows.map((row) => applyWaterjet(row, ids))
  rows = rows.map((row) => applyMedical(row))
  const medicalFloat = rows.some((row) => row.preset === 'float-wrap')
  if (root.querySelector('.gform_wrapper') || root.querySelector('[id^="gform_wrapper"]')) {
    pushSource(sourceOnly, ids, 'Gravity Form', 'Form fields, notifications, and captcha live in WordPress. This draft does not submit the form.')
  }
  const bundle = parse(`<div class="entry-content">${columns.map((column) => column.toString()).join('')}</div>`)
  const entry = bundle.querySelector('.entry-content')
  if (!entry) throw new Error('No entry content on this page')
  const sourceHash = hashSource(`${columns.map((column) => column.toString()).join('\n')}\n${waterjet ? 'waterjet-40-55-15-20' : ''}`)
  const families = familiesFor(rows, sourceOnly)
  const facts = collectFacts(entry)
  const imageUrls = facts.images
  const linkHrefs = facts.links
  return {
    seo,
    sourceHash,
    rows,
    sourceOnly,
    families,
    converterFamily: primaryFamily(families),
    waterjet,
    medicalFloat,
    heading: facts.heading,
    imageUrls,
    linkHrefs,
  }
}

export function toPageDocument(parsed: ParsedPage, now: string): PageDocument {
  const path = pathFromCanonical(parsed.seo.canonical)
  const id = path.replace(/^\/|\/$/g, '').replace(/\//g, '--') || 'home'
  return {
    id,
    path,
    title: parsed.seo.title,
    readiness: 'layout_editing',
    seo: parsed.seo,
    rows: parsed.rows,
    publishedVersion: null,
    provenance: {
      sourceUrl: parsed.seo.canonical || '',
      sourceHash: parsed.sourceHash,
      converterFamily: parsed.converterFamily,
      families: parsed.families,
      convertedAt: now,
      grid: parsed.rows.map((row) => row.preset).join(' | ') || 'none',
      remainingSourceOnly: parsed.sourceOnly,
      verify: verifyNote(path, parsed),
    },
    siteVisibility: 'private_draft',
    editedByHuman: false,
  }
}

function verifyNote(path: string, parsed: ParsedPage): string {
  const preview = `/preview${path}`
  const live = parsed.seo.canonical || `https://titanium.com${path}`
  return `Open ${preview} (private, noindex) beside ${live}. Check the grid (${parsed.rows.map((row) => row.preset).join(', ')}), pictures, buttons, and the search title. Saving in Payload does not change the public site.`
}

function pathFromCanonical(canonical: string): string {
  if (!canonical) return '/'
  try {
    const url = new URL(canonical)
    const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
    return path
  } catch {
    return '/'
  }
}

function readSeo(root: HTMLElement, html: string): SeoFields {
  const title = decode(root.querySelector('title')?.text ?? '')
  const description = meta(root, 'name', 'description')
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? ''
  const ogTitle = meta(root, 'property', 'og:title') || title
  const ogDescription = meta(root, 'property', 'og:description') || description
  const ogImage = meta(root, 'property', 'og:image')
  if (!title && !html.includes('<title')) {
    throw new Error('Missing title')
  }
  return { title, description, canonical, ogTitle, ogDescription, ogImage }
}

function meta(root: HTMLElement, attr: 'name' | 'property', key: string): string {
  const node = root.querySelector(`meta[${attr}="${key}"]`)
  return decode(node?.getAttribute('content') ?? '')
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function inChrome(node: HTMLElement): boolean {
  let current: HTMLElement | null = node
  while (current) {
    if (!current.tagName) break
    const id = (current.getAttribute('id') ?? '').toLowerCase()
    const tag = (current.tagName ?? '').toLowerCase()
    if (tag === 'header' || tag === 'footer' || id === 'header' || id === 'footer') return true
    const parent = current.parentNode
    current = parent && 'getAttribute' in parent ? (parent as HTMLElement) : null
  }
  return false
}

function isWaterjetCss(css: string): boolean {
  const compact = css.replace(/\s+/g, '')
  return (
    compact.includes('.av_textblock_section{float:left;width:55%') &&
    compact.includes('width:40%') &&
    compact.includes('margin-top:20px')
  )
}

function insideAnotherColumn(node: HTMLElement): boolean {
  let parent = node.parentNode
  while (parent && 'getAttribute' in parent) {
    const cls = (parent as HTMLElement).getAttribute('class') ?? ''
    if (cls.includes('flex_column_div')) return true
    parent = parent.parentNode
  }
  return false
}

function groupRows(columns: HTMLElement[]): HTMLElement[][] {
  const groups: HTMLElement[][] = []
  for (const column of columns) {
    const cls = column.getAttribute('class') ?? ''
    const first = cls.split(/\s+/).includes('first')
    if (first || groups.length === 0) groups.push([column])
    else groups[groups.length - 1].push(column)
  }
  return groups
}

function rowFromColumns(columns: HTMLElement[], ids: IdFactory, sourceOnly: SourceOnlyRegion[]): Row {
  const keys = columns.map(widthKey)
  const preset = presetForKeys(keys)
  const spaceAbove = columns.some((column) => (column.getAttribute('class') ?? '').includes('column-top-margin'))
  const row = createRow(ids, preset, spaceAbove)
  columns.forEach((column, index) => {
    const target = row.columns[index]
    if (!target) return
    const pieces = collectPieces(column, ids, sourceOnly)
    target.items = piecesToItems(pieces, ids)
  })
  if (columns.length > row.columns.length) {
    pushSource(
      sourceOnly,
      ids,
      'Extra columns',
      'This row had more columns than the named preset. Extra columns were not forced into an equal grid.',
    )
  }
  return row
}

function widthKey(column: HTMLElement): string {
  const cls = column.getAttribute('class') ?? ''
  const match = cls.split(/\s+/).find((token) => token in FRACTION_CLASS)
  return match ? FRACTION_CLASS[match].key : '1'
}

function presetForKeys(keys: string[]): RowPreset {
  const joined = keys.join('+')
  const map: Record<string, RowPreset> = {
    '1': 'full',
    '1/2': 'halves',
    '1/2+1/2': 'halves',
    '1/3+1/3+1/3': 'thirds',
    '2/3+1/3': 'two-one',
    '2/5+3/5': 'quality-split',
    '3/4+1/4': 'three-one',
    '2/3': 'lead-two-thirds',
    '3/5': 'lead-three-fifths',
    '3/4': 'lead-three-quarters',
  }
  return map[joined] ?? 'full'
}

interface Piece {
  kind: 'heading' | 'paragraph' | 'picture' | 'button' | 'source'
  text?: string
  level?: 1 | 2 | 3 | 4
  src?: string
  alt?: string
  href?: string
  wrap?: PictureWrap
  label?: string
  reason?: string
}

function collectPieces(column: HTMLElement, ids: IdFactory, sourceOnly: SourceOnlyRegion[]): Piece[] {
  const pieces: Piece[] = []
  walk(column, pieces, ids, sourceOnly)
  return pieces
}

function walk(node: Node, pieces: Piece[], ids: IdFactory, sourceOnly: SourceOnlyRegion[]): void {
  if (!isElement(node)) {
    const text = cleanText(node.text ?? '')
    if (text) pieces.push({ kind: 'paragraph', text })
    return
  }
  const tag = node.tagName.toLowerCase()
  const cls = node.getAttribute('class') ?? ''
  if (tag === 'script' || tag === 'style') return
  if (cls.includes('gform_wrapper') || (node.getAttribute('id') ?? '').startsWith('gform_wrapper')) {
    const reason = 'Gravity Form is captcha-protected. Notifications and conditional logic need WordPress admin.'
    pieces.push({ kind: 'source', label: 'Protected form', reason })
    pushSource(sourceOnly, ids, 'Protected form', reason)
    return
  }
  if (cls.includes('isotope-item') || cls.includes('grid-entry')) {
    const reason = 'This product grid is a WordPress query, not a fixed column layout.'
    pieces.push({ kind: 'source', label: 'Product grid', reason })
    pushSource(sourceOnly, ids, 'Product grid', reason)
    return
  }
  if (tag === 'img') {
    const picture = pictureFrom(node, '')
    if (picture) pieces.push(picture)
    return
  }
  if (tag === 'a' && (cls.includes('avia-button') || isLineCardLink(node))) {
    pushAnchor(node, pieces)
    return
  }
  if (isTextTag(tag) && !node.querySelector('img') && !node.querySelector('a.avia-button')) {
    const text = inlineMarkdown(node)
    if (!text) return
    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
      pieces.push({ kind: 'heading', level: Number(tag.slice(1)) as 1 | 2 | 3 | 4, text })
    } else {
      pieces.push({ kind: 'paragraph', text })
    }
    return
  }
  for (const child of node.childNodes) walk(child, pieces, ids, sourceOnly)
}

function pushAnchor(node: HTMLElement, pieces: Piece[]): void {
  const href = absoluteUrl(node.getAttribute('href') ?? '')
  const img = node.querySelector('img')
  const label = cleanText(node.text)
  if (img) {
    const picture = pictureFrom(img, href)
    if (picture) pieces.push(picture)
  }
  if (label && (!img || label.length > 1)) {
    pieces.push({ kind: 'button', text: label, href })
  }
}

function pictureFrom(node: HTMLElement, href: string): Piece | null {
  const raw = node.getAttribute('data-src') || node.getAttribute('src') || ''
  if (!raw || raw.startsWith('data:')) return null
  const src = absoluteUrl(raw)
  if (/emoji|blank\.gif|pixel/i.test(src)) return null
  const alt = cleanText(node.getAttribute('alt') || node.getAttribute('title') || '')
  const tokens = (node.getAttribute('class') ?? '').split(/\s+/)
  const wrap: PictureWrap = tokens.includes('left') ? 'left' : tokens.includes('right') ? 'right' : 'none'
  return { kind: 'picture', src, alt, href, wrap }
}

function isLineCardLink(node: HTMLElement): boolean {
  const href = node.getAttribute('href') ?? ''
  const text = cleanText(node.text).toLowerCase()
  return href.toLowerCase().includes('.pdf') || text.includes('line card')
}

function inlineMarkdown(node: HTMLElement): string {
  let text = ''
  for (const child of node.childNodes) {
    if (!isElement(child)) {
      text = appendText(text, child.text ?? '')
      continue
    }
    const tag = child.tagName.toLowerCase()
    if (tag === 'br') {
      text += '\n'
      continue
    }
    if (tag === 'a') {
      const href = absoluteUrl(child.getAttribute('href') ?? '')
      const label = cleanText(child.text)
      const piece = href && label ? `[${label}](${href})` : label
      text = appendText(text, piece)
      continue
    }
    text = appendText(text, inlineMarkdown(child))
  }
  return cleanText(text)
}

function appendText(current: string, piece: string): string {
  if (!piece) return current
  if (current && !/\s$/.test(current) && !/^\s/.test(piece)) return `${current} ${piece}`
  return current + piece
}

function piecesToItems(pieces: Piece[], ids: IdFactory): ColumnItem[] {
  const items: ColumnItem[] = []
  let blocks: TextBlock[] = []
  const flush = () => {
    if (blocks.length === 0) return
    items.push({ id: ids.next('text'), kind: 'text', blocks })
    blocks = []
  }
  for (const piece of pieces) {
    if (piece.kind === 'heading' && piece.text && piece.level) {
      blocks.push({ type: 'heading', level: piece.level, text: piece.text })
      continue
    }
    if (piece.kind === 'paragraph' && piece.text) {
      blocks.push({ type: 'paragraph', text: piece.text })
      continue
    }
    flush()
    if (piece.kind === 'picture' && piece.src) {
      items.push({
        id: ids.next('picture'),
        kind: 'picture',
        src: piece.src,
        alt: piece.alt ?? '',
        href: piece.href ?? '',
        wrap: piece.wrap ?? 'none',
      })
    } else if (piece.kind === 'button' && piece.text) {
      items.push({
        id: ids.next('button'),
        kind: 'button',
        label: piece.text,
        href: piece.href ?? '',
        variant: 'primary',
      })
    }
  }
  flush()
  return items
}

function applyWaterjet(row: Row, ids: IdFactory): Row {
  if (row.preset !== 'full') return row
  const items = row.columns[0]?.items ?? []
  const pictures = items.filter((item) => item.kind === 'picture' && !isSocial(item.src))
  const rest = items.filter((item) => !(item.kind === 'picture' && !isSocial(item.src)))
  if (pictures.length === 0 || !rest.some((item) => item.kind === 'text')) return row
  const next = createRow(ids, 'waterjet-split', row.spaceAbove)
  next.columns[0].items = rest
  next.columns[1].items = pictures
  return next
}

function applyMedical(row: Row): Row {
  if (row.preset !== 'full') return row
  const wrapped = (row.columns[0]?.items ?? []).some((item) => item.kind === 'picture' && item.wrap !== 'none')
  if (!wrapped) return row
  return { ...row, preset: 'float-wrap' }
}

function isSocial(src: string): boolean {
  return /instagram|linkedin|twitter|facebook|youtube/i.test(src)
}

function familiesFor(rows: Row[], sourceOnly: SourceOnlyRegion[]): string[] {
  const families = new Set<string>()
  if (rows.some((row) => row.preset === 'thirds' && isCtaRow(row))) families.add('equal-3-cta')
  if (rows.some((row) => row.preset === 'two-one' && hasLineCard(row))) families.add('intro-two-one-linecard')
  if (rows.some((row) => row.preset === 'three-one' && hasLineCard(row))) families.add('intro-three-one-linecard')
  if (rows.some((row) => row.preset === 'quality-split')) families.add('quality-split')
  if (rows.some((row) => row.preset === 'waterjet-split')) families.add('waterjet-measured')
  if (rows.some((row) => row.preset === 'float-wrap')) families.add('medical-float')
  if (sourceOnly.some((region) => region.label === 'Protected form')) families.add('protected-form-blocked')
  if (families.size === 0) families.add('unclassified')
  return [...families]
}

function primaryFamily(families: string[]): string {
  const order = [
    'waterjet-measured',
    'medical-float',
    'quality-split',
    'intro-two-one-linecard',
    'intro-three-one-linecard',
    'equal-3-cta',
    'protected-form-blocked',
    'unclassified',
  ]
  return order.find((family) => families.includes(family)) ?? families[0] ?? 'unclassified'
}

function isCtaRow(row: Row): boolean {
  const labels = row.columns.map((column) =>
    column.items
      .filter((item) => item.kind === 'button')
      .map((item) => item.label.toLowerCase())
      .join(' '),
  )
  const joined = labels.join(' | ')
  return /contact/.test(joined) && /quote/.test(joined) && /shop/.test(joined)
}

function hasLineCard(row: Row): boolean {
  return row.columns.some((column) =>
    column.items.some((item) => {
      if (item.kind === 'button') return /line card|\.pdf/i.test(`${item.label} ${item.href}`)
      if (item.kind === 'picture') return /\.pdf/i.test(item.href)
      if (item.kind === 'text') return /line card/i.test(item.blocks.map((block) => block.text).join(' '))
      return false
    }),
  )
}

function pushSource(list: SourceOnlyRegion[], ids: IdFactory, label: string, reason: string): void {
  if (list.some((region) => region.label === label)) return
  list.push({ id: ids.next('source'), label, reason })
}

function absoluteUrl(value: string): string {
  if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')) return value
  try {
    return new URL(value, 'https://titanium.com').href
  } catch {
    return value
  }
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function isTextTag(tag: string): boolean {
  return tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'p' || tag === 'li'
}

function isElement(node: Node): node is HTMLElement {
  return Boolean((node as HTMLElement).tagName)
}

export function gridLabel(rows: Row[]): string {
  return rows.map((row) => PRESETS[row.preset].label).join(' · ')
}

function collectFacts(entry: HTMLElement): { images: string[]; links: string[]; heading: string } {
  const images: string[] = []
  const links: string[] = []
  for (const image of entry.querySelectorAll('img')) {
    if (insideSkipped(image)) continue
    const raw = image.getAttribute('data-src') || image.getAttribute('src') || ''
    if (!raw || raw.startsWith('data:') || /emoji|blank\.gif|pixel/i.test(raw)) continue
    images.push(absoluteUrl(raw))
  }
  for (const link of entry.querySelectorAll('a')) {
    if (insideSkipped(link)) continue
    const cls = link.getAttribute('class') ?? ''
    const href = absoluteUrl(link.getAttribute('href') ?? '')
    if (!href) continue
    if (cls.includes('avia-button') || href.toLowerCase().includes('.pdf')) links.push(href)
  }
  const heading = cleanText(entry.querySelector('h1, h2')?.text ?? '')
  return { images, links, heading }
}

function insideSkipped(node: HTMLElement): boolean {
  let current: HTMLElement | null = node
  while (current) {
    const cls = current.getAttribute('class') ?? ''
    const id = current.getAttribute('id') ?? ''
    if (
      cls.includes('isotope-item') ||
      cls.includes('grid-entry') ||
      cls.includes('gform_wrapper') ||
      id.startsWith('gform_wrapper')
    ) {
      return true
    }
    const parent = current.parentNode
    current = parent && 'getAttribute' in parent ? (parent as HTMLElement) : null
  }
  return false
}
