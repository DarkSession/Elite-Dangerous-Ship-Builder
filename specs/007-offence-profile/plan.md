# Implementation Plan: Offence Profile

**Branch**: `007-offence-profile` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-offence-profile/spec.md`

## Summary

Add the `OFFENCE` mode of the hull anatomy region inside feature 001's `/build` workspace, and one
`DPS` cell to the outfitting status rail. Selecting `OFFENCE` retitles the region
`OFFENCE ANALYSIS`, removes the plates, their side selector and their legend exactly as the
artboard's own switching script does, and draws three blocks in the space they leave: `WEAPONS`,
`DAMAGE PROFILE` and `SHOT CONVERGENCE`. This is the composition feature 005 already ships for
`POWER`, on the same strip and through the same mechanism.

A pure projection reads `ShipLoadout.weaponMetrics()` once and
`ShipLoadout.weaponsCapacitorMetrics()` once for the WEP allocation feature 005's shared
`PowerConditionsStore` holds, and both surfaces read that one projection. It also asks the package
for the falloff multiplier at the canvas's four range bands and for the hull's published hardpoint
geometry. No weapon total, range attenuation, target result, capacitor drain, endurance value or
mount offset is recalculated locally.

[design/canvas-contract.md](./design/canvas-contract.md) is the template, and it is what settles
scope. Everything user-facing is a thing a canvas draws. The one region rejected is the mobile
canvas's `VS 45% RESIST` block — target simulation the package returns no result for — and the
package fields no canvas draws are not read at all.

## Technical Context

**Language/Version**: TypeScript, Angular HTML and SCSS; Angular standalone and zoneless; Node.js per
the repository tooling configuration

**Primary Dependencies**: Angular signals; `@elite-dangerous-almanac/core` leaf exports for loadout
weapon results, weapon types, capacitor results, damage falloff, ship gunsights and slot layouts,
plus the package's own localization helpers for game text; feature 001's active build and revision; feature 002's slot views and engineering summary; feature 005's `PowerConditionsStore` WEP allocation; feature 010's
anatomy mode strip; feature 011's design system, localization, formatters, previews and verification
harness

**Storage**: None. Package results, semantic states and the chosen convergence target range stay in
memory. Nothing enters local records, edit history, preferences, routes, links or SLEF

**Testing**: Vitest through Angular's unit-test builder with the existing 80% statement, branch,
function and line thresholds; Playwright with `@axe-core/playwright` over desktop, tablet portrait,
tablet landscape, mobile portrait and mobile landscape in Chromium and Firefox; manual screen-reader
and actual 400% zoom protocols

**Target Platform**: Static client-side application for modern Chromium and Firefox on desktop,
tablet and mobile; portrait and landscape; pointer, touch and screen reader; usable offline after
first load

**Project Type**: One client-side Angular single-page application producing static files only

**Performance Goals**: The feature specification sets no independent numeric target. The projection
is a pure synchronous read the signal graph memoises, which is the shape features 005 and 009
already ship

**Constraints**: No server, account, telemetry or cross-origin runtime request; no local weapon,
falloff, piercing-factor, target, mount-geometry, pip-scaling, recharge, drain or endurance
calculation — a share or a bar fill over amounts stated on the same screen is presentation, not a
measurement; no cause inferred from a zero or an infinity; optional, zero, disabled,
unlimited and infinite states retain package meaning; all owned text and figures localized; one
tokenized dark theme; no document horizontal scrolling; WCAG 2.2 AA except criteria 2.1.1, 2.1.2,
2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: The complete installed hull and hardpoint catalogues; normal hull layouts contain at
most 10 known hardpoint slots. The returned collection has no application cap because package-valid
weapons in unknown or unmapped source slots are appended

**Design Reference**: [design/canvas-contract.md](./design/canvas-contract.md), extracted from
`.design/Ship Builder.dc.html` canvas 1c's `OFFENCE ANALYSIS` panel and canvas 1d's mobile
`OFFENCE` panel. Every adoption, departure and rejection is recorded there;
[design/reference-review.md](./design/reference-review.md) records the reasoning behind them

## Constitution Check

_GATE: The design passes with no constitutional exception._

| Principle                               | Design evidence                                                                                                                                                                      | Status |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| I. Client-Side Only                     | All reads use one in-memory loadout and the installed package; the feature adds no storage or network boundary.                                                                      | PASS   |
| II. Almanac Source of Truth             | Exact package results own every numeric field; package ordering, optionality, zero and infinity are retained without joins or formulas.                                              | PASS   |
| III. Domain Logic Outside UI            | A framework-agnostic projection precedes input/output-only components.                                                                                                               | PASS   |
| IV. Lossless, Honest Builds             | Returned package identities are preserved; unavailable coverage, sparse fields, an unpublished gunsight and both infinities stay distinct.                                           | PASS   |
| V. Desktop, Tablet and Mobile           | One semantic order adapts across five layouts in both engines, with touch, screen reader, text-size, zoom, orientation and overflow verification.                                    | PASS   |
| VI. Commander's Language                | Application labels and units use feature 011; module names use Almanac locale helpers with disclosed canonical fallback.                                                             | PASS   |
| VII. One Design System                  | The capability composes `src/app/ui/` and extends it with one primitive the system lacked — a range field, declared in the preview manifest. The canvas contract supplies hierarchy. | PASS   |
| VIII. Tested Before It Ships            | Exact package-equality tests, two engines, five layouts, axe and manual assistive protocols retain the 80% gate.                                                                     | PASS   |
| IX. Specification Before Implementation | Every FR maps to a drawn surface, a contract and a preview state before task generation.                                                                                             | PASS   |

### Delivery prerequisites

All of them are in the repository already, which is what makes this feature buildable now:

1. Feature 001's active `{ loadout, revision }` boundary and `/build` workspace — `ActiveBuildStore`.
2. Feature 002's slot views and engineering summary — `OutfittingStore`, and the same-revision
   `hardpointCoverage()` adapter over its slot views.
3. Feature 005's `PowerConditionsStore`, which holds the WEP allocation this feature reads.
4. Feature 010's anatomy mode strip, which already draws a disabled `OFFENCE` segment.
5. Feature 011's tokens, components, game-text presenter, formatters, previews, ten-project
   Chromium/Firefox matrix and axe harness.

Nothing here waits on an unimplemented port. In particular this feature does **not** consume a
mount-power observation: no canvas draws a distributor observation beside the capacitor, so none is
built, and a zero capacity is stated as the package's own result with no cause attached.

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
    ├── canvas-contract.md
    ├── component-state-preview-matrix.md
    ├── offence-profile.md
    ├── reference-review.md
    └── screen-inventory.md
```

