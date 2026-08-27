# Token Contrast Evidence

Generated from the primitive literals in [`src/styles/tokens/_primitives.scss`](../../../src/styles/tokens/_primitives.scss)
and the role aliases in [`src/styles/tokens/_semantic.scss`](../../../src/styles/tokens/_semantic.scss).

Ratios are WCAG 2.x relative-luminance contrast. Alpha inks are composited over
each opaque surface before measurement, because that is what a reader actually
sees. Every semantic role is measured against **every surface it is allowed to
appear on**, and the reported **Min** is the worst of those — a role passes only
if its worst case passes.

Thresholds applied (FR-012):

- text and images of text: **4.5:1** (WCAG 2.2 SC 1.4.3 at AA, normal weight and
  size — the system claims no large-text exemption, so no role relies on 3:1);
- meaningful non-text: **3:1** (SC 1.4.11) — boundaries that carry state,
  indicators and focus rings;
- decorative-only tokens are exempt by SC 1.4.11 and are named so that a
  component cannot reach for one to carry meaning.

Surfaces measured: `surface-root`, `surface-sunken`, `surface-panel`, `surface-panel-raised`, `surface-menu`, `surface-layer`, `surface-inset`.

## Text roles

| Token                   | Primitive                | Role                                         | Required | surface-root | surface-sunken | surface-panel | surface-panel-raised | surface-menu | surface-layer | surface-inset | Min         | Verdict |
| ----------------------- | ------------------------ | -------------------------------------------- | -------- | ------------ | -------------- | ------------- | -------------------- | ------------ | ------------- | ------------- | ----------- | ------- |
| `--edsb-text-primary`   | `--edsb-palette-ink`     | Body and heading text, primary values        | 4.5:1    | 14.80        | 14.89          | 14.32         | 13.86                | 14.10        | 13.98         | 12.84         | **12.84:1** | PASS    |
| `--edsb-text-secondary` | `--edsb-palette-ink-a80` | Supporting text and secondary labels         | 4.5:1    | 9.58         | 9.61           | 9.36          | 9.15                 | 9.26         | 9.21          | 8.62          | **8.62:1**  | PASS    |
| `--edsb-text-muted`     | `--edsb-palette-ink-a62` | Descriptions, hints, metadata                | 4.5:1    | 6.05         | 6.06           | 6.00          | 5.92                 | 5.97         | 5.94          | 5.70          | **5.70:1**  | PASS    |
| `--edsb-text-subtle`    | `--edsb-palette-ink-a55` | Lowest-emphasis text — the audited floor     | 4.5:1    | 4.97         | 4.96           | 4.95          | 4.91                 | 4.94         | 4.92          | 4.77          | **4.77:1**  | PASS    |
| `--edsb-text-accent`    | `--edsb-palette-amber-2` | Accent text, selected labels, links          | 4.5:1    | 10.06        | 10.12          | 9.73          | 9.42                 | 9.59         | 9.50          | 8.73          | **8.73:1**  | PASS    |
| `--edsb-text-danger`    | `--edsb-palette-hot`     | Error text and blocking messages             | 4.5:1    | 6.95         | 6.99           | 6.73          | 6.51                 | 6.63         | 6.57          | 6.03          | **6.03:1**  | PASS    |
| `--edsb-text-success`   | `--edsb-palette-good`    | Success and within-limit text                | 4.5:1    | 11.42        | 11.49          | 11.05         | 10.70                | 10.88        | 10.79         | 9.91          | **9.91:1**  | PASS    |
| `--edsb-text-info`      | `--edsb-palette-cool`    | Informational text                           | 4.5:1    | 10.85        | 10.92          | 10.50         | 10.16                | 10.34        | 10.25         | 9.42          | **9.42:1**  | PASS    |
| `--edsb-text-disabled`  | `--edsb-palette-ink-a55` | Disabled control text — readable by contract | 4.5:1    | 4.97         | 4.96           | 4.95          | 4.91                 | 4.94         | 4.92          | 4.77          | **4.77:1**  | PASS    |
| `--edsb-text-numeric`   | `--edsb-palette-ink-2`   | Monospaced metric values                     | 4.5:1    | 13.31        | 13.39          | 12.87         | 12.46                | 12.68        | 12.57         | 11.55         | **11.55:1** | PASS    |

## Meaningful non-text roles

