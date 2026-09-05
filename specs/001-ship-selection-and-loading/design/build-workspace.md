# Build Workspace Screen

**Route**: `/outfitting` with optional `#b.…`  
**Requirements**: FR-007–FR-009, FR-011–FR-012, FR-014–FR-021

This feature defines the active-build shell and persistence/share behavior. Module editors and statistics compose into it under later capability plans.

## Composition

- `AppShell` and the active hull/provenance summary. The workspace renders no heading of its own: canvas 1c puts the build's identity in the command bar (see [hull-catalogue, "Screen chrome and the command bar"](./hull-catalogue.md#screen-chrome-and-the-command-bar)).
- Named/unnamed and package validation `StatusIndicator` with visible text, not color alone.
- Active capability outlet for future outfitting/statistics screens; no component owns a second build copy.
- The command bar's `SAVE`, and the layer it opens: the build name, one local note, the two save
  modes as bordered cards each led by a square marker, a monospace message line and the two actions.
  The modes are drawn only where both apply; a build with nothing to replace has one thing
  `SAVE BUILD` can do and is offered no card at all. It is this screen's, not
  the library's — a library answers "which of these builds" and this is where "what should become of
  this one" is asked (FR-009, ruled 2026-08-27).
- The conflict choice the save can raise: overwrite, keep both, cancel.
- `ShareLinkPanel` with generated canonical link, copy/share feedback, encoding/refusal state and feature 004 SLEF alternative.
- Persistent `InlineNotice`/`ErrorSummary` for storage unavailable/quota, an externally deleted autosave record, invalid incoming link and unsupported version.
- The shared `EmptyState` for a screen with no build in it.
- The shared `Skeleton` for a page opened at an address that carries a link fragment. The screen
  cannot yet tell whether it has a build, because the codec is still on its way.

Canvas 1c supplies the wide workspace command hierarchy: build name/hull identity at the start, save and export/share actions at the end, and modal surfaces over the active capability. Canvas 1d supplies the narrow variant: identity header, overflow action menu and bottom-sheet dialogs. The save dialog's name/note and “overwrite existing”/“save as new” choices map to stable record IDs and revision checks; visual name equality alone never authorizes overwrite. Since 2026-08-25 the two choices are what consumes the unnamed record the build is being autosaved into: “overwrite existing” writes the build into the record it was opened from and then removes the unnamed one, and “save as new” names the unnamed record in place. Either way the Commander is the one who decided which version survives, and nothing autosaves into a named record before or after. Feature 001's share-link view composes inside the export dialog, while feature 004 owns its SLEF export choice, which is the one the dialog lists first and opens on; the journal and Markdown export choices the mock once drew are implemented nowhere and drawn nowhere — they were taken out of `.design` rather than left drawn beside two real ones.

## States

| State                              | Required presentation and behavior                                                                                                                                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No active build                    | Explain how to select a hull/open a save/paste a link; no fabricated placeholder ship. Reached by deleting the record this page holds, and not treated as an error when it is.                                                                |
| Reading an incoming link           | The screen decodes the address fragment. A skeleton holds the build's place, and a sentence names what the screen reads. The screen does not draw the empty state, because a build may follow (011/FR-029).                                   |
| Unnamed stock/link build           | Title from the build's ship name, ident or hull, as the library titles it, set apart from a given name.                                                                                                                                       |
| Named build, unedited              | Show the name the Commander gave the record. Nothing is written; what is on screen is what was saved.                                                                                                                                         |
| Named build, edited                | Show the name it came from and that the edits are their own unnamed entry until saved; the save is untouched.                                                                                                                                 |
| Persistence saving/saved           | Nonblocking status; announcements are polite and coalesced.                                                                                                                                                                                   |
| Persistence failed/quota           | Blocking status explains that editing remains usable; manage/retry actions remain available.                                                                                                                                                  |
| Valid incoming link                | Detached candidate completes before the single commit; success becomes an unnamed record with link provenance.                                                                                                                                |
| Invalid/truncated/unsupported link | Localized structured error; active and stored builds unchanged.                                                                                                                                                                               |
| Link published                     | Selectable same-origin `/outfitting#b.…` text; path/query contain no build data.                                                                                                                                                              |
| Link refused                       | Stale build fragment removed; affected slot/reason shown; active build remains; SLEF action available.                                                                                                                                        |
| Save, unnamed build                | No mode is drawn: saving as a new build is the only thing the commit can do. The name starts from what the build is already called — its ship name, its ident, or its hull — which is the rule the library titles an unnamed row by (FR-010). |
| Save, opened from a save           | Two modes, the first selected, each led by a square marker filled on the one that stands: replace that save, stating when it was last saved, or keep both as a new build. The name starts from the record’s own and the note from its note.   |
| Save, duplicate name               | The message line states how many stored builds already use the typed name. Saving stays available and creates a separate record; visual name equality never authorizes a replacement.                                                         |
| Save, replacing unavailable        | Where the browser has no Web Locks there is nothing to choose between, so no mode is drawn and the message line says why. Saving as a new build and cancelling both remain.                                                                   |
| Conflict                           | Another page saved the record after this one opened it: overwrite, keep both and cancel, each stating which versions survive. No lock is held while it is shown.                                                                              |
| Conflict changed again             | A third revision appeared while the Commander decided: the observed version is re-read and the question asked again, never a silent replacement.                                                                                              |

