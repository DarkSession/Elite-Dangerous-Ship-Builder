# Design Reference Review: Interface Foundations

Reviewed `.design/Ship Builder.dc.html` canvases 1a–1d as hierarchy/composition references. The file
is not production source, a token definition, an accessibility contract or a game-data source.

## Adopted direction

- One dense dark visual language with a restrained accent and strong section hierarchy.
- Stable product frame across shipyard, build workspace and overlay/layer contexts.
- Wide grouped content that becomes a complete stacked narrow composition.
- Clear visible action labels, grouped facts, status regions and modal/full-screen layer variants.
- Compact monospaced numeric treatment where legibility and localization allow it.

## Required departures

| Reference treatment                                           | Planned treatment                                           | Reason                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Inline colors, spacing, fonts, borders, shadows and durations | Semantic tokens from the one dark set                       | Canvas literals are not the repository design system                   |
| Google Fonts/preconnect requests                              | System stacks or separately licensed same-origin assets     | No automatic cross-origin request; feature 012 owns attribution        |
| Fixed 1320/390 pixel canvases                                 | Fluid/container layouts using named profile tokens          | Tablet, orientations, zoom and text expansion are first-class          |
| Clickable `div`s and icon/glyph close controls                | Native/shared semantic controls with matching visible names | Touch and screen-reader names/roles/states must be owned by components |
| Hover-only states/titles                                      | Persistent text or explicit disclosure working by touch     | Essential meaning cannot depend on hover                               |
| Hard-coded English and English number/date abbreviations      | Runtime message keys and named locale formatters            | All application text/values follow active locale                       |
| Color/position/bars as status meaning                         | Associated state/value text                                 | Meaning cannot be visual-only                                          |
| Narrow variants omitting fields/actions                       | Complete stable semantic stack                              | Mobile is not a reduced fallback                                       |
| Arbitrary animation                                           | Tokenized motion removed under reduced motion               | Motion cannot carry meaning                                            |

## Resulting foundation

The implementation may resemble the reference's dark, compact hierarchy only through reviewed
semantic tokens and shared components. It does not copy the canvas CSS, external network requests,
sample values, inaccessible controls or fixed breakpoints. Product and preview targets use the same
implemented design system; the repository remains the source of truth.
