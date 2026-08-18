# Research: Offence Profile

Research used the installed `@elite-dangerous-almanac/core@0.1.1`, the accepted feature
specifications, feature 002/003/005 planning boundaries and `.design/Ship Builder.dc.html` canvases
1c and 1d. Runtime probes used detached package `ShipLoadout` values; no application formula was
used.

## Package projection boundary

**Decision**: Read the active build through one call to `ShipLoadout.weaponMetrics()` and one call to
`ShipLoadout.weaponsCapacitorMetrics({ weaponsPips })` for each settled build/condition revision.
Import the facade from `@elite-dangerous-almanac/core/ships/ship-loadout` and result types from the
`ships/weapons` and `ships/weapons-capacitor` leaves. Preserve the returned structures in one
immutable `OffenceSnapshot` before creating localized view models.

**Rationale**: The two build methods already resolve fitted articles, engineering, enabled state,
ammunition, deployed power shedding for capacitor inputs and pip scaling. One snapshot prevents a
module edit or pip change from combining results from different revisions.

**Alternatives considered**: Calling the data-free `weaponMetrics`, `sumWeaponMetrics` or
`weaponsCapacitorMetrics` functions with application-assembled inputs was rejected because it would
create a second build-calculation path. Importing the broad `ships` barrel was rejected by the
constitution's leaf-import rule. Components calling the package independently were rejected because
they could display mixed revisions.

## Complete weapon and total fields

**Decision**: Preserve all fields exactly. `BuildWeaponMetrics.total` carries:

- `damagePerSecond` and `sustainedDamagePerSecond`;
- `energyPerSecond` and `sustainedEnergyPerSecond`;
- `heatPerSecond` and `sustainedHeatPerSecond`;
- `thermalLoad` and `powerDraw`;
- `damageByType` and `sustainedDamageByType`.

Each `FittedWeaponMetrics` preserves `slot`, `symbol`, `name`, `enabled`, `ammunition` and every field
of its nested `metrics`: the total fields above plus `damagePerShot`, `rateOfFire`,
`sustainedRateOfFire`, `continuous`, sparse range/projectile-boundary fields and armour piercing.
Returned order is preserved as-is. A slot action emits the
exact returned `slot` without parsing or positional mapping.

**Rationale**: These are the complete 0.1.1 public result types and directly satisfy the
whole-build/per-weapon requirements. Exact slot and symbol identities are authoritative. 0.1.1
fulfills its documented slot-order promise for known slots and preserves source order for appended
unknown/unmapped slots.

**Alternatives considered**: A DPS-only summary was rejected because it drops returned output and
operating-cost fields. Re-summing per-weapon values was rejected because disabled-state behavior and
future package semantics belong to the package. Any local canonical or DPS sort is rejected because
the released #301 package order is authoritative.

## Empty, disabled and genuine zero

**Decision**: Carry the weapon list and package total independently, together with feature 002's
same-revision hardpoint occupancy/unresolved projection. An empty `weapons` array is called
no-fitted-weapons only when every package hardpoint is confirmed empty. An occupied unresolved
hardpoint omitted by `weaponMetrics()` receives a separate qualification and no invented weapon
result. A non-empty list with a zero total is a fitted-zero state; disabled entries remain visible
with their exact `enabled` value. The projector does not infer why a numeric weapon metric is zero.

**Rationale**: 0.1.1 deliberately includes disabled resolved weapons in `weapons` but filters them
from `total`. It also omits an occupied hardpoint whose catalogue/effective stats cannot be resolved.
Therefore an empty result, an unresolved occupied mount and an all-disabled build can all carry zero
totals but remain distinguishable using package-backed state. Some package records can also have
genuine zero damage, so zero cannot mean disabled or unavailable.

**Alternatives considered**: Hiding disabled entries, treating an empty returned list or every zero
total as truly empty, inserting unresolved modules into the result, or deriving an enabled subtotal
locally were rejected. Each loses or fabricates a package-authored distinction.

## Returned weapon ordering

