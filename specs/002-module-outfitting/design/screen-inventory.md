# Screen and Surface Inventory

Feature 002 adds no route. Every surface composes inside feature 001's `/build` workspace or an
owning feature's pre-activation ingress flow. Canvas sizes are references, not breakpoints; exact
wide, tablet and compact behavior is in
[responsive-composition.md](./responsive-composition.md).

| Surface                                           | Wide presentation                                                   | Tablet presentation                                                    | Compact/zoomed presentation                                                                    | Requirements                                |
| ------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [Outfitting workspace](./outfitting-workspace.md) | Complete ledger, inline selected-slot bench, direct history actions | Roomy landscape uses two panes; portrait/constrained uses compact flow | Source-faithful status/anatomy-before-ledger order, slot cards and persistent selected actions | FR-001–FR-003, FR-006–FR-011, FR-015–FR-019 |
| [Module replacement](./module-replacement.md)     | Inline searchable manifest, choice facts and explicit confirm       | Inline in roomy two-pane mode; full-screen layer when compact          | Full-screen layer with independent scroll and persistent cancel/fit                            | FR-002, FR-004–FR-008                       |
| [Engineering editor](./engineering-editor.md)     | Inline draft, result facts and costs with explicit apply/cancel     | Inline in roomy two-pane mode; full-screen layer when compact          | Full-screen layer with independent scroll and persistent revert/apply                          | FR-002, FR-007, FR-012–FR-014               |
| Incoming-build normalization refusal              | Owning feature 001/004 ingress surface shown before activation      | Same content reflows                                                   | Same content reflows; never opens an editor                                                    | FR-003, FR-013, FR-018                      |
| Ship name and ident control                       | Named fields in the workspace header beside feature 001's identity  | Same fields reflow in the header                                       | Same fields in the compact identity header; never a separate layer                             | FR-016, FR-019                              |

The incoming-build refusal remains visible even when there is no current build. It identifies every
affected exact slot, source module/engineering identity, original quality and package reason; states
that activation did not occur; and announces once as an alert. It never appears as an editable
workspace or engineering state for the rejected candidate.

## Requirement ownership

| Requirement | Surface behavior                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | No-build state explains the dependency and composes only actions supplied by their owners: feature 001 create/open/navigation, feature 004 import when present. Feature 002 promises none itself.                                                                                                                                                     |
| FR-002      | Workspace/editors re-read package slots, facts, effective attributes, compatibility, removability, mutation outcomes and calculations by exact game slot key.                                                                                                                                                                                         |
| FR-003      | Empty removable and package-resolved slots stay visible; unsupported module identities are outside the import contract.                                                                                                                                                                                                                               |
| FR-004      | Replacement contains exactly stock `modulesForSlot()` results plus every package variant.                                                                                                                                                                                                                                                             |
| FR-005      | Replacement owns within-family class-descending/price-descending order, then name/rating/stock-first ties, and four-field AND search with no-match/clear.                                                                                                                                                                                             |
| FR-006      | Workspace/replacement expose exact, stackable package acquisition and entitlement labels.                                                                                                                                                                                                                                                             |
| FR-007      | Purchase variant comes only from `preEngineeredVariant`; purchase and ordinary current grades stay separate.                                                                                                                                                                                                                                          |
| FR-008      | Stock/variant/remove actions use package-backed atomic transactions and surface package refusal without mutation.                                                                                                                                                                                                                                     |
| FR-009      | Cargo hatch exposes facts and package-supported power controls only; replace/remove/engineer are absent with reason.                                                                                                                                                                                                                                  |
| FR-010      | Package construction returns every fixed mount populated before shared ingress completes supported partials; there is no application repair branch.                                                                                                                                                                                                   |
| FR-011      | Package construction is not history; undo remains disabled when no Commander edit occurred.                                                                                                                                                                                                                                                           |
| FR-012      | Engineering offers exact package menus and distinct apply, effect-only and clear outcomes, the last reached through the package's explicit no-blueprint choice rather than a separate control. Inline, neither half of the surface scrolls: it expands and the workspace column releases so the page carries it.                                      |
| FR-013      | Supported partial quality on remaining resolved modules produces a 100% notice; unsupported partial candidates produce a pre-activation atomic refusal leaving the current build unchanged.                                                                                                                                                           |
| FR-014      | Editor distinguishes package material `null` from `[]`, does not price baked fixed engineering and keeps Merc Coin separate.                                                                                                                                                                                                                          |
| FR-015      | Named power controls use package setters and localized one-based labels over zero-based values.                                                                                                                                                                                                                                                       |
| FR-016      | Modelled snapshots reconstruct every application build field through the package; current catalogue costs and derived results are recomputed, and feature 001 name/ident controls dispatch history-recorded decisions.                                                                                                                                |
| FR-017      | A 100-decision session tape resets only after accepted active-build replacement and never enters persistence/export/navigation.                                                                                                                                                                                                                       |
| FR-018      | Slot selection, category/anatomy/status mode, query, open/close/cancel and draft changes never enable undo; automatic ingress changes/refusals also create no history.                                                                                                                                                                                |
| FR-019      | Feature 002 owns the ship name and ident fields on an active build. Both are optional free text written through the same snapshot update, package reconstruction and atomic replacement as every other edit, and each confirmed change is one history decision. Feature 001 owns only the modelled fields and the build-identity display beside them. |
| FR-020      | Replacement presents families keyed on the package `familyId` and named by the package's own family lookup, as the only grouping level, at every width — a rail with one revealed family at wide, a collapsible accordion at compact (2026-08-25 canvas revision).                                                                                    |
| FR-021      | Opening or rebuilding the chooser seeds exactly one open family from the fitted choice, or none when it has no available family; a family the application revealed is brought into the family list's visible box and one the Commander revealed is not; the toggle produces no revision and no history step.                                          |
| FR-022      | Each family control publishes name, current count and open state, and clears the 44 CSS px target floor on desktop, tablet and mobile.                                                                                                                                                                                                                |
| FR-023      | A non-empty search opens every family holding a match and drops the rest; clearing restores the FR-021 seed.                                                                                                                                                                                                                                          |
| FR-024      | Unique rewards keep their FR-006 labels on their own rows inside their family; no section heading is drawn.                                                                                                                                                                                                                                           |

## Cross-feature composition

- Feature 001 owns active build, identity controls, save/share status and workspace shell.
- Feature 003 owns conditions and headline basic statistics.
- Features 005–009 own specialist calculations/status summaries.
- Feature 010 owns interactive anatomy. Anatomy and ledger exchange the exact selected game slot key;
  neither may use a positional identity.
- Feature 004 owns import/export and composes the incoming-build refusal for SLEF import.
- Feature 012 owns help/licensing.
- Feature 011 owns tokens, localization primitives, shared components, previews and the complete
  browser/accessibility harness.

Feature 002 reserves composition outlets shown in canvases 1c/1d but never implements another
feature's mock values as placeholders.

## Shared component additions

Feature 002 extends `src/app/ui/` through feature 011 with slot groups/cards, module
identity/acquisition badges, unavailable facts, named power controls, candidate search/list,
engineering choices/material costs, undo/redo actions, ship name/ident fields and ingress/edit
refusal notices. Previews cover default/populated, selected, empty, unavailable, disabled, loading,
stale and refusal states at wide, tablet and compact widths with expanded/RTL text.
