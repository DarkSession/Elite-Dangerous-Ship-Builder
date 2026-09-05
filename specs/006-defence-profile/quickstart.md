# Quickstart: Validate Defence Profile

This is a runnable validation guide, not an implementation guide. Field/state contracts are in
[contracts/](./contracts/), the model is in [data-model.md](./data-model.md), and the complete surface
mapping is in [design/screen-inventory.md](./design/screen-inventory.md).

## 1. Prerequisites

Use the repository's Node and pnpm versions with the committed lockfile:

```bash
nvm use
pnpm install --frozen-lockfile
```

Before feature acceptance, confirm:

- the installed `@elite-dangerous-almanac/core` exposes the four defence facade methods, structured
  calculation issues, hull hardness and leaf i18n helpers;
- feature 001 supplies `/outfitting` and one active loadout/revision;
- feature 005 supplies the SYS allocation, already in the package's `[0, 4]` units;
- feature 010 supplies the anatomy mode strip and the space its plates leave;
- feature 011 enables strict compilation, shared UI/i18n, five layouts in Chromium and Firefox and
  automated axe scans.

Expected: feature 006 introduces no local formula, hull fallback, generator-state reconstruction,
power-band inference, aggregate apportionment, private game text or new persistence field.

## 2. Run focused tests

```bash
pnpm exec ng test --no-coverage --include 'src/app/domain/ships/defence/**/*.spec.ts'
pnpm exec ng test --no-coverage --include 'src/app/features/build-workspace/outfitting/defence-*/**/*.spec.ts'
pnpm exec playwright test e2e/defence.spec.ts
```

Expected: unit tests compare real package results and issues; browser tests run the full configured
dual-engine layout matrix with accessibility scans.

## 3. Validate shield strength and SYS pips

1. Open a package-backed build with generator, boosters and shield reinforcement.
2. Open the anatomy region's `DEFENCE` mode.
3. Compare `strength`, the three role aggregates, all four resistances and the four bare EHP values
   directly with `shieldMetricsResult()`, which takes no allocation.
4. Compare the fifth column with `shieldCapacitorMetricsResult({ systemsPips })` for the standing
   pips.
5. Move the pips on the `POWER` dashboard and repeat.

Expected: every value equals the package field, and only the fifth column moves with the allocation.
The same explicit pips feed recovery; the allocation never enters history, persistence, URL or SLEF.

## 4. Validate shield/recovery unavailable issues

Exercise package-backed missing generator, disabled generator, shed generator, unresolved generator,
disabled plant and unresolved draw cases.

Expected:

- shield and recovery preserve their own complete ordered issue arrays;
- issue field/reason/slot/symbol remain exact, and nothing stands in their place;
- plant/draw issues are not relabeled as generator states;
- a generator powered with hardpoints retracted remains package-complete even if deployment would
  shed its group;
- no zero, stale value or catalogue fallback replaces unavailable;
- armour, hardness and banks remain present.

## 5. Validate recovery and non-finite meanings

Compare `regenRate`, `recoveryTime` and `regenTime` independently with
`shieldRecoveryResult({ systemsPips })` — the three readings the canvas draws. Use a zero-pip
projection for a phase that does not finish, and a fixture for an unbounded EHP value.

Expected: the rate and the two phases remain separate. A phase that does not finish and an unbounded
pool read as their own phrases; finite zero stays numeric and no raw or clamped infinity is shown.

## 6. Validate cell banks

Use builds for no banks, powered banks, mixed power, all banks unpowered and duplicate bank
symbols.

For every bank compare cells, reinforcement and powered state with `cellBanks().banks`; compare the
restorable total directly.

Expected:

- no bank fitted draws no reserve line at all;
- all banks unpowered retains every bank in the line and says so in words;
- powered means the returned hardpoints-deployed verdict;
- the figure on the line is the package total and is never assembled from the banks.

## 7. Validate armour, hardness and module protection

1. Open a known hull with a non-stock bulkhead plus hull and module reinforcements.
2. Compare every armour scalar and damage row directly with `armourMetrics()`.
3. Compare hardness with `getShipBySymbol(loadout.shipSymbol).hardness`.
4. Remove/disable/shed the shield and repeat.

Expected:

- armour EHP uses hull points, not MJ;
- hull HP, module armour, module protection and hardness remain distinct;
- hardness is the package's own value, with no matchup generated from it;
- role rows carry the package's own aggregate and no apportioned share;
- a stock calculation fallback never fabricates a fitted bulkhead row;
- shield state never hides armour.

## 8. Validate the role groups

Use duplicate boosters and reinforcements plus a generator and a non-stock bulkhead.

Expected: package-resolved roles appear in package slot order; a group of one module is named by
that module and a group of unlike modules by its role; a repeated module is counted; unavailable
role or stat data produces no guessed record; no row is a control, and no row carries a share of the
group's aggregate. Any package issue reason `unresolved` remains calculation feedback only.

## 9. Validate the status rail block

1. Trigger accepted module edits and pip changes.
2. Compare the rail's two cells with the two card headlines.

Expected: the two figures agree with the cards at every revision; a refused shield reads as
unavailable in both places; the block holds no control.

## 10. Validate `.design` composition responsively

Run at 1440×900, 834×1112, 1112×834, 390×844 and 844×390 in Chromium and Firefox.

Expected: wide layouts show complete shield/armour peers; constrained layouts stack the same
complete semantic content. Mobile never drops resistance percentages, recovery, the reserve,
hardness or protection. The page has no horizontal overflow.

## 11. Validate accessibility

Render every state in [design/screen-inventory.md](./design/screen-inventory.md), "Required states",
and every primary journey.

- Run axe and fail every in-scope violation.
- Check landmarks, headings, definition/table/card relationships and role/name/state semantics.
- Check visible text equivalents for every supplemental bar/icon.
- Check the mode strip that opens the layer by pointer and by touch, against the shared 44
  CSS-pixel target baseline.
- Check 200% text, actual 400% zoom, doubled copy, RTL, long package identities and reduced motion.
- Complete the three stories with NVDA/Firefox desktop and TalkBack/Chromium mobile protocols.

Expected: every capability/state remains complete and understandable. Any conformance statement names
the exclusions: WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## 12. Validate localization boundaries

Switch every shipped locale and repeat unavailable, negative and non-finite states.

Expected:

- application text and units use feature 011 messages/formatters with bundled English fallback;
- module/hull/slot names and calculation diagnostics use Almanac leaf helpers;
- canonical package text is visibly disclosed when the requested package locale is unavailable;
- no raw message key, blank placeholder, parsed English diagnostic or private game translation is
  displayed;
- numbers, percentages, counts and durations use the active locale.

## 13. Run the full gate

```bash
pnpm run check
```

Expected: format, strict type checks, static build, script tests, unit tests at or above 80% for all
four measures, and all Chromium/Firefox Playwright/axe projects pass with no skipped, quarantined or
deleted test.
