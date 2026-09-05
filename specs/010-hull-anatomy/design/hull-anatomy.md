# Screen Definition: Hull Anatomy

## Purpose and parent

Hull Anatomy is a capability inside feature 001's active `/outfitting` workspace. It lets a Commander
locate and select both weapon hardpoints and utility mounts on Almanac top/bottom schematics, inspect
their exact current state and move to/from feature 002's outfitting slot. It adds no route and is not
available without an active build.

## Information order

Canvases 1c and 1d draw the capability in one order, and it is stable across all layouts:

1. the localized `HULL ANATOMY` heading;
2. the labelled schematic regions — both sides where the workspace composes more than one region and the
   block has room in both axes, one side and its `TOP`/`BOTTOM` selector otherwise; and
3. the mount state legend.

That is the whole capability. Feature 002's ledger and bench stand beside it in the same workspace
and carry the selected mount's facts, which is why nothing below repeats them.

Visual columns never reorder this reading sequence.

## Responsive composition

### Paired

Canvas 1c's `grid-template-columns: 1fr 1fr`: top and bottom render as two fluid labelled plates
sharing one selected state and one legend, and the side selector is not drawn because both sides are
already shown. Drawn where the workspace around this block composes more than one region, the block
has the inline size for two plates at the width one plate is drawn at, and the window is not a short
one — all three, for the reason "Intermediate tablet" gives below. The complete ledger
remains beside the capability according to the feature 002 workspace definition.

### Intermediate tablet

Available space chooses paired or single-side presentation, not a named device breakpoint: two
container queries — the room this block was given, and the arrangement it was given that room inside
— and one media query for the only thing no container knows, the window's height. A `font-size` set
on the root element moves the two container questions and not the height one, for the reason
`responsive-composition.md` gives. Nothing required disappears in either orientation: the side selector reaches whichever plate is not drawn, and the complete ledger
reaches every mount on both.

**The room the pair asks for is two plates at the width one plate is drawn at.** A plate is bounded
and centred, below, and that bound does not change when a second plate joins it — so the second plate
arrives beside a first one that is already the size it will stay. Below the step the block draws one
plate at the bound; above it, two. The step is 74.075rem of block, which is 1185 CSS pixels at the
default text size and twice that at doubled text, and in the wide composition it is reached at about
1883px of window. No shipped test profile is that wide, so the pair is an arrangement for a large
desktop and nothing narrower (Commander request 2026-08-31).

**The pair also needs the height, ruled 2026-08-30 (Commander request).** Inline size alone chose
between the two arrangements once, and inline size alone cannot tell a wide screen from a shallow
one. A window with 1185px of block and 480px of height would draw two plates taller than the window
holding them, which is the one screen a pair should never be on. So the height is asked as well, as a
media query, because it is the only part of this decision no container knows.

**And the workspace has to compose more than one region, ruled 2026-08-31 (Commander request).** The
container's inline size answers how much room this block was given. It cannot answer what it was
given that room _inside_, and the two once had opposite answers two pixels apart: 742px was one
column of a three-region page and 744px a single-flow window entire, so a portrait tablet drew both
sides of the hull in the middle of a single flow.

What is asked is the workspace's own container, at the seam this workspace already stops being one
flow at (`_responsive.scss`, `$outfitting-regions-min`, `layout.outfitting-regions`). One
declaration, asked from every side of it: the workspace lays its regions out at that step, and the
regions inside it ask whether they are one of several or the whole flow. They cannot disagree,
because there is nothing to keep in step. Not the page — the seam has to move with a root
`font-size` and a page media query's `rem` does not, which `responsive-composition.md` sets out once
for every region that has this choice to make.

This condition cannot fire on its own. The room step above sits over the 47rem seam it asks at, so a
block with room for two whole plates is by arithmetic a block inside a workspace of more than one
region, and the 744px window is refused for its room before this is consulted. It is kept because it
is not the same statement: the room step is the plate's bound doubled and moves whenever that bound
moves, while this one says what arrangement the pair belongs to, and a bound halved one day would
reopen exactly the case it was ruled on.

