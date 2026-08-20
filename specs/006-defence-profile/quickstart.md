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
- feature 001 supplies `/build` and one active loadout/revision;
- feature 003 supplies settled SYS half-pips, revision/provider envelopes and `defenceProfile` target;
- feature 002 supplies exact-slot reveal through its accepted modelled-snapshot boundary;
- feature 011 enables strict compilation, shared UI/i18n/previews, five layouts in Chromium and
  Firefox and automated axe scans.

Expected: feature 006 introduces no local formula, hull fallback, generator-state reconstruction,
power-band inference, aggregate apportionment, private game text or new persistence field.

## 2. Run focused tests

```bash
pnpm test -- --include 'src/app/domain/defence/**/*.spec.ts' --include 'src/app/application/defence/**/*.spec.ts' --include 'src/app/features/build-workspace/defence-profile/**/*.spec.ts'
pnpm exec playwright test e2e/defence-profile.spec.ts
```

Expected: unit tests compare real package results/issues and provider revisions; browser tests run the
full configured dual-engine layout matrix with accessibility scans.

## 3. Validate shield strength and SYS pips

1. Open a package-backed build with generator, boosters and shield reinforcement.
2. Select Defence from the workspace or feature 003 shield/armour headline.
3. Compare `strength`, `generator`, `boosters`, `reinforcement`, `massCurveMultiplier`,
   `boostMultiplier`, `systemsResistance`, all four resistances and all four EHP values directly with
   `shieldMetricsResult({ systemsPips })` for the settled pips.
4. Apply valid 0, fractional, 2 and 4 SYS values through feature 003 and repeat.

Expected: every value equals the same-revision package field. The same explicit pips feed recovery;
conditions never enter history, persistence, URL or SLEF.

## 4. Validate shield/recovery unavailable issues

Exercise package-backed missing generator, disabled generator, shed generator, unresolved generator,
disabled plant and unresolved draw cases.

Expected:

- shield and recovery preserve their own complete ordered issue arrays;
- issue field/reason/slot/symbol remain exact, and slot-bearing issues reveal that slot;
- plant/draw issues are not relabeled as generator states;
- a generator powered with hardpoints retracted remains package-complete even if deployment would
  shed its group;
- no zero, stale value or catalogue fallback replaces unavailable;
- armour, hardness and banks remain present.

## 5. Validate recovery and non-finite meanings

Compare `regenRate`, `brokenRegenRate`, `recoveryTime` and `regenTime` independently with
`shieldRecoveryResult({ systemsPips })`. Use presentation fixtures for a phase that cannot reach 50%,
a phase that cannot reach full and an unbounded EHP value.

Expected: both rates and both durations remain separate. The two infinite durations and infinite EHP
receive three different localized meanings; finite zero stays numeric and no raw/clamped infinity is
shown.

## 6. Validate cell banks

Use builds for no banks, powered banks, mixed power, all banks unpowered and duplicate bank
symbols.

For every bank compare slot, symbol, reinforcement, cells, spin-up, duration, heat and powered state
with `cellBanks().banks`; compare both totals directly.

Expected:

- no banks has a dedicated empty state;
- fitted/all-unpowered retains every bank beside exact zero totals;
- powered means the returned hardpoints-deployed verdict;
- each action reveals the exact returned slot in one interaction.

## 7. Validate armour, hardness and module protection

1. Open a known hull with a non-stock bulkhead plus hull and module reinforcements.
2. Compare every armour scalar and damage row directly with `armourMetrics()`.
3. Compare hardness with `getShipBySymbol(loadout.shipSymbol).hardness`.
4. Remove/disable/shed the shield and repeat.

Expected:

- armour EHP uses hull points, not MJ;
- hull HP, module armour, module protection and hardness remain distinct;
- hardness explains the armour-piercing comparison without a matchup;
- actual fitted-role rows target exact slots but carry no apportioned contribution;
- a stock calculation fallback never fabricates a fitted bulkhead row;
- shield state never hides armour.

## 8. Validate fitted-role and issue targeting

Use duplicate boosters/reinforcements plus generator, actual bulkhead and slot-bearing issues.

Expected: package-resolved roles appear in package slot order; unavailable role/stat data produces no
guessed record and only supported module identities; duplicate symbols retain independent exact-slot
actions; wide and narrow actions deliver the original key; no role row claims numeric facade
provenance. Any package issue reason `unresolved` remains calculation feedback only.

## 9. Validate revision and Status integration

1. Trigger rapid accepted module edits and settled SYS changes.
2. Observe provider build/condition revisions and the rendered test seam.
3. Open Defence through feature 003's headline/detail target.

Expected: no stale projection is published under a newer context; shield/recovery share pips; Status
shield/armour equals the detail projection; the target is exactly `defenceProfile`; the
`shieldStrength` identity is exported exactly when that summary is unavailable and never for armour. The Status-provider update meets feature 003's 100 ms mobile-throttled
criterion.

## 10. Validate `.design` composition responsively

Run at 1440×900, 834×1112, 1112×834, 390×844 and 844×390 in Chromium and Firefox.

Expected: wide layouts may show complete shield/armour peers; constrained layouts stack the same
complete semantic content. Mobile never drops resistance percentages, multipliers, recovery, bank
fields, hardness or protection. The page has no horizontal overflow, and exact-slot actions retain
feature 002 return behavior.

## 11. Validate accessibility and previews

Render every state in [design/component-state-preview-matrix.md](./design/component-state-preview-matrix.md)
and every primary journey.

- Run axe and fail every in-scope violation.
- Check landmarks, headings, definition/table/card relationships and role/name/state semantics.
- Check visible text equivalents for every supplemental bar/icon.
- Check pointer/touch and the shared 44 CSS-pixel target baseline.
- Check 200% text, actual 400% zoom, doubled copy, RTL, long package identities and reduced motion.
- Complete the three stories with NVDA/Firefox desktop and TalkBack/Chromium mobile protocols.

Expected: every capability/state remains complete and understandable. Any conformance statement names
the exclusions: WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## 12. Validate localization boundaries

Switch every shipped locale and repeat unavailable, negative and non-finite states.

Expected:

- application text and units use feature 011 messages/formatters with bundled English fallback;
- module/hull/slot names and calculation diagnostics use Almanac leaf helpers;
- canonical package text is visibly disclosed when the requested package locale is unavailable;
- no raw message key, blank placeholder, parsed English diagnostic or private game translation is
  displayed;
- numbers, percentages, multipliers, counts and durations use the active locale.

## 13. Run the full gate

```bash
pnpm run check
```

Expected: format, strict type checks, static build, script tests, unit tests at or above 80% for all
four measures, and all Chromium/Firefox Playwright/axe projects pass with no skipped, quarantined or
deleted test.
