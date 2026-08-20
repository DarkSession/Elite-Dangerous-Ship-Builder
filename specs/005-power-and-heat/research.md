# Research: Power and Heat

## Package boundary and leaf imports

**Decision**: Consume and characterize the installed
`@elite-dangerous-almanac/core` facade methods:
`ShipLoadout.powerBudget()`, `distributorMetrics()` and `heatMetrics()`.
Import `ShipLoadout` and `DistributorOptions` from
`@elite-dangerous-almanac/core/ships/ship-loadout`; result types from
`ships/power`, `ships/distributor` and `ships/heat`; and game-text helpers
through feature 011 from the package's `i18n/modules` and `i18n/slots`
leaves.

**Rationale**: The facade already resolves the active loadout, engineering,
module state, priority shedding and fixed heat scenarios. The package is
ESM-only and exposes all required leaf paths.

**Alternatives considered**: Standalone `powerBudget`,
`distributorMetrics` or `heatMetrics` calls with application-assembled
inputs were rejected because they would create a second calculation path. The
broad `ships` barrel was rejected by the constitution's leaf-import rule.

## Selected power fields

**Decision**: Select fields without arithmetic:

| Selected state | Total              | Band draw        | Cumulative draw       | Band verdict            |
| -------------- | ------------------ | ---------------- | --------------------- | ----------------------- |
| deployed       | `budget.deployed`  | `band.deployed`  | `band.deployedTotal`  | `band.poweredDeployed`  |
| retracted      | `budget.retracted` | `band.retracted` | `band.retractedTotal` | `band.poweredRetracted` |

Always copy `available`. Show `headroom`, `utilisation` and
`withinBudget` only for deployed.

**Rationale**: Those three summary fields describe deployed hardpoints. The
package exposes no retracted equivalents, while all five bands expose both
states.

**Alternatives considered**: Showing both states simultaneously conflicts with
FR-003. Subtracting or dividing to create retracted summaries conflicts with
FR-001/FR-002 and the current Almanac limit.

## Exact power figures

**Decision**: Present every `powerBudget()` figure — capacity, selected draw, band draw and
cumulative draw, headroom, utilisation, `withinBudget` and the band powered states — as the exact
package value, with no bound, projection or qualification attached.

**Rationale**: Every consumer the package returns carries a resolved draw, so each total answers for
the whole build. A badge qualifying an exact figure would misdescribe it.

**Alternatives considered**: Attaching a defensive qualification label to an exact figure, or
replacing package booleans with locally calculated uncertainty, were rejected.

## Per-module power projection

**Decision**: Project `PowerBudget.consumers` directly. One
`PowerConsumerResult` becomes one module row with its returned slot label,
symbol, post-engineering draw, enabled state, normalized one-based
priority and deployed-only state. Ordering by draw descending is optional, with
source order as the stable tie break. Test the
`ShipLoadout` invariant that every participating consumer supplies label and
symbol; a missing exact slot is a package-contract failure, never an inferred
target.

**Rationale**: The result includes every participating module with a positive draw,
including disabled ones; passive and zero-draw fittings are intentionally
absent. A disabled consumer remains visible and contributes exactly as reported.
The exact returned label is the only safe slot action identity.

**Alternatives considered**: Joining `fittedModules()` to effective stats,
reading journal modifiers, subtracting aggregate budgets, grouping identical
symbols, parsing display names or targeting by position were rejected.

## Shared viewing conditions and pip conversion

**Decision**: Consume feature 003's settled `ViewingConditions` and
`conditionsRevision`. It stores each capacitor as integer half-pips
`0..8`, totals 12 and defaults to `4/4/4`. Divide each by two exactly once at
the `ShipLoadout.distributorMetrics()` call boundary. Reuse feature 003's
draft/Apply/Reset controls; feature 005 owns no parallel state or validation.

**Rationale**: The Almanac accepts independent fractional values from zero
through four and does not enforce the game's six-pip total. Feature 003 owns
that product invariant and the atomic condition revision.

**Alternatives considered**: Storing pips as application floats, calling the
package with its independent four-pip defaults, automatically redistributing
pips or persisting conditions were rejected.

## Distributor availability and zero

**Decision**: Model `distributorMetrics()` as `ready | unavailable`. A ready
result copies returned pips plus capacity, rated recharge and actual recharge
for SYS, ENG and WEP. Package null remains unavailable without a cause-specific
diagnosis or catalogue fallback; returned zero remains numeric zero.

**Rationale**: Null can represent no recognized distributor, disabled state,
missing capacitor facts or retracted priority shedding. Only the returned null is authoritative;
unsupported module identities are outside the ingress contract.