### Source Code (repository root)

```text
src/app/
├── domain/offence/
│   ├── offence.ts                     # the projection and its semantic states
│   ├── convergence.ts                 # the gunsight projection and its range view
│   └── offence.fixtures.ts            # preview and suite fixtures
├── ui/components/range-field/         # the native range control the canvas draws
└── features/build-workspace/outfitting/
    ├── offence-analysis/              # the OFFENCE mode panel
    │   └── shot-convergence/          # the gunsight plate, its range and its facts
    └── offence-summary/               # the status rail DPS cell

e2e/
└── offence-profile.spec.ts
```

The `OFFENCE` segment is enabled in
`src/app/features/build-workspace/outfitting/hull-anatomy/`, which is feature 010's and is where feature 005
enabled `POWER`. `scripts/policy/offence-ownership.mjs` keeps the package boundary.

There is no `application/offence/` layer: this feature adds no state. The one condition it reads —
the WEP allocation — is feature 005's store, and the chosen convergence target range is the panel's
own component state.

**Structure Decision**: One projection, read by both surfaces, memoised by the signal graph, with the
target range applied over it as a second cheaper read. Feature 001 owns the build, feature 002 owns
slot selection and editing, feature 010 owns the mode strip, feature 005 owns the pip allocation,
and feature 011 owns shared presentation. No route, persistence model, second loadout or new store is added.

