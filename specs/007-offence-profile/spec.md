# Feature Specification: Offence Profile

## Scope

This specification covers whole-build and per-weapon damage, damage types, sustained output,
ammunition and weapons-capacitor endurance. It inherits the statistic rules and viewing conditions
in [Ship Statistics](../003-ship-statistics/spec.md).

Distributor capacity and heat states belong to
[Power and Heat](../005-power-and-heat/spec.md). Hull hardness belongs to
[Defence Profile](../006-defence-profile/spec.md).

Damage-at-range aggregation, target simulation and shot-convergence geometry are out of scope. The
current Almanac does not return those as complete build metrics, and this application does not
construct them from component values.

## User Scenarios & Testing

### User Story 1 - Read build damage (Priority: P1)

A Commander can see the build's burst and sustained damage output split by the damage types the
Almanac reports.

**Independent Test**: Load a reference build with mixed conventional, anti-xeno and unclassified
damage and compare every whole-build value with `weaponMetrics()`.

**Acceptance Scenarios**:

1. **Given** enabled weapons, **When** offence is shown, **Then** burst and sustained damage per
   second are visible with the returned kinetic, thermal, explosive, absolute, unclassified and
   anti-xeno amounts.
2. **Given** anti-xeno damage, **When** the split is shown, **Then** it is identified as an overlay
   rather than a conventional partition.
3. **Given** disabled weapons, **When** totals are shown, **Then** those weapons remain listed but
   contribute nothing to the package totals.
4. **Given** no weapons, **When** offence is shown, **Then** the profile is absent rather than
   described as a zero-damage loadout.

### User Story 2 - Inspect each weapon (Priority: P1)

A Commander can inspect the output and operating cost of every fitted weapon.

**Independent Test**: Compare the displayed fields for projectile, ammunition-limited and
continuous-fire weapons with each returned fitted-weapon metric.

**Acceptance Scenarios**:

1. **Given** a fitted weapon, **When** its detail is shown, **Then** damage per shot, burst and
   sustained rates of fire, burst and sustained damage, damage by type, capacitor draw, heat,
   thermal load, power draw and ammunition capacity are visible where returned.
2. **Given** range and piercing data, **When** weapon detail is shown, **Then** maximum range,
   falloff range and armour piercing are labelled as weapon properties.
3. **Given** an unavailable weapon field, **When** detail is shown, **Then** it remains absent or
   unavailable rather than being inferred from another field.
4. **Given** a weapon entry, **When** the Commander activates it, **Then** its hardpoint slot is
   reached.

### User Story 3 - Read firing endurance (Priority: P2)

A Commander can see whether the WEP capacitor sustains the build and, if not, how long it lasts at
the selected WEP pips.

**Independent Test**: Compare sustaining, draining and unpowered-distributor builds with
`weaponsCapacitorMetrics()` at several WEP allocations.

**Acceptance Scenarios**:

1. **Given** capacitor draw greater than recharge, **When** endurance is shown, **Then** capacity,
   recharge, sustained draw, net drain and time to drain match the package result.
2. **Given** draw no greater than recharge, **When** endurance is shown, **Then** the package's
   infinite result is presented as firing indefinitely.
3. **Given** no powered distributor, **When** endurance is shown, **Then** the zero-capacity result
   is explained by that build state.
4. **Given** changed WEP pips, **When** the package recomputes endurance, **Then** all returned
   values identify the allocation used.

### Edge Cases

- Every weapon disabled produces genuine zero totals while keeping the fitted weapons visible.
- Anti-xeno and unclassified damage retain their package-defined meanings and are not folded into
  another type.
- Unlimited ammunition is described as such rather than assigned an invented capacity.
- Missing distributor power and infinite endurance are verdicts, not unavailable values.

## Requirements

### Functional Requirements

- **FR-001**: Every offence value and calculation MUST come directly from
  `@elite-dangerous-almanac/core`.
- **FR-002**: Whole-build presentation MUST use the burst and sustained `WeaponTotals` returned by
  `ShipLoadout.weaponMetrics()` without recalculating or resumming them.
- **FR-003**: Damage by type MUST show the package's returned amounts. The application MUST NOT
  calculate percentage shares or combine anti-xeno with conventional damage.
- **FR-004**: Every fitted weapon MUST remain listed with its slot, symbol, enabled state,
  ammunition result and returned `WeaponMetrics` fields.
- **FR-005**: Disabled weapons MUST remain visible and MUST be excluded only as the package excludes
  them from whole-build totals.
- **FR-006**: Missing damage, range, ammunition or piercing data MUST remain missing. The
  application MUST NOT infer one weapon field from another.
- **FR-007**: Weapons-capacitor presentation MUST use the capacity, recharge rate, sustained draw,
  net drain and time-to-drain returned by `weaponsCapacitorMetrics()` for the selected WEP pips.
- **FR-008**: The application MUST NOT calculate endurance from distributor capacity and weapon
  draw or apply its own pip-scaling rule.
- **FR-009**: Infinite endurance and zero capacity MUST be presented as semantic verdicts while
  retaining the build-state reason.
- **FR-010**: Per-weapon and damage-type detail MUST remain operable and readable at every supported
  viewport without horizontal page scrolling.

### Verification Requirements

- **FR-011**: Unit tests MUST compare whole-build and per-weapon output with `weaponMetrics()` across
  mixed damage, anti-xeno, unclassified, continuous-fire, disabled and no-weapon cases.
- **FR-012**: Unit tests MUST compare every endurance field with `weaponsCapacitorMetrics()` across
  WEP allocations and sustaining, draining and unpowered cases.
- **FR-013**: Tests MUST fail if a damage share, range aggregate, convergence value or locally
  calculated endurance is introduced.
- **FR-014**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Build offence**: The package's totals across enabled fitted weapons.
- **Fitted-weapon metric**: One weapon's package-resolved output, operating costs, ammunition and
  enabled state.
- **Capacitor endurance**: The package's WEP capacity, recharge, draw, drain and duration for a
  stated pip allocation.

## Almanac Coverage

`ShipLoadout.weaponMetrics()` supplies complete whole-build totals and per-weapon metrics, including
damage amounts by type, burst and sustained rates, energy, heat, power and ammunition.
`weaponsCapacitorMetrics()` supplies the complete pip-aware endurance result. Every number required
here is returned whole by the package.

## Success Criteria

- **SC-001**: Every offence value equals the corresponding Almanac field across the reference
  corpus.
- **SC-002**: No application-owned damage, falloff, convergence or capacitor calculation exists.
- **SC-003**: Disabled, absent, zero and infinite outcomes remain distinguishable and retain their
  correct meanings.
- **SC-004**: Changing WEP pips updates the returned endurance values within 100 ms.
- **SC-005**: The full area passes the required viewport, browser and accessibility test matrix
  without horizontal page scrolling.
