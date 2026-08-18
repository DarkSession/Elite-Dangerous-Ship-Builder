# Screen and Surface Inventory

Feature 010 adds no route. Hull Anatomy composes inside feature 001's `/build` workspace beside
feature 002's complete outfitting ledger. Responsive side choice, internal scroll position and list
detail expansion are memory-only presentation state and never enter a build, local record, URL or
SLEF.

| Surface                                | Wide/tablet presentation                                     | Narrow/zoomed presentation                                    | Requirements                                         |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------- |
| [Hull Anatomy](./hull-anatomy.md)      | Top and bottom schematic regions with shared selected state  | Labelled side selector and one bounded schematic region       | FR-001–FR-003, FR-005–FR-007, FR-009, FR-010, FR-012 |
| Unique hardpoint text equivalent       | Every package hardpoint once beside/below geometry           | Same complete package-ordered list below the selected side    | FR-004–FR-008, FR-010, FR-012                        |
| Selected hardpoint detail              | Shared selected-slot summary and feature 002 inline target   | Summary plus feature 002 selected-slot layer and named return | FR-005, FR-006, FR-008                               |
| Complete slot ledger (feature 002)     | Persistent grouped ledger, independent of anatomy            | Existing complete category/card flow                          | FR-004, FR-006, FR-010, FR-012                       |
| Side unavailable/package-defect notice | Side-local status with retry; other side/list remain present | Status replaces only the affected side region                 | FR-002, FR-010                                       |
| Artwork/data provenance (feature 012)  | Same-origin help/legal action in anatomy heading/metadata    | Same named action in the compact heading/action region        | FR-011                                               |

## Requirement ownership

| Requirement | Surface behavior                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Active build supplies exact hull symbol; top/bottom installed package files are the only artwork source.                                            |
| FR-002      | The released annotation contract plus exact slot resolution admits only package hardpoints; utility geometry is inert.                              |
| FR-003      | Slot key and path/circle geometry remain package data; no order, index, id, coordinate or measurement identifies a mount.                           |
| FR-004      | Feature 002's complete ledger remains unchanged and is the route to utility, internal and every unlocated slot.                                     |
| FR-005      | Geometry and the all-hardpoint canonical list expose fitted/empty, engineered/stock, selected and power state in visual and complete textual forms. |
| FR-006      | Geometry/list activation targets feature 002; selected located slots deterministically reveal a containing side.                                    |
| FR-007      | One item per canonical slot drives every top/bottom occurrence.                                                                                     |
| FR-008      | Selected detail contains only package slot size/module and feature 005's package-backed effective priority/current power observation.               |
| FR-009      | Angular copies from the installed package into output; no generated SVG is committed or fetched cross-origin.                                       |
| FR-010      | Side-local loading/failure/retry never hides or disables the canonical list or feature 002 ledger.                                                  |
| FR-011      | Feature 012 owns installed-package notices and deliberate external issue navigation.                                                                |
| FR-012      | Exact-geometry non-scaling hit clones and independent list controls meet the shared target baseline; internal native pan is never the only route.   |

## Cross-feature composition

- Feature 001 owns the active build, opaque build revision, `/build` workspace, installed artwork
  copy/cache and online retry coordinator.
- Feature 002 owns every package slot, exact selection, complete fallback ledger and all edits.
- Feature 003 owns deployed/retracted viewing conditions and condition revision.
- Feature 005 owns the package-backed per-module current-power observation after Almanac #299.
- Feature 011 owns tokens, layout primitives, tabs, notices, localization, formatters, live regions,
  previews and the dual-engine accessibility harness.
- Feature 012 owns legal/provenance content and package-defect external navigation.
- Feature 010 owns only validated schematic presentation, occurrence grouping, deterministic reveal
  and the unique located-hardpoint text equivalent.

## Shared states

Previews and tests cover:

- no active build;
- both sides loading, independently ready and fully ready;
- a valid side with no hardpoints;
- one side unavailable and both sides unavailable;
- uncached offline failure, HTTP failure, invalid/active SVG and successful retry/reconnection;
- unknown, wrong-kind and contract-valid/contract-invalid repeated annotations;
- all hardpoints empty, all fitted and mixed fitted/empty;
- resolved, unresolved, stock and engineered articles;
- no selected slot, one selected occurrence and synchronized cross-side duplicates;
- selected feature 002 slot with no admitted anatomy occurrence;
- disabled, inactive while retracted, powered, priority-shed and qualified/unavailable power;
- stale build/condition/asset completion refusal;
- package localized name and disclosed canonical fallback;
- long translated/RTL text and unexpected presentation failure.

## Accessibility, responsive and localization baseline

- Anatomy participates in the workspace's one `main` and heading hierarchy; it adds no route-level
  landmark or competing `h1`.
- Side regions have localized headings and state descriptions. The inline SVG receives an image
  description; hardpoint occurrence groups expose named button/selected/detail relationships.
- The canonical hardpoint list uses semantic list and definition structures. Every item contains an
  independent 44 CSS-pixel slot action and all state text once, regardless of duplicate geometry.
- Filled/dashed/halo/power styling is supplementary. Empty, engineered, selected, disabled,
  inactive, shed, qualified and unavailable are always text/programmatic state.
- Wide visual columns do not change semantic reading order. At 200% text, 400% zoom, narrow widths
  and landscape phones, groups stack and only each schematic viewport may scroll horizontally.
- Native touch/trackpad/wheel scrolling uses visible affordance. No hover, multi-pointer gesture or
  custom drag transform is required.
- Reduced motion removes smooth reveal and nonessential transitions. RTL/expanded text does not
  mirror package geometry or detach a label from its slot.
- App text uses feature 011 messages. Module names use Almanac locale helpers with disclosed
  canonical fallback; slot keys remain exact identifiers.
- Automated coverage scans every meaningful state in Chromium and Firefox across desktop,
  tablet/mobile portrait and landscape. Manual screen-reader journeys verify side/image/list/detail
  relationships, duplicates, selection, announcements and failure fallback.

Where conformance is stated, use: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”
