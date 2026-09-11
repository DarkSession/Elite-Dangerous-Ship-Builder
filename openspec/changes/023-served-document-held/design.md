## Context

See proposal.md — Why, for the defect. What matters here is why the content goes, which is three
decisions working together rather than a fault in any one of them.

`provideClientHydration(withEventReplay())` makes the application adopt the rendered document
rather than replace it. `withEnabledBlockingInitialNavigation()` holds bootstrap until the first
navigation resolves, so the router reaches the outlet with the screen's code already in hand and
adopts the document's copy of the screen instead of drawing its own a frame later. Both exist for
015/FR-009, and `src/app/app.config.ts` records what each was measured to prevent.

They assume the navigation resolves into a screen. Where the screen's chunk never arrives, the
navigation ends in `NavigationError`, bootstrap is released, and the application renders a shell
with an empty outlet. Hydration then removes the served nodes under it, because nothing claimed
them. The document's `main` is emptied by the takeover succeeding, not by it failing.

`NavigationWaitingStore` already watches that error and states the failure. It is the other half
of FR-007 that holds. What is missing is anything that kept the content the statement is supposed
to stand over.

## Goals / Non-Goals

**Goals:**

- A first navigation that fails at an address with a generated document leaves the Commander on
  what that address served.
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

No new screen, and nothing new composed from the design system. The application frame gains one
state, and it is a state no screen inventory has recorded: its `main` holding content the address
served, inside a running application, with the failure statement over it.

"A takeover that does not complete" (015/FR-012) already reads on this case. Its scenario is "The
bundle is blocked or a chunk never arrives", which is what happens here, and it requires the
Commander to be left with the readable document. The application does not meet it at an address
with a generated document, so this change makes that requirement true as well as 018/FR-007's
second half. `023/FR-001` is not a second answer to the same question: FR-012 states the outcome of
a takeover that fails, and FR-001 states when the application may discard what an address served —
which also governs a navigation that ends without a screen long after bootstrap succeeded.

The state reaches the three content-bearing screens: the start page, the hull catalogue and a
hull's own page. Those three stand at the 50 addresses the build generates a document for — the
root, the catalogue and each of the 48 hulls (015/FR-018, "Which addresses get a document"). It
satisfies `023/FR-001`.

What stands in that state is the generated document's own markup. It is already laid out for its
viewport (015/FR-010), already scanned as a generated first frame (015/FR-019) and already written
in bundled English (015/FR-011), so it adds no composition and no string. What is new is the frame
holding it, and that is a supported state of `app-frame` like any other: it takes a preview
fixture at desktop, tablet and mobile widths (011/FR-004), and it is scanned where it stands
(011/FR-022). The failure statement over it is the shell's own, drawn exactly as it is today.

## Decisions

### The hold belongs to the takeover

This is the question the issue was opened for, and it is answered against `navigation-waiting`.

That capability owns what is said when a navigation fails, and it says it correctly today. What it
does not own is the document — it has no view of what the address served, and no business
deciding when the application may discard it. The discarding is part of the takeover, and the
takeover is `platform/published-addresses`.

Stating it there also covers more than the one doorway. Any first navigation that fails at a
generated address loses the same content, whatever the reason the chunk did not arrive.

### Putting the copy back is invisible, in one frame

015/FR-009 admits exactly three exceptions and says nothing else may claim one, so the restore
cannot be a removal the Commander sees followed by a return. The copy goes back in the render that
removes the served nodes: the application renders once, after the navigation has resolved, and the
frame draws the held container in that same render. Nothing is painted between the two.

This is the same shape the stored catalogue view already has — applied "in the takeover frame
itself rather than a frame later" (015/FR-009a) — and it is why the container is part of the
frame's first render rather than something written in afterwards from an effect. A restore that
waited for a second pass would be the blank this feature exists to prevent.

### The served nodes are copied before bootstrap, and the copy is what is put back

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

Not "the session's first navigation", which is narrower than the rule and would miss a case. A
first navigation can be cancelled and handed over to a replacement — a redirect, or an address
that resolves elsewhere and lands at the entry point
(`openspec/specs/platform/tool-navigation/`, "An address the application cannot resolve"). If the
replacement ends without a screen, no screen has been presented and the Commander is owed what the
address served, but the navigation that ended is not the first one.

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
Rejected because it is not what a Commander wants. After they have opened a screen, a failed
navigation leaves them on the screen they are on (018/FR-007), and putting a document they left
behind back over it would take a screen away from them to answer a failure.

### The shell draws the held content in the outlet's place

The frame renders a container inside its `main`, where the outlet stands, while content is held.
That is where the copy was taken from, and putting it anywhere else would move it out of the
landmark it was served in (`openspec/specs/platform/accessible-responsive-operation/`, "Landmarks
and heading structure").

The container is in the frame's template rather than written into it from outside, because the
shell owns its own structure. The nodes are the adapter's, because it is the one that took them.
Nothing about the container claims the content is a screen the application opened.

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

The held content states the language it is in. The running application publishes the committed
locale as the root language (011/FR-027), so English content standing inside it is a part in
another language, and WCAG 2.2 AA 3.1.2 is in scope — constitution V excludes eight success
criteria and that is not among them. The container carries the served document's language, which
is a fact the application has rather than a sentence it writes.

No disclosure is written beside the game names in held content, and 015/FR-011a is modified in the
same delta to say so. Read as it stands it already does: its second scenario is "A document read in
bundled English", where "there is nothing to disclose, because English is the original", and held
content is exactly that. But the same requirement says the disclosure "MUST NOT be suppressed", and
a reader who reaches that sentence first would find two rules in one file pointing opposite ways —
the condition this change already refuses to leave standing for 015/FR-011. So the boundary is
written into the requirement rather than left in a design note: the disclosure belongs to a
replacement that lands, and where none lands nothing is suppressed, because each name stands in the
language of the document around it and that document carries its language.

`platform/localisation`, "Game text from the Almanac" (011/FR-020), is not touched. It governs game
text the application requests from the package and shows; for held content the application requests
none. What the Commander is reading is the document the address served, whose disclosure story
`platform/published-addresses` already owns — as it does for the head (011/FR-027).

### Development has nothing to hold

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

## Risks / Trade-offs

- **A copy of the document's content is kept in memory for the length of one navigation.** → One
  screen's markup, released at the first `NavigationEnd`. The document it copies was already in the
  page when the copy was taken.
- **Held content's controls are not the application's.** → They are the served document's own
  anchors, which carry addresses and navigate by loading them. That is what they did before any
  script ran, and it is what the Commander pressed a moment earlier. The application adds no
  listener to them and claims nothing about them, and `withEventReplay()` is not involved because
  nothing is being adopted.
- **The held copy could be put back over a screen.** → It cannot: it is released at the first
  `NavigationEnd`, and the only thing that puts it back is the failure of the navigation it was
  taken for. The boundary is stated as a requirement and tested from both sides.
- **The takeover gains work on the path that succeeds.** → One copy of one subtree, taken before
  the navigation starts and dropped when it ends. It runs before bootstrap rather than inside the
  measured window, and 015/SC-003's zero-pixel outcome is re-read rather than assumed.
- **Only the production lane can read this.** → It is the only lane with a generated document to
  be left on, which `e2e/prerendered-first-frame.spec.ts` already records. The development lane's
  reading of the same failure stays where it is, in `e2e/navigation-waiting.spec.ts`.

## Migration Plan

None. No stored data, no address format and no catalogue key changes. A Commander gains the
behaviour on their next visit.
