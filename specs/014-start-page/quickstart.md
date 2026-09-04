# Quickstart: Start Page

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

How to prove this feature works, end to end, without reading the implementation. Every
command runs from the repository root.

## Prerequisites

```bash
pnpm install --frozen-lockfile
```

Node per `.nvmrc`. Nothing else: this feature adds no dependency and no service.

## Walk it by hand

```bash
pnpm start
```

Then, at `http://localhost:4200/`:

1. **The root is a screen, not a redirect.** The address bar stays at `/`. You see
   `TOOLS FOR COMMANDERS`, a line beneath it, and two tool entries. You are not in the
   shipyard. _(FR-001, FR-002)_
2. **Neither tab is current.** In the bar above, `SHIP BUILDER` and `EQUIPMENT BUILDER` are
   both offered as links; neither is drawn as the screen you are on. _(FR-010)_
3. **The actions carried over.** The action row still offers opening a saved record,
   importing and help, in the same places as on the shipyard. Nothing new sits beside them.
   _(FR-011)_
4. **A tool opens, and back returns here.** Activate `SHIP BUILDER` → `/ships`. Press back →
   `/` again, not the page before it. _(FR-006, FR-007)_
5. **An address that resolves nothing lands here.** Visit `/nonsense` → the entry point.
   _(FR-008)_
6. **An address that resolves is untouched.** Visit `/equipment` → the bench, directly.
   _(FR-009)_
7. **The attribution is at the foot**, in full, ending "in the making of it." _(FR-012)_
8. **The forms swap at the fold.** Narrow the window past 48rem: each tool's subject list
   goes and its description becomes the shorter one. Widen it: they come back. At no width
   are both descriptions visible. _(FR-017, FR-018, FR-019)_
9. **It survives translation.** Switch the language. Heading, line, both tool names,
   subjects and descriptions all change; the attribution does not, and stays marked as
   English. _(FR-013)_

## Run the checks

```bash
# The whole gate — what must pass before merge
pnpm run check

# Narrower, while iterating
pnpm test                                   # unit, with the 80% thresholds
pnpm run e2e -- start-page.spec.ts          # this feature's journey
pnpm run test:scripts                       # the address scripts
pnpm run policy                             # the route/address reconciliation
```

The full ten-project Playwright matrix is mandatory at the phase boundary; a narrow run
proves the journey and not the responsive fold, the accessibility sweep or the second
engine. `pnpm run check` also runs `search:sitemap:check`, which fails if the committed
map no longer matches what the generator would write — so a root address added to
`STATIC_ADDRESSES` without regenerating the map fails there rather than in review.

## Prove the published root

```bash
pnpm run search:sitemap        # regenerates public/sitemap.xml
git diff public/sitemap.xml    # expect exactly one added <loc>: https://navbeacon.app/
```

`pnpm run build` already runs the generator and then `publish-static-routes.mjs`, so a
build is the end-to-end proof:

```bash
pnpm run build
```

Expect the publisher's summary count to rise by one, and `dist/navbeacon/browser/index.html`
to carry the entry point's title and description rather than the shipyard's. A head tag the
substitution cannot find fails the run rather than publishing the old sentence — that
refusal is the check.

## What "done" looks like

| Criterion | Proved by                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------- |
| SC-001    | Steps 1–2 above, and `e2e/start-page.spec.ts` asserting both tools are named and described           |
| SC-002    | Step 4: one activation, one navigation                                                               |
| SC-003    | `e2e/start-page.spec.ts` at the desktop, tablet and mobile projects                                  |
| SC-004    | The registry unit test: a record added to a copy of `TOOLS` reaches both readings with no other edit |
| SC-005    | The accessibility sweep over `/` in all ten projects                                                 |
| SC-006    | The locale unit tests, and step 9                                                                    |
| SC-007    | Steps 5–6, plus the untouched route table below `''`                                                 |
| SC-008    | Step 8, asserted per project rather than by eye                                                      |
