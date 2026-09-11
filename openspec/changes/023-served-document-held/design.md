## Context

See proposal.md — Why, for the defect. What matters here is why the content goes, which is three
decisions working together rather than a fault in any one of them.

`provideClientHydration(withEventReplay())` makes the application adopt the rendered document
rather than replace it. `withEnabledBlockingInitialNavigation()` holds bootstrap until the first
navigation resolves, so the router reaches the outlet with the screen's code already loaded and
adopts the document's copy of the screen instead of drawing its own a frame later. Both exist for
015/FR-009, and `src/app/app.config.ts` records what each was measured to prevent.

They assume the navigation resolves into a screen. Where the screen's chunk never arrives, the
navigation ends in `NavigationError`, bootstrap is released, and the application renders a shell
with an empty outlet. Hydration then removes the served nodes under it, because nothing claimed
them. The document's `main` is emptied by hydration behaving as specified, not by a fault in it.

Hydration is the part that succeeds here. It claims the nodes a screen renders, and where no screen
renders, nothing claims them and they go. The takeover as a whole — the handover from the served
document to a screen the application presents — is what does not complete, which is the sense
015/FR-012 uses and the sense this change keeps.

`NavigationWaitingStore` already watches that error and states the failure. It is the other half
of FR-007 that holds. What is missing is anything that kept the content the statement is supposed
to stand over.

## Goals / Non-Goals

**Goals:**

- A first navigation that ends without presenting a screen, at an address with a generated
  document, leaves the Commander on what that address served. A failure is the case the issue was
  opened for; a cancellation with nothing taking over and a replacement that ends the same way are
  the same case.
- A first navigation that presents a screen is unchanged, to zero pixels.
- Held content is what the address served, not a second rendering of it.

**Non-Goals:**

- Retrying a navigation that failed, or fetching the screen again. The failure is stated and the
  Commander decides what to do next, which is what 018/FR-007 already settles.
- Making held content interactive beyond what the served document already was.
- Changing `platform/navigation-waiting`. Its requirement is right; this change makes it true.
- Changing what the build generates a document for. That is 015/FR-018, "Which addresses get a
  document", and this change reads that set rather than adding to it.

## Screens

No new screen, and nothing new composed from the design system. The application frame draws one
composition no screen inventory has recorded: its `main` holding content the address served, inside
a running application, with the failure statement beside it.

"A takeover that does not complete" (015/FR-012) already reads on this case. Its scenario is "The
bundle is blocked or a chunk never arrives", which is what happens here, and it requires the
Commander to be left with the readable document. The application does not meet it at an address
with a generated document, so this change makes that requirement true as well as 018/FR-007's
second half. `023/FR-001` is not a second answer to the same question: FR-012 states the outcome of
a takeover that fails, and FR-001 states when the application may discard what an address served —
which also governs a navigation that ends without a screen long after bootstrap succeeded.

The composition reaches the three content-bearing screens: the entry point, the hull catalogue
and a
hull's own page. Those three stand at the 50 addresses the build generates a document for — the
root, the catalogue and each of the 48 hulls (015/FR-018, "Which addresses get a document"). It
satisfies `023/FR-001`.

What stands in that state is the generated document's own markup. It is already laid out for its
viewport (015/FR-010), already scanned as a generated first frame (015/FR-019) and already written
in bundled English (015/FR-011), so it adds no composition and no string. What is new is the frame
holding it, and that is not a new state of `app-frame`. 011/FR-004 enumerates five states,
`ComponentState` is closed over those five, `app-frame` already accounts for all of them, and a
`main` with content in it is the frame in a state it is already previewed in. No fixture could
show it in any case: `main` is `<ng-content />` and the catalogue renders each cell through
`NgComponentOutlet` with inputs alone, so no component preview puts anything there. So the
composition is scanned where it stands, in the application rather than in the preview catalogue
(011/FR-022), which is where a composition the application renders belongs. The failure statement
over it is the shell's own, drawn exactly as it is today.

## Decisions

### The hold belongs to the takeover

This is the question the issue was opened for, and it is answered against `navigation-waiting`.

That capability owns what is said when a navigation fails, and it says it correctly today. What it
does not own is the document — it has no view of what the address served, and no business
deciding when the application may discard it. The discarding is part of the takeover, and the
takeover is `platform/published-addresses`.

Stating it there also covers more than the one route in. Any first navigation that fails at a
generated address loses the same content, whatever the reason the chunk did not arrive.

### Putting the copy back is invisible, in one frame

015/FR-009 admits exactly three exceptions and says nothing else may claim one, so the restore
cannot be a removal the Commander sees followed by a return. The copy goes back in the frame's own
render, after the navigation has resolved, and the container is part of that render rather than
something written in from a later pass.

