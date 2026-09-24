import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { formNoteFromModel, modelGravityFormExport } from '../shared/forms/gravity-form'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { createIdFactory } from '../shared/page-model/workspace'
import { PRESETS } from '../shared/page-model/presets'

const exportPath = path.join(process.cwd(), 'migration/raw/gravity-form-20.json')

describe('Gravity Form 20 model', () => {
  const model = modelGravityFormExport(JSON.parse(readFileSync(exportPath, 'utf8')), 20)

  it('models Additive Build Plates RFQ with submit left off', () => {
    expect(model.id).toBe(20)
    expect(model.title).toBe('Additive Build Plates RFQ')
    expect(model.publicSubmit).toBe(false)
    expect(model.fields).toHaveLength(39)
    expect(model.notifications).toHaveLength(19)
    expect(model.confirmation.name).toBe('Default Confirmation')
    expect(model.submitLabel).toBe('Submit For Quote')
    expect(model.wiring).toEqual({
      publicSubmit: false,
      hcaptcha: 'needs_keys',
      notifications: 'needs_keys',
      fileUpload: 'not_wired',
    })
    expect(model.notifications.every((note) => note.send === false && note.delivery === 'needs_keys')).toBe(true)
    const metals = model.fields.find((field) => field.label === 'Metals')
    expect(metals?.required).toBe(true)
    expect(metals?.choices.length).toBeGreaterThan(0)
    const alloy = model.fields.find((field) => field.label === 'Alloy / Grade - Titanium')
    expect(alloy?.conditionalLogic?.rules[0]?.fieldId).toBe(1)
    expect(model.fields.some((field) => field.type === 'hcaptcha')).toBe(true)
    expect(model.fields.some((field) => field.type === 'fileupload' && field.multipleFiles)).toBe(true)
    expect(formNoteFromModel(model).reason).toMatch(/Public submit is off/)
    expect(formNoteFromModel(model).reason).toMatch(/need keys/)
  })

  it('keeps the additive page from submitting when the export is known', () => {
    const note = formNoteFromModel(model)
    const html = `<!doctype html><html><head><title>Additive</title>
<meta name="description" content="Build plates.">
<link rel="canonical" href="https://titanium.com/markets/additive-manufacturing-build-plates/">
<meta property="og:title" content="Additive"><meta property="og:description" content="Build plates.">
</head><body>
<div class="flex_column av_one_full flex_column_div first"><h1>Build plates</h1>
<div id="gform_wrapper_20" class="gform_wrapper"></div>
</div></body></html>`
    const parsed = parseAviaHtml(html, createIdFactory(), [note])
    const page = toPageDocument(parsed, '2026-09-24T00:00:00.000Z')
    const locked = page.provenance.remainingSourceOnly.find((region) => region.label === 'Gravity Form 20')
    expect(locked?.reason).toMatch(/Public submit is off/)
    expect(page.provenance.sourceHash).not.toBe(parseAviaHtml(html, createIdFactory()).sourceHash)
    expect(page.siteVisibility).toBe('private_draft')
  })
})

describe('Enfold fifths and quarter rows', () => {
  it('uses the live widths for four fifths, wide fifths, and half plus quarters', () => {
    expect(PRESETS['lead-four-fifths'].columns[0]?.widthPercent).toBe(78.8)
    expect(PRESETS['wide-fifths'].columns.map((column) => column.widthPercent)).toEqual([57.599999999999994, 36.4])
    expect(PRESETS['half-quarters'].columns.map((column) => column.widthPercent)).toEqual([47, 20.5, 20.5])
    expect(PRESETS['wide-fifths'].columns[1]?.marginLeftPercent).toBe(6)
  })
})
