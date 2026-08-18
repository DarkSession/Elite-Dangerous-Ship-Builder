# Research: Module Outfitting and Engineering

Research was rerun on 2026-08-18 against the amended Constitution 5.0.0, the clarified feature spec,
the installed `@elite-dangerous-almanac/core@0.1.2`, planned feature 001/011 contracts, the actual
repository baseline and `.design/Ship Builder.dc.html`. Package probes used detached loadouts only.

## Decision 1: treat 001 and 011 as prerequisites, not existing code

**Decision**: Feature 002 extends feature 001's planned `/build`, `ActiveBuildState` and canonical
`BuildSnapshotV1` capture/package-reconstruction/swap boundary, and feature 011's planned strict,
localization, design-system and test foundations. The snapshot is also the modelled checkpoint shape
for session history; the history tape itself is never persisted or published. Tasks must depend on
those deliveries. Feature 002 does not create a substitute shell or local UI foundation.

**Rationale**: The current source tree contains only the application shell and build-link codec. The
current `tsconfig` is not fully strict, and Playwright defines only three Chromium projects with no
axe integration. Describing planned contracts as present would hide real delivery blockers.

**Alternatives considered**: Duplicating active-build, localization or components inside outfitting
would violate the one-build and one-design-system principles. Weakening tests until feature 011 lands
would violate the build gate.

## Decision 2: reconstruct detached atomic edits from the modelled snapshot

**Decision**: Keep exactly one observable committed `ShipLoadout` in application state. Every
Commander edit follows this flow:

```text
current package aggregate
  -> capture feature 001 BuildSnapshotV1
  -> reconstruct detached ShipLoadout through the package
  -> invoke one logical package-backed command
  -> refusal/no-op: discard candidate; change nothing
  -> changed: retain prior modelled snapshot as history frame; atomically install candidate
```

The transaction may briefly hold active and candidate aggregates, but only one is observable. The
active-build boundary exclusively owns mutable instances and exposes frozen projections. Ship
name/ident edits update the modelled snapshot before package reconstruction because `ShipLoadout`
exposes getters but no setters. Historical purchase values are intentionally not modelled; package
reconstruction recomputes current catalogue retail.

**Rationale**: `ShipLoadout` is mutable while its returned views are frozen snapshots. Candidate-first
editing prevents thrown operations from leaking partial state and gives history/autosave/link
observers one revision boundary. Feature 001's snapshot already defines the complete application
model, while package reconstruction remains authoritative for game state and calculations.

**Alternatives considered**: Direct component/active mutation risks partial commits. Raw-module
overlays, private source-purchase mirrors and unbounded intent replay would reimplement package
ownership. Inverse commands cannot guarantee exact restoration. Captured `LoadoutEvent` values are
not history because they contain non-modelled snapshots and purchase figures.

## Decision 3: use exact package leaves for slots, edits and display text

**Decision**: Use these package boundaries:

```ts
import {
  LoadoutEditError,
  ShipLoadout,
  type AvailableBlueprint,
  type EngineeringNormalizationResult,
  type ExperimentalEffectMutationResult,
  type FittedModule,
  type FixedMountRepairResult,
  type LoadoutSlot,
} from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  getModuleBySymbol,
  type ModuleMount,
  type ModuleRating,
  type OutfittingModule,
} from '@elite-dangerous-almanac/core/ships/modules';
import {
  getPreEngineeredVariants,
  type PreEngineeredVariant,
} from '@elite-dangerous-almanac/core/ships/pre-engineered';
```

Authoritative reads are `slots(kind?)`, `fittedModuleAt()`, `fittedModules()`, `validation`,
`modulesForSlot()`, `availableBlueprints()` and `availableExperimentalEffects()`. Identity is always
`LoadoutSlot.key`, `symbol` or `fdname`, never an ordinal or translated label.

Display calls the relevant leaves under `@elite-dangerous-almanac/core/i18n/`: `modules`, `slots`,
`pre-engineered`, `blueprints`, `experimental-effects`, `experimental-effect-descriptions`,
`engineering-groups`, `materials` and `diagnostics`. `LoadoutSlot.name` is canonical English, not the
active-locale label; use `getLoadoutSlotName()` and `getSlotRestrictionLabel()`. A locale miss shows
package canonical text with feature 011's untranslated disclosure, or unavailable when the package
has no text.

