# Research: Prerendered Documents

**Feature**: 015 | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

Every decision below was reached by running the thing, not by reading about it. A
throwaway spike on this checkout prerendered `/`, `/ships` and `/ships/Adder`
with Angular 22.1.5, and the findings are recorded as measurements. The spike was
reverted; nothing it wrote is in the branch.

## Summary of the spike

`pnpm exec ng build` with a prerender configuration exited 0 and wrote real
documents. `dist/navbeacon/browser/ships/Adder/index.html` carries the hull's
manufacturer, landing-pad size, maximum speed, base shield, hull mass, crew, mass
lock, hardpoint counts and price as text in the body, with no script executed.
**FR-001 and FR-002 are achievable as specified.** Two defects had to be fixed to
get there, and both are recorded below as decisions 5 and 6.

---

## Decision 1: Angular's own prerenderer, not a bespoke render step

**Decision**: Use `@angular/build`'s prerender support. Add `@angular/ssr` and
`@angular/platform-server` as dev dependencies and `src/main.server.ts` as a
build-time entry point.

**Rationale**: It renders the real application through the real router and the
real DI graph, so a document cannot drift from what the application would show.
The spike proved it produces the required content.

**Alternatives considered**:

- **Render under jsdom in a script.** `jsdom@^28` is already a dev dependency and
  the existing `documentFor`/`fileFor` machinery could write the output. Rejected:
  it would need its own bootstrap, its own router simulation and its own idea of
  when the application has settled. That is a second renderer to keep true to the
  first, and constitution II's reasoning about parallel copies applies to
  behaviour as much as to data.
- **Hand-write hull documents from the package.** Rejected outright: a second
  presentation of package data, diverging the moment a component changes.

**Cost**: `@angular/ssr` and `@angular/platform-server` enter the dependency set.
Neither ships to a Commander — see decision 3.

---

## Decision 2: `prerender.routesFile`, and no `outputMode`

**Decision**: Configure the build with `server` and
`prerender: { routesFile: <generated>, discoverRoutes: false }`. Do **not** set
`outputMode`.

**Rationale**: This is the only configuration that lets the address list stay in
one place. `discoverRoutes: false` means the routes file is the whole set, so the
50 content-bearing addresses are generated from the same
`scripts/search/published-addresses.mjs` the sitemap and the policy checker
already read (FR-006, FR-021). The builder joins each line with the configured
`baseHref`, so the sub-path preview build works with no extra handling.

**Why not `outputMode: 'static'`**, which reads like the obvious choice and shares
the constitution's wording — because it silently discards the routes file.
`node_modules/@angular/build/src/builders/application/options.js:116-126`:

```js
if (options.outputMode) {
  if (options.prerender !== undefined) {
    context.logger.warn('The "prerender" option is not considered when "outputMode" is specified.');
  }
  options.prerender = !!options.server;
```

With `outputMode` set, route selection moves into an `app.routes.server.ts` using
`RenderMode.Prerender` and `getPrerenderParams`. That would enumerate the 48 hulls
a second time, in application source, and the policy checker would then have two
address definitions to reconcile instead of one. The repository's existing rule —
one derived address list, gated — is worth more than matching a config key's name.

**Verified**: with no `outputMode`, `ignoreServer` is true
(`options.js:177-179`), so **no server bundle is written to the output**. The
server entry is a build-time renderer, never a deployed artifact. This is what
makes the configuration honest against constitution I and 9.1.0.

---

## Decision 3: `src/main.server.ts` must pass a `BootstrapContext`

**Decision**: The server entry is

```ts
export default (context: BootstrapContext) => bootstrapApplication(App, config, context);
```

**Rationale**: Angular 22 requires it. Without the third argument the spike failed
every route with `NG0401: Missing Platform: This may be due to using
bootstrapApplication on the server without passing a BootstrapContext`. Recorded
because the older two-argument form is what most published examples still show.

---

## Decision 4: Angular's output layout conflicts with this repository's, and the build must correct it

**Decision**: A post-build step moves each prerendered `<route>/index.html` to
`<address>.html`, matching what `scripts/publish-static-routes.mjs` writes today.

**Rationale**: The prerenderer writes `<route>/index.html` unconditionally —
`node_modules/@angular/build/src/utils/server-rendering/prerender.js:148`:

```js
const outPath = stripLeadingSlash(posix.join(routeWithoutBaseHref, 'index.html'));
```

