import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parityChecks } from '../shared/convert/parity'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { gateConversion } from '../shared/page-model/hash-gate'
import { roundTripPageDocument } from '../shared/page-model/schema'
import { renderWorkspace } from '../shared/editor/render-workspace'
import { createIdFactory } from '../shared/page-model/workspace'
import { renderColumnsHtml } from '../shared/render/columns'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(root, 'migration/raw')
const draftDir = path.join(root, 'migration/drafts')
const reportDir = path.join(root, 'migration/reports')

const pages = [
  { file: 'quality-systems.html', name: 'quality-systems' },
  { file: 'oil-gas.html', name: 'oil-gas' },
  { file: 'fastener-alloys.html', name: 'fastener-alloys' },
  { file: 'interconnect-alloys.html', name: 'interconnect-alloys' },
  { file: 'medical.html', name: 'medical' },
  { file: 'water-jet-cutting.html', name: 'water-jet-cutting' },
  { file: 'additive-manufacturing-build-plates.html', name: 'additive-manufacturing-build-plates' },
]

mkdirSync(draftDir, { recursive: true })
mkdirSync(reportDir, { recursive: true })

const now = new Date().toISOString()
const conversions = []
const parity = []

for (const page of pages) {
  const htmlPath = path.join(rawDir, page.file)
  if (!existsSync(htmlPath)) {
    conversions.push({ path: page.name, action: 'missing-capture', reason: `${page.file} is not in migration/raw` })
    continue
  }
  const html = readFileSync(htmlPath, 'utf8')
  const ids = createIdFactory()
  const parsed = parseAviaHtml(html, ids)
  const incoming = roundTripPageDocument(toPageDocument(parsed, now))
  const draftPath = path.join(draftDir, `${incoming.id}.json`)
  const existing = existsSync(draftPath) ? JSON.parse(readFileSync(draftPath, 'utf8')) : null
  const gated = gateConversion(existing, incoming)
  if (gated.action === 'write') writeFileSync(draftPath, `${JSON.stringify(gated.draft, null, 2)}\n`)
  const checks = parityChecks(parsed, gated.draft)
  conversions.push({
    path: gated.draft.path,
    id: gated.draft.id,
    action: gated.action,
    reason: gated.reason,
    grid: gated.draft.provenance.grid,
    families: gated.draft.provenance.families,
    converterFamily: gated.draft.provenance.converterFamily,
    remainingSourceOnly: gated.draft.provenance.remainingSourceOnly,
    verify: gated.draft.provenance.verify,
    sourceHash: gated.draft.provenance.sourceHash,
  })
  parity.push({
    path: gated.draft.path,
    id: gated.draft.id,
    pass: checks.every((check) => check.pass),
    checks,
  })
  if (page.name === 'quality-systems') {
    const htmlPreview = `<!doctype html><html><head><meta charset="utf-8"><title>Editor preview</title></head><body>${renderWorkspace(gated.draft, null, null)}</body></html>`
    writeFileSync(path.join(reportDir, 'editor-quality.html'), htmlPreview)
    writeFileSync(path.join(reportDir, 'quality-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Quality columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'water-jet-cutting') {
    writeFileSync(path.join(reportDir, 'waterjet-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Water jet columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'medical') {
    writeFileSync(path.join(reportDir, 'medical-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Medical columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
}

const sitemapNote = {
  capturedInRepoBeforeThisChange: 0,
  publicSitemapUrls: countSitemap(),
}
writeFileSync(path.join(reportDir, 'conversions.json'), `${JSON.stringify({ generatedAt: now, sitemap: sitemapNote, pages: conversions }, null, 2)}\n`)
writeFileSync(path.join(reportDir, 'parity.json'), `${JSON.stringify({ generatedAt: now, pages: parity }, null, 2)}\n`)
console.log(JSON.stringify({ conversions: conversions.map((item) => ({ id: item.id, action: item.action, grid: item.grid, families: item.families })), parity: parity.map((item) => ({ id: item.id, pass: item.pass, failed: item.checks.filter((check) => !check.pass).map((check) => check.name) })) }, null, 2))

function countSitemap(): number | null {
  const file = '/tmp/ti-pages/nw-page-sitemap1.xml'
  if (!existsSync(file)) return null
  const texts = ['nw-page-sitemap1.xml', 'nw-page-sitemap2.xml', 'nw-post-sitemap.xml', 'portfolio-sitemap.xml', 'category-sitemap.xml', 'local-sitemap.xml']
  let total = 0
  for (const name of texts) {
    const full = path.join('/tmp/ti-pages', name)
    if (!existsSync(full)) continue
    const matches = readFileSync(full, 'utf8').match(/<loc>/g)
    total += matches?.length ?? 0
  }
  return total
}
