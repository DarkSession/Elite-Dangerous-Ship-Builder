# Application Shell and Global Utilities

## Purpose

Provide the stable product identity, the tool a screen belongs to, landmarks, route
context/actions, language entry and feedback outlets around every capability without owning
build/domain state. The shell adapts the title/action bars repeated across canvases 1a–1d and the
tool bar of `.design/Tool Navigation.dc.html`, canvas 3c.

## Semantic composition

1. banner/header containing localized product identity — the insignia and the release mark — opening
   with a tool navigation region, named in localized text, that names every tool the application
   serves and marks the open route's own tool as current;
2. route context group containing visible localized screen/build identity supplied by the route;
3. primary navigation when the route set provides it;
4. contextual and global utility actions, including a visible Language entry;
5. one route-owned `main`, one visible `h1` and ordered capability headings;
6. visible route/global status and error content in ordinary reading order;
7. hidden assertive and polite announcement outlets.

The shell never synthesizes a duplicate route heading. Route context is immutable presentation input;
the shell emits action/navigation/language intent and does not reach into a build store.

## The tool bar

The application is built to carry more than one tool, so the shell says which tool a Commander is
in. Canvas 3c of `.design/Tool Navigation.dc.html` draws that as a bar over the command bar, with a
tab for each tool; the command bar keeps everything it already carries and the amber rule that
closes it. It is the banner's first region, because it is the first band on the screen — the two
bars are one sticky region, so what the chrome below them clears is the pair.

**It is a navigation landmark with a name of its own.** The bar already carries a `navigation`
landmark labelled `shell.navigation.label`, and two landmarks of one role with one name are two
landmarks a reader cannot tell apart. The tool region takes `shell.tools.label`, which ships in
every catalogue in the same change as the code that reads it (FR-019).

**One registry.** The canvas's own note is the rule — "tabs and grid run off one tool registry, so a
new tool appears in both at once" — so the tools are a data array and everything that names them
reads it. A tool entry carries a localised name for the bar, the address the tool opens at, and the
routes it owns. The routes are what decides which tool is current: a Commander outfitting a hull at
`/build` is still in the ship tool, and a tab that stopped being current there would state something
untrue.

**A tool with no address is not offered.** The registry holds the tools the application serves, not
the tools it plans to serve. `Tool Navigation.dc.html` names eight and `docs/navbeacon-migration.md`
names two; what is built is the ship tool, so that is what the bar carries. A tab that opens nothing
is a control for a thing that does not exist.

**A registry of one still draws the bar.** With a single tool served, the region names that tool and
offers no other, so a reader reaching the landmark is told which tool the screen belongs to and
finds nothing to follow. That is the state the product ships in. What it must not be is a landmark
with nothing in it at all, which is why a surface carrying no tools — the component preview
catalogue is one — leaves the region out of the document.

**The current tool is named, not offered.** The tab for the tool a Commander is already in is text
rather than a link, for the reason the insignia is a bare mark on the shipyard and the primary
navigation drops the entry for the open screen: a link to the screen someone is reading is not a way
anywhere. It would also be the second control in the same chrome opening `/ships`, which is the
duplicate the leading-edge ruling below removes. The current tool carries `aria-current`, so the
state is exposed in the accessibility tree as well as in the amber fill and underline the canvas
draws (FR-010).

**The tab carries the canvas's short name.** Canvas 3c gives each tool both a full name and a tab
label, and draws the tab label: `SHIP`, not `SHIP BUILDER`. The registry carries the short one,
because the command bar under it is already titled `Ship Builder` on the shipyard and one bar
restating the other says nothing new. The tab's visible text is its accessible name, as every
control in this system is (FR-007).

**One composition at every width.** The canvas draws the 1180px case and nothing else: its script
guards a `#nv-rail` and a `#nv-drawer` that no artboard defines, and the Equipment Builder's own
390px artboard has no tool switcher at all. So there is no compact drawing to follow, and the rule
is that there is nothing to switch on: the same tabs at every width, at compact type and spacing,
each holding the 44px press baseline. This holds while the registry is small. A rail, a drawer or a
grid is a composition to be drawn before it is built (owner's ruling, and the open item in
`docs/navbeacon-migration.md`).

