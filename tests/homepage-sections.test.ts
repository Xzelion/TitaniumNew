import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { homepageSectionsHtml, loadHomepageDraft } from '../shared/homepage/load'
import { parseHomepageSections } from '../shared/homepage/sections'
import { renderColumnsHtml } from '../shared/render/columns'

const fixture = `<!doctype html><html><head>
<title>Home title</title>
<meta name="description" content="Home description">
<link rel="canonical" href="https://titanium.com/">
</head><body>
<div class="entry-content-wrapper">
  <section class="avia_codeblock_section"><div id="layerslider_3"><div class="ls-slide"><h1>CREATE QUOTE!</h1></div></div></section>
  <div class="flex_column av_one_full flex_column_div first">
    <div class="welcome"><h2>Welcome to Titanium Industries</h2><p>Decades of metal supply.</p></div>
  </div>
  <div class="flex_column av_one_third flex_column_div first column-top-margin"><a class="avia-button" href="https://qqa.titanium.com/quick-quote"><span class="avia_iconbox_title">Create Quote</span></a></div>
  <div class="flex_column av_one_third flex_column_div column-top-margin"><a class="avia-button" href="https://titanium.com/titanium-about-us/"><span class="avia_iconbox_title">Learn More</span></a></div>
  <div class="flex_column av_one_third flex_column_div column-top-margin"><a class="avia-button" href="https://titanium.com/rfq/"><span class="avia_iconbox_title">Submit RFQ</span></a></div>
  <section class="avia_codeblock_section"><div class="home-processing">
    <h4>Processing</h4>
    <p>Processing capabilities include:</p>
    <div class="home-processing-items">
      <div><img data-src="/wp-content/uploads/water.jpg" alt="Water Jet"><h4>Water Jet Cutting</h4><a href="/processing/water-jet-cutting/">Water Jet Cutting</a></div>
    </div>
  </div></section>
</div></body></html>`

describe('homepage sections under the slider', () => {
  it('drafts welcome, buttons, and processing without the rotator', () => {
    const page = parseHomepageSections(fixture, '2026-09-24T00:00:00.000Z')
    expect(page.path).toBe('/')
    expect(page.siteVisibility).toBe('private_draft')
    expect(page.publishedVersion).toBeNull()
    const html = renderColumnsHtml(page.rows)
    expect(html).toContain('Welcome to Titanium Industries')
    expect(html).toContain('Create Quote')
    expect(html).toContain('Water Jet Cutting')
    expect(html).not.toContain('CREATE QUOTE!')
    expect(page.provenance.remainingSourceOnly.map((note) => note.label)).toEqual(
      expect.arrayContaining(['Homepage slider', 'Shop and quote apps', 'Location map pins']),
    )
  })

  it('renders the seeded homepage on local and preview routes only', () => {
    const page = loadHomepageDraft()
    expect(page?.publishedVersion).toBeNull()
    expect(page?.siteVisibility).toBe('private_draft')
    const html = renderColumnsHtml(page!.rows)
    expect(html).toContain('Welcome to Titanium Industries')
    expect(html).toContain('Round Bar')
    expect(html).toContain('Processing')
    expect(html).toContain('Our Markets')
    expect(html).toContain('Aerospace')
    expect(html).toContain('Rockaway, NJ')
    expect(html).toContain('View All Locations')
    expect(html).not.toContain('CREATE QUOTE!')

    expect(homepageSectionsHtml({ dev: true, pathname: '/' })).toContain('Welcome to Titanium Industries')
    expect(homepageSectionsHtml({ dev: false, pathname: '/' })).toBeNull()
    expect(homepageSectionsHtml({ dev: false, pathname: '/about' })).toBeNull()
    expect(homepageSectionsHtml({ dev: false, pathname: '/preview/home' })).toContain('Our Markets')
    expect(homepageSectionsHtml({ dev: false, pathname: '/editor/home' })).toContain('Round Bar')
  })

  it('falls back when the homepage draft is missing', () => {
    const missing = path.join(mkdtempSync(path.join(tmpdir(), 'home-')), 'home.json')
    expect(loadHomepageDraft(missing)).toBeNull()
    expect(homepageSectionsHtml({ dev: true, pathname: '/' }, missing)).toBeNull()
    const broken = path.join(mkdtempSync(path.join(tmpdir(), 'home-')), 'home.json')
    writeFileSync(broken, '{')
    expect(loadHomepageDraft(broken)).toBeNull()
  })
})
