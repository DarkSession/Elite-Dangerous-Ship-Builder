## Context

See proposal.md — Why.

The policy is `src/app/ui/announcements/announcement.service.ts`. It keeps one number per
`(kind, urgency)` and drops a request that does not exceed it. That one number answers two
unrelated questions: is this a replay, and is this a late answer to a withdrawn question. The
caller supplies it, and the field is called `revision`.

A third question is answered by the same number without anyone saying so. Six of the nine
announcing sites publish from an effect. An effect re-runs whenever anything it read changes,
and resolving a message reads the message catalogue, so a locale commit re-runs the effect and
republishes the event. Three sites already prevent that by resolving the message in
`untracked`; three do not, and lean on the supplied number to be silent instead.

## Goals / Non-Goals

**Goals:**

- An announcement is heard unless a caller has said why it should not be.
- Each of the three questions is answered by the thing that owns it.
- A caller that gets the policy wrong is heard twice rather than not at all.
- The removed field cannot return one call at a time.

**Non-Goals:**

- No change to what any outlet says, to any message, or to how an outlet renders.
  `SpokenEvent` and `announcement-outlet.ts` are untouched.
- No new urgency and no queue.
- No change to the rule that initial content is silent. Each screen keeps its own first-run
  guard, which is a statement about arrival rather than about dedupe.

## Decisions

### The service counts, the caller states

`AnnouncementRequest` loses `revision`. The service holds a counter and stamps each published
event with it, which is what `SpokenEvent.identity` needs so the outlet can rebuild a region
whose words did not move.

Considered and rejected: keep `revision`, fix the six sites, and add a policy rule against a
literal or a count-shaped expression. It is the smaller diff. It leaves in place the field all
six got wrong, and the rule is syntactic — it recognises the six expressions already found,
not the seventh. The failure it guards against is silence, which reports nothing.

### An effect is not an event

An announcement published from an effect resolves its message in `untracked`. The effect then
depends on the state the event is about, and on nothing else.

This is the finding that shrinks the rest of the design. `hull-detail.page.ts` announces an
unresolvable address from an effect over the resolved view, with the message resolved inside
the effect. A locale commit re-runs it. The literal `1` it supplies is what stops the
restatement, and it stops every later address with it. `app.ts` and `app-frame.ts` already
resolve in `untracked`, and each carries a comment saying why.

With that rule applied, most callers need no declaration at all. The effect runs when the
event happens, and only then.

### Two named declarations, for the two questions that remain

Both are optional. Both are read as a reason for silence, and both are keyed by
`(kind, urgency)`, as the policy's memory already is.

- `request: number` — a monotonic token naming the request an outcome belongs to. An outcome
  whose token does not exceed the highest seen stays silent. This is the present boundary,
  unchanged: an equal token is the same request, and a lower one is older.
- `occurrence: string` — what this outcome reports about its subject. Equal to the last
  announced, it is an identical repeat and stays silent. Anything else is announced.

They are not one field. A token must rise; an occurrence need only differ. A caller given one
field for both meanings would use it for both.

### Where each site lands

| Site                                                      | Declares     | Why                                                                                             |
| --------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `ship-catalogue.page.ts`, `build-library.page.ts`         | nothing      | The effect runs when the count changes, which is the event.                                     |
| `outfitting.store.ts` refused edit, refused import        | nothing      | Announced where the refusal is produced.                                                        |
| `hull-detail.page.ts`                                     | nothing      | With the message resolved in `untracked`, the effect runs when the address resolves to no hull. |
| `hull-anatomy.ts`                                         | nothing      | Already announces at the transition. `#transition` goes with the field.                         |
| `app.ts` navigation failure, update notice                | nothing      | Both already resolve in `untracked`.                                                            |
| `app-frame.ts` locale fallback                            | nothing      | The same.                                                                                       |
| `slef.presenter.ts` import, `loadout-import.presenter.ts` | `request`    | Both hold the token. The behaviour is what it is now, named for what it does.                   |
| `slef.presenter.ts` delivery                              | `occurrence` | The only site that repeats an action on one subject.                                            |

`occurrence` has one caller. That is the measure of how much of the old field's work belonged
somewhere else.

### What a delivery occurrence is

`slef.presenter.ts` deduplicates delivery on the artifact's revision, so a Commander who copies
one payload twice is told once. That is deliberate and it stays. It also mutes a copy that
failed and then succeeded, because the artifact did not change between them.

So the occurrence is the artifact revision **and** what the action reported. A differing
outcome is a differing occurrence, which is the scenario "One action is repeated on one
subject".

### A refusal announces where it is refused

`OutfittingNotice` announces from an effect over its resolved lines and takes a `revision`
input bound to the build revision. A refusal spends no build revision, so the second one is
silent.

The event is not "these lines are on screen". It is "an edit was refused", and that happens in
`OutfittingStore`. The store announces it and the component draws it. The `revision` input goes
with the binding in `outfitting-workspace.html`.

Two capabilities of this change meet here. The store is where the event is, which is
constitution III — the decision to announce is domain logic and does not need a component to
have rendered. It is also the only announcing site whose effect depends on rendered text, so
`untracked` alone would not fix it.

Considered and rejected: a refusal counter on the store, declared as `occurrence` by the
component. Issue #89 suggests it. It keeps a number whose only job is to defeat a dedupe the
event never needed.

The coalescing stays. One accepted import completing four partial rolls is one announcement
naming four, and the store holds the batch that makes it four.

### The gate

`scripts/check-interface-foundations.mjs` gains a rule over every `announce({…})` call in
`src/`:

1. No `revision` key.
2. No `occurrence` that is a literal.
3. An `announce` call inside an `effect` is inside an `untracked` call.

Rule 3 is the one that holds this design. Rules 1 and 2 stop the field returning; rule 3 stops
the reason for it returning.

## Risks / Trade-offs

- **Rule 3 is syntactic and an effect can be written to defeat it.** An announcement reached
  through a helper is not inside a visible `effect`. → The rule reads what it can, and the
  other two rules make the failure a repetition rather than silence. A repetition is reported
  by whoever hears it.
- **`occurrence` can be got wrong the way `revision` was.** A caller passing a value that never
  changes mutes itself again. → It is opt-in, it has one caller, and its value is what the
  action reported, which a reader can check against the words the outlet says.
- **`OutfittingStore` gains a dependency on the localisation layer.** → `SlefPresenter` and
  `LoadoutImportPresenter` already carry it, for the same reason, and both are tested without
  rendering.
- **A reader could hear a refusal fractionally before the notice is painted.** → Both come from
  one state in one change-detection pass, and the outlet is a region a reader hears rather than
  reads in place. The manual screen-reader protocol reads the ordering.
- **Every announcing caller changes in one commit.** The field leaves the type, so the compiler
  names every site. → Each caller's unit suite reads its announcement, and the two journeys
  that were silent are read end to end and by hand.
