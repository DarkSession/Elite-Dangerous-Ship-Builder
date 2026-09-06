## Purpose

The status rail presents the active build's structural status and what the build carries. Every
verdict, issue and figure it states comes from the Almanac package.

## Requirements

### Requirement: Build status acts on an active build

This capability MUST require an active build and MUST NOT create one.

Where there is no build, nothing MUST be drawn at all: no build is not a valid build.

Source: 003/FR-001.

#### Scenario: No build is active

- **WHEN** no build is active
- **THEN** the status block draws nothing
- **AND** no build is created

### Requirement: Structural status comes from the package

Structural status MUST come from `@elite-dangerous-almanac/core` for the current build. The
application MUST NOT derive, clamp, estimate, repair or reinterpret a package result.

Source: 003/FR-002, 003/SC-001.

#### Scenario: The build changes

- **WHEN** a Commander commits an edit
- **THEN** the issues are re-rendered for the build now in memory
- **AND** no figure or verdict is derived, clamped, estimated, repaired or reinterpreted

### Requirement: Status states only what the package's validation states

Structural status MUST use only `ShipLoadout.validation().valid` and `.complete` and the issues the
package raises about them, and MUST never claim that the build is flyable, ready, working, good or
optimal.

Source: 003/FR-003.

#### Scenario: The package reports nothing about a build

- **WHEN** the package raises no issue about a build
- **THEN** no readiness claim is made

#### Scenario: A build is invalid and incomplete at once

- **WHEN** the package reports the build both invalid and incomplete
- **THEN** the issues for both are raised

### Requirement: Every validation issue appears once in package order

Every validation issue MUST appear once with its severity and its package diagnostic. Package issue
order MUST be preserved.

Source: 003/FR-004.

#### Scenario: An issue is resolved

- **WHEN** an edit resolves one issue and raises another
- **THEN** the resolved issue disappears
- **AND** the raised issue appears in its package position

#### Scenario: A diagnostic carries parameters

- **WHEN** a diagnostic carries string-list parameters and is long enough to wrap several lines
- **THEN** it still appears once, in its package position

### Requirement: Package text is presented as the package supplies it

Package game text and diagnostic text MUST NOT be parsed or privately translated.
Application-owned labels MUST use the localisation layer.

A package diagnostic MUST be preserved. The application MUST NOT invent a game diagnosis, and MUST
NOT substitute its own sentence for one the package supplies.

Source: 003/FR-005, 003/FR-007.

#### Scenario: A diagnostic has no translation

- **WHEN** the package cannot translate a diagnostic into the active language
- **THEN** the diagnostic reads in its canonical language and is disclosed as such

#### Scenario: An application label is drawn

- **WHEN** the status block draws a label the application owns
- **THEN** the label comes from the localisation layer

### Requirement: Severity is carried by text

Issue severity MUST be expressed as text beside its issue and MUST NOT depend on colour alone. The
text is not drawn, because neither canvas draws a severity word; it is read aloud beside the
sentence, and it is what carries the severity. The four tones — error, warning, success and info —
reinforce it, and differ from each other in hue alone.

Source: 003/FR-022.

#### Scenario: A screen reader reaches an issue

- **WHEN** a screen reader reads an issue
- **THEN** the severity is read aloud beside the sentence

#### Scenario: The tones are compared

- **WHEN** two issues of different severity are drawn
- **THEN** their tones differ in hue alone and carry no severity a reader cannot also hear

### Requirement: A valid build states one line

Where the package reports the build valid, the status block MUST draw one line saying so, and
nothing else beside it — no count, no structural-facts list and no readiness or quality claim beyond
the package's own verdict.

The line MUST be read from `LoadoutValidation.valid` and MUST NOT be derived from the issue count:
the two are different claims, because a build carrying only `warning` or `incomplete` issues is one
the package calls valid.

Where the package raises such an issue, the line and the issue blocks MUST both be drawn — the
verdict is the package's answer and the blocks are the package's issues, and withholding either
would state a verdict of this application's own.

Source: 003/FR-015.

#### Scenario: The build is valid and raises no issue

- **WHEN** `LoadoutValidation.valid` is true and the package raises no issue
- **THEN** one line says the build is valid
- **AND** no count, structural-facts list or readiness claim is drawn beside it

#### Scenario: The build is valid and carries warnings

- **WHEN** `LoadoutValidation.valid` is true and the package raises `warning` or `incomplete` issues
- **THEN** the valid line and the issue blocks are both drawn

### Requirement: The rail states cargo and passenger capacity

The rail MUST state the build's cargo capacity and its passenger capacity, each as one cell of the
rail's own cell band, read from `ShipLoadout.cargoCapacity` and `ShipLoadout.passengerCapacity` and
formatted for the active locale.

Both are facts the build already carries and both always answer, so each MUST draw its figure
whatever that figure is: a build with no rack and no cabin carries none of either, and zero is the
package's answer rather than a substitute for one.

The application MUST NOT recompute, re-sum or reconcile either locally, and MUST NOT derive a figure
from the pair.

Source: 003/FR-023, 003/SC-007.

#### Scenario: A rack is fitted

- **WHEN** a Commander fits a cargo rack
- **THEN** the cargo capacity cell changes and the passenger capacity cell does not

#### Scenario: A cabin is removed

- **WHEN** a Commander removes a passenger cabin
- **THEN** the passenger capacity cell changes back

#### Scenario: The build carries neither

- **WHEN** a build carries no rack and no cabin
- **THEN** each cell states zero

### Requirement: The cell band is drawn wherever the rail is drawn

The rail's cell band MUST be drawn wherever the rail itself is drawn, at every composition, and a
Commander MUST meet each of the rail's figures once on any one screen.

Source: 003/FR-024.

#### Scenario: The rail is drawn at a narrow composition

- **WHEN** the rail is drawn below the wide composition
- **THEN** its cell band is drawn with it

#### Scenario: A figure could appear twice

- **WHEN** one screen draws the rail beside another surface holding the same figure
- **THEN** the Commander meets that figure once

### Requirement: Package-defaulted fixed modules are ordinary build state

Package-defaulted fixed modules MUST appear only as ordinary fitted build state and MUST NOT create
a separate normalization or provenance region.

Status MUST NOT persist or publish import or defaulting history derived from fixed-module state to
stored builds, links, SLEF or edit history.

Source: 003/FR-013, 003/FR-014.

#### Scenario: A fixed mount was defaulted on load

- **WHEN** package construction populated a fixed mount with its hull default
- **THEN** the module appears as ordinary fitted state and raises nothing of its own
- **AND** no normalization or provenance region is drawn

#### Scenario: The build is stored or shared

- **WHEN** a build is stored, shared as a link or exported as SLEF
- **THEN** no import or defaulting history derived from fixed-module state goes with it
