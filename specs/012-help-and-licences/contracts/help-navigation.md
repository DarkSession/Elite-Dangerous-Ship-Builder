# Contract: Help Modal and Navigation

This contract defines the shared Help · About modal and every entry into it. It offers no external
navigation; the section below that once specified one now specifies its absence.

## Availability and state preservation

- One shared modal instance is mounted by the eagerly loaded application frame.
- It requires no active build, storage availability, network, authentication, route load, package
  lookup or legal fetch.
- The frame's Help action dispatches `open(invocation)` to the ephemeral help-dialog store. It does
  not invoke Angular Router or History.
- Opening and closing preserve pathname, query, fragment, history length, active capability, build
  revision, dirty state, selected slot/hull, viewing conditions, undo history, stored records and
  locale preference.
- Close returns to the unchanged underlying capability; no focus/keyboard behavior is required by
  this feature.
- A second open request while open may replace only the transient invocation/topic position. It
  cannot create a second dialog or duplicate content.

## Entry surfaces

The application frame owns the single entry, exactly as the design reference does. It draws a `?`
control in the wide command bar and a spelled-out item in the narrow action menu, and it draws no
help control anywhere else on any of its four canvases.

1. The shared application frame exposes a visible localised Help action on every route and no-build
   state. It is an ordinary shell action, so the frame's existing composition already places it in
   the wide banner row.
2. When the banner collapses, the same action moves into the frame's compact action layer, where it
   is drawn in words rather than as the mark — a list of rows is read, not scanned, and the canvas
   spells it out there for the same reason.

There is no per-surface contextual entry. A package-backed artwork or value region routes to
provenance by being inside the frame that carries the action, not by carrying one of its own
(FR-002). A layer that covers the frame is dismissible, and help is reached from the capability
beneath it once it is dismissed (FR-011); a layer never copies help content in its place.

The entry uses the shared minimum 44 CSS-pixel target, works by touch and pointer, and does not rely
on a tooltip or on hover.

**Corrected 2026-08-26.** An earlier revision required the entry's visible text to match its
accessible name everywhere, and so replaced the reference's wide-bar `?` with the words `HELP & FAQ`.
The reference's own division stands instead: the wide command bar draws the `?`, the narrow action
menu spells the entry out, and both are the same action. What the earlier rule was protecting is kept
without the wording: the mark is not an icon, an image, a font glyph or a shape whose meaning has to
be learned, and the action's localised name is carried inside the control as text, so the accessible
name is the same string at both widths and a reader is told a word rather than a symbol. The name is
`Help` — the wide bar has no room for a phrase, and a name a reader hears has no reason to be longer
than the thing it names.

## Required information order

The order is the design reference's own: a header, then `ABOUT`, `FAQ` and `LICENCE`, separated by
hairline dividers in one scrolling column. The invariant DOM/reading order is:

1. visible `Help · About` dialog title and close action, in a header pinned above the scrolling body;
2. the `ABOUT` section — the localised purpose sentence, then the application and bundled-Almanac
   identity facts where the reference draws its `APP VERSION … · LIBRARY VERSION …` line;
3. the `FAQ` section — the seven help topics as question/answer pairs; and
4. the `LICENCE` section — heading, the reference's own three-line summary of what covers what,
   then the exact project-specific Frontier disclaimer marked in its own language.

**Corrected 2026-08-25, against the design reference.** `ABOUT` previously also carried a bounded
provenance statement after the version facts, and `LICENCE` previously opened with prose framing and
two sentences naming the excerpt's source and language before the quotation, and closed with a
warned repository-`LICENSE` action. The reference draws none of the five. All are withdrawn, the
specification is amended to match the reference rather than the other way round, and what they
carried is either drawn where the reference does draw it — the licence summary names Frontier, the
`almanacOwnership` topic carries the package credit — or is a property of the text rather than a
sentence about it, as the excerpt's `lang` is.

The reference puts its version line inside `ABOUT`, above the questions, and this contract follows
it. Wide layouts may adjust spacing/measure but do not reorder sections. Narrow, landscape, zoomed,
RTL and expanded-text states use the same complete single-column order.

## Required help topics

Owned/localised content describes only accepted current behavior:

