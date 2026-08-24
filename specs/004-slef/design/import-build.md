# Import Build Layer

## Purpose and entry

Accept exactly one pasted SLEF entry or bare journal `Loadout` without requiring a current build.
The shared shell exposes Import from ship selection, hull detail, build workspace and build library;
the no-build workspace presents it as a primary recovery action. Opening the layer never chooses or
creates a hull.

## Composition

- shared modal/sheet layer with visible heading, accepted-input/privacy description and named close;
- visibly labelled editable monospaced multiline field whose exact draft is preserved;
- programmatically associated localized UTF-8 byte usage and 64-KiB limit/status;
- concise status/announcement summary plus semantic exact package diagnostic list;
- Clear, Cancel/Close and Inspect/Import actions;
- feature 001 shared replacement confirmation when dirty work exists.

The component owns no `ShipLoadout`, parser, byte counter, package call or replacement decision. It
renders an immutable view and emits draft/clear/submit/cancel intents.

## States and action behavior

| State                           | Presentation and enabled actions                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Empty                           | Exact empty/whitespace draft and byte count; submit disabled; Clear disabled when truly empty                                                                                                                                                                |
| Editing within limit            | Draft and localized byte use; submit enabled; no stale failure after a newer edit unless still applicable                                                                                                                                                    |
| Over limit                      | Associated invalid state names actual/limit bytes; submit unavailable and package inspector is not called                                                                                                                                                    |
| Inspecting                      | Draft stays readable; duplicate submit disabled; cancel/close invalidates request token                                                                                                                                                                      |
| Syntax                          | Localized app summary only; no raw exception, invented path or code; edit/resubmit available                                                                                                                                                                 |
| Zero/multiple/mixed cardinality | Observed count and exactly-one rule; all package diagnostics retained for mixed input                                                                                                                                                                        |
| Package diagnostic              | Entry/path/code/constraint/params and package-locale/canonical-disclosed reason in a semantic list                                                                                                                                                           |
| Unknown hull/construction       | Exact source hull where safe plus generic app framing; no fabricated package diagnostic                                                                                                                                                                      |
| Normalization unsupported       | Exact source slot/module context and package code/params returned by `completeEngineeringGrade()`                                                                                                                                                            |
| Correlation/package failure     | Stable app-owned category, exact source context and only the structured package reason/result actually returned                                                                                                                                              |
| Candidate ready                 | Not drawn. The canvas has no candidate panel: when confirmation is unnecessary feature 001 commits straight away, and when it is necessary feature 001's own confirmation names the incoming hull. A second summary beside it would say the same thing twice |
| Awaiting replacement            | Layer remains behind shared confirmation; candidate/token cannot commit independently                                                                                                                                                                        |
| Cancelled/superseded            | Draft/current work remain; concise no-op status, no stale announcement/commit                                                                                                                                                                                |
| Committed transition            | After one confirmed commit, move to `/build` when needed and remove the input layer; the workspace's own notice and rail describe the build that arrived                                                                                                     |

## Responsive behavior

Use a contained dialog where content fits, ordinary bottom sheet on narrow portrait following canvases
1b/1d, and full-height vertically scrollable layer when short landscape, expansion, RTL, text sizing
or zoom would clip content/actions. Action groups wrap/stack; the field/diagnostic technical content
owns bounded wrapping/overflow. No document horizontal overflow.

## Accessibility, localization and previews

The layer has modal semantics and programmatic heading/description; its background is inert/hidden.
The visible field label, instructions, byte count and error relationship remain discoverable by
screen reader. Status never relies on color. Updates announce bounded summaries, not draft JSON or a
whole diagnostic list. Package messages follow Almanac locale/canonical disclosure; app framing and
counts use feature 011 catalogues/formatters. JSON, paths, codes and identities are direction-isolated.

Previews cover every state above at desktop/tablet/mobile widths plus expanded, RTL and reduced-motion
variants. Requirements: FR-007–FR-012, FR-014 and import aspects of FR-002, FR-005, FR-006 and FR-013.
