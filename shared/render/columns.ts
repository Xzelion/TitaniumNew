import { ENFOLD_ROW_SPACE_PX, FLOAT_WRAP_MEASUREMENT, PRESETS, slotsFor, WATERJET_MEASUREMENT } from '../page-model/presets'
import type { ColumnItem, MapPin, PageDocument, Row, TextBlock, TextItem } from '../page-model/types'
import { escapeHtml, renderInline } from './escape'

export function renderColumnsHtml(rows: Row[]): string {
  const texts = textItems(rows)
  return `<div class="ti-layout">${rows.map((row) => renderRow(row, texts)).join('')}</div>${layoutCss()}`
}

export function renderPublishedOrDraft(page: PageDocument, usePublished: boolean): string {
  const rows = usePublished && page.publishedVersion ? page.publishedVersion.rows : page.rows
  return renderColumnsHtml(rows)
}

function renderRow(row: Row, texts: Map<string, TextItem>): string {
  const preset = PRESETS[row.preset]
  const space = row.spaceAbove ? ` style="margin-top:${ENFOLD_ROW_SPACE_PX}px"` : ''
  const visual = row.visual ? ` data-visual="${escapeHtml(row.visual)}"` : ''
  if (preset.measured === 'waterjet') {
    const words = row.columns[0]?.items ?? []
    const picture = row.columns[1]?.items ?? []
    return `<section class="ti-row ti-waterjet"${space}${visual} data-preset="waterjet-split">
      <div class="ti-waterjet-text">${renderItems(words, texts)}</div>
      <div class="ti-waterjet-picture">${renderItems(picture, texts)}</div>
    </section>`
  }
  if (preset.measured === 'float-wrap') {
    return `<section class="ti-row ti-float-wrap"${space}${visual} data-preset="float-wrap">
      <div class="ti-float-column">${renderItems(row.columns[0]?.items ?? [], texts)}</div>
    </section>`
  }
  const slots = slotsFor(row)
  const columns = row.columns
    .map((column, index) => {
      const slot = slots[index]
      const style = slot
        ? `style="width:${slot.widthPercent}%;margin-left:${slot.marginLeftPercent}%"`
        : ''
      return `<div class="ti-col" ${style}>${renderItems(column.items, texts)}</div>`
    })
    .join('')
  return `<section class="ti-row" data-preset="${escapeHtml(row.preset)}"${visual}${space}><div class="ti-row-flex">${columns}</div></section>`
}

function renderItems(items: ColumnItem[], texts: Map<string, TextItem>): string {
  return items.map((item) => renderItem(item, texts)).join('')
}

function renderItem(item: ColumnItem, texts: Map<string, TextItem>): string {
  if (item.kind === 'text') return `<div class="ti-text">${item.blocks.map(renderBlock).join('')}</div>`
  if (item.kind === 'picture') return renderPicture(item, texts)
  if (item.kind === 'button') {
    const variant = item.variant === 'primary' ? 'ti-btn-primary' : 'ti-btn-secondary'
    return `<p class="ti-btn-row"><a class="ti-btn ${variant}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></p>`
  }
  const unexpected: never = item
  throw new Error(`Unknown item ${String(unexpected)}`)
}

function renderBlock(block: TextBlock): string {
  const classes = [block.tone ? `ti-tone-${block.tone}` : '', block.align === 'center' ? 'ti-align-center' : ''].filter(Boolean)
  const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : ''
  if (block.type === 'heading') {
    const level = block.level ?? 2
    return `<h${level}${classAttr}>${renderInline(block.text)}</h${level}>`
  }
  return `<p${classAttr}>${renderInline(block.text)}</p>`
}

function renderPicture(item: Extract<ColumnItem, { kind: 'picture' }>, texts: Map<string, TextItem>): string {
  const icon = item.displayPx ? ' ti-icon' : ''
  const map = item.hotspots && item.hotspots.length > 0 ? ' ti-map' : ''
  const wrapClass =
    item.wrap === 'left' ? 'ti-wrap-left' : item.wrap === 'right' ? 'ti-wrap-right' : 'ti-picture'
  const size = item.displayPx ? ` style="width:${item.displayPx}px"` : ''
  const img = `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}"${size} />`
  const framed = item.href ? `<a href="${escapeHtml(item.href)}">${img}</a>` : img
  const pins = (item.hotspots ?? []).map((pin) => renderPin(pin, texts)).join('')
  return `<figure class="${wrapClass}${icon}${map}">${framed}${pins}</figure>`
}

