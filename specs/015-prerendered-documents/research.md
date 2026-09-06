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

Settled in [contracts/address-set.md](./contracts/address-set.md) §2, §3 and §5.

---

## Decision 10: Documents are large but cheap to serve

**Measured**, from the spike:

| Document                  | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| `index.html` (start page) | 54,365  | 8,845   |
| `index.csr.html` (shell)  | 5,541   | —       |
| `ships/index.html`        | 272,283 | 17,204  |
| `ships/Adder/index.html`  | 302,196 | 19,884  |

A hull document is large because `/ships/:hull` is a **child** of `/ships`, so it
legitimately contains the catalogue behind the inspector — that is what is on
screen at wide widths. Roughly 14 MB of raw HTML enters the Pages artifact for 50
documents, served at about 20 KB each compressed.

**Decision**: Accept it, and add no size gate. The `initial` budget in
`angular.json` governs the JavaScript bundle and is unmoved; no existing gate
measures HTML. About 950 KB of compressed HTML across the whole set is not worth
a mechanism.

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

## Resolved unknowns

| Unknown at spec time                              | Resolution                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Can the first frame be correct at every viewport? | Yes, by construction — decision 7                                                         |
| Which Angular configuration?                      | `routesFile` + `server`, no `outputMode` — decision 2                                     |
| Does prerendering need a deployed server?         | No; `ignoreServer` emits none — decision 2                                                |
| What breaks first?                                | The app initializer, then `sticky-banner.ts` — decisions 5, 6                             |
| How is FR-014 answered?                           | `freshness`, plus a fallback and a `404.html` that move off `index.html` — decisions 8, 9 |
| Is the payload acceptable?                        | Yes, ~20 KB compressed per document — decision 10                                         |
| Anything the spec did not foresee?                | Yes — session restore on `/ships`, decision 11; and hydration itself, decision 15         |