## URL lifecycle

Restore the record this page holds first, then process an initial recognized fragment as an incoming candidate. Initial and later `hashchange` events share the same coordinator and request token. After commit/edit, encoding uses the existing loader; success calls `history.replaceState`, while refusal clears only the stale build fragment. Note/name/record operations do not enter or perturb the payload.

## Persistence lifecycle

Modelled edits coalesce into the key of the page's own unnamed record. A build arriving with no record mints one at commit; a build opened from a record writes nothing until its first modelled edit, which forks an unnamed record and directs every write there. Autosave has no path to a named record, so an opened save cannot move under its Commander. Either way there is never an active build that is not recoverable from storage, which is what withdraws the replacement question from every ingress path (FR-008, FR-009).

Visibility loss/pagehide requests a best-effort flush. A manual save takes the target record's short Web Lock, compares the baseline, writes, and only then removes the unnamed record it consumed; a conflict raises this screen's own choice dialog while the active build and its unnamed record remain intact. It was the library's dialog until 2026-08-27, because the save that raised it was the library's; both moved together, and neither holds a lock while it is on screen.

## Responsive and accessibility notes

- Header/status/actions reflow into one column; future capability outlet owns any internal wide-content scrolling.
- Error alerts fire once per new blocking condition. Repeated autosave success does not interrupt speech.
- Link text wraps or uses a labeled internal scroll container without document overflow.
- Share/copy failure never removes selectable text.
- The share-link mode always renders `/outfitting#b.…`; the reference `/b/<name>#h=…` sample is not implemented because it puts local naming/version detail outside the canonical fragment contract.
- **Revised 2026-08-22.** Persistence status and record provenance are _not_ added to the visual
  hierarchy: neither canvas draws either, and the standing rule is that what the design does not draw
  is not drawn. Both remain in the accessibility layer, where a reader who has no drawn state to
  notice still gets them. Conflict, quota and link refusal keep their visible treatment —
  those are blocking conditions a Commander has to act on, not status.
- Preview states cover no-build, unnamed/named/link, persistence failures, valid/invalid/refused links, and the save layer’s unnamed, opened-from-a-save, duplicate-name and locks-unavailable states, at all core widths. The replacement-confirmation preview is withdrawn with the state.

### The save layer's name, 2026-08-28 (Commander request)

Reported as an always-empty dialog. The layer used to start its name field from the record the build
was opened from and from nothing otherwise, on the reasoning that a name the application filled in is
not a name a Commander gave. The common way to reach `SAVE` is on a build just made from a hull,
where there is no such record, so the field was blank almost every time it was opened.

It now starts from what the build is already called: its ship name, its ident, or its hull — FR-010's
rule for titling an unnamed record, applied to the build that is open and read from one place so the
layer and the library cannot disagree. It is still the Commander's to overwrite before they press
anything, and a build with something to replace still starts from that record's own name.

The two modes were not part of the defect and are unchanged: they are drawn where there is a save to
replace, replacing selected, and not drawn at all where there is nothing to replace.

## Reference composition

Measured from canvas 1c's command bar and its save and export dialogs, and canvas 1d's compact
equivalents. The workspace's editing regions belong to feature 002; what feature 001 takes from
these canvases is the bar, the identity and the two dialogs.

| Part          | Canvas                                                                                                                                                                                                                                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Command bar   | Amber flag, then the build name in condensed 700 tracked 0.16em over a monospace `HULL · IDENT` line; actions trail                                                                                                                                                                                                                                                   |
| Actions       | Quiet monospace history controls, a hairline separator, a bordered `EXPORT`, a filled `SAVE`, then a square help control                                                                                                                                                                                                                                              |
| Save dialog   | Name and note fields under tracked monospace labels and nothing else, then the save mode as two bordered cards — each led by a 12px square, filled and washed amber on the one that stands — over a footer rule carrying a monospace message and the two actions                                                                                                      |
| Export dialog | A format list on the leading edge, each a bordered card with a tracked condensed title over a Barlow 300 description, the first one washed amber as the one the dialog opens on; one amber hairline divides the list from the trailing region, which fills with the payload as monospace text in a field over a monospace meta line and the download and copy actions |
| Share value   | Monospace inside a field surface, selectable, scrolling inside its own box rather than wrapping the page                                                                                                                                                                                                                                                              |
