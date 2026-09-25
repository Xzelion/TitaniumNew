const ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPE[char] ?? char)
}

const LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g

export function renderInline(markdown: string): string {
  const parts: string[] = []
  let last = 0
  for (const match of markdown.matchAll(LINK)) {
    const index = match.index ?? 0
    parts.push(escapeHtml(markdown.slice(last, index)))
    const label = escapeHtml(match[1] ?? '')
    const href = escapeHtml(match[2] ?? '')
    parts.push(`<a href="${href}">${label}</a>`)
    last = index + match[0].length
  }
  parts.push(escapeHtml(markdown.slice(last)))
  return parts.join('')
}
