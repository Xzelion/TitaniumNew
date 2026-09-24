import { COLUMN_WIDTHS, PRESETS, widthIdMatchingSlot } from './presets'
import { setReadiness } from './readiness'
import { markdownToBlocks } from './text-format'
import type {
  ButtonVariant,
  Column,
  ColumnItem,
  EditorFocus,
  PageDocument,
  PictureWrap,
  Row,
  RowPreset,
  SeoFields,
  ColumnWidthId,
} from './types'

export interface IdFactory {
  next: (prefix: string) => string
}

export function createIdFactory(start = 1): IdFactory {
  let n = start
  return {
    next(prefix: string) {
      const id = `${prefix}-${n}`
      n += 1
      return id
    },
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function touch(page: PageDocument): PageDocument {
  const next = clone(page)
  next.editedByHuman = true
  if (next.readiness === 'published') next.readiness = 'layout_editing'
  return next
}

export function findFocus(page: PageDocument, focus: EditorFocus | null): ColumnItem | null {
  if (!focus) return null
  const row = page.rows.find((item) => item.id === focus.rowId)
  const column = row?.columns.find((item) => item.id === focus.columnId)
  return column?.items.find((item) => item.id === focus.itemId) ?? null
}

export function addRow(page: PageDocument, ids: IdFactory, preset: RowPreset = 'full'): PageDocument {
  const next = touch(page)
  next.rows.push(createRow(ids, preset))
  return next
}

export function createRow(ids: IdFactory, preset: RowPreset, spaceAbove = false): Row {
  if (preset === 'custom') {
    return {
      id: ids.next('row'),
      preset,
      spaceAbove,
      columns: [{ id: ids.next('column'), items: [], width: 'full' }],
    }
  }
  return {
    id: ids.next('row'),
    preset,
    spaceAbove,
    columns: PRESETS[preset].columns.map(() => ({ id: ids.next('column'), items: [] })),
  }
}

export function removeRow(page: PageDocument, rowId: string): PageDocument {
  const next = touch(page)
  next.rows = next.rows.filter((row) => row.id !== rowId)
  return next
}

export function moveRow(page: PageDocument, rowId: string, direction: -1 | 1): PageDocument {
  const next = touch(page)
  const index = next.rows.findIndex((row) => row.id === rowId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= next.rows.length) return page
  const [row] = next.rows.splice(index, 1)
  next.rows.splice(target, 0, row)
  return next
}

export function setRowPreset(page: PageDocument, rowId: string, preset: RowPreset, ids: IdFactory): PageDocument {
  const next = touch(page)
  const row = next.rows.find((item) => item.id === rowId)
  if (!row || row.preset === preset) return page
  if (preset === 'custom') {
    const previous = row.preset === 'custom' ? null : PRESETS[row.preset]
    row.columns = row.columns.map((column, index) => {
      const slot = previous?.columns[index]
      const width = slot ? widthIdMatchingSlot(slot) : column.width ?? 'quarter'
      return { id: column.id, items: clone(column.items), width }
    })
    if (row.columns.length === 0) row.columns.push({ id: ids.next('column'), items: [], width: 'full' })
    row.preset = 'custom'
    return next
  }
  const wanted = PRESETS[preset].columns.length
  const columns = row.columns.map((column) => clone(column))
  if (columns.length > wanted) {
    const extras = columns.splice(wanted)
    const last = columns[columns.length - 1]
    for (const extra of extras) last.items.push(...extra.items)
  }
  while (columns.length < wanted) {
    columns.push({ id: ids.next('column'), items: [] })
  }
  row.preset = preset
  row.columns = columns.map((column) => ({ id: column.id, items: column.items }))
  return next
}

export function setColumnWidth(page: PageDocument, rowId: string, columnId: string, width: ColumnWidthId): PageDocument {
  const next = touch(page)
  const row = next.rows.find((item) => item.id === rowId)
  const column = row?.columns.find((item) => item.id === columnId)
  if (!row || row.preset !== 'custom' || !column || !COLUMN_WIDTHS[width]) return page
  column.width = width
  return next
}

export function addCustomColumn(page: PageDocument, rowId: string, ids: IdFactory): PageDocument {
  const next = touch(page)
  const row = next.rows.find((item) => item.id === rowId)
  if (!row || row.preset !== 'custom' || row.columns.length >= 12) return page
  row.columns.push({ id: ids.next('column'), items: [], width: 'quarter' })
  return next
}

export function removeCustomColumn(page: PageDocument, rowId: string, columnId: string): PageDocument {
  const next = touch(page)
  const row = next.rows.find((item) => item.id === rowId)
  if (!row || row.preset !== 'custom' || row.columns.length <= 1) return page
  const index = row.columns.findIndex((column) => column.id === columnId)
  if (index < 0) return page
  const [removed] = row.columns.splice(index, 1)
  const neighbor = row.columns[Math.max(0, index - 1)]
  if (removed && neighbor) neighbor.items.push(...removed.items)
  return next
}

export function setSpaceAbove(page: PageDocument, rowId: string, spaceAbove: boolean): PageDocument {
  const next = touch(page)
  const row = next.rows.find((item) => item.id === rowId)
  if (!row) return page
  row.spaceAbove = spaceAbove
  return next
}

export function moveColumn(page: PageDocument, rowId: string, columnId: string, direction: -1 | 1): PageDocument {
  const next = touch(page)
  const row = next.rows.find((item) => item.id === rowId)
  if (!row) return page
  const index = row.columns.findIndex((column) => column.id === columnId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= row.columns.length) return page
  const currentItems = row.columns[index].items
  row.columns[index].items = row.columns[target].items
  row.columns[target].items = currentItems
  return next
}

export function addItem(
  page: PageDocument,
  rowId: string,
  columnId: string,
  kind: ColumnItem['kind'],
  ids: IdFactory,
): { page: PageDocument; focus: EditorFocus } {
  const next = touch(page)
  const column = columnIn(next, rowId, columnId)
  const item = blankItem(kind, ids)
  column.items.push(item)
  return { page: next, focus: { rowId, columnId, itemId: item.id } }
}

function blankItem(kind: ColumnItem['kind'], ids: IdFactory): ColumnItem {
  if (kind === 'text') {
    return { id: ids.next('text'), kind: 'text', blocks: [{ type: 'paragraph', text: '' }] }
  }
  if (kind === 'picture') {
    return { id: ids.next('picture'), kind: 'picture', src: '', alt: '', href: '', wrap: 'none' }
  }
  if (kind === 'button') {
    return { id: ids.next('button'), kind: 'button', label: 'Button', href: '', variant: 'primary' }
  }
  const unexpected: never = kind
  throw new Error(`Unknown item ${String(unexpected)}`)
}

export function updateItem(
  page: PageDocument,
  focus: EditorFocus,
  patch: Partial<ColumnItem> | { markdown: string },
): PageDocument {
  const next = touch(page)
  const column = columnIn(next, focus.rowId, focus.columnId)
  const index = column.items.findIndex((item) => item.id === focus.itemId)
  if (index < 0) return page
  const current = column.items[index]
  if ('markdown' in patch && current.kind === 'text') {
    column.items[index] = { ...current, blocks: markdownToBlocks(patch.markdown) }
    return next
  }
  if (current.kind === 'picture' && 'kind' in patch === false) {
    const picturePatch = patch as Partial<ColumnItem>
    if ('body' in picturePatch || 'blocks' in picturePatch) {
      throw new Error('A picture does not have body text')
    }
  }
  column.items[index] = { ...current, ...patch, id: current.id, kind: current.kind } as ColumnItem
  return next
}

export function updatePictureWrap(page: PageDocument, focus: EditorFocus, wrap: PictureWrap): PageDocument {
  return updateItem(page, focus, { wrap })
}

export function updateButtonVariant(page: PageDocument, focus: EditorFocus, variant: ButtonVariant): PageDocument {
  return updateItem(page, focus, { variant })
}

export function removeItem(page: PageDocument, focus: EditorFocus): PageDocument {
  const next = touch(page)
  const column = columnIn(next, focus.rowId, focus.columnId)
  column.items = column.items.filter((item) => item.id !== focus.itemId)
  return next
}

export function duplicateItem(
  page: PageDocument,
  focus: EditorFocus,
  ids: IdFactory,
): { page: PageDocument; focus: EditorFocus } {
  const next = touch(page)
  const column = columnIn(next, focus.rowId, focus.columnId)
  const index = column.items.findIndex((item) => item.id === focus.itemId)
  if (index < 0) return { page, focus }
  const copy = clone(column.items[index])
  copy.id = ids.next(copy.kind)
  column.items.splice(index + 1, 0, copy)
  return { page: next, focus: { rowId: focus.rowId, columnId: focus.columnId, itemId: copy.id } }
}

export function duplicateRow(page: PageDocument, rowId: string, ids: IdFactory): PageDocument {
  const next = touch(page)
  const index = next.rows.findIndex((row) => row.id === rowId)
  if (index < 0) return page
  const copy = clone(next.rows[index])
  copy.id = ids.next('row')
  copy.columns = copy.columns.map((column) => ({
    id: ids.next('column'),
    ...(column.width ? { width: column.width } : {}),
    items: column.items.map((item) => ({ ...clone(item), id: ids.next(item.kind) })),
  }))
  next.rows.splice(index + 1, 0, copy)
  return next
}

export function placeItem(
  page: PageDocument,
  from: EditorFocus,
  toRowId: string,
  toColumnId: string,
  beforeItemId?: string,
): PageDocument {
  if (from.rowId === toRowId && from.columnId === toColumnId && (!beforeItemId || beforeItemId === from.itemId)) {
    return page
  }
  const next = touch(page)
  const source = columnIn(next, from.rowId, from.columnId)
  const index = source.items.findIndex((item) => item.id === from.itemId)
  if (index < 0) return page
  const [item] = source.items.splice(index, 1)
  const target = columnIn(next, toRowId, toColumnId)
  const before = beforeItemId ? target.items.findIndex((entry) => entry.id === beforeItemId) : -1
  if (before >= 0) target.items.splice(before, 0, item)
  else target.items.push(item)
  return next
}

export function moveItem(page: PageDocument, focus: EditorFocus, direction: -1 | 1): PageDocument {
  const next = touch(page)
  const column = columnIn(next, focus.rowId, focus.columnId)
  const index = column.items.findIndex((item) => item.id === focus.itemId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= column.items.length) return page
  const [item] = column.items.splice(index, 1)
  column.items.splice(target, 0, item)
  return next
}

export function updateSeo(page: PageDocument, patch: Partial<SeoFields>): PageDocument {
  const next = touch(page)
  next.seo = { ...next.seo, ...patch }
  if (patch.title !== undefined) next.title = patch.title
  return next
}

export function markVisualCheck(page: PageDocument): PageDocument {
  return setReadiness(page, 'visual_check', new Date().toISOString()).page
}

function columnIn(page: PageDocument, rowId: string, columnId: string): Column {
  const row = page.rows.find((item) => item.id === rowId)
  const column = row?.columns.find((item) => item.id === columnId)
  if (!column) throw new Error('That column is not on the page')
  return column
}

export function emptyColumn(): Column {
  return { id: 'column-unused', items: [] }
}
