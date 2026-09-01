# Feature Specification: Interface Foundations

## Scope

Every capability uses one design system, works with pointer, touch and screen reader at all supported
sizes, resolves application text and formatting through one localisation layer, and states what it is
to a reader that arrives from a search engine. The target is
WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.
**Amended 2026-08-27:** 2.2.1 joins the list with FR-025's restart, which is applied rather than
offered and therefore carries no way to hold the page.

## Clarifications

### Session 2026-08-18

- Q: Which application-owned interface languages should ship initially? → A: English and German.

### Session 2026-08-20

- Q: Must every selectable shipped application language remain complete as capabilities add or
  remove application-owned messages? → A: Yes. Every shipped catalogue has the same non-empty keys
  and interpolation variables as bundled English. A change to the application-owned message set
  updates every shipped catalogue in the same change. An incomplete catalogue is never partially
  published; the interface remains on its prior complete language or falls back atomically to
  bundled English.

## User Scenarios

### Story 1 — Use every capability with assistive technology (P1)

1. Controls expose matching visible and accessible names, roles, states and errors.
2. Statistics expose meaning, unit, availability and viewing conditions as text.
3. Important changes and errors are announced once without repeating unaffected content.
4. Every visual information carrier has a complete text equivalent.

### Story 2 — Use every supported size (P1)

1. Every capability remains available on desktop, tablet and mobile in portrait and landscape.
2. Content remains complete at 200% text size and 400% zoom without horizontal page scrolling.
3. In-scope text and non-text contrast and touch targets meet their applicable WCAG 2.2 AA criteria;
   overall conformance excludes criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.
4. Reduced-motion preference removes nonessential motion without removing meaning.

### Story 3 — Read the appropriate language (P2)

1. The application selects a shipped language matching the browser language setting; when none
   matches, it uses English. There is no in-application language control: the browser setting is the
   only input.
2. Application-owned text and numeric, credit, distance, percentage and date formatting follow the
   active locale.
3. Missing application translation falls back to bundled English text.
4. Game text unavailable in the active locale uses canonical package text, in its own language and
   with its disclosure attached, when that text exists; otherwise it is explicitly unavailable.
5. Each screen states what it is and where it lives, in the same language and in the same commit as
   its title, so a search result and a pasted link name the screen rather than the product.

### Story 4 — Read the version that was published (P2)

1. A session already open when a newer version is published states that a newer one is available
   without the Commander reloading the page.
2. The newer version applies itself, and says so twice: an overlay states that the restart is
   happening and stands long enough to be read, and the session that comes up states that the
   update was applied and which version it landed on. Neither asks anything. **Amended 2026-08-27:**
   the overlay carried a control that called the restart off, and the scenario required one; both
   are withdrawn.
3. A session that could not restart — no page to start over — is served the newer version the next
   time the application starts, and offers a named control that applies it in the meantime.
4. A cached application the worker cannot repair says so and offers the recovery that fixes it.
   Clearing a cache or forcing a reload from the browser is never the route back.

## Requirements

### Design System

- **FR-001**: Every capability MUST compose the shared component library and design-token system.
  Duplicate shared components and capability-specific visual systems are prohibited.
- **FR-002**: Color, type, spacing, radius, elevation, borders and motion MUST use design tokens;
  visual literals outside the token layer are prohibited.
- **FR-003**: The application MUST ship one dark theme with no theme control or stored preference.
- **FR-004**: Components MUST be presentation-only and preview every supported populated, empty,
  loading, error and disabled state at desktop, tablet and mobile widths.
- **FR-005**: A missing reusable pattern MUST be added to the design system before a capability uses it.

### Tool Navigation

- **FR-028**: The application MUST state which tool the open route belongs to, and MUST offer every
  tool it serves. The tools MUST come from one registry, so a tool cannot be offered in one place
  and be missing from another. A tool the application serves no address for MUST NOT be offered.
  The tool the open route belongs to MUST be identified in localised text and by an exposed state,
  never by colour or position alone, and MUST be identified rather than offered: nothing names it
  as a way to the screen a Commander is already reading. Every other tool MUST be reachable at
  every supported width.

