## ADDED Requirements

### Requirement: Starting an empty bench

The application MUST offer a way to start an empty bench while the bench is open. Starting
one MUST leave the bench in the state it holds before a suit is chosen, with the suit gate
standing and every region drawn and inert.

Starting an empty bench MUST clear the loadout's name, the saved record the loadout belongs
to, the undo and redo history, and the loadout the address carries. It MUST NOT be
confirmed: the loadout that was on the bench stays as the record it is autosaved to, so
there is nothing to lose and nothing to ask about. Starting an empty bench while the bench
is already empty MUST change nothing.

Source: 017/FR-006.

#### Scenario: A loadout is on the bench

- **WHEN** a Commander starts an empty bench while a loadout is on it
- **THEN** the bench holds no loadout and the suit gate stands
- **AND** the Commander is asked nothing

#### Scenario: The loadout that was on the bench

- **WHEN** a Commander starts an empty bench while a loadout is on it
- **THEN** the loadout that was on the bench is still listed as its record
- **AND** a named record it was opened from is unchanged

#### Scenario: The address after an empty bench is started

- **WHEN** a Commander starts an empty bench
- **THEN** the address carries no loadout

#### Scenario: The history after an empty bench is started

- **WHEN** a Commander starts an empty bench and then asks to undo
- **THEN** there is nothing to undo, because the choices before it belong to a loadout that
  is no longer on the bench

#### Scenario: The bench is already empty

- **WHEN** a Commander starts an empty bench while the bench holds no loadout
- **THEN** nothing changes and nothing is written
