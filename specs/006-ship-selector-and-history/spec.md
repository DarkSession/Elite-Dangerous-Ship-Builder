# Feature Specification: Ship Selector and Edit History

**Feature Branch**: `006-ship-selector-and-history`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "The user should be able to have a ship selector available. That
selector be able to search for ships, show basic stats and a preview. In the builder
itself, there should be an undo, redo function."

## Scope relative to features 001 and 002

Both halves of this feature already have a home, and this specification **extends** them
rather than restating them.

- [Feature 001](../001-ship-selection-and-loading/spec.md) owns ship selection. It requires
  the catalogue to be presented (FR-002), a hull to be selectable (FR-003), and the list to
  be searchable by name (FR-004), showing "the information needed to tell them apart". This
  feature makes that information concrete and comparable, adds a preview, and widens search
  beyond the ship's name.
- [Feature 002](../002-module-outfitting/spec.md) owns outfitting, and states in a single
  requirement (FR-016) that a Commander can undo and redo outfitting changes within a
  session. This feature specifies what that means: what is undoable, how far back it goes,
  what discards it, how it is presented, and how it coexists with the browser's own Back
  button.

Nothing in 001 or 002 is withdrawn. Where this specification is more specific, it governs;
where it is silent, theirs stands. Feature 003's and 005's statistics remain the authority
on figures for a **build**; the figures in this feature describe a **hull** the Commander
has not chosen yet.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Choose a hull by comparing the catalogue (Priority: P1)

A Commander who knows they want something faster than their current ship, with at least
four hardpoints, opens the selector and compares hulls side by side on the figures that
matter before committing to one.

**Why this priority**: Choosing the hull is the first and most consequential decision in
any build, and it is currently made from a name and a size. Comparable figures turn the
selector from a list into the tool that decision deserves.

**Independent Test**: Open the selector with no build loaded, sort the catalogue by a
characteristic, narrow it with a filter, and confirm the remaining hulls are exactly those
that match and are ordered correctly on that characteristic.

**Acceptance Scenarios**:

1. **Given** the selector is open, **When** the Commander views the catalogue, **Then**
   every hull is listed with its comparable characteristics — mass, top speed, boost speed,
   base armour, base shield strength, crew seats, hull and retail cost, and its mount
   layout expressed as the hardpoints, utility mounts, core sizes and optional slots it
   carries.
2. **Given** the catalogue is listed, **When** the Commander sorts by a characteristic,
   **Then** the hulls are ordered by that characteristic, the ordering direction is
   apparent, and hulls for which the characteristic is unavailable are grouped rather than
   sorted as though they were zero.
3. **Given** the catalogue is listed, **When** the Commander filters by mount layout, cost
   or any listed characteristic, **Then** only hulls matching every active filter remain,
   and the active filters and the number of matches are visible.
4. **Given** filters and a search term are active, **When** no hull matches, **Then** the
   Commander is told nothing matched and can clear the filters in a single action.
5. **Given** two or more hulls are of interest, **When** the Commander compares them,
   **Then** the same characteristics are shown for each, aligned so the differences are
   readable without scrolling between them.

---

### User Story 2 - Undo and redo while building (Priority: P1)

A Commander strips a module they meant to keep, or engineers the wrong slot, and reverses
it immediately instead of rebuilding by hand.

**Why this priority**: Outfitting is exploratory. Without a reliable way back, a Commander
either works timidly or loses work, and both undermine the point of a planner. Feature 002
requires this; nothing specifies how it behaves.

**Independent Test**: Make a sequence of build changes, undo them one at a time back to the
starting state, redo them all forward, and confirm the build matches at every step.

**Acceptance Scenarios**:

1. **Given** a build that has been changed at least once, **When** the Commander undoes,
   **Then** the build returns to its state immediately before that change, and every
   statistic recomputes accordingly.
2. **Given** a change has been undone, **When** the Commander redoes it, **Then** the build
   returns to the state before the undo, exactly.
