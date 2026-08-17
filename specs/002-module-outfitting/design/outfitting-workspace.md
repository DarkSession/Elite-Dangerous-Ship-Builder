# Outfitting Workspace Surface

**Route**: `/build`  
**Requirements**: FR-001–FR-003, FR-006–FR-011, FR-015–FR-018

## Purpose

Inspect every package slot and its current module, select an editable slot, control module power, see
normalization/refusal state, and undo/redo Commander decisions. It extends feature 001's active-build
workspace and never creates or owns a second build.

## Wide composition

- Existing workspace identity/status/action header from feature 001.
- Direct `UndoRedoActions` with programmatic disabled state and optional next-action summary.
- Persistent normalization/refusal notices below the heading.
- A fluid three-region layout inspired by canvas 1c:
  - grouped semantic slot ledger in package outfitting order;
  - selected-slot facts and outlet for replacement/engineering;
  - composition outlet for package validation and later calculation features.
- Optional anatomy composition outlet owned by feature 010; the slot ledger remains complete without
  it.

Slot groups follow package kinds/layout and retain exact keys. Each row/card contains separate native
controls: a named select/edit button, enabled switch and one-based priority select. The row itself is
not a clickable container around nested controls.

## Narrow and 400%-zoom composition

- Existing compact build identity/actions header.
- Undo/redo in a clearly named action region or overflow menu with identical accessible names/state.
- Complete normalization/refusal notice.
- Slot-kind/category controls followed by semantic slot cards; categories change the visible list but
  not build/history.
- Selected slot exposes explicit `Change module` and `Engineer` actions. Each opens its full-screen
  feature layer. Back/cancel changes no build.
- Package validation and later calculation summaries stack after the slot ledger; no functionality is
  removed in landscape.

## Slot presentation

Every package slot shows:

- package name and complete game slot key;
- kind/size/restriction when available;
- empty, resolved or unresolved state;
- fitted package module name, symbol where needed to distinguish/unresolved, class/rating/mount;
- current ordinary engineering and experimental effect when identified;
- current pre-engineered route/purchase grade separately from ordinary current grade;
- all package acquisition and entitlement labels;
- removability or package reason;
- enabled and localized priority state where package operation exists.

Unknown original slots from `fittedModules()` form an `Unresolved entries` group and expose no
invented fitting operation. Unavailable facts have explicit localized text.

## Cargo hatch

Show cargo-hatch facts, unresolved state if any, enabled switch and priority selector. Present the
package immovable reason. Do not make the card open replacement or engineering and do not show remove.

## States

| State                             | Required presentation and behavior                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| No active build                   | Explain that outfitting requires a build and offer feature 001 navigation/open/import actions; no placeholder hull or editor. |
| Valid or invalid/incomplete build | Every available package slot remains inspectable/editable; validation stays visible.                                          |
| Empty slot                        | Exact key, capacity facts and replace action; remove absent/no-op is not promoted.                                            |
| Unresolved known slot             | Original symbol/key and unavailable facts; replace only from current package candidates.                                      |
| Unknown original slot             | Separate unresolved group; retained identity; no fabricated operation.                                                        |
| Non-removable                     | Localized package reason and no remove action.                                                                                |
| Cargo hatch                       | Facts and power only.                                                                                                         |
| Normalized ingress                | Notice names each slot, original/absent identity, replacement/default and partial source quality; undo excludes it.           |
| Edit refusal                      | Structured localized notice; active build, calculations and history unchanged.                                                |
| History available/unavailable     | Direct or menu actions reflect `canUndo`/`canRedo`; new branch clears redo immediately.                                       |

## Accessibility and responsive contract

- `main` and one workspace `h1` come from the owning route; slot group headings nest consistently.
- Groups use semantic lists; facts use definition lists. Exact slot keys are available to assistive
  technology even if visually secondary.
- Switch and priority select names include the slot/module. One-based priority labels include the word
  “priority”; enabled state is not a colored dot alone.
- Selection, unresolved/invalid/disabled/engineered/acquisition state includes text and programmatic
  state, never only color, opacity, icon or anatomy position.
- Status/refusal/normalization announcements are coalesced; one Commander edit does not re-announce
  the entire ledger.
- All targets meet 44 CSS px; hover is optional; touch/pointer work in both orientations.
- At 400% zoom use the narrow composition. Long names, symbols, translated labels and ident wrap;
  there is no document horizontal scrolling.
- Reduced motion removes ledger/layer transitions without delaying state. Expanded/RTL text preserves
  semantic reading order.

Preview/test states cover all rows above, 100-history boundary, undo branch, no-build and every
normalization/refusal state across core widths.
