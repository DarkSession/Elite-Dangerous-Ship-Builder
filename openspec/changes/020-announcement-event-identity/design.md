## Context

See proposal.md — Why. The policy is `src/app/ui/announcements/announcement.service.ts`. It
keeps one number per `(kind, urgency)` and drops a request that does not exceed it. That one
number does two unrelated jobs: it recognises a replay, and it recognises an outcome that
arrived after its source moved on. Callers supply it, and the field is called `revision`, so
a caller supplies whatever revision is nearest — a filtered row count, the build revision, a
literal. A wrong value is silence, and silence reports nothing.

Three callers already do it correctly, and each carries a comment explaining why the obvious
number would not work. Three comments saying the same thing is the shape of a contract that
is not being carried by the type.

## Goals / Non-Goals

**Goals:**

- An announcement is heard unless a caller has said, in terms, why it should not be.
- The two reasons for silence are separately expressible, so a caller that needs one does not
  inherit the other.
- A caller that gets the policy wrong is heard twice rather than not at all.
- The removed field cannot return one call at a time.

**Non-Goals:**

- No change to what any outlet says, to any message, or to how the outlet renders. `SpokenEvent`
  and `announcement-outlet.ts` are untouched.
- No new urgency, no queue, and no change to the rule that initial content is silent. Each
  screen keeps its own first-run guard; that is a statement about arrival, not about dedupe.
- Not a general event bus. `announce` stays a single call with a single answer.

## Decisions

### The service counts, the caller states

`AnnouncementRequest` loses `revision`. The service holds its own counter and stamps each
published event with it, which is what `SpokenEvent.identity` needs so the outlet can rebuild
a region whose words did not move.

Considered and rejected: keeping `revision` and fixing the six callers, with a policy rule
rejecting a literal or a count-shaped expression. It is the smaller diff and it follows the
three sound callers already in the tree. It leaves the field that all six got wrong in place,
and the rule is syntactic — it recognises the six expressions we have already found and not
the seventh. The failure it guards against is silent, so nothing else would find it.

### Two named declarations replace one number

Both are optional and both are read as a reason to stay silent.

- `request: number` — a monotonic token naming the request an outcome belongs to. An outcome
  whose token is below the highest seen for its kind is a late answer to a question nobody is
  asking, and stays silent. This is what `SlefStore.requestToken` and
  `LoadoutImportStore.requestToken` already are.
- `occurrence: string | number` — which occurrence of a recurring condition this is. Equal to
  the last announced for its kind, it is a restatement and stays silent; anything else is a new
  occurrence and is announced.

A caller that has an event at the moment it calls declares neither. That is most of them.

Why two and not one: the SLEF import flow needs the first and the locale fallback needs the
second, and a caller given one field would use it for both meanings. They are also opposite in
shape — a token must rise, an occurrence need only differ — and one field cannot be both.

### `occurrence` is the outcome, not the subject

`slef.presenter.ts` deduplicates delivery on the artifact's revision today, so a Commander who
copies one payload twice is told once. That is deliberate and stays. What it also does is mute
a copy that failed and then succeeded, because the artifact did not change between them. The
occurrence a delivery declares is therefore the artifact revision **and** what the action
reported, so a differing outcome is a differing occurrence.

### What makes an effect run is not what makes an event distinct

An announcement published from an effect needs a signal that moves when the event happens, or
the effect does not run a second time and the policy never sees the second event at all. That
signal is a trigger. Whether the second event is a new one is a separate question, and it is
the one the policy answers.

Conflating the two is how the class was written: a caller looked for one number to serve both,
found the nearest one, and the nearest one was a measurement. `NavigationWaitingStore.failures`
is the trigger for a second failed navigation and stays exactly as it is; what it stops doing
is standing in for the policy's answer as well.

### Where each caller lands

