# Research: Defence Profile

Research used the accepted feature specs, constitution, `.design/Ship Builder.dc.html`, the
current source/tooling configuration and the installed public contracts and runtime behavior of
`@elite-dangerous-almanac/core`. Runtime probes covered ready, missing-generator,
disabled-generator and disabled-plant results. No application formula or private game datum was
used.

## Decision 1: project one revision without owning its lifecycle

**Decision**: A pure `DefenceProjector` receives the active `ShipLoadout` and feature 003's
`StatusRevisionContext`. It converts the integer SYS half-pips to the package value once, calls the
four defence facade methods, reads the package hull and fitted snapshots, and returns one immutable
`DefenceProjection`. Feature 003's provider envelope owns `noBuild`, `pending`, `ready` and `failure`;
the domain projection does not duplicate those lifecycle states.

**Rationale**: The mutable loadout has no public revision, while build and condition changes must not
produce a mixed display. Reusing the accepted provider envelope avoids a second revision protocol.

**Alternatives considered**:

- Component-level calls can mix revisions and put domain behavior in presentation.
- Persisting projections or SYS pips creates stale derived state.
- A feature-local loading/error union duplicates feature 003 and previously confused package
  unavailability with application failure.

## Decision 2: preserve shield and recovery results, including their issues

**Decision**: Call `shieldMetricsResult({ systemsPips })` and
`shieldRecoveryResult({ systemsPips })` with the identical explicit value. For complete results copy
every field. For incomplete results retain the complete ordered `CalculationIssue[]`, including
`field`, `reason`, `slot`, `symbol` and params. Present issue text with the package's
`getCalculationIssueMessage()` locale helper and feature 011's canonical-language disclosure.

Missing, unresolved, disabled, shed and invalid meanings come directly from those issues. Here
`unresolved` describes unavailable package calculation data for package-resolved build input; unknown
module identities are outside the supported ingress contract. A shield or recovery issue concerning
plant capacity/draw remains a plant/draw diagnosis and is never relabeled as a generator verdict.

**Rationale**: The structured result already owns the unavailable-state distinction required by
FR-003. Runtime probes confirmed distinct `shieldGenerator/missing`, `shieldGenerator/disabled` and
`powerCapacity/disabled` issues. Reconstructing the answer from `powerBudget()` loses information and
can disagree with the facade.

Shield availability is based on hardpoints-retracted power. A generator may be complete while
deployed power would shed it, so deployed/retracted agreement is not required.

**Alternatives considered**:

- A locally inferred `GeneratorState` duplicated package shedding behavior and discarded
  non-generator issues.
- Mapping every incomplete result to generic unavailable loses the package reason and target.
- Calling nullable convenience methods cannot satisfy the required distinctions.

## Decision 3: keep field-specific numeric meaning

**Decision**: Copy all `ShieldMetrics` fields: `strength`, `generator`, `boosters`, `reinforcement`,
`massCurveMultiplier`, `boostMultiplier`, `systemsResistance`, four resistances and four effective
hit-point values. Copy all `ShieldRecovery` fields: `regenRate`, `brokenRegenRate`, `recoveryTime`
and `regenTime`.

Raw snapshots retain JavaScript numbers unchanged. The presenter distinguishes finite values from
positive infinity without serializing them. Infinite EHP means unbounded raw damage of that type;
infinite `recoveryTime` means the collapsed shield cannot reach 50%; infinite `regenTime` means the
raised shield cannot reach full. Negative resistance stays signed and zero stays numeric.

**Rationale**: These infinities have different package meanings. A generic infinity/unavailable label
or clamped bar would erase a valid result.

**Alternatives considered**:

- Clamping, absolute-value conversion and replacement maxima violate FR-001/FR-005.
- One “infinite” label is ambiguous.
- Treating zero as absence breaks SC-002.

## Decision 4: banks use the returned deployed-power state unchanged

**Decision**: Copy the complete `CellBankSummary`: ordered banks, `totalRestorable`, `totalCells` and
every bank's `slot`, `symbol`, `reinforcement`, `cells`, `spinUp`, `duration`, `heat` and `powered`.
An empty bank list is `noneFitted`; every non-empty list is `fitted`, even with zero totals.

`CellBankMetrics.powered` is the package's hardpoints-deployed result. Returned values and booleans
are never corrected or qualified.

**Rationale**: `cellBanks()` owns both per-bank and total calculations, so the application reproduces
no band, draw or shedding arithmetic of its own.

**Alternatives considered**:

- Summing reinforcement or cells locally duplicates the package.
- Filtering unpowered banks violates FR-006.
- Qualifying only matching slots overstates confidence in the remaining bands.
- Treating fitted/all-unpowered as no banks loses a required state.

## Decision 5: armour is always a ready package value inside a successful projection

**Decision**: Call `armourMetrics()` once and copy `hitPoints`, `bulkheads`, `reinforcement`, all four
resistances, all four effective-hit-point values, `moduleArmour` and `moduleProtection`. Resolve the
active hull with `getShipBySymbol(build.shipSymbol)` and copy `hardness`.

Armour effective hit points are hull points of raw damage capacity, not MJ. Module armour is a
separate hit-point pool for modules; module protection is a fraction; hardness is a rating compared
with weapon armour piercing. No combined defence or matchup is created.

