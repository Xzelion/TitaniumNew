// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { mountWorkspace } from '../shared/editor/mount'
import { renderColumnsHtml } from '../shared/render/columns'
import { slotsFor } from '../shared/page-model/presets'
import { roundTripPageDocument } from '../shared/page-model/schema'
import { createIdFactory } from '../shared/page-model/workspace'

function page(body: string, canonical: string): string {
  return `<!doctype html><html><head><title>Alloy</title><meta name="description" content="Alloy"><link rel="canonical" href="${canonical}"><meta property="og:title" content="Alloy"><meta property="og:description" content="Alloy"></head><body>${body}</body></html>`
}

describe('custom column widths', () => {
  it('measures the four alloy mixes from the live Enfold widths', () => {
    const quarterThird = parseAviaHtml(
      page(
        `<div class="flex_column av_one_fourth flex_column_div first"><p>Round bar</p></div><div class="flex_column av_one_third flex_column_div"><p>H-11</p></div>`,
        'https://titanium.com/alloys/alloy-steels/',
      ),
      createIdFactory(),
    )
    expect(slotsFor(quarterThird.rows[0]).map((slot) => [slot.widthPercent, slot.marginLeftPercent])).toEqual([
      [20.5, 0],
      [29.333333333333332, 6],
    ])

    const quarterHalf = parseAviaHtml(
      page(
        `<div class="flex_column av_one_fourth flex_column_div first"><p>Hollow</p></div><div class="flex_column av_one_half flex_column_div"><p>Range</p></div>`,
        'https://titanium.com/alloys/nickel-alloys/',
      ),
      createIdFactory(),
    )
    expect(quarterHalf.rows[0]?.columns.map((column) => column.width)).toEqual(['quarter', 'half'])
    expect(slotsFor(quarterHalf.rows[0]).map((slot) => slot.widthPercent)).toEqual([20.5, 47])

    const block = parseAviaHtml(
      page(
        `<div class="flex_column av_one_fourth flex_column_div first"><p>Block</p></div><div class="flex_column av_two_fifth flex_column_div"><p>Range</p></div>`,
        'https://titanium.com/alloys/titanium-and-titanium-alloys/',
      ),
      createIdFactory(),
    )
    expect(block.rows[0]?.columns.map((column) => column.width)).toEqual(['quarter', 'two-fifths'])

    const billet = parseAviaHtml(
      page(
        `<div class="flex_column av_one_fifth no_margin flex_column_div first"><p>Billet</p></div><div class="flex_column av_four_fifth no_margin flex_column_div"><p>Range</p></div>`,
        'https://titanium.com/alloys/titanium-and-titanium-alloys/',
      ),
      createIdFactory(),
    )
    expect(billet.rows[0]?.columns.map((column) => column.width)).toEqual(['flush-fifth', 'flush-four-fifths'])
    expect(slotsFor(billet.rows[0]).map((slot) => [slot.widthPercent, slot.marginLeftPercent])).toEqual([
      [20, 0],
      [80, 0],
    ])

    const grade = parseAviaHtml(
      page(
        `<div class="flex_column av_one_third flex_column_div first"><p>Mill</p></div><div class="flex_column av_one_fourth flex_column_div"><p>Pipe</p></div><div class="flex_column av_one_third flex_column_div"><p>Fittings</p></div>`,
        'https://titanium.com/alloys/titanium-and-titanium-alloys/ti-grade-2-cp-3/',
      ),
      createIdFactory(),
    )
    expect(grade.rows[0]?.columns.map((column) => column.width)).toEqual(['third', 'quarter', 'third'])
    expect(renderColumnsHtml(grade.rows)).toContain('width:20.5%')
    expect(renderColumnsHtml(grade.rows)).toContain('margin-left:6%')
  })

  it('lets Marketing pick a column width, add a column, and still move a card', () => {
    const parsed = parseAviaHtml(
      page(
        `<div class="flex_column av_one_full flex_column_div first"><h2>Alloy steels</h2><p>Story</p></div>`,
        'https://titanium.com/alloys/alloy-steels/',
      ),
      createIdFactory(),
    )
    const opened = toPageDocument(parsed, '2026-09-24T00:00:00.000Z')
    document.body.innerHTML = '<div id="root"></div>'
    const root = document.getElementById('root')
    if (!root) throw new Error('missing root')
    const controller = mountWorkspace(root, opened, () => undefined)
    const custom = root.querySelector('[data-action="set-preset"][data-preset="custom"]')
    if (!(custom instanceof HTMLElement)) throw new Error('missing custom layout')
    custom.click()
    expect(root.innerHTML).toContain('Custom column widths')
    expect(root.innerHTML).toContain('Unsaved changes')
    expect(root.querySelector('[data-action="column-width"]')).toBeTruthy()
    expect(root.querySelector('[draggable="true"]')).toBeTruthy()
    const select = root.querySelector('[data-action="column-width"]')
    if (!(select instanceof HTMLSelectElement)) throw new Error('missing width select')
    select.value = 'quarter'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    const add = root.querySelector('[data-action="add-column"]')
    if (!(add instanceof HTMLElement)) throw new Error('missing add column')
    add.click()
    const row = controller.getPage().rows[0]
    expect(row?.preset).toBe('custom')
    expect(row?.columns.map((column) => column.width)).toEqual(['quarter', 'quarter'])
    const card = root.querySelector('[data-action="select-item"]')
    if (!(card instanceof HTMLElement)) throw new Error('missing card')
    card.click()
    expect(root.innerHTML).toContain('Edit text')
    expect(root.innerHTML).toContain('Up')
    expect(root.innerHTML).toContain('Duplicate')
    const roundTrip = roundTripPageDocument(controller.getPage())
    expect(roundTrip.rows[0]?.columns.map((column) => column.width)).toEqual(['quarter', 'quarter'])
    expect(roundTrip.siteVisibility).toBe('private_draft')
    controller.destroy()
  })
})
