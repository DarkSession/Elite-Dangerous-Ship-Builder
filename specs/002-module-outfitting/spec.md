# Feature Specification: Module Outfitting and Engineering

## Scope

Commanders can inspect every slot; fit, replace, remove and engineer modules; manage module power;
name the loaded ship; and undo or redo build edits. Build creation belongs to
[001](../001-ship-selection-and-loading/spec.md); once a build is active, every edit to it — including
its ship name and ident — belongs here.

## Clarifications

### Session 2026-08-20

- Q: Are unknown module identities supported? → A: No. They receive no application compatibility
  behavior. The package always returns fixed mounts populated with their hull defaults.
- Q: Must edits and history preserve what a Commander originally paid for the hull or modules? →
  A: No. Historical purchase values are not build state. Cost presentation always uses the current
  catalogue values supplied by the Almanac.

### Session 2026-08-21

- Q: Is a ship's name the same value as the name a Commander gives the saved build record? → A: Yes,
  one value. The application MUST NOT hold a second copy of it. A record's local identity stays
  independent of that name (001 FR-008).
- Q: Where a capability is offered under some viewing conditions and not others, is it mirrored or
  withdrawn? → A: Per case. Ship name and ident are editable under every viewing condition. A
  separate clear-all action is withdrawn as duplicative: clearing all ordinary engineering, and
  removing only the experimental effect, are already reachable by choosing the explicit "none" entry
  the package offers among blueprint and effect choices. Clearing capability is unchanged.
- Q: Must the game slot key be visible text wherever a slot is presented? → A: No. Presentation
  identifies a slot by its kind, size and, for hardpoints, its node number. The exact game slot key
  remains the slot's identity, the value exchanged with hull anatomy, and available to assistive
  technology. FR-002 fixes slot identity, not slot display.
- Q: May a surface describe an engineering material requirement as a "roll"? → A: No. A material
  requirement is identified by its grade. A selected grade always represents a completed 100% grade,
  so no surface calls it a roll.
- Q: May a keyboard shortcut for reaching replacement search ship? → A: Yes, as an unrequired
  affordance. It MUST NOT become a requirement or an acceptance gate, because the constitution puts
  keyboard operation out of scope, and MUST NOT be the only route to search. Its hint is
  application-owned text: localized, and named for the Commander's platform.

## User Scenarios

### Story 1 — Fit modules (P1)

1. Every Almanac slot is shown, including empty removable slots; every fixed mount is populated when
   the workspace becomes active.
2. A slot offers exactly the modules the Almanac reports as fittable for the current build.
3. Fitting, replacing or removing a module updates the build and all Almanac results.
4. A non-removable slot shows the package reason and offers no removal action.

### Story 2 — Find a replacement (P1)

1. Choices are grouped by module name, then class descending and package rating order ascending;
   stock precedes variants and unique rewards form a final section.
2. Every whitespace-separated search term must match at least one of name, class, rating or weapon
   mount type as a case- and accent-insensitive substring; a choice matches only when every term does.
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

1. Every Commander-authored build edit still held in the retained history can be undone and redone
   during the session.
2. A new edit after undo discards the redo path.
3. One Commander decision creates one history step.
4. Naming the ship or setting its ident is one such decision and is undone and redone like any other
   edit.

## Requirements

- **FR-001**: Outfitting MUST require an active build and MUST NOT create one.
- **FR-002**: Slots, module facts, post-engineering attributes, compatibility, removability and edit
  results MUST come from `ShipLoadout`. Slot identity MUST be the game slot key, never position.
- **FR-003**: Missing facts for package-resolved modules MUST remain unavailable rather than becoming
  zero or an estimate. Only package-resolved module identities are supported.
- **FR-004**: Replacement choices MUST contain the stock form and each package pre-engineered
  variant of every currently fittable module, with no application-added candidates.
- **FR-005**: Search and ordering MAY arrange package records but MUST NOT alter their values or admit
  an unfittable module. Search MUST cover exactly four fields — the displayed package name for the
  active locale, class, rating and weapon mount type — matching a choice only when every search term
  matches at least one of them. The no-match and clear-search states MUST be explicit.
- **FR-006**: Choice and fitted-module labels MUST reflect package acquisition and entitlement data.
  Community-goal and event rewards MUST be identified as unique rewards; Mercenary and tech-broker
  variants MUST be identified as not ordinarily available. A choice MAY carry multiple labels.
- **FR-007**: A fitted variant MUST be recognized only by `FittedModule.preEngineeredVariant`.
  Variant purchase grade and current ordinary engineering grade MUST remain distinct.
