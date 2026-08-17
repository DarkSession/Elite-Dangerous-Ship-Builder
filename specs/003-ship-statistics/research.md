# Research: Ship Statistics and Status

Research used the installed `@elite-dangerous-almanac/core@0.1.0-beta.12`, the accepted feature
specifications, feature 001/002 planning boundaries and `.design/Ship Builder.dc.html` canvases 1c
and 1d. Runtime probes used detached package `ShipLoadout` values; no application formulas were used.

## Decision 1: publish one atomic status projection

**Decision**: `StatusSnapshotAssembler` captures one `{ loadout, buildRevision }` and one immutable
`{ conditions, conditionsRevision }`, requests every area-owned result from that same tuple and
publishes one complete `StatusSnapshot` assignment. Components never call Almanac methods.

If a port becomes asynchronous, the assembler gives the request a token, waits for all ports, then
discards it unless both revisions still match. The current-context surface may say it is updating; it
must not display an older figure under a newer revision label.

**Rationale**: `ShipLoadout` is mutable and has no public revision. Package validation object identity
can remain unchanged after an enabled/priority edit even while calculated results change.

**Alternatives rejected**:

- Per-card calculation subscriptions can expose mixed revisions.
- Deep equality of package objects cannot establish the active-build transaction boundary.
- Locally recomputing area summaries duplicates features 005–009.

A Node probe over a large engineered build measured the package reads well below 1 ms. Browser layout,
localization and announcements are the material risks for the 100 ms requirement.

## Decision 2: structural status is the literal package validation pair

Read `loadout.validation` once. Present `valid` and `complete` independently with bounded statements
about structural errors and required/classified loadout completeness. Never translate them into
flyable, ready, working, good or optimal.

Project every returned issue in package order and preserve `code`, `severity`, optional `slot`,
optional `symbol`, `params` and canonical `message`. `incompatibleModule` currently supplies its
constraint in `params.constraint`; the application preserves but does not promote or parse it.
Repeated package issues remain repeated. Only `issue.slot` authorizes an exact-slot action.

There is no package diagnostic localization helper. In non-English UI, canonical package text uses
feature 011's untranslated disclosure; application labels, severity framing and availability text
are localized normally.

## Decision 3: headline result states are discriminated

Each area adapter returns an immutable union, never a nullable number:

- `available`: exact package value, unit, conditions and target; numeric zero remains available;
- `lowerBound`: usable numeric value plus package evidence that omitted unknown contributions;
- `incomplete`: structured package calculation issues prevent the value;
- `unavailable`: package `null`/throw or an observable prerequisite, with no invented diagnosis;
- `infinite`: package infinity plus its owning area's semantic meaning;
- `absent`: a conditionally irrelevant summary, specifically no recognized Mercenary article.

For unknown power draws, deployed/retracted draw and utilisation are lower bounds. Headroom is
optimistic rather than a lower bound, and true budget/powered booleans are provisional; these receive
a generic qualification. False budget/powered states remain conclusive. Retracted power exposes no
locally derived headroom, utilisation or budget verdict because beta.12 supplies those for deployed
only.

**Alternatives rejected**: truthiness collapses zero; one `null` state loses structured calculation
issues; formatting `Infinity` without meaning violates the owning area contracts.

## Decision 4: area adapters own headline calculations

Use leaf package imports and the owning feature contracts:

