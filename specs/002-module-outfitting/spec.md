# Feature Specification: Module Outfitting and Engineering

**Feature Branch**: `002-module-outfitting`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to see the ship's modules, replace them, modify
(engineer them), remove them. In the builder itself, there should be an undo, redo function."

## Scope

This specification covers changing a build: reading its slots, fitting, replacing and removing
modules, engineering them, managing power priorities, and stepping backwards and forwards through
those changes.

Choosing the hull a build starts from belongs to
[feature 001](../001-ship-selection-and-loading/spec.md); the figures a change moves belong to the
statistics family, whose contract is [feature 003](../003-ship-statistics/spec.md).

Everything here acts on an active build and requires one: there are no slots to read and nothing to
change before a hull is chosen. FR-000 states that.

This feature's slot enumeration is the complete route to every slot a hull has, and remains so.
[Feature 010](../010-hull-anatomy/spec.md) adds a second, spatial route that reaches the mounts a
hull's schematics locate; it never replaces this one, and no slot is reachable only through it.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See what is fitted (Priority: P1)

A Commander with an active build looks at the ship and sees every slot it has, what is fitted in
each one, and what that module does.

**Why this priority**: Reading the build is the prerequisite for changing it, and it is valuable on
its own — it is how a Commander inspects a shared or imported loadout.

**Independent Test**: Load a build and confirm every slot the hull has is listed, in a stable order,
with its fitted module and that module's key attributes, and that empty slots are shown as empty
rather than omitted.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views it, **Then** every slot of the hull is
   listed — core internals, optional internals, military slots, hardpoints and utility mounts —
   grouped by kind, including slots that are empty.
2. **Given** a slot with a module fitted, **When** the Commander views it, **Then** the module's
   name, class and rating, mass, power draw and the attributes relevant to its type are shown, along
   with its retail cost.
3. **Given** a module that has been engineered, **When** the Commander views its slot, **Then** the
   slot shows that it is engineered, with the blueprint, grade and any experimental effect, and
   modified attributes are distinguishable from stock ones.
4. **Given** a build imported from elsewhere, **When** a slot's module cannot be resolved against
   the catalogue, **Then** the slot reports the unresolved entry rather than appearing empty.

---

### User Story 2 - Replace and remove modules (Priority: P1)

A Commander swaps the stock power plant for a better one, drops a bigger fuel scoop into an optional
internal, and strips out a module they do not want.

**Why this priority**: This is the core act of building a ship. Together with story 1 it constitutes
a working outfitting tool.

**Independent Test**: For a given slot, confirm the offered modules are exactly those the game
permits in that slot, fit one, confirm the build updates, then remove it and confirm the slot is
empty.

**Acceptance Scenarios**:

1. **Given** a slot, **When** the Commander opens its module list, **Then** they are offered exactly
   the modules that can be fitted to that slot on that hull, and no others.
2. **Given** the module list for a slot, **When** the Commander filters by module type, class,
   rating or name, **Then** the list narrows accordingly and the modules remain comparable on the
   attributes that matter for that type.
3. **Given** the module list for a slot, **When** the Commander orders it by one of those compared
   attributes, **Then** the candidates are ordered by it in either direction, the active ordering is
   apparent, and a module for which the attribute is unavailable is grouped rather than ordered as
   though it were zero.
4. **Given** a module is selected for a slot, **When** it is fitted, **Then** it replaces whatever
   was there, the build's statistics update immediately, and the replaced module's engineering does
   not carry over to the new module.
5. **Given** a slot with a module fitted, **When** the Commander removes it, **Then** the slot
   becomes empty and the build's statistics update immediately.
6. **Given** a slot the game does not allow to be emptied, **When** the Commander attempts to remove
   its module, **Then** the application prevents it and explains why.
7. **Given** a change that makes the build unable to fly — insufficient power, an incompatible
   fitting, a missing mandatory module — **When** the change is made, **Then** the application
   allows it but reports the resulting problem clearly rather than blocking the Commander mid-build.

---

### User Story 3 - Undo and redo while building (Priority: P1)

A Commander strips a module they meant to keep, or engineers the wrong slot, and reverses it
immediately instead of rebuilding by hand.

