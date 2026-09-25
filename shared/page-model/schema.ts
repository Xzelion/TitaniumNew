import {
  BUTTON_VARIANTS,
  COLUMN_WIDTH_IDS,
  PICTURE_WRAPS,
  PIN_PLACES,
  PIN_TONES,
  READINESS_VALUES,
  ROW_PRESETS,
  ROW_VISUALS,
  TEXT_ALIGNS,
  TEXT_TONES,
  type ButtonItem,
  type ButtonVariant,
  type Column,
  type ColumnWidthId,
  type ColumnItem,
  type MapPin,
  type PageDocument,
  type PictureItem,
  type PictureWrap,
  type Provenance,
  type PublishedVersion,
  type Readiness,
  type Row,
  type RowPreset,
  type SeoFields,
  type SourceOnlyRegion,
  type TextBlock,
  type TextItem,
} from './types'
import { PRESETS } from './presets'

export class PageSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PageSchemaError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new PageSchemaError(`${label} must be text`)
  return value
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new PageSchemaError(`${label} must be yes or no`)
  return value
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new PageSchemaError(`${label} is not a known choice`)
  }
  return value as T
}

function parseTextBlock(value: unknown): TextBlock {
  if (!isRecord(value)) throw new PageSchemaError('Text block is invalid')
  const type = oneOf(value.type, ['heading', 'paragraph'] as const, 'Text block type')
  const text = expectString(value.text, 'Text')
  const block: TextBlock = { type, text }
  if (type === 'heading') {
    const level = value.level
    if (level !== 1 && level !== 2 && level !== 3 && level !== 4 && level !== 5) {
      throw new PageSchemaError('Heading size is invalid')
    }
    block.level = level
  }
  if (value.tone !== undefined) block.tone = oneOf(value.tone, TEXT_TONES, 'Text color')
  if (value.align !== undefined) block.align = oneOf(value.align, TEXT_ALIGNS, 'Text alignment')
  return block
}

function parseItem(value: unknown): ColumnItem {
  if (!isRecord(value)) throw new PageSchemaError('Column item is invalid')
  const id = expectString(value.id, 'Item id')
  const kind = value.kind
  if (kind === 'text') {
    if (!Array.isArray(value.blocks)) throw new PageSchemaError('Text needs blocks')
    const item: TextItem = { id, kind: 'text', blocks: value.blocks.map(parseTextBlock) }
    return item
  }
  if (kind === 'picture') {
    const item: PictureItem = {
      id,
      kind: 'picture',
      src: expectString(value.src, 'Picture address'),
      alt: expectString(value.alt, 'Picture description'),
      href: expectString(value.href, 'Picture link'),
      wrap: oneOf(value.wrap, PICTURE_WRAPS, 'Picture wrap') as PictureWrap,
    }
    if (value.displayPx !== undefined) {
      const size = value.displayPx
      if (typeof size !== 'number' || !Number.isInteger(size) || size < 16 || size > 80) {
        throw new PageSchemaError('Picture size is not a live icon size')
      }
      item.displayPx = size
    }
    if (value.hotspots !== undefined) item.hotspots = parseHotspots(value.hotspots)
    if ('body' in value || 'blocks' in value) {
      throw new PageSchemaError('A picture cannot contain body text')
    }
    return item
  }
  if (kind === 'button') {
    const item: ButtonItem = {
      id,
      kind: 'button',
      label: expectString(value.label, 'Button label'),
      href: expectString(value.href, 'Button link'),
      variant: oneOf(value.variant, BUTTON_VARIANTS, 'Button style') as ButtonVariant,
    }
    return item
  }
  throw new PageSchemaError('Unknown column item')
}

function parseColumn(value: unknown, custom: boolean): Column {
  if (!isRecord(value)) throw new PageSchemaError('Column is invalid')
  if (!Array.isArray(value.items)) throw new PageSchemaError('Column items are invalid')
  const column: Column = {
    id: expectString(value.id, 'Column id'),
    items: value.items.map(parseItem),
  }
  if (custom) {
    column.width = oneOf(value.width, COLUMN_WIDTH_IDS, 'Column width') as ColumnWidthId
  }
  return column
}

function parseRow(value: unknown): Row {
  if (!isRecord(value)) throw new PageSchemaError('Row is invalid')
  const preset = oneOf(value.preset, ROW_PRESETS, 'Row layout') as RowPreset
  if (!Array.isArray(value.columns)) throw new PageSchemaError('Row columns are invalid')
  const custom = preset === 'custom'
  const columns = value.columns.map((column) => parseColumn(column, custom))
  if (custom) {
    if (columns.length < 1 || columns.length > 12) {
      throw new PageSchemaError('Custom column widths need between 1 and 12 columns')
    }
  } else if (columns.length !== PRESETS[preset].columns.length) {
    throw new PageSchemaError(`${PRESETS[preset].label} needs ${PRESETS[preset].columns.length} columns`)
  }
  const row: Row = {
    id: expectString(value.id, 'Row id'),
    preset,
    spaceAbove: expectBoolean(value.spaceAbove, 'Space above row'),
    columns,
  }
  if (value.visual !== undefined) row.visual = oneOf(value.visual, ROW_VISUALS, 'Row treatment')
  return row
}