The pair is therefore drawn where all three hold: the **workspace composes more than one region**,
the **container has the inline size for two plates at the width one plate is drawn at**, and the
**window is not a short one**. Each asks about a different thing — what arrangement this block is a
part of, how much room it was given inside it, and whether the screen has the height to read a pair
at all. Below any of them the block is canvas 1d's: one labelled side and the `TOP`/`BOTTOM`
selector. No single flow draws both sides of a hull, in either orientation, at any height or any text
size.

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
base and the roomy one is stated with the two-plate arrangement, under the same three conditions the
second plate opens under. Read the other way round, a one-plate block stood 8px further in than
every other band the narrow screen stacks it among, and a reading inside `POWER & THERMALS` did not
line up with a mount name in the ledger below it — which is the misalignment reported that day.

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
- **A plate has a width it does not grow past, and it is the same width alone or paired (Commander
  requests).** A plate's height is its width over that ratio, and the ratio is the one thing here that
  cannot move — the drawing's own `viewBox` is built to it, so a plate of any other shape would drift
  its marks off the hull. A track that took every pixel it was given therefore grew the whole block
  with the window: the block stands 282px tall on canvas 1c's own 1560, 355px at 1920 and 485px at
  2560 — a plate of 164, 237 and 367 with the header and legend around it — which is more than half
  of a wide screen given to drawings that were already finished at the first of those. Every plate is
  bounded at `--ednb-layout-anatomy-plate` and centred in whatever the block has beyond it.

  The measure is canvas 1c's own — its 862px centre column, less the block's inset and the gap
  between the plates, halved — plus two fifths, which is 566px a plate against the canvas's 404. The
  canvas's own figure alone held two hulls on a 2560 screen to a schematic a Commander has to lean
  into.

  **The second plate is drawn where a second plate fits at that width, and not before.** A threshold
  of 41rem of block leaves 18.8rem a plate once the pair's inset and the gap come off — under the
  20rem below which a hull is too small to aim at, which is what it was meant to be. And from there
  up to about 1185px of block the pair is two drawings _smaller than the one drawing it replaces_: at
  the 1440px desktop the block is 742px and a pair is 344px a plate, where one plate is drawn at the
  566px bound. Crossing such a threshold makes the hull shrink, which is the opposite of what a wider
  window is for (Commander request 2026-08-31). So the threshold is the bound doubled, with the gap
  between the plates and the pair's own inset: `2 × 35.35rem + 0.625rem + 2 × 1.375rem`, or
  74.075rem. Below it the block draws one plate at the bound; above it, two, and neither is smaller
  than the one it joined.

- **The package SVG is never fetched.** It is ninety kilobytes of sub-pixel path data, and what a
  plate needs out of it is the drawing's box, the rectangle it draws in and the middle of every
  annotated mount — a few hundred bytes. Both halves are produced from the installed package at build
  time: `scripts/convert-ship-artwork.mjs` rasterises the pixels and
  `scripts/extract-schematic-mounts.mts` writes the mounts, using the application's own parser so the
  promise being checked and the geometry being written cannot drift. What a Commander fetches is a
  PNG and about a kilobyte of JSON, and the picture is drawn as one `image` at the package's own
  `viewBox` inside the same turned group the marks are placed from — so the hull and the marks over
  it cannot drift apart either.
- **The plate keeps three of the package's feature highlights.** The package fills nine categories
  of feature in their own hues. The raster keeps `hardpoint`, `utility_mount` and `canopy`, and
  draws the rest with the fill removed, as the outlines the package strokes them with. The plate is
  a map of the mounts a Commander can fit, and the canopy says which end of the hull is the front.
  An engine bell, thruster, heat vent, landing-gear bay, cargo hatch or fighter bay answers no
  question the plate asks, and a filled one competes with the marks drawn over it. A plate keeps
  whichever of the three its side draws: the canopy is on every top view and on no bottom view. The rule is in the
  raster and nowhere else: no coordinate moves, and the extract still reads the package's own file
  (`contracts/schematic-assets.md`, "Feature highlights in the raster").
- **The package contract moved to the build.** `svg`, `g`, `path`, `circle`, no script, no style, no
  reference, no foreign element: a file outside that fails the extractor by name rather than reaching
  a plate as a `contractDefect`. What can still go wrong at runtime is a deployment serving something
  that is not this build's own extract, and that is what the runtime validator refuses. This is not
  a private geometry catalogue: the extract records the digest of the file it was made from, and
  `pnpm run policy` fails if the installed package has moved past it (FR-009).