- **Build-link privacy**: canonical build data is in the URL fragment, which is not transmitted in
  HTTP requests; deliberately sharing the full URL shares the encoded loadout. Asked in the
  reference's own words, which put it as the question a Commander has: whether a shared link exposes
  an account.
- **Accounts/uploads/telemetry**: there are no accounts, authentication, application uploads,
  telemetry or server persistence.
- **Browser persistence**: working/named builds and preferences remain in browser storage; clearing
  site data removes them, so export/share is needed for a separate copy. Asked and answered in the
  reference's own words.
- **Offline assets**: installed app-shell/bundled data remains usable offline; same-origin artwork is
  offline only after being opened/cached, and temporary absence cannot block the capability.
- **Completed engineering grades**: every represented grade is 100%; validated partial imports are
  completed through Almanac or refused atomically before activation. Asked in the reference's own
  words — why engineered stats differ in game — because that is the question the invariant answers;
  the reference's own answer to it is the one this application cannot make.
- **Hull facts and build results**: package hull facts are not fitted-build results; result values may
  also depend on declared viewing conditions.
- **Almanac ownership**: the bundled Almanac supplies catalogue data, validation and calculations;
  the application does not maintain or correct those game values.

Raw message keys, blank answers, future promises, unsupported import claims, private game-text
translations and the reference's retained-partial-roll wording are prohibited.

**Wording, ruled 2026-08-25.** Three of the reference's four questions ask what three of these seven
topics answer, and those three are asked in the reference's own words rather than reworded. Its
`Where are my builds stored?` answer is used as it stands; its `Do share links expose my account?`
answer is extended to carry the not-transmitted half this table requires and its answer omits; its
`Why do my engineered stats differ in game?` answer is replaced, because the claim it makes is the
one feature 002 FR-013 contradicts. The remaining four topics have no question in the reference and
take the wording settled here. The reference's fourth question, `What can I import?`, is not a topic:
import behaviour is feature 004's, and this table is the accepted set.

Exactly one definition exists for each topic ID, with the following non-empty governing-reference
set. References are build/review evidence only and are not displayed or bundled.

| Topic ID                     | Governing accepted source                                          |
| ---------------------------- | ------------------------------------------------------------------ |
| `buildLinkPrivacy`           | Feature 001 FR-015                                                 |
| `accountsUploadsTelemetry`   | Constitution Principle I                                           |
| `browserPersistence`         | Constitution Principle I and Feature 001 FR-008, FR-013 and FR-014 |
| `offlineAssets`              | Constitution Principle I and Feature 001 FR-006                    |
| `completedEngineeringGrades` | Constitution Principle IV and Feature 002 FR-013                   |
| `hullFactsAndBuildResults`   | Feature 001 FR-004 and Feature 005 FR-003                          |
| `almanacOwnership`           | Constitution Principle II and Feature 003 FR-002                   |

**Corrected 2026-08-25, during implementation.** `hullFactsAndBuildResults` cited feature 003's
FR-006 and FR-009. Neither is a declared requirement any more: feature 003's own "Withdrawn and
reassigned requirements" ruling of 2026-08-22 reassigned FR-006 to features 005–008 with the values
it governed, and FR-009 — the deployed/retracted switch — to feature 005. The topic is unchanged and
so is its wording; what changed is which live requirement it points at, which is the whole purpose of
this table. The viewing-condition half is now feature 005's FR-003, where that selection actually
lives. Citing a reassigned id would make the reference resolvable only against a table of things that
are no longer true.

Build validation resolves every reference against the accepted repository artifacts and verifies
the exact seven-ID set, uniqueness and non-empty shipped-locale messages. Required content review
checks each answer for consistency with its cited behavior. A missing, duplicate, unreferenced,
contradictory or unsupported topic blocks release; the modal never publishes a partial or
speculative set.

After validation, tooling emits a separate browser topic catalogue containing only each topic's ID,
question key and answer key. It is not part of `HelpManifestV1`, and governing references never enter
the generated browser module.

### Required content-review gate

Whenever an English question, English answer or governing reference changes, release review must
record all seven topic IDs against the table above and confirm:

1. every factual sentence is supported by at least one cited accepted source;
2. no sentence contradicts any cited source or another accepted requirement;
3. no answer promises behavior outside FR-010 or describes a future/unbuilt capability; and
4. all shipped-locale answers preserve the reviewed meaning and interpolation contract.

