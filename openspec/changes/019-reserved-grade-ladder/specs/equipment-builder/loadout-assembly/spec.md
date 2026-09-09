## ADDED Requirements

### Requirement: The list an item is chosen from holds its place

The bench states the selected item: what it is, the grade it is at, the items it can be
swapped for, its attributes and its modification slots. An empty weapon mount is a selected
item too, and the library publishes no grade for one, so it offers no grade choice
(013/FR-002a).

Choosing an item MUST NOT move the list it was chosen from. The list MUST also stand in the
same place whichever item is selected, so that a Commander who opens one item after another
reads each list where the last one was.

The same MUST hold at the empty bench. The suit gate stands in place of the selected item,
and the list of suits it offers MUST hold its place when a suit is chosen from it.

Source: 019/FR-001.

#### Scenario: A weapon is fitted into an empty mount

- **WHEN** a Commander opens an empty weapon mount and chooses a weapon from the list it
  offers
- **THEN** the list they chose from is where it was before the choice
- **AND** the weapon's grade choice is stated

#### Scenario: The first suit is chosen at the empty bench

- **WHEN** a Commander chooses a suit from the list the suit gate offers
- **THEN** the list they chose from is where it was before the choice

#### Scenario: An empty mount is opened after a fitted item

- **WHEN** a Commander reads a fitted item and then opens an empty weapon mount
- **THEN** the list of weapons the mount offers stands where the fitted item's own list stood

### Requirement: Space held for an absent grade choice states nothing

Where the bench holds space for a grade choice the selected item does not offer, that space
MUST be hidden from the accessibility tree and MUST NOT be a control.

An item that publishes no grade has no grade to state, and a control that answers nothing is
worse than no control. Holding the space is the whole of what it does.

Source: 019/FR-002.

#### Scenario: A reader reaches an empty weapon mount

- **WHEN** a Commander using a screen reader reads an empty weapon mount
- **THEN** nothing is announced where the grade choice would stand

#### Scenario: The held space is not a control

- **WHEN** a Commander reads the controls an empty weapon mount offers
- **THEN** the space held for the grade choice is not one of them
