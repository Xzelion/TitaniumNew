import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseHomepageSections } from '../shared/homepage/sections'
import { roundTripPageDocument } from '../shared/page-model/schema'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'migration/raw/home.html')
if (!existsSync(source)) {
  throw new Error('Save the live homepage HTML at migration/raw/home.html before drafting homepage sections')
}
const page = roundTripPageDocument(parseHomepageSections(readFileSync(source, 'utf8'), new Date().toISOString()))
const target = path.join(root, 'migration/drafts/home.json')
writeFileSync(target, `${JSON.stringify(page, null, 2)}\n`)
console.log(`Wrote ${page.rows.length} rows to ${target}`)
console.log(page.provenance.grid)
