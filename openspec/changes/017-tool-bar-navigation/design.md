## Context

See `proposal.md` — Why. What shapes the approach is what already exists.

The shell's upper deck draws the mark and the tool tabs from one registry,
`src/app/features/shared/app-navigation.ts`. `AppNavigation.home()` answers with the
shipyard and answers `null` on the shipyard itself, and `tools()` marks the open route's tool
`current`, which the frame draws as a `<span>` rather than a link. The shell follows a tab by
calling `Router.navigateByUrl`, and leaves a modified click to the browser.

The ship tool keeps its build recoverable with three services in
`src/app/application/build-library/`: `AutosaveService` writes the active build into an
unnamed record, `TabOwnershipCoordinator` decides which record this page owns and forks when a
duplicated tab claims the same one, and `RetentionService` sweeps unnamed records after seven
days. All three read the ship's `ActiveBuildStore` by name. `TabDescriptorRepository` holds
one working record id per tab in `sessionStorage`.

The bench has none of that. `LoadoutStore` holds the loadout, the undo tape and the record it
was opened from; `LoadoutLinkCoordinator` publishes it into the address fragment. Closing the
tab, or clearing the bench, ends it.

`openspec/changes/archive/001-ship-selection-and-loading/contracts/persistence.md` is the
record store's contract: one prefix, one retention rule, one lock protocol, for both tools.

## Goals / Non-Goals

**Goals:**

- One control on the bar reaches the entry point from every screen.
- One control on the bar re-enters the tool a Commander is in, and what re-entering means is
  declared beside the tool.
- The bench keeps a loadout the way the workspace keeps a build, so clearing the bench costs
  nothing and needs no question.
- The record rules stay written once. The bench joins the store the ship tool already uses.

**Non-Goals:**

- No new screen, and no change to any address. Every address answers as it did.
- No confirmation before the bench is cleared. The record is what makes that safe.
- No autosave of anything else. The undo tape, the selected item and the layer states stay in
  memory, as they do in the workspace.
- No change to the entry point itself, to the saved records layer, or to either import path.

## Screens

No screen is added. Two change.

### The shell bar — upper deck

Composes: the insignia link, the tool tabs, both from `AppNavigation`.

- The mark is a link on every screen, including the entry point. It carries the entry point's
  name as its accessible name and keeps the size the insignia token declares, so the drawing
  does not change with the target.
- Each tool tab is a link. The open tool's tab keeps the amber wash, the underline and
  `aria-current`, and gains an `href` and a press target.
- States: entry point open (no tool current, both tabs plain links); a tool open (its tab
  current and offered); a re-entry that stands where the Commander is (the entry is drawn and
  activating it changes nothing).

Satisfies 017/FR-001 to 017/FR-005, 017/SC-001, 017/SC-002.

### The equipment bench

Composes: what it composes today, and `ednb-persistence-status` in the place the workspace
draws it — above the bench regions, under the bar.

- States: ready, saving and saved draw nothing, as in the workspace; a blocked store, a full
  store, a failed write and a record discarded elsewhere each draw the notice and the actions
  that state offers — one for each of them but a full store, which offers a retry beside the
  way to choose what to discard.
- The empty bench is a destination as well as a starting state. The suit gate stands and every
  region is drawn and inert, which is canvas `2a`/`2b` and needs no new composition.

Satisfies 017/FR-006 to 017/FR-009, 017/SC-003.

## Decisions

### The mark leads to the entry point; the shipyard is reached from the tool bar

`AppNavigation.home()` answers with the entry point from every screen, named by a new message
rather than by `navigation.catalogue`. The way to the ship list is the ship tool's own tab,
which is where a Commander already reads the tool's name.

Alternative: keep the mark on the shipyard and add a second control for the entry point. The
deck draws one mark on the leading edge and the canvas has no room for a second; two controls
to two places would also make the mark mean "the ship tool" on a bar whose next item says so.

