# Manual protocol: the schematic filter under WebKit

**Protocol id**: `webkit-filter`
**Covers**: 010 FR-001 (what a plate presents), and the engine gap below
**Version**: 1

## Why this one cannot be automated

Constitution principle VIII fixes the end-to-end matrix at **Chromium and Firefox**, and the matrix
may be sharded but not reduced. There is no WebKit project, and adding one to catch this would be a
third engine's worth of runtime for a single declaration.

That leaves one thing this project can get wrong and never see: a CSS **filter function** —
`grayscale()`, `sepia()`, `hue-rotate()` and the rest, as against `filter: url(#…)` — declared on an
element WebKit does not apply it to. Chromium and Firefox apply such a filter on an SVG container
element (`svg`, `g`) as readily as on an ordinary box, so both report a pass either way. WebKit does
not, and the plate then draws the package's own ink: hull structure in the near-black navy the
Almanac uses, over the seven bright hues of its feature panels. It reads as a blue ship on a dark
plate, and it is what was reported from an iPad on 2026-08-26.

The fix is to declare the filter on an ordinary box — `.schematic__picture`, which wraps the drawing
— rather than on a group inside the picture. Nothing about that is observable in either engine the
suite runs, so the automated suites assert only its _shape_: that the filter's element is a plain box
and that the marks and leaders sit outside it
(`src/app/ui/outfitting/hull-schematic.spec.ts`, "filters the drawing on an ordinary box"). Whether
the hull is actually amber on WebKit is what a person confirms here.

## When to run it

- Before a release, if anything in this list changed since the last recorded run:
  `--edsb-filter-schematic` or `--edsb-schematic-filter` in the token layer; the `.schematic__picture`
  or `.schematic__artwork` rules in `src/app/ui/outfitting/hull-schematic.scss`; or the element the
  filter is declared on in `src/app/ui/outfitting/hull-schematic.html`.
- After an Almanac pin moves, if the schematics' own palette changed.
- Never as a substitute for the automated shape assertions, which run every build.

## Environment to record

Every run records all of it. A result without versions cannot be reproduced or trusted later.

| Field       | Example               |
| ----------- | --------------------- |
| Date        | 2026-08-26            |
| Device      | iPad Pro 11-inch (M2) |
| OS          | iPadOS 18.5           |
| Browser     | Safari 18.5           |
| Build       | commit short SHA      |
| Orientation | landscape             |

## Steps

1. Open the application on the device and open any hull's build — the Anaconda is the reference,
   because its underside carries the densest artwork.
2. Look at the `HULL ANATOMY` plates in `MOUNTS` mode, both sides.
3. **Expected**: the hull reads as an amber technical drawing on the plate's own ground, in the same
   hue as the rest of the interface. The Almanac's seven feature hues are pushed into that one hue
   rather than surviving as their own colours, and the structure is lifted clear of the ground rather
   than sinking into it.
4. **The failure this catches**: the hull reads as blue or blue-grey, visibly a different palette
   from everything around it, with coloured panels standing out against it. That is the drawing
   arriving unfiltered.
5. Confirm the numbered mount marks and any leader lines are **not** pushed through the same filter:
   they keep the interface's amber and the utility marks their cool hue. They are drawn outside the
   filtered box, so a run that shows them tinted with the hull is a different regression.
6. Record a row in [`results/webkit-filter.md`](./results/webkit-filter.md).

## What a failure means

Not a package defect and not an artwork problem: the schematic is the same file every engine gets.
It means the filter has been moved back onto an element WebKit will not apply it to, and the fix is
to put it back on an ordinary box. Do not compensate by changing the filter itself — the values are
tuned against the package's own ink and are correct.
