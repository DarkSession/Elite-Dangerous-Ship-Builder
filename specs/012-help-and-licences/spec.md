# Feature Specification: Help, Licences and Provenance

## Scope

Commanders can open help, behaviour answers, versions and licence information without leaving or
changing their current capability. Help can be closed to resume that unchanged capability. The help,
version information and exact project-specific Frontier disclaimer are present in the initial
application load; the complete terms remain in the repository `LICENSE` and the bundled library's,
each reachable through a deliberate link inside the licence summary. **Amendment history:** on
2026-08-25 FR-003 withdrew the link and this paragraph with it, leaving a summary nobody could
check; on 2026-08-26 both links were accepted, embedded in the summary's own sentences rather than
drawn as controls beside them; on 2026-08-27 "privacy and offline explanations" became "behaviour
answers", because FR-010 withdrew both of those topics and the scope should name what the capability
does rather than which questions it happens to hold.

## Clarifications

### Session 2026-08-18

- Q: Should help show the exact project-specific Frontier disclaimer from the repository's `LICENSE`, with all remaining licence details available through one link to that same file on GitHub? → A: Exact Frontier disclaimer plus one GitHub link to the repository `LICENSE`.

### Session 2026-08-20

- Q: What stable comparison set determines whether application-behaviour help is current? → A: The
  accepted set is exactly the topics named by FR-010. Each topic appears once, each answer agrees
  with at least one explicitly referenced accepted requirement or constitution principle governing
  that topic, and any additional behavioural claim must itself be supported by such a reference or it
  blocks release. These validation references need not be displayed to the Commander. **Amended
  2026-08-27:** the answer named seven topics when it was given. The rule it states is unchanged —
  the set is whatever FR-010 names, once each, each governed — and FR-010 now names two.

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
  Almanac issue-tracker action is withdrawn with FR-009. **Superseded later the same day:** the
  design-conformance pass found that the reference draws no control in the modal other than its
  close, and the answer became none. FR-003, FR-005 and SC-001 carry the resolved position; this
  answer is kept as the record of what was asked and when.

### Session 2026-08-26

- Q: How is the frame's Help action drawn on the wide command bar — as the reference's `?`, or as
  words? → A: As the `?`, which is what the reference draws there. The mark is hidden from the
  accessibility tree and the action's localised name is carried inside the control as text, so the
  accessible name is a word rather than a symbol and is the same string at both widths. The narrow
  action menu goes on spelling the entry out, as the reference spells it out there. FR-011 is
  unchanged: one route, and it need not open a specific answer.
- Q: What is the second identity fact called? → A: `Library version`, the reference's own term. It
  names the library this build was compiled against. The Almanac keeps its once-per-application
  credit in the `almanacOwnership` topic and in the licence summary, which is where FR-008 already
  put it; a version label was never carrying it. **Superseded in part, twice:** on 2026-08-27 that
  topic was withdrawn and the credit was the `ABOUT` provenance sentence; on 2026-08-28 that
  sentence was withdrawn too and the credit is the licence summary's library line alone. The answer
  to the question asked here is unchanged — the fact is still `Library version`, and it still
  carries no credit.
- Q: Should the licence summary point at the complete documents it is a summary of? → A: Yes, and at
  two of them: this repository's `LICENSE` and the bundled library's, each linked from inside the
  line that names its terms. This reverses the withdrawal FR-003 made on 2026-08-25 — that pass read
  the reference as forbidding external navigation, when what the reference actually does is draw no
  control for one. A few linked words inside a sentence are not a control, and a licence summary
  that cannot be checked against the licence is a summary a Commander has to take on trust. The
  Almanac's line is new: the reference draws three summary lines and this draws four, because the
  library's terms are a separate claim from Frontier's and had nowhere to be made.
- Q: What may those links carry, and where may they go? → A: Nothing, and nowhere else. Both
  destinations stay audited at build time exactly as FR-005 already required, both are complete
  licence documents, and a third — an issue tracker, a homepage, a docs site — remains withdrawn
  with FR-009. Each link is `rel="noopener noreferrer"`, so no part of a session, and in particular
  no build in the URL, reaches another origin. **Extended 2026-08-28, owner's request:** the
  repository's own page joins them as `ABOUT`'s source destination, under the same audit and the
  same rules; an issue tracker and a docs site stay withdrawn.

### Session 2026-08-27

- Q: Which behaviour topics does the FAQ keep? → A: Two — where builds are stored, and why an
  engineered figure differs from the one the game shows. Five are withdrawn: build-link privacy,
  the absence of accounts, uploads and telemetry, what works offline, hull facts against build
  results, and Almanac ownership of game values. Each of the five answered something a Commander
  can already read: the first three restate constitution I, which the licence summary and the
  application's own behaviour carry; the fourth explains a distinction the status rail and the
  anatomy region make on screen; and the fifth is a credit rather than a question. A FAQ that
  repeats the interface behind it is a FAQ a reader learns to skip.