What removes the served nodes is separate from it: Angular clears the views hydration did not claim
from a bootstrap listener once the application is stable. So the restore adds and the cleanup
removes, and neither waits for the other. The reading that holds this is a frame measurement rather
than an argument about order — task 4.3 compares every frame from the last one the document had to
itself, and a page that blanked or moved between them fails it.

This is the same shape the stored catalogue view already has — applied "in the takeover frame
itself rather than a frame later" (015/FR-009a) — and it is why the container is part of the
frame's first render rather than something written in afterwards from an effect. A restore that
waited for a second pass would blank the page.

### The served nodes are copied before the first navigation, and the copy is what is put back

The copy is taken in a browser-only application initialiser registered before `provideRouter`,
which is the position and the reason `NavigationWaitingStore` already uses: initialisers run in the
order they are provided, and the blocking initial navigation starts from one of them. Before that
point the DOM is the served document and nothing has been claimed.

A copy rather than a detachment. Detaching the served nodes would blank the page at the moment the
Commander is reading it, and would leave hydration nothing to adopt when the navigation succeeds,
which is the defect this change is not allowed to cause.

The copy is kept as nodes. Not as a string to be parsed again: a string would be re-interpreted,
and what is put back has to be what the address served rather than a second reading of it.

### The boundary is the first screen presented, not the first navigation

The copy is dropped when a navigation presents a screen, and it is put back whenever a navigation
ends without presenting one. The router's first `NavigationEnd` is the end of the hold; every other
ending leaves the copy standing.

`NavigationEnd` stands for "a screen is presented" because every route in `src/app/app.routes.ts`
carries a component to load, the wildcard included by way of the entry point it redirects to. A
route added later that completes without activating one would end the hold with nothing presented,
which is the requirement's words rather than the implementation's, and is where the two would part.
The requirement is written about the screen so that such a route reads as the defect it would be.

Not "the session's first navigation", which is narrower than the rule and would miss a case. A
first navigation can be cancelled and handed over to a replacement. If the replacement ends without
a screen, no screen has been presented and the Commander is owed what the address served, but the
navigation that ended is not the first one.

No address the build generates a document for reaches that shape today. The routes configure one
redirect, the wildcard to the entry point, and an address the wildcard catches is outside the set
the build generates a document for — the root, the catalogue and the 48 hulls (015/FR-018), and a
hull-shaped address that resolves to no hull is refused a document besides (015/FR-016) — so it
served the shell and holds nothing
(`openspec/specs/platform/tool-navigation/`, "An address the application cannot resolve"). No route
carries a guard either, so a cancellation with nothing taking over has no browser-reachable
instance at such an address. Both shapes are therefore read in the unit sequence rather than in a
lane, which tasks 3.2 and 3.5 say. The rule is still written for them, because a route added later
can reach them and because a rule that named only the reachable shape would be the narrower one
this decision rejects.

Were a generated address ever to redirect, the content standing would be what the first address
served while the address bar carried the second. That is not a defect: the Commander was given that
content, no screen has replaced it, and the address states where the application was going.

That the pair counts once is this change's own rule, stated in `023/FR-001` and nowhere else. The
nearest accepted requirement, 018/FR-005, reaches the same pair for a different purpose — one
waiting statement stands across the two rather than blinking out and back — and says nothing about
what the Commander is left on. The shapes agree, which is why the rule is written this way, but
018/FR-005 does not carry it.

Not `NavigationError` either, which is narrower again. `platform/navigation-waiting` names a third
outcome: a navigation cancelled with nothing taking over, which is a scenario of 018/FR-005, "The
statement ends with the navigation". Nothing is said about that one, because there is nothing to
state. If
the copy went back only on an error, that Commander would be left on an empty shell with no
statement on it, which is worse than either outcome this change is written for. So the rule is
stated once, positively: the hold ends where a screen is presented, and nowhere else.

Alternative considered: keeping the copy for the session, so any later failure could restore it.
Rejected because it is not what a Commander wants. After they have opened a screen, 018/FR-007
leaves them on "a screen they can use", and putting a document they left behind back over it would
take a screen away from them to answer a failure. That it is the screen they are on, rather than any
usable screen, is `023/FR-001`'s own addition.

### The failure statement does not take space above the content

The shell draws its standing notices in a block of their own, above the `main` the outlet sits in.
The failure statement is one of those notices. So on the path this change creates, the statement
arrives in the same render as the held content, above it, and pushes it down the page by the height
of the block. That is content the Commander can see moving position, which 015/FR-009 forbids and
for which it admits exactly three exceptions — none of them this.

