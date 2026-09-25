import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseAviaHtml } from '../shared/convert/parse-avia'
import { oilGasCardsFromWxr, OIL_GAS_PUBLIC_ORDER } from '../shared/convert/portfolio-wxr'
import { PRESETS } from '../shared/page-model/presets'
import { createIdFactory } from '../shared/page-model/workspace'

const NOW_HTML = `<!doctype html><html><head>
<title>Oil and Gas</title>
<meta name="description" content="Oil and gas products">
<link rel="canonical" href="https://titanium.com/oil-gas/">
<meta property="og:title" content="Oil and Gas">
<meta property="og:description" content="Oil and gas products">
</head><body>
<div class="flex_column av_one_full flex_column_div first"><a class="avia-button" href="https://qqa.titanium.com/customer/quick-quote"><span class="avia_iconbox_title">Create Quote</span></a></div>
<div class="flex_column av_one_full flex_column_div first">
  <h3>Products Forms T.I. Carries for Oil &amp; Gas Applications:</h3>
  <div class="grid-entry oil-gas_sort"><img alt="old" data-src="https://titanium.com/wp-content/uploads/old.jpg"></div>
</div>
</body></html>`

describe('oil and gas portfolio cards', () => {
  const cards = oilGasCardsFromWxr(readFileSync(path.join(process.cwd(), 'migration/raw/oil-gas-portfolio.xml'), 'utf8'))

  it('keeps the public card order and the featured images', () => {
    expect(cards.map((card) => card.wpId)).toEqual([...OIL_GAS_PUBLIC_ORDER])
    expect(cards.map((card) => card.title)).toEqual([
      'Round Bar',
      'Plate',
      'Sheet',
      'Seamless Tube',
      'Seamless Pipe',
      'Billet',
      'Coil',
    ])
    expect(cards.map((card) => card.imageUrl.split('/').pop())).toEqual([
      'Round_Bar_Hi.jpg',
      'Plate_Low.jpg',
      'Sheet_Metal_Low.jpg',
      'Tube_Low-1.jpg',
      'Pipe_Low.jpg',
      'Billet_Low-1.jpg',
      'Coil_Hi.jpg',
    ])
    expect(cards.find((card) => card.wpId === 6431)?.bodyEmpty).toBe(true)
    expect(cards.find((card) => card.wpId === 6429)?.bodyEmpty).toBe(true)
    expect(cards.find((card) => card.wpId === 6427)?.href).toBe('https://titanium.com/metalproducts/round-bar/')
    expect(cards.find((card) => card.wpId === 6427)?.bodyEmpty).toBe(false)
  })

  it('turns the oil-gas grid into quarter-width picture cards', () => {
    const parsed = parseAviaHtml(NOW_HTML, createIdFactory(), [], cards)
    expect(parsed.families).toContain('portfolio-picture-cards')
    expect(parsed.families).not.toContain('portfolio-grid-blocked')
    expect(parsed.sourceOnly.some((region) => region.label === 'Product grid')).toBe(false)
    expect(parsed.rows.map((row) => row.preset)).toEqual(['full', 'full', 'quarters', 'quarter-trio'])
    const pictures = parsed.rows.flatMap((row) =>
      row.columns.flatMap((column) => column.items.filter((item) => item.kind === 'picture')),
    )
    expect(pictures.map((picture) => picture.alt)).toEqual(cards.map((card) => card.title))
    expect(pictures.map((picture) => picture.src)).toEqual(cards.map((card) => card.imageUrl))
    expect(pictures.map((picture) => picture.href)).toEqual(cards.map((card) => card.href))
    const quote = parsed.rows[0]?.columns[0]?.items.find((item) => item.kind === 'button')
    expect(quote && quote.kind === 'button' ? quote.href : '').toBe('https://qqa.titanium.com/customer/quick-quote')
  })

  it('does not copy oil-gas cards onto another market page', () => {
    const other = NOW_HTML.replaceAll('https://titanium.com/oil-gas/', 'https://titanium.com/markets/aerospace/')
    const parsed = parseAviaHtml(other, createIdFactory(), [], cards)
    expect(parsed.rows.some((row) => row.preset === 'quarters')).toBe(false)
    expect(parsed.sourceOnly.some((region) => region.label === 'Product grid')).toBe(true)
  })

  it('leaves a different product grid locked', () => {
    const other = NOW_HTML.replace('oil-gas_sort', 'aerospace_sort')
    const parsed = parseAviaHtml(other, createIdFactory(), [], cards)
    expect(parsed.sourceOnly.some((region) => region.label === 'Product grid')).toBe(true)
    expect(parsed.rows.some((row) => row.preset === 'quarters')).toBe(false)
  })

  it('keeps Create Quote as words when the button has no link', () => {
    const html = NOW_HTML.replace('href="https://qqa.titanium.com/customer/quick-quote"', 'href=""')
    const parsed = parseAviaHtml(html, createIdFactory(), [], null)
    const first = parsed.rows[0]?.columns[0]?.items ?? []
    expect(first.some((item) => item.kind === 'button')).toBe(false)
    expect(first.some((item) => item.kind === 'text' && item.blocks.some((block) => block.text === 'Create Quote'))).toBe(true)
  })

  it('uses the live quarter width for four-across cards and the leftover row', () => {
    expect(PRESETS.quarters.columns.map((column) => [column.widthPercent, column.marginLeftPercent])).toEqual([
      [20.5, 0],
      [20.5, 6],
      [20.5, 6],
      [20.5, 6],
    ])
    expect(PRESETS['quarter-trio'].columns.map((column) => column.widthPercent)).toEqual([20.5, 20.5, 20.5])
  })

  it('keeps a text block that sits between columns', () => {
    const html = `<!doctype html><html><head><title>Contact</title><meta name="description" content="Contact"><link rel="canonical" href="https://titanium.com/contact-us/"><meta property="og:title" content="Contact"><meta property="og:description" content="Contact"></head><body>
<div class="entry-content-wrapper">
<div class="flex_column av_three_fifth flex_column_div first"><h1>Contact Us</h1></div>
<section class="av_textblock_section"><h1><a href="https://qqa.titanium.com/">Click Here to Create a Quick Quote Online!</a></h1></section>
</div>
<div class="entry-content-wrapper">
<div class="flex_column av_one_third flex_column_div first"><p>Rockaway, NJ</p></div>
<div class="flex_column av_one_third flex_column_div"><p>Birmingham, UK</p></div>
<div class="flex_column av_one_third flex_column_div"><p>Meerbusch, Germany</p></div>
</div>
</body></html>`
    const parsed = parseAviaHtml(html, createIdFactory())
    expect(parsed.rows.map((row) => row.preset)).toEqual(['lead-three-fifths', 'full', 'thirds'])
    const text = parsed.rows.flatMap((row) => row.columns.flatMap((column) => column.items.flatMap((item) => (item.kind === 'text' ? item.blocks.map((block) => block.text) : []))))
    expect(text.some((line) => line.includes('https://qqa.titanium.com/'))).toBe(true)
    expect(text.indexOf('Contact Us')).toBeLessThan(text.findIndex((line) => line.includes('Quick Quote')))
    expect(text.findIndex((line) => line.includes('Quick Quote'))).toBeLessThan(text.indexOf('Rockaway, NJ'))
  })

  it('keeps a plain story when the page has no columns', () => {
    const html = `<!doctype html><html><head><title>President</title><meta name="description" content="A note"><link rel="canonical" href="https://titanium.com/titanium-about-us/message-from-the-president/"><meta property="og:title" content="President"><meta property="og:description" content="A note"></head><body><div class="post-entry"><div class="entry-content-wrapper"><h1>Message from the President</h1><p><img class="alignleft" src="https://titanium.com/photo.jpg" alt="Brett Paddock" width="300">A note from the president.</p></div></div></body></html>`
    const parsed = parseAviaHtml(html, createIdFactory())
    expect(parsed.rows.map((row) => row.preset)).toEqual(['full'])
    const picture = parsed.rows[0]?.columns[0]?.items.find((item) => item.kind === 'picture')
    expect(picture && picture.kind === 'picture' ? picture.wrap : '').toBe('none')
    expect(parsed.rows.some((row) => row.preset === 'float-wrap')).toBe(false)
  })

  it('locks a news slider instead of copying the posts', () => {
    const html = `<!doctype html><html><head><title>Locations</title><meta name="description" content="Locations"><link rel="canonical" href="https://titanium.com/titanium-industries-global-metal-supplier-locations/"><meta property="og:title" content="Locations"><meta property="og:description" content="Locations"></head><body><div class="flex_column av_one_full flex_column_div first"><h1>Locations</h1></div><div class="avia-content-slider"><article class="slide-entry"><h3>A news post</h3><img data-src="https://titanium.com/news.jpg" alt="News"></article></div></body></html>`
    const parsed = parseAviaHtml(html, createIdFactory())
    expect(parsed.sourceOnly.some((region) => region.label === 'News slider')).toBe(true)
    expect(parsed.imageUrls).not.toContain('https://titanium.com/news.jpg')
    const text = parsed.rows.flatMap((row) => row.columns.flatMap((column) => column.items)).flatMap((item) => (item.kind === 'text' ? item.blocks.map((block) => block.text) : []))
    expect(text.join(' ')).not.toContain('A news post')
    expect(text.join(' ')).toContain('Locations')
  })
})
