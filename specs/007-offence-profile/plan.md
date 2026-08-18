# Implementation Plan: Offence Profile

**Branch**: `007-offence-profile` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-offence-profile/spec.md`

## Summary

Add one complete Offence Profile capability to the existing `/build` workspace. A pure,
revision-stamped projector retains one exact `ShipLoadout.weaponMetrics()` result for the active
build and one exact `ShipLoadout.weaponsCapacitorMetrics()` result for the settled WEP allocation.
Feature 003 stores pips as integer half-pips, so feature 007 divides WEP by two exactly once at the
capacitor call boundary and then displays the package-returned allocation. No weapon total, damage
share, range attenuation, target result, capacitor drain or endurance value is recalculated.

The same package projection supplies feature 003's sustained-DPS Status provider and feature 002's
exact-slot navigation. Same-revision hardpoint coverage qualifies an empty package weapon list
without fabricating weapon output. Zero-capacity context consumes a feature-005-owned deployed
distributor power observation; that port does not exist yet and is an explicit delivery prerequisite,
not a capability feature 007 recreates.

The visual hierarchy comes from `.design/Ship Builder.dc.html` canvases 1c and 1d. The wide canvas's
prominent burst/sustained headline and scannable weapon list, and the narrow canvas's vertical-card
direction, are retained. The two canvases are not treated as content-equivalent: their contradictory
sample values, damage shares, range bands, convergence, target resistance, alpha, corrosion bonus and
normalized capacitor bars are rejected.

## Technical Context

**Language/Version**: TypeScript 6.0.3, Angular HTML and SCSS; Angular 22.1 standalone and zoneless;
Node.js 24 for tooling. Full TypeScript and Angular-template strictness is required but is not enabled
in the current root configuration

**Primary Dependencies**: Angular signals; RxJS 7.8; `@elite-dangerous-almanac/core@0.1.2` leaf
exports for loadout weapon results, weapon types, capacitor results, ammunition, projectile metadata
and game-text localization; feature 001 active-build revisions; feature 002 same-revision hardpoint
coverage and exact-slot reveal; feature 003 viewing conditions, Status-provider envelope and
workspace targets; feature 005 deployed module-power observation; feature 011 design-system,
localization, preview and verification foundations

**Storage**: None. Package results, semantic presentation state, selected capability, expanded weapon
details and announcements stay in memory. WEP conditions remain feature 003 state. Nothing enters
local records, edit history, preferences, routes, links or SLEF

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement, branch,
function and line thresholds; Playwright with `@axe-core/playwright` over desktop, tablet portrait,
tablet landscape, mobile portrait and mobile landscape in Chromium and Firefox; manual screen-reader
and actual 400% zoom protocols

**Target Platform**: Static client-side application for modern Chromium and Firefox on desktop,
tablet and mobile; portrait and landscape; pointer, touch and screen reader; usable offline after
first load

**Project Type**: One client-side Angular single-page application producing static files only

**Performance Goals**: The feature specification sets no independent numeric target. Cache the
weapon projection by build revision, cache the capacitor/context projection by build and settled
condition revision, satisfy feature 003's Status update contract and preserve the production bundle
budgets

**Constraints**: No server, account, telemetry or cross-origin runtime request; no local weapon,
damage share, falloff, piercing-factor, target, convergence, pip-scaling, recharge, drain or endurance
calculation; no cause inferred from a zero or null; optional, zero, disabled, unlimited and infinite
states retain package meaning; all owned text and figures localized; one tokenized dark theme; no
document horizontal scrolling; WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11

**Scale/Scope**: The pinned package contains 48 hulls and 159 hardpoint catalogue records; normal
hull layouts contain at most 10 known hardpoint slots. The returned collection has no application cap
because package-valid weapons in unknown/unmapped source slots are appended. One active build presents
one package total, every returned weapon entry, one capacitor result and one compact Status
contribution

**Design Reference**: `.design/Ship Builder.dc.html` canvas 1c wide Offence Analysis and canvas 1d
mobile Offence mode. Exact adoption and departures are in
[design/reference-review.md](./design/reference-review.md)

## Constitution Check

_GATE: The design passes with no constitutional exception. Delivery is blocked by missing shared
strictness and prerequisite contracts listed below._

| Principle                               | Design evidence                                                                                                                                                         | Status                 |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | All reads use one in-memory loadout and the installed package; the feature adds no storage or network boundary.                                                         | PASS                   |
| II. Almanac Source of Truth             | Exact package facade results own every numeric field; package ordering, optionality, zero and infinity are retained without joins or formulas.                          | PASS                   |
| III. Domain Logic Outside UI            | A framework-agnostic projector and revision/provider adapters precede input/output-only components.                                                                     | PASS                   |
| IV. Lossless, Honest Builds             | Returned package identities are preserved; unknown modules normalize before projection; unavailable coverage, sparse fields, unlimited ammo and infinity stay distinct. | PASS                   |
| V. Desktop, Tablet and Mobile           | One complete semantic flow adapts across five layouts in both engines and includes touch, screen reader, text-size, zoom, orientation and overflow verification.        | PASS; prerequisite 011 |
| VI. Commander's Language                | Application labels/units use feature 011; module names use Almanac locale helpers with disclosed canonical fallback.                                                    | PASS; prerequisite 011 |
| VII. One Design System                  | The capability composes/extends `src/app/ui/`; `.design` supplies hierarchy only and every new component has the required preview matrix.                               | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Exact package-equality tests, two engines, five layouts, axe and manual assistive protocols retain the 80% gate.                                                        | PASS; prerequisite 011 |
| IX. Specification Before Implementation | Every FR maps to the in-workspace capability, contracts and component-state previews before task generation.                                                            | PASS                   |

### Delivery prerequisites and blockers

1. Enable the constitution's full TypeScript and Angular-template strictness through feature 011
   and make the existing project pass. The current root configuration has neither `strict` nor
   `strictTemplates`.
2. Implement feature 001's active `{ loadout, buildRevision }` boundary and `/build` workspace.
3. Accept feature 002's same-revision hardpoint coverage and shared exact-slot target boundary.
4. Implement feature 003's integer-half-pip conditions, `StatusRevisionContext`, generic
   `StatusProvider<T, I>` and `WorkspaceTarget` contracts.
5. Accept a feature-005-owned deployed distributor power-observation port backed by the same
   `powerBudget()` semantics feature 005 owns. Existing feature 005 contracts do not expose it;
   feature 007 must not infer a cause from capacitor zero/null or reconstruct priority shedding.
   Almanac 0.1.2 has resolved feature 005's separate heat-qualification gate.
6. Implement feature 011's tokens/components, game-text presenter, localization/formatters,
   component previews, ten-project Chromium/Firefox matrix and axe harness.

The current source contains only the shell and build-link codec. The current Playwright configuration
has three Chromium-only projects and no axe integration. Missing prerequisites block implementation;
they do not authorize feature-local substitutes.

The pinned Almanac 0.1.2 already exposes fitted maximum/falloff range, projectile boundaries,
armour piercing and documented weapon ordering. The installed behavior satisfies the work tracked by
Almanac issues #300 and #301; feature 007 has no remaining package blocker.

## Project Structure

### Documentation (this feature)

```text
specs/007-offence-profile/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── capacitor-endurance.md
│   ├── weapon-output.md
│   └── workspace-integration.md
└── design/
    ├── component-state-preview-matrix.md
    ├── offence-profile.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/offence/
