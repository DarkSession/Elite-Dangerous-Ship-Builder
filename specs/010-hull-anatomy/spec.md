# Feature Specification: Hull Anatomy and Mount Geometry

**Feature Branch**: `010-hull-anatomy`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Identified by a design review on 2026-08-14. The imported design reads and navigates a
build on the hull's own technical schematics — top and bottom plates with every mount drawn where it
physically sits. No accepted specification covered that. The same design also projected the mounts
forward to show where a build's fire converges; that capability was assigned to
[feature 007](../007-offence-profile/spec.md) on 2026-08-14 — see "Clarifications".

## Scope

This specification covers the **spatial view of a build**: the hull's own technical schematics with
each mount drawn where it sits, what that view reports about every mount, and how a Commander
navigates the build through it.

The figures this specification reports about a build obey feature 003's contract exactly as the
statistics areas do, including its FR-001a composition rule.

It owns one thing no other feature can express — **where on the ship a mount is**. Reading and
changing a slot belongs to
[feature 002](../002-module-outfitting/spec.md); the figures a build produces belong to the
statistics family under [feature 003](../003-ship-statistics/spec.md); what follows from mount
geometry for a build's fire — shot convergence — belongs to
[feature 007](../007-offence-profile/spec.md), which consumes the positions this feature owns; the
illustration shown beside a hull in the catalogue belongs to
[feature 001](../001-ship-selection-and-loading/spec.md). This feature adds a second, independent
route to the same slots and a class of insight the slot list cannot carry.

The schematics locate mounts only. Core, optional and military internals carry no position, and this
specification is explicit that they never appear on the plate and are never inferred onto it — see
FR-012 and "Upstream dependencies".

The anatomy view is a capability of **outfitting**: it describes the hull of the active build, and it
does not exist where no build is active. Weighing up a hull before committing to one belongs to
[feature 001](../001-ship-selection-and-loading/spec.md), whose catalogue carries each hull's mount
layout.

## Clarifications

### Session 2026-08-14

- Q: On a hull the Commander has not chosen, what happens when they select a mount on the schematic?
  → A: The case does not arise. Hull anatomy is part of outfitting and is only available with an
  active hull, so User Story 4 and FR-024/FR-025 are withdrawn.
- Q: While a hull's schematics are still arriving, what must the Commander still be able to do in
  outfitting? → A: Everything except the plate itself — every slot remains readable and changeable
  and every figure remains available, with only the anatomy view showing a loading state; schematics
  are also available offline after first load. _(Narrowed 2026-08-16 by the answer below: the plates
  available offline are those of the hulls the Commander has already opened, not the whole catalogue.
  Everything else in this answer stands.)_
- Q: When a schematic carries a slot key the hull does not have, or a hull's schematics are missing
  entirely, who gets told and how? → A: Build-time only — a mismatch fails FR-032's tests before
  release and never reaches a Commander; a missing schematic shows a neutral "no schematic" state in
  the anatomy view and nothing further.
- Q: Until the package publishes mount geometry in real units, what does the Commander see for shot
  convergence? → A: Nothing here — shot convergence is part of the offence profile. User Story 3 and
  FR-019 to FR-023 move to [feature 007](../007-offence-profile/spec.md); this feature keeps only the
  mount positions convergence is computed from.
- Q: On the most crowded hull at phone width, how does the Commander hit two mounts the schematic
  draws almost on top of each other? → A: By magnifying and panning the plate, so mounts separate at
  their true positions. No marker is offset, clustered or dropped. _(Superseded 2026-08-16: the
  application offers no magnification control. The plate is drawn at one fixed scale, sized so those
  two mounts are already separable, and it pans within its container where the viewport is smaller.
  What survives from this answer is the prohibition it was chosen to protect — no marker is offset,
  clustered or dropped.)_

### Session 2026-08-16

- Q: Which of a mount's details must be readable directly on the plate, and which may wait until the
  Commander opens that mount? → A: The plate carries three states at a glance — whether a module is
  fitted or the mount is empty, whether a fitted module is engineered, and whether the mount is the
  slot currently focused on the build. Selecting a mount focuses that slot on the build, and the rest
  — the slot it belongs to, its size and kind, the module's identity, its power priority group and
  whether it is powered — is read there rather than drawn on the hull.
