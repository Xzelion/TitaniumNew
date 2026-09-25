import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderChromeHero } from '../shared/chrome/render'
import { loadSiteChrome } from '../shared/chrome/load'
import { parseSiteChrome } from '../shared/chrome/schema'
import { exportChromeDocument, exportHomepageFromPage, isHomepageAdminSave } from '../shared/cms-export/write'
import { homepageSectionsHtml, loadHomepageDraft } from '../shared/homepage/load'
import { parsePageDocument } from '../shared/page-model/schema'

const chromeFile = path.join(process.cwd(), 'migration/chrome/site-chrome.json')
const homeFile = path.join(process.cwd(), 'migration/drafts/home.json')

function tempPath(name: string): string {
  return path.join(mkdtempSync(path.join(tmpdir(), 'cms-export-')), name)
}

describe('admin save exports the JSON Astro reads', () => {
  it('writes a Payload site chrome save as unpublished chrome', () => {
    const file = tempPath('site-chrome.json')
    const written = exportChromeDocument(
      {
        id: 4,
        publishedToSite: true,
        siteVisibility: 'public',
        _status: 'draft',
        updatedAt: '2026-09-25T00:00:00.000Z',
        sourceUrl: 'https://titanium.com/',
        logo: { src: 'https://titanium.com/logo.png', alt: 'Titanium Industries', href: 'https://titanium.com/', id: 'logo' },
        phone: { label: '1-88-TITANIUM', href: 'tel:+18884826486', id: 'phone' },
        email: { label: 'sales@titanium.com', href: 'mailto:sales@titanium.com', id: 'email' },
        utilityLinks: [{ label: 'Shop Now', href: 'https://titanium.com/shop/', id: 'shop' }],
        navigation: [{ label: 'CREATE QUOTE', href: 'https://qqa.titanium.com/', id: 'nav', groups: [] }],
        footerColumns: [],
        badges: [],
        socialLinks: [],
        legalText: '© Titanium Industries',
        heroSlides: [
          {
            id: 'slide',
            headline: 'Saved in admin',
            subcopy: 'Still private',
            backgroundImage: 'https://titanium.com/banner.png',
            callsToAction: [{ label: 'Learn More', href: 'https://titanium.com/processing/', id: 'cta' }],
          },
        ],
        notes: [{ text: 'LayerSlider motion is not a field.', id: 'note' }],
      },
      file,
    )

    const chrome = loadSiteChrome(file)
    expect(written?.publishedToSite).toBe(false)
    expect(chrome?.id).toBe('site-chrome')
    expect(chrome?.siteVisibility).toBe('private_draft')
    expect(chrome?.heroSlides[0]?.headline).toBe('Saved in admin')
    expect(chrome?.notes).toEqual(['LayerSlider motion is not a field.'])
    expect(renderChromeHero(chrome!)).toContain('Saved in admin')
    expect(readFileSync(file, 'utf8')).not.toContain('"id": 4')
    expect(readFileSync(file, 'utf8')).not.toContain('public')
  })

  it('leaves the last chrome file in place when the save is invalid', () => {
    const file = tempPath('site-chrome.json')
    writeFileSync(file, '{"keep":true}\n')
    expect(exportChromeDocument({ id: 1, publishedToSite: true }, file)).toBeNull()
    expect(readFileSync(file, 'utf8')).toBe('{"keep":true}\n')
  })

  it('writes a homepage column save and keeps production public routes static', () => {
    const file = tempPath('home.json')
    const current = parsePageDocument(JSON.parse(readFileSync(homeFile, 'utf8')))
    const layout = structuredClone(current)
    const block = layout.rows[0]?.columns[0]?.items[0]
    if (!block || block.kind !== 'text') throw new Error('homepage welcome text is missing')
    const heading = block.blocks[0]
    if (!heading || heading.type !== 'heading') throw new Error('homepage welcome heading is missing')
    heading.text = 'Saved from admin'

    const written = exportHomepageFromPage(
      { id: 9, path: '/', title: layout.title, layout: { ...layout, siteVisibility: 'public' } },
      file,
    )
    const page = loadHomepageDraft(file)
    expect(written?.siteVisibility).toBe('private_draft')
    expect(page?.rows[0]?.columns[0]?.items[0]).toMatchObject({
      kind: 'text',
      blocks: [expect.objectContaining({ text: 'Saved from admin' })],
    })
    expect(homepageSectionsHtml({ dev: true, pathname: '/' }, file)).toContain('Saved from admin')
    expect(homepageSectionsHtml({ dev: false, pathname: '/preview/home/' }, file)).toContain('Saved from admin')
    expect(homepageSectionsHtml({ dev: false, pathname: '/editor/home/' }, file)).toContain('Saved from admin')
    expect(homepageSectionsHtml({ dev: false, pathname: '/' }, file)).toBeNull()

    const fromString = tempPath('home-string.json')
    const saved = exportHomepageFromPage({ path: '/about/', layout: JSON.stringify(layout) }, fromString)
    expect(isHomepageAdminSave({ path: '/about/', layout: JSON.stringify(layout) })).toBe(true)
    expect(isHomepageAdminSave({ path: '/careers/', layout: { id: 'careers', path: '/careers/' } })).toBe(false)
    expect(saved?.siteVisibility).toBe('private_draft')
    expect(loadHomepageDraft(fromString)?.path).toBe('/')
  })

  it('does not rewrite the homepage for another page or a broken homepage save', () => {
    const file = tempPath('home.json')
    writeFileSync(file, '{"keep":"home"}\n')
    const careers = parsePageDocument(JSON.parse(readFileSync(path.join(process.cwd(), 'migration/drafts/careers.json'), 'utf8')))
    expect(exportHomepageFromPage({ path: careers.path, layout: careers }, file)).toBeNull()
    expect(exportHomepageFromPage({ path: '/', layout: { id: 'home', path: '/' } }, file)).toBeNull()
    expect(readFileSync(file, 'utf8')).toBe('{"keep":"home"}\n')
  })

  it('round-trips the chrome and homepage files Astro already reads', () => {
    const chromeOut = tempPath('site-chrome.json')
    const homeOut = tempPath('home.json')
    const chrome = parseSiteChrome(JSON.parse(readFileSync(chromeFile, 'utf8')))
    const home = parsePageDocument(JSON.parse(readFileSync(homeFile, 'utf8')))
    expect(exportChromeDocument(chrome, chromeOut)).toEqual(chrome)
    expect(exportHomepageFromPage({ path: '/', layout: home }, homeOut)).toEqual(home)
    expect(readFileSync(chromeOut, 'utf8')).toBe(readFileSync(chromeFile, 'utf8'))
    expect(readFileSync(homeOut, 'utf8')).toBe(readFileSync(homeFile, 'utf8'))
  })
})
