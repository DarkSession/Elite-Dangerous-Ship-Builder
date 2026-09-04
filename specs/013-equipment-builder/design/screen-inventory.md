# Screen Inventory: Equipment Builder

The bench is one route, one screen, and the dialogs feature 001 and feature 004 already own. It adds
no chrome: the shared shell surrounds it as it surrounds the ship tool.

## Inventory

| Surface               | Kind                     | Appears at                                   | Purpose                                                                   |
| --------------------- | ------------------------ | -------------------------------------------- | ------------------------------------------------------------------------- |
| Tool bar entry        | shared shell             | every screen                                 | names and opens the bench; the registry gains one row                     |
| Loadout ledger        | region                   | `/equipment`, wide; `LOADOUT` tab, compact   | the suit and every mount, each with its modification count                |
| Item view             | region                   | `/equipment`, wide; a drill-in, compact      | the selected item: identity, grade ladder, attributes, modification slots |
| Weapon chooser        | layer over the item view | both                                         | the weapons the selected mount accepts                                    |
| Modification chooser  | layer over the item view | both                                         | the recipes the selected slot accepts, and clearing it                    |
| Commander stats       | region                   | `/equipment`, wide; `STATS` tab, compact     | shields, resistances and firepower for the assembled Commander            |
| Material requirements | region                   | `/equipment`, wide; `MATERIALS` tab, compact | the micro-resources the fitted modifications require                      |
| Save dialog           | feature 001              | over the bench                               | name, note, and the overwrite-or-keep-both question                       |
| Saved records         | feature 001              | `/builds`                                    | one list holding builds and loadouts, each row naming its tool            |
| Export dialog         | feature 004 pattern      | over the bench                               | share link, loadout JSON, readable summary                                |

The `SUIT TOOLS` rows sit inside the ledger and are never selectable: tools are fitted to every
suit and cannot be swapped, so the region states what the suit carries and the item view never
opens on one (FR-005a).

**Withdrawn from artboard `1a`, with the reason**: the bench's own topbar, its own `SAVED LOADOUTS`
list, its own `EXPORT` chrome and its own `HELP · ABOUT` with a separate application version — the
shell, feature 001's library and feature 012's modal own all four. Recorded in
[reference-review.md](./reference-review.md), which also records the three regions restored on
2026-09-03 once Almanac 0.2.9 published what they needed.

## Requirement mapping

| Requirement | Ledger                    | Item view                                       | Stats / materials                      | Dialogs and shell           | Codec / storage            |
| ----------- | ------------------------- | ----------------------------------------------- | -------------------------------------- | --------------------------- | -------------------------- |
| FR-001      | offers every suit         | names the selected suit                         | —                                      | —                           | `SUITS` in the table       |
| FR-002      | —                         | the grade ladder                                | —                                      | —                           | `SUIT_GRADES` refusal      |
| FR-002a     | shows each weapon's grade | the weapon's own ladder                         | —                                      | —                           | `WEAPON_GRADES` refusal    |
| FR-003      | one row per mount         | the chooser's contents                          | —                                      | —                           | `WEAPON_MOUNTS` refusal    |
| FR-004      | —                         | make, class, type, mode                         | —                                      | —                           | `WEAPONS` in the table     |
| FR-005      | —                         | the attributes, with the derived combat figures | —                                      | —                           | —                          |
| FR-005a     | the suit tools carried    | —                                               | —                                      | —                           | not carried anywhere       |
| FR-006      | —                         | —                                               | shields, resists, firepower per weapon | —                           | recomputed, never carried  |
| FR-007      | held mounts, named        | unavailable state                               | held excluded                          | —                           | held content round-trips   |
| FR-008      | slot counts per item      | open and locked slots                           | —                                      | —                           | four fields always         |
| FR-009      | —                         | the chooser's contents                          | —                                      | —                           | duplicate refused          |
| FR-010      | —                         | engineers per modification                      | —                                      | —                           | —                          |
| FR-011      | —                         | locked-slot state                               | locked excluded                        | —                           | locked content round-trips |
| FR-012      | —                         | clear slot                                      | —                                      | —                           | —                          |
| FR-013      | —                         | —                                               | the material list                      | —                           | —                          |
| FR-014      | —                         | —                                               | one application each; no upgrade cost  | —                           | —                          |
| FR-015      | —                         | the resolved recipe                             | its own materials                      | —                           | `WEAPON_MODIFICATION_SETS` |
| FR-016      | —                         | —                                               | —                                      | save, saved records         | record envelope            |
| FR-017      | —                         | —                                               | —                                      | overwrite or keep both      | —                          |
| FR-018      | —                         | —                                               | —                                      | —                           | `edsb:record:<uuid>`       |
| FR-018a     | —                         | —                                               | —                                      | —                           | held and locked carried    |
| FR-019      | —                         | —                                               | —                                      | unopenable row, left intact | migrate-on-open            |
| FR-020      | —                         | —                                               | —                                      | the export dialog's three   | encoder                    |
| FR-021      | —                         | —                                               | —                                      | the refusal notice          | decoder, mount named       |
| FR-022      | undo and redo             | undo and redo                                   | —                                      | —                           | —                          |
| FR-023      | compact tab               | drill-in                                        | compact tabs                           | sheets at narrow widths     | —                          |
| FR-024      | every string and figure   | every string and figure                         | every string and figure                | every string and figure     | —                          |
| FR-025      | package text              | package text                                    | micro-resource names                   | —                           | —                          |
| FR-026      | —                         | —                                               | —                                      | app shell, no fetch         | —                          |
| FR-027      | `/equipment`              | —                                               | —                                      | tool bar entry              | `e.` fragment              |

Every requirement has at least one owning surface. No requirement rests on the withdrawn chrome.

## States each surface must handle

| Surface               | States                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Ledger                | empty bench, suit selected, mount empty, mount filled, mount held, Flight Suit (one secondary mount only), the suit tools listed |
| Suit tools            | a suit carrying two tools and one carrying three; the header count matching the rows; every row unselectable                     |
| Item view             | suit selected, weapon selected, no selection, slots open, slots locked, no slots at all (Flight Suit)                            |
| Choosers              | populated, filtered to the mount, a recipe already fitted on this item, cleared                                                  |
| Commander stats       | no suit, suit only, weapons fitted, held weapons present and excluded, firepower without a per-second figure                     |
| Material requirements | none fitted, some fitted, all locked (so none counted)                                                                           |
| Every surface         | alternate locale, expanded text, RTL, reduced motion, 200% text, 400% zoom, offline                                              |

## Inherited baseline

Responsiveness and touch (constitution V), translatability and locale-formatted figures
(constitution VI) and composition from the one design system (constitution VII) are behavioural
requirements from the start, governed by feature 011's accepted FR-011, FR-012, FR-015 and FR-021.
They are listed so that tasks satisfying them map to an accepted requirement rather than to nothing.
