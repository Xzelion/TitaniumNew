import type { ColumnWidthId, Row, RowPreset } from './types'

/**
 * Column geometry taken from the live Enfold stylesheet on titanium.com
 * (margin-left 6% on every column after the first, `.first { margin-left: 0 }`).
 * Marketing picks a named preset. These numbers are not editable.
 */
export interface ColumnSlot {
  label: string
  widthPercent: number
  marginLeftPercent: number
}

export interface PresetDefinition {
  id: RowPreset
  label: string
  description: string
  /** Illustrated bar weights for the preset picker. */
  bars: number[]
  columns: ColumnSlot[]
  /** Measured float layout. Renderer must not turn this into equal columns. */
  measured?: 'waterjet' | 'float-wrap'
}

const third = 29.333333333333332
const twoThird = 64.66666666666666
const twoFifth = 36.4
const threeFifth = 57.599999999999994
const fourFifth = 78.8
const quarter = 20.5
const threeQuarter = 73.5
const half = 47
const fifth = 15.2
const sixth = 11.666666666666666
const nearHalf = 49.8

export const PRESETS: Record<RowPreset, PresetDefinition> = {
  full: {
    id: 'full',
    label: 'Full width',
    description: 'One column across the page.',
    bars: [1],
    columns: [{ label: 'Column', widthPercent: 100, marginLeftPercent: 0 }],
  },
  halves: {
    id: 'halves',
    label: 'Two equal columns',
    description: 'Two equal columns with the live site gap.',
    bars: [1, 1],
    columns: [
      { label: 'Left column', widthPercent: half, marginLeftPercent: 0 },
      { label: 'Right column', widthPercent: half, marginLeftPercent: 6 },
    ],
  },
  thirds: {
    id: 'thirds',
    label: 'Three equal columns',
    description: 'Use this for a row of three buttons or three cards.',
    bars: [1, 1, 1],
    columns: [
      { label: 'Left column', widthPercent: third, marginLeftPercent: 0 },
      { label: 'Middle column', widthPercent: third, marginLeftPercent: 6 },
      { label: 'Right column', widthPercent: third, marginLeftPercent: 6 },
    ],
  },
  'two-one': {
    id: 'two-one',
    label: 'Wide left / narrow right',
    description: 'Main story on the left (two thirds) and a side card on the right (one third).',
    bars: [2, 1],
    columns: [
      { label: 'Main column', widthPercent: twoThird, marginLeftPercent: 0 },
      { label: 'Side column', widthPercent: third, marginLeftPercent: 6 },
    ],
  },
  'one-two': {
    id: 'one-two',
    label: 'Narrow left / wide right',
    description: 'A narrow column on the left (one third) and the main story on the right (two thirds).',
    bars: [1, 2],
    columns: [
      { label: 'Narrow column', widthPercent: third, marginLeftPercent: 0 },
      { label: 'Wide column', widthPercent: twoThird, marginLeftPercent: 6 },
    ],
  },
  'quality-split': {
    id: 'quality-split',
    label: 'Quality: narrow left / wide right',
    description: 'Quality System documents on the left (two fifths) and the write-up on the right (three fifths).',
    bars: [2, 3],
    columns: [
      { label: 'List column', widthPercent: twoFifth, marginLeftPercent: 0 },
      { label: 'Story column', widthPercent: threeFifth, marginLeftPercent: 6 },
    ],
  },
  'three-one': {
    id: 'three-one',
    label: 'Wide story, slim side',
    description: 'Story on the left (three quarters) and a slim side card (one quarter).',
    bars: [3, 1],
    columns: [
      { label: 'Main column', widthPercent: threeQuarter, marginLeftPercent: 0 },
      { label: 'Side column', widthPercent: quarter, marginLeftPercent: 6 },
    ],
  },
  'one-three': {
    id: 'one-three',
    label: 'Slim left / wide right (quarters)',
    description: 'A slim column on the left (one quarter, 20.5%) and the story on the right (three quarters, 73.5%), with the live site gap.',
    bars: [1, 3],
    columns: [
      { label: 'Slim column', widthPercent: quarter, marginLeftPercent: 0 },
      { label: 'Wide column', widthPercent: threeQuarter, marginLeftPercent: 6 },
    ],
  },
  'waterjet-split': {
    id: 'waterjet-split',
    label: 'Picture beside the words',
    description: 'Words 55% on the left, picture 40% with a 15px gap, picture 20px lower. Measured from processing pages that include this custom CSS, including water jet.',
    bars: [55, 40],
    columns: [
      { label: 'Words · 55%', widthPercent: 55, marginLeftPercent: 0 },
      { label: 'Picture · 40%', widthPercent: 40, marginLeftPercent: 0 },
    ],
    measured: 'waterjet',
  },
  'float-wrap': {
    id: 'float-wrap',
    label: 'Words wrap around pictures',
    description: 'Pictures tuck left or right and the words wrap around them. This is not split into equal columns.',
    bars: [1],
    columns: [{ label: 'Wrapping column', widthPercent: 100, marginLeftPercent: 0 }],
    measured: 'float-wrap',
  },
  'lead-two-thirds': {
    id: 'lead-two-thirds',
    label: 'Heading, two thirds wide',
    description: 'A single column at two thirds of the page, like the quality page title.',
    bars: [2],
    columns: [{ label: 'Heading column', widthPercent: twoThird, marginLeftPercent: 0 }],
  },
  'lead-two-fifths': {
    id: 'lead-two-fifths',
    label: 'Heading, two fifths wide',
    description: 'A single column at two fifths of the page (36.4%).',
    bars: [2],
    columns: [{ label: 'Heading column', widthPercent: twoFifth, marginLeftPercent: 0 }],
  },
  'lead-three-fifths': {
    id: 'lead-three-fifths',
    label: 'Heading, three fifths wide',
    description: 'A single column at three fifths of the page.',
    bars: [3],
    columns: [{ label: 'Heading column', widthPercent: threeFifth, marginLeftPercent: 0 }],
  },
  'lead-three-quarters': {
    id: 'lead-three-quarters',
    label: 'Heading, three quarters wide',
    description: 'A single column at three quarters of the page.',
    bars: [3],
    columns: [{ label: 'Heading column', widthPercent: threeQuarter, marginLeftPercent: 0 }],
  },
  'lead-four-fifths': {
    id: 'lead-four-fifths',
    label: 'Heading, four fifths wide',
    description: 'A single column at four fifths of the page (78.8%).',
    bars: [4],
    columns: [{ label: 'Heading column', widthPercent: fourFifth, marginLeftPercent: 0 }],
  },
  'wide-fifths': {
    id: 'wide-fifths',
    label: 'Wide left / slim right (fifths)',
    description: 'Main story on the left (three fifths) and a slim column on the right (two fifths).',
    bars: [3, 2],
    columns: [
      { label: 'Main column', widthPercent: threeFifth, marginLeftPercent: 0 },
      { label: 'Side column', widthPercent: twoFifth, marginLeftPercent: 6 },
    ],
  },
  'half-quarters': {
    id: 'half-quarters',
    label: 'Half plus two quarters',
    description: 'A half-width column, then two quarter columns, with the live site gap.',
    bars: [2, 1, 1],
    columns: [
      { label: 'Half column', widthPercent: half, marginLeftPercent: 0 },
      { label: 'First quarter', widthPercent: quarter, marginLeftPercent: 6 },
      { label: 'Second quarter', widthPercent: quarter, marginLeftPercent: 6 },
    ],
  },
  quarters: {
    id: 'quarters',
    label: 'Four quarters',
    description: 'Four columns at the live quarter width (20.5%), with the 6% gap.',
    bars: [1, 1, 1, 1],
    columns: [
      { label: 'First quarter', widthPercent: quarter, marginLeftPercent: 0 },
      { label: 'Second quarter', widthPercent: quarter, marginLeftPercent: 6 },
      { label: 'Third quarter', widthPercent: quarter, marginLeftPercent: 6 },
      { label: 'Fourth quarter', widthPercent: quarter, marginLeftPercent: 6 },
    ],
  },
  'quarter-trio': {
    id: 'quarter-trio',
    label: 'Three quarter-width cards',
    description: 'Three columns at the live quarter width (20.5%). They stay the same width as a four-across row. They do not stretch into thirds.',
    bars: [1, 1, 1],
    columns: [
      { label: 'First quarter', widthPercent: quarter, marginLeftPercent: 0 },
      { label: 'Second quarter', widthPercent: quarter, marginLeftPercent: 6 },
      { label: 'Third quarter', widthPercent: quarter, marginLeftPercent: 6 },
    ],
  },
  fifths: {
    id: 'fifths',
    label: 'Five fifths',
    description: 'Five columns at the live fifth width (15.2%), with the 6% gap.',
    bars: [1, 1, 1, 1, 1],
    columns: [0, 1, 2, 3, 4].map((index) => ({
      label: `Fifth ${index + 1}`,
      widthPercent: fifth,
      marginLeftPercent: index === 0 ? 0 : 6,
    })),
  },
  sixths: {
    id: 'sixths',
    label: 'Six sixths',
    description: 'Six columns at the live sixth width (11.7%), with the 6% gap.',
    bars: [1, 1, 1, 1, 1, 1],
    columns: [0, 1, 2, 3, 4, 5].map((index) => ({
      label: `Sixth ${index + 1}`,
      widthPercent: sixth,
      marginLeftPercent: index === 0 ? 0 : 6,
    })),
  },
  'near-halves': {
    id: 'near-halves',
    label: 'Two near halves',
    description: 'Two columns at 49.8% from the live rule for no-margin av_one_second. There is no 6% gap.',
    bars: [1, 1],
    columns: [
      { label: 'First card', widthPercent: nearHalf, marginLeftPercent: 0 },
      { label: 'Second card', widthPercent: nearHalf, marginLeftPercent: 0 },
    ],
  },
  custom: {
    id: 'custom',
    label: 'Custom column widths',
    description: 'Each column uses a live Enfold width. The row does not have to fill the page.',
    bars: [1, 2, 1],
    columns: [],
  },
}

