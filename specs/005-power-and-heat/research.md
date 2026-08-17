# Research: Power and Heat

## Package calculation boundary

**Decision**: Read the active build through
`ShipLoadout.powerBudget()`, `ShipLoadout.distributorMetrics()` and
`ShipLoadout.heatMetrics()` from the leaf
`@elite-dangerous-almanac/core/ships/ship-loadout` export. Preserve their
returned values and discriminants in one immutable, revision-stamped
presentation snapshot. Import result types from the `ships/power`,
`ships/distributor` and `ships/heat` leaves.

**Rationale**: The three build methods already resolve fitted articles,
engineering, enabled state, priorities and shedding. A single snapshot prevents
an edit or condition change from combining results from different revisions.
The installed package is ESM-only and exposes all three leaves.

**Alternatives considered**: Calling the data-free calculation functions with
application-assembled inputs was rejected because that would create a second
build calculation path. Importing the broad `ships` barrel was rejected by the
constitution's leaf-import rule.

## Per-module power projection — upstream blocker

**Decision**: Gate implementation on a released Almanac API that exposes every
fitted module's package-authored power projection, including exact slot and
symbol, post-engineering draw or unavailable state, enabled state, effective
one-based priority, and deployed-only state or unavailable state. The API must
include disabled entries as well as the enabled unknown entries already exposed
by `PowerBudget.unknownDraws`.

**Rationale**: `powerBudget()` returns plant capacity, state totals, five bands
and enabled unknown consumers, but not known consumers. Joining
`fittedModules()` to `effectiveStats.powerDraw` is insufficient. An unresolved
module may carry a journal `PowerDraw` modifier that the package applies to the
aggregate even though the fitted module's `effectiveStats` remains `null`.
Known deployed-only classification and effective priority are also produced by
the facade's private `powerConsumerFor` rules rather than returned publicly.
Reconstructing those facts in the application would violate FR-001 and
constitution principle II.

Minimal reproduction against `@elite-dangerous-almanac/core` 0.1.0-beta.12:

```ts
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

const source = ShipLoadout.default('SideWinder').toLoadoutEvent();
const modules = source.Modules.map((module) =>
  module.Slot === 'SmallHardpoint1'
    ? {
        ...module,
        Item: 'Unresolved_Test_Module',
        On: true,
        Priority: 4,
        Engineering: {
          Engineer: 'Unknown',
          EngineerID: 0,
          BlueprintID: 0,
          BlueprintName: 'Unknown',
          Level: 1,
          Quality: 1,
          Modifiers: [{ Label: 'PowerDraw', Value: 1.5 }],
        },
      }
    : module,
);
const build = ShipLoadout.fromLoadout({ ...source, Modules: modules });

build.powerBudget().bands[4]?.deployed; // includes 1.5 MW
build.powerBudget().unknownDraws; // []
build.fittedModuleAt('SmallHardpoint1')?.effectiveStats; // null
```