| Caller                                                    | Declares                                            | Why                                                                                                                                                                                                             |
| --------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ship-catalogue.page.ts`, `build-library.page.ts`         | nothing                                             | Each publication follows a filter change the Commander made.                                                                                                                                                    |
| `outfitting-notice.ts`                                    | nothing                                             | The announcement moves to the moment the refusal is produced — see below.                                                                                                                                       |
| `hull-detail.page.ts`                                     | `occurrence`: the hull symbol the address named     | Published from an effect over the resolved view. Two unresolvable addresses are two occurrences; the same one re-resolved is not.                                                                               |
| `slef.presenter.ts` import, `loadout-import.presenter.ts` | `request`                                           | Already hold the token. Unchanged behaviour, named for what it does.                                                                                                                                            |
| `slef.presenter.ts` delivery                              | `occurrence`: artifact revision and reported result | Above.                                                                                                                                                                                                          |
| `app-frame.ts` locale fallback                            | `occurrence`: the snapshot revision                 | Published from an effect over the snapshot; a re-render is not a second fallback.                                                                                                                               |
| `app.ts` update notice                                    | `occurrence`: the waiting version                   | One announcement per version, from an effect over it.                                                                                                                                                           |
| `app.ts` navigation failure                               | nothing                                             | `NavigationWaitingStore.failures` stays, and stays a count: it is the only signal that moves on a second failure, so it is what makes the effect run twice. What goes away is handing it to the policy as well. |
| `hull-anatomy.ts`                                         | nothing                                             | Already announces at the transition. `#transition` goes with the field.                                                                                                                                         |

### A refusal announces where it is refused

`OutfittingNotice` announces from an effect over its resolved lines, and takes a `revision`
input that the workspace binds to the build revision. A refusal spends no build revision, so
the second one is silent — issue #89.

The fix is not a better number. The component announces because it is the thing that holds the
lines, but the event is not "these lines are on screen", it is "an edit was refused", and that
happens in `OutfittingStore`. The store announces it, the component draws it, and the
`revision` input goes away with the binding in `outfitting-workspace.html`. This is
constitution III: the decision to announce is domain logic and does not need a component to
have rendered.

The coalescing stays where it is. One accepted import completing four partial rolls is one
announcement naming four, and that is a property of the batch the store already has in hand.

Considered and rejected: a refusal counter on the store, declared as `occurrence` by the
component. It works, and issue #89 suggests it, but it keeps a number whose only job is to
defeat a dedupe the event never needed.

### The gate

`scripts/check-interface-foundations.mjs` gains a rule over every `announce({…})` call in
`src/`: no `revision` key, and `occurrence` may not be a literal. Fixtures go beside it in
`scripts/check-interface-foundations.test.mjs`, including the constructs the rule must not
mistake for a violation — a `revision` key in an unrelated object literal, and an
`occurrence` that is a template string over a signal read.

## Risks / Trade-offs

- **`occurrence` can be got wrong the way `revision` was.** A caller passing a value that never
  changes mutes itself again. → It is opt-in, so a caller who has not thought about it does not
  have it; it is named for what it is rather than for a number; four callers use it and each
  one's value is a thing the reader can check against the event; and the checker rejects a
  literal. The failure mode of the default path is now a repetition, which a reader notices and
  reports.
- **Moving the refusal announcement into `OutfittingStore` puts an announcement in a store.**
  The store is framework-agnostic and tested without rendering, and `AnnouncementService`
  resolves messages, so the store gains a dependency on the localisation layer. → It is the
  same dependency `SlefPresenter` and `LoadoutImportPresenter` already carry, for the same
  reason, and both are tested without rendering.
- **Announcing at the moment of refusal changes when the outlet speaks relative to when the
  page draws.** A reader could hear the refusal fractionally before the notice is painted. →
  The notice is rendered from the same state in the same change detection pass, and the outlet
  is a live region a reader hears rather than reads in place. The manual screen-reader protocol
  reads the ordering.
- **Every announcing caller changes in one commit.** There is no way to take this in halves:
  the field is removed from the type, so the compiler names every site. → The unit suite for
  each caller reads its announcement, and `announcement.service.spec.ts` reads the policy
  directly. The end-to-end matrix and the manual protocol read the four journeys that were
  silent.
