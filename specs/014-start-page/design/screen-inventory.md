# Screen Inventory: Start Page

One route, one screen, one new design-system component. The shared shell surrounds it as it
surrounds both tools, and this feature adds nothing to that shell.

## Inventory

| Surface          | Kind                 | Appears at                        | Purpose                                                          |
| ---------------- | -------------------- | --------------------------------- | ---------------------------------------------------------------- |
| Tool bar         | shared shell         | every screen, unchanged           | names the tools; at the entry point marks none of them current   |
| Shell action row | shared shell         | every screen, unchanged           | open a saved record, import, help — carried over, none added     |
| Product masthead | region of the page   | `/`                               | the heading and the line beneath it                              |
| Tool selector    | region of the page   | `/`                               | one entry per tool the application carries                       |
| Tool entry       | `ednb-tool-card`     | inside the selector, one per tool | name, subjects, both descriptions; the whole card opens the tool |
| Attribution band | `ednb-legal-excerpt` | the foot of `/`                   | the Frontier notice, reproduced from the help manifest           |

The attribution band is the only surface here that is not either shell or new: it is feature
012's component and feature 012's text, placed by this screen.

**Withdrawn from the artboards**, with reasons in
[reference-review.md](./reference-review.md): the `CH` chip, the `⋯` tab-strip marker, the
canvas's loose quotation of the attribution, and the `→` mark at wide widths.

## Composition

| Mode                            | Masthead      | Selector              | Tool entry                                           |
| ------------------------------- | ------------- | --------------------- | ---------------------------------------------------- |
| compact (`< $mode-compact-max`) | 28px / 0.12em | one column, 11px gap  | short description, no subjects, `→` mark, row layout |
| medium (`≥ $mode-medium-min`)   | the wide ramp | two columns, 20px gap | fuller description with subjects, stacked, no mark   |
| wide (`≥ $mode-wide-min`)       | 46px / 0.14em | two columns, 20px gap | as medium                                            |

No new threshold. The medium mode takes the wide artboard's content because the canvas draws
no tablet artboard and the fuller form is what fits above the compact fold (research
decision 3).

## Requirement mapping

Every requirement lands on a surface, and every surface answers one.

| Requirement | Route / address                           | Masthead      | Selector / entry                       | Attribution                 | Registry                    |
| ----------- | ----------------------------------------- | ------------- | -------------------------------------- | --------------------------- | --------------------------- |
| FR-001      | `''` is a component, not a redirect       | —             | —                                      | —                           | —                           |
| FR-002      | —                                         | heading, line | —                                      | —                           | —                           |
| FR-003      | —                                         | —             | one entry per record, and only records | —                           | R2, R6                      |
| FR-004      | —                                         | —             | drawn from `catalogue()`               | —                           | R1, R4                      |
| FR-005      | —                                         | —             | name, subjects, description            | —                           | R3                          |
| FR-006      | —                                         | —             | the card is an `<a href>`              | —                           | `href`                      |
| FR-007      | the redirect that replaced itself is gone | —             | —                                      | —                           | —                           |
| FR-008      | `'**'` lands on `''`                      | —             | —                                      | —                           | —                           |
| FR-009      | every other route untouched               | —             | —                                      | —                           | —                           |
| FR-010      | —                                         | —             | —                                      | —                           | R7, and `tools()` unchanged |
| FR-011      | —                                         | —             | —                                      | —                           | assembled in `app.ts`       |
| FR-012      | —                                         | —             | —                                      | the band                    | —                           |
| FR-013      | route title keys                          | message keys  | message keys                           | `lang`-marked, untranslated | R3                          |
| FR-014      | —                                         | the ramp      | the grid and the card                  | the band                    | —                           |
| FR-015      | —                                         | heading level | link name, target size, contrast       | contrast                    | —                           |
| FR-016      | `title` + `data.description` on `''`      | —             | —                                      | —                           | —                           |
| FR-017      | —                                         | —             | both forms rendered, one shown         | —                           | R8                          |
| FR-018      | —                                         | —             | the media query, not a measurement     | —                           | —                           |
| FR-019      | —                                         | —             | exactly one form visible per viewport  | —                           | —                           |

## Accessibility

- The heading is the screen's `h1`. The tool entries sit in a region named by
  `home.tools.label`, which the canvas does not draw and which is the invisible floor the
  standing rule exempts.
- Each entry is one link whose accessible name is the tool's name. The subjects and the
  description are inside the link and are read after it, so the name is what a link list
  reports.
- The hidden description form is `display: none`, not `visually-hidden`. A reader that met
  both would hear every tool described twice (research decision 3).
- The `→` mark is decorative and hidden from readers: the link already says where it goes.
- The attribution carries the `lang` of the document it is quoted from, so a German
  interface does not read English prose in a German voice.
- Contrast: `--ink-62` and `--ink-55` on `--panel-1` and `--ink-32` on `--panel` are the
  washes the canvas sets. They go through the same lift the token layer already applies to
  the canvas's label washes — the 0.55 step is the floor — and
  `e2e/target-and-contrast.spec.ts` covers the screen.
- Each entry is a full-card target, comfortably past the AA target-size rule at every width.
