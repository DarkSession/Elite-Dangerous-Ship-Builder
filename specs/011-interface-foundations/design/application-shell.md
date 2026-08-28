# Application Shell and Global Utilities

## Purpose

Provide the stable product identity, landmarks, route context/actions, language entry and feedback
outlets around every capability without owning build/domain state. The shell adapts the title/action
bars repeated across canvases 1a–1d.

## Semantic composition

1. banner/header containing localized product identity — the insignia and the release mark;
2. route context group containing visible localized screen/build identity supplied by the route;
3. primary navigation when the route set provides it;
4. contextual and global utility actions, including a visible Language entry;
5. one route-owned `main`, one visible `h1` and ordered capability headings;
6. visible route/global status and error content in ordinary reading order;
7. hidden assertive and polite announcement outlets.

The shell never synthesizes a duplicate route heading. Route context is immutable presentation input;
the shell emits action/navigation/language intent and does not reach into a build store.

## The bar's leading edge

The 2026-08-26 canvas revision settles three things about it, and they hold at every width.

- **The insignia is the way home.** Every artboard draws the mark on the leading edge, and the
  revision put it exactly where the outfitting bar's `SHIPYARD` chip used to be. So the mark carries
  that trip and the word is not drawn twice: it is a real link with the shipyard's own address, named
  by the screen it reaches, with the mark itself hidden from assistive technology so it is never
  announced as a picture of nothing. On the shipyard it is a link to nowhere and is drawn as the
  decoration it is.
- **The release mark follows it.** A solid amber chip reading `BETA`, with the bar's own ground as
  its ink, between the insignia and the screen's identity on every artboard.
- **A screen opened over another one replaces the group.** Canvas 1b's hull sheet draws a bare `←`,
  its own name and one line under it, and no insignia, release mark or count. Both compositions are
  in the document and the stylesheet shows one, so exactly one `h1` and one way back are ever exposed
  (`ScreenReturn`).

## Wide composition

- Keep route/product identity at the inline start and a wrapping named action group at the inline end,
  matching the reference hierarchy.
- Primary actions remain visible. Secondary utilities may use a named menu only when every menu item
  repeats a visible text label.
- Route content receives a fluid central region; the shell does not impose the reference's fixed
  canvas width.

## Medium/tablet composition

- Identity and actions wrap into separate rows before labels truncate or targets shrink.
- Preserve direct access to the primary route action and Language; lower-priority actions may move to
  the named action layer without changing availability.
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
rather than a taste. Both are withdrawn. The period is now ten seconds, set by how long the
overlay's two sentences take to read.

**What that costs, drawn where it happens.** A restart on a clock with no way to hold the page meets
none of 2.2.1's conditions, so the criterion is excluded by constitution V for this mechanism and
named in every conformance statement. It is the application's only time limit.

**The other half is drawn by the session that comes up.** The overlay went with the page that drew
it, so a Commander who looked away for ten seconds would otherwise find a page that had silently
become a different one. The restarted session opens a layer saying the update was applied and naming
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
| Route blocking error             | Visible named error and one assertive event; unaffected shell navigation remains usable                                            |
| Newer version published          | Modal overlay stating the restart with nothing to press and no event beside it; the page restarts under it after ten seconds       |
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
