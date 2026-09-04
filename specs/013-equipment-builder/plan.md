# Implementation Plan: Equipment Builder

**Branch**: `013-equipment-builder` | **Date**: 2026-09-02, revised 2026-09-03 for Almanac 0.2.9 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-equipment-builder/spec.md`

## Summary

Add a second tool to NavBeacon: an on-foot outfitting bench at `/equipment` where a Commander picks
a suit, sets its grade, fits handheld weapons at grades of their own, applies engineering
modifications within the slots each grade unlocks, and reads what the assembled Commander is worth
and what the modifications would cost in micro-resources. It joins the shared shell as one entry in
the tool registry, saves into the one record library the ship tool already uses, and shares through
the `e.` link codec that is already written and tested.

Two things make this more than composition. The committed link format refuses the held content
FR-018a requires, so table 1 is regenerated in place — under its own overwrite rule, which holds
until the bench's first release — to write the catalogue's whole mount set, addressed by Frontier's
own journal `SlotName`s, rather than the mounts the selected suit happens to offer. And the stored
record envelope gains a `tool` discriminator at version 2, so one list can hold builds and loadouts
without a second key space or an index.

**Revised for Almanac 0.2.9.** The three upstream gaps this feature was planned around are closed,
and the plan is smaller for it. `personalWeaponMetrics` publishes the derived combat figures
([#23](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/23)), so the `FIREPOWER` region and the item view's `SUSTAINED DPS` and `HEADSHOT DPS`
lines ship as drawn instead of waiting. `Suit.mounts` publishes Frontier's own mount keys
([#24](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/24)), so the positional mount naming this feature had reserved is withdrawn along with
the constitution II departure that came with it. And `equipment/tools` publishes the suit tools
([#25](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/25)), so the `SUIT TOOLS` region returns on the condition the spec set for it. Nothing
upstream now blocks any part of this feature.

## Technical Context

**Language/Version**: TypeScript in strict mode; Angular standalone, zoneless, signal-based; SCSS;
Node.js per the repository tooling configuration for the codec-table generator

**Primary Dependencies**: `@elite-dangerous-almanac/core` 0.2.9 `equipment/` and `i18n/` leaves;
feature 001's persistence, record library and fragment handling; feature 011's design system,
localisation, dialog and accessibility infrastructure; feature 012's help modal; the shared
`domain/build-link` envelope

**Storage**: `localStorage` under the existing `edsb:record:<uuid>` key space, envelope version 2
with a `tool` discriminator. No new key, no index, no new removal path

**Testing**: Vitest through the Angular unit-test builder at the existing 80% thresholds;
`node --test` for the table generator; Playwright with `@axe-core/playwright` across the ten
configured projects

**Target Platform**: Modern evergreen browsers on desktop, tablet and mobile; static client
application, usable offline after first load

**Project Type**: Client-side Angular single-page application producing static files only

**Performance Goals**: No new timing gate. The bench's choosers list at most 11 weapons and 31
modifications against the ship chooser's 478 cards, so the compact-layout cost that governs
`outfitting-timing.spec.ts` does not arise here. The existing initial-bundle budget is preserved by
lazy-loading the route

**Constraints**: No backend, no account, no telemetry, no request to any origin but this one; every
figure is the package's answer and none is computed here; every owned string localised and every
number locale-formatted; one dark theme from tokens; no horizontal page scrolling at any viewport;
WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11

**Scale/Scope**: 4 suits, 11 handheld weapons, 31 modification recipes, 4 suit tools, 3 mounts, 4
modification slots per item; one route, one screen with five regions, two choosers; one link format
amendment; one storage envelope version

**Design Reference**: `.design/Equipment Builder.dc.html`, artboards `1a` (1640px) and `1b` (390px),
and it governs. What it draws and what is withdrawn from it is recorded in
[design/reference-review.md](./design/reference-review.md); the shell collision its topbar creates
with `Tool Navigation.dc.html` is ruled on there and in research decision 1.

## Constitution Check

_GATE: passed before Phase 0 research, re-checked after Phase 1. No constitutional exception is
requested._

| Principle                               | Design evidence                                                                                                                                                                       | Status |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Client-Side Only                     | Loadouts live in `localStorage` and in a URL fragment; no request leaves the origin; the route is in the app shell and works offline.                                                 | PASS   |
| II. Almanac Source of Truth             | Every figure is a package call; identities are `Suit.family`, `PersonalWeapon.symbol` and recipe keys; the two missing derived figures wait upstream rather than being computed here. | PASS   |
| III. Domain Logic Outside UI            | The loadout model, the codec and the figure resolution are framework-agnostic and testable without rendering; components render and dispatch.                                         | PASS   |
| IV. Lossless, Honest Builds             | Held and locked content is retained, carried and never silently dropped; an empty-modifier recipe states no number rather than a zero; ingress refusals are atomic.                   | PASS   |
| V. Desktop, Tablet and Mobile           | Both canvas widths are one fluid layout; held mounts and locked slots carry their state as text; the ten-project matrix and axe cover every surface.                                  | PASS   |
| VI. Commander's Language                | Package text through `GameTextPresenter`; mount names are identities resolved to messages; weapon and engineer names present as canonical rather than as translations.                | PASS   |
| VII. One Design System                  | Composed from `src/app/ui/`; the two extensions — a tool identity on the saved row, a resistance bar — extend the system with previews rather than living in the bench.               | PASS   |
| VIII. Tested Before It Ships            | Exhaustive off-screen figure tests, codec round-trips including held content, journeys per user story across ten projects, axe over every surface.                                    | PASS   |
| IX. Specification Before Implementation | Every FR maps to a surface and a contract in [design/screen-inventory.md](./design/screen-inventory.md) before tasks are generated.                                                   | PASS   |

### Required repository dependencies

1. **Feature 001** supplies the record key space, the unnamed-record and expiry rules, autosave, tab
   ownership and fragment publication. This feature adds a record variant and changes none of them.
2. **Feature 011** supplies the design system, tokens, localisation with bundled fallback, dialogs,
   component previews and the accessibility harness.
3. **Feature 012** owns the help modal and the version pair. The bench draws neither.
4. **The shared shell** exists: `src/app/ui/components/app-frame` draws the bar from
   `src/app/features/shared/app-navigation.ts`, which today registers one tool. This feature adds
   the second row.
5. **No upstream gap blocks any part of this feature.** The three that did are closed in Almanac
   0.2.9: the derived combat figures ([#23](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/23)), the mount keys ([#24](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/24)) and the suit
   tools ([#25](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/25)). One upstream item remains open in effect and blocks nothing:
   `getPersonalMountName` carries `en-GB` only, so a mount name presents as canonical English until
   the release that adds the other five ([#26](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/26)) — closed upstream, absent from 0.2.9.

## Project Structure

### Documentation (this feature)

```text
specs/013-equipment-builder/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── equipment-bench.md
│   ├── equipment-loadout-link.md
│   └── loadout-persistence.md
└── design/
    ├── equipment-bench.md
    ├── reference-review.md
    └── screen-inventory.md
