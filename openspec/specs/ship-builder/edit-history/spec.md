## Purpose

Commanders undo and redo the edits they make to the active build during a session. The history holds
Commander decisions only, and it holds them in memory.

## Requirements

### Requirement: Undo and redo restore a build exactly

Undo and redo MUST restore all modelled fields exactly, MUST recompute package results, and MUST
cover module, engineering, power, ship name and ident edits.

Captured purchase values MUST NOT be retained as modelled fields or history state. Loading, editing,
undoing or redoing a build never restores a historical purchase price; current cost is recalculated
from the Almanac catalogue.

Source: 002/FR-016, 002/SC-003.

#### Scenario: A Commander undoes an edit

- **WHEN** a Commander undoes a build edit held in the retained history
- **THEN** every modelled field of the earlier build is restored exactly
- **AND** every package result is recomputed

#### Scenario: A Commander redoes an edit

- **WHEN** a Commander redoes an edit they undid
- **THEN** the later build is reproduced exactly

#### Scenario: The ship is named

- **WHEN** a Commander sets the ship name or the ship ident
- **THEN** the change is undone and redone like any other edit

#### Scenario: An undone build is priced

- **WHEN** a build is restored by undo or redo
- **THEN** its cost is recalculated from the current Almanac catalogue
- **AND** no historical purchase price is restored

### Requirement: History holds 100 session-only decisions

History MUST retain exactly the 100 most recent Commander decisions, MUST remain session-only and
MUST be discarded when the active build is replaced. It MUST NOT enter storage, links, SLEF or
browser navigation.

One Commander decision creates one history step.

Source: 002/FR-017.

#### Scenario: A Commander makes a 101st edit

- **WHEN** a Commander makes more than 100 edits
- **THEN** the history holds exactly the 100 most recent decisions

#### Scenario: A new edit follows an undo

- **WHEN** a Commander makes a new edit after an undo
- **THEN** the redo path is discarded

#### Scenario: The active build is replaced

- **WHEN** the active build is replaced
- **THEN** the history is discarded

#### Scenario: The build leaves the session

- **WHEN** a build is stored, shared as a link, exported as SLEF or reached through browser
  navigation
- **THEN** the history is not carried with it

### Requirement: Viewing conditions and normalisation stay out of history

Viewing conditions and automatic normalisation MUST NOT enter edit history.

Source: 002/FR-018.

#### Scenario: A viewing condition changes

- **WHEN** a Commander changes a viewing condition
- **THEN** no history step is created

#### Scenario: The package normalises a build

- **WHEN** the package normalises an incoming build automatically
- **THEN** no history step is created
