import { describe, expect, it } from 'vitest'
import { parityChecks } from '../shared/convert/parity'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { gateConversion } from '../shared/page-model/hash-gate'
import { setReadiness } from '../shared/page-model/readiness'
import { roundTripPageDocument } from '../shared/page-model/schema'
import { blockingSeoFailures, seoChecks } from '../shared/page-model/seo'
import { ledgerForDocument, planningEntries } from '../shared/page-model/ledger'
import { nestedReviewMisses } from '../shared/page-model/review'
import { addItem, createIdFactory, duplicateItem, placeItem, setRowPreset } from '../shared/page-model/workspace'
import { renderColumnsHtml } from '../shared/render/columns'
import { renderWorkspace } from '../shared/editor/render-workspace'

const NOW = '2026-09-24T00:00:00.000Z'

const qualityHtml = `<!doctype html><html><head>
<title>Quality System - Titanium Industries</title>
<meta name="description" content="T.I.’s Industry Leading Quality System delivers guaranteed reliability with a full range of approvals.">
<link rel="canonical" href="https://titanium.com/quality-systems/">
<meta property="og:title" content="Quality System - Titanium Industries">
<meta property="og:description" content="T.I.’s Industry Leading Quality System delivers guaranteed reliability with a full range of approvals.">
<meta property="og:image" content="https://titanium.com/quality.jpg">
</head><body><div class="entry-content">
<div class="flex_column av_one_third flex_column_div first"><a class="avia-button" href="https://titanium.com/contact-us/">Contact Us</a></div>
<div class="flex_column av_one_third flex_column_div"><a class="avia-button" href="https://qqa.titanium.com/">Create Quote</a></div>
<div class="flex_column av_one_third flex_column_div"><a class="avia-button" href="https://titanium.com/shop">Shop Now</a></div>
<div class="flex_column av_two_fifth flex_column_div first column-top-margin"><h2>Quality Approvals</h2><p>AS9100D with ISO 9001.</p></div>
<div class="flex_column av_three_fifth flex_column_div column-top-margin"><p>Guaranteed reliability for every shipment.</p></div>
<div class="flex_column av_two_third flex_column_div first"><h2>Intro</h2><p>Follow us <a href="https://www.linkedin.com/company/titanium-industries">LinkedIn</a>.</p><a href="https://www.instagram.com/titaniumindustries/"><img data-src="https://titanium.com/wp-content/uploads/2023/07/Instagram-300x300.png" width="59" alt="Instagram" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></a></div>
<div class="flex_column av_one_third flex_column_div"><a href="https://titanium.com/line-card.pdf">Oil Line Card | Download Now</a></div>
</div></body></html>`

const waterjetHtml = `<!doctype html><html><head>
<title>Water Jet</title>
<meta name="description" content="Precision water jet cutting services for specialty metals at Titanium Industries.">
<link rel="canonical" href="https://titanium.com/processing/water-jet-cutting/">
<meta property="og:title" content="Water Jet"><meta property="og:description" content="Precision water jet cutting services for specialty metals at Titanium Industries.">
<style>
@media all and (min-width: 768px) {
.avia-image-container { display: inline; width: 40%; margin-top: 20px !important; }
.av_textblock_section { float: left; width: 55%; }
}
</style>
</head><body><div class="entry-content">
<div class="flex_column av_one_full flex_column_div first">
  <div class="avia-image-container avia-align-left"><img data-src="/wp-content/uploads/2019/11/water-jet-600.jpg" alt="Water Jet cutting"></div>
  <div class="av_textblock_section"><h1>Titanium Industries Water Jet Cutting Service</h1><p>Precise cutting tolerances.</p></div>
</div>
</div></body></html>`

const medicalHtml = `<!doctype html><html><head>
<title>Medical</title>
<meta name="description" content="Performance metals for implants and trauma applications from Titanium Industries.">
<link rel="canonical" href="https://titanium.com/markets/medical/">
<meta property="og:title" content="Medical"><meta property="og:description" content="Performance metals for implants and trauma applications from Titanium Industries.">
<style>.left { float: left; margin: 8px 16px 0 0; } .right { float: right; margin: 8px 0 0 16px; }</style>
</head><body><div class="entry-content">
<div class="flex_column av_one_full flex_column_div first">
  <h2>Spinal Implants</h2>
  <p><img class="right lazyload" data-src="/wp-content/uploads/2019/11/spinal.jpg" alt="Spinal">Metals used in spinal fixation.</p>
</div>
<div class="flex_column av_one_half flex_column_div first"><p>Supply chain</p></div>
<div class="flex_column av_one_half flex_column_div"><p>Demand aggregation</p></div>
</div></body></html>`

