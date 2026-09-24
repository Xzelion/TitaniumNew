import { blockingSeoFailures } from './seo'
import type { PageDocument, Readiness } from './types'

export interface ReadinessResult {
  page: PageDocument
  error: string | null
}

export const READINESS_LABELS: Record<Readiness, string> = {
  layout_editing: 'Layout editing',
  visual_check: 'Visual check',
  published: 'Published version',
}

function clonePage(page: PageDocument): PageDocument {
  return structuredClone(page)
}

export function setReadiness(page: PageDocument, next: Readiness, now: string): ReadinessResult {
  if (next === 'layout_editing' || next === 'visual_check') {
    const updated = clonePage(page)
    updated.readiness = next
    updated.editedByHuman = true
    return { page: updated, error: null }
  }
  if (next === 'published') {
    if (page.readiness !== 'visual_check') {
      return {
        page,
        error: 'Look at the visual check first. Then you can save a published version.',
      }
    }
    const failures = blockingSeoFailures(page.seo)
    if (failures.length > 0) {
      return {
        page,
        error: `Fix search details before a published version: ${failures.map((item) => item.label).join(', ')}.`,
      }
    }
    const updated = clonePage(page)
    updated.readiness = 'published'
    updated.editedByHuman = true
    updated.publishedVersion = {
      seo: structuredClone(page.seo),
      rows: structuredClone(page.rows),
      publishedAt: now,
    }
    updated.siteVisibility = 'private_draft'
    return { page: updated, error: null }
  }
  const unexpected: never = next
  return { page, error: `Unknown readiness ${String(unexpected)}` }
}

export function publishedVersionLabel(page: PageDocument): string {
  if (!page.publishedVersion) {
    return 'Published version: none yet. The public website is unchanged.'
  }
  return `Published version saved ${page.publishedVersion.publishedAt}. The public website is still unchanged.`
}
