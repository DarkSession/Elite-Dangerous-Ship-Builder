# Search visibility

> **Asked for on 2026-08-27.** "Analyse the application and propose ways to optimize for search
> engines." The owner's answer to the scoping question was to write the analysis and implement the
> static subset of it: per-route title and description, Open Graph and Twitter cards, canonical
> links, `robots.txt`, `sitemap.xml`, a web app manifest and JSON-LD, with no change to how the
> application is built. This document is both halves — what was found, and which findings were
> acted on.

## What is actually being crawled

The application is a client-side Angular bundle behind a service worker, published to GitHub Pages
at `https://sb.edct.dev/` and served from `public/` plus the build output. Nothing is rendered on a
server. That single fact decides most of what follows.

Four addresses exist (`app.routes.ts`): `/ships`, `/ships/:symbol`, `/build` and `/builds`. `/`
redirects to `/ships`, and anything unmatched redirects there too. Every one of them is served the
same `index.html`, so before 2026-08-27 every address a crawler fetched carried:

- the same `<title>`, `Elite Dangerous Ship Builder`, with the route's own title written only after
  the bundle booted and the locale committed;
- no `<meta name="description">` at all, which leaves a search engine to invent a snippet from
  whatever text it can scrape;
- no canonical link, so the production site, every pull-request preview under
  `darksession.github.io/Elite-Dangerous-Ship-Builder-Preview/pr-*/` and the four routes that
  redirect to `/ships` were four flavours of the same page with nothing saying which one is the
  page;
- no Open Graph or Twitter card, so a link pasted into Discord — which is where a build link
  actually gets pasted — unfurled as a bare URL;
- no `robots.txt` and no `sitemap.xml`;
- no web app manifest, so the thing that is plainly an application was not installable and had no
  declared theme.

## Findings, ranked by what they cost

### 1. Every route was one document with one title _(fixed)_

The single most valuable metadata a search engine reads is the title and description of the page it
is on. A four-route site that says `Elite Dangerous Ship Builder` four times is one page as far as
ranking is concerned, and three of the four have no snippet to show.