**Why this priority**: Outfitting is exploratory. Without a reliable way back, a Commander either
works timidly or loses work, and both undermine the point of a planner.

**Independent Test**: Make a sequence of build changes, undo them one at a time back to the starting
state, redo them all forward, and confirm the build matches at every step.

**Acceptance Scenarios**:

1. **Given** a build that has been changed at least once, **When** the Commander undoes, **Then** the
   build returns to its state immediately before that change, and every statistic recomputes
   accordingly.
2. **Given** a change has been undone, **When** the Commander redoes it, **Then** the build returns
   to the state before the undo, exactly.
3. **Given** several changes have been undone, **When** the Commander makes a new change, **Then**
   the redo path is discarded and the new change becomes the most recent step.
4. **Given** no change has been made yet, **When** the Commander looks at undo, **Then** it is shown
   as unavailable rather than appearing to work and doing nothing.
5. **Given** a build change is undone, **When** the Commander examines the build, **Then** fitted
   modules, engineering, enabled state, power priorities, ship name and ident all match the earlier
   state — every field the application models.
6. **Given** undo or redo is available, **When** the Commander is working on a phone, **Then** both
   are reachable by touch without leaving the slot they are editing.

---

### User Story 4 - Engineer a module (Priority: P2)

A Commander applies a Dirty Drive Tuning blueprint at grade 5 to their thrusters and adds Drag
Drives, then decides the trade-off is wrong and rolls it back.

**Why this priority**: Engineering is what separates a real Elite Dangerous loadout planner from a
parts list. It depends on stories 1 and 2 but is a distinct, independently demonstrable slice.

**Independent Test**: On an engineerable module, confirm the offered blueprints and experimental
effects are those the module actually accepts; apply one at a chosen grade and confirm
the module's attributes and the build's statistics change accordingly; swap it for a different
blueprint and grade and confirm the previous one is gone; remove the experimental effect alone and
confirm the blueprint survives; then clear the engineering and confirm exact restoration of the
stock values.

**Acceptance Scenarios**:

1. **Given** a fitted module, **When** the Commander opens its engineering, **Then** they are offered
   exactly the blueprints that module accepts and, separately, exactly the experimental effects it
   accepts.
2. **Given** a blueprint is chosen, **When** the Commander sets a permitted grade, **Then** that
   grade is applied at 100% quality and the module's modified attributes are shown against their
   stock values, with improvements and penalties distinguishable.
3. **Given** an already-engineered module, **When** the Commander chooses a different blueprint, or a
   different grade for the one it has, **Then** the new choice replaces the previous one
   with no trace of the old blueprint left on the module, and the module's attributes and the
   build's statistics update immediately.
4. **Given** an engineered module, **When** the Commander adds, changes or removes an experimental
   effect, **Then** the module's attributes and the build's statistics update immediately, and
   removing the effect leaves the blueprint and its grade untouched.
5. **Given** an engineered module, **When** the Commander clears its engineering, **Then** the module
   returns exactly to its stock attributes, and no other module's engineering changes.
6. **Given** a module with no engineering available, **When** the Commander views it, **Then** the
   application says so plainly instead of offering an empty picker.
7. **Given** a pre-engineered module, **When** it is fitted, **Then** its pre-applied modifications
   are shown, and any restriction on engineering it further is stated.
8. **Given** a module whose engineering arrived from an import at partial quality, **When** it is
   loaded, **Then** the application treats its selected grade as complete at 100% quality and does
   not offer or display the partial roll as application state.

---

### User Story 5 - Understand the edit history (Priority: P2)

A Commander who has made a dozen changes wants to see what undo is about to reverse before pressing
it, and to understand why the history emptied when they switched hulls.

**Why this priority**: An unlabelled undo is a guess. Naming the step being reversed, and being
honest about when history is discarded, is what makes the feature trustworthy rather than merely
present.

**Independent Test**: Make a sequence of distinct changes, confirm each undo step is described in
terms of what it reverses, then perform an action that discards history and confirm the Commander is
told before it happens.

**Acceptance Scenarios**:

1. **Given** changes have been made, **When** the Commander looks at undo or redo, **Then** each
   names the change it would reverse or reapply, in the Commander's own terms — the module and the
   slot, not an internal identifier.