### Accessible and Responsive Operation

- **FR-006**: Every capability MUST work by pointer and touch without hover or multi-pointer gestures.
- **FR-007**: Every control MUST expose an accessible name matching its visible name, role, state and
  relationship to labels and errors.
- **FR-008**: Every capability MUST expose meaningful landmarks and heading structure.
- **FR-009**: A blocking error MUST be announced promptly. Other changes MUST be announced without
  interrupting current speech or announcing unaffected values.
- **FR-010**: Meaning MUST NOT depend on colour, shape, position or motion; every visual information
  carrier MUST have a text equivalent.
- **FR-011**: Every capability MUST remain available on desktop, tablet and mobile in portrait and
  landscape and at 200% text size and 400% zoom, with no horizontal page scrolling.
- **FR-012**: Within the qualified conformance target that excludes criteria 2.1.1, 2.1.2, 2.1.4,
  2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11, text, meaningful non-text content and interactive targets
  MUST meet the applicable WCAG 2.2 AA contrast and target-size rules.
- **FR-013**: Motion MUST respect `prefers-reduced-motion` and MUST NOT carry required meaning.
- **FR-014**: Layout and interaction MUST survive text expansion and right-to-left content.
- **FR-015**: Conformance statements MUST name all eight excluded criteria: 2.1.1, 2.1.2, 2.1.4,
  2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11. Unqualified WCAG 2.2 AA claims are prohibited. A statement
  naming only the seven keyboard criteria is an unqualified claim and MUST fail the policy checker.

### Localization

- **FR-016**: Every application-owned user-facing string MUST resolve through the localisation layer;
  hard-coded display text in components, templates and formatters is prohibited.
- **FR-017**: The application MUST select a shipped language matching the browser language setting
  and MUST fall back to English when none matches. The initial shipped application languages MUST be
  English and German. The browser language setting is the only input: the application MUST NOT offer
  a language control and MUST NOT persist a language of its own.
- **FR-018**: Numbers, percentages, credits, distances and dates MUST use the active locale.
- **FR-019**: Translations MUST ship as same-origin static assets and complete English fallback text
  MUST be available without a network. Every selectable shipped application locale MUST contain the
  same application-owned message keys and interpolation variables as bundled English, with no blank
  value. Adding, removing or changing an application-owned message MUST update every shipped locale
  in the same change. An incomplete or malformed catalogue MUST NOT be partially published; the
  interface MUST remain on its prior complete locale or fall back atomically to bundled English. Raw
  keys, empty strings and placeholders MUST not appear.
