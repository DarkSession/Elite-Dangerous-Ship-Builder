# Implementation Plan: Mobility, Mass and Jump

**Branch**: `008-mobility-and-jump` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-mobility-and-jump/spec.md`

## Summary

Add a Drives & Mass capability to the active `/build` workspace. A framework-agnostic projector
reads one revision of the active `ShipLoadout`, preserves the three diagnostic aggregate results,
uses package-produced standard loads, guards the throwing jump facade, calls the diagnostic mobility
facade once for the selected load and ENG pips, and copies every returned value unchanged. It also
projects every fitted module's post-engineering mass by the package's exact slot key. A signal-based
application store publishes one immutable revision; presentation components only format it and emit
shared viewing-condition or exact-slot intents.

The implementation follows the wide and narrow Drives & Mass hierarchy in
`.design/Ship Builder.dc.html`: mobility and jump remain adjacent at wide widths and become one
complete stack at narrow widths. The mock's authored totals, percentage bars, comparisons, headroom,
mass-lock value, “current” load, and shortened mobile content are excluded because they are not
package results or accepted requirements.

## Technical Context

**Language/Version**: TypeScript 6.0, Angular HTML and SCSS; Node.js 24 for tooling. The constitution
requires TypeScript strict mode, but the current shared `tsconfig.json` does not yet enable `strict`

**Primary Dependencies**: Angular 22.1 standalone and zoneless APIs; Angular signals; RxJS 7.8;
`@elite-dangerous-almanac/core` 0.1.4 leaf exports; feature 001's active-build/revision and `/build`
workspace; feature 002's exact-slot selection; feature 003's viewing conditions, revision envelope,
status-provider contract and `mobilityAndJump` target; feature 011's design-system, localization and
test foundations

**Storage**: None. Results, selected capability and disclosure state are derived or memory-only and
must not enter local storage, build history, URLs, compact links or SLEF

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement, branch,
function and line gates; Playwright plus axe in Chromium and Firefox at desktop, tablet portrait and
landscape, and mobile portrait and landscape; manual screen-reader and actual-zoom checks

**Target Platform**: Static client-side application for modern Chromium and Firefox on desktop,
tablet and mobile; touch, pointer and screen reader; portrait and landscape; offline after first load

**Project Type**: One client-side Angular single-page application with static output and no backend

**Performance Goals**: Recompute synchronously once per settled build/condition revision; publish
all visible mobility, jump, mass and capacity values atomically before the next rendered frame; add
no network request or persisted derived cache

**Constraints**: No local jump, total-range, jump-count, mass, capacity, standard-load, thruster
curve or power calculation; no truthiness conversion of zero; no hull-stat fallback for unavailable
mobility; exact package issue order and identities; no document horizontal scrolling; one tokenized
dark theme; all application text and numeric/unit formatting localized; WCAG 2.2 AA except criteria
2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active build across the 48 hulls in Almanac 0.1.4; three standard jump profiles;
seven mobility fields; three aggregate result groups; sparse FSD/thruster parameters; one mass row
for every fitted module

**Design Reference**: `.design/Ship Builder.dc.html`, wide `data-anat-detail="mass"` and narrow
`data-m-mode="mass"` regions. See [design/reference-review.md](./design/reference-review.md)

## Constitution Check

_Planning gate: PASS. The design requests no constitutional exception. Repository-wide delivery
gates listed below must be satisfied before feature 008 can ship._

| Principle                               | Design evidence                                                                                                                     | Status                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | Every projection uses the in-memory active build and installed package; no storage or network boundary is added.                    | PASS                   |
| II. Almanac Source of Truth             | All game values come from named `ShipLoadout` results or fitted package records; no package calculation is reproduced.              | PASS                   |
| III. Domain Logic Outside UI            | A pure projector and typed status adapter precede the signal store and presentation-only components.                                | PASS                   |
| IV. Lossless, Honest Builds             | Exact zero, incomplete results, structured issues, missing optional fields and application failures remain separate.                | PASS                   |
| V. Desktop, Tablet and Mobile           | The full capability stacks without omission and is covered at five layouts in both required engines, with axe and manual protocols. | PASS; prerequisite 011 |
| VI. Commander's Language                | Owned labels/units use feature 011; game names and diagnostics use Almanac localization with canonical fallback disclosure.         | PASS; prerequisite 011 |
| VII. One Design System                  | The capability composes and, where necessary, extends `src/app/ui/`; `.design` contributes hierarchy, not copied literals.          | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Direct package-equality unit tests and dual-engine responsive/accessibility journeys retain the 80% gate.                           | PASS; prerequisite 011 |
| IX. Specification Before Implementation | Every FR maps to the plan-time capability surface and contracts below before task generation.                                       | PASS                   |

### Delivery gates and dependency order

1. Enable TypeScript `strict` in the shared configuration and make the existing project pass. This
   is a constitution technology constraint, not optional feature cleanup.
2. Feature 001 supplies one atomic `{ loadout, buildRevision }` and the `/build` workspace. Feature
   002 advances that revision for committed edits and owns exact-slot reveal/edit behavior.
3. Feature 003 supplies settled maximum-jump/unladen/laden and integer-half-pip conditions,
   `conditionsRevision`, the generic status-provider envelope and `mobilityAndJump` target. Feature
   008 divides ENG half-pips by two only at the Almanac call boundary.
4. Feature 011 supplies shared tokens/components, locale services, game-text/diagnostic presenters,
   component previews, Firefox/landscape projects and the automated accessibility harness.
5. Feature 008 exports its concrete synchronous mobility status provider; feature 003 can then
   assemble the final five-provider Status capability without a circular completion dependency.

Almanac 0.1.4 already supplies `standardLoadResult()`, structured powered-thruster diagnostics from
`mobilityMetricsResult()`, and every other calculation required here. Feature 008 has no dependency
on feature 005's power projection: the mobility result itself distinguishes `missing`, `disabled`,
`shed`, package-issue `unresolved` and `invalid` inputs; no unknown identity reaches the capability.

## Project Structure

### Documentation (this feature)

```text
specs/008-mobility-and-jump/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── jump-performance.md
│   ├── mass-and-capacity.md
│   ├── mobility-performance.md
│   └── status-integration.md
└── design/
    ├── mobility-and-jump-profile.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── mobility-jump/
