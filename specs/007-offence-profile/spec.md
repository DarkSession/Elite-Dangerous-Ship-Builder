# Feature Specification: Offence Profile

## Scope

This capability presents whole-build and per-weapon damage, damage types, ammunition and
weapons-capacitor endurance. Target simulation, damage-at-range aggregation and shot convergence are
out of scope because the Almanac does not return complete build results for them.

## User Scenarios

### Story 1 — Read build damage (P1)

1. Burst and sustained totals show every damage amount the Almanac returns.
2. Anti-xeno remains an overlay, not a partition of conventional damage.
3. Disabled weapons remain listed but contribute to totals only as the package specifies.
4. No fitted weapons is distinct from fitted weapons producing zero totals.

### Story 2 — Inspect weapons (P1)

1. Each weapon shows every returned output, operating-cost, range, piercing and ammunition field.
2. Missing fields remain missing rather than being inferred.
3. Each weapon reaches its hardpoint slot in one interaction.

### Story 3 — Read firing endurance (P2)

1. WEP capacity, recharge, sustained draw, net drain and time to drain use the selected WEP pips.
2. A sustaining build is described as firing indefinitely.
3. No powered distributor keeps the package's zero-capacity result and observable build state.

## Requirements

- **FR-001**: Every offence value MUST come from `@elite-dangerous-almanac/core`; the application
  MUST NOT re-sum, derive or estimate a weapon or build metric.
- **FR-002**: Whole-build and per-weapon values MUST use `ShipLoadout.weaponMetrics()`.
- **FR-003**: Damage types MUST show the returned kinetic, thermal, explosive, absolute,
  unclassified and anti-xeno amounts. The application MUST NOT calculate shares or fold anti-xeno
  into another type.
- **FR-004**: Every returned weapon MUST show slot, identity, enabled state, ammunition and all
  returned `WeaponMetrics` fields. Missing damage, range, ammunition or piercing MUST remain missing.
- **FR-005**: Disabled weapons MUST remain visible and totals MUST follow the package's enabled-state
  behaviour.
- **FR-006**: Capacitor endurance MUST use `ShipLoadout.weaponsCapacitorMetrics()` for the selected
  WEP pips. The application MUST NOT calculate endurance or pip scaling.
- **FR-007**: Infinite duration and zero capacity MUST be expressed by their package meaning while
  observable distributor and power state remains available.

## Edge Cases

- All weapons disabled produces genuine zero totals while retaining the weapon list.
- Unlimited ammunition is described as unlimited, not assigned a capacity.
- Missing distributor power is not the same as unavailable endurance.

## Almanac Coverage

`weaponMetrics()` supplies whole-build totals and per-weapon results;
`weaponsCapacitorMetrics()` supplies pip-aware endurance. No offence calculation is local.

## Success Criteria

- **SC-001**: Every offence value equals its Almanac field.
- **SC-002**: No local damage, falloff, convergence or endurance calculation exists.
- **SC-003**: Disabled, absent, zero and infinite outcomes remain distinguishable.
