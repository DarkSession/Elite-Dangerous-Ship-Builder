## Purpose

What a Commander is shown between asking for a screen and getting it. Every screen the
application serves arrives as its own code, fetched on the navigation that first asks for
it, and this capability owns the answer a Commander gets while that fetch is in flight: that
the application is working, not how far along it is.

## ADDED Requirements

### Requirement: A navigation that waits says so

A navigation that cannot present its screen at once MUST state that the application is
waiting, and MUST state it until the navigation ends. The statement MUST be the same for
every address the application answers, so a Commander learns one answer rather than one per
screen.

The statement MUST say only that the application is working. It MUST NOT state a
proportion, a percentage, a remaining time or a step count, because the application knows
none of them.

Source: 018/FR-001.

#### Scenario: A screen whose code has not been fetched before

- **WHEN** a Commander asks for a screen whose code the browser has not fetched
- **THEN** the application states that it is waiting
- **AND** the statement stands until the navigation ends

#### Scenario: Every address answers the same way

- **WHEN** a Commander asks for any address the application answers
- **THEN** the waiting statement is the same one

#### Scenario: Nothing is claimed about how long it will take

- **WHEN** the waiting statement stands
- **THEN** it states no proportion, percentage, remaining time or step count

### Requirement: The statement stands over the whole screen

The statement MUST stand over the whole viewport, in front of everything the application
draws. Its mark MUST sit in the centre of the viewport. What lies behind it MUST be dimmed,
so what a Commander is looking at is the wait rather than the screen under it.

The dimming MUST leave the screen underneath legible enough to be recognised, so a Commander
can still see which screen they are waiting on top of.

Source: 018/FR-002.

#### Scenario: The statement is drawn

- **WHEN** the application states that it is waiting
- **THEN** the statement covers the viewport
- **AND** its mark sits in the centre of the viewport
- **AND** what lies behind it is dimmed

#### Scenario: Another layer is already open

- **WHEN** a navigation starts from a layer the application already has open over a screen
- **THEN** the waiting statement stands in front of that layer as well

### Requirement: The screen behind the statement cannot be used

While the statement stands, the screen behind it MUST NOT be operable: it MUST take no
pointer or touch input, MUST take no focus, and MUST be absent from the accessibility tree.
A second press therefore cannot start a second navigation on top of the one in flight.

The wait MUST NOT be a time limit on anything. Nothing behind the statement expires, is
discarded or is submitted because the wait lasted; the statement is removed by the
navigation ending and by nothing else, and a Commander is asked to do nothing within a
period.

Source: 018/FR-003.

#### Scenario: A control behind the statement is pressed

- **WHEN** a Commander presses where a control was drawn on the screen behind the statement
- **THEN** the control is not activated
- **AND** no second navigation starts

#### Scenario: The screen behind is read by a screen reader

- **WHEN** a Commander reads the application with a screen reader while the statement stands
- **THEN** the screen behind the statement is not reachable
- **AND** the statement is what is read

#### Scenario: The wait is long

- **WHEN** the wait lasts longer than a Commander expected
- **THEN** nothing is discarded, submitted or expired because of it
- **AND** the statement stays until the navigation ends

### Requirement: A navigation that does not wait draws nothing

A navigation whose screen is ready at once MUST draw no waiting statement. The statement
MUST NOT appear before a stated threshold of waiting has passed, so a screen the browser
already holds — one visited before in the session, or one served from the application's own
cache — is replaced without a mark appearing and disappearing in the same moment.

The threshold MUST be one stated value, applied to every navigation.

Source: 018/FR-004.

#### Scenario: The screen's code is already in the browser

- **WHEN** a Commander asks for a screen whose code the browser already holds
- **THEN** no waiting statement is drawn

#### Scenario: The navigation ends inside the threshold

- **WHEN** a navigation ends before the threshold has passed
- **THEN** no waiting statement is drawn

#### Scenario: The navigation is still going at the threshold

- **WHEN** a navigation is still going when the threshold has passed
- **THEN** the waiting statement is drawn

### Requirement: The statement ends with the navigation

