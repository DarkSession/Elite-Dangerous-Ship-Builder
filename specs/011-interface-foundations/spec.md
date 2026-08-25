# Feature Specification: Interface Foundations

## Scope

Every capability uses one design system, works with pointer, touch and screen reader at all supported
sizes, and resolves application text and formatting through one localisation layer. The target is
WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## Clarifications

### Session 2026-08-18

- Q: Which application-owned interface languages should ship initially? → A: English and German.

### Session 2026-08-20

- Q: Must every selectable shipped application language remain complete as capabilities add or
  remove application-owned messages? → A: Yes. Every shipped catalogue has the same non-empty keys
  and interpolation variables as bundled English. A change to the application-owned message set
  updates every shipped catalogue in the same change. An incomplete catalogue is never partially
  published; the interface remains on its prior complete language or falls back atomically to
  bundled English.

## User Scenarios

### Story 1 — Use every capability with assistive technology (P1)

1. Controls expose matching visible and accessible names, roles, states and errors.
2. Statistics expose meaning, unit, availability and viewing conditions as text.
3. Important changes and errors are announced once without repeating unaffected content.
4. Every visual information carrier has a complete text equivalent.

### Story 2 — Use every supported size (P1)

1. Every capability remains available on desktop, tablet and mobile in portrait and landscape.
2. Content remains complete at 200% text size and 400% zoom without horizontal page scrolling.
3. In-scope text and non-text contrast and touch targets meet their applicable WCAG 2.2 AA criteria;
   overall conformance excludes criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.
4. Reduced-motion preference removes nonessential motion without removing meaning.

### Story 3 — Read the appropriate language (P2)

1. The application selects a shipped language matching the browser language setting; when none
   matches, it uses English. There is no in-application language control: the browser setting is the
   only input.
2. Application-owned text and numeric, credit, distance, percentage and date formatting follow the
   active locale.
3. Missing application translation falls back to bundled English text.
4. Game text unavailable in the active locale uses canonical package text and is identified as
   untranslated when that text exists; otherwise it is explicitly unavailable.

### Story 4 — Read the version that was published (P2)

1. A session already open when a newer version is published states that a newer one is available
   without the Commander reloading the page.
2. Applying it is the Commander's decision. The application never replaces what is on screen by
   itself.
3. A session that is never asked to apply it is served the newer version the next time the
   application starts.
4. A cached application the worker cannot repair says so and offers the recovery that fixes it.
   Clearing a cache or forcing a reload from the browser is never the route back.

## Requirements

### Design System

- **FR-001**: Every capability MUST compose the shared component library and design-token system.
  Duplicate shared components and capability-specific visual systems are prohibited.
- **FR-002**: Color, type, spacing, radius, elevation, borders and motion MUST use design tokens;
  visual literals outside the token layer are prohibited.
- **FR-003**: The application MUST ship one dark theme with no theme control or stored preference.
- **FR-004**: Components MUST be presentation-only and preview every supported populated, empty,
  loading, error and disabled state at desktop, tablet and mobile widths.
- **FR-005**: A missing reusable pattern MUST be added to the design system before a capability uses it.

### Accessible and Responsive Operation

- **FR-006**: Every capability MUST work by pointer and touch without hover or multi-pointer gestures.
- **FR-007**: Every control MUST expose an accessible name matching its visible name, role, state and
  relationship to labels and errors.
- **FR-008**: Every capability MUST expose meaningful landmarks and heading structure.
- **FR-009**: A blocking error MUST be announced promptly. Other changes MUST be announced without
  interrupting current speech or announcing unaffected values.
- **FR-010**: Meaning MUST NOT depend on colour, shape, position or motion; every visual information
  carrier MUST have a text equivalent.
- **FR-011**: Every capability MUST remain available on desktop, tablet and mobile in portrait and
  landscape and at 200% text size and 400% zoom, with no horizontal page scrolling.
- **FR-012**: Within the qualified conformance target that excludes criteria 2.1.1, 2.1.2, 2.1.4,
  2.4.1, 2.4.3, 2.4.7 and 2.4.11, text, meaningful non-text content and interactive targets MUST meet
  the applicable WCAG 2.2 AA contrast and target-size rules.
