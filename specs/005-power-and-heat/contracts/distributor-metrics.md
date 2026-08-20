# Distributor Metrics Contract

## Boundary

Feature 003 owns settled pips as integer half-pips. For one captured revision
pair, feature 005 divides each by two exactly once and calls:

```ts
const options: DistributorOptions = {
  systemsPips: conditions.pips.systems / 2,
  enginesPips: conditions.pips.engines / 2,
  weaponsPips: conditions.pips.weapons / 2,
};

const result = loadout.distributorMetrics(options);
```

Use `DistributorOptions` from
`@elite-dangerous-almanac/core/ships/ship-loadout` and result types from
`@elite-dangerous-almanac/core/ships/distributor`. The application never
calls the standalone calculator or recharge scaler.

## Input ownership

Feature 003 validates and settles one complete draft:

- integer half-pips `0..8` for SYS, ENG and WEP;
- total exactly 12 half-pips;
- default `4/4/4` half-pips (displayed as `2/2/2`);
- one condition revision for one changed Apply;
- no automatic redistribution.

Feature 005 accepts only settled state. It does not validate a second tuple or
persist pips.

## Ready mapping

When the package returns a result, present SYS, ENG and WEP in that order:

| View field      | Package source                      |
| --------------- | ----------------------------------- |
| capacity        | matching capacitor `.capacity`      |
| rated recharge  | matching capacitor `.ratedRecharge` |
| actual recharge | matching capacitor `.rechargeRate`  |
| allocation used | matching `result.pips` field        |

All figures are copied. A pip change may alter actual recharge; the application
does not compute or assert a capacity transformation.

## Availability and zero

`null` maps to one `unavailable` result with no capacitor figures. Null alone
does not authorize a cause-specific diagnosis: it may reflect an absent,
disabled, package-incomplete or retracted-shed distributor. Unknown catalogue identities have
no supported ingress representation and never reach this boundary.

Prohibited fallbacks:

- catalogue capacity or recharge;
- fitted effective stats presented as the build result;
- local pip scaling;
- symbol/diagnostic parsing;
- substituted zeros.

A returned zero capacity or recharge is genuine ready data.

## UI intent

Feature 005 reuses feature 003's
`editViewingConditions | applyViewingConditions | resetViewingConditions`
intents. Invalid draft Apply retains the previous settled result and revision.
No condition enters persistence, history, URL, link or SLEF.

## Accessibility and localization

- The shared controls expose capacitor names, draft values, six-pip total,
  errors and Apply/Reset relationships with shared semantic controls and
  target-size tokens.
- Capacitor groups expose capacity, rated recharge, actual recharge and
  returned pips as labelled text at every size.
- MJ, MJ/s and pip values use active-locale formatters.
- Zero and unavailable have distinct visual and programmatic meaning.
- One accepted change receives one coalesced polite announcement; unchanged
  values are not repeated.

## Required verification

- Exact SYS/ENG/WEP equality at zero, half and whole displayed pip values.
- Integer half-pips divide by two only at the package boundary.
- Zero-pip recharge remains numeric zero.
- Every package null renders unavailable without catalogue values or inferred
  cause.
- Invalid draft values never call the package or advance conditions revision.
- Rapid revision changes never publish stale returned pips or capacitor values.
