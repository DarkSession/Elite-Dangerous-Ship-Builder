## Context

See `proposal.md` — Why. What shapes the approach is what already exists.

Every route in `src/app/app.routes.ts` is a `loadComponent`, so the router fetches a screen's
code inside the navigation that first asks for it. Nothing observes those navigations today.
`src/app/app.ts` holds the shell state and `src/app/app.html` mounts three things beside the
frame that belong to the session rather than to a screen: the help modal and the two halves
of the update announcement.

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
the host page's styles do not apply inside it.

`src/styles/tokens/` holds one scrim, `--ednb-surface-scrim` at 78% opacity, which is what a
panel dialog is lifted off. It is dark enough to take the screen behind it out of the
reading.

Two policy checkers constrain the work. `scripts/check-interface-foundations.mjs` requires
every component exported from `src/app/ui/components` to declare its states in
`src/app/ui/previews/preview-manifest.ts`. `scripts/check-specification-record.mjs` requires
every requirement id a specification declares to be registered in `e2e/coverage-ledger.ts`,
once the feature is listed in `COVERED_FEATURES`.

## Goals / Non-Goals

**Goals:**

- One answer to a waiting navigation, the same for every address.
- A navigation the browser can serve at once changes the screen with nothing drawn.
- A wait that cannot be pressed through, so one press cannot become two navigations.
- The waiting mark honours reduced motion in all three places the application draws it.

**Non-Goals:**

- No skeleton screens and no placeholder layouts. One overlay answers every navigation, and
  no screen gains a waiting shape of its own.
- No proportion, percentage or remaining time. The application knows none of them.
- No change to any other wait. The hull illustration and the hull schematic keep their own
  local marks, and the deferred layers — the saved builds, the exchange dialogs — are
  unchanged.
- No control on the overlay. There is nothing to cancel: the navigation is already running,
  and the way out is the screen arriving.
- No minimum time the overlay stands for once it is drawn, and no fade in or out.
- No route, address or persisted format changes.

## Screens

No screen is added and no screen changes. One overlay is added, mounted beside the frame in
`src/app/app.html`, where the help modal and the update overlay are already mounted — it
belongs to the session rather than to any screen.

### The waiting overlay

Composes: the new `ednb-waiting-overlay` component from `src/app/ui/components/`, driven by
one signal from `NavigationProgress`.

Draws: the waiting mark from `public/assets/loader.svg`, centred in the viewport, on a ground
carrying the softened scrim token. It carries one visually hidden sentence, resolved through
the localisation layer, which is the overlay's accessible name.

States: standing, and absent. Nothing else. It has no populated, empty, error or disabled
state, because it holds no content of its own and reports nothing.

Requirements: 018/FR-001 to 018/FR-009.

## Decisions

### A native modal `<dialog>`, not a positioned element with a scrim

The overlay must take the screen behind it away from a pointer, from focus and from the
accessibility tree (FR-003). A native modal gives all three at once, puts the overlay in the
top layer so it stands over a layer that is already open (FR-002), and is the mechanism the
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

`NavigationProgress` in `src/app/application/navigation/` subscribes to the router's
navigation events, holds the threshold, and exposes one signal. The component takes an input
and draws. That keeps the behaviour testable without rendering (constitution III), and keeps
the component presentation-only as the design system requires.

### The threshold is 10ms, stated once

A navigation whose code the browser already holds resolves without a network, in the same
task or the one after it. 10ms is longer than that and shorter than anything a Commander
reads as a delay, so a repeat visit changes screen with nothing drawn (FR-004) and a real
fetch is answered as good as immediately.

Considered and rejected: the 150–250ms threshold a fade-in usually takes. It suppresses the
flash equally well, but it also leaves a genuinely slow navigation unanswered for a quarter
of a second, which is the case this change exists for. The owner chose the short threshold.

The value is a named constant in the store, not a design token: it is a decision about
behaviour, not a visual value, and the token layer holds the latter.

### A softened scrim, added to the token layer

The existing scrim at 78% takes the screen behind it out of the reading. The specification
asks for the screen to stay recognisable (FR-002), so the tokens gain one softer step —
a primitive beside `--ednb-palette-scrim` and a semantic name for it. Colour literals live
only in the token layer, so this is where the value goes.

### Reduced motion is fixed inside the mark itself

`public/assets/loader.svg` gains a `@media (prefers-reduced-motion: reduce)` block in its own
`<style>`, stopping its animation. The SVG is a separate document, so this is the only place
a rule can reach it, and fixing it there fixes all three drawings of the mark rather than
this one (FR-007).

Considered and rejected: inlining the mark into the component as markup. It would put a third
copy of the artwork in the repository and leave the hull illustration and the hull schematic
animating under a preference that asked them not to.

### The overlay belongs to a running session

It is mounted under the same browser-only condition the help modal and the update overlay
are, so a generated document carries none of it (FR-009). The store also ignores the
navigation that starts the session, and begins answering once the first navigation has
ended: a mark drawn over the first paint would hide the readable document a Commander was
served (`openspec/specs/platform/published-addresses/spec.md`).

### The sentence is the overlay's accessible name

Opening a modal moves focus into it, and a reader is told what it is by its accessible name.
So the visually hidden sentence is what names the overlay, and the mark stays `alt=""` and
`aria-hidden` — the pattern the hull illustration already uses.

The overlay publishes nothing through `AnnouncementService`. A live-region event as well
would tell a reader the same thing twice for one event, which the feedback contract refuses.

Closing the dialog restores focus by itself, and this component adds nothing to that. The
layer component remembers its invoking control because a dismissed dialog returns a Commander
to the row they opened it from; a navigation replaces the screen that control was on, so
there is nothing to return to.

## Risks / Trade-offs

- **A navigation that never ends leaves the mark standing.** → The store lowers the overlay
  on every terminal navigation event — completed, cancelled, redirected and failed — rather
  than on completion alone, and a unit test covers each. There is no timeout that lowers it
  by itself: a mark that gave up while the fetch was still running would say the wait had
  ended when it had not.
- **A fetch slower than the threshold but faster than a Commander notices still draws the
  mark.** → Accepted. The alternative is a longer threshold, which the owner rejected, and
  the mark appearing for a moment is a smaller cost than a press with no answer.
- **An engine that ignores a media query inside an SVG drawn through `<img>` keeps
  animating.** → The scans cannot judge this; the reduced-motion variant in the component
  previews covers what is drawn, and the manual protocol in `e2e/manual/` is where the mark
  is watched under the platform preference in both engines.
- **The accessibility scan of a screen with the overlay open sees only the overlay**, because
  everything else is inert. → That is the correct reading of that state, and the covered
  state is registered in the ledger as its own surface rather than folded into the screen's.
- **Two modals at once** — the saved builds layer open, then a navigation out of it. → The
  top layer stacks them in the order they were opened, so the mark stands in front. An
  end-to-end journey opens a saved build from the layer and reads which one is in front.

## Migration Plan

None. Nothing is persisted, no address changes, and no stored format is touched. The change
is removable by unmounting the overlay.
