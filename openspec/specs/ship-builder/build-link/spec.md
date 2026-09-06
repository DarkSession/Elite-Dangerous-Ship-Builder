## Purpose

A Commander shares a build as a URL that carries the whole build in its fragment. This capability
owns the fragment payload, what the payload may hold, the versioned codec that writes and reads it,
and the size bound the codec has to meet.

## Requirements

### Requirement: Fragment-only payload

A build link MUST keep its payload entirely in the URL fragment and MUST cause no transmission of
build data.

Source: 001/FR-015, 001/SC-004.

#### Scenario: Sharing a build as a link

- **WHEN** the application produces a build link
- **THEN** the versioned payload is in the fragment
- **AND** the path and query carry no build data

#### Scenario: Opening a build link

- **WHEN** a Commander opens a build link
- **THEN** no automatic request sends build data or contacts another origin

### Requirement: Payload contents

The payload MUST contain only non-derived modelled state: package-resolved identities, game slot
keys, ordinary and package-identified pre-engineering, grade, enabled state, priority, ship name and
ident. Every encoded identity MUST resolve in the installed package. A module's package variant and
later ordinary engineering MUST both survive. Package-defaulted fixed modules MAY be implicit in a
payload because reconstruction always restores them. Enabled state and priority MUST be carried for
every fitted module except those the package prices at no power draw at all: a module whose draw the
package does not publish MUST keep its state, because an unpublished figure is not a zero. That is
the rule the outfitting mount card applies when it decides whether to draw a power chip, and a chip a
Commander can set is a value a link has to carry.

Source: 001/FR-016.

#### Scenario: A module carries a package variant and later engineering

- **WHEN** a fitted module has a package-identified pre-engineering and ordinary engineering applied after it
- **THEN** both survive the round trip through the payload

#### Scenario: The package publishes no power draw for a module

- **WHEN** a fitted module's power draw is not published by the package
- **THEN** the payload carries its enabled state and priority

#### Scenario: The package prices a module at no power draw

- **WHEN** the package prices a fitted module at no power draw at all
- **THEN** the payload need not carry its enabled state and priority

#### Scenario: A valid link is opened

- **WHEN** a Commander opens a valid build link
- **THEN** the modelled build is restored
- **AND** no named save is created

### Requirement: Values excluded from the payload

Calculated values, catalogue facts, prices, purchase provenance, notes and storage identities MUST
NOT enter the payload.

Source: 001/FR-017.

#### Scenario: Encoding a build with calculated values and a note

- **WHEN** the codec encodes a build
- **THEN** no calculated value, catalogue fact, price, purchase provenance, note or storage identity is in the payload

### Requirement: Versioned codec

The application-owned codec MUST be versioned, use package identities and preserve all published
versions. Any compact identifier table MUST be generated from the installed package and used only to
encode or decode identities; it MUST NOT supply game facts or calculations.

Source: 001/FR-018, 001/SC-003.

#### Scenario: A link written by an older published version

- **WHEN** a Commander opens a link carrying any published payload version
- **THEN** the codec decodes it and reconstructs an equivalent build

#### Scenario: A payload names a newer version

- **WHEN** a payload names a version this application does not support
- **THEN** the link is refused rather than guessed
- **AND** the current build is unchanged and the failure is explained

#### Scenario: The identifier table is used

- **WHEN** the codec uses its compact identifier table
- **THEN** the table is generated from the installed package
- **AND** it supplies no game fact and no calculation

### Requirement: Refusal of a build the codec cannot represent

A build the codec cannot represent losslessly MUST be refused with the affected slot and reason, and
SLEF MUST remain available.

Source: 001/FR-019.

#### Scenario: A build cannot be encoded losslessly

- **WHEN** the codec cannot represent a build without loss
- **THEN** the application refuses the link and states the affected slot and the reason
- **AND** SLEF remains available for that build

#### Scenario: An invalid or truncated payload is opened

- **WHEN** a Commander opens a link whose payload is invalid, truncated or unsupported
- **THEN** the current build is unchanged
- **AND** the application explains the failure

### Requirement: Link validation and history

Navigated and pasted links MUST use the same validation and replacement rules. Build edits MUST
replace the fragment without adding a history entry for each edit.

Source: 001/FR-020.

#### Scenario: A link is pasted rather than navigated

- **WHEN** a Commander pastes a build link instead of navigating to it
- **THEN** the same validation and replacement rules apply

#### Scenario: A Commander edits the build

- **WHEN** a Commander edits the build
- **THEN** the fragment is replaced
- **AND** no history entry is added for the edit

### Requirement: Codec value size bound

A codec value for the package hull with the most slots, with every slot fitted and every supported
modelled field populated, MUST not exceed 500 characters, its `b.` prefix counted among them. The
bound is on the value the codec produces, not on the URL carrying it: the origin, path and `#` belong
to the deployment, so a bound stated over them could not be enforced by the codec that has to satisfy
it. Builds that cannot meet the limit MUST use SLEF instead.

Source: 001/FR-021.

#### Scenario: The largest build is encoded

- **WHEN** the codec encodes the package hull with the most slots, every slot fitted and every supported modelled field populated
- **THEN** the codec value is at most 500 characters, counting its `b.` prefix

#### Scenario: A payload exceeds the limit

- **WHEN** a build-link payload is longer than the published 500-character limit
- **THEN** it is refused before decoding

#### Scenario: A build cannot meet the limit

- **WHEN** a build cannot be encoded inside the limit
- **THEN** SLEF is used instead
