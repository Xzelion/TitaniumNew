/** Editable page model shared by Payload, the column workspace, and Astro. */

export const READINESS_VALUES = ['layout_editing', 'visual_check', 'published'] as const

export type Readiness = (typeof READINESS_VALUES)[number]

export const ROW_PRESETS = [
  'full',
  'halves',
  'thirds',
  'two-one',
  'one-two',
  'quality-split',
  'three-one',
  'one-three',
  'waterjet-split',
  'float-wrap',
  'lead-two-thirds',
  'lead-two-fifths',
  'lead-three-fifths',
  'lead-three-quarters',
  'lead-four-fifths',
  'wide-fifths',
  'half-quarters',
  'quarters',
  'quarter-trio',
  'fifths',
  'sixths',
  'near-halves',
  'custom',
] as const

export type RowPreset = (typeof ROW_PRESETS)[number]

/** Live Enfold column widths. Marketing picks one of these. The numbers are not free-form CSS. */
export const COLUMN_WIDTH_IDS = [
  'full',
  'half',
  'third',
  'two-thirds',
  'quarter',
  'three-quarters',
  'fifth',
  'two-fifths',
  'three-fifths',
  'four-fifths',
  'sixth',
  'flush-half',
  'flush-third',
  'flush-two-thirds',
  'flush-quarter',
  'flush-three-quarters',
  'flush-fifth',
  'flush-two-fifths',
  'flush-three-fifths',
  'flush-four-fifths',
  'flush-sixth',
  'flush-near-half',
] as const

export type ColumnWidthId = (typeof COLUMN_WIDTH_IDS)[number]

export const PICTURE_WRAPS = ['none', 'left', 'right'] as const

export type PictureWrap = (typeof PICTURE_WRAPS)[number]

export const BUTTON_VARIANTS = ['primary', 'secondary'] as const

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

/** Named colors from the live welcome copy. Not a free-form CSS field. */
export const TEXT_TONES = ['navy', 'gray', 'ink'] as const

export type TextTone = (typeof TEXT_TONES)[number]

export const TEXT_ALIGNS = ['center'] as const

export type TextAlign = (typeof TEXT_ALIGNS)[number]

export interface TextBlock {
  type: 'heading' | 'paragraph'
  /** Heading level. Paragraphs omit this. */
  level?: 1 | 2 | 3 | 4 | 5
  text: string
  tone?: TextTone
  align?: TextAlign
}

export interface TextItem {
  id: string
  kind: 'text'
  blocks: TextBlock[]
}

export const PIN_TONES = ['cyan', 'navy'] as const

export type PinTone = (typeof PIN_TONES)[number]

export const PIN_PLACES = ['above', 'below'] as const

export type PinPlace = (typeof PIN_PLACES)[number]

/** A pin on the location map. The tooltip is the text item `textId`. */
export interface MapPin {
  id: string
  top: number
  left: number
  tone: PinTone
  place: PinPlace
  textId: string
}

export interface PictureItem {
  id: string
  kind: 'picture'
  src: string
  alt: string
  href: string
  wrap: PictureWrap
  /**
   * Fixed icon size from the live HTML width attribute (16–80px).
   * Larger pictures stay fluid. This is not a free-form CSS field.
   */
  displayPx?: number
  hotspots?: MapPin[]
}

export interface ButtonItem {
  id: string
  kind: 'button'
  label: string
  href: string
  variant: ButtonVariant
}

export type ColumnItem = TextItem | PictureItem | ButtonItem

export interface Column {
  id: string
  items: ColumnItem[]
  /** Live Enfold width. Present when the row layout is custom. */
  width?: ColumnWidthId
}

/** Named homepage treatments. The renderer owns the CSS. */
export const ROW_VISUALS = ['welcome', 'product-cards', 'processing', 'markets', 'location-map', 'location-list'] as const

export type RowVisual = (typeof ROW_VISUALS)[number]

export interface Row {
  id: string
  preset: RowPreset
  /** Live Enfold class `column-top-margin` (50px). Not a free-form measurement. */
  spaceAbove: boolean
  columns: Column[]
  visual?: RowVisual
}

export interface SeoFields {
  title: string
  description: string
  canonical: string
  ogTitle: string
  ogDescription: string
  ogImage: string
}

export interface SourceOnlyRegion {
  id: string
  label: string
  reason: string
}

export interface Provenance {
  sourceUrl: string
  sourceHash: string
  converterVersion: string
  converterFamily: string
  families: string[]
  convertedAt: string
  grid: string
  remainingSourceOnly: SourceOnlyRegion[]
  verify: string
}

export interface PublishedVersion {
  seo: SeoFields
  rows: Row[]
  publishedAt: string
}

export interface PageDocument {
  id: string
  path: string
  title: string
  readiness: Readiness
  seo: SeoFields
  rows: Row[]
  publishedVersion: PublishedVersion | null
  provenance: Provenance
  /** Converted pages stay off the public site until a human cutover. */
  siteVisibility: 'private_draft'
  editedByHuman: boolean
}

export interface EditorFocus {
  rowId: string
  columnId: string
  itemId: string
}
