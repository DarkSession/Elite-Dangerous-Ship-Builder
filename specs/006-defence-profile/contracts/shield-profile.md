# Shield and Recovery Contract

> **Reconciled at implementation, 2026-08-24, and again for the 2026-08-25 revision.** Feature 005's
> store already publishes the SYS pips in the package's own `[0, 4]` units, so no halving is applied.
> The scalar fields the canvas does not draw — the mass-curve multiplier, the boost multiplier, and
> the capacitor's capacity, recharge rate, SYS resistance and pip-folded resistances — are carried by
> the projection and not presented, and the broken regeneration rate goes with them: canvas 1c draws
> the recharge rate and the two phases.

## Boundary

For the reader's active-build revision, take the standing `systemsPips` and call:

```ts
const metrics = BuildMetrics.of(loadout);
const shield = metrics.shieldMetricsResult();
const capacitor = metrics.shieldCapacitorMetricsResult({ systemsPips });
const recovery = metrics.shieldRecoveryResult({ systemsPips });
```

Almanac 0.2.0 made the bare shield and what a SYS allocation is worth to it two calls.
`shieldMetricsResult()` takes no allocation at all — it is the shield an outfitting screen shows —
and every pip-dependent figure comes from `shieldCapacitorMetricsResult()`. The allocation is always
passed explicitly, because the package's own default is four pips and a standing allocation of none
would otherwise be read as four. Components never call the package, and application code never calls
standalone shield, resistance, EHP or recovery formulas.

## Calculation result contract

Each result remains independent:

- `complete: true` copies the entire value and carries no issue;
- `complete: false` carries no value and preserves every package issue in order;
- each issue retains `field`, `reason`, optional `slot`/`symbol`, params and the original issue for
  package-owned diagnostic localization;
- an issue-provided slot is retained on the view and drawn as no action, because the canvas holds
  none;
- no issue is collapsed into a generic generator state or inferred from another package result.

The authoritative reasons are `missing`, `unresolved`, `disabled`, `shed` and `invalid`. A
`powerCapacity` or `powerDraw` issue remains that diagnosis and is not relabeled as a generator
failure. Shield/recovery availability uses package hardpoints-retracted power semantics; deployed
power is not compared or required to agree.

## Complete shield mapping

| Presentation fact       | `ShieldMetrics` source                                 | Unit/meaning     |
| ----------------------- | ------------------------------------------------------ | ---------------- |
| total strength          | `strength`                                             | MJ               |
| generator aggregate     | `generator`                                            | MJ               |
| booster aggregate       | `boosters`                                             | MJ               |
| reinforcement aggregate | `reinforcement`                                        | MJ               |
| damage resistances      | `resistances.kinetic/thermal/explosive/caustic`        | signed fraction  |
| effective shield pools  | `effectiveHitPoints.kinetic/thermal/explosive/caustic` | MJ of raw damage |

`massCurveMultiplier` and `boostMultiplier` are copied into the projection and not drawn: neither
canvas writes them, and a figure the reference does not draw is not this feature's to add. No
application explanation claims which fields changed; the package result is the answer.

## Complete capacitor mapping

What the standing allocation is worth is a result of its own, and the only thing on the damage table
that moves when a pip moves.

| Presentation fact             | `ShieldCapacitorMetrics` source                        | Unit/meaning     |
| ----------------------------- | ------------------------------------------------------ | ---------------- |
| the allocation it was read at | `systemsPips`                                          | pips, `[0, 4]`   |
| effective shield pools        | `effectiveHitPoints.kinetic/thermal/explosive/caustic` | MJ of raw damage |

`capacity`, `rechargeRate`, `systemsResistance` and `effectiveResistances` are carried and not
drawn, for the same reason. The last of those is the one to be careful with: it is the shield's
resistances with the pips folded in, and drawing it anywhere would put a pip-moved percentage on a
table whose `RESIST` column is a base value. The fifth column takes `effectiveHitPoints` and nothing
else. No pool is scaled, blended or apportioned between the two results: an unavailable capacitor
result withdraws its column rather than borrowing the bare pool beside it, and an unavailable bare
shield does not borrow the capacitor's.

## Complete recovery mapping

| Presentation fact          | `ShieldRecovery` source | Unit/meaning                            | Drawn |
| -------------------------- | ----------------------- | --------------------------------------- | ----- |
| raised regeneration rate   | `regenRate`             | MJ/s                                    | yes   |
| broken regeneration rate   | `brokenRegenRate`       | MJ/s                                    | no    |
| collapse-to-raise duration | `recoveryTime`          | seconds to 50%, including package delay | yes   |
| raise-to-full duration     | `regenTime`             | seconds from 50% to full                | yes   |

The rate and the two phases never merge, and recovery unavailability never hides a complete shield
or any armour result.

## Numeric semantics

| Package value                   | Presentation                                                |
| ------------------------------- | ----------------------------------------------------------- |
| finite number                   | exact locale-formatted value and correct unit               |
| zero                            | numeric zero, never empty/unavailable                       |
| negative resistance             | exact signed percentage plus visible weakness meaning       |
| effective hit points `Infinity` | localized unbounded raw-damage meaning for that damage type |
| a recovery duration `Infinity`  | localized phrase for a phase that does not finish           |

No clamp, finite substitute, generic infinity label, truthiness check or misleading bar is allowed.

## Localization and accessibility

- Application headings, labels, units, sentinel meanings and explanations use feature 011 messages.
- Package issues use `getCalculationIssueMessage()` from the diagnostics leaf and the shared
  canonical-language fallback/disclosure; the English `message` is not parsed or translated locally.
- Strength, role aggregates and recovery use labelled definitions.
- Damage values use a semantic table when roomy and equivalent complete labelled cards when stacked.
- Missing, disabled, shed, unresolved, invalid, negative and unbounded meanings are visible text and
  programmatic state, never colour or bar alone.

## Verification

- Compare every complete field directly with the same real package result: the bare shield once, and
  the capacitor at 0, 2 and 4 SYS pips.
- Compare incomplete issue arrays in exact order and with exact fields/identities.
- Prove missing generator, disabled generator, shed generator, disabled plant and unresolved power
  remain distinct package diagnoses.
- Prove a retracted-powered/deployed-shed generator remains package-complete for shields.
- Prove shield/recovery may differ without one result suppressing the other.
- Prove the bare shield and the capacitor are independent in both directions: a refused capacitor
  withdraws the fifth column and leaves the four bare ones whole, and neither result stands a figure
  in for the other.
- Prove zero, negative, unavailable, unbounded EHP and a non-finishing recovery phase remain
  distinct.
- Prove shield unavailability never suppresses armour.
