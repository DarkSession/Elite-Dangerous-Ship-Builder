# Feature Specification: Prerendered Documents

**Feature Branch**: `015-prerendered-documents`

**Created**: 2026-09-06

**Status**: Draft — ready to plan

**Input**: User description: "Prerendered documents for search visibility"

Every Nav Beacon address that has something to say answers with a document that
already says it, before any script runs.

Today it does not. The application paints its content after Angular boots, so a
reader that runs no script is served a shell: the head is correct, the body is
empty. Feature 011 fixed the head — each of the 52 advertised addresses carries
its own title, description, canonical, `og:url` and card image
(`specs/011-interface-foundations/design/search-visibility.md`, and
`scripts/publish-static-routes.mjs` which writes them). It recorded prerendering
as "the single highest-value change available, and explicitly out of the chosen
scope". This feature is that change, and it supersedes that record.

What is missing is the body. The 48 hull addresses carry the content worth
finding — manufacturer, size, maximum speed, base shield, hull mass, crew, mass
lock, hardpoint counts by class, and internal capacity by size. A Commander who
searches for a hull's mass lock, and any reader answering that question on their
behalf, is served none of it.

The content is a function of the pinned `@elite-dangerous-almanac/core` and
nothing else. It carries no session, no request and no Commander, and it is the
same for everyone who asks for that address. So the build can write it, which is
what constitution 9.1.0 permits: build-time rendering is allowed, per-request
rendering is not, and a prerendered document is a static asset.

This feature is scoped to the capability and names no screen. Which screens carry
the content, and how each composes it, is settled at plan time in `design/`.

## Clarifications

### Session 2026-09-06

- Q: A document can only be written in bundled English, because the build has no
  browser language to read. What does a Commander whose committed locale is German
  see as the first frame? → A: **English first, then German.** The document paints
  English content immediately and the takeover replaces it with the committed
  locale. A German Commander sees English for the moment before the application
  starts — where today they see a blank shell for that same moment. So no Commander
  is worse off than now, and every Commander gains content in an earlier frame.
  The language change at takeover is the one content change FR-009 permits, and it
  is permitted only because it replaces text in place: it MUST NOT move layout, and
  what it may change is the words, never what is on the page.

- Q: The sitemap advertises 52 addresses. Which of them get a generated document?
  → A: **The 50 that carry content.** The root, the hull catalogue and the 48
  hulls. `/outfitting` and `/equipment` are benches whose content is the
  Commander's own work and is empty until they act, so a document for either would
  state nothing findable while adding surface to keep honest. Both keep today's
  behaviour and today's head. This is a ruling about which addresses have content
  to state, not a claim that a bench matters less; a bench that later gains
  package-derived resting content becomes content-bearing and is generated.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A reader that runs no script can read a hull (Priority: P1)

Someone asks what an Anaconda's mass lock factor is. The reader answering them —
a search engine's indexer, an AI crawler, a link checker, a Commander with script
disabled — fetches the hull's address and reads the answer out of the response.
It does not boot an application, wait for a frame, or run anything.

**Why this priority**: This is the feature. Every other story here protects a
Commander from the cost of delivering it. Nothing else in this specification is
worth doing on its own.

**Independent Test**: Fetch each content-bearing address with script execution
disabled and confirm the response body states the address's subject. For a hull,
confirm every stated figure is present and matches the package. Delivers the
whole search-visibility gain with no other story built.

**Acceptance Scenarios**:

1. **Given** a reader that executes no script, **When** it fetches a hull's
   address, **Then** the response body states that hull's manufacturer, size,
   maximum speed, base shield, hull mass, crew, mass lock, hardpoint counts by
   class, and internal capacity by size.
2. **Given** a reader that executes no script, **When** it fetches the hull
   catalogue's address, **Then** the response body names every hull the
   catalogue lists and links to each hull's own address.
3. **Given** a reader that executes no script, **When** it fetches any advertised
   address, **Then** the response carries that address's own title, description,
   canonical, `og:url` and card image, unchanged from what feature 011
   established.
