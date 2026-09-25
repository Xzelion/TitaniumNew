import { setReadiness } from '../page-model/readiness'
import type { ColumnWidthId, EditorFocus, PageDocument, PictureWrap, RowPreset, SeoFields } from '../page-model/types'
import { COLUMN_WIDTH_IDS, ROW_PRESETS } from '../page-model/types'
import {
  addCustomColumn,
  addItem,
  addRow,
  createIdFactory,
  duplicateItem,
  duplicateRow,
  moveColumn,
  moveItem,
  moveRow,
  placeItem,
  removeCustomColumn,
  removeItem,
  removeRow,
  setColumnWidth,
  setRowPreset,
  setSpaceAbove,
  updateButtonVariant,
  updateItem,
  updatePictureWrap,
  updateSeo,
} from '../page-model/workspace'
import { renderWorkspace } from './render-workspace'

export interface WorkspaceController {
  getPage: () => PageDocument
  destroy: () => void
}

export function mountWorkspace(
  root: HTMLElement,
  initial: PageDocument,
  onChange: (page: PageDocument) => void,
): WorkspaceController {
  let page = structuredClone(initial)
  let focus: EditorFocus | null = null
  let message: string | null = null
  let dirty = false
  const opened = JSON.stringify(initial)
  const ids = createIdFactory(1000)
  let drag: EditorFocus | null = null

  const onClick = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const control = target.closest('[data-action]')
    if (!(control instanceof HTMLElement) || !root.contains(control)) return
    const action = control.dataset.action
    if (action === 'space-above') return
    event.preventDefault()
    run(action, control)
  }

  const onInput = (event: Event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return
    if (!root.contains(target)) return
    if (target.dataset.action === 'space-above') {
      const rowId = target.dataset.row
      if (!rowId || !(target instanceof HTMLInputElement)) return
      page = setSpaceAbove(page, rowId, target.checked)
      commit(false)
      return
    }
    if (target.dataset.action === 'column-width') {
      const rowId = target.dataset.row
      const columnId = target.dataset.column
      if (!rowId || !columnId || !isColumnWidth(target.value)) return
      page = setColumnWidth(page, rowId, columnId, target.value)
      commit(false)
      return
    }
    if (target.dataset.scope === 'seo') {
      const field = target.dataset.field
      if (!field) return
      page = updateSeo(page, { [field]: target.value } as Partial<SeoFields>)
      commit(true)
      return
    }
    if (!focus || !target.dataset.field) return
    const field = target.dataset.field
    if (field === 'markdown') page = updateItem(page, focus, { markdown: target.value })
    else if (field === 'wrap') page = updatePictureWrap(page, focus, target.value as PictureWrap)
    else if (field === 'variant') page = updateButtonVariant(page, focus, target.value === 'secondary' ? 'secondary' : 'primary')
    else page = updateItem(page, focus, { [field]: target.value })
    commit(true)
  }

  function run(action: string | undefined, control: HTMLElement): void {
    const rowId = control.dataset.row ?? focus?.rowId
    const columnId = control.dataset.column ?? focus?.columnId
    const itemFocus = focusFrom(control)
    if (action === 'add-row') {
      page = addRow(page, ids)
      message = null
    } else if (action === 'remove-row' && rowId) {
      page = removeRow(page, rowId)
      focus = null
    } else if (action === 'move-row' && rowId) {
      page = moveRow(page, rowId, control.dataset.direction === '-1' ? -1 : 1)
    } else if (action === 'duplicate-row' && rowId) {
      page = duplicateRow(page, rowId, ids)
      message = 'Duplicated the row.'
    } else if (action === 'set-preset' && rowId && isPreset(control.dataset.preset)) {
      page = setRowPreset(page, rowId, control.dataset.preset, ids)
      focus = null
    } else if (action === 'add-column' && rowId) {
      page = addCustomColumn(page, rowId, ids)
    } else if (action === 'remove-column' && rowId && columnId) {
      page = removeCustomColumn(page, rowId, columnId)
      focus = null
    } else if (action === 'move-column' && rowId && columnId) {
      page = moveColumn(page, rowId, columnId, control.dataset.direction === '-1' ? -1 : 1)
    } else if ((action === 'add-text' || action === 'add-picture' || action === 'add-button') && rowId && columnId) {
      const kind = action === 'add-text' ? 'text' : action === 'add-picture' ? 'picture' : 'button'
      const added = addItem(page, rowId, columnId, kind, ids)
      page = added.page
      focus = added.focus
    } else if (action === 'select-item' && rowId && columnId && control.dataset.item) {
      focus = { rowId, columnId, itemId: control.dataset.item }
    } else if (action === 'close-drawer') {
      focus = null
    } else if (action === 'remove-item' && itemFocus) {
      page = removeItem(page, itemFocus)
      focus = null
    } else if (action === 'move-item' && itemFocus) {
      focus = itemFocus
      page = moveItem(page, itemFocus, control.dataset.direction === '-1' ? -1 : 1)
    } else if (action === 'move-item-column' && itemFocus && control.dataset.target) {
      focus = { ...itemFocus, columnId: control.dataset.target }
      page = placeItem(page, itemFocus, itemFocus.rowId, control.dataset.target)
      message = 'Moved the card to the other column.'
    } else if (action === 'duplicate-item' && itemFocus) {
      const copied = duplicateItem(page, itemFocus, ids)
      page = copied.page
      focus = copied.focus
      message = 'Duplicated the card.'
    } else if (action === 'set-readiness' && isReadiness(control.dataset.readiness)) {
      const result = setReadiness(page, control.dataset.readiness, new Date().toISOString())
      page = result.page
      message = result.error
    }
    commit(false)
  }

  function focusFrom(control: HTMLElement): EditorFocus | null {
    const rowId = control.dataset.row
    const columnId = control.dataset.column
    const itemId = control.dataset.item
    if (rowId && columnId && itemId) return { rowId, columnId, itemId }
    return focus
  }

  const onDragStart = (event: DragEvent) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const rowId = target.dataset.dragRow
    const columnId = target.dataset.dragColumn
    const itemId = target.dataset.dragItem
    if (!rowId || !columnId || !itemId) return
    drag = { rowId, columnId, itemId }
    event.dataTransfer?.setData('text/plain', itemId)
  }

  const onDragOver = (event: DragEvent) => {
    if (!drag) return
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('.ti-column') || target.closest('.ti-card-wrap')) event.preventDefault()
  }

  const onDrop = (event: DragEvent) => {
    if (!drag) return
    const target = event.target
    if (!(target instanceof Element)) return
    const card = target.closest('.ti-card-wrap')
    const column = target.closest('.ti-column')
    if (!(column instanceof HTMLElement)) return
    event.preventDefault()
    const toRowId = column.dataset.row
    const toColumnId = column.dataset.column
    const beforeItemId = card?.querySelector('[data-item]')?.getAttribute('data-item') ?? undefined
    if (!toRowId || !toColumnId) return
    page = placeItem(page, drag, toRowId, toColumnId, beforeItemId && beforeItemId !== drag.itemId ? beforeItemId : undefined)
    focus = { rowId: toRowId, columnId: toColumnId, itemId: drag.itemId }
    drag = null
    message = 'Moved the card.'
    commit(false)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return
    const card = target.closest('.ti-card')
    if (!(card instanceof HTMLElement) || !root.contains(card)) return
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    const itemFocus = focusFrom(card)
    if (!itemFocus) return
    event.preventDefault()
    focus = itemFocus
    page = moveItem(page, itemFocus, event.key === 'ArrowUp' ? -1 : 1)
    commit(false)
  }

  function commit(keepCaret: boolean): void {
    dirty = JSON.stringify(page) !== opened
    onChange(page)
    paint(keepCaret)
  }

  function paint(keepCaret: boolean): void {
    const active = document.activeElement
    const field = active instanceof HTMLElement ? active.dataset.field : undefined
    const scope = active instanceof HTMLElement ? active.dataset.scope : undefined
    const selection =
      active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
        ? { start: active.selectionStart, end: active.selectionEnd }
        : null
    root.innerHTML = renderWorkspace(page, focus, message, dirty)
    if (keepCaret && field) {
      const selector = scope ? `[data-scope="${scope}"][data-field="${field}"]` : `[data-field="${field}"]`
      const next = root.querySelector(selector)
      if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) {
        next.focus()
        if (selection && next.setSelectionRange) next.setSelectionRange(selection.start ?? 0, selection.end ?? 0)
      }
      return
    }
    if (focus && active instanceof HTMLElement && active.classList.contains('ti-card')) {
      const card = root.querySelector(`[data-action="select-item"][data-item="${CSS.escape(focus.itemId)}"]`)
      if (card instanceof HTMLElement) card.focus()
    }
  }

  root.addEventListener('click', onClick)
  root.addEventListener('input', onInput)
  root.addEventListener('change', onInput)
  root.addEventListener('dragstart', onDragStart)
  root.addEventListener('dragover', onDragOver)
  root.addEventListener('drop', onDrop)
  root.addEventListener('keydown', onKeyDown)
  paint(false)

  return {
    getPage: () => page,
    destroy() {
      root.removeEventListener('click', onClick)
      root.removeEventListener('input', onInput)
      root.removeEventListener('change', onInput)
      root.removeEventListener('dragstart', onDragStart)
      root.removeEventListener('dragover', onDragOver)
      root.removeEventListener('drop', onDrop)
      root.removeEventListener('keydown', onKeyDown)
    },
  }
}

function isPreset(value: string | undefined): value is RowPreset {
  return ROW_PRESETS.some((preset) => preset === value)
}

function isColumnWidth(value: string | undefined): value is ColumnWidthId {
  return COLUMN_WIDTH_IDS.some((width) => width === value)
}

function isReadiness(value: string | undefined): value is PageDocument['readiness'] {
  return value === 'layout_editing' || value === 'visual_check' || value === 'published'
}