**Rationale**: This keeps game identities, values, names and diagnostic source text package-owned
while allowing application-owned control labels and framing to be translated locally.

**Alternatives considered**: Broad barrels add unrelated catalogues. Private game-name, slot-name or
diagnostic translations would fork package data. Rendering `LoadoutSlot.name` as localized would
misrepresent its contract.

## Decision 4: preserve every slot and unresolved entry

**Decision**: Render all package `slots()` in package order, including empty and unresolved known
mounts. Append any `fittedModules()` record whose original slot is absent from `slots()` to a clearly
unresolved group, keeping exact slot spelling, module symbol and raw record. Re-read all views after
each commit.

Capability comes from current package evidence. Removal mirrors `LoadoutSlot.removable`; replacement
queries `modulesForSlot()`; engineering comes from current menus/result state; power setters apply to
fitted modules. Cargo hatch is visible and power-editable but package-empty menus plus its immutable
slot state provide no replacement, removal or engineering action.

**Rationale**: The package distinguishes hull mounts from extra imported entries and exposes missing
facts as `null`/absence. Retaining both sets is lossless and gives no unknown slot a fabricated edit.

**Alternatives considered**: Positional reconciliation, symbol inference and zero/default display
would violate FR-002/003. A cargo-hatch symbol special case is unnecessary; package slot/menu results
supply the capability.

## Decision 5: expand candidates exactly, then project order and search

**Decision**: For the selected exact slot, emit one stock choice for every
`modulesForSlot(slotKey)` record and one variant choice for every
`getPreEngineeredVariants(module.symbol)` row. Retain the exact package objects for the source
revision. Fit them with `setModule()` or `setPreEngineeredVariant()`.

Present two ordered sections: standard, then unique rewards (`communityGoal`/`eventReward`). Within
each section group/order by active-locale displayed module name using `Intl.Collator` at base
sensitivity, class descending, exhaustive package rating order `A` through `I`, stock before variants,
then package ordinals for deterministic ties. Multiple acquisition routes remain separate.

Index only the displayed name, decimal class, rating and mount. Fold values/query with Unicode NFKD,
remove combining marks, locale-lowercase, split on Unicode whitespace and require every non-empty
term to match at least one of those four fields. Rebuild on slot, build revision or locale change.

The 0.1.2 probe found 48 hulls, 76 variants (22 Mercenary, 30 community-goal, 21 tech-broker and 3
event-reward), and a maximum 481 choices for empty `PantherMkII` `Slot01_Size8` (473 + 8).

**Rationale**: Membership stays package-owned while FR-005 permits deterministic presentation. An
immutable index makes the 100 ms target straightforward without caching stale candidates.

**Alternatives considered**: Filtering `ALL_MODULES`, deduplicating routes or reconstructing choices
would introduce rules. The design's weapon-family chips are omitted: the spec does not define that
filter and the package exposes no required grouping contract. Symbols, acquisition and private
synonyms are not searchable.

## Decision 6: package data supplies acquisition, variants and edit refusal text

**Decision**: Before fitting, project `OutfittingModule.entitlement` and
`PreEngineeredVariant.acquisition`; after fitting, use `FittedModule.stats?.entitlement` and only
`FittedModule.preEngineeredVariant`. Community/event routes receive a localized unique-reward
explanation; Mercenary/tech-broker routes receive a localized not-ordinarily-available explanation;
entitlement remains an independent label. Purchase grade and current ordinary grade never merge.

For `LoadoutEditError`, retain `code`, `constraint`, `params` and slot for state/testing, and request
text with `getLoadoutEditErrorMessage(error, locale)`. On locale miss, show the package's canonical
message through the disclosed fallback presenter; do not privately translate the package reason.
Plain unexpected package exceptions receive localized application framing without an invented game
cause. Structured engineering/normalization results have localized app-owned action framing while
their package code/params remain untranslated data.

**Rationale**: Acquisition/entitlement explanations describe package values without inferring them.
Package diagnostics are game text under Constitution VI.

**Alternatives considered**: Inferring a reward from engineering modifiers is forbidden. Mapping
each package diagnostic code to private translated game prose would duplicate the Almanac.

## Decision 7: handle each package mutation by its actual result shape

**Decision**:

