# Feature Specification: Module Outfitting and Engineering

## Scope

Commanders can inspect every slot; fit, replace, remove and engineer modules; manage module power;
and undo or redo build edits. Build creation belongs to [001](../001-ship-selection-and-loading/spec.md).

## Clarifications

### Session 2026-08-18

- Q: What happens when an incoming build contains an unresolved module with partial-quality
  engineering? → A: Reject the incoming build atomically and keep the current build intact; fully
  rolled or unengineered unresolved modules remain supported.

## User Scenarios

### Story 1 — Fit modules (P1)

1. Every Almanac slot is shown by game slot key, including empty and unresolved slots.
2. A slot offers exactly the modules the Almanac reports as fittable for the current build.
3. Fitting, replacing or removing a module updates the build and all Almanac results.
4. A non-removable slot shows the package reason and offers no removal action.

### Story 2 — Find a replacement (P1)

1. Choices are grouped by module name, then class descending and package rating order ascending;
   stock precedes variants and unique rewards form a final section.
2. Every whitespace-separated search term must match name, class, rating or weapon mount type as a
   case- and accent-insensitive substring.
3. No matches shows an empty result with a clear-search action.
4. Acquisition and entitlement restrictions remain visible before and after fitting.

### Story 3 — Engineer and power a module (P1)

1. Only Almanac-supported blueprints, grades and experimental effects are offered.
2. A Commander can apply or replace a blueprint and grade, add, replace or remove only an
   experimental effect, or clear all ordinary engineering. Removing only the effect preserves the
   blueprint and grade.
3. Grades are always modelled at 100% quality. Resolved imported partial quality is normalised and
   reported; an incoming build whose partial engineering cannot be resolved and completed losslessly
   is refused before activation.
4. Enabled state and priority update every affected package calculation while mass and cost remain
   because the module is still fitted.

### Story 4 — Undo and redo (P2)

1. Every Commander-authored build edit can be undone and redone during the session.
2. A new edit after undo discards the redo path.
3. One Commander decision creates one history step.

## Requirements

- **FR-001**: Outfitting MUST require an active build and MUST NOT create one.
- **FR-002**: Slots, module facts, post-engineering attributes, compatibility, removability and edit
  results MUST come from `ShipLoadout`. Slot identity MUST be the game slot key, never position.
- **FR-003**: Missing facts and unresolved modules MUST remain unavailable and visible in their
  original slots; the application MUST NOT infer or replace them outside fixed-mount normalisation.
- **FR-004**: Replacement choices MUST contain the stock form and each package pre-engineered
  variant of every currently fittable module, with no application-added candidates.
- **FR-005**: Search and ordering MAY arrange package records but MUST NOT alter their values or admit
  an unfittable module. Search MUST use the package name for the active locale plus class, rating and
  weapon mount type. The no-match and clear-search states MUST be explicit.
- **FR-006**: Choice and fitted-module labels MUST reflect package acquisition and entitlement data.
  Community-goal and event rewards MUST be identified as unique rewards; Mercenary and tech-broker
  variants MUST be identified as not ordinarily available. A choice MAY carry multiple labels.
- **FR-007**: A fitted variant MUST be recognized only by `FittedModule.preEngineeredVariant`.
  Variant purchase grade and current ordinary engineering grade MUST remain distinct.
- **FR-008**: Fitting, replacing and removing MUST use package edit operations and surface their
  structured refusal results.
- **FR-009**: The cargo hatch MUST expose its facts and editable power state but MUST offer no
  replacement, search, engineering or removal because the package offers none.
- **FR-010**: On load, an empty or unresolved fixed mount MUST be filled with that hull's package
  default module before any calculation. The Commander MUST be told the slot and replaced identity.
  If the package has no default, the slot remains empty and the build remains incomplete.
- **FR-011**: Fixed-mount normalisation MUST change the build but MUST NOT enter edit history.
- **FR-012**: Blueprint and effect identities MUST use package `fdname` values. Each module MUST
  support applying and replacing a blueprint and grade, adding, replacing and removing only an
  experimental effect, and clearing all ordinary engineering exactly as the package permits.
  Removing only the effect MUST preserve the blueprint and grade. Availability, modified attributes
  and restrictions on further engineering MUST come from the package.
- **FR-013**: Every selected ordinary grade MUST represent 100% quality. Partial imported quality
  MUST be normalised to 100% through the package and reported. If the package cannot resolve the
  fitted module or engineering identity, or otherwise cannot complete the grade losslessly, the
  entire incoming build MUST be refused before activation, the current build MUST remain unchanged,
  and the refusal MUST identify the affected slot and unresolved identity. The application MUST NOT
  accept the candidate by changing only its quality scalar, stripping engineering, retaining the
  partial roll or fabricating modifiers.
- **FR-014**: Engineering material costs MUST use package cost results. Fixed pre-engineering MUST
  add no craft cost unless the package reports separately selected ordinary engineering.
- **FR-015**: Enabled state and zero-based priority MUST be edited through `ShipLoadout`; presentation
  MUST use the Commander's one-based priority labels.
- **FR-016**: Undo and redo MUST restore all modelled fields exactly, recompute package results and
  cover module, engineering, power, ship name and ident edits.
- **FR-017**: History MUST retain at least the 100 most recent Commander decisions, remain
  session-only and be discarded when the active build is replaced. It MUST NOT enter storage, links,
  SLEF or browser navigation.
- **FR-018**: Viewing conditions and automatic normalisation MUST NOT enter edit history.

## Edge Cases

- A build remains editable while invalid or incomplete.
- An unresolved module remains preservable and visible when it is unengineered or already reports
  completed quality; only unresolved partial-quality engineering causes atomic ingress refusal.
- Replacing a module does not inherit the previous module's engineering.
- A module appearing through multiple acquisition routes remains one package variant per route.
- Clearing Mercenary engineering can remove the package's ability to identify the purchased variant;
  the application follows the resulting package state.

## Almanac Coverage

The package supplies slots, fittability, module limits, removability, defaults, edit operations,
engineering choices and calculations, costs, variants, acquisition and entitlement data. Package
module resolution, construction outcomes and the structured engineering-normalisation result decide
whether a partial grade is completed or the incoming candidate is refused. No game rule, value or
variant-recognition heuristic is application-owned.

## Success Criteria

- **SC-001**: Every slot, candidate, edit result and modified value matches the Almanac.
- **SC-002**: Replacement search updates within 100 ms for the largest package candidate list.
- **SC-003**: Undo and redo reproduce every intermediate modelled build exactly.
- **SC-004**: No application-owned fitting, engineering or variant-recognition rule exists.
- **SC-005**: Every incoming build with losslessly normalisable partial engineering reaches quality
  100%; every unsupported partial-quality candidate is rejected without changing the active build.
