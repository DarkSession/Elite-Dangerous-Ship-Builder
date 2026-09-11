## Why

A Commander who opens `/ships` directly, on a connection that then loses the screen's code, ends
up with less than the server sent them. The build generates a document for that address, so the
browser paints a readable ship list before any script runs. The application boots, takes over, and
the first navigation fails. The list is gone, and what is left is the shell — the banner, the tool
links and a notice saying the screen could not be opened.

`platform/navigation-waiting`, "A screen that never arrives is stated, not silently abandoned"
(018/FR-007), already states what should happen: "the Commander is left on the readable document
that address served". The failure is
stated, so the first half holds. The second half does not. The scenario below it, for an address
the build generates no document for, describes what a Commander gets today at an address that has
one — and the shell is the right answer only where there is nothing else.

`platform/published-addresses` is not met either. "A takeover that does not complete" (015/FR-012)
requires the Commander to be left with the readable document, and its scenario is "The bundle is
blocked or a chunk never arrives" — which is this.

The takeover is what is wrong. It discards what the address served before any navigation has
presented a screen to replace it, so a navigation that never presents one leaves nothing behind.
That is the contract of `platform/published-addresses`, which owns the generated documents, and
this is where it is fixed. The requirement in `platform/navigation-waiting` stands as accepted.

## What Changes

- The served document is held across the takeover until a navigation presents a screen. Today the
  application adopts the document's content only where a navigation activates a screen over it.
  Where the navigation fails instead, what the address served is kept and stays readable.
- The boundary is the first screen presented, not the first navigation and not a failure. A
  navigation that ends any other way — cancelled with nothing taking over, or replaced by one that
  ends without a screen — leaves the Commander owed the same content.
- At an address the build generates no document for, nothing changes: the shell is what that
  address served, and the shell is what the Commander keeps.
- Held content is the application's own markup, kept as it stands, carrying the language it was
  served in. Nothing is re-rendered, no figure is recomputed and no sentence is written for it —
  including into the committed locale. The catalogue has arrived, because the application is
  running; what is missing is the screen, and the catalogue is applied by rendering one.
- Putting it back is invisible. It lands in the render that would otherwise have removed it, so no
  frame is emptier than the one before it and the invisible takeover keeps its three exceptions
  and no more.
- The application frame gains one state: its `main` holding content the address served. It takes a
  preview and a scan like any other state the frame supports.

The change declares requirement `023/FR-001`:

- **FR-001** What an address served is held until a navigation presents a screen to replace it,
  and is kept where a navigation fails before one is presented.

One thing this change does is not a requirement of its own, because a standing requirement already
carries it: the failure is stated on whatever the Commander is left with. That is
`platform/navigation-waiting`, "A screen that never arrives is stated, not silently abandoned"
(018/FR-007). The delta says nothing about
the statement, so the two cannot drift; what this change alters is what the Commander is left with,
which is the half of that requirement the application does not meet.

`015/FR-011`, "Bundled English, replaced by the committed locale", is modified in the same delta.
Read as accepted it requires the committed locale to replace the text of held content, which the
application cannot do without the screen's code — the thing that failed to arrive.

`015/FR-011a`, "The disclosure beside an untranslated game name", is modified beside it, for the
same reason. It already says a document read in bundled English has nothing to disclose, which is
what held content is, but it also says the disclosure "MUST NOT be suppressed". The boundary
between the two is written into the requirement rather than left for a reader to draw.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform/published-addresses`: gains a requirement that what an address served is held until a
  navigation presents a screen — that a navigation ending any other way leaves the Commander on
  the served content rather than on the shell, that held content is kept as it stands and carries
  the language it was served in, that putting it back is invisible on the same terms as the
  takeover, and that an address that served the shell holds nothing. This is also what makes
  015/FR-012 true at an address with a generated document. In the same delta, "Bundled English,
  replaced by the committed locale" (015/FR-011) is modified to say that the replacement is
  carried by the screen the application presents, so held content stays in the English it was
  served in, and "The disclosure beside an untranslated game name" (015/FR-011a) is modified to
  say that the disclosure belongs to a replacement that lands, so none is written into held
  content.

## Impact

- `src/app/app.config.ts` and a new adapter under `src/app/platform/browser/` gain the hold, beside
  the other adapters that own a piece of the document. It belongs with the takeover it is part of,
  not inside a screen.
- `src/app/ui/components/app-frame/` receives the held content where the outlet stands. Nothing it
  draws changes otherwise.
- `platform/navigation-waiting` is unchanged. Its requirement is already right on what this change
  fixes; what changes is the takeover it describes. One line of its prose reads the document the
  build generates and the document the address served as the same thing, which 015/FR-014 already
  separates for a returning Commander with no network. That is recorded in design.md,
  "Development has nothing to hold", and is not this change's to close.
- `src/app/ui/previews/preview-manifest.ts` gains the frame's held state, which is what keeps the
  state previewed at the three widths (011/FR-004).
- Nothing a Commander sees changes where a navigation presents a screen, which is every navigation
  that is not the defect. No new words, so no catalogue keys.
- `e2e/prerendered-first-frame.spec.ts:496` already holds the failing first navigation in the
  production lane and records at line 575 which half of FR-007 it does not read, and why. This
  change adds that assertion and removes the note.
- An open question this change found and does not answer: offline, a returning Commander is
  answered by the cached shell at an address the build generates a document for (015/FR-014). If
  their first navigation fails, 018/FR-007's scenario expects the document and holding what was
  served gives them the shell. It is recorded in design.md, "Development has nothing to hold". No
  task here depends on the answer, and settling it belongs to `platform/navigation-waiting`
  (constitution IX).
- A gap this change found and does not close: 011/FR-024 requires the automated check to reject a
  component state with no preview, and the check is written per component. A component already
  declared in the preview manifest passes with a state it does not preview, so the held state's
  fixture is read by the preview journey rather than by that check. The checker is the defect
  rather than the requirement, and closing it belongs to `platform/design-system`, which owns
  both. It is recorded here rather than worked around silently (constitution IX).
- `openspec/changes/archive/018-navigation-loading-overlay/` is read and not written to. Its task
  6.3 stands unticked with the reason it carries, which is the record of why the work was deferred;
  this change is where the work is done and where it is recorded.

Closes #90.
