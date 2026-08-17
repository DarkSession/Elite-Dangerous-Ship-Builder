# Implementation Plan: Ship Statistics and Status

**Branch**: `003-ship-statistics` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-ship-statistics/spec.md`

## Summary

Present one revision-consistent, read-only status projection for the active `ShipLoadout`: exact
structural validation, ordered package issues, area-owned headline results, assembly requirements,
fixed-mount normalisation provenance and ephemeral load/pip/hardpoint conditions. A pure snapshot
assembler consumes feature 005–009 ports and publishes one discriminated result model so zero,
unavailable, incomplete, qualified, infinite and absent states cannot collapse into one another.

## Technical Context

**Language/Version**: TypeScript 6.0, Angular 22.1 standalone and zoneless

**Primary Dependencies**: `@elite-dangerous-almanac/core@0.1.0-beta.12` leaf exports (upgrade to
released fixes for the upstream gates below), Angular signals, feature 001 active-build boundary,
feature 002 exact-slot coordinator, feature 005–009 result ports and feature 011 UI/i18n foundation

**Storage**: Viewing conditions are memory-only. Fixed-mount normalisation provenance is local
metadata in feature 001's independently versioned `localStorage` record; it is excluded from the
modelled snapshot, history, preferences, link and SLEF.

**Testing**: Vitest beside source with enforced 80% coverage; Playwright in Chromium and Firefox at
desktop, tablet, mobile portrait and landscape; automated accessibility checks over every state

**Target Platform**: Static client-side browser application on current Chromium and Firefox;
responsive touch/pointer presentation through 400% zoom

**Project Type**: Single Angular web application with no backend

**Performance Goals**: Every affected status/result reaches a matching rendered revision within
100 ms at the mobile viewport under Chromium 4x CPU slowdown

**Constraints**: Package-owned facts and calculations only; one active build; no mixed revisions;
no fabricated diagnosis or readiness verdict; no hard-coded owned text or visual literals; no
horizontal page scrolling; WCAG 2.2 AA except the constitution's keyboard-operation exclusions

**Scale/Scope**: One active build of up to the package hull's complete slot set; seven headline
presentations, an ordered issue/provenance list, three load states, valid six-pip allocations and
credit/Merc Coin/material summaries within the existing `/build` workspace

## Constitution Check

_GATE: Passed before Phase 0 research and re-checked after Phase 1 design._

| Principle                               | Evidence                                                                                                                           | Result                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| I. Client-Side Only                     | Projection, conditions and coordination run in the browser; only approved local record metadata persists.                          | PASS                       |
| II. Almanac Source of Truth             | Area ports and package validation own every game fact and verdict. Defects are upstream issues, never local gates or corrections.  | PASS; implementation gated |
| III. Domain Logic Outside UI            | Pure result adapters, snapshot assembler, condition store, target coordinator and announcer precede components.                    | PASS                       |
| IV. Lossless, Honest Builds             | Discriminated states preserve zero, absence, qualification and package failure; one revision tuple is published atomically.        | PASS; implementation gated |
| V. Desktop, Tablet and Mobile           | The wide rail, tablet outlet and narrow Status capability preserve all actions and information at 400% zoom.                       | PASS                       |
| VI. Commander's Language                | Application labels and formatting use feature 011 localization; package text is neither parsed nor privately translated.           | PASS                       |
| VII. One Design System                  | The status surfaces compose feature 011 tokens/primitives; `.design` supplies hierarchy, not values or a parallel visual language. | PASS                       |
| VIII. Tested Before It Ships            | Domain/integration tests plus dual-engine, multi-viewport Playwright, axe and a throttled performance assertion are specified.     | PASS; prerequisite 011     |
| IX. Specification Before Implementation | [screen-inventory.md](./design/screen-inventory.md) maps FR-001–FR-022 before task breakdown.                                      | PASS                       |

Upstream dependencies:

1. [Almanac #296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) must make
   `mobilityMetrics()` and `shieldRecovery()` respect package power shedding. Feature 003 cannot
   present the top-speed headline from the current incorrect finite result.
2. [Almanac #297](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/297) must make
   hull-dependent defence façades represent an unresolved hull as unavailable rather than an
   apparently authoritative zero. Feature 003 cannot reinterpret the current numeric result.
3. [Almanac #295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295) tracks a
   first-class standard-load input/result API. Beta.12 can reproduce the maximum-jump fuel through
   `fuelPerJump(maxJumpRange())`, so this is an API improvement rather than a blocker.
4. Feature 002's normalised-state integration remains gated by
   [Almanac #291](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/291) and
   [#292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292). Feature 003 may consume
   fixed-mount provenance only after that ingress path is available.

## Project Structure

### Documentation (this feature)

```text
specs/003-ship-statistics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── status-snapshot.md
│   ├── targeting-and-announcements.md
│   └── viewing-conditions.md
└── design/
    ├── reference-review.md
    ├── screen-inventory.md
    └── status-overview.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── statistics/
