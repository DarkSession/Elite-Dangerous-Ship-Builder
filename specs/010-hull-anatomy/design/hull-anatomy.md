# Screen Definition: Hull Anatomy

## Purpose and parent

Hull Anatomy is a capability inside feature 001's active `/build` workspace. It lets a Commander
locate and select both weapon hardpoints and utility mounts on Almanac top/bottom schematics, inspect
their exact current state and move to/from feature 002's outfitting slot. It adds no route and is not
available without an active build.

## Information order

Canvases 1c and 1d draw the capability in one order, and it is stable across all layouts:

1. the localized `HULL ANATOMY` heading;
2. the labelled schematic regions — both sides at wide width, one side and its `TOP`/`BOTTOM`
   selector when constrained; and
3. the mount state legend.

That is the whole capability. Feature 002's ledger and bench stand beside it in the same workspace
and carry the selected mount's facts, which is why nothing below repeats them.

Visual columns never reorder this reading sequence.

## Responsive composition

### Wide

Canvas 1c's `grid-template-columns: 1fr 1fr`: top and bottom render as two fluid labelled plates
sharing one selected state and one legend, and the side selector is not drawn because both sides are
already shown. The complete ledger remains beside the capability according to the feature 002
workspace definition.

### Intermediate tablet

Container queries choose paired or single-side presentation from available inline size and expanded
text, not a named device breakpoint. In portrait the schematics may stack or use the side selector;
in landscape they may pair. Nothing required disappears in either orientation.

### Narrow, mobile and zoomed

Canvas 1d's composition: one labelled side at a time with a `TOP`/`BOTTOM` selector, drawn at the
canvas's own dense height and held to SC 2.5.8's 24-pixel floor like every other segmented strip.

Canvas 1d stacks the anatomy **above** feature 002's ledger, and so does the workspace. It did not
until 2026-08-26: the ledger, the centre track and the status rail are one grid whose source order is
its wide left-to-right order, and nothing re-ordered it when it stacked, so the ledger opened the
narrow screen and the anatomy sat under it. That deviation was feature 002's composition rather than
this capability's placement — the anatomy sits in the centre track, which is where canvas 1c puts it
— and it was closed there, by ordering the compact grid rather than by moving the region
(`specs/002-module-outfitting/design/outfitting-workspace.md`, "Narrow and 400%-zoom composition").

**The block's inset belongs to its arrangement, not to a width (2026-08-26).** Canvas 1c pads the
block `16px 20px 6px` around the header row and `10px 20px 14px` around the plates; canvas 1d pads
its header row `12px 14px 8px` and runs the mode strip full-bleed under it. The narrow figure is the
base and the roomy one is stated with the two-plate arrangement, at the same threshold the second
plate opens at. Read the other way round, a one-plate block stood 8px further in than every other
band the narrow screen stacks it among, and a reading inside `POWER & THERMALS` did not line up with
a mount name in the ledger below it — which is the misalignment reported that day.

Selecting a mount selects its ledger row, which is what canvas 1d's bench then opens on. At 400%
zoom and long or RTL text every group stacks, and no part of the document scrolls sideways — the
plate holds its whole document at its own ratio at every width.

## Schematic regions

- Each side names hull and orientation in visible/programmatic text.
- Artwork is the package's own document rasterised at build time, drawn as one `image` at the
  `viewBox` its extract records; no private technical image and no background overlay is used.
- Only a package `hardpoint` resolving to a hardpoint slot or `utility_mount` resolving to a utility
  slot receives interaction. All other annotated features remain inert artwork.
- Every package shape is drawn once, inert, in the package's own paint — annotated features
  included. The canvas's hull is one picture with no per-mount treatment on it, and a mount's state
  is carried by the mark set over it rather than by repainting what the package drew.
- Every admitted occurrence is drawn as canvas 1c's `hp-node`: a small square carrying that mount's
  node number, anchored to the mount's own position and treated in the canvas's four kinds. The
  anchor is the middle of the annotation's own published coordinates; nothing is measured off
  anything rendered. Where two anchors are closer together than a mark is wide the mark steps aside
  and a hairline ties it back to its anchor, which is the whole of "Marks that would touch" below.
- Occurrence state comes from the one canonical mount item. A cross-side repeat has two side-specific
  accessible names but identical fitted/engineering/focused/power state.
- An occurrence is named by the same localized mount name feature 002's ledger row carries, resolved
  once through the package. The exact package slot key stays the machine identity everything
  exchanges and never becomes something a Commander is read.
- The document is laid on its side and cropped to itself. The Almanac draws every hull nose-up and
  centred in a 1200x800 box — an Anaconda occupies 292 of the 1200 units across — so a plate that
  rendered the file as shipped would stand the ship on end and fill most of the frame with empty
  air. Canvas 1c frames the hull lying down, nose to the left, in a box of the hull's own
  proportions. That is one `transform` and one `viewBox`, both arithmetic on the coordinates the
  package published: the paths themselves are written out unchanged.
