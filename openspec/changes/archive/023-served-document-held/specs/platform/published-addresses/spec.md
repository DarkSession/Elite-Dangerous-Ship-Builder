## ADDED Requirements

### Requirement: What an address served is held until a screen replaces it

The application MUST hold what an address served until a navigation presents a screen to replace
it. A Commander arrives at what the address answered with, and the takeover MUST NOT discard that
before there is something to put in its place.

The hold MUST end only where a screen is presented, and it ends there. While it stands, a
navigation that ends any other way MUST leave the Commander on the content the address served.
That is a navigation that failed, one cancelled with nothing taking over, and one cancelled and
replaced by a navigation that then ended without presenting a screen. A redirect, or an address
that resolves elsewhere, counts once with whatever replaces it, so the hold does not end there.
Where what takes over is the address already open, which the application answers without
navigating, no screen is presented and the hold stands. What is said about any of those outcomes
is `openspec/specs/platform/navigation-waiting/`, "A screen that never arrives is stated, not
silently abandoned" and "The statement ends with the navigation", and this requirement adds
nothing to either.

Where an address served the application's own shell, nothing is held: the shell is what the
Commander keeps, because the shell is what they were given. That is every address the build
generates no document for, and it is the same answer wherever else the shell is what arrived. The
shell is the readable document "A takeover that does not complete" (015/FR-012) leaves such a
Commander with, so that requirement is met there without anything being held.

What the address served MUST be kept until the hold ends. It MUST be kept as the address served
it: not rebuilt, not recomputed, not written again. Where a navigation
ends without presenting a screen, it is what the Commander is left on, and it MUST carry the
language it was served in.

Putting held content back MUST be invisible, on the same terms as the takeover itself: no content
the Commander can see may move position, no frame may be emptier than the frame before it, and the
content MUST NOT blank and return. This requirement claims none of
the three exceptions the invisible takeover names, so a removal and a restore that a Commander
could see would breach it.

A screen that is presented replaces what the address served, and holding MUST NOT move anything
visible or blank the page while it does. A navigation that fails after a screen has been presented
MUST leave the Commander on the screen they are on, and nothing the address served may be put back
over it.

Source: 023/FR-001.

#### Scenario: A navigation fails before any screen is presented

- **WHEN** a navigation fails before any screen has been presented in the session, at an address
  that served a generated document
- **THEN** the Commander is left on the content that address served

#### Scenario: A navigation is cancelled with nothing taking over

- **WHEN** a navigation is cancelled before any screen has been presented in the session, and
  nothing takes over from it
- **THEN** the Commander is left on the content the address served

#### Scenario: A navigation is replaced, and the replacement presents no screen

- **WHEN** a navigation is cancelled or redirected to another address before any screen has been
  presented in the session
- **AND** the navigation that replaces it ends without presenting a screen
- **THEN** the Commander is left on the content the address they opened served

#### Scenario: What takes over is the address already open

- **WHEN** a navigation is cancelled before any screen has been presented in the session, and what
  takes over is the address already open, which the application answers without navigating
- **THEN** the Commander is left on the content the address served

#### Scenario: Held content is put back without a visible change

- **WHEN** content the address served is put back
- **THEN** no content the Commander can see moves position
- **AND** no frame is emptier than the frame before it
- **AND** the content does not blank and return

#### Scenario: A navigation presents a screen

- **WHEN** a navigation presents a screen while content the address served is kept
- **THEN** the screen replaces that content
- **AND** keeping it adds no movement and no emptier frame to what the takeover already does

#### Scenario: The address served the shell

- **WHEN** a navigation fails before any screen has been presented in the session, at an address
  that served the application's own shell
- **THEN** the Commander is left on that shell
- **AND** no content is put back over it

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

The replacement is carried by what the application renders. The shell it draws carries it, and so
does each screen it presents. Content held from the served document is not rendered by the
application, so the replacement does not reach it, and it MUST stay in the bundled English it was
served in. That held content says which language it is in is "What an address served is held until
a screen replaces it". This requirement states the English; the language is stated there. The
catalogue is applied by rendering in it, so where the screen's code is what failed to arrive there
is nothing that can apply it to that screen's content, and a translation the application does not
have is one it may not write.

Source: 015/FR-011.

#### Scenario: A Commander whose committed locale is not English

- **WHEN** a Commander whose committed locale is German opens a content-bearing address
- **THEN** the document paints English content immediately

#### Scenario: The takeover presents a screen to carry the replacement

- **WHEN** a Commander whose committed locale is German opens a content-bearing address
- **AND** the takeover presents a screen
- **THEN** that screen carries the committed locale's text once that catalogue arrives

#### Scenario: The replacement lands

- **WHEN** the committed locale's text replaces the document's text
- **THEN** nothing on the page is reordered or removed
- **AND** the page may reflow because a translation is not the same length as its source

#### Scenario: No screen is presented to carry the replacement

- **WHEN** a Commander whose committed locale is German is left on content the address served,
  because no screen was presented
- **THEN** that content holds the English words it was served with, untranslated

### Requirement: The disclosure beside an untranslated game name

The one thing the replacement MAY add is the disclosure that accompanies a game name shown in its
original language. A Commander reading in a language the game's own nouns are not published in is
told so beside each one, and in bundled English there is nothing to disclose because English is the
original. So a document read in another language gains one such note per untranslated name and gains
nothing else. A value shown in a language the Commander did not ask for MUST say so, so the
disclosure MUST NOT be suppressed. This exception covers that disclosure and nothing else.

The disclosure belongs to a replacement that lands, which is where the application presents the
value. Content held because no screen was presented is a document standing in bundled English,
where this requirement already says there is nothing to disclose, so the application MUST NOT write
a disclosure into it. Nothing is suppressed: each name stands in the language of the document
around it, and that document carries its language.

Source: 015/FR-011a.

#### Scenario: A document read in another language

- **WHEN** the replacement lands in a language the game's own nouns are not published in
- **THEN** the page gains one disclosure beside each untranslated name
- **AND** it gains nothing else

#### Scenario: A document read in English

- **WHEN** a document is read in bundled English
- **THEN** there is nothing to disclose, because English is the original

#### Scenario: No replacement lands, so there is nothing to disclose

- **WHEN** a Commander whose committed locale is German is left on content the address served
- **THEN** no disclosure is written beside the game names in that content
- **AND** the names stand in the language the held content carries
