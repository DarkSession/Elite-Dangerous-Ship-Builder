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

A component under `src/app/ui/` outside `components/` is beyond that scan, and no build fails over
one that carries no declaration. FR-004 reaches it all the same: the catalogue is where a state is
reviewed, so a component belongs in the manifest wherever the catalogue can render it.
`ednb-pip-control` is one the catalogue cannot render, and the reason is written down below.

The catalogue renders a declaration from its inputs alone. A component that
projects content therefore stands in the catalogue with its slots empty, and
what a call site puts in them — the way out of an empty state, the answers in a
layer's foot, the format list and the format beside it — is reviewed on the
screens that pass it. The declaration states what the empty shell is expected to
do, and never what the projected content does.

One kind of control cannot be reviewed here. The catalogue is swept under expanded copy, and that
sweep requires every button on the page to carry visible text. A control whose whole reading is its
accessible name carries none, so the sweep reports it as a control that lost its label. The pip
blocks of `ednb-pip-control` are such a control: the canvas draws four blocks and no numerals
(`005 design/power-and-heat-detail.md`, "Power distributor and pips"). It is reviewed in the two
feature 005 regions that draw it, each of which has its own accessibility sweep, and it is absent
from this manifest.

## Inspection

For every applicable declaration, automated tests run axe and named role/name/state/relationship,
target-size, text-equivalence and document-overflow assertions. Interaction fixtures run through
click on desktop and tap in touch profiles. The manifest/exports/coverage ledger must reconcile.

Screenshots support visual review but are not pass criteria. Human review inspects design fidelity,
contrast evidence, text expansion, bidi flow and reduced motion. Screen-reader protocols exercise
complete product journeys; preview success alone never claims product usability.
