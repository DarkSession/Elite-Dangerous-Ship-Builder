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
served, inside a running application, with the failure statement over it. It is not "A takeover
that does not complete" (015/FR-012), which is the opposite case — there the application never
runs.

The state reaches the three content-bearing screens, which are the addresses the build generates a
document for (015/FR-018, "Which addresses get a document"): the start page, the hull catalogue
and a hull's own page. It satisfies `023/FR-001`.

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

The copy is dropped when a navigation presents a screen, and it is put back whenever one fails
before that has happened. The router's first `NavigationEnd` is the end of the hold; a
`NavigationError` before it is what puts the copy back.

Not "the session's first navigation", which is narrower than the rule and would miss a case. A
first navigation can be cancelled and handed over to a replacement — a redirect, or an address
that resolves elsewhere and lands at the entry point
(`openspec/specs/platform/tool-navigation/`, "An address the application cannot resolve") — and
018/FR-005 treats the pair as one presentation. If the replacement fails, no screen has been
presented and the Commander is owed what the address served, but the navigation that failed is not
the first one. Counting screens rather than navigations covers that without a second rule.

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
not have, which constitution IV forbids.

So a Commander reading in German keeps the English document they were served, and reads the failure
in German because that sentence is the shell's own. Nothing is reordered and nothing is removed,
which is what FR-011 protects.

Alternative considered: telling them the content is in English, the way 015/FR-011a discloses an
untranslated game name. Rejected because a document is served in bundled English to every
Commander by design, and this one has been reading it since before any script ran. FR-011a covers
names inside a replacement that lands; here none lands, and a note about it would be a new sentence
in a change that adds no words.

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