3. **Given** several changes have been undone, **When** the Commander makes a new change,
   **Then** the redo path is discarded and the new change becomes the most recent step.
4. **Given** no change has been made yet, **When** the Commander looks at undo, **Then** it
   is shown as unavailable rather than appearing to work and doing nothing.
5. **Given** a build change is undone, **When** the Commander examines the build, **Then**
   fitted modules, engineering, enabled state, power priorities, ship name and ident all
   match the earlier state — every field the application models.
6. **Given** undo or redo is available, **When** the Commander is working on a phone,
   **Then** both are reachable by touch without leaving the slot they are editing.

---

### User Story 3 - See the ship before choosing it (Priority: P2)

A Commander who knows Elite Dangerous ships by sight, not by name, recognises the hull they
want from a preview rather than reading down a list.

**Why this priority**: Recognition is faster than recall, and hull names are easy to
confuse. It is P2 because the comparison in story 1 is what makes the decision; the preview
makes finding the candidate quicker.

**Independent Test**: Open the selector and confirm each hull carries a preview that
identifies it, that the preview is legible at every supported viewport, and that a hull
without one is handled without breaking the list.

**Acceptance Scenarios**:

1. **Given** the selector is open, **When** the Commander views a hull, **Then** a preview
   of that hull is shown alongside its characteristics.
2. **Given** a hull whose preview is unavailable, **When** it is listed, **Then** the entry
   remains complete and usable and the missing preview is not presented as a defect in the
   hull.
3. **Given** the selector is used on a phone, **When** previews are shown, **Then** they
   remain legible and do not push the characteristics off the screen or force horizontal
   page scrolling.
4. **Given** a Commander using a screen reader, **When** they reach a preview, **Then** the
   hull is identified in text; no information is carried by the preview alone.

---

### User Story 4 - Understand the edit history (Priority: P2)

A Commander who has made a dozen changes wants to see what undo is about to reverse before
pressing it, and to understand why the history emptied when they switched hulls.

**Why this priority**: An unlabelled undo is a guess. Naming the step being reversed, and
being honest about when history is discarded, is what makes the feature trustworthy rather
than merely present.

**Independent Test**: Make a sequence of distinct changes, confirm each undo step is
described in terms of what it reverses, then perform an action that discards history and
confirm the Commander is told before it happens.

**Acceptance Scenarios**:

1. **Given** changes have been made, **When** the Commander looks at undo or redo, **Then**
   each names the change it would reverse or reapply, in the Commander's own terms — the
   module and the slot, not an internal identifier.
2. **Given** a Commander holds down or repeatedly triggers undo, **When** steps are
   reversed, **Then** each change is reversed as its own step; a single burst of activity
   does not collapse several distinct decisions into one.
3. **Given** an action would discard the edit history — replacing the hull, opening a saved
   build, or importing a build — **When** the Commander triggers it, **Then** they are told
   the history will be lost as part of the confirmation feature 001 already requires.
4. **Given** the Commander has used undo, **When** they press the browser's Back button,
   **Then** it behaves as navigation and does not silently reverse a build change; the two
   are never confused.
5. **Given** the history has reached its limit, **When** a further change is made, **Then**
   the oldest step is dropped and the Commander can tell that history does not extend
   indefinitely.

---

### Edge Cases

- A hull whose characteristic the catalogue does not carry: the entry shows it as absent,
  the hull remains listed and selectable, and sorting groups it rather than treating the
  absence as zero.
- A search term matching no hull while filters are also active: the Commander is told which
  constraint eliminated the matches, not merely that the list is empty.
- Search terms with surrounding whitespace, mixed case, or a partial word: they match as
  feature 001 already requires for names, and the same tolerance applies to every other
  searchable attribute.
- Two hulls with identical values on the sort characteristic: the ordering between them is
  stable across re-sorts rather than shifting arbitrarily.
- The full catalogue with previews on a phone: the list stays scrollable and searchable,
  and previews never delay the list becoming usable.
- A preview asset that fails to load: the entry degrades to its text characteristics
  without a broken placeholder and without shifting the layout of the rows around it.
