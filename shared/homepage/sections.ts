import { parse, type HTMLElement, type Node } from 'node-html-parser'
import { hashSource } from '../page-model/hash-gate'
import { rowGridLabel } from '../page-model/presets'
import type { IdFactory } from '../page-model/workspace'
import { createIdFactory, createRow } from '../page-model/workspace'
import type { ColumnItem, ColumnWidthId, PageDocument, PictureItem, Row, SourceOnlyRegion, TextBlock } from '../page-model/types'

const SITE = 'https://titanium.com'

/**
 * Below-slider homepage sections. The rotator stays in Site chrome.
 * Converter version stays off the shared page converter so the other drafts are left alone.
 */
export function parseHomepageSections(html: string, now: string): PageDocument {
  const root = parse(html)
  const entry = root.querySelector('.entry-content-wrapper')
  if (!entry) throw new Error('Homepage HTML is missing the entry')
  const ids = createIdFactory()
  const notes: SourceOnlyRegion[] = []
  const rows: Row[] = []
  note(
    notes,
    ids,
    'Homepage slider',
    'The six rotator slides stay in Site chrome. This draft starts under the slider.',
  )
  note(
    notes,
    ids,
    'Card motion',
    'The product grid slide-in and the processing and market hover motion are not fields. Four-across cards use a no-gap quarter (24.9%). Live processing and market cards are custom HTML near 24% and stack to full width on a phone.',
  )
  note(
    notes,
    ids,
    'Welcome colors',
    'Navy and gray colors on the welcome lines are not fields. The words are kept.',
  )
  note(
    notes,
    ids,
    'Location map pins',
    'Pin positions, pulse animation, and hover tooltips are not fields. Each pin’s name, address, phone, and email are copied under the map. The live map has two pins for Hillsboro, TX; the draft keeps one. Some pins link to a phone number or email instead of a location page.',
  )
  note(
    notes,
    ids,
    'Shop and quote apps',
    'Create Quote, Shop, and several product cards link to qqa.titanium.com. Those apps are not rebuilt.',
  )

  const children = entry.childNodes.filter(isElement)
  let index = 0
  while (index < children.length) {
    const node = children[index]
    if (!node) break
    if (isSlider(node) || isSpacer(node)) {
      index += 1
      continue
    }
    if (isThird(node)) {
      const group = [node]
      index += 1
      while (index < children.length) {
        const next = children[index]
        if (!next || !isThird(next) || isFirst(next)) break
        group.push(next)
        index += 1
      }
      const row = buttonRow(group, ids)
      if (row) rows.push(row)
      continue
    }
    if (node.querySelector('.grid-sort-container')) {
      rows.push(...cardRows(productCards(node), ids))
      index += 1
      continue
    }
    if (node.querySelector('.home-processing')) {
      rows.push(...namedCardSection(node.querySelector('.home-processing')!, ids))
      index += 1
      continue
    }
    if (node.querySelector('.home-markets')) {
      rows.push(...namedCardSection(node.querySelector('.home-markets')!, ids))
      index += 1
      continue
    }
    if (node.querySelector('.av-hotspot-image-container')) {
      rows.push(...locationSection(node, ids))
      index += 1
      continue
    }
    const items = collectItems(node, ids)
    if (items.length > 0) rows.push(fullRow(ids, items, false))
    index += 1
  }

  const seo = readSeo(root)
  const signature = rows
    .flatMap((row) => row.columns.flatMap((column) => column.items.map(signatureOf)))
    .join('\n')
  return {
    id: 'home',
    path: '/',
    title: seo.title,
    readiness: 'layout_editing',
    seo,
    rows,
    publishedVersion: null,
    provenance: {
      sourceUrl: seo.canonical || `${SITE}/`,
      sourceHash: hashSource(signature),
      converterVersion: 'homepage-sections-1',
      converterFamily: 'homepage-below-slider',
      families: ['homepage-below-slider'],
      convertedAt: now,
      grid: rows.map((row) => rowGridLabel(row)).join(' | ') || 'none',
      remainingSourceOnly: notes,
      verify:
        'Open /preview/home/ (private, noindex) beside https://titanium.com/. The slider is Site chrome. This draft is the welcome copy, quote buttons, product cards, processing, markets, the location map, and the location list. Saving in Payload does not change the public site.',
    },
    siteVisibility: 'private_draft',
    editedByHuman: false,
  }
}