function parseHotspots(value: unknown): MapPin[] {
  if (!Array.isArray(value)) throw new PageSchemaError('Map pins must be a list')
  return value.map((pin, index) => {
    if (!isRecord(pin)) throw new PageSchemaError(`Map pin ${index + 1} is invalid`)
    return {
      id: expectString(pin.id, `Map pin ${index + 1} id`),
      top: expectPercent(pin.top, `Map pin ${index + 1} top`),
      left: expectPercent(pin.left, `Map pin ${index + 1} left`),
      tone: oneOf(pin.tone, PIN_TONES, `Map pin ${index + 1} color`),
      place: oneOf(pin.place, PIN_PLACES, `Map pin ${index + 1} tooltip place`),
      textId: expectString(pin.textId, `Map pin ${index + 1} text`),
    }
  })
}

function expectPercent(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new PageSchemaError(`${label} must be a percentage`)
  }
  return value
}

function parseSeo(value: unknown): SeoFields {
  if (!isRecord(value)) throw new PageSchemaError('Search fields are invalid')
  return {
    title: expectString(value.title, 'Page title'),
    description: expectString(value.description, 'Description'),
    canonical: expectString(value.canonical, 'Preferred address'),
    ogTitle: expectString(value.ogTitle, 'Social title'),
    ogDescription: expectString(value.ogDescription, 'Social description'),
    ogImage: expectString(value.ogImage, 'Social image'),
  }
}

function parseSourceOnly(value: unknown): SourceOnlyRegion {
  if (!isRecord(value)) throw new PageSchemaError('Source-only note is invalid')
  return {
    id: expectString(value.id, 'Note id'),
    label: expectString(value.label, 'Note label'),
    reason: expectString(value.reason, 'Note reason'),
  }
}

function parseProvenance(value: unknown): Provenance {
  if (!isRecord(value)) throw new PageSchemaError('Provenance is invalid')
  if (!Array.isArray(value.families) || !value.families.every((item) => typeof item === 'string')) {
    throw new PageSchemaError('Families are invalid')
  }
  if (!Array.isArray(value.remainingSourceOnly)) throw new PageSchemaError('Source-only list is invalid')
  return {
    sourceUrl: expectString(value.sourceUrl, 'Source address'),
    sourceHash: expectString(value.sourceHash, 'Source hash'),
    converterVersion: expectString(value.converterVersion, 'Converter version'),
    converterFamily: expectString(value.converterFamily, 'Converter family'),
    families: value.families,
    convertedAt: expectString(value.convertedAt, 'Converted at'),
    grid: expectString(value.grid, 'Grid'),
    remainingSourceOnly: value.remainingSourceOnly.map(parseSourceOnly),
    verify: expectString(value.verify, 'Verify note'),
  }
}

function parsePublished(value: unknown): PublishedVersion | null {
  if (value === null) return null
  if (!isRecord(value)) throw new PageSchemaError('Published version is invalid')
  if (!Array.isArray(value.rows)) throw new PageSchemaError('Published rows are invalid')
  return {
    seo: parseSeo(value.seo),
    rows: value.rows.map(parseRow),
    publishedAt: expectString(value.publishedAt, 'Published at'),
  }
}

export function parsePageDocument(value: unknown): PageDocument {
  if (!isRecord(value)) throw new PageSchemaError('Page is invalid')
  const readiness = oneOf(value.readiness, READINESS_VALUES, 'Readiness') as Readiness
  if (value.siteVisibility !== 'private_draft') {
    throw new PageSchemaError('Converted pages stay private drafts')
  }
  if (!Array.isArray(value.rows)) throw new PageSchemaError('Rows are invalid')
  return {
    id: expectString(value.id, 'Page id'),
    path: expectString(value.path, 'Path'),
    title: expectString(value.title, 'Title'),
    readiness,
    seo: parseSeo(value.seo),
    rows: value.rows.map(parseRow),
    publishedVersion: parsePublished(value.publishedVersion),
    provenance: parseProvenance(value.provenance),
    siteVisibility: 'private_draft',
    editedByHuman: expectBoolean(value.editedByHuman, 'Edited by a person'),
  }
}

export function serializePageDocument(page: PageDocument): string {
  return JSON.stringify(parsePageDocument(page))
}

export function roundTripPageDocument(page: PageDocument): PageDocument {
  return parsePageDocument(JSON.parse(serializePageDocument(page)))
}

export function isPageDocument(value: unknown): value is PageDocument {
  try {
    parsePageDocument(value)
    return true
  } catch {
    return false
  }
}
