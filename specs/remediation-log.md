# Cross-artifact remediation log

> Historical record: constitution 7.0.0 and Almanac 0.1.4 supersede the C1, U1/U2 and U1b
> remediations below. Fixed mounts now arrive package-populated, unknown-module compatibility is no
> longer supported, and the application has no repair/default-unavailable/provenance workflow.

Amendments applied to `specs/**` following the cross-feature `/speckit-analyze` run of
2026-08-19 over features 001–012 against constitution v6.0.0 and the pinned
`@elite-dangerous-almanac/core@0.1.3`.

Each entry names the finding, the decision taken and the files changed. No application source was
touched; these are specification, plan, contract and task amendments only.

---

## C1 (CRITICAL, constitution IV) — empty fixed mounts on feature 001's ingress paths

**Problem.** Constitution IV requires a fixed mount that arrives empty to receive the hull's
package-defined stock module on _every_ ingress and reconstruction path. Feature 002 (FR-010) and
feature 004 (FR-012) carried the rule; feature 001's storage-reconstruction and build-link paths did
not. `ShipLoadout.fromLoadout()` auto-fills only the cargo hatch, so armour and core internals
arriving empty stayed empty. Feature 001's spec delegated the rule in a non-normative Edge Case, but
FR-014 and the tasks never carried it.

**Decision.** Feature 001 owns the repair step because it owns `BuildSnapshotV1` and ships first;
feature 002's shared ingress pipeline composes it rather than re-implementing it.

- `001/spec.md` FR-014 — empty fixed mount receives the package default; stays empty and reports the
  build incomplete when the package supplies none.
- `001/tasks.md` T021 — `repairFixedMount(slotKey)` for every armour, core-internal and cargo-hatch
  mount the snapshot left empty; `defaultUnavailable` retained as incomplete.
- `001/tasks.md` T022 — `action` union widened to `emptied | defaulted | repaired | defaultUnavailable`.
- `001/tasks.md` T087, T099 — build-link path repairs source-empty fixed mounts; fixture added.
- `002/tasks.md` T009 — delegates the fixed-mount step to feature 001's reconstructor.

## G1 (CRITICAL) — two owner-held integration ports that no owner produced

**Problem.** Feature 007 consumed `HardpointCoverage` (feature 002) and
`DeployedDistributorPowerObservation` (feature 005). Both names appeared only in feature 007's own
artifacts; neither owner had a task, requirement or plan line creating them. Feature 007 T006
recorded itself as blocked with nothing scheduled to unblock it.

**Decision.** Feature 002 defines and derives `HardpointCoverage`. Feature 005 generalizes its
hardpoint-only observation into one `MountPowerObservation` port accepting any package slot key,
serving features 007 and 010 from a single definition. This also resolves I4.

- `002/tasks.md` T004 — type-only `HardpointCoverage` contract leaf (contract-first).
- `002/tasks.md` T025 — derives it from same-revision package-resolved slot views; never from
  `weapons.length`.
- `005/tasks.md` T006, T025, T034, T038 — `MountPowerObservation` / `MountPowerObservationPort`
  over any slot key, union widened with `unavailable`, adapter and tests renamed.
- `005/data-model.md`, `005/contracts/integration-ports.md`, `005/plan.md`, `005/research.md`,
  `005/quickstart.md`, `005/design/screen-inventory.md` — contract and prose updated.
- `007/tasks.md` T006 and Delivery gates — consumes the shared port at the distributor's core slot
  key, presenting `notApplicable` as absent; blocking bullet rewritten as scheduled dependencies.
- `007/data-model.md`, `007/contracts/capacitor-endurance.md` — local union removed in favour of
  the owner's.
- `010/tasks.md` T012, T013, T039, T045 and `010/plan.md` — feature 010 becomes a consumer rather
  than a rewriter; legend and message keys gain the sixth `unavailable` power state.

## I4 (MEDIUM) — feature 010 rewriting a contract feature 005 had just shipped

Closed by the G1 decision. Feature 005 now defines the generalized port once; feature 010 T012 is a
consumer binding rather than a replacement of feature 005's boundary.

