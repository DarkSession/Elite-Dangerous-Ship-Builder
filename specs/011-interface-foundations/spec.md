# Feature Specification: Interface Foundations

**Feature Branch**: `011-interface-foundations`

**Created**: 2026-08-16

**Status**: Draft

**Input**: Identified by design review. Two obligations every feature already carried had no
specification of their own: that every visual value comes from a design token, and that the
application is usable by a Commander who cannot use a mouse, cannot see the screen, or cannot read
small text. Both were stated in the constitution and inherited by every feature, and neither was
testable anywhere.

## Scope

This specification is the **contract every screen obeys**, as
[feature 003](../003-ship-statistics/spec.md) is the contract every figure obeys. It covers where a
visual value comes from, what a Commander can do without a pointer, what a screen reader is told, and
how all of it is verified.

It names no screen and owns no capability of its own. What it fixes is how every other feature's
capability is delivered:

| Obligation                                              | Stated here      |
| ------------------------------------------------------- | ---------------- |
| One design system, one theme, tokens as the only source | FR-001 to FR-007 |
| Keyboard operation                                      | FR-008 to FR-012 |
| Screen readers and text alternatives                    | FR-013 to FR-018 |
| Legibility, contrast, targets and motion                | FR-019 to FR-024 |
| The standard, and where a defect belongs                | FR-025 to FR-027 |
| Every form factor                                       | FR-028           |
| Verification                                            | FR-029 to FR-034 |

Every accepted feature inherits this specification without restating it, exactly as it inherits
feature 003's honesty rules. Where a feature specification is more specific — feature 010's mount
targets, feature 009's material-grade text alternative, feature 001's hull-art treatment — it
governs, and it may not relax anything here.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Build a ship without a pointer (Priority: P1)

A Commander who navigates by keyboard — because they use a switch device, because their hands hurt,
or because they simply do not want to reach for a mouse — chooses a hull, fits and engineers modules,
reads the statistics and shares the build, without a pointer at any step.

**Why this priority**: It is the accessibility requirement that most often turns out to be untrue
after the fact, because everything is reachable by pointer while it is being built. A capability that
cannot be reached by keyboard is not a styling defect; it is a capability the Commander does not
have.

**Independent Test**: Complete the primary journey of every accepted feature using the keyboard
alone, and confirm every step is reachable, the focused element is always visible, and the focus
never lands somewhere it cannot leave.

**Acceptance Scenarios**:

1. **Given** any screen, **When** the Commander moves through it by keyboard, **Then** every
   interactive element is reachable in an order that follows the screen's meaning, and the element
   holding focus is visibly identifiable at all times.
2. **Given** a dialog, picker or panel that takes focus, **When** it is open, **Then** focus stays
   within it, it can be dismissed from the keyboard, and dismissing it returns focus to whatever
   opened it.
3. **Given** a long list — the hull catalogue, a slot's offer list — **When** the Commander is
   working past it, **Then** they can reach what follows without stepping through every entry.
4. **Given** an element that opens on hover, **When** the Commander has no pointer, **Then** the same
   information is reachable by keyboard; nothing is available by hover alone.
5. **Given** a keyboard shortcut the application defines, **When** it is pressed, **Then** it does
   not override a browser or assistive-technology binding, and everything it reaches remains
   reachable without it.

---

### User Story 2 - Build a ship without seeing it (Priority: P1)

A Commander using a screen reader opens a shared build, hears what is fitted where, changes a module
and hears what that did to the statistics.

**Why this priority**: This application is dense with figures, states and diagrams, and almost all of
its meaning is conveyed visually. Without deliberate text equivalents a screen reader gets a wall of
numbers with no idea what they belong to.

**Independent Test**: Complete the primary journey of every accepted feature with a screen reader,
confirming every control announces what it is and what state it is in, every figure announces what it
measures, and every change announces its result.

**Acceptance Scenarios**:

1. **Given** any control, **When** it receives focus, **Then** its name, its role and its current
   state are announced, and its name is the same text a sighted Commander reads.
2. **Given** a figure, **When** it is reached, **Then** what it measures, its unit and the conditions
   it was computed under are available as text, not implied by a neighbouring label alone.
3. **Given** a build change, **When** the statistics recompute, **Then** the Commander is told what
   changed without having to hunt for it, and the announcement does not repeat every unaffected
   figure.
4. **Given** an error, a refusal or a validity problem, **When** it appears, **Then** it is announced
   when it appears rather than discovered later, and it names what to do about it.
5. **Given** an illustration, a schematic, a chart or a grade image, **When** it is reached, **Then**
   the information it carries is available as text; no information is carried by the image alone.
