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
and an effect and draws what it drew, and its two wrappers gain an effect that draws nothing.

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
rule 3 holds that shape for every later caller.

`untracked` answers what the effect _reads_. What the effect is _triggered by_ has to be the
event as well, and a signal carrying the event inside a fresh object is not: a computed
returning `{ shown, total }` is a new object whenever anything under it recomputes, and a
reading language recomputes the ship manifest's ordering because it sorts game text through the
locale's collator. So `ship-catalogue.page.ts` tracks the number rather than the object — a
computed over a number compares by value, and only a count that moved re-runs what depends on
it. `build-library.page.ts` already had a number, and needed nothing.

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

What it announces then is the outcome and not a guess at it. A scan that settled on a refusal
says what refused it, in the sentence the panel states it in. Reading the entry list instead
reports every refusal as "Nothing was found to import.", and a file over the size limit was
never opened — saying nothing was found in it states an outcome nobody reached
(constitution IV).

This closes a defect the token hid. `SlefPresenter.scanFiles` announced its outcome after the
await without asking, and read the store's token at that moment rather than the token its own
scan carried. Two scans in flight therefore announced the abandoned outcome and dropped the
current one. `SlefImportCoordinator.scanFiles` now answers whether its scan settled, which is
the fact the presenter needed and the number never carried.

### Where each site lands

| Site                                                    | Declares                                            | Why                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ship-catalogue.page.ts`                                | nothing                                             | Tracks the count as a number, so only a count that moved runs the effect.                      |
| `build-library.page.ts`                                 | nothing                                             | Its count is already a number. The effect runs when it moves, which is the event.              |
| `outfitting-notice.ts`                                  | announces nothing                                   | Its `lines` input is resolved text, so an effect over it is not an event.                      |
| `edit-refusal-notice.ts`, `ingress-refusal-notice.ts`   | nothing                                             | Each holds the refusal itself, which changes once per refusal.                                 |
| `hull-detail.page.ts`                                   | nothing                                             | With the message resolved in `untracked`, the effect runs when an address resolves to no hull. |
| `hull-anatomy.ts`                                       | nothing                                             | Announces at the transition. `#transition` goes with the field.                                |
| `app.ts` navigation failure                             | nothing                                             | The effect runs once per failure.                                                              |
| `app.ts` update notice                                  | remembers the version it announced                  | Its effect watches the overlay as well as the version, so one version can re-run it.           |
| `app-frame.ts` locale fallback                          | nothing                                             | The locale snapshot is the event, and the effect reads nothing else.                           |
| `slef.presenter.ts` delivery                            | nothing                                             | Every delivery is an outcome a Commander asked for.                                            |
| `slef.presenter.ts` accepted, stored and refused import | nothing                                             | A withdrawn submit is its own outcome kind, and no branch announces it.                        |
| `slef.presenter.ts` scan                                | announces the outcome only when the scan settled    | Its outcome can arrive after a second scan started.                                            |
| `loadout-import.presenter.ts` scan                      | announces a scan outcome only when the scan settled | The same two shapes as above.                                                                  |
| `loadout-import.presenter.ts` stored batch              | nothing                                             | The same batch sentence, which said the stored count and never the refusal.                    |

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

None of the three carries a number, and none asks whether its submission is still current. For
the two that open a build that is right by construction: a submit whose question was withdrawn
comes back as `superseded`, which no branch here announces.

The batch is the exception, and it is one on purpose. A Commander who closes the import layer
while several builds are being written still gets the outcome announced, because the outcome is
not a candidate nobody has seen — it is records already in storage. The coordinator says as
much where it refreshes the library: a token issued mid-batch supersedes a build nobody has
seen yet and cannot supersede rows already written. Withholding the sentence would leave a
Commander with saved builds they were never told about, which is a worse silence than the one
the withdrawn-question rule exists to prevent. What the withdrawal does change is the layer,
which stays closed.

One submit reporting two outcomes states both, in one sentence rather than two. A batch that
stores three records and refuses a fourth owes the count and the refusal, and
`ship-builder/slef-exchange` requires each — but the polite outlet holds one event, so a second
announcement published in the same tick writes over the first and a reader hears only what was
said last.

So the stored branch states both counts in one string: "3 builds imported and saved. 1 build
was not saved." Both counts, because 016/FR-010 asks the outcome to say how many builds were
imported, and a reader who hears only the refusal has to go and count the records to learn the
rest of their own answer. Two counts and not a count and a word for the other, because a batch
where every chosen build was refused must not say the rest were saved — nothing was, and
stating an outcome that did not happen is what constitution IV forbids.

