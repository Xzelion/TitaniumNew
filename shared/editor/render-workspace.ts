import { ledgerForDocument } from '../page-model/ledger'
import { COMMON_PRESET_IDS, PRESET_LIST, WATERJET_MEASUREMENT, type PresetDefinition } from '../page-model/presets'
import { publishedVersionLabel, READINESS_LABELS } from '../page-model/readiness'
import { seoChecks } from '../page-model/seo'
import { blocksToMarkdown } from '../page-model/text-format'
import { findFocus } from '../page-model/workspace'
import type { ColumnItem, EditorFocus, PageDocument, Row, RowPreset } from '../page-model/types'
import { escapeHtml } from '../render/escape'

export function renderWorkspace(page: PageDocument, focus: EditorFocus | null, message: string | null, dirty = false): string {
  const ledger = ledgerForDocument(page)
  return `<div class="ti-editor" data-readiness="${page.readiness}" data-dirty="${dirty ? 'true' : 'false'}">
    ${renderStyles()}
    <header class="ti-top">
      <p class="ti-kicker">Layout workspace</p>
      <h1>${escapeHtml(page.title || 'Untitled page')}</h1>
      <p class="ti-safety">You are editing a private draft. Saving does not change titanium.com.</p>
      <p class="ti-save" data-dirty="${dirty ? 'true' : 'false'}">${dirty ? 'Unsaved changes. Press Save in the admin bar to keep this private draft.' : 'This matches the opened copy. Save keeps a private draft and does not change titanium.com.'}</p>
      <section class="ti-ledger" aria-label="Where this page stands">
        <h2>Where this page stands</h2>
        <div class="ti-ledger-grid">
          <div><span>Layout editing</span><strong>${escapeHtml(ledger.layoutEditing)}</strong><p>${escapeHtml(ledger.layoutDetail)}</p></div>
          <div><span>Visual check</span><strong>${escapeHtml(ledger.visualCheck)}</strong><p>${escapeHtml(ledger.visualDetail)}</p></div>
          <div><span>Published version</span><strong>${escapeHtml(ledger.publishedVersion)}</strong><p>A published Payload record is not a converted page, and this snapshot is not a public release.</p></div>
        </div>
        <p class="ti-checked">Last checked: ${escapeHtml(ledger.lastChecked)}</p>
        <details class="ti-evidence"><summary>Technical evidence</summary><p>${escapeHtml(ledger.evidence)}</p></details>
      </section>
      <div class="ti-readiness" role="group" aria-label="Local snapshot steps">
        ${readinessButton(page, 'layout_editing')}
        ${readinessButton(page, 'visual_check')}
        ${readinessButton(page, 'published')}
      </div>
      <p class="ti-published-note">${escapeHtml(publishedVersionLabel(page))} These buttons record a private snapshot. They do not mark the page ready on the hosted CMS.</p>
      ${message ? `<p class="ti-message" role="alert">${escapeHtml(message)}</p>` : ''}
    </header>
    ${renderSeo(page)}
    <section class="ti-board" aria-label="Rows and columns">
      <div class="ti-board-head">
        <h2>Rows and columns</h2>
        <button type="button" data-action="add-row">Add a row</button>
      </div>
      <p class="ti-hint">Drag a card onto a column to move it. Up and Down on a card reorder it inside the column.</p>
      ${page.rows.map((row) => renderRow(row, focus)).join('') || '<p class="ti-empty">This page has no rows yet. Add a row, then add text, a picture, or a button.</p>'}
      ${renderLocked(page)}
    </section>
    ${renderDrawer(page, focus)}
  </div>`
}

function readinessButton(page: PageDocument, readiness: PageDocument['readiness']): string {
  const pressed = page.readiness === readiness
  return `<button type="button" data-action="set-readiness" data-readiness="${readiness}" aria-pressed="${pressed ? 'true' : 'false'}">${READINESS_LABELS[readiness]}</button>`
}

