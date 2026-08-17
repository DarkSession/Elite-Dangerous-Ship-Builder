# Screen Inventory: Ship Statistics and Status

Feature 003 adds no route. Every surface composes the existing `/build` workspace and requires its
active build. The URL fragment remains the canonical `b.…` build payload, never screen selection.

| Screen/surface           | Wide desktop                                                                                       | Tablet                                          | Mobile/400% zoom                                 | Requirements                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| No active build          | Existing workspace empty state; no status projection                                               | Same content reflows                            | Same existing creation/open actions              | FR-001                                                        |
| Status overview          | Compact persistent rail mirrors essentials; expandable central Status outlet contains full content | Full-width outlet with fluid two-column regions | Status capability opens one stacked surface      | FR-001–FR-010, FR-012–FR-015, FR-020–FR-022                   |
| Viewing conditions       | Compact labeled bar before full results                                                            | Wrapping bar before results                     | Stacked controls at the start of Status          | FR-006, FR-009, FR-016–FR-020                                 |
| Structural summary       | Independent validity/completeness facts                                                            | Same semantic definition list                   | Same facts, never compressed to an icon          | FR-003, FR-015, FR-020, FR-022                                |
| Issues                   | Ordered semantic list after structural facts                                                       | Full-width list                                 | Stacked cards/list items with optional action    | FR-004, FR-005, FR-007, FR-008, FR-012, FR-015, FR-020–FR-022 |
| Normalisation provenance | Separate named list after package issues                                                           | Same separation                                 | Same, with exact-slot actions                    | FR-013, FR-014, FR-020–FR-022                                 |
| Headline set             | Power summary plus six metric cards in a responsive grid; compact rail may mirror settled values   | Two-column fluid grid                           | One column, optionally two where full labels fit | FR-002, FR-006–FR-010, FR-012, FR-020                         |
| Assembly requirements    | Credits, Merc Coin when applicable, and materials after headlines                                  | Full-width section                              | Stacked summaries with full qualifications       | FR-002, FR-006–FR-008, FR-011, FR-012, FR-020                 |
| Updating/failure states  | Current-context updating state replaces stale figures; application failure is explicit             | Same                                            | Same without overlaying navigation               | FR-007, FR-008, FR-020, FR-021                                |

## Requirement traceability

| Requirement | Planned behavior                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------- |
| FR-001      | No-build workspace does not create or select a hull.                                            |
| FR-002      | All visible facts flow through validation or area ports; no component calculations.             |
| FR-003      | Structural definition list shows `valid` and `complete` independently with bounded wording.     |
| FR-004      | Issue list preserves every package item, order and structured field.                            |
| FR-005      | Package diagnostic text remains canonical; owned framing is localized.                          |
| FR-006      | Every card/summary includes localized meaning, unit and selected conditions.                    |
| FR-007      | Diagnostic, null, throw and directly observable prerequisite states have distinct presentation. |
| FR-008      | Exact zero, incomplete, lower-bound, unavailable and semantic infinity cannot collapse.         |
| FR-009      | Hardpoint control changes only selected-state presentation; no simultaneous alternate value.    |
| FR-010      | Power, shield, armour, DPS, jump, speed and mass come from the owning area results.             |
| FR-011      | Assembly section consumes feature 009 and conditionally omits Merc Coin.                        |
| FR-012      | Actions use exact slot/detail targets; untargeted items remain noninteractive.                  |
| FR-013      | Provenance has its own heading/list and is not styled as package validation.                    |
| FR-014      | Provenance display follows current local record metadata and per-mount clearing.                |
| FR-015      | Explicit no-issues/no-qualifications text makes no readiness claim.                             |
| FR-016      | Conditions surface defaults to package unladen semantics and offers all three load states.      |
| FR-017      | Pip draft exposes half steps, per-bank maximum, total and Apply validation.                     |
| FR-018      | Deployed is the initial selected hardpoint control.                                             |
| FR-019      | Reload/replacement journeys reset controls and serializers exclude them.                        |
| FR-020      | Host is stamped with one build/condition revision pair; content publishes atomically.           |
| FR-021      | One off-screen polite announcer reports settled issue/qualification count changes.              |
| FR-022      | Each issue exposes visible textual kind and severity independent of ornament.                   |

Detailed power/heat, defence, offence, mobility/jump, cost/material and anatomy screens remain defined
by features 005–010. Feature 003 links to them but does not reproduce their full content.
