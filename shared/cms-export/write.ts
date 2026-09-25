import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromeFilePath } from '../chrome/load'
import { parseSiteChrome } from '../chrome/schema'
import type { SiteChrome } from '../chrome/types'
import { homepageDraftPath } from '../homepage/load'
import { parsePageDocument } from '../page-model/schema'
import type { PageDocument } from '../page-model/types'

/**
 * Payload admin is the source of truth. A Site chrome or homepage save writes the
 * JSON Astro already reads. Seed JSON is only the first copy into the database.
 * If a save cannot be validated, the previous file stays so Astro can still fall back.
 */

export function exportChromeDocument(doc: unknown, file = chromeFilePath()): SiteChrome | null {
  try {
    const parsed = parseSiteChrome(chromeFromPayload(doc))
    writeCanonicalJson(file, parsed)
    return parsed
  } catch {
    return null
  }
}

/** Writes the homepage draft only. Any other page returns null and leaves the file alone. */
export function exportHomepageDocument(layout: unknown, file = homepageDraftPath()): PageDocument | null {
  const prepared = prepareHomepage(layout)
  if (!prepared) return null
  try {
    const page = parsePageDocument(prepared)
    if (page.id !== 'home' || page.path !== '/') return null
    writeCanonicalJson(file, page)
    return page
  } catch {
    return null
  }
}

/** Collection save shape: `{ path, layout }`. Homepage only. */
export function exportHomepageFromPage(doc: unknown, file = homepageDraftPath()): PageDocument | null {
  return exportHomepageDocument(homepageLayout(doc), file)
}

/** True when this Pages save is the homepage, including a layout stored as a JSON string. */
export function isHomepageAdminSave(doc: unknown): boolean {
  if (!isRecord(doc)) return false
  if (doc.path === '/') return true
  const layout = homepageLayout(doc)
  return isRecord(layout) && (layout.id === 'home' || layout.path === '/')
}

function chromeFromPayload(doc: unknown): unknown {
  if (!isRecord(doc)) return doc
  return {
    id: 'site-chrome',
    siteVisibility: 'private_draft',
    publishedToSite: false,
    sourceUrl: text(doc.sourceUrl),
    logo: logo(doc.logo),
    phone: link(doc.phone),
    email: link(doc.email),
    utilityLinks: links(doc.utilityLinks),
    navigation: navigation(doc.navigation),
    footerColumns: footerColumns(doc.footerColumns),
    badges: badges(doc.badges),
    socialLinks: links(doc.socialLinks),
    legalText: text(doc.legalText),
    heroSlides: heroSlides(doc.heroSlides),
    notes: notes(doc.notes),
  }
}

function prepareHomepage(layout: unknown): unknown {
  const record = unwrapJson(layout)
  if (!isRecord(record)) return null
  if (record.id !== 'home' && record.path !== '/') return null
  return {
    ...record,
    siteVisibility: 'private_draft',
  }
}

function homepageLayout(doc: unknown): unknown {
  if (!isRecord(doc)) return null
  if (doc.layout !== undefined) return unwrapJson(doc.layout)
  return doc
}

function logo(value: unknown): unknown {
  if (!isRecord(value)) return value
  return { src: text(value.src), alt: text(value.alt), href: text(value.href) }
}

function navigation(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((item) => {
    if (!isRecord(item)) return item
    return { label: text(item.label), href: text(item.href), groups: groups(item.groups) }
  })
}

function footerColumns(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((column) => {
    if (!isRecord(column)) return column
    return { title: text(column.title), groups: groups(column.groups) }
  })
}

function groups(value: unknown): unknown {
  if (!Array.isArray(value)) return []
  return value.map((group) => {
    if (!isRecord(group)) return group
    return { label: text(group.label), href: text(group.href), links: links(group.links) }
  })
}

function heroSlides(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((slide) => {
    if (!isRecord(slide)) return slide
    return {
      headline: text(slide.headline),
      subcopy: text(slide.subcopy),
      backgroundImage: text(slide.backgroundImage),
      callsToAction: links(slide.callsToAction),
    }
  })
}

function badges(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  return value.map((badge) => {
    if (!isRecord(badge)) return badge
    return { label: text(badge.label), href: text(badge.href), src: text(badge.src) }
  })
}

function links(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) return []
  return value.map(link)
}

function link(value: unknown): { label: string; href: string } {
  if (!isRecord(value)) return { label: '', href: '' }
  return { label: text(value.label), href: text(value.href) }
}

function notes(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return item
    if (isRecord(item)) return text(item.text)
    return ''
  })
}

function unwrapJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function writeCanonicalJson(file: string, value: unknown): void {
  const body = `${JSON.stringify(value, null, 2)}\n`
  if (existsSync(file) && readFileSync(file, 'utf8') === body) return
  mkdirSync(path.dirname(file), { recursive: true })
  const temp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`)
  writeFileSync(temp, body)
  renameSync(temp, file)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
