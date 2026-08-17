# Feature Specification: Module Outfitting and Engineering

## Scope

This specification covers reading every slot in the active build; fitting, replacing, removing,
engineering, enabling and prioritising modules; and undoing or redoing build changes.

Creating, opening and replacing builds belongs to
[Ship Selection and Build Loading](../001-ship-selection-and-loading/spec.md). Resulting statistics
follow [Ship Statistics](../003-ship-statistics/spec.md).

## Clarifications

### Session 2026-08-17

- Q: When a Commander searches a slot's module choices, which facts about a module should the typed
  text be matched against? → A: Module name plus class, rating, and mount type for weapons
- Q: What should a Commander see when their search text matches no module? → A: A "no matches"
  message and a way to clear the search
- Q: Before any search text is entered, in what order should a slot's compatible modules be listed?
  → A: Grouped by module type, then class descending, then rating ascending
- Q: How should the typed text be compared against a module's name, class, rating and mount? → A:
  Every whitespace-separated term must match some field as a case- and accent-insensitive substring,
  in any order
- Q: How quickly must the list update as a Commander types, and how large a candidate list must stay
  usable? → A: Within 100 ms of a keystroke, for the largest list any hull and slot produces
- Q: What should a slot offer when the package reports no fittable module for it, as it does for the
  cargo hatch on every hull? → A: No choice list and no search at all; only power state stays
  editable
- Q: How should pre-engineered variants reach the Commander? → A: Each variant is its own row in the
  slot's choices, alongside the stock module
- Q: Where should tech-broker variants sit? → A: With mercenary ones — natural position, marked as
  not ordinarily available
- Q: Should module rows needing a game unlock also be marked? → A: Yes, mark every module the package
  records an entitlement for

## User Scenarios & Testing

### User Story 1 - Inspect and change fitted modules (Priority: P1)

A Commander can see every hull slot, inspect what is fitted, and find and choose a module among only
those the Almanac allows in that slot.

**Independent Test**: Load a reference build, compare every slot and fitted module with the Almanac,
search a slot's candidates, then replace and remove modules in removable slots.

**Acceptance Scenarios**:

1. **Given** an active build, **When** outfitting is shown, **Then** every package slot is present by
   game slot key, including empty slots.
2. **Given** a fitted module, **When** it is shown, **Then** its package identity, class, rating,
   mass, power draw, retail cost and relevant type-specific attributes are available.
3. **Given** a slot, **When** replacement choices are shown, **Then** they are exactly the modules
   the package reports as fittable for the current build, grouped by module type, with the largest
   class first within each group and ratings in the package's own order.
4. **Given** a slot's replacement choices, **When** the Commander enters search text, **Then** the
   listed choices are exactly those matching every entered term, in any order and ignoring case and
   accents, against name, class, rating or weapon mount type.
5. **Given** search text matching no choice, **When** the result is shown, **Then** a no-matches
   message appears and clearing the search restores the full list.
6. **Given** a removable slot, **When** its module is removed, **Then** the slot becomes empty and
   the package recomputes the build.
7. **Given** a non-removable slot, **When** it is inspected, **Then** removal is unavailable and the
   package's reason is visible.
8. **Given** the cargo hatch, **When** it is inspected, **Then** no replacement, search, engineering
   or removal is offered, while its attributes and power state remain available.
9. **Given** a slot's choices, **When** they are listed, **Then** each pre-engineered variant is its
   own choice, unique rewards come last in a section identifying them as such, and mercenary,
   tech-broker and entitlement-gated choices are marked in their natural positions.
10. **Given** a fitted mercenary purchase, **When** the build is saved and reloaded, **Then** it is
    still recognized and marked as not ordinarily available.

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
- The cargo hatch is the only slot the package reports no fittable module for, on every hull. It is
  shown with its attributes and power state and offers no way to change the module itself.
- A module carrying variants in more than one acquisition category appears once per variant, so the
  same weapon can be listed both in its natural position and among the unique rewards.
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
  the active build, including hull restrictions, exclusivity and per-ship limits. A fittable module
  contributes one choice for its stock form and one further choice for each pre-engineered variant
  the package records for it.
- **FR-005**: Candidate filtering, searching and ordering MUST arrange package records only and MUST
  NOT alter or supplement their values. Missing compared values MUST remain distinct from zero.
- **FR-005a**: A slot's replacement choices MUST be searchable by free text. Search MUST narrow the
  choices to those whose package-provided name in the active language, class, rating or — for
  hardpoint modules — mount type matches the entered text. No other module attribute participates in
  matching, and search MUST NOT admit a module the package reports as unfittable.
- **FR-005b**: Search text matching no choice MUST show a no-matches message and MUST offer clearing
  the search, which restores the unnarrowed choices. Where the package reports no fittable module for
  a slot, no choice list and no search MUST be offered at all, rather than an empty list.
- **FR-005c**: With no search text entered, replacement choices MUST be grouped by module name, and
  within a group ordered by class descending then by rating ascending in the package's recorded
  rating sequence, so that A precedes E and armour grade I precedes V. Within one module name, a
  stock choice MUST precede that module's variants. The order MUST be stable across openings of the
  same slot on the same build.
- **FR-005d**: Search text MUST be split on whitespace, and a module MUST be listed only when every
  term matches at least one of its searchable fields as a substring, in any order. Matching MUST
  ignore letter case and diacritics in both the entered text and the package's name, so that a term
  typed without accents still matches an accented name. Terms MUST NOT be corrected for spelling.
