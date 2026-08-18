# Export Build Layer — SLEF Mode

## Purpose and entry

Generate and deliver one SLEF entry for the exact active revision. With no active build the layer
does not open: the host explains the prerequisite and offers Import/Create recovery with no stale
payload.

The layer is shared with feature 001. Its accessible mode selector contains Share Link (feature 001)
and SLEF (feature 004); journal and Markdown modes from `.design` are absent. This document defines
the SLEF mode only.

## Composition

- shared layer heading/description and safe package hull/name summary;
- accessible Link/SLEF mode selector owned by the integrated exchange layer;
- package validation summary, including invalid/incomplete warning without suppression;
- labelled readonly selectable monospaced payload;
- localized one-entry, fitted-module and UTF-8-byte metadata;
- optional exact-link included/omitted explanation;
- always-present Download and Copy; feature-detected Share when available;
- concise delivery status/live announcement and named close action.

Components receive immutable presentation state and emit select/generate/copy/download/share/close
intents. They never access active/link state, package APIs or browser globals.

## States

| State                                 | Presentation                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Generating                            | Active revision identified; no old payload/actions remain                         |
| Ready valid                           | Current payload, metadata, Download/Copy and optional Share                       |
| Ready invalid/incomplete              | Identical delivery capability plus textual package warning/issues                 |
| Exact link included                   | Header/link disclosure names same-revision canonical link safely                  |
| Link omitted/refused                  | Complete SLEF remains; omission explanation is not export failure                 |
| Revision changed                      | Artifact invalidated before delivery; regenerate for new revision                 |
| Copy working/copied/failed            | Only resolved Clipboard promise says copied; failure retains payload/alternatives |
| Download dispatched/setup failed      | Never says saved; setup failure retains Copy/Share/payload                        |
| Share unavailable/file/text           | Hidden when absent; current capability explanation never depends on device width  |
| Share working/shared/cancelled/failed | Explicit chooser action; cancellation neutral; alternatives remain                |

## Responsive behavior

Use the reference wide centered dialog when content fits and narrow bottom sheet on ordinary mobile
portrait. Short landscape, 200% text, 400% zoom or expanded/RTL copy may promote the same content to a
full-height vertically scrollable layer. Mode/actions wrap or stack and never disappear. JSON owns
bounded wrapping/overflow; the page does not scroll horizontally.

## Accessibility, localization and previews

The layer has programmatic heading/description, modal semantics and inert/hidden background. Mode
control exposes selected state; payload label and validation/delivery feedback are programmatically
related. Announcements are concise and revision-deduplicated; never announce full JSON. Delivery and
validation state is textual, not color-only. Technical content is direction-isolated; app copy/counts
use feature 011 and package text uses Almanac locale/canonical disclosure.

The separate no-build `/build` host state is previewed alongside this surface; the layer itself is
previewed from generating onward. Previews cover every ready/validation/link/revision state and all
delivery outcomes at desktop/tablet/mobile widths plus expanded, RTL and reduced motion.
Requirements: FR-001–FR-006, FR-013 and FR-014.
