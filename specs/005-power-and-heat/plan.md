# Implementation Plan: Power and Heat

**Branch**: `005-power-and-heat` | **Date**: 2026-08-18 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from `specs/005-power-and-heat/spec.md` and the
responsive visual reference in `.design/Ship Builder.dc.html`.

## Summary

> **Revised 2026-08-23 (wave 12).** Feature 003 was rewritten and its rulings A–C withdrew the
> workspace capability selector, the `powerAndHeat` detail target, the `StatusProvider` envelope and
> the shared viewing-condition control this plan was written against, and reassigned the hardpoint
> and pip conditions here. The revisions are recorded in
> [design/reference-review.md](./design/reference-review.md), wave 12, and are binding.
>
> **Revised again 2026-08-24 (wave 13).** Wave 12's build was read against the artboard and
> rejected. The artboard's own switching script hides the plate container outside `mounts`, so the
> `POWER` mode replaces the plates rather than annotating them and the mount overlay is withdrawn
> with `mountPowerState`. Headroom, utilisation and within-budget go with it: neither canvas prints
> any of the three. The revisions are recorded in
> [design/reference-review.md](./design/reference-review.md), wave 13, and are binding.

Add the Power and Thermals surface the design draws. One pure, synchronous projection reads
`ShipLoadout.powerBudget()`, `distributorMetrics()` and `heatMetrics()`, selects only package fields
for the selected hardpoint state and pip allocation, and preserves null, zero and non-finite
meanings. Every surface reads that one projection directly — the shape feature 009 already ships and
feature 003's ruling named for features 005 to 008 — so there is no store, no provider envelope, no
revision key and no second calculation model.

Two surfaces compose it: the `POWER` segment of the anatomy mode strip canvas 1c already draws,
which retitles the region `POWER & THERMALS`, removes the plates and draws the four-block dashboard
in the space they leave; and the status rail's own power block. The design's sample numbers are not
game-data contracts and are not copied; its hierarchy, its blocks and their contents are, because
they are the design.

## Technical Context

**Language/Version**: TypeScript, Angular HTML and SCSS; Node.js per the repository tooling
configuration. TypeScript strict mode is required before implementation

**Primary Dependencies**: Angular standalone and zoneless APIs, Angular
signals, `@elite-dangerous-almanac/core` leaf exports, feature 001's
active-build/revision boundary, feature 002's exact-slot selection, feature
003's status rail, feature 010's plates and mode strip, and feature 011's
design/localization/accessibility foundation. Feature 005 exports one pure
projection, and nothing else

**Storage**: None. The projection, the selected hardpoint state and the pip
allocation are in memory only; no metric or condition enters local storage,
history, a URL, a saved build or SLEF

**Testing**: Vitest through Angular's unit-test builder with the existing 80%
statement/branch/function/line gates; Playwright in the feature 011 ten-project
Chromium/Firefox desktop, tablet portrait/landscape and mobile
portrait/landscape matrix; `@axe-core/playwright` plus manual screen-reader,
200%-text and actual 400%-zoom protocols

**Target Platform**: Static client-side application for current Chromium and
Firefox on desktop, tablet and mobile, pointer and touch, portrait and
landscape; usable offline after first load

**Project Type**: One client-side Angular single-page application; no backend

**Performance Goals**: Keep the projection synchronous and memoized by the
active build revision and the selected conditions, and make each of the three
package calls exactly once per projection

**Constraints**: No server, account, telemetry, cross-origin runtime request,
local power/distributor/heat formula, raw-modifier interpretation, inferred
null diagnosis or catalogue fallback; exact package identities; no stale mixed
revisions; no page horizontal scrolling; one tokenized dark theme; localized
owned text/numbers/units; touch and screen-reader operation; WCAG 2.2 AA except
criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: One active loadout; one row per priority group the build uses; one line per kind of
power consumer the package returns; three distributor capacitors; five heat scenarios and the shield
bank's sixth bar; one status-rail block, all derived from the same package result

