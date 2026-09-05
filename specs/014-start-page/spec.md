# Feature Specification: Start Page

**Feature Branch**: `014-start-page`

**Created**: 2026-09-04

**Status**: Draft — ready to plan

**Input**: User description: "A starting page based on .design"

The application opens on a choice of tool rather than inside one. A Commander who
arrives at the product's own address is shown what NavBeacon carries, told enough
about each tool to pick the right one, and taken there. Drawn in
`.design/Home.dc.html` at 1440px (artboard `1a`, "Desktop — merged toolbar, tool
selector in the middle") and 390px (artboard `1b`, "Mobile — stacked selector").

The canvas's own closing note: "Top bar carried over from the builders; the middle
is the tool selector." Everything in the tool bar already exists and is unchanged
by this feature; what is new is the entry point beneath it and the attribution band
that closes it.

## Clarifications

### Session 2026-09-04

- Q: The desktop artboard gives each tool a subject strip and a long description; the
  mobile artboard drops the strip and carries a shorter sentence. Is that one body of
  text laid out differently at each width, or two different texts? → A: **Two texts,
  chosen by viewport.** Both artboards are built literally. Each tool therefore carries
  two descriptions and one subject list, and the subject list is drawn only where the
  entry point composes in more than one column.

  **Divergence from constitution principle V**, stated rather than claimed: principle V
  holds that a capability present on one form factor and absent on another is
  incomplete, and the subject list is absent on a phone. The ruling is that a tool's
  subject list is orientation for a choice and not the choice itself — choosing a tool,
  and every word needed to choose between the two, is present at every width. This was
  raised and ruled on; do not re-derive it. It binds the subject list and the two
  description lengths, and nothing else: no other content on this screen may be dropped
  at a width.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Arrive and choose a tool (Priority: P1)

A Commander opens NavBeacon's own address for the first time — from a bookmark, a
link in a Discord thread, or a search result naming the product rather than a
build. Instead of landing inside one tool and having to work out that another
exists, they are met by the product's name, a line saying what it is for, and the
tools it carries. They read the two, pick the one that answers their question, and
are taken into it.

**Why this priority**: This is the feature. Today the product's own address is a
redirect into the ship builder, so a Commander who came for the on-foot bench
lands in a shipyard and has to discover the other tool from a tab. Everything else
here decorates this journey.

**Independent Test**: Open the application's root address, confirm a choice of
tools is presented rather than a tool, activate one, and confirm the tool opens.
Delivers the entry point on its own, with no other story built.

**Acceptance Scenarios**:

1. **Given** a Commander with no history in the application, **When** they open its
   root address, **Then** they are shown the product's name, a statement of what
   it is for, and every tool the application carries — and are not taken into any
   tool.
2. **Given** the entry point is open, **When** a Commander activates the ship
   builder's entry, **Then** the ship builder opens.
3. **Given** the entry point is open, **When** a Commander activates the equipment
   builder's entry, **Then** the equipment builder opens.
4. **Given** a Commander opened a tool from the entry point, **When** they go back,
   **Then** they are returned to the entry point rather than past it.
5. **Given** an address the application cannot resolve, **When** it is opened,
   **Then** the Commander arrives at the entry point rather than inside a tool.

---

### User Story 2 - Tell the tools apart before opening one (Priority: P2)

A Commander who does not already know the product cannot choose between two names.
Each tool states the subjects it covers and what a Commander can do with it, in
plain language, so the choice is made before the click rather than after.

**Why this priority**: Without it story 1 presents two labels and a coin toss. It
is separable because the entry point is navigable with names alone; this is what
makes the choice informed.

**Independent Test**: Open the entry point and confirm each tool carries its name,
the subject areas it covers, and a description of what it does — with no tool
opened.

**Acceptance Scenarios**:

1. **Given** the entry point is open, **When** a Commander reads the ship builder's
   entry, **Then** it names the tool, lists the subjects it covers, and describes
   fitting a hull, setting power priorities, applying engineering and watching the
   resulting figures move.
2. **Given** the entry point is open, **When** a Commander reads the equipment
   builder's entry, **Then** it names the tool, lists the subjects it covers, and
   describes building an on-foot loadout of a suit and weapons with grades and
   modifications.
3. **Given** the application gains a tool, **When** the entry point is opened,
   **Then** that tool is offered there and in the tool bar together, without either
   being maintained separately.
4. **Given** the entry point is open in a language other than English, **When** a
   Commander reads a tool's entry, **Then** its name, subject list and description
   are in the committed language.

---

### User Story 3 - See whose material this is (Priority: P3)

The entry point states, at its foot, that the game assets and imagery are used with
Frontier Developments' permission for non-commercial purposes and that the product
is not endorsed by them.

**Why this priority**: It is the obligation attached to using the material, and the
entry point is the first page a Commander and a rights holder both see. It is last
because the statement is already reachable from the licence surface, so the entry
point makes it prominent rather than making it exist.

**Independent Test**: Open the entry point and confirm the attribution statement is
present and readable at desktop, tablet and mobile widths.

**Acceptance Scenarios**:

1. **Given** the entry point is open, **When** a Commander reaches its foot, **Then**
   the attribution and non-endorsement statement is present in full.
2. **Given** the entry point is open at any supported viewport, **When** the
   statement is read, **Then** it is legible and not truncated.

---

### Edge Cases

- **A Commander who only ever uses one tool now passes through a choice.** The entry
  point adds a step for the returning Commander. Their addresses — the shipyard, a
  build link, the bench — still open directly, so the cost falls only on someone who
  opens the bare product address.
- **A shared build or loadout link.** Opening `/outfitting#…` or `/equipment#…` is
  unaffected: the link resolves into its tool, and the entry point is not
  interposed.
- **No tool is the current one.** The tool bar names the open tool on every other
  screen; at the entry point none is open, so none is marked current and the bar
  states no tool rather than guessing one.
- **The application carries one tool, or many.** The entry point presents whatever
  the registry holds, at every count, without a layout that assumes exactly two.
- **A very long translation.** A tool's name, subject list or description in a
  language that expands must not push the page into horizontal scrolling or truncate
  to ambiguity at any supported viewport.
- **The width at which the forms swap.** A Commander resizing across the fold sees a
  tool's description change length and its subject list appear or go. Nothing about the
  choice changes with it: both tools stay named, described and activatable on either
  side.
- **A tool entry activated by touch.** Each entry is a target a thumb can hit on a
  phone, and nothing about choosing a tool depends on hover.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The application's own address MUST present a choice of the tools it
  carries. It MUST NOT redirect into a tool.
- **FR-002**: The entry point MUST state the product's identity and a single line
  saying what the product is for.
- **FR-003**: The entry point MUST offer every tool the application carries, and MUST
  offer only tools that open something. A tool that answers no address is not offered.
- **FR-004**: The tools the entry point offers and the tools the tool bar names MUST
  come from one registry, so a tool the application gains appears in both without
  either being maintained separately.
- **FR-005**: Each offered tool MUST carry its name, the subjects it covers, and a
  description of what a Commander does with it.
- **FR-006**: Activating a tool's entry MUST open that tool at the address it opens
  at, and that entry MUST behave as a link — openable in a new tab and its address
  copyable — rather than as a control that only works when pressed.
- **FR-007**: Opening a tool from the entry point MUST leave the entry point in
  history, so going back returns to it.
- **FR-008**: An address the application cannot resolve MUST land at the entry point.
- **FR-009**: Addresses that resolve — the shipyard, a hull, a build, the bench, and
  any build or loadout carried in a link fragment — MUST continue to open directly,
  with the entry point never interposed.
- **FR-010**: While the entry point is open, the tool bar MUST mark no tool as the
  current one.
- **FR-011**: The shell actions that are carried on every screen — opening a saved
  record, importing a build, and help — MUST remain available at the entry point, in
  the same place and with the same behaviour as on every other screen. This feature
  adds no action of its own to the bar.
- **FR-012**: The entry point MUST carry the statement that the product was created
  using Elite Dangerous assets and imagery with the permission of Frontier
  Developments plc for non-commercial purposes, and that it is neither endorsed by
  nor reflective of the views of Frontier Developments.
- **FR-013**: Every string the entry point renders — the product line, each tool's
  name, subject list and both of its descriptions, and the attribution statement — MUST resolve
  through the localisation layer and MUST survive text expansion and right-to-left
  scripts without horizontal page scrolling or ambiguous truncation.
- **FR-014**: The entry point MUST be fully usable on desktop, tablet and mobile, in
  both orientations, by touch as well as by pointer, and MUST compose from the
  existing design system rather than introduce a visual language of its own.
- **FR-015**: The entry point MUST be navigable by screen reader with correct roles
  and names, MUST meet the contrast and target-size ratios of WCAG 2.2 AA outside the
  eight criteria the constitution excludes (2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3,
  2.4.7, 2.4.11), and MUST carry no information by colour or position alone.
- **FR-016**: The entry point MUST publish a document title and description of its
  own, in the committed language, distinct from the shipyard's — the product's
  address is what a search result for the product quotes.
- **FR-017**: Each tool MUST carry two descriptions and one subject list. The fuller
  description and the subject list are presented where the entry point composes in more
  than one column; the shorter description alone is presented where it composes as a
  single flow. Both descriptions MUST name the same tool truthfully — the shorter one is
  a shorter statement of the same thing, never a different claim.
- **FR-018**: Which of the two forms is presented MUST follow the composition mode the
  application already names, not a device label or a user setting. A Commander MUST NOT
  be able to choose between the forms, and neither form may be the only place some fact
  about a tool appears — every word a Commander needs to choose between the tools MUST
  be present in both.
- **FR-019**: At every supported viewport, both orientations, and in every shipped
  language, exactly one of the two forms MUST be presented for each tool. Neither may be
  drawn twice, and no width may fall between them and present neither.

### Key Entities

- **Tool**: One of the things NavBeacon carries. Has an identity, a name, the subjects
  it covers, two descriptions of what a Commander does with it — a fuller one and a
  shorter one — and the address it opens at. The same record the tool bar reads, which
  today reads only the identity, the name and the address.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander opening the product's address for the first time can name
  both tools and say which one plans an on-foot loadout, without opening either.
- **SC-002**: Choosing a tool from the entry point takes one action.
- **SC-003**: The entry point presents its full choice of tools without scrolling at
  desktop and tablet widths, and the first tool is visible without scrolling on a
  phone in portrait.
- **SC-004**: 100% of the tools the application carries are offered at the entry
  point, verified by a check that fails if a tool exists in one place and not the
  other.
- **SC-005**: The automated accessibility check over the entry point reports zero
  violations of the in-scope criteria, at desktop, tablet and mobile viewports in both
  supported browser engines.
- **SC-006**: The entry point renders with no untranslated key, empty string or
  placeholder in any shipped locale, in either of the two forms.
- **SC-008**: At every viewport the end-to-end suite covers, each tool shows exactly one
  of its two descriptions — never both, never neither — and the choice between them is
  the same for every tool on the screen.
- **SC-007**: No address that resolved before this feature resolves differently after
  it, apart from the product's own address and addresses that resolved to nothing.

## Assumptions

- The product's own address is the entry point's address; the entry point gets no
  separate address of its own.
- The tool bar drawn on the canvas is the one the application already draws
  (`specs/011-interface-foundations`, artboards `4c`/`4d`). This feature changes
  nothing in it. Two things the Home canvas draws in that bar are not in the shell
  and are not added here: the `CH` commander chip and the `⋯` overflow marker
  beside the tabs (Commander confirmation 2026-09-04). Neither is a gap this
  feature closes. The chip additionally reads as an account, which the
  constitution's client-side principle forbids, and the marker stands for tools
  that do not exist, which is what 011/FR-028 rules out — so the entry point is
  specified against the bar as it is built.
- The two tools carried today are the ship builder and the equipment builder. The
  canvas names both and no others; the eight-tool registry drawn in
  `.design/Tool Navigation.dc.html` is not adopted here.
- Opening a saved record, importing and help are already shell-wide actions and appear
  at the entry point by carrying over, not by being added. A saved record opens into
  whichever tool made it; an imported ship build opens into the ship builder.
- The attribution wording is the one the product already publishes with its licences,
  not a second copy authored here.
- "More than one column" and "a single flow" are the application's existing named
  composition modes (`src/styles/_responsive.scss`): the compact mode carries the shorter
  form, the medium and wide modes carry the fuller one. No new threshold is introduced,
  and no device label decides it.
- The entry point holds no build state, reads none, and writes none. It is a way in.

## Dependencies

- The tool registry that feeds the tool bar (`specs/011-interface-foundations`) is the
  source of the tools offered here. Extending it with two descriptions and a subject
  list is part of this feature.
- The attribution statement is the one the licence surface publishes
  (`specs/012-help-and-licences`).
- Both tools must already answer their addresses; they do.
