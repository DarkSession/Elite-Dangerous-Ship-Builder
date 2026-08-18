# Armour and Hardness Contract

## Boundary

For one active build revision call `ShipLoadout.armourMetrics()` exactly once and resolve the hull
through the package ship catalogue using `build.shipSymbol`. Read the actual fitted bulkhead through
the build's package slot snapshot. No standalone armour/resistance function and no private hull or
bulkhead catalogue is used.

Almanac 0.1.1 closes #297 by rejecting an unknown hull during construction. An active known-hull
loadout uses non-nullable `armourMetrics()` without local filtering, correction or relabelling.

## Ready mapping

Copy every returned armour field:

| View field                      | `ArmourMetrics` source                                 |
| ------------------------------- | ------------------------------------------------------ |
| total hull hit points           | `hitPoints`                                            |
| bulkhead contribution           | `bulkheads`                                            |
| hull reinforcement contribution | `reinforcement`                                        |
| four resistances                | `resistances.kinetic/thermal/explosive/caustic`        |
| four effective pools            | `effectiveHitPoints.kinetic/thermal/explosive/caustic` |
| module armour                   | `moduleArmour`                                         |
| module protection               | `moduleProtection`                                     |

Copy `Ship.hardness` as hull hardness. Explain that weapon armour piercing is compared with this
rating. Do not calculate a matchup, damage reduction, averaged piercing value or combined defence
score.

## Separation rules

- `hitPoints` is hull armour only.
- `moduleArmour` is the package's module reinforcement pool and is not added to hull hit points.
- `moduleProtection` is a fraction and is not formatted as hit points.
- `hardness` is a rating and is not formatted as resistance or a percentage.
- Bulkhead and reinforcement numbers remain aggregates; source rows carry no apportioned values.

## Availability and fitted source

- Unknown hulls are rejected before active-build replacement and never reach this boundary.
- An invariant failure resolving a known active hull is unavailable and never falls back to a
  similarly named or default hull.
- The source manifest shows a bulkhead only when an actual fitted package snapshot exists. The
  package's calculation fallback behavior does not authorize presenting a fabricated fitted module.
- Missing/unresolved source identity may coexist with the non-null aggregate metric state the
  released package authorizes for a known active hull.

## Semantic values

Negative resistance remains a signed weakness. Infinite effective hit points maps to the same
field-specific `unbounded` semantic used by shields. Zero hull/module values remain ready numeric
zero. No clamp, absolute-value conversion or catalogue substitution is permitted.

## Accessibility and localization

- Hull contributions and module protection use distinct labelled definition groups.
- The resistance/effective-hit-point relationship is a semantic table or complete labelled cards.
- Hardness receives adjacent explanatory text; no visual gauge is required.
- Negative, unbounded, zero and unavailable states are explicit text, not color-only.
- Hull points, MJ-like package effective pools, percentages and ratings use the correct feature 011
  locale formatter/label; application text uses message keys.
- Package hull/module names use Almanac localization or the shared canonical-language disclosure.

## Required verification

- Exact equality for every `ArmourMetrics` field and all four damage rows.
- Exact equality with the resolved package hull hardness.
- Module armour/protection never enter hull hit points or each other's format.
- A non-stock fitted bulkhead is the exact source target.
- Missing shields leave the complete armour view available.
- #297's unknown-hull reproduction is rejected at construction and never reaches this projector.
- Negative, zero and infinite results retain distinct semantics.
