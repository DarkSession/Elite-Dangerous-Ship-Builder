# Armour, Hardness and Module Protection Contract

## Boundary

For one captured active-build revision call `loadout.armourMetrics()` and resolve the exact active
hull through `getShipBySymbol(loadout.shipSymbol)` from the ships leaf. Read actual fitted-role
records from the loadout's package slot snapshots. Do not call standalone armour/resistance formulas
or load a private hull/module catalogue.

`armourMetrics()` is non-nullable for a successfully constructed known hull. A thrown call or failed
exact hull lookup is a provider projection failure and an upstream/invariant defect; no fallback hull
or invented armour-unavailable state is permitted.

## Complete mapping

| Presentation fact       | Package source                                         | Unit/meaning                      |
| ----------------------- | ------------------------------------------------------ | --------------------------------- |
| total hull hit points   | `ArmourMetrics.hitPoints`                              | hull points                       |
| bulkhead aggregate      | `ArmourMetrics.bulkheads`                              | hull points                       |
| reinforcement aggregate | `ArmourMetrics.reinforcement`                          | hull points                       |
| damage resistances      | `resistances.kinetic/thermal/explosive/caustic`        | signed fraction                   |
| effective hull pools    | `effectiveHitPoints.kinetic/thermal/explosive/caustic` | hull points of raw damage         |
| module armour           | `moduleArmour`                                         | module-protection hit points      |
| module protection       | `moduleProtection`                                     | fraction                          |
| hull hardness           | `Ship.hardness`                                        | armour-piercing comparison rating |

Armour effective hit points are never labeled MJ. Hardness receives adjacent text explaining that
weapon armour piercing is compared with the rating. No weapon matchup, piercing factor, averaged
attack, damage percentage or combined defence score is calculated.

## Separation and fitted identity

- Hull hit points, module armour, module protection and hardness remain four distinct facts.
- Aggregate bulkhead/reinforcement/module values remain aggregate and are never divided among rows.
- `armourMetrics()` may use the hull's stock lightweight alloy when no armour contributes. That
  package calculation behavior does not create a fitted source.
- The actual armour slot is shown only when its `LoadoutSlot.module` exists.
- Other fitted-role records use a package-resolved `engineeringGroup` classification. A module with
  unavailable role/stat data yields no guessed record; unknown module identities never reach this
  boundary because ingress normalized them first.
- A role record states what is fitted and where, not whether or how much the facade counted.
- Direct `FittedModule.on` may be shown as enabled, disabled or unspecified; no local shedding verdict
  is attached.

Every role action emits the exact package slot key to feature 002. Duplicate symbols remain separate.

## Numeric semantics

- Negative resistance remains a signed weakness.
- Infinite effective hit points receive the field-specific unbounded hull-damage meaning.
- Zero hull/module values remain ready numeric zeros.
- No value is clamped, converted to an absolute value, relabeled with another unit or substituted.

## Localization and accessibility

- Hull contributions, damage rows, hardness, module armour and module protection use distinct
  labelled groups.
- Damage values use a semantic table when roomy and complete labelled cards when stacked.
- Hardness explanation and every negative/unbounded/zero state are visible text, not color-only.
- Application labels/units use feature 011; module/hull/slot game text uses Almanac leaf helpers with
  shared canonical-language disclosure.
- A missing shield does not alter heading order, availability or actions in the armour region.

## Verification

- Compare every `ArmourMetrics` field and every damage row directly with the real package result.
- Compare hardness directly with the exact package hull record.
- Assert armour EHP formats as hull points, not MJ.
- Assert module armour/protection never enter hull hit points or each other's format.
- Assert the actual non-stock fitted bulkhead targets its exact slot.
- Assert the stock calculation fallback never fabricates a fitted bulkhead row.
- Assert missing/disabled/shed shields leave the complete armour region available.
- Assert unknown hull ingress is rejected before projection; a lookup invariant failure has no local
  hull fallback.
