# Screen and Surface Inventory

Feature 002 adds no top-level route. Every surface composes inside feature 001's `/build` workspace.
At wide widths, replacement and engineering are inline regions. At narrow widths and 400% zoom, they
are full-screen layers with explicit back/cancel/apply actions. This responsive treatment does not put
build edits into browser navigation.

| Surface                                           | Wide/tablet presentation                                                  | Narrow/zoomed presentation                                                                     | Requirements                                |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| [Outfitting workspace](./outfitting-workspace.md) | Grouped slot ledger, selected-module region, direct power/history actions | Category controls and semantic slot cards; power per card; history in named action region/menu | FR-001–FR-003, FR-006–FR-011, FR-015–FR-018 |
| [Module replacement](./module-replacement.md)     | Inline searchable manifest and choice detail/actions                      | Full-screen chooser with search, grouped cards and explicit fit/cancel                         | FR-002, FR-004–FR-008                       |
| [Engineering editor](./engineering-editor.md)     | Inline blueprint/grade/effect, attributes and costs panel                 | Full-screen draft editor with explicit apply/cancel/clear                                      | FR-002, FR-007, FR-012–FR-014               |
| Normalization notice                              | Workspace notice linking/naming each affected slot                        | Same complete notice reflowed above slot categories                                            | FR-010, FR-011, FR-013, FR-018              |

## Requirement ownership

| Requirement | Surface behavior                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Workspace requires the feature 001 active build; no-build state points to select/open/import actions and does not construct a hull.                                     |
| FR-002      | Workspace and editor projections re-read package slots, facts, effective attributes, compatibility, removability, mutation outcomes and calculations by exact slot key. |
| FR-003      | Known empty/unresolved and unknown original-slot entries are explicit; unavailable facts remain unavailable.                                                            |
| FR-004      | Replacement surface contains exactly stock `modulesForSlot` results plus every package variant.                                                                         |
| FR-005      | Replacement surface owns required ordering, cached four-field multi-term search, no-match and clear states.                                                             |
| FR-006      | Workspace fitted state and replacement choices expose package acquisition/entitlement labels, including stacked labels.                                                 |
| FR-007      | Workspace/editor display purchase variant only from `preEngineeredVariant` and show purchase/current grade separately.                                                  |
| FR-008      | Replacement actions dispatch package-backed stock/variant/remove transactions and surface structured refusal.                                                           |
| FR-009      | Workspace cargo hatch exposes facts, enabled and priority only; no editor action opens.                                                                                 |
| FR-010      | Shared ingress normalizer repairs package-reported fixed mounts before presentation; workspace notice names slot/original/default or missing-default result.            |
| FR-011      | Normalization notice is local provenance; undo remains unavailable when normalization was the only change.                                                              |
| FR-012      | Engineering editor offers exact package fdname menus and distinct apply/effect-only/clear semantics.                                                                    |
| FR-013      | Engineering editor has no quality field; workspace notice reports every imported partial value completed to 100%.                                                       |
| FR-014      | Engineering editor shows package material results, unavailable/known-zero distinction and no baked reward craft cost.                                                   |
| FR-015      | Workspace power controls use package setters and localized one-based labels over zero-based values.                                                                     |
| FR-016      | Workspace undo/redo restores every modelled field and re-renders package results.                                                                                       |
| FR-017      | Workspace exposes a 100-decision in-memory tape reset by active-build replacement and absent from all export/navigation boundaries.                                     |
| FR-018      | Viewing controls and normalization never enable undo; only Commander build decisions do.                                                                                |

## Cross-feature composition

- Feature 001 owns active build, save/share status and workspace shell.
- Feature 003 owns conditions and headline basic statistics.
- Features 005–009 own specialist calculations/status summaries.
- Feature 010 owns interactive hull anatomy and node-to-slot visualization.
- Feature 004 owns import/export; feature 012 owns help/licensing.
- Feature 011 owns tokens, localization primitives, shared components, previews and the complete
  browser/accessibility harness.

Feature 002 may reserve composition regions shown in canvases 1c/1d, but cannot implement mock values
from another capability as local placeholders.

## Shared component additions

Feature 002 extends `src/app/ui/` through feature 011 with:

- `SlotGroup`, `SlotCard` and `UnresolvedSlotCard`;
- `ModuleIdentity`, `AcquisitionBadges` and `UnavailableFact`;
- `PowerToggle` and one-based `PrioritySelect`;
- `CandidateSearch`, `ResponsiveCandidateList` and `CandidateChoice`;
- `BlueprintChoice`, `GradeChoice`, `ExperimentalChoice` and `MaterialCostList`;
- `UndoRedoActions`, `NormalizationNotice` and `PackageRefusalNotice`.

Each component has relevant default/populated, empty, unavailable, selected, disabled, loading and
error previews at desktop, tablet and mobile widths, including expanded/RTL text.
