## Purpose

What a Commander is told between asking for a screen and getting it. Every screen the
application serves arrives as its own code, fetched on the navigation that first asks for
it, and this capability owns the answer while that fetch is in flight: that the application
is working, that the screen underneath is not to be pressed, and what happens when the
screen never arrives.

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

### Requirement: The statement is what the Commander is looking at

The statement MUST stand over the whole viewport and in front of everything else the
application has open, including a surface the application had already opened over a screen.
What lies behind it MUST be subdued, so what a Commander is looking at is the wait rather
than the screen under it, and MUST stay recognisable, so a Commander can still see which
screen they are waiting on top of.

Source: 018/FR-002.

#### Scenario: The statement is drawn

- **WHEN** the application states that it is waiting
- **THEN** the statement covers the viewport
- **AND** what lies behind it is subdued and still recognisable

#### Scenario: Something is already open over a screen

- **WHEN** a navigation starts from a surface the application already has open over a screen
- **THEN** the waiting statement stands in front of that surface as well

### Requirement: The screen behind the statement cannot be used

While the statement stands, the screen behind it MUST NOT be operable: it MUST take no
pointer or touch input, MUST take no focus, and MUST be absent from the accessibility tree.
A second press therefore cannot start a second navigation on top of the one in flight.

The statement MUST offer no way to answer it. There is nothing to answer: the navigation is
already running, and the way out is the navigation ending.

Source: 018/FR-003.

#### Scenario: A control behind the statement is pressed

- **WHEN** a Commander presses where a control was drawn on the screen behind the statement
- **THEN** the control is not activated
- **AND** no second navigation starts

#### Scenario: The screen behind is read by a screen reader

- **WHEN** a Commander reads the application with a screen reader while the statement stands
- **THEN** the screen behind the statement is not reachable
- **AND** the statement is what is read

#### Scenario: A Commander looks for a way out

- **WHEN** the waiting statement stands
- **THEN** it carries no control to dismiss, cancel or answer it

### Requirement: A navigation shorter than the threshold draws nothing

The statement MUST NOT appear until the navigation has been running for the threshold, so a
navigation the browser resolves without a request changes the screen with nothing drawn.

The threshold MUST be 10 milliseconds, and the same threshold MUST apply to every
navigation. It is stated here so a scenario can be driven against it.

Source: 018/FR-004.

#### Scenario: The navigation ends inside the threshold

- **WHEN** a navigation ends before it has been running for 10 milliseconds
- **THEN** no waiting statement is drawn

#### Scenario: The navigation is still going at the threshold

- **WHEN** a navigation has been running for 10 milliseconds and has not ended
- **THEN** the waiting statement is drawn

#### Scenario: A second navigation is measured the same way

- **WHEN** any later navigation runs
- **THEN** the same threshold decides whether the statement is drawn

### Requirement: The statement ends with the navigation

The statement MUST be removed when the navigation that raised it ends, whatever the outcome:
the screen opened, the navigation was cancelled or redirected, or the code never arrived. A
statement MUST NEVER outlive the navigation that raised it.

Where several navigations follow one another, at most one statement MUST stand at a time,
and it MUST be removed by the navigation that is still going rather than by the one it
replaced.

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

#### Scenario: A second navigation starts before the first ends

- **WHEN** a navigation is replaced by another before it ends
- **THEN** one waiting statement stands, not two
- **AND** it is removed when the navigation that is still going ends

### Requirement: What a reader is told while the application waits

The waiting statement MUST carry text saying that the application is waiting, resolved
through the localisation layer in the reading language, and that text MUST be what names the
statement to a screen reader. Any mark drawn beside the text MUST be exposed as decoration,
so a reader hears the sentence rather than a description of a graphic.

Source: 018/FR-006.

#### Scenario: A screen reader meets the statement

- **WHEN** a Commander reading with a screen reader asks for a screen that waits
- **THEN** they are told the application is waiting
- **AND** no mark is announced as a picture

#### Scenario: The reading language is not English

- **WHEN** the application is read in another shipped language
- **THEN** the waiting text is in that language

### Requirement: A screen that never arrives is stated, not silently abandoned

Where a navigation ends without presenting its screen — the code could not be fetched, or the
navigation failed for any other reason — the application MUST state that the screen could not
be opened, and MUST leave the Commander on a screen they can use. It MUST NOT return them to
the screen they pressed from with no answer, which is the unpressed-looking control the
waiting statement exists to remove.

The statement of the failure MUST stay on the page to be re-read, and MUST be announced as a
blocking error is announced (`openspec/specs/platform/accessible-responsive-operation/`,
"Announcement of errors and changes"). It MUST NOT fabricate a reason it does not have.

Source: 018/FR-007.

#### Scenario: The code for a screen cannot be fetched

- **WHEN** the code for the screen a Commander asked for cannot be fetched
- **THEN** the application states that the screen could not be opened
- **AND** the Commander is left on a screen they can use

#### Scenario: The Commander reads the failure with a screen reader

- **WHEN** the failure is stated
- **THEN** it is announced promptly
- **AND** the same words stay on the page to be re-read

#### Scenario: The application does not know why

- **WHEN** the application has no reason for the failure
- **THEN** it states that the screen could not be opened and states no reason it does not have

### Requirement: The statement belongs to a running session

The waiting statement MUST belong to a session that is already running. An address read by
something that runs no script MUST carry none of it.

The first presentation of a session MUST NOT be covered by it either: a Commander opening an
address arrives at what that address serves, and a statement drawn over that first
presentation would hide readable content behind a mark
(`openspec/specs/platform/published-addresses/`, "The generated document or the cached
shell").

Source: 018/FR-008.

#### Scenario: An address read by something that runs no script

- **WHEN** an address is read by something that runs no script
- **THEN** what is served carries no waiting statement

#### Scenario: A Commander opens an address

- **WHEN** a Commander opens any address the application answers
- **THEN** the first presentation of that session is not covered by a waiting statement

#### Scenario: The Commander then asks for another screen

- **WHEN** that Commander asks for another screen in the same session
- **THEN** the waiting statement answers that navigation as it answers any other
