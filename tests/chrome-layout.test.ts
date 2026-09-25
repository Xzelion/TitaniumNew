import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { shouldRenderSiteChrome } from '../shared/chrome/gate'
import { loadSiteChrome, siteChromeForPage } from '../shared/chrome/load'
import { renderChromeFooter, renderChromeHeader, renderChromeHero } from '../shared/chrome/render'

describe('site chrome layout', () => {
  it('returns null when the chrome file is missing', () => {
    const missing = path.join(mkdtempSync(path.join(tmpdir(), 'chrome-')), 'missing.json')
    expect(loadSiteChrome(missing)).toBeNull()
    expect(siteChromeForPage({ dev: true, pathname: '/' }, missing)).toBeNull()
  })

  it('shows unpublished chrome on local dev and preview routes only', () => {
    const unpublished = { publishedToSite: false }
    expect(shouldRenderSiteChrome(null, { dev: true, pathname: '/' })).toBe(false)
    expect(shouldRenderSiteChrome({ publishedToSite: true }, { dev: false, pathname: '/' })).toBe(true)
    expect(shouldRenderSiteChrome(unpublished, { dev: true, pathname: '/' })).toBe(true)
    expect(shouldRenderSiteChrome(unpublished, { dev: false, pathname: '/' })).toBe(false)
    expect(shouldRenderSiteChrome(unpublished, { dev: false, pathname: '/about' })).toBe(false)
    expect(shouldRenderSiteChrome(unpublished, { dev: false, pathname: '/preview/chrome' })).toBe(true)
    expect(shouldRenderSiteChrome(unpublished, { dev: false, pathname: '/editor/careers' })).toBe(true)
  })

  it('renders the seeded header, footer, and six homepage slides', () => {
    const chrome = loadSiteChrome()
    expect(chrome).not.toBeNull()
    expect(chrome?.publishedToSite).toBe(false)

    const header = renderChromeHeader(chrome!)
    expect(header).toContain('data-site-chrome="header"')
    expect(header).toContain('MILL PRODUCTS')
    expect(header).toContain('mailto:sales@titanium.com')
    expect(header).not.toContain('Browse Alloys')

    const footer = renderChromeFooter(chrome!)
    expect(footer).toContain('data-site-chrome="footer"')
    expect(footer).toContain('Copyright 2021 Titanium Industries')

    const hero = renderChromeHero(chrome!)
    expect(hero).toContain('data-site-chrome="hero"')
    expect(hero).toContain('Full Line of Multi-Metals')
    expect(hero).toContain('Processing Services')
    expect(hero).toContain('Our Markets')
    expect(hero).toContain('Quality Systems')
    expect(hero).not.toContain('Distribution Excellence')
    expect(hero.match(/data-chrome-slide="/g)?.length).toBe(6)

    const local = siteChromeForPage({ dev: true, pathname: '/' })
    expect(renderChromeHeader(local!)).toContain('MILL PRODUCTS')
    expect(siteChromeForPage({ dev: false, pathname: '/' })).toBeNull()
    expect(siteChromeForPage({ dev: false, pathname: '/preview/chrome' })?.heroSlides).toHaveLength(6)
  })

  it('restores the review mega-menu and keeps submenus closed', () => {
    const header = readFileSync(path.join(process.cwd(), 'src/components/review-site-header.html'), 'utf8')
    const css = readFileSync(path.join(process.cwd(), 'src/styles/review-header.css'), 'utf8')
    const layout = readFileSync(path.join(process.cwd(), 'src/layouts/Layout.astro'), 'utf8')
    expect(header).toContain('<mega-menu class="site-header">')
    expect(header).toContain('class="site-topbar"')
    expect(header).toContain('class="site-navband"')
    expect(header).toContain('class="menu-submenu"')
    expect(header).toContain('/wp-content/uploads/2016/10/titanium_LOGO_rgb_KO-274x300.png')
    expect(header).not.toContain('<details')
    expect(header).not.toContain('chrome-mega')
    expect(css).toContain('mega-menu .main-nav .menu-list--depth-1 > .menu-item > .menu-submenu')
    expect(css).toContain('display: none')
    expect(css).not.toContain('display:block!important')
    expect(css).toContain('.main-nav .menu-list--depth-1{justify-content:space-between}')
    expect(css).toContain('.site-topbar-inner{flex-wrap:nowrap;justify-content:flex-start')
    expect(css).not.toContain('justify-content: center')
    expect(layout).toContain('ReviewSiteHeader')
    expect(layout).not.toContain('renderChromeHeader')
  })

  it('falls back when the chrome file is not a valid document', () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'chrome-')), 'site-chrome.json')
    writeFileSync(file, '{')
    expect(loadSiteChrome(file)).toBeNull()
    expect(siteChromeForPage({ dev: true, pathname: '/' }, file)).toBeNull()
  })
})