- The drawing's own ink is a near-black navy on a near-black plate, so the schematic takes its own
  filter: an additive lift rather than a multiplied brightness, which raises the structure to a
  legible step without blowing out to white the feature hues a plate keeps. **The filter is
  declared on an ordinary box around the drawing, not on a group inside it**, and the reason is a
  defect this repository cannot reproduce. The symptom reported was "on iPad OS the hulls are blue";
  unfiltered, the package's own ink is exactly that — a hull drawn in near-black navy over the
  bright hues of its feature layers — and the reason a filter would not apply is that it was a CSS
  filter _function_ on an SVG container element, which WebKit declines. **The fix is confirmed on the
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
  a plate that changes height when the fetch lands. It is the shared waiting mark, so one file holds
  what the mark is and how it behaves for a Commander who asked for less motion (011/FR-029).
- A side has arrived when its geometry has. The mark stands for that request and ends with it. The
  drawing is a second request, and the plate does not wait on it: waiting would mean reading the
  picture's own `load` event, and a plate that never hears one has no way back — it would say the
  hull is on its way, with every mount hidden under it, for the rest of the session. A picture that
  fails is the plate's own unavailable state, as it already is.
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
is built, at every width: all five in that order, as feature 011's `ednb-tab-group` in the same
segmented presentation the side selector uses, full width under the rule when the region is narrow
and at its own label width beside it when there is room. A caller may add segments after them, for a
panel this region does not draw; see "Divergence from canvas 1d — the sixth segment".

Canvas 1d's strip is **not** the same control, and the difference is recorded below.

What the two canvases do share is the segment, on two different insides: `padding: 7px 12px` on
canvas 1c's strip and `10px 3px` on canvas 1d's, on the same six labels. That is the difference
between a strip sized by its own labels and a strip dividing 362px between six of them, and it is not
cosmetic — at the wide canvas's inside the six want 376px, so the phone drew a horizontal scrollbar
under the strip for the fourteen pixels it was over (Commander request 2026-08-26).

The narrowing lives in `ednb-tab-group`, under the compact viewport query, because the phone artboard
draws _every_ one of its segmented strips on that inside — this one, the side selector under it, the
priority groups in feature 005's panel. It is a viewport query and not a container one on purpose:
the question is which artboard is being drawn, not how much room this strip was given. The second
question is the one the component's own scroller answers, and it still does where even the tight
inside will not fit. What does not vary either way is the invariant — every segment shows its whole
label and clears the 24px target.

`MOUNTS` is this capability's own layer. `POWER`, `DRIVES`, `DEFENCE` and `OFFENCE` are the same
plates read by features 005 to 008, and until one of those ships its segment is **disabled** rather
than opening a panel with nothing in it — a segment that switched to an empty layer would be this
capability claiming a reading of the hull that nothing has made. Features 005, 006 and 007 have
since shipped, so `POWER`, `DEFENCE` and `OFFENCE` open; `DRIVES` waits on feature 008. The open one is exposed as pressed
state as well as by the canvas's marker, so no segment's condition is carried by colour alone. A
disabled segment is never the filled one, whichever is selected: the fill says "this is the mode you
are in", which a segment nobody can reach is not, and disabled ink on it reads at 1.34:1.

Both canvases draw a segmented strip the same way, and it is not the way `ednb-tab-group` had been
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

**The region closes against a guest's panel (2026-08-28, Commander request).** Drawing nothing is not
the same as ending: the region kept the inset under its own four panels and the workspace kept the
gap it puts between bands, so a Commander opening `STATUS` found a band of empty ground between the
strip and `BUILD STATUS` that no other segment has. A guest segment is marked on the host
(`anatomy--guest`), which is what lets the region end at the strip: the inset under an absent panel
goes, and the region takes back the band the workspace would put after it. What is left between the
strip and the guest's panel is the spacing this region already puts between the strip and its own
panels — so every segment opens the same way, whoever draws what is under it.

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

**Left open.** Nothing. FR-004 already names the complete slot list as the route to every slot it
draws.

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

