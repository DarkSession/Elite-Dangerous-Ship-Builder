# Distributor Metrics Contract

## Boundary

For one active build revision and one valid feature 003 `PipAllocation`, call:

```ts
build.distributorMetrics({
  systemsPips: allocation.systems,
  enginesPips: allocation.engines,
  weaponsPips: allocation.weapons,
});
```

The application never calls the standalone scaler and never calculates a
recharge rate.

## Result mapping

When the method returns a result, present three labelled capacitor groups in
SYS, ENG, WEP order. Each group copies:

| View field      | Package source                      |
| --------------- | ----------------------------------- |
| capacity        | matching capacitor `.capacity`      |
| rated recharge  | matching capacitor `.ratedRecharge` |
| actual recharge | matching capacitor `.rechargeRate`  |
| allocation used | matching `result.pips` field        |

The presentation must demonstrate that a pip change can alter actual recharge
while capacity remains the value returned by the package. It must not assert
that capacity changed or stayed equal by locally comparing/calculating it.

## Input invariant

Feature 003, not the Almanac call and not a feature 005 component, validates:

- finite half-pip steps;
- each allocation from zero through four;
- exactly six pips in total;
- default two each.

Feature 005 consumes only valid shared state. It does not persist, serialize or
add the state to edit history.

## Availability

`null` maps to one `unavailable` result with no capacitor figures. This covers
the package cases of a missing, disabled, unresolved or shed distributor, but
the UI does not claim a specific cause unless a separate structured package
result supplies it. Directly observable fitted-slot state may be shown as
separate context.

Prohibited fallbacks:

- catalogue capacity or recharge;
- fitted `effectiveStats` presented as a build result;
- local pip scaling;
- parsing a package diagnostic or module symbol;
- substituting zeros.

A returned zero capacity or recharge is a genuine numeric zero and remains
distinct from `null`.

## UI intent

```ts
setPips(allocation: PipAllocation)
```

The intent delegates to feature 003. One accepted allocation produces one
condition revision and one new atomic power/heat snapshot. It is not an
outfitting decision.

## Accessibility and localization

- The shared pip allocator exposes its visible label, each capacitor name,
  current value, constraints and validation relationship with native/shared
  control semantics and 44 CSS-pixel targets.
- Capacitor groups use headings or a definition structure; capacity, rated
  recharge, actual recharge and pips never depend on bar length or color.
- MJ, MJ/s and pip values use feature 011 locale formatters and translated unit
  labels.
- Unavailable and zero have distinct text and programmatic meaning.
- A settled allocation update is announced once; unchanged values are not
  redundantly announced.

## Required verification

- Exact equality with package SYS/ENG/WEP values and returned pips at zero,
  half and whole allocations.
- Genuine zero-pip recharge remains zero.
- Capacity is not replaced or transformed when pips change.
- Every package `null` context renders unavailable with no catalogue number.
- Invalid total/step/range states are rejected at the shared feature 003
  boundary before the package call.
- Viewing changes enter no storage, history, URL or export.