│       ├── headline-result.ts
│       ├── status-snapshot-assembler.ts
│       └── viewing-conditions.ts
├── application/
│   ├── active-build/                    # feature 001; provenance metadata extension
│   └── statistics/
│       ├── status-announcement-coordinator.ts
│       ├── status.store.ts
│       ├── viewing-conditions.store.ts
│       └── workspace-target-coordinator.ts
├── i18n/                                # supplied by feature 011
├── ui/                                  # supplied/extended through feature 011
└── features/
    └── build-workspace/
        └── status/
            ├── assembly-summary/
            ├── headline-set/
            ├── issue-list/
            ├── status-overview/
            └── viewing-conditions/

e2e/
├── accessibility.ts
├── ship-status.spec.ts
├── status-provenance.spec.ts
└── viewing-conditions.spec.ts
```

**Structure Decision**: Keep a single Angular application and a single active build. Feature 003
owns only coordination and presentation. Package-facing calculations stay behind the owning feature
005–009 ports, and a pure assembler combines one build revision and one condition revision before a
single store publication. Every surface remains inside `/build`; narrow layouts select the Status
capability in memory because the URL fragment is reserved for the build payload.

## Phase 0: Research Conclusions

All decisions, runtime probes, alternatives and upstream defects are recorded in
[research.md](./research.md). The decisive outcomes are:

- Structural status is the literal pair `validation.valid` and `validation.complete`; ordered issue
  records are preserved without deduplication, parsing or inferred targeting.
- Headline calculations come from feature 005–009 adapters. Power selects the exact package
  hardpoint field; jump selects the package standard-load field; mobility uses package-derived load
  inputs and selected ENG pips.
- One `StatusSnapshot` captures one immutable loadout/revision/condition tuple and publishes all
  status, issues, headlines and requirements together. Stale work is discarded.
- Viewing conditions default to unladen, 2/2/2 and deployed, accept only valid settled six-pip
  allocations, reset on reload/replacement and are excluded from every persistence/publication type.
- Fixed-mount normalisation provenance is durable local-record metadata but remains outside modelled
  build data and edit history; a successful Commander edit to the exact mount clears it.
- The `.design` status rail/card hierarchy is adopted. Mock calculations, warnings, comparisons,
  locally summed totals and external imagery are not.
- Beta.12 produces incorrect authoritative-looking performance in two required states. The feature
  waits for #296 and #297 rather than correcting those results locally.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines conditions, revision context, structural and issue views,
  discriminated result states, the atomic status snapshot, exact targets and local provenance.
- [contracts/status-snapshot.md](./contracts/status-snapshot.md) freezes area ownership, calculation
  inputs, result-state semantics and atomic publication.
- [contracts/viewing-conditions.md](./contracts/viewing-conditions.md) defines defaults, validation,
  package mappings, reset behavior and strict exclusion boundaries.
- [contracts/targeting-and-announcements.md](./contracts/targeting-and-announcements.md) defines exact
  slot/detail targets, settled count announcements and provenance lifecycle.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every requirement to the existing
  workspace surfaces; [status-overview.md](./design/status-overview.md) specifies responsive states.
- [design/reference-review.md](./design/reference-review.md) records the accepted 1c/1d hierarchy and
  every package, scope, localization and accessibility adaptation.
- [quickstart.md](./quickstart.md) provides acceptance journeys, upstream gates and performance/a11y
  verification.

## Post-Design Constitution Re-check

Phase 1 introduces no server, private game catalogue, alternate formula, local power/defence verdict,
component-owned calculation, persisted viewing preference, hard-coded display text or visual literal.
The new local provenance field is a narrowly allowlisted workflow disclosure and is explicitly absent
from `BuildSnapshotV1`, history, link and SLEF. The design reference contributes layout hierarchy only;
all displayed values and qualifications remain package/area owned. Every FR has a surface owner and a
dual-engine accessibility path.

The planning gate remains **PASS** with no exception. Implementation is **blocked upstream** on
released fixes for #296 and #297, and its normalisation-provenance path additionally depends on the
feature 002 release gates #291/#292. After package upgrade, rerun all minimal reproductions and the
post-design constitution check before task generation or implementation.

## Complexity Tracking

No constitutional exception is requested. Cross-feature ports prevent duplicate calculations, and
upstream gaps remain blockers instead of application-side workarounds.
