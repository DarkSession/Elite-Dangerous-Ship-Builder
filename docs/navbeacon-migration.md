# NavBeacon migration

NavBeacon is published at `navbeacon.app`. It holds one tool, Ship Builder, and it
is built to hold more: the equipment builder is the second, and it waits on an
upstream release. This document records the decisions that shape the move and the
work that is left.

## Standing decisions

These are settled, and each one removes work that would otherwise be obvious to do.

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

## The address

`SITE_ORIGIN` in `src/app/platform/browser/site-address.ts` is the single constant
every published address is built from, and `scripts/check-interface-foundations.mjs`
holds `src/index.html`, `public/robots.txt`, `public/sitemap.xml` and `public/CNAME`
to it. So a further move is one decision and four mechanical propagations, with
`pnpm run policy` failing on any of the four the change did not carry through.

Those five files are the whole of what the checker holds. The address is also written
in `README.md`, `SECURITY.md`, `AGENTS.md`, two workflow comments, the fixtures under
`scripts/` and `src/app/platform/browser/site-address.spec.ts`, and
`specs/011-interface-foundations/quickstart.md`. Nothing fails when one of those is
missed; a reader has to catch it.

`public/manifest.webmanifest` states no absolute address by design and the checker
rejects one.

### What `.app` requires

`.app` is HSTS-preloaded: HTTPS is mandatory and there is no HTTP fallback. So between
a DNS change and GitHub provisioning the certificate the site is unreachable rather
than degraded — usually minutes, occasionally hours. `README.md` carries the Pages and
DNS setup; "Enforce HTTPS" is the step that ends the gap.

## The name

NavBeacon is the product and Ship Builder is a tool inside it. The product identity is
`app.name`, `app.description` and `app.document-title.default` in the locale
catalogues, the manifest's `name`, `short_name` and `description`, the `package.json`
name, the project key in `angular.json`, and the Frontier media-usage notice in
`LICENSE`. Everything that names the outfitting bench — `catalogue.title`,
`navigation.catalogue`, `hullDetail.back`, `workspace.empty.description`,
`workspace.empty.action`, `help.purpose` and the help topics that describe the bench's
behaviour — names the tool, which is what those strings mean under NavBeacon.

Help content is generated: run `pnpm run help:artifacts` after touching any help string,
and `pnpm run help:artifacts:check` gates it.

The `package.json` name is also the SLEF producer identity: every export writes
`appName: navbeacon` where it wrote `appName: elite-dangerous-ship-builder`
(`src/app/platform/build/application-metadata.ts`, `specs/004-slef/contracts/slef-export.md`).
The identifier is stable in the sense the contract means — it does not vary with the reader's
language or the build — and it moves with the product name, once. A consumer keying on the old
string sees a new producer, which is the accepted cost of the product having one name.

Renaming the repository to match is optional. GitHub redirects the old URLs and Pages
follows the rename, so it costs a remote update and nothing else.

### What is deliberately not renamed

`edsb:` in `src/app/platform/storage/storage-keys.ts` and the `edsb-` component
selectors. Both are opaque internal strings that no user sees, and renaming the storage
prefix would orphan every record a Commander has already saved as well as churning the
persistence contract, the broadcast channel name, the Web Lock names and their specs.
The design tokens carry the product's own initials, `--ednb-*`, because a token name is
read by everyone who extends the system.

## The tool shell

The tools are a data array in `src/app/features/shared/app-navigation.ts`, and a deck of
its own in `src/app/ui/components/app-frame` renders from it, the way the canvas runs its
tabs and its tool grid off one registry. It is the upper deck of one bar: the command deck
under it keeps the screen identity and the amber rule that closes the plate, and the
insignia stands over both. `specs/011-interface-foundations/` is the record: FR-028 and
SC-009 in `spec.md`, the composition in `design/application-shell.md`, the measured
values and the departures in `design/canvas-extraction.md` and
`design/reference-review.md`.

The registry holds the tools the application serves, so today it holds Ship Builder
alone. The equipment builder joins it as one entry when it is built.

Not built: the `ALL TOOLS` grid, the `⌘K` palette and drag-to-pin. A grid and a search
palette are more than one tool needs; revisit at five. Drag-to-pin is pointer-only and
would need a touch equivalent before it could ship at all. The avatar plate the canvas
draws at the bar's trailing edge is not deferred but refused: there are no accounts.

The ship-shaped domain directories live under `src/app/domain/ships/`, which mirrors the
library's own `ships/` namespace. The library's other namespaces — `equipment/`,
`astro/`, `commodities/`, `materials/`, `i18n/` — become siblings of it as the tools
that read them arrive. `help/` and `distribution/` stay at the top of `domain/`, because
neither is about ships.

## The equipment builder

On-foot outfitting: suits, handheld weapons, grades and modifications, drawn in
`.design/Equipment Builder.dc.html` at 1640px (`1a`) and 390px (`1b`), and specified in
`specs/013-equipment-builder/`.

**The package carries the whole feature.** `@elite-dangerous-almanac/core` ships the
`equipment/` namespace — `suits`, `weapons`, `modifications`, `engineering`,
`upgrade-costs`, `modification-costs`, `modification-journal` — and its localisation:
`i18n/suits`, `i18n/personal-weapons` and `i18n/personal-modifications`. Probed on the
pinned release, the three leaves answer for every key in all six stored locales, so
"nothing ships untranslatable" holds for the equipment catalogue. There is no
weapon-name lookup and that is not a gap: a handheld weapon's name is a product name the
game leaves in English, so `PersonalWeapon.name` is the name in all six.

Its link codec is written ahead of the bench and specified in
[equipment-link-codec.md](./equipment-link-codec.md): a codec of its own behind the `e.` prefix,
standing on the same Base70 radix, CRC-32 envelope and bit packer as the ship link.

The suit tools — Energylink, Arc Cutter, Profile Analyser — are absent upstream. That is
a gap to raise, not a blocker: spec 013 withdraws the region rather than filling it
locally.

One design collision to rule on when the work opens: artboard `1a` draws the equipment
builder as a standalone application, with its own app icon, its own `EXPORT` dialog, its
own `SAVED LOADOUTS` list and its own `HELP · ABOUT` carrying a separate `APP VERSION`.
That contradicts the shared shell in `Tool Navigation.dc.html`, whose closing note asks
for the ruling rather than making it. Folding it into the shell — and deleting the
duplicated chrome from the artboard — is the expected answer, but it is a ruling to
record, not to assume.

## Not doing

Each of these was considered and dropped, so that dropping them is a decision on the
record rather than an omission:

- Per-tool subdomains, and the separate repositories they would force
- A separate Angular application per tool
- A `301` from `sb.edct.dev`, and the second Pages site it would need
- A saved-build handoff page, a bulk export format, or a cross-origin `postMessage` bridge
- Renaming the `edsb:` storage prefix, the `edsb-` selectors or the `--ednb-*` custom properties
- The `ALL TOOLS` grid, the `⌘K` palette and drag-to-pin, at one tool
- An account plate on the tool bar, which the canvas draws and constitution I refuses
- The Market Finder and Thargoid War Tracker from the canvas — both need a network
  data source that constitution I forbids

## Open

- **A tool switcher for a large registry.** Canvas 4d draws the compact case as the same
  two decks the wide case draws, so the shell draws one composition at every width. That
  holds while the registry is small. A rail, a drawer or a grid is a composition to be
  drawn before it is built.
