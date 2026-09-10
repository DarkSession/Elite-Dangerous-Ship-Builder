## MODIFIED Requirements

### Requirement: Announcement of errors and changes

A blocking error MUST be announced promptly. Other changes MUST be announced without
interrupting current speech and without announcing unaffected values.

Two distinct events MUST each be announced, whether or not they are spoken in the same
words. A live region announces a change to what it holds, and the same sentence written
over itself is not a change: a second screen that could not be opened says exactly what the
first one said, and without this it would be the silence this requirement exists to
prevent. A replay of one event is still one event and MUST stay silent.

Where the application cannot tell a second occurrence of something from a restatement of
the first, it MUST announce. A reader told twice about one event has heard a repetition; a
reader told nothing about the second of two events has lost it, and has no way of knowing
they have. A reading a Commander is narrowing is one such event each time it changes,
in either direction.

Source: 011/FR-009.

#### Scenario: A blocking error occurs

- **WHEN** a blocking error occurs
- **THEN** the application announces it promptly

#### Scenario: A value changes while speech is in progress

- **WHEN** a change other than a blocking error occurs
- **THEN** the application announces it once without interrupting current speech
- **AND** it does not announce values the change did not affect

#### Scenario: The same thing goes wrong twice

- **WHEN** two separate events occur that are announced in identical words
- **THEN** the live region carrying them changes for each of them
- **AND** neither is left unsaid because the words did not move

#### Scenario: One event is published twice

- **WHEN** the same event is published again, describing nothing that has happened since
- **THEN** the live region carrying it does not change
- **AND** a reader is not told anything a second time

#### Scenario: A reading falls

- **WHEN** a Commander narrows a filter and the reading it publishes is lower than the one
  before it
- **THEN** the new reading is announced
- **AND** it is announced again for each further narrowing

#### Scenario: A second outcome for one subject

- **WHEN** an action is repeated on one subject and reports something other than what it
  reported the first time
- **THEN** the new outcome is announced
