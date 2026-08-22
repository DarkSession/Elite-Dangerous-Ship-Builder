# Responsive Composition

## Reference and selection rule

`.design/Ship Builder.dc.html` supplies only canvas 1c at 1560 CSS px and canvas 1d at 390 CSS px
with a minimum 844px height. These are reference canvases, not implementation breakpoints. There is no
tablet design. Feature 011 content/container tokens select a composition from available inline space,
localized content and zoom—not device detection or a hard-coded user-agent class.

All compositions preserve this semantic order:

1. feature 001 build identity and action header;
2. accepted-normalization or incoming-refusal feedback;
3. shared anatomy/status/calculation outlets;
4. feature 002 category, ledger and selected-slot controls;
5. active chooser/editor content.

Visual multi-column placement may differ, but DOM/assistive reading order remains coherent.

## Declared content minimums

Every "minimum" this document and the verification tasks refer to is one of these three. They are
content minimums measured on the region's own inline size, never a viewport label.

| Region                                 | Minimum inline size | What must fit at it                                                                     |
| -------------------------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| Ledger / master pane                   | 320 CSS px          | A slot card's exact key, one wrapped module name and its 44px controls without clipping |
| Selected-slot pane (chooser or editor) | 360 CSS px          | A candidate row's name, class, rating, mount and stacked labels plus a 44px fit control |
| Wide right rail                        | 280 CSS px          | One validation or cost line with its number and unit on at most two lines               |

Two panes are used only when both the ledger and selected-slot minimums fit together in the available
inline space, at the active text size, expansion and zoom. Three regions are used only when all three
fit. Otherwise the next composition down applies. A region that cannot reach its minimum is never
narrowed below it — the composition changes instead.

Height selects the compact composition on its own. Below the stylesheets' own `max-height: 30rem`
query — the same one that releases the sticky feet and the bounded scrollers — an inline composition
would stack the ledger, the fitting panel and the engineering panel into one page thousands of pixels
long with the last of them out of practical reach. A short viewport therefore gets canvas 1d's
composition whatever its width: the two actions, and a screen each. This is the same rule 400% zoom
already selects by, and reading it from the CSS query rather than from a second number is what keeps
the stylesheets and the layer decision from disagreeing.

## Wide composition

At space equivalent to the 1440×900 project viewport and where all three declared minimums fit, adapt
canvas 1c's three visual regions:

- left: persistent `ALL`, hardpoint, core, optional and utility controls plus the complete grouped
  slot ledger;
- center: shared anatomy/calculation outlet followed by selected-slot replacement and engineering
  regions inline;
- right: shared package validation, cost/material and downstream status outlets.

The wide header exposes the feature 002 editable ship name/ident control (FR-019) beside feature 001's
build identity, plus direct undo/redo. That control is an **in-place edit**, exactly as both canvases
draw it: the title _is_ the control, it turns into a field where it stands, and leaving the field
confirms it. Neither canvas draws a labelled field pair, a dialog or a row of Save and Cancel
controls, so none of them exists (wave 4); export, save and help
remain owned composition actions. Mounts anatomy may show top and bottom together. Ledger, manifest
and center regions may scroll internally; any wide fact table has a labeled overflow container. The
document itself never scrolls horizontally.

## Tablet interpolation

Tablet is an intentional plan-time interpolation because `.design` provides none.

- At a roomy landscape container (verified at 1112×834), use two panes below feedback/shared status:
  a complete ledger master on the left and selected-slot facts/chooser/editor on the right. Collapse
  the wide right rail into the shared status/outlet region above. Keep every action.
- At 834×1112 portrait, or whenever expanded/RTL/zoomed content cannot satisfy the 320 px ledger and
  360 px selected-slot minimums together, use the compact composition.
- If a future feature 011 token selects two panes at another size, tests must prove both declared
  content minimums, 44px controls and no document overflow; the viewport label alone is insufficient.

## Compact composition

At 390×844, 844×390, constrained tablet, and all 400%-zoom cases, follow canvas 1d:

- compact identity/actions header; when supplied by their owners, the source menu order is Save,
  Undo, disabled Redo, Import, Export, Help/FAQ. Undo/redo live in the named overflow action region;
- feedback, then anatomy/status outlet and concise metric/power strip;
- hardpoint/core/optional/utility category control (no `ALL` in compact mode);
- semantic slot cards and persistent selected-slot action bar.

Anatomy Mounts uses a top/bottom segmented switch rather than simultaneous plates. `Change module`
and `Engineer` are mutually exclusive full-screen application layers, not routes. Each has an
associated title/description, inert background, independent content scroll and safe-area-aware
persistent cancel plus primary action. Selected actions are package-driven: engineer is absent or
disabled for empty/package-incomplete/no-menu/cargo-hatch states; change/remove follows package capability and
reason.

Landscape may reduce decorative density but not facts, actions or feedback. The action bar must not
cover the final focus/reading target.

## Zoom, text and direction

- 200% text must reflow without clipped labels or lost controls.
- 400% browser zoom must select compact composition and produce no two-dimensional page scroll.
- Long localized and canonical fallback names wrap; identity ambiguity is not hidden by ellipsis.
- Internal horizontal scrolling is allowed only for explicitly labeled wide fact tables or segmented
  controls whose alternatives remain discoverable. The page never scrolls horizontally.
- RTL changes visual direction, not semantic order or exact game identity.
- Reduced motion removes transitions without delaying state or announcements.

## Verification matrix

Run Chromium and Firefox at 1440×900, 834×1112, 1112×834, 390×844 and 844×390. For every meaningful
workspace, chooser, editor, notice and refusal state, run axe plus semantic-order, 44px touch-target,
no-document-overflow, 200%-text, 400%-zoom, expanded/RTL and reduced-motion assertions. Conformance is
WCAG 2.2 AA except the constitutionally excluded keyboard criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1,
2.4.3, 2.4.7 and 2.4.11.