```

`tasks.md` is Phase 2 output and is intentionally not created by this command.

### Source Code (repository root)

```text
scripts/
├── generate-equipment-link-codec-tables.mjs   # gains MOUNT_SLOTS
└── policy/
    └── equipment-ownership.mjs                # the bench owns its figures; nothing else states one

src/app/
├── domain/equipment/
│   ├── loadout-link/                          # committed; the mount-key amendment lands here
│   │   ├── equipment-link-codec.ts
│   │   ├── equipment-link-table-1.json
│   │   └── equipment-loadout.ts
│   ├── loadout/
│   │   ├── loadout-mounts.ts                  # the catalogue's mount set, and per-suit availability
│   │   ├── loadout-edit.ts                    # every choice, as a pure transition over a loadout
│   │   └── stored-loadout.serializer.ts       # the record variant, field by field
│   └── readings/
│       ├── suit-readings.ts                   # SuitGrade folded through applyPersonalModifiers
│       ├── weapon-readings.ts                 # personalWeaponMetrics, plus the suit's reserve-ammo recipe
│       ├── tool-readings.ts                   # which tools the selected suit carries
│       └── material-requirement.ts            # unlocked recipes through sumPersonalEngineeringIngredients
├── application/equipment/
│   ├── loadout.store.ts                       # the open loadout, selection and history
│   ├── loadout-history.ts                     # the ship side's committed-state stack
│   ├── loadout.presenter.ts                   # readings plus localisation into a view model
│   ├── candidate-query.ts                     # what a mount and a slot accept
│   └── loadout-link.coordinator.ts            # fragment in and out, on feature 001's publisher
├── features/equipment/
│   ├── equipment-bench.page.ts                # the route
│   ├── loadout-ledger/
│   ├── item-view/
│   ├── suit-tools/                          # names and a count; no stat, per the canvas
│   ├── commander-stats/
│   ├── material-requirements/
│   └── export-loadout-layer/
├── ui/
│   ├── equipment/                             # resistance bar and any bench-shaped primitive,
│   │                                          # each with a preview
│   └── components/saved-build-card/            # gains the tool identity a shared list needs
├── platform/storage/                          # record migration gains v1 → v2
├── i18n/locales/                              # equipment.* message keys
└── features/shared/app-navigation.ts          # the second tool row

