# Import Build Screen

## Purpose and entry

Accept exactly one pasted SLEF entry or bare journal `Loadout` without requiring a current build.
Import is available through the shared shell on ship-selection and build contexts; the no-build
workspace also presents it as a primary recovery action.

## Composition

- shared layer heading and close action;
- accepted-input/privacy explanation;
- labelled editable monospaced field with associated byte usage and 64 KiB limit;
- status/live summary and semantic package diagnostic list;
- clear/cancel and inspect/import actions;
- feature 001 replacement confirmation when unsaved work exists;
- post-commit normalization/unresolved/validation notice list in the workspace.

The screen owns no `ShipLoadout`; it emits draft and submit intent.

## States

| State                 | Presentation                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| Empty/editing         | Exact draft, localized byte count; submit disabled only while empty     |
| Near/over limit       | Textual usage warning; over-limit field invalid and package not invoked |
| Checking              | Draft remains readable; newer request token supersedes duplicate submit |
| Syntax                | Localized summary, no invented path/code; draft editable                |
| Zero/multiple         | Observed count/exactly-one rule; mixed package diagnostics retained     |
| Package diagnostics   | Entry, path, code/constraint, params/message exposed semantically       |
| Normalization blocked | Stable package outcome; active state unchanged                          |
| Candidate ready       | Incoming hull/name/validation; confirmation if required                 |
| Cancelled             | Current build and draft remain; one concise announcement                |
| Imported              | Close after commit; workspace shows quality/fixed/unresolved report     |

Wide layouts constrain a modal within viewport; narrow/landscape/400% zoom use a vertical full-screen
layer. The field may scroll internally, never the document horizontally. Labels/instructions/errors
are associated, paths direction-isolated, updates concise, targets at least 44 CSS px and all app copy
localized. Package text follows the standard untranslated disclosure.

Requirements: FR-007–FR-014 plus import aspects of FR-002, FR-005 and FR-006.
