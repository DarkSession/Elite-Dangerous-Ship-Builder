# Application Shell and Global Utilities

## Purpose

Provide the stable product identity, landmarks, route context/actions, language entry and feedback
outlets around every capability without owning build/domain state. The shell adapts the title/action
bars repeated across canvases 1a–1d.

## Semantic composition

1. banner/header containing localized product identity;
2. route context group containing visible localized screen/build identity supplied by the route;
3. primary navigation when the route set provides it;
4. contextual and global utility actions, including a visible Language entry;
5. one route-owned `main`, one visible `h1` and ordered capability headings;
6. visible route/global status and error content in ordinary reading order;
7. hidden assertive and polite announcement outlets.

The shell never synthesizes a duplicate route heading. Route context is immutable presentation input;
the shell emits action/navigation/language intent and does not reach into a build store.

## Wide composition

- Keep route/product identity at the inline start and a wrapping named action group at the inline end,
  matching the reference hierarchy.
- Primary actions remain visible. Secondary utilities may use a named menu only when every menu item
  repeats a visible text label.
- Language is a visible labelled control or Language action opening the shared selector layer. It is
  never represented only by a globe/icon.
- Route content receives a fluid central region; the shell does not impose the reference's fixed
  canvas width.

## Medium/tablet composition

- Identity and actions wrap into separate rows before labels truncate or targets shrink.
- Preserve direct access to the primary route action and Language; lower-priority actions may move to
  the named action layer without changing availability.
- Portrait and landscape use the same semantic DOM order even when the visible rows change.

## Compact/zoom composition

- Show the route/build identity and one visibly named Menu/Actions control, replacing the prototype's
  unlabeled ellipsis. The opened layer lists every action with visible localized text, including
  Language and Help.
- The action layer is a sheet when its contents are simple and a full-height layer when content/
  expansion/short landscape requires it.
- Fixed/sticky shell regions reserve their space and never cover route content at 200% text or 400%
  zoom.

## Language behavior

The selector shows self-names through the locale catalogue. Startup follows saved → browser → English
precedence. Selecting German loads and validates a candidate, then atomically changes messages,
formats, title, `lang` and `dir`. Selecting English uses the bundled catalogue. A failed candidate
publishes readable English and one nonblocking fallback status. A storage write failure keeps the
choice for the session and reports that it will not persist.

Locale changes do not announce/recompute an unchanged build. The visible language labels change in
ordinary reading order; only a new fallback or persistence outcome creates a polite event.

## Shell states

| State                           | Presentation/behavior                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| Initial English bootstrap       | Bundled localized shell appears with no raw-key flash                                   |
| Browser-matched German          | Complete catalogue/root metadata commit before German route render                      |
| Unsupported browser language    | English appears as the ordinary default                                                 |
| Restored saved choice           | Supported saved tag wins without altering route/build state                             |
| Locale candidate loading        | Current complete snapshot remains; selector exposes busy state                          |
| Locale load/validation fallback | Complete English snapshot plus one bounded fallback notice/retry intent                 |
| Preference storage unavailable  | Active locale remains in memory plus one nonblocking non-persistence notice             |
| Route loading/empty/ready       | Route owns its state inside `main`; shell landmarks/actions remain stable               |
| Route blocking error            | Visible named error and one assertive event; unaffected shell navigation remains usable |

## Component composition

Compose shared frame, product/route heading, navigation, visible-name actions/menu, labelled locale
field/selector, status/error, adaptive layer and announcement outlet primitives. Shell styles contain
no governed literal and shell templates contain no application-owned display literal.