## U1 / U2 (HIGH, principle II risk) — the ingress API was never named

**Problem.** `ShipLoadout.importOutcomes` and `LoadoutImportOutcome` — the 0.1.3 API delivering
constitution IV's empty/default outcomes — appeared in no spec, plan or task. Both Phase-1 package
pinning tasks described the behaviour in prose while naming every other API exactly.
`repairFixedMount` was named only in feature 004.

- `002/tasks.md` T003 and `004/tasks.md` T001 — pin `importOutcomes` and the `LoadoutImportOutcome`
  shape by name, including the documented rule that `sourceSymbol: null` marks the cargo hatch.
- Feature 001 T021/T022 named both APIs as part of C1.

## U1b (HIGH, principle II) — cargo restoration re-derived instead of read

**Problem.** Feature 004 T058 detected the package's cargo-hatch auto-restore "by exact before/after
comparison", and T044 asserted that technique in a test. The package reports it directly as the
`defaulted` outcome whose `sourceSymbol` is `null`. Re-deriving a library result inside the
application is prohibited by principle II, and the comparison would misfire whenever a hull's cargo
hatch legitimately matched the source.

- `004/tasks.md` T058 — read the `defaulted` entry with `sourceSymbol === null`.
- `004/tasks.md` T044 — assertion retargeted so the test no longer locks in the prohibited technique.

## I1 (HIGH) — unreachable distributor fixture

**Problem.** Feature 005 T010 unit-tested `0/0/12` half-pips: six pips in WEP. That breaks feature
003 FR-017's four-pip-per-capacitor ceiling and falls outside `distributorMetrics`' documented
`0..4` pip range. Six pips total is the budget; one capacitor holds at most four, so the remaining
two must sit in the other capacitors.

**Decision.** Replaced with the fractional `1/4/7` (SYS 0.5 / ENG 2 / WEP 3.5) rather than another
ceiling-plus-zero shape, because no other fixture exercised the half-pip division producing a
fraction.

- `005/tasks.md` T010.

## G2 / G3 (MEDIUM) — requirements implemented but never registered in the coverage ledger

**Problem.** Feature 011 registered 14 of its 24 requirements (FR-001–005, FR-015, FR-021–024 were
absent, including the FR-024 that mandates the automated checks). Feature 010 omitted FR-009. Both
reconcile tasks compared _surfaces_, never requirement ids, so nothing detected the omissions.

**Decision.** Fix the two ledgers and add a generic checker rule so the class cannot recur.

- `011/tasks.md` T028 — checker rule: every `FR-` id in any `specs/*/spec.md` must appear at least
  once in `e2e/coverage-ledger.ts`, failing the build with the unregistered ids named.
- `011/tasks.md` T024 — ledger seeded with the cross-cutting FR-001–005 and FR-021–024 entries.
- `011/tasks.md` T093 — FR-015 registered alongside the conformance message.
- `010/tasks.md` T047 — FR-009 added.