2. **Given** a Commander holds down or repeatedly triggers undo, **When** steps are reversed,
   **Then** each change is reversed as its own step; a single burst of activity does not collapse
   several distinct decisions into one.
3. **Given** an action would discard the edit history — replacing the hull, opening a saved build, or
   importing a build — **When** the Commander triggers it, **Then** they are told the history will be
   lost as part of the confirmation feature 001 already requires.
4. **Given** the Commander has used undo, **When** they press the browser's Back button, **Then** it
   behaves as navigation and does not silently reverse a build change; the two are never confused.
5. **Given** the history has reached its limit, **When** a further change is made, **Then** the
   oldest step is dropped and the Commander can tell that history does not extend indefinitely.

---

### User Story 6 - Manage power priorities (Priority: P3)

A Commander whose power plant cannot run everything at once disables the cargo hatch and assigns
priority groups so the essentials stay online.

**Why this priority**: A refinement of a complete build rather than a prerequisite for one;
meaningful only once modules are fitted and the power budget is visible.

**Independent Test**: Toggle a module off and change another's priority group, and confirm both are
reflected in the build's power figures and survive save and reload.

**Acceptance Scenarios**:

1. **Given** a fitted module that can be powered down, **When** the Commander disables it, **Then**
   it stops drawing power in the build's power figures and its contribution to the build's
   statistics is removed.
2. **Given** a fitted module, **When** the Commander assigns it a power priority group, **Then** the
   build reports which modules stay online in each priority group given the available power.
3. **Given** modules have been disabled or re-prioritised, **When** the build is saved, shared or
   exported, **Then** those settings are preserved.

---

### Edge Cases

- Fitting a larger module into a slot that also has a size-restricted variant (for example a
  military slot, or a class-restricted optional internal): only the genuinely fittable options are
  offered.
- A module that may be fitted only once per ship (such as certain internals) is already fitted
  elsewhere: the application prevents or clearly flags the duplicate according to the game's rule.
- Engineering that becomes invalid because the underlying module was replaced: engineering is
  dropped with the module, never silently transplanted.
- A blueprint whose journal spelling is ambiguous across module families: the blueprint is resolved
  for the specific module rather than by name alone.
- A grade at the boundary of the permitted range: accepted at the boundary, rejected beyond it,
  with the valid range stated.
- An imported build carrying partial engineering quality: its blueprint and grade are retained, the
  grade is treated as complete at 100% quality, and the source roll's partial quality is not retained.
- An experimental effect already applied when the blueprint beneath it is changed: the effect is
  kept where the module still accepts it alongside the new blueprint and dropped where it does not,
  and a dropped effect is reported rather than removed silently.
- Rapidly repeated changes (holding a stepper, switching modules quickly): the displayed statistics
  converge on the correct values and never show a figure from a superseded state, and the burst
  resolves to a single history step rather than one per intermediate value.
- Undoing past the point where a build was saved: permitted — the saved build is untouched, and the
  active build simply differs from it until saved again.
- Undo after a build link was produced: the link already shared continues to describe the build it
  described when it was shared, and is unaffected by later undo.
- Undo of a change that a later change depended on — removing a module that was then engineered: the
  steps reverse in order and each intermediate state is one the build could legitimately have been
  in.
- Rapid alternation between undo and redo: the build converges on the correct state and never
  displays a mixture of two states.
- Undo while a module picker or engineering panel is open on the slot being reverted: the open
  surface reflects the reverted state rather than acting on a module that is no longer fitted.
- Changing a viewing condition — feature 003's cargo and fuel assumptions, pip allocation and
  hardpoint state: not a build change, so it does not enter the history and undo does not reverse
  it.
- A session left open for a long time with many changes: memory use stays bounded, which is what the
  history limit exists to guarantee.
- A hull with dozens of slots viewed on a phone: every slot stays reachable and the Commander does
  not lose their place in the list after making a change.
- A module picker listing hundreds of candidates on a small screen: it stays searchable and
  scrollable, and comparison attributes remain readable.
