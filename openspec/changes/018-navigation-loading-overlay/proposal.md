## Why

Every screen the application serves is a separate chunk the browser fetches on the
navigation that first asks for it. Nothing states that fetch. A Commander who presses
`Ship Builder` on the entry point, or a hull in the ship list, is left on the screen they
pressed from, with no answer, for as long as the chunk takes. On a slow connection that is
seconds of a screen that looks unpressed, so the control gets pressed again.

The application already draws a waiting mark, `public/assets/loader.svg`, on a hull
illustration and on a hull schematic while each one is on its way. A navigation is the one
wait that has no answer at all.

## What Changes

- A navigation that has to fetch its screen's code states that it is waiting. The waiting
  mark stands in the centre of the viewport, over the whole screen, on a dimmed ground.
- While the mark stands, the screen behind it cannot be operated, cannot be focused and is
  absent from the accessibility tree, so a second press cannot start a second navigation.
- A navigation whose code is already in the browser draws nothing. The mark waits out a
  short threshold first, so a screen visited before, or served from the cache, changes
  without a flash.
- The mark comes down when the navigation ends, whatever the outcome — the screen opened,
  the navigation was cancelled, or the chunk never arrived. It never outlives the
  navigation that raised it.
- A screen reader is told, in the reading language, that the application is waiting. The
  mark itself is decoration and is not announced as a picture.
- The mark stops moving where a Commander asks for reduced motion, in every place the
  application draws it, including the two illustrations that draw it today.
- The design system gains the overlay as a component with its own state previews. No
  screen draws a waiting state of its own, and no skeleton or placeholder screen is
  introduced.

The change declares requirements `018/FR-001` to `018/FR-009`:

- **FR-001** A navigation that has to fetch its screen's code states that it is waiting.
- **FR-002** The statement stands over the whole viewport, centred, on a dimmed ground.
- **FR-003** The screen behind it cannot be operated or reached while it stands.
- **FR-004** A navigation that finishes inside the threshold draws nothing.
- **FR-005** The statement ends with the navigation, whatever the outcome.
- **FR-006** A screen reader is told the application is waiting; the mark is decoration.
- **FR-007** The mark stops moving where reduced motion is asked for.
- **FR-008** It is drawn at every supported width, orientation, text size and zoom.
- **FR-009** It belongs to a running session. A generated document carries none, and the
  first paint of a session is not covered by it.

## Capabilities

### New Capabilities

- `platform/navigation-progress`: what a Commander is shown between asking for a screen and
  getting it — that the application is working, not how far along it is. It owns when the
  statement appears, what it covers, what it takes away while it stands, when it comes
  down, and what a reader is told.

### Modified Capabilities

None. The design system's standing requirements already govern the new component: it enters
the shared library before a capability uses it, previews each state it supports, and takes
every visual value from a token.

## Impact

- `src/app/ui/components/waiting-overlay/` is new: the presentation-only component that
  draws the mark on its ground. It is a native modal `<dialog>`, as the layer component is,
  which is what makes the screen behind it genuinely inert rather than merely covered.
- `src/app/application/navigation/navigation-progress.store.ts` is new: it reads the
  router's navigation events, holds the threshold, and exposes one signal saying whether a
  navigation is waiting. It renders nothing and is tested without rendering.
- `src/app/app.html` and `src/app/app.ts` mount the overlay beside the frame, where the
  help modal and the update overlay are already mounted, and drive it from that signal.
- `public/assets/loader.svg` gains a reduced-motion rule inside its own stylesheet. The
  document-level rule in `src/styles/_base.scss` cannot reach the animation, because an SVG
  drawn through `<img>` is a separate document that the page's styles do not apply to. The
  hull illustration and the hull schematic draw the same file and gain the same behaviour.
- `src/app/ui/previews/preview-manifest.ts` gains the component's state declarations, which
  the interface-foundations policy checker requires of every exported UI component.
- Both message catalogues, `src/app/i18n/locales/en.json` and `de.json`, gain the sentence a
  reader hears while the application waits.
- `e2e/coverage-ledger.ts` gains `018-navigation-loading-overlay` in `COVERED_FEATURES` and
  an entry for every requirement id above.
- No route, no address and no build data changes. Nothing is fetched from another origin,
  and the mark is asked for by a relative path, as every other runtime asset is.
