# Results: the schematic filter under WebKit

Protocol: [`webkit-filter`](../webkit-filter.protocol.md), version 1.

Each row is one observation: one device, one build. Rows are appended, never edited — a later run is
a new row, so the history of a regression stays readable.

## Run 1 — the reported defect, and its fix

**Status: executed. Pass.**

Reported from an iPad on 2026-08-26 against the plates as they stood before `d87ff28`: "on iPad OS
the hulls are blue". The filter was declared on `.schematic__artwork`, a `g` inside the drawing.
Moving it to `.schematic__picture`, an ordinary box wrapping the drawing, was confirmed on the device
by the maintainer on the same day.

Two fields below are **not recorded** rather than guessed. The report and its confirmation came
without them, and a version written down from inference is worse than one left blank — the next run
should capture them, and this row is not a baseline for "which iPadOS version" anything.

| Date       | Device | OS           | Browser | Build         | Orientation  | Expected                                     | Actual                      | Result |
| ---------- | ------ | ------------ | ------- | ------------- | ------------ | -------------------------------------------- | --------------------------- | ------ |
| 2026-08-26 | iPad   | not recorded | Safari  | pre-`d87ff28` | not recorded | Hull reads amber, in the interface's own hue | Hull read blue — unfiltered | fail   |
| 2026-08-26 | iPad   | not recorded | Safari  | `bbee057`     | not recorded | Hull reads amber, in the interface's own hue | Confirmed by the maintainer | pass   |

## What this row does and does not establish

It establishes that the plates draw correctly on the device, which is the thing that matters and the
thing no automated suite here can reach.

It does not, on its own, prove the _mechanism_. That a CSS filter function on an SVG container
element is the part WebKit declines to apply is the explanation that predicted this fix and is
consistent with it, not something measured in this repository. The distinction matters only if the
symptom returns: the first thing to check is still which element carries the filter.

There is no automated guard. The end-to-end matrix is Chromium and Firefox by constitutional
mandate, and both apply the filter in either position, so a change that moved it back would pass
every check this project runs. The protocol's "when to run it" list is what stands in for that.
