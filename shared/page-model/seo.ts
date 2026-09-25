import type { SeoFields } from './types'

export interface SeoCheck {
  id: 'title' | 'description' | 'canonical' | 'ogTitle' | 'ogDescription' | 'ogImage'
  label: string
  ok: boolean
  blocking: boolean
  detail: string
}

const TITLE_MAX = 60
const DESCRIPTION_MIN = 50
const DESCRIPTION_MAX = 160

export function seoChecks(seo: SeoFields): SeoCheck[] {
  const title = seo.title.trim()
  const description = seo.description.trim()
  const canonical = seo.canonical.trim()
  let canonicalOk = false
  let canonicalDetail = 'Add the preferred web address from the live page.'
  if (canonical) {
    try {
      const url = new URL(canonical)
      canonicalOk = url.protocol === 'https:' && (url.hostname === 'titanium.com' || url.hostname === 'www.titanium.com')
      canonicalDetail = canonicalOk
        ? canonical
        : 'Use an https address on titanium.com.'
    } catch {
      canonicalDetail = 'This address is not a full web address.'
    }
  }

  const titleOk = title.length > 0 && title.length <= TITLE_MAX
  const descriptionOk = description.length >= DESCRIPTION_MIN && description.length <= DESCRIPTION_MAX

  return [
    {
      id: 'title',
      label: 'Page title in Google',
      ok: titleOk,
      blocking: true,
      detail: title
        ? titleOk
          ? `${title.length} characters. Fine for Google.`
          : `${title.length} characters. Shorten it to ${TITLE_MAX} or fewer.`
        : 'Add the title people should see in Google.',
    },
    {
      id: 'description',
      label: 'Short description',
      ok: descriptionOk,
      blocking: true,
      detail: description
        ? descriptionOk
          ? `${description.length} characters. A good length for Google.`
          : `${description.length} characters. Aim for ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}.`
        : 'Add one or two sentences that describe the page.',
    },
    {
      id: 'canonical',
      label: 'Preferred web address',
      ok: canonicalOk,
      blocking: true,
      detail: canonicalDetail,
    },
    {
      id: 'ogTitle',
      label: 'Social share title',
      ok: seo.ogTitle.trim().length > 0,
      blocking: false,
      detail: seo.ogTitle.trim() ? seo.ogTitle.trim() : 'Add the title for Facebook and LinkedIn.',
    },
    {
      id: 'ogDescription',
      label: 'Social share description',
      ok: seo.ogDescription.trim().length > 0,
      blocking: false,
      detail: seo.ogDescription.trim() ? 'Filled in.' : 'Add the sentence for Facebook and LinkedIn.',
    },
    {
      id: 'ogImage',
      label: 'Social share image',
      ok: seo.ogImage.trim().length > 0,
      blocking: false,
      detail: seo.ogImage.trim() ? seo.ogImage.trim() : 'Add a picture address for social shares.',
    },
  ]
}

export function blockingSeoFailures(seo: SeoFields): SeoCheck[] {
  return seoChecks(seo).filter((check) => check.blocking && !check.ok)
}