- The catalogue reports something the game does not do (a module offered that cannot really be
  fitted, an engineering option that does not exist): the discrepancy is raised against the library,
  not corrected in this application.

## Requirements _(mandatory)_

### Functional Requirements

#### A build to change

- **FR-000**: Outfitting MUST require an active build. Where no build is active the application MUST
  NOT present a slot list, an offer list, an engineering surface, a power-priority control or an edit
  history, and MUST NOT create a build in order to offer one. A Commander arrives at an active build
  through [feature 001](../001-ship-selection-and-loading/spec.md) — choosing a hull from the
  catalogue (its FR-011), reopening a saved or working build (its FR-023, FR-023f), or opening a
  build link (its FR-027, FR-027a) — or by importing one under
  [feature 004](../004-slef-export/spec.md)'s FR-006. This feature offers no route of its own, and
  fitting a module MUST NOT be a way to choose a hull.

#### Slots and modules

- **FR-001**: The application MUST enumerate a build's slots using the game's own slot keys as
  reported by `@elite-dangerous-almanac/core`, never by positional index, and MUST show empty slots.
- **FR-002**: The application MUST display, for each fitted module, its identity, class, rating,
  mass, power draw, retail cost and the attributes relevant to its module type.
- **FR-003**: For any slot, the application MUST offer exactly the set of modules the package
  reports as fittable to that slot, and MUST NOT offer others.
- **FR-003a**: The Commander MUST be able to order the offer list for a slot by any attribute it is
  compared on, in either direction, with the active ordering visible. A candidate whose attribute the
  catalogue does not carry MUST be grouped rather than ordered as though the attribute were zero,
  consistent with feature 001's FR-009.
- **FR-004**: The Commander MUST be able to fit a module into a slot, replacing any existing module.
- **FR-005**: The Commander MUST be able to remove a module from a slot where the game permits it,
  and MUST be told why when it does not.
- **FR-006**: Replacing a module MUST discard that slot's engineering; it MUST NOT be carried over
  to the new module.
- **FR-007**: Modules that cannot be resolved against the catalogue MUST be reported in place, not
  silently treated as an empty slot.

#### Engineering

- **FR-008**: For any fitted module, the application MUST offer exactly the blueprints and
  experimental effects the package reports as available for that module.
- **FR-009**: For each fitted module independently, the Commander MUST be able to select a blueprint
  that module accepts, set its grade at an assumed 100% quality, select an
  experimental effect that module accepts, change any of those afterwards, remove the experimental
  effect on its own, and clear the module's engineering entirely.
- **FR-009a**: Changing a module's blueprint or grade MUST replace what it had rather than
  accumulating alongside it, and removing an experimental effect MUST leave the blueprint and grade
  intact. Engineering applied to one module MUST NOT affect any other module.
- **FR-010**: Clearing engineering MUST restore the module's stock attributes exactly.
- **FR-011**: Engineered attributes MUST be displayed alongside their stock values, with the
  direction of each change apparent.
- **FR-012**: Pre-engineered modules MUST show their pre-applied modifications and any restriction
  on further engineering.
- **FR-012a**: Engineering that arrives with partial quality MUST be normalised to 100% quality while
  retaining its blueprint, grade and experimental effect. Partial quality MUST NOT be retained,
  offered as a control or presented as application state.

#### Power priorities

- **FR-013**: The Commander MUST be able to enable or disable a fitted module and set its power
  priority group, and those settings MUST participate in the build's power figures.

#### Undo, redo and edit history

- **FR-014**: The Commander MUST be able to undo the most recent build change and redo a change that
  has been undone, for the duration of the session.
- **FR-015**: Undo and redo MUST restore every field the application models — fitted modules,
  engineering, enabled state, power priority, ship name and ident — exactly as they were.
- **FR-016**: A build change made after an undo MUST discard the redo path.
- **FR-017**: Undo and redo MUST be shown as unavailable when there is nothing to undo or redo,
  rather than being offered and doing nothing.
- **FR-018**: Every change that alters the build MUST be undoable: fitting, replacing and removing
  modules, applying, changing and clearing engineering, enabling and disabling modules, changing
  power priority, and setting the ship's name and ident.
