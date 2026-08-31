# Feature Specification: Hull Anatomy and Mount Geometry

## Scope

Commanders can locate hardpoints and utility mounts on the Almanac top and bottom hull schematics
and move between a located mount and its outfitting slot. Internal mounts remain available through
the complete slot list in [002](../002-module-outfitting/spec.md) — every one that list draws. That
list withholds the planetary approach mount (002/FR-002a), which this capability locates no more
than it locates the other internals, so that one mount is reachable from neither surface.

## Clarifications

### Session 2026-08-18

- Q: Should utility mounts have the same interactive states, details, and outfitting navigation as
  hardpoints? → A: Yes; same interaction, state, details and navigation.

### Session 2026-08-22 — design reconciliation

`.design/Ship Builder.dc.html` canvases 1c and 1d draw the anatomy capability as a heading, a mode
strip, the two labelled schematics and a state legend, and nothing else. Selecting a mount marks the
outfitting row and titles the bench; the canvas draws no second detail block, no second mount list
and no power state in the mounts mode. It also draws its marks at its own size, over package geometry
that puts real mounts six CSS pixels apart on a tablet's plate, and it draws nothing that pans. The
design is the record, so FR-004, FR-005, FR-008, FR-011 and FR-012 below are stated as the design
draws them and the withdrawn surfaces are recorded in
[design/hull-anatomy.md](./design/hull-anatomy.md).

### Session 2026-08-25 — three corrections from use

Three things the reference did not answer, decided by what the built screen does on real hulls and
real hardware.

- Q: What happens where the package draws mounts so close together that their marks touch? → A: The
  marks that would cover each other step apart, and each draws a line back to the point the package
  published. The anchors never move and every step is arithmetic over the package's own coordinates.
  How close is too close is measured rather than assumed, since a mark's size has an absolute floor
  and its share of the plate grows as the plate narrows or the text enlarges. **FR-012 is amended
  rather than clarified**: the requirement as written put a mount's control at the published
  position, and this moves it. The front-on-hover rule is unchanged.
- Q: Should a selected utility mount take the accent fill a selected hardpoint takes? → A: No. The
  fill says _selected_ and the hue says _which kind_, so a selected utility is filled in the
  informational hue the legend's `UTILITY` entry draws. Selection remains carried by `aria-pressed`
  and by the ledger row as well as by the fill.
- Q: iPadOS draws the hulls in the package's own blue. → A: The schematic filter was declared on an
  SVG container element, which WebKit does not apply a filter function to; unfiltered, the package's
  own ink is exactly the reported blue. It moves to an ordinary box around the drawing, which removes
  the engine-dependent case rather than working around it; the marks and leaders stay outside it.
  **Confirmed on the device on 2026-08-26** — the plate, not the mechanism, which is the explanation
  that predicted the fix. The engine matrix is Chromium and Firefox by constitutional mandate, so no
  automated test guards it: the suites assert the fix's shape and
  [e2e/manual/webkit-filter.protocol.md](../../e2e/manual/webkit-filter.protocol.md) covers the rest.
  Recorded in [design/hull-anatomy.md](./design/hull-anatomy.md), "Schematic regions".

### Session 2026-08-31 — how far a mark may step

- Q: A mark stepped a quarter of the hull away from its mount, and its line ran between two other
  numbers on the way; two mirrored mounts were drawn two different ways. What should a mark do
  instead? → A: Move as little as the plate allows, and only where it must. Marks that would cover
  each other push apart until each one is clear, and a mark nothing is touching does not move at all.
  Nothing picks a destination, only the shorter of the two axes out of an overlap, so mounts the
  hull mirrors get marks the plate mirrors and no line is long enough to run across a number that is
  not its own. **FR-012 is amended again**:
  the ring it required moved every mark of a crowd the same distance, which is what carried a mark
  across the hull, and it required that distance to be large enough to show a line outside the mark —
  a rule that spends a mount's real position to explain a move nobody needed explained.

## User Scenarios

### Story 1 — Locate hardpoints and utility mounts (P1)

1. The active hull's top and bottom Almanac schematics are available.
2. Every schematic hardpoint and utility mount shows its fitted, empty, engineered and focused
   state visually and as text.
3. Selecting a hardpoint or utility mount selects its outfitting slot, whose slot key, size, fitted
   module, priority and power state the outfitting capability already carries.
4. Every slot without package schematic geometry remains available through the complete slot list,
   less the one mount that list withholds (002/FR-002a).

### Story 2 — Move between geometry and outfitting (P1)

1. Activating a schematic hardpoint or utility mount reaches the matching game slot.
2. Focusing a located outfitting slot identifies and reveals a schematic containing it.
3. If a mount appears on both schematics, both instances represent one build slot and identical
   state.
4. Every located hardpoint and utility mount appears once in a stable text-equivalent order.

## Requirements

- **FR-001**: Hull anatomy MUST require an active build and present what the build reproduces from
  the package's `schematic-top.svg` and `schematic-bottom.svg` for the hull `symbol` — the rendering
  and the mount extract of each side. The package SVG itself is never fetched, served or committed
  (contracts/schematic-assets.md).
