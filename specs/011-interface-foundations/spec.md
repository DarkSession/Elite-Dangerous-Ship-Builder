# Feature Specification: Interface Foundations

## Scope

This specification defines the interface behavior every capability inherits: one design system,
assistive-technology operation, responsive reflow, readable contrast, verified WCAG 2.2 AA support
excluding the keyboard-operation criteria, and the localisation layer every capability resolves its
text and figures through. It creates no build capability of its own.

Keyboard operation is outside this specification and outside the application's accessibility target.
The constitution's principle V names the excluded criteria; no requirement here may demand them.

## Clarifications

### Session 2026-08-17

- Q: Does feature 011 own building the localisation layer itself — translatable strings, a language
  chooser, locale-aware number formatting and fallback — or does something else own it? → A: 011
  owns it in full (translatable owned strings, persisted language chooser, locale-aware formatting,
  fallback language, translations as static assets).
- Q: Which keyboard material should be removed — the separate keyboard-only verification journey, or
  the keyboard operability requirements themselves? → A: Remove every keyboard-specific requirement
  and amend the constitution; the application no longer claims the WCAG 2.2 keyboard-operation
  criteria.

## User Scenarios & Testing

### User Story 1 - Complete every journey with a screen reader (Priority: P1)

A Commander can understand controls, build state, statistics, changes, errors and visuals without
seeing the screen.

**Independent Test**: Complete every accepted feature's primary journey with a screen reader and
verify labels, state, structure, announcements and text alternatives.

**Acceptance Scenarios**:

1. **Given** a control, **When** the screen reader reaches it, **Then** its visible name, role and
   state are announced.
2. **Given** a statistic, **When** it is read, **Then** its meaning, unit, availability and relevant
   viewing conditions are available as text.
3. **Given** a build change, error or import result, **When** it appears, **Then** the relevant change
   is announced once without repeating unrelated content.
4. **Given** an image, chart, schematic or visual state, **When** it is encountered, **Then** all
   information it conveys is also available as text.

### User Story 2 - Use the interface at any supported size (Priority: P1)

A Commander can use every capability on desktop, tablet and mobile, at increased text size and zoom.

**Independent Test**: Run every primary journey at all supported viewports, 200% text size and 400%
zoom with reduced motion enabled.

**Acceptance Scenarios**:

1. **Given** any supported viewport or orientation, **When** the interface is used, **Then** no
   capability is removed and the page does not scroll horizontally.
2. **Given** 200% text size or 400% zoom, **When** content reflows, **Then** no content or action is
   clipped, overlapped or made ambiguous.
3. **Given** meaningful text and non-text content, **When** contrast is measured, **Then** it meets
   WCAG 2.2 AA.
4. **Given** reduced-motion preference, **When** the interface changes state, **Then** nonessential
   motion is removed and no meaning depends on animation.

### User Story 3 - Learn one visual language (Priority: P2)

A Commander encounters consistent controls and states throughout the application.

**Independent Test**: Verify every capability composes the shared design system and that token and
component changes propagate to every consumer.

**Acceptance Scenarios**:

1. **Given** a shared control or state, **When** it appears in different capabilities, **Then** it
   uses the same component behavior and visual language.
2. **Given** a visual token change, **When** the application is rebuilt, **Then** every consumer
   reflects it without a capability-specific override.
3. **Given** a missing component need, **When** it is implemented, **Then** the design system gains
   the reusable component and the capability composes it.

### User Story 4 - Read the interface in a chosen language (Priority: P2)

A Commander can choose a language, and the interface — including every figure — is presented in it
and stays there on return.

**Independent Test**: Choose each shipped language, complete a primary journey, reload, and verify
text, formatting and the retained choice.

**Acceptance Scenarios**:

1. **Given** a shipped language, **When** the Commander selects it, **Then** every application-owned
   string and every figure is presented in that language and its formatting.
2. **Given** a chosen language, **When** the Commander returns in a later session, **Then** the
   choice is still in effect.
3. **Given** a string with no translation for the active language, **When** it is displayed, **Then**
   a readable fallback language is shown and no message key or placeholder appears.
4. **Given** game text the package cannot supply in the active language, **When** it is displayed,
   **Then** the package's own text is shown and identified as untranslated.

### Edge Cases

- Translation expansion and right-to-left text preserve content and operation.
- A locale's messages that have not arrived leave the fallback language readable without a network.
- Dense tables scroll within their own containers, not the page.
- A passing automated accessibility scan does not excuse a failed screen-reader journey.
- Colour, shape, position and motion are never the only carriers of meaning.
- A target drawn smaller than the AA minimum receives a larger operable hit area.

## Requirements

### Design System

- **FR-001**: Every capability MUST compose the single shared component library and design token
  system. Capability-specific visual systems and duplicate shared components are prohibited.
- **FR-002**: Colour, typography, spacing, radius, elevation, borders and motion MUST use design
  tokens. Visual literals outside the token layer MUST fail verification.
- **FR-003**: The application MUST ship one dark theme with no theme control or stored theme
  preference.
