## Context

See proposal.md — Why.

The policy is `src/app/ui/announcements/announcement.service.ts`. It keeps one number per
`(kind, urgency)` and drops a request that does not exceed it. The caller supplies that number
in a field called `revision`.

One number answers three questions. Two are stated on the type: is this a replay, and is this a
late answer to a withdrawn question. The third is not stated anywhere. None of the three is a
question the policy can answer from a number a caller hands it.

Seven announcements are published from an Angular effect. An effect re-runs when anything it
read changes, and resolving a message reads the message catalogue, so a reading language
re-runs the effect and publishes the event a second time. Three of the seven resolve the
message in `untracked`: two in `app.ts` and one in `app-frame.ts`. Four do not — the ship
catalogue's count, the saved builds' count, the outfitting notice and the unresolvable address
— and each supplies a number that stays still instead.

That third job is why five of the seven defective sites supply what they supply.

## Goals / Non-Goals

**Goals:**

- An announcement is heard unless a caller has decided it should not be published.
- Each of the three questions is answered by whatever holds the facts to answer it.
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
and an effect, and draws what it drew.

## Decisions

### The service counts, the caller states

`AnnouncementRequest` loses `revision`. The service holds a counter and stamps each published
event with it, which is what `SpokenEvent.identity` needs so the outlet can rebuild a region
whose words did not move.

Considered and rejected: keep `revision`, correct the seven sites, and add a policy rule
against a literal or a count-shaped expression. It is the smaller diff. It leaves in place the
field all seven got wrong, and the rule is syntactic — it recognises the seven expressions this
change found, not the eighth. The failure it guards against is silence, which reports nothing.

### A replay is prevented rather than dropped

The requirement says a replay of one event stays silent, and the service can no longer
recognise one: it publishes what it is given. The obligation moves to the caller, and the
requirement's replay scenario moves with it. It asks what a Commander can observe — the state
an announcement was made from is recomputed, and nothing further is announced.

Two things carry it. An announcement published from an effect resolves its message in
`untracked`, so the effect depends on the state the event is about and on nothing else. Gate
rule 2 holds that shape for every later caller.

`hull-detail.page.ts` shows what this replaces. It announces an unresolvable address from an
effect over the resolved view, with the message resolved inside the effect, so a reading
language re-runs it. The literal `1` it supplies stops that second publication, and stops every
later address with it.

### The caller answers both silences

`AnnouncementRequest` carries `kind`, `urgency`, `messageKey` and `params`. Nothing else. The
service announces what it is given.

The withdrawn question cannot be answered anywhere else. A token names the request an outcome
belongs to, and whether that request is still the one the Commander is waiting for is a fact
the store holds, not the policy: a Commander who cancels a scan without starting another leaves
the policy's highest token where it stands, so a late outcome carrying that token is not behind
anything. The store already answers the question. `SlefStore.isCurrent` and
`LoadoutImportStore.isCurrent` exist for it, and both coordinators call them.

A submit already reports a withdrawn one as its own outcome kind, which no branch announces. A
scan reported nothing, so its coordinator now answers whether it settled and its presenter
announces the outcome only when it did.

This closes a defect the token hid. `SlefPresenter.scanFiles` announced its outcome after the
await without asking, and read the store's token at that moment rather than the token its own
scan carried. Two scans in flight therefore announced the abandoned outcome and dropped the
current one. `SlefImportCoordinator.scanFiles` now answers whether its scan settled, which is
the fact the presenter needed and the number never carried.

### Where each site lands

| Site                                                              | Declares                                            | Why                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ship-catalogue.page.ts`, `build-library.page.ts`                 | nothing                                             | The effect runs when the count changes, which is the event.                                    |
| `outfitting.store.ts` refused edit, refused import, refused batch | nothing                                             | Announced where each refusal is produced.                                                      |
| `outfitting-notice.ts`                                            | announces nothing                                   | Draws the lines. The event is the refusal, not the drawing.                                    |
| `hull-detail.page.ts`                                             | nothing                                             | With the message resolved in `untracked`, the effect runs when an address resolves to no hull. |
| `hull-anatomy.ts`                                                 | nothing                                             | Announces at the transition. `#transition` goes with the field.                                |
| `app.ts` navigation failure                                       | nothing                                             | The effect runs once per failure.                                                              |
| `app.ts` update notice                                            | remembers the version it announced                  | Its effect watches the overlay as well as the version, so one version can re-run it.           |
| `app-frame.ts` locale fallback                                    | nothing                                             | The same.                                                                                      |
| `slef.presenter.ts` delivery                                      | nothing                                             | Every delivery is an outcome a Commander asked for.                                            |
| `slef.presenter.ts` accepted, stored and refused import           | nothing                                             | A withdrawn submit is its own outcome kind, and no branch announces it.                        |
| `slef.presenter.ts` scan                                          | announces the outcome only when the scan settled    | Its outcome can arrive after a second scan started.                                            |
| `loadout-import.presenter.ts`                                     | announces a scan outcome only when the scan settled | The same two shapes as above.                                                                  |