Any unchecked topic or unresolved discrepancy is a release failure. This semantic review complements
the mechanical set/reference/catalogue checks; it is not replaced by a passing unit test.

## Identity and provenance

- Display “App version” and “Library version” as separate localised facts sourced from
  `HelpManifestV1`. They are two facts and never one run-together line: a value without the term
  beside it is a number, not a version.
- **Corrected 2026-08-26.** The second term was “Bundled Almanac version”, on the reasoning that the
  reference's own `LIBRARY VERSION` was ambiguous. The reference's wording stands instead: what the
  fact names is the library this application was built against, which is what a Commander comparing
  two builds is reading it for, and the package is credited by name in the `almanacOwnership` topic
  and in the licence summary rather than in a version label. Nothing else moves: it is still the
  installed package's own version, still a separate labelled fact, and still not a claim about the
  live game or the live catalogue.
- **Corrected 2026-08-25.** The modal previously drew a third fact carrying release state and, for a
  non-release build, its build ID. The reference draws two facts and no third; the display is
  withdrawn and FR-007's display half with it. Generator classification is unchanged — a
  `SHIP_BUILDER_RELEASE_TAG` that is not byte-exactly `v${applicationVersion}` over a non-`0.0.0`
  version still fails generation rather than downgrading — and the outcome still reaches the
  manifest as release evidence. Nothing renders it.
- No help content claims currency with the live game or a live catalogue.
- Package-backed artwork/value regions route to this same modal; they own no duplicated notice and
  no entry control of their own.
- The modal offers no package-defect action. FR-009 is withdrawn, and no issue tracker, support
  address or defect-reporting destination appears in the modal.

## Legal presentation

- The section opens with a four-line summary, one localised line each for the application's own
  code, the bundled library, the game data and imagery, and the typefaces. **Amended 2026-08-26:**
  the reference draws three and this draws four. The library's terms are a separate claim from
  Frontier's — MIT over a package's code against media-usage rules over game data — and folding them
  together would be the kind of unsupportable line this section already refuses elsewhere.
- The two lines whose complete terms this repository can point at link them from inside their own
  text; the two that cannot, do not. Frontier's media-usage rules are not a document with an address
  here, and the typefaces' licence is not one this repository redistributes.
- Each line names only terms this repository can evidence. **Corrected 2026-08-25:** the reference's
  second line reads `SHIP LINE ART & MATERIAL ICONS · EDASSETS.ORG, CC BY-NC-SA 4.0`, and this
  repository can support neither half of it. Ship line art is not EDAssets' — it reaches this
  application from `@elite-dangerous-almanac/core` under Frontier's media-usage rules, which is what
  root `LICENSE` records — and no CC BY-NC-SA 4.0 grant for the material icons is recorded anywhere
  in the repository. The line names Frontier's media-usage rules for the game data and imagery
  instead. The icons, the Merc Coin and the loader mark are EDAssets files served from this origin
  under feature 002's Icons ruling of 2026-08-22; that they carry no recorded licence here is a
  **known gap** and is recorded as a defect in `design/help-and-licences.md`, not papered over with
  a grant nobody has evidenced.
- The modal embeds exactly one legal body: `FrontierDisclaimer.exactText` from root `LICENSE`.
- Render it as text content in an English-language region. Do not use `innerHTML`, Markdown, iframe,
  translated copy, automatic links or a separately typed quotation.
- The complete application licence, Almanac licence and package third-party notices are not embedded
  as additional modal bodies.
- The exact disclaimer and the summary above it are already loaded. Expanding, scrolling or reading
  legal content performs no request and has no runtime loading, missing or stale state.
- Text and long identifiers wrap within the content measure; legal prose never requires horizontal
  scrolling.

## External navigation

The modal offers exactly two destinations, and both are complete licence documents: the repository
`LICENSE`, and the bundled library's. Each is a few linked words inside the summary line that names
its terms — not a control beside the line, and not a row of its own.

Every one of them:

- comes from `HelpManifestV1.destinations`, audited at build time, never from a string in a template
  or a catalogue;
- names its destination in the visible words a Commander reads, so they are told before they leave
  and not after (constitution I);
