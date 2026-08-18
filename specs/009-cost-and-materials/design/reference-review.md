# Design Reference Review: Cost and Materials

The design source is `.design/Ship Builder.dc.html`.

- Canvas **1c** is a 1560 px wide outfitting composition with a 392 px slot ledger, fluid central
  anatomy/fitting/engineering area and 306 px Status/cost/material rail.
- Canvas **1d** is a 390 px mobile composition whose Status mode stacks warnings, summary, Cost and
  Materials, while Change Module and Engineer use full-screen in-document layers.
- No tablet, intermediate-width, landscape, zoom or required unavailable/lower-bound state is
  designed. Those are plan-owned additions, not omissions implementation may inherit.

The HTML is an information-hierarchy reference. It is not a source of game values, component code,
breakpoints, assets or visual literals.

## Adopt

- Two information levels: contextual per-selection recipe/purchase facts beside feature 002's
  Engineer, and build-level requirements in Status/detail.
- Glanceable retail facts before engineering requirements.
- Separately labelled hull, modules and rebuy package results.
- A visibly distinct Mercenary purchase identity.
- Material rows with package name, textual grade and quantity.
- Wide grouping that becomes a complete mobile semantic stack.
- Mobile progressive disclosure through Status and in-document editor layers.

## Required departures

| Reference treatment                                  | Planned treatment                                                | Reason                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Adds hull/modules into `TOTAL`                       | No combined credit total                                         | Package returns no such field; local addition violates FR-001/002   |
| Labels `REBUY 5%` beside a mock                      | Present literal package rebuy without consumer derivation        | The package already owns the calculation                            |
| Shows five materials plus blueprint/type/unit counts | Show every consolidated row and no authored aggregate arithmetic | Story 2 requires one consolidated list and package-owned quantities |
| Places Merc Coin inside Materials and G5-roll cards  | Separate conditional Mercenary purchase region                   | It is purchase currency, not craft material                         |
| Uses `Mcr` for million credits                       | Explicit localized credits / Merc Coin units                     | The abbreviation is ambiguous and not locale-safe                   |
| Tiny glyph/title marks Mercenary candidates          | Visible acquisition text plus optional ornament                  | Essential meaning cannot depend on hover, title or image            |
| Remote `edassets.org` grade icons and Google Fonts   | Package textual grade; approved same-origin optional assets      | Cross-origin runtime requests are prohibited                        |
| One-line ellipsis/fixed columns                      | Wrapping fluid content and internally contained wide data        | Translation, 200% text and 400% zoom must retain meaning            |
| No missing/lower-bound states                        | Associated text/evidence for every required state                | FR-002/005/008                                                      |
| No material source trace                             | Complete per-row fitted-selection disclosure                     | SC-003                                                              |
| Clickable unsemantic `div` controls                  | Shared buttons/tabs/disclosures with names/state                 | Touch and screen-reader operation                                   |
| Inline colors/sizes and colour-only change meaning   | Design tokens plus textual/programmatic state                    | One design system and WCAG requirements                             |

The local `.design/assets/merc-coin.png` is not automatically an approved product asset. Reuse
requires same-origin delivery, an accepted provenance/licensing decision and design-system treatment;
explicit localized text remains sufficient and mandatory.

## Responsive and accessibility consequence

Wide 1c proximity and mobile 1d stacking remain the compositional intent, but the finished design adds
tablet portrait/landscape, mobile landscape, 200% text, 400% zoom, expanded translation/RTL,
lower-bound, unavailable, trace-expanded and error states. DOM/read order stays retail → conditional
Mercenary → materials at every width. No behavior depends on hover and no document-level horizontal
overflow is permitted.