4. **Given** a hull's figures as the pinned package reports them, **When** the
   document for that hull is compared against the package, **Then** every figure
   matches and none is rounded, substituted or invented.

---

### User Story 2 - A Commander's first frame is better, never worse (Priority: P1)

A Commander opens a hull's address from a search result. They see the hull's
content sooner than they do today, because it is already in the document. The
application then takes over. They do not see the content change, move, flash, or
disappear.

**Why this priority**: Equal first priority with story 1, because it is the
condition on shipping it. A document that reaches a crawler but costs a Commander
a visible flash or a reflow under their finger is a net loss: it trades a real
regression for an invisible gain. This story is what makes story 1 releasable.

**Independent Test**: Open each content-bearing address on each of the five layout
profiles, record the frames from first paint until the application is
interactive, and confirm no content moves, changes or blanks across the takeover.
Testable without story 3.

**Acceptance Scenarios**:

1. **Given** a Commander opens a content-bearing address, **When** the first frame
   paints, **Then** it shows the address's content rather than an empty shell.
2. **Given** the first frame has painted, **When** the application takes over,
   **Then** no content the Commander can see moves position, and no element they
   are reading is displaced.
3. **Given** the first frame has painted, **When** the application takes over,
   **Then** the page does not blank, and no content disappears and returns.
4. **Given** any of the five layout profiles in either orientation, **When** the
   first frame paints, **Then** it is laid out correctly for that viewport and is
   not corrected to a different composition after takeover.
5. **Given** the takeover fails for any reason, **When** the Commander looks at
   the page, **Then** they are left with a readable document rather than a broken
   or empty one.

---

### User Story 3 - Nothing a Commander already relies on is lost (Priority: P2)

A Commander who has opened the application before can still use every capability
with no network. A Commander who follows a link to an address the build never
generated a document for still lands on a working page. A Commander who shares a
build still shares it by fragment, and nothing about their build reaches a log.

**Why this priority**: These are standing guarantees from constitution I rather
than new behaviour. They are listed because prerendering is exactly the kind of
change that breaks them quietly.

**Independent Test**: Run the existing offline journeys unchanged; request an
address with no generated document; inspect every generated document for
Commander data.

**Acceptance Scenarios**:

1. **Given** a Commander who has loaded the application once, **When** they go
   offline, **Then** every capability remains usable, as it is today.
2. **Given** an address the build generated no document for, **When** a Commander
   opens it, **Then** the application resolves the address itself and the
   Commander sees the same screen they would have seen otherwise.
3. **Given** any generated document, **When** it is inspected, **Then** it
   contains no build, no saved record, no Commander data and no runtime
   environment configuration.
4. **Given** a Commander shares a build, **When** the link is examined, **Then**
   the build is in the fragment and no part of it is in the path or query.

---

### Edge Cases

- **A hull the package adds or removes at a pin move.** The set of documents
  follows the package. A hull the package no longer carries must not keep an
  advertised address, and a hull it adds must gain one, without either being
  listed by hand.
- **An address that resolves to no hull.** `/ships/NotAShip` is advertised by
  nobody but can be typed. It must behave as it does today rather than answering
  with a generated document for a hull that does not exist.
- **A Commander whose language is not English.** The document is written in
  bundled English and the takeover replaces its text with the committed locale
  (FR-011). The replacement is in place: the words change, the layout does not.
- **Script runs but the takeover fails** — a bundle blocked, a chunk that never
  arrives. The document must remain readable rather than becoming an empty page.
- **The service worker serves a cached shell for an address whose document
  differs from it.** Exactly one of the two must win, decided rather than left to
  ordering.
- **Text at 200% and zoom at 400% on the first frame**, before any script has
  adjusted anything.
- **A document generated from a package pin that no longer matches the running
  bundle**, if the two are ever published separately.

## Requirements _(mandatory)_

### Functional Requirements

**What a document must contain**

- **FR-001**: Every content-bearing advertised address MUST answer with a document
  whose main content is present in the served response, without script execution.
- **FR-002**: A hull's document MUST state that hull's manufacturer, size,
  maximum speed, base shield, hull mass, crew, mass lock, hardpoint counts by
  class, and internal capacity by size.
