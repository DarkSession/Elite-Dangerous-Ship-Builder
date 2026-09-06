# Design: the first frame of each in-scope screen

**Feature**: 015 | **Date**: 2026-09-06

The constitution asks that screens be defined at plan time. This feature adds no
screen and no component — it changes _when_ three existing screens are rendered.
So what this artifact records is each screen's **first frame**: what a reader sees
before any script runs, what the takeover is allowed to change, and which
requirement holds it there.

## Why one document is correct at every viewport

The feature's largest assumed risk was that the build cannot know the viewport.
It turns out not to be a risk on these three screens, and the reason is
structural: every composition switch on them is a **media query over markup that
contains both alternatives**. The document carries both; CSS picks one; no script
is involved.

| Switch                    | Where                                     | Both in DOM?              |
| ------------------------- | ----------------------------------------- | ------------------------- |
| Catalogue table vs. cards | `responsive-catalogue-view.scss:7-45`     | yes, other `display:none` |
| Catalogue rail vs. sheet  | `ship-catalogue.page.scss:81-137`         | yes                       |
| Hull inspector vs. sheet  | `hull-detail.page.scss:27-33, 239-265`    | yes                       |
| Shell layered bar         | `app-frame.scss:322-324, 331-380`         | yes                       |
| Shell folded actions      | `app-frame.scss:407-410, 448-470`         | yes                       |
| Start page columns        | `start.page.scss:78`, `tool-card.scss:76` | yes                       |

So FR-010 is satisfied by construction rather than by work. The one file that
measures on all three screens is `sticky-banner.ts`, and the plan guards it.

---

## `/` — the start page

**Composes**: the shell, the tool selector, the attribution band.

**First frame states**: the product's name, what it is for, and every tool it
carries with each tool's description.

**Measures**: nothing. `start.page.ts` has no state, fetches nothing, and its only
responsive rule is a media query.

**Takeover may change**: the language of the text, in place (FR-011).

**Takeover must not**: move anything, blank anything, or re-compose.

**Special rule**: this document **is** `index.html` — Pages resolves `/` to that
file and to no other. So the things that used `index.html` as a content-free shell
move off it: the service worker's navigation fallback, the `app-shell` prefetch
list and `404.html` all point at `index.csr.html` instead. Without that move, a
repeat visit to a hull would paint the start page
([contracts/address-set.md](../contracts/address-set.md) §2-§3).

---

## `/ships` — the hull catalogue

**Composes**: the shell, the catalogue view (table at `medium-up`, cards below),
the filter and sort controls, and at `wide-up` the inspector rail.

**First frame states**: every hull the catalogue lists, each linking to its own
address, in **default order with no filter** — because the build knows no session.

**Measures**: `observeRestingReads()` only, whose result reaches an `aria-label`
and event behaviour, never a box. Already guarded for a renderer with no
`matchMedia`.

**Takeover may change**:

- The language of the text, in place.
- The accessible name of the row action, as `observeRestingReads` resolves.
- **The order and length of the list, once**, when the Commander has a stored view
  in `sessionStorage` — FR-009a.

**Takeover must not**:

- Change the list at all for a Commander with **no** stored view. That is the
  common case and FR-009 holds in full.
- Apply the stored view a frame late. It must land in the takeover frame itself.
- Scroll the page. `CatalogueAnchorRestorer` fires only when a hull detail closes,
  never on a cold load — verified in Phase 0, and a takeover test keeps it that
  way.

**Watch**: `offline-privacy.spec.ts:61` asserts exactly 48 visible
`[data-hull-symbol]` nodes. A prerendered catalogue plus a hydrated one is a
double-count hazard across the takeover.

---

## `/ships/:hull` — the hull detail

**Composes**: the shell, the catalogue behind, and the hull inspector — a rail at
`wide-up`, a full-screen sheet below.

**First frame states**: the hull's manufacturer, size, maximum speed, base shield,
hull mass, crew, mass lock, hardpoint counts by class, internal capacity by size,
and price. Plus the catalogue behind it, which is genuinely on screen at wide
widths because this route is a child of `/ships`.

**Measures**: nothing. `hull-detail.page.ts` has no measurement at load. The
`barCarriesName` decision is computed from package data, which the build has.

**Takeover may change**: the language of the text, in place.

**Takeover must not**: move anything, blank anything, or re-compose. The
illustration reserves its box with `aspect-ratio: 3 / 2`, so a late image does not
shift layout.

**Note**: the canonicalising `router.navigate(..., { replaceUrl: true })` fires
only for a non-canonical address segment. Only canonical segments are prerendered,
so it never fires on a generated document.

---

## The shell, on all three

**Composes**: the tool bar, the layered return bar (`below-wide`), the folded
action layer (`bar-folded`), and the banner.

**Measures**: `observeBanner` (`sticky-banner.ts:53-88`) — the one measurement
every prerendered page inherits.

**What it must not do**: publish either of its host bindings into a generated
document, or throw while trying. Under the emulation the spike ran,
`element.getBoundingClientRect` is not a function, so `measure()`
(`sticky-banner.ts:69`) throws before either signal is written: the bindings emit
nothing and the document is, by luck, correct. By luck is the problem — an
emulation returning a zero-height rect instead would serialise
`class="frame--released"` and `--ednb-layout-bar-height: 0px`, a measurement it
never made and the browser immediately contradicts (research decision 6).

**The fix, using patterns already in this repository**: a `DOCUMENT`-injected view
as `element-size.adapter.ts:28` does, and an `afterNextRender` deferral as
`bench-composition.ts:91-94` does. The document then carries neither binding, the
token layer's declared height stands, and the browser supplies both after first
paint.

**Why the risk is small and the fix still required**: both bindings drive
`position: sticky` offsets, `max-block-size` and `scroll-margin` — never normal
flow — and `sticky → static` does not reflow. But FR-009 says content does not
move, not that little of it does, and a document stating a measurement it never
took is not something this repository ships.

---

## Accessibility of the first frame (FR-019, SC-005)

The prerendered frame is a frame a Commander sees, so it carries the same
obligation as every other: WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1,
2.4.1, 2.4.3, 2.4.7 and 2.4.11.

What is new is _when_ the scan runs. Today axe runs against the settled page. FR-019
asks it to also run against the document before takeover — a state that did not
previously exist. `e2e/prerendered-first-frame.spec.ts` scans with script
execution disabled, across the ten projects.

Two things the first frame must get right on its own, with no script:

- **One rendered `<h1>`, naming that address's subject.** The shell draws two bar
  compositions and hides one with `display: none`
  (`app-frame.scss:318-324`), so a hull's document carries two `<h1>` elements in
  markup — the return bar's, naming the hull, and the identity block's, naming the
  catalogue. Exactly one is rendered and exactly one is in the accessibility tree
  at any width, which is what axe scans and what this already gets right. For a
  reader that applies no CSS the rule is document order: **the first `<h1>` names
  the address's subject**, and it does, because the narrower composition's bar
  comes first in the template (`app-frame.html:109` before `:154`). The FR-020
  gate asserts it rather than trusting template order to stay that way.
- `html[lang]` and `dir` correct for bundled English, so a screen reader reading
  the document before takeover announces it in the right language.