function renderPin(pin: MapPin, texts: Map<string, TextItem>): string {
  const text = texts.get(pin.textId)
  const label = text?.blocks.find((block) => block.type === 'heading')?.text ?? 'Location'
  const tip = text ? text.blocks.map(renderBlock).join('') : ''
  const place = pin.place === 'below' ? ' ti-pin-below' : ' ti-pin-above'
  return `<span class="ti-pin${place}" style="top:${pin.top}%;left:${pin.left}%">
    <button type="button" class="ti-pin-dot ti-pin-${pin.tone}" aria-label="${escapeHtml(label)}"></button>
    <span class="ti-pin-pulse" aria-hidden="true"></span>
    <span class="ti-pin-tip" role="tooltip">${tip}</span>
  </span>`
}

function textItems(rows: Row[]): Map<string, TextItem> {
  const texts = new Map<string, TextItem>()
  for (const row of rows) {
    for (const column of row.columns) {
      for (const item of column.items) {
        if (item.kind === 'text') texts.set(item.id, item)
      }
    }
  }
  return texts
}

function layoutCss(): string {
  const water = WATERJET_MEASUREMENT
  const floatLeft = FLOAT_WRAP_MEASUREMENT.left.margin
  const floatRight = FLOAT_WRAP_MEASUREMENT.right.margin
  return `<style>
    .ti-layout { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem 3rem; color: #1f2937; font-family: Inter, Arial, sans-serif; }
    .ti-row { margin: 0 0 1.5rem; }
    .ti-row-flex { display: flex; align-items: flex-start; flex-wrap: wrap; }
    .ti-col { box-sizing: border-box; min-width: 0; }
    .ti-text h1, .ti-text h2, .ti-text h3, .ti-text h4, .ti-text h5 { color: #003366; line-height: 1.2; margin: 0 0 0.6rem; }
    .ti-text p { margin: 0 0 0.8rem; line-height: 1.6; }
    .ti-tone-navy { color: #000080; }
    .ti-tone-gray { color: #808080; }
    .ti-tone-ink { color: #000; }
    .ti-align-center { text-align: center; }
    .ti-row[data-visual="welcome"] { text-align: center; }
    .ti-row[data-visual="welcome"] h2, .ti-row[data-visual="welcome"] h3 { color: #000080; font-weight: 700; }
    .ti-row[data-visual="welcome"] p { color: #808080; }
    .ti-row[data-visual="welcome"] .ti-tone-ink { color: #000; }
    .ti-row[data-visual="welcome"] .ti-picture img { margin: 0 auto; max-width: 300px; }
    .ti-row[data-visual="product-cards"] { animation: ti-slide-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) both; }
    .ti-row[data-visual="product-cards"] .ti-col { position: relative; margin-bottom: 30px; }
    .ti-row[data-visual="product-cards"] .ti-picture { position: relative; overflow: hidden; display: block; }
    .ti-row[data-visual="product-cards"] .ti-picture img { width: 100%; display: block; }
    .ti-row[data-visual="product-cards"] .ti-text h3 { background: #f3f3f3; margin: 0; padding: 15px; font-size: 13px; font-weight: 700; line-height: 1.1; border: 1px solid #f3f3f3; }
    .ti-row[data-visual="product-cards"] .ti-picture a::after, .ti-row[data-visual="processing"] .ti-picture a::after { content: ""; position: absolute; left: 10px; right: 10px; top: 0; bottom: 50px; background: rgba(20, 20, 20, 0.8); opacity: 0; }
    .ti-row[data-visual="product-cards"] .ti-picture a:hover::after, .ti-row[data-visual="product-cards"] .ti-picture a:focus-visible::after, .ti-row[data-visual="processing"] .ti-col:hover .ti-picture a::after, .ti-row[data-visual="processing"] .ti-col:focus-within .ti-picture a::after { opacity: 1; }
    .ti-row[data-visual="processing"] { position: relative; isolation: isolate; text-align: center; padding: 20px 0; margin: 0; }
    .ti-row[data-visual="processing"]::before { content: ""; position: absolute; inset: 0 -50%; z-index: -1; background: url("https://titanium.com/wp-content/uploads/2019/10/background-processing-1.jpg") center/cover no-repeat; }
    .ti-row[data-visual="processing"] .ti-col, .ti-row[data-visual="markets"] .ti-col { width: 24% !important; margin-left: 0 !important; position: relative; }
    .ti-row[data-visual="processing"] .ti-col { height: 250px; overflow: hidden; margin-top: 10px; margin-bottom: 10px; }
    .ti-row[data-visual="processing"] .ti-picture { position: absolute; left: 10px; right: 10px; top: 0; }
    .ti-row[data-visual="processing"] .ti-picture img { width: 100%; }
    .ti-row[data-visual="processing"] .ti-text { position: absolute; left: 10px; bottom: 0; width: 95%; height: 50px; margin: 0; background: #fff; }
    .ti-row[data-visual="processing"] .ti-text h4 { margin: 0; line-height: 50px; }
    .ti-row[data-visual="markets"] { text-align: center; margin-bottom: 0; }
    .ti-row[data-visual="markets"] .ti-col { height: 200px; margin: 10px 0 60px; padding: 10px; box-sizing: border-box; }
    .ti-row[data-visual="markets"] .ti-picture img { width: 100%; display: block; }
    .ti-row[data-visual="markets"] .ti-text h4 { position: absolute; left: 10px; right: 10px; bottom: -40px; height: 50px; margin: 0; line-height: 50px; background: #3990E3; color: #fff; }
    .ti-row[data-visual="markets"] .ti-picture a::after { content: ""; position: absolute; left: 10px; right: 10px; top: 10px; bottom: -40px; border: 4px solid #3990E3; }
    .ti-row[data-visual="markets"] .ti-col:hover .ti-picture a::after, .ti-row[data-visual="markets"] .ti-col:focus-within .ti-picture a::after { background: rgba(255, 255, 255, 0.5); }
    .ti-map { position: relative; display: block; }
    .ti-map img { width: 100%; height: auto; display: block; }
    .ti-pin { position: absolute; width: 18px; height: 18px; margin: -9px 0 0 -9px; z-index: 2; }
    .ti-pin-dot { width: 18px; height: 18px; border: 0; border-radius: 100px; padding: 0; position: relative; z-index: 2; cursor: pointer; }
    .ti-pin-cyan { background: #11f1f4; }
    .ti-pin-navy { background: #080f91; }
    .ti-pin-pulse { display: block; width: 40px; height: 40px; border-radius: 100px; position: absolute; top: -11px; left: -11px; z-index: 1; background: #fff; opacity: 0; animation: ti-pulsate 2s linear infinite; }
    .ti-pin-tip { display: none; position: absolute; z-index: 5; width: 260px; padding: 0.75rem; background: #fff; color: #102033; text-align: left; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); }
    .ti-pin-above .ti-pin-tip { bottom: 24px; left: 0; }
    .ti-pin-below .ti-pin-tip { top: 24px; left: 0; }
    .ti-pin:hover .ti-pin-tip, .ti-pin:focus-within .ti-pin-tip { display: block; }
    .ti-row[data-visual="location-list"] { display: none; }
    @keyframes ti-slide-in { from { transform: translate(-10%, 0); opacity: 0; } to { transform: translate(0, 0); opacity: 1; } }
    @keyframes ti-pulsate { 0% { transform: scale(0.1); opacity: 0; } 50% { opacity: 0.7; } 100% { transform: scale(1); opacity: 0; } }
    .ti-picture img, .ti-wrap-left img, .ti-wrap-right img { max-width: 100%; height: auto; display: block; }
    .ti-icon { display: inline-block; margin: 0 6px 6px 0; vertical-align: middle; }
    .ti-icon img { width: auto; height: auto; display: inline-block; }
    .ti-wrap-left { float: left; margin: ${floatLeft}; max-width: 300px; }
    .ti-wrap-right { float: right; margin: ${floatRight}; max-width: 300px; }
    .ti-float-column::after { content: ""; display: block; clear: both; }
    .ti-waterjet::after { content: ""; display: block; clear: both; }
    .ti-waterjet-text { float: left; width: ${water.textPercent}%; }
    .ti-waterjet-picture { display: inline; width: ${water.imagePercent}%; margin-top: ${water.imageOffsetPx}px; margin-right: ${water.gapPx}px; }
    .ti-waterjet-picture img { width: 100%; height: auto; border: 4px solid #032A68; }
    .ti-btn { display: inline-block; padding: 0.75rem 1.1rem; border-radius: 4px; text-decoration: none; font-weight: 700; }
    .ti-btn-primary { background: #003366; color: #fff; }
    .ti-btn-secondary { background: #fff; color: #003366; border: 2px solid #003366; }
    @media (max-width: 767px) {
      .ti-col, .ti-row[data-visual="processing"] .ti-col, .ti-row[data-visual="markets"] .ti-col, .ti-row[data-visual="product-cards"] .ti-col { width: 100% !important; margin-left: 0 !important; }
      .ti-waterjet-text, .ti-waterjet-picture { float: none; width: 100%; margin-right: 0; }
      .ti-row[data-visual="location-list"] { display: block; }
      .ti-pin { display: none; }
    }
  </style>`
}
