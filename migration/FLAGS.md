# Flags for the human

These items stopped because they need WordPress admin, a Cloudflare allow, or a decision only a person should make. Everything else in this branch continued.

Hosted conversions of existing pages: **0**. The two hundred fifty-five drafts in this repository are candidate dry-runs. The readiness screen says **Planned / awaiting integration**, not Ready and not Partly converted on the hosted CMS.

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
3. **Product grids** — Oil & Gas uses the portfolio export (`migration/raw/oil-gas-portfolio.xml`). Aerospace, Defense, and Consumer Products did not get that export. Their product lists are already in the public HTML, so those drafts use picture cards from the page itself (the image, title, and link that are on the page). Industrial has no product query. There is still no WordPress export for the Aerospace, Defense, or Consumer Products portfolio bodies.
4. **The other public URLs** — This repository did not contain the earlier capture of about 419 pages. Public sitemaps currently list **404** URLs (305 pages, 65 posts, 30 portfolio items, 3 categories, 1 local). Two hundred fifty-five layouts are converted below. Unpublished WordPress drafts, redirects, and menu-only links are not in that sitemap.
5. **Card grids** — `/markets/` and `/processing/` include a custom card grid (theme CSS: each card `width: 24%`, four across, full width under 768px). The drafts keep the button row and the introduction, and lock the cards. They were not stacked into one column. A named preset, or a decision to recreate them as picture cards, is still open.
6. **Inner 55% text width** — Heat treating and coil slitting include the same custom CSS as water jet (text block 55%, picture 40%, picture 20px lower). On those two pages the picture and words are not a full-width pair, so the draft keeps the Enfold columns (three-quarters, and two-fifths + three-fifths) and does not invent the water-jet split. The live text block is still floated to 55% inside its column.
7. **Canonical duplicates** — `https://titanium.com/processing/kitting-services/` canonicalizes to `https://titanium.com/services/`. One private draft covers `/services/`. `https://titanium.com/markets/industrial/oil-gas/` canonicalizes to `https://titanium.com/oil-gas/`. It was not written over the Oil & Gas draft. `https://titanium.com/locations/` canonicalizes to `https://titanium.com/contact-us/`. `https://titanium.com/services/scrap-reclamation/` and `https://titanium.com/services/toll-processing/` and `https://titanium.com/services/just-in-time-jit-kanban-programs/` canonicalize to `https://titanium.com/services/`. `https://titanium.com/services/scrap-reclamation-2/` is its own page and has its own draft.
8. **Contact form** — Gravity Form **18** is on `/contact-us/`, `/rfq/`, and the global locations page. No Form 18 export is in this repository. Those drafts do not submit it. The locations page hides the form in the public HTML (`display: none`); the draft still locks it.
9. **Careers and Terms** — Both pages are private drafts. Each uses custom column widths for a two-fifths column (36.4%) beside a half (47%), with the 6% gap. `/careers/` is `full | thirds | custom(two-fifths+half) | full`. `/titanium-about-us/terms-conditions/` is `full | thirds | full | custom(two-fifths+half) | full` and keeps Contact Us, Create Quote, and Weight Calculator.
10. **Custom column widths** — Marketing can pick **Custom column widths** in the row layout list. Each column then has its own live Enfold width (half, third, quarter, fifth, and the no-gap sizes). The row does not have to fill the page. A width that is not in that live list, such as a seventh, stays locked.
11. **Weight calculator** — `/metal-alloy-technical-data-titanium-nickel-steel-specs/weight-calculator/` is a private draft. The public page is an HTML form (`myform`) plus `calculator.js` (rounds, rectangles, and material densities). The draft keeps the step labels. It does not calculate a weight and it does not submit the form.
12. **Specification tables** — AMS, ASTM, and ASME pages keep chemical composition and mechanical properties as paragraphs, in cell order, inside the named columns. The column editor has heading and paragraph blocks. The numbers are in the draft. They are not a spreadsheet grid. The technical-data hub links the public Alloy Datasheet Guidebook PDF. That link stays in the draft.
13. **Customer Satisfaction Survey — export received.** Gravity Form **23**, “Customer Satisfaction Questionnaire”, is saved at `migration/raw/gravity-form-23.json` (notes in `migration/raw/gravity-form-23-notes.md`) and modeled at `migration/forms/gravity-form-23.model.json` (26 fields, phone and call-time rules when contact method is Phone, 3 notifications, 1 confirmation). The export has no hCaptcha field and no file upload. Honeypot is off. Public submit stays **off** until a person says to turn it on. Notification delivery is recorded and marked `needs_keys`; nothing is emailed. `/customer-satisfaction-survey/` is a private draft (`full | full | full`). The middle row is the locked form. The page does not submit it. Quality Systems still links the survey button to that URL.
14. **Color sections and headline rotators** — Market, processing, quality, and terms pages open with an Enfold color section (parallax background and overlay) and a headline rotator. The rotator phrase is kept as the heading text (Quality is “Titanium Industries | Quality Systems”). The background image, overlay color, and the rotation itself are not editor blocks. A color-section or rotator block would need a person to add those types before those boxes can be edited as their own widgets.
15. **Market and processing column re-check** — Fresh public HTML (24 Sep 2026) was compared with the private drafts. Top-level Avia classes already match the editor grids. A two-thirds + one-third row is `two-one`. A one-third + two-thirds row would be `one-two`; none of these pages use that pair as a top-level row. Equal Contact / Quote / Shop rows stay `thirds`. Defense story rows of three-fifths + two-fifths and two-fifths + three-fifths stay `wide-fifths` and `quality-split`. Industrial’s half + two quarters stays `half-quarters`. Processing pages whose builder column is `av_one_full` (chamfering, grinding, saw cutting, shearing, torch cutting, trepanning, water jet) still use the measured 55% / 40% split because that is the page CSS, not a second Avia column pair. Custom widths were not substituted for that split. Coil slitting stays two-fifths + three-fifths. Heat treating stays a three-quarter lead. PVC coating stays full width. `/markets/` and `/processing/` still lock the 24% card grid. No market or processing draft was rewritten by this re-check.

