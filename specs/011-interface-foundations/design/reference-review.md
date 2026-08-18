# Design Reference Review: Interface Foundations

## Source and canvas inventory

The rendered source is `.design/Ship Builder.dc.html`:

| Canvas | Reference content                                                                | Foundation evidence                                                                                     |
| ------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1a     | 1320px Shipyard manifest, hull inspector, saved builds, import and help dialogs  | Wide frame/action group, search/filter/sort, selectable table, detail rail, modal layers                |
| 1b     | 390×844 Shipyard cards, full-screen hull/saved-build flows and bottom sheets     | Compact title/actions, card collection, sort strip, drill-in, sheet/full-height adaptation              |
| 1c     | 1560px Outfitting ledger, anatomy/work area, status rail, fitting/editor/dialogs | Three-region workspace, tabs, metrics/status, visual-to-ledger correlation, contextual action hierarchy |
| 1d     | 390×844 Outfitting modes, ledger, module/engineer drill-ins and action sheets    | Compact overflow, mode/category tabs, sticky actions, full-screen editors, bottom sheets                |

The canvases define product appearance and hierarchy. Shipyard and Outfitting remain routes/screens
owned by their capability features; feature 011 owns the system those screens compose.

## Adopted visual and composition decisions

- One near-black dark theme with warm amber as restrained emphasis, not a general meaning channel.
- Condensed uppercase headings, readable body text and monospaced numeric/technical data.
- Strong section labels, thin dividers, square/small-radius geometry and elevation reserved for
  overlays/menus.
- Wide master-detail and multi-region composition that becomes a complete stacked/drill-in compact
  experience.
- Persistent contextual identity at the start of a frame and visible primary actions at the end.
- Search/filter/sort toolbars, semantic collections, grouped metrics/statuses, tabs, dialogs, sheets
  and full-height layers as shared patterns.
- Anatomy/diagram visuals as a correlated view of the same textual ledger, never a replacement for
  it.

## Required departures

| Prototype evidence                                                         | Production treatment                                                                                         | Requirement/constraint     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| Fixed 1320/1560/390 canvases; no tablet/landscape/zoom                     | Content-driven wide/medium/compact layouts plus synthesized tablet and short-landscape rules                 | FR-011, FR-014             |
| Hundreds of inline color/type/spacing/border/motion values                 | One primitive source and one contrast-audited semantic dark token set                                        | FR-001–003                 |
| Small muted alpha text and meaningful faint borders below AA pairs         | Documented token pair contrast; enlarge/reweight/recolor without losing hierarchy                            | FR-012                     |
| Google Fonts preconnect/stylesheet and remote `edassets.org` material SVGs | Same-origin licensed font subsets and package/local assets; text/unavailable state when an asset is absent   | Constitution I, FR-019     |
| 268 clickable `div`s, no buttons/labels and almost no role/ARIA state      | Native/shared controls, visible/matching names, associated labels/errors and correct state                   | FR-006–009                 |
| Hover/title-only tips and auto-clearing feedback                           | Persistent text or explicit touch/pointer disclosure; visible feedback plus bounded live events              | FR-006, FR-009–010         |
| 14–40px interactive nodes/actions                                          | 44 CSS-pixel design target/hit area while preserving compact visible geometry                                | FR-012                     |
| Amber/green/red, border position, bars and node shapes as sole status      | Visible/programmatically associated state, value, unit, condition and equivalent data                        | FR-007, FR-010             |
| Hard-coded English, `en-US` formatting and no root language/direction      | Message facade, named active-locale formatters, `lang`/`dir`, logical CSS and bidi isolation                 | FR-014, FR-016–020         |
| Mobile omissions/ellipsis action and question-mark help controls           | Every action remains available; compact overflow exposes visible localized action names                      | FR-006–007, FR-011         |
| No loading previews and incomplete error/disabled coverage                 | Manifested populated/default, empty, loading, error and disabled states plus relevant unavailable/incomplete | FR-004, FR-024             |
| Mock game facts, share URLs and behaviors                                  | Capability specs and Almanac package data/contracts remain authoritative                                     | Constitution II, IV and IX |

## Specific prototype conflicts

- The help copy says imported partial engineering rolls are retained. Constitution principle IV
  requires resolved partial quality to be completed through the package or the import refused. The
  sentence is not accepted application text.
- Material grade icons are requested from another origin. Runtime cannot make those requests; a
  released package/same-origin licensed asset may supplement a localized grade label, otherwise the
  label alone carries the meaning.
- The canvas includes journal and Markdown export modes and a mock share URL. Those are feature 004/
  001 decisions and do not expand this foundation's scope.
- The compact design has no language control. Feature 011 adds a visible Language action/selector to
  the global utility composition without treating the omission as product intent.

## Acceptance rule

Implemented screens must remain recognizably consistent with the canvases' dark amber hierarchy,
typography roles, density and wide-to-compact composition. Pixel similarity cannot override the
specification, constitution, Almanac, locale state or accessibility contracts. Conversely,
accessibility work is not permission to replace the supplied visual direction with an unrelated
generic component library.
