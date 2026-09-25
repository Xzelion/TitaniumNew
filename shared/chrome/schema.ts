import type {
  ChromeBadge,
  ChromeLink,
  FooterColumn,
  HeroSlide,
  NavGroup,
  NavItem,
  SiteChrome,
} from './types'

export class ChromeSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChromeSchemaError'
  }
}

export function parseSiteChrome(value: unknown): SiteChrome {
  const record = expectRecord(value, 'Site chrome')
  if (record.id !== 'site-chrome') throw new ChromeSchemaError('Site chrome id must be site-chrome')
  if (record.siteVisibility !== 'private_draft') throw new ChromeSchemaError('Site chrome must stay a private draft')
  if (record.publishedToSite !== false) throw new ChromeSchemaError('Site chrome must not be published to the public site')
  const logo = expectRecord(record.logo, 'Logo')
  return {
    id: 'site-chrome',
    siteVisibility: 'private_draft',
    publishedToSite: false,
    sourceUrl: expectString(record.sourceUrl, 'Source URL'),
    logo: {
      src: expectString(logo.src, 'Logo image'),
      alt: expectString(logo.alt, 'Logo alt'),
      href: expectString(logo.href, 'Logo link'),
    },
    phone: parseLink(record.phone, 'Phone'),
    email: parseLink(record.email, 'Email'),
    utilityLinks: parseLinks(record.utilityLinks, 'Utility links'),
    navigation: parseNav(record.navigation),
    footerColumns: parseFooter(record.footerColumns),
    badges: parseBadges(record.badges),
    socialLinks: parseLinks(record.socialLinks, 'Social links'),
    legalText: expectString(record.legalText, 'Legal text'),
    heroSlides: parseSlides(record.heroSlides),
    notes: expectStringList(record.notes, 'Notes'),
  }
}

function parseNav(value: unknown): NavItem[] {
  if (!Array.isArray(value) || value.length === 0) throw new ChromeSchemaError('Navigation needs at least one item')
  return value.map((item, index) => {
    const record = expectRecord(item, `Navigation item ${index + 1}`)
    return {
      label: expectString(record.label, `Navigation item ${index + 1} label`),
      href: expectString(record.href, `Navigation item ${index + 1} link`),
      groups: parseGroups(record.groups, `Navigation item ${index + 1}`),
    }
  })
}

function parseFooter(value: unknown): FooterColumn[] {
  if (!Array.isArray(value)) throw new ChromeSchemaError('Footer columns must be a list')
  return value.map((column, index) => {
    const record = expectRecord(column, `Footer column ${index + 1}`)
    return {
      title: expectString(record.title, `Footer column ${index + 1} title`),
      groups: parseGroups(record.groups, `Footer column ${index + 1}`),
    }
  })
}

function parseGroups(value: unknown, label: string): NavGroup[] {
  if (!Array.isArray(value)) throw new ChromeSchemaError(`${label} groups must be a list`)
  return value.map((group, index) => {
    const record = expectRecord(group, `${label} group ${index + 1}`)
    return {
      label: expectString(record.label, `${label} group ${index + 1} label`),
      href: expectString(record.href, `${label} group ${index + 1} link`),
      links: parseLinks(record.links, `${label} group ${index + 1}`),
    }
  })
}

function parseSlides(value: unknown): HeroSlide[] {
  if (!Array.isArray(value) || value.length === 0) throw new ChromeSchemaError('Homepage hero needs at least one slide')
  return value.map((slide, index) => {
    const record = expectRecord(slide, `Hero slide ${index + 1}`)
    const headline = expectString(record.headline, `Hero slide ${index + 1} headline`)
    if (!headline.trim()) throw new ChromeSchemaError(`Hero slide ${index + 1} headline is empty`)
    return {
      headline,
      subcopy: expectString(record.subcopy, `Hero slide ${index + 1} subcopy`),
      backgroundImage: expectString(record.backgroundImage, `Hero slide ${index + 1} background`),
      callsToAction: parseLinks(record.callsToAction, `Hero slide ${index + 1}`),
    }
  })
}

function parseBadges(value: unknown): ChromeBadge[] {
  if (!Array.isArray(value)) throw new ChromeSchemaError('Footer badges must be a list')
  return value.map((badge, index) => {
    const record = expectRecord(badge, `Footer badge ${index + 1}`)
    return {
      label: expectString(record.label, `Footer badge ${index + 1} label`),
      href: expectString(record.href, `Footer badge ${index + 1} link`),
      src: expectString(record.src, `Footer badge ${index + 1} image`),
    }
  })
}

function parseLinks(value: unknown, label: string): ChromeLink[] {
  if (!Array.isArray(value)) throw new ChromeSchemaError(`${label} links must be a list`)
  return value.map((link, index) => parseLink(link, `${label} link ${index + 1}`))
}

function parseLink(value: unknown, label: string): ChromeLink {
  const record = expectRecord(value, label)
  return {
    label: expectString(record.label, `${label} label`),
    href: expectString(record.href, `${label} link`),
  }
}

function expectStringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ChromeSchemaError(`${label} must be a list of text`)
  }
  return value
}

function expectString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new ChromeSchemaError(`${label} must be text`)
  return value
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ChromeSchemaError(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}
