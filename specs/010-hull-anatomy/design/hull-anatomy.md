# Hull Anatomy

**Route context**: capability surface inside `/build`; no new route

**Design-system composition**: workspace capability heading/navigation, same-origin asset status,
labelled side regions/selector, bounded `HullSchematic` viewport, state legend, selected fact group,
semantic hardpoint list, exact-slot actions, shared notices/live regions and provenance action.

## Purpose

Let a Commander locate every package-annotated weapon hardpoint on the current hull, understand its
current fitted/engineering/selection/power state and move in either direction between geometry and
the exact outfitting slot. Geometry augments rather than replaces the complete slot ledger.

## Entry and exit

- The active build workspace exposes Hull Anatomy as a capability without changing the route.
- Entry captures one hull symbol, build revision, condition revision and selected slot.
- A geometry or list action selects/reveals the exact slot through feature 002. Wide layouts keep the
  inline context; narrow layouts use feature 002's existing selected-slot layer with a named return.
- Losing the active build returns to the workspace no-build state. Feature 010 never creates a
  placeholder hull or loads an asset from route text.
- The provenance action stays inside feature 012 help/legal. Its package-defect action explicitly
  identifies external navigation and never includes build data.

## Information order

Semantic and narrow-screen order is fixed:

1. capability heading, active hull context and artwork/data provenance action;
2. independent top/bottom availability summary;
3. labelled side selector where only one side is shown;
4. selected side schematic, state legend and internal-pan instruction when overflow exists;
5. selected hardpoint facts when a located slot is selected;
6. unique package-ordered hardpoint text equivalent;
7. feature 002 complete slot ledger/editor context.

At wide widths, top and bottom may form two fluid columns and selected facts/list may occupy a
neighboring or following region. Tablet chooses one or two columns from available inline size, not a
device-name breakpoint. At narrow widths, 400% zoom, expanded text and landscape phones, one side is
shown and every group stacks. Semantic order never follows SVG drawing order.

## Schematic region

- Each side uses the installed Almanac asset for the exact active hull symbol and names top/bottom in
  text.
- Artwork linework is rendered from the validated typed package tree. Application-owned state style
  overrides use shared tokens only; package geometry is not rewritten.
- Only an annotation admitted by the #308 contract and resolved to package kind `hardpoint` becomes
  interactive. Utility markers remain inert artwork and receive no label suggesting interaction.
- Every valid hardpoint renders its original geometry plus a transparent, non-scaling interaction
  clone from the same path/circle. No badge coordinate, centre, `getBBox` result or private overlay
  map exists.
- The occurrence name includes side, slot and complete state. Selected state relates it to the
  selected fact group. Duplicate occurrences have distinct side names but one canonical slot state.
- A valid side with zero hardpoints shows the complete artwork and explicit “no located hardpoints on
  this side” text; it is not a loading/error state.

## State legend and visual language

The legend describes the tokenized supplements for:

- fitted and empty;
- engineered and stock;
- selected;
- disabled, inactive while retracted, powered, priority-shed and qualified/unavailable power.

Every legend entry repeats the text used by items. No color, fill, stroke, dash, opacity, shape or
animation is meaningful without that text. Unknown power never receives the visual for powered or
shed.

## Selected hardpoint facts

When a located slot is selected, show:

- exact slot key;
- package slot size or unavailable;
- empty, resolved module name/symbol or unresolved identity;
- stock/engineered/unavailable state;
- effective priority or unavailable from feature 005;
- current disabled/inactive/powered/shed/qualified state under the named deployed/retracted
  condition;
- one exact feature 002 slot action where the surrounding composition does not already expose it.

No weapon statistic, position, direction, distance, utility or internal location is inferred here.
Feature 002 owns editing and detailed engineering; feature 005 owns complete power explanation.

## Unique hardpoint text equivalent

- One semantic item appears per package hardpoint slot, in `slots('hardpoint')` order, even before
  geometry loads.
- Each item includes the same slot, size, fitted, engineering, selected, priority and current power
  text as the geometry/fact group, plus whether geometry appears on top, bottom or both.
- Each item has a distinct 44 CSS-pixel action named for the slot/module. It selects feature 002 and
  reveals a containing schematic.
- Cross-side duplicates remain one item. The current Federal Corvette and Lynx Highliner repeats are
  required preview/test states.
- The list remains present when one or both assets are unavailable. Each item says location pending,
  top/bottom/both, temporarily unavailable or package defect without guessing; it never replaces or
  filters feature 002's complete ledger.

## Two-way reveal and native panning

- Selecting geometry/list emits only the canonical slot key to feature 002.
- Selecting a located slot in outfitting retains the current side if it contains the slot; otherwise
  reveals top, then bottom. Wide layout keeps both side regions visible.
- Every occurrence for the selected key receives identical selected state.
- The rendered occurrence uses nearest native `scrollIntoView`; no coordinate is read or persisted.
- Schematic overflow is bounded within its region with visible native scrollbars/affordance. Touch,
  trackpad and wheel work without a custom drag gesture.
- Smooth reveal is optional and disabled under `prefers-reduced-motion`.
- The canonical list and complete feature 002 ledger mean internal panning is never required to
  inspect or edit a slot.

## Loading, failure and defect behavior

| State                         | Presentation and behavior                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Both loading                  | Independent named placeholders; canonical/complete lists remain interactive                                                |
| One ready, one loading        | Render ready side immediately; retain pending label for the other                                                          |
| One temporarily unavailable   | Side-local explanation and retry; other side/list/editor unchanged                                                         |
| Both temporarily unavailable  | Two named explanations/retries; no false claim that hull lacks geometry                                                    |
| Uncached offline              | Identify temporary absence and automatic online retry; no reload required                                                  |
| Invalid/unsafe package SVG    | Reject the side, show localized package-defect notice and fixed feature 012 report action; never inject markup             |
| Unknown/wrong-kind annotation | Omit that occurrence, name the package defect once and keep the exact slot in feature 002's ledger                         |
| Repeated key                  | Group valid repeats under one item; if a repeat violates #308, omit every ambiguous occurrence rather than choose by order |
| Valid side with zero weapons  | Render asset and explicit side-empty text                                                                                  |
| Unexpected projection failure | Shared alert; no stale prior hull geometry/facts; active build and complete ledger remain intact                           |

Initial and unchanged availability is silent. A side failure/recovery or settled slot/power change
uses one localized coalesced announcement and never repeats all SVG occurrences.

## Requirement mapping

This surface owns FR-001–FR-012 in composition with its named prerequisites. The schematic regions
own FR-001–FR-003, FR-005–FR-007, FR-009, FR-010 and FR-012; selected facts own FR-005 and FR-008;
the unique list owns FR-004–FR-008, FR-010 and FR-012; feature 002's ledger provides the invariant
fallback for FR-004/FR-010; feature 012's action satisfies FR-011.