The spike produced exactly that: `ships/index.html`, `ships/Adder/index.html`.
That is the layout this repository rejects, for a reason recorded twice
(`publish-static-routes.mjs:11-14` and its test at
`publish-static-routes.test.mjs:84-89`): GitHub Pages serves `/ships` from a
directory by answering **301 to `/ships/`**, which would make the one address the
sitemap and the canonical both advertise the one address that does not answer 200. `scripts/serve-production.mjs:40-80` mirrors Pages' resolution, so the
end-to-end suite would catch it.

**Alternatives considered**:

- **Advertise `/ships/` with a trailing slash.** Rejected: it changes addresses
  that are already published, already in the sitemap and already indexed.
- **Accept the redirect.** Rejected: it re-creates the problem feature 011 fixed,
  by a different route.

---

## Decision 5: The application initializer must not run during prerender

**Decision**: Guard the retention sweep with
`isPlatformBrowser(inject(PLATFORM_ID))`.

**Rationale**: This is the defect that blocked every route in the spike, including
`/`. The chain is entirely in `app.config.ts`:

```
provideAppInitializer(() => inject(RetentionService).sweep())
  → RetentionService injects TabOwnershipCoordinator
    → field initializer `pageNonce = this.#uuid.create()`
      → UuidAdapter, whose #crypto is inject(DOCUMENT).defaultView?.crypto
        → throws: "This browser offers no cryptographic random source…"
