# Capacitor Endurance Contract

## Boundary and input ownership

Feature 003 supplies one settled `StatusRevisionContext`. Its `ViewingConditions` stores SYS/ENG/WEP
as integer half-pips `0..8`, totalling 12. For the captured revision pair, feature 007 converts WEP
exactly once:

```ts
const result = loadout.weaponsCapacitorMetrics({
  weaponsPips: context.conditions.pips.weapons / 2,
});
```

Use `WeaponsOptions` from `@elite-dangerous-almanac/core/ships/ship-loadout` and
`WeaponsCapacitorMetrics` from
`@elite-dangerous-almanac/core/ships/weapons-capacitor`. Do not call the standalone calculator.

Feature 007 neither validates a second tuple nor persists pips. Invalid feature-003 drafts do not
advance `conditionsRevision` and never call this boundary.

## Exact result

Retain and present all six returned fields:

| Package field              | Required meaning                                        |
| -------------------------- | ------------------------------------------------------- |
| `weaponsPips`              | Allocation actually used by the package                 |
| `capacity`                 | Powered deployed WEP capacity in MJ                     |
| `rechargeRate`             | Actual selected-pip recharge in MJ/s                    |
| `sustainedEnergyPerSecond` | Powered, enabled, deployed sustained firing draw        |
| `netDrainRate`             | Package net loss after recharge, floored at zero        |
| `timeToDrain`              | Seconds from full to empty or package positive infinity |

Display returned `weaponsPips`, not an unchecked echo of the draft or integer half-pip value. No
field is calculated from another.

## Duration semantics

| Returned state                                   | Required semantic wording                                  |
| ------------------------------------------------ | ---------------------------------------------------------- |
| finite `timeToDrain > 0`                         | Localized finite duration                                  |
| `timeToDrain === 0`                              | Drains immediately                                         |
| infinite time + positive returned sustained draw | Powered firing load can be sustained; no net drain         |
| infinite time + zero returned sustained draw     | No draining powered firing load; no claim weapons can fire |

No generic number formatter, JSON boundary or visual label receives `Infinity`. The semantic phrase
is visible and programmatically associated with the field.

## Zero capacity and deployed distributor context

Capacity/recharge zero are genuine package numbers. They appear beside a separate, same-revision,
feature-005-owned `DeployedDistributorPowerObservation`:

- powered;
- disabled;
- power-shed;
- absent;
- unresolved;
- qualified because package power facts cannot support an exact verdict.

Feature 005 must accept and expose this port before feature 007 tasks. Its current
`DistributorView.ready | unavailable` and feature-010-only hardpoint port do not satisfy this
boundary. Feature 007 must not infer any cause from zero capacity, `distributorMetrics() === null`, a
symbol prefix, module priority or consumer/band joins.

When both independent facts are available the UI may state them together, for example “capacity 0
MJ” and “distributor is power-shed.” It must not say the observation caused the capacitor result
unless a future package contract says so.

## Scope separation

`weaponMetrics().total.sustainedEnergyPerSecond` and the capacitor's
`sustainedEnergyPerSecond` need not match:

- weapon totals include enabled returned weapons;
- capacitor draw includes powered, enabled and deployed firing weapons.

Label these scopes. Do not zero weapon totals for selected retracted hardpoints or plant shedding,
replace capacitor draw with the aggregate or report the mismatch as an error. The capacitor facade
always models deployed firing; selected hardpoint state remains separate feature-003 viewing context.

## Empty, unresolved and disabled contexts

- Confirmed-empty hardpoints retain the exact capacitor result and receive no-fitted-weapons context.
- Unresolved occupied hardpoints qualify completeness; omitted draw is never estimated.
- All disabled returned weapons remain visible; zero capacitor draw and infinity receive
  no-draining-powered-load wording.
- A genuine zero-energy weapon is not classified as disabled.
- Zero-capacity positive draw and zero-capacity zero draw remain different package outcomes.

## Revision and failures

- Capture build and settled conditions together.
- Publish weapon, coverage, capacitor and deployed-power facts only when their revision stamps match.
- Discard stale results instead of combining old weapon totals or power context with new pips.
- A missing required feature-005 port produces `integrationUnavailable`; a thrown package/projection
  error produces `projectionFailed`. Neither state changes the active build.
- Package zero or infinity remains ready data and never selects failure.

## Localization and accessibility

- MJ, MJ/s, pips and seconds use feature 011 active-locale formatters.
- Immediate, sustaining, no-load and distributor-state phrases use application message keys.
- Feature 007 composes feature 003's shared condition control where required; it adds no WEP-only
  state.
- Every text value remains available at narrow widths and 400% zoom. A bar may supplement only a
  future package-authored scale and must retain nearby complete text.
- One accepted build/pip/context revision produces one coalesced localized announcement.

## Verification

- Deep-equal all six fields at displayed WEP 0, 0.5, 2 and 4.
- Prove integer half-pips divide by two once and invalid drafts never call the package.
- Cover finite duration, immediate drain and both infinity meanings.
- Cover positive-draw/zero-capacity and zero-draw/zero-capacity results.
- Cover each owner-supplied distributor observation without changing capacitor values.
- Prove aggregate weapon EPS and powered capacitor draw remain independent.
- Prove stale or mismatched revision/port reads never publish.