## Checked on the public site, no admin needed

- **Water jet** `https://titanium.com/processing/water-jet-cutting/` uses page CSS `words 55% / picture 40% / picture 20px lower` plus the theme rule `.avia-image-container.avia-align-left { margin-right: 15px }`. The draft uses that measured split. It is not three equal columns.
- **Medical** `https://titanium.com/markets/medical/` uses `.left { float: left; margin: 8px 16px 0 0 }` and `.right { float: right; margin: 8px 0 0 16px }`. Pictures keep those wraps inside one column.
- **Quality** is a two-fifths + three-fifths row. The Customer Satisfaction Survey button is in the three-fifths column, after the story, and links to the public survey page. **Oil & Gas** and **Fastener Alloys** are a two-thirds story plus a one-third line card. **Interconnect** is three-quarters plus one-quarter, not the two-thirds family.
- **Chamfering, grinding, saw cutting, shearing, torch cutting, and trepanning** use the same page CSS as water jet: words 55%, picture 40%, 15px gap, picture 20px lower. Each draft uses that measured split. PVC coating does not include that CSS, so it stays full-width columns.
- **Coil slitting** is a two-fifths picture plus a three-fifths story (the quality split), not the water-jet split.
- **Aerospace, Defense, Industrial, and Consumer Products** use named Enfold widths from the live stylesheet: three-fifths + two-fifths is 57.6% / 36.4%, four-fifths is 78.8%, and half + two quarters is 47% / 20.5% / 20.5%, each with the 6% gap. Industrial has no product grid. Industrial and Consumer Products float pictures the way Medical does.
- **Aerospace** uses the medical float plus a two-thirds story and a one-third line card. Six application sections list products in the public HTML. Three sections are five cards at the live fifth width (15.2%, 6% gap). Three sections are six cards at the live sixth width (11.7%, 6% gap). The pictures are the thumbnails on the page.
- **Defense** lists five products inside the two-thirds story column. The draft keeps that story and the line card, then places the same five cards on the next row at the full page fifth width. A row cannot sit inside a column, so those cards are wider than the nested live grid.
- **Consumer Products** lists Marine (six sixths), Fashion (two columns at 49.8%, the live `no_margin av_one_second` rule, no 6% gap), and Sport (four quarters). Those tables sit in full-width columns, so the card rows use those same widths.
- **Oil & Gas product cards** use the portfolio export, in public order. The first four cards are a four-quarter row (20.5% each, 6% gap). The last three stay that same quarter width. They do not stretch into thirds. Create Quote stays a button because the public HTML links it.
- **Oil & Gas** and **Additive** were rebuilt from current public HTML because the captured column HTML changed (an image address no longer uses the `.webp` proxy). Nobody had edited those drafts. The story columns are unchanged. The Oil & Gas product grid is now the picture cards above.
- **Message from the President** is one full-width story. The portrait uses WordPress `alignleft`. That is not the Medical `.left` / `.right` wrap, so the draft does not apply the medical float.
- Standard Enfold columns use a **6%** gap after the first column (`margin-left: 6%` in the live theme CSS). That spacing is part of the named presets. It is not a free-form measurement.
- **Alloy product rows** on Stainless Steel, Carbon Steels, and Cobalt Chrome are a quarter (20.5%) beside three quarters (73.5%), with the 6% gap. That is the `one-three` preset. It is the reverse of the three-quarter / quarter row already used on Interconnect.
- **Custom column widths** hold mixes that do not fill a named preset. Alloy Steels keeps a quarter (20.5%) beside a third (29.3%). Nickel Alloys keeps a quarter beside a half (47%). The titanium hub keeps no-gap rows at 24.9% / 75% and 20% / 80%, plus Titanium Block as a quarter beside two fifths (36.4%). Grade 2 keeps a third, a quarter, and a third. Gapped columns after the first still use the 6% gap. No-gap columns use the live `no_margin` widths and a 0 margin.
- **Weight calculator title** is one column at two fifths (36.4%). The story beside the line card stays two thirds / one third.

