# Screen and Surface Inventory

Feature 010 adds no route. Hull Anatomy composes inside feature 001's `/build` workspace beside
feature 002's complete outfitting ledger. Wide and narrow arrangements are responsive presentations
of one capability, not separate screens. Side choice, pan and list disclosure are memory-only.

| Surface                                   | Wide/tablet presentation                                                | Narrow/zoomed presentation                                                | Requirements                                         |
| ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| [Hull Anatomy](./hull-anatomy.md)         | Labelled top and bottom schematic regions when space permits            | Labelled top/bottom selector and one bounded schematic                    | FR-001–FR-003, FR-005–FR-007, FR-009, FR-010, FR-012 |
| Unique located-mount text equivalent      | Every hardpoint and utility once in package order beside/below geometry | Same complete list after selected facts; may group without changing order | FR-004–FR-008, FR-010, FR-012                        |
| Selected mount facts                      | One shared hardpoint/utility summary near schematics and editor         | Summary before the list/editor; named return preserved                    | FR-005, FR-006, FR-008                               |
| Complete slot ledger (feature 002)        | Persistent editor/navigation region independent of artwork              | Existing grouped list and exact-slot layer                                | FR-004, FR-006, FR-010, FR-012                       |
| Side availability/defect status           | Replaces only the affected side; peer/list/ledger remain                | Replaces only selected side with selector/retry retained                  | FR-002, FR-010                                       |
| Help/provenance modal entry (feature 012) | Context action in anatomy heading                                       | Same action in compact heading                                            | FR-011                                               |

## Requirement ownership

| Requirement | Surface behavior                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Active build supplies exact hull symbol; only installed package top/bottom assets are requested.                                               |
| FR-002      | `hardpoint` and `utility_mount` annotations become interactive only after exact key and matching package-kind resolution.                      |
| FR-003      | Package group shapes and journal keys are retained; no position, order, id, number, prefix, coordinate or measurement identifies a mount.      |
| FR-004      | The feature 002 complete ledger remains the route to all slots and is unaffected by anatomy state.                                             |
| FR-005      | Geometry and unique items expose hardpoint/utility fitted, empty, engineered, focused and power states visually, programmatically and as text. |
| FR-006      | Geometry/list targets the exact feature 002 slot; a selected located ledger item deterministically reveals a containing side.                  |
| FR-007      | One canonical item drives every top/bottom occurrence for a key.                                                                               |
| FR-008      | Selected facts contain only exact kind/key/size, fitted module, engineering presence, effective priority and owner current-power state.        |
| FR-009      | Build copies installed schematics unchanged into same-origin output and audits their bytes/contracts.                                          |
| FR-010      | Independent temporary-unavailable/retry states never remove unique list, complete ledger or editing.                                           |
| FR-011      | Context action opens feature 012's in-place package artwork/data provenance modal.                                                             |
| FR-012      | Exact-shape non-scaling hit clones and independent list controls meet the 44px baseline; bounded native pan is optional.                       |

## Cross-feature composition

- Feature 001 owns active build/hull/revision, `/build`, package artwork delivery, single service
  worker and online recovery coordination.
- Feature 002 owns all slot views, one selected key, complete ledger, exact-slot surface and editing.
- Feature 003 owns deployed/retracted viewing state and condition revision.
- Feature 005 owns generalized hardpoint/utility priority/current-power observations.
- Feature 011 owns tokens, responsive primitives, controls, localization/game text, formatters,
  announcements, previews and the ten-project axe-enabled harness.
- Feature 012 owns the in-place help/provenance modal and external navigation.
- Feature 010 owns validated schematic presentation, mount occurrence grouping, unique text
  equivalence and deterministic reveal only.

## Shared state coverage

Previews and tests cover:

- no active build;
- both sides loading, one ready/one loading and both ready;
- one or both sides temporarily unavailable, uncached offline, retry and reconnection;
- invalid/unsafe document, unknown key, wrong-kind annotation, same-side duplicate and missing
  contract geometry;
- all empty, all fitted and mixed hardpoint/utility mounts;
- empty removable/resolved modules, package-populated fixed mounts and stock/engineered/unavailable
  engineering state;
- no selection, hardpoint selection, utility selection and synchronized cross-side repeats;
- selected internal/unlocated slot;
- disabled, inactive-retracted, powered, shed and not-applicable power states;
- stale hull/build/condition/asset completion refusal;
- localized package text, canonical fallback, unavailable game text and long RTL/expanded app text;
- unexpected anatomy projection failure with complete ledger still usable.

## Accessibility, responsive and localization baseline

- One workspace `main`/`h1`; anatomy uses a nested heading and named side/status/list/detail regions.
- Each SVG has a localized image description. Interactive groups expose name, role, focused state
  and detail relationship; unique list controls remain the primary stable semantic route.
- Every state is text/programmatic as well as tokenized fill/stroke/dash/icon treatment.
- Semantic order is heading/context/provenance, side selector/status, schematics/legend, selected
  facts, unique list, then the existing complete ledger/editor context.
- Available inline size—not device detection—chooses paired or single-side layout. At 200% text,
  actual 400% zoom and landscape phones, content stacks with no document horizontal overflow;
  only schematic containers may pan.
- Native touch/trackpad/wheel scrolling has visible affordance. No hover, multipointer gesture or
  custom drag is essential. Reduced motion removes smooth reveal/nonessential transitions.
- RTL/expanded text never mirrors package geometry or changes exact slot identity.
- Owned strings use feature 011. Package names use Almanac localization with canonical/unavailable
  disclosure. Slot keys remain exact identifiers.
- Automated checks cover all meaningful states in Chromium and Firefox at desktop, tablet portrait/
  landscape and mobile portrait/landscape. Manual screen-reader checks verify geometry/list/detail,
  duplicate, selection, status and recovery relationships.

Where conformance is stated, use: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”
