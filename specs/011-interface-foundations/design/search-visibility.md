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

Four addresses exist (`app.routes.ts`): `/ships`, `/ships/:hull`, `/build` and `/builds`. `/`
redirects to `/ships`, and anything unmatched redirects there too. Every one of them is served the
same `index.html`, so before 2026-08-27 every address a crawler fetched carried:

- the same `<title>`, `Elite Dangerous Ship Builder`, with the route's own title written only after
  the bundle booted and the locale committed;
- no `<meta name="description">` at all, which leaves a search engine to invent a snippet from
  whatever text it can scrape;
- no canonical link, so the production site, every pull-request preview under
  `darksession.github.io/Elite-Dangerous-Ship-Builder-Preview/pr-*/` and the four addresses above
  were so many flavours of the same page with nothing saying which one is the page;
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

What that crawler gets, stated rather than implied. The build publishes one document per advertised
address, each carrying that address's own canonical, `og:url`, title, description and card — so a
crawler that runs nothing reads `/ships` as `/ships` rather than as the root, and reads it as the
catalogue rather than as the application in general. The second pass below is where the title and
the description joined the canonical there; what the running application writes and what the build
publishes are held equal, address by address, by `src/app/i18n/document-title.spec.ts`.

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

### 3. A link pasted anywhere unfurled as a bare URL _(fixed)_

Open Graph and Twitter card tags ship statically and are rewritten per route at runtime. The card
image and `summary_large_image` came with the second pass below.

### 4. Crawlers had no map and no rules _(fixed)_

`public/robots.txt` allows everything and names the sitemap. `public/sitemap.xml` lists every
address the application serves; the hulls joined it in the second pass below.

**The trap under this one, found in review.** A sitemap is worthless if the addresses in it do not
answer. GitHub Pages serves a single-page application's deep links from `404.html` — with a 404
status — and a crawler drops a 404 whatever the body contains, canonical link and all. Every URL in
the sitemap would have been reported as an error and none of the per-route head above would have
counted for the three routes it was built for. The deployment now publishes each advertised route as
`<route>.html`, which Pages answers with a 200 and no redirect, alongside the `404.html` that still
catches everything else. `<route>/index.html` would have answered 301 to `<route>/`, which is the
same defect one step smaller: the address the sitemap and the canonical both name would still not be
the address that answers. The route list is read out of `sitemap.xml` rather than repeated: a third
copy of it — `app.routes.ts` and the sitemap are the two — would drift silently, because the site
would keep working and only the crawl would stop.

### 5. The application was not installable _(fixed)_