- **FR-004**: Components MUST be presentation-only and MUST expose all supported states in previews
  at desktop, tablet and mobile widths.
- **FR-005**: A capability that needs a missing visual pattern MUST extend the design system before
  using it.

### Accessible Operation

- **FR-006**: Every capability MUST be operable by pointer and touch without relying on hover or a
  multi-pointer gesture.
- **FR-007**: *(withdrawn — keyboard focus order, focus visibility and modal focus containment)*
- **FR-008**: *(withdrawn — bypass for repeated content, keyboard shortcuts)*
- **FR-009**: Every control MUST expose a visible-name-matching accessible name, role, state and
  relationship to its label or error.
- **FR-010**: Every capability MUST expose meaningful landmarks and heading structure.
- **FR-011**: Dynamic changes and errors MUST be announced at the appropriate urgency without
  announcing every unaffected value.
- **FR-012**: Every visual information carrier MUST have a complete text equivalent. Meaning MUST
  never depend on colour, shape, position or motion alone.

### Reflow and Perception

- **FR-013**: Every capability MUST remain available at desktop, tablet and mobile viewports in
  portrait and landscape.
- **FR-014**: The interface MUST remain fully usable at 200% text size and 400% zoom with no
  horizontal page scrolling.
- **FR-015**: Text and meaningful non-text content MUST meet WCAG 2.2 AA contrast.
- **FR-016**: Interactive targets MUST meet WCAG 2.2 AA target size on every form factor.
- **FR-017**: Motion MUST respect `prefers-reduced-motion` and MUST NOT carry required meaning.
- **FR-018**: Layout and interaction MUST survive translated and right-to-left content.
- **FR-019**: The application MUST meet WCAG 2.2 AA except the keyboard-operation criteria the
  constitution's principle V excludes (2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7, 2.4.11). The listed
  requirements do not replace the rest of the standard. Any stated conformance MUST name the
  exclusion rather than claim unqualified AA.

### Localisation

Existing requirement numbers are stable; these were added after the original set, so their numbers
follow the verification block's.

- **FR-025**: Every user-facing string the application owns MUST be translatable and MUST resolve
  through the shared localisation layer. Display text hard-coded in a component, template or
  formatter is prohibited.
- **FR-026**: The Commander MUST be able to choose a language, and the choice MUST persist in the
  browser across sessions.
- **FR-027**: Numbers, percentages, credits, distances and dates MUST be formatted for the active
  locale. A translated label around an English-formatted figure does not satisfy this.
- **FR-028**: Translations MUST ship as the application's own static assets, and the fallback
  language MUST be readable without a network. A missing translation MUST fall back to a language
  the Commander can read; a raw message key, empty string or placeholder MUST NOT reach the screen.
- **FR-029**: Game text MUST come from the Almanac package. The application MUST NOT maintain a
  private translation of game data, and game nouns the package cannot supply in the active locale
  MUST appear in the language it provides and be identified as untranslated.

### Verification Requirements

- **FR-020**: End-to-end tests MUST run every primary journey at desktop, tablet and mobile
  viewports in Chromium and Firefox.
- **FR-021**: Automated accessibility checks MUST cover every capability and relevant state and MUST
  fail the build on a violation of an in-scope criterion (FR-019).
- **FR-022**: Screen-reader primary journeys MUST supplement automated checks.
- **FR-023**: Automated checks MUST reject visual literals outside the token layer and missing
  component state previews.
- **FR-024**: Reflow, contrast, target size, reduced motion, text expansion and right-to-left layout
  MUST be verified at the component and journey levels.
- **FR-030**: Automated checks MUST reject user-facing display text declared outside the
  localisation layer.
- **FR-031**: Verification MUST cover language selection, persistence of the choice, locale-aware
  formatting and missing-translation fallback.

## Key Entities

- **Design token**: A named visual or motion value shared by all components.
- **Component**: A reusable presentation-only control or pattern with defined states and accessible
  behavior.
- **Accessibility journey**: A feature's primary task completed with a screen reader.
- **Localised message**: An application-owned string resolved by key through the localisation layer
  for the active locale.
- **Locale**: The Commander's chosen language and its formatting rules, persisted in the browser.

## Success Criteria

- **SC-001**: Every primary journey can be completed with pointer, touch and screen reader.
- **SC-002**: Automated scans report zero violations of an in-scope WCAG criterion across every
  tested capability and state.
- **SC-003**: Every capability remains complete at all supported viewports, 200% text size and 400%
  zoom with no horizontal page scrolling.
- **SC-004**: Every meaningful visual element meets AA contrast and every target meets AA size.
- **SC-005**: No visual literal exists outside the token layer and no shared pattern is reimplemented
  within a capability.
- **SC-006**: The full end-to-end suite passes in Chromium and Firefox at all three viewport classes.
- **SC-007**: Every application-owned string resolves through the localisation layer, and no
  hard-coded display text, raw message key or placeholder reaches the screen.
- **SC-008**: The Commander's chosen language persists across sessions and every figure is formatted
  for the active locale.
