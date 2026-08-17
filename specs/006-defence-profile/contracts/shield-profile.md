# Shield Profile Contract

## Boundary

For one active build revision and one valid feature 003 SYS-pip value, call each method exactly once:

```ts
const shield = build.shieldMetrics({ systemsPips });
const recovery = build.shieldRecovery({ systemsPips });
const budget = build.powerBudget();
```

The shield calls receive the identical `systemsPips` value and all three calls belong to one atomic
defence snapshot. The budget supplies auxiliary state context only; this capability does not
duplicate feature 005's power figures. Components never call the package. No standalone resistance,
shield-strength, effective-hit-point or recovery function is called by application code.

Implementation is gated on released fixes for Almanac #296 and #297. The projector must consume the
released availability contract rather than suppressing beta.12 values locally.

## Ready shield mapping

Copy every returned field without calculation:

| View field                 | `ShieldMetrics` source                                 |
| -------------------------- | ------------------------------------------------------ |
| total strength             | `strength`                                             |
| generator contribution     | `generator`                                            |
| booster contribution       | `boosters`                                             |
| reinforcement contribution | `reinforcement`                                        |
| mass multiplier            | `massCurveMultiplier`                                  |
| boost multiplier           | `boostMultiplier`                                      |
| SYS resistance             | `systemsResistance`                                    |
| four resistances           | `resistances.kinetic/thermal/explosive/caustic`        |
| four effective pools       | `effectiveHitPoints.kinetic/thermal/explosive/caustic` |

The selected pips are stated beside the result. They do not become a local explanation of strength,
and the application does not assume which fields changed.

## Availability and generator state

- A released package unavailable outcome maps to `ShieldProfileView.unavailable`; no zero or
  catalogue fallback is displayed.
- No resolved fitted generator maps to `missing`.
- A resolved generator with `on === false` maps to `disabled`.
- For a resolved generator not named by `budget.unknownDraws`, absent priority selects package
  default group one and an explicit integer `0..4` selects the corresponding returned one-based band.
  Any other raw priority is indeterminate rather than locally clamped. Agreeing
  `poweredDeployed`/`poweredRetracted` values may establish `powered` or `shed`; disagreement is
  indeterminate. The released recovery outcome must agree.
- Any unresolved or ambiguous case maps to `indeterminate`, not a guessed reason.
- A shed generator may retain package shield strength. State and strength remain separate.

## Recovery mapping

Copy the rates and durations independently:

| View field                     | `ShieldRecovery` source |
| ------------------------------ | ----------------------- |
| normal regeneration            | `regenRate`             |
| broken regeneration            | `brokenRegenRate`       |
| collapse-to-recovery threshold | `recoveryTime`          |
| recovery threshold-to-full     | `regenTime`             |

`null`/released unavailable remains unavailable. It never hides a reportable shield metric or any
armour content.

## Semantic non-finite and signed values

| Package outcome                 | Presentation state                                  |
| ------------------------------- | --------------------------------------------------- |
| finite effective hit points     | exact localized MJ value                            |
| effective hit points `Infinity` | `unbounded` for that damage type                    |
| finite recovery time            | exact localized duration                            |
| recovery time `Infinity`        | `cannotRecover`                                     |
| regeneration time `Infinity`    | `cannotRegenerateToFull`                            |
| negative resistance             | exact signed localized percentage and weakness text |
| zero                            | exact numeric zero                                  |

No clamp, substitute, generic infinity label or inferred finite maximum is permitted.

## UI intent

```ts
setPips(allocation: PipAllocation)
```

Feature 006 delegates to feature 003's shared validated condition store. It does not create a second
pip model or persist viewing state.

## Accessibility and localization

- Strength/contribution/multiplier facts use labelled definition structures.
- Four damage types use a semantic table when space permits and equivalent complete labelled cards
  when stacked.
- Any bar is supplemental. Negative and unbounded values are never clipped into a misleading scale.
- Missing, disabled, shed, indeterminate, negative and non-finite meanings are visible text and
  programmatic state, not color/icon/fill alone.
- MJ, MJ/s, percentages, multipliers and durations use feature 011 locale formatters. Application
  labels and sentinel meanings use message keys.
- A settled pip or availability change is announced once politely without reading every unchanged
  value again.

## Required verification

- Exact equality for every `ShieldMetrics` field at zero, fractional and four SYS pips.
- Exact equality for all four `ShieldRecovery` fields under the same selected pips.
- Missing/disabled/shed/indeterminate states do not alter package strength.
- #296's reproduction becomes recovery-unavailable while permitted shield strength remains intact.
- #297's reproduction becomes package-authorized unavailable, not application-filtered zero.
- Zero, negative, unavailable and both non-finite meanings remain distinct.
- Shield unavailability never suppresses armour.