The exact 1.5 MW contribution is therefore present in the aggregate but absent
from every public per-module result. The package gap is filed as
[Elite-Dangerous-Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
and tracked downstream by
[ship-builder issue #13](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/issues/13).
Feature 005 must consume the released fix.

**Alternatives considered**: Parsing journal modifiers, cloning builds with one
module at a time, subtracting aggregates, copying `powerConsumerFor`, or deriving
deployment from category/slot/`alwaysPowered` were rejected. Each duplicates or
reverse-engineers package logic and fails for at least one unresolved or
future-package case.

## Selected power state

**Decision**: Select fields directly from `PowerBudget`:

| Selected state | Total       | Band draw        | Cumulative draw       | Powered                 |
| -------------- | ----------- | ---------------- | --------------------- | ----------------------- |
| deployed       | `deployed`  | `band.deployed`  | `band.deployedTotal`  | `band.poweredDeployed`  |
| retracted      | `retracted` | `band.retracted` | `band.retractedTotal` | `band.poweredRetracted` |

Render `headroom`, `utilisation` and `withinBudget` only when deployed is
selected.

**Rationale**: The package's three summary fields describe deployed hardpoints.
Selecting the named state fields is presentation, while calculating retracted
equivalents would invent unsupported results. All five bands remain visible,
including zero-draw bands.

**Alternatives considered**: Showing both states simultaneously was rejected by
FR-003. Calculating retracted headroom, utilisation or budget verdicts was
rejected by the spec's explicit Almanac limit.

## Unknown and disabled power consumers

**Decision**: When `unknownDraws` is non-empty, name every returned consumer and
mark every total, band value and package boolean as a lower-bound or
known-draw-only answer. Keep disabled entries in the future package per-module
projection, visibly disabled and outside the package totals exactly as returned.
Place unknown entries in a separate group before any optional descending sort
of known numeric draws.

**Rationale**: Enabled unknown draws are omitted from every package aggregate;
disabled unknowns are skipped before qualification. Sorting an unknown among
numbers claims an ordering the package does not know. Keeping exact slot keys
also supplies the required action target.

**Alternatives considered**: Treating unknown as zero, suppressing disabled
entries, applying an arbitrary sort position, or aggregating modules with the
same display name were rejected as dishonest or incompatible with exact-slot
navigation.

## Shared viewing conditions

**Decision**: Consume feature 003's in-memory `ViewingConditions` as the only
owner of hardpoint state and pip allocation. Its defaults are deployed and two
pips each; pips move in half steps, total six and never exceed four. Pass the
three values directly to `distributorMetrics()` and present the returned `pips`.

**Rationale**: These conditions affect several capabilities but are not build
state. The package accepts arbitrary fractional pips independently and does not
enforce the game's six-pip allocation, so feature 003 owns that input invariant;
feature 005 still presents only package-scaled recharge.

**Alternatives considered**: A second local selector, passing no options (which
defaults every capacitor independently to four), or persisting conditions in a
record, URL, SLEF or edit history were rejected as conflicting with feature 003.

## Distributor availability and zero

**Decision**: Model `distributorMetrics()` as `ready | unavailable`. In the ready
case, display capacity, rated four-pip recharge, actual recharge and returned
allocation for SYS, ENG and WEP. Preserve `null` as unavailable and zero recharge
as a real numeric zero.

**Rationale**: The package returns `null` when the distributor is missing,
disabled, unresolved or shed in the retracted budget. It supplies no structured
reason discriminator. Catalogue values would describe an article, not the
current powered build.

**Alternatives considered**: Falling back to catalogue capacities/recharge,
scaling rated recharge locally, or diagnosing a specific null cause from text
were rejected.

## Heat scenarios and qualifications

**Decision**: Display exactly the five returned scenarios in semantic order:
`idle`, `thrusters`, `fsdCharging`, `firingSustained`, `firingDrained`. For each,
preserve `thermalLoad`, `heatLevel`, `gauge`, `overheats` and
`secondsToOverheat`. Display plant efficiency, hull heat capacity and hull heat
dissipation from the same result. A non-empty `unknownDraws` list qualifies the
entire profile as a projection, neither an upper nor a lower bound.

**Rationale**: `heatMetrics()` already applies powered priority bands, plant
efficiency, thruster/FSD heat, weapon sustained heat and capacitor state. No
weapons still produces all five scenarios. Unknown power draws can make the
heat answer err in either direction because they affect both direct heat and
shedding.

**Alternatives considered**: Deriving a peak, hiding equal weapon scenarios,
adding shield-cell or heat-sink scenarios from the visual reference, or treating
projected heat as a lower bound were rejected because no such package result
exists.

## Null and infinite semantics

**Decision**: Convert package discriminants to field-specific semantic states
before localization. `heatMetrics() === null` and
`distributorMetrics() === null` mean the whole result is unavailable.
`HeatState.heatLevel` or `.gauge` equal to `Infinity` means the scenario does not
settle. `secondsToOverheat === null` means it never overheats. Infinite deployed
power utilisation means the build draws power with no available plant output.

**Rationale**: These are distinct package meanings. Generic `N/A`, a JSON
round-trip (which turns numeric infinity into `null`), or an unexplained infinity
glyph would lose them.

**Alternatives considered**: Clamping heat gauges, showing infinity as a large
percentage, formatting every null as unavailable, or serializing the
presentation snapshot were rejected.

## Exact-slot navigation

**Decision**: Emit `openSlot(slotKey)` with the original package/game key and
delegate to feature 002's selected-slot intent inside `/build`. Match a returned
unknown label to a known slot case-insensitively while retaining its original
spelling; unresolved original slots target feature 002's unresolved group.

**Rationale**: Package imports retain producer casing, and slot identity is not
positional. Feature 002 already owns the editable destination and selection
state; feature 005 should not add a route or duplicate the outfitting ledger.

**Alternatives considered**: Positional indices, parsing display names, or a
new module-detail route were rejected.

## Architecture and recomputation

**Decision**: Put package projection and semantic discriminants in a pure
`domain/power-heat` projector; combine active-build revision and shared
conditions in a computed signal facade under `application/power-heat`; keep all
components input/output only. Recompute the three methods once per relevant
settled revision or condition change.

**Rationale**: This preserves one active `ShipLoadout`, keeps logic render-free,
and satisfies feature 003's atomic-revision contract. The pinned corpus has 48
hulls and at most 39 package slots; a stock default has at most 21 fitted
modules. Local Node probes showed the package calls are far below the 100 ms
product target, though browser tests remain authoritative.

**Alternatives considered**: Component-owned calculations, a second build,
cached serialized metric results, and asynchronous workers were rejected as
unnecessary or state-duplicating.

## Responsive, accessible and localized presentation

**Decision**: Adapt the wide and narrow power hierarchy from `.design/Ship
Builder.dc.html` through feature 011 components and tokens. Wide layouts may use
fluid columns; narrow, 400%-zoom and expanded-text layouts stack the complete
priority, module, heat and distributor content. Every chart is supplementary to
semantic text. All application labels, qualifications and infinity phrases use
message keys; all numbers and units use active-locale formatters; game names use
Almanac localization with disclosed canonical fallback.

**Rationale**: The reference supplies useful hierarchy but abbreviates mobile
module draw to a top list, shows non-package heat summaries, uses whole-pip
blocks and carries meaning through color and hover. Those details conflict with
the spec and constitution. Feature 011 owns the shared components, dark tokens,
44 CSS-pixel touch targets, text expansion, RTL, reduced motion and accessibility
test harness.

**Alternatives considered**: Copying the reference markup/literals, using
bars without text, horizontal page scrolling, private game translations, or a
desktop-only table were rejected.

## Verification matrix

**Decision**: Unit-test exact projection equality and every discriminant; add
Playwright journeys for the three stories in Chromium and Firefox over desktop,
tablet/mobile portrait and landscape, with automated accessibility scans and
screen-reader semantic assertions. Retain the 80% thresholds and the 100 ms
settled-update target under mobile 4x CPU slowdown.

**Rationale**: Current `playwright.config.ts` has only three Chromium projects
and no automated accessibility scan, so feature 011 must close that repository
gap before feature 005 can ship. Tests must cover within/over budget, both
hardpoint states, unknown and disabled consumers, missing plant, distributor
null/zero pips, all heat scenarios, projection, infinity and exact-slot actions.

**Alternatives considered**: Chromium-only coverage, component snapshots alone,
skipped browser cases, or relaxing coverage thresholds were rejected.