### The current tool is a link that carries `aria-current="true"`

The frame draws every tab as an `<a>`. The open tool's tab keeps `aria-current`, so which tool
is open is still exposed rather than drawn, and it now also answers as a link — openable in a
new tab, its address copyable.

`aria-current="true"` rather than `"page"`. The ship tool's tab is current while a build is
open at `/outfitting`, and its address is the ship list, so "page" would claim the link is the
page a Commander is reading. "true" says current item and claims nothing more.

### Re-entry is declared in the registry, not in the bar

`ToolRecord` gains a re-entry: an address, which is the tool's own `href` and the default, or a
named action the shell dispatches the way it dispatches a shell action. The ship tool declares
none and re-enters at `/ships`; the equipment tool declares the action that starts an empty
bench.

Alternative: a switch on the tool id inside `App`. That is the second place a tool would be
described, and the registry exists so there is only one.

### A click that would land where the Commander already is does nothing

`App.navigateFromShell` compares the entry's address with the address the chrome reads and
returns without navigating when they are the same. It runs after the modified-click guard, so
a middle click, a modified click and "open in new tab" reach the browser untouched and open the
address as any link does.

Alternative: navigate anyway and let the router discard it. The router would still push a
history entry for the fragment-carrying addresses and would reset the scroll position, which
is a visible answer to a control the Commander expected to do nothing.

### The bench joins the ship tool's autosave rather than copying it

`WorkingRecordAutosave` and `TabOwnershipCoordinator` are generalised over one port,
`WorkingRecordSubject` — the state a tool publishes for autosave: a revision to watch, a
fingerprint, whether it is dirty, the record id it writes to, the named record it forked
from, and a way to state the persistence result. Each tool implements it on the store that
already holds the work — `ActiveBuildStore` for the ship, `LoadoutStore` for the bench —
because every field the port asks for is something that store is already the authority on.
`AutosaveService` and `LoadoutAutosaveService` are the two bindings of the engine, and hold
nothing but which store they keep.

The port carries the record draft's body, so each tool writes its own record shape — a
`ShipRecord` or an `EquipmentRecord` — and the service writes the envelope both share.

Alternative: a second autosave service for the bench. That is the quota rule, the fork
handshake, the take-over rule and the expiry protection written twice, in two files that would
drift apart at the first fix.

### The loadout's fingerprint is its stored form

`baselineFingerprint` over `toStoredLoadout(loadout)`, which is what the ship tool does over
its build snapshot: a fingerprint derived only from what a Commander decided. A figure the
package recalculates after an upgrade is not a change, and a fingerprint over anything derived
would mark every loadout dirty after one.

### `findUnnamedMatching` takes the tool

The repository filters unnamed records by tool before comparing, so a loadout never takes over
a record holding a build. The rule already exists in the ship's direction, written as a
`isShipRecord` filter inside the method; the tool becomes an argument instead.

### The tab descriptor holds one working record per tool

Version 2: a working record id per tool rather than one for the tab. A version 1 descriptor is
read as the ship's working record, so a session that restarts onto a published update — which
restarts the page in the same tab, where `sessionStorage` survives — keeps writing to the
record it was writing to. A version the reader does not know is still refused, and the tab
starts fresh records.

Alternative: a second session key for the bench. Two keys to describe one tab, with no
migration saved.

### The persistence notice is one component, told which state to draw

`ednb-persistence-status` takes the state and the paused flag as inputs and reports which
action was pressed, instead of reading `ActiveBuildStore`. The workspace and the bench each
supply their own.

Alternative: a second component with the same seven states, the same three actions and the
same strings.

### The page identity is minted where it is first needed

`TabOwnershipCoordinator.pageNonce` is read on demand rather than set at construction. The
shell reaches the coordinator to offer the bar's re-entry action, so every screen now builds
it — including the prerender pass, which runs in a runtime with no cryptographic random
source. Nothing there claims a record or hears a claim, so nothing there needs an identity.

