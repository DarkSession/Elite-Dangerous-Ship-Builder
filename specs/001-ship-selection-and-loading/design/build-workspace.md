# Build Workspace Screen

**Route**: `/build` with optional `#b.…`  
**Requirements**: FR-007–FR-009, FR-011–FR-012, FR-014–FR-021

This feature defines the active-build shell and persistence/share behavior. Module editors and statistics compose into it under later capability plans.

## Composition

- `AppShell` and the active hull/provenance summary. The workspace renders no heading of its own: canvas 1c puts the build's identity in the command bar (see [hull-catalogue, "Screen chrome and the command bar"](./hull-catalogue.md#screen-chrome-and-the-command-bar)).
- Named/working/dirty and package validation `StatusIndicator` with visible text, not color alone.
- Active capability outlet for future outfitting/statistics screens; no component owns a second build copy.
- Save/name and library actions.
- `ShareLinkPanel` with generated canonical link, copy/share feedback, encoding/refusal state and feature 004 SLEF alternative.
- Persistent `InlineNotice`/`ErrorSummary` for storage unavailable/quota, externally deleted working record, invalid incoming link and unsupported version.
- `ConfirmDialog` for candidate replacement.

Canvas 1c supplies the wide workspace command hierarchy: build name/hull identity at the start, save and export/share actions at the end, and modal surfaces over the active capability. Canvas 1d supplies the narrow variant: identity header, overflow action menu and bottom-sheet dialogs. The save dialog's name/note and “overwrite existing”/“save as new” choices map to stable record IDs and revision checks; visual name equality alone never authorizes overwrite. Feature 001's share-link view composes inside the export dialog, while feature 004 owns its SLEF export choice; the mock's journal and Markdown export choices are not implemented.

## States

| State                              | Required presentation and behavior                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| No active build                    | Explain how to select a hull/open a save/paste a link; no fabricated placeholder ship.                            |
| Working stock/link build           | Show hull and “working” provenance; autosave status; no named save is created implicitly.                         |
| Named-source build                 | Show source name and whether modelled state differs from baseline. Autosave still targets the tab working record. |
| Persistence saving/saved           | Nonblocking status; announcements are polite and coalesced.                                                       |
| Persistence failed/limit/quota     | Blocking status explains that editing remains usable; manage/retry actions remain available.                      |
| Valid incoming link                | Detached candidate completes before any confirmation/commit; success becomes working/link provenance.             |
| Invalid/truncated/unsupported link | Localized structured error; active and stored builds unchanged.                                                   |
| Link published                     | Selectable same-origin `/build#b.…` text; path/query contain no build data.                                       |
| Link refused                       | Stale build fragment removed; affected slot/reason shown; active build remains; SLEF action available.            |
| Replacement confirmation           | Identifies current/incoming work; cancel changes neither build nor records.                                       |

## URL lifecycle

Restore this tab's working record first, then process an initial recognized fragment as an incoming candidate. Initial and later `hashchange` events share the same coordinator and request token. After commit/edit, encoding uses the existing loader; success calls `history.replaceState`, while refusal clears only the stale build fragment. Note/name/record operations do not enter or perturb the payload.

## Persistence lifecycle

Modelled edits coalesce into this tab's working key. Visibility loss/pagehide requests a best-effort flush. Opening or creating never writes a named save. Explicit named save compares the baseline under a short Web Lock; conflicts delegate to the library choice dialog while the active working copy remains intact.

## Responsive and accessibility notes

- Header/status/actions reflow into one column; future capability outlet owns any internal wide-content scrolling.
- Error alerts fire once per new blocking condition. Repeated autosave success does not interrupt speech.
- Link text wraps or uses a labeled internal scroll container without document overflow.
- Share/copy failure never removes selectable text.
- The share-link mode always renders `/build#b.…`; the reference `/b/<name>#h=…` sample is not implemented because it puts local naming/version detail outside the canonical fragment contract.
- Persistence status, working provenance, conflict, retention/quota and link-refusal states are added to the visual hierarchy even though the reference canvases do not depict them.
- Preview states cover no-build, working/named/link, dirty, persistence failures, valid/invalid/refused links and confirmation at all core widths.

## Reference composition

Measured from canvas 1c's command bar and its save and export dialogs, and canvas 1d's compact
equivalents. The workspace's editing regions belong to feature 002; what feature 001 takes from
these canvases is the bar, the identity and the two dialogs.

| Part          | Canvas                                                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Command bar   | Amber flag, then the build name in condensed 700 tracked 0.16em over a monospace `HULL · IDENT` line; actions trail                                                                                                                                    |
| Actions       | Quiet monospace history controls, a hairline separator, a bordered `EXPORT`, a filled `SAVE`, then a square help control                                                                                                                               |
| Save dialog   | Name and note fields under tracked monospace labels, then the save mode as two bordered cards — the selected one washed amber with a filled square marker — over a footer rule carrying a monospace message and the two actions                        |
| Export dialog | A format list on the leading edge, each a bordered card with a tracked condensed title over a Barlow 300 description; the payload fills the trailing region as monospace text in a field, over a monospace meta line and the download and copy actions |
| Share value   | Monospace inside a field surface, selectable, scrolling inside its own box rather than wrapping the page                                                                                                                                               |
