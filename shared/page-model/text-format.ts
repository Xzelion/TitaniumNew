import type { TextBlock } from './types'

const HEADING_LEVELS = [1, 2, 3, 4, 5] as const

export function blocksToMarkdown(blocks: TextBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'heading') {
        const level = block.level ?? 2
        return `${'#'.repeat(level)} ${block.text}`
      }
      return block.text
    })
    .join('\n\n')
}

export function markdownToBlocks(markdown: string, previous: TextBlock[] = []): TextBlock[] {
  const chunks = markdown
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  return chunks.map((chunk, index) => {
    const heading = /^(#{1,5})\s+([\s\S]+)$/.exec(chunk)
    let block: TextBlock
    if (heading) {
      const level = heading[1].length
      if (level === 1 || level === 2 || level === 3 || level === 4 || level === 5) {
        block = { type: 'heading', level, text: heading[2].trim() }
      } else {
        block = { type: 'paragraph', text: chunk }
      }
    } else {
      block = { type: 'paragraph', text: chunk }
    }
    const prior = previous[index]
    if (prior && prior.type === block.type) {
      if (prior.tone) block.tone = prior.tone
      if (prior.align) block.align = prior.align
    }
    return block
  })
}

export function headingLevels(): readonly number[] {
  return HEADING_LEVELS
}