export const PRESET_LIST: PresetDefinition[] = ROW_PRESET_ORDER()

/** Choices a new row offers first. Measured layouts stay available beside them. */
export const COMMON_PRESET_IDS: RowPreset[] = ['full', 'halves', 'thirds', 'two-one', 'one-two']

function ROW_PRESET_ORDER(): PresetDefinition[] {
  return [
    PRESETS.full,
    PRESETS.halves,
    PRESETS.thirds,
    PRESETS['two-one'],
    PRESETS['one-two'],
    PRESETS['quality-split'],
    PRESETS['three-one'],
    PRESETS['one-three'],
    PRESETS['waterjet-split'],
    PRESETS['float-wrap'],
    PRESETS['lead-two-thirds'],
    PRESETS['lead-two-fifths'],
    PRESETS['lead-three-fifths'],
    PRESETS['lead-three-quarters'],
    PRESETS['lead-four-fifths'],
    PRESETS['wide-fifths'],
    PRESETS['half-quarters'],
    PRESETS.quarters,
    PRESETS['quarter-trio'],
    PRESETS.fifths,
    PRESETS.sixths,
    PRESETS['near-halves'],
    PRESETS.custom,
  ]
}

export function presetById(id: RowPreset): PresetDefinition {
  return PRESETS[id]
}

