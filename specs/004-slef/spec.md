# Feature Specification: SLEF

## Scope

Commanders can export the active build as one SLEF entry and import exactly one SLEF entry or journal
`Loadout` event. The Almanac owns inspection, parsing, construction and serialization.

## Clarifications

### Session 2026-08-18

- Q: Should import/export preserve historical hull or module purchase values? → A: No. Export uses
  current Almanac catalogue prices, and captured purchase values do not enter application build state.
- Q: Should import/export preserve a module's captured `Health` snapshot? → A: No application
  behavior depends on that transient snapshot. The build still preserves the fitted configuration
  from which the Almanac supplies each module's engineered maximum integrity.

## User Scenarios

### Story 1 — Export a build (P1)

1. Export contains every modelled field and round-trips through the Almanac.
2. The Commander can copy, download or use platform sharing when available.
3. Invalid or incomplete builds remain exportable after their state is disclosed.
4. Link-generation failure does not prevent SLEF export.

### Story 2 — Import a build (P1)

1. One valid SLEF entry or `Loadout` event becomes active after any replacement confirmation.
2. Empty, malformed and multi-entry input is refused as a whole.
3. Failure leaves active and stored builds unchanged and shows the package diagnostics.
4. Successful normalisation is reported and a second import/export round trip is stable.

## Requirements

- **FR-001**: Export MUST require an active build and MUST serialize exactly one entry through
  `ShipLoadout`.
- **FR-002**: Export MUST include every modelled SLEF field: hull, slots, modules, ordinary and
  package-identified pre-engineering, 100% quality, enabled state, priority, ship name and ident.
- **FR-003**: The SLEF header MUST identify the application and release version and SHOULD include an
  equivalent build link when one can be produced.
- **FR-004**: Copy failure MUST leave selectable payload text and download available. Platform share
  MUST be offered only when the platform provides it.
- **FR-005**: Export credit figures MUST use the current catalogue-retail values supplied by the
  Almanac. Captured or historical purchase values MUST NOT be retained, displayed or requested for
  export.
- **FR-006**: Export MUST include the package-returned fixed-module state without application-owned
  fixed-mount defaulting metadata.
- **FR-007**: Import MUST be available without an active build and accept pasted SLEF JSON or one
  journal `Loadout` event.
- **FR-008**: Import MUST accept exactly one build and a maximum of 64 KiB. Larger input MUST be
  rejected before parsing and MUST name the limit.
- **FR-009**: Untrusted input MUST be inspected and parsed by the Almanac without application repair,
  extension or heuristic decoding.
- **FR-010**: Import MUST complete validation and normalisation before replacing the active build.
  Failure MUST leave active and stored builds unchanged.
- **FR-011**: Package diagnostics MUST preserve entry index, path, code, constraint and parameters.
- **FR-012**: Successful import MUST report partial quality normalised to 100%. Package construction
  MUST return every fixed mount populated with its hull default when the source entry was absent or
  unusable; the application MUST NOT perform a second fixed-mount repair or expose an
  empty/default-unavailable branch. Unknown module identities are outside the supported import
  contract.
- **FR-013**: Import followed by export MUST preserve every modelled field except completed
  engineering quality and package-defaulted fixed mounts. Every exported identity MUST resolve in
  the installed package.
- **FR-014**: Import and export MUST run entirely in the browser and MUST transmit no payload.

## Edge Cases

- Capture-only timestamps, per-module `Health` snapshots, ammunition state and engineer identity are
  not application build state. Their presence or omission in package serialization MUST NOT affect
  import acceptance, application behavior or round-trip success.
- Post-engineering module integrity belongs to the fitted build configuration and remains available
  through Almanac results; it MUST NOT be inferred from a captured `Health` snapshot.
- Unknown module identities are not supported import fixtures or compatibility cases.
- Clipboard and share permissions can fail without losing the generated payload.

## Almanac Coverage

`inspectSlef()`, `ShipLoadout.fromSlef()`, `ShipLoadout.fromLoadout()`, `toLoadoutEvent()` and
`toSlefString()` supply strict validation, construction, serialization and current catalogue-retail
credit behaviour, together with unknown-hull refusal and package-defaulted fixed mounts. The
application performs no format or game calculation.

## Success Criteria

- **SC-001**: Every reference export is accepted by the Almanac and independent SLEF consumers.
- **SC-002**: Round trips preserve every modelled field after the stated quality and fixed-mount
  normalisations.
- **SC-003**: Every rejected input leaves current work unchanged and exposes a structured location
  and reason.
- **SC-004**: The package hull with the most slots, with every slot fitted and every supported modelled
  field populated, imports and exports within 500 ms without a network request.
