# Component State Preview Matrix

> **Preview declarations withdrawn 2026-08-24.** This matrix opened by requiring a feature-011
> preview declaration for every component the feature adds. That is not what the manifest is for,
> and the requirement was never satisfiable as written.

The preview manifest covers the shared primitives in `src/app/ui/`, and
`scripts/check-interface-foundations.mjs` reconciles it against the component classes exported from
`src/app/ui/components` — that export list is the whole scope of the `missing-preview` rule. The two
feature blocks this capability adds live under `src/app/features/build-workspace/outfitting/`, and
are composed out of components that already carry their own preview states:
`edsb-module-identity-badge`, which draws a weapon row's name and code line exactly as it draws a
ledger row's, and `edsb-range-field`. The bars, the facts row and the gunsight plate are markup over
tokens, not components at all — the panel composes no metric group, because canvas 1c draws none. `SHOT CONVERGENCE` is a feature component of its own —
`edsb-shot-convergence`, under `offence-analysis/` — because the target range the plate is drawn at
is state the two blocks beside it have no part in; it is not exported from the library, so no
preview is owed for it either.

One component _is_ added to the library: `edsb-range-field`, the native range control the convergence
block's target range needs and the system did not have. It is exported from `src/app/ui/components`,
so the `missing-preview` rule does reach it, and it carries preview declarations for its default,
empty and disabled states with recorded rationales for the two that cannot occur.

The table below is kept, because the states it enumerates are still owed. They are covered where
they can actually be observed: in the component suites beside their source
(`offence-analysis.spec.ts`, `shot-convergence.spec.ts`, `offence-summary.spec.ts`), and in the
layout-profile journeys in
`e2e/offence-profile.spec.ts` registered in `e2e/coverage-ledger.ts`. "N/A" means the state cannot
occur for that component's input contract; it is recorded rather than silently omitted.

| Component/region       | Populated/default                                                                            | Empty                                                                              | Special states                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Offence analysis panel | Complete totals, damage bar, range bands, capacitor, weapons and convergence                 | Confirmed no weapons, with the package's own zero totals                           | Unavailable coverage; expanded language; RTL; reduced motion                                    |
| Weapon totals          | Positive burst and sustained damage per second                                               | Exact package zero beside a confirmed-empty statement                              | All-disabled zero; genuine-zero weapon; unavailable coverage                                    |
| Damage-type output     | Every conventional type the build deals, with its amount and share                           | No conventional damage: no bar, and no legend line either                          | A type the build does not deal is absent; `antiXeno` is not read at all                         |
| Capacitor endurance    | Finite drain with all four drawn fields                                                      | N/A: the package always returns a result for an active build                       | Immediate drain; infinite result; zero capacity                                                 |
| Weapon collection      | Multiple identities in package order                                                         | Confirmed no weapons                                                               | Some and all disabled; unavailable coverage; duplicate symbols in distinct exact slots          |
| Weapon row             | Damage per second, piercing and falloff, all present                                         | N/A: a row exists only for a returned weapon                                       | Genuine zero; disabled; each optional field absent; and inert in every one of them              |
| Damage bar and legend  | Two or more conventional types, each with its share                                          | No conventional damage: no bar and no legend                                       | One type carrying the whole total at 100%                                                       |
| Range bands            | Four distances weakening with range                                                          | Nothing landing anywhere: four stated zeroes and no track at all                   | One band carrying the whole scale; a build with no falloff-carrying weapon                      |
| Capacitor bars         | Draw and recharge filled against the larger of the two                                       | N/A: the package always returns a result for an active build                       | Capacity and endurance stated without a track                                                   |
| Shot convergence       | A placed gunsight: a dot and its hardpoint numeral per armed mount, with a sentence for each | A placed hull with nothing armed: axes and rings, no marks, none of the four facts | Gunsight unpublished for the hull; a mark clamped to the frame's margin; the range at both ends |
| Status rail `DPS` cell | Positive sustained damage per second                                                         | Exact zero, and no fitted weapons                                                  | All disabled; genuine zero; qualified coverage                                                  |

There is no pending or error row. The projection is a pure synchronous read of an in-memory loadout
— there is nothing to wait for and nothing to fail — which is the same reason feature 005's dashboard
declares neither.

## Required variants

Every applicable row is exercised at:

1. desktop 1440×900;
2. tablet portrait 834×1112;
3. tablet landscape 1112×834;
4. mobile portrait 390×844;
5. mobile landscape 844×390.

The catalogue also includes:

- 200% text and actual 400% browser-zoom protocol references;
- longest complete English and German message fixtures;
- RTL root direction with mixed localized labels and numeric values;
- reduced-motion preference;
- pointer, touch and keyboard operation of the target-range field;
- localized, canonical-fallback and unavailable game-text states;
- no document-level horizontal overflow, and only labelled internal overflow where necessary.

## Data fixtures

Fixtures are produced from live installed Almanac results or typed feature-owned presentation states.
They cover:

- enabled and all-disabled weapons on a real hull;
- confirmed-empty and unavailable hardpoint coverage;
- a genuine zero-damage returned weapon;
- conventional damage with `unclassified` present and absent;
- falloff range present and absent, and absent piercing;
- finite, immediate and infinite capacitor endurance, and zero capacity;
- a hull with a published gunsight and a hull without one.

No preview hard-codes a game value as an application rule. Sample package results are fixture inputs,
not a second catalogue.

## Verification

The preview manifest and its policy gate reach `edsb-range-field` and nothing else here, for the
reason recorded at the top of this document: neither feature block is exported from
`src/app/ui/components`, so neither is something the `missing-preview` rule can ask about. What holds
those states instead is the pair the note names — the component suites, which render every one of
them against live installed package results, and the coverage ledger, which fails when a registered
surface loses its journey.

Playwright runs those journeys across the five layout profiles in both engines, applies automated
accessibility checks and asserts semantic names, state and document overflow. Manual screen-reader
and actual-zoom checks cover the composed panel, because automated checks are a floor rather than
proof of comprehension.