- **FR-019**: Changes to viewing conditions — feature 003's cargo and fuel assumptions, pip
  allocation and hardpoint state — MUST NOT enter the history, because they do not change the build.
- **FR-020**: Each undo and redo step MUST correspond to one Commander decision. A continuous
  adjustment, such as holding a grade control, MUST resolve to a single step rather than
  one step per intermediate value.
- **FR-021**: Statistics, validity and every other derived view MUST recompute after undo and redo
  exactly as they do after a direct change.
- **FR-022**: Undo and redo MUST name the change they would reverse or reapply, in the Commander's
  terms — the module and the slot — and never by an internal identifier.
- **FR-023**: The edit history MUST be bounded, and reaching the bound MUST drop the oldest step
  rather than refusing further changes.
- **FR-024**: The history MUST be discarded when the active build is replaced — a new hull, a saved
  build opened, or a build imported — and the Commander MUST be told this as part of the
  confirmation feature 001 already requires for replacing a build.
- **FR-025**: The history MUST be session-scoped. It MUST NOT be persisted with a saved build,
  carried in a build link, or included in a SLEF export.
- **FR-026**: Undo and redo MUST NOT add or consume browser history entries, and the browser's Back
  button MUST NOT reverse a build change. The two MUST remain distinguishable to the Commander,
  consistent with feature 001's FR-033.
- **FR-027**: Undoing past the point at which the build was last saved MUST be permitted and MUST
  leave the saved build untouched.

#### Feedback and provenance

- **FR-028**: Every change MUST update the build's statistics — every area of the statistics family,
  under feature 003's contract — without requiring a manual refresh.
- **FR-029**: The application MUST surface the package's validity and completeness reporting for the
  build after every change — including builds that cannot fly — rather than blocking edits that
  produce an invalid build.
- **FR-030**: All module, blueprint and effect data MUST come from `@elite-dangerous-almanac/core`;
  the application MUST NOT maintain its own copy of that data.
- **FR-031**: Where the package's data or behaviour is wrong or missing, the problem MUST be raised
  against `@elite-dangerous-almanac/core` and fixed there. This application MUST NOT correct, clamp
  or special-case a library result locally.

### Device Requirements

- **FR-032**: Viewing slots, fitting, removing and engineering modules, and undoing and redoing MUST
  be fully usable on desktop, tablet and mobile, in both portrait and landscape.
- **FR-033**: The slot list, module picker and engineering controls MUST be operable by touch, with
  targets large enough to hit reliably on a phone. Nothing essential — including module attributes
  and engineering detail — may be reachable only by hover.
- **FR-034**: On narrow viewports the slot list and module picker MUST remain navigable without
  horizontal page scrolling; wide content scrolls within its own container.
- **FR-035**: Grade controls MUST be adjustable by touch as precisely as by pointer or keyboard.
- **FR-036**: Undo and redo MUST be reachable by touch from wherever the Commander is editing,
  without navigating away from the slot in hand, and MUST also be operable by keyboard.
- **FR-036a**: Searching the offer list for the slot in hand MUST be reachable from the keyboard
  without pointing, by a shortcut that is discoverable rather than known only to those who read the
  documentation. The shortcut MUST NOT override a browser or assistive-technology binding, and every
  action it reaches MUST remain available without it.

### Testing Requirements

- **FR-037**: Fittability, blueprint and effect selection, grade setting, replacing one
  blueprint with another, removing an experimental effect on its own, clearing engineering, module
  replacement semantics, imported partial-quality normalisation and power priority handling MUST be unit-tested
  against the domain layer without rendering components.
- **FR-037a**: Ordering the offer list MUST be unit-tested for both directions, for ties and for
  candidates whose compared attribute is unavailable, against the domain layer without rendering
  components.
- **FR-038**: Undo and redo MUST be unit-tested for sequence fidelity across every undoable change
  type, redo-path discard, the history bound, history discard on build replacement, and exclusion of
  viewing conditions.
- **FR-039**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports.

### Key Entities

- **Slot**: A fitting position on the hull, identified by the game's slot key, with a kind (core,
  optional, military, hardpoint, utility) and a size that determines what fits.
- **Module**: An outfitting item from the Almanac catalogue, identified by its `symbol`, with class,
  rating, mass, power draw, cost and type-specific attributes.
