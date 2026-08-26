# Design Reference Review

Source: `.design/Ship Builder.dc.html`.

- Canvas 1a: wide shipyard Import action `imp-btn` and centered `imp-modal`.
- Canvas 1b: narrow shipyard Import action `simp-btn` and bottom sheet `simp-modal`.
- Canvas 1c: active-workspace Export action `exp-btn` and centered `exp-modal`.
- Canvas 1d: mobile menu Import/Export actions plus `mimp-modal`/`mexp-modal` bottom sheets.

The source is a visual/interaction reference, not executable behavior or authoritative game data.

## Adopt

- Import is reachable from ship selection without an active build.
- Focused layer hierarchy: explicit heading/close, brief explanation, multiline monospaced payload,
  adjacent status and clear primary/secondary actions.
- Wide centered dialog and ordinary narrow bottom sheet as responsive starting patterns.
- Export payload is readonly/selectable with nearby metadata; Copy is primary.
- Mobile workspace menu gives Import/Export discoverable entry.
- Technical content stays within its field rather than widening the document.

## Adapt

- Use one shared import layer on ship-selection/build/library hosts and one shared Export Build layer
  on the active workspace; no feature-local duplicate implementations.
- Preserve the integrated export modes but keep only feature 001 Share Link and feature 004 SLEF.
  Journal/Markdown are outside accepted scope.
- Treat canvas dimensions as examples. Fluid max sizing chooses dialog, sheet or constrained
  full-height layer from available content/space; tablet, landscape, expansion, RTL and zoom keep all
  actions reachable.
- Add visible labels/instructions, exact UTF-8 usage/limit, over-limit, inspecting, cardinality,
  semantic diagnostics, candidate/replacement and normalization-refusal states to import.
- Keep import exact and atomic. The workspace owns what happens after the commit: feature 002's
  quality-completion notice and feature 003's build-status rail survive the input layer transition,
  and feature 004 adds no report beside them (see [import-outcome.md](./import-outcome.md)).
- Add true package validation/incomplete warnings, exact-revision artifact/link behavior and real
  localized metadata to SLEF export.
- Desktop Download and mobile Share File are not equivalent reference actions: Download is always
  present, Copy remains, and Share is added only by capability. Share never replaces Download.
- Download reports dispatch/setup rather than an unverifiable saved result. Clipboard/Web Share may
  report their observable promise outcome; all failures keep the artifact and alternatives.
- Replace clickable `div`, hover/title-only cues, fixed literals and raw color state with feature 011
  semantic controls, tokens, visible/matching names, associated state and textual equivalents.
- All app text/counts use feature 011 localization/formatters. Package diagnostic/name text uses the
  package locale/canonical disclosure. JSON/paths/codes are direction-isolated.

## Reject

- Mock `JSON.parse`, trim/shape heuristics, URL recognition, zero-module rejection and immediate
  application in `wireImport`.
- Selecting index zero from multi-entry input, missing UTF-8/cardinality gates and timed auto-close.
- `document.execCommand('copy')`, swallowed errors, unconditional “copied”, fake “saved” download and
  fabricated share behavior in `wireExport`.
- Fabricated app/library versions, module counts, build links and sample game values.
- The FAQ claim that imported partial rolls remain partial. Supported partials are package-normalized
  to completed quality; unsupported partials refuse atomically under the constitution.
- Journal Loadout, Markdown and invented share-link export payloads; feature 001 owns canonical link.
- Cross-origin Google fonts/runtime assets, hard-coded visual values, fixed canvas widths, hover-only
  meaning and color-only status.

## Resulting hierarchy

```text
Shared host action
├── Import Build layer
│   ├── exact labelled draft + byte state
│   ├── status + package diagnostic/candidate content
│   ├── explicit actions
│   └── shared replacement confirmation -> commit -> workspace (002 notice, 003 rail)
└── Export Build layer (active build only)
    ├── Share Link mode (feature 001)
    └── SLEF mode (feature 004)
        ├── validation + labelled readonly artifact
        ├── metadata/status
        └── Download + Copy + optional Share
```

## What was built, against what was drawn

Written after the implementation, so the record is what happened rather than what was intended.

### Adopted, as drawn

- **One exchange layer per direction**, opened from the command bar and adding no route and no
  history entry. The import layer is a 560px dialog on the desktop canvas and a bottom sheet on the
  compact ones; the export layer is a wider dialog with the format list down its leading edge, one
  amber hairline dividing it from the payload and running the full height of the panel. Both are the
  shared `edsb-layer`, whose `adaptive` presentation resolves the same three shapes in CSS, and whose
  width step and flush body are what let a two-region layer be wider than a one-region one and rule
  itself edge to edge.
