# Implementation Plan: Ship Statistics and Status

**Branch**: `003-ship-statistics` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-ship-statistics/spec.md`

> **Amended 2026-08-22 (wave 11).** Three collisions between the accepted specification and
> `.design/Ship Builder.dc.html` were surfaced before implementation and **the design won all three**
> ([design/reference-review.md](./design/reference-review.md)). The provider envelope, the composition
> transaction, the wide Status capability, the viewing-conditions control and the count announcer this
> plan describes below are all withdrawn or reassigned. Sections that no longer describe what is built
> are marked **superseded**; the surviving plan is one component at the head of feature 009's existing
> status rail. See [tasks.md](./tasks.md#retired-tasks).

## Summary

**Superseded in part.** The visual hierarchy still comes from `.design/Ship Builder.dc.html`, but the explicit desktop Status mode, viewing controls, qualified/unavailable states and detail actions named below were the spec-driven extensions the wave 11 rulings removed. What is built is the `BUILD STATUS` heading and the package validation issues beneath it, in the rail canvas 1c draws.

Add one revision-coherent Status capability to the existing `/build` workspace. Feature 003 owns
memory-only viewing conditions, the shared provider/target contracts and the composition of exact
`ShipLoadout.validation`, five area-owned headline projections and feature 009 assembly requirements.
A single computed projection invokes synchronous
provider ports with one captured build/condition revision and publishes the complete result at once;
components never call Almanac calculations or reinterpret provider states.

The visual hierarchy comes from `.design/Ship Builder.dc.html`: canvas 1c contributes the persistent
wide status rail and canvas 1d contributes the in-workspace Status capability. The accepted spec
requires more than the mock shows. The plan therefore adds an explicit desktop Status mode, viewing
controls, complete validation lists, qualified/unavailable states, units, detail actions
and accessible responsive behavior. The rail is a compact mirror; every diagnostic appears exactly
once in the complete Status capability.

## Technical Context

**Language/Version**: TypeScript in strict mode; Angular standalone and zoneless; HTML and SCSS;
Node.js per the repository tooling configuration

**Primary Dependencies**: Angular signals, RxJS,
`@elite-dangerous-almanac/core` leaf exports, feature 001 atomic active-build/revision and
local-record contracts, feature 002 committed-edit revision advancement and exact-slot editing,
feature 005–009 status-provider implementations, and feature 011 UI/localization/accessibility
infrastructure

**Storage**: Viewing conditions, capability selection, pending state and announcements are memory
only. Feature 003 adds no persisted field and no build/link/SLEF data

**Testing**: Vitest beside source with enforced 80% statement/branch/function/line coverage;
Playwright with `@axe-core/playwright` in Chromium and Firefox at desktop, tablet portrait/landscape
and mobile portrait/landscape; manual screen-reader and actual 400% zoom evidence for the primary
journey

**Target Platform**: Static client-side browser application on current Chromium and Firefox;
desktop, tablet and mobile; pointer and touch; portrait and landscape; usable offline after first load

**Project Type**: Single Angular web application with no backend

**Performance Goals**: A committed build edit or settled condition change renders the matching
status revision within 100 ms at the mobile viewport under Chromium 4x CPU slowdown

**Constraints**: No server, account, telemetry or cross-origin runtime request; package/provider
values and semantics remain unchanged; no mixed revisions; no fabricated diagnosis, target or
readiness verdict; no persisted viewing state; one dark tokenized design system; all owned text and
formatting localized; no document horizontal scrolling; WCAG 2.2 AA except criteria 2.1.1, 2.1.2,
2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active build of up to the package hull's complete slot set; two structural
facts, all ordered package issues, seven headline slots, three load choices, valid half-pip
allocations, two hardpoint choices and credit/Merc Coin/material summaries

**Design Reference**: `.design/Ship Builder.dc.html` canvases 1c and 1d. Exact adopted and rejected
elements are recorded in [design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: PASS after Phase 0 resolution; re-checked after Phase 1. No exception is requested._

| Principle                               | Design evidence                                                                                                                                               | Status                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | Projection uses the in-memory loadout, installed package and same-origin static assets; conditions and navigation stay in memory.                             | PASS                   |
| II. Almanac Source of Truth             | Validation is retained verbatim; area providers own package reads and semantic states; 003 neither recalculates nor reclassifies them.                        | PASS                   |
| III. Domain Logic Outside UI            | Framework-agnostic condition validation, provider contracts and a pure composition function precede signal stores and presentation components.                | PASS                   |
| IV. Lossless, Honest Builds             | Package zero, infinity, incomplete/unavailable and qualifications remain owner-authored; no snapshot mutates the build or invents a diagnosis.                | PASS                   |
| V. Desktop, Tablet and Mobile           | Complete wide/narrow surfaces, both orientations, touch, screen-reader, 200% text, 400% zoom, reduced motion and automated accessibility paths are specified. | PASS                   |
| VI. Commander's Language                | Owned framing/units use feature 011; diagnostic helpers and their disclosed canonical fallback are used without a private game-text table.                    | PASS                   |
| VII. One Design System                  | The rail, capability, controls and result states compose or extend feature 011 and have a component preview matrix; `.design` contributes hierarchy only.     | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Unit equality/transaction tests plus dual-engine, five-layout E2E, axe, screen-reader and throttled timing checks preserve the 80% gate.                      | PASS; prerequisite 011 |
| IX. Specification Before Implementation | The screen inventory maps all FRs and the validation matrix maps stories and success criteria before tasks.                                                   | PASS                   |

### Contract-first delivery graph

**Superseded.** Ruling C removed this feature's dependency on features 005–009 entirely, so there is no graph left to stage: feature 003 composes no owner result and passes no conditions to one. Features 005–008 own their own artboards, their own package reads and — under ruling C — the load, pip and hardpoint controls the Power capability draws.

The feature is not sequenced wholesale behind 005–009, because those capabilities consume feature
003 conditions and detail intents. Delivery is staged without a cycle:

1. Feature 001 establishes the atomic active `{ loadout, buildRevision }` boundary and local
   normalisation metadata; feature 002 advances that revision for committed edits and supplies exact
   slot actions; feature 011 establishes UI, localization and test foundations.
2. Feature 003 lands viewing conditions, the generic revision/provider envelope, fixed summary
   identities, workspace targets and feature 009's accepted generic `AssemblyRequirementsPort`.
3. Features 005–009 update their owning contracts to export their exact status projection types and
   adapters over that envelope. They may proceed independently and remain owners of every
   calculation and semantic result state.
4. Feature 003 then defines the concrete five-provider bundle and lands atomic composition, the
   rail, the full Status capability and announcements.

Feature 010 may consume the workspace's condition/navigation conventions but is not an input to the
feature 003 status projection. No missing repository provider authorizes a local fallback.

## Project Structure

### Documentation (this feature)

```text
specs/003-ship-statistics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── feedback-and-provenance.md
│   ├── status-projection.md
│   ├── viewing-conditions.md
│   └── workspace-integration.md
└── design/
    ├── component-state-preview-matrix.md
    ├── reference-review.md
    ├── screen-inventory.md
    ├── status-capability.md
    └── status-rail.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
