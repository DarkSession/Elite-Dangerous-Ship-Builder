# Export Build Layer — SLEF Mode

## Purpose and entry

Generate and deliver one SLEF entry for the exact active revision. With no active build the layer
does not open: the host explains the prerequisite and offers Import/Create recovery with no stale
payload.

The layer is shared with feature 001. Its accessible mode selector contains SLEF (feature 004) and
Share Link (feature 001), in that order, and the layer opens on SLEF — both as `.design` draws them.
The journal and Markdown modes the canvas once drew are gone from the canvas as well as from the
product. This document defines the SLEF mode only.

## Composition

- shared layer heading/description and safe package hull/name summary;
- accessible SLEF/Share Link mode selector owned by the integrated exchange layer;
- package validation summary, including invalid/incomplete warning without suppression;
- readonly selectable monospaced payload, named for a reader and not captioned on the screen;
- localized one-entry, fitted-module and UTF-8-byte metadata;
- an omission explanation where the exact link could not travel, and nothing where it did;
- always-present Download and Copy; feature-detected Share when available;
- concise delivery status/live announcement and named close action.

Components receive immutable presentation state and emit select/generate/copy/download/share/close
intents. They never access active/link state, package APIs or browser globals.

## Arrangement

The layer stands the mode selector and the selected mode's content side by side, as canvas 1c draws
them: the formats down the leading edge, the content beside them, one amber hairline dividing the two
and running the full height of the panel. Each region carries its own padding and the layer's body
carries none, which is what gives that rule a full height to run. The layer takes the widest dialog
step, because two regions need more room than one.

Each format is a bordered plate carrying a tracked condensed title over a description
(`specs/011-interface-foundations/design/canvas-extraction.md`, "Choice cards"), the selected one
washed amber with its title in amber and a marker inside its leading edge. Both plates are closed
boxes: the marker is drawn inside the chosen plate's edge rather than in place of it, so neither
format sits in the list with one side open (Commander request 2026-08-26). The list carries no visible question above it — the canvas
draws none — and its name stays in the accessibility tree for anyone reading the group aloud.

Where the width will not hold two regions, the same choices become the scrolling chip strip canvas 1d
draws above the payload: the same controls, the same names, the same checked state, and the
description carried in the accessibility tree rather than beside the chip. The arrangement resolves
in the stylesheet rather than from a measurement taken once, so it answers to zoom and text scale as
well as to the viewport.

## States

| State                                 | Presentation                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| Generating                            | Active revision identified; no old payload/actions remain                         |
| Ready valid                           | Current payload, metadata, Download/Copy and optional Share                       |
| Ready invalid/incomplete              | Identical delivery capability plus textual package warning/issues                 |
| Exact link included                   | Nothing is said: the link travelling is the ordinary case and needs no sentence   |
| Link omitted/refused                  | Complete SLEF remains; omission explanation is not export failure                 |
| Revision changed                      | Artifact invalidated before delivery; regenerate for new revision                 |
| Copy working/copied/failed            | Only resolved Clipboard promise says copied; failure retains payload/alternatives |
| Download dispatched/setup failed      | Never says saved; setup failure retains Copy/Share/payload                        |
| Share unavailable/file/text           | Hidden when absent; current capability explanation never depends on device width  |
| Share working/shared/cancelled/failed | Explicit chooser action; cancellation neutral; alternatives remain                |

## Responsive behavior

Use the reference wide centered dialog when content fits and narrow bottom sheet on ordinary mobile
portrait. The mode selector's own two arrangements follow the same rule and are described above.
Short landscape, 200% text, 400% zoom or expanded/RTL copy may promote the same content to a
full-height vertically scrollable layer — a landscape phone is wide enough for the two regions and
too short for a centred panel, so it keeps the formats beside the payload inside a layer that owns
the viewport. Mode/actions wrap or stack and never disappear. JSON owns bounded wrapping/overflow;
the page does not scroll horizontally.

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
