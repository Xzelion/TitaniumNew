import type { TextBlock } from './types'

const HEADING_LEVELS = [1, 2, 3, 4] as const

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

export function markdownToBlocks(markdown: string): TextBlock[] {
  const chunks = markdown
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  return chunks.map((chunk) => {
    const heading = /^(#{1,4})\s+([\s\S]+)$/.exec(chunk)
    if (heading) {
      const level = heading[1].length
      if (level === 1 || level === 2 || level === 3 || level === 4) {
        return { type: 'heading' as const, level, text: heading[2].trim() }
      }
    }
    return { type: 'paragraph' as const, text: chunk }
  })
}

export function headingLevels(): readonly number[] {
  return HEADING_LEVELS
}
