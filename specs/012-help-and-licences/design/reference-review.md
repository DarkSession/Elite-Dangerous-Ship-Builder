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
  `APP VERSION … · LIBRARY VERSION …` line — above the questions, not in a section after them — and
  under the reference's own two terms.
- Wide layouts center a bounded modal over a dimmed capability.
- Narrow layouts use a full-width sheet aligned to the viewport's leading edge.
- Header title and close action remain separate from the scrolling body.
- The action is present in wide chrome and in the narrow mobile action menu, and **nowhere else**.
  The reference draws no help control on any other surface in any of its four canvases.
- It is drawn as the reference draws it at each width: the `?` on the wide command bar, the words in
  the narrow action menu.
- Short help precedes denser identity/legal information within each section.
- `FAQ` is question-then-answer pairs in one reading sequence, a question closer to its own answer
  than the pairs are to each other. Three of its four questions are asked in the reference's own
  words.
- `LICENCE` opens with a summary of what covers what, one line each, before the notice: the
  application's code, the bundled Almanac's own terms, the icon files this application ships, the
  game data and imagery, and the typefaces. The reference draws all five
  (`contracts/help-navigation.md`, amended 2026-08-26).
- The modal draws no control other than its close. What leaves the application is three sets of
  linked words inside its own sentences, which is not a control
  (`contracts/help-navigation.md`, "External navigation").

## Required departures

| Reference treatment                                                                          | Planned treatment                                                                               | Reason                                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four copied overlay bodies and `wireHelp` instances                                          | One shared frame-owned modal opened by one frame action                                         | Prevents content/state drift and serves every capability                                                                                                        |
| `APP VERSION 4.2.1 · LIBRARY VERSION 3.8.0.3`                                                | Two separate labelled facts, `App version` and `Library version`, read off the build            | Only the reference's invented values are a departure; its two terms are adopted (see 2026-08-26)                                                                |
| “Imported modules keep their real roll”                                                      | Completed 100% grades; supported partial imports are completed or the candidate is refused      | Reference contradicts the constitution and feature 002                                                                                                          |
| “What can I import?” reference FAQ                                                           | The FR-010 topics only                                                                          | Import behavior is owned by feature 004 and not part of this concise modal requirement                                                                          |
| `SHIP LINE ART & MATERIAL ICONS · EDASSETS.ORG, CC BY-NC-SA 4.0` — the summary's second line | Same line, naming Frontier's media-usage rules for the game data and imagery                    | Neither half is supportable: ship art reaches this application from the Almanac under Frontier's rules, and no CC BY-NC-SA grant for the icons is recorded here |
| Generic unofficial-fan disclaimer                                                            | Exact project-specific repository wording, unchanged and marked in its own language             | FR-005/FR-006 require source traceability and verbatim presentation                                                                                             |
| `?` with title-only naming                                                                   | The reference's own `?` on the wide bar, carrying its localised name as text inside the control | Only the title-only naming is a departure; the mark itself is adopted (see 2026-08-26)                                                                          |
| Fixed `620px`, `82%`/`88%`, literal padding/fonts/colors                                     | Fluid shared dialog/sheet components and feature 011 tokens                                     | Repository design system is authoritative and reflow must work at zoom/translation                                                                              |
| Clickable `div` close/actions                                                                | Shared semantic controls/links with visible names and 44 CSS-pixel targets                      | Required for touch and non-keyboard accessibility semantics                                                                                                     |
| Backdrop click as an implicit close route                                                    | Visible close action is primary; backdrop behavior is supplemental                              | Closing cannot depend on precise pointer interaction                                                                                                            |
| Hard-coded English framing                                                                   | Localised application text with bundled English fallback                                        | Constitution requires every owned string to be translatable                                                                                                     |

## Departures withdrawn on 2026-08-25

An earlier revision of this document planned three additions the reference does not draw. Each is
withdrawn, and the specification is amended to match the reference rather than the other way round.