| Presentation        | Package-owned source                                               | Conditions and honesty rule                                                                             |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Power draw/capacity | `powerBudget()` selected `.deployed`/`.retracted` and `.available` | MW; no plant may be genuine zero/Infinity, not generic unavailable; unknown draws qualify results       |
| Shield strength     | `shieldMetrics({ systemsPips })?.strength`                         | MJ; SYS pips are stated even though raw strength is pip-invariant; null is unavailable                  |
| Armour              | `armourMetrics().hitPoints`                                        | Hull points; no view-condition input; unresolved-hull zero is blocked by #297                           |
| Sustained DPS       | `weaponMetrics().total.sustainedDamagePerSecond`                   | damage/s; enabled weapons and reload cycle are package-owned; no/all-disabled weapons can be exact zero |
| Selected jump       | `jumpRangeSummary().max`, `.unladen` or `.laden`                   | LY; guard with diagnostic mass/fuel/cargo results and retain a thrown unavailable state                 |
| Top speed           | `mobilityMetrics({ fuel, cargo, enginesPips })?.speed`             | m/s; selected load and ENG pips; null is unavailable; shed-thruster finite result is blocked by #296    |
| Unladen mass        | completed `unladenMassResult.value`                                | t; incomplete result retains all ordered `CalculationIssue` records                                     |

Hardpoints directly select the package power state. `weaponMetrics()` has no retracted-state input and
does not fold power shedding into DPS. With retracted hardpoints, the card therefore presents the
observable nonnumeric condition rather than inventing zero; with deployed hardpoints it presents the
package total. If a future area contract requires numeric retracted DPS, Almanac must first own it.

Shield strength is not a power-availability verdict. Feature 006 keeps shield strength distinct from
recovery/online state. The status capability does not locally combine those facts.

## Decision 5: standard load mappings use only package results

The load selection maps as follows:

- `unladen`: package `jumpRangeSummary().unladen`; mobility with full-main-tank default and `cargo: 0`;
- `laden`: package `jumpRangeSummary().laden`; mobility with full-main-tank default and completed
  `cargoCapacityResult.value`;
- `maximumJump`: package `jumpRangeSummary().max`; mobility with `cargo: 0` and package-derived fuel
  `fuelPerJump(maxJumpRange())`.

The maximum mapping is awkward but exact: `fuelPerJump()` owns the cap used by `maxJumpRange()`.
Runtime probes over Sidewinder, Krait Mk II, Anaconda and a zero-fuel build matched the package's
one-jump fuel. [Almanac #295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295)
requests a first-class standard-load result so consumers need not compose these calls; current
composition is not a local formula and is not a release blocker.

Before jump or load-sensitive mobility reads, inspect the package diagnostic mass, main-fuel and cargo
capacity results. Preserve every issue when incomplete. Do not substitute zero. A complete package
zero fuel capacity remains zero.

## Decision 6: viewing conditions are explicit, valid and ephemeral

`ViewingConditionsStore` defaults to unladen, `2/2/2` SYS/ENG/WEP and deployed. Pips are represented
internally as integer half-pips (`0..8`) and only a total of 12 may settle. The presenter divides each
accepted value by two when calling package APIs.

Keep input drafts separate. An explicit Apply accepts only three half-step values, no value above
four and an exact total of six. This avoids inventing an automatic redistribution rule. Accepted
conditions increment `conditionsRevision`; invalid drafts do not change results.

Conditions reset on reload and every active-build replacement. They are excluded by type from build
snapshots, local records, history, preferences, URLs, links and SLEF.

## Decision 7: assembly requirements are feature 009 projections

Feature 003 consumes `AssemblyRequirementsPort`; it never resums raw items.

- Credits use `retailCredits()` fields. Null price stays unpriced and an affected package subtotal is
  qualified. No hull-plus-module total is invented because the package does not return one.
- Merc Coin appears only for a package-recognized `preEngineeredVariant.acquisition === 'mercenary'`.
  It remains separate from credits. Missing per-variant price qualifies the package total.
- Materials use feature 009's package calls (`getBlueprintCost`, `getExperimentalEffectCost`,
  `sumMaterials`) and package names. Null recipe cost is unavailable; a true empty requirement stays
  empty. Fixed reward engineering adds no fabricated craft cost.

## Decision 8: targets never infer package identity

A `WorkspaceTarget` is either an exact package `slotKey` or an area-owned detail capability/anchor.
Issue actions exist only when `issue.slot` exists. Headline and assembly cards receive targets from
their owning ports. No slot is inferred from a symbol, message, params, list position or visual group.

