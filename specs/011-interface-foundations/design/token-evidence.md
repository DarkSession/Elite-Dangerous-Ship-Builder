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

| Reference pair               | Reference use                 | Reason rejected                 |
| ---------------------------- | ----------------------------- | ------------------------------- |
| ink alpha 0.50 and below     | Reference body/label text     | Below 4.5:1 on every surface    |
| ink alpha 0.38 and below     | Reference meaningful borders  | Below 3:1 on every surface      |
| amber-deep #8a6a3a           | Reference emphasis text       | Below 4.5:1 on every surface    |
| hair rgb(255 255 255 / 0.04) | Reference meaningful dividers | Below 3:1; decorative only here |

## Non-colour evidence

| Concern                        | Token                      | Evidence                                                                                                                                                  |
| ------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target size (SC 2.5.8 AA)      | `--edsb-target-size`       | `2.75rem` = 44 CSS px at the 16px root, and grows with text scale rather than against it. Asserted per state in `e2e/target-and-contrast.spec.ts`.        |
| Dense target                   | `--edsb-target-size-dense` | `2.25rem` = 36 CSS px. Permitted only where a genuine SC 2.5.8 exception is recorded and every condition verified; never the default.                     |
| Text scaling (SC 1.4.4 AA)     | `--edsb-type-size-*`       | Every step is `rem`. The smallest step is `0.75rem` (12 px); the reference's 8 px and 9 px artboard values have no token.                                 |
| Reflow (SC 1.4.10 AA)          | `--edsb-measure-*`         | Named measures, no copied canvas width. Verified at 320 CSS px in `e2e/reflow.spec.ts`.                                                                   |
| Motion (SC 2.3.3 AAA / FR-013) | `--edsb-duration-*`        | Neutralised to `0s` under `prefers-reduced-motion: reduce` in `src/styles/_base.scss`, which removes the transition without delaying or hiding the state. |
