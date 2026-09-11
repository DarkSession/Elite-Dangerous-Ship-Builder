## Why

A Commander using a screen reader is told about the first of two things and nothing about the
second.

Narrow the ship catalogue from five hulls to three and the polite outlet says nothing. Refuse
a second edit in the outfitting workspace and the assertive outlet says nothing. Open a second
unresolvable hull address and nothing is said for the rest of the session.

The announcement policy identifies an event by `(kind, revision, urgency)`. It drops a request
whose revision does not exceed the highest seen for that kind and urgency. The caller supplies
the revision. Seven sites supply something that is not a count of events:

| Site                                | What it supplies                                                            | What a Commander loses                                                       |
| ----------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| The ship catalogue's match count    | the number of hulls shown                                                   | every narrowing after the first                                              |
| The saved builds' match count       | the number of records shown                                                 | every narrowing after the first                                              |
| A refused edit                      | the build revision                                                          | every refusal until an edit is committed                                     |
| A refused import                    | the build revision                                                          | the same                                                                     |
| An address that resolves to no hull | the literal `1`                                                             | every such address after the first, for the session                          |
| An accepted import                  | the build revision, where the same event elsewhere supplies a request token | a stored or failed import after a committed one                              |
| A delivered export                  | the export's revision                                                       | a second delivery of one export, and any outcome that differs from the first |

Each of these is silent. This is a defect against
`platform/accessible-responsive-operation`, "Announcement of errors and changes" (011/FR-009):
two distinct events must each be announced.

Correcting seven sites does not stop an eighth being written. The field is named for a
measurement, so each caller supplied a measurement.

## What Changes

- The announcement policy counts its own events. A caller states what happened, and it is
  announced. There is no number to supply.
- An announcement published from an effect resolves its message outside the effect's
  dependencies, so a browser language change does not republish the event. Its trigger is the
  event itself rather than something rebuilt alongside it: the ship manifest's count is read
  as a number, because the object carrying it is rebuilt whenever a reading language reorders
  the manifest.
- Nothing replaces the number. A caller whose outcome can arrive after its question was
  withdrawn asks its own store whether the question still stands, and announces only if it
  does. Two import flows ask.
- Every request the policy is given is announced. A caller that decides nothing is heard every
  time it asks.
- Narrowing the ship catalogue or the saved builds announces the new count each time it
  changes. Widening them announces it too. The count stays in the message.
- A refused edit and a refused import are each announced, each time. So is each address that
  resolves to no hull, and each import that is stored or refused after one is accepted.
- Every delivery of an export is announced, including a second delivery of one export. A
  Commander who presses Copy again because they were unsure of the first press is answered
  both times.
- A batch import announces both of its outcomes. A submit that stored some builds and refused
  others said only one of the two; it now says how many were saved and how many were not, in
  one sentence, because the polite outlet holds one event.
- The interface policy checker carries three rules. No announcement may carry a caller-supplied
  revision, so the removed field cannot return one call at a time. Every request is written
  where it is made, because a surplus key reaches the compiler on a literal and not on a
  variable. And no announcement published from an effect resolves its message inside that
  effect, which is what keeps one occurrence from being announced twice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform/accessible-responsive-operation`: "Announcement of errors and changes" (011/FR-009)
  states that two distinct events must each be announced, and states no exception. One is
  needed and is added here: an outcome to a question the Commander has withdrawn is not
  announced. The requirement also gains the cases the seven sites mute — a figure that changes
  in either direction, a condition that recurs, an action repeated on one subject, and one
  request reporting two outcomes. Its replay rule moves to what a Commander can observe,
  because the caller keeps a replay from being published rather than the policy dropping one.

## Impact

- `src/app/ui/announcements/announcement.service.ts` carries the policy: the sequence it mints,
  and why every request it is given is announced. `SpokenEvent` and
  `announcement-outlet.ts` are unchanged.
- `src/app/ui/outfitting/outfitting-notice.ts` draws the lines and announces nothing. It loses
  its `revision` and `announcementKind` inputs, and three templates lose the bindings that fed
  them:
  `src/app/ui/outfitting/edit-refusal-notice.html`,
  `src/app/ui/outfitting/ingress-refusal-notice.html` and
  `src/app/features/build-workspace/outfitting/outfitting-workspace/outfitting-workspace.html`.
- `src/app/ui/outfitting/edit-refusal-notice.ts` and
  `src/app/ui/outfitting/ingress-refusal-notice.ts` announce instead. Each holds the refusal
  itself, which changes once per refusal, where the generic notice holds resolved text that a
  committed locale rewrites.
- Eight files state their events without a revision:
  `src/app/features/ship-catalogue/ship-catalogue.page.ts`,
  `src/app/features/build-library/build-library.page.ts`,
  `src/app/features/hull-detail/hull-detail.page.ts`,
  `src/app/application/slef/slef.presenter.ts`,
  `src/app/application/equipment/loadout-import.presenter.ts`,
  `src/app/features/build-workspace/outfitting/hull-anatomy/hull-anatomy.ts`,
  `src/app/app.ts` and `src/app/ui/components/app-frame/app-frame.ts`.
- `scripts/check-interface-foundations.mjs` gains all three rules, with fixtures beside them in
  `scripts/check-interface-foundations.test.mjs`.
- The unit suite beside each of those files reads what was silent.
  `announcement.service.spec.ts` reads the policy directly.
- `e2e/coverage-ledger.ts` keeps both rows carrying 011/FR-009. The `shell/announcements` row
  is the one that moves: its locale assertion is restated against a policy that publishes
  nothing on a committed locale, and it gains the second narrowing and the second refusal.
- `e2e/manual/screen-reader.protocol.md` gains the two journeys no scan can judge, and
  `e2e/manual/results/` gains their record.
- `src/app/i18n/locales/en.json` and `de.json` gain three keys per import layer: the "was not
  saved" sentence in its two counted forms, and the joiner that puts it after the stored count.
  A batch reporting two outcomes states both, and the announcement had no words for the second.
- No screen changes, and nothing already drawn changes its words. What changes is which events
  reach a reader, and the one sentence a batch says out loud.
