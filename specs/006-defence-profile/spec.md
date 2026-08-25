# Feature Specification: Defence Profile

## Scope

This capability presents shields, recovery, cell banks, armour, resistances, hull hardness and
module protection for the active build.

## User Scenarios

### Story 1 — Read shield and armour strength (P1)

1. Shields show total strength, the generator that produced it, the booster and reinforcement
   contributions, resistances and effective hit points.
2. Armour shows total hit points, bulkhead and reinforcement contributions, resistances and
   effective hit points.
3. The SYS pips the workspace is already set to are the allocation the dependent shield results are
   read at.
4. Missing shields do not hide armour.

### Story 2 — Read recovery and cell banks (P2)

1. Shield recovery shows the recharge rate and the two phases the shields recover in.
2. A fitted cell-bank reserve remains visible with its total, its banks and their power state.
3. No fitted banks remains distinct from fitted banks whose powered totals are zero.

### Story 3 — Read hull and module protection (P2)

1. Hull hardness is shown as its own package value.
2. Module armour and module-protection fraction remain distinct from hull hit points.

## Requirements

- **FR-001**: Every defence value MUST come from `@elite-dangerous-almanac/core` without local
  calculation, clamping or apportionment.
- **FR-002**: Shields MUST use `BuildMetrics.shieldMetricsResult()` and show the returned strength,
  role contributions, resistances and **two** effective-hit-point readings per damage type: the bare
  shield, and the same shield at the standing SYS allocation. Every figure shown MUST be a returned
  field, each from its own call.

  > **Second column added 2026-08-25.** The canvas revision of that date gave the shield table a
  > fifth column headed `MJ × N SYS PIPS`, where **N is the SYS allocation standing at the time of
  > reading** — not a fixed number. The canvas samples it at four, so its heading reads
  > `MJ × 4 SYS PIPS` and its kinetic cell `7,805` beside the `MJ` column's `3,122`; at two pips the
  > same column heads `MJ × 2 SYS PIPS` and holds a smaller figure, and at none it heads
  > `MJ × 0 SYS PIPS` and equals the `MJ` column exactly. The heading is part of the reading,
  > because a figure that moves with a condition shown without that condition is the misleading
  > number constitution IV forbids.
  >
  > The first four columns do not move with the allocation at all. `RESIST` and `MJ` are the
  > **bare** shield, `shieldMetricsResult()` — which since Almanac 0.2.0 takes no allocation at
  > all, because the bare shield is what an outfitting screen shows — and the pip effect appears in
  > the fifth column and nowhere else. In particular the four resistance percentages are base
  > values and never have systems resistance folded into them.
  >
  > The fifth column is `shieldCapacitorMetricsResult({ systemsPips: <standing allocation> })`,
  > the package's separate reading of what one SYS allocation is worth to a raised shield. The
  > allocation is always passed: the package's own default is four pips, not none. Nothing is
  > multiplied here: both columns are `effectiveHitPoints` straight off two package results, and
  > `systemsResistance` is the package's own field.

- **FR-003**: A `null` shield result MUST remain unavailable. A missing, disabled and power-shed
  generator MUST remain distinguishable through package and build state.
- **FR-004**: Recovery MUST use `BuildMetrics.shieldRecoveryResult()` and keep the regeneration rate,
  the regeneration time and the recovery time separate readings.
- **FR-005**: Infinite recovery and effective hit points MUST be expressed by their package meaning
  without changing the result.
- **FR-006**: Cell banks MUST use `BuildMetrics.cellBanks()`. The reserve MUST be the package total,
  every returned bank MUST be listed under it with its class and rating, its cells, its
  reinforcement and its powered state, banks differing in any of those MUST be listed apart, and no
  fitted bank MUST be indistinguishable from none fitted.
- **FR-007**: Armour MUST use `BuildMetrics.armourMetrics()` for hit points, contributions,
  resistances, effective hit points, module armour and module protection.
- **FR-008**: Fitted bulkhead and hull hardness MUST come from Almanac records.
- **FR-009**: A fitted generator, booster, bulkhead, reinforcement or bank shown as a source MUST be
  named by its own package identity — the module the package resolved, its class, its rating and its
  engineering. Aggregate package contributions MUST NOT be divided among slots.

## Edge Cases

- Negative resistance remains negative.
- No banks and all banks unpowered are different states.
- An unpowered generator produces package-structured unavailable shield and recovery results while
  its power state remains visible.
- An unknown hull is rejected by the package construction boundary before it can become active.

## Almanac Coverage

`shieldMetricsResult()`, `shieldRecoveryResult()`, `cellBanks()` and `armourMetrics()` provide all defence
numbers and states. Hull hardness is package catalogue data.

## Success Criteria

- **SC-001**: Every defence value equals its Almanac field.
- **SC-002**: Absent, zero, negative and infinite outcomes remain distinguishable.
- **SC-003**: Every source row names the package modules it stands for and carries no share of an
  aggregate.
