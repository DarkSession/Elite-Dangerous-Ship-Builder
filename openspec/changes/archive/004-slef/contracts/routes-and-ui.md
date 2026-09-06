# Routes and UI Contract

Feature 004 adds no route. Its logical layers compose into feature 001 hosts; opening, closing,
failure and cancellation do not alter route/history. Accepted import from a non-workspace host
navigates to `/outfitting` only after feature 001 commits the candidate.

| Host                    | Import                                                             | Export/SLEF                                                                       |
| ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `/ships`                | Shared shell action; no active build required                      | No Export action; enter the active `/outfitting` workspace first                  |
| `/ships/:hull`          | Same shell action; selected hull does not constrain incoming hull  | No Export action; enter the active `/outfitting` workspace first                  |
| `/outfitting`, no build | Primary recovery action                                            | Host explains prerequisite and offers Import/Create; no layer/artifact            |
| `/outfitting`, active   | Available; shared replacement rule                                 | Shared Export Build layer, SLEF mode available                                    |
| library layer           | Shared shell action; accepted candidate navigates to `/outfitting` | No selected-row export; open a record as the active `/outfitting` workspace first |

The shared Export Build layer composes feature 001's Share Link mode and feature 004's SLEF mode with
an accessible mode control, in that order and opening on SLEF. Journal and Markdown modes are
offered by neither the product nor `.design`: this repository is the source of truth for the canvas,
so formats the application cannot produce were taken out of it. There is one layer and
one responsive implementation, not feature-owned duplicate dialogs.

## Responsive composition

- Wide/fit: contained modal dialog within viewport.
- Ordinary narrow portrait: bottom sheet following the reference hierarchy.
- Short landscape, expanded/RTL copy, 200% text or 400% zoom: full-height vertically scrollable
  layer when needed to keep complete content/actions.

Layout mode follows available space/content, not user-agent detection. Actions wrap/stack without
disappearing. JSON/paths own bounded wrapping or labelled internal overflow; the document never
scrolls horizontally. Background content is inert and hidden from the accessibility tree while a
layer/confirmation is active.

## Intent boundary

Presentation components receive immutable localized view models and emit typed intents only:

- import: edit draft, clear, submit, cancel/close, accept/cancel shared replacement;
- exchange layer: select SLEF/Share Link mode and close;
- SLEF export: generate/retry, select payload, copy, download and share.

Components never call the Almanac, `TextEncoder`, active/storage/link state, Clipboard, Blob, URL or
Navigator APIs. Feature 001 components publish the export action without importing feature 004, and
feature 001 domain and application code never imports feature 004. Top-level composition connects
that action to the feature 004 store.

## Shared component composition

Compose or extend feature 011 `src/app/ui/` contracts for:

- modal/sheet/full-height layer, heading, description and close action;
- accessible mode selector owned by the integrated Export Build layer;
- labelled editable/readonly monospaced multiline field with description and byte/error metadata;
- buttons/action groups, status, validation summary, inline notice, structured diagnostic list and
  concise announcement events;
- feature 001 replacement confirmation and no-build recovery state.

After the import layer transitions away, what the import did is read on the workspace surfaces that
already draw it — feature 003's build-status rail, and the build itself.
Feature 004 composes no report of its own (see
[design/import-outcome.md](../design/import-outcome.md), "Divergence"). A missing technical-text
field or diagnostic component extends `src/app/ui/`; no feature-local visual language is created. Previews cover every meaningful default/populated/empty/loading/error/disabled/
success/cancelled/unavailable state at desktop, tablet and mobile widths plus expanded, RTL and
reduced-motion variants.

## Localization and semantics

- Every app string/status/limit/action uses feature 011 message catalogues; counts/bytes use named
  locale formatters. No concatenated English status reaches UI.
- Package ship/module/slot names and diagnostics use Almanac locale helpers. Locale misses use the
  standard canonical/unavailable disclosure; package codes are not privately translated.
- JSON, paths, codes, identities and URLs are direction-isolated in RTL. Producer/name values render
  as untrusted text, never HTML.
- Fields have visible labels/instructions; byte/error state and diagnostics are programmatically
  associated. Diagnostics name entry/property/reason in semantic content.
- State is textually conveyed, never by color/shape/position alone. Announce concise new summaries,
  not initial content, full lists, JSON or stale revisions.
- Actions retain visible/matching names and the shared 44-CSS-pixel baseline. Contrast, 200% text,
  400% zoom, touch/pointer, both orientations and reduced motion follow feature 011 contracts.

## Verification

Every primary journey and relevant layer/confirmation/aftermath/unavailable/delivery state runs in
feature 011's ten Chromium/Firefox viewport-orientation projects with axe, landmark/heading/name/
state/relationship assertions, target sizing, no page overflow, doubled copy, RTL, 200% text and
reduced motion. Actual 400% browser zoom and NVDA/Firefox, TalkBack/Chromium and materially distinct
tablet screen-reader flows use the shared recorded manual protocols. Only rules whose sole criterion
is one of the seven constitutional keyboard exclusions may be omitted.
