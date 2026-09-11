## Why

A build opened into the saved builds before its link is published loses that link from the
address. The workspace comes back with `/outfitting` and no build on it, and stays that way until
the next edit, so the address a Commander would copy or reload opens an empty workspace.

`LibraryPresence.raise` pushes a history entry at the address as it stands. `FragmentPublisher`
reaches its `replaceFragment` only after a dynamic import of the codec and its table and an
encode. Raised inside that window, the layer's entry is the current one when the publication
lands: the fragment is written onto the layer's address, and the workspace's own entry never
receives it. `lower()` returns to that entry with `back()`, and the publisher republishes only
from its effect on the revision and the loadout, so nothing states the fragment again.

The window is one lazy chunk plus one encode. It is short, and a cold or slow connection reaches
it. The build itself is safe — an absent fragment is ignored on ingest — but the address is
wrong, and the application says a published link describes the build that is open.

## What Changes

- The published link is stated again when the address loses it. While a build's link is
  published, the workspace's address carries that link; an address that comes back without one —
  from history, or from anything else that moves the fragment out from under a publication —
  has it restored in place, with no history entry added.
- A link the address _replaces_ is left alone. Only a lost link is restored, never a different
  one: a Commander who pastes or navigates to another build link must reach it, and a restoration
  that fought an incoming link would make the address unreachable.
- Restoration is bounded to the document the link was published onto, exactly as publication
  already is. A Commander who leaves the workspace while a publication is in flight does not
  arrive at another screen with a build link stamped on it.
- Neither the saved-builds layer nor any other feature asks for the restoration. It belongs to
  the capability that owns the address.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ship-builder/build-link`: gains a requirement that the address keeps the published link — that
  a published link lost from the address is stated again in place, that a link replaced by
  another is not, and that restoration is bounded to the document the link belongs to.

## Impact

- `src/app/application/build-link/fragment-publisher.ts` gains the watcher that restores a lost
  link, beside the publication it already owns.
- `src/app/features/build-library/library-presence.ts` is unchanged. This is the design question
  the issue was opened for, answered in design.md: the library does not reach into the build
  link, and the workspace is not the only way an address can lose a publication.
- Nothing a Commander sees changes except the address bar, which now shows what it already
  claimed to show. No new words, so no catalogue keys.
- Two library journeys used to reach this window under load and now wait for the address to carry
  the build before opening the layer, which is correct for what they read. Nothing in the suite
  covers the race any more, so this change brings its own reproducing coverage rather than
  relying on theirs.

Closes #86.
