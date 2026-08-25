# Status Projection Contract

## Ownership

Feature 003 owns the provider envelope and atomic composition. It does not own the five provider
values:

| Adapter                    | Implementer | Status contribution                                |
| -------------------------- | ----------- | -------------------------------------------------- |
| power status adapter       | 005         | selected draw and capacity                         |
| defence status adapter     | 006         | shield strength and armour                         |
| offence status adapter     | 007         | sustained DPS with package-native firing meaning   |
| mobility status adapter    | 008         | selected jump, selected top speed and unladen mass |
| `AssemblyRequirementsPort` | 009         | credits, conditional Merc Coin and materials       |

Contract-first delivery is explicit:

1. Feature 003 exports only the generic `StatusProvider<T, I>` envelope, fixed summary identities,
   conditions/targets and generic `AssemblyRequirementsPort<T>` in its first stage.
2. Each area feature updates its own contract to export its exact status projection type and adapter
   using that envelope. Feature 009 retains its already accepted `AssemblyRequirementsPort` name.
3. Feature 003 defines the concrete provider bundle only after all five owner types exist.

Each area owns its concrete projection, including all numeric, unavailable, qualified, infinite and
absent semantics. Feature 003 may format or place it but may not reclassify it.

## Synchronous transaction

`composeStatusProjection` follows this exact transaction:

1. Capture feature 001's atomic active `{ loadout, buildRevision }` once; feature 002 advances that
   same revision for committed edits.
2. Capture the settled `{ conditions, conditionsRevision }` once.
3. Read `loadout.validation()` once and align slot targets without changing an issue.
4. Invoke every provider synchronously with that exact immutable context.
5. If any provider explicitly returns pending for the captured pair, return pending and publish no
   partial status projection. If a ready envelope returns another revision pair, return application
   failure `projectionFailed`; a ready mismatch is an integration-contract violation, not in-flight
   work.
6. If all providers are ready and matching, validate and concatenate their owner-supplied qualified
   summary identities, derive the count and construct one immutable `StatusProjection`.
7. Confirm the active build and settled conditions still carry the captured revision pair, then
   publish in one signal assignment; otherwise discard the result.

A provider may share a pure projector with its detailed capability. It may not expose an
independently settled unversioned store to this transaction.

## Exact source matrix

The provider implementations, not feature 003, own these package calls:

| Visible result               | Owner/package source                                       | Feature 003 rule                            |
| ---------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| Validity/completeness/issues | exact `ShipLoadout.validation()`                           | retain object/order; no provider            |
| Power                        | 005: `powerBudget()`                                       | copy selected owner projection unchanged    |
| Shield                       | 006: `shieldMetricsResult()`                               | copy owner state/value unchanged            |
| Armour                       | 006: `armourMetrics().hitPoints`                           | copy owner value unchanged                  |
| Sustained DPS                | 007: `weaponMetrics().total.sustainedDamagePerSecond`      | never zero/suppress for retracted selection |
| Jump                         | 008: guarded `jumpRangeSummary()` selected field           | never call throwing API in 003              |
| Speed                        | 008: `mobilityCapacitorMetricsResult()` with load/ENG pips | copy owner state/value unchanged            |
| Mass                         | 008: `unladenMassResult`                                   | retain fixed unladen meaning                |
| Retail/Merc Coin/materials   | 009 package projection                                     | consume the same immutable area projection  |

All implementation imports use leaf subpaths.

## Provider semantic rules

- A provider-returned numeric zero remains its owner-authored exact zero.
- Package incomplete/unavailable results retain their full ordered structured issues.
- Package infinity retains the field-specific meaning defined by the owner capability.
- 003 does not independently label power headroom or booleans.
- Retracted power omits deployed-only summaries rather than deriving replacements.
- Sustained DPS is the package firing result because `weaponMetrics()` has no hardpoint-state input.
- Merc Coin absence remains feature 009's `absent` state and is never converted to numeric zero.
- Structural invalidity/incompleteness does not hide a provider value the package still produced.

## Package diagnostics

Structural issues retain the exact `LoadoutIssue` object. Area provider issues retain their owning
`CalculationIssue` or other package structures. Presentation uses feature 011's adapters over the
Almanac diagnostic locale helpers. Feature 003 never parses canonical prose or supplies private game
translations.

## Pending and failures

Package-unavailable calculations are ready provider values with explicit owner state; they do not
make the composition pending or failed.

Pending is reserved for a current provider implementation/code-loading boundary that cannot yet
return the captured revision. A ready revision mismatch or unexpected thrown provider/composition
error creates application failure key `projectionFailed`; an absent registered provider creates
`providerUnavailable`. Neither state invents a game diagnosis or destroys the active build. Stale
figures remain associated only with their original revision and are not relabelled.

## Qualification summary identities

Each owner returns only the identities allocated to it. It includes an identity once when that
visible Status summary is qualified, incomplete or unavailable under the owner's accepted semantic
contract. Nested issues do not add identities, and feature 003 never infers qualification from a
number or diagnostic.

| Owner | Allowed identity or identities           |
| ----- | ---------------------------------------- |
| 006   | `shieldStrength`                         |
| 007   | `sustainedDps`                           |
| 008   | `jumpRange`, `topSpeed`, `unladenMass`   |
| 009   | `retailCredits`, `mercCoin`, `materials` |

Feature 009 does not include `mercCoin` when that summary is owner-authored `absent`. Feature 003
rejects duplicate or foreign identities as `projectionFailed`, concatenates the valid unique list in
the table order and derives `qualifiedSummaryCount` from its length.

## Verification

Contract tests use spies for all providers and prove:

- one identical context reaches every port;
- validation is read once and issues retain reference/order/params;
- an explicit pending port prevents ready publication, while a ready mismatch fails projection;
- every owner projection and valid qualification identity passes through unchanged;
- duplicate/foreign qualification identities fail projection and an absent Merc Coin summary does
  not count;
- retracted selection does not alter returned sustained DPS;
- a newer revision discards an older result;
- one signal assignment exposes a ready projection.
