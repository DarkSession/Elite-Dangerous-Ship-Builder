## Purpose

Commanders open help from the application frame to read what the application is, how it behaves,
which versions it ships and under whose terms. This capability owns the help modal, its behaviour
answers, the licence summary, the embedded Frontier disclaimer, the attribution of game data and
artwork, and the two shipped version identities.

## Requirements

### Requirement: Help reach, persistence and offline availability

Help, versions and legal content MUST be reachable from every capability, including when no build is
active. Opening and closing help MUST leave the current capability, navigation state, build and
stored records unchanged. Help, versions and the Frontier disclaimer MUST ship in the initial
application load and, after that load has completed once, remain available without a network.

Source: 012/FR-001, 012/SC-004, 012/SC-005.

#### Scenario: Opening help with no active build

- **WHEN** a Commander opens help from any capability, including one with no active build
- **THEN** help, versions and legal content are presented
- **AND** closing help leaves the capability, navigation state, build and stored records unchanged

#### Scenario: First visit without a network

- **WHEN** the application has completed one online load and a Commander opens help on the first
  subsequent visit without a network
- **THEN** every section, both behaviour topics and the Frontier disclaimer are present
- **AND** nothing in help requests, waits on or degrades without a network, and no loading, missing
  or stale state appears

#### Scenario: Opening help that is already loaded

- **WHEN** a Commander opens the already-loaded help capability at the mobile viewport under 4× CPU
  slowdown
- **THEN** its first complete frame appears within 100 ms
- **AND** no route load, same-origin asset request or cross-origin request is performed

### Requirement: Provenance and legal information belong to the common help capability

Wherever package artwork or values appear, their provenance and legal information MUST be content of
the common help capability reached through the application frame. A surface MUST NOT embed a private
copy of that information, and MUST NOT present it through a second help or legal destination of its
own. A surface MUST NOT carry a contextual help entry of its own either: the frame's Help action is
the single route, and the design reference draws no per-surface control.

Source: 012/FR-002.

#### Scenario: A surface shows package artwork or values

- **WHEN** a capability presents package-backed artwork or values
- **THEN** its provenance and legal information is read in the common help capability
- **AND** the surface carries no private copy, no second help or legal destination, and no contextual
  help entry of its own

### Requirement: Licence summary and embedded Frontier disclaimer

Help MUST reproduce only the exact project-specific Frontier disclaimer from the repository `LICENSE`
as its embedded legal excerpt. Above it, help MUST carry a summary of what covers what — the
application's own code, the bundled library, the icon files it ships, the game data and imagery, and
the typefaces — as one line each. It MUST name for each only terms this repository can evidence.

The icon line sits between the library line and the game-data line. This application serves eleven
marks from its own origin — the five material-grade marks, the community-goal, engineering and
tech-broker marks, the Powerplay mark, the Merc Coin and the loader mark — copies taken from
`edassets.org` at build time, because nothing here reaches another origin at runtime. A file this
application ships under someone else's terms is a thing the summary has to name. Those terms are
CC BY-NC-SA 4.0, and the repository `LICENSE` states them beside the terms it already states.

A line whose complete terms this repository can point at MUST link them from within its own text, and
exactly two can be pointed at — the repository `LICENSE` and the bundled library's `LICENSE`, both
from the audited destinations FR-005 validates. Each link MUST follow a deliberate action, MUST name
its destination in visible text, and MUST carry no build, route or session data out with it.

FR-008's source sentence is the third and last external destination, and it is held to every rule the
two licence links are held to — audited by the generator, named in visible text, carrying nothing
out. Help MUST NOT offer any other external destination. Every one of the three MUST be a constant
address with no query and no fragment, and MUST carry `rel="noopener noreferrer"`.

Source: 012/FR-003, 012/SC-001.

#### Scenario: Reading the licence section

- **WHEN** a Commander opens the licence section
- **THEN** the five-line summary of what covers what stands above the exact, non-empty
  project-specific Frontier disclaimer from the repository `LICENSE`