**Known unenforced requirement.** Feature 011 FR-005 ("a missing reusable pattern MUST be added to
the design system before a capability uses it") still has no enforcing task. It is held by
convention and per-feature policy checks (002 T098, 009 T048). Recorded rather than closed.

## I2 (MEDIUM) — coverage thresholds pointed at a non-existent file

Feature 006 T078 named `vitest.config.ts`. No such file exists; `angular.json` carries
`coverageThresholds`, which is what the constitution and the other ten features specify.

- `006/tasks.md` T078 — retargeted to `angular.json` and aligned with the sibling task wording.

---

## I3 (MEDIUM) — conformance wording enforced but not stated in features 001 and 002

Features 003-012 each carry a task asserting that conformance statements name the seven excluded
keyboard criteria; 001 and 002 did not. Feature 011 T093's repository-wide checker already rejects
unqualified claims anywhere in the repository, so the rule was enforced but the inheritance was
invisible to a reader of 001 or 002.

**Decision.** Record the inheritance rather than add a twelfth copy of the same assertion.

- `001/tasks.md`, `002/tasks.md` Notes — one line each naming feature 011 T093 as the enforcer.

## U3 (MEDIUM) — six of seven token families had no source

**Problem.** Feature 011 T007 instructed deriving colour, type, spacing, radius, elevation, border,
motion and target primitives from `.design/Ship Builder.dc.html`. That file defines 55 named colour
custom properties and nothing else usable: its only `font-size` values are 8px and 9px
(artboard-thumbnail artifacts), its motion is a single `opacity .09s ease` belonging to the canvas
chrome, and its spacing appears as 78 unrelated `padding`, 18 `gap` and 15 `letter-spacing`
literals. Taken literally the task would have produced an 8px type scale, failing principle V.

**Decision.** Colour comes from the canvas; the rest is authored in this repository as bounded named
step scales, with the canvas as visual reference only — which is the direction principle VII
already sets ("this repository is the source of truth for any external design tool it synchronises
with... a design tool is a working surface and a preview, never the record").

- `011/tasks.md` T007 — split sourcing explicitly, with the thumbnail font sizes and the raw
  padding/gap/letter-spacing literals named as prohibited inputs.

## U4 (MEDIUM) — feature 001 plan had no Complexity Tracking section

The other eleven plans carried one. Added, recording the URL codec, the injected browser ports, the
candidate-first replacement coordinator and the composed fixed-mount repair step as justified
boundaries rather than constitutional exceptions.

- `001/plan.md`.

## D1 (LOW) — one normalisation rule stated in three specs

After C1 the three statements agree in substance. Cross-references added so a future edit has an
obvious canonical target.

- `001/spec.md` FR-014 and `004/spec.md` FR-012 — both now name `002` FR-010 as the canonical
  statement of the rule they apply to their own ingress path.

## I5 (LOW) — spec titles differ from capability names — closed, no action

Feature 008's spec is titled "Mobility, Mass and Jump" while its plan, design and tasks name the
capability "Drives & Mass"; feature 003 shows the same pattern. This is the Development Workflow
rule working as intended — "a feature spec... names no screen and pins no component" — not drift.
Recorded and closed without change.

## I6 (LOW) — constitution's Playwright project list was behind the task lists

**Problem.** Technology Constraints named "desktop, tablet and mobile projects... each run in
Chromium and in Firefox" (six), while principle V already required portrait and landscape on tablet
and mobile and every feature task list builds ten.

**Decision.** PATCH amendment, since no obligation changes — the paragraph simply under-described
the project set the existing principles already require.

- `.specify/memory/constitution.md` — Technology Constraints (Testing) now names all five
  viewport-orientation projects per engine; version 6.0.0 -> 6.0.1, last amended 2026-08-19; Sync
  Impact Report updated with the 6.0.1 entry and the 6.0.0 report retained beneath it.

---

## Cross-feature sequencing reconciliation

The C1 and G1 decisions created cross-feature edges that the affected `Dependencies & Execution
Order` sections did not record. Reconciled so the graph matches the amended tasks:

| Edge                                                           | Recorded in                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 001 T021/T022 → 002 T009 (composed, not re-implemented)        | 001 phase deps; 002 phase deps and new Cross-Feature Contracts section      |
| 002 T004 → 007 T006 (`HardpointCoverage`, contract-first)      | 002 phase deps and Cross-Feature Contracts; 007 setup and foundational deps |
| 002 T004 → 002 T025 (type before adapter)                      | 002 Shared-File Sequencing                                                  |
| 005 T006 → 007 T006 and 010 T012 (`MountPowerObservationPort`) | 005 phase deps and US1 deps; 007 foundational deps; 010 foundational deps   |

Feature 007's Setup bullet no longer describes its integration ports as missing, and feature 010's
Foundational bullet no longer describes T012 as a feature 005 contract change — it is now a consumer
binding that waits on feature 005 T006.

---

## Status

All fifteen findings from the analysis are closed. Two carried forward as recorded observations
rather than changes:

| ID         | Observation                                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 011 FR-005 | "A missing reusable pattern MUST be added to the design system before a capability uses it" has no enforcing task. Held by convention and per-feature policy checks (002 T098, 009 T048). |
| I5         | Spec-title vs capability-name differences are correct under the Development Workflow's per-capability rule; no change made.                                                               |
