## Purpose

One component library and one design-token system carry the whole application, so
every capability presents the same components, the same visual values and the same
single theme. Automated checks hold that boundary.

## Requirements

### Requirement: Shared component library and token system

Every capability MUST compose the shared component library and design-token system.
Duplicate shared components and capability-specific visual systems are prohibited.

Source: 011/FR-001.

#### Scenario: A capability renders a shared control

- **WHEN** a capability needs a control the shared component library already provides
- **THEN** the capability composes that component

#### Scenario: A capability carries its own visual system

- **WHEN** a capability defines a duplicate shared component or a visual system of its own
- **THEN** the design system prohibits it and the capability composes the shared component instead

### Requirement: Visual values come from design tokens

Colour, type, spacing, radius, elevation, borders and motion MUST use design tokens.
Visual literals outside the token layer are prohibited.

Source: 011/FR-002.

#### Scenario: A style sets a visual value

- **WHEN** a style sets a colour, type, spacing, radius, elevation, border or motion value
- **THEN** it reads that value from a design token

#### Scenario: A visual literal bypasses the token layer

- **WHEN** a visual literal appears outside the token layer
- **THEN** the value does not ship

### Requirement: One dark theme

The application MUST ship one dark theme with no theme control and no stored theme
preference.

Source: 011/FR-003.

#### Scenario: A Commander opens the application

- **WHEN** a Commander opens any screen
- **THEN** the application presents its one dark theme
- **AND** it offers no theme control and stores no theme preference

### Requirement: Presentation-only components with state previews

Components MUST be presentation-only and MUST preview every supported populated, empty,
loading, error and disabled state at desktop, tablet and mobile widths.

Source: 011/FR-004.

#### Scenario: A component enters the library

- **WHEN** a component enters the shared component library
- **THEN** it is presentation-only
- **AND** it previews each supported populated, empty, loading, error and disabled state at
  desktop, tablet and mobile widths

### Requirement: A missing pattern enters the design system first

A missing reusable pattern MUST be added to the design system before a capability uses it.

Source: 011/FR-005.

#### Scenario: A capability needs a pattern the design system does not carry

- **WHEN** a capability needs a reusable pattern the design system does not carry
- **THEN** the pattern is added to the design system
- **AND** the capability uses it only after that

### Requirement: Automated design-system checks

Automated checks MUST reject visual literals outside tokens, hard-coded application
display text and missing component-state previews.

Source: 011/FR-024, 011/SC-004.

#### Scenario: A visual literal or a hard-coded string reaches the build

- **WHEN** a visual literal outside the token layer or an application-owned display string
  outside the localisation layer reaches the build
- **THEN** the automated check rejects it

#### Scenario: A component state has no preview

- **WHEN** a component supports a state that has no preview
- **THEN** the automated check rejects it