6. **Given** any screen, **When** it is navigated by landmark or heading, **Then** its regions are
   identified and it can be moved through without reading it linearly.

---

### User Story 3 - Read it at the size you need (Priority: P2)

A Commander with low vision runs their browser at 200% text size, and another reads on a phone in
bright sunlight where a low-contrast label disappears entirely.

**Why this priority**: The application is a dense grid of small figures, which is exactly the layout
that breaks first under enlargement and the palette that fails contrast first. P2 rather than P1
because stories 1 and 2 decide whether the application can be used at all.

**Independent Test**: Set text to 200% and zoom to 400% at each supported viewport and confirm no
content or capability is lost, nothing is clipped or overlapped, and the page never scrolls
horizontally.

**Acceptance Scenarios**:

1. **Given** any screen at 200% text size, **When** the Commander reads it, **Then** every figure and
   label is fully legible, nothing is truncated to the point of ambiguity, and no capability has
   disappeared.
2. **Given** any screen at 400% zoom on a narrow viewport, **When** the Commander works through it,
   **Then** content reflows rather than requiring horizontal page scrolling.
3. **Given** any text or meaningful non-text element, **When** its contrast is measured against what
   sits behind it, **Then** it meets the AA ratio for its size and kind.
4. **Given** a state conveyed by colour — a deficit, a warning, an unpowered module, a filtered hull
   — **When** the Commander cannot distinguish that colour, **Then** the state is still identifiable
   from text or shape.
5. **Given** a Commander who has asked their system to reduce motion, **When** anything in the
   application would animate, **Then** it does not, and nothing depends on the animation having
   played.

---

### User Story 4 - One application, not six screens (Priority: P2)

A Commander moves between the catalogue, outfitting, the anatomy view and the statistics, and never
has to work out how this part of the application expresses a warning, a disabled control or a
selected row.

**Why this priority**: Consistency is what makes a dense interface learnable once rather than five
times. It is also the obligation that decays silently — one screen at a time, each for a good local
reason.

**Independent Test**: Confirm every screen composes the component library, that no screen carries a
visual value of its own, and that a change to a token changes every screen that uses it.

**Acceptance Scenarios**:

1. **Given** any screen, **When** it presents a control, a state or a surface, **Then** it composes
   the design system's component for it rather than an equivalent built locally.
2. **Given** a design token is changed, **When** the application is rebuilt, **Then** every screen
   using it changes, and no screen has to be edited for it to take effect.
3. **Given** a screen needs something the design system does not have, **When** it is built, **Then**
   the system gains it and the screen composes it, rather than the screen solving it locally.
4. **Given** a component, **When** it is inspected, **Then** it carries a preview of every state it
   handles — default, populated, empty, loading, error, disabled — at desktop, tablet and mobile
   widths.

---

### Edge Cases

- A colour literal introduced in a component during ordinary work: the build fails on it, naming the
  file, rather than shipping a value the token layer does not know about.
- A component that needs a colour the token set does not carry: the token set gains it. A one-off
  value inside a component is the drift the whole obligation exists to prevent.
- A design tool that shows a colour this repository does not define: the repository is right and the
  tool is a working surface (constitution principle VII). The colour reaches the application by
  becoming a token, never by being copied out of the tool.
- Text expanded by translation until a label wraps to three lines: the layout survives it, because
  translation expansion and increased text size are the same problem.
- A right-to-left script: the layout mirrors, and nothing that carries meaning by its side of the
  screen breaks.
- A figure that updates while a screen reader is reading the previous one: the announcement does not
  interrupt what is being read, and the Commander is not left with a partially read figure.
- A live region that announces every recomputed statistic on every keystroke: this is a defect, not
  thoroughness. What is announced is what changed.
- An automated accessibility check that passes on a screen no Commander could operate by keyboard:
  the check is a floor. FR-033's journeys are what assert the capability.
- A defect that appears in Firefox but not Chromium: it is a defect, found by the suite before
  release rather than by a Commander after it.
- A component whose focus indicator is invisible against one particular surface: the indicator is
  part of the component's definition, so it is fixed once, in the component, for every surface it
  sits on.

## Requirements _(mandatory)_

### Functional Requirements

#### One design system

- **FR-001**: Every screen MUST be composed from the one component library under `src/app/ui/`. A
  screen MUST NOT introduce a visual language of its own, and MUST NOT reimplement a component the
  library provides.
- **FR-002**: Design tokens MUST be the only source of colour, type scale, spacing, radius,
  elevation, border and motion. No component, template, screen stylesheet or inline style may carry
  a literal for any of them.
