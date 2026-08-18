# Mass and Capacity Contract

## Aggregate package boundary

Read these properties exactly once per build revision:

| Projection     | Package source        | Complete value                   |
| -------------- | --------------------- | -------------------------------- |
| unladen mass   | `unladenMassResult`   | tonnes                           |
| fuel capacity  | `fuelCapacityResult`  | exact `{ main, reserve }` tonnes |
| cargo capacity | `cargoCapacityResult` | tonnes                           |

Each property remains its own `CalculationResult`; one incomplete aggregate does not erase another
complete result.

## Diagnostic preservation

An incomplete result retains every issue in package order with exact:

- `field`;
- optional `slot`;
- optional `symbol`;
- canonical `message`;
- optional `params`.

The presenter does not parse, merge, deduplicate or privately translate diagnostics. It requests
Almanac localization through feature 011 and shows the shared canonical-language disclosure when the
active locale is unavailable.

Complete zero is never treated as missing:

- no cargo rack is complete zero cargo;
- no main tank is complete zero main capacity when the reserve is known;
- a zero-mass fitted article is ready zero module mass.

## Per-module mass boundary

Enumerate package fitted snapshots once. Every fitted module creates one projection with:

- exact original slot key;
- exact symbol;
- package game name;
- exact post-engineering `effectiveStats.mass`, or unavailable when it is absent/unresolved.

Duplicate module symbols in separate slots remain separate entries. Presentation may order entries,
but it must not drop, group, add, subtract or re-sum them. `unladenMassResult` is the only aggregate
mass source.

Raw journal modifiers and catalogue base mass are prohibited fallbacks. An unknown module mass stays
unavailable and any package aggregate dependency stays incomplete.

## Relationship to jump and mobility

- All three aggregate results are collected before dependent jump/mobility calls.
- Jump summary requires complete mass, fuel and cargo results.
- Mobility requires complete mass and the capacities used by the selected standard load.
- Issues remain visible in the mass/capacity region even when another independent package result is
  ready.
- No diagnostic result is mutated to make a dependent method callable.

## Exact-slot integration

If a module row exposes a navigation action, it emits the original slot key to feature 002. The
action changes no build value and does not imply that the module row contributed a locally calculated
subtotal.

## Revision and failure behavior

Aggregate and module entries belong to one captured build revision. A build edit, engineering change,
undo/redo or replacement invalidates the entire old collection. A stale projection is discarded;
unexpected current-revision failure shows no relabelled old values.

## Verification

Contract tests deep-compare all complete results and structured issues with the package, prove unknown
mass prevents dependent calls, verify engineered mass changes through `effectiveStats`, cover zero
mass/fuel/cargo and duplicate symbols in distinct slots, and statically reject any module-mass sum or
raw modifier resolution in feature 008.
