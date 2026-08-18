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

## Wide composition

At space equivalent to the 1440×900 project viewport and where declared region minimums fit, adapt
canvas 1c's three visual regions:

- left: persistent `ALL`, hardpoint, core, optional and utility controls plus the complete grouped
  slot ledger;
- center: shared anatomy/calculation outlet followed by selected-slot replacement and engineering
  regions inline;
- right: shared package validation, cost/material and downstream status outlets.

The wide header exposes editable identity from feature 001 and direct undo/redo; export, save and help
remain owned composition actions. Mounts anatomy may show top and bottom together. Ledger, manifest
and center regions may scroll internally; any wide fact table has a labeled overflow container. The
document itself never scrolls horizontally.

## Tablet interpolation

Tablet is an intentional plan-time interpolation because `.design` provides none.

- At a roomy landscape container (verified at 1112×834), use two panes below feedback/shared status:
  a complete ledger master on the left and selected-slot facts/chooser/editor on the right. Collapse
  the wide right rail into the shared status/outlet region above. Keep every action.
- At 834×1112 portrait, or whenever expanded/RTL/zoomed content cannot satisfy both pane minimums,
  use the compact composition.
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
