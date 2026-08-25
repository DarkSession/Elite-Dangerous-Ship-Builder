# Feature Specification: Help, Licences and Provenance

## Scope

Commanders can open help, privacy and offline explanations, versions and licence information without
leaving or changing their current capability. Help can be closed to resume that unchanged capability.
The help, version information and exact project-specific Frontier disclaimer are present in the
initial application load; the complete licence remains available through a deliberate external link
to the repository's `LICENSE` on GitHub.

## Clarifications

### Session 2026-08-18

- Q: Should help show the exact project-specific Frontier disclaimer from the repository's `LICENSE`, with all remaining licence details available through one link to that same file on GitHub? → A: Exact Frontier disclaimer plus one GitHub link to the repository `LICENSE`.

### Session 2026-08-20

- Q: What stable comparison set determines whether application-behaviour help is current? → A: The
  accepted set is exactly the seven topics named by FR-010. Each topic appears once, each answer agrees
  with at least one explicitly referenced accepted requirement or constitution principle governing
  that topic, and any additional behavioural claim must itself be supported by such a reference or it
  blocks release. These validation references need not be displayed to the Commander.

### Session 2026-08-25

- Q: Where this specification and the design reference `.design/Ship Builder.dc.html` disagree, which
  one governs? → A: The design. Its Help · About overlay is the template, and this specification is
  updated to match it rather than the other way round.
- Q: What is the modal's section structure? → A: The reference's own three sections in its order —
  `ABOUT`, `FAQ`, `LICENCE` — with the application and bundled-Almanac versions inside `ABOUT`, where
  the reference draws its version line, rather than in a separate section after the questions.
- Q: Should package-backed artwork and value surfaces carry a contextual help entry of their own? →
  A: No. The reference draws no such control on any of its four canvases, including the outfitting,
  anatomy and status surfaces. The application frame's own Help action is the single route, and
  FR-002 and FR-011 are narrowed to match.
- Q: Which external destinations may the modal offer? → A: Exactly one — the repository `LICENSE` on
  GitHub, which FR-003 requires and which replaces the reference's unsupported licence summary. The
  Almanac issue-tracker action is withdrawn with FR-009.

## User Scenarios

### Story 1 — Read terms and attribution (P1)

1. The exact project-specific Frontier disclaimer is visible and clearly attributed in help.
2. Help identifies the GitHub `LICENSE` link as the destination for all remaining licence and
   third-party terms.
3. After the application has been loaded once while online, the disclaimer is available on the first
   subsequent visit without a network; following the external link may require a connection.

### Story 2 — Identify shipped versions and data (P1)

1. Application and bundled Almanac versions match their build artifacts and remain distinct.
2. Exactly two identity facts appear, each separately labelled. **Amended 2026-08-25:** the scenario
   previously required a non-release build to show a build identifier; FR-007's display half is
   withdrawn and nothing in the modal says which classification the build has.
3. **Amended 2026-08-25:** the `almanacOwnership` answer states that the bundled Almanac supplies the
   catalogue, the checks and the calculations, and nothing in the modal makes a live-game currency
   claim. The `ABOUT` provenance paragraph this scenario used to name is withdrawn.

### Story 3 — Understand application behaviour (P2)

1. Help presents each of the seven accepted behaviour topics: build-link privacy, absence of
   accounts/uploads/telemetry, persistence and storage clearing, offline assets, completed
   engineering grades, hull facts versus build results and Almanac ownership of game values.
2. Each answer states only currently accepted behaviour; no missing, duplicate, contradictory or
   unsupported behavioural statement is presented.

## Requirements

- **FR-001**: Help, versions and legal content MUST be reachable from every capability, including when
  no build is active. Opening and closing help MUST leave the current capability, navigation state,
  build and stored records unchanged. Help, versions and the Frontier disclaimer MUST ship in the
  initial application load and, after that load has completed once, remain available without a
  network.
- **FR-002**: Wherever package artwork or values appear, their provenance and legal information MUST
  be content of the common help capability reached through the application frame. A surface MUST NOT
  embed a private copy of that information, and MUST NOT present it through a second help or legal
  destination of its own. A surface MUST NOT carry a contextual help entry of its own either: the
  frame's Help action is the single route, and the design reference draws no per-surface control.
- **FR-003**: Help MUST reproduce only the exact project-specific Frontier disclaimer from the
  repository `LICENSE` as its embedded legal excerpt. Above it, help MUST carry the design
  reference's own summary of what covers what — the application's own code, the game data and
  imagery, and the typefaces — as one line each. It MUST name for each only terms this repository
  can evidence. **Amended 2026-08-25:** the requirement previously also obliged help to link that
  `LICENSE` on GitHub. The design reference draws no control in the modal, and the link is
  withdrawn with the rest of the framing this feature had added around the reference's own licence
  block. Help now offers no external navigation at all, which is what makes the deliberate-action,
  leaving and network clauses moot rather than unmet.
- **FR-004**: Source distribution MUST carry the terms applicable to redistributed package artwork
  and game data and MUST NOT present the application code licence as granting rights to them.
- **FR-005**: FR-003's disclaimer source MUST be verified before release. A missing, empty or
  mismatched disclaimer MUST fail the release rather than degrade at runtime. **Amended
  2026-08-25:** the audited repository-`LICENSE` destination is still resolved and validated by the
  generator, because it is the address the source distribution's terms live at and a wrong one is
  still a release failure; it is simply no longer displayed. Verification of it is unchanged;
  what changed is that nothing renders it.
