# Feature Specification: Hull Anatomy and Mount Geometry

## Scope

Commanders can locate hardpoints and utility mounts on the Almanac top and bottom hull schematics
and move between a located mount and its outfitting slot. Internal mounts remain available through
the complete slot list in [002](../002-module-outfitting/spec.md).

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
  mark steps aside and a hairline ties it back to the point the package published. The anchor never
  moves, the step is arithmetic over the package's own coordinates, and it is the same share of the
  plate at every width. FR-012 and the overlap edge case are restated in those terms; the front-on-
  hover rule stays for the hulls no arrangement of squares can separate.
- Q: Should a selected utility mount take the accent fill a selected hardpoint takes? → A: No. The
  fill says _selected_ and the hue says _which kind_, so a selected utility is filled in the
  informational hue the legend's `UTILITY` entry draws. Selection remains carried by `aria-pressed`
  and by the ledger row as well as by the fill.
- Q: iPadOS draws the hulls in the package's own blue. → A: The schematic filter was declared on an
  SVG container element, which WebKit does not apply. It moves to an ordinary box around the
  drawing; the marks and leaders stay outside it. Recorded in
  [design/hull-anatomy.md](./design/hull-anatomy.md), "Schematic regions".

## User Scenarios

### Story 1 — Locate hardpoints and utility mounts (P1)

1. The active hull's top and bottom Almanac schematics are available.
2. Every schematic hardpoint and utility mount shows its fitted, empty, engineered and focused
   state visually and as text.
3. Selecting a hardpoint or utility mount selects its outfitting slot, whose slot key, size, fitted
   module, priority and power state the outfitting capability already carries.
4. Every slot without package schematic geometry remains available through the complete slot list.

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
  complete slot list MUST remain the route to every slot.
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
- **FR-012**: Each interactive hardpoint and utility mount MUST be a separately operable named
  control anchored to the position the package published, and MUST NOT be enlarged by moving that
  geometry. Where the package draws two mounts closer together than a mark is wide, a mark MAY be
  displaced from its anchor by a deterministic amount computed from the package's own published
  coordinates, provided the anchor is unchanged, a leader joins the mark to it, and the displacement
  is the same at every plate size (design/hull-anatomy.md, "Marks that would touch").
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
  still shows the mount's published position through its leader.
- Position, colour and shape never carry mount state alone.
- Schematic failure never removes the full slot list.

## Almanac Coverage

The package ships three SVG assets for every hull. The two schematics carry journal slot keys on
hardpoint and utility-mount features. The application consumes both kinds of annotation as
interactive geometry without deriving physical measurements or maintaining geometry; internal
mounts remain represented by the complete slot list.

## Success Criteria

- **SC-001**: Every presented hardpoint and utility mount resolves to the same package slot on every
  hull.
- **SC-002**: A located hardpoint or utility mount reaches its slot in one interaction.
- **SC-003**: Every located hardpoint, utility mount and state has an equivalent text
  representation, whether or not its schematic is available.
- **SC-004**: Every slot remains usable without the schematics.
