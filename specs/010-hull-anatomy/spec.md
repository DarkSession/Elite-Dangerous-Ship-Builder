# Feature Specification: Hull Anatomy and Mount Geometry

## Scope

Commanders can locate hardpoints and utility mounts on the Almanac top and bottom hull schematics
and move between a located mount and its outfitting slot. Internal mounts remain available through
the complete slot list in [002](../002-module-outfitting/spec.md).

## Clarifications

### Session 2026-08-18

- Q: Should utility mounts have the same interactive states, details, and outfitting navigation as
  hardpoints? → A: Yes; same interaction, state, details and navigation.

## User Scenarios

### Story 1 — Locate hardpoints and utility mounts (P1)

1. The active hull's top and bottom Almanac schematics are available.
2. Every schematic hardpoint and utility mount shows its fitted, empty, engineered and focused
   state visually and as text.
3. Selecting a hardpoint or utility mount exposes slot key, size, fitted module, priority and
   current power state.
4. Every slot without package schematic geometry remains available through the complete slot list.

### Story 2 — Move between geometry and outfitting (P1)

1. Activating a schematic hardpoint or utility mount reaches the matching game slot.
2. Focusing a located outfitting slot identifies and reveals a schematic containing it.
3. If a mount appears on both schematics, both instances represent one build slot and identical
   state.
4. Every located hardpoint and utility mount appears once in a stable text-equivalent order.

## Requirements

- **FR-001**: Hull anatomy MUST require an active build and use the package
  `schematic-top.svg` and `schematic-bottom.svg` assets for the hull `symbol`.
- **FR-002**: The application MUST present as an interactive mount only an SVG feature carrying a
  package `data-journal-slot` that resolves to a hardpoint or utility mount on the active hull.
- **FR-003**: Hardpoint and utility-mount identity and geometry MUST come from the package SVG. The
  application MUST NOT use list position, drawing order, hand-maintained mappings or measured
  coordinates.
- **FR-004**: Core, optional, armour and cargo-hatch slots MUST NOT receive invented geometry. The
  complete slot list MUST remain the route to every slot.
- **FR-005**: Each located hardpoint and utility mount MUST expose fitted, empty, engineering and
  focused state with a complete text equivalent naming its slot.
- **FR-006**: Activating a located hardpoint or utility mount MUST reach its slot. Focusing a located
  slot MUST identify and reveal at least one containing schematic.
- **FR-007**: Repeated geometry for one slot MUST remain one build identity and show identical state.
- **FR-008**: Located-mount detail MUST use package and build state only: slot key, size, fitted
  module, priority and power state.
- **FR-009**: Schematics MUST be copied from the installed Almanac package into same-origin build
  assets. The application MUST NOT maintain a private copy or geometry catalogue.
- **FR-010**: Missing or uncached schematics MUST NOT block slot inspection or editing and MUST be
  identified as temporarily unavailable.
- **FR-011**: Artwork provenance and applicable media terms MUST be reachable from the anatomy
  capability.
- **FR-012**: Each interactive hardpoint and utility mount MUST have an AA-size target without
  moving its package geometry. Panning MAY occur inside the schematic container but MUST NOT be the
  only route to a slot.

## Edge Cases

- A schematic slot key that does not resolve to the hull is omitted and reported as a package defect;
  it is never guessed.
- Nearby or overlapping mounts remain separately operable.
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
  representation.
- **SC-004**: Every slot remains usable without the schematics.
