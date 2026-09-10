## Why

A Commander using a screen reader is told about the first of two things and nothing about
the second. Narrow the ship catalogue from five hulls to three and the polite outlet says
nothing. Refuse a second edit in the outfitting workspace and the assertive outlet says
nothing. Open a second unresolvable hull address and nothing is said for the rest of the
session.

The announcement policy identifies an event by `(kind, revision, urgency)` and drops a
request whose revision is at or below the highest it has seen for that kind. `revision` is
supplied by the caller. Six callers supply something that is not a count of events: two pass
the number of rows a filter left, which falls whenever a Commander narrows one; two pass the
build revision, which a refusal does not spend; one passes the literal `1`; one announces a
single kind from two unrelated counters. Each of them mutes itself, and none of them reports
anything.

This is a defect against `platform/accessible-responsive-operation`, "Announcement of errors
and changes" (011/FR-009): two distinct events must each be announced. The requirement is
right and the callers are wrong. What the requirement does not say — and what every one of
the six got wrong — is which way the policy leans when the application cannot tell a second
occurrence from a restatement of the first.

Closing the six sites one at a time leaves the seventh to be written. The field is named for
a measurement, so every caller reached for the nearest number, and a wrong number is silent.

## What Changes

- The announcement policy counts its own events. A caller states what happened and it is
  announced; there is no number to supply and no way to mute an event by supplying the wrong
  one.
- Suppression becomes two named requests rather than one number that did both jobs.
  - A caller whose outcome can arrive after the question was withdrawn declares the request
    it belongs to. An outcome from a superseded request stays silent, which is what the
    import flows use today.
  - A caller that publishes from an effect declares which occurrence it is describing. The
    same occurrence restated stays silent; a new one is announced. Nothing else needs it.
- Both are optional, and omitting either makes an event louder rather than quieter. A caller
  that says nothing about suppression is announced every time it asks, so a caller written
  without reading the policy is heard rather than muted.
- Narrowing the ship catalogue and the saved builds library announces the new reading each
  time it changes, in either direction. The count stays in the message, where it already is.
- A second refused edit and a second refused import in the outfitting workspace are each
  announced. So is each visit to an address that resolves to no hull.
- A delivery outcome that differs from the last one for the same artifact is announced. An
  identical repeat stays silent, as it does today.
- The interface policy checker holds the shape: no announcement may carry a caller-supplied
  sequence, so the field this change removes cannot come back one call at a time.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform/accessible-responsive-operation`: "Announcement of errors and changes"
  (011/FR-009) gains the rule the six callers broke. Where the application cannot tell a
  second occurrence of something from a restatement of the first, it announces: a reader
  told twice about one event has heard a repetition, and a reader told nothing about the
  second of two events has lost it. The requirement already says two distinct events must
  each be announced; this says which side of the doubt the application stands on, and adds
  the reading that changes in the direction that lowers it, which is the case every one of
  the six mutes.

## Impact

- `src/app/ui/announcements/announcement.service.ts` carries the policy: the sequence it
  mints, the two declarations that suppress, and the reason the default is to speak.
  `SpokenEvent` and the outlet that renders by identity are unchanged.
- Nine files state their events without a revision:
  `src/app/features/ship-catalogue/ship-catalogue.page.ts`,
  `src/app/features/build-library/build-library.page.ts`,
  `src/app/ui/outfitting/outfitting-notice.ts` and the two notice templates that mount it,
  `src/app/features/hull-detail/hull-detail.page.ts`,
  `src/app/application/slef/slef.presenter.ts`,
  `src/app/application/equipment/loadout-import.presenter.ts`,
  `src/app/features/build-workspace/outfitting/hull-anatomy/hull-anatomy.ts`,
  `src/app/app.ts` and `src/app/ui/components/app-frame/app-frame.ts`.
- `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.html`
  stops binding the build revision into the two notices, and
  `src/app/ui/outfitting/outfitting-notice.ts` loses the input that carried it.
- `scripts/check-interface-foundations.mjs` gains the rule, with fixtures beside it in
  `scripts/check-interface-foundations.test.mjs`.
- The unit suites beside each of those files read the behaviour that was silent, and
  `src/app/ui/announcements/announcement.service.spec.ts` reads the policy directly.
- `e2e/coverage-ledger.ts` keeps its two rows for 011/FR-009 and gains the assertions that
  a second narrowing and a second refusal each reach a reader.
- `e2e/manual/screen-reader.protocol.md` gains the two readings no scan can judge — a filter
  narrowed twice and an edit refused twice — and `e2e/manual/results/` gains their record.
- No screen changes, no message changes, no new string, and nothing about what any outlet
  says. What changes is which events reach one.