- **FR-003**: The hull catalogue's document MUST name every hull it lists and MUST
  link to each hull's own address.
- **FR-004**: Every figure in a document MUST be the value the pinned
  `@elite-dangerous-almanac/core` reports, presented but never altered, rounded,
  re-derived or substituted (constitution II and IV). Where the package reports a
  value as unavailable, the document MUST state the absence rather than a
  plausible number.
- **FR-005**: Every document MUST carry the per-address head feature 011
  established — title, description, canonical, `og:url` and card image — unchanged
  in contract. This feature supersedes the body-less output of
  `scripts/publish-static-routes.mjs`; it does not weaken that head.
- **FR-006**: The set of generated documents MUST be derived from the installed
  package and the advertised address list, never from a hand-maintained list of
  hulls (constitution II).
- **FR-007**: A document MUST NOT contain a build, a saved record, any other
  Commander data, or any runtime environment configuration (constitution I, and
  9.1.0 Technology Constraints).

**What a Commander sees**

- **FR-008**: The first frame of an advertised address MUST show that address's
  content rather than an empty shell.
- **FR-009**: When the application takes over from the document, no content
  visible to the Commander MAY move position, blank, or disappear and return.
- **FR-010**: The first frame MUST be laid out correctly for the viewport it is
  painted at, on every one of the five layout profiles in both orientations,
  without being corrected to a different composition after takeover. Composition
  that the build cannot know MUST NOT decide the first frame; where the running
  application later refines the composition by measurement, that refinement MUST
  NOT move content the Commander can already see.
- **FR-011**: A document MUST be written in bundled English. When the committed
  locale is not English, the application MUST replace the document's text with the
  committed locale's text on takeover. That replacement is the one content change
  FR-009 permits: it MUST replace text in place, MUST NOT move layout, and MUST NOT
  add, remove or reorder anything on the page. A Commander whose locale is not
  English therefore reads English in the first frame rather than the blank shell
  they are served today.
- **FR-012**: If the takeover does not complete, the Commander MUST be left with
  the readable document rather than an empty or broken page.

**What must keep working**

- **FR-013**: Every capability MUST remain usable offline after first load,
  unchanged from today (constitution I).
- **FR-014**: Where a cached shell and a generated document could both answer one
  address, exactly one MUST be defined to win, and the rule MUST be stated rather
  than left to ordering.
- **FR-015**: An address for which no document was generated MUST still work: the
  running application resolves it and the Commander sees the screen they would
  otherwise have seen.
- **FR-016**: An address that resolves to no hull MUST behave as it does today and
  MUST NOT answer with a generated document for a hull that does not exist.
- **FR-017**: A build MUST remain addressed by the URL fragment. No part of a
  build may move into a path or query (constitution I as amended at 9.1.0).

**Which addresses**

- **FR-018**: A document MUST be generated for every content-bearing advertised
  address: the root, the hull catalogue and each of the 48 hulls. `/outfitting`
  and `/equipment` MUST NOT be generated, and MUST keep today's behaviour and
  today's head unchanged.
- **FR-021**: Which advertised addresses are content-bearing MUST be recorded in
  one place that the build and the verification gate both read, so the two cannot
  disagree about what should have been generated. An advertised address that is
  neither generated nor recorded as content-free MUST fail the build rather than
  be published silently.

**How it is verified**

- **FR-019**: The accessibility requirement of constitution V — WCAG 2.2 AA with
  the eight named exclusions (2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7,
  2.4.11) — MUST hold for the prerendered first frame exactly as it holds for
  every other frame. The automated scan MUST cover the first frame, not only the
  settled page.
- **FR-020**: The content of every generated document MUST be checked against the
  package by an automated gate, so a document that silently stops matching the
  package fails the build rather than being published.

### Key Entities

- **Advertised address**: an address the sitemap lists. Owned by
  `scripts/generate-sitemap.mjs` and derived from the installed package. All 52
  keep the head feature 011 gave them.
