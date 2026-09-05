# Phase 0 Research: Start Page

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-09-04

The spec carried no `[NEEDS CLARIFICATION]` into planning — its one open question was ruled
on before this phase. What follows are the decisions this plan had to make about how the
existing application absorbs a new entry point.

---

## Decision 1 — The root stops being a redirect and becomes a published address

**Decision**: `''` gains a component, a title key and a description key in `app.routes.ts`.
It leaves `UNLISTABLE_ROUTES` in `scripts/check-interface-foundations.mjs`, joins
`STATIC_ADDRESSES` in `scripts/search/published-addresses.mjs`, and `fileFor` in
`scripts/publish-static-routes.mjs` maps it to `index.html`. `public/sitemap.xml` is
regenerated and advertises `https://navbeacon.app/` for the first time.

**Rationale**: `UNLISTABLE_ROUTES` holds `''` and `'**'` with the comment "a redirect and a
wildcard are not addresses". That was true and stops being true here. The root is now the
one address that describes the product rather than one of its tools, which is the address a
search for "Nav Beacon" should return — and today the sitemap advertises three tool addresses
and forty-eight hulls, and not the product.

`src/index.html` already carries the root's canonical (`https://navbeacon.app/`), its
`og:url` and the site card, and its own comment says every phrase in it "is the English
default for the screen the application opens on". That screen changes, so those phrases
change with it. Mapping the root to `index.html` in `fileFor` means the publisher writes the
root's head into the file that already answers the root, through the same `documentFor`
substitution every other address goes through — which "refuses rather than adds", so a head
tag the substitution cannot find fails the build rather than silently publishing the old
sentence.

**Alternatives considered**:

- _Leave `''` unlistable and change only `index.html`'s wording._ Fewer moving parts, but
  the gate would never reconcile the root's committed head against the message keys the
  running application resolves — which is exactly the drift `documentTitleParity` and the
  checker exist to prevent, and FR-016 would be unverified.
- _Write the root as `index.html` copied to some other file._ There is no other file: Pages
  serves `/` from `index.html`, and a directory document would answer 301 to itself.
- _Special-case the root inside `main()` and skip publishing it._ A branch that says "this
  address is not published" in the script whose whole job is publishing addresses, to avoid
  an idempotent write. `fileFor` returning a name is the same change with no branch.

---

## Decision 2 — The tool registry grows, and grows in one place

**Decision**: `ToolRecord` in `src/app/features/shared/app-navigation.ts` gains
`summaryKey`, `shortSummaryKey` and `subjectsKey`. `AppNavigation` gains a `catalogue()`
reading that resolves all three for every tool. `tools(currentPath)` is untouched.

**Rationale**: FR-004 requires the entry point and the tool bar to read one registry, and
the canvas says the same in its own note about the tool grid and the tabs. The registry
already exists, already holds the identity, the name and the address, and already carries
the comment explaining that a tool the application gains appears everywhere at once. Adding
a second list for the entry point's copy would be the drift both the file and FR-004 warn
about.

`catalogue()` is separate from `tools()` rather than an argument to it because the two
answer different questions. `tools()` reports which tool is current and is asked on every
navigation; `catalogue()` reports what the tools are and is asked once, by one screen. The
current tool is meaningless to the entry point — FR-010 says none is current there — and
threading a flag through the reading every screen calls would put the entry point's concern
in the tool bar's path.

**Alternatives considered**:

- _One reading with an option._ Rejected above: it makes every caller pay attention to a
  distinction only one caller has.
- _A separate `TOOL_COPY` map keyed by tool id._ Two lists to keep in step, which is what
  FR-004 forbids and what a missing entry would silently pass.
- _Put the copy in the locale catalogue only, keyed by convention (`tools.${id}.summary`)._
  Convention-keyed lookups defeat the `MessageKey` type, so a tool added without copy would
  reach the screen as a missing key rather than failing to compile.

---

## Decision 3 — Which of the two descriptions is on screen follows the existing composition modes

**Decision**: the compact mode (`$mode-compact-max`, below 48rem) draws the short
description and no subject list; the medium and wide modes draw the fuller description and
the subject list. Both forms are rendered into the document and one is hidden by the
stylesheet, rather than one being selected in TypeScript from a measured width.

**Rationale**: FR-018 says the choice follows the composition mode the application already
names, and `src/styles/_responsive.scss` names three. No new threshold is introduced, so
nothing here can disagree with the rest of the shell about where a layout folds.

Hiding in CSS rather than branching in TypeScript is what keeps FR-019 testable and the
component honest. A width read in TypeScript is a measurement — the `ResizeObserver` and
container-query lessons already recorded for this repository apply — and it would make the
card's output depend on when it was rendered. A media query is declarative, changes with the
viewport without a re-render, and is what the end-to-end suite can assert on directly.

The hidden form must be hidden from assistive technology too, not merely visually: a screen
reader that read both would announce each tool's description twice, which is a worse failure
than either form alone. `display: none` in the media query, not the `visually-hidden` mixin.

**Alternatives considered**:

- _A container query on the card._ The card is not deciding this; the page is. Two cards
  side by side at 1440px and one card per row at 390px are the page's grid, and a card that
  chose its own copy from its own width would draw the short form in a narrow column at
  desktop, where the fuller form fits the page perfectly well.
- _One form, selected in TypeScript from a viewport signal._ Rejected above.
- _`hidden` attribute toggled by a media-query listener._ The same measurement, spelled with
  more machinery.

---

## Decision 4 — The attribution is the manifest's exact text, through the component that already carries it

**Decision**: the footer renders `helpManifest.disclaimer.exactText` through
`edsb-legal-excerpt`, with `language` set to the manifest's `disclaimer.language`. No new
string, no locale key, no re-typing.

