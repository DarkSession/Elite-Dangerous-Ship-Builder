# Screen and Surface Inventory

Feature 008 adds no route. Drives & Mass is one capability surface inside feature 001's `/build`
workspace and the detail target for feature 003's mobility summaries. It may emit the existing shared
exact-slot target; it owns no build mutation, condition control or persisted view state.

| Surface                                         | Wide/tablet landscape                                                                     | Narrow/tablet portrait/zoomed                                      | Requirements           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------- |
| [Drives & Mass](./mobility-and-jump-profile.md) | Fluid jump/mobility cards followed by mass/capacity and module mass                       | Same complete semantic stack without omissions                     | FR-001–FR-008          |
| Selected condition context                      | Read-only selected load and ENG pips near affected values                                 | Full-width read-only context before results                        | FR-004                 |
| Jump performance                                | Exact FSD identity, guard issues, three single/total/count profiles and sparse parameters | Three complete labelled profile groups and wrapping parameter list | FR-002, FR-003, FR-008 |
| Mobility performance                            | Exact thruster identity, package issues, seven fields and sparse parameters               | Same seven fields/issues/parameters in one stack                   | FR-004, FR-005, FR-008 |
| Mass and capacity                               | Three independent aggregate result groups with owning diagnostics                         | Complete stacked result/issue groups                               | FR-003, FR-006         |
| Per-module mass                                 | Accessible exact-slot list/table                                                          | Exact-slot cards or wrapping list; no field removed                | FR-007                 |
| Status summaries (feature 003)                  | Selected jump, top speed and unladen mass from the 008 provider                           | Same three owner-authored semantic values                          | FR-001–FR-006          |
| Slot reveal (features 002/003, if exposed)      | Shared exact-slot target opens owning editor context                                      | Same target opens existing narrow slot layer                       | FR-007 support         |

## Requirement mapping

| Requirement | Planned behavior                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One pure projector copies package results/records only; presentation adds no game calculation.                                    |
| FR-002      | One guarded `jumpRangeSummary()` supplies all three single ranges, total ranges and counts.                                       |
| FR-003      | All diagnostic aggregate and standard-load results must be complete before the summary call; exact blockers remain visible.       |
| FR-004      | The selected feature 003 load and ENG pips feed one `mobilityMetricsResult()` call; all seven fields or exact issues appear.      |
| FR-005      | Incomplete mobility receives no hull fallback; package issues distinguish missing, disabled, shed, unresolved and invalid inputs. |
| FR-006      | Exact unladen mass, main/reserve fuel and cargo results retain every ordered package issue.                                       |
| FR-007      | Every `fittedModules()` entry appears once by exact slot with `effectiveStats.mass` or unavailable; no subtotal exists.           |
| FR-008      | Only present package FSD/thruster parameters and result multipliers appear; absent facts stay absent.                             |

## Cross-feature ownership

- Feature 001 owns the active build/revision and `/build` workspace.
- Feature 002 owns fixed-mount normalization before calculations, committed-edit revision changes and
  exact-slot reveal/edit behavior.
- Feature 003 owns viewing-condition draft/Apply/Reset, read-only condition identity, generic status
  envelope and workspace targets. Feature 008 owns its concrete three-summary provider.
- Feature 005 is not a dependency; package mobility diagnostics already own thruster power meaning.
- Feature 010 keeps anatomy hardpoint-only and does not host Drives & Mass overlays.
- Feature 011 owns tokens, shared components, locale/game-text/diagnostic presentation, previews,
  announcements and the test/accessibility matrix.

## Required states

The surface and previews cover:

- no active build;
- complete jump/mobility/aggregate/module values;
- incomplete mass, fuel or cargo and each standard-load guard;
- missing and unresolved FSD, with active-booster validation where applicable;
- zero main fuel and zero cargo;
- missing, disabled, shed and unresolved thrusters plus power-capacity/draw issues;
- complete all-zero mobility above supported mass;
- each sparse FSD/thruster parameter present and absent;
- engineered, zero and unavailable module mass, including duplicate symbols and a package-trusted
  complete aggregate beside unavailable row mass; and
- unexpected current-revision failure with no stale numeric result.

Components receive populated, empty, error and disabled previews where those states are meaningful,
at desktop, tablet and mobile widths with portrait/landscape, expanded text, RTL and reduced motion.
There is no asynchronous loading state in the synchronous projector unless an owning shared
component itself defines one.

## Accessibility, responsive and localization baseline

- Use the workspace's single `main`/`h1`; Drives & Mass uses nested headings and named regions.
- Keep one DOM/assistive order at every width. Grid placement must not change reading order.
- Use labelled definition groups, lists or accessible tables. At narrow/400% zoom use wrapping cards
  rather than hiding columns; internal table overflow is acceptable only when associations survive.
- Any tab/action uses actual semantic controls with visible name/state and feature 011's minimum
  touch target. Nothing essential depends on hover or `title`.
- Load, zero, unavailable, incomplete, disabled, shed, unresolved and failure meanings are explicit
  text/programmatic state—not colour, bar length, shape or position.
- Package issues are associated with their owning result; a settled revision produces one concise
  polite update rather than one announcement per field.
- All application labels, state text, units and announcements are localized and all numbers use the
  active locale. Module/slot names and diagnostics use Almanac locale helpers plus the shared
  canonical fallback disclosure.
- Test every meaningful state with axe across Chromium and Firefox at all five layout projects;
  retain manual screen-reader, 200% text and actual 400% zoom protocols.

Where conformance is stated, name the exclusion: WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4,
2.4.1, 2.4.3, 2.4.7 and 2.4.11.
