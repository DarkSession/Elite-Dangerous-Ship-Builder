# Hull Detail Screen

**Route**: `/ships/:symbol`  
**Requirements**: FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, FR-009

## Composition

- Wide: canvas 1a's inspector rail beside the manifest. Narrow: canvas 1b's full-screen detail sheet with the bare back arrow the reference draws. Neither carries a page heading: the command bar names the screen (see [screen chrome](#screen-chrome-and-the-command-bar)).
- `HullArtwork` on the hatched plate, loaded from the same-origin package asset path with reserved area and temporary-unavailable text.
- The hull's name in tracked condensed amber, over one monospace identity line reading `MANUFACTURER · <PAD> LANDING PAD`. Both facts keep their labels in the markup; only the eye sees the compressed line.
- A ruled two-column `FactList` of the five figures the reference rail carries: speed at four pips, boost, base shield, base armour and hull mass, each with its localized unit.
- The mount classes the hull carries, under a section rule, as `<count> <CLASS>` chips with the classes it has none of left out.
- One `HULL PRICE` row: the ready-to-fly cost, on a rule of its own.
- Primary `ActionButton` requesting stock-build creation, present only when `getDefaultLoadout(symbol)` succeeds.
- `InlineNotice`/`ErrorSummary` for default unavailability or unknown symbol.

### Divergence from FR-004

FR-004 names every published figure — hardness, mass-lock factor, crew seats, heat capacity and dissipation, reserve fuel, the rotation rates — plus both cost fields and the full slot layout. **The reference inspector carries none of them**, on either artboard: canvas 1a's rail and canvas 1b's detail sheet both hold exactly the artwork, the identity line, five figures, the mount chips, one price and two actions.

An earlier build resolved this by folding the remainder into disclosures below the reference composition. That was rejected on 2026-08-21: anything the design does not draw is not on the screen. The screen is the reference composition; FR-004's remaining figures are **not shown**, and this note is the record of that.

What that leaves open, for whoever settles it:

- `hullDetailFacts()` still computes every figure FR-004 names and `HullDetailFacade` still formats them; only five reach the screen. The capability is intact and unit-tested.
- `SlotLayout` is unused by this screen. Canvas 1c's outfitting slot ledger is where the reference puts a slot layout, so feature 002 is its likely home.
- Either FR-004 is narrowed to what the reference draws, or the design gains a place to draw the rest. Both are decisions for the requirement's owner, not for the implementation.

## States

| State                            | Required presentation and behavior                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Populated                        | Every figure the reference inspector carries is shown with its unit; no build is created by entry.                                                        |
| Artwork loading                  | Facts and stock action remain usable; load state is textually available.                                                                                  |
| Artwork missing/offline uncached | Temporary same-origin asset absence is explained; the artwork coordinator retries when connectivity returns without a page reload; action remains usable. |
| Unknown symbol                   | Named error, catalogue-return action, no facts guessed, no build mutation/action.                                                                         |
| Replacement confirmation         | Current unsaved work and incoming stock hull are named; confirm commits candidate, cancel retains current build and detail.                               |
| Package factory failure          | Blocking error is announced once; current build and route state remain.                                                                                   |

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
- Speed/rotation endpoint labels name viewing conditions in text; they are not inferred from position.
- Hardness and mass lock are labeled ratings, not assigned invented units; all actual measurements name documented units.
- Canonical package text is marked untranslated when appropriate.
- The `.design/assets/ships/*.png` files and hard-coded mock values are visual references only. Runtime art is the package `illustration.svg` copied to the application origin, and every displayed value is read from the active package record.
- Component previews cover populated, missing-fact, artwork-loading/error, unknown-symbol and
  confirmation states.

## Reference composition

Measured from canvas 1a's inspector rail and canvas 1b's `sd-screen`.

| Part           | Canvas                                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artwork        | A fixed-height hatched plate inside an amber hairline; the illustration is contained, not cropped, and pushed into amber by a filter rather than by shipping a tinted copy    |
| Missing art    | The same plate, with the reason centred in Barlow 300 inside it                                                                                                               |
| Identity       | Hull name in condensed 700 tracked 0.08em at the display step, over a monospace line reading `MANUFACTURER · LANDING PAD`                                                     |
| Facts          | A two-column grid whose one-pixel gaps expose an amber ground as rules; each cell is a tracked monospace label over a larger monospace value; a final cell spans both columns |
| Hardpoints     | A section rule — tracked label, a hairline filling the width, the total on the trailing edge — over count-and-size pills                                                      |
| Price          | Its own rule, the label on the leading edge and the value in large monospace amber with a quiet `cr` suffix                                                                   |
| Actions        | The stock-hull action filled amber, condensed 700 tracked 0.22em, full width; the secondary action bordered beneath it                                                        |
| Compact layout | The same stack as a full-screen layer with a back arrow in its command bar and the actions pinned to a footer plate                                                           |
