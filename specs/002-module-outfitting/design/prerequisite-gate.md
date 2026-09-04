# Prerequisite Gate

Feature 002 extends features 011 and 001. It creates no substitute shell, token set, locale
catalogue, storage format or second observable build. This file records what was verified in the
repository before implementation began, so a later reader can tell what feature 002 consumed from
what it added.

Verified 2026-08-21 against the working tree at commit `7100dc1d`.

## Feature 011 — interface foundations

| Boundary                | Repository evidence                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Design tokens           | `src/styles/tokens/_primitives.scss`, `src/styles/tokens/_semantic.scss`; shared chrome mixins in `src/styles/_responsive.scss`, cross-component chrome in `src/styles/_chrome.scss` |
| Canvas measurement      | `specs/011-interface-foundations/design/canvas-extraction.md`                                                                                                                        |
| Localization            | `src/app/i18n/message.service.ts`, `src/app/i18n/locale-registry.ts`, `src/app/i18n/locales/{en,de}.json`                                                                            |
| Package text presenter  | `src/app/i18n/game-text.presenter.ts` — the presenter the plan calls `package-text`; `src/app/i18n/package-text.spec.ts` is its package-ownership proof                              |
| Shared components       | `src/app/ui/components/**`, contract in `src/app/ui/component-contract.ts`                                                                                                           |
| Announcements           | `src/app/ui/announcements/announcement.service.ts`, `announcement-outlet.ts`                                                                                                         |
| Preview catalogue       | `src/app/ui/previews/preview-manifest.ts`, rendered by `projects/ui-preview/`                                                                                                        |
| Ten Playwright projects | `playwright.config.ts` generates `ENGINES × LAYOUT_PROFILES` from `e2e/coverage-ledger.ts`                                                                                           |
| Axe scans               | `e2e/accessibility/axe.ts` (`@axe-core/playwright`, WCAG 2.0/2.1/2.2 A and AA, no disabled rules)                                                                                    |
| Policy checker          | `scripts/check-interface-foundations.mjs`, run by `pnpm run policy`                                                                                                                  |

## Feature 001 — ship selection and loading

| Boundary                       | Repository evidence                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/outfitting` route            | `src/app/app.routes.ts`, `src/app/features/build-workspace/build-workspace.page.ts`                                                                      |
| One `ActiveBuildState`         | `src/app/application/active-build/active-build.models.ts`, `active-build.store.ts`                                                                       |
| Canonical `BuildSnapshotV1`    | `src/app/domain/ships/build/build-snapshot.ts`                                                                                                           |
| Capture                        | `src/app/domain/ships/build/build-snapshot.serializer.ts` (`toBuildSnapshotV1`)                                                                          |
| Package reconstruction         | `src/app/domain/ships/build/build-snapshot.reconstructor.ts` (`reconstructFromSnapshot`)                                                                 |
| Atomic swap                    | `ActiveBuildStore.commit`, driven only by `application/active-build/replacement-coordinator.ts`                                                          |
| Replacement notification       | `ReplacementCoordinator.setConfirmer` / `ReplacementQuestion`                                                                                            |
| Autosave observer              | `src/app/application/build-library/autosave.service.ts`                                                                                                  |
| Fragment observer              | `src/app/application/build-link/fragment-publisher.ts`                                                                                                   |
| Fixed-mount invariant          | `src/app/domain/ships/build/fixed-mounts.ts` — a check, never a repair                                                                                   |
| Quality-completion notice slot | `QualityCompletionNotice` in `active-build.models.ts`; feature 001 declared the shape, feature 002's ingress normalizer is the first thing that fills it |

## What feature 002 adds, and what it must not

Adds: the modelled checkpoint, the shared ingress normalizer, the candidate-first transaction, the
outfitting store and its projections, the outfitting UI primitives and feature components, the
session edit history, and the verification that covers them.

Must not: a second `ShipLoadout` visible to any component, a second locale catalogue, a second
preview entry point, a second set of Playwright layout projects, a private game-data table, or a
local fitting, variant, engineering or cost rule. Every one of those is checked by
`scripts/policy/outfitting-ownership.mjs` (T104) alongside the feature 011 checker.

## Installed package

`@elite-dangerous-almanac/core` is pinned at `0.1.5` in `package.json` (raised from 0.1.4 on
2026-08-22 for the per-grade Merc Coin figure, upstream #337). Feature 002 adds no
dependency. The acceptance characterization of that installed version lives in
`src/app/domain/ships/outfitting/almanac-acceptance.spec.ts`.
