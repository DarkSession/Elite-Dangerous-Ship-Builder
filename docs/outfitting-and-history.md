# Outfitting, ingress and session history

Three boundaries meet in the outfitting workspace, and each of them is easy to cross by accident.
This is where they are written down: what owns the build, what may see a modelled checkpoint, and
what is deliberately not kept.

## The one active build

Feature 001 owns the committed `ShipLoadout`. Feature 002 holds no second copy of it and never edits
the one on screen.

Every Commander decision runs the same round trip, in
[`build-edit-transaction.ts`](../src/app/domain/outfitting/build-edit-transaction.ts):

1. capture the current build as a modelled snapshot;
2. rebuild a **detached** candidate from that snapshot, through the package;
3. run exactly one package operation on the candidate;
4. compare the result with the snapshot, and install it only if it actually changed.

The active build is never the thing being edited, so a package refusal cannot leave it partly
modified — there is nothing to roll back, because nothing was ever rolled forward. The same applies
to the two fields the package publishes read-only, the ship's name and its ID plate: they are edited
in the snapshot and the build is rebuilt from it (`runSnapshotTransaction`), which is the same round
trip by a different door.

A command that changes nothing spends no revision and records no history frame. That is decided by
comparing modelled snapshots rather than by trusting an operation to report a no-op, because setting
a priority to the value it already has is a package call that succeeds and changes nothing.

## Ingress: what a build must survive to become the active one

Anything arriving from outside — a stored record, a decoded link, later an imported capture — passes
through [`build-ingress-normalizer.ts`](../src/app/domain/build/build-ingress-normalizer.ts) before
it can replace the build on screen. It answers in exactly two ways:

- **normalized**: every partial engineering roll the package could complete was completed to
  quality 1, and each completion is reported as a notice naming the mount, the module and the quality
  it arrived at;
- **refused**: at least one partial roll could not be completed. Nothing is activated, the build on
  screen is untouched, and the refusal names every affected mount and the package's own reason.

There is no third answer and no partial activation. A refused candidate never becomes the active
build, which is why a refusal leaves the session's history intact: nothing replaced anything.

## Session history

The tape is [`session-edit-history.ts`](../src/app/domain/outfitting/session-edit-history.ts): a
plain value with `past`, `future` and a capacity of exactly 100, holding modelled checkpoints and an
unformatted summary key with scalar parameters.

- **One decision is one frame.** A recipe, a grade and an effect confirmed together are one
  decision; a refusal, a no-op, package fixed-mount defaulting and a completed partial roll are none.
- **Every transition is a proposal.** `undo` and `redo` return where to restore to and the tape that
  would follow; the store installs neither until the package has actually rebuilt the checkpoint. A
  restore that fails therefore consumes no frame, by construction rather than by rollback.
- **Restoring recomputes.** A checkpoint carries decisions, never results: mass, cost, validation and
  every calculated figure are read again from the package over one build revision.
- **Summaries are keys.** The tape holds `outfitting.history.remove` and a slot key, not the sentence
  "Empty Hardpoint 1". A Commander who changes language mid-session reads their own history in the
  language they are reading now, and no game text is retained.

## What is deliberately not kept

| Not kept                      | Why                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| The tape, after a reload      | It is the record of one session's decisions. Nothing serializes it and nothing restores it.                         |
| The tape, after a replacement | A build that replaced this one makes the decisions on the tape decisions about a build that is no longer on screen. |
| Historical purchase values    | A restored build is priced at the current catalogue, never at what a module cost when it was fitted.                |
| Calculated results            | They follow from the decisions; keeping them would let a checkpoint disagree with the package that produced it.     |
| Capture conditions            | Fuel, cargo and hull condition are not modelled decisions, so they are not restored ones either.                    |
| Viewing state                 | Selection, category, search text and an open draft are what a Commander is looking at, not what they have done.     |

## Boundary isolation

These accept no history value, and the check that says so is
[`outfitting-ownership.mjs`](../scripts/policy/outfitting-ownership.mjs):

- the local record and `BuildSnapshotV1` serializers;
- the compact build-link codec;
- the SLEF serializer;
- Angular's Router and the browser's own history.

Autosave and fragment publication observe the **active build** after an undo or a redo exactly as
after any other edit. They are told nothing about the tape, which is why a step back publishes the
link the restored build encodes to and adds no browser history entry.

The same checker enforces the other half of the ownership rule inside feature 002's source: Almanac
imports are leaf subpaths, components import no package values, no stylesheet writes a colour or a
pixel length, no file names a package module symbol, and nothing writes an engineering field
directly.