- The plate is canvas 1c's `aspect-ratio: 720/292` frame, at that one ratio for every hull and in
  every state. A hull of other proportions sits centred in it, which is what the canvas's own
  `background-size: contain` does. **The frame is drawn before anything is fetched**, so the region
  reserves its height once and a schematic arriving late does not resize the anatomy and shove the
  fitting bench down the page mid-read. So the whole hull is always in view, a plate with less room
  draws the same whole hull smaller, and there is no pan, no zoom, no drag matrix, no coordinate read
  off the DOM and no stored pan model — which is how both canvases draw the plates, and it is why
  FR-012 says nothing pans rather than making panning accessible.
- **The plate has a width it does not grow past. Ruled 2026-08-26 (Commander request).** A plate's
  height is its width over that ratio, and the ratio is the one thing here that cannot move — the
  drawing's own `viewBox` is built to it, so a plate of any other shape would drift its marks off the
  hull. Tracks that took every pixel they were given therefore grew the whole block with the window:
  282px tall on canvas 1c's own 1560, 355px at 1920, 485px at 2560, which is more than half of a
  wide screen given to two drawings that were already finished at the first of those. The two tracks
  are now bounded at `--edsb-layout-anatomy-plate` and centred in whatever the column has beyond it.
  The measure is canvas 1c's own: its 862px centre column, less the block's inset and the gap between
  the plates, halved. Nothing moves at the width the canvas was drawn at, and past it the anatomy
  stops taking room the ledger and the bench can use.
- **The package SVG is never fetched.** It is ninety kilobytes of sub-pixel path data, and what a
  plate needs out of it is the drawing's box, the rectangle it draws in and the middle of every
  annotated mount — a few hundred bytes. Both halves are produced from the installed package at build
  time: `scripts/convert-ship-artwork.mjs` rasterises the pixels and
  `scripts/extract-schematic-mounts.mts` writes the mounts, using the application's own parser so the
  promise being checked and the geometry being written cannot drift. What a Commander fetches is a
  PNG and about a kilobyte of JSON, and the picture is drawn as one `image` at the package's own
  `viewBox` inside the same turned group the marks are placed from — so the hull and the marks over
  it cannot drift apart either.
- **The package contract moved to the build.** `svg`, `g`, `path`, `circle`, no script, no style, no
  reference, no foreign element: a file outside that fails the extractor by name rather than reaching
  a plate as a `contractDefect`. What can still go wrong at runtime is a deployment serving something
  that is not this build's own extract, and that is what the runtime validator refuses. This is not
  a private geometry catalogue: the extract records the digest of the file it was made from, and
  `pnpm run policy` fails if the installed package has moved past it (FR-009).
- The drawing's own ink is a near-black navy on a near-black plate, so the schematic takes its own
  filter: an additive lift rather than a multiplied brightness, which raises the structure to a
  legible step without blowing the package's seven bright feature hues out to white. **The filter is
  declared on an ordinary box around the drawing, not on a group inside it**, and the reason is a
  defect this repository cannot reproduce. The symptom reported was "on iPad OS the hulls are blue";
  unfiltered, the package's own ink is exactly that — a hull drawn in near-black navy over seven
  bright feature hues — and the reason a filter would not apply is that it was a CSS filter
  _function_ on an SVG container element, which WebKit declines. **The fix is confirmed on the
  device** (2026-08-26; `e2e/manual/results/webkit-filter.md`). What is confirmed is the plate: the
  hull draws amber there now. The mechanism is the explanation that predicted it rather than
  something measured here, which matters only if the symptom returns — the first thing to check is
  still which element carries the filter. Declaring it on a plain box removes the engine-dependent
  case rather than working around it; the marks and the leaders stay outside that box, where they
  keep the interface's own colours rather than being pushed through a lift meant for package ink.
  **No automated test guards it**: constitution principle VIII fixes the engine matrix at Chromium
  and Firefox, both of which apply the filter in either position, so a change moving it back would
  pass every check this project runs. The suites assert the fix's shape — that the filter's element
  is a plain box and the marks sit outside it — and `e2e/manual/webkit-filter.protocol.md` is what
  stands in for the rest.
- A side that has not arrived carries the hull illustration's own loading mark, in the place the
  drawing will be, with the words spoken rather than drawn. Prose in the frame and a hull after it is
  a plate that changes height when the fetch lands.
- Where the plates share a bounded column with feature 002's bench, the plates ask for the height
  their hulls need at that width and the bench takes everything else. A capability that stretched to
  fill the column and pushed the editor off it would have got its own priority backwards.
- A dashboard mode is the other case, and it is not bounded at all. Its height is whatever the build
  has to say rather than what a hull's proportions come to, so the region says all of it and the
  column outside releases to carry it (`specs/002-module-outfitting/design/outfitting-workspace.md`,
  "a detail panel is not bounded by the column"). It scrolled inside itself until 2026-08-26, which
  on a 1560 x 800 screen meant 224px of panel for 1053px of content, in a second scrollbar inside a
  column that already had one. The region reports which of the two it is showing — `isDashboard()`,
  drawn as the `anatomy--dashboard` host class — and that is the whole of what the column outside
  reads (Commander request 2026-08-26).

