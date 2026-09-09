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
- The mark comes down when the navigation is over — the screen opened, the code never
  arrived, or the navigation was cancelled with nothing taking over. Where the cancellation
  is a handover, to a navigation replacing it or to an address the router answers without
  navigating, the mark passes to what takes over rather than coming down and being drawn
  again. It never outlives what raised it, and at most one stands at a time.
- The mark is not drawn at all while the application is telling a Commander that the page is
  about to be replaced by a newer version. That text has to stay visible, and a navigation
  running under a restart is not going to finish.
- A navigation that fails is stated rather than abandoned. The Commander is left on a screen
  they can use and told that the screen could not be opened, in words that stay on the page
  and are announced once without interrupting a reader. A navigation that is cancelled, or
  sent to another address, states nothing: only an error is a failure.
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
- **FR-005** The statement ends with the navigation it followed, passing to whatever takes
  that navigation over, and at most one stands at a time.
- **FR-006** A screen reader is told the application is waiting; the mark is decoration.
- **FR-007** A navigation that fails is stated, not silently abandoned; a cancelled or
  redirected one is not a failure.
- **FR-008** The statement belongs to a running session, and never covers its first
  presentation.

Three things this change does are not requirements of its own, because a standing requirement
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
- **Both new strings resolve through the localisation layer and are shipped in every
  language.** That is `platform/localisation` (011/FR-016, 011/FR-017, 011/FR-019), which
  already covers every string the application owns.

## Capabilities

### New Capabilities

- `platform/navigation-waiting`: what a Commander is told between asking for a screen and
  getting it. It owns when the wait is stated, what the statement covers, what it takes away
  while it stands, when it comes down, what a reader is told, and what happens when the
  screen never arrives.

### Modified Capabilities

- `platform/accessible-responsive-operation`: "Announcement of errors and changes"
  (011/FR-009) gains what it did not say. Two separate events announced in identical words
  must each reach a reader: a live region announces a change to what it holds, and the same
  sentence written over itself is not a change, so the second of two screens that could not
  be opened was silence. A republished event is still one event and stays silent. It is
  amended here rather than elsewhere because this is the first capability to state the same
  thing twice, and the fix belongs to the policy rather than to one feature.

The design system's standing requirements already govern the new component — it enters the
shared library before a capability uses it, previews each state it supports, and takes every
visual value from a token — and the three obligations named above are standing requirements
this change conforms to rather than amends.

## Impact

- `src/app/ui/components/waiting-overlay/` is new: the presentation-only component that
  draws the mark on its ground. It is a native modal `<dialog>`, as the layer component is,
  which is what makes the screen behind it genuinely inert rather than merely covered.
- `src/app/application/navigation/navigation-waiting.store.ts` is new: it reads the router's
  navigation events, holds the threshold, and exposes whether a navigation is waiting,
  whether the last one failed, and how many have failed, which is what makes a second
  failure a second event rather than a repeat of the first. It renders nothing and is tested
  without rendering.
- `src/app/app.html` and `src/app/app.ts` mount the overlay beside the frame, where the help
  modal and the update overlay are already mounted, and route the failure into the shell's
  status slot and announcement outlet.
- `src/app/ui/announcements/` carries the event's identity to the outlet beside its words,
  and each live region renders what it holds keyed by that identity. Every capability that
  announces is subject to this; nothing about what any of them publishes changes, and the
  outlets' text reads as it did.
- `src/app/ui/components/app-frame/` — the frame every screen is drawn inside — takes a list
  of status notices where it took one, so a version notice and a failed navigation stand
  together rather than replacing each other. Nothing else about the frame changes, and its
  preview declarations gain the two-notice state.
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
- `e2e/navigation-waiting.spec.ts` is new — the journeys over a held chunk, an aborted one, a
  redirect and the stacked case — and the accessibility, zoom and served-document suites gain
  readings of the two new states. `e2e/manual/screen-reader.protocol.md` gains the readings no
  scan can judge, and `e2e/manual/results/` gains their records.
- `e2e/coverage-ledger.ts` gains `018-navigation-loading-overlay` in `COVERED_FEATURES` and
  an entry for every requirement id above. Its release coverage ledger for the Help route
  gains no row: `design.md` records why, and the answer if release validation reads it the
  other way.
- No route, no address and no build data changes. Nothing is fetched from another origin,
  and the mark is asked for by a relative path, as every other runtime asset is.