- **FR-013**: Motion MUST respect `prefers-reduced-motion` and MUST NOT carry required meaning.
- **FR-014**: Layout and interaction MUST survive text expansion and right-to-left content.
- **FR-015**: Conformance statements MUST name the excluded criteria: 2.1.1, 2.1.2, 2.1.4, 2.4.1,
  2.4.3, 2.4.7 and 2.4.11. Unqualified WCAG 2.2 AA claims are prohibited.

### Localization

- **FR-016**: Every application-owned user-facing string MUST resolve through the localisation layer;
  hard-coded display text in components, templates and formatters is prohibited.
- **FR-017**: The application MUST select a shipped language matching the browser language setting
  and MUST fall back to English when none matches. The initial shipped application languages MUST be
  English and German. The browser language setting is the only input: the application MUST NOT offer
  a language control and MUST NOT persist a language of its own.
- **FR-018**: Numbers, percentages, credits, distances and dates MUST use the active locale.
- **FR-019**: Translations MUST ship as same-origin static assets and complete English fallback text
  MUST be available without a network. Every selectable shipped application locale MUST contain the
  same application-owned message keys and interpolation variables as bundled English, with no blank
  value. Adding, removing or changing an application-owned message MUST update every shipped locale
  in the same change. An incomplete or malformed catalogue MUST NOT be partially published; the
  interface MUST remain on its prior complete locale or fall back atomically to bundled English. Raw
  keys, empty strings and placeholders MUST not appear.
- **FR-020**: Game text MUST come from the Almanac. If the package cannot supply the active locale,
  its canonical text MUST be requested and, when present, shown and identified as untranslated. If
  the package supplies no canonical text, the value MUST be unavailable. The application MUST NOT
  keep a private game-text translation.

### Application Delivery

- **FR-025**: A session running a version that has been superseded MUST detect the newly published
  one without a Commander-initiated reload, MUST state as visible text that a newer version is
  available, and MUST offer a named control that applies it. The application MUST NOT apply it by
  itself, and a session that is never asked MUST be served the newer version the next time the
  application starts.
- **FR-026**: A cached application in a state the worker cannot repair MUST be stated as a blocking
  error carrying a named control that recovers it. Recovery MUST NOT depend on the Commander
  clearing a cache or forcing a reload from outside the interface.

### Verification

- **FR-021**: Every primary journey MUST run across the five layout profiles — desktop, tablet
  portrait, tablet landscape, mobile portrait and mobile landscape — in both Chromium and Firefox.
- **FR-022**: Automated accessibility checks MUST cover every capability and relevant state and MUST
  fail the build on an in-scope violation.
- **FR-023**: Screen-reader journeys MUST supplement automation for every primary capability.
- **FR-024**: Automated checks MUST reject visual literals outside tokens, hard-coded application
  display text and missing component-state previews.

## Almanac Coverage

The package supplies game names for supported locales and an explicit missing-translation result.
It does not own application messages, locale selection, formatting, accessibility, the design
system, or how the application is delivered and updated.

## Current Almanac Limit

Package localisation covers modules, blueprints, experimental effects, materials, hull/manufacturer,
slot/restriction, pre-engineered variant, engineering-group, effect-description and structured
diagnostic families. A helper can explicitly return `null` when the requested locale or text itself
is unavailable. Canonical package text is disclosed as untranslated when present; otherwise the
value is unavailable. The application MUST NOT fill either miss with private game-text or diagnostic
translations.

## Success Criteria

- **SC-001**: Every primary journey completes with pointer, touch and screen reader.
- **SC-002**: Automated scans report no in-scope WCAG violations.
- **SC-003**: Every capability remains complete at all supported sizes without horizontal page scroll.
- **SC-004**: No visual literal or application-owned display string bypasses its shared system.
- **SC-005**: The full journey suite passes in Chromium and Firefox across all five layout profiles,
  covering the three viewport classes in both orientations.
- **SC-006**: English and German contain identical non-empty application-owned message-key and
  interpolation-variable sets across the complete application; a matching browser language selects
  the corresponding shipped language and an unsupported browser language selects English.
- **SC-007**: A session left open across a deployment states that a newer version is available,
  applies it from its own named control, and comes back on the published version — with no
  cache-clearing reload anywhere in the journey.