- Undoing past the point where a build was saved: permitted — the saved build is untouched,
  and the active build simply differs from it until saved again.
- Undo after a build link was produced: the link already shared continues to describe the
  build it described when it was shared, and is unaffected by later undo.
- Undo of a change that a later change depended on — removing a module that was then
  engineered: the steps reverse in order and each intermediate state is one the build could
  legitimately have been in.
- Rapid alternation between undo and redo: the build converges on the correct state and
  never displays a mixture of two states.
- Undo while a module picker or engineering panel is open on the slot being reverted: the
  open surface reflects the reverted state rather than acting on a module that is no longer
  fitted.
- Changing a viewing condition — cargo and fuel assumptions from feature 003, pips and
  hardpoint state from feature 005: not a build change, so it does not enter the history
  and undo does not reverse it.
- A session left open for a long time with many changes: memory use stays bounded, which is
  what the history limit exists to guarantee.

## Requirements _(mandatory)_

### Functional Requirements

#### Comparing and choosing a hull

- **FR-001**: The selector MUST list every hull in the catalogue with its comparable
  characteristics: mass, top speed, boost speed, base armour, base shield strength, crew
  seats, hull cost and retail cost.
- **FR-002**: The selector MUST show each hull's mount layout — the number and size of its
  hardpoints, its utility mounts, its core mount sizes and its optional slots — as
  comparable values rather than prose.
- **FR-003**: The Commander MUST be able to sort the catalogue by any listed characteristic,
  in either direction, and the active sort MUST be visible.
- **FR-004**: The Commander MUST be able to filter the catalogue by any listed
  characteristic, and the active filters and the resulting match count MUST be visible.
- **FR-005**: The Commander MUST be able to clear all filters and search terms in a single
  action.
- **FR-006**: Search MUST match against the hull's name and every other listed textual
  attribute, ignoring case and surrounding whitespace, extending feature 001's FR-004.
- **FR-007**: A characteristic the catalogue does not carry for a hull MUST be shown as
  absent, MUST NOT be shown as zero, and MUST NOT be ordered as zero when sorting.
- **FR-008**: The selector MUST allow two or more hulls to be compared on the same
  characteristics, aligned for reading, without the Commander selecting one of them first.
- **FR-009**: Every characteristic shown MUST come from `@elite-dangerous-almanac/core`.
  The application MUST NOT derive, estimate or supplement a hull characteristic, and MUST
  NOT maintain its own record of one.
- **FR-010**: Figures in the selector describe a hull as the catalogue records it, not a
  build. Any figure that depends on fitted modules MUST either be absent from the selector
  or be labelled with the configuration it assumes.

#### Ship preview

- **FR-011**: The selector MUST show a preview of each hull alongside its characteristics.
- **FR-012**: A hull without a preview MUST remain fully listed, comparable and selectable,
  and the absence MUST NOT degrade the surrounding layout.
- **FR-013**: A preview MUST NOT be the sole carrier of any information. Every hull MUST be
  identifiable and comparable from text alone.
- **FR-014**: Previews MUST be served as static assets bundled with the application. No
  preview may be fetched from a third party at runtime, in keeping with the client-side-only
  principle.
- **FR-015**: [NEEDS CLARIFICATION: what a preview is — Frontier's ship artwork bundled as
  image assets, an original schematic or silhouette owned by this project, or a
  non-pictorial summary card of the hull's mounts and figures. The three differ materially
  in production effort, asset licensing and what the design system must provide.]

#### Undo and redo

- **FR-016**: The Commander MUST be able to undo the most recent build change and redo a
  change that has been undone, for the duration of the session.
- **FR-017**: Undo and redo MUST restore every field the application models — fitted
  modules, engineering, enabled state, power priority, ship name and ident — exactly as
  they were.
- **FR-018**: A build change made after an undo MUST discard the redo path.
- **FR-019**: Undo and redo MUST be shown as unavailable when there is nothing to undo or
  redo, rather than being offered and doing nothing.
