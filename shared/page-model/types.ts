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
  'waterjet-split',
  'float-wrap',
  'lead-two-thirds',
  'lead-three-fifths',
  'lead-three-quarters',
] as const

export type RowPreset = (typeof ROW_PRESETS)[number]

export const PICTURE_WRAPS = ['none', 'left', 'right'] as const

export type PictureWrap = (typeof PICTURE_WRAPS)[number]

export const BUTTON_VARIANTS = ['primary', 'secondary'] as const

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

export interface TextBlock {
  type: 'heading' | 'paragraph'
  /** Heading level. Paragraphs omit this. */
  level?: 1 | 2 | 3 | 4
  text: string
}

export interface TextItem {
  id: string
  kind: 'text'
  blocks: TextBlock[]
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
}

export interface Row {
  id: string
  preset: RowPreset
  /** Live Enfold class `column-top-margin` (50px). Not a free-form measurement. */
  spaceAbove: boolean
  columns: Column[]
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
