# Screen Design: Help · About Modal

## Purpose

Give a Commander a concise, trustworthy explanation of application behavior, shipped identity,
Almanac provenance and the project's Frontier disclaimer without leaving or changing the current
capability. The design follows `.design/Ship Builder.dc.html`'s Help · About overlays while replacing
mock facts and duplicated implementations with shared, verified state.

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
- The bounded provenance statement.

### 3. FAQ

Seven question/answer records remain visible in one reading sequence:

1. What does a shared build link contain?
2. Are there accounts, uploads or telemetry?
3. Where are builds and preferences stored?
4. What works offline?
5. How are engineering grades represented?
6. What is a hull fact versus a build result?
7. Where do game values and calculations come from?

The exact translated wording belongs to locale catalogues, not this screen. Answers implement the
behavioral boundaries in [../contracts/help-navigation.md](../contracts/help-navigation.md). The
reference FAQ's import claim and retained-partial-roll answer are not included.

#### Identity facts

A semantic fact group inside `ABOUT` presents:

- Application version;
- release status, or visible Non-release plus build ID;
- Bundled Almanac version; and
- a bounded statement that this bundled Almanac supplies catalogue data, validation and
  calculations.

The wording never calls either version live-game/live-catalogue currency. A separate notice explains
that Frontier owns covered game data/imagery. No package-defect action appears: FR-009 is withdrawn
and the reference draws no such control.

### 4. LICENCE

- Localised framing distinguishes the application MIT grant from Frontier/package rights and names
  repository `LICENSE` as the excerpt source.
- A visible localised note says the following disclaimer is reproduced in original English.
- The exact generated disclaimer appears as plain text in a `lang="en"` region, with no translation,
  Markdown interpretation, automatic linking or alteration.
- One visible external action says that all remaining licence and third-party terms are in the
  repository `LICENSE` on GitHub, that activation leaves the app and that network may be required.
- No other complete legal document or legal-details link appears in the modal, and no other external
  action appears at all. This is the modal's single link.

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
- Long translated questions, build IDs, versions, URLs-as-link-label supplements and disclaimer text
  wrap. No ellipsis or horizontal legal-text container is used.
- DOM/reading order is identical to wide composition; no content is removed or shortened on mobile.

## States

| State                    | Presentation                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Closed                   | current capability plus the frame's visible Help entry; no hidden duplicate dialog landmark |
| Open release             | complete content, textual release status, no required build ID                              |
| Open non-release         | complete content, prominent textual Non-release state and build ID                          |
| Global invocation        | normal top-of-modal position                                                                |
| Offline                  | identical help/facts/disclaimer; the licence action retains its visible network warning     |
| Alternate locale         | all owned text translated; exact disclaimer unchanged and marked English                    |
| Expanded/RTL fixture     | expanded/RTL framing reflows around stable English source region without truncation         |
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
- Version facts use semantic terms/definitions. Release status and source ownership are text, not
  color or position.
- Disclaimer source and English-language notice are programmatically associated with the plain-text
  region.
- The licence action includes a visible destination purpose plus leaving-app and network warnings;
  an icon is supplemental only.
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

- `VersionFacts`: release/non-release/application/Almanac fact presentation;
- `LegalExcerpt`: source/language framing plus wrapping text region; and
- `WarnedExternalLink`: destination-purpose label with leaving-app/network description.

These components receive complete immutable inputs and emit intent. They do not read Router,
History, browser storage, package files, generated manifests, locale globals or build stores. Every
new/extended state enters feature 011's preview catalogue at desktop, tablet and mobile widths.