Alternative: keep the identity eager and have the shell reach the bench action lazily. That
puts the constraint in the caller, where the next caller would meet it again.

### The bench restores in the workspace's order

Claim ownership, restore the record this page holds, start autosaving, ingest the address
fragment, then start publishing. A loadout in the address outranks the restored one, and a
refused link leaves the restored loadout on the bench. Autosave starts before the fragment is
read, so a loadout opened from a link is written to this page's record like any other.
Publishing starts last, so the restored loadout cannot overwrite the fragment the page
arrived with.

### The sheet's own bar keeps the way back, not the mark

A hull below the wide width is drawn as a sheet over the shipyard, and canvas `1b` gives that
sheet a bar of its own: the way back, the layer's name and the line under it, with the
insignia and the identity hidden. The mark is therefore not on that bar, and the entry point
is reached from the shipyard the arrow leads back to.

The alternative is to draw the mark beside the arrow. It is the one place a 44px press box
has to be found on a 390px row that already carries both tool tabs, and it would mean the
sheet's bar drawing something no canvas draws on it. The exception is stated in the
requirement rather than left to the stylesheet.

### Starting an empty bench needs the loadout to be somewhere first

The action flushes autosave and then reads what that write did. Where the store refuses it,
is full, or autosave is paused after an external delete, the bench keeps the loadout: nothing
holds it, so clearing it would be a loss rather than a free action, and the persistence notice
already on the bench states the reason.

Alternative: clear regardless and state the loss. That is a seventh persistence state and a
string in both catalogues for a case a Commander can already read on the screen.

### A deleted record is not a deleted address

Deleting the record the bench autosaves into clears the bench and takes the loadout out of the
address this page is on. It does not reach the addresses behind it: the saved records layer
raises itself by pushing a history entry, so leaving the layer returns to the entry it was
opened from, which still carries the loadout. The loadout opens again from there, into a
record of its own, and the record that was deleted is never written back.

Alternative: refuse to read a link the bench has just been cleared of. That makes the address
and the screen disagree — a loadout in the bar that is not on the bench — and it would also
refuse a Commander who presses BACK to a loadout they meant to return to.

### Starting an empty bench is not undoable

The undo tape is cleared, as it is when a loadout is opened from a record or a link: the
choices before it belong to a loadout that is no longer on the bench. What makes the action
safe is the record, not the tape.

## Risks / Trade-offs

- A control that does nothing when pressed reads as a broken control → the entry keeps its
  `href`, so the browser states where it goes, a new tab opens it, and its address copies.
  Only the plain click is answered with nothing, and only where the answer would be the screen
  already on the page.
- The current tool becoming a control changes what a screen reader announces → `aria-current`
  is unchanged and the tab's text is unchanged, so the state is still spoken. Step 20 of
  `e2e/manual/screen-reader.protocol.md` is where a reader disagreeing sends this back.
- A page now writes two working records, so an ordinary session leaves more behind → the
  seven-day expiry already removes them and the take-over rule keeps one record per state.
  Nothing is written while a loadout matches the record it came from.
- Generalising the autosave services touches the ship tool's own persistence, which is the
  part of the application a Commander can lose work in → the ship's behaviour is fixed by its
  existing unit tests and its end-to-end journeys, which must pass unchanged. The port is
  introduced with the ship as its first implementation, before the bench uses it.
- A Commander who cleared the bench by accident has no undo → the loadout is in the saved
  records layer as an unnamed record, which is the same answer the workspace gives for a
  replaced build.

## Migration Plan

- No stored record changes shape. An `EquipmentRecord` with `kind: 'working'` is already a
  value the parser, the serializer and the library listing read.
- The tab descriptor moves to version 2 and reads version 1 as the ship's working record.
- Nothing to undo on rollback: an unnamed loadout record left behind by this version is listed
  and swept by the seven-day rule like any other.