e2e/
├── equipment-builder.spec.ts                  # US1 and US2 journeys
├── equipment-library.spec.ts                  # US3, saving and reopening
├── equipment-link.spec.ts                     # US4, sharing and refusals
└── coverage-ledger.ts                          # gains the bench's surfaces

docs/
├── equipment-link-codec.md                    # the amended mount set, and the status line
└── persistence-and-links.md                   # record version 2 and the discriminator
```

**Structure Decision**: One Angular application, one shell, two tools. The bench mirrors the ship
side's layering exactly — pure domain, a signal store, a presenter, presentation components — so
that the two tools are the same shape to work on. The route is lazy-loaded so the ship tool's
initial bundle does not grow. Nothing under `features/equipment/` reaches the package directly; the
bench asks the presenter, the presenter asks `domain/equipment/readings`, and those ask the package.

## Phase 0: Research Conclusions

Recorded in full in [research.md](./research.md). The decisive outcomes:

1. The bench is a tool inside the shared shell; the canvas's own topbar, saved list and help are
   withdrawn.
2. Table 1 is regenerated in place to write the catalogue's whole mount set, addressed by Frontier's
   own `SlotName` keys, because the committed format cannot represent the held content FR-018a
   requires.
3. Loadouts share the record key space, discriminated by `tool` at envelope version 2.
4. Every derived combat figure is `personalWeaponMetrics`, called with the fitted modifiers and
   with `options.reloadSpeed` when Reload Speed is fitted, because that recipe carries no modifier.
5. Modified figures come from `applyPersonalModifiers`, including the suit recipe that moves a
   weapon's reserve ammo; recipes with no published magnitude state no number.
6. Package text goes through `GameTextPresenter`; weapon and engineer names are canonical English by
   the library's own account, not gaps.
7. Mount names are the library's, through `getPersonalMountName` — canonical English in 0.2.9, and
   never a message key of this application's own.
8. Two link refusal strings gain equipment wording, selected by the codec that refused.
9. Grade upgrade costs and reading a payload back in are out of scope, each for a recorded reason.
10. Suit tools are stated and never chosen: carriage is a property of the suit.

No `NEEDS CLARIFICATION` remains.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) — what the package owns, what this feature owns, the record
  variant, and every derived reading with the call that produces it.
- [contracts/equipment-bench.md](./contracts/equipment-bench.md) — what may be chosen, what is
  stated, what is refused, and the three states a mount can be in.
- [contracts/equipment-loadout-link.md](./contracts/equipment-loadout-link.md) — the mount-set
  amendment, what still refuses, the overwrite rule and the round-trip obligation.
- [contracts/loadout-persistence.md](./contracts/loadout-persistence.md) — one key space, the
  discriminator, migrate-on-open, and what this feature may not touch.
- [design/screen-inventory.md](./design/screen-inventory.md) — every surface, every requirement
  mapped to one, and the states each must handle.
- [design/equipment-bench.md](./design/equipment-bench.md) — wide and compact composition, what is
  reused, the two design-system extensions, and the accessibility obligations.
- [design/reference-review.md](./design/reference-review.md) — what the canvas gives, what is
  withdrawn and why.
- [quickstart.md](./quickstart.md) — runnable validation in the order it becomes possible.

## Post-Design Constitution Re-check

Phase 1 introduces no server, no outbound request, no telemetry, no private game data, no local
correction of a package result, no second theme and no untranslated owned string. Two things deserve
naming rather than assuming:

**The link format changes under a published-format rule.** It is sound only because no link has been
published — the codec has no consumer today. The change is made now, before the first release, which
is the last moment it is free. Afterwards it would be a table 2.

**No region ships incomplete any more.** The firepower region waited on a package calculation, and
that calculation shipped: this is what constitution II is for — the blocked capability waited on the
upstream fix rather than being papered over, and the fix arrived. The one remaining upstream
shortfall, English-only mount names ([#26](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/26)), degrades a name to canonical and blocks
nothing.

The post-design gate remains **PASS with no exception**.

## Complexity Tracking

No constitutional violation requires justification. The two structural additions both remove
duplication rather than add it: the record discriminator replaces what would otherwise be a second
key space with its own retention, quota, lock and cross-tab rules, and the fixed mount set replaces
what would otherwise be a second way to spell the same loadout.