## Do not do these from this branch

- No DNS changes.
- No WordPress cutover.
- No public Netlify publish. Converted pages are `private_draft`, preview URLs are `noindex`, and a Payload “Published version” still does not switch the public site.
- The existing Astro layout still builds canonical URLs on `https://titaniumind.com`. Live canonicals are `https://titanium.com`. CMS previews use the live canonical. The rest of the Astro site was left as-is.

## Pages Marketing can edit now

| Path | Families | Grid |
| --- | --- | --- |
| `/quality-systems/` | equal 3-button row, quality split, survey button in the three-fifths column | lead-two-thirds, thirds, quality-split |
| `/customer-satisfaction-survey/` | intro and follow-up story; Form 23 modeled, submit off | full, full, full |
| `/oil-gas/` | equal 3-button row, wide story + line card, seven picture cards | lead-three-fifths, thirds, two-one, full, quarters, quarter-trio |
| `/markets/fastener-alloys/` | equal 3-button row, wide story + line card | lead-three-quarters, thirds, two-one |
| `/interconnect-alloys/` | equal 3-button row, wide story + slim line card | thirds, three-one |
| `/markets/medical/` | equal 3-button row, line card, float wrap | full, thirds, two-one, halves, float-wrap |
| `/processing/water-jet-cutting/` | equal 3-button row, measured picture split | full, thirds, waterjet-split |
| `/markets/additive-manufacturing-build-plates/` | equal 3-button row, line card; Form 20 modeled, submit off | lead-three-fifths, thirds, two-one |
| `/markets/defense/` | equal 3-button row, line card, five product cards, wide fifths | lead-three-fifths, thirds, two-one, fifths, wide-fifths, quality-split |
| `/markets/industrial/` | equal 3-button row, half plus two quarters, float wrap | lead-two-thirds, thirds, half-quarters, float-wrap |
| `/markets/consumer-products/` | equal 3-button row, four-fifths lead, slim line card, float wrap, Marine / Fashion / Sport cards | lead-four-fifths, thirds, three-one, float-wrap, sixths, near-halves, quarters |
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
| `/markets/aerospace/` | equal 3-button row, line card, float wrap, six product sections | lead-three-fifths, thirds, two-one, float-wrap, fifths, sixths |
| `/contact-us/` | locations and the quote link; Form 18 locked | lead-three-fifths, full, full, thirds |
| `/rfq/` | quote link and photos; Form 18 locked | full, full, halves |
| `/titanium-about-us/history-of-titanium-industries/` | equal 3-button row | full, thirds, full |
| `/titanium-about-us/mission-statement/` | four-fifths lead, two buttons | lead-four-fifths, thirds, full |
| `/titanium-about-us/message-from-the-president/` | full story; portrait is not the medical float | full |
| `/titanium-industries-global-metal-supplier-locations/` | location columns; news slider and Form 18 locked | full, full, halves, thirds, thirds, full, lead-three-fifths, full, full, thirds |

