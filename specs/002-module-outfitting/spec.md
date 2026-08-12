# Feature Specification: Module Outfitting and Engineering

**Feature Branch**: `002-module-outfitting`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Users should be able to see the ship's modules, replace them, modify (engineer them), remove them."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See what is fitted (Priority: P1)

A Commander with an active build looks at the ship and sees every slot it has,
what is fitted in each one, and what that module does.

**Why this priority**: Reading the build is the prerequisite for changing it,
and it is valuable on its own — it is how a Commander inspects a shared or
imported loadout.

**Independent Test**: Load a build and confirm every slot the hull has is
listed, in a stable order, with its fitted module and that module's key
attributes, and that empty slots are shown as empty rather than omitted.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views it, **Then** every
   slot of the hull is listed — core internals, optional internals, military
   slots, hardpoints and utility mounts — grouped by kind, including slots that
   are empty.
2. **Given** a slot with a module fitted, **When** the Commander views it,
   **Then** the module's name, class and rating, mass, power draw and the
   attributes relevant to its type are shown, along with its retail cost.
3. **Given** a module that has been engineered, **When** the Commander views its
   slot, **Then** the slot shows that it is engineered, with the blueprint,
   grade and any experimental effect, and modified attributes are distinguishable
   from stock ones.
4. **Given** a build imported from elsewhere, **When** a slot's module cannot be
   resolved against the catalogue, **Then** the slot reports the unresolved
   entry rather than appearing empty.

---

### User Story 2 - Replace and remove modules (Priority: P1)

A Commander swaps the stock power plant for a better one, drops a bigger fuel
scoop into an optional internal, and strips out a module they do not want.

**Why this priority**: This is the core act of building a ship. Together with
story 1 it constitutes a working outfitting tool.

**Independent Test**: For a given slot, confirm the offered modules are exactly
those the game permits in that slot, fit one, confirm the build updates, then
remove it and confirm the slot is empty.

**Acceptance Scenarios**:

1. **Given** a slot, **When** the Commander opens its module list, **Then** they
   are offered exactly the modules that can be fitted to that slot on that hull,
   and no others.
2. **Given** the module list for a slot, **When** the Commander filters by
   module type, class, rating or name, **Then** the list narrows accordingly and
   the modules remain comparable on the attributes that matter for that type.
3. **Given** a module is selected for a slot, **When** it is fitted, **Then** it
   replaces whatever was there, the build's statistics update immediately, and
   the replaced module's engineering does not carry over to the new module.
4. **Given** a slot with a module fitted, **When** the Commander removes it,
   **Then** the slot becomes empty and the build's statistics update
   immediately.
5. **Given** a slot the game does not allow to be emptied, **When** the
   Commander attempts to remove its module, **Then** the application prevents it
   and explains why.
6. **Given** a change that makes the build unable to fly — insufficient power,
   an incompatible fitting, a missing mandatory module — **When** the change is
   made, **Then** the application allows it but reports the resulting problem
   clearly rather than blocking the Commander mid-build.

---

### User Story 3 - Engineer a module (Priority: P2)

A Commander applies a Dirty Drive Tuning blueprint at grade 5 to their thrusters
and adds Drag Drives, then decides the trade-off is wrong and rolls it back.

**Why this priority**: Engineering is what separates a real Elite Dangerous
loadout planner from a parts list. It depends on stories 1 and 2 but is a
distinct, independently demonstrable slice.

**Independent Test**: On an engineerable module, confirm the offered blueprints
and experimental effects are those the module actually accepts, apply one at a
chosen grade and quality, confirm the module's attributes and the build's
statistics change accordingly, then clear it and confirm exact restoration of
the stock values.

**Acceptance Scenarios**:

1. **Given** a fitted module, **When** the Commander opens its engineering,
   **Then** they are offered exactly the blueprints that module accepts and,
   separately, exactly the experimental effects it accepts.
2. **Given** a blueprint is chosen, **When** the Commander sets a grade and
   quality within the permitted range, **Then** the module's modified attributes
   are shown against their stock values, with improvements and penalties
   distinguishable.
3. **Given** an engineered module, **When** the Commander adds, changes or
   removes an experimental effect, **Then** the module's attributes and the
   build's statistics update immediately.