**Decision**: Preserve 0.1.1's returned order: known weapons in hull-slot order, then unknown or
unmapped slots in original source order. This is the contract released for
[Elite-Dangerous-Almanac #301](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/301).

**Rationale**: Reversed Sidewinder input still returns `SmallHardpoint1` before
`SmallHardpoint2`; unknown original slots keep source order at the end. A local sort would duplicate
the released contract and risk inventing placement.

**Alternatives considered**: Sorting by package slot layout, parsing slot names, or ignoring the
contract mismatch were rejected. The first two are local repairs; the last violates the project's
requirement to raise library defects upstream.

## Damage-type semantics

**Decision**: Render both burst and sustained `DamageSplit` values field-for-field. Kinetic, thermal,
explosive, absolute and anti-xeno are always numeric package results. `unclassified` remains optional
and is described as not returned when absent; it is never defaulted to zero. Anti-xeno receives
explicit overlay wording adjacent to each applicable damage group. No percentage, share, resistance
adjustment or conventional-plus-anti-xeno total is created.

**Rationale**: The package defines kinetic/thermal/explosive/absolute/unclassified as the
conventional partition and anti-xeno as an overlay relative to conventional damage. The spec
explicitly prohibits folding the overlay into another type or calculating shares.

**Alternatives considered**: The reference's stacked percentage bars, a combined total and target
resistance simulation were rejected because each derives a value the package result does not return.
Color-only damage categories were rejected because they are inaccessible and unnecessary.

## Fitted-weapon range and piercing — released in 0.1.1

**Decision**: Consume the 0.1.1 fitted-weapon result, which includes the
authoritative post-engineering `maximumRange`, `falloffRange`, `projectileRange` and
`armourPiercing` values, preserving every absent member as absent. Effective distances retain metre
units; projectile boundary parameters remain separately named and unitless. The gap is filed as
[Elite-Dangerous-Almanac #300](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/300).

**Rationale**: Earlier releases returned only `{ slot, symbol, name, enabled, metrics, ammunition }`; 0.1.1 also returns sparse `maximumRange`, `falloffRange`, `projectileRange` and `armourPiercing` for each
fitted weapon. A second `fittedModuleAt(slot).effectiveStats` view can carry range and piercing, but
FR-002 requires per-weapon values from `weaponMetrics()`. Joining two separately obtained projections
in the application would weaken the one-call revision boundary and violate the accepted spec.

Minimal reproduction against 0.1.1:

```ts
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

const build = ShipLoadout.default('SideWinder').applyBlueprint(
  'SmallHardpoint1',
  'Weapon_Focused',
  { grade: 5, quality: 1 },
);

const fitted = build.fittedModuleAt('SmallHardpoint1')!;
const weapon = build.weaponMetrics().weapons[0]!;

console.log({
  maximumRange: fitted.effectiveStats?.maximumRange,
  falloffRange: fitted.effectiveStats?.falloffRange,
  armourPiercing: fitted.effectiveStats?.armourPiercing,
});
// { maximumRange: 6000, falloffRange: 1000, armourPiercing: 44 }

console.log(Object.keys(weapon));
// [ 'slot', 'symbol', 'name', 'enabled', 'metrics', 'ammunition',
//   'maximumRange', 'falloffRange', 'armourPiercing' ]
```

The release contract must also retain cases where effective range or piercing is absent. Projectile
boundary metadata is not an effective distance and must not be presented in metres.

**Alternatives considered**: Joining `fittedModuleAt`, reading a hardpoint catalogue record, applying
engineering modifiers, using `damageFalloff`, or calculating `armourPiercingFactor` were rejected.
Only the first is package data, but it still contradicts the specified facade boundary; the others
add forbidden local reconstruction or out-of-scope target simulation.

## Ammunition semantics

**Decision**: Model ammunition as either `none` for package `null` or `capacity` carrying the exact
`clipSize`, `hopper`, `total` and `unlimited` values. When `unlimited` is true, present the reserve and
total semantically as unlimited rather than passing `Infinity` to an ordinary number formatter. A
zero hopper remains numeric zero and is not called unlimited.

**Rationale**: Package `null` means the module carries no ammunition, not that its ammunition is
unknown. The Abrasion Blaster uses `unlimited: true` with infinite hopper/total. A zero reserve has a
different package meaning, including Plasma Slug weapons that reload from fuel outside this model.

**Alternatives considered**: Treating `null` as unavailable, substituting zero, formatting infinity
as a number, or inferring reload duration from capacity was rejected because each changes the
package meaning.

## Capacitor and WEP-pip semantics

**Decision**: Pass feature 003's settled WEP-pip value directly to
`weaponsCapacitorMetrics({ weaponsPips })` and preserve all six returned fields:
`weaponsPips`, `capacity`, `rechargeRate`, `sustainedEnergyPerSecond`, `netDrainRate` and
`timeToDrain`. Use `timeToDrain` only as the package endurance result. A finite value is formatted as
a localized duration, zero is immediate drain, and infinity is described according to the returned
draw and observable weapon/power context.

**Rationale**: The method always returns a result and accepts finite values from zero through four.
It applies deployed power shedding to the distributor and weapons. Runtime probes show why infinity
needs context:

| Observable state                      | Capacity | Sustained draw | Net drain | Time to drain |
| ------------------------------------- | -------- | -------------- | --------- | ------------- |
| Powered stock Sidewinder at two WEP   | 10       | 2.48           | 1.920…    | 5.207…        |
| Distributor disabled, lasers powered  | 0        | 2.48           | 2.48      | 0             |
| Plant disabled and all consumers shed | 0        | 0              | 0         | `Infinity`    |
| Weapons disabled, distributor powered | 10       | 0              | 0         | `Infinity`    |

`Infinity` therefore means no net drain in the returned firing load; it does not by itself prove
that a weapon can fire. Positive returned draw with infinite time can be described as sustained
indefinitely. Zero draw is instead described as no draining powered firing load.

**Alternatives considered**: Recalculating pip recharge, subtracting recharge from draw, calculating
capacity divided by drain, or describing every infinity as indefinite firing were rejected. The
first three duplicate package calculations; the last misstates shed/disabled/no-weapon cases.

## Weapon totals versus powered firing load

**Decision**: Label `weaponMetrics().total` as the total across enabled fitted weapons and the
capacitor's `sustainedEnergyPerSecond` as the powered deployed firing load. Never force the two
energy fields to match. Compose feature 005's package-backed module power observation beside a
zero-capacity or shed state; do not reconstruct per-module power attribution in feature 007.

**Rationale**: 0.1.1 intentionally filters disabled weapons from weapon totals, but it does not
filter enabled weapons by deployed power shedding there. The capacitor facade does apply shedding.
The scopes are different package results. 0.1.1 supplies the authoritative `PowerBudget.consumers`
projection released for [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299),
and feature 005 owns the shared presentation of that result.

**Alternatives considered**: Zeroing weapon totals when hardpoints are retracted or shed, comparing
the two EPS fields as an error, or mapping priority bands to modules independently inside feature 007
were rejected. Each would replace or duplicate package semantics.

## Design-reference adaptation

**Decision**: Adopt the reference's prominent whole-build output, adjacent damage/capacitor facts,
complete fitted-weapon identity and wide-to-stacked responsive direction. Replace visual bars with
semantic value groups unless a visual can use a package-returned scale without calculation. Remove
damage-at-range bands, convergence, target resistance, target hull/shield output, corrosion bonus and
weapon-alpha summaries.

**Rationale**: The retained hierarchy supports scanning and drill-through. The removed regions are
explicitly out of scope or would require local calculations. The reference also omits many required
package fields and states, so the planned complete detail groups must extend it.

**Alternatives considered**: Copying the canvas literally was rejected because its sample values,
inline style literals, hard-coded English, hover-only titles and derived visuals conflict with the
specification and constitution.

## Localization, accessibility and verification

**Decision**: Use feature 011 messages and active-locale formatters for labels, rates, MW, MJ,
seconds and metre distances. Resolve module names through the Almanac localization helper and show
the shared canonical-language disclosure when unavailable. Complete semantic text accompanies every
state and any visual. Unit tests assert exact package equality and discriminants; Playwright covers
desktop, tablet/mobile portrait and landscape in Chromium and Firefox with automated accessibility
checks and manual screen-reader journeys.

**Rationale**: These are constitutional gates, not a later polish pass. Dense weapon output especially
needs explicit label/value relationships, wrapping, expandable regions with named state and
coalesced announcements.

**Alternatives considered**: Hard-coded labels, manually translated module names, unlabelled data
tables, hover tooltips and one-browser snapshots were rejected by principles V, VI, VII and VIII.

## Research conclusion

No planning ambiguity or Almanac release blocker remains. Feature behavior, result semantics,
responsive composition and verification are resolved. The shared distributor power context remains
sequenced through feature 005 rather than being reimplemented locally.
