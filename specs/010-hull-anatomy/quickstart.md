# Quickstart Validation: Hull Anatomy and Hardpoint Geometry

This guide validates the planned capability after its upstream and project prerequisites are
implemented. It does not authorize an application workaround while either Almanac gate remains open.

## Prerequisites and gates

1. Use Node.js 24 and install the committed dependency graph:

   ```sh
   pnpm install --frozen-lockfile
   ```

2. Confirm the pinned Almanac release includes fixes/contracts for
   [#308](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/308) and
   [#299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299).
3. Confirm features 001, 002, 003, 005, 011 and 012 expose the boundaries named in
   [plan.md](./plan.md). Do not proceed with feature-specific replacements for a missing boundary.
4. Run the full repository gate:

   ```sh
   pnpm run check
   ```

Expected: formatting, typecheck, production build, unit coverage and the full Playwright matrix pass.

## Installed-package and output contract

Run the schematic contract check directly if the implementation exposes it separately:

```sh
node scripts/check-almanac-schematics.mjs
```

Expected:

- every current package `Ship.symbol` has top and bottom output assets at the documented path;
- every admitted annotation resolves to that hull's package hardpoint;
- every package hardpoint has at least one occurrence;
- utility annotations are excluded without key-prefix logic;
- every repeated key follows the released duplicate semantics and groups under one slot identity;
- unsafe/uncontracted markup and contract-invalid duplicates fail the check;
- no generated SVG exists as a committed private source copy.

Build the static application and inspect the generated asset/service-worker manifest:

```sh
pnpm run build
```

Expected: package schematic paths are preserved under the same-origin output, are placed in the lazy
versioned asset group and are not eagerly fetched by first application load.

## Unit and contract scenarios

Run the unit suite with coverage:

```sh
pnpm test -- --coverage
```

Verify exact behavior described in
[schematic-assets.md](./contracts/schematic-assets.md),
[anatomy-projection.md](./contracts/anatomy-projection.md) and
[slot-targeting.md](./contracts/slot-targeting.md):

1. Permute SVG drawing order and casing; canonical keys and package list order remain unchanged.
2. Supply utility, unknown and wrong-kind annotations; none becomes interactive and structured
   package defects preserve safe evidence.
3. Supply scripts, events, URL paint, links, foreign content, malformed XML and wrong roots; the side
   is rejected before rendering.
4. Load one valid/one failed side, both failed and a valid zero-hardpoint side; the unique and complete
   ledgers remain usable.
5. Change hull while requests are pending; stale responses never publish.
6. Project empty/resolved/unresolved, stock/engineered and every power state without substituting
   absent values.
7. Select the Federal Corvette and Lynx Highliner cross-side fixtures; each repeated key is one item
   and all occurrences share state.
8. Select a located/unlocated slot; only the located slot changes/reveals anatomy.
9. Retry explicitly and through one online event; successful recovery requires no application reload.

Expected coverage remains at or above 80% for statements, branches, functions and lines.

## Primary end-to-end journeys

Run the anatomy journeys across all configured projects:

```sh
pnpm exec playwright test e2e/hull-anatomy.spec.ts
```

### Geometry to outfitting

1. Open a build with fitted, empty, engineered, disabled and priority-shed hardpoints.
2. Open Hull Anatomy and confirm both package sides become available independently.
3. Activate each geometry target in turn.
4. Confirm feature 002 selects the exact package slot in one interaction and the selected facts match
   package/feature 005 state.
5. Confirm utility geometry is not an interactive mount and every utility remains in the complete
   ledger.

### Outfitting to geometry

1. Select each located hardpoint from the complete ledger.
2. Confirm a containing side is revealed using current-side/top/bottom preference and the occurrence
   scrolls nearest without page movement.
3. For Federal Corvette/Lynx duplicate fixtures, confirm both occurrences show identical selection,
   fitted, engineering and power state while the text list contains one item.
4. Select utility, internal and cargo-hatch slots; confirm no geometry is fabricated and editing still
   works.

### Asset failure and offline recovery

1. Intercept top, bottom and both asset requests as HTTP failures, offline uncached and invalid SVG.
2. Confirm only affected side regions become temporarily unavailable; exact slot inspection/editing
   remains complete.
3. Restore the request and trigger retry/connectivity; confirm the side arrives without reload and no
   stale hull appears.
4. Run the production static-server scenario: open a hull online, go offline, reload and confirm the
   already opened schematics return from the real Angular service worker.

### Provenance and privacy

1. Open Artwork and data provenance from anatomy and confirm feature 012 displays installed package
   licence/third-party/Frontier media terms.
2. Trigger the package-defect route and confirm it is identified as external.
3. Inspect the URL/request and confirm it contains no hull, slot, module, build or Commander data.

## Responsive and accessibility validation

For every meaningful state above:

1. Run automated axe checks in Chromium and Firefox for desktop, tablet/mobile portrait and
   landscape.
2. At 200% text and 400% zoom, confirm every fact/action remains available, side regions/list stack,
   and the document has no horizontal overflow. Only the bounded schematic viewport may scroll.
3. By touch/pointer, confirm every geometry target and independent list action meets the shared
   target baseline and nearby hardpoints remain separately operable.
4. With reduced motion, confirm reveal has no smooth/nonessential animation and loses no meaning.
5. With expanded and RTL application text, confirm labels wrap, reading order remains semantic and
   package geometry is not mirrored as if its physical meaning changed.
6. With a screen reader, confirm side/image names, unique list order, selected detail relationship,
   duplicate semantics, unavailable states and coalesced announcements.

Expected: zero in-scope automated violations and a complete screen-reader journey. Any conformance
statement names the constitutional keyboard exclusions.

## Performance and network validation

1. On the shared throttled mobile baseline, measure selection/list/detail update after assets are
   cached.
2. Confirm the matching build/condition revision settles within 100 ms and no stale mixed state is
   shown.
3. Record initial application network requests and confirm unrequested hull schematics are absent.
4. Reject any automatic request whose origin differs from the application origin.

Expected: anatomy remains responsive, lazy and entirely same-origin; artwork state never gates the
slot ledger or editor.