- Q: When the Commander taps something the schematic draws but does not tie to a slot — the cargo
  hatch, a fighter bay, a thruster, the canopy — what happens? → A: The case does not arise. The
  anatomy view presents the hull and its hardpoints and utility mounts only; the schematic's other
  seven feature categories are not presented, so no shape on the plate is unselectable. Nothing that
  is presented is moved or redrawn, so FR-006 is untouched.
- Q: Must mounts on the plate take their colour from the design system's tokens, overriding the fixed
  colours the schematic's artwork carries? → A: Yes, and the colours are resolved when the schematic
  is converted for delivery. The schematics are not consumed as SVG — 9.0 MB across the catalogue,
  3.1 MB gzipped, and up to 323 KB for a single plate — so each is rasterised at build time with the
  design system's colours applied in place of the artwork's own. Rasterising removes the schematic's
  per-mount elements, so mount positions and slot keys are extracted at build time and the mounts
  themselves are drawn over the raster at runtime, where the build that gives them their state exists.
- Q: After first load, which hulls' plates must be available offline? → A: The ones the Commander has
  already opened. Plates cache as a hull is opened rather than being precached for the catalogue, and a
  hull whose plates were never fetched says they are unavailable offline — worded distinctly from
  FR-014's "no schematic exists for this hull", so a temporary absence is never read as a permanent
  one. The plate is a second route FR-018 guarantees nobody depends on, and precaching 48 hulls of
  artwork would be a download no Commander asked for.
- Q: Is the plate reused to show anything other than mounts — a power overlay, per-mount mass, shield
  or armour coverage? → A: No. There is one anatomy view and it shows mounts. FR-007a already fixes
  its at-a-glance state at three things; this settles the question one level up, that the plate is
  not a canvas other areas draw their own data onto. Power, mass, defence and offence are reported by
  the areas that own them (features 005, 006, 007, 008), each of which reports figures the hull's
  outline cannot express — and a plate that changed meaning under a set of mode tabs would make the
  Commander check which mode they were in before trusting anything they saw on it.
- Q: How far must a Commander be able to magnify the plate? → A: Not at all — the application offers
  no magnification control and the plate is drawn at a single fixed scale. That scale is set by the
  most crowded hull in the catalogue: large enough that its two closest mounts each carry a full touch
  target at their true positions, so no viewport ever needs zooming to separate them. Where a viewport
  is smaller than the plate, the plate pans within its own container instead of scaling down. This
  supersedes the 2026-08-14 answer that resolved crowding by magnifying, and it fixes the resolution
  the converted plates are produced at (FR-006d).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - See the build on the ship (Priority: P1)

A Commander looks at their outfitted ship rather than a list of slots, and sees at a glance which
mounts are filled, which are empty, which carry engineered modules, and which mount is the slot they
are working on.

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
2. **Given** a mount the schematic identifies, **When** the Commander views the plate, **Then**
   whether a module is fitted or the mount is empty is apparent without selecting the mount.
3. **Given** a mount with a module fitted, **When** the Commander views the plate, **Then** whether
   that module is engineered or pre-engineered is apparent without selecting the mount.
4. **Given** a mount the Commander selects, **When** that slot is focused on the build, **Then** the
   slot it belongs to, that slot's size and kind, the module fitted, its power priority group and
   whether it is powered in the current hardpoint state are all reported there, consistent with the
   figures feature 005 reports.
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
2. **Given** a slot is focused on the build, **When** the Commander views the anatomy, **Then** the
   mount for that slot is distinguished from the others, so the slot in hand can be located on the
   ship.
3. **Given** a mount on the plate that is not currently visible — because it is on the other side of
   the hull — **When** the Commander selects its slot, **Then** a plate carrying it is brought into
   view rather than the selection appearing to do nothing; where both plates carry it, the one in
   view already suffices and no switch happens.
4. **Given** a Commander navigating by keyboard, **When** they move through the anatomy view, **Then**
   every mount is reachable in a stable order and the mount holding keyboard focus is identifiable.
