# Screen Design: Help · About Modal

## Purpose

Give a Commander a concise, trustworthy explanation of application behavior, shipped identity and
the project's Frontier disclaimer without leaving or changing the current capability. The design
follows `.design/Ship Builder.dc.html`'s Help · About overlays while replacing mock facts and
duplicated implementations with shared, verified state.

**The reference is the template, not a starting point.** Where this screen and the reference
disagreed, the reference won and the specification was amended, not the drawing. The record of what
was withdrawn on that basis, and what replaced it, is in
[reference-review.md](./reference-review.md#departures-withdrawn-on-2026-08-25-second-pass).

## Entry and exit

- A visible Help action is part of the wide application frame, where the reference draws its `?`
  control beside Import.
- The narrow action menu contains the same visible action, matching the reference's `HELP & FAQ`
  mobile menu item without relying on the menu's `?` icon.
- There is no contextual entry on any other surface. The reference draws none, and the frame carries
  every capability, so provenance is reached from the frame rather than from a per-surface control.
- Opening overlays the current capability. It does not navigate, add history or change the URL.
- Close is always visible in the modal header. Closing restores the unchanged underlying capability;
  this feature adds no focus/keyboard requirement.
- Activating the backdrop may close through the shared dialog behavior, but the visible close action
  is always the complete, named route and no behavior depends on backdrop precision.

## Semantic content order

The reference draws a header and three hairline-separated sections — `ABOUT`, `FAQ`, `LICENCE` — in
one scrolling column, and that is the order built here.

### 1. Header

- Visible `Help · About` dialog title.
- Visible localised Close action.

### 2. ABOUT

- Short localised purpose: an offline, private, client-side Elite Dangerous outfitting planner. The
  reference's own sentence is one line above its version line.
- The identity facts described in [Identity facts](#identity-facts) below, in the place the
  reference draws `APP VERSION 4.2.1 · LIBRARY VERSION 3.8.0.3`.

Nothing else. The reference draws a sentence and a version line, and the two provenance paragraphs
this section once carried are withdrawn.

### 3. FAQ

Seven question/answer records remain visible in one reading sequence:

1. Do share links expose my account? — the reference's own question
2. Are there accounts, uploads or telemetry?
3. Where are my builds stored? — the reference's own question and its own answer
4. What works offline?
5. Why do my engineered stats differ in game? — the reference's own question
6. What is a hull fact and what is a build result?
7. Where do the game values and calculations come from?

Each is a heading over its own answer, so a reader moving by heading meets seven questions rather
than one block of prose. A question sits closer to its own answer than the pairs sit to each other,
which is the reference's own 4-against-11-pixel rhythm expressed in stack tokens.

The exact translated wording belongs to locale catalogues, not this screen. Answers implement the
behavioral boundaries in [../contracts/help-navigation.md](../contracts/help-navigation.md). The
reference FAQ's import claim and retained-partial-roll answer are not included: the first is feature
004's behaviour to describe, and the second contradicts feature 002 FR-013.

#### Identity facts

A semantic fact group inside `ABOUT` presents two facts, which is what the reference draws:

- Application version; and
- Bundled Almanac version.

Each is a term with its own value rather than one run-together line: a reader who meets `0.1.8`
alone has been told a number, not a version.

The wording never calls either version live-game/live-catalogue currency. Release state is **not**
displayed — the reference draws no third fact, FR-007's display half is withdrawn, and the
generator's classification remains release evidence rather than screen content. No package-defect
action appears either: FR-009 is withdrawn and the reference draws no such control.

### 4. LICENCE

- The reference's own three-line summary of what covers what, one localised line each: the
  application's code under MIT; the game data and imagery under Frontier's media-usage rules; the
  typefaces under the SIL Open Font Licence.
- The exact generated disclaimer appears as plain text in a `lang="en"` region, with no translation,
  Markdown interpretation, automatic linking or alteration.
- No complete legal document appears, and **no external action appears at all**. The modal has no
  link. The remaining licence and third-party terms are in the repository `LICENSE`, which the
  summary's first line names and the generator still audits at build time.

### Bundle budget

Measured 2026-08-25 against the `initial` budget in `angular.json` (500 kB warning, 1 MB error):
**402.26 kB raw, 101.41 kB estimated transfer.** The eagerly imported manifest and the bundled
English help catalogue are inside the budget with room; there is no overage to record and the
ceiling is not raised.

### Known gap: EDAssets interface marks

The rarity marks, the Merc Coin, the Tech Broker mark and the loader mark are EDAssets files, taken
once at build time and served from this origin under feature 002's Icons ruling of 2026-08-22. The
repository records **no licence** for them — not in root `LICENSE`, not in `legal/`, nowhere. The
reference's own summary asserts CC BY-NC-SA 4.0 over them, and that assertion is not carried into
the product, because a licence claim this repository cannot evidence is worse than a missing one.
This is a defect against FR-004's source-distribution obligation rather than a display question, and
it is recorded here for the pass that resolves it.

## Wide composition

- Use feature 011's dialog/layer and readable-measure tokens.
- Center the modal above a dimmed/inert current capability, reflecting `.design`'s desktop treatment.
- Header and close action remain at the top while the body owns vertical scrolling.
- One semantic column carries the reference's ABOUT → FAQ → LICENCE scan; spacing, dividers and fact
  grouping visually segment content exactly as the reference's hairline separators do, without
  changing the DOM order.
- Modal inline size is fluid and bounded by shared measure tokens, never the reference's literal
  `620px`. Modal block size fits the viewport and safe areas, never a literal `82%`.

## Narrow and constrained composition

- At mobile widths, use feature 011's bottom-sheet treatment: full available inline size, persistent
  header/close action and one vertically scrolling body, matching `.design`'s mobile intent.
- Tablet/mobile landscape and actual 400% zoom may promote the sheet to the full available viewport
  so every action remains reachable.
- Safe-area and viewport tokens protect the header/last action. The underlying document does not
  scroll while the modal is open.
- Long translated questions and answers, long versions, long licence-summary lines and the
  disclaimer all wrap. No ellipsis or horizontal legal-text container is used.
- DOM/reading order is identical to wide composition; no content is removed or shortened on mobile.

## States

| State                    | Presentation                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Closed                   | current capability plus the frame's visible Help entry; no hidden duplicate dialog landmark |
| Open                     | complete content: purpose, two version facts, seven topics, summary and disclaimer          |
| Global invocation        | normal top-of-modal position                                                                |
| Offline                  | identical help, facts, topics and disclaimer; nothing left to fetch and no network warning  |
| Alternate locale         | all owned text translated; exact disclaimer unchanged and marked English                    |
| Expanded/RTL fixture     | expanded/RTL section reflows around a stable English source region without truncation       |
| Reduced motion           | no essential transition; state change remains immediate and textual                         |
| Missing/invalid artifact | no runtime state; generation/release fails                                                  |

## Accessibility behavior

**Conformance for this screen reads “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
2.4.7 and 2.4.11.”** That is feature 011's qualified statement and it is repeated here rather than
referred to, because a conformance claim a reader has to follow a link to qualify is a claim that
gets quoted without its qualification. The exclusions are the keyboard and focus-order criteria the
application does not claim; everything below is claimed.

- One labelled `role="dialog"` with `aria-modal="true"`; background content is isolated while open.
- Heading levels create a complete order for ABOUT, FAQ and LICENCE.
- Heading levels nest: each `FAQ` question is a heading under the section's own, so heading
  navigation reaches the seven questions.
- Version facts use semantic terms/definitions. Every fact is text, not color or position.
- The disclaimer's language is declared on the region itself, so it is announced in the language it
  was written in whatever the interface language is.
- All actions use shared targets of at least 44 CSS px and work by touch/pointer without hover.
- Opening uses native/shared dialog announcement. The long disclaimer is never a live-region update.
- At 200% text and actual 400% zoom there is no lost content, clipped action or document horizontal
  overflow.
- Any visual transition honors `prefers-reduced-motion`.
- Manual screen-reader verification covers discovery, dialog isolation, heading order, identity
  distinctions, disclaimer language/source, the licence warning and the underlying capability after
  close.

## Component-system impact

Reuse feature 011's `AppFrame`, `DialogLayer`, heading/section, fact list, notice and visible-name
external-action primitives. Add or extend shared presentation-only components only where missing:

- `VersionFacts`: application and bundled-Almanac fact presentation; and
- `LegalExcerpt`: a wrapping text region marked in the language it was written in.

`WarnedExternalLink` was a third. It is **deleted**: the modal was its only consumer, and the modal
has no link.

These components receive complete immutable inputs and emit intent. They do not read Router,
History, browser storage, package files, generated manifests, locale globals or build stores. Every
new/extended state enters feature 011's preview catalogue at desktop, tablet and mobile widths.
