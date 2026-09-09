## Context

See `proposal.md` — Why. What shapes the approach is what already exists.

Every route in `src/app/app.routes.ts` is a `loadComponent`, so the router fetches a screen's
code inside the navigation that first asks for it. Nothing observes those navigations today.
`src/app/app.ts` holds the shell state and `src/app/app.html` mounts three things beside the
frame that belong to the session rather than to a screen: the help modal and the two halves
of the update announcement. The shell also carries one status slot on the application frame,
which the update state uses today to leave a notice on the page beside an announcement.

`src/app/ui/components/layer/layer.ts` is the application's modal. It is a native `<dialog>`
opened with `showModal()`, which is what gives it a real inert background rather than a
covered one, and it draws a titled panel with an optional dismiss control. The update overlay
is that component with no dismiss label — a modal a Commander cannot answer.

`public/assets/loader.svg` is the waiting mark. It carries its own animation in its own
`<style>` block and is drawn through `<img>` by the hull illustration
(`src/app/ui/components/hull-artwork/`) and the hull schematic (`src/app/ui/outfitting/`).
Both draw it with `alt=""` and `aria-hidden`, beside a visually hidden sentence that says what
is happening. That is the established pattern for this mark.

`src/styles/_base.scss` removes nonessential motion under `prefers-reduced-motion: reduce`.
That rule cannot reach the loader: an SVG drawn through `<img>` is a separate document, and
the host page's styles do not apply inside it. The mark therefore animates today under a
preference that asked it not to, which is a defect against
`openspec/specs/platform/accessible-responsive-operation/spec.md`, "Reduced motion"
(011/FR-013).

`src/styles/tokens/` holds one scrim, `--ednb-palette-scrim` at `rgb(6 6 7 / 0.78)`, which is
what a panel dialog is lifted off. It is dark enough to take the screen behind it out of the
reading.

`openspec/specs/platform/application-delivery/spec.md`, "The one time limit the application
carries" (011/FR-025), says applying an update MUST be the application's only time limit, and
that a second one comes from an amendment rather than from a reading of that requirement.

Two policy checkers constrain the work. `scripts/check-interface-foundations.mjs` requires
every component exported from `src/app/ui/components` to declare its states in
`src/app/ui/previews/preview-manifest.ts`, and rejects a colour literal outside the token
sources. `scripts/check-specification-record.mjs` requires every requirement id a
specification declares to be registered in `e2e/coverage-ledger.ts`, once the feature is
listed in `COVERED_FEATURES`.

## Goals / Non-Goals

**Goals:**

- One answer to a waiting navigation, the same for every address.
- A navigation the browser resolves without a request changes the screen with nothing drawn.
- A wait that cannot be pressed through, so one press cannot become two navigations.
- A navigation that fails leaves words behind rather than silence.
- The waiting mark honours reduced motion in all three places the application draws it.

**Non-Goals:**

- No skeleton screens and no placeholder layouts. One overlay answers every navigation, and
  no screen gains a waiting shape of its own.
- No proportion, percentage or remaining time. The application knows none of them.
- No new answer for any other wait. The hull illustration and the hull schematic keep their
  own local marks, their own markup and their own sentences — they gain the reduced-motion
  fix in the shared asset and nothing else — and the deferred layers (the saved builds, the
  exchange dialogs) are unchanged.
- No control on the overlay, and no timer that takes it down. See the two decisions below.
- No minimum time the overlay stands for once it is drawn, and no fade in or out.
- No route, address or persisted format changes.

## Screens

No screen is added and no screen changes shape. One overlay is added, and the shell's
existing status slot gains a second thing it can carry.

### The waiting overlay

Composes: the new `ednb-waiting-overlay` component from `src/app/ui/components/`, mounted in
`src/app/app.html` beside the frame — where the help modal and the update overlay already
are, because it belongs to the session rather than to any screen — and driven by one signal
from `NavigationWaiting`.

Draws: the waiting mark from `public/assets/loader.svg`, centred in the viewport, on a ground
carrying the softened scrim token. It carries one visually hidden sentence, resolved through
the localisation layer, which is the overlay's accessible name.