## Legend and visual language

The legend is the reference's, entry for entry: `SELECTED`, `FITTED`, `EMPTY`, `UTILITY`,
`ENGINEERED`, and uses the same localized words as the mounts' accessible names. Each entry draws the
treatment the mounts it explains draw, with one deliberate exception recorded below: `SELECTED` draws
the accent fill a selected hardpoint takes, and a selected utility fills in the cool hue instead.

The reference's node treatments are the mark's, not the package's own shapes: a fitted mount takes
the accent hairline, an empty one the dashed neutral hairline, a utility one the informational hue
the canvas gives `data-kind="util"`, a selected one the solid accent fill it gives `data-kind="sel"`,
and an engineered one the canvas's own engineering icon hung off the mark's top corner.

The fill and the hue compose rather than one replacing the other: **the fill says _selected_ and the
hue says _which kind_**, so a selected hardpoint is a filled amber square and a selected utility a
filled cool one. The canvas's `data-kind="sel"` is one treatment because the canvas selects a
hardpoint in it; a utility that went amber on selection would be the one place on the plate where
the kind of a mount stopped being legible, and the kind is what the legend gives its `UTILITY` entry
to. The legend's `SELECTED` swatch stays amber: it explains the fill, and the `UTILITY` entry
explains the hue. Neither distinction rests on colour — a mount's kind is a word in its accessible
name and its selection is `aria-pressed` and the marked ledger row.

The engineering icon needs no measurement: it is placed against the mark, which the plate positions,
and never against the package's drawing, which nothing measures (FR-003).

No colour, fill, stroke, dash, opacity, shape or animation carries meaning alone: every occurrence's
accessible name states its node number, its kind, its side, its fitted state and its engineering
state in words — the number first, because that is the one thing the mark draws and a name that does
not contain its own visible label fails SC 2.5.3.

The legend's fifth entry is the engineering icon itself, not a square: that is the mark the plates
hang off an engineered mount and the mark the ledger row draws beside an engineered module, and a
drawn square there explained something that appears nowhere.

## The mode strip

Canvas 1c sets a strip of five segments beside the `HULL ANATOMY` rule — `MOUNTS`, `POWER`,
`DRIVES`, `DEFENCE`, `OFFENCE` — selecting which layer is drawn over the plates. That strip is what
is built, at every width: all five in that order, as feature 011's `edsb-tab-group` in the same
segmented presentation the side selector uses, full width under the rule when the region is narrow
and at its own label width beside it when there is room. A caller may add segments after them, for a
panel this region does not draw; see "Divergence from canvas 1d — the sixth segment".

Canvas 1d's strip is **not** the same control, and the difference is recorded below.

`MOUNTS` is this capability's own layer. `POWER`, `DRIVES`, `DEFENCE` and `OFFENCE` are the same
plates read by features 005 to 008, and until one of those ships its segment is **disabled** rather
than opening a panel with nothing in it — a segment that switched to an empty layer would be this
capability claiming a reading of the hull that nothing has made. Features 005, 006 and 007 have
since shipped, so `POWER`, `DEFENCE` and `OFFENCE` open; `DRIVES` waits on feature 008. The open one is exposed as pressed
state as well as by the canvas's marker, so no segment's condition is carried by colour alone. A
disabled segment is never the filled one, whichever is selected: the fill says "this is the mode you
are in", which a segment nobody can reach is not, and disabled ink on it reads at 1.34:1.

Both canvases draw a segmented strip the same way, and it is not the way `edsb-tab-group` had been
drawing one since feature 011: one amber hairline showing between the segments, the chosen one filled
solid amber carrying the ground colour as its text, the rest on the quiet control surface. The
component was inverted — dark fill, amber text, a shadow and a rule under the strip — so the
correction is in the component rather than around it, and the same correction lands on the side
selector, which canvas 1d draws identically.

The strip is also drawn dense, and nowhere near the project's 44-pixel target
baseline: 23.5px beside canvas 1c's rule, 30px under canvas 1d's, 25px for 1d's side selector and
38px for canvas 1a's catalogue filter. At 44 it stops being a strip beside a heading and becomes a
band across the region. Flat leading inside a dense control's block padding asks for 22 and the
canvas draws 23.5; WCAG 2.2 SC 2.5.8's AA floor raises both to 24 — through the same
`DENSE_TARGETS` list the ledger's power chip and grade bar use. Twenty-four is where this stops:
the floor is not a waiver, and everything that is not a segment stays at 44.

