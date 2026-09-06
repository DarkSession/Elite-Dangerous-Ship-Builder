## Purpose

Reading the Elite Dangerous game journal files a Commander selects: taking the
files, holding them to a size bound, framing the log's lines, and listing the
loadout events they hold for the tool that asked. The whole scan runs in the
Commander's browser and sends nothing.

## ADDED Requirements

### Requirement: A Commander supplies journal files by selection or by drop

The application MUST accept journal files two ways: a file control the Commander
opens, and a drop target the Commander drags files onto. Both MUST take several
files at once, and both MUST accept the extensions the game writes and the
extensions an exported payload carries — `.log`, `.json` and `.txt`.

The drop target MUST state that it is one, and MUST show that it has taken a drag
before the drop. The file control MUST be operable without a pointer and MUST carry
its own label, because a drop target alone is not an affordance every Commander
has.

A file MUST be read in the browser. The application MUST NOT send a file, a line of
one, or anything derived from one to any origin.

Source: 016/FR-001.

#### Scenario: Files are selected

- **WHEN** a Commander opens the file control and selects three journal files
- **THEN** all three are scanned

#### Scenario: Files are dropped

- **WHEN** a Commander drags files over the drop target
- **THEN** the target states that it will take them
- **AND** dropping them scans the same way selecting them does

#### Scenario: Nothing leaves the device

- **WHEN** a Commander imports from journal files
- **THEN** no network request is made

### Requirement: Every file is held to a stated size bound

A file larger than 25 MB MUST be refused before it is read. The refusal MUST name
the file and MUST name the bound.

The bound is per file. There MUST be no bound on how many files a Commander
selects; the application MUST scan them one at a time and MUST keep only the events
it found, so that the memory a selection costs follows the events rather than the
bytes.

Source: 016/FR-002.

#### Scenario: A file is over the bound

- **WHEN** a Commander selects a file larger than 25 MB
- **THEN** it is refused before it is read
- **AND** the refusal names that file and the 25 MB bound

#### Scenario: Several large files are selected

- **WHEN** a Commander selects twenty files inside the bound
- **THEN** every file is scanned
- **AND** the application holds the events it found rather than the files

### Requirement: The application frames the log and the package reads the payload

A journal file is a log of one JSON object per line. The application MUST own that
framing and nothing beyond it: it MUST split the file into lines, and it MUST hand
each candidate line to `@elite-dangerous-almanac/core` unchanged.

The application MUST NOT read a payload field to decide what a line means, repair a
line, or complete one. It MAY read the two fields that name the log line rather than
the loadout — the event name and the timestamp — because those belong to the
container it frames. A line the package refuses MUST be left out rather than
guessed at.

A file MAY instead hold one whole payload rather than a log — an exported SLEF file
or a single event object. The application MUST hand such a file to the package
whole.

Source: 016/FR-003.

#### Scenario: A journal log is scanned

- **WHEN** a Commander supplies a `Journal.*.log` file
- **THEN** each line is handed to the package unchanged
- **AND** the application reads no payload field of its own

#### Scenario: A line is malformed

- **WHEN** a line is not a complete JSON object, or the package refuses it
- **THEN** it is left out of the list
- **AND** the application repairs nothing

#### Scenario: A file holds one payload

- **WHEN** a selected file holds one exported payload rather than a log
- **THEN** the file is handed to the package whole

### Requirement: What was scanned is reported

After a scan the application MUST state what it read — the file's name where one
file was supplied, the count where several were — and how many loadout events it
found.

A scan that finds no event the tool asked for MUST be refused, and the refusal MUST
name the files that were scanned.

Source: 016/FR-004.

#### Scenario: One file is scanned

- **WHEN** one journal file holding four events is scanned
- **THEN** the application states that file's name and that it found four

#### Scenario: Several files are scanned

- **WHEN** five journal files are scanned
- **THEN** the application states that five files were read and how many events they hold

#### Scenario: No event is found

- **WHEN** the scanned files hold no event the tool asked for
- **THEN** the scan is refused
- **AND** the refusal names the files that were scanned

### Requirement: Events are listed once each, newest first

The events a scan found MUST be listed newest first, by the timestamp of the line
each was written on. Two events that describe the same loadout MUST be listed once,
whether they came from one file or from several, because a journal writes a loadout
again every time a session starts.

Where a scan finds one event only, no list MUST be shown: there is nothing to
choose between.

Source: 016/FR-005.

#### Scenario: Overlapping files are scanned

- **WHEN** two journal files that overlap are scanned
- **THEN** an event they both hold is listed once

#### Scenario: A single event is found

- **WHEN** a scan finds exactly one event
- **THEN** no selection list is shown

### Requirement: A scan states its progress and holds its budget

While files are scanned the application MUST state that a scan is running and MUST
name how many files it is reading. The surface MUST stay usable and the statement
MUST reach a screen reader.

A 25 MB file MUST be scanned within 5 seconds in the `.devcontainer/` reference
environment.

Source: 016/FR-006, 016/SC-001, 016/SC-002.

#### Scenario: Several files are read

- **WHEN** a Commander supplies several files
- **THEN** the application states that it is scanning them and how many
- **AND** the statement reaches a screen reader

#### Scenario: A file at the bound is scanned

- **WHEN** a 25 MB journal file is scanned in the reference environment
- **THEN** the scan completes within 5 seconds
