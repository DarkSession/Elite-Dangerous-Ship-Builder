# Design Reference Review: Interface Foundations

## Source and canvas inventory

The rendered source is `.design/Ship Builder.dc.html`:

| Canvas | Reference content                                                                | Foundation evidence                                                                                     |
| ------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1a     | 1320px Shipyard manifest, hull inspector, saved builds, import and help dialogs  | Wide frame/action group, search/filter/sort, selectable table, detail rail, modal layers                |
| 1b     | 390×844 Shipyard cards, full-screen hull/saved-build flows and sheets            | Compact title/actions, card collection, sort strip, drill-in, sheet/full-height adaptation              |
| 1c     | 2020px Outfitting ledger, anatomy/work area, status rail, fitting/editor/dialogs | Three-region workspace, tabs, metrics/status, visual-to-ledger correlation, contextual action hierarchy |
| 1d     | 390×844 Outfitting modes, ledger, module/engineer drill-ins and action sheets    | Compact overflow, mode/category tabs, sticky actions, full-screen editors, sheets                       |

The canvases define product appearance and hierarchy. Shipyard and Outfitting remain routes/screens
owned by their capability features; feature 011 owns the system those screens compose.

## Adopted visual and composition decisions

- One near-black dark theme with warm amber as restrained emphasis, not a general meaning channel.
- Condensed uppercase headings, readable body text and monospaced numeric/technical data.
- Strong section labels set in tracked condensed or monospace, hairline dividers, square geometry —
  the canvases carry no `border-radius` on any product surface — and elevation reserved for overlays.
- Wide master-detail and multi-region composition that becomes a complete stacked/drill-in compact
  experience.
- Persistent contextual identity at the start of a frame and visible primary actions at the end.
- Search/filter/sort toolbars, semantic collections, grouped metrics/statuses, tabs, dialogs, sheets
  and full-height layers as shared patterns.
- Anatomy/diagram visuals as a correlated view of the same textual ledger, never a replacement for
  it.

## Required departures

| Prototype evidence                                                         | Production treatment                                                                                         | Requirement/constraint     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| Fixed 1320/2020/390 canvases; no tablet/landscape/zoom                     | Content-driven wide/medium/compact layouts plus synthesized tablet and short-landscape rules                 | FR-011, FR-014             |
| Hundreds of inline color/type/spacing/border/motion values                 | One primitive source and one contrast-audited semantic dark token set                                        | FR-001–003                 |
| Small muted alpha text and meaningful faint borders below AA pairs         | Documented token pair contrast; enlarge/reweight/recolor without losing hierarchy                            | FR-012                     |
| Google Fonts preconnect/stylesheet and remote `edassets.org` material SVGs | Same-origin licensed font subsets and package/local assets; text/unavailable state when an asset is absent   | Constitution I, FR-019     |
| 268 clickable `div`s, no buttons/labels and almost no role/ARIA state      | Native/shared controls, visible/matching names, associated labels/errors and correct state                   | FR-006–009                 |
| Hover/title-only tips and auto-clearing feedback                           | Persistent text or explicit touch/pointer disclosure; visible feedback plus bounded live events              | FR-006, FR-009–010         |
| 14–40px interactive nodes/actions                                          | 44 CSS-pixel design target/hit area while preserving compact visible geometry                                | FR-012                     |
| Amber/green/red, border position, bars and node shapes as sole status      | Visible/programmatically associated state, value, unit, condition and equivalent data                        | FR-007, FR-010             |
| Hard-coded English, `en-US` formatting and no root language/direction      | Message facade, named active-locale formatters, `lang`/`dir`, logical CSS and bidi isolation                 | FR-014, FR-016–020         |
| Mobile omissions and unnamed action/help controls                          | Every action remains available; the mark is drawn and the name is carried as text inside the control         | FR-006–007, FR-011         |
| No loading previews and incomplete error/disabled coverage                 | Manifested populated/default, empty, loading, error and disabled states plus relevant unavailable/incomplete | FR-004, FR-024             |
| Mock game facts, share URLs and behaviors                                  | Capability specs and Almanac package data/contracts remain authoritative                                     | Constitution II, IV and IX |

## Specific prototype conflicts

- The help copy says imported partial engineering rolls are retained. Constitution principle IV
  requires resolved partial quality to be completed through the package or the import refused. The
  sentence is not accepted application text.
- Material grade icons are requested from another origin. Runtime cannot make those requests; a
  released package/same-origin licensed asset may supplement a localized grade label, otherwise the
  label alone carries the meaning.
