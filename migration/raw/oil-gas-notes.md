# Titanium Oil & Gas portfolio export (2026-09-24)

## Source
- WordPress CPT: **Portfolio Items** (`portfolio_item`)
- Filter: `portfolio_entries=oil-gas`
- Full Tools → Export XML: `titanium-oil-gas-portfolio.xml` (63 portfolio items total; 7 oil-gas)
- Public page: https://titanium.com/oil-gas/
- Local CMS page draft: `/admin/collections/pages/314`

## Public grid order (7 cards)
| # | Title | WP ID | Portfolio URL | Featured image |
|---|-------|-------|---------------|----------------|
| 1 | Round Bar | 6427 | /portfolio-item/round-bar/ | https://titanium.com/wp-content/uploads/2016/09/Round_Bar_Hi.jpg |
| 2 | Plate | 6423 | /portfolio-item/plate/ | https://titanium.com/wp-content/uploads/2016/09/Plate_Low.jpg |
| 3 | Sheet | 6433 | /portfolio-item/sheet/ | https://titanium.com/wp-content/uploads/2016/09/Sheet_Metal_Low.jpg |
| 4 | Seamless Tube | 6431 | /portfolio-item/seamless-tube/ | https://titanium.com/wp-content/uploads/2016/09/Tube_Low-1.jpg |
| 5 | Seamless Pipe | 6429 | /portfolio-item/seamless-pipe/ | https://titanium.com/wp-content/uploads/2016/09/Pipe_Low.jpg |
| 6 | Billet | 6394 | /portfolio-item/billet/ | https://titanium.com/wp-content/uploads/2016/09/Billet_Low-1.jpg |
| 7 | Coil | 6399 | /portfolio-item/coil/ | https://titanium.com/wp-content/uploads/2016/09/Coil_Hi.jpg |

Grid thumbnails on the page use `-260x185` variants of the same files under `/wp-content/uploads/2016/09/`.

## Categories
Each oil-gas item is in **Home Page Forms** (`home-page-forms`) and **Oil & Gas** (`oil-gas`).

## Body content notes
- Round Bar, Plate, Sheet, Billet, Coil have substantial `content:encoded` HTML in the WXR.
- Seamless Tube and Seamless Pipe had empty content in this export (cards are image + title driven on the industry page).
- Industry page also links a line card PDF (capture URL from public page if needed).

## Gravity Forms
No Oil & Gas–specific Gravity Form found in this pass. Form 20 remains Additive-only.

## Payload guidance
- Rebuild Oil & Gas product module as picture cards from this list (title + image + optional link).
- “Create Quote” stays words-only if source has no link (per local CONVERTED notes).
- Commit raw XML under `migration/raw/` and update FLAGS: Oil & Gas portfolio export received.
