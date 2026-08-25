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

Canvas 1d stacks the anatomy **above** feature 002's ledger; the workspace stacks it below, because
the ledger, the centre track and the status rail are one grid whose source order is its wide
left-to-right order and nothing re-orders it when it stacks. That deviation is feature 002's
composition rather than this capability's placement — the anatomy sits in the centre track, which is
where canvas 1c puts it — and moving it means giving that grid explicit columns so the DOM can be
re-ordered without changing the wide arrangement. Recorded here rather than fixed here.

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
  node number, centred on the mount's own position and treated in the canvas's four kinds. The
  position is the middle of the annotation's own published coordinates; nothing is moved, and
  nothing is measured off anything rendered.
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
  legible step without blowing the package's seven bright feature hues out to white.
- A side that has not arrived carries the hull illustration's own loading mark, in the place the
  drawing will be, with the words spoken rather than drawn. Prose in the frame and a hull after it is
  a plate that changes height when the fetch lands.
- Where the plates share a bounded column with feature 002's bench, the plates ask for the height
  their hulls need at that width and the bench takes everything else. A capability that stretched to
  fill the column and pushed the editor off it would have got its own priority backwards.

## Legend and visual language

The legend is the reference's, entry for entry: `SELECTED`, `FITTED`, `EMPTY`, `UTILITY`,
`ENGINEERED`. Each entry draws the same treatment the mounts it explains draw, and uses the same
localized words as their accessible names.

The reference's node treatments are the mark's, not the package's own shapes: a fitted mount takes
the accent hairline, an empty one the dashed neutral hairline, a utility one the informational hue
the canvas gives `data-kind="util"`, a selected one the solid accent fill it gives `data-kind="sel"`,
and an engineered one the canvas's own engineering icon hung off the mark's top corner. The icon
needs no measurement: it is placed against the mark, which the plate positions, and never against
the package's drawing, which nothing measures (FR-003).

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
and at its own label width beside it when there is room.

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

That navigation is the compact workspace's, not this capability's. Building it means the compact
workspace stops stacking its regions and starts switching between them, which is the same grid whose
source order is already recorded above under "Narrow, mobile and zoomed", and which belongs to
feature 002's composition. So this capability draws canvas 1c's anatomy-scoped strip at every width
and borrows only 1d's shape for it — full width, under the rule.

What is deliberately **not** done is drawing a sixth `STATUS` segment inside the anatomy's own strip.
It would be an invention at wide width, where canvas 1c draws five; and drawn disabled it would say
the build's status cannot be read while the status rail sits on the same screen saying it.

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

## Divergence from FR-012 — the size of a mount target

**What the reference draws.** Nodes of 14 to 30 CSS pixels, laid on the hull where the hull puts
them. On canvas 1c's Anaconda the closest pair sits about five pixels apart at the plate size the
canvas draws.

**What was withdrawn.** A target size on a schematic mount — the project's 44-pixel baseline and
SC 2.5.8's 24-pixel minimum both. Neither is reachable, and neither is the criterion's spacing
exception. The Almanac draws real mounts closer together than any mark is wide: the Anaconda's two
small hardpoints are **six CSS pixels apart** on the plate two columns have room for, and the
canvas's own mark is fourteen. A mark large enough to pass would sit on top of its neighbour and
take that mount out of reach entirely. Widening the gap would mean moving package geometry, which
FR-003 refuses.

**What survives.** Two things, and they are what FR-012 is actually for.

First, every mount is separately operable at every plate size — from the keyboard, where each mark is
its own stop in its own order and nothing can be in front of anything. Marks do overlap on the dense
hulls, so the mark being pointed at, moved to or currently selected comes to the front: whichever
mount a Commander is working with is the whole square rather than the sliver its neighbour left
uncovered. That is the edge case the specification states — "nearby or overlapping mounts remain
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
occurrences and its side-local status. The side selector reuses feature 011's `edsb-tab-group` in
its segmented presentation, and the legend is five static rows in the capability's own template.

The plate accepts immutable view state, emits a typed slot intent, owns its own semantics and its
mount targets, and reads no `ShipLoadout` and no store — it takes a view and resolves its own
words.

## Requirement mapping

The schematic regions own FR-001–FR-003, FR-005–FR-007, FR-009, FR-010 and FR-012. Feature 002's
complete ledger and bench own FR-004 and FR-008 and supply the invariant all-slot fallback for
FR-006 and FR-010. Feature 012's help capability owns FR-011.
