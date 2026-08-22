# Results: screen-reader journeys

Protocol: [`screen-reader`](../screen-reader.protocol.md), version 1.

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
| —    | —   | Firefox  | NVDA     | —     | —        | desktop       | 1–13 | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | mobile        | 1–13 | As stated in the protocol | —      | not run |
| —    | —   | Chromium | TalkBack | —     | —        | tablet        | 1–13 | As stated in the protocol | —      | not run |

Capability features append their own rows as they land; the rows above are the
foundation's own and are the ones this feature is accountable for.
