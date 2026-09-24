import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parityChecks } from '../shared/convert/parity'
import { parseAviaHtml, toPageDocument } from '../shared/convert/parse-avia'
import { oilGasCardsFromWxr, type PortfolioCard } from '../shared/convert/portfolio-wxr'
import { formNoteFromModel, modelGravityFormExport, type KnownFormNote } from '../shared/forms/gravity-form'
import { gateConversion } from '../shared/page-model/hash-gate'
import { roundTripPageDocument } from '../shared/page-model/schema'
import { renderWorkspace } from '../shared/editor/render-workspace'
import { allLedgerEntries } from '../shared/page-model/ledger'
import { parsePageDocument } from '../shared/page-model/schema'
import { createIdFactory } from '../shared/page-model/workspace'
import { renderColumnsHtml } from '../shared/render/columns'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(root, 'migration/raw')
const draftDir = path.join(root, 'migration/drafts')
const reportDir = path.join(root, 'migration/reports')

const pages = [
  { file: 'quality-systems.html', name: 'quality-systems' },
  { file: 'oil-gas.html', name: 'oil-gas' },
  { file: 'fastener-alloys.html', name: 'fastener-alloys' },
  { file: 'interconnect-alloys.html', name: 'interconnect-alloys' },
  { file: 'medical.html', name: 'medical' },
  { file: 'water-jet-cutting.html', name: 'water-jet-cutting' },
  { file: 'additive-manufacturing-build-plates.html', name: 'additive-manufacturing-build-plates' },
  { file: 'processing--chamfering.html', name: 'chamfering' },
  { file: 'processing--grinding.html', name: 'grinding' },
  { file: 'processing--saw-cutting.html', name: 'saw-cutting' },
  { file: 'processing--shearing.html', name: 'shearing' },
  { file: 'processing--torch-cutting.html', name: 'torch-cutting' },
  { file: 'processing--trepanning.html', name: 'trepanning' },
  { file: 'processing--coil-slitting.html', name: 'coil-slitting' },
  { file: 'processing--heat-treating.html', name: 'heat-treating' },
  { file: 'processing--pvc-coating.html', name: 'pvc-coating' },
  { file: 'processing.html', name: 'processing' },
  { file: 'markets.html', name: 'markets' },
  { file: 'services.html', name: 'services' },
  { file: 'markets--aerospace.html', name: 'aerospace' },
  { file: 'markets--defense.html', name: 'defense' },
  { file: 'markets--industrial.html', name: 'industrial' },
  { file: 'markets--consumer-products.html', name: 'consumer-products' },
  { file: 'giving-back.html', name: 'giving-back' },
  { file: 'titanium-about-us.html', name: 'about' },
  { file: 'frequently-asked-questions.html', name: 'faq' },
  { file: 'privacy-policy.html', name: 'privacy' },
  { file: 'contact-us.html', name: 'contact-us' },
  { file: 'rfq.html', name: 'rfq' },
  { file: 'history.html', name: 'history' },
  { file: 'mission-statement.html', name: 'mission' },
  { file: 'message-from-the-president.html', name: 'president' },
  { file: 'global-locations.html', name: 'global-locations' },
  { file: 'scrap-reclamation-2.html', name: 'scrap-reclamation-2' },
  // Alloy listings, grade pages, and technical-data / specification pages.
  { file: 'alloys--alloy-steels--alloy-steel-135m-nitralloy.html', name: 'alloys--alloy-steels--alloy-steel-135m-nitralloy' },
  { file: 'alloys--alloy-steels--alloy-steel-4130.html', name: 'alloys--alloy-steels--alloy-steel-4130' },
  { file: 'alloys--alloy-steels--alloy-steel-4140.html', name: 'alloys--alloy-steels--alloy-steel-4140' },
  { file: 'alloys--alloy-steels--alloy-steel-52100.html', name: 'alloys--alloy-steels--alloy-steel-52100' },
  { file: 'alloys--alloy-steels--alloy-steel-6304-17-22a.html', name: 'alloys--alloy-steels--alloy-steel-6304-17-22a' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-4330.html', name: 'alloys--alloy-steels--alloy-steel-aisi-4330' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-4340-mod-300m.html', name: 'alloys--alloy-steels--alloy-steel-aisi-4340-mod-300m' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-4815.html', name: 'alloys--alloy-steels--alloy-steel-aisi-4815' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-6150.html', name: 'alloys--alloy-steels--alloy-steel-aisi-6150' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-8740.html', name: 'alloys--alloy-steels--alloy-steel-aisi-8740' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-e9310-2.html', name: 'alloys--alloy-steels--alloy-steel-aisi-e9310-2' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-hp-9-4-30.html', name: 'alloys--alloy-steels--alloy-steel-aisi-hp-9-4-30' },
  { file: 'alloys--alloy-steels--alloy-steel-aisi-sae-h-11.html', name: 'alloys--alloy-steels--alloy-steel-aisi-sae-h-11' },
  { file: 'alloys--alloy-steels--alloy-steel-grade-4340.html', name: 'alloys--alloy-steels--alloy-steel-grade-4340' },
  { file: 'alloys--aluminum-alloys--aluminum-alloy-2014.html', name: 'alloys--aluminum-alloys--aluminum-alloy-2014' },
  { file: 'alloys--aluminum-alloys--aluminum-alloy-2017.html', name: 'alloys--aluminum-alloys--aluminum-alloy-2017' },
  { file: 'alloys--aluminum-alloys--aluminum-alloy-2024.html', name: 'alloys--aluminum-alloys--aluminum-alloy-2024' },
  { file: 'alloys--aluminum-alloys--aluminum-alloy-6061.html', name: 'alloys--aluminum-alloys--aluminum-alloy-6061' },
  { file: 'alloys--aluminum-alloys--aluminum-alloy-7050.html', name: 'alloys--aluminum-alloys--aluminum-alloy-7050' },
  { file: 'alloys--aluminum-alloys--aluminum-alloy-7075.html', name: 'alloys--aluminum-alloys--aluminum-alloy-7075' },
  { file: 'alloys--aluminum-alloys.html', name: 'alloys--aluminum-alloys' },
  { file: 'alloys--carbon-steels--carbon-steel-aisi-1137.html', name: 'alloys--carbon-steels--carbon-steel-aisi-1137' },
  { file: 'alloys--carbon-steels--carbon-steel-aisi-1215.html', name: 'alloys--carbon-steels--carbon-steel-aisi-1215' },
  { file: 'alloys--carbon-steels--carbon-steel-aisi-12l14.html', name: 'alloys--carbon-steels--carbon-steel-aisi-12l14' },
  { file: 'alloys--carbon-steels--carbon-steel-h-11.html', name: 'alloys--carbon-steels--carbon-steel-h-11' },
  { file: 'alloys--carbon-steels--carbon-steel-sae-aisi-1018.html', name: 'alloys--carbon-steels--carbon-steel-sae-aisi-1018' },
  { file: 'alloys--carbon-steels.html', name: 'alloys--carbon-steels' },
  { file: 'alloys--cobalt-chrome.html', name: 'alloys--cobalt-chrome' },
  { file: 'alloys--copper-alloys.html', name: 'alloys--copper-alloys' },
  { file: 'alloys--nickel-alloys--alloy_718.html', name: 'alloys--nickel-alloys--alloy_718' },
  { file: 'alloys--nickel-alloys--nickel-alloy-625.html', name: 'alloys--nickel-alloys--nickel-alloy-625' },
  { file: 'alloys--nickel-alloys--nickel-alloy-750.html', name: 'alloys--nickel-alloys--nickel-alloy-750' },
  { file: 'alloys--nickel-alloys--nickel-alloy-mondel-k500.html', name: 'alloys--nickel-alloys--nickel-alloy-mondel-k500' },
  { file: 'alloys--nickel-alloys--nickel-alloy-mp35n.html', name: 'alloys--nickel-alloys--nickel-alloy-mp35n' },
  { file: 'alloys--nickel-alloys--nickel-alloy-waspaloy.html', name: 'alloys--nickel-alloys--nickel-alloy-waspaloy' },
  { file: 'alloys--nickel-alloys--nickel-inconel-600.html', name: 'alloys--nickel-alloys--nickel-inconel-600' },
  { file: 'alloys--stainless-steel--aermet-100.html', name: 'alloys--stainless-steel--aermet-100' },
  { file: 'alloys--stainless-steel--stainless-steel-13-8ph.html', name: 'alloys--stainless-steel--stainless-steel-13-8ph' },
  { file: 'alloys--stainless-steel--stainless-steel-15-5ph.html', name: 'alloys--stainless-steel--stainless-steel-15-5ph' },
  { file: 'alloys--stainless-steel--stainless-steel-17-4-ph.html', name: 'alloys--stainless-steel--stainless-steel-17-4-ph' },
  { file: 'alloys--stainless-steel--stainless-steel-321.html', name: 'alloys--stainless-steel--stainless-steel-321' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-303se-round-bar.html', name: 'alloys--stainless-steel--stainless-steel-alloy-303se-round-bar' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-403.html', name: 'alloys--stainless-steel--stainless-steel-alloy-403' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-410.html', name: 'alloys--stainless-steel--stainless-steel-alloy-410' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-416ht.html', name: 'alloys--stainless-steel--stainless-steel-alloy-416ht' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-418.html', name: 'alloys--stainless-steel--stainless-steel-alloy-418' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-420.html', name: 'alloys--stainless-steel--stainless-steel-alloy-420' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-422.html', name: 'alloys--stainless-steel--stainless-steel-alloy-422' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-430.html', name: 'alloys--stainless-steel--stainless-steel-alloy-430' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-430f.html', name: 'alloys--stainless-steel--stainless-steel-alloy-430f' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-431-uns-s43100.html', name: 'alloys--stainless-steel--stainless-steel-alloy-431-uns-s43100' },
  { file: 'alloys--stainless-steel--stainless-steel-alloy-440a-2.html', name: 'alloys--stainless-steel--stainless-steel-alloy-440a-2' },
  { file: 'alloys--stainless-steel--stainless-steel-custom-455.html', name: 'alloys--stainless-steel--stainless-steel-custom-455' },
  { file: 'alloys--stainless-steel--stainless-steel-custom-465.html', name: 'alloys--stainless-steel--stainless-steel-custom-465' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-108.html', name: 'alloys--stainless-steel--stainless-steel-grade-108' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-17-7ph.html', name: 'alloys--stainless-steel--stainless-steel-grade-17-7ph' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-301.html', name: 'alloys--stainless-steel--stainless-steel-grade-301' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-302.html', name: 'alloys--stainless-steel--stainless-steel-grade-302' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-303.html', name: 'alloys--stainless-steel--stainless-steel-grade-303' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-304.html', name: 'alloys--stainless-steel--stainless-steel-grade-304' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-304l.html', name: 'alloys--stainless-steel--stainless-steel-grade-304l' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-310.html', name: 'alloys--stainless-steel--stainless-steel-grade-310' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-316.html', name: 'alloys--stainless-steel--stainless-steel-grade-316' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-316l.html', name: 'alloys--stainless-steel--stainless-steel-grade-316l' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-347.html', name: 'alloys--stainless-steel--stainless-steel-grade-347' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-355.html', name: 'alloys--stainless-steel--stainless-steel-grade-355' },
  { file: 'alloys--stainless-steel--stainless-steel-grade-440c.html', name: 'alloys--stainless-steel--stainless-steel-grade-440c' },
  { file: 'alloys--stainless-steel--stainless-steel-incoloy-a286.html', name: 'alloys--stainless-steel--stainless-steel-incoloy-a286' },
  { file: 'alloys--stainless-steel.html', name: 'alloys--stainless-steel' },
  { file: 'alloys--titanium-and-titanium-alloys--15v-3cr-3al-3sn.html', name: 'alloys--titanium-and-titanium-alloys--15v-3cr-3al-3sn' },
  { file: 'alloys--titanium-and-titanium-alloys--6al-2sn-4zr-6mo.html', name: 'alloys--titanium-and-titanium-alloys--6al-2sn-4zr-6mo' },
  { file: 'alloys--titanium-and-titanium-alloys--7al-4mo.html', name: 'alloys--titanium-and-titanium-alloys--7al-4mo' },
  { file: 'alloys--titanium-and-titanium-alloys--grade-1-cp-4.html', name: 'alloys--titanium-and-titanium-alloys--grade-1-cp-4' },
  { file: 'alloys--titanium-and-titanium-alloys--grade-12.html', name: 'alloys--titanium-and-titanium-alloys--grade-12' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-6al-2sn-4zr-2mo.html', name: 'alloys--titanium-and-titanium-alloys--ti-6al-2sn-4zr-2mo' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-6al-6v-2sn.html', name: 'alloys--titanium-and-titanium-alloys--ti-6al-6v-2sn' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-beta-c-grade-19.html', name: 'alloys--titanium-and-titanium-alloys--ti-beta-c-grade-19' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-grade-3-cp-2.html', name: 'alloys--titanium-and-titanium-alloys--ti-grade-3-cp-2' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-grade-4-cp-1.html', name: 'alloys--titanium-and-titanium-alloys--ti-grade-4-cp-1' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-grade-5-6al-4v.html', name: 'alloys--titanium-and-titanium-alloys--ti-grade-5-6al-4v' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-grade-6al-4v-eli-grade-23-2.html', name: 'alloys--titanium-and-titanium-alloys--ti-grade-6al-4v-eli-grade-23-2' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-grade-6al-4v-eli-grade-23.html', name: 'alloys--titanium-and-titanium-alloys--ti-grade-6al-4v-eli-grade-23' },
  { file: 'alloys--titanium-and-titanium-alloys--ti-grade-7.html', name: 'alloys--titanium-and-titanium-alloys--ti-grade-7' },
  { file: 'alloys.html', name: 'alloys' },
  { file: 'ams-2241.html', name: 'ams-2241' },
  { file: 'ams-2261-specification.html', name: 'ams-2261-specification' },
  { file: 'ams-2300-specification.html', name: 'ams-2300-specification' },
  { file: 'ams-2301-specification.html', name: 'ams-2301-specification' },
  { file: 'ams-2630-specification.html', name: 'ams-2630-specification' },
  { file: 'ams-2631-specification.html', name: 'ams-2631-specification' },
  { file: 'ams-4117-specification.html', name: 'ams-4117-specification' },
  { file: 'ams-4120-specification.html', name: 'ams-4120-specification' },
  { file: 'ams-4123-specification.html', name: 'ams-4123-specification' },
  { file: 'ams-4124-specification.html', name: 'ams-4124-specification' },
  { file: 'ams-4339-specification.html', name: 'ams-4339-specification' },
  { file: 'ams-4900-titanium-grade-3.html', name: 'ams-4900-titanium-grade-3' },
  { file: 'ams-4901-specification.html', name: 'ams-4901-specification' },
  { file: 'ams-4902-specification.html', name: 'ams-4902-specification' },
  { file: 'ams-4907-specification.html', name: 'ams-4907-specification' },
  { file: 'ams-4911.html', name: 'ams-4911' },
  { file: 'ams-4921-specification.html', name: 'ams-4921-specification' },
  { file: 'ams-4928-specification.html', name: 'ams-4928-specification' },
  { file: 'ams-4930-specification.html', name: 'ams-4930-specification' },
  { file: 'ams-4951-specification.html', name: 'ams-4951-specification' },
  { file: 'ams-4965-specification.html', name: 'ams-4965-specification' },
  { file: 'ams-4981-specification.html', name: 'ams-4981-specification' },
  { file: 'ams-5617-specification.html', name: 'ams-5617-specification' },
  { file: 'ams-5629-specification.html', name: 'ams-5629-specification' },
  { file: 'ams-5630-specification.html', name: 'ams-5630-specification' },
  { file: 'ams-5640-specification-2.html', name: 'ams-5640-specification-2' },
  { file: 'ams-5641-specification.html', name: 'ams-5641-specification' },
  { file: 'ams-5643-specification.html', name: 'ams-5643-specification' },
  { file: 'ams-5645-specification.html', name: 'ams-5645-specification' },
  { file: 'ams-5646-specification.html', name: 'ams-5646-specification' },
  { file: 'ams-5647-specification.html', name: 'ams-5647-specification' },
  { file: 'ams-5653-specification.html', name: 'ams-5653-specification' },
  { file: 'ams-5659-specification.html', name: 'ams-5659-specification' },
  { file: 'ams-5662-specification.html', name: 'ams-5662-specification' },
  { file: 'ams-5663-specification.html', name: 'ams-5663-specification' },
  { file: 'ams-5664-specification.html', name: 'ams-5664-specification' },
  { file: 'ams-5666-specification.html', name: 'ams-5666-specification' },
  { file: 'ams-5708-specification-2.html', name: 'ams-5708-specification-2' },
  { file: 'ams-5731-specification.html', name: 'ams-5731-specification' },
  { file: 'ams-5737-specification.html', name: 'ams-5737-specification' },
  { file: 'ams-5844-specification.html', name: 'ams-5844-specification' },
  { file: 'ams-5853-specification.html', name: 'ams-5853-specification' },
  { file: 'ams-5880-specification.html', name: 'ams-5880-specification' },
  { file: 'ams-5936-specification.html', name: 'ams-5936-specification' },
  { file: 'ams-5962-specification.html', name: 'ams-5962-specification' },
  { file: 'ams-6257-specification.html', name: 'ams-6257-specification' },
  { file: 'ams-6260-specification.html', name: 'ams-6260-specification' },
  { file: 'ams-6265-specification.html', name: 'ams-6265-specification' },
  { file: 'ams-6279-specification.html', name: 'ams-6279-specification' },
  { file: 'ams-6304-specification.html', name: 'ams-6304-specification' },
  { file: 'ams-6322-specification.html', name: 'ams-6322-specification' },
  { file: 'ams-6346-specification.html', name: 'ams-6346-specification' },
  { file: 'ams-6348-specification.html', name: 'ams-6348-specification' },
  { file: 'ams-6349-specification.html', name: 'ams-6349-specification' },
  { file: 'ams-6370-specification.html', name: 'ams-6370-specification' },
  { file: 'ams-6382-specification.html', name: 'ams-6382-specification' },
  { file: 'ams-6409-specification.html', name: 'ams-6409-specification' },
  { file: 'ams-6414-specification.html', name: 'ams-6414-specification' },
  { file: 'ams-6415-specification.html', name: 'ams-6415-specification' },
  { file: 'ams-6417-specification.html', name: 'ams-6417-specification' },
  { file: 'ams-6419-specification.html', name: 'ams-6419-specification' },
  { file: 'ams-6440-specification.html', name: 'ams-6440-specification' },
  { file: 'ams-6444-specification.html', name: 'ams-6444-specification' },
  { file: 'ams-6484-specification.html', name: 'ams-6484-specification' },
  { file: 'ams-6485-specification.html', name: 'ams-6485-specification' },
  { file: 'ams-6487-specification.html', name: 'ams-6487-specification' },
  { file: 'ams-6488-specification.html', name: 'ams-6488-specification' },
  { file: 'ams-6875-specification.html', name: 'ams-6875-specification' },
  { file: 'ams-6930-specification.html', name: 'ams-6930-specification' },
  { file: 'ams-6931-specification.html', name: 'ams-6931-specification' },
  { file: 'ams-6932-specification.html', name: 'ams-6932-specification' },
  { file: 'ams-qq-s-763-specification.html', name: 'ams-qq-s-763-specification' },
  { file: 'ams-s-5626-specification.html', name: 'ams-s-5626-specification' },
  { file: 'ams-s-6049-specification.html', name: 'ams-s-6049-specification' },
  { file: 'ams-s-6758-specification.html', name: 'ams-s-6758-specification' },
  { file: 'ams-s-7720-specification.html', name: 'ams-s-7720-specification' },
  { file: 'ams-specifications-specialty-metals.html', name: 'ams-specifications-specialty-metals' },
  { file: 'ams-t-9046-specification.html', name: 'ams-t-9046-specification' },
  { file: 'ams-t-9047-specification.html', name: 'ams-t-9047-specification' },
  { file: 'asme-sb-637.html', name: 'asme-sb-637' },
  { file: 'asme-sb265-specification.html', name: 'asme-sb265-specification' },
  { file: 'asme-sb338-specification.html', name: 'asme-sb338-specification' },
  { file: 'asme-sb348-specification.html', name: 'asme-sb348-specification' },
  { file: 'asme-sb3481-specification.html', name: 'asme-sb3481-specification' },
  { file: 'asme-sb363-specification.html', name: 'asme-sb363-specification' },
  { file: 'asme-sb446-specification.html', name: 'asme-sb446-specification' },
  { file: 'asme-sb861-specification.html', name: 'asme-sb861-specification' },
  { file: 'asme-sb862-specification.html', name: 'asme-sb862-specification' },
  { file: 'asme-specifications.html', name: 'asme-specifications' },
  { file: 'astm-a276-specification.html', name: 'astm-a276-specification' },
  { file: 'astm-a295-specification.html', name: 'astm-a295-specification' },
  { file: 'astm-a320-specification.html', name: 'astm-a320-specification' },
  { file: 'astm-a322-specification.html', name: 'astm-a322-specification' },
  { file: 'astm-a331-specification.html', name: 'astm-a331-specification' },
  { file: 'astm-a479-specification.html', name: 'astm-a479-specification' },
  { file: 'astm-a484-specification.html', name: 'astm-a484-specification' },
  { file: 'astm-a564-specification.html', name: 'astm-a564-specification' },
  { file: 'astm-a582-specification.html', name: 'astm-a582-specification' },
  { file: 'astm-a638-specification.html', name: 'astm-a638-specification' },
  { file: 'astm-a646-specification.html', name: 'astm-a646-specification' },
  { file: 'astm-b211-specification.html', name: 'astm-b211-specification' },
  { file: 'astm-b265-specification.html', name: 'astm-b265-specification' },
  { file: 'astm-b338-specification.html', name: 'astm-b338-specification' },
  { file: 'astm-b348-specification.html', name: 'astm-b348-specification' },
  { file: 'astm-b363-specification.html', name: 'astm-b363-specification' },
  { file: 'astm-b381-specification.html', name: 'astm-b381-specification' },
  { file: 'astm-b446-specification.html', name: 'astm-b446-specification' },
  { file: 'astm-b637-specification.html', name: 'astm-b637-specification' },
  { file: 'astm-b861-specification.html', name: 'astm-b861-specification' },
  { file: 'astm-b862-specification.html', name: 'astm-b862-specification' },
  { file: 'astm-f136-specification.html', name: 'astm-f136-specification' },
  { file: 'astm-f1472-specification.html', name: 'astm-f1472-specification' },
  { file: 'astm-f1537-specification.html', name: 'astm-f1537-specification' },
  { file: 'astm-f67-specification.html', name: 'astm-f67-specification' },
  { file: 'astm-f799-specification.html', name: 'astm-f799-specification' },
  { file: 'astm-f899-specification.html', name: 'astm-f899-specification' },
  { file: 'astm-specifications.html', name: 'astm-specifications' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--alloy-steel-international-cross-reference.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--alloy-steel-international-cross-reference' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--aluminum-alloys-cross-reference.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--aluminum-alloys-cross-reference' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--carbon-steel-cross-reference.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--carbon-steel-cross-reference' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--charters-of-freedom-project.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--charters-of-freedom-project' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--history-of-titanium.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--history-of-titanium' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--nickel-international-cross-reference.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--nickel-international-cross-reference' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--stainless-steel-cross-reference.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--stainless-steel-cross-reference' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--titanium-international-cross-reference.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--titanium-international-cross-reference' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--titanium-seawater-applications.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--titanium-seawater-applications' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--weight-calculator.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--weight-calculator' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs--what-is-titanium.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs--what-is-titanium' },
  { file: 'metal-alloy-technical-data-titanium-nickel-steel-specs.html', name: 'metal-alloy-technical-data-titanium-nickel-steel-specs' },
  { file: 'quick-quote-alloy-steel-round-bar.html', name: 'quick-quote-alloy-steel-round-bar' },
  // HTML stays in migration/raw (gitignored). Drafts are the committed result.
]

mkdirSync(draftDir, { recursive: true })
mkdirSync(reportDir, { recursive: true })
const formDir = path.join(root, 'migration/forms')
mkdirSync(formDir, { recursive: true })

const knownForms: KnownFormNote[] = []
let portfolioCards: PortfolioCard[] | null = null
const portfolioPath = path.join(rawDir, 'oil-gas-portfolio.xml')
if (existsSync(portfolioPath)) {
  portfolioCards = oilGasCardsFromWxr(readFileSync(portfolioPath, 'utf8'))
  const portfolioDir = path.join(root, 'migration/portfolio')
  mkdirSync(portfolioDir, { recursive: true })
  writeFileSync(path.join(portfolioDir, 'oil-gas-cards.json'), `${JSON.stringify(portfolioCards, null, 2)}\n`)
}
const formExportPath = path.join(rawDir, 'gravity-form-20.json')
if (existsSync(formExportPath)) {
  const model = modelGravityFormExport(JSON.parse(readFileSync(formExportPath, 'utf8')), 20)
  if (model.publicSubmit !== false) throw new Error('Form 20 public submit must stay off')
  writeFileSync(path.join(formDir, 'gravity-form-20.model.json'), `${JSON.stringify(model, null, 2)}\n`)
  knownForms.push(formNoteFromModel(model))
}

const now = new Date().toISOString()
const conversions = []
const parity = []

for (const page of pages) {
  const htmlPath = path.join(rawDir, page.file)
  if (!existsSync(htmlPath)) {
    conversions.push({ path: page.name, action: 'missing-capture', reason: `${page.file} is not in migration/raw` })
    continue
  }
  const html = readFileSync(htmlPath, 'utf8')
  const ids = createIdFactory()
  const parsed = parseAviaHtml(html, ids, knownForms, portfolioCards)
  const incoming = roundTripPageDocument(toPageDocument(parsed, now))
  const draftPath = path.join(draftDir, `${incoming.id}.json`)
  const existing = existsSync(draftPath) ? JSON.parse(readFileSync(draftPath, 'utf8')) : null
  const gated = gateConversion(existing, incoming)
  if (gated.action === 'write') writeFileSync(draftPath, `${JSON.stringify(gated.draft, null, 2)}\n`)
  const checks = parityChecks(parsed, gated.draft)
  conversions.push({
    path: gated.draft.path,
    id: gated.draft.id,
    action: gated.action,
    reason: gated.reason,
    grid: gated.draft.provenance.grid,
    families: gated.draft.provenance.families,
    converterFamily: gated.draft.provenance.converterFamily,
    remainingSourceOnly: gated.draft.provenance.remainingSourceOnly,
    verify: gated.draft.provenance.verify,
    sourceHash: gated.draft.provenance.sourceHash,
  })
  parity.push({
    path: gated.draft.path,
    id: gated.draft.id,
    pass: checks.every((check) => check.pass),
    checks,
  })
  if (page.name === 'quality-systems') {
    const htmlPreview = `<!doctype html><html><head><meta charset="utf-8"><title>Editor preview</title></head><body>${renderWorkspace(gated.draft, null, null)}</body></html>`
    writeFileSync(path.join(reportDir, 'editor-quality.html'), htmlPreview)
    const lead = structuredClone(gated.draft)
    lead.rows = lead.rows.filter((row) => row.preset === 'quality-split')
    writeFileSync(
      path.join(reportDir, 'editor-quality-split.html'),
      `<!doctype html><html><head><meta charset="utf-8"><title>Quality documents row</title><style>.ti-seo{display:none}</style></head><body>${renderWorkspace(lead, null, null)}</body></html>`,
    )
    writeFileSync(path.join(reportDir, 'quality-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Quality columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'water-jet-cutting') {
    writeFileSync(path.join(reportDir, 'waterjet-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Water jet columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'medical') {
    writeFileSync(path.join(reportDir, 'medical-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Medical columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
  if (page.name === 'saw-cutting') {
    writeFileSync(path.join(reportDir, 'saw-columns.html'), `<!doctype html><html><head><meta charset="utf-8"><title>Saw cutting columns</title></head><body>${renderColumnsHtml(gated.draft.rows)}</body></html>`)
  }
}

const sitemapNote = {
  capturedInRepoBeforeThisChange: 0,
  publicSitemapUrls: countSitemap(),
}
writeFileSync(path.join(reportDir, 'conversions.json'), `${JSON.stringify({ generatedAt: now, sitemap: sitemapNote, pages: conversions }, null, 2)}\n`)
writeFileSync(path.join(reportDir, 'parity.json'), `${JSON.stringify({ generatedAt: now, pages: parity }, null, 2)}\n`)
const ledgerPages = readdirSync(draftDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => parsePageDocument(JSON.parse(readFileSync(path.join(draftDir, file), 'utf8'))))
const ledgerRows = allLedgerEntries(ledgerPages)
  .map(
    (entry) => `<tr><td><strong>${escapeReport(entry.title)}</strong><div>${escapeReport(entry.path)}</div><div>${escapeReport(entry.region)}</div></td><td><strong>${escapeReport(entry.layoutEditing)}</strong><div>${escapeReport(entry.layoutDetail)}</div></td><td><strong>${escapeReport(entry.visualCheck)}</strong><div>${escapeReport(entry.visualDetail)}</div></td><td>${escapeReport(entry.publishedVersion)}</td><td>${escapeReport(entry.lastChecked)}</td></tr>`,
  )
  .join('')
writeFileSync(
  path.join(reportDir, 'layout-status.html'),
  `<!doctype html><html><head><meta charset="utf-8"><title>Layout editing readiness</title><style>body{font-family:Inter,Arial,sans-serif;color:#1f2937;margin:1.5rem}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #cbd5e1;text-align:left;vertical-align:top;padding:0.6rem}th{color:#003366}</style></head><body><h1>Layout editing readiness</h1><p>These notes describe this candidate. No page here is a hosted conversion.</p><table><thead><tr><th>Page</th><th>Layout editing</th><th>Visual check</th><th>Published version</th><th>Last checked</th></tr></thead><tbody>${ledgerRows}</tbody></table></body></html>`,
)

function escapeReport(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
console.log(JSON.stringify({ conversions: conversions.map((item) => ({ id: item.id, action: item.action, grid: item.grid, families: item.families })), parity: parity.map((item) => ({ id: item.id, pass: item.pass, failed: item.checks.filter((check) => !check.pass).map((check) => check.name) })) }, null, 2))

function countSitemap(): number | null {
  const dir = '/tmp/ti-pages'
  const texts = ['page-sitemap1.xml', 'page-sitemap2.xml', 'post-sitemap.xml', 'portfolio-sitemap.xml', 'category-sitemap.xml', 'local-sitemap.xml']
  if (!texts.some((name) => existsSync(path.join(dir, name)))) return null
  let total = 0
  for (const name of texts) {
    const full = path.join(dir, name)
    if (!existsSync(full)) continue
    const matches = readFileSync(full, 'utf8').match(/<loc>/g)
    total += matches?.length ?? 0
  }
  return total
}