- **FR-020**: Game text MUST come from the Almanac. If the package cannot supply the active locale,
  its canonical text MUST be requested and, when present, shown, carrying the language it is actually
  in and a disclosure — programmatically associated with the text — saying why it is not in the
  reading language. If the package supplies no canonical text, the value MUST be unavailable. The
  application MUST NOT keep a private game-text translation.

  _Amendment history._ **2026-08-28 (Commander request: "remove the 'Nicht übersetzt' or similar
  chips").** "Identified as untranslated" no longer means a badge beside the text. A screen of the
  Almanac's nouns read in German is a screen of chips — one on nearly every row of the ledger, the
  chooser and the material list — and the state they marked is the ordinary state of game text in a
  language the package does not ship. The disclosure carries it instead, which is where a reader was
  already reaching it from.

### Application Delivery

- **FR-025**: A session running a version that has been superseded MUST detect the newly published
  one without a Commander-initiated reload and MUST apply it by itself. It MUST NOT do so unannounced:
  the restart MUST be preceded by visible text saying what is happening, on screen before the page is
  replaced and for no longer than the moment before it, and the session that comes up on the newer
  version MUST state as visible text that the update was applied and which version it is now running.
  That statement MUST be dismissible by a named control, MUST take itself down once it has stood, and
  MUST NOT return on a later navigation in the same session. Neither statement MUST offer a control that
  calls the restart off, defers it or asks anything. A session whose restart could not be carried
  out MUST state as visible text that a newer version is available and MUST offer a named control
  that applies it, and a session that never applies it MUST be served the newer version the next
  time the application starts.

  _Amendment history._ **2026-08-26 (Commander request: "detected updates should automatically be
  applied once they are ready, ideally with an overlay just before it is applied").** Reversed from
  "MUST NOT apply it by itself". The original reading was that a reload replaces everything on
  screen and that deciding it for someone mid-outfitting is the one thing the mechanism must not do.
  What it produced is a fleet of sessions on old builds behind a notice nobody presses — the exact
  failure the requirement exists to prevent — and the reload is no longer the loss it was reasoned
  against: a build lives in the link in the address bar and in this browser's own store, and both
  survive a restart. **2026-08-27 (owner's decision).** The overlay that replaced the control still
  asked a question, and the question is withdrawn with the twenty-second floor that carried it. The
  restart is announced twice and cannot be stopped. **2026-08-28 (Commander request: "the
  'Updating' modal is appearing way too long — it shouldn't be triggered more than 1 second before we
  actually apply the update and reload the page").** "Standing long enough to be read" is withdrawn
  as the measure of the overlay. It was reasoned as reading time for two sentences, which made a
  Commander sit in front of a page they could not touch for ten seconds while nothing happened; the
  half that is meant to be read is the one the restarted session draws, which carries no clock. The
  overlay is now the moment before the restart, and the second sentence about where the open build
  lives across the restart goes with the wait that was there to read it. What the requirement still
  forbids is a restart nobody was told about. **2026-08-28 (Commander request: "make the 'This
  session restarted on the newer version that was published.' modal auto disappear after 6
  seconds").** The notice on the other side of the restart goes by itself as well as by its control.
  It is a second time limit and it is named as one: constitution V is amended to 9.0.0 so that the
  2.2.1 exclusion covers applying an update — the restart and this notice — rather than the restart
  alone. What it buys is that a Commander who came back to their build is not met by a modal that
  waits to be pressed; the version it names is on Help · About, and the application is already
  running it.

  **What that costs, recorded rather than buried.** A restart on a clock with no way to hold it
  meets none of WCAG 2.2.1's conditions. The criterion is excluded by constitution V for this
  mechanism and no other, every conformance statement in this repository names it, and this is the
  application's only time limit. A second one needs an amendment rather than a reading of this
  requirement.

- **FR-026**: A cached application in a state the worker cannot repair MUST be stated as a blocking
  error carrying a named control that recovers it. Recovery MUST NOT depend on the Commander
  clearing a cache or forcing a reload from outside the interface. Recovery MUST NOT happen on a clock: an
  unrepairable cache is an error rather than an improvement, and there is no working page under the
  warning to protect.

- **FR-027**: Every addressable screen MUST publish, as part of the same commit that publishes the
  root language, direction and document title, a description of itself and the canonical address of
  its route, both resolved in the committed locale. A screen whose subject is one hull MUST name
  that hull in both, from the package's own name for it rather than from a table kept here; where
  the subject cannot be resolved from the package, the address MUST publish the nearest enclosing
  identity rather than a sentence with an unfilled variable in it. The
  application MUST additionally ship, as same-origin static files, a crawl policy that permits
  indexing, a sitemap naming every address the application serves — one per hull included,
  enumerated from the installed package rather than written down by hand — a web app manifest
  carrying an icon at 192 and at 512 square plus a maskable one, an image for a link preview, and
  machine-readable structured data describing the application. The document served before the
  application starts MUST carry the complete set for the address it is served at, in bundled
  English, so a reader that executes no script is neither served a document that says nothing nor
  served the application's own title in place of the page's. A canonical address
  MUST name the production site rather than wherever the document happens to be served from, and
  MUST NOT carry a build: the payload lives in the fragment (001/FR-015), and a canonical per build
  is a canonical per nothing. A deployment that is not the production site MUST ask not to be
  indexed. Every file that repeats the production address or the route list MUST
  be reconciled by the policy checker rather than by hand.

  The head is the one place where canonical package text carries no untranslated disclosure. Every
  value in it — the document's title, its description, and the card title, description and image
  alternative that restate them — is a bare string with no element structure to hang a `lang`
  boundary or an associated control on, and a disclosure written into the sentence would be read
  out as part of the page's name in every search result and every link preview. A hull name is a
  proper noun the game does not translate
  (`contracts/localization-and-formatting.md`), the sentence around it is in the committed locale,
  and the document's own `lang` states which that is. This exception is the head and nothing else:
  the same name on the screen behind it still follows the presenter order in full.

  _Recorded 2026-08-27 (Commander request: "analyse the application and propose ways to optimize for
  search engines")._ The analysis, and what was deliberately not done, are in
  `design/search-visibility.md`. Prerendering is out of scope by the owner's decision: this
  requirement is what a client-side application can state about itself without one.

  _Amended 2026-08-30 (Commander request: "provide suggestions to improve its discoverability and
  SEO")._ The second analysis, what it closed and what it left, is in the same design record.

### Verification

- **FR-021**: Every primary journey MUST run across the five layout profiles — desktop, tablet
  portrait, tablet landscape, mobile portrait and mobile landscape — in both Chromium and Firefox.
- **FR-022**: Automated accessibility checks MUST cover every capability and relevant state and MUST
  fail the build on an in-scope violation.
- **FR-023**: Screen-reader journeys MUST supplement automation for every primary capability.
- **FR-024**: Automated checks MUST reject visual literals outside tokens, hard-coded application
  display text and missing component-state previews.

## Almanac Coverage

The package supplies game names for supported locales and an explicit missing-translation result.
It does not own application messages, locale selection, formatting, accessibility, the design
system, or how the application is delivered and updated.

## Current Almanac Limit

Package localisation covers modules, blueprints, experimental effects, materials, hull/manufacturer,
slot/restriction, pre-engineered variant, engineering-group, effect-description and structured
diagnostic families. A helper can explicitly return `null` when the requested locale or text itself
is unavailable. Canonical package text is disclosed as untranslated when present; otherwise the
value is unavailable. The application MUST NOT fill either miss with private game-text or diagnostic
translations.

## Success Criteria

- **SC-001**: Every primary journey completes with pointer, touch and screen reader.
- **SC-002**: Automated scans report no in-scope WCAG violations.
- **SC-003**: Every capability remains complete at all supported sizes without horizontal page scroll.
- **SC-004**: No visual literal or application-owned display string bypasses its shared system.
- **SC-005**: The full journey suite passes in Chromium and Firefox across all five layout profiles,
  covering the three viewport classes in both orientations.
- **SC-006**: English and German contain identical non-empty application-owned message-key and
  interpolation-variable sets across the complete application; a matching browser language selects
  the corresponding shipped language and an unsupported browser language selects English.
- **SC-007**: A session left open across a deployment states that it is restarting, offers nothing
  to press while it does, comes back on the published version on its own within a minute, and states
  on arrival that the update was applied and which version it is running — a statement that carries
  one named control and goes by itself if nothing presses it. Where the restart could
  not be carried out, the session states that a newer version is available and applies it from its
  own named control. No cache-clearing reload appears anywhere in either journey.

- **SC-008**: Each addressable screen is served its own title, its own description and its own
  canonical address, in the committed language, with no build payload in the address; a screen whose
  subject is one hull names that hull in its title and in its description; the document served
  before the application starts carries that address's own canonical address, title and description
  in bundled English; every hull has an address the sitemap names and the deployment answers without
  a redirect; an address whose subject the package does not carry publishes the enclosing screen's
  identity rather than an unfilled sentence; a link preview carries an image, and on a hull address
  that image is the hull's own, rendered;
  the manifest carries an icon at 192 and at 512 square plus a maskable one; a deployment that is
  not the production site asks not to be indexed; and the crawl policy, the sitemap, the manifest
  and the structured data agree with the route table and with one another.

- **SC-009**: Every product route names the tool it belongs to and exposes that tool as the current
  one, in Chromium and Firefox across all five layout profiles, covering the three viewport classes
  in both orientations. The tools named are exactly the ones the registry carries; every tool but
  the current one opens the address it declares; and the current one carries no control leading to
  the route in view.
