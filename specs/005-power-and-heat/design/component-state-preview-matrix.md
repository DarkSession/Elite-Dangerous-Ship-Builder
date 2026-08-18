# Component State Preview Matrix

Feature 005 composes feature 011 primitives and adds reusable patterns to
`src/app/ui/` before using them. Preview fixtures carry presentation values
only; they do not call `ShipLoadout`.

## Required preview widths

Every exported component below renders at:

- desktop: 1440 CSS pixels;
- tablet: 834 CSS pixels;
- mobile: 390 CSS pixels.

The catalogue also supplies long/expanded text, RTL, reduced-motion and
high-zoom container fixtures. Browser acceptance adds tablet/mobile landscape.

## Matrix

| Component/pattern                        | Populated/default                      | Empty/unavailable                                    | Loading                                  | Error                             | Disabled/qualified                                           |
| ---------------------------------------- | -------------------------------------- | ---------------------------------------------------- | ---------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| Shared viewing-condition group (003/011) | deployed, `2/2/2`, valid settled/draft | prior settled result with invalid draft guidance     | applying current revision                | localized validation relationship | Apply disabled when unchanged; Reset/default state           |
| Metric definition group                  | capacity/draw and deployed summaries   | omitted retracted-only definitions with explanation  | skeleton/status text with stable heading | group failure text                | lower-bound, known-draw-only and zero-output sentinel        |
| Priority-band collection                 | five exact bands including zero draw   | not applicable only in no-build parent               | whole collection pending                 | projection failure                | shed, powered and known-draw-only verdicts                   |
| Module power collection                  | multiple exact-slot numeric consumers  | no participating consumers; null-draw consumer group | collection pending                       | missing package identity failure  | disabled, deployed-only, inactive-retracted and unknown draw |
| Heat profile collection                  | three facts and five finite scenarios  | package unavailable; no-weapons equal scenarios      | profile pending                          | blocking/unexpected failure       | projection, does-not-settle and never-overheats              |
| Distributor capacitor group              | SYS/ENG/WEP all fields                 | package unavailable                                  | group pending                            | unexpected failure                | zero-pip recharge and unchanged capacity                     |
| Qualification/status notice              | named lower-bound or projection        | no notice when exact                                 | pending message                          | assertive blocking error          | non-interrupting unavailable/known-only notice               |
| Exact-slot action                        | localized module and exact slot        | unavailable only on package-contract failure         | action disabled during stale transition  | navigation failure feedback       | selected/current slot                                        |

## Preview assertions

- Each preview has one clear heading/label relationship and complete textual
  state independent of color, pattern, bar length or icon.
- Touch targets use the shared target token and do not overlap at mobile width.
- Expanded and RTL text wraps without truncating an identity or creating
  document horizontal overflow.
- Tables/cards retain every field when container width changes.
- A preview with a bar or gauge has an associated complete textual equivalent.
- Locale fixtures cover decimal commas, expanded translated labels, semantic
  infinity phrases and disclosed canonical package text.
- Reduced motion changes only transitions, not content or announcement timing.

Feature 011's policy check must find a preview declaration for every exported
feature 005 UI component and every supported state before `pnpm run check`
passes.