Nothing today reads on it: the statement arrives over an empty `main`, so there is nothing to push.
This change is what puts the two in the same frame, so the question arrives with it.

A fourth exception is not available; 015/FR-009 says three exist and nothing else may claim one.
So the content must not move. Two things could achieve that: the space the statement occupies
exists before the statement does, or the statement stands somewhere that does not displace the
content. The first is ruled out here rather than left to the implementation. It means the build
laying out a block for a statement that may never arrive, and 015/FR-010 forbids that: "Composition
that the build cannot know MUST NOT decide the first frame". The build knows neither whether the
takeover will fail nor how tall the statement would be.

So the statement does not take space above the held content. Of the two ways to draw it so, only one
survives measurement.

Out of the flow, over the content, keeps everything still and hides the end of what the Commander is
reading for the life of the page. On an address whose screen fills the window there is no scrolling
that can move it off: the start page's attribution band sits under the statement and stays there. At
400% zoom the statement is nearly half the window. Constitution V asks for the whole of a capability
at 200% text and at 400% zoom, so this is loss of content rather than a cost to weigh.

After the content, in the flow, takes its height out of the box the content stands in wherever
the shell stretched that box — which moves the content by exactly the height of the statement.
On `/` at 1440x900 the attribution band stands 102 pixels above where it was served.

So the statement stays in the flow and the content is put back into the box it was served in. The
frame is handed that box as a measurement of the served document, taken when the copy is taken
and before anything has moved, and stands the container in it. The page is then taller than the
window by the height of the statement, which is the page growing at its end rather than anything
moving.

What that costs is the statement's place: on an address whose screen fills the window it stands
below the fold, and the Commander scrolls to read it. It is on the page to be re-read, which is what
018/FR-007 asks, and the announcement outlet states it as well. The alternative costs content the
Commander was given, and between a sentence they have to scroll to and content they cannot reach at
all, the sentence is the lesser loss.

### The shell draws the held content in the outlet's place