function renderLocked(page: PageDocument): string {
  const regions = page.provenance.remainingSourceOnly
  if (regions.length === 0) {
    return `<section class="ti-locked" data-locked="false"><h2>Locked sections</h2><p>Nothing on this page is locked. Every row above can be edited.</p></section>`
  }
  const cards = regions
    .map(
      (region) =>
        `<article class="ti-locked-card"><h3>${escapeHtml(region.label)}</h3><p>${escapeHtml(region.reason)}</p><p>This part is not an editable column. It stays locked until it can be represented as a named layout.</p></article>`,
    )
    .join('')
  return `<section class="ti-locked" data-locked="true"><h2>Locked sections</h2><p>The rows above are editable. These parts are not.</p>${cards}</section>`
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
  const columns = row.columns
    .map((column, index) => {
      const slot = definition?.columns[index]
      const weight = slot ? slot.widthPercent : 1
      const cards = column.items.map((item) => renderCard(row, column.id, item, focus)).join('')
      const empty = column.items.length === 0 ? '<p class="ti-empty-col">Empty column. Add text, a picture, or a button.</p>' : ''
      return `<div class="ti-column" style="flex:${weight}" data-row="${row.id}" data-column="${column.id}">
        <div class="ti-column-label">${escapeHtml(slot?.label ?? 'Column')}</div>
        <div class="ti-column-tools">
          <button type="button" data-action="move-column" data-row="${row.id}" data-column="${column.id}" data-direction="-1">Move left</button>
          <button type="button" data-action="move-column" data-row="${row.id}" data-column="${column.id}" data-direction="1">Move right</button>
        </div>
        <div class="ti-cards">${cards}${empty}</div>
        <div class="ti-add">
          <button type="button" data-action="add-text" data-row="${row.id}" data-column="${column.id}">Add text</button>
          <button type="button" data-action="add-picture" data-row="${row.id}" data-column="${column.id}">Add picture</button>
          <button type="button" data-action="add-button" data-row="${row.id}" data-column="${column.id}">Add button</button>
        </div>
      </div>`
    })
    .join('')
  return `<article class="ti-row-card" data-row="${row.id}" data-preset="${row.preset}">
    <div class="ti-row-tools">
      <button type="button" data-action="move-row" data-row="${row.id}" data-direction="-1">Move row up</button>
      <button type="button" data-action="move-row" data-row="${row.id}" data-direction="1">Move row down</button>
      <button type="button" data-action="duplicate-row" data-row="${row.id}">Duplicate row</button>
      <button type="button" data-action="remove-row" data-row="${row.id}">Remove row</button>
      <label class="ti-space"><input type="checkbox" data-action="space-above" data-row="${row.id}" ${row.spaceAbove ? 'checked' : ''} /> Extra space above this row</label>
    </div>
    ${renderPresetPicker(row)}
    ${measured}
    <div class="ti-columns">${columns}</div>
  </article>`
}

function renderPresetPicker(row: Row): string {
  const common = new Set<RowPreset>(COMMON_PRESET_IDS)
  const measuredOpen = !common.has(row.preset)
  const button = (preset: PresetDefinition) => {
    const bars = preset.bars.map((size) => `<i style="flex:${size}"></i>`).join('')
    const pressed = preset.id === row.preset ? 'true' : 'false'
    return `<button type="button" class="ti-preset" data-action="set-preset" data-row="${row.id}" data-preset="${preset.id}" aria-pressed="${pressed}"><span class="ti-bars" aria-hidden="true">${bars}</span><span>${escapeHtml(preset.label)}</span></button>`
  }
  const commonButtons = PRESET_LIST.filter((preset) => common.has(preset.id)).map(button).join('')
  const measuredButtons = PRESET_LIST.filter((preset) => !common.has(preset.id)).map(button).join('')
  return `<div class="ti-presets" aria-label="Column widths">
    <p class="ti-preset-kicker">Choose a layout</p>
    <div class="ti-preset-grid">${commonButtons}</div>
    <details class="ti-measured" ${measuredOpen ? 'open' : ''}><summary>Measured layouts from the live site</summary><div class="ti-preset-grid">${measuredButtons}</div></details>
  </div>`
}

