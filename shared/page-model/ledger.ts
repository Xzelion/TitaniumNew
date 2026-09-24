import type { PageDocument } from './types'

/** Plain labels Marketing sees. Local candidates are never "Ready" in a hosted CMS. */
export const EDITING_LABELS = [
  'Not yet verified',
  'Partly converted',
  'Ready to edit layout',
  'Planned / awaiting integration',
] as const

export type EditingLabel = (typeof EDITING_LABELS)[number]

export interface LedgerEntry {
  title: string
  path: string
  region: string
  layoutEditing: EditingLabel
  layoutDetail: string
  visualCheck: 'Not yet verified' | 'Needs recheck'
  visualDetail: string
  publishedVersion: string
  lastChecked: string
  editorHref: string | null
  liveHref: string | null
  evidence: string
}

export function regionForPath(path: string): string {
  if (path.includes('/processing/')) return 'Processing'
  if (path.includes('/markets/') || path === '/oil-gas/' || path === '/interconnect-alloys/') return 'Markets'
  if (path.includes('quality')) return 'Quality'
  if (!path.startsWith('/')) return 'Planning'
  return 'Other'
}

/**
 * Readiness comes from conversion provenance. A columns schema does not make a page ready.
 * Nothing in this repository is a hosted conversion.
 */
export function ledgerForDocument(page: PageDocument, editorHref: string | null = null): LedgerEntry {
  const locked = page.provenance.remainingSourceOnly.map((region) => region.label)
  const rows = page.provenance.grid || 'no rows'
  const layoutDetail = locked.length
    ? `Candidate draft only. Editable rows: ${rows}. Locked: ${locked.join(', ')}. Not saved on the hosted CMS.`
    : `Candidate draft only. Editable rows: ${rows}. Not saved on the hosted CMS.`
  const visualCheck = page.editedByHuman ? 'Needs recheck' : 'Not yet verified'
  const visualDetail = page.editedByHuman
    ? 'Someone edited this candidate after the live HTML comparison. Check it again before anyone calls it ready.'
    : 'A live HTML comparison in this candidate is not a hosted visual approval.'
  const publishedVersion = page.publishedVersion
    ? `Private snapshot ${page.publishedVersion.publishedAt}. Not released on titanium.com.`
    : 'No published version'
  const liveHref = page.provenance.sourceUrl.startsWith('https://titanium.com') ? page.provenance.sourceUrl : null
  return {
    title: page.title || page.path,
    path: page.path,
    region: regionForPath(page.path),
    layoutEditing: 'Planned / awaiting integration',
    layoutDetail,
    visualCheck,
    visualDetail,
    publishedVersion,
    lastChecked: page.provenance.convertedAt || 'Not checked',
    editorHref,
    liveHref,
    evidence: `Converter ${page.provenance.converterVersion}. Family ${page.provenance.converterFamily}. Source hash ${page.provenance.sourceHash}.`,
  }
}

/** Planning rows from the handoff. They are not conversions. */
export function planningEntries(): LedgerEntry[] {
  return [
    {
      title: 'Firearms',
      path: '/markets/firearms/',
      region: 'Markets',
      layoutEditing: 'Not yet verified',
      layoutDetail:
        'The public page returned Cloudflare 403, so the column HTML is not in this repository. Local notes describe a three-button row, a social row, and a line card. That note is not a conversion.',
      visualCheck: 'Not yet verified',
      visualDetail: 'No candidate preview exists here.',
      publishedVersion: 'No published version',
      lastChecked: 'Not checked',
      editorHref: null,
      liveHref: 'https://titanium.com/markets/firearms/',
      evidence: 'Blocked before a source hash could be recorded.',
    },
    {
      title: 'Other captured pages',
      path: '419-page register',
      region: 'Planning',
      layoutEditing: 'Not yet verified',
      layoutDetail:
        'The handoff ledger counts 419 captured pages and 0 hosted conversions. The register file is not in this repository. These pages are neither ready nor marked broken.',
      visualCheck: 'Not yet verified',
      visualDetail: 'No per-page visual approval is recorded here.',
      publishedVersion: 'No published version',
      lastChecked: 'Not checked',
      editorHref: null,
      liveHref: null,
      evidence: 'Planning evidence only. Do not treat a sitemap URL as layout-ready.',
    },
  ]
}

export function allLedgerEntries(pages: PageDocument[]): LedgerEntry[] {
  return [...pages.map((page) => ledgerForDocument(page)), ...planningEntries()]
}
