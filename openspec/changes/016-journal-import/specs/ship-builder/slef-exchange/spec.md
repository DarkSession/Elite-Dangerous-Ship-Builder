## MODIFIED Requirements

### Requirement: Import accepts one entry within a stated size limit

Import MUST be available without an active build and MUST accept pasted SLEF JSON
or one journal `Loadout` event.

Pasted input MUST hold exactly one build and a maximum of 64 KiB. Larger input MUST
be rejected before parsing and MUST name the limit. A paste holding more than one
entry MUST be refused as a whole.

Journal files are the other way in, and they are bounded by their own capability
rather than by these two figures: a log holds every loadout a Commander has flown,
so a file may hold many `Loadout` events and the Commander selects which of them to
import.

Source: 004/FR-007, 004/FR-008, 016/FR-007.

#### Scenario: No build is active

- **WHEN** no build is active
- **THEN** import is still available

#### Scenario: Input is larger than the limit

- **WHEN** pasted input is larger than 64 KiB
- **THEN** it is rejected before parsing
- **AND** the refusal names the 64 KiB limit

#### Scenario: Input holds more than one entry

- **WHEN** pasted input is empty, malformed or holds more than one entry
- **THEN** it is refused as a whole

#### Scenario: A journal file holds many events

- **WHEN** a Commander supplies a journal file holding twelve `Loadout` events
- **THEN** none of them is refused for the count
- **AND** the twelve are offered for selection

## ADDED Requirements

### Requirement: The Commander selects which loadout events to import

Where a source holds more than one `Loadout` event, the application MUST list them
and MUST let the Commander select one or more. The list MUST state how many events
were found and how many are selected.

Each listed event MUST be identified by what tells it apart: the ship's name where
the event carries one, its ident, its hull, how many modules it fits, and when the
line was written. The hull's name MUST come from the package's ship catalogue and
MUST NOT be derived from the symbol the file carries.

Loading MUST be refused while nothing is selected, and the refusal MUST say so.
Where a source holds exactly one event, no list MUST be shown and the event MUST be
imported as a paste of it is.

Source: 016/FR-008.

#### Scenario: Several events are found

- **WHEN** a scan finds six `Loadout` events
- **THEN** the six are listed with their ship name, ident, hull, module count and time
- **AND** the list states that six were found and how many are selected

#### Scenario: An unnamed ship is listed

- **WHEN** a listed event carries no ship name
- **THEN** the row is identified by the hull name the package publishes

#### Scenario: Nothing is selected

- **WHEN** a Commander clears the selection and asks to load
- **THEN** the application refuses and says nothing is selected

### Requirement: One selected event replaces the active build

Where exactly one event is selected, import MUST behave as it does for a pasted
entry: the package validates and normalises it, and it becomes the active build.
The imported build MUST NOT also be written to a named record, because autosave
already holds it.

Source: 016/FR-009.

#### Scenario: One event is selected

- **WHEN** a Commander selects one event from a journal file and loads it
- **THEN** it becomes the active build
- **AND** no named record is created for it

### Requirement: Several selected events are saved rather than opened

Where more than one event is selected, every selected event MUST be constructed and
stored as its own saved record, and none of them MUST become the active build. The
build the Commander was working on MUST be left exactly as it was.

The application MUST then open the saved builds layer, so the Commander chooses
which of the imported builds to open. The outcome MUST state how many builds were
imported.

Source: 016/FR-010, 016/SC-003.

#### Scenario: Three events are selected

- **WHEN** a Commander selects three events and loads them
- **THEN** three saved records exist, one per event
- **AND** the active build is the one that was already open

#### Scenario: The saved builds layer follows an import

- **WHEN** an import of several events finishes
- **THEN** the saved builds layer opens listing them
- **AND** the outcome states how many were imported

### Requirement: A refused entry in a batch costs only itself

Where several events are imported together and the package refuses one, the
refusal MUST name that entry and the remaining entries MUST still be stored. A
refused entry MUST leave no partial record behind.

Package diagnostics MUST keep their entry index, path, code, constraint and
parameters, as they do for a single import.

Source: 016/FR-011.

#### Scenario: One of several entries is refused

- **WHEN** four events are selected and the package refuses the second
- **THEN** three records are stored
- **AND** the refusal names the entry it is about, with its diagnostics
- **AND** no record exists for the refused entry