function renderCard(row: Row, columnId: string, item: ColumnItem, focus: EditorFocus | null): string {
  const selected = focus?.itemId === item.id
  const summary = cardSummary(item)
  const name = item.kind === 'text' ? 'Text' : item.kind === 'picture' ? 'Picture' : 'Button'
  const thumb = item.kind === 'picture' && item.src ? `<img class="ti-thumb" alt="" src="${escapeHtml(item.src)}" />` : ''
  const moves = otherColumns(row, columnId)
    .map(
      (column) =>
        `<button type="button" data-action="move-item-column" data-row="${row.id}" data-column="${columnId}" data-item="${item.id}" data-target="${column.id}">Move to ${escapeHtml(column.label)}</button>`,
    )
    .join('')
  return `<div class="ti-card-wrap" data-selected="${selected ? 'true' : 'false'}">
    <span class="ti-drag" draggable="true" data-drag-row="${row.id}" data-drag-column="${columnId}" data-drag-item="${item.id}">Drag</span>
    <button type="button" class="ti-card" data-action="select-item" data-row="${row.id}" data-column="${columnId}" data-item="${item.id}" data-kind="${item.kind}" aria-pressed="${selected ? 'true' : 'false'}">
      ${thumb}
      <span class="ti-card-kicker">${name}</span>
      <span class="ti-card-summary">${escapeHtml(summary)}</span>
    </button>
    <div class="ti-card-moves">
      <button type="button" data-action="move-item" data-row="${row.id}" data-column="${columnId}" data-item="${item.id}" data-direction="-1">Up</button>
      <button type="button" data-action="move-item" data-row="${row.id}" data-column="${columnId}" data-item="${item.id}" data-direction="1">Down</button>
      ${moves}
      <button type="button" data-action="duplicate-item" data-row="${row.id}" data-column="${columnId}" data-item="${item.id}">Duplicate</button>
    </div>
  </div>`
}

function otherColumns(row: Row, columnId: string): { id: string; label: string }[] {
  const definition = PRESET_LIST.find((preset) => preset.id === row.preset)
  return row.columns
    .map((column, index) => ({ id: column.id, label: definition?.columns[index]?.label ?? `Column ${index + 1}` }))
    .filter((column) => column.id !== columnId)
}

function cardSummary(item: ColumnItem): string {
  if (item.kind === 'text') {
    const text = item.blocks.map((block) => block.text).join(' ').trim()
    return text || 'Empty text'
  }
  if (item.kind === 'picture') {
    const size = item.displayPx ? ` (${item.displayPx}px icon)` : ''
    return `${item.alt || item.src || 'Empty picture'}${size}`
  }
  return item.label || 'Empty button'
}

