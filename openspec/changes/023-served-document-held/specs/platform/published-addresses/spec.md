## ADDED Requirements

### Requirement: What an address served is held until a screen replaces it

The application MUST hold what an address served until a navigation presents a screen to replace
it. A Commander arrives at what the address answered with, and the takeover MUST NOT discard that
before there is something to put in its place.

Where a navigation fails before any screen has been presented in the session, at an address the
build generates a document for, the Commander MUST be left on the content that address served,
readable. This holds for the session's first navigation and for any navigation that replaces it
before a screen is presented — a redirect, or an address that resolves elsewhere, is one
presentation, and a replacement that fails ends it no differently. What is said about the failure
is `platform/navigation-waiting`, "A navigation that fails", and this requirement adds nothing to
it.

Where the build generates no document for the address, nothing is held. What that address served
is the application's own shell, so the shell is what the Commander keeps.

Held content MUST be kept as the address served it. It MUST NOT be rebuilt, recomputed or written
again, and the application MUST NOT present it as a screen it has opened.

The hold MUST end when a navigation presents a screen. A screen that is presented replaces what
the address served, and holding MUST NOT delay that, move anything visible, or blank the page. A
navigation that fails after a screen has been presented MUST leave the Commander on the screen they
are on, and nothing the address served may be put back over it.

Source: 023/FR-001.

#### Scenario: A navigation fails before any screen is presented

- **WHEN** a navigation fails before any screen has been presented in the session, at an address
  the build generates a document for
- **THEN** the Commander is left on the content that address served

#### Scenario: The first navigation is replaced, and the replacement fails

- **WHEN** the session's first navigation is cancelled or redirected to another address
- **AND** the navigation that replaces it fails before any screen has been presented
- **THEN** the Commander is left on the content the address served

#### Scenario: A navigation presents a screen

- **WHEN** a navigation presents a screen
- **THEN** the screen replaces what the address served
- **AND** nothing visible moves and no frame is emptier than the frame before it

#### Scenario: The address has no generated document

- **WHEN** a navigation fails at an address the build generates no document for
- **THEN** nothing is held
- **AND** the Commander is left on the application's own shell

#### Scenario: Held content is not rebuilt

- **WHEN** content the address served is held
- **THEN** it is kept as the address served it
- **AND** no figure in it is recomputed and no sentence is written for it

#### Scenario: A navigation fails after a screen has been presented

- **WHEN** a navigation fails after a screen has been presented in this session
- **THEN** the Commander is left on the screen they are on
- **AND** nothing the address served is put back

## MODIFIED Requirements

### Requirement: Bundled English, replaced by the committed locale

A document MUST be written in bundled English. When the committed locale is not English, the
application replaces the document's text with the committed locale's text once that catalogue
arrives. The replacement changes words only, and MUST NOT reorder anything on the page or remove
anything from it. It MAY reflow, because a translation is not the same length as its source. This
is a named exception to the invisible takeover and to the measured zero-pixel outcome.

The replacement is carried by the screen the application presents. Content held from the served
document because no screen was presented MUST stay in bundled English, and the application MUST
NOT state that it is anything else. The catalogue is applied by rendering the screen in it, so
where the screen's code is what failed to arrive there is nothing that can apply it, and a
translation the application does not have is one it may not write.

Source: 015/FR-011.

#### Scenario: A Commander whose committed locale is not English

- **WHEN** a Commander whose committed locale is German opens a content-bearing address
- **THEN** the document paints English content immediately
- **AND** the takeover replaces the text with the committed locale once that catalogue arrives

#### Scenario: The replacement lands

- **WHEN** the committed locale's text replaces the document's text
- **THEN** nothing on the page is reordered or removed
- **AND** the page may reflow because a translation is not the same length as its source

#### Scenario: No screen is presented to carry the replacement

- **WHEN** a Commander whose committed locale is German is left on content the address served,
  because no screen was presented
- **THEN** that content stays in the bundled English it was served in
- **AND** the application states nothing about it that it cannot state