`armourMetrics()` is non-nullable and uses the hull's stock lightweight alloy when no fitted armour
contributes. The calculation fallback does not authorize presenting a fabricated fitted bulkhead.
A failed known-hull lookup or thrown package call fails the whole projection and is reported as an
invariant/upstream defect; it does not create a game-level “armour unavailable” state.

**Rationale**: The method and hull catalogue own all four concepts and their units. Separating actual
fitted identity from calculation fallback preserves honesty.

**Alternatives considered**:

- A nullable armour view invents a package state.
- Formatting armour EHP as MJ is dimensionally wrong.
- Combining hull, module and hardness values fabricates a score.
- A default or similarly named hull fallback violates the package construction boundary.

## Decision 6: show fitted role records, not contribution provenance

**Decision**: Present resolved fitted defence-role records from `slots()` in package outfitting order.
The actual armour slot identifies the bulkhead; resolved package `engineeringGroup` values identify
shield generators, shield boosters, shield reinforcements, hull/Guardian hull reinforcements and
module reinforcements. Each record retains exact slot key, package-resolved module `symbol` and direct
`on` state. A module whose role or stats are unavailable produces no role record; it may still have a
separate exact package calculation issue. Cell banks come from `cellBanks()` instead of a duplicate
role list.

These rows are described as fitted role records adjacent to their aggregate. The package facade does
not return per-source provenance for shield/armour aggregates, so no row is claimed to have
contributed and no aggregate number is divided or attached to it. An incomplete shield issue may
provide an exact generator slot even when the fitted stats are unresolved.

**Rationale**: FR-009 requires a shown fitted source to reach its slot and prohibits apportionment;
it does not require invented per-module contribution provenance. Public resolved classification is
enough for honest role/navigation rows on package-backed builds, and unknown identities never enter
the list.

**Alternatives considered**:

- Symbol/name parsing and positional keys are not package contracts.
- Stat-based arithmetic or even division fabricates provenance.
- Claiming these rows are exactly the facade inputs is stronger than the public API supports.
- An upstream source-manifest API is unnecessary unless a future requirement demands exact
  per-source calculation provenance.

## Decision 7: integrate through existing workspace contracts

**Decision**: Add no route. Defence is a capability inside `/build`. Feature 003 supplies settled SYS
pips, revision context, capability selection and a `defenceProfile` detail target. Feature 006 exports
the matching status provider for shield strength and armour. Feature 002 receives
`{ kind: 'slot', slotKey }` intents. Feature 001 owns active-build replacement; feature 011 owns shared
UI, game-text presentation, formatting and announcements.

**Rationale**: This matches the accepted cross-feature contracts and the `.design` workspace. It
keeps one active build, one condition store and one selection model.

**Alternatives considered**:

- A `/defence` route duplicates workspace navigation.
- A feature-local pip store can diverge from Status and other providers.
- Importing feature 003 components into the provider reverses the contract-first dependency.
- Depending on feature 005 for power data is unnecessary; the package call is a feature-006 read.

## Decision 8: adapt the reference without copying its data reduction

**Decision**: Keep the wide peer shield/armour regions, damage-type row relationship, recovery-near-
shield grouping, adjacent fitted-role rows and mobile stacked order from canvases 1c/1d. Use a fluid
container decision: two complete columns only while each remains legible, otherwise one complete
semantic stack. Tables may become complete labelled cards. Supplemental bars are optional and must
have a truthful scale and full text equivalent; signed and non-finite cases may omit them.

**Rationale**: The reference communicates hierarchy well but is fixed-width, inaccessible and
incomplete. The specification requires identical information on every form factor.

**Alternatives considered**:

- Literal canvas markup omits required fields/states and violates tokens, localization and touch
  sizing.
- A separate compact data projection for mobile makes mobile a degraded product.
- Device-name breakpoints do not handle text expansion or 400% zoom.

## Decision 9: validate package equality and semantic completeness

**Decision**: Unit tests compare every projected field and ordered issue directly with real
package-backed results. Presentation-only fixtures cover difficult finite/infinite/negative/empty
combinations without pretending to be game expectations. Provider tests prove exact revision and
detail targets; workspace tests prove exact slot keys. Playwright exercises every relevant state at
five layouts in Chromium and Firefox with axe, semantic, target-size, overflow, localization and
announcement checks, plus manual screen-reader and actual-zoom protocols.

Only the Status-provider path inherits feature 003's 100 ms criterion; feature 006 adds no invented
performance success criterion.

**Rationale**: Direct equality catches drift without hand-maintained calculations. Presentation
fixtures are appropriate for sentinel rendering but not for Almanac truth.

**Alternatives considered**:

- Mock-only or hand-calculated expectations cannot prove SC-001.
- Chromium-only, portrait-only or axe-only coverage does not meet the constitution.
- Timing the whole detail against an unspecified threshold creates a product requirement absent from
  the spec.

## Planning resolution

No planning clarification or new upstream Almanac issue remains. Feature 006 can be tasked after the
listed repository contracts are accepted, but it cannot be shipped until prerequisite features 001,
002, 003 and 011 are implemented and their gates pass.
