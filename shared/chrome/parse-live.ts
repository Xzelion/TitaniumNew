import { parse, type HTMLElement, type Node } from 'node-html-parser'
import type { ChromeLink, FooterColumn, HeroSlide, NavGroup, NavItem, SiteChrome } from './types'

const NOTES = [
  'Each homepage slide has a headline, subcopy, background image, and buttons. LayerSlider motion and delays are not fields.',
  'Some slide words are also painted into the background picture. Editing the headline does not repaint that picture.',
  'Shop and quote addresses on qqa.titanium.com stay links. The shop app is not rebuilt.',
  'The Firearms menu item is the live label and URL. The Firearms page was not fetched.',
  'The homepage sections under the slider (welcome, product grid, markets, locations) are not part of this hero.',
  'Local Astro pages and /preview and /editor routes read this document. A production build of public pages keeps the static header, footer, and homepage hero while publishedToSite is off.',
]

export function parseLiveChrome(html: string): SiteChrome {
  const root = parse(html)
  const header = root.querySelector('#header')
  const footer = root.querySelector('#footer')
  const entry = root.querySelector('.entry-content-wrapper')
  if (!header || !footer || !entry) throw new Error('Homepage HTML is missing the header, footer, or entry')
  const menu = header.querySelector('ul#mega-menu-avia')
  if (!menu) throw new Error('Homepage HTML is missing the mega menu')
  const logo = header.querySelector('img')
  const phone = header.querySelector('a.header-contact-phone')
  const emailHref = emailFrom(header)
  return {
    id: 'site-chrome',
    siteVisibility: 'private_draft',
    publishedToSite: false,
    sourceUrl: canonical(root),
    logo: {
      src: imageUrl(logo),
      alt: clean(logo?.getAttribute('alt') || 'Titanium Industries'),
      href: absolute(logo?.parentNode && isElement(logo.parentNode) ? logo.parentNode.getAttribute('href') || '/' : '/'),
    },
    phone: {
      label: clean(phone?.text || ''),
      href: phone?.getAttribute('href') || '',
    },
    email: {
      label: emailHref.replace('mailto:', ''),
      href: emailHref,
    },
    utilityLinks: utilityLinks(header, menu),
    navigation: navigation(menu),
    footerColumns: footerColumns(footer),
    badges: badges(root),
    socialLinks: socialLinks(footer),
    legalText: legalText(root),
    heroSlides: heroSlides(entry),
    notes: NOTES,
  }
}

function navigation(menu: HTMLElement): NavItem[] {
  return childElements(menu, 'LI')
    .map(navItem)
    .filter((item) => !(item.label.toLowerCase() === 'menu' && item.groups.length === 0))
}

function navItem(li: HTMLElement): NavItem {
  return {
    label: linkLabel(li),
    href: linkHref(li),
    groups: childElements(directChild(li, 'UL'), 'LI').map(navGroup),
  }
}

function navGroup(li: HTMLElement): NavGroup {
  return {
    label: linkLabel(li),
    href: linkHref(li),
    links: childElements(directChild(li, 'UL'), 'LI').map((leaf) => ({
      label: linkLabel(leaf),
      href: linkHref(leaf),
    })),
  }
}

function utilityLinks(header: HTMLElement, menu: HTMLElement): ChromeLink[] {
  const links: ChromeLink[] = []
  for (const anchor of header.querySelectorAll('a')) {
    if (inside(anchor, menu)) continue
    const href = absolute(anchor.getAttribute('href') || '')
    const label = clean(anchor.text)
    if (!label || !href || href.startsWith('tel:') || href.startsWith('mailto:')) continue
    if (label.includes('[email') || anchor.querySelector('[data-cfemail]') || anchor.querySelector('img')) continue
    links.push({ label, href })
  }
  return uniqueLinks(links)
}

function footerColumns(footer: HTMLElement): FooterColumn[] {
  return widgetGroups(footer)
    .filter((groups) => !isSocialColumn(groups))
    .map((groups) => ({ title: '', groups }))
}

function socialLinks(footer: HTMLElement): ChromeLink[] {
  const links: ChromeLink[] = []
  for (const groups of widgetGroups(footer)) {
    if (!isSocialColumn(groups)) continue
    links.push(...groups.map((group) => ({ label: group.label, href: group.href })))
  }
  for (const widget of footer.querySelectorAll('.widget')) {
    if (widget.querySelector('ul')) continue
    for (const anchor of widget.querySelectorAll('a')) {
      const label = clean(anchor.text)
      const href = absolute(anchor.getAttribute('href') || '')
      if (!label || !href) continue
      links.push({ label, href })
    }
  }
  return uniqueLinks(links)
}

function widgetGroups(footer: HTMLElement): NavGroup[][] {
  const columns: NavGroup[][] = []
  for (const widget of footer.querySelectorAll('.widget')) {
    const menu = widget.querySelector('ul')
    if (!menu) continue
    const groups = childElements(menu, 'LI').map(navGroup).filter((group) => group.label.length > 0)
    if (groups.length > 0) columns.push(groups)
  }
  return columns
}

function isSocialColumn(groups: NavGroup[]): boolean {
  return groups.length > 0 && groups.every((group) => group.links.length === 0 && isSocial(group.href))
}