5. **Given** a build with internals fitted, **When** the Commander wants to reach one, **Then**
   feature 002's slot enumeration remains a complete route to every slot the hull has, whether or not
   the anatomy view locates it.

---

### User Story 3 - _(Withdrawn 2026-08-14.)_

Reading where the build's fire converges is out of scope here. Shot convergence is part of the
offence profile and belongs to [feature 007](../007-offence-profile/spec.md), which consumes the
mount positions this feature owns. What stays here is the positions themselves.

---

### User Story 4 - _(Withdrawn 2026-08-14.)_

Seeing where a hull's mounts sit before choosing it is out of scope. Hull anatomy is a capability of
outfitting and exists only for an active build (FR-001a). Weighing up a hull before committing to it
belongs to [feature 001](../001-ship-selection-and-loading/spec.md), whose catalogue carries each
hull's mount layout under its FR-004.

---

### Edge Cases

- A hull whose schematics are unavailable: every other route into the build still works, the absence
  is not presented as a defect in the hull, and it is raised against the library rather than filled
  with a plate drawn here.
- A schematic that has not finished arriving: outfitting is already usable, every slot is already
  readable and changeable, and the wait is visible in the anatomy view alone rather than holding up
  the build.
- A hull opened for the first time with no network: its plates cannot arrive, so the anatomy view says
  they are unavailable offline rather than that the hull has no schematic, every slot of the build
  stays readable and changeable, and the plates appear when the network returns.
- A mount the schematic identifies that the hull's slot list does not contain, or the reverse: the
  build fails on the mismatch rather than shipping it, it is never resolved by guessing which slot
  was meant, and it is raised upstream.
- A hull with mining hardpoints, whose slot keys differ from the standard families: they are located
  and navigated exactly as any other mount, because the slot key is the link.
- Two mounts drawn close enough to overlap on the most crowded hull: they do not overlap, because the
  plate's fixed scale is set by exactly that pair. Both remain individually selectable at every
  viewport, neither is dropped from the view to make room, and neither is nudged apart to create it.
- A build whose internals outnumber its mounts: the view states how many of the build's slots it
  locates, so the Commander never reads an absent internal as an absent slot.
- A module fitted to a mount that the current hardpoint state leaves unpowered: the plate does not
  distinguish it, because power is not one of the three states it carries (FR-007a). The Commander
  reads the unpowered state at the focused slot, and the plate claims nothing about power rather than
  showing a powered mount and an unpowered one as though the difference had been checked.
- The anatomy view on a phone in portrait, where the viewport is at its narrowest: the plate keeps its
  scale so mounts stay large enough to hit by touch, and it pans within its own container rather than
  shrinking to fit or widening the page.
- A Commander who cannot use the spatial view at all: every slot remains reachable through feature
  002's enumeration, so no capability is lost.

## Requirements _(mandatory)_

### Functional Requirements

#### The anatomy view

- **FR-001**: The application MUST present, for the active build's hull, the top and bottom technical
  schematics that `@elite-dangerous-almanac/core` publishes for that hull's `symbol`, and MUST make
  both reachable.
- **FR-001a**: The anatomy view is a capability of outfitting and MUST require an active build. It
  MUST NOT be offered for a hull the Commander has not chosen, and selecting a mount MUST NOT create
  a build — choosing a hull belongs to feature 001's FR-011.
- **FR-002**: Every mount the schematic identifies MUST be drawn where the schematic places it, and
  MUST be tied to a slot by the game's slot key the schematic itself carries — never by position in a
  list, by drawing order, or by a mapping this application maintains.
- **FR-002a**: Converting a schematic for delivery (FR-006) removes its own per-mount elements, so
  each mount's position and slot key MUST be extracted from the schematic at build time and delivered
  alongside the converted plate. An extracted position MUST be the schematic's own geometry — never
  measured off the drawing, estimated, or maintained by hand in this repository.
- **FR-002b**: The mounts the Commander sees and selects MUST be drawn by the application over the
  converted plate, at the positions FR-002a extracts. They cannot be part of the converted asset: the
  states FR-007a requires depend on the active build, which does not exist when a plate is converted.
