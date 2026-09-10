## MODIFIED Requirements

### Requirement: Announcement of errors and changes

A blocking error MUST be announced promptly. Other changes MUST be announced without
interrupting current speech and without announcing unaffected values.

Two distinct events MUST each be announced, whether or not they are spoken in the same
words. A live region announces a change to what it holds, and the same sentence written
over itself is not a change: a second screen that could not be opened says exactly what the
first one said, and without this it would be the silence this requirement exists to
prevent. A replay of one event is still one event and MUST stay silent.

A figure a filter publishes is a distinct event each time it changes, whether it rises or
falls. A condition that arises a second time is a distinct event. An action a Commander
repeats on one subject is a distinct event each time it reports an outcome.

An outcome to a question the Commander has withdrawn MUST NOT be announced. It is the one
distinct event this requirement excuses. Nobody is waiting for it: the question was replaced
or cancelled before the answer arrived.

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

#### Scenario: A filter is narrowed twice

- **WHEN** a Commander narrows a filter twice, and each narrowing lowers the figure it
  publishes
- **THEN** each figure is announced

#### Scenario: A filter is widened

- **WHEN** a Commander widens a filter, and the figure it publishes rises
- **THEN** the figure is announced

#### Scenario: One action is repeated on one subject

- **WHEN** a Commander repeats an action on one subject
- **THEN** each outcome is announced
- **AND** an outcome that differs from the one before it is announced in its own words

#### Scenario: An answer arrives after the question is withdrawn

- **WHEN** an outcome arrives for a request the Commander replaced or cancelled
- **THEN** it is not announced
