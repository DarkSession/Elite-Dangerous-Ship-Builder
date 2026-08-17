# Feature Specification: SLEF Import and Export

## Scope

This specification covers exporting the active build as one SLEF entry and importing exactly one
build from pasted SLEF or a pasted journal `Loadout` event. Parsing, validation, build construction
and serialization are Almanac responsibilities.

Build URLs belong to
[Ship Selection and Build Loading](../001-ship-selection-and-loading/spec.md).

## User Scenarios & Testing

### User Story 1 - Export one build (Priority: P1)

A Commander can copy, download or share a standards-compliant SLEF representation of the active
build.

**Independent Test**: Export reference builds and verify the Almanac parses them back to equivalent
modeled builds and that independent SLEF consumers accept them.

**Acceptance Scenarios**:

1. **Given** an active build, **When** it is exported, **Then** one valid SLEF entry contains every
   modeled fitted module, engineering selection, enabled state, power priority, ship name and ident.
2. **Given** an export, **When** its header is read, **Then** it identifies this application and
   version and includes an equivalent build link when one can be produced.
3. **Given** an exported payload, **When** the Commander chooses an output, **Then** it can be copied,
   downloaded or passed to the platform share facility when available.
4. **Given** an invalid or incomplete build, **When** it is exported, **Then** export remains
   available and the build state is disclosed.

### User Story 2 - Import one build (Priority: P1)

A Commander can paste SLEF or a journal `Loadout` event and inspect the resulting build without
losing existing work on failure.

**Independent Test**: Import valid, malformed, multi-entry and normalized reference payloads and
compare the result and diagnostics with the Almanac.

**Acceptance Scenarios**:

1. **Given** one valid SLEF entry or `Loadout` event, **When** it is pasted, **Then** it becomes the
   active build after any required replacement confirmation.
2. **Given** malformed input, **When** import is attempted, **Then** package diagnostics identify the
   failing path and the current build is unchanged.
3. **Given** more than one entry, **When** import is attempted, **Then** the whole payload is refused;
   no entry is applied.
4. **Given** partial engineering quality or an invalid fixed mount, **When** import succeeds, **Then**
   constitutional normalization is reported and the resulting build is stable on a second round
   trip.

### Edge Cases

- A payload larger than 64 KB is refused before parsing and does not replace the active build.
- Clipboard permission failure leaves selectable payload text and download available.
- An unresolved non-fixed module remains unresolved; a fixed mount follows the normalization rule
  in [Module Outfitting and Engineering](../002-module-outfitting/spec.md).
- Capture-only state such as timestamps, health, ammunition and engineer identity is outside the
  durable build model and is discarded.
- If a build link cannot be produced, the SLEF export remains valid without it.

## Requirements

### Export

- **FR-001**: Export MUST require an active build and MUST serialize exactly one entry using
  `@elite-dangerous-almanac/core`.
- **FR-002**: Export MUST include every application-modeled SLEF field: hull, slots, fitted modules,
  ordinary and package-identified pre-engineering, 100% engineering quality, enabled state, power
  priority, ship name and ident where present.
- **FR-003**: The SLEF header MUST identify this application and release version and SHOULD include
  an equivalent application build link. Link failure MUST NOT fail export.
- **FR-004**: The Commander MUST be able to copy and download the payload and use platform sharing
  where available.
- **FR-005**: Export MUST use source purchase data where the build retains valid source provenance.
  It MUST NOT replace missing source prices with catalogue retail values.
- **FR-006**: A module replacement, including fixed-mount normalization, MUST invalidate source
  prices exactly as the Almanac's source-purchase export semantics require.
- **FR-007**: Export MUST carry the normalized build state and MUST NOT add fields describing that a
  normalization occurred.
- **FR-008**: Invalid or incomplete builds MUST remain exportable with their validation state made
  clear to the Commander.

### Import

- **FR-009**: Import MUST be available without an active build and MUST accept pasted SLEF and pasted
  journal `Loadout` events.
- **FR-010**: Import MUST accept exactly one build. Empty and multi-entry payloads MUST be refused as
  a whole.
- **FR-011**: Import MUST accept payloads up to 64 KB and refuse larger payloads with a message that
  names the limit before package parsing begins.
- **FR-012**: Untrusted input MUST be inspected and parsed by the Almanac. The application MUST NOT
  pre-process, repair or extend SLEF.
- **FR-013**: Import MUST validate completely before replacing the active build. Failure MUST leave
  active and stored builds unchanged.
- **FR-014**: Package diagnostics MUST retain their entry index, property path, code, constraint and
  parameters so the Commander can locate the problem.
- **FR-015**: Successful import MUST report every application-defined normalization: partial quality
  changed to 100%, unresolved identities retained, and fixed mounts filled or left incomplete.
- **FR-016**: Import followed by export MUST preserve every modeled field except the two
  constitutional normalizations: completed engineering quality and fixed-mount stock fill.
- **FR-017**: Import and export MUST run entirely in the browser and MUST NOT transmit the payload.
- **FR-018**: Import and export detail MUST remain operable and readable at every supported viewport
  without horizontal page scrolling; payload text MAY scroll inside its own container.

### Verification Requirements

- **FR-019**: Unit tests MUST compare import, export and diagnostics with the Almanac across valid,
  malformed, multi-entry, oversized, incomplete and unresolved payloads.
- **FR-020**: Round-trip tests MUST cover every modeled field, source purchase behavior, both
  constitutional normalizations and second-round-trip stability.
- **FR-021**: Compatibility tests MUST verify exported payloads with independent SLEF consumers.
- **FR-022**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks.

## Key Entities

- **SLEF entry**: One header and one journal-compatible `Loadout` event.
- **Source purchase**: Captured price provenance preserved only while it still describes the build.
- **Import diagnostic**: The Almanac's structured location and reason for rejected input.
- **Normalization report**: Application-owned notice of a constitutional change made while loading.

## Almanac Coverage

`ShipLoadout.fromSlef()`, the SLEF inspection and parsing functions, `toLoadoutEvent()` and
`toSlefString()` supply strict validation, construction and serialization. `ShipLoadout` also owns
source-purchase invalidation and export semantics. Every format rule and calculated field required
here is supplied by the package.

## Success Criteria

- **SC-001**: Every exported reference build is accepted by the Almanac and independent SLEF
  consumers.
- **SC-002**: Import/export round trips preserve every modeled field under the two stated
  normalizations, and a second round trip changes nothing.
- **SC-003**: Every malformed payload produces a structured location and reason, with no partial
  application or unhandled failure.
- **SC-004**: Import and export of the largest reference build complete within 500 ms.
- **SC-005**: No import or export transmits build data.
- **SC-006**: The complete feature passes the required viewport, browser and accessibility test
  matrix without horizontal page scrolling.