| Intent                     | Package operation                                                 | Outcome handling                                                        |
| -------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Fit/replace stock          | `setModule(slotKey, exactModule)`                                 | Catch structured fitting errors; compare package-owned state            |
| Fit/replace variant        | `setPreEngineeredVariant(slotKey, exactVariant)`                  | Catch structured fitting errors; preserve variant identity              |
| Remove                     | `removeModule(slotKey)`                                           | Offer only when removable; catch structured refusal                     |
| Apply blueprint            | `applyBlueprint(slotKey, fdname, {grade, quality: 1, ...effect})` | Effect property is omitted when none; thrown refusal discards candidate |
| Change/remove effect only  | `setExperimentalEffect(slotKey, fdnameOrNull)`                    | Branch on `updated`, `unchanged`, `unsupported`                         |
| Clear ordinary engineering | `clearEngineering(slotKey)`                                       | Separate intent; may remove Mercenary identity                          |
| Enable/disable             | `setModuleEnabled(slotKey, boolean)`                              | Module stays fitted                                                     |
| Set priority               | `setModulePriority(slotKey, zeroBased)`                           | Present one-based `1..5`                                                |

Selection and draft changes never mutate the active build. Applying one blueprint + grade + optional
effect is one decision. Replacing a module never carries old engineering.

**Rationale**: `setExperimentalEffect()` returns a discriminated union; the other editing methods
primarily mutate/throw. Treating them as one generic exception contract would lose stable outcomes.

**Alternatives considered**: Editing raw `Engineering.Modifiers`, passing local computed stats or
using a null blueprint as clear-all would blur package semantics and violate FR-012.

## Decision 8: preflight partial quality before construction, then normalize ingress

**Decision**: Every stock/open/link/SLEF/reload replacement uses one shared ingress pipeline:

1. Decode to the source DTO without changing the active build. Reject malformed quality values
   through the owning decoder.
2. Before `ShipLoadout.fromLoadout()`, retain each source record with finite quality in `[0, 1)` and
   ask `getModuleBySymbol()` to resolve its identity. If the package cannot resolve it, refuse the
   entire candidate with the exact source slot/module/engineering identity.
3. Capture every source fixed-mount identity, then construct the detached loadout.
4. Correlate every retained source partial with the constructed fitted record by case-insensitive
   slot and exact source symbol. A missing/replaced/mismatched record (including the package's
   automatic unresolved-cargo repair) refuses the candidate before activation. Otherwise call
   `completeEngineeringGrade(slotKey)`. Accept only `normalized`; `unsupported` rejects the whole
   candidate and `unchanged` for a source partial is a package-contract failure. Never call this
   operation for absent quality or quality `1`: final/unknown fully rolled articles can legitimately
   return `unsupported` and must remain preserved.
5. Only after all partials succeed, repair fixed mounts that were missing or unresolved in the source.
   Use `repairFixedMount()` and retain each result. `repaired` changes the candidate;
   `defaultUnavailable` keeps the candidate incomplete; `refused` is an internal contract failure
   because selection was package-derived. Source comparison reports automatic cargo repair.
6. Commit the fully processed candidate atomically, publish notices, then start/reset history. Read
   validation/calculations only after commit.

Atomic refusal changes no active build, revision, working record, fragment or history. Successful
quality completion is transiently reported; fixed-mount provenance follows feature 001's local-record
contract. Neither automatic operation enters edit history.

**Rationale**: Constitution 5.0.0 resolves the prior contradiction by rejecting only partial states
the package cannot complete. Preflight is package resolution, not a local module heuristic. Ordering
prevents fixed repair from stripping evidence that must trigger refusal.

**Alternatives considered**: Changing only `Quality`, retaining partial modifiers, stripping
engineering or accepting `unsupported` are prohibited. Repair-first loses unresolved-partial
evidence. Rejecting `defaultUnavailable` would contradict FR-010.

## Decision 9: package menus, candidate stats and cost functions own engineering

**Decision**: Build drafts from exact `AvailableBlueprint[]` and effect fdnames. A draft stores
selection only. Produce preview attributes by applying the intended operation to a detached candidate
and reading its `stats`/`effectiveStats`; do not compute or color-code better/worse semantics.

