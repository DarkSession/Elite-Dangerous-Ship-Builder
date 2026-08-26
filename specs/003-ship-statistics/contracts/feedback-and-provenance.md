# Feedback and Provenance Contract

> **Superseded 2026-08-22 (wave 11). Partly built, and not as frozen here.** Three collisions
> between the accepted specification and `.design/Ship Builder.dc.html` were surfaced before
> implementation and **the design won all three**
> ([design/reference-review.md](../design/reference-review.md)). The issue list survived and moved:
> it is drawn in the rail under `BUILD STATUS`, not in a separate Status capability (ruling B). What
> ruling A withdrew from it is withdrawn here too — the visible `LoadoutIssueCode`, the exact-slot
> action, the issue and qualification counts, both none-reported statements, and the settled count
> announcer with its polite region, because there are no counts to announce and a build the package
> reports nothing about draws nothing at all.
>
> What survives, and what is built, is one semantic list item per package issue in package order,
> each with its severity in words and its diagnostic through feature 011's presenter, with the
> canonical fallback and its untranslated disclosure on a locale miss. That is stated in
> [design/status-rail.md](../design/status-rail.md), which is the live record; this file is retained
> as the record of what was ruled against and is left as it was written.

## Structural issue presentation

The complete Status capability renders one semantic list item for each package
`LoadoutValidation.issues` entry, in returned order. Each item exposes:

- stable package code as visible textual kind;
- package severity plus a localized generic severity label;
- package diagnostic resolved through feature 011's adapter over `getLoadoutIssueMessage`;
- optional slot, symbol and all structured params, including string arrays;
- one exact-slot action only when `issue.slot` exists.

For a locale where the helper returns `null`, show the canonical package fallback with feature 011's
standard untranslated-game-text disclosure. Do not privately translate codes/messages or parse
prose. Kind and severity never depend on color, icon, border, shape or position.

When there are no package issues, say none were reported. When there are no qualified summaries, say
none were reported. These may be one combined localized statement only when both sets are empty; no
statement may claim readiness, flyability or quality.

## Settled count announcements

The visible rail/capability are not live regions. One visually hidden polite region observes only
ready projections:

1. Initial ready content stores counts and is silent.
2. Compare `{ issueCount, qualifiedSummaryCount }` with the last settled pair.
3. If either changes, coalesce rapid ready revisions and announce one localized message containing
   both current counts.
4. A newer revision replaces a pending message before announcement.
5. Pending, failure, unchanged and discarded projections are silent.

Ordinary issues never use `role="alert"`; application failure uses feature 011's prompt-error pattern.

## Verification

Tests cover exact issue object/order/params, code and severity text, locale helper/canonical fallback,
targeted/untargeted items, empty statements and initial/changed/unchanged/stale announcement behavior.
