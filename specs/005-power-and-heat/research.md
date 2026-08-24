# Research: Power and Heat

> **Amended 2026-08-24 (wave 13).** Three of the conclusions below were overturned by the artboard
> itself: the deployed-only summaries are drawn nowhere and are no longer read; the revision
> architecture and its consumer ports are withdrawn along with the store and the mount overlay; and
> the shield cell bank, resting/peak heat and heat sinks the design draws are stated from package
> results rather than refused. Each is marked in place. See
> [design/reference-review.md](./design/reference-review.md), waves 12 and 13.

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

Always copy `available`.

**Overturned in wave 13**: `headroom`, `utilisation` and `withinBudget` are not read in either
state. Neither canvas draws a headroom figure, a utilisation percentage or a within-budget verdict,
so the question of a retracted equivalent never arises — and the package's infinite utilisation on a
plant of zero never has to be worded. What the canvas draws instead, and what is now selected, is
each group's share of plant output and the powered/unpowered split of the draw.

**Rationale**: Those three summary fields describe deployed hardpoints, and the package exposes no
retracted equivalents, while every band exposes both states.

**Alternatives considered**: Showing both states simultaneously conflicts with
FR-003. Subtracting or dividing to create retracted summaries conflicts with
FR-001/FR-002 and the current Almanac limit.

## Exact power figures

**Decision**: Present every `powerBudget()` figure it draws — capacity, selected draw, each group's
own and cumulative draw and each group's powered state — as the exact package value, with no bound,
projection or qualification attached.

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
`idle`, `thrusters`, `fsdCharging`, `firingDrained`,
`firingSustained`. Each preserves `thermalLoad`, `heatLevel`, `gauge`,
`overheats` and `secondsToOverheat`. Package null is unavailable; a ready profile is a complete
answer for the build.

Convert only sentinel meaning for presentation:

- infinite heat level or gauge → does not settle;
- null seconds to overheat → never overheats.

**Rationale**: The build facade already applies plant efficiency, powered
priority bands, thruster/FSD heat, sustained weapon heat and capacitor state.
Heat accepts no viewing-condition options. A no-weapons build still returns all
five scenarios.

**Overturned in wave 13** for three of them: the canvases draw `RESTING HEAT` (the `idle` gauge),
`PEAK SUSTAINED` (the hottest bar drawn beside it), `HEAT SINKS` (counted from `fittedModules()`,
because `heatMetrics()` models no sink) and a sixth `Shield cell bank` bar the package's own
documented remedy assembles from published figures. Each has a source; each is drawn.

**Alternatives considered**: Alpha and WEP-net summaries from `.design`, which have no package
result behind them; clamping infinity; generic “N/A”; JSON cloning; or hiding equal scenarios were
rejected.

## Revision architecture and consumer ports

**Withdrawn in waves 12 and 13.** Feature 003's ruling B removed the provider envelope and its
revision context; wave 13 removed the mount overlay and with it the observation index and port. What
is left is one pure synchronous function over a loadout that is already in memory, memoized by the
signal graph — no store, no cache, no revision key, no lifecycle and no failure state. Package
`null` remains data rather than an error.

**Rationale**: The three package calls are synchronous and the loadout is already resolved, so
nothing here has a lifecycle to stamp. One projection read directly by the two surfaces that draw it
cannot go out of step with itself.

**Alternatives considered**: The revision-stamped store, the status provider and the observation
port above, each rejected once the surfaces that needed them were withdrawn.

## Design, responsive, accessibility and localization

**Decision**: Adapt only the hierarchy of `.design` canvases 1c/1d through
feature 011. Wide layouts may use fluid columns; tablet, narrow, landscape phone
and 400%-zoom layouts stack every complete field. Charts remain optional
supplements to semantic text. All owned strings and sentinel phrases use
messages; numbers/units use active-locale formatters; module/slot text uses
Almanac localization with disclosed canonical fallback.

**Overturned in wave 13**: the canvases are the template, not a source of "hierarchy" to adapt.
Their blocks, their order and their contents are what is built; what is not copied is their sample
data, their hard-coded English and their dead markup — the `data-anat-layer="power"` overlay their
own switching script never shows.

**Rationale**: The reference carries the dark-theme direction, the block structure and the readings
each block states. Its sample numbers are a screenshot of one build, not a game-data contract.

**Alternatives considered**: Copying the HTML/CSS, truncating mobile content,
color-only bars, remote fonts/assets, page overflow, a feature-local theme or
private game translations were rejected.

## Verification

**Decision**: Unit-test exact package field equality and every sentinel union. Add Playwright
journeys for all three stories in feature 011's
ten-project matrix with automated axe checks and manual screen-reader/zoom
protocols.

**Rationale**: Feature 011 owns the shared browser/accessibility harness; feature 005 must consume
the complete matrix rather than create a smaller local one.

**Alternatives considered**: Chromium-only coverage, component snapshots
without package equality, skipped blocker cases or relaxed coverage gates were
rejected.
