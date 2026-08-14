# Feature Specification: Hull Anatomy and Mount Geometry

**Feature Branch**: `010-hull-anatomy`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Identified by a design review on 2026-08-14. The imported design reads and navigates a
build on the hull's own technical schematics — top and bottom plates with every mount drawn where it
physically sits — and projects the mounts forward to show where a build's fire converges. No accepted
specification covers either.

## Scope

This specification covers the **spatial view of a build**: the hull's own technical schematics with
each mount drawn where it sits, what that view reports about every mount, how a Commander navigates
the build through it, and what the geometry of those mounts implies about where the build's fire
arrives.

The figures this specification reports about a build — the convergence spread above all — obey
feature 003's contract exactly as the statistics areas do, including its FR-001a composition rule.

It owns one thing no other feature can express — **where on the ship a mount is** — and what follows
from it. Reading and changing a slot belongs to
[feature 002](../002-module-outfitting/spec.md); the figures a build produces belong to the
statistics family under [feature 003](../003-ship-statistics/spec.md); the illustration shown beside
a hull in the catalogue belongs to
[feature 001](../001-ship-selection-and-loading/spec.md). This feature adds a second, independent
route to the same slots and a class of insight the slot list cannot carry.

The schematics locate mounts only. Core, optional and military internals carry no position, and this
specification is explicit that they never appear on the plate and are never inferred onto it — see
FR-012 and "Upstream dependencies".

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See the build on the ship (Priority: P1)

A Commander looks at their outfitted ship rather than a list of slots, and sees at a glance which
mounts are filled, which are empty, which carry engineered modules, and which are about to shut down
when the power runs short.

**Why this priority**: A slot list tells a Commander what they have; it cannot tell them that both
their large hardpoints are on the underside, or that the empty mount is the one facing forward. This
story is the whole reason the capability exists, and it is useful before any navigation is wired up.

**Independent Test**: Load an outfitted build and confirm both plates are available, that every mount
the schematic identifies is drawn with its fitted or empty state, and that each mount's state is
readable as text as well as from the drawing.

**Acceptance Scenarios**:

1. **Given** an active build, **When** the Commander views the hull anatomy, **Then** the hull's top
   and bottom schematics are both reachable, and every mount the schematic identifies is drawn where
   the schematic places it.
2. **Given** a mount the schematic identifies, **When** the Commander views it, **Then** it reports
   the slot it belongs to, that slot's size and kind, and whether a module is fitted or the mount is
   empty.
3. **Given** a mount with a module fitted, **When** the Commander views it, **Then** the module is
   identified, and whether it is engineered or pre-engineered is apparent.
4. **Given** a mount with a module fitted, **When** the Commander views it, **Then** its power
   priority group and whether it is powered in the current hardpoint state are shown, consistent with
   the figures feature 005 reports.
5. **Given** a Commander using a screen reader, or reading at an increased text size, **When** they
   reach the anatomy view, **Then** every mount and its state are available as text, and no
   information is carried by position, colour or shape alone.

---

### User Story 2 - Reach a slot from the ship (Priority: P1)

A Commander who can see that the empty mount is the forward one selects it directly, rather than
counting down a list of eight hardpoints to work out which entry it is.

**Why this priority**: Recognition beats recall. Selecting the mount a Commander is looking at is the
shortest path from an observation to a change, and on a phone it removes an entire scrolling step.

**Independent Test**: Select a mount on either plate and confirm the fitting surface for exactly that
slot opens; then select a slot from the slot list and confirm the corresponding mount is identifiable
on the plate.

**Acceptance Scenarios**:

1. **Given** the anatomy view, **When** the Commander selects a mount, **Then** the fitting surface
   for that slot opens, ready to change the module in it.
2. **Given** a slot is being edited, **When** the Commander views the anatomy, **Then** the mount for
   that slot is distinguished from the others, so the slot in hand can be located on the ship.
3. **Given** a mount on the plate that is not currently visible — because it is on the other side of
   the hull — **When** the Commander selects its slot, **Then** a plate carrying it is brought into
   view rather than the selection appearing to do nothing; where both plates carry it, the one in
   view already suffices and no switch happens.
4. **Given** a Commander navigating by keyboard, **When** they move through the anatomy view, **Then**
   every mount is reachable in a stable order and the focused mount is identifiable.