- Q: Where does the once-per-application Almanac credit go when its topic is withdrawn? → A: Back
  into `ABOUT`, where it stood until 2026-08-25. Feature 002's voice ruling of 2026-08-22 is what
  requires it to exist somewhere in this feature; only its address has ever moved.
- Q: What does `ABOUT` say beside the two version facts? → A: Three sentences — what this is, who
  builds it, and where the game values come from. The reference draws only the first. The second is
  the owner's request of the same day, and the third is the credit above.

## User Scenarios

### Story 1 — Read terms and attribution (P1)

1. The exact project-specific Frontier disclaimer is visible and clearly attributed in help.
2. Help links the complete terms it is summarising: this repository's `LICENSE` and the bundled
   library's, each from inside the summary line that names it. **Amended twice:** on 2026-08-25 the
   link was withdrawn and the summary alone remained; on 2026-08-26 it returned, alongside a second
   for the library, embedded in the line's own text rather than as an action beside it.
3. After the application has been loaded once while online, the disclaimer, the summary and both
   links are present on the first subsequent visit without a network. Following a link needs a
   connection; drawing one does not, and nothing about the section waits on, requests or degrades
   without a network.

### Story 2 — Identify shipped versions and data (P1)

1. Application and bundled Almanac versions match their build artifacts and remain distinct.
2. Exactly two identity facts appear, each separately labelled. **Amended 2026-08-25:** the scenario
   previously required a non-release build to show a build identifier; FR-007's display half is
   withdrawn and nothing in the modal says which classification the build has.
3. `ABOUT` names who maintains the application and where its source is published, and nothing in
   the modal makes a live-game currency claim. **Amended three times:** on 2026-08-25 the Almanac
   provenance paragraph was withdrawn and the `almanacOwnership` topic carried the credit; on
   2026-08-27 that topic was withdrawn and the sentence returned here; on 2026-08-28 the sentence
   was withdrawn at the owner's request and the source sentence took its place.

### Story 3 — Understand application behaviour (P2)