```

`UuidAdapter` throwing is correct and must not change: constitution IV forbids
fabricating a value, and a fabricated identity would collide across records. The
error is that a browser-only concern runs at all. The sweep expires records held
in `localStorage`; with no storage there is nothing to sweep, so not running is
the right behaviour rather than a workaround.

**A finding about the guard itself.** The first attempt guarded on
`inject(DOCUMENT).defaultView === null` and did not work: the prerender DOM
emulation **does** provide a `defaultView`, but it carries no `crypto`. Every
existing adapter in `src/app/platform/browser/` guards on `defaultView`, which is
the right guard for a unit test under jsdom and the wrong one for a prerender
pass. `isPlatformBrowser` is the distinction the platform actually offers, and
this feature introduces it to the repository for the first time.

**Consequence for the plan**: `platform/browser/` gains a small, injectable
statement of "is this a browser", so no component reaches for `PLATFORM_ID`
directly and the concept has one home (constitution III).

---

## Decision 6: `sticky-banner.ts` is the one file that measures on every prerendered page

**Decision**: Give it a `DOCUMENT`-injected view and defer its first measurement
to `afterNextRender`, so a prerendered document carries neither of its host
bindings and the browser supplies both after first paint.

**Rationale**: `observeBanner` (`sticky-banner.ts:53-88`) runs from an effect
created in `AppFrame`, so it runs on every route. It reads bare globals —
`window.innerHeight` (`:68`), `window.addEventListener` (`:83`) and, through
`stackableMinimum()`, `getComputedStyle(document.documentElement)`
(`short-viewport.ts:32`). Under prerender it logged
`TypeError: element.getBoundingClientRect is not a function` four times. The build
still exited 0 because the prerenderer catches component errors, which makes this
the dangerous kind of defect: it does not fail the build, it just serves a
document rendered from a broken measurement.

**What it actually serialises, measured rather than assumed.** `measure()` reads
`element.getBoundingClientRect().height` on its first line
(`sticky-banner.ts:69`), so the throw happens before either signal is written.
`released` keeps its initial `false` and `height` keeps its initial `null`, and
`AppFrame`'s two host bindings (`app-frame.ts:185-186`) therefore emit nothing —
no `frame--released` class, no `--ednb-layout-bar-height`. The generated document
is, by luck, indistinguishable from an unmeasured one.

**Why it must still be fixed.** By luck is the problem. The emulation's behaviour
is not a contract: an emulation that returned a zero-height rect instead of
throwing would make `0 - 0 < stackableMinimum()` true and ship
`class="frame--released"` and `style="--ednb-layout-bar-height: 0px"` — a
measurement the build never made, which the browser then contradicts. And an
effect that throws four times per document across 50 documents is noise a build
log cannot distinguish from a real regression. The guard makes the correct outcome
the intended one.

**Why the visible risk is small either way.** Both bindings drive `position:
sticky` offsets, `max-block-size` and `scroll-margin`, never normal flow, and
`sticky → static` does not reflow. So even the bad case costs close to nothing to
look at. But FR-009 is written as "no content moves", not "little content moves",
and a document that states a measured value it did not measure is not something
this repository ships.

**Both fix patterns already exist here**: `element-size.adapter.ts:28` for the
injected view, `bench-composition.ts:91-94` for the `afterNextRender` deferral —
the latter with a comment describing precisely the flash it exists to avoid.

---

## Decision 7: Everything else on the three routes is already viewport-agnostic

**Decision**: No composition work is needed for FR-010 beyond decision 6.

**Rationale**: This was the feature's largest assumed risk and it is not real. On
`/`, `/ships` and `/ships/:hull`, every composition switch is a media query over
markup that contains **both** alternatives, so one document is correct at every
viewport with no script:

| Switch                    | Where                                     | Mechanism                                      |
| ------------------------- | ----------------------------------------- | ---------------------------------------------- |
| Catalogue table vs. cards | `responsive-catalogue-view.scss:7-45`     | `medium-up`, both in DOM, other `display:none` |
| Catalogue rail vs. sheet  | `ship-catalogue.page.scss:81-137`         | `wide-up` / `below-wide`                       |
| Hull inspector vs. sheet  | `hull-detail.page.scss:27-33, 239-265`    | `below-wide`                                   |
| Shell layered bar         | `app-frame.scss:322-324, 331-380`         | `below-wide`, always rendered                  |
| Shell folded actions      | `app-frame.scss:407-410, 448-470`         | `bar-folded`, both rendered                    |
| Start page                | `start.page.scss:78`, `tool-card.scss:76` | `medium-up`                                    |

`start.page.ts` and `hull-detail.page.ts` measure nothing at all.
`ship-catalogue.page.ts` calls `observeRestingReads()`
(`wide-composition.ts:66-78`), whose result reaches only an `aria-label` and event
behaviour — no box changes — and which is already guarded for a renderer with no
`matchMedia`, with a comment naming prerendering.

The measurement-heavy code — `outfitting/composition.ts`, `outfitting/manifest.ts`,
`equipment/bench-composition.ts` — belongs to the two benches, which FR-018 does
not generate.

---

## Decision 8: The service worker must be switched to `freshness`, or repeat visits never see a document

**Decision**: Set `"navigationRequestStrategy": "freshness"` in `ngsw-config.json`.

**Rationale**: This resolves FR-014, and without it the feature does not work for
anyone who has visited before.

Angular's service worker answers a _navigation request_ from the cached
`manifest.index` — `/index.html` — rather than from the network. The default
`navigationUrls` is `["/**", "!/**/*.*", "!/**/*__*", "!/**/*__*/**"]`, and
`/ships/Anaconda` has no dot in its last segment, so it matches. The default
`navigationRequestStrategy` is `performance`, which is cache-first. So: **first
visit gets the prerendered document from the network; every later visit gets the
cached shell.** There is no `navigationUrls` anywhere in this repository today
(`grep` finds none), so the defaults apply.

A second, independent reason the current arrangement cannot work: `ngsw.json` is
generated by `ng build`, and anything written afterwards is absent from the
worker's hash table. That is already true of every `<address>.html` today.

`freshness` makes navigations network-first and keeps the cached index as the
offline fallback, so FR-013 and SC-006 hold.

**Alternatives considered**:

- **Do nothing and declare the cached shell the winner.** FR-014 permits stating a
  rule, and this would be a legal answer. Rejected: it would mean a returning
  Commander keeps today's empty first frame, which gives up FR-008 and SC-004 for
  the people who use the application most.
- **Custom `navigationUrls` excluding `/ships/**`.** Rejected: those navigations
  would bypass the worker entirely and break offline, failing
  `offline-privacy.spec.ts:66-77` and constitution I.

**Cost**: one network round-trip per navigation while online, and a deliberate
edit to `scripts/check-service-worker-ownership.test.mjs`, which pins the config's
exact shape (`:59-69`, `:89-101`).

---

## Decision 9: The root's document stays `index.html`; the fallback moves off it

**Decision**: The root's prerendered document is written to `index.html`, because
that is the only file `/` resolves to. The service worker's navigation fallback
and `404.html` move to `index.csr.html`, the content-free shell Angular already
emits.

**Rationale**: This is the trap that decision 8 alone does not close, and it is
the most consequential finding in this research. The first draft of this decision
got the direction wrong — it proposed moving the root's document instead — and
that cannot be built, which is why the reasoning is spelled out here.

`index.html` is three things at once today: (a) the file Pages serves for `/`, (b)
the app-shell asset group's cached file (`ngsw-config.json:10`), and (c) the
worker's navigation fallback for **every** address. It is also (d) the template
`publish-static-routes.mjs` copies to `404.html` (`:192`). If the start page's
body is written into it, a repeat or offline visit to `/ships/Anaconda` paints
**the start page's content**, which Angular then replaces with hull content — a
visible content change and a probable reflow, a direct FR-009 and SC-003 failure
caused by prerendering the root rather than the hull.

Today this is invisible only because every body is `<app-root></app-root>`.

**(a) cannot move.** Pages resolves `/` to `index.html` and to nothing else, and
`fileFor` says exactly that in a comment (`publish-static-routes.mjs:169-171`).
Writing the root's document elsewhere would leave `/` answering with a shell while
a file no reader requests carried the content — losing FR-001 for the root and
gaining nothing.

**(b), (c) and (d) can.** The spike showed Angular emits `index.csr.html`, 5,541
bytes, a content-free client-render shell — essentially today's `index.html`. So
the fallback points at that, the app-shell group prefetches that, and `404.html`
is copied from that. Three edits, all in files this feature already touches, and
they leave `/` answering correctly.

`404.html` is **not** unaffected, contrary to what a first reading suggests. It is
copied before the substitution loop, so it never inherits another address's
_head_ — but its source is `index.html`, whose _body_ this feature fills. Pages
serves `404.html` for every unmatched address, so leaving the copy as it is would
state the start page's content under every address that has no document. That is
the same trap as the fallback, reached through the host instead of the worker.

The journey's own static server had to follow the host. `scripts/serve-production.mjs`
stands in for Pages, and it fell unmatched addresses through to `index.html`
because that used to be the shell. Left alone it served `/ships/NotAShip` the
start page's content — a document the deployment never serves — and the offline
journey's assertion that no frame carries the start page failed on it in every
Firefox project. It falls through to `404.html` now, which is what Pages does, with `index.html`
behind it for the two outputs that have no `404.html`: the development build,
which prerenders nothing, and the preview application. For those two the
`index.html` it falls through to is still the body-less shell it always was.

Settled in [contracts/address-set.md](./contracts/address-set.md) §2, §3 and §5.

---

## Decision 10: Documents are large but cheap to serve

**Measured**, from the shipped build rather than from the spike. The spike's
figures were taken before hydration, the per-address head and the placement step;
these are the files a deployment actually uploads.

| Document                 | Raw     | Gzipped |
| ------------------------ | ------- | ------- |
| `index.html` (start)     | 60,684  | 11,753  |
| `index.csr.html` (shell) | 29,373  | 6,794   |
| `404.html`               | 29,373  | 6,788   |
| `equipment.html` (bench) | 29,313  | 6,860   |
| `ships.html`             | 261,802 | 19,623  |
| `ships/Anaconda.html`    | 293,215 | 22,779  |
| `ships/Sidewinder.html`  | 290,446 | 22,609  |

A hull document is large because `/ships/:hull` is a **child** of `/ships`, so it
legitimately contains the catalogue behind the inspector — that is what is on
screen at wide widths. 14.46 MB of raw HTML enters the Pages artifact across all
54 files, served at roughly 22 KB each compressed.

Every document is larger than the spike measured, and the shell most of all —
5.5 KB became 29 KB. That is the hydration payload of decision 15 plus the
per-address head, and it is the price of the takeover not blanking the page.

**The bundle**, measured against `e3b8a36`, the tree before this feature:

| Initial total | Raw       | Compressed |
| ------------- | --------- | ---------- |
| Before        | 516.79 kB | 122.68 kB  |
| After         | 547.99 kB | 132.27 kB  |

+31.20 kB raw and +9.59 kB compressed, all of it Angular's hydration and event
replay runtime. The `initial` budget warns at 500 kB and errors at 1 MB; the
build **already warned before this feature** at 516.79 kB, and still only warns.
Nothing here changes that verdict, and this feature is not where a budget the
application was already over gets renegotiated.

**Decision**: Accept it, and add no size gate. No existing gate measures HTML,
and about 1.1 MB of compressed HTML across the whole set is not worth a
mechanism.

---

## Decision 11: `/ships` has a content problem that is not about measurement

**Decision**: The prerendered `/ships` document states the catalogue in its
default order with no filter, and the plan must decide what the takeover does when
a returning Commander's session says otherwise.

**Rationale**: `CatalogueSessionStore` (`catalogue-session.store.ts:54-56, 82-95`)
calls `restore()` in its constructor and rehydrates `filters`, `sort` and `anchor`
from `sessionStorage`. A prerendered `/ships` shows all 48 hulls in
`DEFAULT_SORT`; a returning Commander's takeover can reorder and shorten that
list. Content moving after the first frame is exactly what FR-009 and SC-003
forbid, and no amount of composition work addresses it, because it is not a
composition problem.

This is the one place where the feature and an existing capability genuinely
conflict, and it needs a ruling rather than an implementation. Options, for the
plan to choose between: prerender the default and accept the re-sort as a stated
exception; suppress session restore on a first frame that came from a document;
or render the catalogue in a way that makes the reorder invisible. Recorded here
as an open design question. **Resolved** in the spec's Clarifications for
2026-09-06 and bounded by FR-009a: the stored view wins, it is applied in the
takeover frame itself, a Commander with no stored view sees no change at all, and
nothing else may claim the exception.

---

## Decision 12: The dependency pin moves together

**Decision**: `@angular/ssr` and `@angular/platform-server` are added at the same
version as the rest of Angular, and the Angular pin moves with them if needed.

**Rationale**: The spike installed `@angular/ssr@22.1.7` against Angular 22.1.3
and pnpm reported unmet peers:

```
✕ unmet peer @angular/compiler@22.1.5: found 22.1.3
✕ unmet peer @angular/platform-browser@22.1.5: found 22.1.3
```

The build worked anyway, but shipping a knowingly unmet peer set is not something
to leave to chance. The pin move is a normal reviewed commit and belongs in the
first task, not discovered halfway through.

---

## Decision 13: Where the verification gates go

**Decision**: FR-020's package comparison goes in `scripts/*.test.mjs`; the
"a reader that runs no script sees content" assertions extend
`e2e/search-published.spec.ts`; FR-021's content-bearing registry goes in
`published-addresses.mjs` and is reconciled in `searchMetadataViolations`.

**Rationale**: Each is placed where the thing it checks already lives.

- `scripts/*.test.mjs` is auto-globbed by `pnpm run test:scripts`
  (`package.json:10`) and **runs in CI** (`ci.yml:122-123`), before the build. It
  can import the package directly, which is what comparing a document to the
  package requires.
- `e2e/search-published.spec.ts` already fetches addresses with
  `page.request.get(..., { maxRedirects: 0 })`, bypassing the service worker
  entirely, so it tests the files on disk. It is already the contract test for
  what an address answers with; the body is the same contract's next clause.
- `published-addresses.mjs` is already the one module all three consumers read.

**The constraint this raised, and how it was answered.** `e2e:offline` — where
the production documents exist — was **not run by CI** (`ci.yml:8-12` named it a
contributor's gate). SC-005 asks for the accessibility scan over the first frame
across the ten projects, so leaving it there would have made the feature's
central gate a thing a contributor could forget.

The answer, decided on 2026-09-06: **`e2e:offline` runs in CI**, in a job of its
own (`e2e-production`), and `deploy` gates on it. It cannot join the sharded
matrix, because a service worker and the documents each address answers with
exist only in a built deployment and the matrix is served by development
servers. It is not sharded itself: the six specs are 23 tests, and a shard would
repeat the production build for every slice.

`e2e:timing` stays a contributor's gate, and not for cost. It measures under CPU
throttling, and what makes that measurement honest is that nothing else runs
beside it (`e2e/coverage-ledger.ts`, "The one measurement project outside the
matrix"). A shared runner cannot promise that, so a budget asserted there would
fail on a noisy neighbour and report nothing about the code that was pushed.

**Two existing assertions to watch**:

- `offline-privacy.spec.ts:61` asserts exactly 48 visible `[data-hull-symbol]`
  nodes. A prerendered catalogue plus a hydrated one is a double-count hazard.
- `help-offline.spec.ts:186` asserts zero non-font network requests while opening
  help. Anything a prerendered document adds — a stylesheet, a hydration payload —
  fails it.

---

## Decision 14: Keep the application version out of prerendered bodies

**Decision**: No prerendered body may render the application version.

**Rationale**: `scripts/resolve-build-version.mjs` stamps the patch number in CI
only, immediately before `ng build` (`ci.yml:125-141`). A prerendered body
rendering the version would bake a CI-only value into static HTML, diverging from
a locally built document and from FR-007's ban on runtime environment
configuration in a document. The version belongs where it already is: resolved by
the running application.

---

## Decision 15: Hydration is not optional, and neither is event replay

**Found during implementation.** The spike did not ask what the application does
with a document it did not create, and the answer is: destroys it.

**Decision**: `provideClientHydration(withEventReplay())`.

**Rationale**: Without hydration Angular treats a generated document as debris. It
empties `<app-root>` and renders the application into it from nothing. Measured on
`/ships/Anaconda` against a production build: the hull's figures painted at 39ms
(9,733 characters of readable text), the page was down to 1,747 at 181ms, and the
figures were back at 1236ms. A second of blank page in the middle of what a
Commander was already reading — precisely the content that "disappears and
returns" FR-009 forbids and SC-003 measures. With hydration the same three routes
were never wiped and logged no hydration error.

`withEventReplay()` answers the second half. A generated document paints every
control before any script has run, so a Commander can press one in that window.
Without replay the press lands on markup with no listener behind it and nothing
happens at all — a control that looks interactive and is not, which is a worse
first frame than the empty shell this feature replaced.

**What replay costs, and who pays it**: a press held by the replay contract is
delivered when the takeover reaches that node, not when it is made. Measured on
the CI-sized container, `/ships` completes its takeover about 2.0–2.6s after
`load`, so a press at 600ms opens the layer at ~2.6s. That is inside what a
Commander experiences as one slow page and outside a five-second end-to-end
assertion measured from the press, which is what made `help-offline` fail one
parallel run in three. The journeys were corrected rather than the application
(T006c): a journey about the running application waits for the takeover, and the
first frame's own behaviour is asserted by its own journey.

**Alternatives considered**: leaving hydration off and accepting the wipe —
rejected, it fails FR-009 outright; `withIncrementalHydration()` and `@defer
(hydrate on …)` to shorten the interval — rejected for this feature, it needs
`@defer` blocks the screens do not have, which is the screen work the plan
excludes. It stays available if the interval ever becomes a complaint.

---

## Decision 16: Four more things move on the first frame, and none of them is the takeover's fault

**Decision**: fix each of the four at its own cause rather than relaxing what the
journey measures.

The takeover being invisible turned out to be four separate small defects, all of
them invisible before this feature because there was nothing on screen for them to
disturb:

| What a Commander saw                                                                                                | Why                                                                                                  | Fixed by |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| A second BETA chip at 155ms, gone at 1281ms, name 36px sideways                                                     | `betaFollowsTitle` asked a question with two true answers before the route had reported its identity | T006f    |
| All 48 catalogue rows jumping 16px for one frame                                                                    | `[class.field__label--hidden]` is a binding, and Angular re-initialises bindings on its first pass   | T006g    |
| The mobile hull bar re-composing 46px lower, 1.1s in                                                                | `frame--returning` follows `back()`, published from a lazily loaded component's effect               | T006h    |
| The whole hull inspector gone for one frame and back, and on a phone the hull sheet replaced by the whole catalogue | The router reached the outlet before the lazily loaded chunk, so it discarded the document's screen  | T006d    |

**Rationale**: every one of them is a real thing a Commander sees, and every one
would have been reported as "the prerendering flickers" rather than as what it is.
The pattern in three of the four is the same: **a class written into markup
survives the takeover, a class computed from state does not**, because state the
document could not have has not arrived yet. The fourth is the router, and its fix
is the one line that makes hydration's adoption reach a lazily routed screen at
all.

**What was not fixed, deliberately**: the web font. `font-display: swap` reflows
the page when the real face arrives, on this and on every other page, before and
after this feature. `optional` removes the reflow and was tried; it also renders
the fallback face on a cold load, which loses the typeface for the Commander who
has never been here — exactly the reader this feature is for. So the swap stays
and the journey does not measure it.

---

## Decision 17: What the first-frame journey may not measure

**Decision**: four things the recorder subtracts or waits for, each named.

**The document arrives in pieces.** A hull document is up to 293 KB and the
browser paints while it is still reading it: under eight parallel workers the
earliest samples hold a banner and 18 of 48 rows, and the page grows underneath
them. That is the download, not the takeover, and counting it would report every
run as a page that changed several times before anything had run. Frames carry
`parsed` (`document.readyState !== 'loading'`) and the movement assertions start
from the first frame that has it. Nothing is lost by this: a module script does
not execute until the parse is done, so every partial frame is by construction a
frame the application has not touched.

**The pending-illustration note retires.** The build renders every illustration in
its loading state, because a build has no image to wait for. In a browser the
picture arrives and the visually hidden line announcing the wait goes with it — 25
characters, the only text that ever leaves the page. That is the illustration
arriving rather than content disappearing, and the plate reserves its area at a
fixed ratio either way, so nothing moves. `RETIRING` in `e2e/first-frame.ts`
subtracts it before anything is measured.

**The typeface arrives after the page does.** The faces are same-origin subsets
declared `font-display: swap`, so a cold load paints in a system fallback and
re-lays itself out as each subset lands. Where the fallback and Barlow disagree on
metrics the page changes height doing it: Firefox at 1112px laid the catalogue out
ten pixels taller in the fallback, on `/ships` and `/ships/Anaconda` alike, and
Chromium — whose fallback happens to agree — showed nothing. It is not the
takeover: the same swap moves the same ten pixels on a document whose bundle is
blocked, and the application's own layout is the document's to the pixel
(measured: `main` is 2459px in the served document and 2459px after the takeover).

It cannot be subtracted after the fact, and the first attempt to tried.
`document.fonts.status` is one verdict over every face at once, so it still reads
`loading` long after the face that changed the metrics has landed — CI put the
movement at the fourth frame of a twenty-eight-frame window the flag called
undressed throughout. So the swap is put where it belongs instead, before the
application exists: the movement journey holds the bundle until the set reports
itself done with at least one face loaded (`openOnceTheTypefaceHasArrived`), and
measures from the last frame the document had to itself through every frame after
it. That is SC-003's sentence rather than a subtraction — what a Commander was
reading when the application arrived is where it stays — and a wipe-and-rebuild
cannot hide in the gap, because the frames are consecutive samples and a blanked
frame is itself one of the frames compared.

**The window can be shorter than the first paint.** On a static server on the same
machine the takeover can complete before the browser's first animation frame, so a
recorder looking for a pre-takeover frame finds none and reports the machine's load
rather than the product. The ordering claim — the subject painted in a frame the
application has not reached — is therefore made with the bundle held back half a
second, which is a slow connection and the case the window exists for. The
document and the takeover are unchanged; only the number of frames in between is.

---

## Decision 18: A German Commander's page gains something, and FR-011 was wrong about it

**Decision**: amend FR-011 and add FR-011a rather than suppress the disclosure.

FR-011 said the language replacement "MUST NOT add, remove or reorder anything".
Measured on `/ships` at `de-DE`, the German page carries **192 more elements** than
the English one: one `span.game-text__disclosure` inside every `ednb-game-text`,
reading "Wird in der ursprünglichen Sprache angezeigt, da dafür kein Text auf
Deutsch verfügbar ist." It is visible, subtle and compact — not visually hidden.

The requirement was wrong, not the application. Every hull, manufacturer and mount
name is published by the package in English only, and `GameText` exists to say so
whenever a value is shown in a language the Commander did not ask for. English has
nothing to disclose because English is the original, so the document carries none
of these and the German reading of it carries one per name. Suppressing them to
satisfy FR-011 would trade a spec sentence for a Commander not being told what
language they are reading.

**Rationale**: the exception is bounded and mechanical — exactly one note per
untranslated name, added, never removed, never reordering anything. The journey
subtracts precisely those spans and compares the two shapes; anything else the
takeover added would still fail.

**Alternatives considered**: rendering the disclosure into the English document as
an empty node so the shapes match — rejected, it puts a lie in 50 published files
to make a test easier; comparing only tag counts rather than the shape — rejected,
it stops detecting reordering, which is the thing FR-011 is actually about.

---

## Decision 19: The blocking initial navigation ships, and does not run in development

**Decision**: apply `withEnabledBlockingInitialNavigation()` outside development
only, the same shape as `provideServiceWorker({ enabled: !isDevMode() })`.

Angular disagrees with the option outright. `provideClientHydration()` registers
a detector that warns **NG05001, "found both hydration and enabledBlocking
initial navigation in the same application, which is a contradiction"**, and it
is right about a development server: there is no rendered document there, so
there is nothing for a blocking navigation to protect.

It is wrong about a production build, and the measurement says so. Removed, on
the shipped output:

| Address           | Width | Text across the takeover | `main`          |
| ----------------- | ----- | ------------------------ | --------------- |
| `/`               | 1440  | 884 → 871                | steady          |
| `/ships/Anaconda` | 1440  | 5015 → 4393              | steady          |
| `/ships/Anaconda` | 390   | 669 → 5577               | 1029px → 4857px |

The last row is the whole hull sheet being replaced by the catalogue for a
moment on a phone. Restored, every one of those becomes a single value.

**Rationale**: the detector is `ngDevMode`-only and never reaches a published
bundle, so this is not a warning being silenced — it is a configuration made to
say what it means. The takeover exists only where a document was rendered, and
`angular.json`'s development configuration already says the same thing about
prerendering itself (T006e).

**Alternatives considered**: making the three prerendered screens' routes eager
— rejected, it moves two large screens into the initial bundle to fix a timing
problem the router already has an option for; `withIncrementalHydration()` with
`@defer (hydrate on …)` — rejected for the reason decision 15 gives, it needs
`@defer` blocks the screens do not have.

---

## Decision 20: The document gate reads documents with a parser

**Decision**: `check-prerendered-documents.mjs` parses with `jsdom` rather than
matching HTML with regular expressions.

The gate was written with `<script[\s\S]*?</script>`, `<!--[\s\S]*?-->`,
`<[^>]+>` and `<body[^>]*>`. CodeQL's `js/bad-tag-filter` flags every one of
them as a high-severity defect, and it is not being pedantic: an attribute value
holding a `>` ends a tag early, `<!-->` is a comment that closes immediately,
and this gate reads 293 KB of exactly the markup those cases live in. A gate
nobody can believe is worse than no gate.

Two details the rewrite had to keep:

- **Text nodes are joined by a space, not concatenated.** `textContent` would
  read the catalogue's `<span>220</span><span>m/s</span>` as `220m/s`, and the
  gate would report a figure missing from a document that plainly states it. An
  element boundary is a word boundary, which is what the regexes were doing when
  they replaced each tag with a space.
- **`&amp;` joins `&` in the build prohibition.** The markup checked is now a
  parser's serialization, and a parser writes a bare `&` in an attribute back
  out escaped.

**Cost**: one parse per document, remembered, so the three readers share it. 6.4
seconds for a full pass over 52 documents and 65 seconds for the gate's own test
file, which runs it once per doctored case.

The same readers existed a second time, in `e2e/search-published.spec.ts`, and
they are gone the same way — through `e2e/served-document.ts`, which parses with
`DOMParser` in the browser the suite already has open. No `jsdom` there and
nothing installed: the document under test is HTML, a browser is what reads
HTML, and a `DOMParser` document runs no script and loads no subresource, so
what comes back is the file rather than a page that ran. The German case in
`prerendered-first-frame.spec.ts` reads the served document through the same
helper.

**Alternatives considered**: `parse5` directly, which is faster — rejected, it
is a new dependency and a hand-written text walk to save seconds in a gate that
runs once per build; suppressing the alerts — rejected, the query is right.

---

## Resolved unknowns

| Unknown at spec time                              | Resolution                                                                                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Can the first frame be correct at every viewport? | Yes, by construction — decision 7                                                                                                                              |
| Which Angular configuration?                      | `routesFile` + `server`, no `outputMode` — decision 2                                                                                                          |
| Does prerendering need a deployed server?         | No; `ignoreServer` emits none — decision 2                                                                                                                     |
| What breaks first?                                | The app initializer, then `sticky-banner.ts` — decisions 5, 6                                                                                                  |
| How is FR-014 answered?                           | `freshness`, plus a fallback and a `404.html` that move off `index.html` — decisions 8, 9                                                                      |
| Is the payload acceptable?                        | Yes, ~20 KB compressed per document — decision 10                                                                                                              |
| Anything the spec did not foresee?                | Yes — session restore on `/ships`, decision 11; hydration itself, decision 15; four more first-frame defects, decision 16; and FR-011 being wrong, decision 18 |
