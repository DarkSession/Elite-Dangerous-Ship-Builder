# Screen and Surface Inventory

Feature 006 adds no top-level route. Its one complete Defence Profile composes inside feature 001's
`/build` workspace. Feature 003 selects it and supplies SYS pips; feature 002 reveals exact slots.

## Layout inventory

| Surface/state              | Desktop 1440×900                                      | Tablet portrait/landscape                             | Mobile portrait/landscape and 400% zoom          | Requirements           |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ | ---------------------- |
| Defence capability         | Complete shield/armour peers when both remain legible | Fluid two-column or complete stack by available space | One complete semantic stack                      | FR-001–FR-009          |
| Shared SYS condition       | Existing feature 003 condition surface before results | Same complete condition surface                       | Full-width before results                        | FR-002, FR-004         |
| Shield profile             | Total, contributions, multipliers and damage table    | Same facts; table or complete cards                   | Same facts as labelled cards                     | FR-002, FR-003, FR-005 |
| Shield recovery            | Four labelled facts adjacent to shield                | Four labelled facts                                   | Four labelled facts; no footer abbreviation      | FR-004, FR-005         |
| Fitted shield-role records | Role-grouped exact-slot actions                       | Same complete collection                              | Same complete action cards                       | FR-003, FR-009         |
| Cell banks                 | Totals and complete responsive bank collection        | Same complete collection                              | Same bank fields as stacked cards                | FR-006, FR-009         |
| Armour profile             | Total, contributions and damage table                 | Same facts; table or complete cards                   | Same facts as labelled cards                     | FR-007                 |
| Hardness/module protection | Three distinct labelled facts and hardness help       | Same distinct facts                                   | Same distinct facts and explanation              | FR-007, FR-008         |
| Fitted armour-role records | Role-grouped exact-slot actions                       | Same complete collection                              | Same complete action cards                       | FR-008, FR-009         |
| Existing outfitting slot   | Inline ledger/editor selects exact slot               | Existing responsive selection behavior                | Existing selected-slot layer with return context | FR-009                 |
| Status headline/target     | Feature 003 rail/capability summary                   | Feature 003 Status capability                         | Feature 003 Status capability                    | FR-001–FR-003, FR-007  |

Wide visual columns never change the semantic order defined in
[defence-profile.md](./defence-profile.md). Only an inner semantic table may receive local horizontal
overflow; the document never does.

## Requirement mapping

| Requirement | Surface behavior                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One revision-coherent projector copies package results; every surface consumes the same immutable projection.                    |
| FR-002      | Shield region presents every `ShieldMetrics` field under the selected shared SYS pips.                                           |
| FR-003      | Shield/recovery unavailable states preserve ordered issues and exact package reason/target while armour remains present.         |
| FR-004      | Recovery region keeps raised/broken rates and collapse-to-raise/raise-to-full durations separate.                                |
| FR-005      | Field-specific presentation distinguishes unbounded EHP and the two non-finishing recovery phases.                               |
| FR-006      | Bank region distinguishes no banks from fitted zero totals and shows every returned bank field and powered state.                |
| FR-007      | Armour region presents every `ArmourMetrics` field with correct hull/module units and separation.                                |
| FR-008      | Hardness comes from the exact hull record; the actual fitted bulkhead is a distinct navigation record.                           |
| FR-009      | Every bank, issue and resolved fitted-role action delivers its original package slot; aggregate values remain outside role rows. |

## State ownership

| State                             | Owning presentation                                          |
| --------------------------------- | ------------------------------------------------------------ |
| no active build                   | feature 001/003 workspace no-build state; no defence call    |
| current revision pending/failure  | feature 003 provider envelope                                |
| complete or unavailable shield    | Shield Profile                                               |
| complete or unavailable recovery  | Shield Recovery                                              |
| no/fitted/all-unpowered banks     | Cell Banks                                                   |
| unknown power draws               | Bank qualification notice and Status owner qualification     |
| armour/hardness/module protection | Armour Profile; ready inside every successful projection     |
| source/issue/bank slot activation | feature 002 exact-slot selection                             |
| unknown hull ingress              | feature 001/004 construction boundary; no Defence projection |

## Conformance statement

Where conformance is stated, use the complete wording: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2,
2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.”
