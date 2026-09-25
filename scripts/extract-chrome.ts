import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseLiveChrome } from '../shared/chrome/parse-live'
import { parseSiteChrome } from '../shared/chrome/schema'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const candidates = [
  path.join(root, 'migration/raw/home.html'),
  '/tmp/ti-home.html',
]
const source = candidates.find((file) => existsSync(file))
if (!source) throw new Error('Save the live homepage HTML at migration/raw/home.html before extracting chrome')

const chrome = parseSiteChrome(parseLiveChrome(readFileSync(source, 'utf8')))
const outDir = path.join(root, 'migration/chrome')
mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, 'site-chrome.json')
writeFileSync(out, `${JSON.stringify(chrome, null, 2)}\n`)
console.log(
  JSON.stringify({
    source,
    navigation: chrome.navigation.length,
    heroSlides: chrome.heroSlides.length,
    footerColumns: chrome.footerColumns.length,
    social: chrome.socialLinks.length,
  }),
)
