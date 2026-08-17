# Feature Specification: Hull Anatomy and Hardpoint Geometry

## Scope

Commanders can locate hardpoints on the Almanac top and bottom hull schematics and move between a
located hardpoint and its outfitting slot. The package schematics do not locate utility or internal
mounts; those remain available through the complete slot list in
[002](../002-module-outfitting/spec.md).

## User Scenarios

### Story 1 — Locate hardpoints (P1)

1. The active hull's top and bottom Almanac schematics are available.
2. Every schematic hardpoint shows its fitted, empty, engineered and focused state visually and as
   text.
3. Selecting a hardpoint exposes slot key, size, fitted module, priority and current power state.
4. Every slot without package schematic geometry remains available through the complete slot list.

### Story 2 — Move between geometry and outfitting (P1)

1. Activating a schematic hardpoint reaches the matching game slot.
2. Focusing a located outfitting slot identifies and reveals a schematic containing it.
3. If a hardpoint appears on both schematics, both instances represent one build slot and identical
   state.
4. Every hardpoint appears once in a stable text-equivalent order.

## Requirements

- **FR-001**: Hull anatomy MUST require an active build and use the package
  `schematic-top.svg` and `schematic-bottom.svg` assets for the hull `symbol`.
- **FR-002**: The application MUST present as an interactive mount only an SVG feature carrying a
  package `data-journal-slot` that resolves to a hardpoint on the active hull.
- **FR-003**: Hardpoint identity and geometry MUST come from the package SVG. The application MUST
  NOT use list position, drawing order, hand-maintained mappings or measured coordinates.
- **FR-004**: Utility, core, optional, armour and cargo-hatch slots MUST NOT receive invented
  geometry. The complete slot list MUST remain the route to every slot.
- **FR-005**: Each located hardpoint MUST expose fitted, empty, engineering and focused state with a
  complete text equivalent naming its slot.
- **FR-006**: Activating a hardpoint MUST reach its slot. Focusing a located slot MUST identify and
  reveal at least one containing schematic.
- **FR-007**: Repeated geometry for one slot MUST remain one build identity and show identical state.
- **FR-008**: Hardpoint detail MUST use package and build state only: slot key, size, fitted module,
  priority and power state.
- **FR-009**: Schematics MUST be copied from the installed Almanac package into same-origin build
  assets. The application MUST NOT maintain a private copy or geometry catalogue.
- **FR-010**: Missing or uncached schematics MUST NOT block slot inspection or editing and MUST be
  identified as temporarily unavailable.
- **FR-011**: Artwork provenance and applicable media terms MUST be reachable from the anatomy
  capability.
- **FR-012**: Each interactive hardpoint MUST have an AA-size target without moving its package
  geometry. Panning MAY occur inside the schematic container but MUST NOT be the only route to a slot.

## Edge Cases

- A schematic slot key that does not resolve to the hull is omitted and reported as a package defect;
  it is never guessed.
- Nearby or overlapping hardpoints remain separately operable.
- Position, colour and shape never carry mount state alone.
- Schematic failure never removes the full slot list.

## Almanac Coverage

The package ships three SVG assets for every hull. The two schematics carry journal slot keys on
hardpoint features; they do not carry utility-mount positions. The application consumes those assets
without deriving physical measurements or maintaining geometry.

## Success Criteria

- **SC-001**: Every presented hardpoint resolves to the same package slot on every hull.
- **SC-002**: A located hardpoint reaches its slot in one interaction.
- **SC-003**: Every located hardpoint and state has an equivalent text representation.
- **SC-004**: Every slot remains usable without the schematics.