The statement MUST be removed when the navigation that raised it ends, whatever the outcome:
the screen opened, the navigation was cancelled or redirected, or the code never arrived. A
statement MUST NEVER outlive the navigation that raised it, and the application MUST NEVER be
left with a screen a Commander cannot use.

Where the code never arrives, the Commander MUST be left on a screen they can use, as the
application's answer to a failed takeover already requires
(`openspec/specs/platform/published-addresses/spec.md`, "A takeover that does not complete").

Source: 018/FR-005.

#### Scenario: The screen opens

- **WHEN** the navigation completes and the screen is presented
- **THEN** the waiting statement is removed

#### Scenario: The navigation is cancelled or redirected

- **WHEN** the navigation is cancelled, or redirected to another address
- **THEN** the waiting statement is removed

#### Scenario: The code never arrives

- **WHEN** the code for the screen cannot be fetched
- **THEN** the waiting statement is removed
- **AND** the Commander is left on a screen they can use

#### Scenario: A second navigation starts before the first ends

- **WHEN** a navigation is replaced by another before it ends
- **THEN** one waiting statement stands, not two
- **AND** it is removed when the navigation that is still going ends

### Requirement: What a reader is told while the application waits

The waiting statement MUST carry text saying that the application is waiting, resolved
through the localisation layer in the reading language. The mark itself MUST be exposed as
decoration and MUST NOT be announced as a picture, so a reader hears the sentence rather
than a description of a graphic.

The text MUST NOT be the application's only statement of the wait for a reader who sees it:
it is carried for every Commander, whether or not it is drawn as visible words.

Source: 018/FR-006.

#### Scenario: A screen reader meets the statement

- **WHEN** a Commander reading with a screen reader asks for a screen that waits
- **THEN** they are told the application is waiting
- **AND** the mark is not announced as a picture

#### Scenario: The reading language is not English

- **WHEN** the application is read in another shipped language
- **THEN** the waiting text is in that language

### Requirement: The mark stops moving where reduced motion is asked for

Where a Commander asks the platform for reduced motion, the waiting mark MUST NOT animate.
It MUST still be drawn and MUST still carry its text, so the statement loses its motion and
keeps its meaning.

This MUST hold everywhere the application draws that mark, not only during a navigation.

Source: 018/FR-007.

#### Scenario: Reduced motion is asked for

- **WHEN** a Commander who asks for reduced motion meets a wait
- **THEN** the mark does not animate
- **AND** the statement is still drawn and still carries its text

#### Scenario: A wait drawn somewhere other than a navigation

- **WHEN** a Commander who asks for reduced motion meets the same mark anywhere else in the
  application
- **THEN** that mark does not animate either

### Requirement: The statement at every form factor

The waiting statement MUST be drawn on desktop, tablet and mobile, in portrait and in
landscape. It MUST introduce no horizontal page scrolling, MUST stay centred and legible at
200% text size and at 400% zoom, and MUST meet the contrast the application's conformance
target requires against the ground it is drawn on.

Source: 018/FR-008.

#### Scenario: Each supported form factor

- **WHEN** a wait is drawn at any supported width and orientation
- **THEN** the statement is centred and complete
- **AND** the page does not scroll horizontally

#### Scenario: Enlarged text and zoom

- **WHEN** a wait is drawn at 200% text size, and at 400% zoom
- **THEN** the statement stays centred and legible
- **AND** nothing it carries is cut off

### Requirement: The statement belongs to a running session

The waiting statement MUST belong to a session that is already running. A generated document
MUST carry none of it, so an address read by something that runs no script is the readable
document and nothing else.

The first presentation of a session MUST NOT be covered by it either: a Commander opening an
address arrives at the document that address serves, and a statement drawn over that first
paint would hide readable content behind a mark.

Source: 018/FR-009.

#### Scenario: A generated document

- **WHEN** an address is read by something that runs no script
- **THEN** the document carries no waiting statement

#### Scenario: A Commander opens an address

- **WHEN** a Commander opens any address the application answers
- **THEN** the first presentation of that session is not covered by a waiting statement

#### Scenario: The Commander then asks for another screen

- **WHEN** that Commander asks for another screen in the same session
- **THEN** the waiting statement answers that navigation as it answers any other
