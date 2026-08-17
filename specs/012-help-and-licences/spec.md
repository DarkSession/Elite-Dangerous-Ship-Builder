# Feature Specification: Help, Licences and Provenance

## Scope

This specification covers application help, privacy and offline explanations, version information,
licences, third-party notices and Frontier Developments' media-usage notice. It requires no active
build and remains available offline after first load.

## Clarifications

### Session 2026-08-17

- Q: Must all help and legal text be present in the application's first load, so it can be read
  offline even if the Commander never opened it while online? → A: Yes. All help answers and all
  legal texts ship in the initial load; none is fetched at runtime and none has an uncached state.
- Q: What must the version display show as the application's own version when the build is not a
  tagged release? → A: The package manifest version, plus a build identifier such as the commit that
  marks the build as not a release.
- Q: When a Commander follows a help link from the capability that raised the question, must they
  arrive at that specific explanation, or is arriving at the help content generally enough? → A:
  Reaching the help content is enough; which answer appears first is a plan-time choice.
- Q: How should an automated test establish that a help answer still matches the behavior it
  describes, given that tests cannot read the specifications? → A: Each answer declares the
  requirement identifiers it restates, and tests reject declared identifiers that no longer exist
  and topics left without an answer.
- Q: What counts as a match when the source distribution's copy of the Frontier media-usage notice is
  checked against the installed package's text? → A: Line wrapping and surrounding whitespace are
  normalized and the covered work's name is a substituted field; any other wording difference fails.

## User Scenarios & Testing

### User Story 1 - Understand the application and its terms (Priority: P1)

A Commander can identify what the application is, what it uses and which terms apply to its code,
game data and artwork.

**Independent Test**: Open the application with no build and no network, then verify every required
licence, notice and attribution is present, complete and correctly identified.

**Acceptance Scenarios**:

1. **Given** any application capability, **When** help and legal information is requested, **Then**
   it is reachable without an active build or network connection.
2. **Given** ship artwork, **When** provenance is requested, **Then** Frontier Developments'
   media-usage notice is available and identifies what it covers.
3. **Given** the Almanac dependency, **When** legal information is read, **Then** its licence and
   third-party notices are reproduced and distinguished from the application's licence.
4. **Given** the source distribution, **When** its licence is read, **Then** the media-usage terms
   that apply to redistributed ship imagery travel with it without being presented as a grant from
   the application's code licence.

### User Story 2 - Identify shipped versions and data provenance (Priority: P1)

A Commander can identify the application release and bundled Almanac release behind the displayed
catalogue and calculations.

**Independent Test**: Compare displayed versions with the built artefacts and verify no application
or library version is mislabelled as the live game version.

**Acceptance Scenarios**:

1. **Given** version information, **When** it is read, **Then** the application release and bundled
   Almanac release are shown and clearly distinguished.
2. **Given** catalogue provenance, **When** it is read, **Then** it says the catalogue is the one in
   the bundled Almanac and makes no unverifiable claim that it is current with the live game.
3. **Given** a suspected game-data or calculation defect, **When** reporting guidance is requested,
   **Then** the Almanac issue tracker is identified as the place where the source-of-truth defect is
   fixed.

### User Story 3 - Understand deliberate behavior (Priority: P2)

A Commander can find concise explanations for privacy, links, persistence, offline use, completed
engineering grades and the source of statistics.

**Independent Test**: Verify every explanation against the requirements it declares, and reach the
help content carrying it from the capability it describes.

**Acceptance Scenarios**:

1. **Given** a build link, **When** its privacy explanation is read, **Then** it says the fragment
   contains build state and is not sent to a server.
2. **Given** normalized engineering quality, **When** its explanation is read, **Then** it says the
   application models reproducible completed grades.
3. **Given** hull catalogue facts, **When** their explanation is read, **Then** it distinguishes hull
   facts from values requiring a fitted build.
4. **Given** a displayed statistic, **When** provenance is read, **Then** it says all game values and
   calculations come from the Almanac and package defects are fixed there.
5. **Given** local persistence and offline behavior, **When** their explanation is read, **Then** it
   accurately states what survives storage clearing and which uncached artwork may be unavailable.

### Edge Cases

- Legal text is reproduced as published, not presented as an application translation.
- A missing required licence or notice is a release failure, not a degradable runtime state.
- Outbound issue-tracker links are identified as leaving the application and never include build
  data.
- A build that is not a release shows its manifest version together with a build identifier marking
  it as not a release, rather than presenting itself as a release.

