# Research: Defence Profile

Research used the installed `@elite-dangerous-almanac/core@0.1.0-beta.12`, its public type
contracts and runtime probes over detached `ShipLoadout` values. The visual reference was reviewed
only for hierarchy. No application formula or private game datum was used.

## Decision 1: publish one revision-coherent defence projection

**Decision**: A pure `DefenceProjector` receives one active `ShipLoadout`, its immutable application
revision and feature 003's selected SYS-pip condition/revision. It calls
`shieldMetrics({ systemsPips })`, `shieldRecovery({ systemsPips })`, `cellBanks()`,
`armourMetrics()` and auxiliary `powerBudget()` once each, then reads the package hull and
fitted-slot records needed for source identity. The budget supplies only qualified generator/bank
power context; feature 006 does not reproduce its power presentation. One complete
`DefenceSnapshot` is published atomically.

Components consume only the snapshot and emit intents. A changed build or condition revision
invalidates the entire previous snapshot; stale work is discarded rather than partially patched.

**Rationale**: `ShipLoadout` is mutable and has no public revision. The two shield calls must use the
same pips and every visible field must describe one settled build revision.

**Alternatives considered**:

- Per-panel package calls can mix revisions and duplicate state.
- Component-owned calculations violate the domain boundary.
- Persisting defence figures or SYS pips creates stale derived data; both remain memory-only.

## Decision 2: copy every shield field and keep availability separate from power

**Decision**: A ready shield profile copies all `ShieldMetrics` fields unchanged:
`strength`, `generator`, `boosters`, `reinforcement`, `massCurveMultiplier`, `boostMultiplier`,
`systemsResistance`, and the kinetic, thermal, explosive and caustic values in both `resistances`
and `effectiveHitPoints`.

Shield availability and generator observation are distinct. A missing or disabled generator remains
observable from package fitted state. For a resolved known-draw generator, absent priority selects
package default group one and a valid explicit zero-based priority selects the matching returned
`PowerBudget` band; agreeing deployed/retracted verdicts establish powered or shed. An out-of-range
raw priority is not locally clamped. A generator named by `unknownDraws`, mismatched band verdicts or
an unresolved source stays indeterminate. A shed generator may retain a non-null
`shieldMetrics()` strength,
exactly as the specification permits; that strength is never presented as an online verdict. After
the #296 release, recovery availability must agree with the package-owned shed behavior. Where
package/build state does not establish a reason, the view says only unavailable.

**Rationale**: `shieldMetrics()` is a strength/resistance result, not a power-status calculation.
Conflating non-null strength with online state would contradict both the package and the feature edge
case.

**Alternatives considered**:

- Nulling retained strength for a shed generator changes the package result.
- Treating every null as “no generator” loses disabled, shed and unresolved distinctions.
- Recalculating SYS resistance or effective hit points duplicates Almanac formulas.

## Decision 3: recovery phases and non-finite meanings remain field-specific

**Decision**: A ready recovery profile copies `regenRate`, `brokenRegenRate`, `recoveryTime` and
`regenTime`. Finite rates and durations remain numbers. `Infinity` is mapped only to a semantic
presentation discriminant that preserves the owning field's package meaning: the collapsed shield
cannot reach its recovery threshold, or the raised shield cannot regenerate to full.

Effective hit-point `Infinity` is a different discriminant: no damage of that reported type passes
the package resistance. Negative resistance remains a signed negative percentage and its effective
hit points remain unchanged. Zero is always a ready numeric value.

**Rationale**: Raw generic infinity, JSON serialization and truthiness all erase meaning. The
semantic wrappers change no value and prevent unrelated infinite states from sharing one label.

**Alternatives considered**:

- Clamping resistance or effective hit points is prohibited.
- One “infinite” label is ambiguous.
- Formatting `Infinity` as unavailable collapses a valid package outcome into absence.

## Decision 4: cell-bank emptiness and power are package-authored

**Decision**: `CellBankSummary.banks.length === 0` maps to `noneFitted`. Otherwise a `fitted`
collection copies `totalRestorable`, `totalCells` and every ordered bank field: `slot`, `symbol`,
`reinforcement`, `cells`, `spinUp`, `duration`, `heat` and `powered`.

Totals are never summed locally. A fitted collection whose banks are all unpowered and whose totals
are zero remains distinct from `noneFitted`. Cell-bank slot actions use the returned `slot` exactly.

**Rationale**: `cellBanks()` already preserves every bank and computes totals over powered banks.
Its list discriminates absence from a genuine zero powered pool without inference.

**Alternatives considered**:

- Summing bank reinforcement by cells duplicates the package total.
- Filtering unpowered banks violates FR-006.
- Grouping identical bank symbols loses slot identity.

## Decision 5: armour, hardness and module protection remain separate facts

**Decision**: A ready armour profile copies every `ArmourMetrics` field: `hitPoints`, `bulkheads`,
`reinforcement`, all four `resistances`, all four `effectiveHitPoints`, `moduleArmour` and
`moduleProtection`. Hull hardness is copied from the package `Ship` record resolved by the build's
`shipSymbol`. The UI explains that weapons compare armour piercing with this rating; feature 006 does
not calculate a weapon matchup.

