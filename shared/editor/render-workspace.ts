import { PRESET_LIST, WATERJET_MEASUREMENT } from '../page-model/presets'
import { publishedVersionLabel, READINESS_LABELS } from '../page-model/readiness'
import { seoChecks } from '../page-model/seo'
import { blocksToMarkdown } from '../page-model/text-format'
import { findFocus } from '../page-model/workspace'
import type { ColumnItem, EditorFocus, PageDocument, Row } from '../page-model/types'
import { escapeHtml } from '../render/escape'

export function renderWorkspace(page: PageDocument, focus: EditorFocus | null, message: string | null): string {
  return `<div class="ti-editor" data-readiness="${page.readiness}">
    ${renderStyles()}
    <header class="ti-top">
      <p class="ti-kicker">Layout workspace</p>
      <h1>${escapeHtml(page.title || 'Untitled page')}</h1>
      <p class="ti-safety">You are editing a private draft. Saving does not change titanium.com.</p>
      <div class="ti-readiness" role="group" aria-label="Page readiness">
        ${readinessButton(page, 'layout_editing')}
        ${readinessButton(page, 'visual_check')}
        ${readinessButton(page, 'published')}
      </div>
      <p class="ti-published-note">${escapeHtml(publishedVersionLabel(page))}</p>
      ${message ? `<p class="ti-message" role="alert">${escapeHtml(message)}</p>` : ''}
    </header>
    ${renderSeo(page)}
    <section class="ti-board" aria-label="Rows and columns">
      <div class="ti-board-head">
        <h2>Rows and columns</h2>
        <button type="button" data-action="add-row">Add a row</button>
      </div>
      ${page.rows.map((row) => renderRow(row, focus)).join('') || '<p class="ti-empty">This page has no rows yet. Add a row to start.</p>'}
    </section>
    ${renderDrawer(page, focus)}
  </div>`
}

function readinessButton(page: PageDocument, readiness: PageDocument['readiness']): string {
  const pressed = page.readiness === readiness
  return `<button type="button" data-action="set-readiness" data-readiness="${readiness}" aria-pressed="${pressed ? 'true' : 'false'}">${READINESS_LABELS[readiness]}</button>`
}

function renderSeo(page: PageDocument): string {
  const checks = seoChecks(page.seo)
    .map(
      (check) =>
        `<li data-check="${check.id}" data-ok="${check.ok ? 'true' : 'false'}"><strong>${escapeHtml(check.label)}</strong> ${escapeHtml(check.detail)}</li>`,
    )
    .join('')
  const seo = page.seo
  return `<section class="ti-seo" aria-label="Search and sharing">
    <h2>Search and sharing</h2>
    <ul class="ti-checks">${checks}</ul>
    <label>Page title in Google<input data-scope="seo" data-field="title" value="${escapeHtml(seo.title)}" /></label>
    <label>Short description<textarea data-scope="seo" data-field="description">${escapeHtml(seo.description)}</textarea></label>
    <label>Preferred web address<input data-scope="seo" data-field="canonical" value="${escapeHtml(seo.canonical)}" /></label>
    <label>Social share title<input data-scope="seo" data-field="ogTitle" value="${escapeHtml(seo.ogTitle)}" /></label>
    <label>Social share description<textarea data-scope="seo" data-field="ogDescription">${escapeHtml(seo.ogDescription)}</textarea></label>
    <label>Social share image<input data-scope="seo" data-field="ogImage" value="${escapeHtml(seo.ogImage)}" /></label>
  </section>`
}

