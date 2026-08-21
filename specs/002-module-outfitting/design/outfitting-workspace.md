# Outfitting Workspace Surface

**Route**: `/build`  
**Requirements**: FR-001–FR-003, FR-006–FR-011, FR-015–FR-019

## Purpose

Inspect every package slot and its current module, select an editable slot, control module power, see
normalization/refusal state, and undo/redo Commander decisions. It extends feature 001's active-build
workspace and never creates or owns a second build.

## Wide composition

- Existing workspace identity/status/action header from feature 001, with feature 002's ship name and
  ident fields (FR-019) composed beside the build-identity display.
- Direct `UndoRedoActions` with programmatic disabled state and optional next-action summary.
- Persistent accepted-normalization/edit-refusal notices below the heading. Pre-activation ingress
  refusal belongs to the owning open/import flow and is not a workspace state for the rejected build.
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

- Existing compact build identity/actions header, including the same ship name and ident fields.
- Undo/redo in a clearly named action region or overflow menu with identical accessible names/state.
- Complete accepted-normalization/edit-refusal notice.
- Shared anatomy/status outlet and concise metric/power strip, then slot-kind/category controls and
  semantic slot cards. This intentionally follows canvas 1d's source order. Categories change the
  visible list but not build/history.
- Selected slot exposes explicit `Change module` and `Engineer` actions. Each opens its full-screen
  feature layer. Back/cancel changes no build.
- Package validation and later calculation details remain available through their owning shared
  outlets; no functionality is removed in landscape.

## Slot presentation

Every package slot shows:

- the slot label the canvas draws — kind, size and, for hardpoints, the node number, as in
  `SIZE · NODE NO.` and `FITTING · HARDPOINT 1`. The complete game slot key is **not** visible text;
  it is carried as `visually-hidden` text beside that label (see the accessibility contract below);
- kind/size/restriction when available;
- empty or package-resolved state;
- fitted package module name, symbol where needed to distinguish, class/rating/mount;
- current ordinary engineering and experimental effect when identified;
- current pre-engineered route/purchase grade separately from ordinary current grade;
- all package acquisition and entitlement labels;
- removability or package reason;
- enabled and localized priority state where package operation exists.

Unsupported identities are outside the workspace contract. Package construction has already
populated fixed mounts. Unavailable facts for resolved package entries have explicit localized text.

## Cargo hatch

Show cargo-hatch facts, enabled switch and priority selector. Present the
package immovable reason. Do not make the card open replacement or engineering and do not show remove.

## States

| State                             | Required presentation and behavior                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No active build                   | Explain that outfitting requires a build. Compose feature 001 create/open/navigation and feature 004 import only when those owners supply them; feature 002 promises no action itself. |
| Valid or invalid/incomplete build | Every available package slot remains inspectable/editable; validation stays visible.                                                                                                   |
| Empty slot                        | Canvas slot label, capacity facts and replace action; remove absent/no-op is not promoted.                                                                                             |
| Unsupported module ingress        | Outside the supported application import contract.                                                                                                                                     |
| Non-removable                     | Localized package reason and no remove action.                                                                                                                                         |
| Cargo hatch                       | Facts and power only.                                                                                                                                                                  |
| Accepted normalized ingress       | Notice reports quality completion; package-returned fixed defaults have no separate repair/provenance state; undo excludes normalization.                                              |
| Refused incoming normalization    | Not rendered as the rejected workspace. Owning ingress surface names every partial slot/identity/package reason and states that the current build/history are unchanged.               |
| Edit refusal                      | Structured localized notice; active build, calculations and history unchanged.                                                                                                         |
| History available/unavailable     | Direct or menu actions reflect `canUndo`/`canRedo`; new branch clears redo immediately.                                                                                                |
| Ship named / unnamed              | Both fields are optional and independently labelled. Unnamed shows an empty field, never a hull-derived placeholder presented as a value; clearing sets absence, not an empty string.  |

## Accessibility and responsive contract

- `main` and one workspace `h1` come from the owning route; slot group headings nest consistently.
- Groups use semantic lists; facts use definition lists. Exact slot keys are never visible text; they
  are always available to assistive technology through `visually-hidden` text beside the drawn label,
  which is the accessibility floor rather than an addition to the design.
- Switch and priority select names include the slot/module. One-based priority labels include the word
  “priority”; enabled state is not a colored dot alone.
- Selection, invalid/incomplete/disabled/engineered/acquisition state includes text and programmatic
  state, never only color, opacity, icon or anatomy position.
- Status/refusal/normalization announcements are coalesced; one Commander edit does not re-announce
  the entire ledger.
- Anatomy and ledger publish/select the same exact game slot key; no positional node index becomes
  shared identity.
- All targets meet 44 CSS px; hover is optional; touch/pointer work in both orientations.
- At 400% zoom use the narrow composition. Long names, symbols, translated labels and ident wrap;
  there is no document horizontal scrolling.
- Reduced motion removes ledger/layer transitions without delaying state. Expanded/RTL text preserves
  semantic reading order.

Preview/test states cover all rows above, 100-history boundary, undo branch, no-build and every
normalization/refusal state across core widths.
