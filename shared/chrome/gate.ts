export interface ChromeRenderContext {
  /** True for `astro dev`. False for `astro build`. */
  dev: boolean
  pathname: string
}

/**
 * Unpublished chrome is for local dev and preview/editor routes.
 * A production build of a public page keeps the static header until publishedToSite is on.
 */
export function shouldRenderSiteChrome(
  chrome: { publishedToSite: boolean } | null,
  context: ChromeRenderContext,
): boolean {
  if (!chrome) return false
  if (chrome.publishedToSite) return true
  if (context.dev) return true
  return context.pathname.startsWith('/preview') || context.pathname.startsWith('/editor')
}