function renderRow(row: Row, focus: EditorFocus | null): string {
  const definition = PRESET_LIST.find((preset) => preset.id === row.preset)
  const measured =
    row.preset === 'waterjet-split'
      ? `<p class="ti-measure">Words ${WATERJET_MEASUREMENT.textPercent}%, picture ${WATERJET_MEASUREMENT.imagePercent}%, gap ${WATERJET_MEASUREMENT.gapPx}px, picture ${WATERJET_MEASUREMENT.imageOffsetPx}px lower.</p>`
      : row.preset === 'float-wrap'
        ? '<p class="ti-measure">Pictures tuck to the side and the words wrap around them. This row is not equal columns.</p>'
        : ''
  const presets = PRESET_LIST.map((preset) => {
    const bars = preset.bars.map((size) => `<i style="flex:${size}"></i>`).join('')
    const pressed = preset.id === row.preset ? 'true' : 'false'
    return `<button type="button" class="ti-preset" data-action="set-preset" data-row="${row.id}" data-preset="${preset.id}" aria-pressed="${pressed}"><span class="ti-bars">${bars}</span><span>${escapeHtml(preset.label)}</span></button>`
  }).join('')
  const columns = row.columns
    .map((column, index) => {
      const slot = definition?.columns[index]
      const weight = slot ? slot.widthPercent : 1
      return `<div class="ti-column" style="flex:${weight}" data-column="${column.id}">
        <div class="ti-column-label">${escapeHtml(slot?.label ?? 'Column')}</div>
        <div class="ti-column-tools">
          <button type="button" data-action="move-column" data-row="${row.id}" data-column="${column.id}" data-direction="-1">Move left</button>
          <button type="button" data-action="move-column" data-row="${row.id}" data-column="${column.id}" data-direction="1">Move right</button>
        </div>
        <div class="ti-cards">${column.items.map((item) => renderCard(row.id, column.id, item, focus)).join('')}</div>
        <div class="ti-add">
          <button type="button" data-action="add-text" data-row="${row.id}" data-column="${column.id}">Add text</button>
          <button type="button" data-action="add-picture" data-row="${row.id}" data-column="${column.id}">Add picture</button>
          <button type="button" data-action="add-button" data-row="${row.id}" data-column="${column.id}">Add button</button>
        </div>
      </div>`
    })
    .join('')
  return `<article class="ti-row-card" data-row="${row.id}">
    <div class="ti-row-tools">
      <button type="button" data-action="move-row" data-row="${row.id}" data-direction="-1">Move row up</button>
      <button type="button" data-action="move-row" data-row="${row.id}" data-direction="1">Move row down</button>
      <button type="button" data-action="remove-row" data-row="${row.id}">Remove row</button>
      <label class="ti-space"><input type="checkbox" data-action="space-above" data-row="${row.id}" ${row.spaceAbove ? 'checked' : ''} /> Extra space above this row</label>
    </div>
    <div class="ti-presets" aria-label="Column widths">${presets}</div>
    ${measured}
    <div class="ti-columns">${columns}</div>
  </article>`
}

function renderCard(rowId: string, columnId: string, item: ColumnItem, focus: EditorFocus | null): string {
  const selected = focus?.itemId === item.id
  const summary = cardSummary(item)
  const name = item.kind === 'text' ? 'Text' : item.kind === 'picture' ? 'Picture' : 'Button'
  return `<button type="button" class="ti-card" data-action="select-item" data-row="${rowId}" data-column="${columnId}" data-item="${item.id}" data-kind="${item.kind}" aria-pressed="${selected ? 'true' : 'false'}">
    <span class="ti-card-kicker">${name}</span>
    <span class="ti-card-summary">${escapeHtml(summary)}</span>
  </button>`
}

function cardSummary(item: ColumnItem): string {
  if (item.kind === 'text') {
    const text = item.blocks.map((block) => block.text).join(' ').trim()
    return text || 'Empty text'
  }
  if (item.kind === 'picture') return item.alt || item.src || 'Empty picture'
  return item.label || 'Empty button'
}

function renderDrawer(page: PageDocument, focus: EditorFocus | null): string {
  const item = findFocus(page, focus)
  if (!focus || !item) {
    return `<aside class="ti-drawer" data-open="false" aria-label="Edit the selected card"><h2>Edit a card</h2><p>Click a text, picture, or button card. Its fields open here.</p></aside>`
  }
  return `<aside class="ti-drawer" data-open="true" aria-label="Edit the selected card">
    <div class="ti-drawer-head">
      <h2>${drawerTitle(item)}</h2>
      <button type="button" data-action="close-drawer">Close</button>
    </div>
    ${drawerFields(item)}
    <div class="ti-drawer-actions">
      <button type="button" data-action="move-item" data-direction="-1">Move up</button>
      <button type="button" data-action="move-item" data-direction="1">Move down</button>
      <button type="button" data-action="remove-item">Remove</button>
    </div>
  </aside>`
}

function drawerTitle(item: ColumnItem): string {
  if (item.kind === 'text') return 'Edit text'
  if (item.kind === 'picture') return 'Edit picture'
  return 'Edit button'
}

