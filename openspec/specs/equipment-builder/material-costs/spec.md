## Purpose

The micro-resources an on-foot loadout requires, totalled by resource across the
climb to each item's grade and one application of each fitted modification, so a
Commander can read the cost of a plan before going to a settlement.

## Requirements

### Requirement: The micro-resources a loadout requires

The application MUST state the micro-resources the loadout requires, as a total
across the whole loadout, taken from the library. The library totals them
(`sumPersonalEngineeringIngredients`), and the application MUST NOT reimplement
that totalling.

Source: 013/FR-013, 013/SC-003.

#### Scenario: The material requirement is read

- **WHEN** a Commander reads the material requirement of a loadout with
  modifications fitted
- **THEN** it lists each micro-resource and the total quantity across every climb
  and every fitted modification

### Requirement: Both costs an on-foot loadout carries

The material requirement MUST cover both of the costs an on-foot loadout carries:
one application of each fitted modification, and the climb to each item's
selected grade — the suit's and every fitted weapon's, counted from grade 1.

A grade a Commander has not asked for costs nothing, so an item at grade 1 adds
nothing to the total, and neither does an item with no grade ladder to climb.
Every item on the bench is one the library named, so a library answer of _no
recipe_ means the item has no ladder to climb rather than that the item is
unknown.

Source: 013/FR-014.

#### Scenario: A raised item with no modification still costs

- **WHEN** a Commander raises a suit above grade 1 and fits no modification
- **THEN** the material requirement states the climb to that grade rather than
  nothing to gather

#### Scenario: An item at grade 1 adds nothing

- **WHEN** a loadout holds an item at grade 1, or an item with no grade ladder to
  climb
- **THEN** that item adds nothing to the total

### Requirement: Requirements that vary by damage type

Where a modification's requirement differs by the weapon's damage type, the
stated requirement MUST be the one for the weapon it is fitted to. The library
resolves it (`resolvePersonalModificationForWeapon`), and the application MUST
NOT reimplement that resolution.

Source: 013/FR-015.

#### Scenario: One modification on two damage types

- **WHEN** a modification whose requirement differs by damage type is fitted to a
  kinetic weapon and to a plasma weapon
- **THEN** the stated materials are those of the weapon it is fitted to
