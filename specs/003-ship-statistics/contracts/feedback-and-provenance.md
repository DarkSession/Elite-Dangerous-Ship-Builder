# Feedback and Provenance Contract

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