This adds three messages per import layer: the refusal sentence in its two counted forms, and
the joiner that puts it after the stored one. The joiner is a message rather than a space in
the code, so a language that separates two sentences differently changes it where every other
wording is changed. The sentence the screen draws for the same batch —
`slef.import.failure.batch.*`, read from the layer — is untouched.

### A refusal is announced by what holds the refusal

`OutfittingNotice` announced from an effect over its resolved lines, and took a `revision` input
bound to the build revision. A refusal spends no build revision, so the second one was silent.

The generic notice announces nothing. Its `lines` input is resolved text, so an effect over it
re-runs whenever a locale is committed, and the number it was given is what stopped that.

The two wrappers around it hold the refusal itself: `EditRefusalNotice` takes an `EditFailure`,
`IngressRefusalNotice` an array of package failures. `OutfittingStore` sets a new failure object
per refusal, and a committed locale touches neither. So each wrapper announces, with its own
input as the trigger and everything the announcement says read inside `untracked`. That is gate
rule 3's shape.

A refusal already standing when the screen opens is the case that needs care. The store holding
it is the application's and the workspace is a route, so a Commander who is refused, looks at
the shipyard and comes back arrives at a screen with the refusal already drawn on it, in
reading order at the top of the workspace. That is initial content, and announcing it would
speak to a reader about something they were told about on their last visit. Removing the
high-water mark un-silenced the genuine second event and this re-mount alike.

`EditRefusalNotice` keeps a first-run guard for it, the same one `ship-catalogue`,
`build-library` and `hull-anatomy` hold. An edit is a Commander pressing a control on a screen
that is already up, so the only way this notice is created with a refusal standing is a
re-visit, and the guard answers exactly that.

`IngressRefusalNotice` cannot use one, because for it the two cases look identical. A record
carrying a roll the package cannot complete is refused inside `RecordOpenService.open`, which
`BuildWorkspacePage` calls from its own constructor and which reports synchronously — so the
notice is created with the refusal already standing and never sees it arrive. A first-run guard
there silences a refusal the Commander just caused, which is the event 011/FR-009 is about.

So the fact moves to where it exists. `ActiveBuildStore.reportIngressRefusal` marks the refusal
unannounced, `ingressRefusalUnannounced` is what the notice watches beside the refusal itself,
and the notice says `announced` once it has spoken so the store can clear the mark. The notice
counts the lines because that is a rule about what is drawn; the store remembers because the
memory has to outlive a component the next visit rebuilds. It is the same shape `app.ts` uses
for the update notice: the caller keeps what it announced, because the policy no longer can.

Only the surface that speaks a refusal clears its mark. `RecordOpenService.open` has a second
caller — the saved builds layer, which draws its own alert over the record that was refused —
and clearing the mark from there looks tempting: the Commander has been told, and arriving at
the workspace afterwards would tell them again. It is wrong twice over. The layer runs while
the workspace may be mounted underneath it, and it clears the mark in the same tick the refusal
is reported, before the notice's effect has run — so the surface that draws every affected
mount is silenced by the surface that named none of them. And a Commander who closes the layer
and goes to the workspace is not meeting initial content there: it is the first thing that
screen has said about a refusal they caused a moment ago. Two surfaces saying one refusal in
their own words is the lesser fault, and the only one of the two that is not a silence.

It also keeps one count in one place. `outfitting.notice.announced` says how many lines there
are to read, and the wrapper that builds the lines is what counts them.

Considered and rejected: announcing in `OutfittingStore`. The refusal is domain, but the
sentence is not — it names a number of rendered lines, which only the component building them
knows. The store would re-derive that rule in a second place and take a dependency on
`src/app/ui/` to do it.

Considered and rejected: a refusal counter on the store, declared by the component. Issue #89
suggests it. It keeps a number that exists only to make the policy treat two refusals as two
events.

