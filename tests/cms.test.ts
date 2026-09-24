import { describe, expect, it } from 'vitest'
import { parityChecks } from '../shared/convert/parity'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { gateConversion } from '../shared/page-model/hash-gate'
import { setReadiness } from '../shared/page-model/readiness'
import { roundTripPageDocument } from '../shared/page-model/schema'
import { blockingSeoFailures, seoChecks } from '../shared/page-model/seo'
import { addItem, createIdFactory, setRowPreset } from '../shared/page-model/workspace'
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
<div class="flex_column av_two_third flex_column_div first"><h2>Intro</h2><p>Follow us [LinkedIn](https://www.linkedin.com/company/titanium-industries).</p><img data-src="https://titanium.com/wp-content/uploads/2023/07/Linkedin-300x300.png" alt="LinkedIn"></div>
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
    expect(html).toContain('Quality split')
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
})
