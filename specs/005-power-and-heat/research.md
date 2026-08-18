# Research: Power and Heat

## Package boundary and leaf imports

**Decision**: Pin implementation to the installed
`@elite-dangerous-almanac/core@0.1.2` facade methods:
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

## Field-specific unknown qualification

**Decision**: Treat `budget.unknownDraws` as the sole aggregate
qualification source:

- `available` remains exact;
- selected draw, band draw/cumulative draw and deployed utilisation are lower
  bounds;
- deployed headroom is labelled as headroom for known draws, not as a complete
  value or lower bound;
- `withinBudget` and band powered states are known-draw-only verdicts;
- every returned unknown label remains visible.

**Rationale**: Enabled unknown draws are omitted from all package totals.
Consequently draw/utilisation read low, headroom reads too favourably and
booleans answer only for known consumers. A single generic “lower bound” badge
would misdescribe headroom and verdicts.

**Alternatives considered**: Treating unknown as zero, qualifying plant
capacity, calling headroom a lower bound or replacing package booleans with
locally calculated uncertainty were rejected.

## Per-module power projection

**Decision**: Project `PowerBudget.consumers` directly. One
`PowerConsumerResult` becomes one module row with its returned slot label,
symbol, post-engineering draw or null, enabled state, normalized one-based
priority and deployed-only state. Place null draws outside optional descending
numeric ordering. Preserve source order as the stable tie break. Test the
`ShipLoadout` invariant that every participating consumer supplies label and
symbol; a missing exact slot is a package-contract failure, never an inferred
target.

**Rationale**: The result includes positive or unknown participating modules,
including disabled ones; passive and zero-draw fittings are intentionally
absent. A disabled null-draw consumer remains visible but is not in
`unknownDraws`, so it does not qualify totals. The exact returned label is the
only safe slot action identity.

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
missing capacitor facts or retracted priority shedding. Conversely, an
unresolved catalogue entry can still return a ready result if its journal
modifiers supply every required value. Only the returned null is authoritative.

**Alternatives considered**: Local recharge scaling, catalogue figures,
effective-stat fallback, symbol parsing and inferred null causes were rejected.

## Specification terminology at package boundaries

**Decision**: Resolve two scenario phrases through their normative package
fields:

- “Disabled modules remain visible” means every disabled power participant
  returned in `PowerBudget.consumers`. Passive and zero-draw fittings are
  intentionally absent from that package result and have no contribution row.
- An “unresolved distributor” is unavailable when its required build metrics
  remain unresolved and `distributorMetrics()` returns null. An unknown
  catalogue identity whose journal data lets the package return a non-null
  result is ready; the application does not override it.

**Rationale**: FR-001, FR-005, FR-008 and the Almanac Coverage section make
returned facade fields the normative boundary. This interpretation preserves
every package result without inventing catalogue rows or replacing a ready
build calculation with a diagnosis based on identity resolution.

**Alternatives considered**: Adding every disabled fitted module to the power
manifest or forcing every catalogue-unknown distributor to unavailable were
rejected because both contradict the facade result.

## Heat mapping and semantic values

**Decision**: A ready `heatMetrics()` result copies plant efficiency, hull
heat capacity/dissipation and exactly these five scenarios in order:
`idle`, `thrusters`, `fsdCharging`, `firingSustained`,
`firingDrained`. Each preserves `thermalLoad`, `heatLevel`, `gauge`,
`overheats` and `secondsToOverheat`. Package null is unavailable. Copy both qualification lists:

- non-empty `unknownDraws` makes the complete profile a non-directional projection;
- non-empty `unknownWeaponHeat` qualifies only `firingSustained` and `firingDrained`; taken alone,
  their thermal loads are lower bounds, but their other results are incomplete rather than bounded;
- when both lists are non-empty, no directional bound holds for the firing scenarios.

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

## Released Almanac heat qualification

**Decision**: Consume Almanac 0.1.2's `HeatMetrics.unknownWeaponHeat` result, released for
[Almanac #329](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/329). It truthfully
qualifies a catalogue-unknown weapon whose power draw is recoverable but whose weapon heat is not.
The application copies this package field and does not create a local detector.

Historical minimal reproduction against 0.1.1:

```ts
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

const source = ShipLoadout.default('SideWinder').toLoadoutEvent();
const build = ShipLoadout.fromLoadout({
  ...source,
  Modules: source.Modules.map((module) =>
    module.Slot === 'SmallHardpoint1'
      ? {
          ...module,
          Item: 'Unresolved_Test_Weapon',
          Engineering: {
            BlueprintName: 'Unknown',
            Level: 1,
            Quality: 1,
            Modifiers: [
              { Label: 'PowerDraw', Value: 0.2 },
              { Label: 'ThermalLoad', Value: 20 },
              { Label: 'DistributorDraw', Value: 2 },
            ],
          },
        }
      : module,
  ),
});

build.powerBudget().consumers.find(({ label }) => label === 'SmallHardpoint1');
// draw: 0.2, deployedOnly: true

build.powerBudget().unknownDraws; // []
build.heatMetrics()?.unknownDraws; // [] — incorrectly appears complete
```

Against pinned 0.1.2, changing or removing the supplied thermal modifier still leaves the returned
firing heat unchanged because the unresolved article is omitted as a weapon, but
`heatMetrics()?.unknownWeaponHeat` is now `['SmallHardpoint1']`. `unknownDraws` correctly remains
empty because the power draw is known.

**Rationale**: The new field distinguishes unknown weapon heat from unknown power draw and identifies
the affected firing scenarios without qualifying the unaffected idle, thruster or FSD scenarios.

**Alternatives considered**: Inspecting `validation`, hardpoint slot syntax or
journal `ThermalLoad`/power modifiers locally; adding a warning for every
unresolved module; or suppressing heat whenever validation is incomplete were
rejected as application-side correction or fabricated diagnosis.

## Revision architecture and consumer ports

**Decision**: Build a pure projection from feature 003's
`StatusRevisionContext`, then expose:

1. a detailed `PowerHeatSnapshot`;
2. `PowerStatusProvider` with selected draw/capacity and exact owner
   qualification for feature 003; and
3. `HardpointPowerObservationPort` that selects returned consumer/band fields
   for feature 010.

Use computed signals/memoization keyed by build and condition revision. Outer
detail lifecycle is `noBuild | pending | ready | failure`; distributor/heat
unavailability remains data inside a ready snapshot.

**Rationale**: This keeps calculations render-free, prevents mixed revisions
and gives cross-feature consumers owner-authored power semantics. Feature 003
requires a synchronous revision-stamped provider; feature 010 must not
reconstruct shedding.

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

**Decision**: Unit-test exact package field equality, all qualification and
sentinel unions, revision matching and both integration ports. Add Playwright journeys for all three stories in feature 011's
ten-project matrix with automated axe checks and manual screen-reader/zoom
protocols.

**Rationale**: The current repository has only three Chromium projects and no
axe harness. Feature 011 must close that shared gap; feature 005 must not create
a smaller local matrix.

**Alternatives considered**: Chromium-only coverage, component snapshots
without package equality, skipped blocker cases or relaxed coverage gates were
rejected.
