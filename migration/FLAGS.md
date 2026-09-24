# Flags for the human

These items stopped because they need WordPress admin, a Cloudflare allow, or a decision only a person should make. Everything else in this branch continued.

Hosted conversions of existing pages: **0**. The twenty drafts in this repository are candidate dry-runs. The readiness screen says **Planned / awaiting integration**, not Ready and not Partly converted on the hosted CMS.

## Handoff notes that this repository cannot confirm

1. **Quality source slice hash** `96850dd25a3d1d4175637bd26b24007253ed58404b8600704d1bd6a1835457e9` (30 blocks, 20 links, zero images) is not in this repository. The candidate uses the public HTML, which includes the title row, the three buttons, and the two-fifths / three-fifths documents row. It is a different hash. Do not treat it as that work-copy slice.
2. **The 419-page register** (`published-pages.json`, SHA-256 `5afd9a32731af2b58824a893917e817dab1740e9c9e8822faefb02d90f428873`) is not in this repository. The readiness screen keeps those pages at **Not yet verified**.
3. **Social icon size.** Local notes say 44px. The public HTML `width` and `data-sizes` on the icon images are **59px**. This candidate uses 59px. It does not invent 44px.
4. **Oil & Gas Create Quote.** Local notes say the words have no link. The public HTML is a button to the quote URL. This candidate keeps that button.
5. **Interconnect width.** Local notes say two-thirds / one-third. The public HTML is three-quarters / one-quarter. This candidate keeps three-quarters / one-quarter.
6. **Firearms whole intro.** Local notes describe three buttons, five social images, and a line card. The public URL is still Cloudflare 403 here, so that grid is not converted.
7. **Fastener and Oil & Gas photos.** Local notes say the fastener photo is stacked in the column and is not floated in the paragraph. The public HTML gives that photo `class="left"` and the page CSS `.left { float: left; margin: 8px 16px 0 0 }`. This candidate floats the photo inside the wide column. It does not turn that row into the Medical full-width wrap.

## Need from WordPress admin

1. **Firearms layout** — `https://titanium.com/markets/firearms/` returns Cloudflare 403 from this environment (the block page names `wpewaf.com`). The public text is visible through a reader view, but the column classes are not. Do not guess the grid. Please export the page HTML from WordPress, or allow this host, and re-run `npm run convert` after placing the file at `migration/raw/firearms.html`.
2. **Additive Manufacturing form** — Gravity Form **20** on `https://titanium.com/markets/additive-manufacturing-build-plates/` is on the public page and protected by hCaptcha. The draft keeps the surrounding columns and records the form as source-only. It does not submit the form. Please export Gravity Form 20 (fields, conditional logic, notifications, confirmations, file upload). Visible labels include metals, alloy/grade, product form, size, quantity, delivery date, contact fields, and attach file.
3. **Product grids** — Oil & Gas and Aerospace render a WordPress portfolio/query grid. Those regions are marked source-only. An export of the portfolio query, or a decision to recreate the icons as normal picture cards, is still open. Defense has the same grid and was not drafted (see the column note below).
4. **The other public URLs** — This repository did not contain the earlier capture of about 419 pages. Public sitemaps currently list **404** URLs (305 pages, 65 posts, 30 portfolio items, 3 categories, 1 local). Twenty layouts are converted below. Unpublished WordPress drafts, redirects, and menu-only links are not in that sitemap.
5. **Defense column widths** — `https://titanium.com/markets/defense/` has a row of three-fifths + two-fifths. The quality preset is the other way around (two-fifths + three-fifths). That row was not forced into a full-width column, and the page was not drafted.
6. **Industrial column widths** — `https://titanium.com/markets/industrial/` has a row of one-half + one-quarter + one-quarter, plus floated pictures. There is no named preset for that trio, so the page was not drafted.
7. **Consumer products column widths** — `https://titanium.com/markets/consumer-products/` opens with a four-fifths column and also uses sixths. Those widths are not named presets, so the page was not drafted.
8. **Card grids** — `/markets/` and `/processing/` include a custom card grid (theme CSS: each card `width: 24%`, four across, full width under 768px). The drafts keep the button row and the introduction, and lock the cards. They were not stacked into one column. A named preset, or a decision to recreate them as picture cards, is still open.
9. **Inner 55% text width** — Heat treating and coil slitting include the same custom CSS as water jet (text block 55%, picture 40%, picture 20px lower). On those two pages the picture and words are not a full-width pair, so the draft keeps the Enfold columns (three-quarters, and two-fifths + three-fifths) and does not invent the water-jet split. The live text block is still floated to 55% inside its column.
10. **Canonical duplicates** — `https://titanium.com/processing/kitting-services/` canonicalizes to `https://titanium.com/services/`. One private draft covers `/services/`. `https://titanium.com/markets/industrial/oil-gas/` canonicalizes to `https://titanium.com/oil-gas/`. It was not written over the Oil & Gas draft.