- **FR-008**: Fitting, replacing and removing MUST use package edit operations and surface their
  structured refusal results.
- **FR-009**: The cargo hatch MUST expose its facts and editable power state but MUST offer no
  replacement, search, engineering or removal because the package offers none.
- **FR-010**: On load, package construction MUST populate every absent or unusable fixed mount with
  that hull's package default before any calculation. The returned fixed module is ordinary build
  state; the application MUST NOT run a repair pass, retain source-empty provenance or model an
  empty/default-unavailable outcome.
- **FR-011**: Package-defaulted fixed mounts MUST NOT create an application edit-history entry.
- **FR-012**: Blueprint and effect identities MUST use package `fdname` values. Each module MUST
  support applying and replacing a blueprint and grade, adding, replacing and removing only an
  experimental effect, and clearing all ordinary engineering exactly as the package permits.
  Removing only the effect MUST preserve the blueprint and grade. Availability, modified attributes
  and restrictions on further engineering MUST come from the package.
- **FR-013**: Every selected ordinary grade MUST represent 100% quality. Partial imported quality on
  each supported resolved module MUST be normalised to 100% through the package and reported. If the package cannot resolve the
  engineering identity or otherwise cannot complete the grade losslessly, the entire incoming build
  MUST be refused before activation, the current build MUST remain unchanged, and the refusal MUST
  identify the affected slot and engineering identity. The application MUST NOT change only its
  quality scalar, strip engineering, retain the partial roll or fabricate modifiers.
- **FR-014**: Engineering material costs MUST use package cost results. Fixed pre-engineering MUST
  add no craft cost unless the package reports separately selected ordinary engineering.
- **FR-015**: Enabled state and zero-based priority MUST be edited through `ShipLoadout`; presentation
  MUST use the Commander's one-based priority labels.
- **FR-016**: Undo and redo MUST restore all modelled fields exactly, recompute package results and
  cover module, engineering, power, ship name and ident edits. Captured purchase values MUST NOT be
  retained as modelled fields or history state.
- **FR-017**: History MUST retain exactly the 100 most recent Commander decisions, remain
  session-only and be discarded when the active build is replaced. It MUST NOT enter storage, links,
  SLEF or browser navigation.
- **FR-018**: Viewing conditions and automatic normalisation MUST NOT enter edit history.
- **FR-019**: While a build is active, a Commander MUST be able to set and clear its ship name and
  ident. Both are optional free text, both are modelled build state carried by feature 001's
  snapshot, and neither MUST be inferred, defaulted or derived from the hull. Applying either MUST
  go through the same package reconstruction and atomic replacement as any other edit.
  A ship's name and the name a Commander gives the saved build record are one value; the application
  MUST NOT hold a second copy of it, and a record's local identity remains independent of it
  (001 FR-008). An unnamed build MUST present an empty name rather than a hull-derived placeholder
  shown as a value.

## Edge Cases

- A build remains editable while invalid or incomplete.
- Unknown module identities are outside the supported import contract and have no compatibility UI
  (FR-003).
- Replacing a module does not inherit the previous module's engineering.
- Loading, editing, undoing or redoing a build never restores a historical purchase price; current
  cost is recalculated from the Almanac catalogue (FR-016).
- A module appearing through multiple acquisition routes remains one package variant per route.
- Clearing Mercenary engineering can remove the package's ability to identify the purchased variant;
  the application follows the resulting package state.

## Almanac Coverage

The package supplies slots, fittability, module limits, removability, fixed defaults, edit operations,
engineering choices and calculations, costs, variants, acquisition and entitlement data. Package
identity ingress refuses unknown hulls and construction returns every fixed mount populated. The
structured engineering-normalisation result decides whether a resolved partial grade is completed or
the incoming candidate is refused.
No game rule, value or variant-recognition heuristic is application-owned.

## Success Criteria

- **SC-001**: Every slot, candidate, edit result and modified value matches the Almanac.
- **SC-002**: Replacement search updates within 100 ms for the largest package candidate list,
  measured in Chromium at the mobile viewport under 4× CPU slowdown. The measurement is
  Chromium-only because CPU throttling has no equivalent in the other supported engine; the search
  behaviour it measures is verified in both.
- **SC-003**: Undo and redo reproduce every retained intermediate modelled build exactly.
- **SC-004**: No application-owned fitting, engineering or variant-recognition rule exists.
- **SC-005**: Every incoming build with losslessly normalisable partial engineering reaches quality
  100%; every unsupported partial-quality candidate is rejected without changing the active build.
