import { setReadiness } from '../page-model/readiness'
import type { EditorFocus, PageDocument, PictureWrap, RowPreset, SeoFields } from '../page-model/types'
import { ROW_PRESETS } from '../page-model/types'
import {
  addItem,
  addRow,
  createIdFactory,
  moveColumn,
  moveItem,
  moveRow,
  removeItem,
  removeRow,
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
  const ids = createIdFactory(1000)

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
    if (action === 'add-row') {
      page = addRow(page, ids)
      message = null
    } else if (action === 'remove-row' && rowId) {
      page = removeRow(page, rowId)
      focus = null
    } else if (action === 'move-row' && rowId) {
      page = moveRow(page, rowId, control.dataset.direction === '-1' ? -1 : 1)
    } else if (action === 'set-preset' && rowId && isPreset(control.dataset.preset)) {
      page = setRowPreset(page, rowId, control.dataset.preset, ids)
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
    } else if (action === 'remove-item' && focus) {
      page = removeItem(page, focus)
      focus = null
    } else if (action === 'move-item' && focus) {
      page = moveItem(page, focus, control.dataset.direction === '-1' ? -1 : 1)
    } else if (action === 'set-readiness' && isReadiness(control.dataset.readiness)) {
      const result = setReadiness(page, control.dataset.readiness, new Date().toISOString())
      page = result.page
      message = result.error
    }
    commit(false)
  }

  function commit(keepCaret: boolean): void {
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
    root.innerHTML = renderWorkspace(page, focus, message)
    if (!keepCaret || !field) return
    const selector = scope ? `[data-scope="${scope}"][data-field="${field}"]` : `[data-field="${field}"]`
    const next = root.querySelector(selector)
    if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) {
      next.focus()
      if (selection && next.setSelectionRange) next.setSelectionRange(selection.start ?? 0, selection.end ?? 0)
    }
  }

  root.addEventListener('click', onClick)
  root.addEventListener('input', onInput)
  root.addEventListener('change', onInput)
  paint(false)

  return {
    getPage: () => page,
    destroy() {
      root.removeEventListener('click', onClick)
      root.removeEventListener('input', onInput)
      root.removeEventListener('change', onInput)
    },
  }
}

function isPreset(value: string | undefined): value is RowPreset {
  return ROW_PRESETS.some((preset) => preset === value)
}

function isReadiness(value: string | undefined): value is PageDocument['readiness'] {
  return value === 'layout_editing' || value === 'visual_check' || value === 'published'
}
