# Cost and Materials Detail

**Parent**: active `/build` workspace
**Requirements**: FR-001–FR-010

## Purpose and semantic order

Explain current catalogue retail, applicable Mercenary purchases and committed engineering
requirements without inventing totals or hiding missing package facts. DOM/read order is always:

1. catalogue retail credits;
2. Mercenary purchases, only when package-recognized;
3. consolidated engineering materials and fitted-selection traces.

Visual columns may change; semantic order and content do not.

## Retail credits

Compose shared section, fact-list/value and qualification primitives. Show hull, fitted modules and
rebuy as three independent package facts. Never show the reference's combined `TOTAL` or derive
`REBUY 5%`.

Hull is always exact for a successful 0.1.2 retail projection. When `unpriced` is non-empty, mark
modules and rebuy as lower bounds and associate the complete returned-order evidence list with both.
Each evidence item keeps exact slot/module identity and offers a feature-002 slot action. Missing
package display text falls back visibly to raw identity; captured purchase values are ignored and
never fill retail.

## Mercenary purchases

Render a separate region only for `present`. Each entry exposes visible package-recognized
acquisition, module/variant, exact slot, purchase grade, current grade when different, and package
price or unavailable. The region total is the literal `mercCoinCost()` value. Missing entry prices
qualify it as a lower bound and associate every affected slot.

Do not place Merc Coin in the retail or material section, abbreviate it as `Mcr`, or imply exchange,
comparison or favourable value. An approved same-origin glyph may supplement the explicit localized
currency label but cannot carry meaning alone.

## Engineering materials

Render every consolidated package row in `sumMaterials()` order. Each row includes symbol-aware
package-localized/canonical-disclosed name, textual package grade, locale-formatted quantity and a
named trace disclosure. Category/line or a same-origin ornament may supplement these facts but never
replace them.

Each expanded trace lists every matching source: package-localized module and exact slot, blueprint or
effect identity, selected/current grade where relevant, and that exact source-list item's package
count. A separate slot action navigates to feature 002; expanding/collapsing a trace changes no build.

For `incomplete`, identify known rows as a lower bound and list every missing blueprint/effect
source. For `none`, state that no ordinary craft requirement applies and optionally explain fixed or
purchase baselines without fabricated zero rows. A metadata gap retains package symbol, quantity and
trace while name/grade are unavailable. A whole projection failure shows no stale current figures.

## Contextual Engineer composition

The shared feature-002 Engineer view uses the same cost classification for the currently selected
blueprint/grade/effect before Apply. A Mercenary purchase baseline is shown as a purchase, not inside
`MATERIALS · G1`; later purchase-route grades show only the package climb above that baseline. A
baked fixed effect is non-crafted; a newly selected different effect shows its one-application cost.
Draft changes do not alter committed detail/Status values until Apply succeeds.

## Responsive composition

- Wide desktop follows canvas 1c's intent: a compact Status rail and contextual Engineer area coexist
  with outfitting; complete material detail uses the available central/full width.
- Tablet portrait/landscape uses fluid one/two-column composition only while full labels and evidence
  fit. There is no source tablet canvas, so breakpoint behavior is defined by content rather than
  copied measurements.
- Mobile follows canvas 1d's stacked Status and full-screen/in-document Engineer hierarchy. Detail is
  one column; no row, qualification or trace is truncated.
- Mobile landscape, 200% text and 400% zoom use the same complete semantic stack. A wide list may
  scroll only within a labelled container; the document never scrolls horizontally.
- All actions use feature 011's shared AA target-size primitive, work by touch/pointer and require no
  hover.

## Required states

| State                                           | Presentation                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| No active build                                 | Existing workspace state; no empty cost cards                             |
| Matching projection                             | Exact package facts for the active revision                               |
| Mismatched/pending integration context          | No stale facts labelled as current                                        |
| One/all modules unpriced                        | Package lower bounds plus complete returned evidence                      |
| No Mercenary article                            | Mercenary region and summary absent                                       |
| Complete Mercenary set                          | Every recognized entry and exact package total                            |
| Missing Merc price                              | Entry unavailable and total lower bound with all affected slots           |
| No crafted/fixed-only/purchase-only engineering | Non-crafted explanation; no fabricated material rows                      |
| Complete/repeated materials                     | Full package list; traces retain repeated selections                      |
| Missing recipe                                  | Known list visibly incomplete plus all missing sources                    |
| Untranslated game text                          | Canonical package text plus shared untranslated disclosure                |
| Missing material metadata                       | Symbol/quantity/trace retained; name/grade unavailable                    |
| Projection failure                              | One localized prompt; active build remains intact; no stale current facts |

## Accessibility, localization and component impact

Regions have localized headings. Semantic lists/tables preserve label/value and qualifier/evidence
relationships. Lower-bound, unavailable, acquisition, grade and expansion state are exposed in text
and programmatically, never by colour/icon/placement alone. Trace controls name the material and
expose expanded state; slot actions name their visible destination.

Use feature 011's localized messages, package game-name presenters and named number/unit formatters.
Content survives text expansion, RTL fixtures and reduced motion. Settled semantic changes produce at
most one polite localized announcement; initial, unchanged, locale-only and stale work is silent.

Compose existing shared section, fact, qualification, disclosure, action and responsive-list
primitives. If a row-to-many-sources trace is missing, extend `src/app/ui/` and preview all states;
do not add screen-local colours, sizes, spacing, radii, elevation or motion.
