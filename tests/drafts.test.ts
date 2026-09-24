import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { roundTripPageDocument } from '../shared/page-model/schema'

const dir = path.join(process.cwd(), 'migration/drafts')

describe('committed private drafts', () => {
  const files = readdirSync(dir).filter((file) => file.endsWith('.json'))

  it('round-trips every converted page', () => {
    expect(files.length).toBeGreaterThanOrEqual(20)
    for (const file of files) {
      const page = JSON.parse(readFileSync(path.join(dir, file), 'utf8'))
      expect(roundTripPageDocument(page).id).toBe(page.id)
      expect(page.siteVisibility).toBe('private_draft')
      expect(page.publishedVersion).toBeNull()
    }
  })
})