function convert(html: string) {
  const ids = createIdFactory()
  const parsed = parseAviaHtml(html, ids)
  return { parsed, page: toPageDocument(parsed, NOW) }
}

describe('schema round trip', () => {
  it('keeps a converted page identical after serialize and parse', () => {
    const { page } = convert(qualityHtml)
    expect(roundTripPageDocument(page)).toEqual(page)
    expect(page.siteVisibility).toBe('private_draft')
  })

  it('rejects a picture that smuggles in body text', () => {
    const { page } = convert(qualityHtml)
    const broken = structuredClone(page) as unknown as { rows: Array<{ columns: Array<{ items: unknown[] }> }> }
    broken.rows[0].columns[0].items[0] = { id: 'bad', kind: 'picture', src: '', alt: '', href: '', wrap: 'none', body: 'nope' }
    expect(() => roundTripPageDocument(broken as never)).toThrow(/body text/)
  })
})

describe('family converters', () => {
  it('builds the equal CTA row, quality split, and intro line card', () => {
    const { page } = convert(qualityHtml)
    expect(page.provenance.families).toEqual(expect.arrayContaining(['equal-3-cta', 'quality-split', 'intro-two-one-linecard']))
    expect(page.provenance.grid).toContain('thirds')
    expect(page.provenance.grid).toContain('quality-split')
    expect(page.provenance.grid).toContain('two-one')
    expect(page.rows.find((row) => row.preset === 'quality-split')?.spaceAbove).toBe(true)
  })

  it('keeps water jet on the measured split instead of equal columns', () => {
    const { page } = convert(waterjetHtml)
    const row = page.rows.find((item) => item.preset === 'waterjet-split')
    expect(row).toBeTruthy()
    expect(row?.columns).toHaveLength(2)
    expect(row?.columns[1].items.some((item) => item.kind === 'picture')).toBe(true)
    expect(page.rows.some((item) => item.preset === 'thirds')).toBe(false)
    const html = renderColumnsHtml(page.rows)
    expect(html).toContain('width: 55%')
    expect(html).toContain('width: 40%')
    expect(html).toContain('margin-right: 15px')
    expect(html).toContain('margin-top: 20px')
  })

  it('keeps medical pictures in a float wrap instead of equal columns', () => {
    const { page } = convert(medicalHtml)
    const wrapped = page.rows.find((row) => row.preset === 'float-wrap')
    expect(wrapped?.columns).toHaveLength(1)
    const picture = wrapped?.columns[0].items.find((item) => item.kind === 'picture')
    expect(picture && picture.kind === 'picture' ? picture.wrap : '').toBe('right')
    expect(page.rows.some((row) => row.preset === 'halves')).toBe(true)
    expect(renderColumnsHtml(page.rows)).toContain('float: right')
    expect(renderColumnsHtml(page.rows)).not.toContain('data-preset="thirds"')
  })

  it('keeps a measured processing page on the 55/40 split and leaves social icons with the words', () => {
    const html = `<!doctype html><html><head>
<title>Saw Cutting</title>
<meta name="description" content="Saw cutting services for specialty metals at Titanium Industries.">
<link rel="canonical" href="https://titanium.com/processing/saw-cutting/">
<meta property="og:title" content="Saw Cutting"><meta property="og:description" content="Saw cutting services for specialty metals at Titanium Industries.">
<style>
@media all and (min-width: 768px) {
.avia-image-container { display: inline; width: 40%; margin-top: 20px !important; }
.av_textblock_section { float: left; width: 55%; }
}
</style>
</head><body><div class="entry-content">
<div class="flex_column av_one_third flex_column_div first"><a class="avia-button" href="https://titanium.com/contact-us/">Contact Us</a></div>
<div class="flex_column av_one_third flex_column_div"><a class="avia-button" href="https://qqa.titanium.com/">Create Quote</a></div>
<div class="flex_column av_one_third flex_column_div"><a class="avia-button" href="https://qqa.titanium.com/product">Shop Now</a></div>
<div class="flex_column av_one_full flex_column_div first">
  <div class="avia-image-container avia-align-left"><img data-src="/wp-content/uploads/2019/11/saw-cutting-600.jpg" alt="Saw Cutting"></div>
  <section class="av_textblock_section"><h1>Saw Cutting Services for Metal</h1><p>Band saw cutting.</p>
    <a href="https://www.instagram.com/titaniumindustries/"><img data-src="https://titanium.com/wp-content/uploads/2023/07/Instagram-300x300.png" width="59" alt="Instagram"></a>
  </section>
</div>
</div></body></html>`
    const { page } = convert(html)
    expect(page.provenance.families).toEqual(expect.arrayContaining(['equal-3-cta', 'waterjet-measured']))
    const row = page.rows.find((item) => item.preset === 'waterjet-split')
    expect(row?.columns[1].items.some((item) => item.kind === 'picture' && item.alt === 'Saw Cutting')).toBe(true)
    const words = row?.columns[0].items ?? []
    const icon = words.find((item) => item.kind === 'picture')
    expect(icon && icon.kind === 'picture' ? icon.displayPx : 0).toBe(59)
    expect(page.rows.some((item) => item.preset === 'thirds')).toBe(true)
    expect(parityChecks(convert(html).parsed, page).every((check) => check.pass)).toBe(true)
  })

  it('does not copy the water-jet split onto a column that only borrowed the CSS', () => {
    const html = `<!doctype html><html><head>
<title>Heat Treating</title>
<meta name="description" content="Heat treating for specialty metals at Titanium Industries.">
<link rel="canonical" href="https://titanium.com/processing/heat-treating/">
<meta property="og:title" content="Heat Treating"><meta property="og:description" content="Heat treating for specialty metals at Titanium Industries.">
<style>@media all and (min-width: 768px) {
.avia-image-container { width: 40%; margin-top: 20px !important; }
.av_textblock_section { float: left; width: 55%; }
}</style>
</head><body>
<div class="flex_column av_three_fourth flex_column_div first">
  <section class="av_textblock_section"><h1>Heat Treating Metal</h1><p>Hardening and tempering.</p></section>
</div>
</body></html>`
    const { parsed, page } = convert(html)
    expect(page.rows.map((row) => row.preset)).toEqual(['lead-three-quarters'])
    expect(page.provenance.families).toContain('inner-width-not-split')
    expect(page.provenance.remainingSourceOnly.map((region) => region.label)).toContain('Text width inside the column')
    expect(parityChecks(parsed, page).find((check) => check.name === 'Inner text width')?.pass).toBe(true)
  })

  it('keeps a two-fifths picture column when the same CSS is present', () => {
    const html = `<!doctype html><html><head>
<title>Coil Slitting</title>
<meta name="description" content="Coil slitting for specialty metals at Titanium Industries.">
<link rel="canonical" href="https://titanium.com/processing/coil-slitting/">
<meta property="og:title" content="Coil Slitting"><meta property="og:description" content="Coil slitting for specialty metals at Titanium Industries.">
<style>.av_textblock_section{float:left;width:55%}.avia-image-container{width:40%;margin-top:20px}</style>
</head><body>
<div class="flex_column av_two_fifth flex_column_div first"><div class="avia-image-container"><img data-src="/wp-content/uploads/2019/11/coil-600.jpg" alt="Coil"></div></div>
<div class="flex_column av_three_fifth flex_column_div"><section class="av_textblock_section"><h2>Custom Metal Coil Slitting</h2></section></div>
</body></html>`
    const { page } = convert(html)
    expect(page.rows.map((row) => row.preset)).toEqual(['quality-split'])
    expect(page.provenance.families).toContain('quality-split')
    expect(page.provenance.families).not.toContain('waterjet-measured')
  })

  it('locks a 24% card grid instead of stacking the pictures', () => {
    const html = `<!doctype html><html><head>
<title>Markets</title>
<meta name="description" content="Markets served by Titanium Industries.">
<link rel="canonical" href="https://titanium.com/markets/">
<meta property="og:title" content="Markets"><meta property="og:description" content="Markets served by Titanium Industries.">
</head><body>
<div class="flex_column av_one_full flex_column_div first">
  <h1>Markets for Global Specialty Metal Supply</h1>
</div>
<section class="avia_codeblock_section"><div class="avia_codeblock"><div class="home-markets"><div class="home-markets-items"><div>
  <img data-src="https://titanium.com/wp-content/uploads/2019/10/aerospace-v1.png" alt="Aerospace">
  <h4>Aerospace</h4>
  <a href="https://titanium.com/markets/aerospace/">Aerospace</a>
</div></div></div></div></section>
</body></html>`
    const { parsed, page } = convert(html)
    expect(page.provenance.families).toContain('custom-card-grid-blocked')
    const pictures = page.rows.flatMap((row) => row.columns.flatMap((column) => column.items.filter((item) => item.kind === 'picture')))
    expect(pictures).toEqual([])
    expect(JSON.stringify(page.rows)).toContain('Markets for Global Specialty Metal Supply')
    expect(parsed.imageUrls).not.toContain('https://titanium.com/wp-content/uploads/2019/10/aerospace-v1.png')
    expect(parityChecks(parsed, page).find((check) => check.name === 'Card grid locked')?.pass).toBe(true)
  })

  it('refuses to turn an unmapped width into a full-width row', () => {
    const html = `<!doctype html><html><head>
<title>Industrial</title>
<meta name="description" content="Industrial markets at Titanium Industries.">
<link rel="canonical" href="https://titanium.com/markets/industrial/">
<meta property="og:title" content="Industrial"><meta property="og:description" content="Industrial markets at Titanium Industries.">
</head><body>
<div class="flex_column av_one_seventh flex_column_div first"><p>Round bar</p></div>
<div class="flex_column av_one_seventh flex_column_div"><p>Plate</p></div>
</body></html>`
    const { parsed, page } = convert(html)
    expect(page.rows).toEqual([])
    expect(page.provenance.remainingSourceOnly[0]?.label).toBe('Unmapped columns')
    expect(JSON.stringify(page)).not.toContain('Round bar')
    expect(parityChecks(parsed, page).find((check) => check.name === 'Unmapped columns')?.pass).toBe(false)
  })

  it('does not overwrite a draft a person has edited', () => {
    const { page } = convert(qualityHtml)
    const edited = structuredClone(page)
    edited.editedByHuman = true
    edited.title = 'Changed by marketing'
    const rebuilt = structuredClone(page)
    rebuilt.provenance.sourceHash = 'different'
    const gated = gateConversion(edited, rebuilt)
    expect(gated.action).toBe('skip')
    expect(gated.draft.title).toBe('Changed by marketing')
  })

  it('matches live SEO on the fixture', () => {
    const { parsed, page } = convert(qualityHtml)
    const checks = parityChecks(parsed, page)
    expect(checks.find((check) => check.name === 'SEO title')?.pass).toBe(true)
    expect(checks.find((check) => check.name === 'Canonical')?.pass).toBe(true)
    expect(checks.find((check) => check.name === 'Links')?.pass).toBe(true)
  })
})