| Planned addition                                           | Status                                                                                      | Reason                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Section order Help → Versions and data → Licence           | Withdrawn; the reference's `ABOUT`/`FAQ`/`LICENCE` order stands, versions inside `ABOUT`    | The reference draws its version line at the top of `ABOUT`; a separate later section is a different screen |
| `ContextHelpLink` on ~20 package-backed and layer surfaces | Withdrawn; the frame's action is the only entry, and no feature 001–011 template is touched | The reference draws these surfaces in full and puts no help control on any of them                         |
| Warned Almanac issue-tracker action                        | Withdrawn with FR-009; and the second pass below left the modal with none at all            | The reference draws no such control, and a defect-report route is support, not help content                |

## Departures withdrawn on 2026-08-25, second pass

The pass above kept five additions the reference draws nowhere, on the grounds that each was
justified by a requirement. That reasoning had it backwards: where this feature's specification and
the reference disagreed, the reference was the thing to change the specification against, and the
requirements are amended accordingly. Each row below is a thing a Commander could read on screen
that no canvas of the reference draws.

| Withdrawn addition                                         | What it is replaced by                                                                     | Requirement amended |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------- |
| Two provenance sentences after the `ABOUT` version facts   | The licence summary's library and Frontier lines, which name what each covers              | FR-008              |
| A third identity fact carrying release state and build ID  | Two version facts, as the reference draws. Generator classification is untouched           | FR-007              |
| Prose licence framing above the excerpt                    | The five-line summary of what covers what                                                  | FR-003              |
| Two sentences naming the excerpt's source and its language | The excerpt's `lang`, which is the same fact as a property rather than as prose            | FR-006              |
| The warned repository-`LICENSE` action                     | Linked words inside the summary line that names its terms; `WarnedExternalLink` is deleted | FR-003, FR-005      |

Two things did **not** change with them. The exact Frontier media-usage notice stays embedded and
verbatim — it is the compliance artifact root `LICENSE` records the Almanac redistributing under,
and the reference's paraphrased fan-tool sentence is not a substitute for it. And the audited
repository-`LICENSE` URL is still resolved and validated by the generator, because a wrong address
for the terms the source distribution carries is still a release failure. The link back to it
returned on 2026-08-26, inside the summary line that names its terms
(`contracts/help-navigation.md`, "External navigation").

**A consequence to keep in view.** Feature 002's voice ruling of 2026-08-22 stopped ~30
Commander-facing strings naming the Almanac, on the grounds that the credit belonged to this
feature, once per application. It has moved three times since: to the `almanacOwnership` topic on
2026-08-25, to an `ABOUT` provenance sentence on 2026-08-27 when that topic was withdrawn, and to
the licence summary's library line on 2026-08-28 when the owner withdrew that sentence. That line is
where it lives, and the voice ruling is amended to name it. The warning stands for whoever edits
that line next — around thirty strings elsewhere say nothing about the Almanac because this one
does.

## Visual translation into the repository design system

The reference's amber-on-dark hierarchy, compact uppercase section labels, hairline separators,
dimmed backdrop and centered/sheet geometry are expressed only through feature 011 semantic tokens
and shared components. No color, typeface, pixel spacing, border, shadow, animation duration or
external font request is copied from the HTML.

The modal remains deliberately text-forward. Help answers are visible in a single column as in the
reference, each question a heading over its own answer; versions form a semantic fact group; the
licence summary is a list, because it is four separate claims about four separate things; the
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

## Two departures withdrawn on 2026-08-26

Both were places where this feature had improved on the reference and lost something in the trade.
Neither is a new reading of the canvases — the canvases were always drawn this way — so each is
recorded here as the reference winning an argument it had already made.

| Withdrawn departure                                                  | What the reference draws, and now ships                                              | Requirement or contract amended                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| `HELP & FAQ` as the wide bar's visible label, with `?` as decoration | The `?` alone on the wide bar; the action's localised name carried inside it as text | `contracts/help-navigation.md`, entry surfaces |
| `Bundled Almanac version` as the second identity term                | `Library version`, the reference's own term                                          | `contracts/help-navigation.md`, identity       |

