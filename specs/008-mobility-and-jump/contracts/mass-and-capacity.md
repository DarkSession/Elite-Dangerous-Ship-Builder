# Mass and Capacity Contract

## Aggregate package boundary

Read these package properties exactly once per captured build revision:

| Capability value | Package source        | Complete value                   |
| ---------------- | --------------------- | -------------------------------- |
| unladen mass     | `unladenMassResult`   | tonnes                           |
| fuel capacity    | `fuelCapacityResult`  | exact `{ main, reserve }` tonnes |
| cargo capacity   | `cargoCapacityResult` | tonnes                           |

Keep each exact `CalculationResult` independently. One incomplete result does not hide another
complete result. Complete numeric zero remains numeric zero.

## Diagnostic preservation

Every incomplete result retains the complete package issue object and order: required `field`,
`reason`, `message`, optional `slot`, `symbol` and `params`. The presenter requests Almanac's locale
message and uses feature 011's canonical fallback disclosure; it never parses, merges, deduplicates
or privately translates diagnostic prose.

Examples of valid complete zero include no cargo rack (`cargoCapacity: 0`), no main tank with known
hull reserve (`main: 0`) and a zero-mass fitted article.

## Per-module mass boundary

Map `fittedModules()` once. Every fitted snapshot creates one entry containing:

- exact original `slot` key;
- exact module `symbol`; and
- exact post-engineering `effectiveStats.mass`, or explicit unavailable when effective stats/mass
  are absent.

Resolve module and slot display text through Almanac locale helpers in the presenter. Do not treat
`effectiveStats.name` as localized text.

Duplicate symbols in different slots remain distinct. Package order is the default presentation
order. If a module row exposes navigation, it emits the unchanged slot key through the shared
workspace target and feature 002 owns the reveal/edit action.

## Aggregate/row independence

Never sum, group, subtract or reconcile module rows. `unladenMassResult` is the only aggregate source.
Raw journal modifiers and catalogue base mass are prohibited fallbacks.

An imported build may carry a complete package-trusted `UnladenMass` while a resolved fitted module
has unavailable row mass. Preserve both package outcomes. Unsupported module identities are
outside the supported ingress contract; the application never overrides a package-supplied complete
aggregate.

## Relationship to dependent calls

- All aggregate results remain visible whether or not another calculation can run.
- Jump is called only when all three aggregate and all three standard-load results are complete.
- Mobility is called only when unladen mass and its selected standard-load result are complete.
- No issue/result is changed to make a dependent method callable.

## Verification

Tests deep-compare the three package results and every issue/order, cover complete zero and incomplete
states, verify engineered/zero/unavailable row mass, duplicate symbols in distinct slots, package-
trusted aggregate plus unavailable row, and exact-slot intent. Static review rejects any module-mass
sum or raw modifier resolution in feature 008.