**What is drawn instead.** A mark that would cover a mark beside it steps aside far enough to clear
it, and a hairline runs from it back to the point the package published. Three rules keep that from
becoming invented geometry:

- **The anchor never moves.** What is displaced is the _mark_ — the canvas's own square, this
  application's drawing over the package's — and the far end of the leader is the middle of the
  package's own annotation. The mount's real position stays on the plate; it stops being _underneath_
  the mark and starts being _pointed at_ by it.
- **Nothing is measured.** The step is arithmetic over the coordinates the package published and the
  plate's own frame, in `src/app/domain/ships/anatomy/mount-declutter.ts` — the same kind of arithmetic
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
  `ElementSizeAdapter` and passes two fractions built from them: the mark's own share of the frame,
  which is what keeps a square inside the plate and off a mount that is not its own, and that share
  plus a quarter, which is the separation. Those are CSS facts about this application's
  own boxes, not facts about the hull: no mount position is read through them, and the anchors are
  still the package's own coordinates. The cost is that one hull is no longer one arrangement — a
  plate that crosses a size threshold re-settles its marks — and that is the trade, because marks
  that hold still and overlap at the sizes an accessibility requirement names are worse than marks
  that move when the window does. The floating-point tolerance in the module is separate and smaller:
  a candidate placed at exactly one separation must not then read as being under it.

**Marks push apart; they are not sent anywhere.** The whole placement is one rule. Every mark starts
on its own mount. Any two closer than one **separation** — the distance below which two squares of
the drawn mark size overlap, measured on the wider of the two axes between them, which is a mark's
own width plus a quarter for air — push each other apart along the axis that takes the least movement
to clear, each giving way by half; every mark is then drawn back towards its own mount by a fraction
of whatever it has been pushed. That runs for a fixed number of rounds, by which point the
arrangement has stopped changing, and what is left is the nearest arrangement to the hull's own that
no longer covers a number with a number.

Where the two axes are equally short the rule takes the first of them, and where a pair sits on one
point it takes the first direction on that axis. Both are arbitrary and both are arithmetic on the
inputs, which is what the case needs: the package draws no two mounts on one point, and a plate
handed them anyway has to answer something.

Four properties come out of that rule rather than being asked for on top of it, and they are why it
is the rule.

**A mark moves as little as the plate allows.** There is nowhere for a mark to be sent, so there is
no distance to choose and no destination to prefer — only the shorter way out of an overlap. The
furthest any mark travels on any shipped plate, at any width from 280 to 900 pixels, is one and a
fifth of its own width, and one and a half with the text doubled.

A mark touching nothing does not move at all. Two things can make a mark touch something: another
mark, and another mount's published point, which the paragraph below explains.

**Mounts the hull mirrors get marks the plate mirrors.** Pushes are symmetric and are all applied at
once, so a pair of mounts the package draws as mirror images of each other stays a mirror image
through every round of the settling. Nothing is placed before anything else and nothing is placed
_against_ what was placed already. That is the whole of what the Mandalay needs: it draws two mounts
above its centreline and their twins below, and a rule that answered one pair against mounts that had
not moved yet put one pair in the middle of the wing and left the other on its mounts (Commander
request 2026-08-31).

**No leader runs across a number that is not its own.** A line can only be as long as its mark
travelled, and its mark travels only as far as it takes to stop covering its neighbour — so a leader
long enough to reach a third mark cannot arise. The Corsair's top plate is the case that showed it:
its foremost large hardpoint sits on the centreline between two mirrored pairs, and a rule that sent
that mark forward along the hull's own axis left it a quarter of a ship from its mount with its
leader threaded between node 2 and node 3 (Commander request 2026-08-31). Here the same mount does
not move at all — it is pushed equally by the mounts above and below it, the two of them step apart
instead, and all three squares sit on the mounts they belong to.

**One hull at one plate size is one arrangement.** The settling is arithmetic over the anchors, the
frame and the two measured fractions, in a fixed number of rounds and a fixed order, so the same
inputs give the same marks every time. It also holds still as a window is dragged: over the same
eleven widths, no mark in the shipped package changes which side of its mount it sits on as the plate
is resized, and five do with the text doubled. That steadiness is what a Commander asked for on
2026-08-26, and it comes out of the rule rather than being tuned in.

