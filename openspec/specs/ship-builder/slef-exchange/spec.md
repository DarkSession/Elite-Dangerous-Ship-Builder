## Purpose

Commanders export the active build as one SLEF entry and import exactly one SLEF entry or journal
`Loadout` event. The Almanac owns inspection, parsing, construction and serialization.

## Requirements

### Requirement: Export serializes one entry from an active build

Export MUST require an active build and MUST serialize exactly one entry through `ShipLoadout`.

Export MUST include every modelled SLEF field: hull, slots, modules, ordinary and
package-identified pre-engineering, 100% quality, enabled state, priority, ship name and ident.

Source: 004/FR-001, 004/FR-002, 004/SC-001.

#### Scenario: A build is exported

- **WHEN** a Commander exports the active build
- **THEN** exactly one entry is serialized through `ShipLoadout`
- **AND** it carries the hull, slots, modules, ordinary and package-identified pre-engineering, 100%
  quality, enabled state, priority, ship name and ident

#### Scenario: The build is invalid or incomplete

- **WHEN** the active build is invalid or incomplete
- **THEN** its state is disclosed and the build stays exportable

#### Scenario: An export is read back

- **WHEN** a reference export is offered to the Almanac or to an independent SLEF consumer
- **THEN** it is accepted

### Requirement: The export header identifies the application

The SLEF header MUST identify the application and release version and SHOULD include an equivalent
build link when one can be produced.

Source: 004/FR-003.

#### Scenario: A build link cannot be produced

- **WHEN** link generation fails
- **THEN** the SLEF export still happens and its header still identifies the application and release
  version

### Requirement: Copy, download and platform share

Copy failure MUST leave selectable payload text and download available. Platform share MUST be
offered only when the platform provides it.

Source: 004/FR-004.

#### Scenario: The clipboard refuses

- **WHEN** a copy or a share permission fails
- **THEN** the generated payload stays as selectable text and download stays available

#### Scenario: The platform offers no share

- **WHEN** the platform provides no share action
- **THEN** none is offered

### Requirement: Export prices come from the current catalogue

Export credit figures MUST use the current catalogue-retail values supplied by the Almanac. Captured
or historical purchase values MUST NOT be retained, displayed or requested for export.

Source: 004/FR-005.

#### Scenario: A build is exported after import

- **WHEN** a build imported with captured purchase values is exported
- **THEN** the exported credit figures are the Almanac's current catalogue-retail values

### Requirement: Export carries the package's fixed-module state

Export MUST include the package-returned fixed-module state without application-owned fixed-mount
defaulting metadata.

Source: 004/FR-006.

#### Scenario: A fixed mount was defaulted

- **WHEN** package construction populated a fixed mount with its hull default
- **THEN** the export carries the package-returned fixed module
- **AND** it carries no application-owned defaulting metadata

### Requirement: Import accepts one entry within a stated size limit

Import MUST be available without an active build and MUST accept pasted SLEF JSON or one journal
`Loadout` event.

Import MUST accept exactly one build and a maximum of 64 KiB. Larger input MUST be rejected before
parsing and MUST name the limit.

Source: 004/FR-007, 004/FR-008.

#### Scenario: No build is active

- **WHEN** no build is active
- **THEN** import is still available

#### Scenario: Input is larger than the limit

- **WHEN** pasted input is larger than 64 KiB
- **THEN** it is rejected before parsing
- **AND** the refusal names the 64 KiB limit

#### Scenario: Input holds more than one entry

- **WHEN** input is empty, malformed or holds more than one entry
- **THEN** it is refused as a whole

### Requirement: Untrusted input is parsed by the package alone

Untrusted input MUST be inspected and parsed by the Almanac without application repair, extension or
heuristic decoding.

Source: 004/FR-009.

#### Scenario: Input is nearly valid

- **WHEN** input is malformed in a way the application could guess at
- **THEN** the application repairs nothing, extends nothing and decodes nothing by heuristic

### Requirement: Import replaces the build only after it succeeds

Import MUST complete validation and normalisation before replacing the active build. Failure MUST
leave active and stored builds unchanged.

Package diagnostics MUST preserve entry index, path, code, constraint and parameters.

Source: 004/FR-010, 004/FR-011, 004/SC-003.

#### Scenario: An import succeeds

- **WHEN** one valid SLEF entry or `Loadout` event passes validation and normalisation
- **THEN** it becomes the active build after any replacement confirmation

#### Scenario: An import fails

- **WHEN** validation or normalisation fails
- **THEN** the active and stored builds are unchanged
- **AND** the package diagnostics are shown with their entry index, path, code, constraint and
  parameters

### Requirement: Import normalisation and fixed mounts

Partial engineering quality on an imported entry MUST be normalised to 100%. The normalisation
MUST NOT be reported to the Commander: a completed grade is what the application models, so
reaching it is not an event.

Package construction MUST return every fixed mount populated with its hull default when the source
entry was absent or unusable. The application MUST NOT perform a second fixed-mount repair and MUST
NOT expose an empty or default-unavailable branch.

Unknown module identities are outside the supported import contract.

Source: 004/FR-012.

#### Scenario: An entry carries partial quality

- **WHEN** an imported entry carries partial engineering quality
- **THEN** the quality is normalised to 100%
- **AND** nothing is stated to the Commander about the normalisation

#### Scenario: An entry has no fixed module

- **WHEN** the source entry's fixed mount is absent or unusable
- **THEN** package construction returns that mount populated with the hull default
- **AND** the application runs no second repair pass

### Requirement: A round trip preserves every modelled field

Import followed by export MUST preserve every modelled field except completed engineering quality
and package-defaulted fixed mounts. Every exported identity MUST resolve in the installed package.

Capture-only timestamps, per-module `Health` snapshots, ammunition state and engineer identity are
not application build state. Their presence or omission in package serialization MUST NOT affect
import acceptance, application behaviour or round-trip success.

Post-engineering module integrity belongs to the fitted build configuration and remains available
through Almanac results. It MUST NOT be inferred from a captured `Health` snapshot.

Source: 004/FR-013, 004/SC-002.

#### Scenario: A build is imported and exported again

- **WHEN** a build is imported and then exported
- **THEN** every modelled field is preserved except the completed engineering quality and the
  package-defaulted fixed mounts
- **AND** a second round trip is stable

#### Scenario: An entry omits a capture-only field

- **WHEN** an entry carries or omits timestamps, `Health` snapshots, ammunition state or engineer
  identity
- **THEN** import acceptance, application behaviour and round-trip success are unaffected

### Requirement: Import and export run in the browser

Import and export MUST run entirely in the browser and MUST transmit no payload.

Source: 004/FR-014, 004/SC-004.

#### Scenario: The largest hull is exchanged

- **WHEN** the package hull with the most slots, with every slot fitted and every supported modelled
  field populated, is imported and then exported
- **THEN** each operation completes within 500 ms as a domain operation in the `.devcontainer/`
  reference environment
- **AND** no network request is made
