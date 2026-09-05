# Contract: Design System and Component Previews

## Reference-to-system boundary

`.design/Ship Builder.dc.html` is the source for product hierarchy and visual direction. It is not
production markup, a game-data source, a breakpoint list or a valid token set. Implementation retains
its dark amber hierarchy, compact geometry, typography roles, wide grouping and compact drill-ins
through the rules below. It does not copy inline declarations, mock values, fixed canvases, remote
URLs, clickable `div`s, hover/title-only meaning or low-contrast alpha values.

## One token source

- Primitive literals for color, typography, spacing, radius, elevation, border, motion and target
  size exist only under `src/styles/tokens/` or the dedicated same-origin font declaration file.
- Semantic tokens form exactly one dark set. There is no light set, `prefers-color-scheme` theme,
  theme selector or theme persistence.
- Every intended text/background pair records AA contrast evidence; every meaningful boundary/icon/
  state pair records non-text contrast evidence. The tiny muted combinations in the reference are not
  accepted merely because they look similar.
- Components and screens consume semantic variables and named responsive/layout primitives. Zero,
  percentages, `fr`, `auto`, intrinsic sizing and token calculations remain layout syntax, not an
  alternate literal scale.
- Motion uses named duration/easing tokens. `prefers-reduced-motion: reduce` removes nonessential
  transitions without delaying, hiding or changing the state.
- Barlow, Barlow Condensed and JetBrains Mono files are same-origin licensed assets with complete
  fallbacks. No stylesheet, component or SVG triggers a runtime request to another origin.

## Shared component boundary

Every reusable visual/interaction pattern lives under `src/app/ui/`. A route may compose components
and own route-specific layout, but it may not recreate a shared primitive or introduce local visual
rules. A missing pattern is designed, added, documented and previewed in `ui/` before a capability
consumes it.

Shared components:

- accept immutable presentation inputs and emit typed intents;
- do not inject build/domain stores or Almanac catalogues;
- resolve their owned display text through the message facade;
- prefer native element semantics and own role/name/state/label/error/unit relationships;
- make the visible name and accessible name match;
- use the 44 CSS-pixel design target baseline and work by pointer and single touch without hover;
- expose persistent text for meaning otherwise carried by color, icon, shape, order, position, bar or
  motion;
- preserve complete state and reading order across wide, medium and compact compositions.

Feature 011 supplies application frame/heading/context actions, buttons/links, labelled
input/select/search/textarea, choice/tab/segmented controls, panel/card, semantic collection and
table shells, definition/metric/status/unavailable patterns, dialog/sheet/full-height layer, layer
footer, format layer, empty state, waiting mark/skeleton, game-text disclosure and
live-announcement outlets. Hull rows, slot rows, anatomy, engineering and other domain composites
remain owned by their capability features but extend this same library.

A repeated element tree becomes a component here. A repeated declaration body on markup that differs
becomes a named mixin in the layout primitives instead, because a component there would wrap the
caller's own children in a projection boundary and gain nothing else.
`design/shared-patterns.md` records which patterns are shared this way and which library each one
lives in.

FR-005 is enforced by screen-design review and the exported component inventory. The static checker
does not pretend to infer that two arbitrary visual trees are duplicates.

## Preview manifest

The tooling-only preview application imports the exact production UI exports, tokens, font entry and
localization providers. Each exported component has one typed declaration that accounts for:

- default/populated;
- empty;
- loading;
- error;
- disabled.

An inapplicable state requires a nonempty machine-readable rationale tied to the component contract.
Every applicable declaration is rendered through the global desktop, tablet portrait/landscape and
mobile portrait/landscape projects in both engines.

Relevant cross-cutting fixtures add doubled/long copy, RTL direction, reduced motion, German formats,
canonical package text with untranslated disclosure, absent canonical package text, long unbroken
identities and nested label/description/error relationships. The state that animates declares the
reduced-motion variant, not the still one. A component whose only motion is in its loading state is
therefore reviewed under reduced motion in that state. The preview sweep renders no state under the
reduced-motion media, so the declaration is a reviewer's note rather than a check that runs.
Fixtures are presentation data. A
package integration fixture may query real package data but cannot turn a copied mock value into an
application fact.

Stable URLs/ids address one component and state without carrying a build. The preview project is not
referenced by product routes, product navigation or the production build graph.

## Automated policy boundary

The repository checker fails for:

- owned literal display text or visible/accessibility labels in Angular templates/component metadata;
- component/formatter display paths that bypass the localization facade;
- governed visual properties using literals outside token/font sources;
- inline component styles where the token policy cannot inspect the real source;
- an exported UI component missing a preview declaration;
- a required state missing both a fixture and valid N/A rationale;
- invalid English/German key, blank-value or interpolation parity;
- skipped, focused or quarantined interface-foundation tests.

TypeScript and Angular ASTs inspect code/templates. Direct PostCSS and `postcss-scss` dependencies
inspect SCSS property values. Fixture-backed tests prove allowed structural syntax and representative
violations. Playwright then renders every applicable declaration, runs axe and named semantic/target/
overflow checks. Screenshots are review evidence only.
