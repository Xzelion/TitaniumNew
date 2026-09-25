import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { shouldRenderSiteChrome, type ChromeRenderContext } from './gate'
import { parseSiteChrome } from './schema'
import type { SiteChrome } from './types'

export function chromeFilePath(): string {
  return path.join(process.cwd(), 'migration/chrome/site-chrome.json')
}

/** Reads the Site chrome document. Returns null when the file is missing or invalid. */
export function loadSiteChrome(file = chromeFilePath()): SiteChrome | null {
  try {
    if (!existsSync(file)) return null
    return parseSiteChrome(JSON.parse(readFileSync(file, 'utf8')))
  } catch {
    return null
  }
}

/** Chrome for this request, or null when the page should keep the static header. */
export function siteChromeForPage(context: ChromeRenderContext, file = chromeFilePath()): SiteChrome | null {
  const chrome = loadSiteChrome(file)
  if (!shouldRenderSiteChrome(chrome, context)) return null
  return chrome
}
