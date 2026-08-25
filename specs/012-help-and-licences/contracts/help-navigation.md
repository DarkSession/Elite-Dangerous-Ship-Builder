# Contract: Help Modal and Navigation

This contract defines the shared Help · About modal, every entry into it and the deliberate external
navigations it offers.

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
control in the wide command bar and a `HELP & FAQ` item in the narrow action menu, and it draws no
help control anywhere else on any of its four canvases.

1. The shared application frame exposes a visible localised Help action on every route and no-build
   state. It is an ordinary shell action, so the frame's existing composition already places it in
   the wide banner row.
2. When the banner collapses, the same action moves into the frame's compact action layer, keeping
   its visible text.

There is no per-surface contextual entry. A package-backed artwork or value region routes to
provenance by being inside the frame that carries the action, not by carrying one of its own
(FR-002). A layer that covers the frame is dismissible, and help is reached from the capability
beneath it once it is dismissed (FR-011); a layer never copies help content in its place.

The entry has visible text matching its accessible name, uses the shared minimum 44 CSS-pixel target,
works by touch and pointer, and does not rely on an icon, tooltip or hover. The reference's
title-only `?` is therefore given a visible label; the glyph may remain as supplemental decoration.

## Required information order

The order is the design reference's own: a header, then `ABOUT`, `FAQ` and `LICENCE`, separated by
hairline dividers in one scrolling column. The invariant DOM/reading order is:

1. visible `Help · About` dialog title and close action, in a header pinned above the scrolling body;
2. the `ABOUT` section — the localised purpose sentence, then the application and bundled-Almanac
   identity facts where the reference draws its `APP VERSION … · LIBRARY VERSION …` line, then the
   bounded catalogue/calculation provenance statement;
3. the `FAQ` section — the seven help topics as question/answer pairs; and
4. the `LICENCE` section — heading and attribution, the visible original-English notice, the exact
   project-specific Frontier disclaimer, then the warned repository-`LICENSE` action for every
   remaining licence and third-party term.

The reference puts its version line inside `ABOUT`, above the questions, and this contract follows
it. Wide layouts may adjust spacing/measure but do not reorder sections. Narrow, landscape, zoomed,
RTL and expanded-text states use the same complete single-column order.

## Required help topics

Owned/localised content describes only accepted current behavior:

- **Build-link privacy**: canonical build data is in the URL fragment, which is not transmitted in
  HTTP requests; deliberately sharing the full URL shares the encoded loadout.
- **Accounts/uploads/telemetry**: there are no accounts, authentication, application uploads,
  telemetry or server persistence.
- **Browser persistence**: working/named builds and preferences remain in browser storage; clearing
  site data removes them, so export/share is needed for a separate copy.
- **Offline assets**: installed app-shell/bundled data remains usable offline; same-origin artwork is
  offline only after being opened/cached, and temporary absence cannot block the capability.
- **Completed engineering grades**: every represented grade is 100%; validated partial imports are
  completed through Almanac or refused atomically before activation.
- **Hull facts and build results**: package hull facts are not fitted-build results; result values may
  also depend on declared viewing conditions.
- **Almanac ownership**: the bundled Almanac supplies catalogue data, validation and calculations;
  the application does not maintain or correct those game values.

Raw message keys, blank answers, future promises, unsupported import claims, private game-text
translations and the reference's retained-partial-roll wording are prohibited.

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

- Display “Application version” and “Bundled Almanac version” as separate localised facts sourced
  from `HelpManifestV1`.
- A non-release build also displays a textual non-release state and its build ID. Styling alone never
  conveys non-release state.
- A release identity is shown only when generator evidence classified it as release.
- Provenance says only that the bundled Almanac supplies catalogue data, validation and calculations
  and that Frontier owns the covered game data/imagery. It makes no live-game/live-catalogue currency
  claim.
- Package-backed artwork/value regions route to this same provenance; they own no duplicated notice
  and no entry control of their own.
- The modal offers no package-defect action. FR-009 is withdrawn, and no issue tracker, support
  address or defect-reporting destination appears in the modal.

## Legal presentation

- The modal embeds exactly one legal body: `FrontierDisclaimer.exactText` from root `LICENSE`.
- Render it as text content in an English-language region. Do not use `innerHTML`, Markdown, iframe,
  translated copy, automatic links or a separately typed quotation.
- Localised framing names Frontier, identifies the source as the repository `LICENSE`, states that
  the excerpt remains in original English and distinguishes it from the application's MIT grant.
- The complete application licence, Almanac licence and package third-party notices are not embedded
  as additional modal bodies.
- Exactly one modal action is described as the destination for all remaining licence and third-party
  terms: the generated repository `LICENSE` URL.
- The exact disclaimer and all framing are already loaded. Expanding/scrolling/reading legal content
  performs no request and has no runtime loading, missing or stale state.
- Text and long identifiers wrap within the content measure; legal prose never requires horizontal
  scrolling.

## External navigation

The modal has exactly one external navigation: the repository-licence action. It:

- is a native link and inert until Commander activation;
- visibly and programmatically states that it leaves the application and may require a network;
- uses `rel="noreferrer noopener"`;
- receives its exact URL from the generated manifest;
- is never prefetched, probed, opened programmatically or rewritten with application state; and
- contains no query, fragment, build URL/payload, SLEF, hull/module identity, current route, locale
  or browser-storage value.

Tests intercept the navigation and assert the exact destination without requiring network access.

## Dialog semantics and responsive behavior

- Use feature 011's shared modal layer with `role="dialog"`, `aria-modal="true"`, a visible labelled
  title and isolated background content.
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

- Every application-owned title, heading, topic, fact label, warning and action resolves through
  feature 011's localisation layer with bundled English fallback.
- The source disclaimer is unchanged and marked `lang="en"`; surrounding framing follows the active
  document language and direction.
- Expanded and RTL fixtures preserve source-text language/direction boundaries, section order,
  complete labels and wrapping.
- The dialog heading hierarchy, topic group, definition facts, provenance notice, disclaimer source/
  language relationship and external warnings form a coherent screen-reader reading order.
- Opening is announced through native/shared dialog semantics; long content is not injected into a
  live region. Closing returns to the invoking origin.
- Axe/semantic/no-overflow checks cover closed background and open release/non-release,
  alternate-locale and long-text states in every Chromium/Firefox viewport/orientation project.
- Manual screen-reader checks verify discovery from no-build and active capabilities, dialog
  isolation, identity distinctions, disclaimer attribution/language, the warning relationship and the
  underlying capability after close.
- Any conformance statement names excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
  2.4.11.

## Component previews

Feature 011's preview catalogue must include:

- the closed frame-entry state;
- open release and non-release modal states;
- all seven populated help topics;
- long application/build/package identifiers;
- exact disclaimer and the warned external action;
- desktop centered, tablet/mobile portrait and landscape sheet states;
- doubled/expanded text, RTL framing with English disclaimer, reduced motion and 400%-zoom reflow.

Missing/empty/drifted artifact states are generator tests, not runtime component previews.
