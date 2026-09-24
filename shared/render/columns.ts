import { ENFOLD_ROW_SPACE_PX, FLOAT_WRAP_MEASUREMENT, PRESETS, WATERJET_MEASUREMENT } from '../page-model/presets'
import type { ColumnItem, PageDocument, Row, TextBlock } from '../page-model/types'
import { escapeHtml, renderInline } from './escape'

export function renderColumnsHtml(rows: Row[]): string {
  return `<div class="ti-layout">${rows.map(renderRow).join('')}</div>${layoutCss()}`
}

export function renderPublishedOrDraft(page: PageDocument, usePublished: boolean): string {
  const rows = usePublished && page.publishedVersion ? page.publishedVersion.rows : page.rows
  return renderColumnsHtml(rows)
}

function renderRow(row: Row): string {
  const preset = PRESETS[row.preset]
  const space = row.spaceAbove ? ` style="margin-top:${ENFOLD_ROW_SPACE_PX}px"` : ''
  if (preset.measured === 'waterjet') {
    const words = row.columns[0]?.items ?? []
    const picture = row.columns[1]?.items ?? []
    return `<section class="ti-row ti-waterjet"${space} data-preset="waterjet-split">
      <div class="ti-waterjet-text">${renderItems(words)}</div>
      <div class="ti-waterjet-picture">${renderItems(picture)}</div>
    </section>`
  }
  if (preset.measured === 'float-wrap') {
    return `<section class="ti-row ti-float-wrap"${space} data-preset="float-wrap">
      <div class="ti-float-column">${renderItems(row.columns[0]?.items ?? [])}</div>
    </section>`
  }
  const columns = row.columns
    .map((column, index) => {
      const slot = preset.columns[index]
      const style = slot
        ? `style="width:${slot.widthPercent}%;margin-left:${slot.marginLeftPercent}%"`
        : ''
      return `<div class="ti-col" ${style}>${renderItems(column.items)}</div>`
    })
    .join('')
  return `<section class="ti-row" data-preset="${escapeHtml(row.preset)}"${space}><div class="ti-row-flex">${columns}</div></section>`
}

function renderItems(items: ColumnItem[]): string {
  return items.map(renderItem).join('')
}

function renderItem(item: ColumnItem): string {
  if (item.kind === 'text') return `<div class="ti-text">${item.blocks.map(renderBlock).join('')}</div>`
  if (item.kind === 'picture') return renderPicture(item)
  if (item.kind === 'button') {
    const variant = item.variant === 'primary' ? 'ti-btn-primary' : 'ti-btn-secondary'
    return `<p class="ti-btn-row"><a class="ti-btn ${variant}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></p>`
  }
  const unexpected: never = item
  throw new Error(`Unknown item ${String(unexpected)}`)
}

function renderBlock(block: TextBlock): string {
  if (block.type === 'heading') {
    const level = block.level ?? 2
    return `<h${level}>${renderInline(block.text)}</h${level}>`
  }
  return `<p>${renderInline(block.text)}</p>`
}

function renderPicture(item: Extract<ColumnItem, { kind: 'picture' }>): string {
  const icon = item.displayPx ? ' ti-icon' : ''
  const wrapClass =
    item.wrap === 'left' ? 'ti-wrap-left' : item.wrap === 'right' ? 'ti-wrap-right' : 'ti-picture'
  const size = item.displayPx ? ` style="width:${item.displayPx}px"` : ''
  const img = `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}"${size} />`
  const framed = item.href ? `<a href="${escapeHtml(item.href)}">${img}</a>` : img
  return `<figure class="${wrapClass}${icon}">${framed}</figure>`
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
    .ti-text h1, .ti-text h2, .ti-text h3, .ti-text h4 { color: #003366; line-height: 1.2; margin: 0 0 0.6rem; }
    .ti-text p { margin: 0 0 0.8rem; line-height: 1.6; }
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
      .ti-col { width: 100% !important; margin-left: 0 !important; }
      .ti-waterjet-text, .ti-waterjet-picture { float: none; width: 100%; margin-right: 0; }
    }
  </style>`
}