function buttonRow(columns: HTMLElement[], ids: IdFactory): Row | null {
  const buttons = columns.map((column) => buttonFrom(column))
  if (buttons.every((button) => button === null)) return null
  const flush = columns.some((column) => tokens(column).includes('no_margin'))
  const spaceAbove = columns.some((column) => tokens(column).includes('column-top-margin'))
  const row = flush
    ? widthRow(ids, 'flush-third', columns.length, spaceAbove)
    : columns.length === 3
      ? createRow(ids, 'thirds', spaceAbove)
      : widthRow(ids, 'third', columns.length, spaceAbove)
  buttons.forEach((button, columnIndex) => {
    const column = row.columns[columnIndex]
    if (!column || !button) return
    column.items = [{ id: ids.next('button'), kind: 'button', ...button }]
  })
  return row
}

function namedCardSection(section: HTMLElement, ids: IdFactory): Row[] {
  const rows: Row[] = []
  const intro = section.childNodes.filter(isElement).filter((node) => {
    const cls = node.getAttribute('class') ?? ''
    return !cls.includes('home-processing-items') && !cls.includes('home-markets-items')
  })
  const introItems = intro.flatMap((node) => collectItems(node, ids))
  if (introItems.length > 0) rows.push(fullRow(ids, introItems, false))
  const cards = section.querySelectorAll('.home-processing-items > div, .home-markets-items > div')
  rows.push(
    ...cardRows(
      cards.map((card) => ({
        title: clean(card.querySelector('h4, h3, h5')?.text ?? ''),
        linkLabel: clean(card.querySelector('a')?.text ?? ''),
        href: absolute(card.querySelector('a')?.getAttribute('href') ?? ''),
        src: imageUrl(card.querySelector('img')),
        alt: clean(card.querySelector('img')?.getAttribute('alt') ?? ''),
      })),
      ids,
    ),
  )
  return rows
}

function locationSection(column: HTMLElement, ids: IdFactory): Row[] {
  const rows: Row[] = []
  const copy = collectItems(column, ids)
  if (copy.length > 0) rows.push(fullRow(ids, copy, false))
  const image = column.querySelector('.av-hotspot-image-container img')
  const picture = image ? pictureFrom(ids, image, '') : null
  if (picture) rows.push(fullRow(ids, [picture], false))
  const seen = new Set<string>()
  const locations: ColumnItem[] = []
  for (const spot of column.querySelectorAll('.av-image-hotspot')) {
    const location = locationFrom(spot)
    if (!location) continue
    const key = `${location.title}\n${location.body}`
    if (seen.has(key)) continue
    seen.add(key)
    const heading = location.href.startsWith('http')
      ? `[${location.title}](${location.href})`
      : location.title
    locations.push({
      id: ids.next('text'),
      kind: 'text',
      blocks: [
        { type: 'heading', level: 3, text: heading },
        { type: 'paragraph', text: location.body },
      ],
    })
  }
  if (locations.length > 0) rows.push(fullRow(ids, locations, false))
  return rows
}

function cardRows(cards: Card[], ids: IdFactory): Row[] {
  const usable = cards.filter((card) => card.title && card.src)
  const rows: Row[] = []
  for (let start = 0; start < usable.length; start += 4) {
    const slice = usable.slice(start, start + 4)
    const row = widthRow(ids, 'flush-quarter', slice.length, false)
    slice.forEach((card, index) => {
      const column = row.columns[index]
      if (!column) return
      const items: ColumnItem[] = [
        pictureItem(ids, card.src, card.alt || card.title, card.href),
        {
          id: ids.next('text'),
          kind: 'text',
          blocks: [{ type: 'heading', level: 3, text: card.title }],
        },
      ]
      if (card.linkLabel && card.linkLabel !== card.title && card.href) {
        items.push({
          id: ids.next('button'),
          kind: 'button',
          label: card.linkLabel,
          href: card.href,
          variant: 'primary',
        })
      }
      column.items = items
    })
    rows.push(row)
  }
  return rows
}

