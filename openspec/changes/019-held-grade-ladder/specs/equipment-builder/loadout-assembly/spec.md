## ADDED Requirements

### Requirement: The list an item is chosen from holds its place

An empty weapon mount is a selected item, and the library publishes no grade for one, so it
offers no grade choice (013/FR-002a).

Choosing an item MUST NOT move the list it was chosen from.

Between one selected item and the next, the grade choice MUST NOT be what moves that list: it
MUST take the same room whether or not the selected item offers one. What an item's own name
and subtitle take is that item's own, and a name that needs two lines takes two.

The same MUST hold at the empty bench, wherever the bench still offers the list of suits
after the choice. Where the choice answers with the loadout it made in place of that list,
there is no list left to hold.

Source: 019/FR-001.

#### Scenario: A weapon is fitted into an empty mount

- **WHEN** a Commander opens an empty weapon mount and chooses a weapon from the list it
  offers
- **THEN** the list they chose from is where it was before the choice
- **AND** the weapon's grade choice is stated

#### Scenario: The first suit is chosen at the empty bench

- **WHEN** a Commander chooses a suit from the list the suit gate offers, and the bench still
  offers that list after the choice
- **THEN** the list is where it was before the choice

#### Scenario: The choice answers with the loadout instead

- **WHEN** a Commander chooses the first suit and the bench answers by stating the loadout in
  place of the list
- **THEN** the loadout is stated, and no list is held

#### Scenario: An empty mount is opened after a fitted item

- **WHEN** a Commander reads a fitted item and then opens an empty weapon mount
- **THEN** the grade choice takes the same room on both, so it moves neither list

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