5. **Given** a build with internals fitted, **When** the Commander wants to reach one, **Then**
   feature 002's slot enumeration remains a complete route to every slot the hull has, whether or not
   the anatomy view locates it.

---

### User Story 3 - Read where the build's fire converges (Priority: P2)

A Commander with mounts spread across a large hull wants to know how far apart their shots arrive at
the range they engage at, because a wide spread is what makes a fixed loadout miss.

**Why this priority**: Convergence is the one combat property that is purely a consequence of where
the mounts are, and it is invisible in every list-based view. It is P2 because it refines a loadout
rather than deciding it, and because it depends on an upstream capability that has not landed.

**Independent Test**: Load a build with hardpoints on opposite extremes of the hull and confirm the
convergence figures are reported for a chosen target range, each stating the range they assume, or
reported as unavailable where the package cannot supply the geometry in real units.

**Acceptance Scenarios**:

1. **Given** a build with weapons fitted, **When** the Commander views convergence at a chosen target
   range, **Then** the spread of the arriving shots is reported, together with the mount that sits
   furthest from the axis, and every figure states the range it assumes.
2. **Given** the convergence view, **When** the Commander changes the target range, **Then** the
   figures recompute for the new range and continue to state it.
3. **Given** a build with gimballed and fixed mounts, **When** the Commander views convergence,
   **Then** the two are distinguished, because a gimballed mount converges on the target and a fixed
   one does not.
4. **Given** an empty hardpoint or a disabled weapon, **When** convergence is computed, **Then** it
   contributes nothing and is identified as excluded rather than silently omitted.
5. **Given** the package does not supply mount geometry in real units, **When** the Commander views
   convergence, **Then** the figures are reported as unavailable with that reason, and no figure is
   measured off the drawing.

---

### User Story 4 - See where a hull's mounts sit before choosing it (Priority: P3)

A Commander weighing up a hull sees that both its large hardpoints sit under the nose rather than on
the roof, and factors that into the decision before committing to it.

**Why this priority**: Mount counts are what feature 001's catalogue carries; placement is what those
counts leave out. It is P3 because a Commander can make a sound choice without it, and because it
depends on stories 1 and 2 already existing.

**Independent Test**: Open a hull that is not the active build and confirm its schematics and mount
positions are available without a build existing, with every mount shown as unfitted rather than
empty.

**Acceptance Scenarios**:

1. **Given** a hull the Commander has not chosen, **When** they view its anatomy, **Then** the mounts
   the schematic identifies are shown with their sizes, without requiring a build to exist.
2. **Given** a hull viewed without a build, **When** the Commander views its anatomy, **Then** no
   mount is described as empty or fitted, because there is no build to fit — the mounts are shown as
   the hull's own layout.

---

### Edge Cases

- A hull whose schematics are unavailable: every other route into the build still works, the absence
  is not presented as a defect in the hull, and it is raised against the library rather than filled
  with a plate drawn here.
- A mount the schematic identifies that the hull's slot list does not contain, or the reverse: the
  mismatch is reported rather than resolved by guessing which slot was meant, and it is raised
  upstream.
- A hull with mining hardpoints, whose slot keys differ from the standard families: they are located
  and navigated exactly as any other mount, because the slot key is the link.
- Two mounts drawn close enough to overlap at a small viewport: both remain individually selectable,
  and neither is dropped from the view to make room.
- A build whose internals outnumber its mounts: the view states how many of the build's slots it
  locates, so the Commander never reads an absent internal as an absent slot.
- A module fitted to a mount that the current hardpoint state leaves unpowered: the mount shows the
  unpowered state rather than appearing identical to a powered one.
- The anatomy view on a phone in portrait, where the hull is at its narrowest: mounts remain large
  enough to hit by touch, and the plate scales or scrolls within its own container rather than
  widening the page.
- A Commander who cannot use the spatial view at all: every slot remains reachable through feature
  002's enumeration, so no capability is lost.
- Convergence requested on a build with a single weapon: the spread is reported as zero with that
  reason, distinct from a build whose spread could not be computed.
- Convergence requested on a build with no weapons: reported as absent rather than as a zero spread.

## Requirements _(mandatory)_

### Functional Requirements

#### The anatomy view

