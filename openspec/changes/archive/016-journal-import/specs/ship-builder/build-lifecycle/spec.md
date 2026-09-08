## MODIFIED Requirements

### Requirement: Naming, saving and removing a record

Duplicate names MUST be allowed after warning. Removing a record MUST require a confirmed deletion,
the manual save that consumes it, or the expiry this capability defines, and nothing else may remove
one. Deleting the record this page is autosaving into MUST clear the active build to the no-build
state rather than leave it on screen with nowhere to write: the Commander asked for that build to go,
and the confirmation named it. A manual save MUST consume the unnamed record it saved from and MUST
leave no copy of it behind: naming an unnamed record MUST name that same local identity, and writing
the build into an existing record MUST delete the unnamed record afterwards. Saving a copy under
another name MUST create a further record and leave the original where it is. Replacing the active
build MUST NOT be confirmed, because autosave leaves nothing to lose.

Naming, renaming and saving a copy MUST be offered on the build that is open, and MUST NOT be offered
as actions on a row of the library. The library MUST commit exactly two: open the record that was
chosen, and delete it. A record is renamed by opening it and saving it under another name over the
save it came from, and copied by opening it and saving it as a new build.

A journal import is the one route that stores a named record with no build open. A
Commander who selects several loadout events is not shown any of them, so there is
no open build to name them from, and each stored record MUST take its name from the
build it holds: its ship name, its ident where it carries no ship name, or its hull
name where it carries neither. Names stored this way MUST NOT be made unique, and
the Commander MUST NOT be asked about a name two of them share, because a batch is
one action and a question for every clash in it would be a queue of questions
nobody asked for.

A save that writes nothing MUST say so, and MUST leave what the Commander typed on screen for them to
try again with. A build looks the same whether its save landed or not, so a layer that closes over a
full store, a lock it could not take or a record removed in another tab is the one way an edit is
lost without anyone being told. The same holds for an answer to a save conflict.

Source: 001/FR-009, 016/FR-012.

#### Scenario: Naming an unnamed record

- **WHEN** a Commander saves an unnamed build under a name
- **THEN** the same local identity takes the name
- **AND** no copy of the unnamed record is left behind

#### Scenario: Saving over an existing record

- **WHEN** a Commander saves the open build into an existing record
- **THEN** the unnamed record the build was autosaved to is deleted afterwards

#### Scenario: Saving a copy under another name

- **WHEN** a Commander saves the open build as a new build under another name
- **THEN** a further record is created
- **AND** the record it was opened from stays where it is

#### Scenario: A name already in use

- **WHEN** a Commander saves under a name another record already carries
- **THEN** the application warns
- **AND** the duplicate name is allowed

#### Scenario: Deleting the record the workspace is autosaving into

- **WHEN** a Commander confirms deletion of the record this page is autosaving into
- **THEN** the active build clears to the no-build state
- **AND** the no-build state explains how to select a hull, open a save or paste a link, as it does before a Commander has built anything

#### Scenario: A save writes nothing

- **WHEN** a save or an answer to a save conflict fails to write
- **THEN** the application says the save wrote nothing
- **AND** what the Commander typed stays on screen to try again with

#### Scenario: A batch of imported builds is stored

- **WHEN** a Commander imports several loadout events from a journal
- **THEN** each record is named by the build's ship name, by its ident where there is no
  ship name, or by its hull name where there is neither
- **AND** nothing is asked about a name two of the records share

### Requirement: Stored entry facts and listing

Stored entries MUST state their name or that they have none, hull, last-modified time and the
validation state recorded at that time. An unnamed entry MUST also state how long it has before it
expires, and MUST be titled by the build's own ship name, by its ident where there is no ship name,
or by the hull name where there is neither.

Entries MUST be listed as one list in one order, and MUST NOT be divided into a group of named
records and a group of unnamed ones. The last-modified time MUST be stated as how long ago the entry
was edited, in the active locale's own words; the instant itself MUST remain available as text, so
that nothing is lost to a reader who needs it exactly.

The recorded validation, the remaining life and the marker on the record the workspace holds are
stated rather than drawn. The row the workspace holds carries `aria-current` and sits on the amber
edge; a build with issues carries their count on a warm plate beside its title, and a build with none
carries nothing.

The title MUST be read from the build rather than stored on the record, MUST NOT be a name the
application invented, and MUST be distinguished from a name the Commander gave the record. A build
MAY have one local note.

A record a journal import stored is the one exception to the invented name. Where an
imported build carries neither ship name nor ident, its hull name is stored as the
record's name, so the record is kept rather than left to run out on a clock the
Commander never saw. That is the only name the application supplies, it is supplied
on that one route, and nothing else may be added beside it on this precedent.

Source: 001/FR-010, 016/FR-013.

#### Scenario: An unnamed entry is titled from the build

- **WHEN** an unnamed record's build carries a ship name
- **THEN** the entry is titled by that ship name, marked as not a name the Commander gave the record

#### Scenario: An unnamed build carries neither ship name nor ident

- **WHEN** an unnamed record's build has no ship name and no ident
- **THEN** the entry is titled by the hull name

#### Scenario: The ship name changes

- **WHEN** a Commander renames the ship in an unnamed build
- **THEN** the entry's title follows it, because the title is read from the build

#### Scenario: Two unnamed entries share a title

- **WHEN** two unnamed entries carry the same title, because two ships share a name
- **THEN** neither is treated as a duplicate of the other
- **AND** hull, last-modified time and remaining life still tell them apart

#### Scenario: Reading when an entry was edited

- **WHEN** a Commander reads an entry's last-modified time
- **THEN** it is stated as how long ago the entry was edited, in the active locale's own words
- **AND** the instant itself remains available as text

#### Scenario: An imported build carries neither ship name nor ident

- **WHEN** a journal import stores a build that carries no ship name and no ident
- **THEN** the record is named by the hull name the package publishes
- **AND** the record is kept rather than expiring
