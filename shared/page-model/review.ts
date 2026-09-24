import type { ColumnItem, PageDocument } from './types'

export interface ReviewFacts {
  texts: string[]
  hrefs: string[]
  images: string[]
}

/** Walk every column item. Nested words, links, and pictures stay visible to review. */
export function reviewFacts(page: PageDocument): ReviewFacts {
  const texts: string[] = []
  const hrefs: string[] = []
  const images: string[] = []
  for (const row of page.rows) {
    for (const column of row.columns) {
      for (const item of column.items) collectItem(item, texts, hrefs, images)
    }
  }
  return { texts, hrefs, images }
}

function collectItem(item: ColumnItem, texts: string[], hrefs: string[], images: string[]): void {
  if (item.kind === 'text') {
    for (const block of item.blocks) texts.push(block.text)
    return
  }
  if (item.kind === 'picture') {
    images.push(item.src)
    if (item.href) hrefs.push(item.href)
    return
  }
  if (item.kind === 'button') {
    texts.push(item.label)
    if (item.href) hrefs.push(item.href)
    return
  }
  const unexpected: never = item
  throw new Error(`Unknown item ${String(unexpected)}`)
}

/** Needles that a nested walk cannot find. An empty list means nothing was dropped. */
export function nestedReviewMisses(needles: string[], page: PageDocument): string[] {
  const facts = reviewFacts(page)
  const haystack = [...facts.texts, ...facts.hrefs, ...facts.images].join('\n')
  return needles.filter((needle) => needle.length > 0 && !haystack.includes(needle))
}
