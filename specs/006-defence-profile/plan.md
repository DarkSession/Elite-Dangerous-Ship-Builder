# Implementation Plan: Defence Profile

**Branch**: `006-defence-profile` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-defence-profile/spec.md`

## Summary

Add a complete Defence Profile capability to the existing `/build` workspace. One pure projection
reads `shieldMetricsResult()`, `shieldRecoveryResult()`, `cellBanks()` and `armourMetrics()` from the
active `ShipLoadout`, using feature 003's settled SYS pips and revision context. It preserves every
returned number, ordered calculation issue, bank and package identity without local calculation,
clamping or aggregate apportionment. The same projection exports the shield/armour summaries feature
003 needs and exact-slot intents feature 002 can reveal.

The composition follows `.design/Ship Builder.dc.html` canvases 1c and 1d: Defence remains a
first-class mode inside outfitting, shield and armour are peers when space permits, and the complete
content stacks on narrow or zoomed layouts. The mock's values, abbreviated mobile content, inferred
bars, grouped contribution claims and ambiguous “integrity” label are not contracts.

## Technical Context

**Language/Version**: TypeScript 6.0.2, Angular 22.1 standalone and zoneless, Angular HTML and SCSS;
Node.js 24 for tooling. Full TypeScript/template strictness is a constitutional target not yet enabled
by the current root configuration and remains a feature 011 prerequisite.

**Primary Dependencies**: Angular signals and RxJS 7.8; `@elite-dangerous-almanac/core@0.1.1` leaf
exports for loadout defence, ships and i18n; feature 001 active-build/revision ownership; feature 002
exact-slot selection; feature 003 revision, viewing-condition, provider and workspace-target
contracts; feature 011 design-system, localization, announcement, preview and test foundations

**Storage**: None. Defence projections, selected capability, SYS pips, source views and announcement
state remain in memory and never enter local records, edit history, preferences, URLs or SLEF.

**Testing**: Vitest beside source with the existing 80% statement/branch/function/line thresholds;
Playwright with `@axe-core/playwright` at desktop, tablet portrait/landscape and mobile
portrait/landscape in Chromium and Firefox; manual screen-reader and actual 400% zoom protocols

**Target Platform**: Static client-side application for modern Chromium and Firefox on desktop,
tablet and mobile; portrait and landscape; pointer, touch and screen reader; usable offline after
first load

**Project Type**: Single client-side Angular application producing static files only

**Performance Goals**: The feature specification sets no independent numeric target. Projection is
synchronous and revision-coherent; the exported Status-provider summary must satisfy feature 003's
100 ms settled-update criterion, and implementation must preserve the existing production bundle
budgets.

**Constraints**: No server, account, telemetry or cross-origin runtime request; no local defence or
power formula; no generator-state reconstruction, hull fallback, source-contribution inference,
clamp or estimate; no stale mixed revision; all owned text and formatting localized; one tokenized
dark theme; no document horizontal scrolling; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4,
2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active package loadout and its complete slot set; four shield damage rows, four
armour damage rows, two recovery rates, two recovery durations, every fitted bank, hull hardness,
module protection and every resolved fitted defence-role record

**Design Reference**: `.design/Ship Builder.dc.html` canvas 1c wide Defence Analysis and canvas 1d
mobile Defence mode. Adoption and required departures are recorded in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: PASS before Phase 0 research and after Phase 1 design. No constitutional exception is
requested._

| Principle                               | Design evidence                                                                                                                                                            | Status                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | Projection uses only the in-memory loadout, installed package and memory-only viewing/navigation state.                                                                    | PASS                   |
| II. Almanac Source of Truth             | Four facade results, structured issues, the package hull record and package fitted snapshots own every game value, state and identity; no package result is reconstructed. | PASS                   |
| III. Domain Logic Outside UI            | A framework-agnostic projector and revision/provider adapters precede input/output-only capability components.                                                             | PASS                   |
| IV. Lossless, Honest Builds             | Null, zero, negative, infinity, ordered issues, unknown power and actual fitted identity remain distinct; the feature never mutates the build.                             | PASS                   |
| V. Desktop, Tablet and Mobile           | One complete semantic flow adapts across five layouts in both engines and includes touch, screen-reader, text-size, zoom, orientation and no-overflow verification.        | PASS; 011 prerequisite |
| VI. Commander's Language                | Application labels/units use feature 011; module names and calculation diagnostics use Almanac locale helpers with disclosed canonical fallback.                           | PASS; 011 prerequisite |
| VII. One Design System                  | The capability composes/extends `src/app/ui/`; `.design` supplies hierarchy only, and every new presentation component has a preview matrix.                               | PASS; 011 prerequisite |
| VIII. Tested Before It Ships            | Exact package-equality tests, ordered-issue tests, ten browser projects, axe and manual assistive-technology protocols retain the 80% gate.                                | PASS; 011 prerequisite |
| IX. Specification Before Implementation | [design/screen-inventory.md](./design/screen-inventory.md) maps FR-001–FR-009 and the adjacent design artifacts define all states before task generation.                  | PASS                   |

### Delivery prerequisites

There is no feature-006 Almanac blocker in pinned 0.1.1. Repository implementation still depends on:

1. feature 001's active `ShipLoadout`, atomic `buildRevision` and `/build` workspace;
2. feature 003's contract-first `StatusRevisionContext`, settled `ViewingConditions`, generic
   provider envelope and `WorkspaceTarget` union;
3. feature 002's exact-slot reveal boundary. Feature 002 is currently blocked on an upstream
   lossless checkpoint/name-and-ident API; feature 006 adds no workaround;
4. feature 011's strict compiler settings, tokens/components, Almanac text presentation,
   localization, previews, Firefox/landscape projects and axe harness.

The current source tree contains only the shell and build-link codec, and the current Playwright
configuration has three Chromium-only projects with no axe integration. Tasks must preserve these
dependencies; missing infrastructure does not authorize a partial private substitute.

## Project Structure

### Documentation (this feature)

```text
specs/006-defence-profile/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── armour-profile.md
│   ├── cell-banks.md
│   ├── shield-profile.md
│   └── workspace-integration.md
└── design/
    ├── component-state-preview-matrix.md
    ├── defence-profile.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/defence/
