# Screen Inventory: Cost and Materials

Feature 009 adds no route and no navigation. It contributes two blocks — `COST` and `MATERIALS` — to
the outfitting workspace's status rail (canvas 1c) and Status stack (canvas 1d). It adds nothing to
the `b.…` build fragment, storage, history or exports.

Following the wave 10 ruling ([reference-review.md](./reference-review.md)), there is no detail
route, no capability target, no trace disclosure and no evidence list. The rail blocks _are_ the
capability.

| Screen/surface  | Wide desktop (1c)                            | Tablet / orientation   | Mobile (1d) / 400% zoom       | Requirements  |
| --------------- | -------------------------------------------- | ---------------------- | ----------------------------- | ------------- |
| No active build | Existing workspace empty state; no blocks    | Same                   | Same                          | Prerequisite  |
| `COST` block    | Four rows in the status rail                 | Same rows, labels wrap | Same rows in the Status stack | FR-001–FR-003 |
| `MATERIALS`     | Heading + blueprint count, every row, footer | Same, fluid width      | Same, one column              | FR-007–FR-010 |
| Merc Coin row   | Final row of `MATERIALS`, conditional        | Same                   | Same                          | FR-004–FR-006 |
| No engineering  | `COST` only; materials block absent          | Same                   | Same                          | FR-007        |

## Requirement mapping

| Requirement | Surface behavior                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| FR-001      | Every figure is a package result, except the ruled blueprint, type and unit counts.                    |
| FR-002      | Hull, Modules, `TOTAL` and rebuy are package values; `unpriced` is not presented.                      |
| FR-003      | Historical purchase values are absent from state and presentation.                                     |
| FR-004      | Merc Coin applicability comes only from the package's build-cost total.                                |
| FR-005      | The row carries literal `buildCost().mercCoins`, outside the type and unit counts.                     |
| FR-006      | A zero package total means no row and no zero in its place.                                            |
| FR-007      | Consolidated rows come from `buildCost().materials`; 002's boundary supplies only the blueprint count. |
| FR-008      | An uncostable recipe contributes nothing and is not named (ruled F).                                   |
| FR-009      | Fixed and Mercenary purchase baselines contribute no craft cost, as 002's boundary already decides.    |
| FR-010      | Names use package helpers through `edsb-game-text`; rarity uses `edsb-material-grade`.                 |

## Cross-feature ownership

- Feature 001 supplies the active build and the `/build` workspace.
- Feature 002 supplies the fitted state, the `engineeringCost()` boundary, `sortMaterialLines` and
  `edsb-material-grade`. It also supplied `edsb-material-cost-list`, withdrawn 2026-08-23 with the
  Engineer panel's own list (ruling G, amended).
- Feature 003 owns the rest of the status rail. Feature 009 contributes two sibling blocks into it
  and holds no port, adapter or summary vocabulary of its own — the Assembly Requirements adapter is
  withdrawn with ruling F.
- Feature 011 supplies tokens, primitives, localization, formatters and the test matrix.
- No feature retains or presents historical purchase provenance.

Each feature-009 component previews its populated, no-engineering and Merc-Coin-absent states at
desktop, tablet and mobile widths. There are no lower-bound, unavailable, pending or error previews,
because there are no such states.