- **FR-003**: The application MUST NOT invent, move, offset or estimate a mount position. Drawing a
  mount where the schematic places it is FR-002; producing a position the schematic does not give is
  prohibited, and a mount the schematic does not identify MUST be absent from the view rather than
  placed on an estimate.
- **FR-003a**: The anatomy view MUST present the hull itself and the features the schematic marks as
  hardpoints and utility mounts, and MUST NOT present the schematic's other feature categories —
  cargo hatch, fighter bay, thruster, engine, canopy, heat vent and landing gear. Those categories
  locate no slot (FR-013), so drawing them would put shapes on the plate that look selectable and are
  not. Every feature the view presents is therefore a mount the Commander can reach.
- **FR-004**: Schematics MUST reach this application as a published artefact of
  `@elite-dangerous-almanac/core`, on the same terms feature 001's FR-019 sets for illustrations.
  Copying the library's asset directory into this repository is prohibited.
- **FR-005**: The application MUST keep Frontier Developments' media-usage notice reachable wherever
  schematics are shown, as feature 001's FR-020 requires of the illustrations they ship alongside.
  The notice itself is presented by [feature 012](../012-help-and-licences/spec.md), which owns the
  application's licence and attribution surface; this feature owes the route to it.
- **FR-006**: Preparing a schematic for delivery — rasterising it, compressing it, producing variants
  at several resolutions, stripping editor metadata, and resolving its colours to the design system's
  tokens — is presentation and is permitted. Altering what it depicts is not: nothing the view
  presents may be moved, redrawn or added to. Choosing which of the schematic's feature categories the
  view presents (FR-003a) is a decision about what to show, not an alteration of what is shown.
- **FR-006a**: Schematics MUST NOT delay outfitting becoming usable, as feature 001's FR-021 requires
  of illustrations. The Commander MUST be able to read and change every slot, and read every figure,
  while the plates are still arriving; only the anatomy view itself carries the loading state. Every
  capability MUST remain usable offline after first load. Plates MUST be fetched at runtime from the
  origin the application is served from and MUST NOT be fetched from any other
  (constitution principle I, amended 3.0.0 on 2026-08-16). A hull's plates MUST be cached as that hull
  is opened rather than precached for the whole catalogue, so every hull the Commander has already
  opened keeps its anatomy with the network disabled; a hull whose plates were never fetched is
  governed by FR-014a.
- **FR-006b**: Conversion MUST run at build time against the installed `@elite-dangerous-almanac/core`,
  and the converted plates are build output. They MUST NOT be committed to this repository, which
  would be the vendored copy FR-004 prohibits by another route.
- **FR-006c**: Conversion MUST resolve every colour the plate shows to a design system token — both
  the schematic's fixed per-feature values and the hull outline it leaves to the caller — so that no
  colour on screen originates in the artwork. The tokens are the application's one theme
  (constitution principle VII, amended 2026-08-16), so exactly one converted plate exists per hull
  per view; an earlier draft permitted one per theme and there is now only one theme for it to
  produce.
- **FR-006d**: Rasterising MUST NOT cost the plate its legibility. A converted plate MUST be delivered
  at a resolution that keeps the hull's lines sharp at the fixed scale FR-029 sets, on the highest
  pixel density among supported devices. Because there is no magnification control, that scale is
  known when the plate is converted and the resolution follows from it.

#### What a mount reports

- **FR-007**: The plate MUST show, for every mount it draws, whether a module is fitted or the mount
  is empty, without the Commander having to select the mount.
- **FR-007a**: The plate's at-a-glance state is exactly three things: whether a module is fitted or
  the mount is empty (FR-007), whether a fitted module is engineered or pre-engineered (FR-008), and
  whether the mount is the slot currently focused on the build (FR-010). No other figure MUST be
  required to appear on the plate, and no other figure MUST be readable only from it.
- **FR-007b**: The anatomy view MUST have one mode. The plate MUST NOT be switchable between
  alternative data overlays — power, mass, defence, offence or any other area's figures — because
  those areas own figures the hull's outline does not express, and a plate whose meaning changes
  under a mode control forces a Commander to check which mode is in force before they can trust what
  they are looking at. What varies on the plate is the build, never what the plate is about.
