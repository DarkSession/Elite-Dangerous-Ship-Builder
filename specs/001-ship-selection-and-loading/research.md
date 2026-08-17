# Phase 0 Research: Ship Selection and Build Loading

## Almanac catalogue and hull facts

**Decision**: Import `SHIPS`, `getShipBySymbol`, `getShipSlots` and type `Ship` from `@elite-dangerous-almanac/core/ships/ships`. Present the package fields directly and use the package `symbol` as every hull key. Preserve an explicit unavailable state even though beta.12 currently populates all required facts.

**Rationale**: The installed release contains 48 unique hull records and documents the required fields and units. Case-insensitive `getShipBySymbol()` returns `null` for unknown symbols, which gives the detail route a safe error boundary.

**Alternatives considered**: A private projection containing copied game values was rejected because it would fork the source of truth. Name- or index-based identity was rejected because neither is the package identity.

## Slot layouts and stock builds

**Decision**: Expand the hull layout with `enumerateSlots(getShipSlots(symbol))` from `@elite-dangerous-almanac/core/ships/slots`. Use `getDefaultLoadout(symbol)` from `ships/default-loadouts` only as the availability check, then create the live build with `ShipLoadout.default(symbol)` from `ships/ship-loadout`.

**Rationale**: The slot helper preserves irregular game-owned keys; the live factory creates an independent, calculated stock build using the complete catalogue. All beta.12 hulls currently have complete valid defaults, while the null/error states remain required defensive behavior.

**Alternatives considered**: Deriving keys from slot position or `_SizeN` text was rejected because several hulls violate those patterns. Replaying default module records through UI fitting operations was rejected because the package already owns the factory.

## Artwork and offline delivery

**Decision**: Configure Angular's asset pipeline to copy only package `assets/ships/*/illustration.svg` files to a same-origin `/assets/ships/<symbol>/illustration.svg` path. Cache the app shell and bundled English messages eagerly; cache hull illustrations on first request with the service worker. Reserve artwork aspect ratio, keep creation independent of image state, and have the artwork coordinator retry a failed uncached request when the browser reports that connectivity returned so no page reload is required.

**Rationale**: The package documents these static files and beta.12 has one illustration for every hull. Same-origin lazy caching satisfies the constitution without placing every image on the initial critical path.

**Alternatives considered**: Importing SVGs as JavaScript was rejected because the package intentionally exposes them as static assets. Cross-origin/CDN access and private copied artwork were rejected. Eagerly loading every illustration was rejected because detail artwork is optional presentation weight.

## Catalogue interaction model

**Decision**: Search the localized displayed text for name, manufacturer, size, hardpoint description and formatted price; provide manufacturer, size, hardpoint-class and price facets; sort bidirectionally by name, manufacturer, size, hardpoint tuple and retail price. Use `Intl.Collator`, the semantic size order small/medium/large, a huge-to-small hardpoint count tuple, missing-last ordering in either direction, and the original package ordinal as the final stable tie-breaker. Keep query/filter/sort and a result anchor in tab session state, not build, persistence or URL state.

**Rationale**: This covers every displayed catalogue fact, keeps zero distinct from missing and returns exactly to the user's place after hull detail.

**Alternatives considered**: Locale-blind string comparison, index-only sorting and route query parameters were rejected because they would make ordering inconsistent, ties unstable or catalogue state part of a shareable route.

## Lossless build snapshot

**Decision**: Define an application-owned, versioned `BuildSnapshotV1` containing hull symbol, nullable ship name/ident, and fitted entries keyed by their original game slot. Each entry retains its module symbol/casing, presence of enabled/priority fields, package-identified pre-engineered tuple, ordinary blueprint grade/effect and unresolved raw identity. Construct it from `ShipLoadout` getters and `fittedModules().raw`, and reconstruct through `ShipLoadout.fromLoadout()` before accepting it.

**Rationale**: `fromLoadout()` retains unknown hull, slot, module, blueprint and effect identities. `fittedModules()` includes unresolved slots that `slots()` cannot enumerate. `toLoadoutEvent()` is unsuitable as the storage DTO because it lowercases identities and adds recomputed derived fields.