- **FR-002**: The application MUST present as an interactive mount only a schematic feature carrying
  a package `data-journal-slot` that resolves to a hardpoint or utility mount on the active hull.
- **FR-003**: Hardpoint and utility-mount identity and geometry MUST come from the package SVG. The
  application MUST NOT use list position, drawing order, hand-maintained mappings, or coordinates
  measured off the rendered document (`getBBox`, `getScreenCTM`, `getBoundingClientRect` and the
  rest). Arithmetic over the coordinates the package itself publishes — the rectangle a document
  draws in, the middle of an annotation — is that geometry read, not a second source for it, and is
  permitted (design/hull-anatomy.md, "Schematic regions").
- **FR-004**: Core, optional, armour and cargo-hatch slots MUST NOT receive invented geometry. The
  complete slot list MUST remain the route to every slot it draws, and this capability MUST NOT
  become a second route to the one mount that list withholds (002/FR-002a) — an internal mount is
  not this capability's to locate either way.
- **FR-005**: Each located hardpoint and utility mount MUST expose fitted, empty, engineering and
  focused state with a complete text equivalent naming its slot.
- **FR-006**: Activating a located hardpoint or utility mount MUST reach its slot. Focusing a located
  slot MUST identify and reveal at least one containing schematic.
- **FR-007**: Repeated geometry for one slot MUST remain one build identity and show identical state.
- **FR-008**: Located-mount detail — slot key, size, fitted module, priority and power state — MUST
  remain owned by the outfitting capability at the same build revision. Hull anatomy MUST NOT publish
  a second detail surface for a mount it has selected.
- **FR-009**: Schematics MUST be produced from the installed Almanac package into same-origin build
  assets, and no other source may supply them. The application MUST NOT maintain a private copy or
  geometry catalogue: an asset it serves MUST be reproducible from the pinned package by a script in
  this repository, and the build MUST fail when one is not
  (design/hull-anatomy.md, "The package SVG is never fetched").
- **FR-010**: Missing or uncached schematics MUST NOT block slot inspection or editing and MUST be
  identified as temporarily unavailable.
- **FR-011**: Artwork provenance and applicable media terms MUST be reachable from the application's
  help capability. Hull anatomy MUST NOT publish a provenance control of its own.
- **FR-012** _(amended; the original required a mount to be operable "at the position the package
  published", which the displacement below contradicts — this is a change of requirement, not a
  clarification of one)_: Each interactive hardpoint and utility mount MUST be a separately operable
  named control anchored to the position the package published, and MUST NOT be enlarged by moving
  that geometry. Where two marks would cover each other the plate MUST draw them apart, as far as the
  plate allows and no further; where no arrangement separates them all they MUST be left near their
  own mounts rather than one being moved clear of the rest, and the complete slot list remains the
  equivalent. A mark MAY be drawn away from its anchor to keep it clear of another mark or of another
  mount's published position, provided the anchor is unchanged, a leader joins the mark to its anchor
  and is drawn wherever the mark does not cover it, the displacement is computed only from
  coordinates the package published and the application's own measurement of how large it drew the
  mark, and the result is deterministic for a given hull and plate size. A mark MUST NOT be drawn
  further from its anchor than the separation between it and the marks it would otherwise cover, and
  a mark that covers neither another mark nor another mount's published position MUST NOT be moved at
  all. Where the package draws two mounts as mirror images of each other, the plate MUST draw their
  marks as mirror images too. Because a mark's drawn width does not scale with the plate at every
  size, how close is too close MUST be measured rather than assumed (design/hull-anatomy.md, "Marks
  that would touch").
  The marks are drawn at the canvas's own size, below the project's 44-pixel baseline: the size
  criterion is met through SC 2.5.8's Equivalent exception, by feature 002's complete ledger offering
  every one of the same mounts at the full baseline on the same screen, whether or not the artwork
  arrived (design/hull-anatomy.md, "Divergence from FR-012"). Nothing pans, because every plate is
  drawn whole at the hull's own proportions.

## Edge Cases

- A schematic slot key that does not resolve to the hull is omitted at run time and never guessed.
  Reporting it is the installed-package audit's, which fails the build rather than telling a
  Commander about a file they cannot fix.
- Nearby or overlapping mounts remain separately operable, and a mark displaced to keep them so
  still shows the mount's published position through its leader. Where a plate is too small for any
  arrangement to separate its marks, they overlap rather than being flung away from their mounts,
  and the complete slot list remains the equivalent.
- Position, colour and shape never carry mount state alone.
- Schematic failure never removes the full slot list.

## Almanac Coverage

The package ships three SVG assets for every hull. The two schematics carry journal slot keys on
hardpoint and utility-mount features. The application consumes both kinds of annotation as
interactive geometry without deriving physical measurements or maintaining geometry; internal
mounts remain represented by the complete slot list, less the one it withholds (002/FR-002a).

## Success Criteria

- **SC-001**: Every presented hardpoint and utility mount resolves to the same package slot on every
  hull.
- **SC-002**: A located hardpoint or utility mount reaches its slot in one interaction.
- **SC-003**: Every located hardpoint, utility mount and state has an equivalent text
  representation, whether or not its schematic is available.
- **SC-004**: Every slot remains usable without the schematics.
