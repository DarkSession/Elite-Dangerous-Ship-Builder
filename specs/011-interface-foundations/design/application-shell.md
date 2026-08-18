# Application Frame and Language Control

## Purpose

Provide stable product landmarks, navigation, locale selection and feedback outlets around every
route without owning capability/domain state.

## Semantic composition

1. application header/banner containing localized product identity;
2. primary navigation when the current product route set provides it;
3. always-visible labelled language select;
4. route-owned `main`, one visible `h1` and ordered capability headings;
5. visible route feedback in reading order;
6. global hidden assertive and polite announcement outlets.

Dialog/layer portals remain inside the application boundary, are named/described, and make background
content inert while open. The frame does not generate a duplicate route heading.

## Responsive composition

- Wide layouts keep brand/navigation/language actions in a wrapping header and leave route content a
  fluid central region.
- Tablet and mobile stack/wrap the same named actions. No language/navigation capability becomes
  hover-only or disappears behind an unlabeled icon.
- Mobile landscape preserves content height by compact spacing tokens, not by omitting controls.
- At 200% text, 400% zoom, doubled copy and RTL, semantic DOM/reading order stays stable; no fixed
  header may cover content and the document does not scroll horizontally.

## Language behavior

The visible language label and option self-names come from catalogues. Initial selection follows the
locale contract. Selecting German loads/validates a candidate, then atomically changes messages,
formats, title, `lang` and `dir`; selecting English uses the bundled catalogue. A failed candidate
leaves a readable English frame and shows one non-blocking fallback status. Storage failure leaves
the selection active for the tab/session and reports that it will not persist.

Locale changes never announce or recompute an unchanged build. The visible language/status text
changes in ordinary reading order; only a new fallback/persistence outcome generates a polite event.

## States

| State                          | Frame behavior                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| Initializing                   | Bundled English frame available; route loading state named, no raw key flash           |
| Browser-matched German         | German catalogue/root metadata committed before localized route render                 |
| Unsupported browser locale     | English selected and presented as ordinary default                                     |
| Restored explicit choice       | Saved supported tag wins without rewriting build/navigation state                      |
| Locale asset invalid/offline   | Atomic English fallback plus bounded status/retry intent                               |
| Preference storage unavailable | Active choice remains in memory; nonblocking non-persistence notice                    |
| Route blocking error           | Visible named error and one assertive announcement; frame navigation remains available |

## Design-system composition

Compose frame, primary navigation, page heading, field/select, status/error, dialog/layer and
announcement primitives. The shell stylesheet contains no visual literal or owned display text.
