import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeCloudflareEmail, parseLiveChrome } from '../shared/chrome/parse-live'
import { ChromeSchemaError, parseSiteChrome } from '../shared/chrome/schema'

const fixture = `<!doctype html><html><head>
<title>Home</title>
<link rel="canonical" href="https://titanium.com/">
</head><body>
<header id="header">
  <a href="/"><img data-src="https://titanium.com/logo.png" alt="Titanium Industries"></a>
  <a class="header-contact-phone" href="tel:+18884826486">1-88-TITANIUM (1-888-482-6486)</a>
  <span data-cfemail="9fecfef3faecdfebf6ebfef1f6eaf2b1fcf0f2"></span>
  <a href="/shop/">Shop Now</a>
  <ul id="mega-menu-avia">
    <li><a href="https://qqa.titanium.com/">CREATE QUOTE</a></li>
    <li><a href="/contact-us/">CONTACT US</a>
      <ul>
        <li><a href="/rfq/">RFQ Submission</a></li>
        <li><a href="https://titanium.com/titanium-about-us/">About Us</a>
          <ul><li><a href="https://titanium.com/careers/">Career Center</a></li></ul>
        </li>
      </ul>
    </li>
    <li><a href="https://titanium.com/markets/">MARKETS</a>
      <ul><li><a href="https://titanium.com/markets/firearms/">Firearms</a></li></ul>
    </li>
    <li><a href="#">Menu</a></li>
  </ul>
</header>
<div class="entry-content-wrapper">
  <div class="ls-slide">
    <img class="ls-bg" data-src="https://titanium.com/wp-content/uploads/banner.png" alt="">
    <div class="ls-l"><h1>Full Line of Multi-Metals</h1></div>
    <div class="ls-l">T.I. is the global leader in specialty metals distribution.</div>
    <div class="ls-l"><a href="https://titanium.com/processing/">Learn More</a></div>
  </div>
  <div class="ls-slide">
    <img class="ls-bg" data-src="https://titanium.com/wp-content/uploads/quote.png" alt="">
    <div class="ls-l"><a href="https://qqa.titanium.com/">CREATE QUOTE!</a></div>
  </div>
</div>
<footer id="footer">
  <div class="widget"><ul>
    <li><a href="#">Mill Products</a>
      <ul><li><a href="https://titanium.com/metalproducts/round-bar/">Round Bar</a></li></ul>
    </li>
  </ul></div>
  <div class="widget"><a href="https://twitter.com/TI_Industries">Twitter</a></div>
</footer>
<div id="socket">Copyright 2021 Titanium Industries, Inc. All Rights Reserved - <a href="https://kriesi.at">Enfold Theme by Kriesi</a></div>
</body></html>`

describe('site chrome', () => {
  it('decodes the public header email', () => {
    expect(decodeCloudflareEmail('9fecfef3faecdfebf6ebfef1f6eaf2b1fcf0f2')).toBe('sales@titanium.com')
  })

  it('turns the live header, menu, footer, and hero into editable fields', () => {
    const chrome = parseSiteChrome(parseLiveChrome(fixture))
    expect(chrome.publishedToSite).toBe(false)
    expect(chrome.siteVisibility).toBe('private_draft')
    expect(chrome.phone.href).toBe('tel:+18884826486')
    expect(chrome.email).toEqual({ label: 'sales@titanium.com', href: 'mailto:sales@titanium.com' })
    expect(chrome.utilityLinks).toEqual([{ label: 'Shop Now', href: 'https://titanium.com/shop/' }])
    expect(chrome.navigation.map((item) => item.label)).toEqual(['CREATE QUOTE', 'CONTACT US', 'MARKETS'])
    const about = chrome.navigation[1]?.groups.find((group) => group.label === 'About Us')
    expect(about?.links[0]).toEqual({ label: 'Career Center', href: 'https://titanium.com/careers/' })
    expect(chrome.navigation.some((item) => item.groups.some((group) => group.label === 'Firearms'))).toBe(true)
    expect(chrome.heroSlides[0]).toMatchObject({
      headline: 'Full Line of Multi-Metals',
      subcopy: 'T.I. is the global leader in specialty metals distribution.',
      backgroundImage: 'https://titanium.com/wp-content/uploads/banner.png',
    })
    expect(chrome.heroSlides[0]?.callsToAction[0]?.label).toBe('Learn More')
    expect(chrome.heroSlides[1]?.headline).toBe('CREATE QUOTE!')
    expect(chrome.footerColumns[0]?.groups[0]?.links[0]?.label).toBe('Round Bar')
    expect(chrome.badges).toEqual([])
    expect(chrome.socialLinks[0]?.label).toBe('Twitter')
    expect(chrome.legalText).toContain('Copyright 2021 Titanium Industries')
    expect(existsSync(path.join(process.cwd(), 'migration/drafts/firearms.json'))).toBe(false)
  })

  it('refuses a published chrome document', () => {
    const chrome = parseLiveChrome(fixture)
    expect(() => parseSiteChrome({ ...chrome, publishedToSite: true })).toThrow(ChromeSchemaError)
  })

  it('keeps the seeded live chrome private', () => {
    const file = path.join(process.cwd(), 'migration/chrome/site-chrome.json')
    const chrome = parseSiteChrome(JSON.parse(readFileSync(file, 'utf8')))
    expect(chrome.heroSlides.length).toBeGreaterThanOrEqual(6)
    expect(chrome.navigation.map((item) => item.label)).toEqual(
      expect.arrayContaining(['MILL PRODUCTS', 'ALLOYS', 'MARKETS', 'PROCESSING']),
    )
    expect(chrome.heroSlides.map((slide) => slide.headline)).toEqual(
      expect.arrayContaining(['Full Line of Multi-Metals', 'Processing Services', 'Our Markets', 'Quality Systems']),
    )
    expect(chrome.email.href).toBe('mailto:sales@titanium.com')
    expect(chrome.badges.length).toBe(6)
    expect(chrome.publishedToSite).toBe(false)
  })
})
