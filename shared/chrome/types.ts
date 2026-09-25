export interface ChromeLink {
  label: string
  href: string
}

export interface ChromeBadge {
  label: string
  href: string
  src: string
}

export interface NavGroup {
  label: string
  href: string
  links: ChromeLink[]
}

export interface NavItem {
  label: string
  href: string
  groups: NavGroup[]
}

export interface FooterColumn {
  title: string
  groups: NavGroup[]
}

export interface HeroSlide {
  headline: string
  subcopy: string
  backgroundImage: string
  callsToAction: ChromeLink[]
}

export interface SiteChrome {
  id: 'site-chrome'
  siteVisibility: 'private_draft'
  publishedToSite: false
  sourceUrl: string
  logo: { src: string; alt: string; href: string }
  phone: ChromeLink
  email: ChromeLink
  utilityLinks: ChromeLink[]
  navigation: NavItem[]
  footerColumns: FooterColumn[]
  badges: ChromeBadge[]
  socialLinks: ChromeLink[]
  legalText: string
  heroSlides: HeroSlide[]
  notes: string[]
}