- **FR-008**: The plate MUST show whether a fitted module is engineered or pre-engineered, without
  the Commander having to select the mount. The module's own identity is reported at the focused slot
  under FR-009.
- **FR-009**: A mount's remaining detail — the slot it belongs to, that slot's size and kind, the
  module fitted, its power priority group and whether it is powered in the current hardpoint state —
  MUST be reported where FR-016 takes the Commander when they select the mount, consistent with the
  figures feature 005 reports. It MUST NOT be required on the plate itself.
- **FR-010**: The slot currently focused on the build MUST be distinguished on the plate from fitted
  and empty mounts, so the mount in hand is identifiable at a glance.
- **FR-011**: No information in the anatomy view may be carried by position, colour or shape alone.
  Every mount MUST be identifiable as text by the slot it belongs to, and every state the plate
  conveys about it (FR-007a) MUST be available as text alongside it.

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
  route, and the absence MUST NOT be presented as a defect in the hull. The anatomy view MUST show a
  neutral state stating that no schematic is available for the hull.
- **FR-014a**: A hull whose plates are not cached and cannot be fetched MUST show an
  offline-unavailable state, worded distinctly from FR-014's "no schematic exists for this hull" so
  that a temporary absence is never read as a permanent one. Every other route into the build MUST
  remain unaffected, and the plates MUST become available once the network returns without the
  Commander reloading the application.
- **FR-015**: A mount the schematic identifies whose slot key the hull's slot list does not contain,
  or a mount slot the schematic does not locate, MUST be reported as a mismatch rather than resolved
  by inference, and MUST be raised against the package. That report is a failing build-time test
  (FR-032), not a Commander-facing state: the schematics and the slot data ship from the same bundled
  package version, so a mismatch MUST fail the build before release rather than reach a Commander.

#### Navigation

- **FR-016**: Selecting a mount MUST take the Commander to that slot's offer list and fitting
  actions, as feature 002's FR-003 and FR-004 define them.
- **FR-017**: The slot currently focused on the build MUST be locatable on the plate, including where it sits
  on the schematic not currently in view, which MUST be brought into view rather than leaving the
  selection with no visible effect — unless a plate already in view locates it (FR-013a).
- **FR-018**: The anatomy view MUST NOT be the only route to any slot. Feature 002's slot enumeration
  MUST remain a complete route to every slot the hull has, whether or not the schematic locates it.

#### Withdrawn scope

- **FR-019**: _(Withdrawn 2026-08-14.)_ Displaying the spread of arriving shots and the mount
  furthest from the axis is part of the offence profile — moved to
  [feature 007](../007-offence-profile/spec.md).
- **FR-020**: _(Withdrawn 2026-08-14.)_ The target-range control moves with FR-019 to feature 007.
- **FR-021**: _(Withdrawn 2026-08-14.)_ Distinguishing gimballed from fixed mounts in the convergence
  view moves with FR-019 to feature 007.
- **FR-022**: _(Withdrawn 2026-08-14.)_ Excluding empty hardpoints and disabled weapons from
  convergence moves with FR-019 to feature 007.
- **FR-023**: _(Withdrawn 2026-08-14.)_ The prohibition on deriving a physical dimension from the
  artwork moves with FR-019 to feature 007. It is not lost here: FR-003 already forbids this feature
  from inferring any mount position, and SC-006 holds it to that.
- **FR-024**: _(Withdrawn 2026-08-14.)_ The anatomy view is not available for a hull the Commander
  has not chosen. It is a capability of outfitting and requires an active build — see FR-001a.
- **FR-025**: _(Withdrawn 2026-08-14.)_ Follows from FR-024: with no build, no mount can be described
  as fitted or empty, so the case does not arise.
- **FR-026**: _(Withdrawn 2026-08-14.)_ Showing two hulls' anatomy side by side is out of scope, in
  keeping with feature 001's withdrawn FR-010. The anatomy view shows one hull.

### Device Requirements

- **FR-027**: The anatomy view and every capability in this specification MUST be fully usable on
  desktop, tablet and mobile, in both portrait and landscape.
