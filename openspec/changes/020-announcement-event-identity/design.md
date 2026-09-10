## Context

See proposal.md — Why.

The policy is `src/app/ui/announcements/announcement.service.ts`. It keeps one number per
`(kind, urgency)` and drops a request that does not exceed it. The caller supplies that number
in a field called `revision`, and it answers two unrelated questions: is this a replay, and is
this a late answer to a withdrawn question.

A third question is answered by the same number without anyone saying so. Seven announcements
are published from an Angular effect. An effect re-runs when anything it read changes, and
resolving a message reads the message catalogue, so a reading language the browser reports
re-runs the effect and republishes the event. Three of the seven resolve the message in
`untracked` and are safe: two in `app.ts` and one in `app-frame.ts`. Four do not — the ship
catalogue's count, the saved builds' count, the outfitting notice and the unresolvable address
— and each supplies a number that stays still instead.

## Goals / Non-Goals

**Goals:**

- An announcement is heard unless a caller has said why it should not be.
- Each of the three questions is answered by whatever owns it.
- A caller that gets the policy wrong is heard twice rather than not at all.
- The removed field cannot return one call at a time.

**Non-Goals:**

- No change to the words any message carries, and none to how an outlet renders.
  `SpokenEvent` and `announcement-outlet.ts` are untouched.
- No new urgency and no queue.
- No change to the rule that initial content is silent. Each screen keeps its own first-run
  guard, which is a statement about arrival rather than about dedupe.

## Screens

None. This change introduces no screen and alters no layout. `OutfittingNotice` loses an input
and an effect and draws what it drew.

## Decisions

### The service counts, the caller states

`AnnouncementRequest` loses `revision`. The service holds a counter and stamps each published
event with it, which is what `SpokenEvent.identity` needs so the outlet can rebuild a region
whose words did not move.

Considered and rejected: keep `revision`, correct the seven sites, and add a policy rule
against a literal or a count-shaped expression. It is the smaller diff. It leaves in place the
field all seven got wrong, and the rule is syntactic — it recognises the seven expressions
already found, not the eighth. The failure it guards against is silence, which reports nothing.

### An effect is not an event

An announcement published from an effect resolves its message in `untracked`. The effect then
depends on the state the event is about, and on nothing else.

`hull-detail.page.ts` shows what the rule replaces. It announces an unresolvable address from
an effect over the resolved view, with the message resolved inside the effect, so a reading
language re-runs it. The literal `1` it supplies stops that restatement, and stops every later
address with it.

With the rule applied, no site needs a declaration for this question. The effect runs when the
event happens.

### One declaration, for the one question that remains

`request: number` is optional: a monotonic token naming the request an outcome belongs to. An
outcome whose token does not exceed the highest seen for `(kind, urgency)` stays silent. That
is the boundary the policy already draws — an equal token is the same request, and a lower one
is older.

`SlefStore.requestToken` and `LoadoutImportStore.requestToken` are already this. The field
names what they are for.

### Where each site lands

| Site                                                                     | Declares  | Why                                                                                            |
| ------------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------- |
| `ship-catalogue.page.ts`, `build-library.page.ts`                        | nothing   | The effect runs when the count changes, which is the event.                                    |
| `outfitting.store.ts` refused edit, refused import                       | nothing   | Announced where the refusal is produced.                                                       |
| `hull-detail.page.ts`                                                    | nothing   | With the message resolved in `untracked`, the effect runs when an address resolves to no hull. |
| `hull-anatomy.ts`                                                        | nothing   | Announces at the transition. `#transition` goes with the field.                                |
| `app.ts` navigation failure, update notice                               | nothing   | Both resolve in `untracked`.                                                                   |
| `app-frame.ts` locale fallback                                           | nothing   | The same.                                                                                      |
| `slef.presenter.ts` delivery                                             | nothing   | Every delivery is an outcome a Commander asked for.                                            |
| `slef.presenter.ts` scan, accepted import, stored import, refused import | `request` | Each is an outcome of a submit the Commander can withdraw.                                     |
| `loadout-import.presenter.ts`                                            | `request` | The same.                                                                                      |

One declaration, two callers. That is the measure of how much of the removed field's work
belonged elsewhere.

### Every delivery is announced

`slef.presenter.ts` deduplicates delivery on the export's revision, so a Commander who copies
one payload twice is told once. That silence is deliberate and it goes.

Two presses are two events, and 011/FR-009 admits one exception, which is the withdrawn
question. A Commander presses Copy a second time because they were not sure the first press
worked, and the answer to that is the sentence they did not hear. The rule also muted a copy
that failed and then succeeded, because the export did not change between them, which is the
seventh site in the proposal's table.

Considered and rejected: keep the silence and declare it in the requirement as a second
exception. The requirement would then excuse the case its own scenario "The same thing goes
wrong twice" exists to prevent.

### The accepted import declares the same token as the rest

`slef.presenter.ts` announces `slef.import` from the build revision when a submission commits,
and from the store's request token when it stores or fails. Two counters under one
`(kind, urgency)` is what mutes a stored import after a committed one.

All four import announcements declare `request` from the store token. One submit carries one
token, so the sequence rises once per submission and the branches cannot disagree.

### A refusal announces where it is refused

`OutfittingNotice` announces from an effect over its resolved lines and takes a `revision`
input bound to the build revision. A refusal spends no build revision, so the second one is
silent.

The event is not "these lines are on screen". It is "an edit was refused", and that happens in
`OutfittingStore`. The store announces it and the component draws it. The `revision` input goes
with the bindings in the two notice templates and the workspace template.

It is also the only announcing effect that depends on rendered text, so `untracked` alone would
not reach it. Announcing in the store puts the decision where constitution III puts domain
logic: it does not need a component to have rendered.

The coalescing stays. One accepted import completing four partial rolls is one announcement
naming four, and the store holds the batch that makes it four.

Considered and rejected: a refusal counter on the store, declared by the component. Issue #89
suggests it. It keeps a number whose only job is to defeat a dedupe the event never needed.

### The gate

`scripts/check-interface-foundations.mjs` gains a rule over every `announce({…})` call in
`src/`:

1. No `revision` key.
2. An `announce` call inside an `effect` is inside an `untracked` call.

Rule 1 stops the field returning. Rule 2 stops the reason for it returning.

## Risks / Trade-offs

- **Rule 2 is syntactic and an effect can be written around it.** An announcement reached
  through a helper is not inside a visible `effect`. → Rule 1 makes the failure a repetition
  rather than silence, and a repetition is reported by whoever hears it.
- **A Commander who copies one export twice hears two sentences.** → That is the requirement,
  and the second press is a question that deserves an answer. The manual screen-reader protocol
  reads whether two identical sentences in a row are a nuisance, and the answer changes the
  message rather than the policy.
- **`OutfittingStore` gains two dependencies: the announcement service, which lives under
  `src/app/ui/`, and the localisation layer it resolves messages through.** →
  `SlefPresenter` and `LoadoutImportPresenter` carry both, for the same reason, and both are
  tested without rendering. The service renders nothing.
- **A reader could hear a refusal before the notice is drawn.** → Both come from one state in
  one change-detection pass, and the outlet is a region a reader hears rather than reads in
  place. The manual protocol reads the ordering.
- **Every announcing caller changes in one commit.** The field leaves the type, so the compiler
  names every site. → Each caller's unit suite reads its announcement, and the two journeys
  that were silent are read end to end and by hand.