- **Content-bearing address**: an advertised address whose subject the package can
  state without a Commander having done anything — the root, the hull catalogue
  and the 48 hulls. The unit this feature generates a document for. `/outfitting`
  and `/equipment` are advertised but not content-bearing, because a bench is
  empty until a Commander fills it.
- **Generated document**: the HTML served at an advertised address. Carries that
  address's head (feature 011) and, new here, its content. A static asset,
  written by the build, identical for every caller.
- **First frame**: what a Commander sees before the application has taken over.
  Today an empty shell; here the generated document.
- **Takeover**: the moment the running application assumes control of a document
  the build wrote. Its requirement is to be invisible.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the 50 content-bearing addresses state their subject in the
  served response with no script executed. Today 0% do. The two benches are
  unchanged, and all 52 keep the head they have today.
- **SC-002**: For all 48 hulls, a reader that runs no script can read every figure
  named in FR-002, and each matches the pinned package exactly.
- **SC-003**: Across the takeover, visible content moves by zero pixels on all
  five layout profiles in both orientations. No frame between first paint and
  interactive is emptier than the frame before it.
- **SC-004**: A Commander sees an address's content in a measurably earlier frame
  than they do today, on every layout profile.
- **SC-005**: The automated accessibility scan covers the first frame of every
  advertised address across the ten Playwright projects, and reports no in-scope
  violation.
- **SC-006**: Every offline journey that passes today passes unchanged.
- **SC-007**: An address with no generated document opens the correct screen 100%
  of the time.
- **SC-008**: Zero generated documents contain Commander data or runtime
  environment configuration, verified by an automated check rather than review.
- **SC-009**: A package pin move that changes the hull set changes the generated
  set with no hand edit, and a mismatch fails the build.

## Out of Scope

Stated so it is not re-derived:

- **Per-request rendering and a server.** Prohibited by constitution I and by the
  Technology Constraints at 9.1.0. Prerendering answers a crawler exactly as
  per-request rendering would, so nothing here needs one.
- **`hreflang` and per-language addresses.** Language follows the browser setting
  and nothing else (011/FR-017), so `en` and `de` are the same address and there
  is no alternate to declare. This feature does not introduce a per-language URL.
- **Prerendering a specific build.** A build is not an advertised address. It
  lives in the fragment, which is never sent with the request, and generating
  documents for build permutations would publish unbounded near-duplicate content
  besides.
- **Rich link previews for a build** — a card naming the hull and jump range of a
  shared build. It is a sharing capability rather than a search one, it cannot be
  served from the fragment, and it is not part of this feature.
- **Documents for the two benches.** `/outfitting` and `/equipment` are advertised
  but state nothing until a Commander acts, so there is no content for a document
  to carry. They keep today's behaviour and today's head. A bench that later gains
  package-derived resting content becomes content-bearing and is generated then.
- **Structured data per hull.** Feature 011 ruled that a `Product`- or
  `Vehicle`-shaped node would restate package-owned game data in this
  repository's markup. That ruling stands and is not reopened here.

## Assumptions

- The sitemap remains the single list of advertised addresses, and
  `scripts/search/published-addresses.mjs` remains the one place that list is
  read from. This feature adds content to those documents; it does not introduce
  a second definition of which addresses exist.
- The head contract from feature 011 is correct and stays as it is. Only the body
  is new.
- Hull content has no per-request variance. `HullDetailFacade` reads the package,
  the formatters and the localisation layer, and no session or Commander state.
  If that stops being true, this feature's premise stops holding.
- The measurement-driven parts of the composition can be arranged so the first
  frame is correct at every width without knowing the viewport. If that turns out
  to be false for a given region, that region's first frame is settled at plan
  time rather than shipped with a visible correction.
- The 80% unit coverage floor and the ten-project Playwright matrix are unchanged
  by this feature and are not relaxed to accommodate it (constitution VIII).

## Dependencies

- `@elite-dangerous-almanac/core` at the pinned version, as the only source of
  every figure a document states (constitution II).
- Constitution 9.1.0, which permits build-time rendering. This feature cannot be
  planned against 9.0.2 or earlier.
- Feature 011's published-address and head machinery, which this feature extends
  and whose body-less output it supersedes.
