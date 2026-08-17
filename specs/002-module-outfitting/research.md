# Research: Module Outfitting and Engineering

Research was performed against the installed
`@elite-dangerous-almanac/core@0.1.0-beta.12`, the repository constitution and architecture, feature
001's planned active-build boundaries, and `.design/Ship Builder.dc.html` canvases 1c/1d. Runtime
probes used only package data and detached `ShipLoadout` instances.

## Decision 1: one package aggregate and one active-build store

**Decision**: Extend feature 001's `ActiveBuildStore`. `ShipLoadout` remains the sole live game-domain
aggregate. An `OutfittingStore` owns only selected slot, chooser/editor draft, query and presentation
state. Components never keep a fitted-module array or second loadout.

Every Commander mutation runs through `BuildEditTransaction`:

```text
current lossless snapshot
  -> reconstruct detached ShipLoadout candidate
  -> invoke exactly one logical package-backed command
  -> package refusal: return structured failure; discard candidate
  -> success: serialize candidate and compare with current snapshot
      no change: discard; no history
      changed: push one checkpoint; atomically replace active loadout
               -> autosave/link publication/calculation presenters observe one revision
```

Ship name and ident have no `ShipLoadout` setter. Their command updates the explicit feature 001
snapshot and reconstructs through `ShipLoadout.fromLoadout()`. This is still one detached transaction.

**Rationale**: `ShipLoadout` is mutable and its fitted/slot values are frozen point-in-time snapshots.
Candidate-first reconstruction prevents a thrown operation from leaking a partial mutation and makes
signal invalidation deterministic.

**Alternatives rejected**:

- Mutating the shared instance in a component risks stale snapshots and partial UI state.
- Component-owned module arrays duplicate package state and fitting rules.
- Inverse commands cannot faithfully recreate unresolved identities, acquisition variants or future
  package behavior.

## Decision 2: package slot and fitted-module views are authoritative

Use the leaf export:

```ts
import {
  LoadoutEditError,
  ShipLoadout,
  type ApplyBlueprintOptions,
  type AvailableBlueprint,
  type ImmovableReason,
  type LoadoutSlot,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
```

Authoritative reads are `slots(kind?)`, `fittedModuleAt(slotKey)`, `fittedModules()` and
`validation`. `LoadoutSlot.key` is the game identity. A known slot with an unresolved module retains
the imported `module.symbol` and `module.raw`; `stats`, `effectiveStats` and
`preEngineeredVariant` are `null`. Unknown/original slot entries that are not in the hull layout remain
visible through `fittedModules()` and are appended to an explicitly unresolved group; they are never
dropped or assigned a positional identity.

Re-read package snapshots after every committed edit. Missing stats or values render unavailable;
they are never inferred from the symbol or replaced with zero.

`FittedModule` is not exported from this leaf in beta.12. Derive its type without importing the broad
barrel:

```ts
type FittedModule = ReturnType<ShipLoadout['fittedModules']>[number];
```

