# Flags for the human

These items stopped because they need WordPress admin, a Cloudflare allow, or a decision only a person should make. Everything else in this branch continued.

## Need from WordPress admin

1. **Firearms layout** — `https://titanium.com/markets/firearms/` returns Cloudflare 403 from this environment (the block page names `wpewaf.com`). The public text is visible through a reader view, but the column classes are not. Do not guess the grid. Please export the page HTML from WordPress, or allow this host, and re-run `npm run convert` after placing the file at `migration/raw/firearms.html`.
2. **Additive Manufacturing form** — Gravity Form **20** on `https://titanium.com/markets/additive-manufacturing-build-plates/` is on the public page and protected by hCaptcha. The draft keeps the surrounding columns and records the form as source-only. It does not submit the form. Please export Gravity Form 20 (fields, conditional logic, notifications, confirmations, file upload). Visible labels include metals, alloy/grade, product form, size, quantity, delivery date, contact fields, and attach file.
3. **Product grids** — Oil & Gas (and similar market pages) render a WordPress portfolio/query grid. Those regions are marked source-only. An export of the portfolio query, or a decision to recreate the icons as normal picture cards, is still open.
4. **The other ~400 public URLs** — This repository did not contain the earlier capture of about 419 pages. Public sitemaps currently list **404** URLs (305 pages, 65 posts, 30 portfolio items, 3 categories, 1 local). Only the seven layouts below were converted. Unpublished WordPress drafts, redirects, and menu-only links are not in that sitemap.

## Checked on the public site, no admin needed

- **Water jet** `https://titanium.com/processing/water-jet-cutting/` uses page CSS `words 55% / picture 40% / picture 20px lower` plus the theme rule `.avia-image-container.avia-align-left { margin-right: 15px }`. The draft uses that measured split. It is not three equal columns.
- **Medical** `https://titanium.com/markets/medical/` uses `.left { float: left; margin: 8px 16px 0 0 }` and `.right { float: right; margin: 8px 0 0 16px }`. Pictures keep those wraps inside one column.
- **Quality** is a two-fifths + three-fifths row. **Oil & Gas** and **Fastener Alloys** are a two-thirds story plus a one-third line card. **Interconnect** is three-quarters plus one-quarter, not the two-thirds family.
- Standard Enfold columns use a **6%** gap after the first column (`margin-left: 6%` in the live theme CSS). That spacing is part of the named presets. It is not a free-form measurement.

## Do not do these from this branch

- No DNS changes.
- No WordPress cutover.
- No public Netlify publish. Converted pages are `private_draft`, preview URLs are `noindex`, and a Payload “Published version” still does not switch the public site.
- The existing Astro layout still builds canonical URLs on `https://titaniumind.com`. Live canonicals are `https://titanium.com`. CMS previews use the live canonical. The rest of the Astro site was left as-is.

## Pages Marketing can edit now

| Path | Families | Grid |
| --- | --- | --- |
| `/quality-systems/` | equal 3-button row, quality split | lead-two-thirds, thirds, quality-split |
| `/oil-gas/` | equal 3-button row, wide story + line card | lead-three-fifths, thirds, two-one, full |
| `/markets/fastener-alloys/` | equal 3-button row, wide story + line card | lead-three-quarters, thirds, two-one |
| `/interconnect-alloys/` | equal 3-button row, wide story + slim line card | thirds, three-one |
| `/markets/medical/` | equal 3-button row, line card, float wrap | full, thirds, two-one, halves, float-wrap |
| `/processing/water-jet-cutting/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/markets/additive-manufacturing-build-plates/` | equal 3-button row, line card; form blocked | lead-three-fifths, thirds, two-one |

Parity against the live HTML (title, description, canonical, Open Graph title and description, links, pictures, and the measured layouts) passed for all seven. Evidence: `migration/reports/parity.json`.

## Families still open

- Home hero slider and the multi-section homepage.
- Aerospace and other markets whose product icons are portfolio queries.
- Other processing pages (saw, chamfer, torch, grinding, trepanning, slitting, shearing). Do not copy the water jet measurements onto them.
- Alloy and technical-data pages.
- 65 blog posts.
- Location pages and the local sitemap entry.
- Firearms (blocked, above).
- Header, footer, and mega menu.
- Shop and quote apps on `qqa.titanium.com` (linked, not rebuilt).