- **Fitted module**: A module occupying a slot in the active build, together with its engineering,
  enabled state and power priority.
- **Blueprint**: An engineering recipe, identified by its `fdname`, applicable to a module at a grade
  that this application always treats as complete (100% quality).
- **Experimental effect**: A secondary modification, identified by its `fdname`, applicable alongside
  a blueprint.
- **Edit step**: One Commander decision that changed the build, described in the Commander's terms
  and reversible as a unit.
- **Edit history**: The bounded, session-scoped sequence of edit steps behind and ahead of the
  current build state.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For every ship in the catalogue, every slot is enumerated and every offered module is
  genuinely fittable — zero missing slots, zero impossible offers.
- **SC-002**: A Commander can replace a module in no more than three interactions from viewing the
  build.
- **SC-003**: Applying, changing or clearing engineering produces updated module attributes and
  build statistics within 100 ms of the change.
- **SC-004**: Applying engineering and then clearing it returns every module attribute to its stock
  value exactly, for every engineerable module in the catalogue.
- **SC-005**: A Commander can build a well-known reference loadout end to end and the resulting
  build matches the reference in every fitted module and engineering entry.
- **SC-006**: A sequence of at least twenty consecutive build changes can be undone to the starting
  state and redone to the end state, with the build matching at every intermediate step — 100%
  fidelity, verified across every undoable change type.
- **SC-007**: Undo and redo take effect within 100 ms, including recomputation of every dependent
  statistic.
- **SC-008**: A Commander can tell what undo will reverse before triggering it, for every step in
  the history.
- **SC-009**: No build change is ever lost to a browser Back press, and no undo ever navigates away
  from the build — zero confusions between the two across the end-to-end suite.
- **SC-010**: Fitting, removing and engineering a module, and undoing and redoing a change, all
  succeed on desktop, tablet and mobile viewports — the same end-to-end suite passes on all three,
  with no horizontal page scrolling at any of them.
- **SC-011**: Outfitting a large ship on a phone requires no more interactions per change than on
  desktop.
- **SC-012**: A Commander can identify the best candidate for a slot on any compared attribute
  without reading the whole offer list, for every slot on every hull in the catalogue.
- **SC-013**: Every partial engineering quality in the import corpus becomes 100% on import and
  remains 100% through editing and export; no partial value remains in application state.

## Assumptions

- Fittability, engineering availability, grade ranges, and pre-engineered behaviour are
  whatever `@elite-dangerous-almanac/core` reports; this application does not add rules of its own.
- The per-ship module limits behind FR-003 are the package's as of `0.1.0-beta.4`: it excludes a
  module already at its allowance from the offer list for a slot, refuses a fitting that would
  exceed one, and reports the excess in its validation. Whether a slot may be emptied is likewise a
  property the package reports, with a machine-readable reason when it may not, so FR-005 is
  answered without provoking an error to find out.
- Engineering is modelled as an outcome (blueprint, completed grade, effect), not as a rolling
  simulation of individual engineer visits.
- Material and credit costs of engineering are surfaced where the package provides them; the
  consolidated material list for a whole build belongs to
  [feature 009](../009-cost-and-materials/spec.md).
- Engineering quality is not application state. Every selected or imported grade is treated as 100%
  quality; partial source rolls are deliberately discarded under FR-012a.
- Ship-launched fighters, crew, cosmetic liveries and ship kits are out of scope for this feature.
- The edit history covers the active build only. It is session-scoped, so it is not persisted,
  shared or exported, and a Commander returning to a saved build starts with an empty history.
- A bounded history is an implementation concern with a Commander-visible consequence: this spec
  requires that a bound exists, that it drops the oldest step, and that reaching it is discernible,
  without fixing the number.
- Undo and redo operate on build state. Navigation, filter and sort state, and viewing conditions
  are deliberately excluded, so that undo means one thing.
- Responsiveness, touch support, accessibility and translatability are behavioural requirements in
  scope now; only visual styling is deferred.
- Which slots are prominent, how the module picker and engineering panel are laid out, and how undo
  and redo are presented are decided at plan time against the design system, per constitution
  principle VII.
