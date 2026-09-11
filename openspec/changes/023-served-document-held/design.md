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

None. This change introduces no screen and composes nothing from the design system. What a
Commander is left on is the document the build already generated for that address, which
`platform/published-addresses` already holds to the accessibility of a generated first frame
(015/FR-019) and to the first-frame layout requirements. Holding those same nodes adds no surface
to scan and no string to translate. The failure statement over them is the shell's, drawn exactly
as it is today.

## Decisions

### The hold belongs to the takeover

This is the question the issue was opened for, and it is answered against `navigation-waiting`.

That capability owns what is said when a navigation fails, and it says it correctly today. What it
does not own is the document — it has no view of what the address served, and no business
deciding when the application may discard it. The discarding is part of the takeover, and the
takeover is `platform/published-addresses`.

Stating it there also covers more than the one doorway. Any first navigation that fails at a
generated address loses the same content, whatever the reason the chunk did not arrive.

### The served nodes are copied before bootstrap, and the copy is what is put back

The copy is taken in a browser-only application initializer registered before `provideRouter`,
which is the position and the reason `NavigationWaitingStore` already uses: initializers run in the
order they are provided, and the blocking initial navigation starts from one of them. Before that
point the DOM is the served document and nothing has been claimed.

A copy rather than a detachment. Detaching the served nodes would blank the page at the moment the
Commander is reading it, and would leave hydration nothing to adopt when the navigation succeeds,
which is the defect this change is not allowed to cause.

The copy is kept as nodes. Not as a string to be parsed again: a string would be re-interpreted,
and what is put back has to be what the address served rather than a second reading of it.

### The copy is released when a screen is presented

A screen that is presented replaces what the address served, which is what the takeover already
does. The copy is dropped at the router's first `NavigationEnd`, so it is held for the length of
one navigation and no longer. Holding it beyond that would keep a stale rendering of a screen the
Commander has moved past.

Alternative considered: keeping the copy for the session, so any later failure could restore it.
Rejected because it is not what a Commander wants. After they have opened a screen, a failed
navigation leaves them on the screen they are on (018/FR-007), and putting a document they left
behind back over it would take a screen away from them to answer a failure.

### The shell draws the held content where the outlet stands

The frame renders a container in the outlet's place while content is held, and the platform
service that holds the nodes fills it. The shell owns its own structure, so the container is in the
frame's template rather than written into it from outside; the nodes are the service's, because it
is the one that took them.

Nothing about the container claims the content is a screen the application opened. It is what the
address served, standing where it stood.

### Bundled English is what is held, and that is correct

A document is written in bundled English, and the committed locale replaces its text once that
catalogue arrives (015/FR-011). Where the first navigation fails there is no screen, so that
replacement never lands, and the copy matches what the Commander is already looking at. A Commander
reading in German keeps the English document they were served and reads the failure in German,
which is the shell's own text. Nothing is translated twice and nothing is reordered.

### Development has nothing to hold

No document is generated on a development server, so the copy is empty and the Commander is left on
the shell — which is what that address served, and what "An address with no generated document"
(015/FR-015) already says they get. The behaviour is one rule, not two: hold what was served.

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