Module armour/protection is never added to or described as hull hit points. The fitted bulkhead is
the package module at the armour slot; no catalogue substitute is used for an unresolved build.

**Rationale**: These are three different package concepts: hull pool, module protection pool/fraction
and hull hardness. Combining them would fabricate a defence total.

**Alternatives considered**:

- A combined “effective defence” score has no package source.
- Comparing against locally selected or averaged weapon piercing belongs to offence and would add an
  unspecified calculation.
- Falling back to catalogue hull data for an unknown build violates the unknown-hull edge case.

## Decision 6: source manifests identify modules but never apportion aggregates

**Decision**: Source manifests are presentation projections of package-owned `LoadoutSlot` and
`FittedModule` snapshots. A source entry carries role, exact slot key, module `symbol`, package game
text, and directly observable enabled/power context. Generator and bulkhead are found through their
package-declared capabilities/fixed slots; boosters and shield/hull/module reinforcements are
classified only by their resolved package stats. Unresolved modules are not guessed from symbol or
name.

The shield manifest lists generator, boosters and shield reinforcements. The armour manifest lists
bulkhead, hull reinforcements and module reinforcements. Aggregate `generator`, `boosters`,
`reinforcement`, `bulkheads`, `moduleArmour` and `moduleProtection` values stay in their metric groups
and are never divided among source entries. A cell bank may show its returned per-bank reinforcement
because `cellBanks()` explicitly supplies it.

**Rationale**: FR-009 requires exact targeting and prohibits apportionment. Package snapshots are
enough to identify fitted sources without creating a second calculation system.

**Alternatives considered**:

- Dividing an aggregate evenly or by raw stat fabricates values.
- Symbol-prefix/name matching is not a package identity contract.
- A package API dedicated to source manifests is not required by the accepted spec because the
  existing resolved fitted records already carry exact roles and identities.

## Decision 7: reuse workspace, conditions and design-system boundaries

**Decision**: Add no route. Defence Profile composes inside feature 001's `/build` workspace, opens
from feature 003's defence headline/capability selector, consumes feature 003's shared pip state,
emits exact-slot intents to feature 002, and uses feature 011's tokens, components, locale formatters,
announcements and accessibility harness.

The `.design/Ship Builder.dc.html` shield/armour two-panel hierarchy and resistance rows are useful.
Its mock values, single “effective pool,” grouped source contributions, abbreviated narrow layout,
derived bar lengths, ambiguous “integrity,” and incomplete recovery/bank content are rejected.

**Rationale**: This keeps one active build, one condition store, one navigation model and one design
system while preserving every required field at every width.

**Alternatives considered**:

- A defence route or persisted tab state would duplicate workspace navigation.
- A second pip control/store can diverge from the status and power capabilities.
- Copying the reference literally would omit required information and violate token/localization
  rules.

## Decision 8: validate exact package equality across the full product matrix

**Decision**: Unit tests use real package-backed builds and compare every projection field directly
with the four `ShipLoadout` results and hull record. Synthetic result-shape fixtures are permitted
only at the presentation boundary for hard-to-reach sentinel rendering; they are never game data or
calculation expectations. Store tests prove atomic revision publication and exact-slot intents.

Playwright covers the three user stories and every meaningful state in ten projects: Chromium and
Firefox at desktop, tablet portrait/landscape and mobile portrait/landscape. Every state receives an
automated accessibility scan plus semantic, overflow, zoom, touch-target, expanded/RTL text,
reduced-motion and announcement assertions. The settled revision reaches matching DOM within 100 ms
at mobile Chromium under 4x CPU slowdown.

**Rationale**: Exact result comparison catches package drift without hand-maintained golden game
figures. The matrix is required by the constitution, and browser timing measures the user-visible
boundary rather than negligible package-call time.

**Alternatives considered**:

- Mock-only tests cannot prove SC-001.
- Hand-calculated expected values recreate Almanac logic.
- Chromium-only, portrait-only or axe-only coverage does not satisfy the project gate.

## Almanac dependencies and release gates

The two unresolved dependencies were verified open on 2026-08-17 and are already raised in the
Almanac repository with minimal reproductions:

1. [Almanac #296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296): beta.12
   `shieldRecovery()` returns finite recovery for a generator shed after the power plant is disabled.
   Feature 006 must not locally null that result. This gates recovery only; retained shield strength
   remains valid package behavior.
2. [Almanac #297](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/297): beta.12 turns an
   unresolved hull into all-zero armour and non-null zero shield/recovery results. Feature 006 must
   not reinterpret them as unavailable.

No additional Almanac defect or missing API was established. Implementation waits for released
fixes, pins the released package, reruns both issue reproductions and updates the availability adapter
to the released nullable/structured contract. The plan deliberately does not freeze an API shape
that #297 may change.