/** Live water jet custom CSS plus the theme's 15px left-aligned image gap. */
export const WATERJET_MEASUREMENT = {
  textPercent: 55,
  imagePercent: 40,
  gapPx: 15,
  imageOffsetPx: 20,
} as const

/** Live medical page `.left` / `.right` rules. */
export const FLOAT_WRAP_MEASUREMENT = {
  left: { margin: '8px 16px 0 0' },
  right: { margin: '8px 0 0 16px' },
} as const

export const ENFOLD_ROW_SPACE_PX = 50

export interface ColumnWidthDefinition {
  id: ColumnWidthId
  label: string
  widthPercent: number
  /** Live `#top .no_margin` width. Margin stays 0. */
  flush: boolean
}

const sixthFlush = 16.666666666666668

export const COLUMN_WIDTHS: Record<ColumnWidthId, ColumnWidthDefinition> = {
  full: { id: 'full', label: 'Full width', widthPercent: 100, flush: false },
  half: { id: 'half', label: 'Half', widthPercent: half, flush: false },
  third: { id: 'third', label: 'Third', widthPercent: third, flush: false },
  'two-thirds': { id: 'two-thirds', label: 'Two thirds', widthPercent: twoThird, flush: false },
  quarter: { id: 'quarter', label: 'Quarter', widthPercent: quarter, flush: false },
  'three-quarters': { id: 'three-quarters', label: 'Three quarters', widthPercent: threeQuarter, flush: false },
  fifth: { id: 'fifth', label: 'Fifth', widthPercent: fifth, flush: false },
  'two-fifths': { id: 'two-fifths', label: 'Two fifths', widthPercent: twoFifth, flush: false },
  'three-fifths': { id: 'three-fifths', label: 'Three fifths', widthPercent: threeFifth, flush: false },
  'four-fifths': { id: 'four-fifths', label: 'Four fifths', widthPercent: fourFifth, flush: false },
  sixth: { id: 'sixth', label: 'Sixth', widthPercent: sixth, flush: false },
  'flush-half': { id: 'flush-half', label: 'Half, no gap', widthPercent: 50, flush: true },
  'flush-third': { id: 'flush-third', label: 'Third, no gap', widthPercent: 33.3, flush: true },
  'flush-two-thirds': { id: 'flush-two-thirds', label: 'Two thirds, no gap', widthPercent: 66.6, flush: true },
  'flush-quarter': { id: 'flush-quarter', label: 'Quarter, no gap', widthPercent: 24.9, flush: true },
  'flush-three-quarters': { id: 'flush-three-quarters', label: 'Three quarters, no gap', widthPercent: 75, flush: true },
  'flush-fifth': { id: 'flush-fifth', label: 'Fifth, no gap', widthPercent: 20, flush: true },
  'flush-two-fifths': { id: 'flush-two-fifths', label: 'Two fifths, no gap', widthPercent: 40, flush: true },
  'flush-three-fifths': { id: 'flush-three-fifths', label: 'Three fifths, no gap', widthPercent: 60, flush: true },
  'flush-four-fifths': { id: 'flush-four-fifths', label: 'Four fifths, no gap', widthPercent: 80, flush: true },
  'flush-sixth': { id: 'flush-sixth', label: 'Sixth, no gap', widthPercent: sixthFlush, flush: true },
  'flush-near-half': { id: 'flush-near-half', label: 'Near half, no gap', widthPercent: nearHalf, flush: true },
}