`public/manifest.webmanifest` declares the name, the short name, the description, the dark theme
colours taken from the token layer, and `display: standalone`. Both names are
`Elite Dangerous Ship Builder` (owner's ruling, 2026-08-27): `Ship Builder` is what the first
_screen_ is called, not what the application is called, and an installed icon captioned with the
screen name would be the one place the two are confused. Nothing else in the head names the
application in the short form either. Its `start_url`, `scope` and icon paths are relative, for the
same reason the locale catalogues' paths are: a preview is served from a sub-path, and a leading
slash would look at the host root.

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
- **Structured data for hulls.** A `Product`- or `Vehicle`-shaped node per hull would be game data
  restated in this repository's markup. The Almanac owns those values (constitution II); a generated
  hull sitemap is the right vehicle for hull-level search presence, not hand-written schema.
- **Keyword meta tags.** No search engine has used them in twenty years.

## Where the pieces live

| Concern                                                       | Owner                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Static head for a crawler that runs no script                 | `src/index.html`                                                         |
| One published document per address, with that address's head  | `scripts/publish-static-routes.mjs`                                      |
| The set of addresses, and the map that advertises them        | `scripts/search/published-addresses.mjs`, `scripts/generate-sitemap.mjs` |
| The icon set and the link card                                | `scripts/generate-brand-assets.mjs`                                      |
| The production origin, and the canonical built from it        | `src/app/platform/browser/site-address.ts`                               |
| Every runtime write of title, description, canonical and card | `src/app/platform/browser/document.adapter.ts`                           |
| Which description belongs to which route                      | `src/app/app.routes.ts`, `RouteTitleStrategy`                            |
| The wording, in both shipped languages                        | `src/app/i18n/locales/*.json`                                            |
| Crawl rules, map and installability                           | `public/robots.txt`, `public/sitemap.xml`, `public/manifest.webmanifest` |
| That none of the above drifts apart                           | `searchMetadataViolations` in `scripts/check-interface-foundations.mjs`  |

The last row is the point. Several files now repeat the production origin, the route list and the
background colour between them, and a route added without a sitemap entry, an origin changed in one
file and not the others, or a palette token changed under a manifest nobody reopened, is a silent
regression that nobody would notice for months. The checker refuses it instead.

Where that gate stands is worth being exact about: `pnpm run policy` runs inside `pnpm run check`,
which this repository asks a contributor to run before proposing a change (README, "Run
`pnpm run check` before proposing a change"). The CI workflow does not run it — it never has, for
any of the eight checkers. What runs on every deployment is `pnpm run build`, and the publisher
inside it refuses rather than publishes: a map it cannot read, a map advertising nothing, an address
not under the declared origin, an address the route table does not serve, or a substitution that
did not take, each fail the build by name. A silent no-op there looks, in the output directory,
exactly like a published address.

The refusal to read a malformed map is worth its own sentence, because CodeQL named the shape.
`readSitemap` cuts comments in a single pass and does not trust its own cut. A single pass cannot
cut every comment: `<!<!-- -->--` becomes `<!--` once the inner one is gone, and a comment
containing `--` is not cut at all, so either way a `<loc>` can end up inside what the next reader
takes for live markup. Cutting twice is not the fix — a sanitiser that loops is a sanitiser whose
output nobody can predict from its input. So what is left over is checked instead: a file still
holding `<!--`, `-->` or `--!>` is refused by name rather than quietly meaning something other than
it appears to. `--!>` is there because it ends a comment in HTML and ends nothing in XML, so a file
holding one means different things to different readers.

An address below the root is published rather than refused — `/ships/Anaconda` becomes
`ships/Anaconda.html` — since that is an address, not a directory redirect. Putting
`pnpm run policy` in CI as well is the obvious follow-up, and it is a decision about every checker
rather than about this one.

---

# Second pass

> **Asked for on 2026-08-30.** "Provide suggestions to improve its discoverability and SEO." The
> owner chose seven of the answer's items to build. This half of the page records what those were,
> what was decided while building them, and what was proposed and refused. The first pass above is
> left as it was written.

## What the first pass could not see

The first pass read the repository. This one also asked what a search engine says about the site,
and the answer was nothing: a search for `sb.edct.dev` returns the incumbents — Coriolis, EDSY,
edshipbuilds — and no result for this site. The repository is eighteen days old and the site has
been live for twelve. So the ranking of the findings changes. The on-page work was nearly finished already;
what is scarce is **addresses worth indexing** and **links pointing at them**. Six of the seven items
serve the first. The seventh is a README that told every visitor the application was a blank shell.

## What changed

### The hulls are addresses

`public/sitemap.xml` is generated. `scripts/generate-sitemap.mjs` reads the installed package's
`SHIPS` and writes one `<loc>` per hull beside the three top-level routes: 51 addresses where there
were 3.

**A hull's address is its name, not its symbol. Ruled 2026-08-31 (Commander request; 001/FR-005.)**
`/ships/LakonMiner` said nothing to the Commander reading the address bar and nothing to a search
result quoting it; `/ships/Type-11_Prospector` names the ship. The segment is the package name with
each space replaced by an underscore, matched without regard to case, and the symbol is still
accepted so an address published before the rule opens the hull it named — the screen then replaces
it in history with the canonical one, which is the address the map lists, the deployment publishes
and the canonical link declares.

Nothing in the deployment's design had to change for those addresses to answer. It already published
one document per advertised address, so the hulls became documents the moment the map named them.
That was the first pass's design and it held. The production journey's server did have to change: it
had never resolved a published document, because none existed locally until the publisher moved into
`pnpm run build` (see the note on `ships.html` below).

Each address now says which hull it is. `/ships/:hull` declares its own title and description
keys, both interpolating `{{hull}}`, and `RouteTitleStrategy` supplies the name from the package.
The first pass had this route inherit the catalogue's description deliberately, because an open hull
is the catalogue with one hull selected. That reading is right for a screen and wrong for an address:
48 addresses describing themselves identically are one address as far as ranking is concerned, which
is the defect the top-level routes were given their own descriptions to fix.

Where a segment resolves to no hull, the route publishes the catalogue's identity instead. Both
patterns interpolate the hull, so publishing them unfilled would put a sentence with a hole in it
into a search result. The rule is general rather than special-cased: the strategy passes over any key
whose variables it cannot fill, and takes the nearest ancestor's.

### A published address carries its own head before the bundle runs

The first pass listed this under "considered and deliberately not done", because resolving a title
and a description at deploy time means reading the message catalogue, and the owner had ruled a build
step out of that pass. The owner asked for it in this pass, and the sitemap needs a build step
anyway.

`scripts/publish-static-routes.mjs` writes each address's document from the built `index.html`,
substituting the canonical, `og:url`, the title, the description, the card and its alt text. It runs
from `pnpm run build`.

**That move is the part worth arguing with.** The publication used to be a shell block in `ci.yml`,
and the first pass wrote at length about keeping its comment-cutting pass identical to the policy
checker's, because one is `sed` and the other is `.mjs` and neither can call the other. A script
removes the problem instead of managing it: `readSitemap` in `scripts/search/published-addresses.mjs`
is the one function that reads the generated map, and the publisher and the checker both call it, so
there is no second spelling of the cut to keep in step. They still react differently — the publisher
refuses a map it cannot read, the checker fails by name — which is why the defect is returned rather
than thrown. It also puts what a crawler is served under `pnpm run test:scripts` and
under a production journey, rather than under a deployment nobody can run twice.

### One reader, three consumers

`scripts/search/published-addresses.mjs` is the only place that turns the route table and the
package's hull list into addresses, each with the message keys that name it. The sitemap generator,
the publisher and the policy checker all import it.

It states the map from address to message key, which `app.routes.ts` also states. That is a second
statement of one fact, and it is deliberate: the alternative is a script that parses TypeScript,
which stops working the first time the file is formatted differently and says nothing when it does.
The checker reconciles the two — a route with no key, a key no route declares, a key the catalogue
does not carry, and an address the route table does not serve each fail the build by name.

Four runtime rules are spelled a second time there for the same reason: the placeholder
substitution, the title composition, the hull artwork path and the card the rest of the site
shows. `src/app/i18n/document-title.spec.ts` holds both copies to the running
application's answer for every published address, so a document cannot be published with one title
and rewritten with another.

### The application is installable, and a link carries a picture

`scripts/generate-brand-assets.mjs` renders the icon set and the card from
`.design/assets/icons/app-icon-512.png`, in Chromium, as `convert-ship-artwork.mjs` rasterises the
hulls. It writes the 192 and 512 icons a browser wants before it offers installation, a maskable
one, an `apple-touch-icon` and a 1200x630 card. The output is committed, so the build stays hermetic
and the script is how the files are reproduced rather than a step the build depends on.

The mark it renders has been in `.design` since 2026-08-22. The first pass's "there is no logo to
make one from" was already untrue when it was written; it is corrected here rather than quietly
worked around.

**The card carries no words.** A 1200x630 image with `SHIP BUILDER` in it is display text this
application owns, in one language, in a file no translation can reach (constitution VI). The card is
the mark on the application's ground. What the picture is gets said in `og:image:alt`, which carries
the page title and so moves with the language.

A hull's card is its own illustration — `assets/ships/<symbol>/illustration.png`, already served —
rather than a rendered card per hull. Forty-eight composed images would be two megabytes to carry and
48 files to re-render at every pin move, to say what the illustration already says. The illustration
is 900x600 where a card is 1200x630, so a consumer crops or letterboxes it. That is the whole cost.

`twitter:card` becomes `summary_large_image`, which the first pass could not use because there was
nothing to show.

### A preview no longer asks to be indexed

`index.html` carries `<meta name="robots" content="index,follow,max-image-preview:large">`, and the
preview job rewrites that one tag to `noindex` in its own built output. The first pass ruled this out
because the build did not know it was building a preview.

It still does not, and that is worth stating precisely, because it decides where the rewrite lives. A
preview is built with `pnpm exec ng build --base-href=...`, not with `pnpm run build`, so nothing
hung off the npm script runs for a preview — including `publish-static-routes.mjs`, which a preview
does not want anyway. The rewrite is therefore a step in `ci.yml`, beside the step that copies
`404.html`, and it fails the run if the tag it rewrote is not `noindex` afterwards.

## Decisions recorded rather than buried

- **The generated sitemap is committed, and that is a reversal.** The first pass wrote that "a
  hard-coded list of hull symbols in this repository is exactly the private copy of package data
  that constitution II forbids". A committed generated file is not that, for the reason
  `public/assets/ships/` and the schematic mount extracts are not: it is reproducible from the
  installed package by a script in this repository, so a build never ships a stale map and a CI step
  fails a commit whose map disagrees with the package. What would forbid it is a list nobody could reproduce. Two gates hold it, because the two
  failures are different: `pnpm run build` regenerates the file, so no deployment can ship a stale
  map even if somebody forgot to commit one; and a CI step runs the generator's `--check` before the
  build, so a pin move that adds or drops a hull cannot leave the committed file disagreeing with
  the package. The check is a CI step of its own rather than part of `pnpm run policy`, which CI
  does not run.
- **No `<lastmod>`.** A generated sitemap that stamps the time it was generated says every address
  changed whenever anything was built, and a committed one would then change on every run. A date
  that tracked each address's real content would have to come from the package's own release, which
  the sitemap does not know. `changefreq` and `priority` go in the same pass: Google has ignored both
  for years, and a file that states things nobody reads invites belief in them.
- **The token ground is baked into committed rasters.** Every other statement of
  `--edsb-palette-bg` is reconciled by the checker; a PNG is not, and cannot be. What holds it is the
  generator: it reads the token rather than carrying a copy of the colour, so a token change is
  carried into the assets by `pnpm run brand:assets` and the change is visible in the diff. A token
  change without that command leaves the mark on the old ground, and nothing will say so.
- **`/ships` answers from `ships.html`, beside a `ships/` directory.** GitHub Pages resolves a file
  with the extension before a directory index, which is why the first pass wrote `<route>.html`
  rather than `<route>/index.html`; the hull addresses now put a directory next to one of those
  files. `scripts/serve-production.mjs` resolves in the same order, so the production journey asserts
  the address a crawler asks for answers 200 with no redirect. That is a mirror of Pages, not Pages
  itself: the first deployment after this change is where the order is confirmed on the real host.
- **The JSON-LD still names the site's root on every address.** It describes the application, not
  the page, as `site-address.ts` says. It gains the card image and nothing else.
- **`/help` was proposed and refused.** The answer that started this pass suggested routing the help
  topics so their prose could be indexed. Feature 012's contract says the Help action "does not
  invoke Angular Router or History" and that opening and closing preserve the pathname, and the FAQ
  is two questions long. Amending an owner-ruled contract in three places to publish two paragraphs
  is not a trade worth making. It is recorded here because the suggestion was made in public and the
  refusal should be too.
- **The forty-eight hull cards are gated by the checker, not by a file that names them.** No file in
  this repository names `assets/ships/<symbol>/illustration.png`: the card is derived per hull from
  the package. A pin move that adds a hull would otherwise add an address, a document and an
  `og:image` pointing at artwork nobody rasterised, with everything green. The checker therefore
  compares every published address's card against what `public/` actually serves, and names the hull
  and the command that renders it.
- **The preview's `noindex` is held by a rule that reads the workflow.** The `sed` that rewrites the
  tag matches one exact spelling of it, and nothing in `pnpm run check` reads `ci.yml`, so a robots
  tag reformatted across two lines would satisfy every other rule here and turn the rewrite into a
  silent no-op — discovered, if at all, by a preview quietly competing with the site it previews.
  The checker takes the expression out of the workflow and runs it against `index.html`, and checks
  that what it substitutes says `noindex`. Two copies of one rule would have been the same fault the
  sitemap reader was unified to avoid.
- **Manifest `screenshots` are still absent.** They want real screenshots of the application at two
  form factors. The Playwright suite could take them, and that is a follow-up rather than a line of
  markup.

## What this changed elsewhere

The ledger and the journey it describes both said an open hull inherits the description of the
screen it sits inside. That assertion is withdrawn and replaced by the two that are true now: an
address about one hull names the hull, and an address for a symbol the package does not carry
publishes the catalogue's identity. A second surface joins them, `shell/published-addresses`, for
the half no running application can answer: what each address actually serves.

## What no change in this repository can do

The site is not linked from anywhere a search engine can follow. Registering it with Google Search
Console and Bing Webmaster Tools, and listing it where Commanders look — EDCodex, the Frontier
forums, the EDCD Discord, the subreddits — is the half of this that is not code, and it decides
whether any of the above is ever read. The README correction in this pass is the one piece of that
half which lives here: the repository page is the strongest link the project controls, and it told
every visitor the application did not exist yet.