## Phase 0: Research Conclusions

The complete decisions and runtime probes are in [research.md](./research.md). The decisive outcomes:

- Retain the exact `BuildWeaponMetrics` object, and read from it where each figure is drawn.
- Disabled weapons remain in the returned list and are omitted from totals exactly as the package
  specifies. Same-revision package slot coverage distinguishes confirmed empty hardpoints from
  unavailable coverage; `weapons.length` is never a substitute.
- Optional `unclassified` is absent when its amount is zero, so an absent member and a zero member
  are drawn the same way: neither takes a segment or a legend line. Missing range, projectile
  metadata or piercing is a different thing — it stays not stated on a weapon row and is never
  zero-filled.
- `antiXeno` and `sustainedDamageByType` are not read: no canvas draws either, so no combined total
  and no target-adjusted figure can be reached from anywhere.
- Numeric infinity never enters a generic formatter; the endurance meanings carry it as a state.
- The WEP allocation is read from feature 005's store and passed to the package unchanged. That store
  already holds pips on the game's own half step in the package's `[0, 4]` range, so there is no
  conversion at the boundary and nothing to get wrong.
- The canvases supply hierarchy and labels; their sample values contradict each other and are not
  authoritative. Their shares are proportions of package amounts stated on the same screen, their
  range bands are the package's own `damageFalloff()`, and their convergence is the package's own
  published gunsight geometry. Only the mobile canvas's target-resistance block is out of scope.

## Phase 1: Design Outputs

- [design/canvas-contract.md](./design/canvas-contract.md) is the template: every drawn element, what
  it is built as, what is not built and why, and the fields no canvas draws.
- [data-model.md](./data-model.md) defines the projection, exact package result retention, hardpoint
  coverage and capacitor semantics.
- [contracts/weapon-output.md](./contracts/weapon-output.md) freezes the one-call build boundary,
  field inventory, ordering, damage and absence semantics, the range bands and the gunsight
  geometry.
- [contracts/capacitor-endurance.md](./contracts/capacitor-endurance.md) freezes the WEP allocation
  boundary, the four drawn fields and the zero/infinity wording.
- [contracts/workspace-integration.md](./contracts/workspace-integration.md) freezes the mode strip,
  the rail cell and the inert weapon row.
- [design/screen-inventory.md](./design/screen-inventory.md) maps FR-001–FR-013 to the drawn blocks. FR-012 was withdrawn on 2026-08-24 and reinstated on 2026-08-26, with FR-013 added beside it; both are sanctioned departures from the canvas rather than readings of it.
- [design/offence-profile.md](./design/offence-profile.md) defines information order, composition and
  every semantic state.
- [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md) records the
  states owed at five layouts, and which of them the preview manifest reaches.
- [quickstart.md](./quickstart.md) supplies runnable API, equality, state, navigation, responsive,
  localization and accessibility validation.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persistence, new route, new store, private game catalogue, local game
formula, target model, visual literal, hard-coded application string or reduced mobile data set. One
primitive joins the design system — a range field — declared in the preview manifest, which is what
constitution VII asks of an extension. Canonical package names remain preserved beside localized
presentation. Structural absence, numeric zero, disabled entries, unavailable coverage, an
unpublished gunsight and both infinity meanings remain distinct. Every requirement has a drawn surface, a covered state and a dual-engine validation path.

The planning gate is **PASS with no exception**, and delivery is **unblocked**.

## Complexity Tracking

No constitutional violation requires justification. One projection and one policy check are the
minimum boundaries needed to keep package results coherent without duplicating build, outfitting or
power logic.