- **FR-001**: The application MUST present, for a hull, the top and bottom technical schematics that
  `@elite-dangerous-almanac/core` publishes for that hull's `symbol`, and MUST make both reachable.
- **FR-002**: Every mount the schematic identifies MUST be drawn where the schematic places it, and
  MUST be tied to a slot by the game's slot key the schematic itself carries — never by position in a
  list, by drawing order, or by a mapping this application maintains.
- **FR-003**: The application MUST NOT draw, move, add, offset or infer a mount position. A mount the
  schematic does not identify MUST be absent from the view rather than placed on an estimate.
- **FR-004**: Schematics MUST reach this application as a published artefact of
  `@elite-dangerous-almanac/core`, on the same terms feature 001's FR-019 sets for illustrations.
  Copying the library's asset directory into this repository is prohibited.
- **FR-005**: The application MUST reproduce Frontier Developments' media-usage notice wherever
  schematics are shown, as feature 001's FR-020 requires of the illustrations they ship alongside.
- **FR-006**: Preparing a schematic for delivery — compressing it, producing smaller variants,
  stripping editor metadata — is presentation and is permitted. Altering what it depicts, including
  the position of anything it identifies, is not.

#### What a mount reports

- **FR-007**: Each mount MUST report the slot it belongs to, that slot's size and kind, and whether a
  module is fitted or the mount is empty.
- **FR-008**: A mount with a module fitted MUST identify that module and MUST show whether it is
  engineered or pre-engineered.
- **FR-009**: A mount with a module fitted MUST show its power priority group and whether it is
  powered in the current hardpoint state, consistent with the figures feature 005 reports.
- **FR-010**: The slot currently being edited MUST be distinguished on the plate from fitted and
  empty mounts.
- **FR-011**: No information in the anatomy view may be carried by position, colour or shape alone.
  Every mount and every piece of state it reports MUST be available as text.

#### Coverage and honesty

- **FR-012**: The anatomy view MUST state that it locates mounts only, and MUST report how many of
  the build's slots it locates against how many the hull has, so an internal that is absent from the
  plate is never read as a slot the build does not have.
- **FR-013**: The application MUST NOT assign a position to a slot the schematic does not locate, and
  MUST NOT represent internals on the plate by proximity, grouping or any other spatial device that
  implies a location the data does not carry.
- **FR-013a**: A mount the schematics locate on **both** plates — a hardpoint that wraps the hull, or
  one visible from above and below — MUST remain one slot. It MUST be drawn on each plate that
  locates it, MUST report the same state in both places, and selecting it on either MUST reach the
  same slot. It MUST NOT be counted twice in the coverage FR-012 reports.
- **FR-014**: A hull whose schematics are unavailable MUST remain fully buildable through every other
  route, and the absence MUST NOT be presented as a defect in the hull.
- **FR-015**: A mount the schematic identifies whose slot key the hull's slot list does not contain,
  or a mount slot the schematic does not locate, MUST be reported as a mismatch rather than resolved
  by inference, and MUST be raised against the package.

#### Navigation

- **FR-016**: Selecting a mount MUST take the Commander to that slot's offer list and fitting
  actions, as feature 002's FR-003 and FR-004 define them.
- **FR-017**: The slot currently being edited MUST be locatable on the plate, including where it sits
  on the schematic not currently in view, which MUST be brought into view rather than leaving the
  selection with no visible effect — unless a plate already in view locates it (FR-013a).
- **FR-018**: The anatomy view MUST NOT be the only route to any slot. Feature 002's slot enumeration
  MUST remain a complete route to every slot the hull has, whether or not the schematic locates it.

#### Shot convergence

- **FR-019**: The application MUST display, for the weapons of the active build at a chosen target
  range, the spread of the arriving shots and the mount that sits furthest from the axis, each figure
  stating the range it assumes.
- **FR-020**: The Commander MUST be able to change the target range, and every convergence figure
  MUST recompute for it.
- **FR-021**: Gimballed and fixed mounts MUST be distinguished in the convergence view, because they
  converge differently.
- **FR-022**: An empty hardpoint, a disabled weapon or a mount carrying no weapon MUST be excluded
  from convergence and identified as excluded rather than silently omitted.
