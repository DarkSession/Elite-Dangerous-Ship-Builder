## Purpose

Nav Beacon carries several tools. This capability is how a Commander finds them and moves between
them: the tool bar every screen draws, and the entry point at the application's own address that
offers a choice of tools rather than opening one.

## Requirements

### Requirement: Tool bar

The application MUST state which tool the open route belongs to, and MUST offer every tool it
serves. The tools MUST come from one registry, so a tool cannot be offered in one place and be
missing from another. A tool the application serves no address for MUST NOT be offered. The tool the
open route belongs to MUST be identified in localised text and by an exposed state, never by colour
or position alone, and MUST be identified rather than offered: nothing names it as a way to the
screen a Commander is already reading. Every other tool MUST be reachable at every supported width.

Source: 011/FR-028, 011/SC-009.

#### Scenario: A route that belongs to a tool is open

- **WHEN** a Commander opens a route that belongs to a tool
- **THEN** the tool bar identifies that tool in localised text and by an exposed state
- **AND** it does not offer that tool as a way to the screen the Commander is reading

#### Scenario: A tool the application serves no address for

- **WHEN** the registry holds a tool the application answers no address for
- **THEN** the tool bar does not offer that tool

#### Scenario: The tool bar at a supported width

- **WHEN** the tool bar is drawn at any supported width
- **THEN** every tool other than the one the open route belongs to is reachable

### Requirement: Entry point at the application's own address

The application's own address MUST present a choice of the tools it carries. It MUST NOT redirect
into a tool.

Source: 014/FR-001.

#### Scenario: A Commander opens the product's address

- **WHEN** a Commander with no history in the application opens its root address
- **THEN** they are shown the tools the application carries
- **AND** they are not taken into any tool

#### Scenario: A tool is chosen

- **WHEN** a Commander activates the ship builder's entry
- **THEN** the ship builder opens

### Requirement: Product identity and purpose

The entry point MUST state the product's identity and a single line saying what the product is for.

Source: 014/FR-002.

#### Scenario: The head of the entry point

- **WHEN** a Commander reads the entry point
- **THEN** it states the product's name and one line saying what the product is for

### Requirement: Every tool that opens something is offered

The entry point MUST offer every tool the application carries, and MUST offer only tools that open
something. A tool that answers no address is not offered.

Source: 014/FR-003.

#### Scenario: A tool answers no address

- **WHEN** the registry holds a tool the application answers no address for
- **THEN** the entry point does not offer that tool

#### Scenario: The application carries one tool, or many

- **WHEN** the entry point is opened at any count of tools
- **THEN** it presents whatever the registry holds
- **AND** its layout does not assume exactly two

### Requirement: One registry behind the entry point and the tool bar

The tools the entry point offers and the tools the tool bar names MUST come from one registry, so a
tool the application gains appears in both without either being maintained separately.

Source: 014/FR-004, 014/SC-004.

#### Scenario: The application gains a tool

- **WHEN** the application gains a tool
- **THEN** the entry point offers it and the tool bar names it
- **AND** neither list is maintained separately

#### Scenario: A tool exists in one place only

- **WHEN** a tool is present in one of the two places and absent from the other
- **THEN** the check over the two fails

### Requirement: What each tool entry carries

Each offered tool MUST carry its name, the subjects it covers, and a description of what a Commander
does with it.

Source: 014/FR-005, 014/SC-001.

#### Scenario: The ship builder's entry

- **WHEN** a Commander reads the ship builder's entry
- **THEN** it names the tool, lists the subjects it covers, and describes fitting a hull, setting
  power priorities, applying engineering and watching the resulting figures move

#### Scenario: The equipment builder's entry

- **WHEN** a Commander reads the equipment builder's entry
- **THEN** it names the tool, lists the subjects it covers, and describes building an on-foot loadout
  of a suit and weapons with grades and modifications

#### Scenario: Choosing between the tools without opening one