That also makes the tool bar the one region the command bar's fold does not reach. "The fold is
total" below is a rule about the command bar's own controls; the tools are on a bar of their own and
stay on it at every width.

**What the canvas draws and the product does not.** The `ALL TOOLS` grid, the `⌘K` palette and
drag-to-pin are more than one tool needs and are not built. The avatar plate at the bar's trailing
edge is not built either, and not deferred: the application has no accounts (constitution I), so
there is nobody for it to name.

**The insignia stays on the command bar.** Canvas 3c puts the mark on the leading edge of the tool
bar, where every other canvas puts it on the leading edge of the bar it draws. Here the mark is
already the way home — a real link to the shipyard, named by the screen it reaches — and the tool
bar's leading edge is where the ship tab lands. Moving the mark up would put two controls that open
`/ships` beside each other, which the leading-edge ruling below already refuses. So the mark keeps
the command bar, the tool bar carries tabs alone, and the divergence is recorded here rather than
resolved silently.

## The bar's leading edge

The 2026-08-26 canvas revision settles three things about it, and they hold at every width.

- **The insignia is the way home.** Every artboard draws the mark on the leading edge, and the
  revision put it exactly where the outfitting bar's `SHIPYARD` chip used to be. So the mark carries
  that trip and the word is not drawn twice: it is a real link with the shipyard's own address, named
  by the screen it reaches, with the mark itself hidden from assistive technology so it is never
  announced as a picture of nothing. On the shipyard it is a link to nowhere and is drawn as the
  decoration it is.
- **The insignia is one size, and the press around it is another.** The mark is `26 × 23px` on every
  screen. Where it is the way home the link around it takes the 44px press baseline, and the mark
  inside it does not grow with the target
  (`design/canvas-extraction.md`, "Command bar").