- **FR-028**: Every mount MUST be operable by touch, with a target large enough to hit reliably on a
  phone even where the schematic draws it small, and MUST NOT depend on hover for any information it
  reports.
- **FR-029**: The application MUST NOT offer a magnification control. The plate is presented at one
  scale, and that scale MUST be large enough that the two closest mounts on the most crowded hull in
  the catalogue each carry a full touch target at their true positions. Every mount MUST therefore be
  individually selectable at every supported viewport, with no marker offset from where the schematic
  places it, collapsed into a cluster, or hidden to resolve crowding (FR-003).
- **FR-029a**: Where a viewport is narrower or shorter than the plate at that scale, the plate MUST
  pan within its own container rather than shrink below it. Panning MUST work by touch and by pointer,
  and reaching a mount MUST NOT require it: keyboard and screen-reader navigation MUST reach every
  mount in the stable order FR-031 requires, and giving keyboard focus to a mount outside the visible
  region MUST bring it into view — as FR-017 requires of the slot focused on the build.
- **FR-030**: The plate MUST NOT force horizontal page scrolling at any supported viewport. It pans
  within its own container (FR-029a); it MUST NOT be scaled down to fit, which would take the mounts
  below the target size FR-029 fixes.
- **FR-031**: Every mount MUST be reachable by keyboard in a stable order, with the mount holding
  keyboard focus identifiable, and the whole view MUST be navigable by screen reader through the text
  equivalent FR-011 requires.

### Testing Requirements

- **FR-032**: The mount-to-slot mapping MUST be unit-tested across every hull in the catalogue,
  asserting that every slot key a schematic carries resolves to a slot that hull actually has, that no
  slot is located twice **on the same plate**, and that no position is produced for a slot the
  schematic does not locate. The same tests MUST assert that the view presents no feature outside the
  hardpoint and utility-mount categories (FR-003a), and that it exposes no mode in which the plate
  carries anything but the three mount states FR-007a fixes (FR-007b).
- **FR-036**: The build-time conversion MUST be tested: that every hull in the catalogue produces both
  converted plates, that each is accompanied by the extracted mount positions and slot keys FR-002a
  requires, that no colour outside the design system's tokens appears in a converted plate, and that no
  converted plate is committed to this repository (FR-006b).
- **FR-036a**: Plate delivery MUST be tested end to end, as feature 001's FR-051c requires of
  illustrations: that opening a hull requests only that hull's plates, that every request goes to the
  origin the application was served from and to no other, that a hull opened once keeps its anatomy
  with the network disabled while one never opened shows FR-014a's offline-unavailable state rather
  than FR-014's "no schematic" state, that every slot stays readable and changeable throughout
  (FR-006a), and that the plates arrive when the network returns without a reload.
- **FR-037**: The plate's fixed scale MUST be unit-tested against the catalogue, asserting that the
  closest pair of mounts on every hull is separated by at least a full touch target at that scale
  (FR-029), so that the hull which sets the scale is identified by the test rather than assumed.
- **FR-033**: Coverage reporting MUST be unit-tested, asserting that the number of located slots and
  the hull's total slot count are both reported for every hull.
- **FR-034**: The mount positions this feature publishes to feature 007 MUST be unit-tested as the
  package's own values, asserting that none is measured off a schematic or converted from drawing
  units. Testing convergence itself moves with FR-019 to feature 007.
- **FR-035**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox, including keyboard
  navigation of the mounts and the text equivalent.

### Key Entities

- **Hull schematic**: A published top or bottom technical drawing of a hull, carrying the features it
  identifies and the game slot key of each mount it locates.
- **Mount**: One position on a hull that the schematic locates, tied to a slot by the game's slot key,
  with the size and kind of that slot.
- **Mount state**: What the active build makes of a mount — fitted or empty, the module in it, its
  engineering, its power priority group and whether it is powered. The plate carries three of these
  at a glance — fitted or empty, the engineering, and whether the mount is the focused slot (FR-007a)
  — and the rest is read at the focused slot.
- **Anatomy coverage**: How many of a build's slots the schematics locate, against how many the hull
  has.

## Upstream dependencies