- **WHEN** a Commander opens the product's address for the first time
- **THEN** they can name both tools and say which one plans an on-foot loadout, without opening
  either

### Requirement: A tool entry behaves as a link

Activating a tool's entry MUST open that tool at the address it opens at, and that entry MUST behave
as a link — openable in a new tab and its address copyable — rather than as a control that only
works when pressed.

Source: 014/FR-006, 014/SC-002.

#### Scenario: A tool entry is activated

- **WHEN** a Commander activates a tool's entry
- **THEN** that tool opens at the address it opens at
- **AND** choosing the tool took one action

#### Scenario: A tool entry is opened in a new tab

- **WHEN** a Commander opens a tool's entry in a new tab or copies its address
- **THEN** the entry answers as a link does

### Requirement: The entry point stays in history

Opening a tool from the entry point MUST leave the entry point in history, so going back returns to
it.

Source: 014/FR-007.

#### Scenario: A Commander goes back from a tool

- **WHEN** a Commander opens a tool from the entry point and then goes back
- **THEN** they are returned to the entry point rather than past it

### Requirement: An address the application cannot resolve

An address the application cannot resolve MUST land at the entry point.

Source: 014/FR-008.

#### Scenario: An unresolvable address is opened

- **WHEN** an address the application cannot resolve is opened
- **THEN** the Commander arrives at the entry point rather than inside a tool

### Requirement: Addresses that resolve open directly

Addresses that resolve — the shipyard, a hull, a build, the bench, and any build or loadout carried
in a link fragment — MUST continue to open directly, with the entry point never interposed.

Source: 014/FR-009, 014/SC-007.

#### Scenario: A shared build or loadout link

- **WHEN** a Commander opens an address that carries a build or a loadout in its fragment
- **THEN** the link resolves into its tool
- **AND** the entry point is not interposed

#### Scenario: An address that resolved before

- **WHEN** an address that already resolved is opened
- **THEN** it resolves as it did, apart from the product's own address and addresses that resolved to
  nothing

### Requirement: No current tool at the entry point

While the entry point is open, the tool bar MUST mark no tool as the current one.

Source: 014/FR-010.

#### Scenario: The entry point is open

- **WHEN** the entry point is open
- **THEN** the tool bar states no tool as current rather than guessing one

### Requirement: Shell actions at the entry point

The shell actions that are carried on every screen — opening a saved record, importing a build, and
help — MUST remain available at the entry point, in the same place and with the same behaviour as on
every other screen. The entry point adds no action of its own to the bar.

Source: 014/FR-011.

#### Scenario: The bar at the entry point

- **WHEN** a Commander reads the bar at the entry point
- **THEN** opening a saved record, importing a build and help are in the same place and behave as
  they do on every other screen
- **AND** the bar carries no action the entry point added

### Requirement: Attribution and non-endorsement

The entry point MUST carry the statement that the product was created using Elite Dangerous assets
and imagery with the permission of Frontier Developments plc for non-commercial purposes, and that
it is neither endorsed by nor reflective of the views of Frontier Developments.

Source: 014/FR-012.

#### Scenario: A Commander reaches the foot of the entry point

- **WHEN** a Commander reaches the foot of the entry point
- **THEN** the attribution and non-endorsement statement is present in full

#### Scenario: The statement at a supported viewport

- **WHEN** the statement is read at any supported viewport
- **THEN** it is legible and not truncated

### Requirement: Localised strings at the entry point

Every string the entry point renders — the product line, each tool's name, subject list and both of
its descriptions, and the attribution statement — MUST resolve through the localisation layer and
MUST survive text expansion and right-to-left scripts without horizontal page scrolling or ambiguous
truncation.

Source: 014/FR-013, 014/SC-006.

#### Scenario: The entry point in another language

- **WHEN** a Commander reads a tool's entry in a language other than English
- **THEN** its name, subject list and description are in the committed language

#### Scenario: A very long translation