function renderDrawer(page: PageDocument, focus: EditorFocus | null): string {
  const item = findFocus(page, focus)
  if (!focus || !item) {
    return `<aside class="ti-drawer" data-open="false" aria-label="Edit the selected card"><h2>Edit a card</h2><p>Click a text, picture, or button card. Only that card's fields open here.</p></aside>`
  }
  const row = page.rows.find((entry) => entry.id === focus.rowId)
  const moves = row
    ? otherColumns(row, focus.columnId)
        .map(
          (column) =>
            `<button type="button" data-action="move-item-column" data-target="${column.id}">Move to ${escapeHtml(column.label)}</button>`,
        )
        .join('')
    : ''
  return `<aside class="ti-drawer" data-open="true" aria-label="Edit the selected card">
    <div class="ti-drawer-head">
      <h2>${drawerTitle(item)}</h2>
      <button type="button" data-action="close-drawer">Back to the row</button>
    </div>
    ${drawerFields(item)}
    <div class="ti-drawer-actions">
      <button type="button" data-action="move-item" data-direction="-1">Up</button>
      <button type="button" data-action="move-item" data-direction="1">Down</button>
      ${moves}
      <button type="button" data-action="duplicate-item">Duplicate</button>
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
    const size = item.displayPx ? `<p class="ti-hint">On the live page this icon is ${item.displayPx}px. That size stays fixed.</p>` : ''
    return `<label>Picture address<input data-field="src" value="${escapeHtml(item.src)}" /></label>
      <label>Description of the picture<input data-field="alt" value="${escapeHtml(item.alt)}" /></label>
      <label>Optional link<input data-field="href" value="${escapeHtml(item.href)}" /></label>
      ${size}
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
    .ti-safety, .ti-published-note, .ti-hint, .ti-measure, .ti-checked { color: #4b5563; }
    .ti-save[data-dirty="true"] { background: #fff7ed; border: 1px solid #fdba74; }
    .ti-save { background: #f0fdf4; border: 1px solid #86efac; padding: 0.6rem 0.8rem; border-radius: 8px; }
    .ti-message { background: #fff7ed; border: 1px solid #fdba74; padding: 0.6rem 0.8rem; border-radius: 8px; }
    .ti-ledger { background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 0.8rem; margin: 0.8rem 0; }
    .ti-ledger h2, .ti-board h2, .ti-seo h2, .ti-locked h2 { margin: 0 0 0.5rem; font-size: 1rem; }
    .ti-ledger-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
    .ti-ledger-grid div { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.55rem; }
    .ti-ledger-grid span { display: block; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #003366; }
    .ti-ledger-grid p, .ti-locked p { margin: 0.35rem 0 0; font-weight: 500; color: #374151; font-size: 0.85rem; }
    .ti-readiness, .ti-board-head, .ti-row-tools, .ti-column-tools, .ti-add, .ti-drawer-actions, .ti-drawer-head, .ti-card-moves { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
    .ti-readiness button[aria-pressed="true"] { background: #003366; color: #fff; }
    .ti-seo, .ti-row-card, .ti-locked { background: #fff; border: 1px solid #94a3b8; border-radius: 12px; padding: 1rem; margin-top: 1rem; }
    .ti-locked-card { border: 1px dashed #b45309; background: #fffbeb; border-radius: 10px; padding: 0.7rem; margin-top: 0.5rem; }
    .ti-checks { list-style: none; padding: 0; display: grid; gap: 0.35rem; }
    .ti-checks li[data-ok="false"] { color: #9a3412; }
    .ti-checks li[data-ok="true"] { color: #166534; }
    label { display: grid; gap: 0.25rem; font-size: 0.85rem; font-weight: 650; margin: 0.6rem 0; }
    input, textarea, select, button { font: inherit; }
    input, textarea, select { font-weight: 400; padding: 0.55rem 0.65rem; border: 1px solid #cbd5e1; border-radius: 8px; }
    textarea { min-height: 5rem; }
    button { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.45rem 0.7rem; cursor: pointer; }
    button:hover, .ti-card:focus, .ti-drag:focus { border-color: #003366; }
    .ti-preset-kicker { margin: 0.4rem 0; font-size: 0.8rem; font-weight: 700; color: #003366; }
    .ti-preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 0.45rem; }
    .ti-preset { display: grid; gap: 0.35rem; text-align: left; min-height: 4.4rem; }
    .ti-preset[aria-pressed="true"] { border-color: #003366; box-shadow: inset 0 0 0 2px #003366; }
    .ti-bars { display: flex; gap: 3px; height: 14px; }
    .ti-bars i { display: block; background: #003366; border-radius: 2px; }
    .ti-columns { display: flex; gap: 0.75rem; align-items: stretch; }
    .ti-column { background: #f8fafc; border: 1px dashed #64748b; border-radius: 10px; padding: 0.6rem; min-width: 0; }
    .ti-column-label { font-size: 0.78rem; font-weight: 700; color: #003366; margin-bottom: 0.4rem; }
    .ti-card-wrap { margin: 0.45rem 0; }
    .ti-card-wrap[data-selected="true"] { outline: 2px solid #003366; border-radius: 10px; background: #eff6ff; }
    .ti-card { display: grid; width: 100%; text-align: left; background: #fff; }
    .ti-card[aria-pressed="true"] { border-color: #003366; }
    .ti-drag { display: inline-block; font-size: 0.75rem; font-weight: 700; color: #003366; cursor: grab; padding: 0.15rem 0.35rem; }
    .ti-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 4px; }
    .ti-card-kicker { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #003366; }
    .ti-card-summary { font-weight: 500; color: #1f2937; }
    .ti-empty-col { color: #64748b; font-size: 0.85rem; }
    .ti-space { font-weight: 500; grid-auto-flow: column; align-items: center; }
    @media (max-width: 900px) {
      .ti-editor { grid-template-columns: 1fr; }
      .ti-drawer { grid-column: 1; grid-row: auto; position: static; }
      .ti-columns, .ti-ledger-grid { flex-direction: column; display: grid; grid-template-columns: 1fr; }
    }
    @media (max-width: 420px) {
      .ti-editor { gap: 0.5rem; }
      .ti-row-card, .ti-seo, .ti-locked, .ti-drawer { padding: 0.7rem; }
      button { min-height: 2.5rem; }
    }
  </style>`
}