Verified against `@elite-dangerous-almanac/core@0.1.0-beta.4` on 2026-08-14 and re-verified against
the installed `0.1.0-beta.10` on 2026-08-16: both plates still ship for all 48 hulls, the slot keys
and the nine feature categories are unchanged, the six both-plate mounts are unchanged, and no scale
metadata has appeared. The whole `assets/ships` tree is byte-for-byte identical across `0.1.0-beta.8`,
`0.1.0-beta.9` and `0.1.0-beta.10`, so the measurements below stand unchanged rather than merely
unrechecked.

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

**Nine feature categories exist; two of them are mounts.** The schematics mark hardpoints and utility
mounts — the only categories carrying slot keys — alongside thrusters, engines, heat vents, canopies,
landing gear, cargo hatches and, on twelve hulls, fighter bays. FR-003a presents the first two and
leaves the other seven out of the view.

The cargo hatch is why that line is drawn where it is: it is a real slot the hull has, it is marked
on all 48 bottom plates (and on no top plate), and it carries no slot key. Presenting it would put a
shape on the plate that a Commander would reasonably try to select, and that FR-013 forbids
resolving to the slot it plainly is. Leaving it out states the same fact more honestly, and FR-012's
coverage figure is what tells the Commander the plate does not account for every slot.

**A few mounts are drawn on both plates.** Six across the catalogue — the Federal Corvette's two
medium hardpoints and the Lynx Highliner's four — carry the same slot key on the top and bottom
schematics, because the mount is visible from both. FR-013a governs them: one slot, drawn twice,
counted once.

