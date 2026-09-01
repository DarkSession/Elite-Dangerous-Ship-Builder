# NavBeacon migration

Moving the application from `sb.edct.dev` to `navbeacon.app`, and from being one
tool to being the first of several. Four phases, in order: the domain, the name,
the tool shell, then the equipment builder.

The order matters in one place only — phases 1 to 3 are exactly the work that can
proceed while phase 4 waits on an upstream release. Everything else is sequenced
for a smaller diff rather than for necessity.

## Standing decisions

These are settled and the plan below assumes them. They are recorded here because
each one removes work that would otherwise be obvious to do.

- **One origin, paths not subdomains.** `navbeacon.app/ships`, `navbeacon.app/equipment`.
  A subdomain is a separate origin, and `localStorage`, the service worker and the
  in-memory build are all origin-scoped — the design's cross-tool state cannot survive
  the split. GitHub Pages also serves exactly one custom domain per repository, so
  per-tool subdomains would force per-tool repositories.
- **One application, not a workspace of them.** The tools read each other's live state,
  so they share a process. `projects/ui-preview` stays what it is: a harness, not a tool.
- **No backend.** Nothing in this migration needs one, and constitution I still forbids it.
  The tools in the design canvas that would need one are not being built.
- **`sb.edct.dev` links do not need to survive.** No redirect, no tombstone site.
- **Saved builds do not need to survive.** Nothing is in use yet. No handoff page, no
  bulk export, no cross-origin bridge.
- **The design canvas is a playground.** `Tool Navigation.dc.html` names eight tools;
  that is a sketch of where this could go, not a commitment to build them.

## Phase 1 — The domain

`SITE_ORIGIN` in `src/app/platform/browser/site-address.ts` is the single constant
every published address is built from, and `scripts/check-interface-foundations.mjs`
compares `src/index.html`, `public/robots.txt`, `public/sitemap.xml` and `public/CNAME`
against it. So this is one decision and fifteen mechanical propagations, with
`pnpm run policy` failing anywhere the change was not carried through.

Sixteen files name the old host:

| File                                            | Occurrences | Nature                                                       |
| ----------------------------------------------- | ----------- | ------------------------------------------------------------ |
| `src/app/platform/browser/site-address.ts`      | 1           | **the edit** — `SITE_ORIGIN`                                 |
| `public/CNAME`                                  | 1           | what actually moves the site                                 |
| `public/sitemap.xml`                            | 51          | every published address                                      |
| `src/index.html`                                | 6           | canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD ×2 |
| `public/robots.txt`                             | 1           | the `Sitemap:` line                                          |
| `scripts/check-interface-foundations.test.mjs`  | 44          | fixtures                                                     |
| `scripts/search/published-addresses.test.mjs`   | 2           | fixtures                                                     |
| `scripts/publish-static-routes.test.mjs`        | 1           | fixture                                                      |
| `src/app/platform/browser/site-address.spec.ts` | 2           | fixtures                                                     |
| `README.md`                                     | 4           | links                                                        |
| `.github/workflows/ci.yml`                      | 2           | comments                                                     |
| `.github/workflows/deploy.yml`                  | 1           | comment                                                      |
| `AGENTS.md`, `SECURITY.md`                      | 1 each      | links                                                        |
| `specs/011-interface-foundations/**`            | 4           | **leave as written** — dated records                         |

`public/manifest.webmanifest` states no absolute address by design and the checker
rejects one, so it needs no change here.

### The `.app` cutover

`.app` is HSTS-preloaded: HTTPS is mandatory and there is no HTTP fallback. Between
pointing DNS and GitHub provisioning the certificate the site is unreachable rather
than degraded — usually minutes, occasionally hours. Land the code change first, then
point DNS, then wait for "Enforce HTTPS" before telling anyone. With nothing in use
this is an inconvenience rather than an outage, but it will look like a broken deploy
if it is not expected.

## Phase 2 — The name

Today "Ship Builder" is both the product and a screen. NavBeacon separates them, and
most screen-level strings become _more_ accurate rather than needing an edit.

**Changes** — the product identity:

- `src/app/i18n/locales/en.json` and `de.json`: `app.name`, `app.description`,
  `app.document-title.default`
