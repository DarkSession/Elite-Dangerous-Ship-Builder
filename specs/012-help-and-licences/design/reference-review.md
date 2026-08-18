# Design Reference Review: Help, Licences and Provenance

The source reference is `.design/Ship Builder.dc.html`, especially its repeated Help · About overlays
and desktop/mobile help controls. It is an information-hierarchy reference, not a source of versions,
legal facts, components, assets or styles.

## Adopt

- A help action available from the persistent application chrome.
- A single grouped destination for behavior help, about/version facts and legal information.
- Grouped wide information hierarchy that becomes a complete one-column narrow stack.
- Short overview content before longer legal detail.

## Required departures

| Reference treatment                               | Planned treatment                                                             | Reason                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `APP VERSION 4.2.1` and `LIBRARY VERSION 3.8.0.3` | Separate exact root and installed-package versions, plus non-release build ID | Mock values are invented and “library” is ambiguous                            |
| Three-line licence summary                        | Three complete exact documents with coverage index                            | FR-003–FR-006 require complete, attributable, verbatim artifacts               |
| EDASSETS.ORG artwork/material claim               | Installed Almanac/Frontier/third-party provenance only                        | The claim is unsupported by shipped artifacts                                  |
| Barlow/JetBrains Mono licence claim               | Only licences for assets actually shipped, sourced from their artifacts       | A mock typeface choice cannot create a distribution term                       |
| Fixed overlay dimensions and internal scrolling   | Responsive semantic document with wrapping legal text                         | Mobile, 200% text and 400% zoom require complete content without page overflow |
| Icon/`?` help controls with title-only naming     | Visible localised Help/data-and-licences names matching accessible names      | Touch and screen-reader use cannot depend on tooltip/icon recognition          |
| Repeated copied help/legal blocks                 | One eager route and shared shell/context links                                | One source prevents drift and keeps all contexts reachable                     |
| Hard-coded colors, fonts, borders and spacing     | Feature 011 components/tokens                                                 | The repository design system is authoritative                                  |

The mock's values, legal wording, visual literals, hover behavior and JavaScript wiring are not
copied. Feature 011 owns the resulting visual language; the generated distribution manifest owns
facts and exact legal bytes.

## Responsive and accessibility consequence

The reference's narrow-sheet idea becomes the normal one-column document rather than a fixed modal
with clipped content. Semantic reading order is invariant, every entry has visible text, long notices
wrap, all actions meet the shared touch target and no information depends on color, icon or placement.