- **AND** the disclaimer is the only legal body embedded, with nothing below it

#### Scenario: Following a link out of help

- **WHEN** a Commander follows one of the three links inside help
- **THEN** it opens the destination named in the visible text of the sentence it sits in
- **AND** it carries no build, route or session data to that origin

#### Scenario: Counting the external destinations

- **WHEN** help is presented
- **THEN** it offers exactly three external destinations from the audited manifest: two complete
  licence documents and this application's own source
- **AND** no other external destination appears

### Requirement: Terms in the source distribution

Source distribution MUST carry the terms applicable to redistributed package artwork and game data
and MUST NOT present the application code licence as granting rights to them.

Source: 012/FR-004.

#### Scenario: Reading the source distribution

- **WHEN** the source distribution is inspected
- **THEN** it carries the terms that apply to redistributed package artwork and game data
- **AND** the application code licence is not presented as granting rights to them

### Requirement: Release verification of the disclaimer and the audited destinations

FR-003's disclaimer source MUST be verified before release. A missing, empty or mismatched disclaimer
MUST fail the release rather than degrade at runtime. All three audited destinations — the repository
`LICENSE`, the bundled library's `LICENSE` and the repository's own page as `ABOUT`'s source
destination — MUST be resolved and validated by the generator, each against its own expected address
and its own purpose: a wrong, non-HTTPS, credentialled, ported, queried or fragmented URL, one
pointing at another destination's document, or one offered as a purpose it was not audited for, MUST
fail the release rather than ship. A release MUST prove that the three addresses the modal offers are
the three the audit accepted.

`docs/legal/almanac/LICENSE` MUST be a byte-exact mirror of the bundled library's own `LICENSE`, and
the generator MUST verify that mirror on every build.

Source: 012/FR-005.

#### Scenario: The embedded disclaimer does not match its source

- **WHEN** the embedded Frontier disclaimer is missing, empty or does not match the repository
  `LICENSE`
- **THEN** the release fails
- **AND** the application does not degrade at runtime instead

#### Scenario: An audited destination fails its check

- **WHEN** a destination address is wrong, non-HTTPS, credentialled, ported, queried or fragmented,
  points at another destination's document, or is offered as a purpose it was not audited for
- **THEN** the release fails rather than ships

#### Scenario: A release proves the offered addresses

- **WHEN** a release is validated
- **THEN** the three addresses the modal offers are the three the audit accepted
- **AND** `docs/legal/almanac/LICENSE` matches the bundled library's `LICENSE` byte for byte

### Requirement: Verbatim disclaimer and language marking

The embedded Frontier disclaimer MUST remain verbatim and MUST be marked in the language it is
written in, so a reader whose interface is in another language is not read it in that language's
voice. The language is declared as a property of the text rather than as a sentence about it.
Application-owned labels MUST be localised.

Source: 012/FR-006.

#### Scenario: Reading help in another interface language

- **WHEN** a Commander uses the interface in a language other than the disclaimer's own
- **THEN** the disclaimer is reproduced rather than translated
- **AND** its own language is declared as a property of the text, so a screen reader does not read it
  in the interface language's voice
- **AND** the labels the application owns are localised

### Requirement: Displayed version facts

Displayed application and Almanac versions MUST come from shipped artifacts, and MUST be two
separately labelled facts rather than one run-together line. The second fact is called
`Library version` and names the library this build was compiled against; it carries no credit.

The modal MUST NOT display the build's release classification. The generator MUST still read
`SHIP_BUILDER_RELEASE_TAG`, MUST fail a mismatched or placeholder value rather than downgrading it,
and MUST record the outcome in the manifest as release evidence.

Source: 012/FR-007, 012/SC-002.

#### Scenario: Reading the two version facts

- **WHEN** a Commander reads the version facts in `ABOUT`
- **THEN** exactly two identity facts appear, each separately labelled and not run together
- **AND** each exactly matches its shipped artifact

#### Scenario: A non-release build is running

- **WHEN** the build is not a release build
- **THEN** no release or non-release state is displayed in the modal