**Alternatives considered**: Local recharge scaling, catalogue figures,
effective-stat fallback, symbol parsing and inferred null causes were rejected.

## Specification terminology at package boundaries

**Decision**: Resolve two scenario phrases through their normative package
fields:

- “Disabled modules remain visible” means every disabled power participant
  returned in `PowerBudget.consumers`. Passive and zero-draw fittings are
  intentionally absent from that package result and have no contribution row.
- A “package-incomplete distributor” is unavailable when its required build metrics remain
  unavailable and `distributorMetrics()` returns null. The calculation surface receives only
  package-resolved fitted identities from supported ingress.

**Rationale**: FR-001, FR-005, FR-008 and the Almanac Coverage section make
returned facade fields the normative boundary. This interpretation preserves
every package result without inventing catalogue rows or replacing a ready
build calculation with a diagnosis based on identity resolution.

**Alternatives considered**: Adding every disabled fitted module to the power
manifest or diagnosing package null locally were rejected because both contradict the facade result.

## Heat mapping and semantic values

**Decision**: A ready `heatMetrics()` result copies plant efficiency, hull
heat capacity/dissipation and exactly these five scenarios in order:
`idle`, `thrusters`, `fsdCharging`, `firingSustained`,
`firingDrained`. Each preserves `thermalLoad`, `heatLevel`, `gauge`,
`overheats` and `secondsToOverheat`. Package null is unavailable; a ready profile is a complete
answer for the build.

Convert only sentinel meaning for presentation:

- infinite heat level or gauge → does not settle;
- null seconds to overheat → never overheats;
- infinite deployed utilisation → draw with zero available plant output.

**Rationale**: The build facade already applies plant efficiency, powered
priority bands, thruster/FSD heat, sustained weapon heat and capacitor state.
Heat accepts no viewing-condition options. A no-weapons build still returns all
five scenarios.

**Alternatives considered**: Peaks, shield-cell, heat-sink or alpha summaries
from `.design`; clamping infinity; generic “N/A”; JSON cloning; or hiding
equal scenarios were rejected.

## Revision architecture and consumer ports

**Decision**: Build a pure projection from feature 003's
`StatusRevisionContext`, then expose:

1. a detailed `PowerHeatSnapshot`;
2. `PowerStatusProvider` with selected draw and capacity for feature 003; and
3. a feature-005-owned generalized `MountPowerObservationPort` that accepts any
   exact package slot key and selects returned consumer/band fields for feature
   010's hardpoints/utilities and feature 007's distributor core slot.

Use computed signals/memoization keyed by build and condition revision. Outer
detail lifecycle is `noBuild | pending | ready | failure`; distributor/heat
unavailability remains data inside a ready snapshot.

**Rationale**: This keeps calculations render-free, prevents mixed revisions
and gives cross-feature consumers owner-authored power semantics. Feature 003
requires a synchronous revision-stamped provider; features 007 and 010 must not
reconstruct power applicability, priority or shedding.

**Alternatives considered**: Component calls, independently settled unversioned
stores, a second loadout, persisted metric caches or duplicated feature
003/010 calculations were rejected.

## Design, responsive, accessibility and localization

**Decision**: Adapt only the hierarchy of `.design` canvases 1c/1d through
feature 011. Wide layouts may use fluid columns; tablet, narrow, landscape phone
and 400%-zoom layouts stack every complete field. Charts remain optional
supplements to semantic text. All owned strings and sentinel phrases use
messages; numbers/units use active-locale formatters; module/slot text uses
Almanac localization with disclosed canonical fallback.

**Rationale**: The reference contains useful adjacency and dark-theme direction
but only desktop/mobile samples, hard-coded English/literals, tiny div controls,
hover meanings, four power groups, incomplete mobile data and unsupported heat
content.

**Alternatives considered**: Copying the HTML/CSS, truncating mobile content,
color-only bars, remote fonts/assets, page overflow, a feature-local theme or
private game translations were rejected.

## Verification

**Decision**: Unit-test exact package field equality, every sentinel union,
revision matching and both integration ports. Add Playwright journeys for all three stories in feature 011's
ten-project matrix with automated axe checks and manual screen-reader/zoom
protocols.

**Rationale**: Feature 011 owns the shared browser/accessibility harness; feature 005 must consume
the complete matrix rather than create a smaller local one.

**Alternatives considered**: Chromium-only coverage, component snapshots
without package equality, skipped blocker cases or relaxed coverage gates were
rejected.
