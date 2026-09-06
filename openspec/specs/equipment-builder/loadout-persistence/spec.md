## Purpose

Keeping an on-foot loadout and handing it on: naming it, saving it in the
Commander's own browser, reopening or deleting it, exporting it as a link, a
payload or a readable summary, and reaching the bench at its own address.

## Requirements

### Requirement: Naming, saving, reopening and deleting a loadout

Users MUST be able to name the open loadout, save it, reopen a saved loadout and
delete one.

Source: 013/FR-016.

#### Scenario: A named loadout is saved

- **WHEN** a Commander saves an edited loadout under a name
- **THEN** it appears in the saved list, identified by that name, its suit and its
  modification count

#### Scenario: A saved loadout is reopened

- **WHEN** a Commander opens a saved loadout
- **THEN** every choice is restored exactly as saved

### Requirement: Saving under the name of an existing loadout

Saving under the name of an existing loadout MUST ask whether to replace it or
keep both.

Source: 013/FR-017.

#### Scenario: The name is already taken

- **WHEN** a Commander saves the open loadout under the name of a saved loadout
- **THEN** they are asked whether to overwrite it or keep both copies

### Requirement: Saved loadouts stay in the Commander's browser

Saved loadouts MUST survive closing and reopening the application, and MUST live
only in the Commander's own browser.

Source: 013/FR-018.

#### Scenario: The application is closed and reopened

- **WHEN** a Commander saves several named loadouts and reloads the application
- **THEN** every saved loadout reopens with the suit, grade, weapons, grades and
  modifications it was saved with

#### Scenario: The browser store is unavailable or full

- **WHEN** every browser store is unavailable or full and a Commander saves
- **THEN** saving fails with a statement of what happened
- **AND** the open loadout is not lost

### Requirement: Saving and sharing carry held content

A saved loadout and a shared link MUST carry the content the bench is holding —
a weapon in a mount the current suit does not carry, and a modification a locked
slot holds — as well as what is in effect, so that neither saving nor sharing
discards a choice the Commander has made.

Source: 013/FR-018a.

#### Scenario: A link restores held content

- **WHEN** a Commander copies the link of a loadout that holds content and opens
  it
- **THEN** the same suit, grades, weapons and modifications are restored,
  including any the bench was only holding

### Requirement: A stored loadout this version cannot rebuild

A stored loadout this version cannot rebuild MUST be reported as unopenable and
MUST be left in store exactly as it was.

Source: 013/FR-019.

#### Scenario: An unrebuildable stored loadout is opened

- **WHEN** a Commander opens a stored loadout this version cannot rebuild
- **THEN** the Commander is told it could not be opened
- **AND** the stored loadout is left intact

### Requirement: Exporting the open loadout

Users MUST be able to export the open loadout as a link that restores it, as a
structured payload, and as a readable summary.

A link MUST restore exactly the loadout it was made from, including the weapons
and modifications the bench was only holding, for every loadout the application
can build.

Source: 013/FR-020, 013/SC-005.

#### Scenario: A link is exported and opened

- **WHEN** a Commander copies the link of an open loadout and opens it
- **THEN** the same suit, grades, weapons and modifications are restored
- **AND** the weapons and modifications the bench was only holding are restored
  with them

#### Scenario: A readable summary is exported

- **WHEN** a Commander exports a readable summary
- **THEN** it names the suit, its grade, each weapon with its grade, and each
  fitted modification

### Requirement: A link that names unresolvable equipment

A link that names equipment the application cannot resolve MUST say what could
not be resolved and MUST NOT replace the open loadout with a partial one.

A link is the only way a loadout comes in. The bench offers no route for reading
an exported payload back, and the structured payload leaves the bench for other
tools.

Source: 013/FR-021.

#### Scenario: A link names equipment this version does not recognise

- **WHEN** a Commander opens a link that names equipment this version does not
  recognise
- **THEN** the Commander is told what could not be resolved
- **AND** nothing already open is replaced by a partial loadout

### Requirement: The bench has its own address

The bench MUST be reachable at its own address, and that address MUST restore the
bench directly rather than by way of another screen.

Source: 013/FR-027.

#### Scenario: The bench address is opened

- **WHEN** a Commander opens the bench's own address
- **THEN** the bench is restored directly, and not by way of another screen