The coalescing stays. A batch that refuses four entries is one announcement naming four rather
than four announcements. What the package completed on a build it accepted is not announced
here and is not announced at all (`ship-builder/slef-exchange`, "the normalisation MUST NOT be
reported to the Commander").

### An announcement made under a layer

Four of the seven sites publish while a modal layer stands: the saved builds' match count, the
two import outcomes and the export delivery. `Layer` opens with `showModal()`, and the outlets
are mounted in the shell outside every dialog, so everything outside the open layer is inert —
the outlets included. The application already states this where it matters:
`src/app/app.ts` explains that the restart overlay is the announcement because an announcement
published behind it reaches no reader, and the feedback contract says the same of the update
overlay.

So for those four, this change makes the event reach the outlet. Whether a reader hears it is a
question about where the outlets are mounted, which is 011's architecture and not this change's
to move: a second pair of live regions inside each layer is a design decision with its own
consequences — the application's "exactly two live regions" rule among them — and it belongs to
its own proposal. What is fixed here is the silence that existed at every distance: before this,
the second refusal did not reach the outlet at all, so no placement could have helped it.

The e2e journey and step 22 are worded against what each can judge. The journey reads that the
region takes a node per event; the manual step is where a reader with a screen reader finds out
whether the layer lets them hear it.

### What the archived feedback contract states

`openspec/changes/archive/011-interface-foundations/contracts/feedback-and-semantics.md` names a
mechanism rather than an outcome in two of its rows, and the mechanism is the one this change
removes:

- "Unchanged/replayed event — Stable `(kind, revision, urgency)` identity deduplicates it." The
  outcome stands: a replay is not announced. What holds it is the caller, which does not publish
  one, rather than an identity the policy compares.
- "Stale async outcome — Never announce a result that no longer owns the presented revision."
  The outcome stands: an outcome to a withdrawn question is not announced. What holds it is the
  store that knows whether the question still stands — `SlefStore.isCurrent`,
  `LoadoutImportStore.isCurrent`. A revision was never that fact: a Commander who cancels
  without starting another leaves the highest one where it stands, so a late outcome is behind
  nothing.

The archive is read and not extended, so both rows stay as they are and the resolution is
recorded here (constitution IX). The standing record is
`openspec/specs/platform/accessible-responsive-operation/`, which this change modifies.
`announcement-outlet.ts` cites the same contract section for what does not move: one assertive
outlet, one polite outlet, and no other live region.

### The gate

`scripts/check-interface-foundations.mjs` gains three rules over every `announce({…})` call in
`src/`:

1. No `revision` key.
2. The request is a whole object literal at the call site, spreading nothing into itself. A
   request built elsewhere and handed over carries whatever it was given, and the compiler
   checks a surplus key on a literal rather than on a variable or on what a spread brings in —
   so rule 1 would see nothing.
3. An announcement published from an effect builds its request and calls `announce` inside one
   `untracked` call, and that effect reads the message catalogue inside the same call or not at
   all. A read hoisted out of it takes the catalogue dependency whatever the value was wanted
   for, so the rule does not ask where the value goes: a message wanted for something else
   belongs to an effect that announces nothing. The read is seen whether it is a `message()`
   call or one of the class's own members that holds one.

Rule 1 stops the field returning and rule 2 stops it arriving by another route. Rule 3 is what
keeps a replay silent once the service stops recognising one, so it carries a requirement
rather than a preference.

## Risks / Trade-offs

- **Rule 3 reads syntax, and two shapes are outside what syntax can see.** An announcement
  reached through a helper is not inside a visible `effect`; and a member that reaches the
  catalogue through a private method it calls, rather than in its own initialiser, is not read
  as a resolved one. The two shapes syntax _can_ see, a read for another purpose and a read
  with nothing bound to it, are both rejected. Either could publish one occurrence twice, against the requirement. → The
  unit suite beside each announcing file reads what it publishes, and the manual screen-reader
  protocol reads both journeys. A caller added later without either is the residual gap, and
  rule 3 catches the shape that produced all four of the present ones.
- **A Commander who copies one export twice hears two sentences.** → That is the requirement,
  and the second press is a question that deserves an answer. The manual protocol reads whether
  two identical sentences in a row are a nuisance. If they are, the message changes rather than
  the policy.
- **Two wrapper components announce, and a third does not.** A later notice built on
  `OutfittingNotice` could reasonably expect it to announce, and stay silent. → The generic
  component says so at the top of the file, and each wrapper's own effect names the input that
  is its event. Gate rule 3 catches the shape that would go wrong.
- **Four of the seven sites publish under a modal layer, where the outlet is inert.** A reader
  may not hear an import refusal even now. → Out of this change's reach and stated above. The
  event reaching the outlet is the half that was broken; where the outlets are mounted is 011's
  and wants its own proposal. The manual protocol is what will find it.
- **Every announcing caller changes in one commit.** The field leaves the type, so the compiler
  names every site. → Each caller's unit suite reads its announcement, and the two journeys
  that were silent are read end to end and by hand.