**Alternatives considered**: `JSON.stringify(ShipLoadout)` was rejected because class internals are not a durable contract. Wholesale SLEF/loadout-event storage was rejected because it mixes modelled and derived/capture data. The build-link DTO was rejected because links intentionally refuse some unresolved state that storage must retain.

## Local record format and migrations

**Decision**: Store each `LocalRecordV1` atomically under `edsb:record:<uuid>`. The envelope has a format discriminator, version, immutable local ID, kind, fresh revision UUID, ISO created/modified instants, nullable local name/note, hull symbol, package validation snapshot and `BuildSnapshotV1`. Enumerate only owned keys; keep a decoder/migration registry and immutable fixtures for every published version.

**Rationale**: `localStorage.setItem()` atomically replaces one value. Independent keys avoid an index/record torn write and keep an autosave from rewriting every build. A newer unsupported version can be listed while its bytes remain untouched.

**Alternatives considered**: One giant repository document was rejected because every autosave would create a shared lost-update and quota point. Name-derived keys were rejected because names are mutable and duplicates are allowed. IndexedDB was rejected because project constraints select `localStorage` and the data scale does not justify another persistence system.

## Working ownership and retention

**Decision**: Persist a versioned `{workingRecordId}` tab descriptor in `sessionStorage`. On load, use `BroadcastChannel('edsb.persistence.v1')` and a fresh page nonce to detect a cloned live tab identity; the later claimant creates a new ID and copies the current candidate. Limit recoverable working records to 20. Updating an existing record is always allowed; creating record 21 pauses persistence and opens explicit management. Never evict by age, count, least-recent use or tab closure.

**Rationale**: `sessionStorage` restores across reload and is normally scoped to one top-level context, while the collision handshake handles duplicated-tab cloning. Twenty bounds abandoned working records while leaving deliberate named saves quota-bound.

**Alternatives considered**: One global working key violates tab isolation. Automatic TTL/LRU cleanup violates the requirement that work is never deleted automatically. A working identity based on a timestamp, name or route is not stable.

## Named-save concurrency

**Decision**: Give each record a random `revisionId`. Under a short exclusive Web Lock named `edsb:named:<recordId>`, compare the active build's baseline revision with the stored record before write. On conflict, release the lock and offer overwrite, keep both or cancel. Reacquire and recheck before overwrite; if a third revision appeared, refresh the conflict. Keep both creates a new ID; cancel writes nothing. Treat `storage` events as invalidation notices and re-read authoritative storage.

**Rationale**: Web Storage has no compare-and-swap. A revision precondition plus cooperative cross-tab locking prevents two application tabs from silently replacing the same named version. UUID revisions avoid clock/ABA ambiguity.

**Alternatives considered**: Last-write-wins and timestamp comparison were rejected because both can lose a version silently. Holding a lock while a dialog is open was rejected because it blocks unrelated progress and can deadlock the interaction.

## Storage failures

**Decision**: Put every storage operation behind injected ports and catch access, parse, quota and generic write errors. A failure changes persistence status only, leaves the active `ShipLoadout` and previous stored bytes intact, and offers record management plus retry. Best-effort autosave flushes on `pagehide` and visibility loss; it does not depend on `beforeunload`. If Web Locks are unavailable, do not permit unsafe in-place named overwrite; keep the working copy and allow keep-both/cancel.

**Rationale**: Browser policy, private modes and quota can make storage unavailable despite a usable application. Editing, links, calculations and SLEF must remain independent of persistence.

**Alternatives considered**: Disabling the workspace or silently retrying/destructively pruning records was rejected. `navigator.storage.estimate()` was rejected as an authoritative quota test; it may only provide advisory UI.

## Link codec and URL coordination

**Decision**: Retain the existing version-1 codec table and on-demand loader. Use `/build#b.<payload>` as the canonical generated link. Initial load, pasted navigation and `hashchange` use one decode-to-candidate/replacement pipeline. Active edits update the hash with `history.replaceState`; an unrepresentable build clears a stale `b.` fragment, identifies the affected slot/reason through structured error data and offers feature 004's SLEF path.