- **The import layer's own composition**: description, one monospaced editable field, one status line
  that never says two things at once, and a ruled footer with what is accepted on one side and the
  actions on the other.
- **The export layer's own composition**: format list, readonly monospaced payload, one metadata line
  (`SLEF v1 · n modules · size`), and the actions on the same row.
- **The format list as the plates it is drawn as** — a tracked condensed title over a Barlow
  description, the chosen one washed amber — and, where the width will not hold two regions, as
  canvas 1d's scrolling chip strip above the payload. Both are the shared choice group's `cards`
  arrangement, so both are the same native radios and selection is the control's own checked state
  rather than a colour.
- **Download and Copy together**, with Copy emphasised, exactly as `exp-dl`/`exp-copy` are drawn.

### Adapted, with the reason

- **Two formats, not four.** `JOURNAL LOADOUT` and `MARKDOWN TABLE` are drawn and are not
  capabilities this application has. A control for a format that cannot be produced is worse than no
  control; the bundle is checked for their labels so neither can return by accident.
- **Share is added by capability, never in place of Download.** The compact canvas draws `SHARE FILE`
  where the desktop draws `DOWNLOAD`. Treating them as the same control would take the always-working
  action away from exactly the platforms most likely to need it.
- **The package's verdict and the link's absence are said in the layer.** The canvas draws neither. An
  export that silently omits a link, or that hands over an invalid build without saying so, would be
  the "fake delivery feedback" this review already rejected. Both are ordinary status lines in the
  drawn content column — not new regions beside it.
- **A stale payload says why it went away.** The canvas has no state for a build edited after its
  export was made. An empty field with no explanation reads as broken.
- **The one status line carries every import state.** The canvas draws `AWAITING INPUT`; the same line
  says the byte count, the inspection, and how a cancelled or superseded attempt ended.
- **The refusal is said once, by the field.** `edsb-textarea-field` renders it and associates it, so a
  reader who lands on the payload hears why it was refused. A second copy beside it was written,
  measured against the canvas, and removed.
- **Import lives in the shell, not in four screens.** The canvas draws `IMPORT` in the command bar of
  the shipyard; the same action is published once by the shell so every screen offers it identically.

### Rejected, and why

- **The Clear control.** Not drawn. The canvas's footer is `CANCEL` and `LOAD BUILD`; a third control
  that empties a field the Commander can select and delete is a control for nothing.
- **The candidate summary panel.** Not drawn. When confirmation is unnecessary feature 001 commits
  immediately, and when it is necessary feature 001's own confirmation names the incoming hull. A
  summary in the layer would say the same thing twice.
- **The import outcome surface.** Not drawn, and both facts it would carry — completed partial rolls,
  and the package's verdict — are already drawn by feature 002's completion notice and feature 003's
  build-status rail. See [import-outcome.md](./import-outcome.md), "Divergence".
- **The export-unavailable panel.** Not drawn. With no active build the Export action is not
  published, which is the honest state; the workspace's own empty state already says what to do and
  the shell's Import action is one control away.
- **Fixed pixel widths, the mock parser, immediate mutation and the fabricated metadata** — all as
  recorded above, none of them present in the delivered surfaces.

### Corrected afterwards

Written when the gap was found, so the record says what was wrong rather than only what was intended.

- **The format list was not drawn as a list of plates.** The three entries above described the
  arrangement this review accepted; what shipped was the choice group's default stacked radios inside
  a layer of the ordinary width, with a gap where the rule belongs and the group's question drawn
  above a list the canvas draws no question above. The canvas 1d chip strip was not built at all: the
  compact layer stacked the same radios.

  A design system whose components are perfectly tokenised can still compose them into an arrangement
  the reference does not draw, which is the failure `e2e/design-reference.spec.ts` exists to catch and
  did not catch here, because no assertion in it reached a layer that needs a build to open. The
  export layer now has that block of its own in `e2e/slef-export.spec.ts`, measured against
  `specs/011-interface-foundations/design/canvas-extraction.md`, "Choice cards".

- **Two things the canvas draws are still deliberately not drawn**, and are recorded here so the next
  reading does not take them for the same oversight: the payload's visible field label, which this
  review's "Adapt" list added on purpose, and the order of the two formats, which the resulting
  hierarchy above puts Share Link first — the canvas's order is SLEF, Journal, Markdown, Share Link,
  and removing the two formats that cannot be produced would leave the drawn order meaning something
  it was never drawn to mean.
