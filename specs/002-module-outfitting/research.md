# Research: Module Outfitting and Engineering

Research used the constitution, the clarified feature spec,
the installed `@elite-dangerous-almanac/core`, feature 001/011 contracts, the actual
repository baseline and `.design/Ship Builder.dc.html`. Package probes used detached loadouts only.

## Decision 1: treat 001 and 011 as prerequisites, not existing code

**Decision**: Feature 002 extends feature 001's planned `/build`, `ActiveBuildState` and canonical
`BuildSnapshotV1` capture/package-reconstruction/swap boundary, and feature 011's planned strict,
localization, design-system and test foundations. The snapshot is also the modelled checkpoint shape
for session history; the history tape itself is never persisted or published. Tasks must depend on
those deliveries. Feature 002 does not create a substitute shell or local UI foundation.

**Rationale**: These shared contracts are delivery prerequisites. Feature 002 must consume them
rather than duplicate or weaken them locally.

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

## Decision 4: render every package slot after package construction

**Decision**: Render all package `slots()` in package order, including empty removable mounts, after
the shared ingress boundary has refused an unknown hull and package construction has populated every
fixed mount. Re-read all views after each commit.

> **Two exceptions to the order and the list 2026-08-31 (Commander request).** The cargo hatch is
> drawn after the core internals rather than after every optional mount, and the planetary approach
> mount is drawn nowhere. Both are presentation and neither touches what this decision is about:
> every mount is still read from `slots()` after package construction, and the withheld one is still
> ordinary build state (FR-002a).

Capability comes from current package evidence. Removal mirrors `LoadoutSlot.removable`; replacement
queries `modulesForSlot()`; engineering comes from current menus/result state; power setters apply to
fitted modules. Cargo hatch is visible and power-editable but package-empty menus plus its immutable
slot state provide no replacement, removal or engineering action.

**Rationale**: The package owns the hull layout and normalization. Once active, every fitted identity
is package-resolved; missing facts can still remain `null`/absent.

**Alternatives considered**: Preserving unknown records, positional reconciliation, symbol inference
and application-selected defaults violate principles II/IV. A cargo-hatch symbol special case is
unnecessary; package construction and slot/menu results supply the behavior.

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

The package audit covers the complete installed hull and pre-engineered-variant catalogues and
discovers the largest slot-choice set for performance testing.

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
calling `applyBlueprint` with a null fdname to mean clear would blur package semantics and violate
FR-012. Clearing is offered as the package's explicit no-blueprint entry among the blueprint choices
and dispatches `clearEngineering(slotKey)`; the choice-list entry and the API call are separate
things, and only the latter is prohibited.

## Decision 8: construct fixed defaults before partial quality and candidate activation

**Decision**: Every stock/open/link/SLEF/reload replacement uses one shared ingress pipeline:

1. Decode to the source DTO without changing the active build. Reject malformed quality values
   through the owning decoder.
2. Pass the candidate through the released Almanac construction boundary. Refuse an unknown hull and
   consume every fixed mount with the package default already populated. Unknown module identities
   are outside the supported input contract.
3. Retain finite quality in `[0, 1)` only for package-resolved modules that remain fitted.
4. Correlate every retained source partial with the normalized fitted record by exact package slot and
   module symbol, then call `completeEngineeringGrade(slotKey)`. Accept only `normalized`;
   `unsupported` rejects the whole candidate and an unexpected mismatch/`unchanged` is a
   package-contract failure. Never call this operation for absent quality or quality `1`.
5. Do not call `repairFixedMount`, choose a default or retain fixed-source provenance.
6. Commit the fully processed candidate atomically, publish notices, then start/reset history. Read
   validation/calculations only after commit.

Atomic refusal changes no active build, revision, working record, fragment or history. Successful
quality completion is transiently reported. Neither package construction nor quality completion
enters edit history.

**Rationale**: The constitution makes package construction establish the fixed-mount invariant
before quality completion. Partial-quality refusal applies only to a supported module the candidate
resolves.

**Alternatives considered**: Adding unknown-module compatibility, locally repairing fixed mounts,
changing only `Quality`, retaining partial modifiers or accepting `unsupported` are prohibited.

## Decision 9: package menus, candidate stats and cost functions own engineering

**Decision**: Build drafts from exact `AvailableBlueprint[]` and effect fdnames. A draft stores
selection only. Produce preview attributes by applying the intended operation to a detached candidate
and reading its `stats`/`effectiveStats`; do not compute or color-code better/worse semantics.

Use `getBlueprintCost(fdname, targetGrade, currentGrade)` only when continuing the same ordinary or
Mercenary recipe; otherwise price from grade 0. No surface presents a per-grade
craft fact separately, so `getBlueprintGradeCost()` is unused: a material requirement is identified by
its grade and is never called a roll (2026-08-21 clarification). Use
`getExperimentalEffectCost()` for adding/replacing the selected effect, and
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
empty removable-slot states, package-defaulted fixed mounts, partial
preflight including cargo hatch, package-defaulted fixed mounts, maximum-choice search, `null` versus `[]`, route labels,
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

## Decision 13: the family is `familyId`, not a name group

**Decision**: Group replacement choices by `OutfittingModuleIdentity.familyId` and label them with
`getOutfittingFamilyName(familyId, locale)`, both new in `@elite-dangerous-almanac/core` 0.1.7.
A variant takes the family of the base `OutfittingModule` it was expanded from, which is the record
`candidateMembership` already retains, so the id is available on both arms of `ModuleChoice` with no
extra package call. The presenter gains one method, `outfittingFamilyName`, alongside the twelve
leaves it already resolves — the lookup has the package's usual `(identity, locale) => string | null`
shape, so `presentGameText` covers it unchanged.

