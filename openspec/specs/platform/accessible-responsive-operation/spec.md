## Purpose

Every capability works by pointer, by touch and with a screen reader, and stays complete
on desktop, tablet and mobile in both orientations. The conformance target is WCAG 2.2 AA
except success criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11, and
layout, accessibility and screen-reader checks hold it.

## Requirements

### Requirement: Pointer and touch operation

Every capability MUST work by pointer and touch without hover or multi-pointer gestures.

Source: 011/FR-006.

#### Scenario: A Commander operates a capability by touch

- **WHEN** a Commander operates a capability by pointer or by touch
- **THEN** every function of that capability is available
- **AND** no function needs hover or a multi-pointer gesture

### Requirement: Accessible names, roles, states and relationships

Every control MUST expose an accessible name matching its visible name, its role, its state
and its relationship to labels and errors.

Source: 011/FR-007.

#### Scenario: A control is read by assistive technology

- **WHEN** assistive technology reads a control
- **THEN** the control exposes an accessible name matching its visible name, its role and its
  state
- **AND** it exposes its relationship to its labels and to its errors

### Requirement: Landmarks and heading structure

Every capability MUST expose meaningful landmarks and heading structure.

Source: 011/FR-008.

#### Scenario: A Commander moves through a capability by structure

- **WHEN** a Commander moves through a capability by landmark or by heading
- **THEN** the capability exposes landmarks and a heading structure that carry its meaning

### Requirement: Announcement of errors and changes

A blocking error MUST be announced promptly. Other changes MUST be announced without
interrupting current speech and without announcing unaffected values.

Two distinct events MUST each be announced, whether or not they are spoken in the same
words. A live region announces a change to what it holds, and the same sentence written
over itself is not a change: a second screen that could not be opened says exactly what the
first one said, and without this it would be the silence this requirement exists to
prevent. A replay of one event is still one event and MUST stay silent.

One occurrence MUST be announced once. Re-resolving what an announcement says is not a second
occurrence.

A figure a filter publishes is a distinct event each time it changes, whether it rises or
falls. A condition that arises a second time is a distinct event. An action a Commander
repeats on one subject is a distinct event each time it reports an outcome.

An outcome to a question the Commander has withdrawn MUST NOT be announced, unless the work it
reports is already done and cannot be taken back. This is the one case this requirement excepts
from the rule above. The question was replaced or cancelled before the answer arrived, so the
answer lands on top of the answer to the question that replaced it.

Work already done is the exception inside the exception. Records written to storage stay
written whether or not anyone is still waiting to hear about them, and silence would leave a
Commander holding saved records nobody told them about. An outcome of that kind MUST be
announced.

Source: 011/FR-009.

#### Scenario: A blocking error occurs

- **WHEN** a blocking error occurs
- **THEN** the application announces it promptly

#### Scenario: A value changes while speech is in progress

- **WHEN** a change other than a blocking error occurs
- **THEN** the application announces it once without interrupting current speech
- **AND** it does not announce values the change did not affect

#### Scenario: The same thing goes wrong twice

- **WHEN** two separate events occur that are announced in identical words
- **THEN** the live region carrying them changes for each of them
- **AND** neither is left unsaid because the words did not move

#### Scenario: One event is published twice

- **WHEN** a Commander changes the browser language setting, and nothing has happened since the
  last announcement
- **THEN** nothing further is announced
- **AND** the live region carrying the last event does not change

#### Scenario: A filter is narrowed twice

- **WHEN** a Commander narrows a filter twice, and each narrowing lowers the figure it
  publishes
- **THEN** each figure is announced

#### Scenario: A filter is widened

- **WHEN** a Commander widens a filter, and the figure it publishes rises
- **THEN** the figure is announced

#### Scenario: A blocking condition arises a second time

- **WHEN** a condition that blocks a Commander arises, is left, and arises again
- **THEN** it is announced each time it arises

#### Scenario: One action is repeated on one subject

- **WHEN** a Commander repeats an action on one subject
- **THEN** each outcome is announced

#### Scenario: One request reports two outcomes

- **WHEN** one request the Commander made reports two outcomes
- **THEN** both are announced

#### Scenario: An answer arrives after the question is withdrawn

- **WHEN** an outcome arrives for a request the Commander replaced or cancelled
- **AND** the request changed nothing that outlives it
- **THEN** it is not announced

#### Scenario: A withdrawn request had already written records

- **WHEN** a Commander withdraws a request that has already written records to storage
- **THEN** the outcome is announced
- **AND** it states how many records were written

### Requirement: Text equivalents for visual information

Meaning MUST NOT depend on colour, shape, position or motion. Every visual information
carrier MUST have a text equivalent.

