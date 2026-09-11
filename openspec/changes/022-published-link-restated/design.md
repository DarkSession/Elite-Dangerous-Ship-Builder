## Context

See proposal.md — Why, for the defect and the window it lives in. What matters here is the shape
of the three moving parts.

`HistoryLocationAdapter` holds the fragment as a signal, set from `hashchange` and from its own
`replaceFragment`. `FragmentPublisher.publish` captures `currentDocument()` before its `await` and
discards a publication whose document changed, which is what stops a finished encode from landing
on a screen the Commander walked to. `BuildLinkCoordinator.listen` watches the same fragment
signal and turns an incoming build link into a build, with `markPublished` telling it which
fragment is the application's own output rather than something to ingest.

The defect slips between them because `LibraryPresence.raise` pushes a history entry at the same
document. The publication's document guard sees no change — path and query are identical — so the
fragment is written, correctly, onto whichever entry is current. That is the layer's. `lower()`
goes `back()` to the workspace's entry, which never received it, and the fragment signal drops to
empty. Nothing republishes: the publisher's effect watches the revision and the loadout, and
neither moved.

The equipment bench's twin is not affected and needs nothing. `LoadoutLinkCoordinator.publish` is
synchronous — it encodes in the calling frame, with no dynamic import and no `await` — so its
fragment is on the address before any layer can be raised over it.

## Goals / Non-Goals

**Goals:**

- The address carries the published link whenever one is published, whatever moved it away.
- An incoming build link still reaches the Commander's build.
- No history entry for a restoration.

**Non-Goals:**

- Changing when a link is published, or what it contains.
- Changing how `LibraryPresence` raises or lowers the layer. It behaves correctly; the address it
  pushes is the one a Commander would copy while the layer is up.
- Closing the window itself by making the codec load eagerly. That would trade a rare wrong
  address for a slower first frame on every visit, and the first frame is 015's.
- Any change to the equipment bench's link.

## Screens

None. This change introduces no screen and alters nothing drawn. The only visible surface it
touches is the address bar, which is not composed from the design system. The feedback a
Commander already gets about their link — published, encoding, refused — is unchanged, because
`link()` is not what was wrong: it said `published` throughout, and the address disagreed with it.

## Decisions

### The restoration belongs to the publisher, not to the library

This is the question the issue was opened for, and the answer is that the library does not ask for
anything.

`LibraryPresence` is a build-library feature. It already states, in its own words, that it must
not reach forward into the features drawn over it, and the ownership checkers under
`scripts/policy/` hold that line. Having `lower()` call the publisher would make the library the
one surface that knows the ship builder publishes a link at all, for a defect the library did not
cause: it pushed the address it was given.

The sequencing is against it too. `lower()` calls `Location.back()`, which does not change the
address before it returns — the fragment arrives with the event. A library asking the publisher to
state the link "after `back()`" would be asking it to wait on an event the library would have to
learn to recognise, and to get the order right every time.

And it fixes one doorway. The address can lose a publication any way history moves; the saved
builds are the one path a Commander walks today. Stating the invariant where the address is owned
covers the next one without being told about it.

So: the publisher watches the fragment, and states its published link again when the address comes
back without it.

Alternative considered: the coordinator's `listen()` effect, which already watches the fragment.
Rejected because that effect is the ingress — it exists to turn what arrives into a build — and
writing the address from inside it would put egress and ingress in one place, where the guard
separating them is `#settled`.

### Only a lost link is restored, never a replaced one

The trigger is narrow on purpose: the published link is stated again when the address carries no
build link — empty, or a fragment belonging to something else. When the address carries a
_different_ build link, nothing is restored; that is an arrival, and the coordinator owns it.

Without the narrowing the two would fight, and the Commander would lose. A pasted link moves the
fragment to another build's value; a watcher that restored on any mismatch would write the open
build back over it, and the pasted link could never be reached. The wide rule is not merely
riskier — it makes navigation by link impossible.

`recognizeBuildLinkFragment` already draws exactly this line, so the watcher asks it rather than
inventing a second answer.

### Restoration is bounded to the document the link was published onto

The same bound publication already keeps, for the same reason: a Commander who leaves the
workspace must not arrive at another screen with a build link stamped on it.

The publisher records the document alongside the fragment it published, in a private field beside
`#token`. It does not go on `link()`: that model is what the application says about the build, and
where the fragment was written is bookkeeping. A restoration checks the current document against
it and does nothing when they differ.

### The restored fragment is marked as the application's own

`markPublished` before `replaceFragment`, exactly as publication does. Without it the coordinator
reads the restored fragment as an arrival and offers to replace the build with itself — which the
`UNCHANGED` path would absorb, but by way of a decode of a build already open.

### A restoration adds no history entry

`replaceFragment` writes with `replaceState`. FR-020 forbids an entry per edit, and a restoration
is less than an edit: it puts back what the address already claimed to hold.

## Risks / Trade-offs

- **The watcher and the ingress could fight.** → They cannot meet: the watcher acts only where the
  address carries no build link, and the ingress only where it carries one. The narrowing is the
  mitigation and is tested in both directions — a lost link restored, a different link left alone.
- **A Commander who deletes the fragment from the address bar by hand gets it back.** → That is
  the requirement rather than a side effect: while a build is open and its link is published, the
  address describes it. Anyone who wants an address without a build closes the build.
- **The window stays open; this closes its consequence.** → A publication landing on a layer's
  entry is still a publication on the wrong entry, and a Commander who copies the address _while_
  the layer is up gets a link to the build, which is the address that entry was pushed to carry
  anyway. What is fixed is that the workspace's own entry no longer stays wrong afterwards.
- **One more effect over the fragment signal.** → It reads two signals and returns without writing
  in every case but the defect's. The publication effect it sits beside runs on every keystroke;
  this one cannot.
- **Coverage was lost when #81 was fixed.** → The two library journeys now wait for the address to
  carry the build, which is right for what they read. This change brings its own reproducing unit
  coverage, driven through the publisher's injectable `encode` so the window can be held open
  deliberately rather than raced against.

## Migration Plan

None. No stored data, no address format and no catalogue key changes. A Commander mid-session
gains the behaviour on the next publication.