src/app/features/build-workspace/outfitting/
├── build-status/                       # this feature, in full
│   ├── almanac-validation-contract.spec.ts
│   ├── build-status.ts
│   ├── build-status.html
│   ├── build-status.scss
│   └── build-status.spec.ts
├── cost-materials/                     # feature 009, built
└── outfitting-workspace/               # feature 002, hosts the rail

e2e/
└── ship-status.spec.ts
```

No `domain/statistics/` or `application/statistics/` module exists. There is no calculation to keep
out of the UI, no composition to make pure and no port to inject: `ShipLoadout.validation` is a field
on the build that feature 001 already holds in memory, and the component reads it the same way
`edsb-cost-materials` reads its own projection.

Tests live beside their source. Provider implementations remain in their owning 005–009 feature
directories and import the shared feature 003 contract; feature 003 does not create parallel area
calculators or duplicate their presentation models.

**Structure Decision**: One component, mounted in the existing rail. Nothing is added to the
router, the stores, the persistence layer or the injection graph.

## Phase 0: Research Conclusions

**Superseded in part.** The first conclusion — keep the full `LoadoutValidation`, preserve package issue order, render severity as text, use the package diagnostic helper and its disclosed canonical fallback — is what was built. Every conclusion about provider envelopes, hardpoint selection, condition defaults, the synchronous transaction and the detail-target union went with the rulings.

Detailed evidence and alternatives are in [research.md](./research.md). The decisive outcomes are:

- Keep the full `LoadoutValidation` object and package issue order. Render stable issue code and
  severity as text; use package diagnostic locale helpers and disclosed canonical fallback.
- Feature 003 defines provider envelopes and targets, while 005–009 own and return their exact
  result semantics. In particular, feature 003 does not reinterpret an owner's power fields.
- Selected hardpoint state chooses only package state-specific results. `weaponMetrics()` sustained
  DPS remains the package firing value under both selections with its native firing condition
  stated; it is never replaced with zero, unavailable or a locally invented retracted result.
- Conditions default to unladen, 2/2/2 and deployed. Integer half-pips prevent floating-point
  invalidity; an explicit draft/Apply interaction accepts only complete six-pip tuples and avoids an
  unchosen automatic redistribution policy.
- The status projection is a synchronous transaction over one build and condition revision. An
  explicitly pending port yields pending; a ready envelope stamped for another context is an
  integration failure. Independently settled mixed snapshots are never assembled.
- The shared detail target union uses `powerAndHeat`, `defenceProfile`, `offenceProfile`,
  `mobilityAndJump` and `costAndMaterials`, matching the accepted area capability names and requiring
  no arbitrary anchor.
- The design reference's rail, power-first order, six metrics and mobile Status mode are adopted.
  The desktop full Status mode and all viewing/accessibility states are explicit spec-driven
  extensions, not claims about the mock.

All planning questions are resolved and no Almanac release blocker remains.

## Phase 1: Design Outputs

**Superseded in part.** `data-model.md` and the four `contracts/` files describe the withdrawn envelope and are retained only as the record of what was ruled against. The live design outputs are [design/reference-review.md](./design/reference-review.md), [design/status-rail.md](./design/status-rail.md), [design/screen-inventory.md](./design/screen-inventory.md) and [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md).

- [data-model.md](./data-model.md) defines feature-owned conditions, revision context, structural
  projection, provider composition, status lifecycle and announcement state while referencing
  owner-authored area types.
- [contracts/status-projection.md](./contracts/status-projection.md) freezes the synchronous provider
  transaction, exact source matrix and no-reclassification rule.
- [contracts/viewing-conditions.md](./contracts/viewing-conditions.md) freezes defaults, draft
  validation, exact package mappings, reset triggers and serialization exclusions.
- [contracts/workspace-integration.md](./contracts/workspace-integration.md) freezes shared detail and
  exact-slot targets, the rail/capability relationship and the contract-first delivery graph.
- [contracts/feedback-and-provenance.md](./contracts/feedback-and-provenance.md) freezes issue
  presentation, locale fallback and settled announcements.
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR and each orientation;
  [status-rail.md](./design/status-rail.md) and
  [status-capability.md](./design/status-capability.md) define the two responsive surfaces.
- [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md) records all
  supported component states at desktop, tablet and mobile widths.
- [quickstart.md](./quickstart.md) provides package probes, acceptance journeys and a story/FR/SC/
  constitutional verification matrix.

## Post-Design Constitution Re-check

Phase 1 introduces no server, outbound runtime request, private game catalogue, alternate formula,
local power/defence/offence verdict, second loadout, persisted condition, hard-coded display string or
visual literal. Provider results retain their owning contracts; package diagnostics use the released
helpers; the rail and complete capability share one revision and do not duplicate issues. Every
requirement has one surface owner and every user story/success criterion has a dual-engine or
explicit manual verification path.

The planning gate remains **PASS with no exception**. Repository implementation is staged by the
contract-first graph above; absent prerequisites remain blockers to shipping, never reasons for an
application-side workaround.

## Complexity Tracking

No constitutional violation requires justification. The provider boundary is necessary to prevent
feature 003 from owning calculations, and the rail/full-capability pair is necessary to preserve the
accepted design hierarchy while giving complete diagnostics an accessible responsive home.