- **FR-006**: The embedded Frontier disclaimer MUST remain verbatim and MUST be marked in the
  language it is written in, so a reader whose interface is in another language is not read it in
  that language's voice. Application-owned labels MUST be localised. **Amended 2026-08-25:** the
  requirement previously obliged a localised label to _state_ the disclaimer's language in prose.
  The design reference draws no such sentence; the language is declared as a property of the text
  rather than as a sentence about it, which is what a screen reader acts on either way.
- **FR-007**: Displayed application and Almanac versions MUST come from shipped artifacts, and MUST
  be two separately labelled facts rather than one run-together line. **Amended 2026-08-25:** the
  requirement previously obliged a non-release build to display its build identifier as well. The
  design reference draws two version facts and no third, and the display half is withdrawn. Release
  classification itself is untouched: the generator still reads `SHIP_BUILDER_RELEASE_TAG`, still
  fails a mismatched or placeholder value rather than downgrading, and still records the outcome in
  the manifest as release evidence. It is simply not a thing the modal says.
- **FR-008**: Neither version MUST be called the live game or live catalogue version, and no help
  content MUST claim currency with either. **Amended 2026-08-25:** the requirement previously
  obliged a bounded provenance statement in `ABOUT`. The design reference draws no such paragraph
  there, and it is withdrawn. The credit it carried is not lost: the `almanacOwnership` topic of
  FR-010 says that the bundled Almanac supplies the catalogue, the checks and the calculations and
  that this application neither maintains nor corrects those game values, and FR-003's licence
  summary names Frontier for the game data and imagery. That is where a Commander now meets both,
  and it satisfies the standing feature 002 ruling of 2026-08-22 that the credit belongs to this
  feature, once per application.
- `FR-009`: _Withdrawn 2026-08-25._ An in-modal action pointing at the Almanac issue tracker was
  removed. The design reference draws no such control, and reporting a package defect is a support
  route rather than help content. The modal offers no replacement destination and, since FR-003's
  repository-`LICENSE` link was withdrawn on the same day, no external navigation of any kind. The
  identifier is retained rather than reused so references elsewhere in this feature stay
  resolvable. The id is unbolded here on purpose, following feature 003's convention: an unbolded id
  is not declared, so the repository policy checker no longer requires coverage-ledger evidence for
  a requirement that no longer exists.
- **FR-010**: Help MUST describe accepted current behaviour only. Its accepted behaviour-topic set
  MUST contain exactly one answer for each of these seven topics: build-link privacy; absence of
  accounts, uploads and telemetry; persistence and storage clearing; offline assets; completed
  engineering grades; hull facts versus build results; and Almanac ownership of game values. Each
  topic MUST identify at least one accepted feature requirement or constitution principle governing
  its answer; those references form the release-validation comparison set and need not be displayed
  in the interface. Each answer MUST agree with its cited sources and MUST NOT add an unsupported
  behavioural claim. A missing or duplicate topic, a missing governing reference, a contradiction or
  an unsupported additional claim MUST fail the release.
- **FR-011**: FR-001's common route — the application frame's own Help action — is the only route,
  and it MUST NOT need to open a specific answer. Release validation MUST enumerate every current
  capability, package-backed artwork or value surface and state that obscures the application frame,
  and MUST record for each whether that route is available in it or, where a dismissible layer covers
  the frame, that help is reached from the capability beneath once the layer is dismissed. A
  capability from which help cannot be reached MUST fail the release.

## Edge Cases

- A missing or mismatched embedded Frontier disclaimer, or a repository-`LICENSE` destination the
  generator cannot audit, is a release failure, not a degradable runtime state.
- The Frontier disclaimer is reproduced rather than translated.
- After one completed online load, help remains usable offline in full — every section, all seven
  topics and the disclaimer — with nothing left to fetch.
- Help has no external navigation, so there is no link for build data to ride out on.

## Almanac Coverage

The installed package supplies its version, ship assets and the provenance of game data and
calculations. The repository `LICENSE` supplies the exact project-specific Frontier disclaimer. Its
GitHub location remains the place the complete terms live and is still audited at build time; it is
not a destination the modal offers, because the design reference draws none.

## Success Criteria

- **SC-001**: Help contains the exact, non-empty project-specific Frontier disclaimer from the
  repository `LICENSE`, marked in its own language, above nothing and below the three-line summary
  of what covers what. It is the only legal body embedded, and help offers no external destination.
- **SC-002**: The two displayed versions exactly match shipped artifacts, are separately labelled
  and cannot be mistaken for live-game currency. No release or non-release state is displayed.
- **SC-003**: All seven FR-010 behaviour topics are present exactly once, every topic identifies at
  least one governing accepted requirement or constitution principle, each answer agrees with those
  sources, and release validation reports zero missing, duplicate, unreferenced, contradictory or
  unsupported behavioural statements.
- **SC-004**: After one completed online load, help, version information, all seven topics and the
  Frontier disclaimer work on the first subsequent offline visit, with no request and no loading,
  missing or stale state.
- **SC-005**: Opening the already-loaded help capability presents its first complete frame within
  100 ms at the mobile viewport under 4× CPU slowdown, and performs no route load, same-origin asset
  request or cross-origin request.