States: standing, and absent.

Requirements: 018/FR-001, FR-002, FR-003, FR-004, FR-005, FR-006.

### The shell's status slot

Composes: the status the application frame already draws, and the announcement outlet beside
it.

Draws: after a navigation that ended without presenting its screen, an error-toned notice
saying the screen could not be opened, on the screen the Commander is on. It is taken down by
the next navigation that succeeds.

The slot takes a list rather than one notice, so a version notice and a failed navigation
stand together rather than replacing each other. Both have to stay readable: the version
notice sits beside the control that acts on it, and the failure is the only answer a
Commander has to a press that produced nothing. The version notice is first in reading
order — it is about the whole session, where the failure is about one press.

Requirements: 018/FR-007.

### Neither of them, in a generated document, and no overlay over a session's first frame

The overlay and the notice are mounted under the browser-only condition the help modal is
mounted under, so a document generated by the build carries neither. In a browser, the store
suppresses the waiting signal until one navigation has ended, so the overlay cannot cover the
first presentation of a session — which "Content in the first frame" (015/FR-008) and "An
invisible takeover" (015/FR-009) both forbid, the second naming the only three exceptions
there are.

Requirements: 018/FR-008.

## Decisions

### A native modal `<dialog>`, not a positioned element with a scrim

The overlay must take the screen behind it away from a pointer, from focus and from the
accessibility tree (FR-003). A native modal gives all three at once, puts the overlay in the
top layer so it stands over a surface that is already open (FR-002), and is the mechanism the
application's own modal already uses.

Considered and rejected: a fixed-position element with `inert` set on the frame. It is more
code for the same result, and it does not stack above an open `<dialog>` — a navigation
started from the saved builds layer would draw the mark behind that layer.

### A new component rather than a mode on the existing layer

`Layer` requires a title and draws a title bar; its width and presentation inputs are about
a panel of content. A waiting overlay has no title bar, no panel and no controls.

Considered and rejected: a fourth presentation on `Layer`. It would add a mode in which most
of that component's inputs mean nothing, to a component whose every present mode is a titled
panel.

### The router is read in a store, not in the component

`NavigationWaiting` in `src/app/application/navigation/` subscribes to the router's
navigation events, holds the threshold, and exposes two signals: whether a navigation is
waiting, and whether the last one failed.

It is also where the session's first presentation is protected. The browser-only mount keeps
the overlay out of a generated document, but in a browser the first navigation is a
navigation like any other, so the store suppresses the waiting signal until one navigation
has ended. It suppresses that signal only: a first navigation that fails is stated like any
other, which is what FR-007 requires and what "A takeover that does not complete"
(015/FR-012) already expects a Commander to be left with. The component takes
an input and draws. That keeps the behaviour testable without rendering (constitution III)
and the component presentation-only, as the design system requires.

### The threshold is 10ms, and it is in the specification

A navigation whose code the browser already holds resolves without a request, in the same
task or the one after it. 10ms is longer than that and shorter than anything a Commander
reads as a delay.

It is stated in the capability specification rather than only here, because a scenario that
says "inside the threshold" and never says what the threshold is cannot be driven once this
change is archived and the specification is all that remains.

Considered and rejected: the 150–250ms threshold a fade-in usually takes. It suppresses a
brief mark equally well, but it also leaves a genuinely slow navigation unanswered for a
quarter of a second, which is the case this change exists for. The owner chose the short
threshold.

**The trade-off it carries.** A navigation that ends at, say, 30ms — a chunk read from the
application's own cache on a slow device — draws the mark and removes it a frame or two
later. There is no minimum standing time to smooth that, because a floor would keep the mark
up after the screen was ready, which is a statement that is no longer true. The owner
accepted the brief mark over the quarter-second silence.

### A softened scrim, added to the token layer

The existing scrim at 78% takes the screen behind it out of the reading, and FR-002 asks for
a ground the screen stays visible through. The tokens gain one softer step at
`rgb(6 6 7 / 0.55)` — the same near-black the existing scrim is mixed from, at an opacity a
little over the midpoint between it and clear glass, which is the step the owner asked for as
"a light black layer". Colour literals live only in the token layer, so the primitive goes
beside `--ednb-palette-scrim` and the semantic name beside `--ednb-surface-scrim`.

