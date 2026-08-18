# Screen Inventory: Ship Statistics and Status

Feature 003 adds no route. Every surface belongs to the existing `/build` workspace and requires the
active build from feature 001.

## Responsive inventory

| Surface           | Desktop                                                 | Tablet landscape                                         | Tablet portrait                     | Mobile landscape                                                       | Mobile portrait / 400%                   |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| No active build   | Existing workspace empty state; no rail/projection      | Same reflow                                              | Same reflow                         | Same actions                                                           | Same actions                             |
| Status rail       | Persistent compact right rail; action opens full Status | Omitted when three columns would constrain content       | Omitted                             | Omitted                                                                | Omitted                                  |
| Status capability | Peer central workspace mode                             | Full outlet beside/after compact ledger as space permits | Full outlet below shared header/nav | Single document region; optional two-column cards only if content fits | One stacked document region              |
| Viewing controls  | Wrapping group before structural facts/results          | Wrapping group                                           | Stacked/wrapped                     | Stacked/wrapped                                                        | Stacked controls, full-width Apply/Reset |
| Structural/issues | Full-width semantic facts/list in Status mode           | Full-width list                                          | Full-width list                     | Full-width list                                                        | Full-width list                          |
| Headlines         | Fluid cards, usually 2–3 columns                        | At most two columns                                      | One or two if full text fits        | One or two if full text fits                                           | One column by default                    |
| Assembly          | Full-width sections after headlines                     | Full width                                               | Full width                          | Full width                                                             | Stacked full width                       |
| Slot target       | Reveals exact ledger/editor slot                        | Reveals exact slot                                       | Opens exact-slot layer              | Opens exact-slot layer                                                 | Opens exact-slot layer                   |

Portrait/landscape switch changes layout only. Content, actions, condition values and revision remain
the same. No arrangement creates document horizontal scrolling.

## Requirement mapping

| Requirement | Surface behavior                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| FR-001      | No-build state defers to the existing workspace and never creates/selects a hull.                         |
| FR-002      | Structural data and the five provider projections are the only game-bearing inputs.                       |
| FR-003      | Complete Status shows independent literal validity/completeness facts without readiness wording.          |
| FR-004      | Complete Status renders each package issue once, in order, with all structured data.                      |
| FR-005      | Issue code remains package text; diagnostic helper/fallback is used; owned framing is localized.          |
| FR-006      | Every headline/assembly value exposes locale-formatted value, unit, meaning and relevant condition.       |
| FR-007      | Provider-owned unavailable/diagnostic states and application failure remain distinct.                     |
| FR-008      | Provider states preserve exact zero, lower bound, incomplete, unavailable and infinity.                   |
| FR-009      | Hardpoint control selects only state-specific provider output; package DPS remains native firing output.  |
| FR-010      | The fixed seven headline slots consume their owning provider fields.                                      |
| FR-011      | Assembly consumes feature 009; credits/Merc Coin stay separate and Merc Coin can be absent.               |
| FR-012      | Package slot and provider detail targets activate in one interaction; missing issue target has no action. |
| FR-013      | Provenance has a separate heading/list and is never styled/counted as package validation.                 |
| FR-014      | Provenance reflects feature 001/002 local-record lifecycle and never crosses public serialization.        |
| FR-015      | Empty issue/qualification statements avoid readiness/quality claims.                                      |
| FR-016      | Load control defaults unladen and offers maximum jump/unladen/laden.                                      |
| FR-017      | Pip draft exposes 0–4 half steps, visible total and valid six-pip Apply.                                  |
| FR-018      | Hardpoint control defaults deployed.                                                                      |
| FR-019      | Replacement/reload reset and serialization tests prove viewing-state exclusion.                           |
| FR-020      | Rail and capability carry one build/condition revision; pending replaces stale-context display.           |
| FR-021      | One polite region announces settled issue/qualification count changes once.                               |
| FR-022      | Issue code and severity are visible text independent of ornament.                                         |

## Ownership boundaries

- Features 005–009 own detail capabilities and result semantics; Status links but does not reproduce
  their full analyses.
- Feature 002 owns exact-slot editing/navigation and provenance clearing.
- Feature 001 owns active build/local record and no-build state.
- Feature 011 owns workspace navigation primitives, tokens, formatting, fallback disclosure,
  announcements and test harness.
- Feature 010 anatomy is not part of Status composition.