| Token                   | Primitive                | Role                                      | Required | surface-root | surface-sunken | surface-panel | surface-panel-raised | surface-menu | surface-layer | surface-inset | Min        | Verdict |
| ----------------------- | ------------------------ | ----------------------------------------- | -------- | ------------ | -------------- | ------------- | -------------------- | ------------ | ------------- | ------------- | ---------- | ------- |
| `--edsb-border-strong`  | `--edsb-palette-ink-a45` | Control boundaries, focusable field edges | 3:1      | 3.67         | 3.66           | 3.69          | 3.69                 | 3.69         | 3.69          | 3.64          | **3.64:1** | PASS    |
| `--edsb-border-default` | `--edsb-palette-ink-a42` | Panel, table and group boundaries         | 3:1      | 3.33         | 3.32           | 3.37          | 3.37                 | 3.37         | 3.37          | 3.34          | **3.32:1** | PASS    |
| `--edsb-border-accent`  | `--edsb-palette-amber`   | Selected/current boundary and indicators  | 3:1      | 8.45         | 8.50           | 8.17          | 7.91                 | 8.05         | 7.98          | 7.33          | **7.33:1** | PASS    |
| `--edsb-border-danger`  | `--edsb-palette-hot`     | Invalid control boundary                  | 3:1      | 6.95         | 6.99           | 6.73          | 6.51                 | 6.63         | 6.57          | 6.03          | **6.03:1** | PASS    |
| `--edsb-border-success` | `--edsb-palette-good`    | Success indicator boundary                | 3:1      | 11.42        | 11.49          | 11.05         | 10.70                | 10.88        | 10.79         | 9.91          | **9.91:1** | PASS    |
| `--edsb-border-info`    | `--edsb-palette-cool`    | Informational indicator boundary          | 3:1      | 10.85        | 10.92          | 10.50         | 10.16                | 10.34        | 10.25         | 9.42          | **9.42:1** | PASS    |
| `--edsb-focus-ring`     | `--edsb-palette-amber-2` | Focus indicator                           | 3:1      | 10.06        | 10.12          | 9.73          | 9.42                 | 9.59         | 9.50          | 8.73          | **8.73:1** | PASS    |

### The gunsight plate's three marks

Feature 007's plate is the one surface these three appear on, and it is not one
of the seven grounds above: it is the hatch `--edsb-texture-plate` draws, over
which each mark carries a halo in `--edsb-surface-sunken`. So they are measured
against the hatch's two stripes and against that halo, which is every ground a
mark on this plate ever meets. Since 2026-08-27 they are the whole of what the
drawing separates — armed, empty, and the mount the workspace has open — and
nothing on the plate is text any more, so 3:1 is the whole requirement.

| Token                           | Primitive                   | Role                          | Required | hatch #161616 | hatch #111111 | halo #0a0a0b | Min        | Verdict |
| ------------------------------- | --------------------------- | ----------------------------- | -------- | ------------- | ------------- | ------------ | ---------- | ------- |
| `--edsb-surface-mount-armed`    | `--edsb-palette-amber`      | A hardpoint with a weapon     | 3:1      | 7.77          | 8.11          | 8.50         | **7.77:1** | PASS    |
| `--edsb-surface-mount-empty`    | `--edsb-palette-amber-deep` | A hardpoint with none         | 3:1      | 3.62          | 3.78          | 3.96         | **3.62:1** | PASS    |
| `--edsb-surface-mount-selected` | `--edsb-palette-cool`       | The mount the ledger has open | 3:1      | 9.98          | 10.42         | 10.92        | **9.98:1** | PASS    |

`amber-deep` is listed below as a **rejected reference pair** — and it is, as
_text_: 2.9:1 is under 4.5 and it carries no text role anywhere. This is a mark
ink at 3.62:1 on its own ground, which is a different requirement and the one it
is held to.

The three are hues of one shape, so a reader who cannot separate them separates
nothing on the plate. That is allowed here and nowhere else: the plate is
`aria-hidden` decoration, every mount is restated in text beside it, and every
fact the hues carry is also drawn in visible text in the same workspace — the
ledger's own row per hardpoint, and the panel's `WEAPONS` list
(`specs/007-offence-profile/spec.md` FR-011).

## Inverted pair

| Token                   | Foreground                       | Background                            | Required | Measured   | Verdict |
| ----------------------- | -------------------------------- | ------------------------------------- | -------- | ---------- | ------- |
| `--edsb-text-on-accent` | `--edsb-palette-bg-deep` #0a0a0b | `--edsb-surface-accent-solid` #ff8c1a | 4.5:1    | **8.50:1** | PASS    |

