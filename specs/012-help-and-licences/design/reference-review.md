# Design Reference Review: Help, Licences and Provenance

The source reference is `.design/Ship Builder.dc.html`, specifically the repeated desktop and mobile
Help · About overlays in canvases 1a–1d, their top-bar/`?`/mobile-menu entry actions and
`wireHelp(...)` behavior. It is the visual and information-hierarchy source, not an authority for
versions, application behavior, legal facts, dependencies or CSS literals.

## Adopt

- Help opens above the current capability instead of replacing it.
- A single grouped destination uses the reference's own three sections in its own order:
  `ABOUT` → `FAQ` → `LICENCE`, separated by hairline dividers in one scrolling column.
- The application and bundled-Almanac versions sit inside `ABOUT`, where the reference draws its
  `APP VERSION … · LIBRARY VERSION …` line — above the questions, not in a section after them.
- Wide layouts center a bounded modal over a dimmed capability.
- Narrow layouts use a full-width bottom sheet aligned to the viewport edge.
- Header title and close action remain separate from the scrolling body.
- The action is present in wide chrome and in the narrow mobile action menu, and **nowhere else**.
  The reference draws no help control on any other surface in any of its four canvases.
- Short help precedes denser identity/legal information within each section.

## Required departures

| Reference treatment                                      | Planned treatment                                                                                    | Reason                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Four copied overlay bodies and `wireHelp` instances      | One shared frame-owned modal opened by one frame action                                              | Prevents content/state drift and serves every capability                               |
| `APP VERSION 4.2.1 · LIBRARY VERSION 3.8.0.3`            | Separate exact application and bundled-Almanac versions; non-release status/build ID when applicable | Reference values are invented and “library” is ambiguous                               |
| “Imported modules keep their real roll”                  | Completed 100% grades; supported partial imports are completed or the candidate is refused           | Reference contradicts the constitution and feature 002                                 |
| “What can I import?” reference FAQ                       | The seven FR-010 topics only                                                                         | Import behavior is owned by feature 004 and not part of this concise modal requirement |
| Three-line MIT/EDAssets/typeface licence summary         | Exact project-specific Frontier disclaimer plus one warned GitHub `LICENSE` link                     | Reference claims are unsupported; FR-003 limits embedded legal text                    |
| Generic unofficial-fan disclaimer                        | Exact project-specific repository wording, unchanged and labelled original English                   | FR-005/FR-006 require source traceability and verbatim presentation                    |
| `?` with title-only naming                               | The reference's own `HELP & FAQ` wording as the action's visible localised label; `?` supplemental   | Touch and screen-reader understanding cannot depend on tooltip/icon recognition        |
| Fixed `620px`, `82%`/`88%`, literal padding/fonts/colors | Fluid shared dialog/sheet components and feature 011 tokens                                          | Repository design system is authoritative and reflow must work at zoom/translation     |
| Clickable `div` close/actions                            | Shared semantic controls/links with visible names and 44 CSS-pixel targets                           | Required for touch and non-keyboard accessibility semantics                            |
| Backdrop click as an implicit close route                | Visible close action is primary; backdrop behavior is supplemental                                   | Closing cannot depend on precise pointer interaction                                   |
| Hard-coded English framing                               | Localised application text with bundled English fallback                                             | Constitution requires every owned string to be translatable                            |

## Departures withdrawn on 2026-08-25

An earlier revision of this document planned three additions the reference does not draw. Each is
withdrawn, and the specification is amended to match the reference rather than the other way round.

| Planned addition                                           | Status                                                                                      | Reason                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Section order Help → Versions and data → Licence           | Withdrawn; the reference's `ABOUT`/`FAQ`/`LICENCE` order stands, versions inside `ABOUT`    | The reference draws its version line at the top of `ABOUT`; a separate later section is a different screen |
| `ContextHelpLink` on ~20 package-backed and layer surfaces | Withdrawn; the frame's action is the only entry, and no feature 001–011 template is touched | The reference draws these surfaces in full and puts no help control on any of them                         |
| Warned Almanac issue-tracker action                        | Withdrawn with FR-009; the modal has exactly one external action                            | The reference draws no such control, and a defect-report route is support, not help content                |

The one external action that remains — the warned GitHub `LICENSE` link — is not an addition of this
kind. It replaces the reference's three-line licence summary, whose claims the repository cannot
support, and it is the destination the accepted 2026-08-18 clarification chose for the terms the
embedded excerpt does not carry.

## Visual translation into the repository design system

The reference's amber-on-dark hierarchy, compact uppercase section labels, hairline separators,
dimmed backdrop and centered/sheet geometry are expressed only through feature 011 semantic tokens
and shared components. No color, typeface, pixel spacing, border, shadow, animation duration or
external font request is copied from the HTML.

The modal remains deliberately text-forward. Help answers are visible in a single column as in the
reference; versions form a semantic fact group; the longer exact disclaimer wraps as prose. This
keeps the reference's scan pattern without inheriting its low-contrast tiny text, clipped fixed box,
hover dependence or fabricated facts.

## Responsive and accessibility consequence

The desktop modal and mobile sheet are presentations of one DOM/reading order. At tablet/mobile
landscape, 200% text and actual 400% zoom, the sheet may fill the viewport rather than preserve the
mock's proportions. The header/close action stays available, the body alone scrolls, every action has
a visible name, and neither disclaimer nor translated content creates document-level horizontal
overflow.
