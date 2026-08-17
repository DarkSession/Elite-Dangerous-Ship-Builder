# Feature Specification: Hull Anatomy and Mount Geometry

## Scope

This specification covers a spatial view of the active build using the hull schematics published by
the Almanac. It lets a Commander locate external mounts and reach the same slots available through
the complete slot list.

Only hardpoints and utility mounts have package-provided schematic positions. Core, optional and
military internals remain available through
[Module Outfitting and Engineering](../002-module-outfitting/spec.md) and are never assigned invented
positions.

## User Scenarios & Testing

### User Story 1 - Locate fitted and empty mounts (Priority: P1)

A Commander can inspect the top and bottom schematics and identify the current state of every
external mount they locate.

**Independent Test**: Load an outfitted reference build and verify every package-located hardpoint
and utility mount appears at its package position with the correct slot and build state.

**Acceptance Scenarios**:

1. **Given** an active build, **When** hull anatomy is opened, **Then** the package's top and bottom
   schematics for that hull are reachable.
2. **Given** a located mount, **When** it is shown, **Then** fitted or empty, ordinary or engineered,
   and currently focused states are available visually and as text.
3. **Given** a selected mount, **When** its detail is read, **Then** its slot key, kind, size, fitted
   module, priority and current power state are available.
4. **Given** a slot with no package schematic position, **When** anatomy is shown, **Then** no
   position is invented and the complete slot list remains available.

### User Story 2 - Navigate between a mount and its slot (Priority: P1)

A Commander can activate a mount to edit that slot and can locate the currently focused slot on the
hull when the package provides a position.

**Independent Test**: Activate every located mount for a reference hull from pointer, touch,
keyboard and screen reader navigation and verify the matching game slot key is reached.

**Acceptance Scenarios**:

1. **Given** a located mount, **When** it is activated, **Then** the outfitting actions for that game
   slot key are reached.
2. **Given** a focused located slot, **When** anatomy is opened, **Then** its mount is identified and
   a plate containing it is brought into view.
3. **Given** the same mount appears on both plates, **When** either instance is activated, **Then**
   both refer to one slot and expose identical state.
4. **Given** keyboard or screen-reader navigation, **When** the Commander moves through mounts,
   **Then** every mount is reachable in a stable order and focus is visible.

### Edge Cases

- Missing or uncached schematics do not block any outfitting capability.
- A schematic slot key that disagrees with the hull slot catalogue fails verification rather than
  being guessed at runtime.
- Several nearby mounts remain separately targetable without moving their package positions.
- Internals never appear spatially merely because their slot list is longer than the mount list.
- Position, colour and shape are never the only carriers of mount state.

## Requirements

### Functional Requirements

- **FR-001**: Hull anatomy MUST require an active build and MUST use the top and bottom schematic
  assets published by `@elite-dangerous-almanac/core` for the hull `symbol`.
- **FR-002**: The application MUST present only schematic features that carry a package game slot
  key and resolve to a hardpoint or utility slot on the active hull.
- **FR-003**: Each mount MUST use the slot key and position carried by the package schematic. The
  application MUST NOT use list position, drawing order, hand-maintained mappings or measured
  artwork coordinates.
- **FR-004**: A slot without package geometry MUST not receive a spatial position. The complete slot
  list MUST remain the route to all slots.
- **FR-005**: Each located mount MUST expose fitted or empty state, engineering state and focused
  state without selection, with equivalent text that names its slot.
- **FR-006**: Selecting a mount MUST reach the matching outfitting slot. Focusing a located slot MUST
  identify and reveal a plate containing that mount.
- **FR-007**: A slot present on both schematics MUST remain one slot, display identical state in both
  places and never be duplicated as build data.
- **FR-008**: Mount detail MUST expose package and build state without creating a new number:
  slot key, kind, size, fitted module, priority and power state.
- **FR-009**: Schematics MUST be delivered from the application's own origin and MUST NOT be copied
  into a private hand-maintained artwork or geometry catalogue.
- **FR-010**: Schematic loading or absence MUST NOT block reading or editing any slot. Cached assets
  MAY remain available offline; uncached assets MUST be identified as temporarily unavailable.
- **FR-011**: Artwork provenance and the applicable media-usage notice MUST be reachable from hull
  anatomy.
- **FR-012**: Every mount MUST be independently operable by pointer, touch and keyboard with an AA
  target size while remaining at its package position.
- **FR-013**: Anatomy MAY pan inside its own container but MUST NOT widen the page or make panning the
  only way to reach a mount.

### Verification Requirements

- **FR-014**: Package-asset tests MUST cover every hull and prove that every presented slot key
  resolves to the hull, no plate repeats one slot and no application-owned position exists.
- **FR-015**: Tests MUST verify that only package-located hardpoints and utility mounts are
  presented and that slots shown on both plates resolve to one build slot.
- **FR-016**: Tests MUST verify mount state, text equivalence, stable keyboard order, target size and
  navigation to the exact slot at every supported viewport.
- **FR-017**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks and unavailable
  asset states.

## Key Entities

- **Hull schematic**: A package top or bottom hull asset containing named feature positions.
- **Located mount**: A hardpoint or utility feature tied to one game slot key.
- **Mount state**: Fitted, engineered and focused presentation of the active build's slot.

## Almanac Coverage

The Almanac publishes top and bottom schematics for the current hull catalogue and carries game slot
keys on every positioned hardpoint and utility mount. Those assets provide all required geometry.
The application displays and navigates package positions; it derives no physical measurement or
game value from the artwork.

## Success Criteria

- **SC-001**: Every presented mount resolves to the correct package slot and position for every
  catalogue hull.
- **SC-002**: A Commander can reach a located slot from its mount in one interaction.
- **SC-003**: Every located mount and state has an equivalent text representation and works by
  pointer, touch, keyboard and screen reader.
- **SC-004**: Every slot remains reachable without hull anatomy.
- **SC-005**: No physical number or unlocated position is derived from schematic artwork.
- **SC-006**: The complete feature passes the required viewport, browser and accessibility test
  matrix without horizontal page scrolling.