**What the first one does not give up.** The earlier rule existed because an icon without words is a
guess. The mark that ships is not one: it is a single typographic character, it is hidden from the
accessibility tree, and the control carries `Help` as text beside it, so the accessible name is a
word at both widths and voice control has a name to act on. The narrow action menu still spells the
entry out — a list of rows is read rather than scanned, which is exactly what the canvas does there
too. What is genuinely traded away is the sighted-and-not-already-fluent reader on a wide screen, who
now meets a `?` where they used to meet two words. The canvas's judgement is that `?` is the one
symbol that convention has made legible without instruction, and this feature takes it.

**What the second one does not give up.** The Almanac is still credited once per application: the
licence summary's library line names the bundled library's own terms and links them, and the same
summary names Frontier for the game data and imagery. The version label was never where that credit
lived — it names the library the build was compiled against, which is what someone comparing two
builds is reading it for. Feature 002's ruling of 2026-08-22 stands, amended on 2026-08-28 to name
that line as where the credit is made.

## A defect the wide bar's mark exposed, 2026-08-26

Shortening the action's words from `HELP & FAQ` to `Help` turned a passing assertion red, and the
assertion was right. At 200% text on a 390-pixel phone the folded action layer's panel was drawn
partly off the leading edge of the viewport, so its entries — FR-001's only route to help among them
— could not be pressed. Two separate causes, both now fixed in feature 011's own component and both
about the panel rather than about help:

1. `min-inline-size: var(--edsb-layout-menu-min)` is `12.25rem`, which at a doubled text size is 392
   pixels on a 390-pixel screen. A minimum wins over a maximum in CSS, so the panel's own viewport
   bound was silently overridden and the panel came out wider than the screen. The minimum is now
   bounded by the same expression the maximum uses.
2. The compact banner wraps, and a wrapped action-layer trigger sat at the leading edge of its own
   row. The panel hangs off the trigger's trailing edge, so it was dragged off-screen with it. The
   trigger is now held to the trailing edge of whatever row it lands on, which is also where canvas
   1d draws it.

The test only passed before because `HELP & FAQ` was wide enough to poke back into the viewport by
about 53 pixels. That is the same class of defect T055 found and the same component, so it is
recorded the same way rather than fixed quietly.

## One departure accepted on 2026-08-26: the licence links

The reference's licence block summarises documents whose contents it never has to stand behind — its
own values are invented, and a mock owes nothing to a reader. This one summarises real terms, and a
summary of real terms that offers no way to read them is a claim a Commander has to take on trust.

So the summary's first two lines link the documents they are about: this repository's `LICENSE` and
the bundled library's. The 2026-08-25 pass had withdrawn the first of these on the grounds that the
reference draws no navigation in the modal. That was the right observation and the wrong conclusion:
what the reference draws no _control_ for is not the same as what it forbids, and the shape that
comes back is not the shape that was withdrawn. A warned action in its own row is a control. A few
underlined words inside a sentence are the sentence.

| Reference treatment                      | Shipped treatment                                                                           | Reason                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three summary lines, none of them linked | Four lines; the two whose terms this repository can point at link them from inside the line | A summary of real terms has to be checkable, and the library's terms are a separate claim from Frontier's                                                                       |
| No `LIBRARY` line at all                 | `Library · Elite Dangerous Almanac, MIT licence, full detail on GitHub`                     | MIT over a package's code and Frontier's media-usage rules over game data are not one claim; the line names the package, which is where the once-per-application credit is made |

Three things did not come back with them. `WarnedExternalLink` stays deleted — a component whose
whole purpose was to be a warned action is not what an inline link is. FR-009's package-defect
destination stays withdrawn: reporting a defect is a support route, and these two are licence
documents. And no address is drawn as text anywhere in the modal — what a Commander reads is which
document a link is, never where it is.
