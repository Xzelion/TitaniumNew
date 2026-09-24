# Flags for the human

These items stopped because they need WordPress admin, a Cloudflare allow, or a decision only a person should make. Everything else in this branch continued.

Hosted conversions of existing pages: **0**. The thirty-three drafts in this repository are candidate dry-runs. The readiness screen says **Planned / awaiting integration**, not Ready and not Partly converted on the hosted CMS.

## Handoff notes that this repository cannot confirm

1. **Quality source slice hash** `96850dd25a3d1d4175637bd26b24007253ed58404b8600704d1bd6a1835457e9` (30 blocks, 20 links, zero images) is not in this repository. The candidate uses the public HTML, which includes the title row, the three buttons, and the two-fifths / three-fifths documents row. It is a different hash. Do not treat it as that work-copy slice.
2. **The 419-page register** (`published-pages.json`, SHA-256 `5afd9a32731af2b58824a893917e817dab1740e9c9e8822faefb02d90f428873`) is not in this repository. The readiness screen keeps those pages at **Not yet verified**.
3. **Social icon size.** Local notes say 44px. The public HTML `width` and `data-sizes` on the icon images are **59px**. This candidate uses 59px. It does not invent 44px.
4. **Oil & Gas Create Quote.** Local notes say the words have no link. The public HTML is a button to `https://qqa.titanium.com/customer/quick-quote`. This candidate keeps that button. The portfolio export does not remove it.
5. **Interconnect width.** Local notes say two-thirds / one-third. The public HTML is three-quarters / one-quarter. This candidate keeps three-quarters / one-quarter.
6. **Firearms whole intro.** Local notes describe three buttons, five social images, and a line card. The public URL is still Cloudflare 403 here, so that grid is not converted.
7. **Fastener and Oil & Gas photos.** Local notes say the fastener photo is stacked in the column and is not floated in the paragraph. The public HTML gives that photo `class="left"` and the page CSS `.left { float: left; margin: 8px 16px 0 0 }`. This candidate floats the photo inside the wide column. It does not turn that row into the Medical full-width wrap.

## Need from WordPress admin

1. **Firearms layout** — `https://titanium.com/markets/firearms/` returns Cloudflare 403 from this environment (the block page names `wpewaf.com`). The public text is visible through a reader view, but the column classes are not. Do not guess the grid. Please export the page HTML from WordPress, or allow this host, and re-run `npm run convert` after placing the file at `migration/raw/firearms.html`.
2. **Additive Manufacturing form — export received.** Gravity Form **20**, “Additive Build Plates RFQ”, is saved at `migration/raw/gravity-form-20.json` and modeled at `migration/forms/gravity-form-20.model.json` (39 fields, conditional alloy and dimension rules, 19 notifications, 1 confirmation, file upload, hCaptcha). The draft does **not** submit it. Public submit stays off until a person says to turn it on. hCaptcha has no site key or secret in the export (`needs_keys`). Notification routing is recorded and marked `needs_keys`; nothing is emailed. The file upload is not wired.
3. **Product grids** — Oil & Gas portfolio export received (`migration/raw/oil-gas-portfolio.xml`, notes in `migration/raw/oil-gas-notes.md`). The `/oil-gas/` product module is seven picture cards in the public order: Round Bar, Plate, Sheet, Seamless Tube, Seamless Pipe, Billet, Coil. Each card uses the featured image and the portfolio custom link. Seamless Tube and Seamless Pipe have empty body HTML in the export. The other five items have body HTML in the export; that body stays off the industry grid. Aerospace, Defense, and Consumer Products still render a WordPress portfolio query. Those grids stay locked. They did not receive the Oil & Gas cards.
4. **The other public URLs** — This repository did not contain the earlier capture of about 419 pages. Public sitemaps currently list **404** URLs (305 pages, 65 posts, 30 portfolio items, 3 categories, 1 local). Thirty-three layouts are converted below. Unpublished WordPress drafts, redirects, and menu-only links are not in that sitemap.
5. **Card grids** — `/markets/` and `/processing/` include a custom card grid (theme CSS: each card `width: 24%`, four across, full width under 768px). The drafts keep the button row and the introduction, and lock the cards. They were not stacked into one column. A named preset, or a decision to recreate them as picture cards, is still open.
6. **Inner 55% text width** — Heat treating and coil slitting include the same custom CSS as water jet (text block 55%, picture 40%, picture 20px lower). On those two pages the picture and words are not a full-width pair, so the draft keeps the Enfold columns (three-quarters, and two-fifths + three-fifths) and does not invent the water-jet split. The live text block is still floated to 55% inside its column.
7. **Canonical duplicates** — `https://titanium.com/processing/kitting-services/` canonicalizes to `https://titanium.com/services/`. One private draft covers `/services/`. `https://titanium.com/markets/industrial/oil-gas/` canonicalizes to `https://titanium.com/oil-gas/`. It was not written over the Oil & Gas draft. `https://titanium.com/locations/` canonicalizes to `https://titanium.com/contact-us/`. Scrap reclamation, toll processing, and JIT/kanban canonicalizes to `https://titanium.com/services/`.
8. **Contact form** — Gravity Form **18** is on `/contact-us/`, `/rfq/`, and the global locations page. No Form 18 export is in this repository. Those drafts do not submit it. The locations page hides the form in the public HTML (`display: none`); the draft still locks it.
9. **Unmapped column pair** — Careers and Terms & Conditions each mix a two-fifths column with a one-half column. That pair is not a named preset, so those pages were not drafted.

