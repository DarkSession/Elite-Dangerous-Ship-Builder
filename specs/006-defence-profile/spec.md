# Feature Specification: Defence Profile

## Scope

This capability presents shields, recovery, cell banks, armour, resistances, hull hardness and
module protection for the active build.

## User Scenarios

### Story 1 — Read shield and armour strength (P1)

1. Shields show total strength, generator, booster and reinforcement contributions, mass and boost
   multipliers, resistances and effective hit points.
2. Armour shows total hit points, bulkhead and reinforcement contributions, resistances and
   effective hit points.
3. SYS pips identify and update the dependent shield results.
4. Missing shields do not hide armour.

### Story 2 — Read recovery and cell banks (P2)

1. Shield recovery shows normal and broken rates plus recovery and regeneration durations.
2. Every fitted cell bank remains visible with its power state and returned fields.
3. No fitted banks remains distinct from fitted banks whose powered totals are zero.

### Story 3 — Read hull and module protection (P2)

1. Hull hardness is shown as the value compared with weapon armour piercing.
2. Module armour and module-protection fraction remain distinct from hull hit points.

## Requirements

- **FR-001**: Every defence value MUST come from `@elite-dangerous-almanac/core` without local
  calculation, clamping or apportionment.
- **FR-002**: Shields MUST use `ShipLoadout.shieldMetricsResult()` and show all returned strength,
  contribution, multiplier, resistance and effective-hit-point fields for the selected SYS pips.
- **FR-003**: A `null` shield result MUST remain unavailable. A missing, disabled and power-shed
  generator MUST remain distinguishable through package and build state.
- **FR-004**: Recovery MUST use `ShipLoadout.shieldRecoveryResult()` and keep normal rate, broken rate,
  recovery time and regeneration time separate.
- **FR-005**: Infinite recovery and effective hit points MUST be expressed by their package meaning
  without changing the result.
- **FR-006**: Cell banks MUST use `ShipLoadout.cellBanks()`. Every bank MUST show slot, reinforcement,
  cells, spin-up, duration, heat and powered state; totals MUST remain package totals.
- **FR-007**: Armour MUST use `ShipLoadout.armourMetrics()` for hit points, contributions,
  resistances, effective hit points, module armour and module protection.
- **FR-008**: Fitted bulkhead and hull hardness MUST come from Almanac records.
- **FR-009**: A fitted generator, booster, bulkhead, reinforcement or bank shown as a source MUST
  reach its slot. Aggregate package contributions MUST NOT be divided among slots.

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
- **SC-003**: Every package-identified source module reaches its slot in one interaction.
