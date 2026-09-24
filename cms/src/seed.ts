import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import { parseSiteChrome } from '../../shared/chrome/schema'
import type { SiteChrome as ChromeDocument } from '../../shared/chrome/types'
import config from './payload.config'

const draftsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migration/drafts')

export default async function seed(): Promise<void> {
  const payload = await getPayload({ config })
  const email = process.env.SEED_EMAIL
  const password = process.env.SEED_PASSWORD
  if (email && password) {
    const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    if (existing.totalDocs === 0) {
      await payload.create({ collection: 'users', data: { email, password } })
    }
  }

  const files = readdirSync(draftsDir).filter((file) => file.endsWith('.json'))
  for (const file of files) {
    const layout = JSON.parse(readFileSync(path.join(draftsDir, file), 'utf8')) as {
      title: string
      path: string
    }
    const found = await payload.find({
      collection: 'pages',
      where: { path: { equals: layout.path } },
      limit: 1,
    })
    if (found.totalDocs > 0) continue
    await payload.create({
      collection: 'pages',
      data: {
        title: layout.title,
        path: layout.path,
        layout,
      },
    })
  }
  const chromePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migration/chrome/site-chrome.json')
  if (existsSync(chromePath)) {
    const chrome = parseSiteChrome(JSON.parse(readFileSync(chromePath, 'utf8')))
    await payload.updateGlobal({
      slug: 'site-chrome',
      draft: true,
      data: chromeData(chrome),
    })
    payload.logger.info('Seed saved the site chrome global as a private draft.')
  }
  payload.logger.info(`Seed checked ${files.length} private drafts.`)
}

function chromeData(chrome: ChromeDocument) {
  return {
    siteVisibility: chrome.siteVisibility,
    publishedToSite: false as const,
    sourceUrl: chrome.sourceUrl,
    logo: chrome.logo,
    phone: chrome.phone,
    email: chrome.email,
    utilityLinks: chrome.utilityLinks,
    navigation: chrome.navigation,
    footerColumns: chrome.footerColumns,
    badges: chrome.badges,
    socialLinks: chrome.socialLinks,
    legalText: chrome.legalText,
    heroSlides: chrome.heroSlides,
    notes: chrome.notes.map((text) => ({ text })),
  }
}

await seed()
