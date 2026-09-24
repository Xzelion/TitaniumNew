import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { roundTripPageDocument } from '../shared/page-model/schema'

const dir = path.join(process.cwd(), 'migration/drafts')

describe('committed private drafts', () => {
  const files = readdirSync(dir).filter((file) => file.endsWith('.json'))

  it('keeps the quality survey button and the careers and terms drafts', () => {
    const quality = JSON.parse(readFileSync(path.join(dir, 'quality-systems.json'), 'utf8')) as {
      provenance: { verify: string; grid: string }
      rows: Array<{ columns: Array<{ items: Array<{ kind: string; label?: string; href?: string }> }> }>
    }
    const buttons = quality.rows.flatMap((row) =>
      row.columns.flatMap((column) => column.items.filter((item) => item.kind === 'button')),
    )
    const survey = buttons.find((item) => item.label === 'Customer Satisfaction Survey')
    expect(survey?.href).toBe('https://titanium.com/customer-satisfaction-survey/')
    expect(quality.provenance.grid).toBe('lead-two-thirds | thirds | quality-split')
    expect(quality.provenance.verify).toContain('Customer Satisfaction Survey')
    for (const file of ['careers.json', 'titanium-about-us--terms-conditions.json']) {
      const page = JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as {
        provenance: { grid: string }
        siteVisibility: string
      }
      expect(page.siteVisibility).toBe('private_draft')
      expect(page.provenance.grid).toContain('custom(two-fifths+half)')
    }
  })

  it('round-trips every converted page', () => {
    expect(files.length).toBeGreaterThanOrEqual(254)
    for (const file of files) {
      const page = JSON.parse(readFileSync(path.join(dir, file), 'utf8'))
      expect(roundTripPageDocument(page).id).toBe(page.id)
      expect(page.siteVisibility).toBe('private_draft')
      expect(page.publishedVersion).toBeNull()
    }
  })
})
