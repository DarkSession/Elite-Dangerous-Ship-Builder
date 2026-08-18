# Implementation Plan: Defence Profile

**Branch**: `006-defence-profile` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-defence-profile/spec.md`

## Summary

Present one revision-consistent, read-only defence projection for the active `ShipLoadout`: complete
shield strength/contributions/multipliers/resistances/effective pools, separate recovery phases,
every fitted cell bank, complete armour/module protection, hull hardness and exact-slot source
navigation. A pure projector copies four defence façade results, auxiliary package power context and
package fitted/hull records under feature 003's selected SYS pips; discriminated views preserve
unavailable, zero, negative, qualified and field-specific infinite states without local calculation
or aggregate apportionment.

## Technical Context

**Language/Version**: TypeScript 6.0, Angular 22.1 standalone and zoneless

**Primary Dependencies**: `@elite-dangerous-almanac/core@0.1.1` leaf exports, Angular signals,
feature 001 active-build boundary, feature 002
exact-slot coordinator, feature 003 viewing conditions/headlines and feature 011 UI/i18n/test
foundation

**Storage**: N/A. Defence snapshots, source manifests and SYS-pip viewing state are memory-only and
excluded from local records, edit history, URLs and SLEF.

**Testing**: Vitest beside source with enforced 80% coverage; Playwright in Chromium and Firefox at
desktop, tablet/mobile portrait and landscape; automated accessibility checks over every state

**Target Platform**: Static client-side browser application on current Chromium and Firefox;
responsive pointer/touch presentation through 400% zoom

**Project Type**: Single Angular web application with no backend

**Performance Goals**: Every affected defence snapshot reaches matching rendered build/condition
revisions within 100 ms at the mobile viewport under Chromium 4x CPU slowdown

**Constraints**: Package-owned facts/calculations only; one active build; one shared pip condition; no
mixed revisions, inferred power verdict, hull fallback, clamping, aggregate apportionment or hard-coded
owned text/visual literal; no horizontal page scrolling; WCAG 2.2 AA except the constitution's named
keyboard-operation exclusions

**Scale/Scope**: One active build up to the package hull's complete slot set; four damage types across
shield/armour, all fitted cell banks and every recognized defence source inside the existing `/build`
workspace

## Constitution Check

_GATE: Passed before Phase 0 research and re-checked after Phase 1 design._

| Principle                               | Evidence                                                                                                                                | Result                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | Projection, conditions and slot intents run entirely in the browser and persist no derived defence state.                               | PASS                   |
| II. Almanac Source of Truth             | Four defence methods, structured result companions, auxiliary `powerBudget()` and package hull/fitted records own every value/state.    | PASS                   |
| III. Domain Logic Outside UI            | Pure projector/semantic adapters and a signal presenter precede input/output-only components.                                           | PASS                   |
| IV. Lossless, Honest Builds             | Discriminated states preserve absence, zero, negative, qualification and non-finite meaning; one revision tuple publishes atomically.   | PASS                   |
| V. Desktop, Tablet and Mobile           | One complete semantic order adapts across the ten browser/viewport/orientation projects through 400% zoom.                              | PASS                   |
| VI. Commander's Language                | Owned labels/formatting use feature 011; package hull/module text is neither parsed nor privately translated.                           | PASS                   |
| VII. One Design System                  | Defence surfaces compose feature 011 tokens/primitives; `.design` contributes hierarchy only.                                           | PASS                   |
| VIII. Tested Before It Ships            | Exact package-equality unit tests plus dual-engine multi-viewport Playwright, axe, manual SR checks and throttled timing are specified. | PASS; prerequisite 011 |
| IX. Specification Before Implementation | [screen-inventory.md](./design/screen-inventory.md) maps FR-001–FR-009 before task breakdown.                                           | PASS                   |

Released Almanac dependencies:

1. [Almanac #296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) makes shield and
   recovery respect power shedding and supplies structured result companions.
2. [Almanac #297](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/297) rejects unknown
   hulls at construction before hull-dependent defence can be read.

Both dependencies are released in 0.1.1. Research established no additional unresolved Almanac
dependency.

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
│   └── source-targeting-and-announcements.md
└── design/
    ├── defence-profile.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── defence/
│       ├── defence-projector.ts
│       ├── defence-snapshot.ts
│       └── semantic-defence-value.ts
├── application/
│   └── defence/
│       ├── defence.presenter.ts
│       └── defence-source-projector.ts
├── i18n/                                # supplied by feature 011
├── ui/                                  # supplied/extended through feature 011
└── features/
    └── build-workspace/
        └── defence/
            ├── armour-profile/
            ├── cell-banks/
            ├── defence-profile/
            ├── defence-sources/
            ├── shield-profile/
            └── shield-recovery/

e2e/
├── accessibility.ts                    # supplied by feature 011
└── defence-profile.spec.ts
```