**Rationale**: the text is already in the repository, generated into
`src/app/platform/build/help-manifest.generated.ts` from `LICENSE` with a `sha256` and a
`byteLength` beside it, and `LegalExcerpt` exists precisely to reproduce someone else's words
as text rather than markup and to mark the language they were written in. Constitution IV
and VI both point at reuse here: a second copy could drift from the licence file, and
translating it would be this application editing a notice it is only carrying.

The canvas's own footer text stops at "was involved in the making" without the closing
"of it." That is the canvas quoting loosely. The document is the record, so the manifest's
text ships and the canvas's rendering of it does not.

**Alternatives considered**:

- _A new `home.attribution` message key._ A translated copy of an untranslatable notice, and
  a second place for it to go stale.
- _A link to the licence surface instead of the text._ The canvas draws the statement, not a
  link to it, and the statement is the obligation.

---

## Decision 5 — The `CH` chip and the `⋯` overflow marker are not built

**Decision**: neither is added. The entry point is built against the tool bar as it stands.

**Rationale**: confirmed by the Commander on 2026-09-04 — neither exists in the shell today.
Independently, each fails a standing rule: the chip reads as an account, which constitution
I forbids outright, and the marker stands for tools that do not exist, which is what
011/FR-028 rules out. The canvas's own closing note says the top bar is carried over from
the builders, so what is carried over is the bar that is built.

**Alternatives considered**: none. This is a confirmation, not a choice.

---

## Decision 6 — The end-to-end suite is audited rather than swept

**Decision**: each of the twenty-one `goto('/')` call sites across eleven spec files is read
and classified — indifferent to where it lands, or meaning the shipyard — and only the
second kind is changed to `/ships`. No global find-and-replace.

**Rationale**: the two kinds are not distinguishable by the call itself. `offline.spec.ts`
opening `/` to prove the application starts without a network is indifferent and should now
prove it about the entry point, which is the screen a Commander actually opens first.
`ship-catalogue.spec.ts`-shaped assertions that follow a `goto('/')` with a hull expectation
mean the shipyard and must say so. A sweep in either direction silently changes what a test
is about, and the ones that keep passing afterwards are the dangerous half.

`app-shell.spec.ts`, `screen-reader.spec.ts` and `reflow.spec.ts` are the files to read
first: they carry three call sites each and they assert about chrome that is now drawn over
a different screen.

**Alternatives considered**:

- _Leave `''` redirecting and give the entry point its own address._ This is the feature
  inverted: the product's address would still open a tool, and FR-001 says it must not.
- _Replace every `goto('/')` with `goto('/ships')`._ Preserves every existing assertion and
  leaves the new entry point untested by everything that used to exercise the shell.

---

## Decision 7 — `edsb-tool-card` is a new design-system component

**Decision**: one new component under `src/app/ui/components/tool-card/`, declared in the
preview manifest with its states, rather than markup styled inside `start.page.scss`.

**Rationale**: constitution VII says a screen that needs something the system does not have
extends the system, and that a one-off style inside a screen is the drift the principle
exists to prevent. Nothing existing fits: `hull-summary-card` is a definition list of hull
facts with a selection output, and `saved-build-card` is a record row with a subject and a
timestamp. Both are about a domain object; neither is a link that presents a destination.

**Alternatives considered**:

- _Reuse `edsb-panel`._ A panel is a named region with a heading, not an activatable link,
  and making it one would put an anchor inside a `region` landmark named by the same words.
- _Style the anchors in the page._ The one-off principle VII names.

---

## Decision 8 — The entry point is lazy-loaded like every other route

**Decision**: `''` uses `loadComponent`, as `/ships`, `/build` and `/equipment` do. It is not
folded into the initial bundle.

**Rationale**: this is the one route where the question is worth asking, because it is the
route most first visits land on and a lazy chunk is a second request before the first
content. It stays lazy anyway, for two reasons.

The screen is small — a heading, a line, two cards and a quoted paragraph — so the chunk it
adds to the initial bundle would be paid by every deep link into `/build` and `/equipment`
as well, and the initial budget (500kB warning, 1MB error) is the shared cost this
application manages. Eager-loading the landing page to save one request on the landing page
is a trade that charges everyone else.

And the thing a first visit most needs before script runs is already there without any
bundle: `src/index.html` carries the entry point's title, description and card after this
feature, so a crawler and a link preview read the right sentence whether or not the chunk
has arrived.

**What this does constrain**: the screen must not defer its own text behind anything further.
Its strings are in the locale catalogue, its attribution is a compiled constant, and its tool
list is a source literal — nothing on it waits on a fetch, so once the chunk lands the screen
is complete. A future addition that fetched something would make the first screen a
Commander sees the one that waits, and would need this decision revisited.

**Alternatives considered**:

- _Fold the route into the initial bundle._ Rejected above: it charges every other entry
  point to speed up one.
- _Preload the chunk._ A preload hint is a request either way, and Angular's own router
  preloading would fetch every lazy route, which is the opposite of the budget's intent.

---

## Decision 9 — `anyComponentStyle` headroom

**Decision**: the card's styles live in `ui/components/tool-card/tool-card.scss` and the
page's layout in `features/start/start.page.scss`, kept as two small stylesheets rather than
one.

**Rationale**: the `anyComponentStyle` budget is 4kB warning, 11kB error, per component
stylesheet, and it is what a region-stylesheet change trips first in this repository. Two
stylesheets that each do one job stay far below it; one that carried both the grid and the
card would be the shape that grows into the ceiling. Nothing clever is needed here — this is
recorded so the next change knows the constraint was considered rather than missed.