│       ├── mobility-jump-projector.ts
│       ├── mobility-jump-snapshot.ts
│       └── mobility-status-projection.ts
├── application/
│   └── mobility-jump/
│       ├── mobility-jump.presenter.ts
│       ├── mobility-jump.store.ts
│       ├── mobility-status.provider.ts
│       └── mobility-workspace.adapter.ts
├── i18n/                                  # feature 011 messages and formatters
├── ui/                                    # feature 011 primitives/previews
└── features/
    └── build-workspace/
        └── mobility-and-jump/
            ├── drives-and-mass-capability/
            ├── jump-performance/
            ├── mobility-performance/
            ├── mass-and-capacity/
            └── module-mass-list/

e2e/
├── accessibility.ts                      # feature 011 shared helper
└── mobility-and-jump.spec.ts
```

Tests live beside their source. Shared conditions, slot selection, status composition, formatting
and visual primitives remain in their owning features rather than being duplicated here.

**Structure Decision**: Keep one Angular application and one active `ShipLoadout`. The pure
projector takes a captured build/condition revision and returns a frozen semantic snapshot. One
computed store publishes `noBuild`, `ready` or `failure`; the feature 003 status adapter projects the
selected jump, top speed and fixed unladen mass from that same synchronous projector. No second
loadout, worker, route, power observer, persistence adapter or calculation service is introduced.

## Phase 0: Research Conclusions

Detailed decisions and primary-source evidence are in [research.md](./research.md). The decisive
outcomes are:

- Preserve `unladenMassResult`, `fuelCapacityResult` and `cargoCapacityResult` as exact
  `CalculationResult` values, including `reason`, slot, symbol, message, params and package order.
- Cache all three `standardLoadResult()` values as the FSD-aware/load-aware guard. Call
  `jumpRangeSummary()` once only when all three aggregate and all three standard-load results are
  complete; then retain all six range fields and all three package jump counts.
- Resolve the selected load only through `standardLoadResult(load)`. When unladen mass and that load
  are complete, call `mobilityMetricsResult({ ...load.value, enginesPips })` once and preserve all
  seven returned fields or its exact structured issues.
- The diagnostic mobility facade directly distinguishes missing, disabled, shed, package-issue
  `unresolved` and invalid inputs. Only package-resolved module identities enter. A complete
  all-zero result above thruster maximum mass remains ready zero; no
  feature 005 join or local power inference is needed.
- Locate core sources through `ShipLoadout.slots('core')` and each slot's package `core`
  discriminator, retaining its exact `key`. This avoids the incorrect `Thrusters` key—the game's
  thruster slot key is `MainEngines`—and still represents empty/package-incomplete mounts.
- Show FSD/thruster parameters only from the fitted module's post-engineering `effectiveStats`, and
  selected-load multipliers only from `MobilityMetrics`. Do not calculate bars, percentages,
  headroom, decomposition or curves.
- Project every `fittedModules()` entry by exact slot with `effectiveStats.mass` or unavailable;
  never re-sum the list or inspect raw engineering modifiers.
- Reuse feature 003 conditions/status contracts and feature 011 interface foundations. No route,
  persisted condition or feature-owned visual language is added.

All planning questions are resolved and no Almanac release blocker was found. The shared strict-mode
and feature 011 repository gates remain prerequisites to implementation completion.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the revision-stamped snapshot, exact diagnostic results,
  guarded jump result, selected-load mobility result, sparse source facts, fitted-module masses and
  lifecycle states.
- [contracts/jump-performance.md](./contracts/jump-performance.md) freezes the complete-result guard,
  one-call summary mapping, zero semantics and FSD provenance.
- [contracts/mobility-performance.md](./contracts/mobility-performance.md) freezes standard-load/ENG
  inputs, all seven fields, structured thruster issues and null-versus-zero behavior.
- [contracts/mass-and-capacity.md](./contracts/mass-and-capacity.md) freezes the three aggregate
  results and every exact-slot post-engineering module mass.
- [contracts/status-integration.md](./contracts/status-integration.md) freezes feature 003's selected
  jump/top-speed/unladen-mass adapter and qualification ownership.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to the in-workspace
  capability and its shared integration surfaces.
- [design/mobility-and-jump-profile.md](./design/mobility-and-jump-profile.md) defines semantic order,
  responsive composition, states and announcements.
- [design/reference-review.md](./design/reference-review.md) records the exact `.design` regions and
  accepted/rejected elements.
- [quickstart.md](./quickstart.md) provides runnable package, unit, E2E, responsive, localization and
  accessibility validation scenarios.

## Post-Design Constitution Re-check

Phase 1 introduces no backend, persistence, private game catalogue, local game formula, second
condition store, private power classification, hard-coded display string or one-off visual literal.
Every package value remains exact; every incomplete result retains the package issue object and
order; every absent optional parameter remains absent; every complete zero remains numeric zero.
The full content is present at every layout and every FR has a surface and verification owner.

The design gate remains **PASS with no exception**. Shipping remains blocked until shared strict
mode and feature 011's dual-engine responsive/accessibility foundation are present; these are
dependencies to satisfy, not grounds for relaxing the constitution.

## Complexity Tracking

No constitutional violation is proposed. The projector/store/presenter split is the minimum needed
to keep package reads render-free, revision-coherent and presentation-only at the component layer.