- **FR-005e**: Unique-reward choices MUST be ordered after every other choice, as a distinct trailing
  section that says these are rewards no longer ordinarily obtainable. A choice is a unique reward
  when the package records its variant's acquisition as a community goal or an event reward. The
  trailing section MUST use the same grouping and ordering as the rest of the list.
- **FR-005f**: Every choice MUST carry the package's own account of how its module is obtained. A
  choice whose variant acquisition is a community goal or an event reward MUST be marked a unique
  reward; one whose acquisition is mercenary or tech broker MUST be marked as not ordinarily
  available while keeping its natural position; and a module the package records an entitlement for
  MUST be marked as requiring that entitlement. A choice MAY carry more than one mark. No mark may be
  carried by colour, shape or position alone, and each MUST reach assistive technology. The
  application MUST NOT classify or reword the package's entitlement values into groups of its own.
- **FR-005g**: A choice's marks MUST also apply to the module once fitted, and MUST survive saving
  and reloading the build. The package resolves community-goal, event-reward and tech-broker
  variants back from a fitted module, but returns none for any mercenary variant, so a fitted
  mercenary purchase MUST be recognized by its Mercenary-route blueprint exactly as
  [Cost and Materials](../009-cost-and-materials/spec.md) FR-004a defines. The application MUST NOT
  introduce a second recognition rule, and the upstream request FR-004a names covers this use too.
- **FR-006**: Fitting, replacing and removing MUST use the package's edit operations and surface
  their structured success or refusal results.
- **FR-007**: The application MUST NOT offer removal where the package reports a slot as
  non-removable. The seven core mounts, armour and cargo hatch MUST follow the package's fixed-mount
  report.
- **FR-007a**: The cargo hatch MUST NOT be offered as a module the Commander can change. On every
  hull the package reports no fittable module, no blueprint and no experimental effect for it and
  refuses to empty it, so no replacement, search, engineering or removal MUST be presented. Its
  identity, attributes and power state remain visible, and enabling, disabling and prioritising it
  MUST stay available because the package accepts those edits and its draw counts against the power
  budget.
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
  separate module fittings MUST NOT merge. Choosing a pre-engineered variant is one decision and MUST
  remain one step even though it takes more than one package operation to apply.
- **FR-021**: A new change after undo MUST discard the redo path. Undoing beyond the last saved state
  MUST NOT alter the saved record.
- **FR-022**: History MUST be bounded, session-only and discarded when the active build is replaced.
  It MUST NOT be saved, linked, exported or confused with browser navigation.
- **FR-023**: Viewing conditions and automatic fixed-mount normalization MUST NOT enter edit history.

### Verification Requirements

- **FR-024**: Domain tests MUST cover package slot enumeration, every fitting constraint, removal,
  module replacement, enabled state, priority and unresolved identities without rendering UI.
- **FR-024a**: Search tests MUST cover each searchable field, multi-term and any-order matching, case
  and accent insensitivity, the no-matches state and its clearing, the default order, and the largest
  candidate list any hull and slot produces.
- **FR-024b**: Cargo-hatch tests MUST confirm, for every package hull, that no replacement, search,
  engineering or removal is offered, that its attributes stay readable, and that enabling, disabling
  and prioritising it still work and move the power budget.
- **FR-024c**: Choice-composition tests MUST cover variant choices, each acquisition category, a
  module carrying variants in more than one category, the trailing unique-reward section, every mark,
  entitlement-gated modules, and the recognition of a fitted mercenary purchase across a save and
  reload.
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
- **Replacement choices**: The package's fittable modules for one slot on the active build, each in
  its stock form and once per pre-engineered variant, as narrowed by the Commander's search text.
- **Pre-engineered variant**: A package-recorded ready-engineered form of a module, carrying the
  acquisition that identifies it as a mercenary, community-goal, event-reward or tech-broker article.
- **Fitted module**: A package module plus slot-local engineering, enabled state and priority.
- **Fixed mount**: A core, armour or cargo-hatch mount the package reports as non-removable.
- **Edit history**: The bounded session-only sequence of Commander-authored build changes.

## Almanac Coverage

The Almanac supplies slot enumeration, module records, module names in the Commander's language,
fittability, removability, stock loadouts, edit operations, validation, engineering choices and
computations, power state and cumulative engineering-cost functions. It also supplies authoritative
fixed-mount removability, the pre-engineered variants with the acquisition that classifies each one,
and the entitlement a module requires. No game number or calculation is application-owned.

One recognition is. The package resolves a fitted module back to its community-goal, event-reward or
tech-broker variant, but returns none for any mercenary variant, so recognising a fitted mercenary
purchase falls to the application under
[Cost and Materials](../009-cost-and-materials/spec.md) FR-004a, which owns the rule and the upstream
request that would retire it. This specification consumes that recognition and MUST NOT restate it.

## Success Criteria

- **SC-001**: Every package slot is present and every offered module, searched or not, is fittable
  for that slot and build.
- **SC-002**: Every modified module value and engineering cost equals the package result.
- **SC-003**: No active build contains an empty or unresolved fixed mount when the package supplies a
  stock replacement, and every normalization is reported.
- **SC-004**: Twenty mixed changes can be undone to the initial state and redone to the final state
  with exact fidelity at every step.
- **SC-005**: Direct edits, undo and redo update all affected package results within 100 ms.
- **SC-005a**: Replacement choices update within 100 ms of a keystroke, for the largest candidate
  list any hull and slot produces, at every supported viewport.
- **SC-006**: The complete feature passes the required viewport, browser and accessibility test
  matrix without horizontal page scrolling.
- **SC-007**: Every choice's obtaining marks and its placement inside or outside the unique-reward
  section match the package's record, and a fitted mercenary purchase stays recognized across a save
  and reload.
