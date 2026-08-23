# Screen and Surface Inventory

Feature 010 adds no route. Hull Anatomy composes inside feature 001's `/build` workspace beside
feature 002's complete outfitting ledger. Wide and narrow arrangements are responsive presentations
of one capability, not separate screens. Side choice, pan and list disclosure are memory-only.

| Surface                            | Wide/tablet presentation                                     | Narrow/zoomed presentation                               | Requirements                                         |
| ---------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------- |
| [Hull Anatomy](./hull-anatomy.md)  | Labelled top and bottom schematic regions when space permits | Labelled top/bottom selector and one bounded schematic   | FR-001–FR-003, FR-005–FR-007, FR-009, FR-010, FR-012 |
| Mode strip                         | Five segments beside the rule; only `MOUNTS` is built        | The same five, full width under the rule                 | —                                                    |
| Legend                             | The five treatments the marks carry, in words                | The same five, wrapping                                  | FR-005                                               |
| Complete slot ledger (feature 002) | Persistent editor/navigation region independent of artwork   | Existing grouped list and exact-slot layer               | FR-004, FR-006, FR-010, FR-012                       |
| Side availability/defect status    | Replaces only the affected side; peer/list/ledger remain     | Replaces only selected side with selector/retry retained | FR-002, FR-010                                       |

Three surfaces this inventory planned are not built, because the reference canvases do not draw
them: a second unique located-mount list, a selected-mount facts block and a provenance control of
this capability's own. Feature 002's complete ledger is the text equivalent and the route to every
mount, and feature 012 owns provenance from the application's help capability
(design/hull-anatomy.md, "Divergence from FR-008", "Divergence from FR-004 and SC-003", "Divergence from
FR-011").

## Requirement ownership

| Requirement | Surface behavior                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Active build supplies exact hull symbol; only installed package top/bottom assets are requested.                                                                                                        |
| FR-002      | `hardpoint` and `utility_mount` annotations become interactive only after exact key and matching package-kind resolution.                                                                               |
| FR-003      | Package group shapes and journal keys are retained; no position, order, id, number, prefix, coordinate or measurement identifies a mount.                                                               |
| FR-004      | The feature 002 complete ledger remains the route to all slots and is unaffected by anatomy state.                                                                                                      |
| FR-005      | Each mark exposes fitted, empty, engineered and selected state visually, programmatically and as text. Power is the `POWER` mode's, which feature 005 owns.                                             |
| FR-006      | A mark targets the exact feature 002 slot; a selected located ledger item deterministically reveals a containing side.                                                                                  |
| FR-007      | One canonical item drives every top/bottom occurrence for a key.                                                                                                                                        |
| FR-008      | The plates publish no second detail surface: selecting a mark selects feature 002's slot, and its row and the fitting bench are where the facts are.                                                    |
| FR-009      | Two reproduction scripts turn each installed schematic into a rendering and a mount extract; the policy checker audits each extract's recorded source digest against the pinned package.                |
| FR-010      | Independent temporary-unavailable/retry states, for a missing extract and a missing rendering alike, never remove the complete ledger or editing.                                                       |
| FR-011      | Provenance is reachable from the application's help capability, which feature 012 owns; hull anatomy publishes no control of its own.                                                                   |
| FR-012      | The canvas's numbered marks are named buttons, separately operable from the keyboard; the ledger beside them meets the 44px baseline (SC 2.5.8's Equivalent exception). Bounded native pan is optional. |

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
- an extract that is not this build's own, one for another hull or side, a malformed mount, an
  unknown key, a wrong-kind annotation, a same-side duplicate and missing contract geometry;
- a rendering that does not load beside an extract that did;
- all empty, all fitted and mixed hardpoint/utility mounts;
- empty removable/resolved modules, package-populated fixed mounts and stock/engineered/unavailable
  engineering state;
- no selection, hardpoint selection, utility selection and synchronized cross-side repeats;
- selected internal/unlocated slot;
- stale hull/build/condition/asset completion refusal;
- localized package text, canonical fallback, unavailable game text and long RTL/expanded app text;
- a hull change while both sides are in flight, with every stale completion discarded.

## Accessibility, responsive and localization baseline

- One workspace `main`/`h1`; anatomy uses a nested heading and named side/status/list/detail regions.
- Each plate has a localized image description. Each mark is a named button carrying its own state;
  feature 002's complete ledger remains the primary stable semantic route.
- Every state is text/programmatic as well as tokenized fill/stroke/dash/icon treatment.
- Semantic order within the region is heading and mode strip, side selector and status, plates, then
  legend. The region itself follows feature 002's complete ledger in the workspace's own source
  order (design/hull-anatomy.md, "Narrow, mobile and zoomed").
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
