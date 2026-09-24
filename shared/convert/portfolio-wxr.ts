/**
 * Oil & Gas portfolio cards from a WordPress WXR export.
 * Public order is the order on https://titanium.com/oil-gas/, not the XML order.
 * Card bodies stay out of the industry grid. Tube and pipe are empty in the export.
 */

export interface PortfolioCard {
  wpId: number
  title: string
  href: string
  imageUrl: string
  bodyEmpty: boolean
}

export const OIL_GAS_PUBLIC_ORDER = [6427, 6423, 6433, 6431, 6429, 6394, 6399] as const

interface DraftCard {
  wpId: number
  title: string
  href: string
  thumbId: string
  bodyEmpty: boolean
}

export function oilGasCardsFromWxr(xml: string): PortfolioCard[] {
  const attachments = new Map<string, string>()
  const cards = new Map<number, DraftCard>()
  for (const item of xml.split('<item>').slice(1)) {
    const type = cdata(item, 'wp:post_type')
    const id = plain(item, 'wp:post_id')
    if (type === 'attachment') {
      const url = cdata(item, 'wp:attachment_url')
      if (id && url) attachments.set(id, url)
      continue
    }
    if (type !== 'portfolio' || !item.includes('nicename="oil-gas"')) continue
    const wpId = Number(id)
    if (!wpId) continue
    cards.set(wpId, {
      wpId,
      title: decodeXml(cdata(item, 'title')),
      href: meta(item, '_portfolio_custom_link_url'),
      thumbId: meta(item, '_thumbnail_id'),
      bodyEmpty: visibleText(cdata(item, 'content:encoded')).length === 0,
    })
  }
  return OIL_GAS_PUBLIC_ORDER.map((wpId) => {
    const card = cards.get(wpId)
    if (!card) throw new Error(`Oil & Gas portfolio item ${wpId} is missing from the export`)
    const imageUrl = attachments.get(card.thumbId)
    if (!imageUrl) throw new Error(`Oil & Gas portfolio item ${wpId} has no featured image`)
    return {
      wpId: card.wpId,
      title: card.title,
      href: card.href,
      imageUrl,
      bodyEmpty: card.bodyEmpty,
    }
  })
}

function cdata(item: string, tag: string): string {
  const pattern = new RegExp(`<${escapeTag(tag)}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${escapeTag(tag)}>`)
  return pattern.exec(item)?.[1] ?? ''
}

function plain(item: string, tag: string): string {
  const pattern = new RegExp(`<${escapeTag(tag)}>([^<]*)</${escapeTag(tag)}>`)
  return pattern.exec(item)?.[1]?.trim() ?? ''
}

function meta(item: string, key: string): string {
  const pattern = new RegExp(
    `<wp:meta_key><!\\[CDATA\\[${escapeTag(key)}\\]\\]></wp:meta_key>\\s*<wp:meta_value><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></wp:meta_value>`,
  )
  return pattern.exec(item)?.[1]?.trim() ?? ''
}

function visibleText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeXml(value: string): string {
  return value
    .replace(/&#0?38;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .trim()
}

function escapeTag(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