**What the settling guarantees, and what it does not.** Measured over every shipped plate at eleven
widths from 280 to 900 pixels: no mark leaves its frame, no two leaders cross, and no leader longer
than a mark passes under another mark. Two pairs of marks in the whole set still overlap, both of
them the same pair on the Beluga Liner's underside at the two narrowest widths measured: they stand
0.85 and 0.998 of a mark apart where a mark is what they need, so one square takes a fifteenth of the
other at 280 pixels and grazes it at 340.

With the text doubled, on plates from 228 pixels up — where eight twenty-eight-pixel marks share a
two-hundred-and-twenty-eight-pixel plate and no arrangement can separate them all — fifty-four pairs
cover part of each other and the worst of them stands two fifths of a mark apart. The rule degrades by leaving
marks close together rather than by moving one somewhere it does not belong, which is the way round
it should degrade: the complete ledger is the equivalent that does not degrade at all.

**A short leader is not a defect.** A mark's own square hides half a mark's width of its line, so a
mark that steps aside by less than that draws no visible line — and it does not need one, because the
square it drew still stands on the mount it belongs to. The line becomes visible exactly as the mark
stops covering its own mount, which is exactly when a reader needs telling where it came from. A rule
that instead pushed every crowded mark far enough clear for its leader to show would buy the line by
making the move the line has to explain.

**Nothing is placed on top of a mount that is showing.** A square standing where a different mount
is, carrying that mount's neighbour's number, is the misreading the leader exists to prevent. A mark
that has not moved _is_ its mount's published position, so keeping every mark a separation from every
other mark is most of the rule already; a mark is also pushed off any other mount's published point
it would otherwise cover, at half the strength of the pushes between marks, so the separation between
squares is what has the last word in a pile that cannot satisfy both.

**What the leader is not.** It carries no _mount state_: kind, fitted, engineering and side are all
words in the button's own name, selection is `aria-pressed` and the ledger row, and the line is one
amber whatever the mount is. It is `aria-hidden` for that reason, not because it means
nothing — it plainly means something, which is _this mark belongs to that point_. What makes it
decoration is that the point was never information a Commander had to have. It is also not a
convergence line, a range or any other assertion about the ship — it is one segment between a mark
and the anchor that mark belongs to.

**Left open.** Three things, all real.

**Full separation is not achievable at every size.** At 200% text on a phone the Anaconda's underside
is eight twenty-eight-pixel marks on a two-hundred-and-twenty-eight-pixel plate, and no arrangement
that keeps a mark anywhere near its own mount separates them all. What the settling guarantees there
is weaker and still worth having: the marks end as far apart as the plate can hold them, and no mark
is thrown clear of the pile to buy room for the rest.

**A short leader can still touch the corner of a neighbouring square.** In a pile every mark ends
about one separation from the next, so the stub of line a mark leaves outside its own square is
drawn in ground its neighbour is close to. What that costs is a line meeting a corner, and what it
buys is the case a reader reads as a mistake: no line long enough to be followed runs across a
number that is not its own.

**A leader's far end is a bare point.** The line is trimmed to its own mark's edge — the part inside
an opaque square is not on screen — so what is drawn is all visible. The other end carries nothing:
the mount's published position is the package's own annotation, under the interface's filter. In a
dense pile the anchors sit close together under the marks around them, so which line ends on which
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
`src/app/domain/ships/anatomy/mount-declutter.ts`, which decides which marks step aside: a pure function
over published coordinates, testable without rendering anything (constitution III). The one thing it
needs a browser for, how wide its own frame and its own marks came out, comes through
`ElementSizeAdapter` in the platform layer. The side selector reuses feature 011's `ednb-tab-group` in
its segmented presentation, and the legend is five static rows in the capability's own template.

The plate accepts immutable view state, emits a typed slot intent, owns its own semantics and its
mount targets, and reads no `ShipLoadout` and no store — it takes a view and resolves its own
words.

## Requirement mapping

The schematic regions own FR-001–FR-003, FR-005–FR-007, FR-009, FR-010 and FR-012. Feature 002's
complete ledger and bench own FR-004 and FR-008 and supply the invariant all-slot fallback for
FR-006 and FR-010. Feature 012's help capability owns FR-011.
