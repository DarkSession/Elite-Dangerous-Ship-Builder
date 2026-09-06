# Withdrawn and reassigned requirements

Ruled 2026-08-22. These ids are not declared by any capability specification, so
they carry no `Source:` trace and the policy checker requires no coverage-ledger
evidence for them. The table is here so that a reader who meets one of these ids
in an archived design or contract document, or wonders why a number is absent, can see what happened to
it rather than re-add it.

| Id       | Was                                                     | Outcome                                                                                          |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `FR-006` | Every value shows meaning, unit and conditions          | **Reassigned** to 005–008 with the values it governs                                             |
| `FR-008` | Zero, unavailable, incomplete, lower-bound and infinite | **Reassigned** to 005–008 with the results it governs                                            |
| `FR-009` | Hardpoint-sensitive results; deployed/retracted switch  | **Reassigned to 005** — ruling C: the canvas draws that toggle in the Power capability           |
| `FR-010` | The seven headline slots                                | **Reassigned** to 005–008, which own the cells the canvas draws                                  |
| `FR-011` | Retail credits, Merc Coin and materials                 | **Reassigned to 009**, and already built                                                         |
| `FR-012` | Slot and detail targets reachable in one interaction    | **Withdrawn** — ruling A: nothing in either block is interactive on either canvas                |
| `FR-016` | Load state defaults and choices                         | **Reassigned to 005/008** — ruling C: no load control is drawn anywhere                          |
| `FR-017` | Half-pip allocation, total six, four per capacitor      | **Reassigned to 005** — ruling C: the canvas draws whole pip bars in the Power capability        |
| `FR-018` | Hardpoint default deployed                              | **Reassigned to 005** — ruling C                                                                 |
| `FR-019` | Viewing conditions never persisted                      | **Reassigned to 005** with the state it constrains                                               |
| `FR-020` | One build/condition revision, never mixed               | **Withdrawn** — nothing is composed across owners, and `validation` is a field on the live build |
| `FR-021` | Settled count changes announced once                    | **Withdrawn** — ruling A: there are no counts, and visible content is not live                   |
