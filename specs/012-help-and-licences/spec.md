# Feature Specification: Help, Licences and Provenance

## Scope

Commanders can read help, privacy and offline explanations, versions, licences, third-party notices
and Frontier media terms without an active build or network. All content is present in the initial
application load.

## User Scenarios

### Story 1 — Read terms and attribution (P1)

1. Application, Almanac, third-party and Frontier terms are complete and clearly attributed.
2. Artwork and game-data provenance identifies what each notice covers.
3. Required legal content is available on a first offline visit.

### Story 2 — Identify shipped versions and data (P1)

1. Application and bundled Almanac versions match their build artifacts and remain distinct.
2. A non-release build also shows a build identifier and is not presented as a release.
3. Catalogue provenance states that the bundled Almanac supplies the data and makes no live-game
   currency claim.
4. Package data and calculation defects can be reported to the Almanac issue tracker.

### Story 3 — Understand application behaviour (P2)

Help explains build-link privacy, local persistence, storage clearing, offline behaviour, completed
engineering grades, hull facts versus build results and Almanac ownership of game values.

## Requirements

- **FR-001**: Help, versions and legal content MUST be reachable from every capability without an
  active build or network and MUST ship in the initial application load.
- **FR-002**: Wherever package artwork or values appear, relevant provenance and legal information
  MUST be reachable.
- **FR-003**: The application MUST reproduce its licence, the Almanac licence, the package third-party
  notices and the Frontier media-usage notice, clearly identifying what each covers.
- **FR-004**: Source distribution MUST carry the terms applicable to redistributed package artwork
  and game data and MUST NOT present the application code licence as granting rights to them.
- **FR-005**: Package licence and notice text MUST come from the installed package artifacts.
  Required missing or empty text MUST fail the release.
- **FR-006**: Legal text MUST remain verbatim. Application-owned labels MUST be localised and identify
  the language of untranslated legal text.
- **FR-007**: Displayed application and Almanac versions MUST come from shipped artifacts. A
  non-release build MUST also show its build identifier.
- **FR-008**: Neither version MUST be called the live game or live catalogue version. Provenance MUST
  say only that the bundled Almanac supplies the catalogue and calculations.
- **FR-009**: The Almanac issue tracker MUST be offered for package defects only through a deliberate
  external navigation identified as leaving the application; no build data may enter the URL.
- **FR-010**: Help MUST describe accepted current behaviour only and cover build-link privacy, absence
  of accounts/uploads/telemetry, persistence and storage clearing, offline assets, completed grades,
  hull-versus-build values and Almanac ownership.
- **FR-011**: Every capability that raises one of those questions MUST provide a route to the help
  content; the route need not open a specific answer.

## Edge Cases

- A missing legal artifact is a release failure, not a degradable runtime state.
- Legal text is reproduced rather than translated.
- External links are deliberate, identified and contain no build data.

## Almanac Coverage

The installed package supplies its version, MIT licence, `THIRD_PARTY_NOTICES.md`, Frontier media
notice, ship assets and the provenance of game data and calculations.

## Success Criteria

- **SC-001**: Every required notice is present, non-empty and traceable to its shipped artifact.
- **SC-002**: Displayed versions exactly match shipped artifacts and cannot be mistaken for live-game
  currency.
- **SC-003**: Help describes only requirements that still exist.
- **SC-004**: All help and legal content works on a first offline visit.