The two canvases differ only in width: 1c sets each segment to its own label (`flex: none`) and 1d
shares a full-width strip between them (`flex: 1 1 0`). Growing each segment from its label width
rather than from zero is both at once — given no room to spare each is exactly its label, given a
full width they divide what is left over — so the shape follows from the width the region gives the
strip, which is `100%` under the rule and `auto` beside it at the same threshold that draws the
second plate. A segment never shrinks under its own label, which is what makes the scroller below the
answer to a line too short for five of them: shrinking is the other answer and it is not one. The
segments were shrinkable at first, and in German at a doubled text size `VERTEIDIGUNG` — one word,
with no space to wrap at — painted across `ANTRIEBE` beside it and took that segment's taps, a mode
nobody can reach swallowing one they can. For that to work at all the group must stop being a size container: an element with
inline-size containment does not take its width from its contents. The first attempt at this strip
declared a width instead, which is what that containment forces and what removing it avoids. The container query it had is replaced by a scroller that is always
there, because segments that share one line never wrap off it.

## Divergence from canvas 1d — the sixth segment

Canvas 1d draws six `.m-tab`s, not five: `MOUNTS`, `POWER`, `DRIVES`, `DEFENCE`, `OFFENCE` and
`STATUS`. It also ships six `data-m-mode` panels behind them, one per segment, and its `mounts` panel
holds exactly the plate, the `TOP`/`BOTTOM` selector and the legend — not the slot ledger, which 1d
draws below the whole switcher.

So the compact strip is a different control with a different scope: 1c's five segments choose which
layer is drawn **over the plates**, and 1d's six choose which **screen** the compact workspace is
showing, with the anatomy as one of them and feature 003's `BUILD STATUS` block as another. Feature
003 read the same thing and said so — that its Status tab "is the compact composition's own
arrangement of the same blocks", arriving "with the capability navigation it belongs to"
(`specs/003-ship-statistics/design/status-capability.md`).

That navigation is the compact workspace's, not this capability's. So this capability draws canvas
1c's anatomy-scoped strip at every width, borrows 1d's shape for it — full width, under the rule —
and does not decide what a sixth segment would open.

**Built 2026-08-26 — the segment is drawn, and it is a guest.** The strip now carries segments a
caller hands it: `guestModes` puts them after this region's own five, `modeChanged` reports which
segment is open, and this region draws **nothing** for one of them. Feature 002's compact workspace
passes `STATUS` and puts the status rail where the panel would have been. The two objections that
held it back are answered rather than overruled:

- _An invention at wide width._ The segment is passed only where canvas 1d draws it. At wide width
  the caller passes none, the strip is canvas 1c's five, and there is nothing for a segment to reveal
  because the rail is the third track of 1c's grid and already on screen.
- _Disabled, it would deny a reading the same screen is giving._ It is never disabled. It is offered
  exactly where it opens something.

What is still **not** done is this capability deciding what `STATUS` means, drawing feature 003's
blocks, or reaching for the rail. It carries a word and reports a press; the region that owns the
panel draws the panel.

## Divergence from FR-008 — the selected mount's facts

**What the reference draws.** Nothing. In `MOUNTS` mode canvas 1c ends at the legend and canvas 1d
ends at the legend; the next block in either file belongs to `POWER`. Selecting a node in the mock
does two things and only two: it marks the matching ledger row and it rewrites the fitting panel's
head to `FITTING · HARDPOINT n`.

**What was withdrawn.** A selected-mount facts block beside the plates. It would have restated the
slot key, size, module, engineering, priority and power of a mount whose row is marked and whose
bench is open six centimetres away — a second detail surface for one selection, which is the
“second editor” the reference review already refuses in a weaker form.

**What survives.** Feature 002's ledger row and bench are the mount's facts, at the same build
revision, in the same workspace. FR-008 is restated in those terms.

**Left open.** If features 005–008 later give the anatomy panel a per-mount readout in their own
modes, that readout belongs to the mode that owns the number, not to `MOUNTS`.

## Divergence from FR-004 and SC-003 — the unique mount list

**What the reference draws.** One list of mounts, in the ledger rail: canvas 1c's `HARDPOINTS` and
`UTILITY` categories over `.hp-row` rows in package order, each carrying size, node number, module,
engineering and priority. That list is feature 002's, and it is already built.

**What was withdrawn.** A second semantic list of hardpoints and utilities under the plates. It
would have been the same slots, in the same order, with the same facts, a screen-length below the
first — and every route it was meant to guarantee (a text equivalent for each mount, a target for
each mount, a route to a mount whose schematic never loaded) the ledger already guarantees, because
the ledger is complete and does not depend on artwork.

**What survives.** The ledger. Each schematic occurrence carries its own accessible name naming the
mount, its kind, its side and its complete state, which is the text equivalent SC-003 asks for at
the geometry itself; the ledger is the enumerable, order-stable one.

**Left open.** Nothing. FR-004 already names the complete slot list as the route to every slot.

## Divergence from FR-005 and the legend — mount power

**What the reference draws.** In `MOUNTS` mode, five legend entries: `SELECTED`, `FITTED`, `EMPTY`,
`UTILITY`, `ENGINEERED` (canvas 1c; canvas 1d drops `SELECTED` and `ENGINEERED` for width). Power is
a different mode — `data-anat-layer="power"` draws `P1`/`P2`/`OFF` over the same plates — and that
mode belongs to feature 005.

