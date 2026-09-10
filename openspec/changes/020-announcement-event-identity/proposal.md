## Why

A Commander using a screen reader is told about the first of two things and nothing about the
second.

Narrow the ship catalogue from five hulls to three and the polite outlet says nothing. Refuse
a second edit in the outfitting workspace and the assertive outlet says nothing. Open a second
unresolvable hull address and nothing is said for the rest of the session.

The announcement policy identifies an event by `(kind, revision, urgency)`. It drops a request
whose revision does not exceed the highest it has seen for that kind and urgency. The caller
supplies that revision. Six sites supply something that is not a count of events:

| Site                                | What it supplies                                                            | What a Commander loses                              |
| ----------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| The ship catalogue's match count    | the number of hulls shown                                                   | every narrowing after the first                     |
| The saved builds' match count       | the number of records shown                                                 | every narrowing after the first                     |
| A refused edit                      | the build revision                                                          | every refusal until an edit is committed            |
| A refused import                    | the build revision                                                          | the same                                            |
| An address that resolves to no hull | the literal `1`                                                             | every such address after the first, for the session |
| An accepted import                  | the build revision, where the same event elsewhere supplies a request token | a stored or failed import after a committed one     |

Each of these is silent, and silence reports nothing. This is a defect against
`platform/accessible-responsive-operation`, "Announcement of errors and changes" (011/FR-009):
two distinct events must each be announced. The requirement is right and the six sites are
wrong.

Fixing six sites leaves the seventh to be written. The field is named for a measurement, so
each caller supplied the measurement nearest to hand.

## What Changes

- The announcement policy counts its own events. A caller states what happened, and it is
  announced. There is no number to supply.
- An announcement published from an effect resolves its message outside the effect's
  dependencies. A locale commit then changes what the outlet says without republishing the
  event that put it there.
- Two named declarations replace the one number, and both are optional.
  - A caller whose outcome can arrive after its question was withdrawn declares the request it
    belongs to. A superseded outcome stays silent. Two import flows use this.
  - A caller that repeats an action on one subject declares the outcome it is reporting. An
    identical repeat stays silent. One delivery flow uses this.
- Omitting either declaration makes an event announced rather than silent. A caller written
  without reading the policy is heard.
- Narrowing the ship catalogue or the saved builds announces the new count each time it
  changes. Widening them announces it too. The count stays in the message.
- A refused edit and a refused import are each announced, each time. So is each address that
  resolves to no hull.
- A delivery outcome that differs from the last one for the same artifact is announced. An
  identical repeat stays silent.
- The interface policy checker holds the shape. No announcement may carry a caller-supplied
  revision, so the removed field cannot return one call at a time.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform/accessible-responsive-operation`: "Announcement of errors and changes" (011/FR-009)
  gains two rules it does not state. Where the application cannot tell a second occurrence from
  a restatement of the first, it announces. An outcome to a question the Commander has
  withdrawn is not announced, which is the one distinct event the requirement excuses. It also
  gains the reading that changes in either direction, which is the case five of the six sites
  mute.

## Impact

- `src/app/ui/announcements/announcement.service.ts` carries the policy: the sequence it mints,
  the two declarations, and why the default is to announce. `SpokenEvent` and
  `announcement-outlet.ts` are unchanged.
- `src/app/application/outfitting/outfitting.store.ts` announces a refused edit and a refused
  import where each refusal is produced.
- `src/app/ui/outfitting/outfitting-notice.ts` draws the lines and announces nothing. It loses
  its `revision` input, and `outfitting-workspace.html` loses the binding that fed it.
- Eight files state their events without a revision:
  `src/app/features/ship-catalogue/ship-catalogue.page.ts`,
  `src/app/features/build-library/build-library.page.ts`,
  `src/app/features/hull-detail/hull-detail.page.ts`,
  `src/app/application/slef/slef.presenter.ts`,
  `src/app/application/equipment/loadout-import.presenter.ts`,
  `src/app/features/build-workspace/outfitting/hull-anatomy/hull-anatomy.ts`,
  `src/app/app.ts` and `src/app/ui/components/app-frame/app-frame.ts`.
- `scripts/check-interface-foundations.mjs` gains the rule, with fixtures beside it in
  `scripts/check-interface-foundations.test.mjs`.
- The unit suite beside each of those files reads what was silent.
  `announcement.service.spec.ts` reads the policy directly.
- `e2e/coverage-ledger.ts` keeps its two rows for 011/FR-009. Their assertions gain a second
  narrowing and a second refusal.
- `e2e/manual/screen-reader.protocol.md` gains the two readings no scan can judge, and
  `e2e/manual/results/` gains their record.
- No screen changes and no message changes. What changes is which events reach a reader.
