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
- Keep import exact and atomic. The workspace owns the post-commit outcome so normalization and
  unresolved/incomplete state survive the input layer transition.
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
  to completed quality; unsupported partials refuse atomically under Constitution 5.0.0.
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
│   └── shared replacement confirmation -> commit -> Import Outcome
└── Export Build layer (active build only)
    ├── Share Link mode (feature 001)
    └── SLEF mode (feature 004)
        ├── validation + labelled readonly artifact
        ├── metadata/status
        └── Download + Copy + optional Share
```
