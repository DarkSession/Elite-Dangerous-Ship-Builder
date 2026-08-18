# Shield and Recovery Contract

## Boundary

For one captured active-build/condition revision, derive the selected package value as
`conditions.pips.systems / 2` and call:

```ts
const shield = loadout.shieldMetricsResult({ systemsPips });
const recovery = loadout.shieldRecoveryResult({ systemsPips });
```

Both calls receive the identical explicit pips. Components never call the package, and application
code never calls standalone shield, resistance, EHP or recovery formulas.

## Calculation result contract

Each result remains independent:

- `complete: true` copies the entire value and carries no issue;
- `complete: false` carries no value and preserves every package issue in order;
- each issue retains `field`, `reason`, optional `slot`/`symbol`, params and the original issue for
  package-owned diagnostic localization;
- an issue-provided slot authorizes that exact workspace slot target;
- no issue is collapsed into a generic generator state or inferred from another package result.

The authoritative reasons are `missing`, `unresolved`, `disabled`, `shed` and `invalid`. A
`powerCapacity` or `powerDraw` issue remains that diagnosis and is not relabeled as a generator
failure. Shield/recovery availability uses package hardpoints-retracted power semantics; deployed
power is not compared or required to agree.

## Complete shield mapping

| Presentation fact          | `ShieldMetrics` source                                 | Unit/meaning                |
| -------------------------- | ------------------------------------------------------ | --------------------------- |
| total strength             | `strength`                                             | MJ                          |
| generator aggregate        | `generator`                                            | MJ                          |
| booster aggregate          | `boosters`                                             | MJ                          |
| reinforcement aggregate    | `reinforcement`                                        | MJ                          |
| hull-mass curve multiplier | `massCurveMultiplier`                                  | multiplier                  |
| combined boost multiplier  | `boostMultiplier`                                      | multiplier; `1` is baseline |
| selected SYS resistance    | `systemsResistance`                                    | fraction                    |
| damage resistances         | `resistances.kinetic/thermal/explosive/caustic`        | signed fraction             |
| effective shield pools     | `effectiveHitPoints.kinetic/thermal/explosive/caustic` | MJ of raw damage            |

The selected SYS pips are visible beside the shield context. No application explanation claims
which fields changed; the package result is the answer.

## Complete recovery mapping

| Presentation fact          | `ShieldRecovery` source | Unit/meaning                            |
| -------------------------- | ----------------------- | --------------------------------------- |
| raised regeneration rate   | `regenRate`             | MJ/s                                    |
| broken regeneration rate   | `brokenRegenRate`       | MJ/s                                    |
| collapse-to-raise duration | `recoveryTime`          | seconds to 50%, including package delay |
| raise-to-full duration     | `regenTime`             | seconds from 50% to full                |

The two rates and two phases never merge, and recovery unavailability never hides a complete shield
or any armour result.

## Numeric semantics

| Package value                   | Presentation                                                |
| ------------------------------- | ----------------------------------------------------------- |
| finite number                   | exact locale-formatted value and correct unit               |
| zero                            | numeric zero, never empty/unavailable                       |
| negative resistance             | exact signed percentage plus visible weakness meaning       |
| effective hit points `Infinity` | localized unbounded raw-damage meaning for that damage type |
| `recoveryTime === Infinity`     | localized “cannot reach recovery threshold” meaning         |
| `regenTime === Infinity`        | localized “cannot regenerate to full” meaning               |

No clamp, finite substitute, generic infinity label, truthiness check or misleading bar is allowed.

## Localization and accessibility

- Application headings, labels, units, sentinel meanings and explanations use feature 011 messages.
- Package issues use `getCalculationIssueMessage()` from the diagnostics leaf and the shared
  canonical-language fallback/disclosure; the English `message` is not parsed or translated locally.
- Strength/contributions/multipliers and recovery use labelled definitions.
- Damage values use a semantic table when roomy and equivalent complete labelled cards when stacked.
- Missing, disabled, shed, unresolved, invalid, negative and unbounded meanings are visible text and
  programmatic state, never color/bar alone.
- A settled SYS or availability change emits one coalesced polite announcement.

## Verification

- Compare every complete field directly with the same real package result at 0, fractional, 2 and 4
  SYS pips.
- Compare incomplete issue arrays in exact order and with exact fields/identities.
- Prove missing generator, disabled generator, shed generator, disabled plant and unresolved power
  remain distinct package diagnoses.
- Prove a retracted-powered/deployed-shed generator remains package-complete for shields.
- Prove shield/recovery may differ without one result suppressing the other.
- Prove zero, negative, unavailable, unbounded EHP and both non-finishing recovery phases remain
  distinct.
- Prove shield unavailability never suppresses armour.