describe('layout readiness and SEO language', () => {
  it('names the three readiness states and blocks publishing too early', () => {
    const { page } = convert(qualityHtml)
    const html = renderWorkspace(page, null, null)
    expect(html).toContain('Layout editing')
    expect(html).toContain('Visual check')
    expect(html).toContain('Published version')
    const tooSoon = setReadiness(page, 'published', NOW)
    expect(tooSoon.error).toMatch(/visual check/i)
    expect(tooSoon.page.publishedVersion).toBeNull()
    const checked = setReadiness(page, 'visual_check', NOW).page
    const published = setReadiness(checked, 'published', NOW)
    expect(published.error).toBeNull()
    expect(published.page.readiness).toBe('published')
    expect(published.page.publishedVersion?.publishedAt).toBe(NOW)
    expect(published.page.siteVisibility).toBe('private_draft')
  })

  it('explains search fields in plain language', () => {
    const { page } = convert(qualityHtml)
    const labels = seoChecks(page.seo).map((check) => check.label)
    expect(labels).toEqual([
      'Page title in Google',
      'Short description',
      'Preferred web address',
      'Social share title',
      'Social share description',
      'Social share image',
    ])
    expect(blockingSeoFailures({ ...page.seo, title: '', description: '', canonical: '' }).length).toBeGreaterThan(0)
  })
})