This declaration omission is non-blocking and is tracked in
[Almanac #294](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/294) so the workaround can
be removed.

## Decision 3: exact candidate expansion

Use these leaf imports:

```ts
import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
import {
  getPreEngineeredVariants,
  type PreEngineeredVariant,
} from '@elite-dangerous-almanac/core/ships/pre-engineered';
```

For the selected package slot:

```ts
const choices = loadout.modulesForSlot(slotKey).flatMap((module, sourceOrdinal) => [
  { kind: 'stock', module, sourceOrdinal },
  ...getPreEngineeredVariants(module.symbol).map((variant, variantOrdinal) => ({
    kind: 'variant',
    module,
    variant,
    sourceOrdinal,
    variantOrdinal,
  })),
]);
```

`modulesForSlot()` already applies size, category, slot/hull restrictions, exclusive families and
current module-count limits. It returned at most 470 stock records in the beta.12 catalogue probe;
after package variants, the maximum was 478 choices for `PantherMkII` `Slot01_Size8`. The package
contains 76 published variants: 22 Mercenary, 30 community-goal, 21 tech-broker and 3 event-reward.

Fit stock with `setModule(slotKey, module)` and variants with
`setPreEngineeredVariant(slotKey, variant)`. A choice key contains the full route-distinguishing
identity: base symbol, blueprint fdname, purchase grade, effect fdname/absence and acquisition.
Multiple package routes are not deduplicated.

**Alternatives rejected**:

- Filtering `ALL_MODULES` locally duplicates compatibility rules and bundles unnecessary catalogue
  data.
- Resolving variant stats and calling `setModule` loses the package's variant identity operation.
- A symbol-only key collapses route-distinct package variants.

## Decision 4: ordering and search are immutable projections

Choices have two sections: ordinary/non-unique first; `communityGoal` and `eventReward` unique
rewards last. Within each section:

1. group/order by displayed package module name with the active locale's `Intl.Collator` at base
   sensitivity;
2. class descending;
3. package `ModuleRating` order ascending (`A` through `I`, exhaustively checked against the package
   type);
4. stock before variants;
5. retained package stock/variant ordinals as deterministic final tie-breakers.

This changes presentation only. The chosen object is still the exact package record returned by the
expansion step.

Build one immutable `CandidateSearchIndex` whenever the selected slot, active-build revision or
locale changes. For each choice, fold only the displayed package name, decimal class, rating and
package mount value:

```text
Unicode NFKD -> remove combining marks -> locale-aware lower-case
```

Fold the query the same way, split on Unicode whitespace and remove empty terms. A choice matches
only when every term is a substring of at least one indexed field. Symbols, acquisition text,
blueprint names, stats and private aliases are not searchable because FR-005 does not admit them.

An empty query returns all choices. A non-empty zero-result query retains the input and emits an
explicit no-match state with a clear action. A Node microbenchmark over the 478-choice list was far
below 100 ms; Playwright must measure browser input-to-render time with `performance.now()` and a
`MutationObserver` so automation transport time is excluded.

## Decision 5: acquisition and entitlement remain package-derived

Before fitting, read `OutfittingModule.entitlement` and `PreEngineeredVariant.acquisition`. After
fitting, read `FittedModule.stats?.entitlement` and only
`FittedModule.preEngineeredVariant`. Never infer a variant from symbol, blueprint, grade, modifier
values or text.

Presentation may map package enums to localized explanatory badges:

- `communityGoal` / `eventReward`: route badge plus unique-reward status;
- `mercenary` / `techBroker`: route badge plus not-ordinarily-available status;
- `entitlement`: localized generic entitlement explanation containing the package token.

Labels stack; none suppresses another. Beta.12 has no friendly entitlement-name API, so the app does
not maintain a private token-to-product catalogue. Clearing Mercenary engineering intentionally makes
the package lose its purchase identity; the acquisition badge and Merc Coin cost disappear with it.

Package name helpers are imported independently:

```ts
import { getModuleName } from '@elite-dangerous-almanac/core/i18n/modules';
import { getBlueprintName } from '@elite-dangerous-almanac/core/i18n/blueprints';
import { getExperimentalEffectName } from '@elite-dangerous-almanac/core/i18n/experimental-effects';
import { getMaterialName } from '@elite-dangerous-almanac/core/i18n/materials';
```

A missing localized game name uses canonical package text with the constitution-required
untranslated disclosure. Variant names have no beta.12 localization helper and follow the same rule.

## Decision 6: package edit operations and structured refusals

| Intent                                             | Package operation                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| Fit/replace stock                                  | `setModule(slotKey, module)`                                           |
| Fit/replace package variant                        | `setPreEngineeredVariant(slotKey, variant)`                            |
| Remove                                             | `removeModule(slotKey)`                                                |
| Apply/replace blueprint, grade and optional effect | `applyBlueprint(slotKey, fdname, { grade, quality: 1, experimental })` |
| Clear ordinary engineering                         | `clearEngineering(slotKey)`                                            |
| Enable/disable                                     | `setModuleEnabled(slotKey, on)`                                        |
| Set power priority                                 | `setModulePriority(slotKey, zeroBasedPriority)`                        |

`LoadoutEditError` provides `code`, optional `constraint` and language-neutral `params` for fitting
and removal refusals. Map these to localized app messages; never parse or present its English fallback
as application text. Programming/input failures and engineering refusals are plain `TypeError` or
`RangeError`; the UI only emits package-offered keys and reports an unexpected refusal without
inventing a cause.

An occupied module's engineering is not inherited by a replacement. A failed or no-op edit does not
change the active revision or history.

## Decision 7: cargo hatch has package-defined power-only behavior

Runtime probes confirm that the cargo hatch reports `kind: 'cargoHatch'`, `removable: false` and
`immovableReason: 'cargoHatch'`. Candidate and engineering menu methods return empty arrays; set/remove
throw `LoadoutEditError('immutableSlot')`; enabled and priority setters work.

The slot remains visible with facts, a switch and a one-based priority selector. It has no chooser,
remove or engineering action. This state is derived from package reads rather than an application
symbol list.

## Decision 8: fixed-mount repair is a pre-calculation ingress reconstruction

The shared feature 001 replacement pipeline gains a `FixedMountNormalizer`:

1. Reconstruct a detached candidate sufficiently to inspect `slots()` and `fittedModules()`; read no
   calculation.
2. Select only slots whose package `immovableReason` is `requiredSlot` or `cargoHatch`. A temporary
   `moduleLimit` reason does not make a mount fixed.
3. A missing module or `module.stats === null` needs repair.
4. Look up the hull's `getDefaultLoadout(shipSymbol)` and match its slot case-insensitively.
5. Replace/insert only that exact default identity in a detached loadout DTO, preserving every
   unaffected raw module and the original slot spelling where present.
6. Reconstruct with `ShipLoadout.fromLoadout()`, apply quality normalization, then and only then expose
   validation/calculations or commit.
7. Emit local notices containing original slot key, absent/replaced identity and package default
   identity. Normalization creates no history frame.

Reconstruction is necessary because cargo hatch rejects `setModule()` even when imported absent.
All 48 beta.12 default loadouts contain resolvable defaults for every fixed slot. If a future package
hull has no matching default, leave the original state and package validation visible. Beta.12 does
not currently mark a missing cargo hatch incomplete; that prospective validation gap is tracked in
[Almanac #293](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/293) and must never be
overridden locally.

## Decision 9: ordinary engineering state and package costs

Use `availableBlueprints(slotKey)` for `{ fdname, grades, route }` and
`availableExperimentalEffects(slotKey)` for effect fdnames. Present current values from
`FittedModule.engineering`, current resolved article facts from `stats`, and post-engineering values
from `effectiveStats`. Do not recompute stat values or better/worse direction from modifier labels;
beta.12 explicitly documents `LessIsGood` as unreliable.

Every Commander-authored blueprint call explicitly passes `quality: 1`. The UI has no quality field.
For ordinary and Mercenary engineering, reapplying current blueprint/grade at quality 1 with a new
effect (or no effect) is the beta.12 effect-only operation. `clearEngineering()` is distinct: it
removes all ordinary engineering and may remove Mercenary identity.

Cost leaf imports:

```ts
import {
  getBlueprintCost,
  getBlueprintGradeCost,
} from '@elite-dangerous-almanac/core/ships/blueprint-costs';
import { getExperimentalEffectCost } from '@elite-dangerous-almanac/core/ships/experimental-effect-costs';
import { sumMaterials } from '@elite-dangerous-almanac/core/ships/engineering';
```

`null` is unavailable; `[]` is known zero. A fixed reward's baked engineering has no craft cost. A
Mercenary upgrade prices only grades above its purchase grade. Selected ordinary engineering and an
effect use their package cost results; Merc Coin remains separate from materials and credits.

## Decision 10: bounded checkpoint history

`SessionEditHistory<BuildSnapshotV1>` holds `past` and `future` checkpoint arrays. On a successful
Commander edit, push the exact pre-edit snapshot to `past`, cap it to the 100 newest decisions, clear
`future`, and commit. Undo moves current to `future` and restores the newest `past`; redo performs the
inverse. The combined reachable decision path never exceeds the retained 100 entries.

One confirmation is one step, including blueprint + grade + effect. Fit, replace, remove,
engineering, effect-only changes, clear, enabled, priority, ship name and ident participate. Search,
selection, editor drafts, viewing conditions, canceled/failed/no-op commands, automatic normalization,
autosave and link publication do not.

Stock creation, saved/working build open, link load, SLEF import, reload restore and hull replacement
are active-build replacements and reset the tape. Restored snapshots are reconstructed through the
package so all results recompute. The tape is neither serializable nor injectable into storage, URL,
SLEF or browser history boundaries.

## Decision 11: responsive surfaces stay under `/build`

There is no new top-level route. The wide workspace composes grouped slots, selected-module detail,
inline chooser/engineering region and history actions. Narrow/400%-zoom composition shows category
tabs and slot cards, with chooser and engineering as full-screen layers. These layers are application
view state: opening/closing them does not replace the build or create browser/edit history.

The canvases' anatomy, headline statistics, import/export/save and help controls belong to features
010, 003/005–009, 001/004 and 012 respectively. Feature 002 exposes stable composition outlets but
does not duplicate those capabilities.

## Upstream release blockers

### A. Fixed-reward experimental-only mutation

Tracked in [Almanac #291](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/291).

Beta.12 has no operation that changes only an experimental effect while preserving a fixed
community-goal/tech-broker reward's hand-authored modifier block and identity. Reapplying the current
blueprint works for ordinary/Mercenary modules but turns a fixed reward into an ordinary roll.

Minimal reproduction:

1. Create a Python and fit the package tech-broker 5A frame shift drive with
   `setPreEngineeredVariant()`.
2. Observe `effectiveStats.optMass === 1785` and acquisition `techBroker`.
3. Call `applyBlueprint('FrameShiftDrive', 'FSD_LongRange', { grade: 5, quality: 1,
experimental: 'special_fsd_heavy' })`.
4. Observe `effectiveStats.optMass === 1692.599976` and `preEngineeredVariant === null`.

Required package outcome: a supported add/replace/remove-effect operation retains fixed stats,
purchase identity and purchase grade while applying/removing only the later effect; final articles
still refuse.

### B. Universal partial-quality normalization

Tracked in [Almanac #292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292).

`ShipLoadout.fromLoadout()` preserves imported partial quality and its authoritative modifiers; a
probe with `Quality: 0.42` read back `0.42`. Known ordinary/Mercenary recipes can be recomputed by
`applyBlueprint(... quality: 1)`. Beta.12 cannot faithfully normalize a fixed reward with a later
effect (blocker A) or unsupported/unidentified engineering whose completed modifiers cannot be
recomputed.

Changing only the `Quality` scalar lies about the effective roll. Merging/rebuilding modifiers in the
app duplicates package calculations. Required package outcome: losslessly normalize every supported
imported engineering state to a completed grade, and provide a stable structured outcome when the
identity cannot be normalized so the product requirement can be handled without guessing.

Both issues must be fixed in the Almanac. Feature 002 then pins the released version and adds
cross-package regression fixtures. Until then the accepted feature cannot be implemented or declared
complete.

## Test research conclusion

Unit tests inject the snapshot adapter and use real package records for membership/mutation tests.
They cover unresolved states, all command/refusal paths, 478-choice search performance, exact
acquisition routes, `null` versus `[]` costs, quality normalization, cargo hatch, 101+ history edits
and every exclusion/reset.

Playwright covers all four user stories in desktop, tablet and mobile portrait/landscape, in Chromium
and Firefox. Every workspace/chooser/engineering/normalization state receives an axe scan plus manual
semantic assertions, no-page-overflow checks, 200% text, 400% zoom, expanded/RTL text, reduced motion
and touch actions. Feature 011 must first add Firefox, landscape projects and automated accessibility
to the current harness.