1. Help presents each of the accepted behaviour topics: persistence and storage clearing, and
   completed engineering grades. **Amended 2026-08-27:** the set was seven; five were withdrawn
   because each answered something the interface, the licence summary or `ABOUT` already says.
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
  repository `LICENSE` as its embedded legal excerpt. Above it, help MUST carry a summary of what
  covers what — the application's own code, the bundled library, the game data and imagery, and the
  typefaces — as one line each. It MUST name for each only terms this repository can evidence.
  **Amended 2026-08-26:** a line whose complete terms this repository can point at MUST link them
  from within its own text, and exactly two can be pointed at — the repository `LICENSE` and the
  bundled library's `LICENSE`, both from the audited destinations FR-005 validates. Each link MUST
  follow a deliberate action, MUST name its destination in visible text, and MUST carry no build,
  route or session data out with it.

  **Amended 2026-08-28 (owner's request):** FR-008's source sentence is the third and last external
  destination, and it is held to every rule the two licence links are held to — audited by the
  generator, named in visible text, carrying nothing out. No other external destination may appear.

  _Amendment history._ **2026-08-25:** the requirement's original GitHub link was withdrawn, on a
  reading of the design reference as drawing no control in the modal. **2026-08-26:** that reading
  is corrected rather than merely reversed. The reference draws no licence _control_ — no button, no
  row, no action — and it draws no linked words either, but the summary it draws is a summary of
  documents it never has to point at because its own values are invented. This one is not, and a
  summary of real terms that offers no way to read them is a claim a Commander cannot check. The
  link is inside the sentence rather than beside it, which is what keeps the reference's compact
  licence block intact.

- **FR-004**: Source distribution MUST carry the terms applicable to redistributed package artwork
  and game data and MUST NOT present the application code licence as granting rights to them.
- **FR-005**: FR-003's disclaimer source MUST be verified before release. A missing, empty or
  mismatched disclaimer MUST fail the release rather than degrade at runtime. Both audited
  destinations MUST be resolved and validated by the generator, each against its own expected
  address and its own purpose: a wrong, non-HTTPS, credentialled, ported, queried or fragmented URL,
  one pointing at another destination's document, or one offered as a purpose it was not audited
  for, MUST fail the release rather than ship. **Amended 2026-08-25:** the repository-`LICENSE`
  destination was still validated but no longer displayed. **Amended 2026-08-26:** it is displayed
  again, and the bundled library's `LICENSE` joins it under the same validation. **Amended
  2026-08-28:** the repository's own page joins them as the source destination, under the same
  validation and carrying its own purpose, and what a release proves is that the three addresses the
  modal offers are the three the audit accepted.
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
  content MUST claim currency with either, and neither MUST state, imply or date any agreement with
  the live game. `ABOUT` MUST name who builds and maintains the application, in one sentence, and
  MUST say where the application's source is published, in one sentence carrying the audited source
  destination inside its own text. It MUST carry no further prose: three sentences and the two
  version facts of FR-007 are the whole of the section.

  _Amendment history._ **2026-08-25:** a provenance sentence naming the bundled Almanac as the
  source of the catalogue, the checks and the calculations was withdrawn from `ABOUT`, on the
  reading that the design reference draws no paragraph there, and the credit moved to FR-010's
  `almanacOwnership` topic. **2026-08-27:** that topic was withdrawn and the sentence returned here.
  The maintainer sentence is new on the same date, at the owner's request. **2026-08-28, owner's
  request:** the provenance sentence is withdrawn and the source sentence takes its place. The
  Almanac is still named in the section a licence claim belongs in — the licence summary's library
  line points at the bundled library's own `LICENSE` — and the section stays three sentences long.
  Feature 002's voice ruling of 2026-08-22 is amended to match: the once-per-application credit is
  the licence summary's library line, not a paragraph in `ABOUT`. All three sentences depart from
  the reference, which draws none of them.

- `FR-009`: _Withdrawn 2026-08-25._ An in-modal action pointing at the Almanac issue tracker was
  removed. The design reference draws no such control, and reporting a package defect is a support
  route rather than help content. The modal offers no replacement destination and, since FR-003's
  repository-`LICENSE` link was withdrawn on the same day, no external navigation of any kind. The
  identifier is retained rather than reused so references elsewhere in this feature stay
  resolvable. The id is unbolded here on purpose, following feature 003's convention: an unbolded id
  is not declared, so the repository policy checker no longer requires coverage-ledger evidence for
  a requirement that no longer exists.
- **FR-010**: Help MUST describe accepted current behaviour only. Its accepted behaviour-topic set
  MUST contain exactly one answer for each of these two topics: persistence and storage clearing;
  and completed engineering grades. Each topic MUST identify at least one accepted feature
  requirement or constitution principle governing its answer; those references form the
  release-validation comparison set and need not be displayed in the interface. Each answer MUST
  agree with its cited sources and MUST NOT add an unsupported behavioural claim. A missing or
  duplicate topic, a missing governing reference, a contradiction or an unsupported additional claim
  MUST fail the release.

  **Amended 2026-08-27, owner's request.** The set was seven. Build-link privacy, the absence of
  accounts, uploads and telemetry, and what works offline are all constitution I, which the
  application demonstrates by behaving that way and the licence summary already names; hull facts
  against build results explains a distinction features 003 and 005 draw on screen, in the region
  where it matters; and Almanac ownership of game values is a credit, which FR-008 now carries in
  `ABOUT` where it belongs. What survives is the pair a Commander cannot answer by reading any
  screen: where a build is kept, and why an engineered figure differs from the game's. The rule
  around the set — one answer each, each governed, drift fails the release — is untouched.

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
- After one completed online load, help remains usable offline in full — every section, both topics
  and the disclaimer — with nothing left to fetch.
- **Amended 2026-08-26, extended 2026-08-28:** help has three external destinations, and none is a
  way out for build data. All are constant addresses with no query and no fragment, all are
  `rel="noopener noreferrer"`, and the build a session is holding lives in the URL fragment, which
  no browser sends in a `Referer` header in any case. The withdrawn edge case read "help has no external navigation,
  so there is no link for build data to ride out on"; what replaces it is a property that is
  asserted rather than obtained by having no links.

## Almanac Coverage

The installed package supplies its version, ship assets and the provenance of game data and
calculations. The repository `LICENSE` supplies the exact project-specific Frontier disclaimer. Its
GitHub location is where the complete terms live, is audited at build time, and — since 2026-08-26 —
is linked from the summary line that names them. The package's own `LICENSE` is the second such
document: `legal/almanac/LICENSE` is a byte-exact mirror of it, which is what the generator verifies
on every build, and the link points at the same file in the package's own repository.

## Success Criteria

- **SC-001**: Help contains the exact, non-empty project-specific Frontier disclaimer from the
  repository `LICENSE`, marked in its own language, above nothing and below the four-line summary of
  what covers what. It is the only legal body embedded. Help offers exactly three external
  destinations from the audited manifest — two complete licence documents and this application's own
  source — each named in the visible text of the sentence it sits in, and none carries build, route
  or session data.
- **SC-002**: The two displayed versions exactly match shipped artifacts, are separately labelled
  and cannot be mistaken for live-game currency. No release or non-release state is displayed.
- **SC-003**: Both FR-010 behaviour topics are present exactly once, every topic identifies at
  least one governing accepted requirement or constitution principle, each answer agrees with those
  sources, and release validation reports zero missing, duplicate, unreferenced, contradictory or
  unsupported behavioural statements.
- **SC-004**: After one completed online load, help, version information, both topics and the
  Frontier disclaimer work on the first subsequent offline visit, with no request and no loading,
  missing or stale state.
- **SC-005**: Opening the already-loaded help capability presents its first complete frame within
  100 ms at the mobile viewport under 4× CPU slowdown, and performs no route load, same-origin asset
  request or cross-origin request.
