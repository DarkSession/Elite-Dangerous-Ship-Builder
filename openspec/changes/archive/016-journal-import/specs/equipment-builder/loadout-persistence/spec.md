## MODIFIED Requirements

### Requirement: Saving under the name of an existing loadout

Saving under the name of an existing loadout MUST ask whether to replace it or
keep both.

A journal import that stores several loadouts MUST NOT ask. Every imported loadout
is kept, alongside anything already saved under the same name, because the
Commander asked for one import rather than for a question about each name in it.

Source: 013/FR-017, 016/FR-016.

#### Scenario: The name is already taken

- **WHEN** a Commander saves the open loadout under the name of a saved loadout
- **THEN** they are asked whether to overwrite it or keep both copies

#### Scenario: An import stores a name already in use

- **WHEN** a journal import stores loadouts under names that are already saved
- **THEN** both copies are kept
- **AND** nothing is asked

### Requirement: A link that names unresolvable equipment

A link that names equipment the application cannot resolve MUST say what could
not be resolved and MUST NOT replace the open loadout with a partial one.

A loadout comes in two ways: a link the bench itself made, and a journal event the
game wrote. The structured payload still leaves the bench for other tools, and the
bench offers no route for reading one back.

Source: 013/FR-021.

#### Scenario: A link names equipment this version does not recognise

- **WHEN** a Commander opens a link that names equipment this version does not
  recognise
- **THEN** the Commander is told what could not be resolved
- **AND** nothing already open is replaced by a partial loadout

## ADDED Requirements

### Requirement: A journal suit loadout comes in

The bench MUST import a journal `SuitLoadout`, `SwitchSuitLoadout` or
`CreateSuitLoadout` event, from a pasted event or from journal files. The event MUST
be read by `parseSuitLoadout` in `@elite-dangerous-almanac/core/equipment/suit-loadout`,
and the application MUST NOT resolve a suit, a weapon, a grade or a modification
itself.

Where a source holds more than one event, the application MUST list them and MUST
let the Commander select one or more, as the ship import does. Each listed loadout
MUST be identified by its loadout name, its suit, its grade, how many weapons it
carries, how many modifications it holds, and when the line was written. The suit's
name MUST come from the package.

Import MUST be available whatever the bench is holding, and MUST leave the bench
untouched until it succeeds.

Source: 016/FR-014.

#### Scenario: An event is pasted

- **WHEN** a Commander pastes a journal `SwitchSuitLoadout` event
- **THEN** the package reads it
- **AND** the suit, its grade, its modifications and the weapon at each mount are restored

#### Scenario: A journal file holds several suit loadouts

- **WHEN** a scanned journal holds four suit loadout events
- **THEN** the four are listed with their name, suit, grade, weapon count, modification
  count and time
- **AND** the Commander selects one or more of them

#### Scenario: An import fails

- **WHEN** the package refuses the event
- **THEN** the bench is left exactly as it was
- **AND** the Commander is told what was refused

### Requirement: What the package could not fit is reported

Where the package reports that it left something out of an imported loadout — a
weapon it does not carry, a mount it does not know, a grade outside the published
range, or a modification it cannot resolve — the application MUST state what was
left out and MUST NOT substitute anything for it.

Source: 016/FR-015.

#### Scenario: An event names a weapon this version does not carry

- **WHEN** an imported event names a weapon the package cannot resolve
- **THEN** the rest of the loadout is imported
- **AND** the application states which entry was left out

#### Scenario: An event names an unknown suit

- **WHEN** an imported event names a suit the package cannot resolve
- **THEN** the event is refused whole
- **AND** the Commander is told the suit was not recognised

### Requirement: One imported loadout opens, several are saved

Where exactly one loadout is selected, it MUST open on the bench.

Where more than one is selected, every selected loadout MUST be saved and none MUST
open, and the bench MUST be left as it was. The application MUST then open the saved
loadouts layer so the Commander chooses what to open, and MUST state how many
loadouts were imported.

An imported loadout MUST be saved under the name the event carries, or under the
suit's own name where the event carries none. Each MUST carry the note that it came
from a journal.

Source: 016/FR-017, 016/SC-004.

#### Scenario: One loadout is selected

- **WHEN** a Commander selects one loadout and loads it
- **THEN** it opens on the bench

#### Scenario: Several loadouts are selected

- **WHEN** a Commander selects three loadouts and loads them
- **THEN** three saved loadouts exist
- **AND** the bench holds what it held before
- **AND** the saved loadouts layer opens, stating that three were imported

#### Scenario: An event carries no loadout name

- **WHEN** an imported event states no loadout name
- **THEN** the saved loadout is named by the suit's own name