- **FR-003**: Colour literals MUST exist only in the design system's token layer. Everything else —
  components, screens, charts, converted artwork, generated assets — MUST reference a token. This is
  enforced at build time under FR-030 rather than by review.
- **FR-004**: The application ships **one theme** — the dark one the design system defines. There
  MUST be no light theme, no theme control and no stored theme preference, and no requirement in any
  feature may depend on a theme being chosen or changed. A future second theme would be a second set
  of token values; nothing in the application may need editing to accommodate one.
- **FR-005**: A screen that needs something the design system lacks MUST extend the design system.
  Solving it inside the screen is prohibited even where the result looks identical.
- **FR-006**: Every component MUST ship with a preview of every state it handles — default,
  populated, empty, loading, error, disabled — at desktop, tablet and mobile widths.
- **FR-007**: Components are presentation only. They MUST render the state they are handed and
  dispatch intent, and MUST NOT reach into domain services or hold build state (constitution
  principle III).

#### Keyboard

- **FR-008**: Every capability the application offers MUST be operable by keyboard alone. A
  capability reachable only by pointer or only by touch is not delivered.
- **FR-009**: Focus order MUST follow the meaning of the screen, and the element holding focus MUST
  be visibly identifiable against every surface it can sit on.
- **FR-010**: A surface that takes focus — dialog, picker, engineering panel, confirmation — MUST
  keep focus within itself while it is open, MUST be dismissible from the keyboard, and MUST return
  focus to the element that opened it.
- **FR-011**: A Commander MUST be able to skip past a repeated block — the catalogue listing, a slot
  list, an offer list — without stepping through every entry.
