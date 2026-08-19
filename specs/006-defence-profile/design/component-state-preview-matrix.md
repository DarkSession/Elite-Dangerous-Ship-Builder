# Component State Preview Matrix

Feature 011's tooling-only preview target renders the production components below. Every applicable
state is declared; “not applicable” requires a typed rationale rather than omission.

| Component                 | Populated/default                                           | Empty/unavailable                                     | Loading/error/disabled                                  | Stress variants                                                        |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `DefenceProfile`          | complete shield, banks, armour, role records                | no active build owned by workspace                    | current revision pending; projection failure            | one/two columns, long build name, RTL, doubled copy                    |
| `ShieldProfile`           | all fields and four finite damage rows                      | ordered missing/disabled/shed/unresolved issue states | parent pending/failure; slot action unavailable if none | zero/negative resistance, unbounded EHP, 0/2/4 SYS pips                |
| `ShieldRecovery`          | two rates and two finite durations                          | ordered unavailable issues                            | parent pending/failure                                  | threshold infinite; full-regeneration infinite; both finite zero cases |
| `CellBankList`            | powered; mixed; multiple duplicate symbols                  | none fitted; fitted/all-unpowered zero totals         | parent pending/failure                                  | long names/slots, large list                                           |
| `ArmourProfile`           | every field, non-stock bulkhead and all role types          | zero module armour/protection; no actual bulkhead row | parent pending/failure                                  | negative resistance, unbounded EHP, long hardness explanation          |
| `DefenceSourceList`       | every role, duplicate symbols, enabled/disabled/unspecified | no resolved role records                              | parent pending/failure; action absent without slot      | adjacent package issue, long localized names, exact-slot context       |
| `CalculationIssueList`    | multiple ordered reasons, targeted and untargeted           | not applicable when calculation complete              | parent pending/failure                                  | canonical-language disclosure, long params                             |
| `DamageDefenceCollection` | four signed resistance/EHP pairs                            | not applicable inside complete metric                 | parent pending/failure                                  | table/cards, negative/zero/infinite, bars absent/present truthfully    |
| `DefenceStatusSummary`    | ready shield/armour and detail target                       | shield unavailable with its identity                  | provider pending/failure                                | ready without identity; unavailable with identity                      |

## Viewport and cross-cutting matrix

Every row runs at desktop, tablet and mobile widths, with portrait and landscape where applicable.
Relevant rows also run with:

- 200% text and actual 400% browser zoom protocol;
- doubled application copy and long unbroken package identities;
- RTL document direction;
- reduced motion;
- pointer and touch;
- Chromium and Firefox;
- automated axe, semantic/name/state, 44px target baseline and document-overflow assertions.

Preview-only fixtures may construct finite/negative/infinite presentation values. They are clearly
presentation fixtures and are never used as game expectations or package calculation substitutes.
