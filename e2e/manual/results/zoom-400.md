# Results: actual 400% browser zoom

Protocol: [`zoom-400`](../zoom-400.protocol.md), version 2.

Each row is one observation: one capability and state, in one engine, at one orientation. Rows are
appended, never edited — a later run is a new row, so the history of a regression stays readable.

## Run 1

**Status: not yet executed.**

No actual-zoom run has been performed against this build. The rows below are deliberately left
without a result rather than being filled in from the automated suite.

What that automated suite covers is not a proxy: `e2e/reflow.spec.ts` runs the **320x256 CSS-pixel
viewport that WCAG 1.4.10 defines 400% zoom on a 1280x1024 window to be equivalent to**, in both
engines across all ten projects, asserting no horizontal page scroll, every landmark, every action
present with visible text, every target reachable, the banner released and travelling with the page,
no clipped text, a layer at full height, an axe scan, and the same viewport again at 200% root text.

What remains for a person is what that cannot reach: actual browser zoom cannot be driven by any
Playwright or CDP API in either engine, real zoom brings browser and operating-system chrome that no
viewport setting reproduces, and whether the result is still _usable_ is a judgment rather than a
measurement. These rows record that confirmation.

| Date | OS  | Browser  | Build | Viewport | Orientation | Capability / state | Expected                                                                                                          | Actual | Result  |
| ---- | --- | -------- | ----- | -------- | ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| —    | —   | Chromium | —     | —        | landscape   | shell / default    | No horizontal page scrolling; every action present with visible text; banner releases; layer presents full height | —      | not run |
| —    | —   | Chromium | —     | —        | portrait    | shell / default    | As above                                                                                                          | —      | not run |
| —    | —   | Firefox  | —     | —        | landscape   | shell / default    | As above                                                                                                          | —      | not run |
| —    | —   | Firefox  | —     | —        | portrait    | shell / default    | As above                                                                                                          | —      | not run |

Capability features add their own rows as they land; the shell rows above are the foundation's own
and are the ones this feature is accountable for.

## The exchange layers (feature 004)

Both layers carry a monospaced field that can hold more than the viewport, which is exactly the
composition step 6 is about. Each is its own observation.

| Date | OS  | Browser  | Build | Viewport | Orientation | Capability / state           | Expected                                                                        | Actual | Result  |
| ---- | --- | -------- | ----- | -------- | ----------- | ---------------------------- | ------------------------------------------------------------------------------- | ------ | ------- |
| —    | —   | Chromium | —     | —        | landscape   | import layer / diagnostics   | Full height; field scrolls inside itself; no sideways page scroll; actions kept | —      | not run |
| —    | —   | Chromium | —     | —        | portrait    | export layer / whole payload | As above                                                                        | —      | not run |
| —    | —   | Firefox  | —     | —        | landscape   | import layer / diagnostics   | As above                                                                        | —      | not run |
| —    | —   | Firefox  | —     | —        | portrait    | export layer / whole payload | As above                                                                        | —      | not run |