The coordinator selects/reveals the slot in wide layouts and opens the same exact-slot outfitting
surface in narrow layouts. Detailed capability selection is memory-only; `/build` fragments remain
reserved for `b.…` payloads.

## Decision 9: count announcements follow settled snapshots

Visible status is not a live region. After one snapshot settles, compare its issue and qualified-result
counts with the last announced settled pair. If either differs, coalesce rapid changes and emit one
polite localized announcement containing both current counts. Initial content, unchanged counts and
discarded stale snapshots announce nothing. Ordinary package issues never use `role="alert"`.

A qualified-result count counts each qualified summary once, not every sentence explaining it.
Mercenary absence is not a qualification.

## Decision 10: fixed-mount provenance is local record metadata

Feature 001's planned `LocalRecordV1` gains `fixedMountNormalisation`, separate from
`BuildSnapshotV1`. Feature 002 creates entries during sanctioned ingress normalisation. They autosave
with working records, copy to named saves/duplicates, load with an opened record and disappear when
the record is deleted.

A successful Commander-authored edit to the exact slot clears its entry: fit/replace/remove,
engineering, enabled state or priority all count. Refused, cancelled, search, selection and viewing
changes do not. Undo restores only modelled `BuildSnapshotV1` and does not recreate cleared
provenance. Link/SLEF ingress carries no provenance but may create new entries when it is normalised.

Version 1 has not shipped, so its planned schema is revised directly rather than creating a fictional
migration.

## Decision 11: adapt the design canvas rather than copying its facts

Adopt the wide status rail, compact headline hierarchy, responsive cards and mobile 1d Status
capability. Replace the mock's authored warnings, comparison arrows, thresholds, percentages and
favourable/unfavourable colours with exact result states. Optional empty slots are not package
validation issues. Detailed power/heat, defence, offence, mobility, cost and anatomy content remains
owned by features 005–010.

No external `edassets.org` imagery is used. Components use feature 011 primitives/tokens, same-origin
package assets where available, localized formatting and text in addition to every colour/icon state.

## Confirmed Almanac defects and dependencies

- [#296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296): disabled-power-plant
  Sidewinder has zero available power and shed thrusters/generator, but `mobilityMetrics()` and
  `shieldRecovery()` return finite results. Top speed is blocked until a released fix.
- [#297](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/297): unresolved hull defence
  façades turn missing hull facts into numeric zeroes. Armour/shield presentation is blocked until a
  released fix.
- [#295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295): first-class standard-load
  inputs/results would replace the currently valid package-method composition.
- [#291](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/291) and
  [#292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292): feature 002 must supply
  the normalised active state and provenance before feature 003 can complete that integration.

The package's nullable/throwing metric APIs without structured diagnostics are a known limitation, not
a blocker for this spec: the accepted behavior is generic unavailable plus directly observable facts.

## Test strategy

Unit tests use injected area ports and fixed package fixtures:

- all independent valid/complete combinations and exact ordered issue preservation;
- genuine zero, unavailable, structured incomplete, lower-bound, qualified boolean, infinity and
  absence remain distinct;
- exact deployed/retracted power selection and unknown-draw qualification semantics;
- jump guards and all three package standard-load mappings, including zero fuel;
- mobility null versus package zero above maximum thruster mass;
- valid and invalid half-pip drafts, defaults, reset and exclusion boundaries;
- one tuple reaches every port and stale results never publish;
- exact target authorization, provenance lifecycle and settled announcement coalescing;
- package regression fixtures for #296/#297 once a fixed release is consumed.

Playwright covers status, conditions, issues, requirements, targets, provenance and rapid-edit
journeys in Chromium and Firefox at all required viewports with automated accessibility scans. A
mobile Chromium run uses CDP 4x CPU slowdown and in-page revision/render timestamps to enforce the
100 ms outcome without including automation transport latency.
