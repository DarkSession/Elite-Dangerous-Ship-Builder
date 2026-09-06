# Design: the bench

How the screen composes, at both widths the canvas draws. Artboard `1a` is 1640px, artboard `1b` is
390px; everything between them is fluid, and neither width is a breakpoint to pin.

## Wide composition (artboard `1a`)

Three columns under the shared shell bar:

```text
┌ shell: mark · tool tabs · loadout name · save · export · saved records ┐
├───────────────┬───────────────────────────────┬───────────────────────┤
│ LOADOUT       │ ITEM VIEW                     │ COMMANDER STATS       │
│  SUIT         │  identity · class · type      │  ARMOUR resistances   │
│  SUIT TOOLS   │  GRADE ladder                 │  SHIELDS strength,    │
│  PrimaryWpn1  │  attributes · DPS · SDPS      │   regen, resistances  │
│  PrimaryWpn2  │  MODIFICATION SLOTS · n / 4   │  FIREPOWER per weapon │
│  SecondaryWpn │  (chooser opens over this)    ├───────────────────────┤
│               │                               │ MATERIAL REQUIREMENTS │
└───────────────┴───────────────────────────────┴───────────────────────┘
```

Selecting a ledger row changes the item view; nothing navigates. The choosers open over the item
view rather than beside it, as the canvas draws, so a narrow column never has to hold two lists.

## Compact composition (artboard `1b`)

The three columns become three tabs — `LOADOUT`, `STATS`, `MATERIALS` — and the item view becomes a
drill-in from a ledger row, with the choosers as sheets over it. Undo and redo are on the bar, as
the canvas draws them. The tab strip is `ednb-tab-group`, which is a size container and must be
given a rem width rather than left to size to its labels.

## What it composes from

The `SUIT TOOLS` rows are a dashed badge and a name, dimmed, under a count — exactly what both
artboards draw, and no stat. They are not selectable: tools are fitted to every suit and cannot be
swapped, so the ledger's selection never lands there and the item view never opens on one. Their
accessible name says the tool is carried and cannot be changed, so the dimming is not the only
thing carrying that meaning.

Reused as they stand:

| Need                             | Component                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| the shell, tabs, actions         | `ui/components/app-frame`                                                                |
| a grade ladder                   | `ui/outfitting/grade-selector`                                                           |
| a slot and a group of slots      | `ui/outfitting/slot-card`, `slot-group`                                                  |
| a chooser list and its search    | `ui/outfitting/candidate-list`, `candidate-search`                                       |
| stock-versus-modified attributes | `ui/outfitting/attribute-comparison`                                                     |
| a material list                  | `ui/outfitting/material-lines`, `material-grade`                                         |
| a refusal                        | `ui/outfitting/edit-refusal-notice`, `ingress-refusal-notice`                            |
| an absent figure                 | `ui/outfitting/unavailable-fact`, `ui/components/unavailable-value`                      |
| package text with its provenance | `ui/components/game-text`                                                                |
| the share link                   | `ui/components/share-link-panel`                                                         |
| the export layer's two regions   | `ui/components/layer/format-layer`                                                       |
| save, conflict, delete           | `ui/components/choice-dialog`, `confirm-dialog`, `field`, `text-field`, `textarea-field` |
| the saved list                   | `ui/components/record-list`, `saved-build-card`                                          |
| tabs, panels, facts, metrics     | `ui/components/tab-group`, `panel`, `fact-list`, `metric-group`                          |

Extended, in the design system and not locally (constitution VII):

- **`saved-build-card` gains a tool identity.** One list holds builds and loadouts, so a row states
  which tool made it and summarises accordingly — a hull for one, a suit for the other.
- **A resistance bar, anchored at its midline.** The canvas draws resistances as signed percentage
  bars in two groups, armour and shields. A bar carries a tick at the centre of its track and fills
  from there at half the track's width: a positive resistance runs to the trailing edge in the good
  colour, a negative one to the leading edge in the danger colour. So a −40% and a +40% are told
  apart by where the bar starts as well as by the sign on the figure. The ship side states
  resistances as table figures and has no bar. This is one new component with its own preview, in
  `ui/`, not a chart drawn inside the bench.
- **`unavailable-fact` covers "this tool does not have this stat".** Only the Energylink
  discharges and overloads and only the Profile Analyser scans and clones, so a tool's stat list is
  short and uneven; an absent stat is stated as absent rather than as a zero, through the component
  that already says that (constitution IV).

Nothing else is added. A need the system cannot meet extends the system.

## Accessibility

- The ledger is a list of controls, each naming its mount in the Commander's language and its state
  — empty, fitted, held — as text rather than by colour or position alone.
- A held mount is announced as unavailable **with its weapon still named**: an unavailable control
  whose content is invisible would lose the very thing FR-007 retains.
- A locked slot is a disabled control with its lock stated in its accessible name, not a greyed
  square.
- Resistance bars carry their signed figure as text beside them; the bar is decoration.
- The choosers are dialogs with focus management inherited from `layer`, and every option is
  reachable by touch at the AA target size.
- Nothing essential depends on hover. The canvas's hover-revealed `CLEAR SLOT` becomes a control in
  the chooser, which is where the compact layout already puts it.

## Motion and theme

One dark theme from the tokens; no colour, size, spacing or duration literal enters a bench
stylesheet. Transitions respect `prefers-reduced-motion`. The region stylesheets are what trip the
`anyComponentStyle` budget first, so each region's SCSS stays close to the ship side's size.
