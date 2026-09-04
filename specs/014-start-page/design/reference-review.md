# Reference Review: `.design/Home.dc.html`

**Feature**: [014-start-page](../spec.md) | **Date**: 2026-09-04

The canvas is one turn, `START PAGE — TOOL SELECTOR`, with two artboards: `1a` at 1440px
("Desktop — merged toolbar, tool selector in the middle") and `1b` at 390px ("Mobile —
stacked selector"). Its closing note reads: _"Top bar carried over from the builders; the
middle is the tool selector."_

The standing rule applies: what the design draws is built, what it does not draw is not, and
where a requirement wants something the design does not draw it is removed from the screen
and the collision is written down here.

## What the canvas draws

### The bar, carried over (both artboards)

The plate from `Tool Navigation.dc.html` turn 4, which this application already builds:
`--panel-4` closed by the 2px amber rule, two decks divided by a 1px `--amber-a12` line, the
insignia standing on the leading edge across both decks with the decks indented past it
(42px at 1440px, 48px at 390px). The upper deck carries the tool tabs at 30px / 34px; the
lower carries `NAV BEACON` and the actions at 40px.

Both tool tabs are drawn inactive (`--ink-48`). Neither takes the `--amber-a14` wash the
current tab takes elsewhere. That is the canvas stating FR-010: at the entry point no tool
is current.

`1a` draws `IMPORT` (outlined, `--amber-a35`) and `OPEN BUILD` (solid `--amber`) in the
lower deck. `1b` folds them into a single `⋯` control. Both are the shell's existing action
row and its existing fold; nothing here is new.

### The middle (both artboards)

- A heading — `TOOLS FOR COMMANDERS` — in Barlow Condensed 700, tracked 0.14em at 1440px and
  0.12em at 390px, in `--ink`.
- A line beneath it — `A growing set of tools for the galaxy.` — Barlow 300 in `--ink-55`.
- The tool entries: a two-column grid with a 20px gap at 1440px, a single column with an
  11px gap at 390px. Each entry is an anchor on `--panel-1` with a 1px `--amber-a18` border,
  hovering to `#151412` with the border at `rgba(255,140,26,0.55)`.

### One tool entry

| Part         | `1a` (1440px)                                        | `1b` (390px)                                             |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| Name         | Barlow Condensed 700 26px, 0.16em, `--amber-3`       | the same at 17px                                         |
| Subject list | JetBrains Mono 400 9px, 0.16em, `--ink-42`           | **not drawn**                                            |
| Description  | Barlow 300 14px/1.6, `--ink-62`, the fuller sentence | Barlow 300 11.5px/1.45, `--ink-55`, the shorter sentence |
| Go mark      | **not drawn**                                        | `→`, JetBrains Mono 600 13px, `--amber-2`                |
| Padding      | 26px 26px 28px, parts stacked with a 14px gap        | 15px, text column and mark in a row with a 13px gap      |

### The foot (both artboards)

A band on `--panel` closed at the top by a 1px `--amber-a12` rule, carrying the Frontier
attribution in Barlow 300 — 10.5px at 1440px, 9px at 390px — in `--ink-32`.

## What is withdrawn, and why

| Drawn                                     | Withdrawn because                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The `CH` chip in the upper deck           | Not built in the shell (Commander confirmation 2026-09-04), and it reads as an account, which constitution I forbids                                                |
| The `⋯` marker after the tool tabs        | Not built in the shell (same confirmation). It stands for tools beyond the two, and a control for a tool that does not exist is what 011/FR-028 rules out           |
| The footer's `Nav Beacon` spelling        | The product is `NavBeacon`. The attribution is a quoted notice, so the manifest's `exactText` ships and the canvas's loose quotation does not (research decision 4) |
| The footer text ending at "in the making" | The notice ends "in the making of it." The canvas truncates; the document is the record                                                                             |
| The `→` go mark at 1440px                 | Not drawn there. It is `1b`'s only affordance marker and stays compact-only                                                                                         |

Nothing is added beside the design. The one thing on screen that the canvas does not draw is
invisible: the accessible name on the region holding the tool entries, which is the
accessibility floor the standing rule exempts.

## Where the two artboards disagree

The subject list is drawn at 1440px and not at 390px, and the description is a different,
shorter sentence at 390px. This was raised as the spec's one open question and ruled on by
the Commander on 2026-09-04: **two texts, chosen by viewport, both artboards built
literally**.

The collision it creates with constitution principle V — content present on one form factor
and absent on another — is recorded in the spec's Clarifications section with its reasoning
and its bounds, and in the plan's Constitution Check as a carried divergence. It binds the
subject list and the two description lengths and nothing else. It is settled; it is not
re-derived here.

What holds it in place is FR-018 and FR-019: the fold is the composition modes the
application already names, neither form may be the sole home of any fact a Commander needs
to choose a tool, and exactly one form is on screen at every viewport the suite covers.