│   ├── offence-projector.ts
│   ├── offence-projection.ts
│   └── offence-semantics.ts
├── application/offence/
│   ├── offence.facade.ts
│   ├── offence.presenter.ts
│   ├── offence-status.provider.ts
│   └── offence-workspace.adapter.ts
└── features/build-workspace/offence-profile/
    ├── offence-profile.component.ts
    ├── weapon-totals.component.ts
    ├── damage-type-output.component.ts
    ├── capacitor-endurance.component.ts
    └── weapon-output-list.component.ts

e2e/
└── offence-profile.spec.ts
```

Unit tests live beside every projector, presenter, provider, adapter and component. Shared fact,
notice, disclosure and exact-slot action patterns extend `src/app/ui/` through feature 011 rather
than becoming feature-local visual primitives.

**Structure Decision**: Keep one application, one active loadout, one settled condition store and
one workspace target model. Retain package result objects in a pure offence snapshot, adding only
semantic discriminants and cross-feature observations that do not alter their values. The detailed
capability and Status provider select the same cached build projection. Feature 003 owns capability
and condition lifecycle, feature 002 owns editing/slot reveal, feature 005 owns power semantics and
feature 011 owns shared presentation infrastructure. No route, persistence model or second loadout is
added.

## Phase 0: Research Conclusions

The complete decisions, runtime probes and alternatives are in [research.md](./research.md). The
decisive outcomes are:

- Retain the exact `BuildWeaponMetrics` object. Totals contain ten fields; each fitted entry retains
  exact identity, enabled state, ammunition, 14-field `WeaponMetrics` and sparse range/piercing data.
- Disabled weapons remain in the returned list and are omitted from totals exactly as the package
  specifies. Same-revision package slot coverage distinguishes confirmed empty hardpoints from
  unavailable hardpoint coverage omitted by the weapon facade.
- Optional `unclassified` is absent when its amount is zero; it is omitted or described as no
  unclassified damage, not as unavailable. Missing range, projectile metadata or piercing remains
  not stated and is never zero-filled.
- Anti-xeno remains an overlay. No conventional share, combined total or target-adjusted figure is
  created.
- Ammunition keeps `null`, finite, zero-reserve and unlimited states distinct; numeric infinity never
  enters a generic formatter or serializer.
- Convert integer half-pips to package pips once, then retain all six capacitor fields. Context
  changes wording for zero/infinity but never changes a package number.
- `weaponMetrics()` totals and capacitor firing draw have deliberately different enabled-versus-
  powered scopes and are never forced to match.
- A feature-005 deployed power observation is required for honest distributor context; the currently
  accepted feature-005 ports do not supply it.
- Feature 007 exports the missing `OffenceStatusProvider`, using exact sustained DPS and one owner
  qualification identity when unavailable hardpoint coverage makes that Status summary incomplete.
- Canvas 1c and 1d provide only hierarchy. Mobile omits the desktop weapon summary and contradicts
  its sample DPS, so parity and all missing states come from the accepted feature design, not the mock.

No planning clarification marker remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the projection lifecycle, exact package result retention,
  hardpoint coverage, capacitor semantics, deployed distributor context and Status projection.
- [contracts/weapon-output.md](./contracts/weapon-output.md) freezes the one-call build boundary,
  field inventory, ordering, damage/ammunition/absence semantics and exact-slot target.
- [contracts/capacitor-endurance.md](./contracts/capacitor-endurance.md) freezes half-pip conversion,
  every capacitor field, zero/infinity wording and the owner-supplied power observation.
- [contracts/workspace-integration.md](./contracts/workspace-integration.md) freezes revisions,
  feature 003's Status adapter, feature 002 coverage/slot handoff and announcements.
- [design/screen-inventory.md](./design/screen-inventory.md) maps FR-001–FR-007 to the one
  in-workspace capability and collaborating surfaces.
- [design/offence-profile.md](./design/offence-profile.md) defines complete information order,
  fluid composition, exact weapon details and every semantic state.
- [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md) records
  populated, empty, pending, failure, disabled and special-state previews at five layouts.
- [design/reference-review.md](./design/reference-review.md) distinguishes actual canvas behavior
  from required extensions and records every rejected mock calculation.
- [quickstart.md](./quickstart.md) supplies runnable API, equality, state, Status, navigation,
  responsive, localization and accessibility validation.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persistence, new route, private game catalogue, local game formula,
power-shedding reconstruction, target model, visual literal, hard-coded application string or reduced
mobile data set. Canonical package names remain preserved beside localized presentation. Structural
absence, numeric zero, disabled entries, unavailable coverage, unlimited ammunition and both infinity
meanings remain distinct. Every requirement has a surface, preview state and dual-engine validation
path.

The planning gate remains **PASS with no exception**. Delivery remains **BLOCKED** until the strict
compiler configuration and feature 001/002/003/005/011 boundaries above are accepted and available.

## Complexity Tracking

No constitutional violation requires justification. The projector, Status adapter and cross-feature
ports are the minimum boundaries needed to keep package results revision-coherent without duplicating
build, condition, outfitting or power logic.
