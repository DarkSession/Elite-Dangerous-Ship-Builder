## ADDED Requirements

### Requirement: One way to the entry point on every screen

The shell MUST carry one way to the entry point, and MUST carry it on every screen. It MUST
behave as a link — openable in a new tab, its address copyable — rather than as a control
that only works when pressed. It MUST carry an accessible name that says where it goes, so
it is never announced as a picture of nothing.

It MUST be present on the entry point as well, where activating it MUST change nothing: the
screen stays as it is, the address stays as it is, and nothing enters history. Reaching a
tool MUST NOT require the entry point: every tool the application serves stays reachable
from the tool bar on the screen a Commander is already on.

A screen the shell draws as a sheet over another one is the one exception. Where the shell
draws the sheet's own bar — the way back to the screen the sheet was opened over — the way to
the entry point MAY be absent from that bar, and MUST stand on the screen underneath. The
sheet's bar MUST still carry the way back, so the entry point is one screen away rather than
unreachable.

Source: 017/FR-001, 017/FR-002, 017/SC-001.

#### Scenario: A Commander is inside a tool

- **WHEN** a Commander activates the way to the entry point from any screen inside a tool
- **THEN** the entry point opens
- **AND** reaching it took one action

#### Scenario: The entry point is already open

- **WHEN** a Commander activates the way to the entry point while the entry point is open
- **THEN** the screen and the address are unchanged
- **AND** nothing is added to history

#### Scenario: A screen drawn as a sheet over another

- **WHEN** a Commander reads a screen whose bar is the sheet's own — the way back to the screen
  it was opened over
- **THEN** the way back is offered
- **AND** the way to the entry point stands on the screen it leads back to

#### Scenario: It is opened in a new tab

- **WHEN** a Commander opens it in a new tab or copies its address
- **THEN** it answers as a link does

#### Scenario: It is read by a screen reader

- **WHEN** a Commander reads the shell with a screen reader
- **THEN** the way to the entry point is announced with a name that says where it goes

## MODIFIED Requirements

### Requirement: Tool bar

The application MUST state which tool the open route belongs to, and MUST offer every tool it
serves. The tools MUST come from one registry, so a tool cannot be offered in one place and be
missing from another. A tool the application serves no address for MUST NOT be offered. The tool the
open route belongs to MUST be identified in localised text and by an exposed state, never by colour
or position alone. Every tool MUST be reachable at every supported width, and every entry MUST
behave as a link — openable in a new tab, its address copyable.

The tool the open route belongs to MUST be offered as well as identified. Activating it MUST
re-enter that tool by the re-entry the registry states with the tool, so what re-entering
means is declared once beside the tool rather than decided by the bar. A tool that states no
re-entry MUST re-enter at the address it opens at. Where re-entering would open the screen a
Commander is already reading, activating the entry MUST change nothing: the screen stays as
it is, and nothing enters history.

Source: 011/FR-028, 011/SC-009, 017/FR-003, 017/FR-004, 017/FR-005, 017/SC-002.

#### Scenario: A route that belongs to a tool is open

- **WHEN** a Commander opens a route that belongs to a tool
- **THEN** the tool bar identifies that tool in localised text and by an exposed state

#### Scenario: A tool the application serves no address for

- **WHEN** the registry holds a tool the application answers no address for
- **THEN** the tool bar does not offer that tool

#### Scenario: The tool bar at a supported width

- **WHEN** the tool bar is drawn at any supported width
- **THEN** every tool the registry carries is reachable

#### Scenario: The open tool is activated from another of its screens

- **WHEN** a Commander activates the open tool's entry on a screen the re-entry does not lead to
- **THEN** the tool re-enters as the registry states
- **AND** the tool stays the one the bar identifies

#### Scenario: The open tool is activated where its re-entry already stands

- **WHEN** a Commander activates the open tool's entry on the screen its re-entry leads to
- **THEN** the screen is unchanged
- **AND** nothing is added to history

#### Scenario: The tool bar is read by a screen reader

- **WHEN** a Commander reads the tool bar with a screen reader
- **THEN** every tool is announced as a control
- **AND** the open tool is announced as the current one
