import type { RowPreset } from './types'

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
    PRESETS['waterjet-split'],
    PRESETS['float-wrap'],
    PRESETS['lead-two-thirds'],
    PRESETS['lead-three-fifths'],
    PRESETS['lead-three-quarters'],
    PRESETS['lead-four-fifths'],
    PRESETS['wide-fifths'],
    PRESETS['half-quarters'],
    PRESETS.quarters,
    PRESETS['quarter-trio'],
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