Two different things judge it. What a journey can measure is that the ground is translucent
rather than opaque, which is what FR-002 states and what the scan-level assertion reads off
the computed value. Whether 55% is the right step for a Commander is a visual judgment, and
it is settled the way the reference readings in `e2e/manual/` settle the others.

### Reduced motion is fixed inside the mark itself

`public/assets/loader.svg` gains a `@media (prefers-reduced-motion: reduce)` block in its own
`<style>`, stopping its animation. The SVG is a separate document, so this is the only place
a rule can reach it, and fixing it there fixes all three drawings of the mark rather than
this one.

This sets no visual value and so claims no exception to constitution VII: the block declares
no duration, no colour and no easing — it removes an animation. The mark's own animation is
artwork inside an asset, as its shapes and its amber are, and the token layer governs the
application's styles rather than the contents of a drawing. Nothing about the mark's motion
is duplicated in the stylesheets.

What the block does have is no checker that can see it, because the literal rule reads the
stylesheets. A rule of its own in `scripts/check-interface-foundations.mjs` holds it, so it
cannot be dropped unnoticed.

Considered and rejected: inlining the mark into the component as markup. It would put a third
copy of the artwork in the repository and leave the hull illustration and the hull schematic
animating under a preference that asked them not to.

### The waiting statement stands down for the restart announcement

The text that precedes a restart is required to be visible while it stands (011/FR-025), and
the page under it is inert. A waiting statement drawn on top of it would hide required text;
drawn under it, it would be a mark nobody can see. So while that announcement stands, no
waiting statement is drawn at all.

It costs nothing: the restart replaces the page, so a navigation running underneath it is not
going to finish anyway.

Considered and rejected: relying on the order the two enter the top layer. That order is
whichever opened last, so a navigation started a moment after the announcement would put the
mark in front of it.

### No timer takes the overlay down

The overlay is removed by the navigation ending and by nothing else. A ceiling that lowered
it after some period would be a second time limit in an application whose specification says
applying an update is its only one (011/FR-025) — and it would be a dishonest one, saying the
wait had ended while the fetch was still running.

What bounds a stalled fetch is the platform: a request that never answers is ended by the
browser's own network handling, which surfaces as a failed navigation, and that is the
ending FR-007 states to the Commander. See the risk below.

### A failed navigation is stated on the page, not only announced

FR-007 asks for both, and the shell already has both: the status slot the update state uses,
and the announcement outlet beside it. Reusing them keeps one shape for "something the
session needs to tell you", and answers 011/FR-009 with the same mechanism that answers it
elsewhere. The slot is widened from one notice to a list so the two cannot displace each
other.

The announcement is the polite one, not the interrupting one. 011/FR-009 reserves prompt
interruption for a blocking error, and nothing here is blocked: the overlay is already gone,
the Commander has a screen they can use, and what failed was one press.

The words say the screen could not be opened and say nothing about why. The router reports a
failed navigation, not a diagnosis, and constitution IV refuses a reason the application does
not have.

### The sentence is the overlay's accessible name, and the mark stays decoration

Opening a modal moves focus into it, and a reader is told what it is by its accessible name.
So the visually hidden sentence is what names the overlay, and the mark stays `alt=""` and
`aria-hidden` — the pattern the hull illustration already uses. This is the platform's own
behaviour for a modal rather than a keyboard-operation obligation, so it does not rest on any
of the eight criteria the constitution excludes.

The overlay publishes nothing through `AnnouncementService`. A live-region event as well
would tell a reader the same thing twice for one event. Whether a reader is in fact told is a
judgment no scan can make: it is settled in `e2e/manual/screen-reader.protocol.md`, as the
update announcement's own exposure is, and a reader disagreeing there sends this decision
back.

The sentence is not drawn as visible words. The overlay is the mark on its ground, which is
what the owner asked for.