- carries `target="_blank"` and `rel="noopener noreferrer"`, so the opened tab cannot reach back and
  no referrer — no route, no query, nothing around the build in the URL — reaches the other origin;
- draws no address as text. What a Commander reads is which document it is, not where it is.

The two read alike on screen, because both are an MIT licence on GitHub and saying otherwise would
be dressing up a fact. What differs is which document each covers, and that is carried for a reader
in text appended to the link's accessible name, so two links in one list never announce identically.

**Amendment history.** **2026-08-25:** the modal carried one destination, a warned
repository-`LICENSE` action, and it was withdrawn along with the `WarnedExternalLink` component the
modal was its only consumer of, on a reading of the design reference as drawing no navigation.
**2026-08-26:** the reading is corrected. The reference draws no licence _control_, which is why
none comes back; what comes back is linked words inside a sentence, which is a different shape and
the one that leaves the reference's compact licence block intact. `WarnedExternalLink` stays
deleted — a component whose whole purpose was to be a warned action is not what an inline link is.

The consequence is asserted rather than assumed: the modal renders no anchor, its rendered text
carries no URL, and opening it neither issues nor warms a cross-origin request. A Commander looking
for the remaining licence and third-party terms finds them in the repository `LICENSE`, which the
licence summary names and the generator still audits at build time.

## Dialog semantics and responsive behavior

- Use feature 011's shared modal layer with `role="dialog"`, modal semantics, a visible labelled
  title and isolated background content. **Corrected 2026-08-25:** the layer is a native `dialog`
  opened with `showModal()`, so modality is the element's own `:modal` state and `aria-modal` is
  deliberately not set — the attribute would duplicate what the platform already says, and the
  journey asserts the state rather than the attribute.
- Wide layouts center a readable-width dialog with bounded block size and an internal vertical
  content scroller. Narrow layouts present a full-width bottom sheet; constrained landscape/400%-zoom
  layouts may fill the viewport.
- The title/close header stays available while modal content scrolls. Background page scroll does not
  compete with the dialog.
- All interactions meet the shared touch target and work without hover. No meaning depends on color,
  position, icon, shape, animation or dimming.
- At 200% text and actual 400% zoom, every section/action remains reachable and there is no document
  horizontal overflow or clipped legal text.
- Any shared transition honors `prefers-reduced-motion`; motion is not needed to understand open or
  closed state.

## Localisation and accessibility

- Every application-owned title, heading, topic, fact label, licence-summary line and the close
  action resolves through feature 011's localisation layer with bundled English fallback.
- The source disclaimer is unchanged and marked `lang="en"`; everything around it follows the active
  document language and direction.
- Expanded and RTL fixtures preserve source-text language/direction boundaries, section order,
  complete labels and wrapping.
- The dialog heading hierarchy, the two definition facts, the topic group with each question a
  heading over its own answer, and the licence summary list ahead of the language-marked excerpt form
  a coherent screen-reader reading order.
- Opening is announced through native/shared dialog semantics; long content is not injected into a
  live region. Closing returns to the invoking origin.
- Axe/semantic/no-overflow checks cover the closed background and the open default, alternate-locale
  and long-text states in every Chromium/Firefox viewport/orientation project.
- Manual screen-reader checks verify discovery from no-build and active capabilities, dialog
  isolation, the two identity facts as distinct labelled facts, the excerpt's declared language and
  the underlying capability after close. There is no warning relationship to verify: the modal has no
  external action.
- Any conformance statement names excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
  2.4.11.

## Component previews

Feature 011's preview catalogue must include:

- the closed frame-entry state;
- the open modal state;
- all seven populated help topics;
- long application and package identifiers;
- the three-line licence summary and the exact disclaimer;
- desktop centered, tablet/mobile portrait and landscape sheet states;
- doubled/expanded text, RTL section with English disclaimer, reduced motion and 400%-zoom reflow.

**Corrected 2026-08-25.** Separate release and non-release states are withdrawn with the display of
release state, and the warned external action with the action itself. Feature 011's preview
catalogue holds one fixture per state name from its fixed five, which is the other reason a release
and a non-release `default` could never both have lived here.

Missing/empty/drifted artifact states are generator tests, not runtime component previews.