- `public/manifest.webmanifest`: `name`, `short_name`, `description`
- `package.json` `name`, and the project key in `angular.json`
- `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `.github/ISSUE_TEMPLATE/*`, `.devcontainer/devcontainer.json`
- `playwright.config.ts` and the e2e specs that assert on the application name

**Stays as written** — these already name the tool, which is what they mean under
NavBeacon: `catalogue.title`, `navigation.catalogue`, `hullDetail.back`,
`workspace.empty.description`, `workspace.empty.action`, `help.purpose` and the help
topics that describe Ship Builder's behaviour.

Help content is generated: run `pnpm run help:artifacts` after touching any help string,
and `pnpm run help:artifacts:check` gates it.

Renaming the repository to match is optional. GitHub redirects the old URLs and Pages
follows the rename, so it costs a remote update and nothing else.

### What is deliberately not renamed

`edsb:` in `src/app/platform/storage/storage-keys.ts`, and the `--edsb-*` CSS custom
properties. Both are opaque internal strings that no user sees. Renaming them churns
the persistence contract, the broadcast channel name, the Web Lock names and their
specs for no visible gain. With nothing stored yet this is now a free change rather
than a destructive one — it is still not worth making.

## Phase 3 — The tool shell

Build the tool registry from `Tool Navigation.dc.html`, containing **the tools that
exist**: `SHIP` and `ON FOOT`. The canvas's own note is the design rule — "tabs and
grid run off one tool registry, so a new tool appears in both at once" — so the
registry is a data array and the topbar renders from it.

The shell is the 50px bar over the existing 54px screen header, which already ends in
the 2px amber rule. `src/app/features/shared/app-navigation.ts` and
`src/app/ui/components/app-frame` are where it goes.

Not built at this size: the `ALL TOOLS` grid, the `⌘K` palette, and drag-to-pin. A
grid and a search palette over two tools are furniture. Revisit at five. Drag-to-pin
is pointer-only and would need a touch equivalent before it could ship at all.

Also unresolved, and needed before this phase can finish: **there is no compact
artboard for tool navigation.** The canvas draws only the 1180px case, its script
guards a `#nv-rail` and `#nv-drawer` that no artboard defines, and the Equipment
Builder's own mobile artboard has no tool switcher. How tools are changed on a phone
is undrawn, and under the standing rule it is a gap to raise rather than to invent.

While the layer is open: move the existing ship-shaped directories under
`src/app/domain/ships/`, mirroring the library's own namespaces
(`ships/`, `equipment/`, `astro/`, `commodities/`, `materials/`, `i18n/`). This is the
last cheap moment — after a second tool's code lands beside them it is a much larger
change.

## Phase 4 — The equipment builder

On-foot outfitting: suits, handheld weapons, grades and modifications, drawn in
`.design/Equipment Builder.dc.html` at 1640px (`1a`) and 390px (`1b`).

**Blocked upstream.** `@elite-dangerous-almanac/core@0.2.5` ships the whole
`equipment/` namespace — `suits`, `weapons`, `modifications`, `engineering`,
`upgrade-costs`, `modification-costs`, `modification-journal` — but no localisation
for any of it. `grep -ril locale dist/equipment/` returns nothing; `Suit.name`,
`Weapon.name` and `Modification.name` are each documented as the English display
name; and there is no `i18n/suits` or `i18n/weapons` leaf where the ship side has
`i18n/ships`, `i18n/modules` and `i18n/slots`.

Game text belongs to the package and a private translation here is forbidden outright,
so "nothing ships untranslatable" and the equipment catalogue cannot both hold. Under
constitution II the feature waits on the release. **File this upstream before starting
the phase** — it is the long pole and it is independent of every decision above.

One design collision to rule on when the phase opens: artboard `1a` draws the
equipment builder as a standalone application, with its own app icon, its own
`EXPORT` dialog, its own `SAVED LOADOUTS` list and its own `HELP · ABOUT` carrying a
separate `APP VERSION`. That contradicts the shared shell in `Tool Navigation.dc.html`,
whose closing note asks for the ruling rather than making it. Folding it into the
shell — and deleting the duplicated chrome from the artboard — is the expected
answer, but it is a ruling to record, not to assume.

## Not doing

Each of these was considered and dropped, so that dropping them is a decision on the
record rather than an omission:

- Per-tool subdomains, and the separate repositories they would force
- A separate Angular application per tool
- A `301` from `sb.edct.dev`, and the second Pages site it would need
- A saved-build handoff page, a bulk export format, or a cross-origin `postMessage` bridge
- Renaming the `edsb:` storage prefix or the `--edsb-*` custom properties
- The `ALL TOOLS` grid, the `⌘K` palette and drag-to-pin, at two tools
- The Market Finder and Thargoid War Tracker from the canvas — both need a network
  data source that constitution I forbids

## Open

- Is `navbeacon.app` registered and pointed at GitHub Pages yet? Phase 1's code change
  can land without it; the `CNAME` edit is the point of no return.
- A compact artboard for tool navigation, before phase 3 can finish.