Fixed by making the route's identity part of the same atomic commit that already publishes `lang`,
`dir` and the document title. `RouteTitleStrategy` now hands the locale store a title key, a
description key and the route's path; the store resolves both keys in the committed catalogue and
`DocumentAdapter` writes title, description, canonical, Open Graph and Twitter card in one pass.
The description is therefore in the same language as the title and the root `lang`, which is the
whole reason those writes were one commit in the first place (localization contract, "Candidate
validation and atomic publication").

`index.html` carries the English defaults for the crawler that reads the document and never runs
the bundle.

What that crawler gets, stated rather than implied. The deployment publishes one file per sitemap
route, and each is `index.html` with that route's canonical address and `og:url` substituted in —
so a crawler that runs nothing still reads `/ships` as `/ships` rather than as the root. Its title
and description are the application's, not the route's: resolving those before the bundle runs
means reading the message catalogue at deploy time, which is the build step the owner ruled out for
this pass. So the per-route title and description are the running application's alone. A crawler
that renders — Googlebot does — sees them; one that does not sees three distinct addresses under
one honest application title, which is a smaller loss than three addresses all claiming to be the
root. Closing it is the same generator that would list the hull pages, and it is recorded with them
under "Not done" below.

### 2. Nothing said which URL was the page _(fixed)_

Canonical links now name the production address of the route, resolved from one constant
(`SITE_ORIGIN` in `src/app/platform/browser/site-address.ts`) rather than from `location`. That is
deliberate and it is the one decision here worth arguing with:

- A canonical built from `location.origin` would make every pull-request preview canonical to
  itself, which is precisely the duplicate a canonical exists to collapse.
- Building it from a constant means a preview, a `ng serve` and the production site all say
  `https://sb.edct.dev/<route>`. On the two that are not production that statement is a lie about
  where the document is, and it is the useful lie: it points at the page that should rank.

The build payload lives in the URL fragment (001/FR-015), and a fragment never reaches a server and
never reaches the canonical. The path is taken from the router's own URL with query and fragment
stripped, so a shared build link canonicalises to `/build`, not to a million distinct addresses.

### 3. A link pasted anywhere unfurled as a bare URL _(fixed, minus the image)_

Open Graph and Twitter card tags now ship statically and are rewritten per route at runtime.

**The omission, named rather than buried:** there is no `og:image`. A card image is a 1200×630
raster and this repository has no logo, no wordmark and no design asset that could be cropped into
one — the only mark it owns is `favicon.ico`. Inventing one is a design decision, not a metadata
one, so `twitter:card` is `summary` rather than `summary_large_image` and the card renders as title
and description. Adding the image later is one asset and two tags.

### 4. Crawlers had no map and no rules _(fixed)_

`public/robots.txt` allows everything and names the sitemap. `public/sitemap.xml` lists the three
top-level routes.

**The trap under this one, found in review.** A sitemap is worthless if the addresses in it do not
answer. GitHub Pages serves a single-page application's deep links from `404.html` — with a 404
status — and a crawler drops a 404 whatever the body contains, canonical link and all. Every URL in
the sitemap would have been reported as an error and none of the per-route head above would have
counted for the three routes it was built for. The deployment now publishes each advertised route as
`<route>.html`, which Pages answers with a 200 and no redirect, alongside the `404.html` that still
catches everything else. `<route>/index.html` would have answered 301 to `<route>/`, which is the
same defect one step smaller: the address the sitemap and the canonical both name would still not be
the address that answers. The route list is read out of `sitemap.xml` rather than repeated: a fifth
copy of it would drift silently, because the site would keep working and only the crawl would
stop.

**The second omission, also named.** The sitemap does not list hull pages, and those are the
long-tail content: forty-odd `/ships/<symbol>` addresses, one per hull, each with real numbers on
it. It cannot list them by hand, because the set of hulls belongs to the Almanac and a hard-coded
list of hull symbols in this repository is exactly the private copy of package data that
constitution I forbids — it would keep working and would stop tracking the package at the next pin
move. Enumerating them correctly means a generator script that reads the installed package and
writes the sitemap, in the shape `pnpm run help:artifacts` already establishes. That is a build
step, and a build step was out of the scope the owner chose. It is the highest-value follow-up on
this page.

### 5. The application was not installable _(fixed)_

`public/manifest.webmanifest` declares the name, the short name, the description, the dark theme
colours taken from the token layer, and `display: standalone`. Both names are
`Elite Dangerous Ship Builder` (owner's ruling, 2026-08-27): `Ship Builder` is what the first
_screen_ is called, not what the application is called, and an installed icon captioned with the
screen name would be the one place the two are confused. Nothing else in the head names the
application in the short form either. Its `start_url`, `scope` and icon paths are relative, for the same reason the
locale catalogues' paths are: a preview is served from a sub-path, and a leading slash would look at
the host root.

**Third omission.** Its only icon is `favicon.ico`. A manifest wants at least a 192px and a 512px
PNG, one of them maskable, for a browser to offer installation. Same missing asset as the card
image, same one-line fix once it exists.

### 6. A search engine had to infer what the thing is _(fixed)_

`index.html` carries a JSON-LD `WebApplication` node: name, description, the production URL,
`applicationCategory: GameApplication`, `browserRequirements`, `isAccessibleForFree`, an `offers`
node priced at zero, and `inLanguage: [en, de]`. It is the one place that states in machine-readable
form what the previous six findings only imply.

## What was considered and deliberately not done

- **Prerendering or SSR.** The single highest-value change available, and explicitly out of the
  chosen scope. It is also not free: the application is client-side only by constitution, a
  prerender step would need the Almanac at build time and would produce four HTML documents to keep
  honest. Google executes JavaScript, and — now that each route answers 200 rather than 404 — will
  index the routes as they are; every other crawler sees the static head this change adds and
  nothing more.
- **`hreflang` alternates.** There is no per-language URL. The language follows the browser setting
  and nothing else (FR-017), so `en` and `de` are the same address and there is no alternate to
  declare. `og:locale` still reports which language the document was actually rendered in.
- **A `noindex` on previews.** Would need the build to know it is building a preview, which is a
  build change. The canonical pointing at production is the same de-duplication by another route,
  and it costs nothing.
- **Structured data for hulls.** A `Product`- or `Vehicle`-shaped node per hull would be game data
  restated in this repository's markup. The Almanac owns those values (constitution I); a generated
  hull sitemap is the right vehicle for hull-level search presence, not hand-written schema.
- **A per-route title and description in the published static files.** The deploy step substitutes
  each route's canonical address into its copy, which needs nothing but the address it already has.
  A title and a description need the message catalogue, and reading that at deploy time is the
  build step this pass excluded. It is the same generator the hull sitemap needs, and worth doing
  once, for both.
- **Keyword meta tags.** No search engine has used them in twenty years.

## Where the pieces live

| Concern                                                       | Owner                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Static head for a crawler that runs no script                 | `src/index.html`                                                         |
| One published file per route, canonical rewritten per route   | `.github/workflows/ci.yml`                                               |
| The production origin, and the canonical built from it        | `src/app/platform/browser/site-address.ts`                               |
| Every runtime write of title, description, canonical and card | `src/app/platform/browser/document.adapter.ts`                           |
| Which description belongs to which route                      | `src/app/app.routes.ts`, `RouteTitleStrategy`                            |
| The wording, in both shipped languages                        | `src/app/i18n/locales/*.json`                                            |
| Crawl rules, map and installability                           | `public/robots.txt`, `public/sitemap.xml`, `public/manifest.webmanifest` |
| That none of the above drifts apart                           | `searchMetadataViolations` in `scripts/check-interface-foundations.mjs`  |

The last row is the point. Four files now repeat the production origin and the route list, and a
route added without a sitemap entry, or an origin changed in one file and not the others, is a
silent regression that nobody would notice for months. The checker refuses it instead.

Where that gate actually stands is worth being exact about: `pnpm run policy` runs inside
`pnpm run check`, which this repository asks a contributor to run before proposing a change
(README, "Run `pnpm run check` before proposing a change"). The CI workflow does not run it — it
never has, for any of the eight checkers. What does run on every deployment is the deploy step's
own guards: it fails the run if the sitemap advertises no routes, if an address is not under the
declared origin, if a route would need a directory, or if the canonical substitution did not take.
So the four-file agreement is checked where a change is written, and the one-file-per-route
publication is checked where it is published. Putting `pnpm run policy` in CI as well is the
obvious follow-up, and it is a decision about every checker rather than about this one.
