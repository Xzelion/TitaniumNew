import { escapeHtml } from '../render/escape'
import type { ChromeLink, NavGroup, SiteChrome } from './types'

export function renderChromeHeader(chrome: SiteChrome): string {
  const utility = [chrome.phone, chrome.email, ...chrome.utilityLinks].map(linkHtml).join('')
  const menu = chrome.navigation
    .map((item) => {
      if (item.groups.length === 0) {
        return `<a class="chrome-nav-link" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
      }
      const groups = item.groups.map(groupHtml).join('')
      return `<details class="chrome-mega"><summary>${escapeHtml(item.label)}</summary><div class="chrome-mega-panel"><p><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></p>${groups}</div></details>`
    })
    .join('')
  return `<header class="site-chrome-header" data-site-chrome="header">
    <div class="chrome-bar">
      <a href="${escapeHtml(chrome.logo.href)}"><img class="chrome-logo" src="${escapeHtml(chrome.logo.src)}" alt="${escapeHtml(chrome.logo.alt)}" /></a>
      <div class="chrome-utility">${utility}</div>
    </div>
    <nav class="chrome-nav" aria-label="Primary">${menu}</nav>
  </header>`
}

export function renderChromeFooter(chrome: SiteChrome): string {
  const columns = chrome.footerColumns
    .map((column) => `<div class="chrome-footer-col">${column.title ? `<h2>${escapeHtml(column.title)}</h2>` : ''}${column.groups.map(groupHtml).join('')}</div>`)
    .join('')
  const badges = chrome.badges
    .map((badge) => {
      const image = `<img src="${escapeHtml(badge.src)}" alt="${escapeHtml(badge.label)}" height="64" />`
      return badge.href ? `<a href="${escapeHtml(badge.href)}">${image}</a>` : image
    })
    .join('')
  const social = chrome.socialLinks.map(linkHtml).join('')
  return `<footer class="site-chrome-footer" data-site-chrome="footer">
    <div class="chrome-footer-grid">${columns}</div>
    <div class="chrome-badges">${badges}</div>
    <p class="chrome-social">${social}</p>
    <p class="chrome-legal">${escapeHtml(chrome.legalText)}</p>
  </footer>`
}

export function renderChromeHero(chrome: SiteChrome): string {
  const slides = chrome.heroSlides
    .map((slide, index) => {
      const buttons = slide.callsToAction.map((link) => `<a class="chrome-cta" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')
      const copy = slide.subcopy
        ? `<p>${escapeHtml(slide.subcopy).replaceAll('\n', '<br />')}</p>`
        : ''
      return `<article class="chrome-slide" data-chrome-slide="${index}" style="background-image:url('${cssUrl(slide.backgroundImage)}')" ${index === 0 ? '' : 'hidden'}>
        <div class="chrome-slide-copy">
          <h2>${escapeHtml(slide.headline)}</h2>
          ${copy}
          ${buttons}
        </div>
      </article>`
    })
    .join('')
  const dots = chrome.heroSlides
    .map((slide, index) => `<button type="button" class="chrome-dot" data-chrome-dot="${index}" aria-label="${escapeHtml(slide.headline)}"></button>`)
    .join('')
  return `<section class="chrome-hero" data-site-chrome="hero" aria-label="Homepage hero">
    ${slides}
    <div class="chrome-dots">${dots}</div>
    <script>
      (function () {
        var root = document.currentScript && document.currentScript.parentElement
        if (!root) return
        var slides = root.querySelectorAll('[data-chrome-slide]')
        var dots = root.querySelectorAll('[data-chrome-dot]')
        if (!slides.length) return
        var current = 0
        function show(next) {
          current = (next + slides.length) % slides.length
          slides.forEach(function (slide, index) { slide.hidden = index !== current })
          dots.forEach(function (dot, index) { dot.setAttribute('aria-current', index === current ? 'true' : 'false') })
        }
        dots.forEach(function (dot, index) { dot.addEventListener('click', function () { show(index) }) })
        setInterval(function () { show(current + 1) }, 7000)
      })()
    </script>
  </section>`
}

function groupHtml(group: NavGroup): string {
  const links = group.links.map((link) => `<li>${linkHtml(link)}</li>`).join('')
  return `<section><h3><a href="${escapeHtml(group.href)}">${escapeHtml(group.label)}</a></h3>${links ? `<ul>${links}</ul>` : ''}</section>`
}

function linkHtml(link: ChromeLink): string {
  return `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`
}

function cssUrl(value: string): string {
  return escapeHtml(value).replace(/['"()\\]/g, '')
}