function drawerFields(item: ColumnItem): string {
  if (item.kind === 'text') {
    return `<label>Words<textarea data-field="markdown">${escapeHtml(blocksToMarkdown(item.blocks))}</textarea></label>
      <p class="ti-hint">Use a blank line between paragraphs. Start a line with # for a heading. Links look like [Word](https://example.com).</p>`
  }
  if (item.kind === 'picture') {
    return `<label>Picture address<input data-field="src" value="${escapeHtml(item.src)}" /></label>
      <label>Description of the picture<input data-field="alt" value="${escapeHtml(item.alt)}" /></label>
      <label>Optional link<input data-field="href" value="${escapeHtml(item.href)}" /></label>
      <label>How the words sit with this picture
        <select data-field="wrap">
          <option value="none" ${item.wrap === 'none' ? 'selected' : ''}>Stacked with the words</option>
          <option value="left" ${item.wrap === 'left' ? 'selected' : ''}>Tuck left, words wrap around</option>
          <option value="right" ${item.wrap === 'right' ? 'selected' : ''}>Tuck right, words wrap around</option>
        </select>
      </label>`
  }
  return `<label>Button label<input data-field="label" value="${escapeHtml(item.label)}" /></label>
    <label>Where it goes<input data-field="href" value="${escapeHtml(item.href)}" /></label>
    <label>Look
      <select data-field="variant">
        <option value="primary" ${item.variant === 'primary' ? 'selected' : ''}>Solid button</option>
        <option value="secondary" ${item.variant === 'secondary' ? 'selected' : ''}>Outline button</option>
      </select>
    </label>`
}

function renderStyles(): string {
  return `<style>
    .ti-editor { font-family: Inter, Arial, sans-serif; color: #1f2937; display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1rem; align-items: start; }
    .ti-top, .ti-seo, .ti-board { grid-column: 1; }
    .ti-drawer { grid-column: 2; grid-row: 1 / span 3; position: sticky; top: 1rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; }
    .ti-kicker { text-transform: uppercase; letter-spacing: 0.08em; color: #003366; font-size: 0.75rem; font-weight: 700; margin: 0; }
    .ti-top h1 { margin: 0.2rem 0; font-size: 1.6rem; }
    .ti-safety, .ti-published-note, .ti-hint, .ti-measure { color: #4b5563; }
    .ti-message { background: #fff7ed; border: 1px solid #fdba74; padding: 0.6rem 0.8rem; border-radius: 8px; }
    .ti-readiness { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .ti-readiness button[aria-pressed="true"] { background: #003366; color: #fff; }
    .ti-seo, .ti-row-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-top: 1rem; }
    .ti-checks { list-style: none; padding: 0; display: grid; gap: 0.35rem; }
    .ti-checks li[data-ok="false"] { color: #9a3412; }
    .ti-checks li[data-ok="true"] { color: #166534; }
    label { display: grid; gap: 0.25rem; font-size: 0.85rem; font-weight: 650; margin: 0.6rem 0; }
    input, textarea, select, button { font: inherit; }
    input, textarea, select { font-weight: 400; padding: 0.55rem 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px; }
    textarea { min-height: 5rem; }
    button { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.45rem 0.7rem; cursor: pointer; }
    button:hover { border-color: #003366; }
    .ti-board-head, .ti-row-tools, .ti-column-tools, .ti-add, .ti-drawer-actions, .ti-drawer-head { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
    .ti-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.45rem; margin: 0.7rem 0; }
    .ti-preset { display: grid; gap: 0.35rem; text-align: left; min-height: 4.2rem; }
    .ti-preset[aria-pressed="true"] { border-color: #003366; box-shadow: inset 0 0 0 1px #003366; }
    .ti-bars { display: flex; gap: 3px; height: 14px; }
    .ti-bars i { display: block; background: #003366; border-radius: 2px; }
    .ti-columns { display: flex; gap: 0.75rem; align-items: stretch; }
    .ti-column { background: #f8fafc; border: 1px dashed #94a3b8; border-radius: 10px; padding: 0.6rem; min-width: 0; }
    .ti-column-label { font-size: 0.78rem; font-weight: 700; color: #003366; margin-bottom: 0.4rem; }
    .ti-card { display: grid; width: 100%; text-align: left; margin: 0.35rem 0; background: #fff; }
    .ti-card[aria-pressed="true"] { border-color: #003366; }
    .ti-card-kicker { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #003366; }
    .ti-card-summary { font-weight: 500; color: #1f2937; }
    .ti-space { font-weight: 500; grid-auto-flow: column; align-items: center; }
    @media (max-width: 900px) {
      .ti-editor { grid-template-columns: 1fr; }
      .ti-drawer { grid-column: 1; grid-row: auto; position: static; }
      .ti-columns { flex-direction: column; }
    }
  </style>`
}