- **FR-023**: Convergence figures MUST be computed by `@elite-dangerous-almanac/core` from mount
  geometry it publishes in real units. The application MUST NOT measure a schematic, assume a scale,
  convert drawing units into metres, or otherwise derive a physical dimension from the artwork. Where
  the package does not supply the geometry in real units, every convergence figure MUST be reported
  as unavailable with that reason, and the capability waits on the upstream release.

#### Hulls without a build

- **FR-024**: The anatomy view MUST be available for a hull the Commander has not chosen, showing the
  mounts the schematic identifies with their sizes.
- **FR-025**: A hull viewed without a build MUST NOT describe any mount as fitted or empty, because
  no build exists to fit it; the mounts are shown as the hull's own layout.
- **FR-026**: _(Withdrawn 2026-08-14.)_ Showing two hulls' anatomy side by side is out of scope, in
  keeping with feature 001's withdrawn FR-010. The anatomy view shows one hull.

### Device Requirements

- **FR-027**: The anatomy view and every capability in this specification MUST be fully usable on
  desktop, tablet and mobile, in both portrait and landscape.
- **FR-028**: Every mount MUST be operable by touch, with a target large enough to hit reliably on a
  phone even where the schematic draws it small, and MUST NOT depend on hover for any information it
  reports.
- **FR-029**: Mounts drawn close enough to overlap at a given viewport MUST each remain individually
  selectable, and none may be dropped from the view to resolve the crowding.
- **FR-030**: The plate MUST NOT force horizontal page scrolling at any supported viewport; it scales
  or scrolls within its own container.
- **FR-031**: Every mount MUST be reachable by keyboard in a stable order, with the focused mount
  identifiable, and the whole view MUST be navigable by screen reader through the text equivalent
  FR-011 requires.

### Testing Requirements

- **FR-032**: The mount-to-slot mapping MUST be unit-tested across every hull in the catalogue,
  asserting that every slot key a schematic carries resolves to a slot that hull actually has, that no
  slot is located twice **on the same plate**, and that no position is produced for a slot the
  schematic does not locate.
- **FR-033**: Coverage reporting MUST be unit-tested, asserting that the number of located slots and
  the hull's total slot count are both reported for every hull.
- **FR-034**: Convergence MUST be unit-tested including the single-weapon, no-weapon, disabled-weapon
  and unavailable-geometry cases, and MUST assert that no figure is derived from drawing units.
- **FR-035**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, including keyboard navigation of the mounts and the
  text equivalent.

### Key Entities

- **Hull schematic**: A published top or bottom technical drawing of a hull, carrying the features it
  identifies and the game slot key of each mount it locates.
- **Mount**: One position on a hull that the schematic locates, tied to a slot by the game's slot key,
  with the size and kind of that slot.
- **Mount state**: What the active build makes of a mount — fitted or empty, the module in it, its
  engineering, its power priority group and whether it is powered.
- **Anatomy coverage**: How many of a build's slots the schematics locate, against how many the hull
  has.
- **Convergence profile**: Where the build's fire arrives at a stated target range, the spread it
  forms, and the mount furthest from the axis.

## Upstream dependencies

Verified against the installed `@elite-dangerous-almanac/core@0.1.0-beta.4` on 2026-08-14.

**The mount map is fully backed today.** The package publishes `schematic-top.svg` and
`schematic-bottom.svg` for all 48 hulls, alongside the illustration feature 001 already consumes. Each
drawn feature carries a category — hardpoint, utility mount, thruster, engine, canopy, heat vent,
cargo hatch, landing gear and, on twelve hulls, fighter bay — and every mount carries the game's own
journal slot key. All 48 hulls are annotated. The slot-to-position mapping this feature would
otherwise have to hand-maintain therefore already exists upstream, keyed by the same slot keys
feature 002 requires, which is what makes FR-002 and FR-003 satisfiable without a private record of
any kind.

**Only mounts are located.** Slot keys appear on hardpoints and utility mounts alone. Core, optional
and military internals carry no position in the schematics, and no other source of one exists. On an
Anaconda that is 16 located mounts against the 39 slots the package reports for the hull — 8
hardpoint, 8 utility, 1 armour, 7 core, 14 optional and the cargo hatch. This is not treated as a gap
to be closed: an internal has no single external position to draw, so FR-012 requires the coverage to
be stated and FR-013 forbids inventing one. A Commander reaches internals through feature 002, which
FR-018 keeps complete.

