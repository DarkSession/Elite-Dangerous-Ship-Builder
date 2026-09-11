## ADDED Requirements

### Requirement: What an address served is held until a screen replaces it

The application MUST hold what an address served until a navigation presents a screen to replace
it. A Commander arrives at what the address answered with, and the takeover MUST NOT discard that
before there is something to put in its place.

Where the first navigation of a session fails at an address the build generates a document for,
the Commander MUST be left on the content that address served, readable, with the failure stated
over it. Where the build generates no document for that address, nothing is held: what the address
served is the application's own shell, and the shell is what the Commander keeps.

Held content MUST be kept as it stands. It MUST NOT be rebuilt, recomputed or written again, and
the application MUST NOT state that it is anything other than what the address served. Nothing
held is presented as a screen the application has opened.

The hold MUST end when a navigation presents a screen. A screen that is presented replaces what
the address served, and holding MUST NOT delay that, move anything visible, or blank the page.

A navigation that fails after a screen has been presented MUST leave the Commander on the screen
they are on. The hold is over by then, and there is nothing to put back.

Source: 023/FR-001.

#### Scenario: The first navigation fails at an address with a generated document

- **WHEN** the first navigation of a session fails at an address the build generates a document
  for
- **THEN** the Commander is left on the content that address served
- **AND** the failure is stated over it

#### Scenario: The first navigation presents a screen

- **WHEN** the first navigation of a session presents a screen
- **THEN** the screen replaces what the address served
- **AND** nothing visible moves and no frame is emptier than the frame before it

#### Scenario: The first navigation fails at an address with no generated document

- **WHEN** the first navigation of a session fails at an address the build generates no document
  for
- **THEN** the Commander is left on the application's own shell
- **AND** the failure is stated over it

#### Scenario: Held content is not rebuilt

- **WHEN** content the address served is held
- **THEN** it is kept as the address served it
- **AND** no figure in it is recomputed and no sentence is written for it

#### Scenario: A navigation fails after a screen has been presented

- **WHEN** a navigation fails after a screen has been presented in this session
- **THEN** the Commander is left on the screen they are on
- **AND** nothing the address served is put back