**Design Reference**: `.design/Ship Builder.dc.html`, canvases 1c and 1d.
Adopted hierarchy and required departures are recorded in
[design/reference-review.md](./design/reference-review.md).

## Constitution Check

_GATE: **PASS with no exception**. Every figure the three `ShipLoadout` methods return is exact,
and no application workaround stands between the package and the screen. Repository implementation
remains sequenced behind feature 011._

| Principle                               | Design evidence                                                                                                            | Status                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| I. Client-Side Only                     | All results use the in-browser active build and installed static package; feature 005 adds no storage or network boundary. | PASS                   |
| II. Almanac Source of Truth             | All planned values come from the three `ShipLoadout` methods, with no local recomputation, clamp or alternate verdict.     | PASS                   |
| III. Domain Logic Outside UI            | Pure projectors and typed integration adapters precede signal orchestration; components render inputs and emit intents.    | PASS                   |
| IV. Lossless, Honest Builds             | Null, zero and field-specific infinity states remain explicit; no stale or guessed heat result is presented as complete.   | PASS                   |
| V. Desktop, Tablet and Mobile           | Complete content is defined for five viewport/orientation profiles, touch, screen reader, 200% text and 400% zoom.         | PASS; prerequisite 011 |
| VI. Commander's Language                | Owned text/units use feature 011; module and slot text use Almanac helpers with disclosed canonical fallback.              | PASS; prerequisite 011 |
| VII. One Design System                  | The capability composes/extends `src/app/ui/`; `.design` contributes hierarchy only.                                       | PASS; prerequisite 011 |
| VIII. Tested Before It Ships            | Exact projection tests, two engines, five layouts, axe and manual assistive checks are retained without lowering coverage. | PASS; prerequisite 011 |
| IX. Specification Before Implementation | The screen inventory maps every requirement, and shared viewing-state ownership is recorded explicitly.                    | PASS                   |

**Technology prerequisite**: Feature 011 must enable `strict` in the shared TypeScript configuration
and make the existing project pass under it before feature 005 implementation is complete.

### Blocking and sequencing dependencies

All four are delivered. **No gate remains.**

1. Feature 001 supplies one active `ShipLoadout`, its numeric revision, the no-build state and the
   `/build` workspace. Feature 002 supplies committed-edit revision advancement and exact-slot
   reveal and editing.
2. Feature 003 supplies the status rail, its heading and its validation issues, and no condition
   state of any kind (ruling C).
3. Feature 010 supplies the plates, their side selector, their legend and the mode strip whose
   `POWER` segment this feature enables. Selecting it removes all three and gives this feature the
   space; feature 010 joins no consumer to a band, reads no power field and draws nothing on a
   mount.
4. Feature 011 supplies the shared controls, tokens, localized messages and formatters, the
   game-text presenter, the ten-project browser matrix and the axe harness.

## Project Structure

### Documentation (this feature)

```text
specs/005-power-and-heat/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── distributor-metrics.md
│   ├── heat-profile.md
│   ├── integration-ports.md
│   └── power-budget.md
└── design/
    ├── component-state-preview-matrix.md
    ├── power-and-heat-detail.md
    ├── reference-review.md
    └── screen-inventory.md
```

The task dependency graph retains the feature 001/002/003/011 sequencing and the settled shared
viewing-store/control ownership above.

### Source Code (repository root)

```text
src/app/
├── domain/
│   └── power-heat/
│       ├── power-heat.ts                  # the one projection
│       ├── power-heat.fixtures.ts
│       └── almanac-power-heat-contract.spec.ts
├── application/
│   └── power-heat/
│       └── power-conditions.store.ts      # hardpoint state and whole pips, in memory
└── features/
    └── build-workspace/
        └── outfitting/
            ├── power-thermals/            # the POWER mode dashboard, four blocks
            └── power-summary/             # the rail's shed sentences, POWER line and bar

e2e/
└── power-and-heat.spec.ts
```

Nothing is drawn on a mount: the `POWER` mode takes the plates' place rather than annotating them.
The compact status surface remains feature 003's rail, and the plates and mode strip remain feature
010's — feature 005 mounts blocks into them rather than duplicating either.