The frame renders a container inside its `main`, where the outlet stands, while content is held.
That is where the copy was taken from, and putting it anywhere else would move it out of the
landmark it was served in (`openspec/specs/platform/accessible-responsive-operation/`, "Landmarks
and heading structure").

The container is in the frame's template rather than written into it from outside, because the
shell owns its own structure. The nodes are the adapter's, because it is the one that took them.

The frame takes them as an input and places them in its own container, rather than the adapter
reaching into the frame's DOM. Nodes handed to a component are state it is handed, which is what
constitution III leaves a component free to render; a platform adapter writing inside another
component's template is what that principle and the design system's presentation-only rule both
refuse. The frame therefore stays the only thing that writes its own structure, and the adapter
stays the only thing that owns the copy.

Nothing about the container claims the content is a screen the application opened, and that stays
here rather than in the requirement. Where a navigation fails, 018/FR-007's statement stands beside
the content and says so. Where one is cancelled, the same requirement says a cancellation is stated
as nothing — so there is no sentence, and nothing a test could read that would distinguish held
content from a screen presented over the same markup. No scenario can test it, so it is recorded
here rather than written into the requirement.

The same applies to delay. Holding costs one copy of one subtree, taken before the first
navigation and painting nothing, so it adds nothing to the shift 015/SC-003 measures from first
paint to interactive, and the capability states no timing threshold anywhere that a requirement
could be written against. What is observable is what the requirement keeps: nothing
visible moves and no frame is emptier than the frame before it.

### Held content stays in bundled English, which 015/FR-011 has to say

A document is written in bundled English, and 015/FR-011 requires the committed locale to replace
its text once that catalogue arrives. Read as it stands, that applies to the held content too: the
application is running and states the failure in German, so the catalogue has arrived. The new
requirement forbids rewriting held content. Two rules in one capability would point opposite ways,
so 015/FR-011 is modified rather than left to be read around.

The replacement cannot be done for held content, and this is the reason rather than an excuse. The
catalogue is applied by rendering the screen in it, and the screen's code is exactly what did not
arrive. Translating the served markup without it would mean writing sentences the application does
not have. Constitution VI carries that: the application keeps no private translation of game text,
and a missing translation falls back to a language the Commander can read rather than being
invented.

So a Commander reading in German keeps the English document they were served, and reads the failure
in German because that sentence is the shell's own. Nothing is reordered and nothing is removed,
which is what FR-011 protects.

The held content states the language it is in. The running application declares its own language on
the document — for a Commander reading in German, German — so English content standing inside it is
a part in another language. No single accepted requirement says that in those words: 011/FR-017
settles which language the application presents in, and "Per-address metadata" (011/FR-027) has the
root language published in the same commit as a description and a canonical "both resolved in the
committed locale". Between them the fact holds, and the reading in task 2.6 asserts the declared
language rather than assuming it. Success criterion 3.1.2 is in scope: the
target is WCAG 2.2 AA except 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11, and 3.1.2
is not among the eight. The
container carries the served document's language, which is a fact the application has rather than
a sentence it writes.

No disclosure is written beside the game names in held content, and 015/FR-011a is modified in the
same delta to say so. Read as it stands it already does: its second scenario is "A document read in
English", whose WHEN is "a document is read in bundled English" and whose THEN is "there is nothing
to disclose, because English is the original", and held content is exactly that. But the same
requirement says the disclosure "MUST NOT be suppressed", and a reader who reaches that sentence
first would find two rules in one file that contradict each other —
the condition this change already refuses to leave standing for 015/FR-011. So the boundary is
written into the requirement rather than left in a design note: the disclosure belongs to a
replacement that lands, and where none lands nothing is suppressed, because each name stands in the
language of the document around it and that document carries its language.

`platform/localisation`, "Game text from the Almanac" (011/FR-020), is not touched. It governs game
text the application requests from the package and shows; for held content the application requests
none. What the Commander is reading is the document the address served, whose disclosure story
`platform/published-addresses` already owns — as it does for the head (011/FR-027).

### A development server serves no document

No document is generated on a development server, so the copy is empty and the Commander is left on
the shell — which is what that address served, and what 018/FR-007's scenario "The first navigation
fails at an address with no generated document" already says they get: "the Commander is left on
the application's own shell rather than on nothing". The behaviour is one rule, not two: hold
what was served.

015/FR-015, "An address with no generated document", is the neighbouring requirement and is not the
one that settles this. It says such an address still works when the navigation succeeds; it says
nothing about one that fails. It is also written for the two bench addresses in a production build,
where the development server has no generated document at any address at all — the same conclusion
over a wider set, which is why the rule is stated as holding what was served rather than as a
second case.

One case worth reading before the rule is built. A returning Commander with no network is answered
by the cached shell at an address the build does generate a document for (015/FR-014, "The
generated document or the cached shell"). If their first navigation then fails because the screen's
chunk is not cached, holding what was served gives them the shell.

018/FR-007 agrees, and the agreement is in the sentence that governs it: "what the Commander is
left on is whatever that address served them". Its scenario keys on the same thing — "the Commander
is left on the readable document that address served" — and a cached shell is both readable and
what was served. What does not anticipate the case is the enumeration in between, "the readable
document where the build generates one, and the application's own shell at an address it does not",
which reads a generated address and a served document as the same thing. 015/FR-014 separates them,
and did so before this change.

So there is nothing here to settle between two capabilities, and this change does not open one. The
rule is stated once, on what the address served, which is what 018/FR-007's governing sentence and
its scenario both key on. The enumeration is the only text that reads otherwise, it is prose rather
than an obligation, and tightening it belongs to `platform/navigation-waiting` on a day that
capability is opened. No task here depends on it, because nothing in this change reads the offline
case.

## Risks / Trade-offs

- **A copy of the document's content is kept in memory until a screen is presented.** → One
  screen's markup, released at the first `NavigationEnd`. Where no screen is ever presented it
  stands for the life of the page, which is the outcome the change is for: it is on screen then,
  not merely held. The document it copies was already in the page when the copy was taken.
- **Held content's controls are not the application's.** → They are the served document's own
  anchors, which carry addresses and navigate by loading them. That is what they did before any
  script ran, and it is what the Commander pressed a moment earlier. The application adds no
  listener to them and claims nothing about them, and `withEventReplay()` is not involved because
  nothing is being adopted.
- **The held copy could be put back over a screen.** → It cannot: it is released at the first
  `NavigationEnd`, and what puts it back is a navigation ending without presenting a screen while
  none has been presented in the session — a failure, a cancellation with nothing taking over, or a
  replacement that ends the same way. Once a screen stands there is nothing left to put back. The
  boundary is stated as a requirement and tested from both sides.
- **The takeover gains work on the path that succeeds.** → One copy of one subtree, taken before
  the navigation starts and dropped when it ends. It paints nothing, so it moves nothing in the
  window 015/SC-003 measures, and that zero-pixel outcome is re-read rather than assumed.
- **Only the production lane can read this.** → It is the only lane with a generated document to
  be left on, which `e2e/prerendered-first-frame.spec.ts` already records. The development lane's
  reading of the same failure stays where it is, in `e2e/navigation-waiting.spec.ts`.

## Migration Plan

None. No stored data, no address format and no catalogue key changes. A Commander gains the
behaviour on their next visit.
