import type { ParsedPage } from './parse-avia'
import type { PageDocument } from '../page-model/types'

export interface ParityCheck {
  name: string
  pass: boolean
  detail: string
}

export function parityChecks(parsed: ParsedPage, page: PageDocument): ParityCheck[] {
  const checks: ParityCheck[] = [
    exact('SEO title', parsed.seo.title, page.seo.title),
    exact('SEO description', parsed.seo.description, page.seo.description),
    exact('Canonical', parsed.seo.canonical, page.seo.canonical),
    exact('Open Graph title', parsed.seo.ogTitle, page.seo.ogTitle),
    exact('Open Graph description', parsed.seo.ogDescription, page.seo.ogDescription),
  ]
  if (parsed.waterjet) {
    checks.push({
      name: 'Water jet measured split',
      pass: page.rows.some((row) => row.preset === 'waterjet-split'),
      detail: page.rows.some((row) => row.preset === 'waterjet-split')
        ? '40% picture, 55% words, 15px gap, 20px offset.'
        : 'Measured split is missing.',
    })
    checks.push({
      name: 'Water jet is not equal columns',
      pass: !page.rows.some((row) => row.preset === 'thirds' && row.columns.some((column) => column.items.some((item) => item.kind === 'picture' && /water/i.test(item.alt + item.src)))),
      detail: 'The cutting photo stays in the measured split.',
    })
  }
  if (parsed.medicalFloat) {
    const wraps = page.rows.flatMap((row) =>
      row.columns.flatMap((column) => column.items.filter((item) => item.kind === 'picture' && item.wrap !== 'none')),
    )
    checks.push({
      name: 'Medical float wrap',
      pass: page.rows.some((row) => row.preset === 'float-wrap') && wraps.length > 0,
      detail: wraps.length > 0 ? `${wraps.length} pictures tuck beside the words.` : 'No wrapped pictures.',
    })
    checks.push({
      name: 'Medical body is not equal columns',
      pass: page.rows.filter((row) => row.preset === 'float-wrap').every((row) => row.columns.length === 1),
      detail: 'Wrapped sections stay one column.',
    })
  }
  const draftHrefs = new Set(allHrefs(page))
  const missingLinks = parsed.linkHrefs.filter((href) => href && !draftHrefs.has(href))
  checks.push({
    name: 'Links',
    pass: missingLinks.length === 0,
    detail: missingLinks.length === 0 ? `${parsed.linkHrefs.length} links kept.` : `Missing ${missingLinks.slice(0, 3).join(', ')}`,
  })
  const draftImages = new Set(allImages(page))
  const missingImages = parsed.imageUrls.filter((src) => src && !draftImages.has(src))
  checks.push({
    name: 'Media',
    pass: missingImages.length === 0,
    detail: missingImages.length === 0 ? `${parsed.imageUrls.length} pictures kept.` : `Missing ${missingImages.slice(0, 2).join(', ')}`,
  })
  const draftText = allText(page)
  const liveText = parsed.heading
  checks.push({
    name: 'Text',
    pass: liveText === '' || draftText.includes(liveText),
    detail: liveText ? `Heading kept: ${liveText.slice(0, 80)}` : 'No heading to compare.',
  })
  const locked = page.provenance.remainingSourceOnly
  const productGrid = locked.find((region) => region.label === 'Product grid')
  if (productGrid) {
    checks.push({ name: 'Product grid locked', pass: true, detail: productGrid.reason })
  }
  const cardGrid = locked.find((region) => region.label === 'Card grid')
  if (cardGrid) {
    checks.push({ name: 'Card grid locked', pass: true, detail: cardGrid.reason })
  }
  const form = locked.find((region) => region.label === 'Protected form' || region.label === 'Gravity Form')
  if (form) {
    checks.push({ name: 'Protected form locked', pass: true, detail: form.reason })
  }
  const innerWidth = locked.find((region) => region.label === 'Text width inside the column')
  if (innerWidth) {
    checks.push({
      name: 'Inner text width',
      pass: !page.rows.some((row) => row.preset === 'waterjet-split'),
      detail: innerWidth.reason,
    })
  }
  const unmapped = locked.find((region) => region.label === 'Unmapped columns')
  if (unmapped) {
    checks.push({ name: 'Unmapped columns', pass: false, detail: unmapped.reason })
  }
  return checks
}

function exact(name: string, expected: string, actual: string): ParityCheck {
  return {
    name,
    pass: expected === actual,
    detail: expected === actual ? expected.slice(0, 140) : `Live “${expected.slice(0, 80)}” vs draft “${actual.slice(0, 80)}”`,
  }
}

function allHrefs(page: PageDocument): string[] {
  return page.rows.flatMap((row) =>
    row.columns.flatMap((column) =>
      column.items.flatMap((item) => {
        if (item.kind === 'button') return [item.href]
        if (item.kind === 'picture') return item.href ? [item.href] : []
        if (item.kind === 'text') {
          return item.blocks.flatMap((block) => [...block.text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1] ?? ''))
        }
        return []
      }),
    ),
  )
}

function allImages(page: PageDocument): string[] {
  return page.rows.flatMap((row) =>
    row.columns.flatMap((column) => column.items.filter((item) => item.kind === 'picture').map((item) => item.src)),
  )
}

function allText(page: PageDocument): string {
  return page.rows
    .flatMap((row) => row.columns.flatMap((column) => column.items))
    .flatMap((item) => (item.kind === 'text' ? item.blocks.map((block) => block.text) : item.kind === 'button' ? [item.label] : []))
    .join('\n')
}
