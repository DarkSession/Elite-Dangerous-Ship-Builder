# Feature Specification: Interface Foundations

## Scope

Every capability uses one design system, works with pointer, touch and screen reader at all supported
sizes, and resolves application text and formatting through one localisation layer. The target is
WCAG 2.2 AA except the keyboard-operation criteria excluded by the constitution.

## User Scenarios

### Story 1 — Use every capability with assistive technology (P1)

1. Controls expose matching visible and accessible names, roles, states and errors.
2. Statistics expose meaning, unit, availability and viewing conditions as text.
3. Important changes and errors are announced once without repeating unaffected content.
4. Every visual information carrier has a complete text equivalent.

### Story 2 — Use every supported size (P1)

1. Every capability remains available on desktop, tablet and mobile in portrait and landscape.
2. Content remains complete at 200% text size and 400% zoom without horizontal page scrolling.
3. In-scope text and non-text contrast and touch targets meet WCAG 2.2 AA.
4. Reduced-motion preference removes nonessential motion without removing meaning.

### Story 3 — Read the appropriate language (P2)

1. On first use, the application selects a shipped language matching the browser language setting;
   when none matches, it uses English.
2. A Commander can choose another shipped language and keep that choice across sessions.
3. Application-owned text and numeric, credit, distance, percentage and date formatting follow the
   active locale.
4. Missing application translation falls back to bundled English text.
5. Game text unavailable in the active locale uses the package text and is identified as untranslated.

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
- **FR-012**: Text, meaningful non-text content and interactive targets MUST meet WCAG 2.2 AA contrast
  and target-size rules.
- **FR-013**: Motion MUST respect `prefers-reduced-motion` and MUST NOT carry required meaning.
- **FR-014**: Layout and interaction MUST survive text expansion and right-to-left content.
- **FR-015**: Conformance statements MUST name the excluded criteria: 2.1.1, 2.1.2, 2.1.4, 2.4.1,
  2.4.3, 2.4.7 and 2.4.11. Unqualified WCAG 2.2 AA claims are prohibited.

### Localization

- **FR-016**: Every application-owned user-facing string MUST resolve through the localisation layer;
  hard-coded display text in components, templates and formatters is prohibited.
- **FR-017**: When no saved language selection exists, the application MUST automatically select a
  shipped language matching the browser language setting and MUST fall back to English when none
  matches. A Commander MUST be able to select another shipped language and persist that selection
  in the browser.
- **FR-018**: Numbers, percentages, credits, distances and dates MUST use the active locale.
- **FR-019**: Translations MUST ship as same-origin static assets and complete English fallback text
  MUST be available without a network. Raw keys, empty strings and placeholders MUST not appear.
- **FR-020**: Game text MUST come from the Almanac. If the package cannot supply the active locale,
  its canonical text MUST be shown and identified as untranslated; the application MUST NOT keep a
  private game-text translation.

### Verification

- **FR-021**: Every primary journey MUST run at desktop, tablet and mobile viewports in Chromium and
  Firefox.
- **FR-022**: Automated accessibility checks MUST cover every capability and relevant state and MUST
  fail the build on an in-scope violation.
- **FR-023**: Screen-reader journeys MUST supplement automation for every primary capability.
- **FR-024**: Automated checks MUST reject visual literals outside tokens, hard-coded application
  display text and missing component-state previews.

## Almanac Coverage

The package supplies game names for supported locales and an explicit missing-translation result.
It does not own application messages, locale selection, formatting, accessibility or the design
system.

## Current Almanac Limit

Package localisation covers modules, blueprints, experimental effects and materials, but not hull
names or diagnostic messages. Those remain in the package's canonical language and MUST be
identified as untranslated. The application MUST NOT fill the gap with private game-text or
diagnostic translations.

## Success Criteria

- **SC-001**: Every primary journey completes with pointer, touch and screen reader.
- **SC-002**: Automated scans report no in-scope WCAG violations.
- **SC-003**: Every capability remains complete at all supported sizes without horizontal page scroll.
- **SC-004**: No visual literal or application-owned display string bypasses its shared system.
- **SC-005**: The full journey suite passes in Chromium and Firefox at all three viewport classes.
- **SC-006**: A matching browser language selects the corresponding shipped language, an unsupported
  browser language selects English, and a saved Commander selection remains active.