No declaration. Two files ask a question they already hold the answer to, and one remembers what
it said.

### One effect watches more than its own event

`app.ts` announces a waiting version from an effect that reads the update snapshot and whether
the restart overlay stands. The overlay is read tracked on purpose: a restart that could not be
carried out lowers it without moving the state or the version, and the notice left on the shell
is the one thing telling a reader the session is behind. So the effect must run when the
overlay comes down.

That makes one version able to re-run the effect. `untracked` does not reach it, because the
trigger is not the message catalogue. The caller remembers the version it announced and does
not announce it again, which is the same rule the other callers keep by depending only on their
own event.

It is the one site where the removed field was doing work that neither `untracked` nor a store
already does.

### Every delivery is announced

`slef.presenter.ts` deduplicates delivery on the export's revision, so a Commander who copies
one payload twice is told once. That silence goes.

Two presses are two events, and the requirement excuses only the withdrawn question. A
Commander presses Copy a second time because they were unsure of the first press. The second
sentence answers the second press. The same rule muted a copy that failed and then
succeeded, because the export did not change between them, which is the seventh site in the
proposal's table.

Considered and rejected: keep the silence and write it into the requirement as a second
exception. The requirement would then excuse the case its own scenario "The same thing goes
wrong twice" exists to prevent.

### The three import outcomes stop counting

`slef.presenter.ts` announces `slef.import` from the build revision when a submission commits,
and from the store's request token when it stores or fails. Two counters under one
`(kind, urgency)` is what mutes a stored import after a committed one.

None of the three carries a number. Each asks whether its submission is still current and
announces if it is, so one submit reporting two outcomes states both — a batch that stores
three records and refuses a fourth owes the count and the refusal, and
`ship-builder/slef-exchange` requires each.

### A refusal announces where it is refused

`OutfittingNotice` announces from an effect over its resolved lines and takes a `revision`
input bound to the build revision. A refusal spends no build revision, so the second one is
silent.

The event is not "these lines are on screen". It is "an edit was refused", and that happens in
`OutfittingStore`. The store announces it and the component draws it. The `revision` input goes
with the bindings in the two notice templates and the workspace template.

It is also the only announcing effect that depends on rendered text, so `untracked` alone would
not reach it. Announcing in the store puts the decision where principle III puts domain logic:
it does not need a component to have rendered.

The coalescing stays. A batch that refuses four entries is one announcement naming four rather
than four announcements, and the store holds the batch that makes it four. What the package
completed on a build it accepted is not announced here and is not announced at all
(`ship-builder/slef-exchange`, "the normalisation MUST NOT be reported to the Commander").

Considered and rejected: a refusal counter on the store, declared by the component. Issue #89
suggests it. It keeps a number that exists only to make the policy treat two refusals as two events.

### The gate

`scripts/check-interface-foundations.mjs` gains a rule over every `announce({…})` call in
`src/`:

1. No `revision` key.
2. An announcement published from an effect builds its request and calls `announce` inside one
   `untracked` call. Resolving any part of the request outside that call reads the message
   catalogue from the effect, which is the shape the rule exists to reject.

Rule 1 stops the field returning. Rule 2 is what keeps a replay silent once the service stops
recognising one, so it carries a requirement rather than a preference.

## Risks / Trade-offs

- **Rule 2 reads syntax, and an announcement reached through a helper is not inside a visible
  `effect`.** Such a caller could publish one occurrence twice, against the requirement. → The
  unit suite beside each announcing file reads what it publishes, and the manual screen-reader
  protocol reads both journeys. A caller added later without either is the residual gap, and
  rule 2 catches the shape that produced all four of the present ones.
- **A Commander who copies one export twice hears two sentences.** → That is the requirement,
  and the second press is a question that deserves an answer. The manual protocol reads whether
  two identical sentences in a row are a nuisance. If they are, the message changes rather than
  the policy.
- **`OutfittingStore` gains two dependencies: the announcement service under `src/app/ui/`, and
  the localisation layer it resolves messages through.** → `SlefPresenter` and
  `LoadoutImportPresenter` carry both, for the same reason, and both are tested without
  rendering. The service renders nothing.
- **A reader could hear a refusal before the notice is drawn.** → Both come from one state in
  one change-detection pass, and the outlet is a region a reader hears rather than reads in
  place. The manual protocol reads the ordering.
- **Every announcing caller changes in one commit.** The field leaves the type, so the compiler
  names every site. → Each caller's unit suite reads its announcement, and the two journeys
  that were silent are read end to end and by hand.
