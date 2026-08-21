# Hull Detail Screen

**Route**: `/ships/:symbol`  
**Requirements**: FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, FR-009

## Composition

- Wide: canvas 1a's inspector rail beside the manifest. Narrow: canvas 1b's full-screen detail sheet with the bare back arrow the reference draws. Neither carries a page heading: the command bar names the screen (see [screen chrome](#screen-chrome-and-the-command-bar)).
- `HullArtwork` on the hatched plate, loaded from the same-origin package asset path with reserved area and temporary-unavailable text.
- The hull's name in tracked condensed amber, over one monospace identity line reading `MANUFACTURER · <PAD> LANDING PAD`. The pad class is named as a pad class — `LARGE LANDING PAD`, not a bare `LARGE` — through `hullDetail.landing-pad`. Both facts keep their labels in the markup; only the eye sees the compressed line.
- A ruled two-column `FactList` of the eight figures the reference's metric grid carries: speed, boost, shield, armour, hull mass, hardness, crew and mass lock, each with its localized unit where the reference draws one.
- The mount classes the hull carries, under a section rule, as `<count> <CLASS>` chips with the classes it has none of left out.
- One `HULL PRICE` row: the ready-to-fly cost, on a rule of its own.
- Primary `ActionButton` requesting stock-build creation, present only when `getDefaultLoadout(symbol)` succeeds.
- `InlineNotice`/`ErrorSummary` for default unavailability or unknown symbol.

### The inspector is the reference composition

Canvas 1a's rail and canvas 1b's detail sheet hold exactly the artwork, the identity line, the metric grid, the mount chips, one price and the hull action. This screen holds those and nothing else.

The earlier divergence recorded here is **closed**. The design gained hardness, crew and mass lock on 2026-08-21, and FR-004 was narrowed the same day to drop heat capacity and dissipation, reserve fuel, the rotation rates and the slot layout. The metric grid is now the reference's eight figures, in its order:

| Reference label | Fact id         | Unit |
| --------------- | --------------- | ---- |
| `SPEED m/s`     | `maximum-speed` | m/s  |
| `BOOST m/s`     | `boost`         | m/s  |
| `SHIELD MJ`     | `base-shield`   | MJ   |
| `ARMOUR`        | `base-armour`   | —    |
| `HULL MASS t`   | `hull-mass`     | t    |
| `HARDNESS`      | `hardness`      | —    |
| `CREW`          | `crew`          | —    |
| `MASS LOCK`     | `masslock`      | —    |

Four of the eight carry no unit, because the reference draws none: hardness and mass lock are comparative numbers the game publishes bare, crew is a count, and armour is drawn as `ARMOUR`, not as "hull points". `HullFactUnit` admits `null` for exactly that, so nothing is invented to fill the column.

Every figure in the grid is whole. The reference draws `400`, not `400.0`, and hull mass was the one figure carrying a fraction digit; `HullFact.fractionDigits` is gone with it, so there is no place left to add one back by accident.

The viewing condition — "at 4 ENG pips" — is gone with the rotation rates and the zero-pip endpoints that needed it. `SPEED` is the reference's one speed figure.

`SlotLayout` is deleted. Canvas 1c's outfitting slot ledger is where the reference puts a slot layout, and that belongs to feature 002.

## States

| State                            | Required presentation and behavior                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Populated                        | Every figure the reference inspector carries is shown with its unit; no build is created by entry.                                                                                                                                                                                                                                                            |
| Artwork loading                  | Facts and stock action remain usable; the loading mark is drawn inside the artwork plate so nothing below it moves when the illustration arrives, and the plate carries the mark alone — a hull that is no longer the hull being asked for is hidden rather than held up until the new one decodes. The load state stays textually available beside the mark. |
| Artwork missing/offline uncached | Temporary same-origin asset absence is explained; the artwork coordinator retries when connectivity returns without a page reload; action remains usable.                                                                                                                                                                                                     |
| Unknown symbol                   | Named error, catalogue-return action, no facts guessed, no build mutation/action.                                                                                                                                                                                                                                                                             |
| Replacement confirmation         | Current unsaved work and incoming stock hull are named; confirm commits candidate, cancel retains current build and detail.                                                                                                                                                                                                                                   |
| Package factory failure          | Blocking error is announced once; current build and route state remain.                                                                                                                                                                                                                                                                                       |

## Creation transaction

1. Confirm the route symbol resolves and a package default record exists.
2. Construct `ShipLoadout.default(symbol)` as a detached candidate.
3. Confirm every fixed mount is package-populated and read package validation.
4. Ask replacement confirmation only after candidate success when active work is unsaved.
5. On acceptance, commit to `ActiveBuildStore`, copy to this tab's working record, publish the fragment if representable and navigate to `/build`.

No image state participates in these steps.

## Responsive and accessibility notes

- The exact same `/ships/:symbol` state appears as a wide inspector or narrow full-screen layer; browser history and symbol identity do not depend on the breakpoint.
- Facts reflow from inspector groups to one narrow column without changing heading or definition order.
- Hardness, crew, mass lock and armour are drawn bare, as the reference draws them, rather than being given an invented unit; every figure that has a unit names it.
- Canonical package text is marked untranslated when appropriate.
- The canvas's hard-coded mock values are visual references only; every displayed value is read from the active package record. Runtime art is the package `illustration.svg` rasterised to PNG by `scripts/convert-ship-artwork.mjs` and served from this application's origin, matching the reference's own `assets/ships/*.png`.
- Component previews cover populated, missing-fact, artwork-loading/error, unknown-symbol and
  confirmation states.

## Reference composition

Measured from canvas 1a's inspector rail and canvas 1b's `sd-screen`.

| Part           | Canvas                                                                                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artwork        | A fixed-height hatched plate inside an amber hairline; the illustration is contained, not cropped, and pushed into amber by a filter rather than by shipping a tinted copy                                                    |
| Missing art    | The same plate, with the reason centred in Barlow 300 inside it                                                                                                                                                               |
| Identity       | Hull name in condensed 700 tracked 0.08em at the display step, over a monospace line reading `MANUFACTURER · LANDING PAD`                                                                                                     |
| Facts          | A two-column grid whose one-pixel gaps expose an amber ground as rules; each cell is a tracked monospace label over a larger monospace value; a final cell spans both columns                                                 |
| Hardpoints     | A section rule — tracked label, a hairline filling the width, the total on the trailing edge — over count-and-size pills                                                                                                      |
| Price          | Its own rule, the label on the leading edge and the value in large monospace amber with a quiet `cr` suffix                                                                                                                   |
| Actions        | The stock-hull action filled amber, condensed 700 tracked 0.22em, full width. The reference's second rail button opens the saved-build library, which the command bar already offers on this screen, so it is not drawn twice |
| Compact layout | The same stack as a full-screen layer with a back arrow in its command bar and the actions pinned to a footer plate                                                                                                           |
