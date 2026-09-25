import { parse, type HTMLElement, type Node } from 'node-html-parser'
import { hashSource } from '../page-model/hash-gate'
import { rowGridLabel } from '../page-model/presets'
import type { IdFactory } from '../page-model/workspace'
import { createIdFactory, createRow } from '../page-model/workspace'
import type {
  ColumnItem,
  ColumnWidthId,
  MapPin,
  PageDocument,
  PictureItem,
  Row,
  RowVisual,
  SourceOnlyRegion,
  TextAlign,
  TextBlock,
  TextTone,
} from '../page-model/types'

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
    'Scroll trigger',
    'The product cards slide in when the page loads. The live page waits until that row scrolls into view.',
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
      rows.push(...cardRows(productCards(node), ids, 'product-cards', 3))
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
    const welcome = Boolean(node.querySelector('.welcome'))
    const items = collectItems(node, ids, welcome ? 'center' : undefined)
    if (items.length > 0) {
      const row = fullRow(ids, items, false)
      if (welcome) row.visual = 'welcome'
      rows.push(row)
    }
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
  const visual: RowVisual = tokens(section).includes('home-markets') ? 'markets' : 'processing'
  const intro = section.childNodes.filter(isElement).filter((node) => {
    const cls = node.getAttribute('class') ?? ''
    return !cls.includes('home-processing-items') && !cls.includes('home-markets-items')
  })
  const introItems = intro.flatMap((node) => collectItems(node, ids))
  if (introItems.length > 0) {
    const row = fullRow(ids, introItems, false)
    row.visual = visual
    rows.push(row)
  }
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
      visual,
      4,
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
  const seen = new Map<string, string>()
  const locations: ColumnItem[] = []
  const pins: MapPin[] = []
  for (const spot of column.querySelectorAll('.av-image-hotspot')) {
    const location = locationFrom(spot)
    const position = pinPosition(spot)
    if (!location || !position) continue
    const key = `${location.title}\n${location.body}`
    let textId = seen.get(key)
    if (!textId) {
      textId = ids.next('text')
      seen.set(key, textId)
      const heading = location.href.startsWith('http') ? `[${location.title}](${location.href})` : location.title
      locations.push({
        id: textId,
        kind: 'text',
        blocks: [
          { type: 'heading', level: 3, text: heading },
          { type: 'paragraph', text: location.body },
        ],
      })
    }
    pins.push({
      id: ids.next('pin'),
      top: position.top,
      left: position.left,
      tone: pinTone(spot),
      place: spot.getAttribute('data-avia-tooltip-position') === 'bottom' ? 'below' : 'above',
      textId,
    })
  }
  if (picture) {
    if (pins.length > 0) picture.hotspots = pins
    const map = fullRow(ids, [picture], false)
    map.visual = 'location-map'
    rows.push(map)
  }
  if (locations.length > 0) {
    const list = fullRow(ids, locations, false)
    list.visual = 'location-list'
    rows.push(list)
  }
  return rows
}

function cardRows(cards: Card[], ids: IdFactory, visual: RowVisual = 'product-cards', headingLevel: 3 | 4 = 3): Row[] {
  const usable = cards.filter((card) => card.title && card.src)
  const rows: Row[] = []
  for (let start = 0; start < usable.length; start += 4) {
    const slice = usable.slice(start, start + 4)
    const row = widthRow(ids, 'flush-quarter', slice.length, false)
    row.visual = visual
    slice.forEach((card, index) => {
      const column = row.columns[index]
      if (!column) return
      const items: ColumnItem[] = [
        pictureItem(ids, card.src, card.alt || card.title, card.href),
        {
          id: ids.next('text'),
          kind: 'text',
          blocks: [{ type: 'heading', level: headingLevel, text: card.title }],
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

function collectItems(node: HTMLElement, ids: IdFactory, align?: TextAlign): ColumnItem[] {
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
      const level = raw as 1 | 2 | 3 | 4 | 5
      blocks.push(styledBlock({ type: 'heading', level, text }, current, align))
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
      if (text) blocks.push(styledBlock({ type: 'paragraph', text }, current, align))
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

function styledBlock(block: TextBlock, node: HTMLElement, align?: TextAlign): TextBlock {
  const tone = toneFrom(node)
  const centered = align ?? (/text-align:\s*center/i.test(node.getAttribute('style') ?? '') ? 'center' : undefined)
  return {
    ...block,
    ...(tone ? { tone } : {}),
    ...(centered ? { align: centered } : {}),
  }
}

function toneFrom(node: HTMLElement): TextTone | undefined {
  const own = node.getAttribute('style') ?? ''
  const nested = node.querySelector('span')?.getAttribute('style') ?? ''
  const match = /color:\s*(#[0-9a-fA-F]{3,8})/.exec(`${own} ${nested}`)
  const color = match?.[1]?.toLowerCase()
  if (color === '#000080') return 'navy'
  if (color === '#808080' || color === '#999' || color === '#999999') return 'gray'
  if (color === '#000' || color === '#000000') return 'ink'
  return undefined
}

function pinPosition(spot: HTMLElement): { top: number; left: number } | null {
  const style = spot.getAttribute('style') ?? ''
  const top = /top:\s*([\d.]+)%/.exec(style)
  const left = /left:\s*([\d.]+)%/.exec(style)
  if (!top?.[1] || !left?.[1]) return null
  return { top: Number(top[1]), left: Number(left[1]) }
}

function pinTone(spot: HTMLElement): MapPin['tone'] {
  const inner = spot.querySelector('.av-image-hotspot_inner')?.getAttribute('style') ?? ''
  return /#080f91/i.test(inner) ? 'navy' : 'cyan'
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
