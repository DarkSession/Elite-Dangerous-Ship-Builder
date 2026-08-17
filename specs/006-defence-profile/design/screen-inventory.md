# Screen and Surface Inventory

Feature 006 adds no top-level route. Its Defence Profile capability composes inside feature 001's
`/build` workspace, opens from feature 003's defence headline/capability selector and targets feature
002's exact-slot selection. Capability selection and SYS pips remain in-memory viewing state.

| Surface                                        | Wide/tablet presentation                                      | Narrow/zoomed presentation                                  | Requirements           |
| ---------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------- |
| [Defence Profile detail](./defence-profile.md) | Complete shield and armour regions may form two fluid columns | One complete semantic stack; no field removed               | FR-001–FR-009          |
| Shared SYS-pip condition                       | Feature 003 allocator beside current condition                | Full-width shared allocator before results                  | FR-002, FR-004         |
| Shield strength/profile                        | Contributions plus four-row resistance/EHP relationship       | Complete labelled contribution and damage cards             | FR-002, FR-003, FR-005 |
| Shield recovery                                | Four separate rate/duration facts                             | Same four facts with field-specific sentinel text           | FR-004, FR-005         |
| Cell banks                                     | Package totals plus complete bank table/list                  | Complete labelled bank cards                                | FR-006, FR-009         |
| Armour/profile                                 | Contributions plus four-row resistance/EHP relationship       | Complete labelled contribution and damage cards             | FR-007                 |
| Hardness/module protection                     | Distinct definition groups beside armour                      | Stacked distinct facts and hardness explanation             | FR-007, FR-008         |
| Defence source manifests                       | Complete role-grouped exact-slot collections                  | Complete role-grouped action cards                          | FR-003, FR-008, FR-009 |
| Outfitting slot target (feature 002)           | Inline ledger/editor reveals exact slot                       | Existing selected-slot layer opens with named return action | FR-009                 |

## Requirement ownership

| Requirement | Surface behavior                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One revision-stamped projection copies four defence methods, auxiliary power context and package source records; visuals add no game result. |
| FR-002      | Shield region exposes every returned strength, contribution, multiplier, SYS resistance, resistance and EHP field for selected pips.         |
| FR-003      | Availability and generator state remain separate; missing, disabled, shed and indeterminate appear only when established.                    |
| FR-004      | Recovery region keeps normal/broken rates and recovery/regeneration durations separate under the same selected pips.                         |
| FR-005      | Damage EHP, recovery threshold and full regeneration each own distinct non-finite semantics.                                                 |
| FR-006      | Cell-bank region shows exact package totals and every bank field; empty and all-unpowered states differ.                                     |
| FR-007      | Armour region exposes every aggregate, damage row, module armour and module protection field.                                                |
| FR-008      | Hardness comes from the exact hull record; actual fitted bulkhead is a source action and no unknown-hull fallback appears.                   |
| FR-009      | Every shown source/bank emits its exact slot while aggregate contributions remain unapportioned.                                             |

## Cross-feature composition

- Feature 001 owns the active build, revision and `/build` workspace.
- Feature 002 owns outfitting edits and exact-slot selection. Feature 006 emits only a slot intent.
- Feature 003 owns valid SYS/ENG/WEP viewing conditions, condition revisions and the defence headline.
- Feature 005 owns power-budget presentation; feature 006 consumes only enough package power context
  to state generator/bank status without reproducing a budget UI.
- Feature 007 owns weapon performance; feature 006 explains hull hardness but calculates no weapon
  matchup.
- Feature 010 may visualize defence facts on hull anatomy; its diagram cannot replace the complete
  textual capability.
- Feature 011 owns layout primitives, tokens, controls, localization/formatting, announcements,
  responsive behavior and the automated accessibility harness.

## Shared states

The surface and component previews cover:

- no active build;
- projection pending for a new revision, without stale mixed values;
- complete powered shields and armour;
- missing shield generator while armour remains complete;
- disabled, shed and indeterminate generator states;
- ready finite recovery and each non-finishing recovery phase;
- no banks, fitted powered banks, mixed powered/unpowered banks and all-unpowered zero totals;
- unknown bank draw qualification;
- negative, zero and unbounded damage outcomes;
- non-stock bulkhead, hull reinforcement and module reinforcement;
- unresolved hull/package-authorized unavailable defence;
- unexpected projection failure with no stale figures.

Previews include default, populated, empty, loading, error and disabled states where meaningful at
desktop, tablet and mobile widths, plus portrait/landscape, expanded text and RTL fixtures.

## Accessibility, responsive and localization baseline

- The capability participates in the workspace's one `main` and heading hierarchy; it adds no
  competing page landmark or `h1`.
- Visual columns never change semantic order. At 200% text, 400% zoom and narrow/landscape widths all
  sections stack without document horizontal scrolling.
- Semantic tables may own internal overflow only where complete labelled cards cannot express the
  relationships more clearly.
- Every action works by pointer/touch, has visible and matching contextual names and uses at least the
  shared 44 CSS-pixel target token.
- Power, negative, unbounded, unavailable and qualification states are text and programmatic meaning,
  never color, shape or bar length alone.
- Resistance bars are optional and supplemental; they never clamp negative/unbounded values or imply
  a new scale.
- Reduced motion removes nonessential transitions. Text expansion and RTL do not reverse damage-type
  semantics or separate labels from values.
- Application labels/sentinel phrases use feature 011 message keys. MJ, MJ/s, percentages,
  multipliers, counts and durations use active-locale formatters.
- Hull/module game text comes from Almanac and receives the shared canonical-language disclosure
  when a requested locale is unavailable.
- Automated coverage scans every meaningful state in Chromium and Firefox over desktop,
  tablet/mobile portrait and landscape. Manual screen-reader journeys verify relationships and
  announcements.

Where conformance is stated, use: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”