- **FR-020**: Every change that alters the build MUST be undoable: fitting, replacing and
  removing modules, applying, changing and clearing engineering, enabling and disabling
  modules, changing power priority, and setting the ship's name and ident.
- **FR-021**: Changes to viewing conditions — feature 003's cargo and fuel assumptions,
  feature 005's pip allocation and hardpoint state — MUST NOT enter the history, because
  they do not change the build.
- **FR-022**: Each undo and redo step MUST correspond to one Commander decision. A
  continuous adjustment, such as holding a grade or quality control, MUST resolve to a
  single step rather than one step per intermediate value.
- **FR-023**: Statistics, validity and every other derived view MUST recompute after undo
  and redo exactly as they do after a direct change.

#### History legibility and boundaries

- **FR-024**: Undo and redo MUST name the change they would reverse or reapply, in the
  Commander's terms — the module and the slot — and never by an internal identifier.
- **FR-025**: The edit history MUST be bounded, and reaching the bound MUST drop the oldest
  step rather than refusing further changes.
- **FR-026**: The history MUST be discarded when the active build is replaced — a new hull,
  a saved build opened, or a build imported — and the Commander MUST be told this as part
  of the confirmation feature 001 already requires for replacing a build.
- **FR-027**: The history MUST be session-scoped. It MUST NOT be persisted with a saved
  build, carried in a build link, or included in a SLEF export.
- **FR-028**: Undo and redo MUST NOT add or consume browser history entries, and the
  browser's Back button MUST NOT reverse a build change. The two MUST remain distinguishable
  to the Commander, consistent with feature 001's FR-007f.
- **FR-029**: Undoing past the point at which the build was last saved MUST be permitted and
  MUST leave the saved build untouched.

#### Honesty and provenance

- **FR-030**: Where a characteristic this feature requires is not available from
  `@elite-dangerous-almanac/core`, it MUST be raised against the package and delivered
  there. The requirement waits on the released fix; it is not satisfied by a value
  maintained in this application.
- **FR-031**: Every figure in the selector MUST carry its unit, and cost figures MUST be
  identified as catalogue retail.

### Device Requirements

- **FR-032**: The selector, its comparison, its filters and undo and redo MUST be fully
  usable on desktop, tablet and mobile, in both portrait and landscape.
- **FR-033**: The catalogue MUST remain browsable, searchable, sortable and filterable on a
  phone viewport without horizontal page scrolling; a wide comparison scrolls within its own
  container.
- **FR-034**: Undo and redo MUST be reachable by touch from wherever the Commander is
  editing, without navigating away from the slot in hand, and MUST also be operable by
  keyboard.
- **FR-035**: Sort, filter and comparison controls MUST be operable by touch with targets
  large enough to hit reliably on a phone, and MUST NOT depend on hover.

### Testing Requirements

- **FR-036**: Sorting, filtering, searching and absent-characteristic handling MUST be
  unit-tested against the domain layer without rendering components, including ties, empty
  results and every absent-value case.
- **FR-037**: Undo and redo MUST be unit-tested for sequence fidelity across every undoable
  change type, redo-path discard, the history bound, history discard on build replacement,
  and exclusion of viewing conditions.
- **FR-038**: Each user story's primary journey MUST have a Playwright end-to-end test that
  runs against desktop, tablet and mobile viewports.

### Key Entities

- **Hull characteristic**: One comparable, catalogue-recorded property of a ship, with a
  unit and either a value or the fact that the catalogue does not carry it.
- **Catalogue view**: The Commander's current search term, filters and sort over the hull
  catalogue, together with the resulting match count.
- **Hull preview**: A bundled, static representation of a hull shown in the selector, never
  the sole carrier of information.
- **Edit step**: One Commander decision that changed the build, described in the Commander's
  terms and reversible as a unit.
- **Edit history**: The bounded, session-scoped sequence of edit steps behind and ahead of
  the current build state.

## Upstream dependencies