Source: 011/FR-010.

#### Scenario: Information is carried visually

- **WHEN** a capability carries information by colour, shape, position or motion
- **THEN** the same information is available as text

#### Scenario: A statistic is read as text

- **WHEN** assistive technology reads a statistic
- **THEN** the statistic exposes its meaning, its unit, its availability and its viewing
  conditions as text

### Requirement: Every supported size, text size and zoom

Every capability MUST remain available on desktop, tablet and mobile in portrait and
landscape and at 200% text size and 400% zoom, with no horizontal page scrolling.

Source: 011/FR-011, 011/SC-003.

#### Scenario: A capability is used on a mobile device in landscape

- **WHEN** a Commander opens a capability on desktop, tablet or mobile, in portrait or in
  landscape
- **THEN** the capability remains available and complete
- **AND** the page does not scroll horizontally

#### Scenario: Text is enlarged and the page is zoomed

- **WHEN** text size is set to 200% or the page is zoomed to 400%
- **THEN** the content remains complete
- **AND** the page does not scroll horizontally

### Requirement: Contrast and target size

Within the qualified conformance target that excludes criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1,
2.4.1, 2.4.3, 2.4.7 and 2.4.11, text, meaningful non-text content and interactive targets
MUST meet the applicable WCAG 2.2 AA contrast and target-size rules.

Source: 011/FR-012.

#### Scenario: In-scope text, non-text content and targets are measured

- **WHEN** in-scope text, meaningful non-text content and interactive targets are measured
- **THEN** they meet the applicable WCAG 2.2 AA contrast and target-size rules
- **AND** overall conformance excludes criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3,
  2.4.7 and 2.4.11

### Requirement: Reduced motion

Motion MUST respect `prefers-reduced-motion` and MUST NOT carry required meaning.

Source: 011/FR-013.

#### Scenario: A Commander asks for reduced motion

- **WHEN** the browser reports `prefers-reduced-motion`
- **THEN** the application removes nonessential motion
- **AND** no meaning is lost, because motion carries no required meaning

### Requirement: Text expansion and right-to-left content

Layout and interaction MUST survive text expansion and right-to-left content.

Source: 011/FR-014.

#### Scenario: Text expands or reads right to left

- **WHEN** text expands, or content reads right to left
- **THEN** the layout and the interaction remain usable

### Requirement: Qualified conformance statements

Conformance statements MUST name all eight excluded criteria: 2.1.1, 2.1.2, 2.1.4, 2.2.1,
2.4.1, 2.4.3, 2.4.7 and 2.4.11. Unqualified WCAG 2.2 AA claims are prohibited. A statement
naming only the seven keyboard criteria is an unqualified claim and MUST fail the policy
checker.

Source: 011/FR-015.

#### Scenario: A conformance statement is published

- **WHEN** the repository states conformance with WCAG 2.2 AA
- **THEN** the statement names all eight excluded criteria: 2.1.1, 2.1.2, 2.1.4, 2.2.1,
  2.4.1, 2.4.3, 2.4.7 and 2.4.11

#### Scenario: A statement names only the seven keyboard criteria

- **WHEN** a conformance statement is unqualified, or names only the seven keyboard criteria
- **THEN** the policy checker fails

### Requirement: Journeys across the five layout profiles in both engines

Every primary journey MUST run across the five layout profiles — desktop, tablet portrait,
tablet landscape, mobile portrait and mobile landscape — in both Chromium and Firefox.

Source: 011/FR-021, 011/SC-005.

#### Scenario: The journey suite runs

- **WHEN** the journey suite runs
- **THEN** every primary journey runs on desktop, tablet portrait, tablet landscape, mobile
  portrait and mobile landscape
- **AND** it runs in both Chromium and Firefox
- **AND** it passes, covering the three viewport classes in both orientations

### Requirement: Automated accessibility checks

Automated accessibility checks MUST cover every capability and relevant state and MUST fail
the build on an in-scope violation.

Source: 011/FR-022, 011/SC-002.

#### Scenario: An in-scope violation is found

- **WHEN** the automated accessibility scan covers every capability and relevant state
- **THEN** it fails the build on an in-scope violation

#### Scenario: The scan finds nothing in scope

- **WHEN** the automated accessibility scan runs on the published application
- **THEN** it reports no in-scope WCAG violations

### Requirement: Screen-reader journeys

Screen-reader journeys MUST supplement automation for every primary capability.

Source: 011/FR-023, 011/SC-001.

#### Scenario: A primary capability is exercised with a screen reader

- **WHEN** a primary journey is run with a screen reader
- **THEN** the journey completes
- **AND** the screen-reader journey supplements the automated checks for that capability