## Checked on the public site, no admin needed

- **Water jet** `https://titanium.com/processing/water-jet-cutting/` uses page CSS `words 55% / picture 40% / picture 20px lower` plus the theme rule `.avia-image-container.avia-align-left { margin-right: 15px }`. The draft uses that measured split. It is not three equal columns.
- **Medical** `https://titanium.com/markets/medical/` uses `.left { float: left; margin: 8px 16px 0 0 }` and `.right { float: right; margin: 8px 0 0 16px }`. Pictures keep those wraps inside one column.
- **Quality** is a two-fifths + three-fifths row. **Oil & Gas** and **Fastener Alloys** are a two-thirds story plus a one-third line card. **Interconnect** is three-quarters plus one-quarter, not the two-thirds family.
- **Chamfering, grinding, saw cutting, shearing, torch cutting, and trepanning** use the same page CSS as water jet: words 55%, picture 40%, 15px gap, picture 20px lower. Each draft uses that measured split. PVC coating does not include that CSS, so it stays full-width columns.
- **Coil slitting** is a two-fifths picture plus a three-fifths story (the quality split), not the water-jet split.
- **Aerospace, Defense, Industrial, and Consumer Products** use named Enfold widths from the live stylesheet: three-fifths + two-fifths is 57.6% / 36.4%, four-fifths is 78.8%, and half + two quarters is 47% / 20.5% / 20.5%, each with the 6% gap. Defense and Consumer Products keep the portfolio grid locked. Industrial and Consumer Products float pictures the way Medical does.
- **Aerospace** uses the medical float plus a two-thirds story and a one-third line card.
- **Oil & Gas product cards** use the portfolio export, in public order. The first four cards are a four-quarter row (20.5% each, 6% gap). The last three stay that same quarter width. They do not stretch into thirds. Create Quote stays a button because the public HTML links it.
- **Oil & Gas** and **Additive** were rebuilt from current public HTML because the captured column HTML changed (an image address no longer uses the `.webp` proxy). Nobody had edited those drafts. The story columns are unchanged. The Oil & Gas product grid is now the picture cards above.
- **Message from the President** is one full-width story. The portrait uses WordPress `alignleft`. That is not the Medical `.left` / `.right` wrap, so the draft does not apply the medical float.
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
| `/oil-gas/` | equal 3-button row, wide story + line card, seven picture cards | lead-three-fifths, thirds, two-one, full, quarters, quarter-trio |
| `/markets/fastener-alloys/` | equal 3-button row, wide story + line card | lead-three-quarters, thirds, two-one |
| `/interconnect-alloys/` | equal 3-button row, wide story + slim line card | thirds, three-one |
| `/markets/medical/` | equal 3-button row, line card, float wrap | full, thirds, two-one, halves, float-wrap |
| `/processing/water-jet-cutting/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/markets/additive-manufacturing-build-plates/` | equal 3-button row, line card; Form 20 modeled, submit off | lead-three-fifths, thirds, two-one |
| `/markets/defense/` | equal 3-button row, line card, wide fifths; product grid locked | lead-three-fifths, thirds, two-one, wide-fifths, quality-split |
| `/markets/industrial/` | equal 3-button row, half plus two quarters, float wrap | lead-two-thirds, thirds, half-quarters, float-wrap |
| `/markets/consumer-products/` | equal 3-button row, four-fifths lead, slim line card, float wrap; product grid locked | lead-four-fifths, thirds, three-one, float-wrap |
| `/giving-back/` | alternating fifths rows | full, wide-fifths, quality-split |
| `/titanium-about-us/` | equal 3-button row, four-fifths lead | lead-four-fifths, thirds, full |
| `/frequently-asked-questions/` | equal 3-button row, social icons | full, thirds, lead-two-thirds, full |
| `/privacy-policy/` | full story plus a wide/narrow row | full, two-one |
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
| `/contact-us/` | locations and the quote link; Form 18 locked | lead-three-fifths, full, full, thirds |
| `/rfq/` | quote link and photos; Form 18 locked | full, full, halves |
| `/titanium-about-us/history-of-titanium-industries/` | equal 3-button row | full, thirds, full |
| `/titanium-about-us/mission-statement/` | four-fifths lead, two buttons | lead-four-fifths, thirds, full |
| `/titanium-about-us/message-from-the-president/` | full story; portrait is not the medical float | full |
| `/titanium-industries-global-metal-supplier-locations/` | location columns; news slider and Form 18 locked | full, full, halves, thirds, thirds, full, lead-three-fifths, full, full, thirds |

Parity against the live HTML (title, description, canonical, Open Graph title and description, links, pictures, and the measured layouts) passed for all thirty-three. Locked card grids, portfolio queries, the locations news slider, and Gravity Forms 18 and 20 are excluded from the picture check and called out in the report. The Oil & Gas picture cards are checked against the portfolio export. Evidence: `migration/reports/parity.json`.

## Families still open

- Home hero slider and the multi-section homepage.
- Careers and Terms & Conditions mix a two-fifths column with a one-half column. That pair is not a named preset, so those pages were not drafted.
- Alloy and technical-data pages.
- 65 blog posts.
- Gravity Form 18 export (contact, RFQ, and the locations page). The drafts do not submit it.
- The local sitemap entry.
- Firearms (blocked, above).
- Header, footer, and mega menu. Footer “T.I. Approvals” logos are site chrome, not part of these page drafts.
- Shop and quote apps on `qqa.titanium.com` (linked, not rebuilt).