Tests live beside source. The compact Status UI remains owned by feature 003
and anatomy UI by feature 010; feature 005 exports projections/adapters rather
than duplicate components.

**Structure Decision**: Keep one Angular application and one active loadout. A pure projector maps
one loadout and one condition selection to package-authored values, and every surface reads it
through the signal graph's own memoisation. One small in-memory store holds the two conditions the
artboard draws. No second `ShipLoadout`, lifecycle envelope, persisted cache, worker, calculation
service or route is added.

## Phase 0: Research Conclusions

Detailed decisions, evidence and rejected alternatives are in
[research.md](./research.md). The decisive outcomes are:

- Use only the three `ShipLoadout` facade methods and their leaf result types.
- Select deployed/retracted fields directly. `headroom`, `utilisation` and `withinBudget` are not
  read in either state, because neither canvas draws them (wave 13).
- `PowerBudget.consumers` is the complete package power-participant list; every entry carries a
  resolved draw and disabled entries remain visible.
- Feature 005 owns the allocation, in pips: `0`–`4` per bank on the half step, six between the
  three, moved by the store because that is what happens in the ship. It displays returned pips.
- Scenario terminology follows normative results: disabled power participants
  are the disabled entries returned in `consumers`, and distributor
  unavailability is exactly package null rather than catalogue identity alone.
- Heat shows the five package scenarios and all five fields, plus the canvases' sixth `Shield cell
bank` bar, which the package's own remedy assembles from published figures. Null, non-settling and
  never-overheating are distinct.
- Canvas 1c/1d is the template: its blocks, their order and their contents are what is built. Its
  sample data is not a game-data contract, and its dead markup — the unreachable `power` plate
  overlay its own switching script never shows — is not a surface.

No planning ambiguity or Almanac dependency remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) defines the exact power fields, returned consumer identities and
  the distributor and heat views. Its outer lifecycle, revision-stamped snapshot, status summary and
  observation index were withdrawn with the store (wave 12), and it was rewritten against the
  shipped projection (wave 13).
- [contracts/power-budget.md](./contracts/power-budget.md) freezes
  selected-state mapping, module ordering and exact-slot intent.
- [contracts/distributor-metrics.md](./contracts/distributor-metrics.md) freezes exact result
  mapping and null and zero behaviour. Its half-pip conversion is withdrawn: the artboard draws
  whole pips (wave 12).
- [contracts/heat-profile.md](./contracts/heat-profile.md) freezes the five
  scenarios, all returned fields and the null/non-finite meanings.
- [contracts/integration-ports.md](./contracts/integration-ports.md) freezes the one exported
  projection. Its `mountPowerState` selector is withdrawn with the overlay (wave 13).
- [design/screen-inventory.md](./design/screen-inventory.md) maps every FR to
  the Power and Heat capability and its cross-feature contributions.
- [design/power-and-heat-detail.md](./design/power-and-heat-detail.md) defines
  information order, responsive composition, states and announcements.
- [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md) records
  why this feature declares no preview state.
- [design/reference-review.md](./design/reference-review.md) records the exact
  1c/1d ideas retained and every unsupported departure.
- [quickstart.md](./quickstart.md) supplies the runnable acceptance
  scenarios.

## Post-Design Constitution Re-check

Phase 1 adds no server, second build, private game catalogue, power/heat
formula, persisted metric, inferred null diagnosis, hard-coded display string
or visual literal. Every required surface and consumer port has an owner, every
package sentinel remains distinguishable and all responsive/accessibility paths
are explicit.

The post-design gate is **PASS with no exception**. The plan contains no validation-based or
modifier-parsing workaround. Every feature dependency above is delivered, so no sequencing gate
remains for the task graph to carry.

## Complexity Tracking

No constitutional exception is requested. Waves 12 and 13 removed complexity rather than adding it:
the store, the provider envelope, the revision-stamped lifecycle, the three adapters, the mount
overlay and its selector are all gone, and what remains is one pure projection read directly by the
two surfaces that draw it.
