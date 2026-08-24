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
- **FR-002**: Shields MUST use `ShipLoadout.shieldMetricsResult()` and show the returned strength,
  role contributions, resistances and effective hit points for the standing SYS pips. Every figure
  shown MUST be a returned field.
- **FR-003**: A `null` shield result MUST remain unavailable. A missing, disabled and power-shed
  generator MUST remain distinguishable through package and build state.
- **FR-004**: Recovery MUST use `ShipLoadout.shieldRecoveryResult()` and keep the regeneration rate,
  the regeneration time and the recovery time separate readings.
- **FR-005**: Infinite recovery and effective hit points MUST be expressed by their package meaning
  without changing the result.
- **FR-006**: Cell banks MUST use `ShipLoadout.cellBanks()`. The reserve MUST be the package total,
  every returned bank MUST be listed under it with its class and rating, its cells, its
  reinforcement and its powered state, banks differing in any of those MUST be listed apart, and no
  fitted bank MUST be indistinguishable from none fitted.
- **FR-007**: Armour MUST use `ShipLoadout.armourMetrics()` for hit points, contributions,
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