function badges(root: HTMLElement): { label: string; href: string; src: string }[] {
  const seen = new Set<string>()
  const items: { label: string; href: string; src: string }[] = []
  for (const image of root.querySelectorAll('#footer .accredited img, #socket .accredited img')) {
    const src = imageUrl(image)
    const label = clean(image.getAttribute('alt') || '')
    if (!src || seen.has(src)) continue
    seen.add(src)
    const parent = image.parentNode
    const href = isElement(parent) && parent.tagName === 'A' ? absolute(parent.getAttribute('href') || '') : ''
    items.push({ label, href, src })
  }
  return items
}

function legalText(root: HTMLElement): string {
  const socket = root.querySelector('#socket')
  if (!socket) return ''
  const clone = parse(`<div>${socket.innerHTML}</div>`).querySelector('div')
  if (!clone) return clean(socket.text)
  for (const anchor of clone.querySelectorAll('a')) anchor.remove()
  return clean(clone.text).replace(/\s+-\s*$/, '')
}

function heroSlides(entry: HTMLElement): HeroSlide[] {
  return entry.querySelectorAll('.ls-slide').map(slideFrom).filter((slide) => slide.headline.length > 0)
}

function slideFrom(slide: HTMLElement): HeroSlide {
  const background = slide.querySelector('.ls-bg')
  const callsToAction: ChromeLink[] = []
  const lines: string[] = []
  let headline = ''
  for (const layer of slide.querySelectorAll('.ls-l')) {
    const tag = layer.tagName
    if (tag === 'IMG') continue
    const heading = tag === 'H1' || tag === 'H2' ? layer : layer.querySelector('h1, h2')
    if (heading) {
      headline = clean(heading.text)
      continue
    }
    const anchors = tag === 'A' ? [layer] : layer.querySelectorAll('a')
    const labeled = uniqueLinks(
      anchors
        .map((anchor) => ({
          label: clean(anchor.text),
          href: absolute(anchor.getAttribute('href') || ''),
        }))
        .filter((link) => link.label.length > 0 && link.href.length > 0 && link.href !== '#'),
    )
    if (labeled.length > 0) {
      callsToAction.push(...labeled)
      continue
    }
    const text = clean(layer.text)
    if (!text) continue
    lines.push(text)
  }
  const titleFromLines = lines.length > 0 ? lines[lines.length - 1] : ''
  return {
    headline: headline || titleFromLines || callsToAction[0]?.label || '',
    subcopy: (headline ? lines : lines.slice(0, -1)).join('\n'),
    backgroundImage: imageUrl(background),
    callsToAction: uniqueLinks(callsToAction),
  }
}

function isSocial(href: string): boolean {
  return /twitter\.com|linkedin\.com|facebook\.com|instagram\.com|youtube\.com/i.test(href)
}

function emailFrom(header: HTMLElement): string {
  const mailto = header.querySelector('a[href^="mailto:"]')
  if (mailto) return mailto.getAttribute('href') || ''
  const hidden = header.querySelector('[data-cfemail]')
  const hex = hidden?.getAttribute('data-cfemail') || ''
  const decoded = decodeCloudflareEmail(hex)
  return decoded ? `mailto:${decoded}` : ''
}

export function decodeCloudflareEmail(hex: string): string {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < 4 || hex.length % 2 !== 0) return ''
  const key = Number.parseInt(hex.slice(0, 2), 16)
  let email = ''
  for (let index = 2; index < hex.length; index += 2) {
    email += String.fromCharCode(Number.parseInt(hex.slice(index, index + 2), 16) ^ key)
  }
  return email.includes('@') ? email : ''
}

function linkLabel(li: HTMLElement | null): string {
  return clean(directChild(li, 'A')?.text || '')
}

function linkHref(li: HTMLElement | null): string {
  return absolute(directChild(li, 'A')?.getAttribute('href') || '')
}

function directChild(node: HTMLElement | null, tag: string): HTMLElement | null {
  if (!node) return null
  return childElements(node, tag)[0] ?? null
}

function childElements(node: HTMLElement | null, tag: string): HTMLElement[] {
  if (!node) return []
  return node.childNodes.filter((child): child is HTMLElement => isElement(child) && child.tagName === tag)
}

function imageUrl(node: HTMLElement | null): string {
  if (!node) return ''
  const raw = node.getAttribute('data-src') || node.getAttribute('src') || ''
  if (!raw || raw.startsWith('data:')) return ''
  return absolute(raw)
}

function inside(node: HTMLElement, ancestor: HTMLElement): boolean {
  let current: Node | null = node
  while (current) {
    if (current === ancestor) return true
    current = current.parentNode
  }
  return false
}

function canonical(root: HTMLElement): string {
  return root.querySelector('link[rel="canonical"]')?.getAttribute('href') || 'https://titanium.com/'
}

function uniqueLinks(links: ChromeLink[]): ChromeLink[] {
  const seen = new Set<string>()
  const next: ChromeLink[] = []
  for (const link of links) {
    const key = `${link.label}|${link.href}`
    if (seen.has(key)) continue
    seen.add(key)
    next.push(link)
  }
  return next
}

function absolute(value: string): string {
  if (!value || value === '#' || value.startsWith('mailto:') || value.startsWith('tel:')) return value
  try {
    return new URL(value, 'https://titanium.com').href
  } catch {
    return value
  }
}

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function isElement(node: Node): node is HTMLElement {
  return typeof (node as HTMLElement).tagName === 'string'
}