**What was withdrawn.** Powered, shed, disabled, inactive-while-retracted and not-applicable
treatment on mounts in `MOUNTS` mode, and the six power entries in its legend. Feature 010 therefore
consumes no power observation and defines no port.

**What survives.** The five states the reference draws. Fitted, empty, engineered and focused are
what a mount shows here; power is what it shows in feature 005's mode.

**Left open.** Feature 005 owns the `POWER` mode over these same plates, and the occurrence
component takes its state from one immutable view so a second mode is a second view, not a second
renderer.

## Divergence from FR-011 — artwork provenance

**What the reference draws.** `HELP & FAQ`, once, in canvas 1d's application menu. No provenance or
help control appears on the anatomy panel in either canvas.

**What was withdrawn.** A provenance action in the anatomy heading. Feature 010 emits no help intent
and hard-codes no route.

**What survives.** Feature 012's help capability, which owns artwork provenance and media terms for
the whole application. FR-011 is restated in those terms.

**Left open.** Until feature 012 lands there is no provenance surface at all. That is a gap in
feature 012's delivery, not a reason for feature 010 to draw a control the design does not have.

## Marks that would touch

**What the reference draws.** Nodes laid on the hull where the hull puts them, and nothing else.
Canvas 1c's Anaconda has its closest pair about five pixels apart at the plate size the canvas
draws, and the mock simply lets them sit on each other: it is one still picture of one hull, and the
number underneath does not have to be read.

**What the built screen has to answer.** The same overlap, on ninety-six hulls, with a number in
every square that a Commander is expected to match against a ledger row. Bringing the worked-with
mark to the front — which the plate does, and which "Divergence from FR-012" records — answers the
pointer half of the problem and none of the reading half: whichever mark is behind is still a sliver
with half a digit on it.

**What is drawn instead.** A mark that would touch a mark already placed steps aside, and a hairline
runs from it back to the point the package published. Three rules keep that from becoming invented
geometry:

- **The anchor never moves.** What is displaced is the _mark_ — the canvas's own square, this
  application's drawing over the package's — and the far end of the leader is the middle of the
  package's own annotation. The mount's real position stays on the plate; it stops being _underneath_
  the mark and starts being _pointed at_ by it.
- **Nothing is measured.** The step is arithmetic over the coordinates the package published and the
  plate's own frame, in `src/app/domain/anatomy/mount-declutter.ts` — the same kind of arithmetic
  that turns the hull and centres it in the frame. There is no `getBBox`, no `getScreenCTM` and no
  read off anything rendered (FR-003).
- **The plate measures how big its own marks came out, and nothing else.** This is the part that was
  got wrong first and is worth stating carefully. The mark is `clamp(0.875rem, 3.06cqw, 1.375rem)`:
  its middle term is a share of the plate, but its floor is an absolute length, so once a plate is
  narrower than about 457 CSS pixels the mark stops shrinking and its share of the frame _grows_ as
  the frame narrows — without bound, and faster still at enlarged text. The first implementation used
  a fixed 5.5% of the frame and was documented as "the widest share a mark ever takes", which is not
  a thing that exists. Below about 255 pixels of plate, or at 200% text, it believed marks were
  further apart than they were drawn and separated nothing at all — at 320-pixel reflow and doubled
  text, which are both requirements. So the plate now measures its frame and one mark through
  `ElementSizeAdapter` and passes the real fraction in. Those are CSS facts about this application's
  own boxes, not facts about the hull: no mount position is read through them, and the anchors are
  still the package's own coordinates. The cost is that one hull is no longer one arrangement — a
  plate that crosses a size threshold re-settles its marks — and that is the trade, because marks
  that hold still and overlap at the sizes an accessibility requirement names are worse than marks
  that move when the window does. The floating-point tolerance in the module is separate and smaller:
  a candidate placed at exactly one separation must not then read as being under it.

**Every mount in a crowd moves, and each moves the same distance.** Mounts whose marks would touch
are gathered into one group — transitively, because a chain of three each too close to the next is
one problem and not two — and the whole group is spread onto a ring around the middle of those
mounts. Each member keeps its own side of the crowd, so a mount on the left stays on the left and no
two leaders cross.

The alternative, and the first thing built, was to pin the first mount and push the others off it.
That is worse in two ways. It makes the answer depend on the order the package happened to draw the
mounts in, which is not a fact about the ship. And it leaves the pinned mount as the only member of
the crowd with no leader — which reads as though that one mount were exactly where its mark is and
its neighbours had been guessed at, when all of them are equally approximate. A ring says what is
true: these mounts are too close together to draw apart, so here they all are, each tied back to its
own point.

**A ring is turned to where its own mounts point if it possibly can be, and to where there is room
if it cannot.** The turn that lines the ring up with the mounts — each member on its own side of the
crowd — is where a crowd sits when nothing is around it, and it is the arrangement a reader expects:
the mark for a mount on the left goes left, the mark for one above goes up. It is asked for first,
at every radius on the ladder, and taken as soon as one will hold it.

