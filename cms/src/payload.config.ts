import path from 'path'
import { fileURLToPath } from 'url'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Pages } from './collections/Pages'
import { Users } from './collections/Users'
import { SiteChrome } from './globals/SiteChrome'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Titanium layout',
    },
    components: {
      beforeDashboard: ['/components/ReadinessBoard#ReadinessHome'],
    },
  },
  collections: [Users, Pages],
  globals: [SiteChrome],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || 'file:./titanium.db',
    },
  }),
  sharp,
})
