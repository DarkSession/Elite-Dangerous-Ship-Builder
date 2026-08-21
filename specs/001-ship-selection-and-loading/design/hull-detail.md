# Hull Detail Screen

**Route**: `/ships/:symbol`  
**Requirements**: FR-001, FR-003, FR-004, FR-005, FR-006, FR-007, FR-009

## Composition

- Wide: canvas 1a's inspector rail beside the manifest, with package hull-name heading and no duplicate page landmark. Narrow: canvas 1b's full-screen detail layer with a named back action to the preserved catalogue session and its own route heading.
- `HullArtwork` loaded from the same-origin package asset path with reserved 3:2 area and temporary-unavailable text.
- “Hull specifications” `FactList`, explicitly described as bare-hull/catalogue facts rather than active-build results.
- Facts: manufacturer; size; minimum/four-pip speed and boost; base shield and armour; hull mass; hardness; mass-lock factor; crew seats; heat capacity and dissipation; reserve fuel; min/four-pip pitch, roll and yaw; hull-only and retail costs. Every measured value includes a localized unit.
- `SlotLayout`, grouped semantically by armour, core, hardpoint, utility, optional and cargo hatch using package-enumerated game keys/sizes/restrictions.
- Primary `ActionButton` requesting stock-build creation, present only when `getDefaultLoadout(symbol)` succeeds.
- `InlineNotice`/`ErrorSummary` for default unavailability or unknown symbol.

The reference mock's compact speed/boost/shield/armour/mass/hardpoint/price summary defines the initial hierarchy, not the complete data set. The inspector scrolls or expands below that summary to expose every FR-004 fact and full slot layout. “Hull price” is split into explicitly labeled hull-only and ready-to-fly retail costs.

## States

| State                            | Required presentation and behavior                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Populated                        | Every available package fact and slot is shown; no build is created by entry.                                                                             |
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