## Decorative tokens — exempt, and constrained

These are below 3:1 by construction. They exist for optical separation. A
component may not use one as the sole carrier of a boundary, state or grouping
that a reader needs (FR-010); the meaning is carried by text, and the audited
non-text roles above are used where a boundary itself is informative.

| Token                             | Primitive                | Permitted use            |
| --------------------------------- | ------------------------ | ------------------------ |
| `--edsb-border-decorative`        | `--edsb-palette-hair`    | Hairline separation only |
| `--edsb-border-decorative-strong` | `--edsb-palette-ink-a18` | Quiet separation only    |

## Reference pairs rejected

The product reference canvas uses these as visible text or as meaningful
boundaries. They are not accepted as semantic tokens. The hierarchy they created
is rebuilt with weight, size, spacing and the audited steps above — see
[design/reference-review.md](./reference-review.md).

Every one of the reference's 55 colour properties is carried into
`_primitives.scss` unchanged. What is constrained is which of them a **text**
role may point at: the canvas sets label text in ink washes from 0.32 to 0.50,
and those measure 2.4:1 to 4.2:1 against the nine grounds it actually uses.

The ladder is therefore shifted, not truncated. `--edsb-text-faint` — where the
canvas's 0.32–0.50 label band lands — is ink 0.55, the dimmest step that clears
4.5:1. The rungs above it keep their order and their spacing, so the four-level
hierarchy the canvas draws (faint label, subtle meta, muted body, primary value)
survives intact and slightly brighter.

| Reference pair               | Reference use               | Where it goes here                             |
| ---------------------------- | --------------------------- | ---------------------------------------------- |
| ink alpha 0.32–0.50          | Micro-labels, counts, units | Lifted to `--edsb-text-faint` (0.55, 4.74:1)   |
| ink alpha 0.18–0.38          | Control and panel borders   | Kept, as decorative hairlines only             |
| amber alpha 0.14–0.45        | Field edges, grid rules     | Kept, as decorative hairlines and grid grounds |
| amber-deep #8a6a3a           | Reference emphasis text     | No text role; 2.9:1                            |
| hair rgb(255 255 255 / 0.04) | Row and list dividers       | Kept as `--edsb-border-decorative`             |

A decorative boundary is never a control's only identification: a field is a
darker fill inside its hairline, a selected row carries `aria-current` and a
word, and a segment's state is its own checked state.

## Non-colour evidence

| Concern                        | Token                      | Evidence                                                                                                                                                                                                                                                                              |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target size (SC 2.5.8 AA)      | `--edsb-target-size`       | `2.75rem` = 44 CSS px at the 16px root, and grows with text scale rather than against it. Asserted per state in `e2e/target-and-contrast.spec.ts`.                                                                                                                                    |
| Dense target                   | `--edsb-target-size-dense` | `2.25rem` = 36 CSS px. Permitted only where a genuine SC 2.5.8 exception is recorded and every condition verified; never the default.                                                                                                                                                 |
| Text scaling (SC 1.4.4 AA)     | `--edsb-type-size-*`       | Every step is `rem`. The ramp is the canvas's own 7.5–22 px ladder lifted uniformly by ~1.25×, so every ratio between rungs is preserved and the smallest rung is `0.6875rem` (11 px) rather than 7.5 px. The mapping is tabulated in [canvas-extraction.md](./canvas-extraction.md). |
| Tracking                       | `--edsb-type-tracking-*`   | The canvas's eleven letter-spacing steps, 0.04em to 0.26em, adopted at their exact values. Tracking is already relative to the em, so the size lift does not apply to it.                                                                                                             |
| Geometry                       | `--edsb-radius-square`     | One step, `0`. There is no `border-radius` on a product surface anywhere in canvases 1a–1d; the only rounded corners in the file belong to the design viewer's own chrome.                                                                                                            |
| Reflow (SC 1.4.10 AA)          | `--edsb-measure-*`         | Named measures, no copied canvas width. Verified at 320 CSS px in `e2e/reflow.spec.ts`.                                                                                                                                                                                               |
| Motion (SC 2.3.3 AAA / FR-013) | `--edsb-duration-*`        | Neutralised to `0s` under `prefers-reduced-motion: reduce` in `src/styles/_base.scss`, which removes the transition without delaying or hiding the state.                                                                                                                             |
