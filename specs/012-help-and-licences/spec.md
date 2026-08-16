# Feature Specification: Help, Licences and Provenance

**Feature Branch**: `012-help-and-licences`

**Created**: 2026-08-16

**Status**: Draft

**Input**: Identified by design review. Three obligations spread across the accepted specifications
had nowhere to land: Frontier Developments' media-usage notice, which [feature
001](../001-ship-selection-and-loading/spec.md)'s FR-020 and [feature
010](../010-hull-anatomy/spec.md)'s FR-005 both require the application to reproduce; the versions
feature 001's FR-044a requires it to identify; and the answers to the questions the application's
own design provokes — what the link carries, why a build is never uploaded, why engineering is
always shown complete.

## Scope

This specification covers what the application says **about itself**: the terms it and its data
travel under, the versions it was built from, and the answers to the questions a Commander
reasonably asks about how it behaves.

It owns no build state and reports no figure about a build. It requires no active build and MUST be
reachable at any time, including before a hull is chosen and with the network disabled — everything
it presents is bundled, precisely because it is the surface that explains what does and does not
work offline.

What it does not own: the illustrations and schematics themselves (features 001 and 010), the
statistics the answers describe (feature 003's family), and how any of it is presented, which is
[feature 011](../011-interface-foundations/spec.md)'s contract like every other screen.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Find out what this is and what it uses (Priority: P1)

A Commander who has just been handed a build link wants to know what this application is, who runs
it, whether their build is going anywhere, and what the ship artwork they are looking at belongs to.

**Why this priority**: The imagery is Frontier Developments' property and reproducing their
media-usage notice is a condition of showing it. It is the one requirement here that is not
optional, and it blocks nothing else — which is exactly why it is easy to leave to last and ship
without.

**Independent Test**: Open the application with no build and no network, reach this surface, and
confirm the media-usage notice, the application's own licence and every third-party notice are
present in full and readable.

**Acceptance Scenarios**:

1. **Given** any screen of the application, **When** the Commander looks for what it is and what it
   uses, **Then** this surface is reachable from where they are, without a build and without a
   network connection.
2. **Given** ship illustrations or schematics have been shown, **When** the Commander looks for
   their provenance, **Then** Frontier Developments' media-usage notice is reproduced in full,
   identifying the imagery as theirs.
3. **Given** the application is built on `@elite-dangerous-almanac/core`, **When** the Commander
   reads this surface, **Then** the package is credited, its licence is reproduced, and the notices
   it ships for anything it redistributes are reproduced with it.
4. **Given** the application's own source terms, **When** the Commander reads them, **Then** the
   licence the application is distributed under is stated, and it is not presented as covering the
   game data or the artwork, which travel under their own terms.
5. **Given** the notices are shown, **When** any of the underlying packages changes its licence,
   **Then** the change reaches this surface on the next build, because the text is generated rather
   than transcribed.

---

### User Story 2 - Tell which version you are reading (Priority: P1)

A Commander comparing a figure against the live game wants to know whether the application is
behind, and a Commander reporting a defect wants to say which version they saw it in.

**Why this priority**: Every figure in the application is only as current as the data behind it, and
a Commander who cannot tell which version they are reading cannot tell a stale catalogue from a
wrong one.

**Independent Test**: Confirm the application's own version and the bundled library version are both
shown, that they match the artefacts actually built, and that the game catalogue version reads as
unavailable rather than borrowing either.

**Acceptance Scenarios**:

1. **Given** this surface, **When** the Commander reads it, **Then** the application's own release
   version and the version of `@elite-dangerous-almanac/core` bundled with it are both shown, each
   named for what it is.
2. **Given** the two versions, **When** the Commander reads them, **Then** neither is described as
   the version of the game data, and the game catalogue version is shown as unavailable with the
   reason that the package does not report one.
3. **Given** a Commander who has found a figure that disagrees with the game, **When** they look for
   where to say so, **Then** the route to the library's issue tracker is offered, because a wrong
   figure is a library defect under constitution principle II.

---

### User Story 3 - Answer the questions the application provokes (Priority: P2)

A Commander wonders why their imported grade 5 at 84% came in at 100%, why the ship list will not
sort by jump range, and whether the link they are about to paste into Discord contains anything they
would rather not share.

**Why this priority**: Each of these is a deliberate decision that looks like a bug to a Commander
who does not know the reasoning. Answering them once here is cheaper than answering them repeatedly,
and more honest than hiding the decision.

**Independent Test**: Confirm the answers cover each behaviour a Commander is most likely to read as
a fault, that each states what the application actually does, and that each is reachable from the
capability it describes.

**Acceptance Scenarios**:

1. **Given** the Commander asks what a build link carries, **When** they read the answer, **Then**
   it states that the build travels in the URL fragment, that a fragment is never sent to any
   server, and that no account, upload or storage of theirs is involved.
2. **Given** the Commander asks why an imported partial engineering roll became 100%, **When** they
   read the answer, **Then** it states that the application models completed grades only, and why: a
   partial roll cannot be reproduced by whoever they share the build with.
3. **Given** the Commander asks why the catalogue will not sort by jump range, **When** they read
   the answer, **Then** it states that a hull has no jump range until a drive is fitted, and where
   the figure is read instead.
4. **Given** the Commander asks where the figures come from, **When** they read the answer, **Then**
   it states that every figure is the library's, that the application computes none of its own, and
   what happens when the library is wrong.
5. **Given** an answer describes a capability, **When** the Commander reads it, **Then** the answer
   matches what the application currently does — an answer that outlives the behaviour it describes
   is a defect in this feature.

---

### Edge Cases

- The application used offline: everything on this surface is present, because all of it is bundled.
  Any outbound link offered is identified as leaving the application, and nothing here becomes
  unreadable without one.
- A package updated to a new licence or a new third-party notice: the next build carries the new
  text, and no one has to remember to update a page.
- A notice file the installed package does not ship where the build expects it: the build fails
  rather than shipping an application that reproduces no notice at all. A missing legal notice is
  not a degradable state.
- A Commander reading in a language the application is translated into: the application's own words
  are translated. The licence texts and the media-usage notice are legal instruments and are
  reproduced as published, in the language they were published in, and the surface says so rather
  than presenting an untranslated block as a translation.
- The application's own version in a development build: it is shown as whatever was built rather
  than as a placeholder that reads like a release.
- A Commander looking for how their data is handled: the answer is that there is none to handle — no
  account, no upload, no telemetry — stated positively rather than left to be inferred from silence.

## Requirements _(mandatory)_

### Functional Requirements

#### Reachability

- **FR-001**: This surface MUST be reachable from anywhere in the application, MUST NOT require an
  active build, and MUST be fully readable with the network disabled after first load.
- **FR-002**: Wherever hull illustrations or schematics are shown, a route to the media-usage notice
  MUST be available, satisfying feature 001's FR-020 and feature 010's FR-005 from one place.
- **FR-003**: Wherever catalogue figures are shown, a route to the versions of FR-006 MUST be
  available, satisfying feature 001's FR-044a from one place.

#### Licences and attribution

- **FR-004**: The application MUST reproduce Frontier Developments' media-usage notice in full,
  identifying the ship imagery as their property and reproducing the terms the library redistributes
  it under.
- **FR-005**: The application MUST reproduce the licence of `@elite-dangerous-almanac/core` and the
  third-party notices that package ships, together with the licence the application itself is
  distributed under, each identified with what it covers. The application's own licence MUST NOT be
  presented as covering the game data or the artwork, which travel under their own terms.
- **FR-005a**: Every licence and notice MUST be generated at build time from the installed packages
  — their `LICENSE` and notice files — rather than transcribed into this repository. Where an
  expected file is absent, the build MUST fail rather than produce an application that reproduces no
  notice.
- **FR-005b**: [NEEDS CLARIFICATION: whether Frontier Developments' media-usage rules permit this
  application to redistribute the ship artwork as it does — served from its own origin, inside a
  freely licensed open-source application — and what this surface must state about the relationship
  between those rules and the application's own licence.] The package attributes the illustrations
  and schematics to Frontier Developments plc and redistributes them under the media-usage rules it
  quotes in `THIRD_PARTY_NOTICES.md`; the non-commercial and share-alike licences that notice also
  carries belong to two of its **data** sources, not to the artwork. So the question is not who owns
  the artwork, which is settled, but whether one set of terms sits with the other. It is a licensing
  question rather than a product one, and the answer governs what this surface must state and
  possibly whether the artwork can ship at all. Until it is answered, FR-004 and FR-005 stand:
  reproduce exactly what the package publishes, claim nothing about compatibility, and state no
  licence for the artwork that the package does not itself state.

#### Versions

- **FR-006**: The application MUST show the application's own release version and the version of the
  bundled `@elite-dangerous-almanac/core`, each named for what it is, and MUST show the game
  catalogue version as unavailable with the reason. Both real versions MUST be taken from the built
  artefacts rather than maintained by hand, so neither can drift from what shipped.
- **FR-007**: The application MUST offer the route to `@elite-dangerous-almanac/core`'s issue
  tracker for a figure that disagrees with the game, identifying it as where such a defect is fixed
  (constitution principle II). It MUST NOT offer any route that would send a build anywhere.

#### Answers

- **FR-008**: The application MUST answer, in its own words, at least: what a build link carries and
  where it travels; that nothing is uploaded and no account exists; why engineering is always shown
  at a completed grade; why the catalogue quotes no figure that depends on a fitted module; where
  every figure comes from and what happens when one is wrong; what survives a browser's storage
  being cleared; and what works offline.
- **FR-008a**: The offline answer FR-008 requires MUST distinguish the application's capabilities,
  which all work offline after first load, from hull artwork, which is fetched from the
  application's own origin when a hull is opened and is therefore available offline only for the
  hulls the Commander has already opened. It MUST say that the artwork comes from this application
  and from no third party, so that a Commander who sees a request being made knows where it goes and
  knows that nobody outside the application learns which hulls they look at.
- **FR-009**: Every answer MUST describe what the application currently does. An answer that
  describes an intention, a former behaviour or a planned one MUST NOT be presented as a statement
  of behaviour.
- **FR-010**: Where an answer explains a deliberate limitation, it MUST say that it is one and why,
  rather than presenting the limitation as a capability.
- **FR-011**: Every answer MUST be reachable from the capability it describes, so a Commander meets
  the explanation where the question occurs to them rather than only by coming here.

#### Honesty

- **FR-012**: This surface MUST NOT state a capability the application does not have, a guarantee it
  cannot keep, or a currency it cannot verify — in particular, it MUST NOT describe the catalogue as
  current with the live game, which no bundled catalogue can claim (feature 001's FR-044a).
- **FR-013**: Every string this feature owns MUST resolve through the localisation layer. The
  licence texts and the media-usage notice are excluded: they are reproduced as published, and the
  surface MUST say that they appear in the language they were published in rather than presenting
  them as translated.

### Device Requirements

- **FR-014**: This surface MUST be fully readable on desktop, tablet and mobile, in portrait and
  landscape, with long licence text scrolling within its own container rather than widening the
  page.

### Testing Requirements

- **FR-015**: A test MUST assert that the media-usage notice, every licence and every third-party
  notice is present and non-empty in a built application, and that each was generated from the
  installed package rather than read from a file committed to this repository.
- **FR-016**: A test MUST assert that both displayed versions match the built artefacts, and that
  the game catalogue version reads as unavailable rather than as either of them.
- **FR-017**: A test MUST assert that this surface is reachable with no active build and with the
  network disabled.
- **FR-018**: Each user story's primary journey MUST have a Playwright end-to-end test that runs
  against desktop, tablet and mobile viewports, in Chromium and in Firefox.

### Key Entities

- **Notice**: One licence or attribution text the application is obliged to reproduce, generated
  from the artefact it belongs to and identified with what it covers.
- **Version statement**: One named version — the application's, the library's, or the game
  catalogue's — with either its value or the reason it is unavailable.
- **Answer**: One question a Commander asks about how the application behaves, and a statement of
  what it actually does, reachable both here and from the capability it describes.

## Upstream dependencies

`@elite-dangerous-almanac/core` ships its licence and its `THIRD_PARTY_NOTICES.md` in the installed
package, which is what FR-005a generates from, and its own release version is available from the
installed package at build time. Nothing in this feature is blocked.

The game catalogue version is not available: the package records it as prose in
`PROVENANCE/ships/SOURCES.md` rather than as a machine-readable value, so FR-006 shows that version
as unavailable. Feature 001's FR-044a owns the gap and records that raising it upstream is deferred
by decision rather than pending. FR-006 is unaffected either way, since it presents the absence
rather than waiting on a fix.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Frontier Developments' media-usage notice, the library's licence, its third-party
  notices and the application's own licence are all present in a built application — zero missing,
  zero empty, and zero transcribed by hand.
- **SC-002**: A Commander can reach this surface from every screen, with no build active and with
  the network disabled — zero screens with no route to it.
- **SC-003**: Both displayed versions match the artefacts that shipped, verified against the build —
  zero drift, and zero cases of one version standing in for another.
- **SC-004**: Every behaviour a Commander is most likely to read as a fault has an answer, and every
  answer matches current behaviour — verified against the accepted specifications rather than
  reviewed by eye.
- **SC-005**: Every answer is reachable from the capability it describes as well as from here.
- **SC-006**: This surface is readable on desktop, tablet and mobile — the same end-to-end suite
  passes on all three, in both browsers, with no horizontal page scrolling at any of them.

## Assumptions

- Reproducing a notice is a legal obligation rather than a courtesy, so it is specified as a
  requirement with a failing build behind it rather than left to a plan.
- Licence text is generated, never authored here. A hand-maintained copy is the same class of
  mistake as a hand-maintained catalogue: a second record that drifts from the first, except that
  this one misstates the terms of software a Commander is running.
- The answers this feature presents are the application's own words and are translated. The legal
  texts are not, because a translated licence is not the licence.
- Whether the ship artwork's terms permit how this application ships is an open question (FR-005b)
  and is not resolved by assumption. Answering it may change what this surface states.
- Support, feedback and community routes beyond the library's issue tracker are out of scope. The
  application has no backend and collects nothing, so it has nowhere to receive a report; the one
  route it offers is where a wrong figure actually gets fixed.
- Which of these belongs on one screen and which appears in place beside the capability it explains
  is decided at plan time against the design system, per constitution principle VII.
