# Screen Inventory and Requirement Mapping

Feature 001 is expressed through four logical route screens. `.design/Ship Builder.dc.html` supplies responsive visual variants: a logical screen may be an inspector/modal at wide widths and a full-screen layer at narrow widths. Shared foundations come from feature 011.

| Screen                                  | Route            | Design variant                                            | Purpose                                                                        | Primary states                                                                                                  |
| --------------------------------------- | ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| [Hull catalogue](./hull-catalogue.md)   | `/ships`         | Canvas 1a manifest; canvas 1b stacked list                | Find and compare package hulls without touching a build.                       | populated, filtered, no matches, restored session, unavailable fact                                             |
| [Hull detail](./hull-detail.md)         | `/ships/:symbol` | Canvas 1a inspector rail; canvas 1b full-screen layer     | Inspect authoritative hull facts/artwork and explicitly request a stock build. | populated, artwork loading/missing, default unavailable, unknown symbol, replacement confirmation               |
| [Build workspace](./build-workspace.md) | `/build#b.…`     | Canvas 1c command bar/dialogs; canvas 1d menu/sheets      | Host the active tab-owned build, save/share status and link ingress.           | no build, working/named/link, dirty, persistence failure, valid/invalid link, link refusal                      |
| [Build library](./build-library.md)     | `/builds`        | Canvas 1a route-backed modal; canvas 1b full-screen layer | List/manage working and named records and resolve storage conflicts/capacity.  | empty, populated, unsupported/corrupt record, duplicate warning, delete confirmation, conflict, retention/quota |

## Requirement coverage

| Requirement | Screen/interface coverage                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Catalogue and detail consume package hull records; detail/workspace create through `ShipLoadout.default`; domain contract uses `symbol`. |
| FR-002      | Catalogue toolbar/cards expose every displayed fact, all constraints, count and stable bidirectional sort.                               |
| FR-003      | Catalogue session store and detail back action preserve query/facets/sort/result anchor; route/link/storage contracts exclude it.        |
| FR-004      | Hull detail `FactList` and `SlotLayout` show every named package field/unit under a “Hull specifications” boundary.                      |
| FR-005      | Symbol route lookup; detail unknown-symbol error has no creation action and no build mutation.                                           |
| FR-006      | Catalogue/detail `HullArtwork` uses copied same-origin package assets, textual equivalence and non-blocking absence.                     |
| FR-007      | Detail explicit create intent checks package default then transactionally calls the package factory.                                     |
| FR-008      | Workspace tab-owned autosave/restore status and library record listing/open/name operations.                                             |
| FR-009      | Detail/workspace replacement dialog; library duplicate-name warning and delete dialog.                                                   |
| FR-010      | Library cards show local name/working state, package hull, localized modified instant and recorded validation; note editor is local.     |
| FR-011      | Workspace sharing boundary and SLEF integration exclude note/local identity; persistence contract keeps them separate.                   |
| FR-012      | Workspace tab coordinator; library three-choice conflict state; persistence contract locks/revisions writes.                             |
| FR-013      | Library retention/quota manager lists explicit discard choices; workspace remains editable when persistence pauses.                      |
| FR-014      | Library unsupported/migration/failure states; persistence version registry and lossless snapshot contract.                               |
| FR-015      | Workspace and build-link contract put the payload only after `#`.                                                                        |
| FR-016      | Build snapshot/link codec adapter preserve only the enumerated modelled package identities/state.                                        |
| FR-017      | Workspace link/SLEF boundary tests forbid derived/catalogue/local fields.                                                                |
| FR-018      | Existing codec loader/table generator; workspace refuses unsupported versions and never changes published tables.                        |
| FR-019      | Workspace clears stale fragment, identifies refusal slot/reason and links to feature 004 SLEF.                                           |
| FR-020      | Workspace initial/hash navigation share one candidate-first flow; edits use `replaceState`.                                              |
| FR-021      | Existing codec bound/capacity corpus plus workspace refusal at over-limit input.                                                         |

## Cross-screen replacement rule

Stock creation, record opening and link loading all construct a detached candidate first. If active work is unsaved, the workspace-level replacement dialog identifies both current and incoming hull/provenance. Failure or cancel keeps the current route-appropriate display and active build unchanged; acceptance commits once, forks into the current tab's working record and navigates to `/build` where appropriate.

## Shared responsive composition

All four screens use the same `AppShell`, navigation, page heading, notice/error/status and dialog components. At narrow/zoomed widths, toolbars and record/card actions reflow vertically without changing available actions or semantic order. No route introduces page-level horizontal scrolling; a component that genuinely needs width owns its internal overflow. Touch/pointer and screen-reader behavior are identical in capability.

The wide library modal remains a route-backed screen so it can be opened directly and represented in browser history. The originating route may remain visually behind it, but is inert and hidden from the accessibility tree while the modal is active.
