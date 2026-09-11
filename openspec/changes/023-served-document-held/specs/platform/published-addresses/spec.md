## ADDED Requirements

### Requirement: What an address served is held until a screen replaces it

The application MUST hold what an address served until a navigation presents a screen to replace
it. A Commander arrives at what the address answered with, and the takeover MUST NOT discard that
before there is something to put in its place.

The hold MUST end only where a screen is presented. A navigation that ends any other way — it
failed, it was cancelled with nothing taking over, or it was cancelled and replaced by one that
then ended without presenting a screen — MUST leave the Commander on the content the address
served. A redirect, or an address that resolves elsewhere, is one presentation with whatever
replaces it, so it does not spend the hold. What is said about any of those outcomes is
`platform/navigation-waiting`, "A navigation that fails" and "The statement ends with the
navigation", and this requirement adds nothing to either.

Where the address served the application's own shell rather than a generated document, nothing is
held: the shell is what the Commander keeps, because the shell is what they were given. That is
every address the build generates no document for, and it is also how this rule reads at an address
answered from the cache by the shell.

Held content MUST be kept as the address served it. It MUST NOT be rebuilt, recomputed or written
again, it MUST carry the language it was served in, and the application MUST NOT present it as a
screen it has opened.

Putting held content back MUST be invisible, on the same terms as the takeover itself: no frame may
be emptier than the frame before it, and the content MUST NOT blank and return. This requirement
claims none of the three exceptions the invisible takeover names, so a removal and a restore that a
Commander could see would breach it.

A screen that is presented replaces what the address served, and holding MUST NOT delay that, move
anything visible, or blank the page. A navigation that fails after a screen has been presented MUST
leave the Commander on the screen they are on, and nothing the address served may be put back over
it.

Source: 023/FR-001.

#### Scenario: A navigation fails before any screen is presented

- **WHEN** a navigation fails before any screen has been presented in the session, at an address
  that served a generated document
- **THEN** the Commander is left on the content that address served

#### Scenario: The first navigation is cancelled with nothing taking over

- **WHEN** the session's first navigation is cancelled and nothing takes over from it
- **THEN** the Commander is left on the content the address served

#### Scenario: The first navigation is replaced, and the replacement presents no screen

- **WHEN** the session's first navigation is cancelled or redirected to another address
- **AND** the navigation that replaces it ends without presenting a screen
- **THEN** the Commander is left on the content the address served

#### Scenario: Held content is put back without a visible change

- **WHEN** content the address served is put back
- **THEN** no frame is emptier than the frame before it
- **AND** the content does not blank and return

#### Scenario: A navigation presents a screen

- **WHEN** a navigation presents a screen
- **THEN** the screen replaces what the address served
- **AND** nothing visible moves and no frame is emptier than the frame before it

#### Scenario: The address served the shell

- **WHEN** a navigation fails at an address that served the application's own shell
- **THEN** nothing is held
- **AND** the Commander is left on that shell

#### Scenario: Held content is not rebuilt

- **WHEN** content the address served is held
- **THEN** it is kept as the address served it
- **AND** no figure in it is recomputed and no sentence is written for it

#### Scenario: Held content states the language it is in

- **WHEN** held content is in a language other than the one the application is running in
- **THEN** the held content states the language it was served in

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
document because no screen was presented MUST stay in the bundled English it was served in, and
MUST say so by carrying that language. The catalogue is applied by rendering the screen in it, so
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
- **THEN** that content holds the English words it was served with, untranslated and with no
  disclosure written into it
- **AND** it states that it is in English, while the application around it states German
