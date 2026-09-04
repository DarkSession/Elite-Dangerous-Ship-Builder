# Component Preview Catalogue

## Boundary

The catalogue is a separate development/test Angular application, not a Commander route. It imports
production `src/app/ui/`, the single token/font entry and localization providers. It adds only fixture
selection, stable addressing and semantic expectation display. Product navigation and production
output contain no preview route/chunk.

## Inventory

Each exported component id exposes its declared states. Selecting one state renders one bounded
fixture and its expectation ids. The URL/state mechanism carries no build or user data.

The manifest accounts for default/populated, empty, loading, error and disabled. An N/A entry is
allowed only when the component contract cannot represent that state and includes a nonempty stable
rationale. It is not a way to avoid a difficult fixture.

The global Playwright projects supply:

- desktop;
- tablet portrait and landscape;
- mobile portrait and landscape;
- Chromium and Firefox.

Declarations therefore identify state/variant, not duplicate five viewport copies.

## Cross-cutting variants

Every relevant declaration adds:

- doubled/long application copy;
- RTL direction and pseudo-content;
- reduced motion;
- German number/unit/date presentation;
- canonical package text with untranslated disclosure;
- unavailable package text where no canonical source exists;
- long unbroken identity and mixed-direction technical content;
- nested visible label, description, unit and error relationships;
- pointer/touch-visible state that does not require hover.

## Foundation inventory

Preview the shell/context heading/navigation; visible-name actions/menu; labelled input/select/search/
textarea; segmented/choice/tab controls; panel/card; semantic list/table shells; definition/metric
groups; status/notice/error/unavailable; empty state; waiting mark and skeleton; disclosure; tooltip;
dialog/sheet/full-height layer, its footer and the format layer; language selector; game-text
provenance; and announcement outlets. Later capability components join the same manifest before use.

## What the checker reaches, and what the rule reaches

The preview-coverage checker reads `src/app/ui/components`. Every exported component there must carry
a declaration, and a missing one fails the build.

A domain composite in `src/app/ui/outfitting` or `src/app/ui/equipment` is outside that scan. It
carries a declaration all the same, because FR-004 applies to every exported component and the
catalogue is where a state is reviewed. `ednb-pip-control` is one of these: it is declared by the
rule, not because a checker demanded it.

## Inspection

For every applicable declaration, automated tests run axe and named role/name/state/relationship,
target-size, text-equivalence and document-overflow assertions. Interaction fixtures run through
click on desktop and tap in touch profiles. The manifest/exports/coverage ledger must reconcile.

Screenshots support visual review but are not pass criteria. Human review inspects design fidelity,
contrast evidence, text expansion, bidi flow and reduced motion. Screen-reader protocols exercise
complete product journeys; preview success alone never claims product usability.