- **WHEN** a tool's name, subject list or description expands in a shipped language
- **THEN** the page does not scroll horizontally at any supported viewport
- **AND** nothing truncates to ambiguity

#### Scenario: A shipped locale is rendered

- **WHEN** the entry point renders in any shipped locale, in either of the two forms
- **THEN** it carries no untranslated key, empty string or placeholder

### Requirement: The entry point at every form factor

The entry point MUST be fully usable on desktop, tablet and mobile, in both orientations, by touch as
well as by pointer, and MUST compose from the existing design system rather than introduce a visual
language of its own.

Source: 014/FR-014, 014/SC-003.

#### Scenario: A tool entry is activated by touch

- **WHEN** a Commander activates a tool's entry by touch on a phone
- **THEN** the entry is a target a thumb can hit
- **AND** nothing about choosing a tool depends on hover

#### Scenario: The choice is presented at each width

- **WHEN** the entry point is opened at a desktop or tablet width
- **THEN** its full choice of tools is presented without scrolling
- **AND** on a phone in portrait the first tool is visible without scrolling

### Requirement: Accessibility of the entry point

The entry point MUST be navigable by screen reader with correct roles and names, MUST meet the
contrast and target-size ratios of WCAG 2.2 AA outside the eight criteria the constitution excludes
(2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7, 2.4.11), and MUST carry no information by colour or
position alone.

Source: 014/FR-015, 014/SC-005.

#### Scenario: The automated accessibility check

- **WHEN** the automated accessibility check runs over the entry point at desktop, tablet and mobile
  viewports in both supported browser engines
- **THEN** it reports zero violations of the in-scope criteria

### Requirement: The entry point's own title and description

The entry point MUST publish a document title and description of its own, in the committed language,
distinct from the shipyard's.

Source: 014/FR-016.

#### Scenario: The product's address is quoted

- **WHEN** a reader quotes the product's own address
- **THEN** it carries the entry point's own title and description in the committed language, distinct
  from the shipyard's

### Requirement: Two descriptions and one subject list

Each tool MUST carry two descriptions and one subject list. The fuller description and the subject
list are presented where the entry point composes in more than one column; the shorter description
alone is presented where it composes as a single flow. Both descriptions MUST name the same tool
truthfully — the shorter one is a shorter statement of the same thing, never a different claim.

Source: 014/FR-017.

#### Scenario: The entry point composes in more than one column

- **WHEN** the entry point composes in more than one column
- **THEN** each tool presents its fuller description and its subject list

#### Scenario: The entry point composes as a single flow

- **WHEN** the entry point composes as a single flow
- **THEN** each tool presents its shorter description alone
- **AND** that description states the same thing the fuller one states

### Requirement: The composition mode chooses the form

Which of the two forms is presented MUST follow the composition mode the application already names,
not a device label or a user setting. A Commander MUST NOT be able to choose between the forms, and
neither form may be the only place some fact about a tool appears — every word a Commander needs to
choose between the tools MUST be present in both.

Source: 014/FR-018.

#### Scenario: A Commander resizes across the fold

- **WHEN** a Commander resizes across the width at which the forms swap
- **THEN** a tool's description changes length and its subject list appears or goes
- **AND** both tools stay named, described and activatable on either side

#### Scenario: A Commander looks for a setting

- **WHEN** a Commander looks for a way to choose between the two forms
- **THEN** there is none, and the composition mode decides it

### Requirement: Exactly one form at every viewport

At every supported viewport, both orientations, and in every shipped language, exactly one of the two
forms MUST be presented for each tool. Neither may be drawn twice, and no width may fall between them
and present neither.

Source: 014/FR-019, 014/SC-008.

#### Scenario: A viewport the end-to-end suite covers

- **WHEN** the entry point is drawn at any viewport the end-to-end suite covers
- **THEN** each tool shows exactly one of its two descriptions, never both and never neither
- **AND** the choice between them is the same for every tool on the screen
