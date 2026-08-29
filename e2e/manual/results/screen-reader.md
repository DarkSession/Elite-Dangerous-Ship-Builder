# Results: screen-reader journeys

Protocol: [`screen-reader`](../screen-reader.protocol.md), version 9.

Each row is one observation: one step, in one configuration. Rows are appended,
never edited — a later run is a new row, so the history of a regression stays
readable.

## Run 1

**Status: not yet executed.**

No screen-reader run has been performed against this build. The rows below
record the runs that are required and are deliberately left without actual
results rather than being filled in from the automated suite, which cannot hear
anything and is a floor rather than a substitute.

The automated coverage that _does_ exist for the same requirements is the axe
scan across every product and preview state in all ten projects, plus the named
semantic assertions in `e2e/accessibility/assertions.ts` — accessible names
matching visible text, exposed state, label/description/error relationships,
landmark and heading structure, live-region urgency and deduplication, and text
equivalents for every visual carrier.

| Date | OS  | Browser  | Reader   | Build | Viewport | Configuration | Step | Expected                  | Actual | Result  |
| ---- | --- | -------- | -------- | ----- | -------- | ------------- | ---- | ------------------------- | ------ | ------- |
| —    | —   | Firefox  | NVDA     | —     | —        | desktop       | 1–15 | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | mobile        | 1–15 | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | tablet        | 1–15 | As stated in the protocol | —      | not run |

Capability features append their own rows as they land; the rows above are the
foundation's own and are the ones this feature is accountable for.

## The exchange layers (feature 004)

Step 15 covers the import and export layers. Their composition materially
differs between the desktop dialog and the compact bottom sheet — the format
list moves, the actions wrap — so each is its own observation.

| Date | OS  | Browser  | Reader   | Build | Viewport | Configuration | Step | Expected                  | Actual | Result  |
| ---- | --- | -------- | -------- | ----- | -------- | ------------- | ---- | ------------------------- | ------ | ------- |
| —    | —   | Firefox  | NVDA     | —     | —        | desktop       | 15   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | mobile        | 15   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | tablet        | 15   | As stated in the protocol | —      | not run |

## A newly published version (feature 011, user story 4)

Step 16 covers the two states the shell is in when the version it is running is
no longer the published one. It is the only place the split between the two
outlets is checkable: the visible notice is a `status` for a waiting version and
an `alert` for an unrepairable cached one, and the assertive outlet deliberately
summarises rather than repeating what the alert already said
(`src/app/app.ts`, the version effect in the constructor). A reader disagreeing
on either half sends that decision back rather than recording a failure to fix
elsewhere.

Each configuration is its own observation: the restart is on the command bar
where there is room for it and behind the named action layer where there is not,
so what a reader walks past to reach it differs.

| Date | OS  | Browser  | Reader   | Build | Viewport | Configuration | Step | Expected                  | Actual | Result  |
| ---- | --- | -------- | -------- | ----- | -------- | ------------- | ---- | ------------------------- | ------ | ------- |
| —    | —   | Firefox  | NVDA     | —     | —        | desktop       | 16   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | mobile        | 16   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | tablet        | 16   | As stated in the protocol | —      | not run |

## Help, licences and provenance (feature 012)

Step 17 covers the Help · About modal and the frame entry that opens it. Each
configuration is its own observation, and for the same reason as the exchange
layers: the entry is on the banner row at desktop and inside the named action
layer at compact, so what a reader walks past to reach it differs, and the modal
is a centred dialog at one and a full-width sheet at the other.

The alternate-locale half of the step is run on the desktop configuration only,
because what it is asking — whether a reader switches voice for the Frontier
notice while the interface is in German — is a property of the reader and the
`lang` attribute rather than of the layout.

| Date | OS  | Browser  | Reader   | Build | Viewport | Configuration | Step | Expected                  | Actual | Result  |
| ---- | --- | -------- | -------- | ----- | -------- | ------------- | ---- | ------------------------- | ------ | ------- |
| —    | —   | Firefox  | NVDA     | —     | —        | desktop       | 17   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | mobile        | 17   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | tablet        | 17   | As stated in the protocol | —      | not run |

The record feature 012 is accountable for, including what the automated suite
does cover in its place, is
[`specs/012-help-and-licences/design/screen-reader-record.md`](../../../specs/012-help-and-licences/design/screen-reader-record.md).

## Drives & Mass (feature 008)

Step 18 covers the anatomy region's `DRIVES` mode and the three status-rail
cells that repeat three of its figures. Two states are separate observations
rather than one: the ready cards, and the same region with the thrusters
switched off, which replaces the speed envelope with the package's own reasons.
They are a different DOM from each other, and what a reader makes of "the
package declined to say how this ship moves" is the judgment FR-005 turns on.

Each configuration is its own observation for the usual reason: the two cards
stand side by side where the region has the width and stack where it does not,
so what a reader walks past between the thruster figures and the drive figures
differs between desktop and a phone.

The automated coverage that does exist for the same requirements is
`e2e/mobility-and-jump.spec.ts` — every figure read back out of the page and
compared against another part of the same page that has to agree with it, the
rail cells compared field for field against the cards, every bar asserted as
`aria-hidden` with its number in text beside it, and an axe sweep over the
ready, unavailable and stacked states in all ten projects.

| Date | OS  | Browser  | Reader   | Build | Viewport | Configuration | Step | Expected                  | Actual | Result  |
| ---- | --- | -------- | -------- | ----- | -------- | ------------- | ---- | ------------------------- | ------ | ------- |
| —    | —   | Firefox  | NVDA     | —     | —        | desktop       | 18   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | mobile        | 18   | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | tablet        | 18   | As stated in the protocol | —      | not run |
