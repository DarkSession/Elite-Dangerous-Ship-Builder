# Design Reference Review: Cost and Materials

The source reference is `.design/Ship Builder.dc.html`, especially wide canvas 1c and mobile canvas
1d. It is an information-hierarchy reference, not a source of game values, components, assets or
breakpoints.

## Adopt

- A glanceable cost region before engineering requirements.
- Hull, modules and rebuy as separately labelled facts.
- A visually distinct Merc Coin identity rather than pretending it is credits.
- Material rows with name, grade and quantity.
- Wide grouping that becomes a complete mobile stack.
- Engineering material context near the fitted module editor, provided by the shared feature 002/009
  selection-cost classifier rather than duplicated screen logic.

## Required departures

| Reference treatment                                      | Planned treatment                                            | Reason                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Adds hull and modules into `TOTAL`                       | No combined credit total                                     | `retailCredits()` does not return one; local addition violates FR-001/002       |
| Shows only five materials plus authored type/unit totals | Show every package-consolidated row; no type/unit arithmetic | Truncation fails traceability and the package owns no such aggregate counts     |
| Places Merc Coin under the material card                 | Separate conditional currency region                         | Merc Coin is a purchase currency, never a material or credit comparison         |
| Hard-coded prices, counts and recognition                | Package snapshot only                                        | Mock facts are not game data                                                    |
| Grade shown primarily by external icon                   | Textual package grade; optional shared ornament              | Grade cannot rely on image/color and cross-origin runtime assets are prohibited |
| `edassets.org` material images                           | Same-origin design-system assets only, or no icon            | No cross-origin runtime dependency; repository is design source of truth        |
| Fixed one-line truncation                                | Wrapping/responsive labelled content                         | Translation, 200% text and 400% zoom must retain meaning                        |
| No unavailable/lower-bound states                        | Explicit associated state/evidence components                | Required by FR-002/005/008                                                      |
| No material source trace                                 | Per-row complete fitted-selection disclosure                 | Required by SC-003                                                              |

The mock's color literals, fonts, shadows, measurements and animation are not copied. Feature 011
tokens, application messages, locale formatters and shared components define implementation. Merc
Coin imagery, if retained as supplemental artwork, must be same-origin, licensed, token-compatible and
carry a textual equivalent; the capability does not depend on it.

## Responsive and accessibility consequence

The reference's mobile stack is the starting hierarchy, but planned narrow content adds full
qualifications, unavailable recipes and trace disclosures. Controls meet the shared touch target,
nothing depends on hover, document horizontal overflow is forbidden and semantic reading order stays
retail → conditional Merc Coin → materials at every width.