│   ├── defence-projector.ts
│   ├── defence-projection.ts
│   └── defence-source-role.ts
├── application/defence/
│   ├── defence.presenter.ts
│   ├── defence-status.provider.ts
│   └── defence-workspace.adapter.ts
└── features/build-workspace/defence-profile/
    ├── defence-profile.component.ts
    ├── shield-profile.component.ts
    ├── shield-recovery.component.ts
    ├── cell-bank-list.component.ts
    ├── armour-profile.component.ts
    └── defence-source-list.component.ts

e2e/
└── defence-profile.spec.ts
```

Unit tests live beside every projector, presenter, provider, adapter and component. Reusable metric,
collection, notice and action patterns are added to `src/app/ui/` through feature 011 rather than
implemented as screen-local visual primitives.

**Structure Decision**: Keep one application, one active loadout, one settled condition store and
one workspace target model. Feature 006 owns the defence projection, its Status-provider adapter and
capability composition. Feature 003 owns capability/condition lifecycle, feature 002 owns editing and
slot reveal, and feature 011 owns shared presentation infrastructure. No route or persistence model
is added.

## Phase 0: Research Conclusions

The full decisions and alternatives are in [research.md](./research.md). The decisive outcomes are:

- Preserve `CalculationResult` completeness and every ordered `CalculationIssue` separately for
  shield strength and recovery. Their `field`, `reason`, `slot` and `symbol` are the authoritative
  missing/unresolved/disabled/shed/invalid diagnosis.
- Pass the same explicit SYS pips to both methods. Shield availability uses retracted power; no
  application logic compares deployed and retracted bands.
- Copy every shield/recovery field. Negative resistance, numeric zero, EHP infinity and each
  recovery-phase infinity remain distinct.
- Copy `cellBanks()` completely. No banks and fitted/all-unpowered banks are different states.
  `bank.powered` is the package's deployed-power result. A non-empty `powerBudget().unknownDraws`
  qualifies the bank collection without changing any bank or total.
- `armourMetrics()` is non-nullable for an active known hull. Armour EHP is expressed in hull points
  of raw damage capacity, while hardness is a separate hull rating from `getShipBySymbol()`.
- Resolved fitted records may be shown as role records with exact slot actions. They are not claimed
  as the facade's per-module contribution provenance, and aggregate contributions stay aggregate.
- The `.design` peer-region hierarchy and stacked mobile order are adopted; its abbreviations,
  sample arithmetic, fixed widths, visual literals and inaccessible controls are rejected.

No `NEEDS CLARIFICATION` marker or new Almanac defect remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines revision context, complete/unavailable calculation views,
  raw metric snapshots, bank power qualification, armour/hardness, fitted role records, display
  sentinel states and the feature 003 summary.
- [contracts/shield-profile.md](./contracts/shield-profile.md) freezes exact shield/recovery calls,
  complete field mapping, ordered issue preservation and non-finite meanings.
- [contracts/cell-banks.md](./contracts/cell-banks.md) freezes collection states, every returned bank
  field, deployed-power semantics, unknown-draw qualification and exact-slot actions.
- [contracts/armour-profile.md](./contracts/armour-profile.md) freezes every armour field, hull
  hardness, correct units and separation from actual fitted role records.
- [contracts/workspace-integration.md](./contracts/workspace-integration.md) freezes revision
  composition, feature 003 Status output, feature 002 slot handoff, role boundaries and announcements.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to the one
  in-workspace capability and its collaborating surfaces.
- [design/defence-profile.md](./design/defence-profile.md) specifies complete wide, tablet, narrow,
  zoomed and state compositions; [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md)
  records preview obligations.
- [design/reference-review.md](./design/reference-review.md) records the exact `.design` adoption and
  every required departure.
- [quickstart.md](./quickstart.md) supplies runnable equality, state, navigation, localization,
  responsive, accessibility and full-gate validation.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persistence, second route, private game catalogue, calculation,
generator-state inference, contribution apportionment, source-provenance claim, visual literal,
hard-coded application text or reduced mobile data projection. Package issues remain ordered and
addressable; source rows retain exact package identities without claiming a numeric share; armour
remains available when shields do not. Every requirement has a surface, state and validation path.

The planning gate remains **PASS with no exception**. Delivery remains sequenced behind features
001, 002, 003 and 011 as described above.

## Complexity Tracking

No constitutional violation requires justification.
