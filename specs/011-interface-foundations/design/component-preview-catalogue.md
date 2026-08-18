# Component Preview Catalogue

## Boundary

The catalogue is a development/test Angular target, not a Commander screen. It imports the production
UI library, tokens, localization runtime and zoneless configuration and adds only fixture selection
and stable preview addressing.

## Inventory behavior

Each exported component id lists its declared states. Selecting one state renders a single bounded
fixture plus its semantic expectations. The test URL/state mechanism is tool-owned and carries no
build. Product links and production output contain no preview route/chunk.

## Required matrix

For each component, account for default/populated, empty, loading, error and disabled. Render every
applicable state at:

- desktop width;
- tablet width (both orientations through Playwright);
- mobile width (both orientations through Playwright).

Then apply relevant cross-cutting variants:

- doubled/long English;
- RTL pseudo-content and root direction;
- reduced motion;
- localized German numbers/units/dates;
- package canonical text plus untranslated disclosure;
- package text unavailable because no canonical source exists;
- long unbroken identity and nested label/error relationships.

An N/A declaration is acceptable only when the component contract cannot represent that state (for
example, a purely structural divider cannot be loading). It is not a route to avoid a difficult
fixture.

## Inspection

Automated checks run axe, semantic/name/state/error assertions, target sizing and document overflow
on every declaration. Interaction previews use pointer and touch. Screenshots are review evidence,
not pass criteria. Human review inspects text expansion, bidi flow, contrast, reduced motion and
visible equivalence; screen-reader scripts use product journeys rather than claiming previews alone
prove usability.

## Initial foundation previews

Preview the frame/heading/navigation, actions/links, labelled fields/select/search, toggles and choice
groups, panels/cards, definition/metric groups, statuses/notices/errors/unavailable values,
disclosures, responsive collections, dialogs/layers, language selector, game-text disclosure and
announcement outlets. Capability-specific components join the same manifest when introduced.