That the aligned turn has to be asked for _across the whole ladder_ is the correction of
2026-08-26. Searching turn-by-turn at one radius and growing only when none fits looks equivalent
and is not: a crowd in the middle of a hull is blocked in the aligned direction by the very mounts
it sits between, while a turn a quarter-circle away is free, so the search settles at the first
radius on a turn that points nowhere in particular — and because room outranks closeness to the
aligned turn, the radius that _would_ clear the obstruction is never asked for.

The Corsair's top plate is the case. Its `LargeHardpoint1` sits on the centreline just ahead of two
mirrored pairs, and the aligned ring sends that mark forward along the hull's own axis, which is
where the eye looks for it. That ring is refused at the first fitting radius, because at that radius
the mark lands between the two hardpoints ahead of it; one more rung of growth clears them. Before
the correction the crowd settled a quarter-circle off — node 1's mark went down, node 4's went up
and across the hull, node 5's went right — and _which_ quarter-circle was decided by a room
difference of under two thousandths of a frame unit, an artefact of the package's own rounding of
two mirrored mounts. A re-export could have flipped it. Now node 1 goes forward, node 4 up and node
5 down, and nothing about that rests on a rounding error.

Where no radius will hold the aligned turn, sixteen turns of the ring are tried and the one that
leaves the most room wins — room measured for the leaders as well as the marks, because a mark can
land in clear air and still have been reached by a line drawn across two of its neighbours. The
slots are still handed out in the members' own angular order whatever the turn, which keeps a crowd's
marks in the same cyclic order as its mounts — **but that is not enough on its own to stop two of its
leaders crossing**, and believing it was is what let the Corsair's nodes 4 and 5 make an X at any
plate wider than about four hundred pixels. Cyclic order holds the crossing off only while the ring
sits where the mounts point; turn a pair far enough and the two swap sides, each mark ending up
across the crowd from its own mount. So a candidate ring is refused outright if any two of its own
leaders cross, and a ring that would cross a line already on the plate is ranked below one that
would not — before room is even compared, because a line through a line is a defect a reader sees
first.

That question is asked twice. A crowd placed first cannot see the marks of crowds not yet placed, so
it can choose a side that a later one then fills, or run a leader across a mount that is about to
move; a second pass re-asks with the whole plate visible. It is what the Corsair needed, and it is
also what raised the shipped package's shortest visible leader from under a pixel to ten.

**The ladder is climbed in small rungs, because the ladder is what decides whether the aligned turn
is reachable at all.** This is the correction of 2026-08-26, and it is the second half of the
Corsair's story above. Every rung is a multiple of a floor computed from the separation the plate
asked for, and that separation moves with the plate's own width — so a coarse ladder tries a
_different set of radii_ at every width. The rung that clears the two hardpoints blocking node 1's
aligned turn exists at one plate width and is stepped straight over at the next, and where it is
stepped over the room-scored search takes the arrangement instead and turns the ring wherever the
plate has space. The two answers are a quarter of the ship apart. Measured on the Corsair's top
plate before the correction, node 1's mark crossed the hull between 180 and 185 CSS pixels of plate,
crossed back at 190, and again at 245, 250 and 255 — the drawing reshuffling itself while a
Commander resized their window _(Commander request 2026-08-26)_. Twenty rungs of about a twelfth
reach the same distance eight rungs of a quarter did, and the aligned answer is reachable at every
width instead of at some of them. Eight more rings of a dozen marks is nothing to compute.

**Between arrangements that separate their marks equally well, the one that moved them less wins.**
The search tries the requested separation and then retreats from it, and used to keep whichever
attempt separated its marks best by the barest margin. That made the choice a knife edge for the
same reason: a hundredth of a frame unit decided it, and the attempts differ in the _turn_ their
rings take as well as in their radius. So a spread now has to be two per cent roomier to win on
room, and spreads inside that band are settled by total travel. Both halves move smoothly with the
plate's width, which is what stops a small change in the request choosing a wholly different
picture — and of two equally legible arrangements, the truer one is the one that stayed nearer the
mounts it is a drawing of.

A ring must also clear every published mount position that is _not_ in the crowd, **and the ring
grows until it can**. Without the first half a mark can come to rest exactly where a different mount
is, so a reader sees a numbered square sitting on mount B carrying mount A's number while A's leader
runs off elsewhere — the precise failure the leader exists to prevent, committed by the thing meant
to prevent it. It happened on two plates before the rule existed. Without the second half the rule
does its job and costs the crowd its direction: the Corsair's node 1 was turned aside by exactly
this clearance, when growing the ring one rung would have carried it past the obstruction on the
turn it wanted. Inside a crowd the question does not arise the same way: the mounts are
piled together by definition and the marks are arranged around them, which is what each member's own
leader is there to tell apart.