- The canvas once included journal and Markdown export modes, and still includes a mock share URL.
  Those are feature 004/001 decisions and do not expand this foundation's scope; the two export modes
  have since been taken out of the canvas by feature 004, which owns them.
- The compact design has no language control, and neither does the product: the browser language
  setting is the only input, so the omission is the decision rather than a gap to fill.

## Ruling: the mark and the name (2026-08-26)

An earlier reading of this feature replaced the canvas's `⋮` with a visibly named `MENU` control
and its `?` with a spelled-out Help button, on the grounds that a glyph is a guess and has no
accessible name. The first half of that is right; the second half was a mistake about how the glyph
had to be drawn.

The name and the drawing are separable. A control can render one conventional typographic mark and
still carry its localized name as text inside itself, hidden from the eye and not from a reader —
which is what `ActionButton.symbol` already does for `?` and what the folded bar's trigger now does
for `⋮`. The accessible name is unchanged, the target keeps its 44-pixel baseline, and nothing
is an image, a font icon or a shape whose meaning has to be learned. What is not permitted is the
thing the departure was actually aimed at: a control with no text name at all.

So the canvas's drawing stands and the accessibility floor stands with it. Three consequences:

- The folded bar's trigger is the `⋮` mark on its own outlined square. `MENU` is drawn on no
  artboard, and a bar already carrying a build's name has no room for it.
- The opened layer is a flat panel of full-width rows ruled apart at the canvas's group boundaries,
  not a stack of chips. A row is still a button with a name, a role and a state.
- The insignia is the way home, and the wide bar's `SHIPYARD` chip is not drawn a second time beside
  it. Same rule: the mark is hidden, the link is named by the screen it reaches.

The general form, for the next control that meets this: **a mark may replace a word on screen; it may
never replace the word in the accessibility tree.**

## Acceptance rule

Implemented screens must remain recognizably consistent with the canvases' dark amber hierarchy,
typography roles, density and wide-to-compact composition. Pixel similarity cannot override the
specification, constitution, Almanac, locale state or accessibility contracts. Conversely,
accessibility work is not permission to replace the supplied visual direction with an unrelated
generic component library.

## Extraction outcome (implementation)

The canvas was measured rather than paraphrased. [canvas-extraction.md](./canvas-extraction.md)
records every value read out of `.design/Ship Builder.dc.html`; `src/styles/tokens/_primitives.scss`
is that measurement expressed as scales, and `_semantic.scss` is the canvas's _use_ of them expressed
as roles.

| Family    | What the canvas ships                                          | What the token layer holds                                                                                        |
| --------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Colour    | 55 `:root` properties — the only design system in the file     | All 55, verbatim, plus five values the canvas leaves as literals (rail ground, scrim ×2, shadow, hull-art filter) |
| Type      | Three families with one job each; a 7.5–22 px ramp             | The same three roles; the same ramp lifted uniformly by ~1.25× to an 11 px floor                                  |
| Tracking  | Eleven letter-spacing steps, 0.04em–0.26em                     | The same eleven, at the same values                                                                               |
| Spacing   | 78 padding, 18 gap and 15 letter-spacing literals              | Twelve named steps covering every recurring value, including the 1px gap that draws grid rules                    |
| Geometry  | No `border-radius` on any product surface; 1px, 2px, 3px rules | One radius step (`0`); three border widths, named for the jobs they do                                            |
| Elevation | One shadow, `0 24px 60px rgba(0,0,0,.6)`, on every overlay     | One overlay token, plus the inset rule the canvas draws under a current tab                                       |

The recurring chrome — command bar, panel dialog, the five button variants, the segmented choice,
the manifest row and its marker, the ruled metric grid, the section rule, the field surface and the
hull-artwork plate — is named once as mixins in `src/styles/_responsive.scss` and composed by the
components rather than restated per component.

### The one deliberate transform

The type ramp is lifted; nothing else is. Canvas 1b is a 390 × 844 viewport with 44 px inputs and
46 px rows, so its 7.5–9.5 px monospace micro-labels are the design's literal intent rather than a
thumbnail artefact. Lifting the whole ramp by a single factor keeps every ratio between rungs — the
ratios are the hierarchy — while putting the smallest rung at 11 px.

### What the canvas keeps that this feature previously discarded

The first implementation of this feature took the palette and authored generic scales for everything
else. That lost the reference's identity, which lives almost entirely in the non-colour decisions:
the condensed uppercase tracking ladder, the monospace numeric channel, the square geometry, the
amber rule closing the command bar and the amber marker opening a selected row. Those are now
extracted rather than approximated.
