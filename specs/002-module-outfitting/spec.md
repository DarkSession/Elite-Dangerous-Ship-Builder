# Feature Specification: Module Outfitting and Engineering

## Scope

This specification covers reading every slot in the active build; fitting, replacing, removing,
engineering, enabling and prioritising modules; and undoing or redoing build changes.

Creating, opening and replacing builds belongs to
[Ship Selection and Build Loading](../001-ship-selection-and-loading/spec.md). Resulting statistics
follow [Ship Statistics](../003-ship-statistics/spec.md).

## User Scenarios & Testing

### User Story 1 - Inspect and change fitted modules (Priority: P1)

A Commander can see every hull slot, inspect what is fitted and choose only modules the Almanac
allows in that slot.

**Independent Test**: Load a reference build, compare every slot and fitted module with the Almanac,
then replace and remove modules in removable slots.

**Acceptance Scenarios**:

1. **Given** an active build, **When** outfitting is shown, **Then** every package slot is present by
   game slot key, including empty slots.
2. **Given** a fitted module, **When** it is shown, **Then** its package identity, class, rating,
   mass, power draw, retail cost and relevant type-specific attributes are available.
3. **Given** a slot, **When** replacement choices are shown, **Then** they are exactly the modules
   the package reports as fittable for the current build.
4. **Given** a removable slot, **When** its module is removed, **Then** the slot becomes empty and
   the package recomputes the build.
5. **Given** a non-removable slot, **When** it is inspected, **Then** removal is unavailable and the
   package's reason is visible.

### User Story 2 - Engineer a module (Priority: P1)

A Commander can apply, change and clear supported engineering and see the package-computed module
and build results.

**Independent Test**: Apply each supported engineering operation to reference modules, compare all
modified attributes with the Almanac and verify clearing restores stock values.

**Acceptance Scenarios**:

1. **Given** a fitted module, **When** engineering choices are shown, **Then** only package-supported
   blueprints, grades and experimental effects are offered.
2. **Given** selected engineering, **When** it is applied, **Then** the selected grade is treated as
   100% complete and all modified attributes come from the package.
3. **Given** existing engineering, **When** the blueprint or grade changes, **Then** it is replaced;
   removing only the experimental effect leaves the blueprint and grade intact.
4. **Given** engineering is cleared, **When** the module is recomputed, **Then** all ordinary
   engineering is gone and stock package values are restored.
5. **Given** a selected blueprint grade and effect, **When** their cost is shown, **Then** the
   package's cumulative blueprint cost and effect cost are used.

### User Story 3 - Control module power (Priority: P2)

A Commander can enable or disable modules and assign power priorities that participate in Almanac
power calculations.

**Independent Test**: Toggle and reprioritise modules, verifying stored state and every affected
package result.

**Acceptance Scenarios**:

1. **Given** a power-manageable fitted module, **When** the Commander changes its enabled state or
   priority, **Then** the build stores that state and affected package results update.
2. **Given** a disabled module, **When** other build properties are shown, **Then** its mass and cost
   remain because it is still fitted.

### User Story 4 - Undo and redo changes (Priority: P2)

A Commander can safely explore changes and restore earlier build states during the session.

**Independent Test**: Make a sequence covering every editable field, undo to the initial build and
redo to the final build, comparing each intermediate state.

**Acceptance Scenarios**:

1. **Given** a build change, **When** it is undone, **Then** every modeled field returns to its prior
   state and package results recompute.
2. **Given** an undone change, **When** it is redone, **Then** the exact later state returns.
3. **Given** an undone change followed by a new change, **When** history is inspected, **Then** the
   old redo path is gone.
4. **Given** available undo or redo, **When** it is presented, **Then** the affected slot or property
   is described in Commander-facing terms.

### Edge Cases

- Unknown module identities remain visible in their slots; they are not treated as empty.
- A fixed mount arriving empty or unresolved is normalized according to the constitution before any
  statistic is read.
- A module replacement never inherits engineering from the previous module.
- A build may remain editable while invalid or incomplete; package validation explains the state.
- Viewing-condition changes do not enter edit history.

## Requirements

### Slots and Modules

- **FR-001**: Outfitting MUST require an active build and MUST NOT create one as a side effect.
- **FR-002**: Slots MUST come from the active `ShipLoadout` and use game slot keys, never positional
  identities. Empty slots MUST remain visible.
- **FR-003**: Fitted-module facts and post-engineering attributes MUST come from the package. Missing
  facts MUST remain unavailable rather than being inferred.
- **FR-004**: Replacement choices MUST be exactly the result of the package's fittability rules for
  the active build, including hull restrictions, exclusivity and per-ship limits.