- **The bar is one height on every screen.** It is sized to the tallest identity it carries — the
  workspace's two-line build identity — and it folds its own controls into the named menu below the
  width the widest shipped language needs for them, so the page under it does not move as a
  Commander opens a build. It stays a floor rather than a fixed height: at a doubled text size and
  at 400% zoom the bar still wraps and grows (`design/canvas-extraction.md`, "One bar height, on
  every screen").
- **The release mark says what it stands beside.** A solid amber chip reading `BETA`, with the bar's
  own ground as its ink. Where the bar carries a plain screen title the chip follows that title and
  precedes the screen's count, as canvas 1a draws it — `SHIPYARD`, `BETA`, `48 SHIPS` — because
  `SHIPYARD BETA` reads as a beta shipyard, which is what it is. Where the bar carries a build's
  identity — an editable name over its hull line, on canvases 1c and 1d — the chip stands ahead of
  it instead, because a chip after an editable name reads as part of the name and the build is not
  what is in beta.

  So the chip is the product's mark wherever the bar names a screen, and the product's mark before
  the Commander's own build wherever the bar names one of those. The accessible name and the
  reading order follow the drawing in both cases: the chip is a word in the document at the place
  it is drawn, never a decoration positioned over the bar.

  **The canvases disagree about the plain-title case, and this rule follows 1a.** Canvas 1b's
  compact shipyard bar draws the chip first — `BETA`, then `SHIPYARD`, then `8 OF 48 SHIPS` — over
  the same plain title 1a puts it after. One rule is applied at both widths, because the chip
  changing sides with the viewport would make the mark read as a property of the window rather than
  of the product; 1a's order is the one kept, for the sentence it makes. The divergence from 1b is
  recorded here rather than resolved silently.

- **A screen opened over another one replaces the group.** Canvas 1b's hull sheet draws a bare `←`,
  its own name and one line under it, and no insignia, release mark or count. Both compositions are
  in the document and the stylesheet shows one, so exactly one `h1` and one way back are ever exposed
  (`ScreenReturn`).

  The bar shows the return group wherever a screen is opened over another one, which is every width
  below the wide composition rather than the compact band alone (2026-08-30). The step is the
  shell's: a route hands the bar its return group whenever its screen is drawn, at every width,
  and the frame reveals the group below the wide composition. That is the same width at which such a
  screen becomes a full-height layer, because the group and the layer are the same decision — so the
  two never disagree, and no route can ask for a way back the shell would draw beside the screen it
  leads out of.

## Wide composition

- Keep route/product identity at the inline start and a named action group at the inline end,
  matching the reference hierarchy.
- Actions remain visible on the bar wherever the widest shipped language can draw them all on one
  row. Below that width the bar folds instead, and the fold is total: every action and every screen
  the bar offers goes into the one named menu, at every width the bar is folded at
  (`design/canvas-extraction.md`, "One bar height, on every screen"). A menu item repeats the
  visible text label the bar would have drawn, so nothing is only reachable as an unnamed mark.
- Route content receives a fluid central region; the shell does not impose the reference's fixed
  canvas width.

## Medium/tablet composition

- The bar is folded here, so it draws identity and one named menu rather than wrapping identity and
  actions into separate rows. Everything the bar offers stays available, in the menu, named.
- Regions below the bar take the medium mode as they always did: two regions where relationships
  stay legible, and a secondary region that moves below or becomes a drill-in.
- Portrait and landscape use the same semantic DOM order even when the visible rows change.

## Compact/zoom composition

- Show the route/build identity and one Menu/Actions control drawn as the canvas's `⋮` mark on its
  own outlined square, at this feature's 44px target baseline rather than the canvas's own 40. Ruled
  2026-08-26, reversing an earlier reading: the word `MENU` is not drawn on any artboard, and a bar
  already carrying a build's name has no room for it. The mark is
  decoration and is hidden from assistive technology; the control's accessible name is the same
  localized phrase the wide bar's group carries, so nothing is named by a glyph. The opened layer
  lists every action with visible localized text, including Help.
- The opened layer is the canvas's flat panel, not a stack of buttons: full-width rows separated by
  hairline rules, the first of them on the accent wash the canvas gives the action a Commander is
  most likely to want, and the rest bare. A row is still a control with a name, a role and a state;
  what it is not is a chip inside a panel of chips (canvas 1d).
- Route content keeps the same inline gutter as the bar above it. A compact screen whose content runs
  to both edges of the viewport reads as a page that has come apart, and the canvas draws none.
- The action layer is a sheet when its contents are simple and a full-height layer when content/
  expansion/short landscape requires it.
- Fixed/sticky shell regions reserve their space and never cover route content at 200% text or 400%
  zoom. The banner keeps its place only while what it leaves below is still a viewport content can
  be stacked in; a bar that has wrapped past that — a long language, a narrow window, a doubled text
  size — releases and travels with the page. The height it wrapped to is measured rather than
  declared, because no media query can ask what a bar came to.

## Language behavior

The shell has no language control. Startup follows browser → English precedence: a browser-matched
German loads and validates a candidate, then atomically commits messages, formats, title, `lang` and
`dir` before the shell renders. English uses the bundled catalogue with no request. A failed
candidate publishes readable English and one nonblocking fallback status.

Locale resolution does not announce/recompute an unchanged build. Only a new fallback creates a
polite event.

## Version behavior

The shell has no version display and states no version number. It says one thing, and only when it
is true: that the version this session is running is no longer the published one, with one named
control beside it that starts the application on the newer one. The control sits at the trailing
edge of the bar, after the screen's own actions and Import, and immediately before the notice that
explains it in reading order.

**A newer version applies itself. Ruled 2026-08-26 (Commander request), narrowed 2026-08-27
(owner's decision).** The moment one is ready an overlay goes up over the whole page saying what is
happening, and the application restarts under it on the newer version. The overlay is a layer, so it
is modal, it takes focus, and it makes the page behind it inert.

**It offers nothing to press.** It is drawn with no dismiss label, which is what leaves it with no
control, no Escape and no ground to click: the three routes out of a layer go together, and a
Commander is told about the restart rather than asked about it. The 2026-08-26 ruling kept a control
that called the restart off, and the twenty-second grace period was that control's WCAG 2.2.1 floor
rather than a taste. Both are withdrawn.

**The period is one second (owner's decision, 2026-08-28).** Ten seconds was set by how long the
overlay's two sentences took to read, and reading them was never what the overlay was for: it left a
Commander in front of a page they could not touch while nothing happened. The overlay is the moment
before the restart — it says what is happening, and the half that is written to be read is the
notice the restarted session draws, which has no clock on it. The second sentence about where the
open build lives goes with the wait that existed to read it; the overlay is now a title and one
sentence.

**What that costs, drawn where it happens.** A restart on a clock with no way to hold the page meets
none of 2.2.1's conditions, so the criterion is excluded by constitution V for this mechanism and
named in every conformance statement. It is the application's only time limit.

**The other half is drawn by the session that comes up.** The overlay went with the page that drew
it, so a Commander who looked away for a moment would otherwise find a page that had silently
become a different one.

**And it goes by itself (owner's decision, 2026-08-28).** Six seconds, and then the layer takes
itself down by the same route its `Continue` takes. It is a modal standing in front of the build a
Commander has just come back to, and both facts on it survive it: the application is already running
the newer version, and the version number is on Help · About. That is the second time limit in this
mechanism and the only other one anywhere, which is why constitution V names the mechanism rather
than the restart alone. The restarted session opens a layer saying the update was applied and naming
the version it is running, dismissed by its own named control. The marker that carries this across
the reload lives in `sessionStorage`, so it reaches the tab that restarted and no other, and it is
cleared as it is read.

What is not on a clock is a cached application the worker cannot repair. It is the same shape with
the tones reversed — a blocking error and a restart that fetches a working version — but the restart
is a repair a Commander asks for. There is no working page under the warning to protect, and an
error is not an improvement to be rolled out.

Nothing is lost where the restart cannot happen. A session with no page to start over keeps working,
the notice and its named control return to the bar, and the worker has the newer version downloaded,
so the next start of the application is served it.

The session asks whether a newer version exists on a fixed interval, when the page becomes visible
again and when connectivity returns. None of that reaches the route, the fragment, history, storage,
the saved build or an export.

## Shell states

| State                            | Presentation/behavior                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Initial English bootstrap        | Bundled localized shell appears with no raw-key flash                                                                              |
| Browser-matched German           | Complete catalogue/root metadata commit before German route render                                                                 |
| Unsupported browser language     | English appears as the ordinary default                                                                                            |
| Locale candidate loading         | Current complete snapshot remains; nothing partial is shown                                                                        |
| Locale load/validation fallback  | Complete English snapshot plus one bounded fallback notice/retry intent                                                            |
| Route loading/empty/ready        | Route owns its state inside `main`; shell landmarks/actions remain stable                                                          |
| Open route's tool                | The tool that owns the open route is named as current and is not a link; every other registered tool is one                        |
| Route blocking error             | Visible named error and one assertive event; unaffected shell navigation remains usable                                            |
| Newer version published          | Modal overlay stating the restart with nothing to press and no event beside it; the page restarts under it after one second        |
| Restarted on the newer version   | Modal notice naming the version now running, dismissed by its own control, and not drawn again in that session                     |
| Restart could not be carried out | Overlay closes, the page is untouched; visible nonblocking notice, one polite event and one named restart action remain on the bar |
| Cached version unrepairable      | Visible named error, one named restart action and one assertive event summarizing rather than repeating it                         |

## Component composition

Compose shared frame, product/route heading, navigation, visible-name actions/menu, labelled locale
field/selector, status/error, adaptive layer and announcement outlet primitives. Shell styles contain
no governed literal and shell templates contain no application-owned display literal.

**The menu control draws its own mark. Ruled 2026-08-26 (Commander request).** A `select` left at the
platform's own appearance drew the browser's chevron in the browser's ink — the one part of a field
the theme could not reach, and on the engineering recipe it sat inside a control the canvas draws in
the accent. The control now takes `appearance: none` and the field draws canvas 1c's own caret
beside it (`eng-bp-btn`): a mono glyph at the trailing edge, in the field's own muted ink and the
disabled ink when the control is disabled, with the control's trailing inset opened far enough that
the longest option stops before the mark rather than running under it.

**The search field's platform mark goes with it.** A `type="search"` box draws a clear mark of its
own in WebKit and Blink, in the browser's ink and at the browser's size, and this system's own search
already carries a clear control at the same edge — so a field with something in it showed two crosses
side by side, one of them a colour nothing else on the screen uses. The platform's is removed; the
one that stays is named, reachable from a keyboard and drawn in the theme (Commander request
2026-08-26).

A `select` is a replaced element and hosts no pseudo-element, so the mark is a box positioned over
it. It is `pointer-events: none`, so the whole control still opens on a press anywhere across it, and
`aria-hidden`, because the element already tells a reader it is a menu — a caret announced beside it
would be a second, wordless claim about the same control.
