# Capacitor Endurance Contract

## Purpose

Define the selected-WEP-pip input, exact `weaponsCapacitorMetrics()` result mapping and semantic
presentation of finite, zero and infinite endurance. This contract never calculates recharge, drain
or duration.

## Inputs

- one active `ShipLoadout` with feature 001 `buildRevision`;
- one settled feature 003 `ViewingConditions` value and `conditionsRevision`;
- feature 007's same-revision weapon profile;
- feature 005's same-revision package-backed distributor/power observation.

Feature 003 stores valid half-pip state and supplies the numeric WEP value accepted by the package.
Feature 007 neither validates nor redistributes pips.

## Package call

Call exactly once for a projection:

```text
loadout.weaponsCapacitorMetrics({ weaponsPips: settledWeaponsPips })
```

Do not call the data-free calculator. Copy all returned fields:

| Package field              | Presentation meaning                            |
| -------------------------- | ----------------------------------------------- |
| `weaponsPips`              | Pips actually used by the package               |
| `capacity`                 | WEP capacity in MJ                              |
| `rechargeRate`             | Actual recharge at returned pips in MJ/s        |
| `sustainedEnergyPerSecond` | Powered deployed sustained firing draw in MJ/s  |
| `netDrainRate`             | Package net loss after recharge in MJ/s         |
| `timeToDrain`              | Seconds from full to empty, or package infinity |

The displayed pip value comes from the result, not an unverified echo of the draft control.

## Duration semantics

The presenter selects wording from returned values and context; it never computes a replacement
number.

| Returned/context state                             | Required wording category                                                   |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| finite `timeToDrain > 0`                           | Localized finite duration                                                   |
| `timeToDrain === 0`                                | Drains immediately                                                          |
| infinite time and positive returned sustained draw | Powered firing load can be sustained indefinitely/no net drain              |
| infinite time and zero returned sustained draw     | No draining powered firing load; do not claim weapons can fire indefinitely |

No generic formatter receives `Infinity`. A screen-reader value includes the semantic phrase, not
the token “Infinity.”

## Zero capacity and distributor context

Capacity and recharge zero remain valid numeric package results. Show them alongside the separate
feature 005 `DistributorObservation`:

- fitted/enabled/powered;
- fitted but disabled;
- fitted but power-shed;
- absent;
- unresolved/unavailable.

The observation is not derived from zero capacity. Likewise, the capacitor result is not replaced by
a catalogue distributor value. The UI may say “capacity 0 MJ; distributor is power-shed” when both
facts are independently available, but it does not state an inferred causal diagnosis.

Feature 005 and [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
own the authoritative per-module power projection. Feature 007 must not parse priority, subtract
power bands or copy package shedding rules.

## Scope separation

`weaponMetrics().total.sustainedEnergyPerSecond` and capacitor
`sustainedEnergyPerSecond` are not required to match:

- weapon totals include enabled returned weapons;
- capacitor draw includes powered, enabled, deployed weapons.

Label both scopes explicitly. Do not zero weapon totals for retracted/shed hardpoints or replace the
capacitor draw with the weapon total. Feature 003's hardpoint state remains an observable viewing
condition; `weaponsCapacitorMetrics()` models the deployed firing load and receives no fabricated
retracted option.

## Empty and disabled weapon contexts

- A truly empty hardpoint set retains the package capacitor result and receives no-fitted-weapons
  context.
- Occupied unresolved hardpoints receive a qualification; no missing draw is estimated.
- All disabled returned weapons remain visible in the weapon profile; zero capacitor draw and
  infinite time keep their package values and receive no-powered-firing-load wording.
- A genuine zero-energy weapon is not treated as disabled.

## Revision and failure behavior

- Capture build and settled conditions together.
- Publish weapon, capacitor and distributor sections only when build/condition revisions still
  match.
- Discard stale results rather than combining an old weapon total with a new pip result.
- Invalid pip drafts remain in feature 003 and never trigger this package call.
- A thrown package error publishes one current-context failure with no stale prior capacitor values.

## Localization and accessibility

- MJ, MJ/s, pips and seconds use active-locale number/unit formatting.
- Semantic zero/infinity and distributor-state phrases are application message keys.
- The shared pip allocator exposes its total, constraints and Apply result; feature 007 does not add
  a second control.
- Text states accompany any capacity/drain visual. Bars do not calculate a local percentage.
- A settled pip/build change produces one coalesced polite announcement, not one announcement per
  metric.

## Verification

- Deep-equal all six fields at WEP 0, 0.5, 2 and 4 pips.
- Cover finite duration, immediate drain and both infinity wording categories.
- Cover powered, disabled, shed, absent and unresolved distributor observations without changing
  package numbers.
- Cover no returned weapons, truly empty hardpoints, unresolved-only hardpoints, all disabled and
  genuine zero draw.
- Prove weapon total EPS and capacitor sustained draw are independently mapped.
- Prove rapid build/pip changes never publish a mixed revision.
