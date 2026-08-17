# Screen and Surface Inventory

Feature 005 adds no top-level route. Its logical detail surface composes inside
feature 001's `/build` workspace, is reached from feature 003's power headline,
and targets feature 002's exact-slot selection in one interaction. Capability
selection and viewing conditions are in-memory presentation state, not browser
navigation or build state.

| Surface                                             | Wide/tablet presentation                                                              | Narrow/zoomed presentation                                                                | Requirements          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------- |
| [Power and Heat detail](./power-and-heat-detail.md) | Shared conditions followed by fluid power/module columns and heat/distributor regions | Complete stacked conditions, power summary, bands, modules, heat scenarios and capacitors | FR-001–FR-011         |
| Power budget and priority bands                     | Summary definition group plus semantic five-band table/list                           | Labelled band cards; no field removed                                                     | FR-002–FR-004, FR-011 |
| Per-module power                                    | Complete exact-slot manifest; unavailable group before optionally ranked known rows   | Complete labelled cards, never the reference's abbreviated “Top draw”                     | FR-004–FR-006         |
| Distributor performance                             | Three capacitor definition groups beside shared pip allocator where space permits     | Allocator then SYS/ENG/WEP groups, all fields retained                                    | FR-007, FR-008        |
| Heat profile                                        | Plant/hull facts plus five scenario rows/cards                                        | Same five complete scenario cards in semantic order                                       | FR-009–FR-011         |
| Outfitting slot target (feature 002)                | Selected exact slot is revealed in the inline ledger/editor context                   | Existing full-screen selected-slot layer is revealed                                      | FR-006                |

## Requirement ownership

| Requirement | Surface behavior                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| FR-001      | The owning detail receives one revision-stamped immutable projection of the three `ShipLoadout` methods; visuals add no game result. |
| FR-002      | Power summary and bands use the exact selected package fields; deployed summary fields are absent in retracted mode.                 |
| FR-003      | The shared hardpoint selector shows one state, defaults to deployed and labels the current condition.                                |
| FR-004      | Power qualification notice, named unknown list and disabled module entries remain visible.                                           |
| FR-005      | The complete package-authored per-module collection uses post-engineering draw; unknown entries remain outside numeric ordering.     |
| FR-006      | Every module card/row includes exact slot, enabled, priority and deployed-only state and a distinguished exact-slot action.          |
| FR-007      | Shared pips feed `distributorMetrics()`; SYS/ENG/WEP groups show exact capacity, rated/actual recharge and returned allocation.      |
| FR-008      | The distributor surface owns a whole-result unavailable state and never displays catalogue fallback values.                          |
| FR-009      | The heat surface shows five fixed package scenarios and every returned field.                                                        |
| FR-010      | The heat surface owns whole-result unavailable and projection states and names every returned unknown contributor.                   |
| FR-011      | Field-specific semantic formatting distinguishes no-plant utilisation, non-settling heat and never-overheating time.                 |

## Cross-feature composition

- Feature 001 owns the active build, its revision and the `/build` workspace.
- Feature 002 owns module enabled/priority edits and exact-slot selection. Feature
  005 emits a slot intent; it does not mutate a module.
- Feature 003 owns deployed/retracted and pip viewing conditions, their defaults
  and atomic condition revision. It also owns the power headline/detail action.
- Feature 011 owns layout primitives, tokens, controls, localization/formatting,
  live announcements, responsive behavior and the accessibility harness.
- Feature 010 may later visualize package power facts on hull anatomy. Its
  diagram cannot replace the complete textual feature 005 surfaces.

Feature 003 currently has no completed plan/design contract and the relevant
features are not implemented in the current shell. Tasks must preserve these
boundaries rather than inventing parallel controls while prerequisites are
being built.

## Shared states

The screen and its components require previews and tests for:

- no active build;
- projection pending for a new revision, without stale mixed values;
- within budget and over-budget/shedding builds;
- deployed and retracted selection, including omitted retracted summaries;
- known complete power and unknown/lower-bound power;
- enabled, disabled, deployed-only and unavailable module contributions;
- missing/disabled plant: zero capacity, reportable draw, heat unavailable;
- distributor ready, unavailable and genuine zero-pip recharge;
- heat ready, unavailable and projected;
- finite, does-not-settle and never-overheats field semantics;
- no weapons with all five returned heat scenarios;
- unexpected package/presenter failure with no stale prior figures.

Component previews cover default/populated, empty, loading, error and disabled
states where meaningful at desktop, tablet and mobile widths, plus expanded and
right-to-left text fixtures.

## Accessibility, responsive and localization baseline

- The surface participates in the workspace's one `main` and heading hierarchy;
  it does not add a competing page landmark or `h1`.
- Wide visual columns never alter semantic reading order. At 200% text, 400%
  zoom and narrow widths they stack without document horizontal scrolling.
- Semantic tables may own internal overflow only where labelled cards cannot
  preserve the relationships more clearly.
- Every control works with pointer and touch, exposes visible/matching names and
  state, and uses at least the shared 44 CSS-pixel target token.
- Values include meaning and unit. Powered, disabled, deployed-only, overheat,
  lower-bound, projection and unavailable states are text, not color/shape/fill
  alone.
- Charts and gauges have complete nearby textual equivalents and are omitted
  when they do not materially aid comparison.
- Condition and qualification changes use one coalesced polite announcement;
  blocking projection errors use the shared alert behavior.
- Reduced motion removes nonessential transitions. Text expansion and RTL do
  not reverse data semantics or separate labels from values.
- Application text and semantic sentinel phrases use feature 011 message keys;
  MW, MJ, MJ/s, percentages and durations use active-locale formatters.
- Game module text comes from the Almanac and receives the shared untranslated
  disclosure when a requested locale is unavailable.
- Automated coverage scans every meaningful state in Chromium and Firefox over
  desktop, tablet/mobile portrait and landscape. Manual screen-reader journeys
  verify relationships and announcements.

Where conformance is stated, use: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2,
2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.”