**Structure Decision**: Keep one Angular application and one active build. Feature 006 owns pure
projection, semantic presentation types and capability composition only. Feature 001 stamps build
revisions, feature 003 supplies the single pip revision, feature 002 owns exact-slot navigation and
feature 011 supplies shared presentation infrastructure. No defence-derived value or condition is
persisted.

## Phase 0: Research Conclusions

All decisions, package contracts, alternatives and runtime probes are recorded in
[research.md](./research.md). The decisive outcomes are:

- One projector calls `shieldMetricsResult`, `shieldRecoveryResult`, `cellBanks`, `armourMetrics` and auxiliary
  `powerBudget()` exactly once for one build/condition revision and publishes atomically.
- Every shield/armour/recovery/bank field is copied directly. Zero and negative remain numeric;
  effective-pool and recovery infinities receive separate semantic discriminants.
- Generator availability/power context accompanies the structured results. A shed generator makes
  shield and recovery unavailable without an application override.
- Cell-bank list length distinguishes none fitted from fitted/all-unpowered zero totals. Returned
  slot/symbol/power and totals are authoritative.
- Hardness is the exact hull record rating. Module armour/protection remain separate from hull hit
  points and no weapon matchup is invented.
- Fitted package snapshots provide exact source identities/slots. Aggregate contributions remain
  aggregate and are never allocated to sources.
- The `.design` two-panel/damage-row hierarchy is adopted, while mock calculations, abbreviated
  narrow content and derived visuals are rejected.
- 0.1.1 supplies structured unavailable results for shed power and rejects unknown hulls at
  construction; regressions pin #296/#297.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the atomic snapshot, shield/recovery/bank/armour unions,
  damage-row semantic values, generator state, source identity and transitions.
- [contracts/shield-profile.md](./contracts/shield-profile.md) freezes exact method calls, complete
  field mapping, availability/power separation and field-specific non-finite meanings.
- [contracts/cell-banks.md](./contracts/cell-banks.md) freezes empty/fitted semantics, all returned
  bank fields, exact totals, power qualification and slot identity.
- [contracts/armour-profile.md](./contracts/armour-profile.md) freezes complete armour/hardness
  mapping and hull/module/source separation.
- [contracts/source-targeting-and-announcements.md](./contracts/source-targeting-and-announcements.md)
  freezes source classification, the apportionment prohibition, exact-slot intent and announcements.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to the existing
  workspace surfaces; [defence-profile.md](./design/defence-profile.md) specifies complete responsive
  states; [reference-review.md](./design/reference-review.md) records adopted hierarchy/departures.
- [quickstart.md](./quickstart.md) provides released-regression checks, exact-equality journeys and the full
  performance/accessibility validation matrix.

## Post-Design Constitution Re-check

Phase 1 introduces no server, persistence, private catalogue, alternate formula, local package-result
correction, component-owned domain logic, second pip store, hard-coded display text or visual literal.
Semantic wrappers preserve package values and meanings; source manifests contain package identity and
state only, never derived contribution shares. The visual reference supplies hierarchy without
becoming a second design system. Every FR has a surface owner and a dual-engine accessible path.

The planning gate remains **PASS** with no exception. Almanac 0.1.1 satisfies #296 and #297;
implementation remains dependent on feature 011's Firefox/landscape/accessibility harness and other
repository prerequisites. Rerun both regressions before task generation or implementation.

## Complexity Tracking

No constitutional exception is requested. Discriminated presentation states are the minimum needed
to preserve package absence, qualification and non-finite meaning. Shared workspace/condition/slot/UI
boundaries avoid duplicate state and calculations.