## Requirements

### Reachability and Legal Text

- **FR-001**: Help, versions, licences and notices MUST be reachable from every capability without
  an active build and with the network disabled. Every help answer and every legal text MUST be
  present in the application's initial load, so none depends on a runtime fetch and none has an
  uncached or temporarily-absent state.
- **FR-002**: Wherever package artwork or catalogue values appear, provenance and applicable legal
  information MUST be reachable.
- **FR-003**: The application MUST reproduce its own licence, the Almanac licence, the Almanac's
  third-party notices and Frontier Developments' media-usage notice, each identified with what it
  covers.
- **FR-004**: The application's source distribution MUST carry the media-usage terms applicable to
  redistributed ship imagery and MUST state that the application's code licence does not grant
  rights to that imagery or game data.
- **FR-005**: Reproduced dependency notices MUST come from the installed package artefacts. Missing
  or empty required text MUST fail verification.
- **FR-006**: Any copy of package-provided media terms required in the source distribution MUST be
  verified against the installed package text so drift fails verification. The comparison MUST
  normalize line wrapping and surrounding whitespace and MUST treat the name of the covered work as a
  substituted field, because Frontier's terms require the notice to name the work it covers. Every
  other wording difference MUST fail verification.
- **FR-007**: Legal texts MUST remain verbatim. Application-owned labels and explanations MUST use
  the localisation layer and identify the language of untranslated legal text.

### Versions, Provenance and Help

- **FR-008**: The application MUST show its built release version and the bundled Almanac package
  version from their artefacts, not from hand-maintained display strings. The application's own
  version is the one its package manifest carries in the build. A build that is not a release MUST
  additionally show a build identifier, such as the commit it was built from, that identifies it as
  not a release.
- **FR-009**: Version information MUST NOT label either version as the live game or catalogue
  version. Catalogue provenance MUST state only that the bundled Almanac supplies it.
- **FR-010**: The Almanac issue tracker MUST be offered for package data or calculation defects, but
  no outbound link may include build data.
- **FR-011**: Help MUST explain build-link privacy, absence of accounts/uploads/telemetry, local
  persistence, storage clearing, offline behavior, completed engineering grades, hull-versus-build
  values and Almanac ownership of game values and calculations.
- **FR-012**: Each explanation MUST describe accepted current behavior only. Every capability that
  prompts a question MUST offer a route to the help content carrying the answer. The route need not
  land on that specific explanation, and which explanation is presented first is a plan-time
  presentation choice.
- **FR-013**: Help and legal content MUST remain readable at every supported viewport without
  horizontal page scrolling; long legal text MAY scroll inside its own container.

### Verification Requirements

- **FR-014**: Built-artefact tests MUST verify every required licence and notice is present,
  non-empty, correctly identified and synchronized where duplication is required.
- **FR-015**: Version tests MUST compare displayed values with the built application and package
  artefacts and reject any claim that the bundled catalogue is current with the live game.
- **FR-016**: Each help answer MUST declare the requirement identifiers it restates. Specification
  tests MUST reject a declared identifier that no longer exists in the accepted specifications, a
  topic FR-011 lists that has no answer, and a capability prompting a question that offers no route
  to the help content carrying that answer.
- **FR-017**: Each primary journey MUST have end-to-end coverage at desktop, tablet and mobile
  viewports in Chromium and Firefox, including automated accessibility checks and offline access.

## Key Entities

- **Notice**: A licence, attribution or media-use text and the material it governs.
- **Version statement**: The application or bundled Almanac version obtained from its built
  artefact.
- **Help answer**: A localized explanation of current application behavior, carrying the identifiers
  of the requirements it restates.

## Almanac Coverage

The installed Almanac package supplies its release version, licence, third-party notices and artwork
provenance. It also owns every game datum and calculation described by help. No application-owned
game value or provenance record is needed.

## Success Criteria

- **SC-001**: Every required legal text is present, non-empty and traceable to its governing
  artefact.
- **SC-002**: Displayed application and Almanac versions exactly match the shipped artefacts, are
  never presented as a live-game version, and a build that is not a release is identifiable as such.
- **SC-003**: Every help answer matches the accepted specifications and cites only requirements that
  still exist, and every capability raising one of those questions offers a route to the help content
  carrying its answer.
- **SC-004**: Help and legal information remain available without a build or network connection,
  including on a first visit made with the network already disabled.
- **SC-005**: The complete feature passes the required viewport, browser and accessibility test
  matrix without horizontal page scrolling.