4. **Given** an engineered module, **When** the Commander clears its
   engineering, **Then** the module returns exactly to its stock attributes.
5. **Given** a module with no engineering available, **When** the Commander
   views it, **Then** the application says so plainly instead of offering an
   empty picker.
6. **Given** a pre-engineered module, **When** it is fitted, **Then** its
   pre-applied modifications are shown, and any restriction on engineering it
   further is stated.

---

### User Story 4 - Manage power priorities (Priority: P3)

A Commander whose power plant cannot run everything at once disables the cargo
hatch and assigns priority groups so the essentials stay online.

**Why this priority**: A refinement of a complete build rather than a
prerequisite for one; meaningful only once modules are fitted and the power
budget is visible.

**Independent Test**: Toggle a module off and change another's priority group,
and confirm both are reflected in the build's power figures and survive save and
reload.

**Acceptance Scenarios**:

1. **Given** a fitted module that can be powered down, **When** the Commander
   disables it, **Then** it stops drawing power in the build's power figures and
   its contribution to the build's statistics is removed.
2. **Given** a fitted module, **When** the Commander assigns it a power priority
   group, **Then** the build reports which modules stay online in each priority
   group given the available power.
3. **Given** modules have been disabled or re-prioritised, **When** the build is
   saved, shared or exported, **Then** those settings are preserved.

---

### Edge Cases

- Fitting a larger module into a slot that also has a size-restricted variant
  (for example a military slot, or a class-restricted optional internal): only
  the genuinely fittable options are offered.
- A module that may be fitted only once per ship (such as certain internals) is
  already fitted elsewhere: the application prevents or clearly flags the
  duplicate according to the game's rule.
- Engineering that becomes invalid because the underlying module was replaced:
  engineering is dropped with the module, never silently transplanted.
- A blueprint whose journal spelling is ambiguous across module families: the
  blueprint is resolved for the specific module rather than by name alone.
- Quality or grade at the boundary of the permitted range: accepted at the
  boundary, rejected beyond it, with the valid range stated.
- Rapidly repeated changes (holding a stepper, switching modules quickly): the
  displayed statistics converge on the correct values and never show a figure
  from a superseded state.
- Undoing a change: a Commander who removes or replaces a module by mistake can
  reverse it without rebuilding by hand.
- A hull with dozens of slots viewed on a phone: every slot stays reachable and
  the Commander does not lose their place in the list after making a change.
- A module picker listing hundreds of candidates on a small screen: it stays
  searchable and scrollable, and comparison attributes remain readable.
- The catalogue reports something the game does not do (a module offered that
  cannot really be fitted, an engineering option that does not exist): the
  discrepancy is raised against the library, not corrected in this application.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The application MUST enumerate a build's slots using the game's
  own slot keys as reported by `@elite-dangerous-almanac/core`, never by
  positional index, and MUST show empty slots.
- **FR-002**: The application MUST display, for each fitted module, its
  identity, class, rating, mass, power draw, retail cost and the attributes
  relevant to its module type.
- **FR-003**: For any slot, the application MUST offer exactly the set of
  modules the package reports as fittable to that slot, and MUST NOT offer
  others.
- **FR-004**: The Commander MUST be able to fit a module into a slot, replacing
  any existing module.
- **FR-005**: The Commander MUST be able to remove a module from a slot where
  the game permits it, and MUST be told why when it does not.
- **FR-006**: Replacing a module MUST discard that slot's engineering; it MUST
  NOT be carried over to the new module.
- **FR-007**: For any fitted module, the application MUST offer exactly the
  blueprints and experimental effects the package reports as available for that
  module.
- **FR-008**: The Commander MUST be able to apply a blueprint with a chosen
  grade and quality, apply an experimental effect, and clear a module's
  engineering entirely.
- **FR-009**: Clearing engineering MUST restore the module's stock attributes
  exactly.
- **FR-010**: Engineered attributes MUST be displayed alongside their stock
  values, with the direction of each change apparent.
- **FR-011**: Pre-engineered modules MUST show their pre-applied modifications
  and any restriction on further engineering.
- **FR-012**: The Commander MUST be able to enable or disable a fitted module
  and set its power priority group, and those settings MUST participate in the
  build's power figures.
