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
- `FAQ` is question-then-answer pairs in one reading sequence, a question closer to its own answer
  than the pairs are to each other. Three of its four questions are asked in the reference's own
  words.
- `LICENCE` opens with the reference's own three-line summary of what covers what — the
  application's code, the game data and imagery, the typefaces — one line each, before the notice.
- The modal draws no control other than its close: no link, and nothing that leaves the application.

## Required departures

| Reference treatment                                                                          | Planned treatment                                                                                  | Reason                                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four copied overlay bodies and `wireHelp` instances                                          | One shared frame-owned modal opened by one frame action                                            | Prevents content/state drift and serves every capability                                                                                                        |
| `APP VERSION 4.2.1 · LIBRARY VERSION 3.8.0.3`                                                | Separate exact application and bundled-Almanac versions, read off the build                        | Reference values are invented and “library” is ambiguous                                                                                                        |
| “Imported modules keep their real roll”                                                      | Completed 100% grades; supported partial imports are completed or the candidate is refused         | Reference contradicts the constitution and feature 002                                                                                                          |
| “What can I import?” reference FAQ                                                           | The seven FR-010 topics only                                                                       | Import behavior is owned by feature 004 and not part of this concise modal requirement                                                                          |
| `SHIP LINE ART & MATERIAL ICONS · EDASSETS.ORG, CC BY-NC-SA 4.0` — the summary's second line | Same line, naming Frontier's media-usage rules for the game data and imagery                       | Neither half is supportable: ship art reaches this application from the Almanac under Frontier's rules, and no CC BY-NC-SA grant for the icons is recorded here |
| Generic unofficial-fan disclaimer                                                            | Exact project-specific repository wording, unchanged and marked in its own language                | FR-005/FR-006 require source traceability and verbatim presentation                                                                                             |
| `?` with title-only naming                                                                   | The reference's own `HELP & FAQ` wording as the action's visible localised label; `?` supplemental | Touch and screen-reader understanding cannot depend on tooltip/icon recognition                                                                                 |
| Fixed `620px`, `82%`/`88%`, literal padding/fonts/colors                                     | Fluid shared dialog/sheet components and feature 011 tokens                                        | Repository design system is authoritative and reflow must work at zoom/translation                                                                              |
| Clickable `div` close/actions                                                                | Shared semantic controls/links with visible names and 44 CSS-pixel targets                         | Required for touch and non-keyboard accessibility semantics                                                                                                     |
| Backdrop click as an implicit close route                                                    | Visible close action is primary; backdrop behavior is supplemental                                 | Closing cannot depend on precise pointer interaction                                                                                                            |
| Hard-coded English framing                                                                   | Localised application text with bundled English fallback                                           | Constitution requires every owned string to be translatable                                                                                                     |

## Departures withdrawn on 2026-08-25

An earlier revision of this document planned three additions the reference does not draw. Each is
withdrawn, and the specification is amended to match the reference rather than the other way round.

| Planned addition                                           | Status                                                                                      | Reason                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Section order Help → Versions and data → Licence           | Withdrawn; the reference's `ABOUT`/`FAQ`/`LICENCE` order stands, versions inside `ABOUT`    | The reference draws its version line at the top of `ABOUT`; a separate later section is a different screen |
| `ContextHelpLink` on ~20 package-backed and layer surfaces | Withdrawn; the frame's action is the only entry, and no feature 001–011 template is touched | The reference draws these surfaces in full and puts no help control on any of them                         |
| Warned Almanac issue-tracker action                        | Withdrawn with FR-009; the modal has exactly one external action                            | The reference draws no such control, and a defect-report route is support, not help content                |

## Departures withdrawn on 2026-08-25, second pass

The pass above kept five additions the reference draws nowhere, on the grounds that each was
justified by a requirement. That reasoning had it backwards: where this feature's specification and
the reference disagreed, the reference was the thing to change the specification against, and the
requirements are amended accordingly. Each row below is a thing a Commander could read on screen
that no canvas of the reference draws.

| Withdrawn addition                                         | What it is replaced by                                                                     | Requirement amended |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------- |
| Two provenance sentences after the `ABOUT` version facts   | The `almanacOwnership` topic, and the licence summary's Frontier line                      | FR-008              |
| A third identity fact carrying release state and build ID  | Two version facts, as the reference draws. Generator classification is untouched           | FR-007              |
| Prose licence framing above the excerpt                    | The reference's own three-line summary of what covers what                                 | FR-003              |
| Two sentences naming the excerpt's source and its language | The excerpt's `lang`, which is the same fact as a property rather than as prose            | FR-006              |
| The warned repository-`LICENSE` action                     | Nothing. The modal has no external navigation, and `WarnedExternalLink` is deleted with it | FR-003, FR-005      |

Two things did **not** change with them. The exact Frontier media-usage notice stays embedded and
verbatim — it is the compliance artifact root `LICENSE` records the Almanac redistributing under,
and the reference's paraphrased fan-tool sentence is not a substitute for it. And the audited
repository-`LICENSE` URL is still resolved and validated by the generator, because a wrong address
for the terms the source distribution carries is still a release failure; it is simply no longer
rendered.

**A consequence to keep in view.** Feature 002's voice ruling of 2026-08-22 stopped ~30
Commander-facing strings naming the Almanac, on the grounds that the credit belonged to this
feature's provenance statement, once per application. That statement is now withdrawn. The credit
did not go with it — the `almanacOwnership` topic says the bundled Almanac supplies the catalogue,
the checks and the calculations, and that this application neither maintains nor corrects those game
values — but it now lives in a FAQ answer rather than in `ABOUT`. That satisfies the ruling; a later
pass that removed or reworded that topic would not, and should read this paragraph first.

## Visual translation into the repository design system

The reference's amber-on-dark hierarchy, compact uppercase section labels, hairline separators,
dimmed backdrop and centered/sheet geometry are expressed only through feature 011 semantic tokens
and shared components. No color, typeface, pixel spacing, border, shadow, animation duration or
external font request is copied from the HTML.

The modal remains deliberately text-forward. Help answers are visible in a single column as in the
reference, each question a heading over its own answer; versions form a semantic fact group; the
licence summary is a list, because it is three separate claims about three separate things; the
longer exact disclaimer wraps as prose. This keeps the reference's scan pattern without inheriting
its low-contrast tiny text, clipped fixed box, hover dependence or fabricated facts.

The reference's rhythm inside `FAQ` is kept as a relationship rather than as a measurement: a
question sits closer to its own answer than the pairs sit to each other, so a pair reads as one unit.
The reference does that with 4 pixels against 11; this does it with the tight and default stack
tokens.

## Responsive and accessibility consequence

The desktop modal and mobile sheet are presentations of one DOM/reading order. At tablet/mobile
landscape, 200% text and actual 400% zoom, the sheet may fill the viewport rather than preserve the
mock's proportions. The header/close action stays available, the body alone scrolls, every action has
a visible name, and neither disclaimer nor translated content creates document-level horizontal
overflow.