| `/services/scrap-reclamation-2/` | scrap story and a quote row | lead-three-fifths, full, two-one |
| `/careers/` | custom two-fifths beside a half | full, thirds, custom(two-fifths+half), full |
| `/titanium-about-us/terms-conditions/` | equal 3-button row, custom two-fifths beside a half | full, thirds, full, custom(two-fifths+half), full |
| `/alloys/` | alloy family cards | full, three-one, thirds, full |
| `/alloys/stainless-steel/` | four product rows at quarter / three quarters | thirds, full, one-three |
| `/alloys/carbon-steels/` | round bar row at quarter / three quarters | full, thirds, one-three |
| `/alloys/cobalt-chrome/` | round bar row at quarter / three quarters | full, thirds, one-three |
| `/alloys/aluminum-alloys/` | narrow left / wide right stories | full, thirds, one-two |
| `/alloys/copper-alloys/` | equal button and story columns | full, thirds, thirds |
| `/alloys/alloy-steels/` | quarter / three quarters, then a custom quarter + third | full, thirds, one-three, custom(quarter+third) |
| `/alloys/nickel-alloys/` | quarter / three quarters, then a custom quarter + half | full, thirds, one-three, custom(quarter+half) |
| `/alloys/titanium-and-titanium-alloys/` | no-gap product rows, gapped rows, and a quarter + two fifths block row | full, thirds, custom widths, one-three, halves |
| `/alloys/titanium-and-titanium-alloys/ti-grade-2-cp-3/` | mill products, pipe, and fittings in a custom third + quarter + third | full, thirds, two-one, custom(third+quarter+third) |
| `/metal-alloy-technical-data-titanium-nickel-steel-specs/` | technical hub and the public datasheet PDF link | full, thirds, two-one, halves |
| `/metal-alloy-technical-data-titanium-nickel-steel-specs/weight-calculator/` | two-fifths title; calculator inputs are not a working form | full, lead-two-fifths, two-one |
| `/ams-specifications-specialty-metals/` | AMS index | full, thirds, full |
| `/astm-specifications/` | ASTM index | full, thirds, full, lead-four-fifths |
| `/asme-specifications/` | ASME index | full, thirds, full, lead-four-fifths |
| `/quick-quote-alloy-steel-round-bar/` | public shop and Quick Quote App links | full, quality-split, full, halves, full |

Seventy-eight alloy grade pages and one hundred fourteen AMS, ASTM, and ASME specification pages use the same private-draft pattern (usually full, thirds, and a two-thirds / one-third line card, with chemistry and mechanical values kept as paragraphs). Eleven more technical-data pages (cross references, what is titanium, history of titanium, seawater, charters of freedom) are drafted the same way. Each path and grid is in `migration/reports/conversions.json`.

Parity against the live HTML (title, description, canonical, Open Graph title and description, links, pictures, and the measured layouts) passed for all two hundred fifty-five. Locked card grids, the locations news slider, and Gravity Forms 18, 20, and 23 are excluded from the picture check and called out in the report. Oil & Gas cards are checked against the portfolio export. Aerospace, Defense, and Consumer Products cards are checked against the public HTML. Quality Systems parity includes the Customer Satisfaction Survey button in the three-fifths column. Evidence: `migration/reports/parity.json`.

## Families still open

- Home hero slider and the multi-section homepage.
- Color sections and headline rotators (text is kept; background, overlay, and rotation are not editor blocks).
- The 24% card grids on `/markets/` and `/processing/`.
- The weight calculator draft does not run `calculator.js`.
- 65 blog posts.
- Gravity Form 18 export (contact, RFQ, and the locations page). The drafts do not submit it.
- Gravity Form 23 is modeled. Public submit still needs a person to turn it on. hCaptcha is not in the export.
- The local sitemap entry.
- Firearms (`https://titanium.com/markets/firearms/`, Cloudflare 403). Not fetched and not drafted.
- Header, footer, and mega menu. Footer “T.I. Approvals” logos are site chrome, not part of these page drafts.
- Shop and quote apps on `qqa.titanium.com` (linked, not rebuilt).