Use `getBlueprintCost(fdname, targetGrade, currentGrade)` only when continuing the same ordinary or
Mercenary recipe; otherwise price from grade 0. Use `getBlueprintGradeCost()` only for an explicitly
shown per-roll fact, `getExperimentalEffectCost()` for adding/replacing the selected effect, and
`sumMaterials()` only when every source is known. Effect removal costs nothing selected. Preserve
`null` as unavailable and `[]` as known zero. Baked fixed engineering has no craft cost; Merc Coin is
separate from materials and credits.

**Rationale**: Detached preview uses the same package mutation path as apply. Package cost functions
encode grade progression and missing data.

**Alternatives considered**: Reimplementing modifiers, trusting `LessIsGood`, summing unavailable
lists or charging from the current grade after switching recipes would fabricate results.

## Decision 10: bounded modelled-snapshot history

**Decision**: Store `past` and `future` frames containing feature 001 `BuildSnapshotV1` values plus an
unformatted intent-summary key and scalar params. On one successful changed Commander decision, move
the pre-edit snapshot into `past`, keep the newest 100 and clear `future`. Undo/redo reconstruct each
candidate through the package and atomically swap it into the active boundary.

Include fit, remove, engineering, effect-only, clear, power, priority, ship name and ident. Exclude
selection, category/anatomy/status mode, query, draft, open/close/cancel, failed/no-op/refused edits,
automatic normalization, autosave and fragment publication. Every active-build replacement resets
both stacks.

**Rationale**: `BuildSnapshotV1` contains every application-modelled field required by FR-016 and
deliberately omits historical purchase values and capture condition. Package reconstruction restores
game state and recomputes current catalogue prices and all derived results.

**Alternatives considered**: Captured event round trips would reintroduce excluded purchase/condition
state. Inverse operations, intent replay and browser history cannot meet exact restoration/session
boundaries.

## Decision 11: adapt both design canvases and define the missing tablet state

**Decision**: Preserve canvas 1c's wide three-region hierarchy and canvas 1d's compact hierarchy,
full-screen editor layers and persistent selected-slot actions. Define tablet by available content
space: two-pane ledger/editor in roomy landscape; compact composition in portrait or whenever
localized/zoomed content cannot satisfy both panes. Feature 011 container tokens select composition,
not device detection or the reference pixel widths.

At all widths, replacement and engineering are drafts with explicit apply/cancel. The desktop mock's
immediate-looking rows/dropdowns are intentionally changed so one confirmation creates one atomic
history decision. Shared anatomy/status/calculation areas remain outlets owned by other features.

**Rationale**: `.design` contains 1560px and 390px references but no tablet. Explicit interpolation
is required by Constitution V, while confirmation protects atomic edits/history.

**Alternatives considered**: Calling the wide canvas “tablet” is unsupported. Copying fixed widths,
clickable `div`s, tiny controls, external fonts/assets, mock values, reward assumptions, comparison
arrows or partial-roll help text violates the accepted requirements.

## Decision 12: verification measures behavior, not screenshots alone

**Decision**: Feature unit tests use real package records for membership/mutation and feature 001's
snapshot/reconstruction/swap adapters for transactions/history. Cover every structured result,
unresolved/empty states, partial
preflight including cargo hatch, missing defaults, 481-choice search, `null` versus `[]`, route labels,
101 edits and all history exclusions.

Playwright runs each primary story at 1440×900, 834×1112, 1112×834, 390×844 and 844×390 in Chromium
and Firefox. Every meaningful workspace/layer/refusal state receives axe plus semantic, touch,
no-overflow, 200%-text, 400%-zoom, expansion/RTL and reduced-motion assertions. Browser
`performance.now()` plus a result-settle marker excludes automation transport from the 100 ms search
measurement.

**Rationale**: The constitution requires both engines, all form factors and automated accessibility.
The current harness does not yet provide them, so green Chromium-only subsets are not completion.

**Alternatives considered**: Visual comparison to `.design`, axe alone, desktop-only tests or
lowering coverage cannot prove the behavioral contract.

## Research status

No product clarification or feature-002 Almanac release blocker remains. Historical purchase values
are outside the model, and pinned 0.1.2 supports package reconstruction of the modelled snapshot.
Features 001 and 011 remain repository prerequisites. The FR-013 atomic-refusal path is supported by
the current package resolution/normalization outcomes.