export const COLUMN_WIDTH_LIST: ColumnWidthDefinition[] = Object.values(COLUMN_WIDTHS)

const FRACTION_WIDTH: Record<string, { gapped: ColumnWidthId | null; flush: ColumnWidthId | null }> = {
  '1': { gapped: 'full', flush: 'full' },
  '1/2': { gapped: 'half', flush: 'flush-half' },
  '1/3': { gapped: 'third', flush: 'flush-third' },
  '2/3': { gapped: 'two-thirds', flush: 'flush-two-thirds' },
  '1/4': { gapped: 'quarter', flush: 'flush-quarter' },
  '3/4': { gapped: 'three-quarters', flush: 'flush-three-quarters' },
  '1/5': { gapped: 'fifth', flush: 'flush-fifth' },
  '2/5': { gapped: 'two-fifths', flush: 'flush-two-fifths' },
  '3/5': { gapped: 'three-fifths', flush: 'flush-three-fifths' },
  '4/5': { gapped: 'four-fifths', flush: 'flush-four-fifths' },
  '1/6': { gapped: 'sixth', flush: 'flush-sixth' },
  second: { gapped: null, flush: 'flush-near-half' },
}

export function widthIdForFraction(key: string, flush: boolean): ColumnWidthId | null {
  const pair = FRACTION_WIDTH[key]
  if (!pair) return null
  return flush ? pair.flush : pair.gapped
}

export function widthIdMatchingSlot(slot: ColumnSlot): ColumnWidthId {
  const match = COLUMN_WIDTH_LIST.find((width) => width.widthPercent === slot.widthPercent)
  return match?.id ?? 'quarter'
}

/** Column geometry for a row. Custom rows use the width stored on each column. */
export function slotsFor(row: Row): ColumnSlot[] {
  if (row.preset !== 'custom') return PRESETS[row.preset].columns
  return row.columns.map((column, index) => {
    const width = COLUMN_WIDTHS[column.width ?? 'quarter']
    return {
      label: width.label,
      widthPercent: width.widthPercent,
      marginLeftPercent: width.flush || index === 0 ? 0 : 6,
    }
  })
}

export function rowGridLabel(row: Row): string {
  if (row.preset !== 'custom') return row.preset
  const widths = row.columns.map((column) => column.width ?? 'quarter')
  return `custom(${widths.join('+')})`
}
