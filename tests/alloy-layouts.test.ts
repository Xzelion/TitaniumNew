import { describe, expect, it } from 'vitest'
import { parseAviaHtml } from '../shared/convert/parse-avia'
import { PRESETS } from '../shared/page-model/presets'
import { createIdFactory } from '../shared/page-model/workspace'

function page(body: string): string {
  return `<!doctype html><html><head><title>Alloy</title><meta name="description" content="Alloy"><link rel="canonical" href="https://titanium.com/alloys/stainless-steel/"><meta property="og:title" content="Alloy"><meta property="og:description" content="Alloy"></head><body>${body}</body></html>`
}

describe('alloy column presets', () => {
  it('keeps a quarter beside three quarters at the live widths', () => {
    expect(PRESETS['one-three'].columns.map((column) => [column.widthPercent, column.marginLeftPercent])).toEqual([
      [20.5, 0],
      [73.5, 6],
    ])
    const parsed = parseAviaHtml(
      page(
        `<div class="flex_column av_one_fourth flex_column_div first"><h3>Stainless Steel Round Bar</h3><a class="avia-button" href="https://titanium.com/shop/">Buy Now</a></div><div class="flex_column av_three_fourth flex_column_div"><p>Minimum diameter: 0.780″</p><p>Al 5.50 – 6.75%</p></div>`,
      ),
      createIdFactory(),
    )
    expect(parsed.rows.map((row) => row.preset)).toEqual(['one-three'])
    expect(parsed.sourceOnly.some((region) => region.label === 'Unmapped columns')).toBe(false)
    const text = parsed.rows.flatMap((row) =>
      row.columns.flatMap((column) => column.items.flatMap((item) => (item.kind === 'text' ? item.blocks.map((block) => block.text) : []))),
    )
    expect(text).toContain('Al 5.50 – 6.75%')
  })

  it('keeps a lone two-fifths heading and a no-margin quarter pair at the live no-gap widths', () => {
    expect(PRESETS['lead-two-fifths'].columns[0]).toMatchObject({ widthPercent: 36.4, marginLeftPercent: 0 })
    const lead = parseAviaHtml(
      page(`<div class="flex_column av_two_fifth flex_column_div first"><h3>weight calculator</h3></div>`),
      createIdFactory(),
    )
    expect(lead.rows.map((row) => row.preset)).toEqual(['lead-two-fifths'])
    const flush = parseAviaHtml(
      page(
        `<div class="flex_column av_one_fourth no_margin flex_column_div first"><p>Titanium Round Bar</p></div><div class="flex_column av_three_fourth no_margin flex_column_div"><p>Size range</p></div>`,
      ),
      createIdFactory(),
    )
    expect(flush.rows[0]?.preset).toBe('custom')
    expect(flush.rows[0]?.columns.map((column) => column.width)).toEqual(['flush-quarter', 'flush-three-quarters'])
    expect(flush.sourceOnly.some((region) => region.label === 'Unmapped columns')).toBe(false)
  })

  it('keeps a quarter plus a third as custom widths instead of stretching them', () => {
    const parsed = parseAviaHtml(
      page(
        `<div class="flex_column av_one_fourth flex_column_div first"><p>Continued</p></div><div class="flex_column av_one_third flex_column_div"><p>H-11</p></div>`,
      ),
      createIdFactory(),
    )
    expect(parsed.rows[0]?.preset).toBe('custom')
    expect(parsed.rows[0]?.columns.map((column) => column.width)).toEqual(['quarter', 'third'])
    expect(parsed.rows.some((row) => row.preset === 'thirds' || row.preset === 'one-three')).toBe(false)
  })
})