**Rationale**: The grouping the canvases draw cannot be produced from displayed names. Canvas 1c's
Plasma Accelerator family holds `Plasma Accelerator · Fixed` and `Plasma Accelerator · Advanced`;
the second is a pre-engineered variant whose own package name differs, and the existing `nameOf`
grouping splits it into a family of one. Measured against the installed package, `familyId` produces
exactly the canvas grouping. It also settles FR-020's "no application-owned taxonomy" clause in the
strongest available way: the taxonomy is 77 ids the package publishes and this repository does not
copy, extend or abbreviate.

**Localization**: measured on the installed 0.1.7 — all 77 families have an English name, and 58 of
77 have one in each other supported language. `presentGameText` therefore never reaches its
`unavailable` state for a family: a missing translation resolves to the canonical English name with
the existing `game-text.untranslated.description` disclosure, exactly as a module name does. The 19
unnamed families are upstream [#320](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/320)
and need no local handling.

**Alternatives considered**: The existing `CandidateGroup` name run is a smaller diff and was
rejected — it does not reproduce the design and would leave the "family" word meaning two different
things across the repository and the package. A local id-to-name table for the 19 untranslated
families was rejected as private game data (constitution II).

**Naming note**: the package writes families in the plural (`Multi-cannons`), the canvas draws them
in the singular (`Multi-Cannon`). The package text ships; the canvas's casing is not copied over it.

## Decision 14: the standard and unique-reward sections are withdrawn

**Decision**: Families are the only grouping level. `CandidateSection` survives only as the input to
the `uniqueReward` acquisition label already defined in `acquisition-labels.ts`; it stops being an
ordering key, a heading and a level of the view tree. `groupCandidates` is replaced by `groupFamilies`, which returns a flat ordered list
of families instead of sections of name groups.

**Rationale**: Neither redrawn canvas has a section heading. Both mark a reward on its own row,
inside the family of the module it is built on — canvas 1c draws `Plasma Accelerator · Advanced`
marked directly beneath `Plasma Accelerator · Fixed`. Keeping the sections would put a heading on the
screen the design does not draw, and would split one package family across two places whenever a
reward and its base module are both fittable. (The mark itself was a `REWARD ONLY` chip when this was
decided and is now the icon of the route the article is earned through; see the module-replacement
design, "Acquisition icons". Which mark it is does not bear on the section ruling.)

**What is not lost**: FR-006's labels are untouched. A reward is still identified as a unique reward,
and Mercenary and tech-broker choices as not ordinarily available; the identification moves from a
heading to the row, which is where the canvas puts it and where a screen reader reaches it without
having to hold a section in mind.

**Alternatives considered**: Nesting families inside the two sections preserves every shipped
ordering assertion and was rejected under the standing rule that the design is the record.

## Decision 15: open state is derived per presentation, not stored across rebuilds

**Decision**: `CandidateQueryState` carries one `openFamilies: ReadonlySet<string>` of family ids.
`openCandidateQuery` seeds it with the fitted choice's family, or with nothing when no available
family contains that exact choice. `applyQuery` replaces it wholesale whenever the query goes from
empty to non-empty or changes, seeding it with every family holding a match; when the query returns
to empty it re-seeds the fitted-family default. A toggle intent adds or removes one id and touches
nothing else.

**Rationale**: FR-021 and FR-023 both describe a _seed_, not a memory: the default is reapplied on
every rebuild, and the spec says a manual change is temporary viewing state. Deriving it as part of
the state the query already rebuilds on slot, revision and locale change means there is no second
lifetime to keep in step, and the stale/refused paths inherit the behaviour for free.

**Consequence for SC-002**: this is the first change that can close the compact timing gap recorded
in `design/module-replacement.md`. The Panther Mk II's 478-choice mount currently lays out and paints
478 cards at 390 px and settles at ~113 ms against the 100 ms allowed. With one family open, the rows
in the DOM are that family's rows plus one collapsed control per family. The criterion is still
stated as unmet until it is measured in the Chromium timing project; the measurement is a task, not
an assumption, and the whole-list rule that governs the open family is unchanged.

**Alternatives considered**: A store-owned open-set outside the query state was rejected — it needs
its own invalidation on every slot, revision and locale change, which is the exact bookkeeping the
query state exists to hold. Native `<details>` open state was rejected as the source of truth for the
same reason: FR-023 has to reseed it from outside on every query change, so the state has to be ours.

> **The store now owns the Commander's own reveals 2026-08-31 (Commander request).** The rejection
> above was right about the cost and wrong about the revision. A rebuild at a new build revision is
> the same presentation at a later moment, and re-seeding there undid a Commander's toggle with an
> edit that had nothing to do with it (FR-021). The seeds stay in `CandidateQueryState`, which is
> what this decision was for. What the store holds beside them is only the set a Commander pressed,
> under a lifetime that is one value rather than a list of events to catch: `#revealOverride` is a
> `linkedSignal` over the mount, the reading language, the reveal model and the search text, so it
> is dropped when that value changes rather than when a change is noticed. That is the bookkeeping
> this decision wanted to avoid, and it is not written anywhere — it is the signal's own source.

## Research status

No product clarification remains. Historical purchase values are outside the model. The package
supplies fixed defaults at construction, and unknown-module compatibility is not a product
requirement. Features 001 and 011 remain repository prerequisites. No application-side repair is
permitted. The 2026-08-23 family additions are resolved against `@elite-dangerous-almanac/core`
0.1.7 and both redrawn outfitting canvases; no `NEEDS CLARIFICATION` marker remains.
