## Why

A Commander who opens `/ships` directly, on a connection that then loses the screen's code, ends
up with less than the server sent them. The build generates a document for that address, so the
browser paints a readable ship list before any script runs. The application boots, takes over, and
the first navigation fails. The list is gone, and what is left is the shell — the banner, the tool
links and a notice saying the screen could not be opened.

`platform/navigation-waiting`, "A navigation that fails" (018/FR-007) already states what should
happen: "the Commander is left on the readable document that address served". The failure is
stated, so the first half holds. The second half does not. The scenario below it, for an address
the build generates no document for, describes what a Commander gets today at an address that has
one — and the shell is the right answer only where there is nothing else.

The takeover is what is wrong. It discards what the address served before any navigation has
presented a screen to replace it, so a navigation that never presents one leaves nothing behind.
That is the contract of `platform/published-addresses`, which owns the generated documents, and
this is where it is fixed. The requirement in `platform/navigation-waiting` stands as accepted.

## What Changes

- The served document is held across the takeover until a navigation presents a screen. Today the
  application adopts the document's content only where the first navigation activates a screen
  over it. Where that navigation fails, what the address served is kept and stays readable.
- The Commander is left on the served content with the failure stated over it, at an address the
  build generates a document for. At an address it generates none, nothing changes: the shell is
  what that address served, and the shell is what they keep.
- Held content is the application's own markup, kept as it stands. Nothing is re-rendered, no
  figure is recomputed and no sentence is written for it. The application does not claim it is
  interactive, and it states no reason for the failure it does not have.
- The hold ends the moment a navigation presents a screen. A screen that arrives replaces what the
  document served, which is what the takeover already does when the first navigation succeeds.

The change declares requirement `023/FR-001`:

- **FR-001** What an address served is held until a navigation presents a screen to replace it,
  and is kept where that navigation fails.

One thing this change does is not a requirement of its own, because a standing requirement already
carries it: the failure is stated on whatever the Commander is left with. That is
`platform/navigation-waiting`, "A navigation that fails" (018/FR-007), which this change makes true
rather than restates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform/published-addresses`: gains a requirement that what an address served is held until a
  navigation presents a screen — that a failed navigation leaves the Commander on the served
  content rather than on the shell, that the hold ends when a screen is presented, that held
  content is kept as it stands rather than rebuilt, and that an address with no generated document
  is unaffected.

## Impact

- `src/app/app.config.ts` and a new platform service under `src/app/platform/` gain the hold. It
  belongs beside the takeover it is part of, not inside a screen.
- `src/app/ui/components/app-frame/` receives the held content where the outlet stands. Nothing it
  draws changes otherwise.
- `platform/navigation-waiting` is unchanged. Its requirement is already right; what changes is
  the takeover it describes.
- Nothing a Commander sees changes where a navigation succeeds, which is every navigation that is
  not the defect. No new words, so no catalogue keys.
- `e2e/prerendered-first-frame.spec.ts:496` already holds the failing first navigation in the
  production lane and records at line 575 which half of FR-007 it does not read, and why. This
  change adds that assertion and removes the note.
- Task 6.3 of `openspec/changes/archive/018-navigation-loading-overlay/tasks.md` is the unticked
  task this closes.

Closes #90.
