import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { shouldRenderSiteChrome, type ChromeRenderContext } from '../chrome/gate'
import { parsePageDocument } from '../page-model/schema'
import type { PageDocument } from '../page-model/types'
import { renderColumnsHtml } from '../render/columns'

export function homepageDraftPath(): string {
  return path.join(process.cwd(), 'migration/drafts/home.json')
}

/** Homepage sections under the slider. Null when the draft is missing or invalid. */
export function loadHomepageDraft(file = homepageDraftPath()): PageDocument | null {
  try {
    if (!existsSync(file)) return null
    const page = parsePageDocument(JSON.parse(readFileSync(file, 'utf8')))
    if (page.id !== 'home' || page.path !== '/') return null
    return page
  } catch {
    return null
  }
}

/**
 * HTML for the below-slider sections, or null when the page should keep the static markup.
 * Uses the same publish gate as Site chrome: local dev and preview/editor routes only.
 */
export function homepageSectionsHtml(context: ChromeRenderContext, file = homepageDraftPath()): string | null {
  const page = loadHomepageDraft(file)
  if (!page) return null
  if (!shouldRenderSiteChrome({ publishedToSite: false }, context)) return null
  return renderColumnsHtml(page.rows)
}