## Checked on the public site, no admin needed

- **Water jet** `https://titanium.com/processing/water-jet-cutting/` uses page CSS `words 55% / picture 40% / picture 20px lower` plus the theme rule `.avia-image-container.avia-align-left { margin-right: 15px }`. The draft uses that measured split. It is not three equal columns.
- **Medical** `https://titanium.com/markets/medical/` uses `.left { float: left; margin: 8px 16px 0 0 }` and `.right { float: right; margin: 8px 0 0 16px }`. Pictures keep those wraps inside one column.
- **Quality** is a two-fifths + three-fifths row. **Oil & Gas** and **Fastener Alloys** are a two-thirds story plus a one-third line card. **Interconnect** is three-quarters plus one-quarter, not the two-thirds family.
- **Chamfering, grinding, saw cutting, shearing, torch cutting, and trepanning** use the same page CSS as water jet: words 55%, picture 40%, 15px gap, picture 20px lower. Each draft uses that measured split. PVC coating does not include that CSS, so it stays full-width columns.
- **Coil slitting** is a two-fifths picture plus a three-fifths story (the quality split), not the water-jet split.
- **Aerospace** uses the medical float (pictures with `left` / `right` inside one column) plus a two-thirds story and a one-third line card. The product icons stay locked.
- **Oil & Gas** and **Additive** were rebuilt from current public HTML because the captured column HTML changed (an image address no longer uses the `.webp` proxy). Nobody had edited those drafts. The grids are unchanged.
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
| `/processing/chamfering/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/processing/grinding/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/processing/saw-cutting/` | equal 3-button row, measured picture split | full, thirds, waterjet-split, full, halves |
| `/processing/shearing/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/processing/torch-cutting/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/processing/trepanning/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/processing/coil-slitting/` | equal 3-button row, quality split; inner 55% noted | full, thirds, quality-split |
| `/processing/heat-treating/` | equal 3-button row, three-quarter story; inner 55% noted | full, thirds, lead-three-quarters |
| `/processing/pvc-coating/` | equal 3-button row, full-width story | full, thirds |
| `/processing/` | equal 3-button row; 24% card grid locked | lead-three-fifths, thirds, full |
| `/markets/` | three buttons (Contact, Quote, Weight Calculator); 24% card grid locked | lead-two-thirds, thirds, full |
| `/services/` | equal 3-button row, two equal service columns | full, thirds, halves |
| `/markets/aerospace/` | equal 3-button row, line card, float wrap; product grid locked | lead-three-fifths, thirds, two-one, float-wrap |

Parity against the live HTML (title, description, canonical, Open Graph title and description, links, pictures, and the measured layouts) passed for all twenty. Locked card grids, portfolio queries, and the Gravity Form are excluded from the picture check and called out in the report. Evidence: `migration/reports/parity.json`.

## Families still open

- Home hero slider and the multi-section homepage.
- Defense, Industrial, and Consumer Products (unmapped column widths above). Giving Back alternates three-fifths + two-fifths with the quality split. Careers mixes two-fifths with one-half. About opens at four-fifths.
- Alloy and technical-data pages.
- 65 blog posts.
- Location pages, contact (Gravity Form), and the local sitemap entry.
- Firearms (blocked, above).
- Header, footer, and mega menu. Footer “T.I. Approvals” logos are site chrome, not part of these page drafts.
- Shop and quote apps on `qqa.titanium.com` (linked, not rebuilt).