function productCards(column: HTMLElement): Card[] {
  return column.querySelectorAll('.grid-entry').map((entry) => ({
    title: clean(entry.querySelector('.grid-entry-title')?.text ?? ''),
    linkLabel: clean(entry.querySelector('.grid-entry-title')?.text ?? ''),
    href: absolute(entry.querySelector('a')?.getAttribute('href') ?? ''),
    src: imageUrl(entry.querySelector('img')),
    alt: clean(entry.querySelector('img')?.getAttribute('alt') ?? ''),
  }))
}

function collectItems(node: HTMLElement, ids: IdFactory): ColumnItem[] {
  const items: ColumnItem[] = []
  let blocks: TextBlock[] = []
  const flush = () => {
    if (blocks.length === 0) return
    items.push({ id: ids.next('text'), kind: 'text', blocks })
    blocks = []
  }
  const visit = (current: HTMLElement) => {
    const tag = current.tagName.toLowerCase()
    const cls = current.getAttribute('class') ?? ''
    if (tag === 'script' || tag === 'style') return
    if (cls.includes('av-hotspot') || cls.includes('grid-sort-container') || cls.includes('grid-entry')) return
    if (cls.includes('home-processing-items') || cls.includes('home-markets-items')) return
    if (tag === 'img') {
      flush()
      const picture = pictureFrom(ids, current, '')
      if (picture) items.push(picture)
      return
    }
    if (tag === 'a' && cls.includes('avia-button')) {
      const button = buttonFrom(current)
      if (!button) return
      flush()
      items.push({ id: ids.next('button'), kind: 'button', ...button })
      return
    }
    if (/^h[1-5]$/.test(tag)) {
      const text = inlineText(current)
      if (!text) return
      const raw = Number(tag.slice(1))
      const level = (raw > 4 ? 4 : raw) as 1 | 2 | 3 | 4
      blocks.push({ type: 'heading', level, text })
      return
    }
    if (tag === 'p' || tag === 'li') {
      const image = current.querySelector('img')
      const text = inlineText(current)
      if (image && !text) {
        flush()
        const picture = pictureFrom(ids, image, '')
        if (picture) items.push(picture)
        return
      }
      if (text) blocks.push({ type: 'paragraph', text })
      return
    }
    for (const child of current.childNodes) {
      if (isElement(child)) visit(child)
    }
  }
  visit(node)
  flush()
  return items
}

function fullRow(ids: IdFactory, items: ColumnItem[], spaceAbove: boolean): Row {
  const row = createRow(ids, 'full', spaceAbove)
  const column = row.columns[0]
  if (column) column.items = items
  return row
}

function widthRow(ids: IdFactory, width: ColumnWidthId, count: number, spaceAbove: boolean): Row {
  return {
    id: ids.next('row'),
    preset: 'custom',
    spaceAbove,
    columns: Array.from({ length: count }, () => ({
      id: ids.next('column'),
      items: [],
      width,
    })),
  }
}

function pictureItem(ids: IdFactory, src: string, alt: string, href: string): PictureItem {
  return { id: ids.next('picture'), kind: 'picture', src, alt, href, wrap: 'none' }
}

function pictureFrom(ids: IdFactory, node: HTMLElement, href: string): PictureItem | null {
  const src = imageUrl(node)
  if (!src) return null
  return pictureItem(ids, src, clean(node.getAttribute('alt') || node.getAttribute('title') || ''), href)
}

