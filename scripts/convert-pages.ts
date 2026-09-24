import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parityChecks } from '../shared/convert/parity'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { oilGasCardsFromWxr, type PortfolioCard } from '../shared/convert/portfolio-wxr'
import { formNoteFromModel, modelGravityFormExport, type KnownFormNote } from '../shared/forms/gravity-form'
import { gateConversion } from '../shared/page-model/hash-gate'
import { roundTripPageDocument } from '../shared/page-model/schema'
import { renderWorkspace } from '../shared/editor/render-workspace'
import { allLedgerEntries } from '../shared/page-model/ledger'
import { parsePageDocument } from '../shared/page-model/schema'
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
  { file: 'processing--chamfering.html', name: 'chamfering' },
  { file: 'processing--grinding.html', name: 'grinding' },
  { file: 'processing--saw-cutting.html', name: 'saw-cutting' },
  { file: 'processing--shearing.html', name: 'shearing' },
  { file: 'processing--torch-cutting.html', name: 'torch-cutting' },
  { file: 'processing--trepanning.html', name: 'trepanning' },
  { file: 'processing--coil-slitting.html', name: 'coil-slitting' },
  { file: 'processing--heat-treating.html', name: 'heat-treating' },
  { file: 'processing--pvc-coating.html', name: 'pvc-coating' },
  { file: 'processing.html', name: 'processing' },
  { file: 'markets.html', name: 'markets' },
  { file: 'services.html', name: 'services' },
  { file: 'markets--aerospace.html', name: 'aerospace' },
  { file: 'markets--defense.html', name: 'defense' },
  { file: 'markets--industrial.html', name: 'industrial' },
  { file: 'markets--consumer-products.html', name: 'consumer-products' },
  { file: 'giving-back.html', name: 'giving-back' },
  { file: 'titanium-about-us.html', name: 'about' },
  { file: 'frequently-asked-questions.html', name: 'faq' },
  { file: 'privacy-policy.html', name: 'privacy' },
  { file: 'contact-us.html', name: 'contact-us' },
  { file: 'rfq.html', name: 'rfq' },
  { file: 'history.html', name: 'history' },
  { file: 'mission-statement.html', name: 'mission' },
  { file: 'message-from-the-president.html', name: 'president' },
  { file: 'global-locations.html', name: 'global-locations' },
  { file: 'scrap-reclamation-2.html', name: 'scrap-reclamation-2' },
]

mkdirSync(draftDir, { recursive: true })
mkdirSync(reportDir, { recursive: true })
const formDir = path.join(root, 'migration/forms')
mkdirSync(formDir, { recursive: true })

const knownForms: KnownFormNote[] = []
let portfolioCards: PortfolioCard[] | null = null
const portfolioPath = path.join(rawDir, 'oil-gas-portfolio.xml')
if (existsSync(portfolioPath)) {
  portfolioCards = oilGasCardsFromWxr(readFileSync(portfolioPath, 'utf8'))
  const portfolioDir = path.join(root, 'migration/portfolio')
  mkdirSync(portfolioDir, { recursive: true })
  writeFileSync(path.join(portfolioDir, 'oil-gas-cards.json'), `${JSON.stringify(portfolioCards, null, 2)}\n`)
}
const formExportPath = path.join(rawDir, 'gravity-form-20.json')
if (existsSync(formExportPath)) {
  const model = modelGravityFormExport(JSON.parse(readFileSync(formExportPath, 'utf8')), 20)
  if (model.publicSubmit !== false) throw new Error('Form 20 public submit must stay off')
  writeFileSync(path.join(formDir, 'gravity-form-20.model.json'), `${JSON.stringify(model, null, 2)}\n`)
  knownForms.push(formNoteFromModel(model))
}

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
  const parsed = parseAviaHtml(html, ids, knownForms, portfolioCards)
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
    const lead = structuredClone(gated.draft)
    lead.rows = lead.rows.filter((row) => row.preset === 'quality-split')
    writeFileSync(
      path.join(reportDir, 'editor-quality-split.html'),
      `<!doctype html><html><head><meta charset="utf-8"><title>Quality documents row</title><style>.ti-seo{display:none}</style></head><body>${renderWorkspace(lead, null, null)}</body></html>`,
    )
    writeFileSync(path.join(reportDir, 'quality-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Quality columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'water-jet-cutting') {
    writeFileSync(path.join(reportDir, 'waterjet-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Water jet columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'medical') {
    writeFileSync(path.join(reportDir, 'medical-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Medical columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'saw-cutting') {
    writeFileSync(path.join(reportDir, 'saw-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Saw cutting columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
}

const sitemapNote = {
  capturedInRepoBeforeThisChange: 0,
  publicSitemapUrls: countSitemap(),
}
writeFileSync(path.join(reportDir, 'conversions.json'), `${JSON.stringify({ generatedAt: now, sitemap: sitemapNote, pages: conversions }, null, 2)}\n`)
writeFileSync(path.join(reportDir, 'parity.json'), `${JSON.stringify({ generatedAt: now, pages: parity }, null, 2)}\n`)
const ledgerPages = readdirSync(draftDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => parsePageDocument(JSON.parse(readFileSync(path.join(draftDir, file), 'utf8'))))
const ledgerRows = allLedgerEntries(ledgerPages)
  .map(
    (entry) => `<tr><td><strong>${escapeReport(entry.title)}</strong><div>${escapeReport(entry.path)}</div><div>${escapeReport(entry.region)}</div></td><td><strong>${escapeReport(entry.layoutEditing)}</strong><div>${escapeReport(entry.layoutDetail)}</div></td><td><strong>${escapeReport(entry.visualCheck)}</strong><div>${escapeReport(entry.visualDetail)}</div></td><td>${escapeReport(entry.publishedVersion)}</td><td>${escapeReport(entry.lastChecked)}</td></tr>`,
  )
  .join('')
writeFileSync(
  path.join(reportDir, 'layout-status.html'),
  `<!doctype html><html><head><meta charset="utf-8"><title>Layout editing readiness</title><style>body{font-family:Inter,Arial,sans-serif;color:#1f2937;margin:1.5rem}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #cbd5e1;text-align:left;vertical-align:top;padding:0.6rem}th{color:#003366}</style></head><body><h1>Layout editing readiness</h1><p>These notes describe this candidate. No page here is a hosted conversion.</p><table><thead><tr><th>Page</th><th>Layout editing</th><th>Visual check</th><th>Published version</th><th>Last checked</th></tr></thead><tbody>${ledgerRows}</tbody></table></body></html>`,
)

function escapeReport(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
console.log(JSON.stringify({ conversions: conversions.map((item) => ({ id: item.id, action: item.action, grid: item.grid, families: item.families })), parity: parity.map((item) => ({ id: item.id, pass: item.pass, failed: item.checks.filter((check) => !check.pass).map((check) => check.name) })) }, null, 2))

function countSitemap(): number | null {
  const dir = '/tmp/ti-pages'
  const texts = ['page-sitemap1.xml', 'page-sitemap2.xml', 'post-sitemap.xml', 'portfolio-sitemap.xml', 'category-sitemap.xml', 'local-sitemap.xml']
  if (!texts.some((name) => existsSync(path.join(dir, name)))) return null
  let total = 0
  for (const name of texts) {
    const full = path.join(dir, name)
    if (!existsSync(full)) continue
    const matches = readFileSync(full, 'utf8').match(/<loc>/g)
    total += matches?.length ?? 0
  }
  return total
}
