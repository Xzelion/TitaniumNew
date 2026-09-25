import { describe, expect, it } from 'vitest'
import { parseAviaHtml } from '../shared/convert/parse-avia'
import { PRESETS } from '../shared/page-model/presets'
import { createIdFactory } from '../shared/page-model/workspace'

function page(body: string, canonical = 'https://titanium.com/markets/defense/'): string {
  return `<!doctype html><html><head><title>Industry</title><meta name="description" content="Industry"><link rel="canonical" href="${canonical}"><meta property="og:title" content="Industry"><meta property="og:description" content="Industry"></head><body>${body}</body></html>`
}

function card(title: string, width: string, href: string): string {
  return `<div class="grid-entry ${width} oil-gas_sort"><a href="${href}"><img data-src="https://titanium.com/wp-content/uploads/2016/09/${title.replace(/\s+/g, '_')}.jpg" alt="${title}"></a><h3 class="grid-entry-title">${title}</h3></div>`
}

describe('visible industry product cards', () => {
  it('turns five public fifths into picture cards and does not reuse the oil-gas export', () => {
    const titles = ['Titanium Round Bar', 'Titanium Billet', 'Titanium Block', 'Titanium Plate', 'Titanium Sheet']
    const html = page(
      `<div class="flex_column av_two_third flex_column_div first"><h2>Defense</h2><table><h4>Products used in this application include:</h4>${titles
        .map((title) => card(title, 'av_one_fifth', `https://titanium.com/${title.split(' ').pop()?.toLowerCase()}/`))
        .join('')}</table></div><div class="flex_column av_one_third flex_column_div"><a href="https://titanium.com/line.pdf">Line Card</a></div>`,
    )
    const parsed = parseAviaHtml(html, createIdFactory(), [], [
      {
        wpId: 6427,
        title: 'Round Bar',
        href: 'https://titanium.com/metalproducts/round-bar/',
        imageUrl: 'https://titanium.com/wp-content/uploads/2016/09/Round_Bar_Hi.jpg',
        bodyEmpty: false,
      },
    ])
    expect(parsed.rows.map((row) => row.preset)).toEqual(['two-one', 'fifths'])
    expect(parsed.sourceOnly.some((region) => region.label === 'Product grid')).toBe(false)
    expect(parsed.htmlCards.map((card) => card.title)).toEqual(titles)
    expect(parsed.rows.some((row) => row.preset === 'quarters')).toBe(false)
    const text = parsed.rows.flatMap((row) =>
      row.columns.flatMap((column) => column.items.flatMap((item) => (item.kind === 'text' ? item.blocks.map((block) => block.text) : []))),
    )
    expect(text).toContain('Products used in this application include:')
  })

  it('uses sixths and the 49.8% pair from the live stylesheet', () => {
    expect(PRESETS.fifths.columns.map((column) => column.widthPercent)).toEqual([15.2, 15.2, 15.2, 15.2, 15.2])
    expect(PRESETS.fifths.columns.map((column) => column.marginLeftPercent)).toEqual([0, 6, 6, 6, 6])
    expect(PRESETS.sixths.columns[0]?.widthPercent).toBe(11.666666666666666)
    expect(PRESETS['near-halves'].columns.map((column) => [column.widthPercent, column.marginLeftPercent])).toEqual([
      [49.8, 0],
      [49.8, 0],
    ])
    const six = ['Round Bar', 'Billet', 'Block', 'Plate', 'Sheet', 'Seamless Tube']
    const html = page(
      `<div class="flex_column av_one_full flex_column_div first"><h2>Aircraft Engines</h2><table>${six.map((title) => card(title, 'av_one_sixth', 'https://titanium.com/engines/')).join('')}</table></div><div class="flex_column av_one_full flex_column_div first"><h2>Fashion</h2><table>${card('Sheet', 'av_one_second', 'https://titanium.com/sheet/')}${card('Wire', 'av_one_second', 'https://titanium.com/wire/')}</table></div>`,
      'https://titanium.com/markets/consumer-products/',
    )
    const parsed = parseAviaHtml(html, createIdFactory())
    expect(parsed.rows.map((row) => row.preset)).toEqual(['full', 'sixths', 'full', 'near-halves'])
    expect(parsed.htmlCards.map((card) => card.title)).toEqual([...six, 'Sheet', 'Wire'])
  })
})