**Two numbers, and they are deliberately not the same one.** _Whether_ two marks need help is a
question about whether they are touching — a quarter of a mark's width of air, below which two
squares read as one shape with a seam down it. _How far_ to spread them once they do is a question
about whether the leader explaining it can be read, and the answer is larger: a mark's own square
covers half a mark's width of its leader, so a mark that shifts less than that draws nothing at all,
and the ring is therefore pushed out past the furthest mount in the crowd and then a further mark and
a quarter beyond it. Answering both with one number was the first attempt, and it did both jobs
badly — it spread pairs that had eleven pixels of air between them by four pixels each, inventing a
problem on one plate while explaining nothing on another. Held apart, the shipped package's shortest
leader is ten and a half pixels of visible line, and no plate moves a mark that was not crowded.

Where a plate has no room for the roomier answer, the smaller one is taken rather than nothing: a
crowd that would otherwise stay stacked is spread by whatever separates its marks, even if its
leaders are then too short to read. That order matters and was got wrong once — refusing to move a
crowd whose leaders could not be legible kept the overlap this exists to remove, for the sake of a
line nobody could have seen anyway. It shows up at doubled text on a phone, where the Anaconda's
underside is eight twenty-eight-pixel marks on a two-hundred-and-twenty-eight-pixel plate. Only when
even that will not fit does a crowd keep its mounts' own positions, and the front-on-hover rule
answers the overlap.

Measured across the shipped plates at plate widths from two hundred to seven hundred and
twenty pixels: no mark ends outside its frame, and no pair of marks is left covering more than half
of the other, at any of those widths or at doubled text on a phone. **Re-measured after the
aligned-first correction of 2026-08-26**, over every shipped plate at six widths from two hundred
and eighty to a thousand pixels: the same number of marks is displaced as before it, no leader
crosses another, no mark leaves its frame, and the tightest pair on any plate is where it was. The
correction changes which way a crowd faces, not how much it has to move. From three hundred pixels of
plate upward — every width the two-column and single-plate arrangements actually give — **no two
leaders cross**, and the shortest visible leader runs from ten to sixteen pixels. Below about two
hundred and fifty pixels the separation-only fallback takes over: a handful of leaders cross there
and some are shorter than the marks they leave, which is the honest floor of a plate that small.
Thirteen leaders graze the edge of another mark at the two-column width, all on plates carrying nine
or ten mounts where every direction out of a crowd is already somebody's.

**What the leader is not.** It carries no _mount state_: kind, fitted, engineering and side are all
words in the button's own name, selection is `aria-pressed` and the ledger row, and the line is one amber
whatever the mount is. It is `aria-hidden` for that reason, not because it means
nothing — it plainly means something, which is _this mark belongs to that point_. What makes it
decoration is that the point was never information a Commander had to have. It is also not a
convergence line, a range or any other assertion about the ship — it is one segment between a mark
and the anchor that mark belongs to.

**Left open.** Three things, all real.

**Full separation is not achievable at every size.** At 200% text on a phone the Anaconda's underside
is eight twenty-eight-pixel marks on a two-hundred-and-twenty-eight-pixel plate, and no arrangement
that keeps a mark anywhere near its own mount separates them all. What the search guarantees there is
weaker and still worth having: no mark loses more than half of itself, so every number can be read
and every square's own edge found. The complete ledger is the equivalent that does not degrade.

**A leader can still graze another mark.** Thirteen of them do, on the four densest plates in the
package — nine or ten mounts each, where every direction out of a crowd is already somebody else's.
The turn search picks the roomiest arrangement available rather than a clear one, because on those
plates there is no clear one. What it has removed is the case that reads as a mistake: a line running
the length of the hull across two other numbers. What is left clips a corner.

**A leader's far end is a bare point.** The line is trimmed to its own mark's edge — the part inside
an opaque square is not on screen, and half a mark's width of every leader is inside the mark it
leads to, so trimming is what makes the drawn segment all visible. The other end carries nothing: the
mount's published position is the package's own annotation, under the interface's filter. In a dense
crowd the members' anchors sit close together in the middle of the ring, so which line ends on which
mount is read from the line rather than from anything drawn at its end.

**A mark's position is a sighted-only cue**, which is not new and not load-bearing: a mount's
position on the hull was never exposed to assistive technology, and feature 002's ledger is the
enumerable equivalent SC-003 asks for. It is the reason the leader can be decoration without anything
being lost.

## Divergence from FR-012 — the size of a mount target

**What the reference draws.** Nodes of 14 to 30 CSS pixels, laid on the hull where the hull puts
them. On canvas 1c's Anaconda the closest pair sits about five pixels apart at the plate size the
canvas draws.

**What was withdrawn.** A target size on a schematic mount — the project's 44-pixel baseline and
SC 2.5.8's 24-pixel minimum both. Neither is reachable, and neither is the criterion's spacing
exception. The Almanac draws real mounts closer together than any mark is wide: the Anaconda's two
small hardpoints are **six CSS pixels apart** on the plate two columns have room for, and the
canvas's own mark is fourteen. A mark large enough to pass would sit on top of its neighbour and
take that mount out of reach entirely. Widening the gap between the _marks_ is what "Marks that would
touch" above now does — which moves this application's own squares and not the package's geometry,
and is why FR-012 was amended rather than FR-003 bent.