- **FR-013**: Every change MUST update the build's statistics (feature 003)
  without requiring a manual refresh.
- **FR-014**: The application MUST surface the package's validity and
  completeness reporting for the build after every change — including builds
  that cannot fly — rather than blocking edits that produce an invalid build.
- **FR-015**: All module, blueprint and effect data MUST come from
  `@elite-dangerous-almanac/core`; the application MUST NOT maintain its own
  copy of that data.
- **FR-016**: The Commander MUST be able to undo and redo outfitting changes
  within a session.
- **FR-017**: Modules that cannot be resolved against the catalogue MUST be
  reported in place, not silently treated as an empty slot.
- **FR-018**: Where the package's data or behaviour is wrong or missing, the
  problem MUST be raised against `@elite-dangerous-almanac/core` and fixed
  there. This application MUST NOT correct, clamp or special-case a library
  result locally.

### Device Requirements

- **FR-019**: Viewing slots, fitting, removing and engineering modules MUST be
  fully usable on desktop, tablet and mobile, in both portrait and landscape.
- **FR-020**: The slot list, module picker and engineering controls MUST be
  operable by touch, with targets large enough to hit reliably on a phone.
  Nothing essential — including module attributes and engineering detail — may
  be reachable only by hover.
- **FR-021**: On narrow viewports the slot list and module picker MUST remain
  navigable without horizontal page scrolling; wide content scrolls within its
  own container.
- **FR-022**: Grade and quality controls MUST be adjustable by touch as
  precisely as by pointer or keyboard.

### Testing Requirements

- **FR-023**: Fittability, engineering application and clearing, replacement
  semantics, power priority handling and undo/redo MUST be unit-tested against
  the domain layer without rendering components.
- **FR-024**: Each user story's primary journey MUST have a Playwright
  end-to-end test that runs against desktop, tablet and mobile viewports.

### Key Entities

- **Slot**: A fitting position on the hull, identified by the game's slot key,
  with a kind (core, optional, military, hardpoint, utility) and a size that
  determines what fits.
- **Module**: An outfitting item from the Almanac catalogue, identified by its
  `symbol`, with class, rating, mass, power draw, cost and type-specific
  attributes.
- **Fitted module**: A module occupying a slot in the active build, together
  with its engineering, enabled state and power priority.
- **Blueprint**: An engineering recipe, identified by its `fdname`, applicable to
  a module at a grade and quality.
- **Experimental effect**: A secondary modification, identified by its `fdname`,
  applicable alongside a blueprint.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For every ship in the catalogue, every slot is enumerated and
  every offered module is genuinely fittable — zero missing slots, zero
  impossible offers.
- **SC-002**: A Commander can replace a module in no more than three
  interactions from viewing the build.
- **SC-003**: Applying, changing or clearing engineering produces updated module
  attributes and build statistics within 100 ms of the change.
- **SC-004**: Applying engineering and then clearing it returns every module
  attribute to its stock value exactly, for every engineerable module in the
  catalogue.
- **SC-005**: A Commander can build a well-known reference loadout end to end
  and the resulting build matches the reference in every fitted module and
  engineering entry.
- **SC-006**: Fitting, removing and engineering a module all succeed on desktop,
  tablet and mobile viewports — the same end-to-end suite passes on all three,
  with no horizontal page scrolling at any of them.
- **SC-007**: Outfitting a large ship on a phone requires no more interactions
  per change than on desktop.

## Assumptions

- Fittability, engineering availability, grade and quality ranges, and
  pre-engineered behaviour are whatever `@elite-dangerous-almanac/core` reports;
  this application does not add rules of its own.
- Engineering is modelled as an outcome (blueprint, grade, quality, effect), not
  as a rolling simulation of individual engineer visits.
- Material and credit costs of engineering are surfaced where the package
  provides them; a full materials-planning feature is out of scope here.
- Ship-launched fighters, crew, cosmetic liveries and ship kits are out of scope
  for this feature.
- Responsiveness, touch support and accessibility are behavioural requirements
  in scope now; only visual styling is deferred.
- Visual design of the slot list, module picker and engineering panel is
  deferred to the UI workstream.