- **FR-005**: Candidate filtering and ordering MAY arrange package records but MUST NOT alter or
  supplement their values. Missing compared values MUST remain distinct from zero.
- **FR-006**: Fitting, replacing and removing MUST use the package's edit operations and surface
  their structured success or refusal results.
- **FR-007**: The application MUST NOT offer removal where the package reports a slot as
  non-removable. The seven core mounts, armour and cargo hatch MUST follow the package's fixed-mount
  report.
- **FR-008**: A fixed mount that arrives empty or contains an unresolved module MUST be filled with
  that hull's package stock module before presentation and calculation. The Commander MUST be told
  the slot, fitted module and replaced identity. If no stock module exists, the build remains
  incomplete.
- **FR-009**: Fixed-mount normalization MUST be part of loading, not edit history; undo and redo MUST
  NOT restore the invalid source gap.
- **FR-010**: Outside fixed-mount normalization, unresolved fitted identities MUST remain reported in
  their original slots.

### Engineering and Power State

- **FR-011**: Blueprint, grade, experimental-effect and pre-engineered availability MUST come from
  the package and use package `fdname` identities.
- **FR-012**: Each module MUST support applying, replacing and clearing ordinary engineering exactly
  as the package permits. Engineering on one slot MUST NOT affect another.
- **FR-013**: Every selected or imported ordinary grade MUST represent 100% quality. Partial quality
  MUST be normalized and reported, not stored or offered as a control.
- **FR-014**: Modified attributes MUST be package-computed and shown with their stock values. The
  application MUST NOT apply engineering modifiers itself.
- **FR-015**: Engineering costs MUST use package cost functions. The application MUST NOT calculate
  grade rolls or material quantities.
- **FR-016**: Package-identified pre-engineered modules MUST show their fixed modifications and any
  restriction on further engineering; their supplied modifications have no craft cost.
- **FR-017**: Supported fitted modules MUST allow enabled-state and priority changes using package
  build state. Disabled modules remain fitted and retain mass and cost.

### Undo and Redo

- **FR-018**: Every Commander-authored build change MUST be undoable and redoable for the session,
  including modules, engineering, enabled state, priority, ship name and ident.
- **FR-019**: Undo and redo MUST restore all modeled build fields exactly and trigger the same
  package recomputation as a direct edit.
- **FR-020**: One Commander decision MUST create one history step. Changes on different slots and
  separate module fittings MUST NOT merge.
- **FR-021**: A new change after undo MUST discard the redo path. Undoing beyond the last saved state
  MUST NOT alter the saved record.
- **FR-022**: History MUST be bounded, session-only and discarded when the active build is replaced.
  It MUST NOT be saved, linked, exported or confused with browser navigation.
- **FR-023**: Viewing conditions and automatic fixed-mount normalization MUST NOT enter edit history.

### Verification Requirements

- **FR-024**: Domain tests MUST cover package slot enumeration, every fitting constraint, removal,
  module replacement, enabled state, priority and unresolved identities without rendering UI.
- **FR-025**: Engineering tests MUST cover supported choices, 100% quality normalization,
  replacement, effect-only removal, clearing, pre-engineered modules and package-provided costs.
- **FR-026**: Fixed-mount tests MUST cover every package hull and every build source, including
  missing stock data and the absence of normalization history.
- **FR-027**: History tests MUST cover every change type, step boundaries, bounds, redo discard,
  build replacement and exclusion of viewing conditions.
- **FR-028**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **Slot**: A package fitting position identified by its game slot key.
- **Fitted module**: A package module plus slot-local engineering, enabled state and priority.
- **Fixed mount**: A core, armour or cargo-hatch mount the package reports as non-removable.
- **Edit history**: The bounded session-only sequence of Commander-authored build changes.

## Almanac Coverage

The Almanac supplies slot enumeration, module records, fittability, removability, stock loadouts,
edit operations, validation, engineering choices and computations, power state and cumulative
engineering-cost functions. The installed package also supplies authoritative fixed-mount
removability. No required game rule, number or calculation remains application-owned.

## Success Criteria

- **SC-001**: Every package slot is present and every offered module is fittable for that slot and
  build.
- **SC-002**: Every modified module value and engineering cost equals the package result.
- **SC-003**: No active build contains an empty or unresolved fixed mount when the package supplies a
  stock replacement, and every normalization is reported.
- **SC-004**: Twenty mixed changes can be undone to the initial state and redone to the final state
  with exact fidelity at every step.
- **SC-005**: Direct edits, undo and redo update all affected package results within 100 ms.
- **SC-006**: The complete feature passes the required viewport, browser and accessibility test
  matrix without horizontal page scrolling.
