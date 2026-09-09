## Why

Every screen the application serves is a separate chunk the browser fetches on the
navigation that first asks for it. Nothing states that fetch. A Commander who presses
`Ship Builder` on the entry point, or a hull in the ship list, is left on the screen they
pressed from, with no answer, for as long as the chunk takes. On a slow connection that is
seconds of a screen that looks unpressed, so the control gets pressed again. A chunk that
never arrives is worse: the press is answered with nothing at all, then and afterwards.

The application already draws a waiting mark, `public/assets/loader.svg`, on a hull
illustration and on a hull schematic while each one is on its way. A navigation is the one
wait that has no answer.

## What Changes

- A navigation that has to fetch its screen's code states that it is waiting. The waiting
  mark stands over the whole viewport, in front of anything else the application has open,
  on a ground that subdues the screen behind without hiding it.
- While the mark stands, the screen behind it cannot be operated, cannot be focused and is
  absent from the accessibility tree, so a second press cannot start a second navigation.
  The mark carries no control: the navigation is already running and ends by itself.
- The mark waits out a 10-millisecond threshold before it appears, so a navigation the
  browser resolves without a request changes the screen with nothing drawn.
- The mark comes down when the navigation ends, whatever the outcome — the screen opened,
  the navigation was cancelled or redirected, or the code never arrived. It never outlives
  the navigation that raised it, and at most one stands at a time.
- A navigation that ends without presenting its screen is stated rather than abandoned. The
  Commander is left on a screen they can use and told that the screen could not be opened,
  in words that stay on the page and are announced as a blocking error.
- A screen reader is told, in the reading language, that the application is waiting. The
  mark itself is decoration and is not announced as a picture.
- The design system gains the overlay as a component with its own state previews. No screen
  draws a waiting state of its own, and no skeleton or placeholder screen is introduced.

The change declares requirements `018/FR-001` to `018/FR-008`:

- **FR-001** A navigation that has to fetch its screen's code states that it is waiting.
- **FR-002** The statement stands over the whole viewport, in front of everything else, and
  subdues what is behind it without hiding it.
- **FR-003** The screen behind it cannot be operated or reached, and the statement offers no
  way to answer it.
- **FR-004** A navigation shorter than the 10-millisecond threshold draws nothing.
- **FR-005** The statement ends with the navigation, whatever the outcome, and at most one
  stands at a time.
- **FR-006** A screen reader is told the application is waiting; the mark is decoration.
- **FR-007** A screen that never arrives is stated, not silently abandoned.
- **FR-008** The statement belongs to a running session, and never covers its first
  presentation.

Two things this change does are not requirements of its own, because a standing requirement
already carries them:

- **The waiting mark stops moving under `prefers-reduced-motion`.** It does not today. The
  page's own rule cannot reach inside an SVG drawn through `<img>`, so the mark keeps
  animating in all three places the application draws it. That is a defect against
  `platform/accessible-responsive-operation`, "Reduced motion" (011/FR-013), and this change
  fixes it in the shared asset rather than restating the obligation.
- **The statement is drawn at every supported width, orientation, text size and zoom, and
  meets the contrast the conformance target requires.** That is the same capability's "Every
  supported size, text size and zoom" (011/FR-011) and "Contrast and target size"
  (011/FR-012), which already cover every surface the application draws.

## Capabilities

### New Capabilities

- `platform/navigation-waiting`: what a Commander is told between asking for a screen and
  getting it. It owns when the wait is stated, what the statement covers, what it takes away
  while it stands, when it comes down, what a reader is told, and what happens when the
  screen never arrives.

### Modified Capabilities

None. No accepted requirement changes. The design system's standing requirements already
govern the new component — it enters the shared library before a capability uses it, previews
each state it supports, and takes every visual value from a token — and the two obligations
named above are standing requirements this change conforms to rather than amends.

## Impact

- `src/app/ui/components/waiting-overlay/` is new: the presentation-only component that
  draws the mark on its ground. It is a native modal `<dialog>`, as the layer component is,
  which is what makes the screen behind it genuinely inert rather than merely covered.
- `src/app/application/navigation/navigation-waiting.store.ts` is new: it reads the router's
  navigation events, holds the threshold, and exposes whether a navigation is waiting and
  whether the last one failed. It renders nothing and is tested without rendering.
- `src/app/app.html` and `src/app/app.ts` mount the overlay beside the frame, where the help
  modal and the update overlay are already mounted, and route the failure into the shell's
  existing status slot and announcement outlet.
- `public/assets/loader.svg` gains a reduced-motion rule inside its own stylesheet. The hull
  illustration and the hull schematic draw the same file and gain the same behaviour.
- `src/styles/tokens/` gains one softer scrim step, because the existing scrim takes the
  screen behind it out of the reading.
- `src/app/ui/previews/preview-manifest.ts` gains the component's state declarations, which
  the interface-foundations policy checker requires of every exported UI component.
- `scripts/check-interface-foundations.mjs` gains the rule that the shared waiting mark
  carries its reduced-motion block, so the fix cannot be undone unnoticed.
- Both message catalogues, `src/app/i18n/locales/en.json` and `de.json`, gain the sentence a
  reader hears while the application waits and the words a failed navigation leaves behind.
- `e2e/coverage-ledger.ts` gains `018-navigation-loading-overlay` in `COVERED_FEATURES` and
  an entry for every requirement id above.
- No route, no address and no build data changes. Nothing is fetched from another origin,
  and the mark is asked for by a relative path, as every other runtime asset is.