**Rationale**: The existing codec already enforces the `b.` envelope, CRC, immutable table version, package identities and 500-character bound. Candidate-first handling guarantees malformed, truncated and unsupported payloads cannot replace work.

**Alternatives considered**: Query/path payloads were rejected because they can be transmitted. Router pushes per edit were rejected because they flood history. Guessing a newer version or stripping unsupported fields was rejected because it would not be lossless.

## Angular application architecture

**Decision**: Keep pure code in `domain/`, orchestration in signal stores under `application/`, browser APIs behind `platform/` ports, and route components under `features/`. Page facades expose localized view models and intent methods. Shared `ui/` components receive inputs and emit user intent only.

**Rationale**: Persistence, replacement, migration, catalogue ordering and URL behavior remain testable without rendering or the DOM, while Angular's zoneless change detection consumes signals naturally.

**Alternatives considered**: Components reading `SHIPS`, `localStorage` or `location` directly were rejected because domain behavior would become rendering-dependent and duplicated.

## Localization and package-language gaps

**Decision**: Consume feature 011's runtime `LocaleStore`, bundled English fallback, same-origin locale assets and `Intl` formatters. Render Almanac hull names, manufacturers and diagnostics in the canonical language supplied by beta.12 and identify them as untranslated when the active locale differs. Never create a private game-text translation.

**Rationale**: Beta.12 has localized helpers for some module/engineering data but no hull-name, manufacturer or diagnostic localization API. The constitution explicitly permits canonical package text with disclosure until that capability exists upstream.

**Alternatives considered**: Angular compile-time-only i18n was rejected because the application requires persistent runtime choice. Translating package text in application messages was rejected as a source-of-truth fork.

## Responsive, accessible UI and verification

**Decision**: Define four screens—catalogue, hull detail, active build workspace and build library—using feature 011's tokens and components. Add `@axe-core/playwright`, ten explicit projects (five viewport/orientation profiles times Chromium and Firefox), automated checks for every meaningful screen/dialog/error state, semantic assertions, no-overflow checks, expanded/RTL fixtures, reduced motion and 200%/400% tests.

**Rationale**: The current repository has only three Chromium projects and no automated accessibility scan. Closing that known gap is mandatory before feature 001 can ship.

**Alternatives considered**: Desktop-first layouts, Chromium-only coverage, broad accessibility-rule suppression and feature-local component styling were rejected as constitutional violations.

## Existing design-canvas integration

**Decision**: Use `.design/Ship Builder.dc.html` as the visual/composition reference. Adopt canvas 1a's wide shipyard manifest plus detail rail, canvas 1b's narrow catalogue/detail and saved-build layers, canvas 1c's wide command bar/save/export dialogs, and canvas 1d's narrow workspace command menu/dialog treatment. Keep `/ships/:symbol`, `/builds` and `/build` as stable route contracts while rendering detail/library as wide inspector/modal surfaces and narrow full-screen surfaces.

**Rationale**: The design already establishes the product's information density, dark/amber language, responsive transformations and primary action hierarchy. Route-backed responsive surfaces preserve browser navigation, symbol URLs and screen-reader context while matching that visual intent.

**Alternatives considered**: Ignoring the supplied design would discard established product decisions. Copying the HTML/CSS/data verbatim was rejected because it contains mock game values/assets, inline literals, cross-origin fonts, incomplete requirement states, nonsemantic controls and a noncanonical sample share URL. The exact reconciliation is recorded in `design/reference-review.md`.

## Resolved dependencies

- Feature 011 is implemented before feature 001 UI work, or its full shared subset is explicitly included in the feature 001 task plan.
- Feature 004 supplies the SLEF action reached from link refusal; feature 001 owns the refusal and integration contract.
- Supporting non-English hull/diagnostic text beyond the canonical package output waits for an Almanac release; this is disclosed behavior, not an application workaround.

All technical questions are resolved.