Three things this feature needs are not available from `@elite-dangerous-almanac/core`
today. Under constitution principle II each is raised against the library and delivered
there; none may be supplied from a record kept in this application.

1. **Manufacturer and hull size** — the `Ship` record carries neither. Feature 001's first
   acceptance scenario already requires the selector to show manufacturer and size, so this
   gap predates this feature and blocks that scenario as much as this one. Both are natural
   filter and grouping axes and are the first thing a Commander uses to narrow a catalogue.
2. **Stock configuration** — the package can produce an empty hull but has no as-delivered
   configuration. Feature 001's FR-003 requires selecting a hull to create a build in its
   stock configuration, which cannot be satisfied today. It also means no figure that
   depends on fitted modules — jump range above all — can be quoted for a hull in the
   selector, which is why FR-010 confines the selector to hull characteristics.
3. **Hull imagery** — the package carries no image, render or silhouette for any ship. If
   FR-015 resolves toward a pictorial preview, the assets are this application's to hold as
   presentation, not game data; if it resolves toward a data-driven preview, the mount and
   characteristic data it would draw on already exists.

The characteristics FR-001 and FR-002 require — mass, speed, boost, base armour, base
shield strength, crew, costs and the full mount layout — are all available today.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander can narrow the full ship catalogue to the hulls meeting a
  concrete requirement — a minimum number of hardpoints, a maximum cost — and identify the
  best candidate on a chosen characteristic, in under 30 seconds.
- **SC-002**: Every characteristic shown in the selector matches the value
  `@elite-dangerous-almanac/core` records for that hull — zero divergence across the whole
  catalogue.
- **SC-003**: Sorting and filtering the full catalogue produce a result within 100 ms, so
  the list stays responsive while a Commander explores.
- **SC-004**: For every hull and characteristic the catalogue does not carry, the selector
  shows the absence — zero fabricated zeroes across the whole catalogue.
- **SC-005**: A sequence of at least twenty consecutive build changes can be undone to the
  starting state and redone to the end state, with the build matching at every intermediate
  step — 100% fidelity, verified across every undoable change type.
- **SC-006**: Undo and redo take effect within 100 ms, including recomputation of every
  dependent statistic.
- **SC-007**: A Commander can tell what undo will reverse before triggering it, for every
  step in the history.
- **SC-008**: No build change is ever lost to a browser Back press, and no undo ever
  navigates away from the build — zero confusions between the two across the end-to-end
  suite.
- **SC-009**: Choosing a hull by comparison, and undoing and redoing a change, both succeed
  on desktop, tablet and mobile viewports — the same end-to-end suite passes on all three,
  with no horizontal page scrolling at any of them.

## Assumptions

- This feature extends features 001 and 002 rather than replacing them; their requirements,
  device requirements and testing requirements continue to apply.
- "Basic stats" in the selector means the hull's own catalogue-recorded characteristics.
  Figures that depend on fitted modules belong to features 003 and 005, which describe a
  build; quoting a jump range for an unchosen hull would require a stock configuration the
  package does not provide.
- Comparison in the selector is between hulls, before a build exists. Comparing two complete
  builds side by side remains out of scope, as it is in features 003 and 005.
- The edit history covers the active build only. It is session-scoped by feature 002's own
  framing, so it is not persisted, shared or exported, and a Commander returning to a saved
  build starts with an empty history.
- A bounded history is assumed to be an implementation concern with a Commander-visible
  consequence: this spec requires that a bound exists, that it drops the oldest step, and
  that reaching it is discernible, without fixing the number.
- Undo and redo operate on build state. Navigation, filter and sort state, and viewing
  conditions are deliberately excluded, so that undo means one thing.
- Previews are static assets under the client-side-only principle. Whether they are
  pictorial and where they come from is the open question in FR-015.
- Responsiveness, touch support, accessibility and translatability are behavioural
  requirements in scope now.
- Which characteristics are prominent, how the comparison is laid out, and how undo and redo
  are presented are decided at plan time against the design system, per constitution
  principle VII; this spec fixes what must be available and how it must be qualified.