**A drawn feature is not necessarily a located slot.** The cargo hatch is the case that sits exactly
on that line: it is a real slot the hull has, it is drawn on all 48 bottom plates (and on no top
plate), and it carries no slot key — so FR-013 applies to it as it does to any internal, and it is
not navigable from the plate. Fighter bays are drawn on the twelve hulls that have them under the
same rule.

**A few mounts are drawn on both plates.** Six across the catalogue — the Federal Corvette's two
medium hardpoints and the Lynx Highliner's four — carry the same slot key on the top and bottom
schematics, because the mount is visible from both. FR-013a governs them: one slot, drawn twice,
counted once.

**Shot convergence is blocked, and the capability is requested upstream.** The schematics carry no scale
metadata — no metres-per-unit, no overall hull dimension, no mount coordinates in real units. Every
spatial figure user story 3 needs is therefore unobtainable without measuring the artwork and
assuming a scale, which FR-023 prohibits and constitution principle II forbids. What this feature
needs is mount geometry in real units: each mount's position relative to the hull's axis, in metres.
That is requested upstream. Until it ships, FR-019 to FR-022 stand and the figures are reported as
unavailable — this is the one requirement group in this specification that waits.

**Composed under feature 003's FR-001a**: the coverage FR-012 reports — how many of a build's slots
the schematics locate against how many the hull has — counts entries in two collections the package
returns, the hull's slots and the schematics' slot keys. No game rule is involved.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For all 48 hulls, every mount a schematic locates resolves to a slot key that hull
  actually has — zero unresolved, zero located twice on one plate, and zero positions produced for a
  slot the schematic does not locate. A mount both plates locate resolves to one slot, not two.
- **SC-002**: A Commander can go from seeing a mount to editing the module in it in one interaction.
- **SC-003**: Every mount's state is available as text — zero information carried by colour, shape or
  position alone, verified across the anatomy view at every supported viewport.
- **SC-004**: For every hull, the number of slots the anatomy locates and the number the hull has are
  both stated — a Commander is never left to infer coverage.
- **SC-005**: Every slot of every hull remains reachable without using the anatomy view — zero slots
  that only the spatial route can reach.
- **SC-006**: No physical dimension is ever derived from a schematic's drawing units — zero measured
  figures, asserted by tests that fail if one appears.
- **SC-007**: Every mount is selectable by touch on a phone at both orientations, including on the
  hull with the most crowded mount layout in the catalogue — zero mounts that cannot be hit and zero
  dropped to resolve crowding.
- **SC-008**: The anatomy view is usable on desktop, tablet and mobile viewports — the same end-to-end
  suite passes on all three, with no horizontal page scrolling at any of them.

## Assumptions

- The schematics are the library's artwork, consumed as a published artefact exactly as the
  illustrations are. They are static assets under the client-side-only principle: bundled at build
  time, never fetched from a third party at runtime.
- Both schematics exist for every hull in the catalogue today, so a hull without them is treated as a
  temporary gap to be raised upstream rather than an expected state — while FR-014 still requires the
  application to work when one is missing, exactly as feature 001's FR-015 does for illustrations.
  The same holds for FR-015's mismatch case: every schematic slot key resolves to a real slot today,
  and every hardpoint and utility mount is located, so a mismatch is drift between a catalogue update
  and the artwork that follows it rather than a state the data produces now.
- The schematics' own feature categories — thruster, engine, canopy, heat vent alongside the mounts —
  are available to the view, but this specification requires nothing of them beyond not misrepresenting
  them. Using them to explain a hull's vulnerabilities is a plausible follow-up, not a requirement here.
- Mount placement is the library's record of where a mount is. Where it disagrees with the game, that
  is a library defect raised upstream under principle II, never corrected by nudging a position here.
- The anatomy view is a second route to a slot, never the primary one. A design may lead with it on a
  narrow viewport, but FR-018 guarantees no Commander depends on it.
- Convergence describes where shots arrive, not what they hit. Modelling a target's silhouette, hit
  probability or time to kill is out of scope, as it is in feature 007.
- How the plates are laid out, whether they appear together or one at a time, and how a mount is drawn
  are decided at plan time against the design system, per constitution principle VII. What this
  specification fixes is what the view must convey and what it must never invent.