#### Scenario: The release tag does not match

- **WHEN** `SHIP_BUILDER_RELEASE_TAG` holds a mismatched or placeholder value
- **THEN** the generator fails rather than downgrading the classification
- **AND** the outcome is recorded in the manifest as release evidence

### Requirement: Version claims and the `ABOUT` section

Neither version MUST be called the live game or live catalogue version, and no help content MUST
claim currency with either, and neither MUST state, imply or date any agreement with the live game.

`ABOUT` MUST name who builds and maintains the application, in one sentence, and MUST say where the
application's source is published, in one sentence carrying the audited source destination inside its
own text. It MUST carry no further prose: three sentences — what this is, who builds it, and where
its source is published — and the two version facts of FR-007 are the whole of the section.

Help MUST present three sections in the order `ABOUT`, `FAQ`, `LICENCE`, and the two version facts
MUST sit inside `ABOUT` rather than in a section of their own.

Source: 012/FR-008.

#### Scenario: Reading `ABOUT`

- **WHEN** a Commander reads `ABOUT`
- **THEN** it holds three sentences and the two version facts, and no further prose
- **AND** one sentence names who builds and maintains the application, and one says where the source
  is published, carrying the audited source destination inside its own text

#### Scenario: Looking for a currency claim

- **WHEN** a Commander reads any help content
- **THEN** neither version is called the live game or live catalogue version
- **AND** nothing claims currency with either, or states, implies or dates any agreement with the
  live game

### Requirement: Accepted behaviour topics

Help MUST describe accepted current behaviour only. Its accepted behaviour-topic set MUST contain
exactly one answer for each of these two topics: persistence and storage clearing; and completed
engineering grades. Each topic MUST identify at least one accepted feature requirement or
constitution principle governing its answer; those references form the release-validation comparison
set and need not be displayed in the interface. Each answer MUST agree with its cited sources and
MUST NOT add an unsupported behavioural claim. A missing or duplicate topic, a missing governing
reference, a contradiction or an unsupported additional claim MUST fail the release.

Source: 012/FR-010, 012/SC-003.

#### Scenario: Reading the behaviour answers

- **WHEN** a Commander opens `FAQ`
- **THEN** both topics are present exactly once: where a build is kept, and why an engineered figure
  differs from the one the game shows
- **AND** each answer states only currently accepted behaviour

#### Scenario: Validating the topic set before release

- **WHEN** release validation compares the topic set with its governing references
- **THEN** every topic identifies at least one accepted requirement or constitution principle
- **AND** validation reports zero missing, duplicate, unreferenced, contradictory or unsupported
  behavioural statements
- **AND** any such finding fails the release

### Requirement: The frame's Help action is the only route

FR-001's common route — the application frame's own Help action — is the only route, and it MUST NOT
need to open a specific answer. On the wide command bar the action is drawn as `?`; the mark MUST be
hidden from the accessibility tree and the action's localised name MUST be carried inside the control
as text, so the accessible name is a word rather than a symbol and is the same string at both widths.
The narrow action menu MUST spell the entry out.

Release validation MUST enumerate every current capability, package-backed artwork or value surface
and state that obscures the application frame, and MUST record for each whether that route is
available in it or, where a dismissible layer covers the frame, that help is reached from the
capability beneath once the layer is dismissed. A capability from which help cannot be reached MUST
fail the release.

Source: 012/FR-011.

#### Scenario: Using the Help action at either width

- **WHEN** a Commander uses the frame's Help action on the wide command bar or in the narrow action
  menu
- **THEN** help opens without needing to open a specific answer
- **AND** the accessible name is the action's localised word, the same string at both widths

#### Scenario: A dismissible layer covers the frame

- **WHEN** release validation reaches a state that obscures the application frame with a dismissible
  layer
- **THEN** it records that help is reached from the capability beneath once the layer is dismissed

#### Scenario: A capability cannot reach help

- **WHEN** release validation finds a capability from which the Help action is not available
- **THEN** the release fails