**The schematics are too heavy to ship as SVG.** Measured at beta.8 and unchanged at beta.10, the 96
plates total 9.0 MB —
3.1 MB gzipped — and a single plate reaches 323 KB (Panther Mk II's underside, 105 KB gzipped). The
weight is in the path data of a few dozen very long outlines rather than in node count, so the cost is
bytes rather than DOM. FR-006 therefore has them rasterised at build time, which is also where the
design system's colours replace the artwork's own (FR-006c). Two consequences follow and are stated as
requirements rather than left to the plan: the raster cannot carry mount state, because no build exists
when it is produced (FR-002a and FR-002b), and it must be produced at a resolution that holds up at
the fixed scale FR-029 sets, on the densest supported display (FR-006d). Because that scale is fixed
and no magnification control exists, the resolution needed is known at conversion time rather than
open-ended.

**The schematics carry no scale, and nothing needs them to.** There is no metres-per-unit, no overall
hull dimension and no mount coordinate in real units on any plate — re-verified across all 96 at
`0.1.0-beta.10`, none of which carries scale metadata of any kind. That absence is what makes FR-003
and SC-006 load-bearing: a physical figure could only be obtained by measuring the artwork against an
assumed scale, which constitution principle II forbids. It is not a gap, and **no request for it is
open upstream**, for two reasons. Nothing in this specification needs one — the plate locates a mount
for drawing and navigation, not for measurement. And the feature that did need real units,
[feature 007](../007-offence-profile/spec.md)'s shot convergence, was answered at `0.1.0-beta.8` from
a different source: `SHIP_GUNSIGHTS` publishes each hardpoint's horizontal and vertical offset from
the cockpit in metres, observed in-game across all 48 hulls and 234 hardpoints, rather than measured
off these drawings. So the geometry convergence requires exists today and does not come from the
schematics, which is precisely the separation feature 007's FR-016e exists to keep.

An earlier draft recorded each mount's position relative to the hull's axis as "requested upstream".
No such issue was ever filed, and the need it was recorded against has since been met elsewhere; the
sentence is withdrawn on 2026-08-16 rather than converted into a request, so a later reader does not
go looking for an issue that was never opened. Should a future capability need hull-relative geometry, it is
raised then, by the feature that needs it.

**Composed under feature 003's FR-001a**: the coverage FR-012 reports — how many of a build's slots
the schematics locate against how many the hull has — counts entries in two collections the package
returns, the hull's slots and the schematics' slot keys. No game rule is involved.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: For all 48 hulls, every mount a schematic locates resolves to a slot key that hull
  actually has — zero unresolved, zero located twice on one plate, and zero positions produced for a
  slot the schematic does not locate. A mount both plates locate resolves to one slot, not two, and
  zero features outside the hardpoint and utility-mount categories reach the view.
- **SC-002**: A Commander can go from seeing a mount to editing the module in it in one interaction.
- **SC-003**: Every mount is identifiable as text by its slot, and every state the plate conveys
  about it is available as text — zero information carried by colour, shape or position alone,
  verified across the anatomy view at every supported viewport.
- **SC-004**: For every hull, the number of slots the anatomy locates and the number the hull has are
  both stated — a Commander is never left to infer coverage.
- **SC-005**: Every slot of every hull remains reachable without using the anatomy view — zero slots
  that only the spatial route can reach.
- **SC-006**: No physical dimension is ever derived from a schematic's drawing units — zero measured
  figures, asserted by tests that fail if one appears.
- **SC-007**: Every mount is selectable by touch on a phone at both orientations, including on the
  hull with the most crowded mount layout in the catalogue — zero mounts that cannot be hit, zero
  dropped to resolve crowding, and zero drawn anywhere but where the schematic places them. Every
  mount on that hull is also reachable by keyboard without panning the plate.
- **SC-008**: The anatomy view is usable on desktop, tablet and mobile viewports — the same end-to-end
  suite passes on all three, with no horizontal page scrolling at any of them.
- **SC-009**: Every slot of the active build is readable and changeable before any schematic has
  finished loading, and the anatomy view operates with the network disabled after first load for every
  hull whose plates have already been opened. A hull whose plates were never fetched states that they
  are unavailable offline — zero cases where a temporary absence reads as a hull that has no schematic.
- **SC-010**: Every colour the plate shows comes from a design token — zero colours originating in the
  artwork, asserted against the converted plates for all 48 hulls, and zero colours held on the
  component that presents them.
- **SC-011**: The plate stays legible at its fixed scale on every hull and at the highest supported
  pixel density — zero hull lines that blur into illegibility, and zero pairs of mounts that cannot be
  told apart or hit separately, with no magnification available to compensate.

## Assumptions

- The schematics are the library's artwork, consumed as a published artefact exactly as the
  illustrations are. They are the application's own static assets under the client-side-only
  principle: converted at build time, served from the application's own origin, and fetched from it
  per hull at runtime (FR-006a) — never from a third party. What ships is the converted plate rather
  than the library's SVG (FR-006, FR-006b); the SVG remains the source, read from the installed
  package by the build. This assumption previously read "bundled at build time", which contradicted
  FR-006a and FR-014a in this same specification; the constitution settled the question in favour of
  the requirements on 2026-08-16 (principle I, 3.0.0), and feature 001's illustrations now load the
  same way.
- Both schematics exist for every hull in the catalogue today, so a hull without them is treated as a
  temporary gap to be raised upstream rather than an expected state — while FR-014 still requires the
  application to work when one is missing, exactly as feature 001's FR-015 does for illustrations.
  The same holds for FR-015's mismatch case: every schematic slot key resolves to a real slot today,
  and every hardpoint and utility mount is located, so a mismatch is drift between a catalogue update
  and the artwork that follows it rather than a state the data produces now.
- The schematics' other feature categories — thruster, engine, canopy, heat vent, landing gear, cargo
  hatch, fighter bay — are present in the data and deliberately absent from the view (FR-003a). Using
  them to explain a hull's vulnerabilities is a plausible follow-up that would need a specification of
  its own, including what a Commander may do with a feature that locates no slot.
- Mount placement is the library's record of where a mount is. Where it disagrees with the game, that
  is a library defect raised upstream under principle II, never corrected by nudging a position here.
- The anatomy view is a second route to a slot, never the primary one. A design may lead with it on a
  narrow viewport, but FR-018 guarantees no Commander depends on it.
- This feature owns where a mount is; it does not own what follows from that for a build's fire.
  Feature 007 consumes the positions for shot convergence, and this specification states no
  requirement about them beyond FR-003's prohibition on inventing one.
- How the plates are laid out, whether they appear together or one at a time, and how a mount is drawn
  are decided at plan time against the design system, per constitution principle VII. What this
  specification fixes is what the view must convey and what it must never invent.