describe('column workspace', () => {
  it('adds a picture without a body field and shows illustrated presets', () => {
    const { page } = convert(qualityHtml)
    const row = page.rows[0]
    const column = row.columns[0]
    const added = addItem(page, row.id, column.id, 'picture', createIdFactory(50))
    const picture = added.page.rows[0].columns[0].items.at(-1)
    expect(picture?.kind).toBe('picture')
    expect(picture && 'blocks' in picture).toBe(false)
    const html = renderWorkspace(added.page, added.focus, null)
    expect(html).toContain('Picture address')
    expect(html).toContain('Description of the picture')
    expect(html).not.toContain('data-field="body"')
    expect(html).toContain('Three equal columns')
    expect(html).toContain('Quality: narrow left / wide right')
    expect(html).toContain('Full width')
    expect(html).toContain('Two equal columns')
    expect(html).toContain('Wide left / narrow right')
    expect(html).toContain('Narrow left / wide right')
    expect(html).toContain('Planned / awaiting integration')
    expect(html).toContain('ti-bars')
    expect(html).toContain('Rows and columns')
  })

  it('reshapes a row to the quality split and keeps the words', () => {
    const { page } = convert(waterjetHtml)
    const row = page.rows[0]
    const ids = createIdFactory(80)
    const next = setRowPreset(page, row.id, 'quality-split', ids)
    const split = next.rows[0]
    expect(split.preset).toBe('quality-split')
    expect(split.columns).toHaveLength(2)
    const text = JSON.stringify(split)
    expect(text).toContain('Precise cutting tolerances')
  })

  it('keeps a linked icon at its live pixel size and can move or duplicate it', () => {
    const { page } = convert(qualityHtml)
    const row = page.rows.find((item) => item.columns.some((column) => column.items.some((entry) => entry.kind === 'picture')))
    if (!row) throw new Error('missing picture row')
    const sourceColumn = row.columns.find((column) => column.items.some((entry) => entry.kind === 'picture'))
    const target = row.columns.find((column) => column !== sourceColumn)
    const picture = sourceColumn?.items.find((entry) => entry.kind === 'picture')
    if (!sourceColumn || !target || !picture || picture.kind !== 'picture') throw new Error('missing columns')
    expect(picture.displayPx).toBe(59)
    expect(picture.href).toContain('instagram.com')
    expect(renderColumnsHtml([row])).toContain('width:59px')
    const moved = placeItem(page, { rowId: row.id, columnId: sourceColumn.id, itemId: picture.id }, row.id, target.id)
    expect(moved.rows.find((item) => item.id === row.id)?.columns.find((column) => column.id === target.id)?.items.some((entry) => entry.id === picture.id)).toBe(true)
    const copied = duplicateItem(moved, { rowId: row.id, columnId: target.id, itemId: picture.id }, createIdFactory(90))
    const ids = copied.page.rows.flatMap((item) => item.columns.flatMap((column) => column.items.map((entry) => entry.id)))
    expect(new Set(ids).size).toBe(ids.length)
    expect(copied.focus.itemId).not.toBe(picture.id)
  })

  it('still finds approval numbers after they move inside a column', () => {
    const { page } = convert(qualityHtml)
    expect(nestedReviewMisses(['AS9100D', 'https://titanium.com/line-card.pdf'], page)).toEqual([])
  })

  it('does not call a local candidate ready or hosted', () => {
    const { page } = convert(qualityHtml)
    const entry = ledgerForDocument(page)
    expect(entry.layoutEditing).toBe('Planned / awaiting integration')
    expect(entry.visualCheck).toBe('Not yet verified')
    expect(entry.publishedVersion).toBe('No published version')
    expect(planningEntries().map((item) => item.layoutEditing)).toEqual(['Not yet verified', 'Not yet verified'])
    const edited = structuredClone(page)
    edited.editedByHuman = true
    expect(ledgerForDocument(edited).visualCheck).toBe('Needs recheck')
  })
})
