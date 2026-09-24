import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
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
  payload.logger.info(`Seed checked ${files.length} private drafts.`)
}

await seed()
