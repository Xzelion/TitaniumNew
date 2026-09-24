import { parse, type HTMLElement, type Node } from 'node-html-parser'
import type { KnownFormNote } from '../forms/gravity-form'
import { hashSource } from '../page-model/hash-gate'
import { PRESETS } from '../page-model/presets'
import type { IdFactory } from '../page-model/workspace'
import { createRow } from '../page-model/workspace'
import type { PortfolioCard } from './portfolio-wxr'
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

/** Bump when the converter output changes so unedited drafts rebuild. */
export const CONVERTER_VERSION = '2'

const FRACTION_CLASS: Record<string, { key: string }> = {
  av_one_full: { key: '1' },
  av_one_half: { key: '1/2' },
  av_one_third: { key: '1/3' },
  av_two_third: { key: '2/3' },
  av_one_fourth: { key: '1/4' },
  av_three_fourth: { key: '3/4' },
  av_one_fifth: { key: '1/5' },
  av_two_fifth: { key: '2/5' },
  av_three_fifth: { key: '3/5' },
  av_four_fifth: { key: '4/5' },
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
  portfolioCards: PortfolioCard[]
}

interface ConvertState {
  portfolioCards: PortfolioCard[] | null
  portfolioApplied: boolean
}

export function parseAviaHtml(
  html: string,
  ids: IdFactory,
  knownForms: KnownFormNote[] = [],
  portfolioCards: PortfolioCard[] | null = null,
): ParsedPage {
  const root = parse(html)
  const seo = readSeo(root, html)
  const styleText = root.querySelectorAll('style').map((node) => node.text).join('\n')
  const waterjetCss = isWaterjetCss(styleText)
  const sourceOnly: SourceOnlyRegion[] = []
  const oilGasCards = pathFromCanonical(seo.canonical) === '/oil-gas/' ? portfolioCards : null
  const state: ConvertState = { portfolioCards: oilGasCards, portfolioApplied: false }
  const columns = root.querySelectorAll('.flex_column_div').filter((node) => {
    const cls = node.getAttribute('class') ?? ''
    return cls.includes('flex_column_div') && !cls.includes('grid-entry') && !inChrome(node) && !insideAnotherColumn(node)
  })
  const story = columns.length === 0 ? root.querySelector('.post-entry .entry-content-wrapper') : null
  if (columns.length === 0 && (!story || inChrome(story))) throw new Error('No entry content on this page')
  const groups = groupRows(columns)
  const looseBlocks = root.querySelectorAll('.av_textblock_section').filter((node) => !insideLockedRegion(node))
  const ordered: Array<{ pos: number; columns?: HTMLElement[]; storyNode?: HTMLElement }> = [
    ...groups.map((group) => ({ pos: sourceStart(group[0]), columns: group })),
    ...looseBlocks.map((node) => ({ pos: sourceStart(node), storyNode: node })),
  ].sort((left, right) => left.pos - right.pos)
  let rows: Row[] = []
  for (const block of ordered) {
    if (block.columns) {
      const before = state.portfolioApplied
      const row = rowFromColumns(block.columns, ids, sourceOnly, state)
      if (row) rows.push(row)
      if (!before && state.portfolioApplied && state.portfolioCards) rows.push(...portfolioCardRows(state.portfolioCards, ids))
      continue
    }
    if (!block.storyNode) continue
    const row = createRow(ids, 'full', false)
    const column = row.columns[0]
    if (!column) continue
    column.items = piecesToItems(collectPieces(block.storyNode, ids, sourceOnly, state), ids)
    if (column.items.length > 0) rows.push(row)
  }
  if (rows.length === 0 && story) {
    const row = createRow(ids, 'full', false)
    const column = row.columns[0]
    if (column) column.items = piecesToItems(collectPieces(story, ids, sourceOnly, state), ids)
    rows = [row]
  }
  if (waterjetCss) rows = rows.map((row) => applyWaterjet(row, ids))
  rows = rows.map((row) => applyMedical(row))
  const waterjet = rows.some((row) => row.preset === 'waterjet-split')
  if (waterjetCss && !waterjet) {
    pushSource(
      sourceOnly,
      ids,
      'Text width inside the column',
      'This page includes the processing CSS that floats a text block to 55% and a picture to 40% (20px lower). No full-width row is that pair, so the draft keeps the named columns and does not invent the water-jet split.',
    )
  }
  const medicalFloat = rows.some((row) => row.preset === 'float-wrap')
  const contentForm = [...root.querySelectorAll('.gform_wrapper'), ...root.querySelectorAll('[id^="gform_wrapper"]')].find(
    (node) => !inChrome(node),
  )
  const knownForm = contentForm ? knownForms.find((note) => note.formId === formIdFrom(contentForm)) : undefined
  if (contentForm) {
    pushSource(
      sourceOnly,
      ids,
      knownForm?.label ?? 'Gravity Form',
      knownForm?.reason ?? 'Form fields, notifications, and captcha live in WordPress. This draft does not submit the form.',
    )
  }
  const newsSlider = [...root.querySelectorAll('.avia-content-slider'), ...root.querySelectorAll('.slide-entry')].find(
    (node) => !inChrome(node),
  )
  if (newsSlider) {
    pushSource(
      sourceOnly,
      ids,
      'News slider',
      'This news slider is a WordPress post query. The posts were not copied into the draft.',
    )
  }
  const cardGrid = [...root.querySelectorAll('.home-markets'), ...root.querySelectorAll('.home-processing')].find(
    (node) => !inChrome(node),
  )
  if (cardGrid) {
    pushSource(
      sourceOnly,
      ids,
      'Card grid',
      'These cards are custom HTML at 24% width (four across on a desktop, full width on a phone). They are not a named column preset, so they were not stacked into one column.',
    )
  }
  const columnHtml = columns.map((column) => column.toString()).join('\n')
  const looseHtml = looseBlocks.map((node) => node.toString()).join('\n')
  const storyHtml = story ? story.toString() : ''
  const bundle = parse(`<div class="entry-content">${columnHtml}\n${looseHtml}\n${columnHtml ? '' : storyHtml}</div>`)
  const entry = bundle.querySelector('.entry-content')
  if (!entry) throw new Error('No entry content on this page')
  const portfolioToken =
    state.portfolioApplied && state.portfolioCards
      ? `\noil-gas-cards:${state.portfolioCards.map((card) => card.wpId).join(',')}`
      : ''
  const sourceHash = hashSource(
    `${columnHtml}\n${looseHtml}\n${columnHtml ? '' : storyHtml}\n${waterjet ? 'waterjet-40-55-15-20' : ''}${cardGrid ? '\ncard-grid-24' : ''}${newsSlider ? '\nnews-slider' : ''}${knownForm ? `\n${knownForm.hashToken}` : ''}${portfolioToken}\nconverter-${CONVERTER_VERSION}`,
  )
  const families = familiesFor(rows, sourceOnly, state.portfolioApplied)
  const facts = collectFacts(entry)
  const imageUrls = facts.images
  const linkHrefs = facts.links
  const appliedCards = state.portfolioApplied && state.portfolioCards ? state.portfolioCards : []
  for (const card of appliedCards) {
    if (card.imageUrl) imageUrls.push(card.imageUrl)
    if (card.href) linkHrefs.push(card.href)
  }
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
    portfolioCards: appliedCards,
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
      converterVersion: CONVERTER_VERSION,
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

function formIdFrom(node: HTMLElement): number | null {
  const id = node.getAttribute('id') ?? ''
  const match = id.match(/gform_wrapper_(\d+)/)
  if (!match) return null
  return Number(match[1])
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

function sourceStart(node: HTMLElement | undefined): number {
  const range = (node as { range?: [number, number] } | undefined)?.range
  return range?.[0] ?? 0
}

function insideLockedRegion(node: HTMLElement): boolean {
  if (inChrome(node)) return true
  let current: HTMLElement | null = node
  while (current && current.getAttribute) {
    const cls = current.getAttribute('class') ?? ''
    const tokens = cls.split(/\s+/)
    if (
      cls.includes('flex_column_div') ||
      cls.includes('avia-content-slider') ||
      tokens.includes('slide-entry') ||
      cls.includes('av-hotspot') ||
      cls.includes('gform_wrapper') ||
      tokens.includes('home-markets') ||
      tokens.includes('home-processing') ||
      cls.includes('isotope-item') ||
      cls.includes('grid-entry')
    ) {
      return true
    }
    const parent = current.parentNode
    current = parent && 'getAttribute' in parent ? (parent as HTMLElement) : null
  }
  return false
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

function rowFromColumns(
  columns: HTMLElement[],
  ids: IdFactory,
  sourceOnly: SourceOnlyRegion[],
  state: ConvertState,
): Row | null {
  const keys = columns.map(widthKey)
  if (keys.some((key) => key === null)) {
    const shown = keys.map((key) => key ?? 'unmapped').join(' + ')
    pushSource(
      sourceOnly,
      ids,
      'Unmapped columns',
      `This row uses column widths (${shown}) that are not a named preset. It was not forced into a full-width row.`,
    )
    return null
  }
  const preset = presetForKeys(keys)
  if (!preset) {
    pushSource(
      sourceOnly,
      ids,
      'Unmapped columns',
      `This row uses column widths (${keys.join(' + ')}) that are not a named preset. It was not forced into a full-width row.`,
    )
    return null
  }
  const spaceAbove = columns.some((column) => (column.getAttribute('class') ?? '').includes('column-top-margin'))
  const row = createRow(ids, preset, spaceAbove)
  columns.forEach((column, index) => {
    const target = row.columns[index]
    if (!target) return
    const pieces = collectPieces(column, ids, sourceOnly, state)
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

const WIDTH_TOKEN = /^av_(?:one|two|three|four|five|six)_(?:full|half|third|fourth|fifth|sixth|second)$/

function widthKey(column: HTMLElement): string | null {
  const tokens = (column.getAttribute('class') ?? '').split(/\s+/)
  const known = tokens.find((token) => token in FRACTION_CLASS)
  if (known) return FRACTION_CLASS[known].key
  if (tokens.some((token) => WIDTH_TOKEN.test(token))) return null
  return '1'
}

function presetForKeys(keys: string[]): RowPreset | null {
  const joined = keys.join('+')
  const map: Record<string, RowPreset> = {
    '1': 'full',
    '1/2': 'halves',
    '1/2+1/2': 'halves',
    '1/3+1/3+1/3': 'thirds',
    '2/3+1/3': 'two-one',
    '1/3+2/3': 'one-two',
    '2/5+3/5': 'quality-split',
    '3/4+1/4': 'three-one',
    '2/3': 'lead-two-thirds',
    '3/5': 'lead-three-fifths',
    '3/4': 'lead-three-quarters',
    '4/5': 'lead-four-fifths',
    '3/5+2/5': 'wide-fifths',
    '1/2+1/4+1/4': 'half-quarters',
    '1/4+1/4+1/4+1/4': 'quarters',
    '1/4+1/4+1/4': 'quarter-trio',
  }
  return map[joined] ?? null
}

interface Piece {
  kind: 'heading' | 'paragraph' | 'picture' | 'button' | 'source'
  text?: string
  level?: 1 | 2 | 3 | 4
  src?: string
  alt?: string
  href?: string
  wrap?: PictureWrap
  displayPx?: number
  label?: string
  reason?: string
}

function collectPieces(column: HTMLElement, ids: IdFactory, sourceOnly: SourceOnlyRegion[], state: ConvertState): Piece[] {
  const pieces: Piece[] = []
  walk(column, pieces, ids, sourceOnly, state)
  return pieces
}

function walk(node: Node, pieces: Piece[], ids: IdFactory, sourceOnly: SourceOnlyRegion[], state: ConvertState): void {
  if (!isElement(node)) {
    const text = cleanText(node.text ?? '')
    if (text) pieces.push({ kind: 'paragraph', text })
    return
  }
  const tag = node.tagName.toLowerCase()
  const cls = node.getAttribute('class') ?? ''
  if (tag === 'script' || tag === 'style') return
  if (cls.includes('gform_wrapper') || (node.getAttribute('id') ?? '').startsWith('gform_wrapper')) {
    const reason = 'Form fields, notifications, and captcha live in WordPress. This draft does not submit the form.'
    pieces.push({ kind: 'source', label: 'Gravity Form', reason })
    pushSource(sourceOnly, ids, 'Gravity Form', reason)
    return
  }
  if (cls.includes('avia-content-slider') || cls.split(/\s+/).includes('slide-entry')) {
    const reason = 'This news slider is a WordPress post query. The posts were not copied into the draft.'
    pieces.push({ kind: 'source', label: 'News slider', reason })
    pushSource(sourceOnly, ids, 'News slider', reason)
    return
  }
  if (cls.includes('isotope-item') || cls.includes('grid-entry')) {
    if (state.portfolioCards && state.portfolioCards.length > 0 && cls.split(/\s+/).includes('oil-gas_sort')) {
      state.portfolioApplied = true
      return
    }
    const reason = 'This product grid is a WordPress query, not a fixed column layout.'
    pieces.push({ kind: 'source', label: 'Product grid', reason })
    pushSource(sourceOnly, ids, 'Product grid', reason)
    return
  }
  if (cls.split(/\s+/).includes('home-markets') || cls.split(/\s+/).includes('home-processing')) {
    const reason =
      'These cards are custom HTML at 24% width (four across on a desktop, full width on a phone). They are not a named column preset, so they were not stacked into one column.'
    pieces.push({ kind: 'source', label: 'Card grid', reason })
    pushSource(sourceOnly, ids, 'Card grid', reason)
    return
  }
  if (tag === 'img') {
    const picture = pictureFrom(node, '')
    if (picture) pieces.push(picture)
    return
  }
  if (tag === 'a' && (cls.includes('avia-button') || isLineCardLink(node) || node.querySelector('img'))) {
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
  for (const child of node.childNodes) walk(child, pieces, ids, sourceOnly, state)
}

function portfolioCardRows(cards: PortfolioCard[], ids: IdFactory): Row[] {
  const rows: Row[] = []
  for (let index = 0; index < cards.length; index += 4) {
    const slice = cards.slice(index, index + 4)
    const preset: RowPreset =
      slice.length === 4 ? 'quarters' : slice.length === 3 ? 'quarter-trio' : slice.length === 2 ? 'halves' : 'full'
    const row = createRow(ids, preset, false)
    slice.forEach((card, columnIndex) => {
      const column = row.columns[columnIndex]
      if (!column) return
      const picture: ColumnItem = {
        id: ids.next('picture'),
        kind: 'picture',
        src: card.imageUrl,
        alt: card.title,
        href: card.href,
        wrap: 'none',
      }
      const title: ColumnItem = {
        id: ids.next('text'),
        kind: 'text',
        blocks: [{ type: 'heading', level: 3, text: card.title }],
      }
      column.items = [picture, title]
    })
    rows.push(row)
  }
  return rows
}

function pushAnchor(node: HTMLElement, pieces: Piece[]): void {
  const href = absoluteUrl(node.getAttribute('href') ?? '')
  const img = node.querySelector('img')
  const label = cleanText(node.text)
  const isButton = (node.getAttribute('class') ?? '').includes('avia-button')
  if (isButton && (!href || href === '#')) {
    if (label) pieces.push({ kind: 'paragraph', text: label })
    return
  }
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
  const width = Number(node.getAttribute('width'))
  const displayPx = Number.isInteger(width) && width >= 16 && width <= 80 ? width : undefined
  return { kind: 'picture', src, alt, href, wrap, ...(displayPx ? { displayPx } : {}) }
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
        ...(piece.displayPx ? { displayPx: piece.displayPx } : {}),
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

function familiesFor(rows: Row[], sourceOnly: SourceOnlyRegion[], portfolioApplied: boolean): string[] {
  const families = new Set<string>()
  if (rows.some((row) => row.preset === 'thirds' && isCtaRow(row))) families.add('equal-3-cta')
  if (rows.some((row) => row.preset === 'two-one' && hasLineCard(row))) families.add('intro-two-one-linecard')
  if (rows.some((row) => row.preset === 'three-one' && hasLineCard(row))) families.add('intro-three-one-linecard')
  if (rows.some((row) => row.preset === 'quality-split')) families.add('quality-split')
  if (rows.some((row) => row.preset === 'waterjet-split')) families.add('waterjet-measured')
  if (rows.some((row) => row.preset === 'float-wrap')) families.add('medical-float')
  if (sourceOnly.some((region) => region.label === 'Protected form' || region.label.startsWith('Gravity Form'))) {
    families.add('protected-form-blocked')
  }
  if (portfolioApplied) families.add('portfolio-picture-cards')
  if (sourceOnly.some((region) => region.label === 'Product grid')) families.add('portfolio-grid-blocked')
  if (sourceOnly.some((region) => region.label === 'News slider')) families.add('news-slider-blocked')
  if (sourceOnly.some((region) => region.label === 'Card grid')) families.add('custom-card-grid-blocked')
  if (sourceOnly.some((region) => region.label === 'Text width inside the column')) families.add('inner-width-not-split')
  if (sourceOnly.some((region) => region.label === 'Unmapped columns')) families.add('unmapped-columns')
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
    'portfolio-picture-cards',
    'portfolio-grid-blocked',
    'news-slider-blocked',
    'custom-card-grid-blocked',
    'inner-width-not-split',
    'unmapped-columns',
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
  if (/contact/.test(joined) && /quote/.test(joined) && /shop/.test(joined)) return true
  const counts = row.columns.map((column) => column.items.filter((item) => item.kind === 'button').length)
  return row.preset === 'thirds' && counts.length === 3 && counts.every((count) => count === 1)
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
    const tokens = cls.split(/\s+/)
    if (
      cls.includes('isotope-item') ||
      cls.includes('grid-entry') ||
      cls.includes('avia-content-slider') ||
      cls.includes('slide-entry') ||
      cls.includes('gform_wrapper') ||
      tokens.includes('home-markets') ||
      tokens.includes('home-processing') ||
      id.startsWith('gform_wrapper')
    ) {
      return true
    }
    const parent = current.parentNode
    current = parent && 'getAttribute' in parent ? (parent as HTMLElement) : null
  }
  return false
}