- **FR-012**: A keyboard shortcut the application defines MUST NOT override a browser or
  assistive-technology binding, MUST be discoverable rather than documented only, and MUST NOT be the
  only route to anything (this is feature 002's FR-036a, generalised).

#### Screen readers and text equivalents

- **FR-013**: Every control MUST expose its name, its role and its current state, and its accessible
  name MUST match the text a sighted Commander reads.
- **FR-014**: Every figure MUST carry, as text, what it measures, its unit and the conditions it was
  computed under. A label that identifies a figure only by its position beside it does not satisfy
  this.
- **FR-015**: Every screen MUST expose its regions as landmarks and its structure as headings, so it
  can be navigated without being read linearly.
- **FR-016**: A change the Commander did not directly trigger — statistics recomputing, a validity
  problem appearing, an import completing — MUST be announced. The announcement MUST carry what
  changed rather than the whole set, and MUST NOT interrupt what is being read.
- **FR-017**: No information may be carried by colour, shape, position or animation alone, anywhere
  in the application. Every image the application shows — illustration, schematic, chart, plot, grade
  image — MUST have its information available as text.
- **FR-018**: Every error, refusal and validity problem MUST be announced when it appears, MUST be
  associated with what it concerns, and MUST say what the Commander can do about it.

#### Legibility, targets and motion

- **FR-019**: Text and meaningful non-text elements MUST meet WCAG 2.2 level AA contrast against the
  surfaces they sit on, in the one theme the application ships.
- **FR-020**: The application MUST remain fully usable at 200% text size and at 400% zoom, at every
  supported viewport, without loss of content or capability and without horizontal page scrolling.
- **FR-021**: Interactive targets MUST meet the AA target-size rule, on every form factor. Where a
  drawn element is smaller than that — a mount on a schematic, a point on a plot — its target MUST
  NOT be.
- **FR-022**: Motion MUST respect `prefers-reduced-motion`, and the application MUST NOT make
  anything depend on an animation having played to be understood or operated.
- **FR-023**: The application MUST NOT rely on a specific pointing device, hover, or a gesture with
  no single-pointer equivalent.
- **FR-024**: Layouts MUST survive translation and right-to-left scripts under constitution principle
  VI, held to the same no-horizontal-scrolling and no-ambiguous-truncation rules as FR-020.

#### The standard

- **FR-025**: The application MUST meet **WCAG 2.2 level AA** in full, on desktop, tablet and mobile.
  The requirements above are the parts of it this application gets wrong most easily; they are not a
  substitute for the standard, and a conformance failure outside them is a failure.
- **FR-026**: Accessibility belongs to the component, not to the screen that composes it. Contrast,
  focus behaviour, keyboard operation, target size and semantics are part of a component's
  definition, so that a screen cannot compose an inaccessible one.
- **FR-027**: An accessibility defect MUST be treated as a defect in the feature that has it, not as
  a later pass. A feature is not complete while one is open against it.

### Device Requirements

- **FR-028**: Every requirement in this specification applies at desktop, tablet and mobile
  viewports, in portrait and landscape. None of them is relaxed on a small screen, which is where
  targets, contrast and enlargement matter most.

### Testing Requirements

- **FR-029**: The end-to-end suite MUST run against desktop, tablet and mobile viewports in
  **Chromium and Firefox**. A journey is covered when it passes in both; a browser MUST NOT be
  dropped from the matrix to get a build green.
- **FR-030**: A build-time check MUST fail on a colour literal anywhere outside the design system's
  token layer, naming the file and the value. It MUST cover components, templates, stylesheets and
  generated assets alike.
- **FR-031**: A test MUST assert that changing a token's value changes every screen that uses it,
  with no screen requiring an edit — so that FR-002 is verified by behaviour rather than by
  inspection.
- **FR-032**: An automated accessibility check MUST run over every screen, in every state the screen
  can be in, as part of the end-to-end suite. A violation MUST fail the build. It is a floor that
  fails the build, not a proof that passes it.
- **FR-033**: The keyboard and screen-reader journeys of User Stories 1 and 2 MUST be tested
  end-to-end, because they assert what automated checking cannot: that every capability is reachable
  without a pointer, that focus is never trapped or lost, that a change is announced, and that the
  primary journey of every accepted feature can be completed without sight of the screen.
- **FR-034**: Component previews (FR-006) MUST be asserted to exist for every state a component
  handles, so a state that ships without a preview fails the build rather than reaching a Commander
  untested.

### Key Entities

- **Design token**: One named visual value — a colour, a step on the type or spacing scale, a radius,
  an elevation, a duration — defined once and referenced everywhere. The only place a literal lives.
- **Component**: One presentation-only building block from `src/app/ui/`, carrying its own
  accessibility behaviour and a preview of every state it handles.
- **Theme**: The one set of token values the application ships. Not a preference, and not a
  dimension any requirement varies over.
- **Accessibility journey**: A primary journey of an accepted feature completed by keyboard alone or
  by screen reader alone, asserted end to end.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero colour literals exist outside the design system's token layer, across the whole
  source tree — asserted by a build-time check rather than by review.
- **SC-002**: Every primary journey of every accepted feature can be completed using the keyboard
  alone — zero capabilities reachable only by pointer or touch.
- **SC-003**: Every primary journey of every accepted feature can be completed with a screen reader —
  zero controls without a name, role and state, and zero figures whose meaning is available only
  visually.
- **SC-004**: Zero automated accessibility violations across every screen in every state, at every
  supported viewport.
- **SC-005**: Every screen remains fully usable at 200% text size and 400% zoom — zero capabilities
  lost, zero content clipped, and zero horizontal page scrolling at any viewport.
- **SC-006**: Every text and meaningful non-text element meets AA contrast — zero failures across the
  application.
- **SC-007**: Every state the application conveys with colour is also conveyed without it — zero
  states distinguishable by colour alone.
- **SC-008**: The end-to-end suite passes in Chromium and in Firefox, at all three viewports — zero
  engine-specific failures reaching a release.
- **SC-009**: Changing one token value visibly changes every screen that uses it, with zero screens
  edited.

## Assumptions

- This specification is a contract, not a screen. It fixes what every screen must obey; which
  components exist, what the tokens are and how the screens are laid out are decided at plan time
  under constitution principle VII.
- WCAG 2.2 level AA is the standard because it is the one that is testable, widely tooled and
  commonly required. Level AAA is not adopted wholesale: some of its criteria conflict with a dense
  figure-led interface, and adopting a standard the application will not meet is worse than adopting
  one it will.
- Automated accessibility checking is a floor. It catches contrast, names, roles and landmarks and
  cannot judge whether an interface makes sense; the journeys of FR-033 are what assert the
  capability, and a green automated run is never reported as conformance on its own.
- One dark theme is a product decision, not a technical limit. Every screen in the imported design is
  dark, an amber-on-near-black interface is what Commanders read the game itself in, and a second
  theme doubles the surface that has to be designed, tested for contrast and kept honest for no
  capability gained. The token layer would support a second, and nothing in the application may assume
  there will never be one; what is prohibited is a requirement that depends on a Commander choosing
  between them.
- Chromium and Firefox are the two engines the suite runs. WebKit is not currently in the matrix,
  which is a known gap rather than a claim that the application is untested there by design; adding
  it is a change to FR-029, not a workaround.
- Translatability (constitution principle VI) and responsiveness (principle V) are inseparable from
  accessibility here — text expansion, enlargement and reflow break the same layouts — so they are
  held to the same criteria rather than specified twice.
