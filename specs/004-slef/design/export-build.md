# Export Build Screen

## Purpose and entry

Generate/deliver one SLEF entry for the exact active revision. No-build workspace explains the
prerequisite and offers import/create without stale output.

## Composition

- layer heading with safe package hull/name summary;
- package validation summary, including invalid/incomplete warning without suppression;
- labelled readonly selectable monospaced payload;
- localized entry/module/UTF-8-size metadata;
- optional link-omitted/refused explanation;
- download/copy and feature-detected platform share;
- concise delivery status/live region and close.

There are no format tabs; feature 004 exports SLEF only.

## States

| State                         | Presentation                                                          |
| ----------------------------- | --------------------------------------------------------------------- |
| No build/generating           | No stale artifact; actions unavailable until exact revision generated |
| Ready valid                   | Payload, metadata and available delivery actions                      |
| Ready invalid/incomplete      | Same actions plus textual package issue warning                       |
| Link omitted/refused          | Complete SLEF; absent `appURL` disclosed without export error         |
| Copy/download success/failure | Artifact and alternate actions remain                                 |
| Share working/success         | Chooser only from explicit gesture; panel remains                     |
| Share cancelled/failed        | Cancellation neutral, failure textual, alternatives remain            |
| Revision changed              | Old artifact invalidated before any delivery                          |

Wide layout uses a contained dialog. Ordinary narrow layout uses the reference's bottom sheet; short
landscape viewports, text expansion and 400% zoom may promote it to a vertical full-height layer.
Actions wrap without disappearing and JSON owns overflow. Do not announce full JSON; announce a
ready summary. Status is textual, share explains the platform chooser, technical content is
direction isolated and all app copy/counts use feature 011 localization.

Requirements: FR-001–FR-006 and FR-013–FR-014.
