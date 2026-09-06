# Screen Inventory and Requirement Mapping

Feature 011 adds no standalone Commander content route. It supplies an embedded application shell and
the components/contracts every product screen uses. Its only standalone surface is the tooling-only
component preview application, which never appears in product navigation or production output.

## Feature-owned surfaces

| Surface                           | Wide/medium presentation                                                                                                                      | Compact/zoom presentation                                                                     | Primary states                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Embedded application shell        | Tool bar, product/route identity and feedback; navigation and actions on the bar only where the widest shipped language draws them on one row | Tool bar, identity and the named action layer, holding every action and screen the bar offers | bootstrap, route loading/ready/empty/error, locale ready/loading/fallback, open screen's tool |
| Global feedback/announcement host | Visible route/global messages plus hidden assertive/polite outlets                                                                            | Same semantic order and event policy                                                          | initial, new/stale/replayed blocking/nonblocking events                                       |
| Component preview application     | Manifest selection and bounded component fixture                                                                                              | Same fixture under compact project viewport                                                   | every declared state plus expanded, RTL, reduced motion, localized/canonical/unavailable      |

## Reference-canvas consumption

| Canvas | Capability-owned product surface  | Feature 011 patterns consumed                                                                                   |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1a     | Shipyard catalogue/detail/library | shell/action group, labelled search, segmented filter, sortable collection, detail/panel, metric/status, dialog |
| 1b     | Compact Shipyard/detail/library   | compact shell/menu, cards, scrollable sort choices, full-height drill-in, sheet                                 |
| 1c     | Outfitting/anatomy/status/editor  | workspace regions, tabs, ledger/table/list, metric/status/unavailable, visualization equivalence, dialog        |
| 1d     | Compact Outfitting/editor/actions | compact mode/category controls, sticky action region, full-height editor, sheet/action layer                    |
| 4c/4d  | None — the shell owns it          | tool bar and tool registry, current-tool state                                                                  |

The product screen inventories in features 001–010/012 own their domain states and requirement
mapping. They register/preview shared extensions through this feature's contracts.

## Requirement coverage

| Requirement | Surface/contract/verification owner                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Product/preview compose `src/app/ui/`; token/component contract and cross-feature screen review                                                         |
| FR-002      | Primitive/semantic token sources plus PostCSS property-aware policy gate                                                                                |
| FR-003      | One semantic dark set; no shell control, media-selected light set or stored theme                                                                       |
| FR-004      | Typed preview manifest reconciled with every exported component/state and all global profiles                                                           |
| FR-005      | Shared extension rule, exported inventory and screen-design review before capability use                                                                |
| FR-006      | Native/shared controls; click/tap primary journeys; no essential hover or multipointer path                                                             |
| FR-007      | Component semantic contracts and explicit visible-name/accessibility-name/state/relationship assertions                                                 |
| FR-008      | Shell banner/navigation and route-owned main/h1 contract; E2E/AT heading and landmark checks                                                            |
| FR-009      | Global visible feedback plus assertive/polite revision-deduplicated outlets                                                                             |
| FR-010      | Text-equivalence contract and fixtures for status, bars, icons, selections and visualizations                                                           |
| FR-011      | Wide/medium/compact design, ten projects, 200% text, 320px proxy, overflow checks and actual-400%-zoom records                                          |
| FR-012      | Contrast-evidenced tokens, 44px design target, axe/computed/box checks and documented exception handling                                                |
| FR-013      | Motion tokens, reduced-motion fixtures/emulation and semantic-state equivalence                                                                         |
| FR-014      | Logical CSS, stable DOM order, expanded/RTL/bidi fixtures and glyph coverage                                                                            |
| FR-015      | Canonical qualified message plus scoped policy check naming all eight exclusions                                                                        |
| FR-016      | Typed message facade and Angular/TypeScript AST display-text gate, including document title                                                             |
| FR-017      | Locale startup state machine: browser-language match, then bundled English                                                                              |
| FR-018      | Named cached `Intl` formatter registry                                                                                                                  |
| FR-019      | Canonical catalogues, bundled English, same-origin versioned assets, atomic fallback and offline production test                                        |
| FR-020      | Almanac leaf presenter with known-identity provenance, canonical disclosure and unavailable state                                                       |
| FR-021      | Generated five-profile × two-engine primary-journey matrix and coverage-ledger test                                                                     |
| FR-022      | Shared axe helper scans each ledger product/preview state and fails on in-scope violations                                                              |
| FR-023      | Versioned NVDA/Firefox, TalkBack/Chromium, materially different tablet and actual-zoom protocol/results                                                 |
| FR-024      | Fixture-tested Angular/TypeScript/PostCSS policy plus UI-export/preview-ledger reconciliation                                                           |
| FR-027      | Route-owned title/description/canonical in the one document commit, static head, crawl policy, sitemap, manifest and JSON-LD, reconciled by policy gate |
| FR-028      | One tool registry read by the shell; tool bar naming every served tool, with the open route's tool exposed as current at every width                    |

## Cross-feature ownership

- Feature 011 owns shell semantics, the tool registry and the bar that draws it, locale startup and
  formatters, package-text disclosure, global announcements, base tokens/components,
  responsive/adaptive contracts, preview infrastructure, strict compiler flags, service-worker
  locale boundary and the common browser/accessibility gate. A capability that is a tool of its own
  adds its entry to the registry; it does not draw a bar.
- Each capability owns its route content, domain projection, states, journeys and domain-specific
  UI extensions. Every extension enters `src/app/ui/` and this preview/verification system before use.
- Feature 001 supplies Shipyard/build routes and extends the service-worker asset rules for hull art;
  feature 004 supplies SLEF exchange; feature 012 owns help/licence content and displays the qualified
  conformance/font attribution through these primitives.

Every later screen inventory must map its requirements to shared components and add its routes,
states and manual protocols to the common ledger.