The requirement that bears on this is `platform/accessible-responsive-operation`, "Text
equivalents for visual information" (011/FR-010): meaning may not depend on colour, shape,
position or motion, and every visual information carrier must have a text equivalent. The
mark is a visual carrier of one meaning — the application is working — and the sentence is
its text equivalent, carried for every Commander whether or not it is drawn. A text
equivalent is not the same as visible words; the hull illustration answers the same
requirement the same way, with `alt=""` on the mark and the sentence beside it.

What does not depend on the mark is that something is happening at all: the screen is covered
and subdued, and that is true with the animation stopped. Whether a still mark on a subdued
screen reads as a wait is a judgment no scan can make, and it is one of the things the manual
reading in the task list settles.

Closing the dialog restores focus by itself, and this component adds nothing to that. The
layer component remembers its invoking control because a dismissed dialog returns a Commander
to the row they opened it from; a navigation replaces the screen that control was on, so
there is nothing to return to.

### The overlay adds no row to the release coverage ledger

`platform/help-and-licences`, "The frame's Help action is the only route" (012/FR-011), has
release validation enumerate every capability, package-backed surface and state that obscures
the application frame, and record for each whether the Help action is reachable in it — or,
for a dismissible layer, that help is reached from the capability beneath once it is
dismissed. The waiting overlay obscures the frame and is not dismissible, so it fits neither
branch.

It is not one of the states that ledger enumerates. Every row there is somewhere a Commander
is: a screen they are on, or a layer they opened and stay in until they answer it. The
waiting statement is neither. Nobody arrives in it, nothing is done in it, and it is gone by
the time a Commander could go looking for help — the navigation ending is what removes it,
and no Commander action can hold it there.

The application already carries a state of exactly this kind and enumerates it nowhere: the
overlay that stands while a published version restarts the page, which obscures the frame,
offers no dismissal, and is absent from the Release coverage ledger in
`openspec/changes/archive/012-help-and-licences/design/screen-inventory.md`. This change
follows that reading rather than inventing a third frame-entry value.

If release validation reads it the other way, the answer is a row in that ledger and a third
branch in 012/FR-011 — a delta on `platform/help-and-licences`, not a note here. This
decision is where that question is on the record.

### Which of the five component states the overlay supports

`populated` — the standing overlay. `empty` — the closed overlay, which draws nothing and
holds no focus. The other three cannot exist and say so in the manifest: the overlay holds no
content of its own, so it has no `loading` state distinct from standing, nothing it reports
that could be an `error`, and no control that could be `disabled`. The design system asks for
each supported state to be previewed and each unsupported one to carry a machine-readable
reason, which is what those three get.

## Risks / Trade-offs

- **A fetch that stalls without answering leaves the mark standing.** → No application timer
  lowers it, for the reason above; what ends it is the browser ending the request, which
  arrives as a failed navigation and is stated by FR-007. The exposure is the window between
  a stall and the platform giving up, during which the application is inert. Accepted, and
  named here rather than mitigated with a second time limit. If it proves real in use, the
  answer is an amendment to the time-limit requirement, not a reading of it.
- **A navigation that ends just past the threshold shows the mark briefly.** → Accepted; see
  the threshold decision.
- **An engine that ignores a media query inside an SVG drawn through `<img>` keeps
  animating.** → No automated check can judge this: the preview variant renders the mark
  under the preference but cannot assert that it stopped. The policy rule asserts the block
  is in the asset; the manual protocol in `e2e/manual/` is where the mark is watched in both
  engines, and its record is the evidence.
- **The accessibility scan of a screen with the overlay open sees only the overlay**, because
  everything else is inert. → That is the correct reading of that state, and the covered
  state is registered in the ledger as its own surface rather than folded into the screen's.
- **Two modals at once** — the saved builds layer open, then a navigation out of it. → The
  top layer stacks them in the order they were opened, so the mark stands in front. An
  end-to-end journey opens a saved build from the layer and reads which one is in front.
- **The failure notice and a version notice want the same slot.** → The slot carries a list,
  so both stand. Widening it touches a component the whole shell draws, so the existing
  status assertions are re-run against a slot given one notice and a slot given two.

## Migration Plan

None. Nothing is persisted, no address changes, and no stored format is touched. The change
is removable by unmounting the overlay and the notice.
