# Contract: Design System and Component Previews

## One token source

- Primitive literals for color, type, spacing, radius, elevation, border, motion and target size may
  exist only under `src/styles/tokens/`.
- Semantic tokens form one dark set. No light set, theme selector, media-driven theme or theme
  persistence is permitted.
- Component, feature and preview styles consume semantic variables and named responsive tokens.
- Logical properties and fluid/container layout are preferred; a wide child owns labelled internal
  overflow only when a complete stacked representation would lose relationships.

## Shared component boundary

Every reusable visual/interaction pattern lives under `src/app/ui/`. Screens compose it and may own
layout composition, but may not duplicate a primitive or create a local visual language. A missing
pattern is added to `ui/`, documented and previewed before capability use.

Shared components:

- accept immutable presentation inputs;
- emit typed user intents;
- do not inject domain/build stores or Almanac catalogues;
- resolve owned text through the localization layer;
- own native role/name/state/label/error semantics and 44 CSS-pixel touch sizing;
- work by pointer and single-touch without hover;
- include visible textual meaning for color/shape/position/motion cues;
- honor reduced motion without removing state or delaying domain publication.

## Foundation component families

Feature 011 supplies the patterns already required by accepted feature designs: application frame,
landmark/page heading/navigation, visible-name actions/links, labelled fields/select/search,
toggle/radio/segmented controls, panel/card, definition/metric groups, status/notice/error/unavailable,
disclosure, responsive collection, dialog/layer, language selector, game-text disclosure and live
announcement outlet. Later capabilities extend this library rather than fork it.

## Preview declaration

Every exported UI component has one typed preview declaration. It accounts for default/populated,
empty, loading, error and disabled states where meaningful; an inapplicable state requires a concise
machine-readable rationale. Each applicable state has desktop, tablet and mobile fixtures.

Cross-cutting fixtures add:

- doubled/long application text and long unbroken package identities;
- RTL direction/content;
- reduced motion;
- localized number/unit/date content;
- canonical Almanac text with untranslated disclosure;
- unavailable Almanac text when no canonical source exists;
- pointer/touch-visible state without hover.

Fixtures are presentation data, not asserted Almanac facts. Package examples must be clearly marked
as fixtures and may use real package lookups in integration previews.

## Preview host

The `ui-preview` Angular target uses the same zoneless providers, localization runtime, tokens and
components as production. It exists only for development/test commands, is absent from production
routes and production build output, and makes every declaration addressable by stable component and
state ids for Playwright.

## Automated gate

The repository policy checker fails when:

- an exported UI component lacks a preview declaration;
- a required state/profile lacks a fixture or explicit N/A rationale;
- owned display text bypasses message resolution;
- a component uses inline styles or token-governed visual literals;
- a screen defines a duplicate shared pattern without extending `src/app/ui/`.

Playwright renders every declared state at required profiles, runs semantic assertions and axe, and
checks overflow. A screenshot may aid review but is never the only assertion.
