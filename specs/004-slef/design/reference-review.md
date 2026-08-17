# Design Reference Review

Reference: `.design/Ship Builder.dc.html` import layers in canvases 1a/1b and import/export layers in
1c/1d.

## Adopt

- Import from ship selection and outfitting, so no active build is required.
- Focused wide dialog and narrow full-width layer with identical content/actions.
- Import explanation, editable monospaced text and adjacent status.
- Export readonly monospaced payload, metadata and clear delivery hierarchy.
- Copy primary, download always available, platform share on capable devices.
- Technical content scrolls within its field rather than widening the page.

## Adapt

- Semantic feature 011 controls/layers/tokens and 44 CSS px targets replace clickable `div`s/literals.
- Semantic diagnostics preserve entry/path/code/constraint/params; draft survives failure.
- Success goes through atomic replacement and then displays normalization/unresolved report.
- Invalid/incomplete builds show warning but remain exportable.
- Only SLEF export is present; Web Share is feature-detected; download stays distinct.
- JSON/paths are direction-isolated and contained for RTL, expanded text and zoom.

## Reject

- Reference `JSON.parse`, event heuristics, shallow checks, zero-module rejection and immediate apply.
- Missing UTF-8 size/exact-cardinality/atomicity boundaries.
- FAQ claim that imported partial rolls remain partial.
- Journal, Markdown and share-link export tabs; feature 001 owns links.
- Invented versions, module counts, producer/build URLs and mock payload values.
- `execCommand`, fake delivery success, swallowed errors and auto-close that removes fallback.
- Cross-origin fonts, hard-coded visuals and hover-only feedback.

```text
Shell/workspace action
└── Import or Export layer
    ├── heading + close
    ├── instruction/validation summary
    ├── labelled multiline field
    ├── status + notices/diagnostics
    └── explicit actions
```
