// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { mountWorkspace } from '../shared/editor/mount'
import { createIdFactory } from '../shared/page-model/workspace'

const html = `<!doctype html><html><head>
<title>Quality System - Titanium Industries</title>
<meta name="description" content="T.I.’s Industry Leading Quality System delivers guaranteed reliability with a full range of approvals.">
<link rel="canonical" href="https://titanium.com/quality-systems/">
<meta property="og:title" content="Quality System - Titanium Industries">
<meta property="og:description" content="T.I.’s Industry Leading Quality System delivers guaranteed reliability with a full range of approvals.">
</head><body><div class="entry-content">
<div class="flex_column av_one_full flex_column_div first"><h2>Hello</h2><p>Story</p></div>
</div></body></html>`

describe('workspace clicks', () => {
  it('opens picture fields and not a body box', () => {
    const parsed = parseAviaHtml(html, createIdFactory())
    const page = toPageDocument(parsed, '2026-09-24T00:00:00.000Z')
    document.body.innerHTML = '<div id="root"></div>'
    const root = document.getElementById('root')
    if (!root) throw new Error('missing root')
    const controller = mountWorkspace(root, page, () => undefined)
    const add = root.querySelector('[data-action="add-picture"]')
    if (!(add instanceof HTMLElement)) throw new Error('missing add picture')
    add.click()
    expect(root.querySelector('[data-field="src"]')).toBeTruthy()
    expect(root.querySelector('[data-field="alt"]')).toBeTruthy()
    expect(root.querySelector('[data-field="body"]')).toBeNull()
    expect(root.querySelector('.ti-drawer textarea')).toBeNull()
    expect(root.innerHTML).toContain('Back to the row')
    expect(root.innerHTML).toContain('Unsaved changes')
    expect(root.innerHTML).toContain('Layout editing')
    const visual = root.querySelector('[data-readiness="visual_check"]')
    if (!(visual instanceof HTMLElement)) throw new Error('missing visual check')
    visual.click()
    expect(controller.getPage().readiness).toBe('visual_check')
    const published = root.querySelector('[data-readiness="published"]')
    if (!(published instanceof HTMLElement)) throw new Error('missing published')
    published.click()
    expect(controller.getPage().readiness).toBe('published')
    expect(controller.getPage().siteVisibility).toBe('private_draft')
    controller.destroy()
  })
})