**What survives.** Two things, and they are what FR-012 is actually for.

First, every mount is separately operable at every plate size — from the keyboard, where each mark is
its own stop in its own order and nothing can be in front of anything. Marks that would touch now
step aside and are tied back to their mounts ("Marks that would touch" above), which removes most of
the overlap outright; where a plate is too small for any arrangement to separate them, the mark being
pointed at, moved to or currently selected comes to the front, so whichever mount a Commander is
working with is the whole square rather than the sliver its neighbour left uncovered. That is the edge case the specification states — "nearby or overlapping mounts remain
separately operable" — and `keeps nearby mounts separately operable` in `e2e/hull-anatomy.spec.ts`
walks every drawn mount to prove it.

Second, the size criterion is met by the **Equivalent** exception WCAG 2.2 SC 2.5.8 provides: the
function is available through another control on the same page that does meet it. Feature 002's
complete outfitting ledger stands beside the plates, carries every one of these mounts at the full
44-pixel baseline, in package order, whether or not the artwork arrived. The exception is only a
claim until it is checked, so `expectEquivalentControls` in `e2e/accessibility/assertions.ts` proves
it for every drawn mount in all ten projects. Axe cannot check an Equivalent, only the size minimum
and the spacing exception, so `EQUIVALENT_TARGETS` in `e2e/accessibility/axe.ts` answers
`target-size` on these nodes and on no others — node by node, never rule by rule, so the rule stays
enabled for every other control on every page.

**Left open.** Nothing. A hull whose plate is large enough to separate its marks meets the criterion
outright; the exception costs nothing when it is not needed.

## Two-way movement

- Activating an occurrence emits only the canonical slot key to feature 002's existing selection.
- A selected located slot marks every occurrence of that key as selected. Where one side is shown,
  the shown side becomes a side that contains the slot — the current side if it already does,
  otherwise top before bottom.
- Nothing scrolls: the whole plate is in view, so revealing an occurrence is marking it.
- Selecting an internal or currently unlocated slot leaves the ledger and bench as they are and
  marks nothing on the plates.
- Geometry and ledger expose the same selected state; a locale or side change creates no build or
  history revision.

## Loading, failure and defect states

| State                                   | Presentation and behavior                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Both loading                            | Two named placeholders, or the shown side's placeholder; the complete ledger stays usable  |
| One ready, one loading                  | Render ready side immediately and preserve peer pending text                               |
| One temporarily unavailable             | Side-local explanation and retry; ready peer, ledger and editor unchanged                  |
| Both temporarily unavailable            | Named explanations/retries; no claim that the hull lacks geometry                          |
| Uncached offline                        | Temporary wording plus automatic online retry; no reload required                          |
| Invalid/unsafe SVG                      | Reject the side and state it as a package defect; never inject markup                      |
| Unknown/wrong-kind annotation           | Omit the occurrence and keep the ledger slot; the package audit under `ng test` reports it |
| Same-side duplicate                     | Omit ambiguous duplicate occurrences rather than choose by drawing order                   |
| Missing geometry after both valid sides | Nothing is drawn for that mount; its ledger row is unchanged and remains its route         |
| Selected internal slot                  | Nothing marked on the plates; the ledger and bench remain selected                         |

Initial and unchanged availability is silent. A side that fails or recovers produces one localized
announcement rather than one per occurrence; selection is announced by feature 002, which owns it.

The reference draws no loading, failure or defect state for its plates — it draws one hull that is
always there. These rows are the honest-state floor the application already applies to feature 001's
hull illustration, which the canvases likewise draw as always present: a plate that cannot show its
document says so in words, in place of the document, and nothing else on the screen changes.

## Component-system impact

Feature 010 adds one presentation component to the outfitting set feature 002 established in
`src/app/ui/outfitting/`: the schematic plate, which renders one validated document, its mount
occurrences, the leaders to any mark that stepped aside, and its side-local status. It works out each
mount's anchor itself — the same arithmetic that turns the hull — and hands those anchors to
`src/app/domain/anatomy/mount-declutter.ts`, which decides which marks step aside: a pure function
over published coordinates, testable without rendering anything (constitution III). The one thing it
needs a browser for, how wide its own frame and its own marks came out, comes through
`ElementSizeAdapter` in the platform layer. The side selector reuses feature 011's `edsb-tab-group` in
its segmented presentation, and the legend is five static rows in the capability's own template.

The plate accepts immutable view state, emits a typed slot intent, owns its own semantics and its
mount targets, and reads no `ShipLoadout` and no store — it takes a view and resolves its own
words.

## Requirement mapping

The schematic regions own FR-001–FR-003, FR-005–FR-007, FR-009, FR-010 and FR-012. Feature 002's
complete ledger and bench own FR-004 and FR-008 and supply the invariant all-slot fallback for
FR-006 and FR-010. Feature 012's help capability owns FR-011.
