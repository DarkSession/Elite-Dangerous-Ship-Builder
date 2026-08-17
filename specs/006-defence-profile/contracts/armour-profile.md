# Armour and Hardness Contract

## Boundary

For one active build revision call `ShipLoadout.armourMetrics()` exactly once and resolve the hull
through the package ship catalogue using `build.shipSymbol`. Read the actual fitted bulkhead through
the build's package slot snapshot. No standalone armour/resistance function and no private hull or
bulkhead catalogue is used.

Implementation is gated on Almanac #297. Beta.12's all-zero result for an unresolved hull is not
filtered, corrected or relabelled in the application; the released package must authorize an
unavailable/diagnostic state.

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

- A package-authorized unresolved-hull result maps to `unavailable` and exposes no armour/hardness
  placeholders.
- `getShipBySymbol(build.shipSymbol) === null` never falls back to a similarly named or default hull.
- The source manifest shows a bulkhead only when an actual fitted package snapshot exists. The
  package's calculation fallback behavior does not authorize presenting a fabricated fitted module.
- Missing/unresolved source identity may coexist with only the metric state the released package
  authorizes.

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
- #297's unknown-hull reproduction becomes package-authorized unavailable and never a local zero
  suppression.
- Negative, zero and infinite results retain distinct semantics.
