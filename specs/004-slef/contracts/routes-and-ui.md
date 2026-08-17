# Routes and UI Contract

Feature 004 adds no route. Import/export layers preserve host route/history.

| Context                | Import                             | Export                                                  |
| ---------------------- | ---------------------------------- | ------------------------------------------------------- |
| `/ships` / hull detail | Available without active build     | Shell action only when active build exists              |
| `/build`, no build     | Primary recovery action            | Unavailable with explanation                            |
| `/build`, active       | Available; replacement rules apply | Available                                               |
| `/builds`              | Shell action                       | Current active build only, never merely selected record |

Wide layouts use a modal; narrow/400% zoom use the same logical content full-screen. Open/close is not
build, browser or edit history.

## Intent boundary

Components emit draft/clear/submit/cancel/replace/dismiss-report and export regenerate/select/copy/
download/share/close intents. They never call the Almanac, measure bytes, read active/storage/link
state or access Clipboard/Blob/Navigator.

Compose feature 011 layer, heading, multiline field, buttons, status, notice/diagnostic list,
validation summary, live announcement and feature 001 replacement confirmation. Missing behavior
extends `src/app/ui/`, never feature-local visual language. Previews cover meaningful empty,
populated, checking/generating, warning, error, disabled and success states at all widths.

## Localization and accessibility

- App strings/status/limits use feature 011 messages and locale number/unit formatters.
- Package game text/diagnostics remain package-owned with untranslated disclosure when necessary.
- Technical paths/codes/JSON use direction isolation in RTL.
- Labels/instructions/byte/error state are programmatically associated; diagnostics name entry,
  property and reason in text.
- Announce concise summaries, not full diagnostic lists or JSON.
- JSON/paths own internal wrap/overflow; no page horizontal overflow.
- All actions remain in portrait/landscape, touch/pointer, 200% text, 400% zoom, expanded/RTL text and
  reduced motion; targets are at least 44 CSS px.
- Background is inert/hidden from accessibility tree while a layer/confirmation is active.

Every state receives axe and semantic/no-overflow checks in Chromium and Firefox across the feature
011 viewport matrix. Only exact constitutionally excluded keyboard rules may be omitted.
