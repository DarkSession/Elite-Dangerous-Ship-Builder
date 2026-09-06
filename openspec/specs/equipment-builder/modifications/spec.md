## Purpose

The engineering modifications a Commander fits to a suit and to each weapon on
the equipment bench: which slots a grade unlocks, which modifications a slot
offers, and what becomes of a modification a locked slot holds.

## Requirements

### Requirement: Unlocked and locked modification slots

The application MUST offer the modification slots the item's grade has unlocked,
and MUST show the remaining slots as locked rather than hiding them.

Source: 013/FR-008.

#### Scenario: A grade unlocks part of the slots

- **WHEN** a Commander opens the modification slots of an item at grade 5
- **THEN** four slots are open

#### Scenario: The slots a grade has not unlocked stay visible

- **WHEN** a Commander opens the modification slots of an item at grade 3
- **THEN** two slots are open
- **AND** the remaining two are shown as locked rather than hidden

#### Scenario: An item with no grade ladder unlocks no slot

- **WHEN** a Commander selects the Flight Suit, whose maximum grade is 1
- **THEN** the modification region states that the suit unlocks no modification
  slot, rather than showing four locked slots without explanation

### Requirement: The modifications a slot offers

The application MUST offer only the modifications the library publishes for that
kind of item, and MUST NOT offer one twice on the same item.

Source: 013/FR-009.

#### Scenario: Only the modifications for that kind of item are offered

- **WHEN** a Commander opens a modification slot on a weapon
- **THEN** only the modifications the library publishes for weapons are offered

#### Scenario: The same modification is offered for two slots of one item

- **WHEN** a modification the library publishes for two slots of one item is
  already fitted in one of them
- **THEN** the second offer states why it is unavailable, and the modification
  can be fitted once per item only

### Requirement: Engineers are not named

The application MUST NOT name the engineers who grant a modification. The library
records them and the reference draws none.

Source: 013/FR-010.

#### Scenario: A fitted modification is read

- **WHEN** a Commander reads a fitted modification
- **THEN** it is named with its status and its materials
- **AND** no engineer is named

### Requirement: A modification a locked slot holds

A modification held by a slot that is currently locked MUST be retained, MUST be
excluded from the material requirement, and MUST return to effect when the grade
that unlocks its slot is restored.

Source: 013/FR-011.

#### Scenario: A lowered grade locks a slot that holds a modification

- **WHEN** a Commander lowers a grade 5 item to grade 3 while a modification sits
  in its fourth slot
- **THEN** the modification is retained and shown as held by a locked slot
- **AND** it is not counted in the material requirement

#### Scenario: The grade is raised again

- **WHEN** the Commander raises the grade that unlocks the slot
- **THEN** the held modification returns to effect

### Requirement: Clearing a modification slot

Users MUST be able to clear a modification slot.

Source: 013/FR-012.

#### Scenario: A fitted modification is removed

- **WHEN** a Commander clears a slot holding a modification
- **THEN** the slot is empty and offers the modifications it accepts again