function buttonFrom(node: HTMLElement): { label: string; href: string; variant: 'primary' } | null {
  const link = node.tagName.toLowerCase() === 'a' ? node : node.querySelector('a.avia-button')
  if (!link) return null
  const label = clean(link.querySelector('.avia_iconbox_title')?.text || link.text)
  const href = absolute(link.getAttribute('href') ?? '')
  if (!label || !href) return null
  return { label, href, variant: 'primary' }
}

interface Card {
  title: string
  linkLabel: string
  href: string
  src: string
  alt: string
}

function locationFrom(spot: HTMLElement): { title: string; body: string; href: string } | null {
  const raw = decodeAttr(spot.getAttribute('data-avia-tooltip') ?? '')
  if (!raw) return null
  const frag = parse(raw)
  const title = clean(frag.querySelector('strong')?.text || frag.querySelector('a')?.text || '')
  let body = clean(frag.text)
  if (title && body.startsWith(title)) body = clean(body.slice(title.length))
  const href = absolute(frag.querySelector('a')?.getAttribute('href') ?? '')
  if (!title) return null
  return { title, body, href }
}

function readSeo(root: HTMLElement): PageDocument['seo'] {
  const title = clean(root.querySelector('title')?.text ?? '')
  const description = clean(root.querySelector('meta[name="description"]')?.getAttribute('content') ?? '')
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? `${SITE}/`
  const ogTitle = clean(root.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? '') || title
  const ogDescription =
    clean(root.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '') || description
  const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? ''
  return { title, description, canonical, ogTitle, ogDescription, ogImage }
}

function signatureOf(item: ColumnItem): string {
  if (item.kind === 'text') return item.blocks.map((block) => block.text).join('\n')
  if (item.kind === 'picture') return `${item.alt}|${item.src}|${item.href}`
  return `${item.label}|${item.href}`
}

function note(notes: SourceOnlyRegion[], ids: IdFactory, label: string, reason: string): void {
  notes.push({ id: ids.next('note'), label, reason })
}

function isSlider(node: HTMLElement): boolean {
  return Boolean(node.querySelector('.ls-slide, #layerslider_3'))
}

function isSpacer(node: HTMLElement): boolean {
  const cls = tokens(node)
  return cls.includes('hr') || cls.includes('hr-invisible')
}

function isThird(node: HTMLElement): boolean {
  return tokens(node).includes('av_one_third')
}

function isFirst(node: HTMLElement): boolean {
  return tokens(node).includes('first')
}

function tokens(node: HTMLElement): string[] {
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)
}

function imageUrl(node: HTMLElement | null): string {
  if (!node) return ''
  const raw = node.getAttribute('data-src') || node.getAttribute('src') || ''
  if (!raw || raw.startsWith('data:')) return ''
  return absolute(raw)
}

function inlineText(node: HTMLElement): string {
  let text = ''
  for (const child of node.childNodes) {
    if (!isElement(child)) {
      text = append(text, child.text ?? '')
      continue
    }
    const tag = child.tagName.toLowerCase()
    if (tag === 'br') {
      text += '\n'
      continue
    }
    if (tag === 'a') {
      const href = absolute(child.getAttribute('href') ?? '')
      const label = clean(child.text)
      const piece = href.startsWith('http') && label ? `[${label}](${href})` : label
      text = append(text, piece)
      continue
    }
    text = append(text, inlineText(child))
  }
  return clean(text)
}

function append(current: string, piece: string): string {
  if (!piece) return current
  if (current && !/\s$/.test(current) && !/^\s/.test(piece)) return `${current} ${piece}`
  return current + piece
}

function absolute(value: string): string {
  const href = value.trim()
  if (!href || href === '#' || href.startsWith('data:')) return ''
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href
  if (href.startsWith('//')) return `https:${href}`
  if (href.startsWith('/')) return `${SITE}${href}`
  return href
}

function decodeAttr(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function clean(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function isElement(node: Node): node is HTMLElement {
  return Boolean((node as HTMLElement).tagName)
}
