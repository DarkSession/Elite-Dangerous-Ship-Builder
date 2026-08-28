# Screen-reader record: Help, Licences and Provenance

Required by T060, and by the
[accessibility baseline](./screen-inventory.md#accessibility-responsive-and-localisation-baseline):
"the automated axe sweep is a floor. The manual assistive-technology protocol is the proof, and it is
release-blocking until recorded."

This is the record. It states what the protocol asks of this feature, what the automated suite covers
in its place, and — plainly — that no run has been performed.

## The protocol

Feature 011 owns one shared protocol rather than one per feature, so a reader is asked to hear a
whole application rather than a slice of one. This feature's steps are **step 17** of
[`e2e/manual/screen-reader.protocol.md`](../../../e2e/manual/screen-reader.protocol.md), version 8,
and its result rows are the "Help, licences and provenance" section of
[`e2e/manual/results/screen-reader.md`](../../../e2e/manual/results/screen-reader.md).

Step 17 asks a reader to:

1. discover the frame's Help entry from a capability with no build open, in the banner row where
   there is room for it and inside the named action layer where there is not, and hear it announced
   as **Help** at both widths — the banner row draws it as a `?` since 2026-08-26, and this step is
   what proves the mark did not become the name;
2. confirm there is no second help control anywhere else — on any capability, plate, rail or layer;
3. hear one dialog announced by name, with the content behind it unreachable;
4. walk the reference's own three sections in the reference's own order;
5. hear each of the questions as a heading **under** the `FAQ` heading, each answer read with
   its own question;
6. hear `ABOUT` read its purpose, its maintainer and its Almanac provenance as three sentences in
   that order, and then exactly two identity facts, each as its own term and value, with nothing
   said about what kind of build it is;
7. hear the licence summary as four separate claims and then the Frontier notice in the language it
   is actually in, with no sentence anywhere naming that language or the notice's source;
8. find exactly one control in the whole modal — its close — and nothing announced as leaving the
   application or as needing a network;
9. return to the control that opened it, over an unchanged capability.

Three configurations: NVDA/Firefox on Windows, TalkBack/Chromium on an Android phone, and a tablet
run — required here rather than optional, because the shell changes composition between the compact
and medium modes and this feature's entry moves with it.

## Status: not yet executed

**No screen-reader run has been performed against this build.** The rows in the shared results file
are deliberately left empty rather than filled in from the automated suite, which cannot hear
anything.

The reason is the same one feature 011 records for its own rows: this repository's container is
Linux, `guidepup` drives NVDA and VoiceOver from Windows and macOS runners that do not exist here,
and TalkBack has no comparable driver at all. The gap is a missing runner, not a decision that the
judgment does not matter — and it is release-blocking until a run is recorded.

## What is automated in its place

The floor beneath the missing run, and the reason the gap is a gap rather than a hole. All of it runs
in feature 011's ten Chromium and Firefox layout projects unless a line says otherwise.

| The protocol asks                        | Automated evidence                                                                                                                                                                                                           | Where                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Entry discovery, wide and compact        | the frame carries the entry in the banner row and in the action layer, both reach the same single modal, and the banner row's mark is hidden from the accessibility tree while the entry keeps `Help` as its accessible name | `e2e/help-and-licences.spec.ts`, "the compact route the reference draws"     |
| No second help control                   | every capability, package-backed surface and obscuring layer is opened and asserted to embed no legal body and offer no help or legal control                                                                                | same file, "the one destination FR-002 requires", over every ledger row      |
| One dialog, announced by name            | exactly one `dialog[open]`, resolved by its own accessible name                                                                                                                                                              | same file, every journey                                                     |
| Background unreachable                   | the layer is a native `dialog` opened with `showModal()`, asserted to match `:modal`                                                                                                                                         | same file, "keeps every state immediate and textual without motion"          |
| Section order and heading nesting        | the three sections in the reference's order; each question a heading one level under the `FAQ` heading                                                                                                                       | same file, "nests the questions under the FAQ heading rather than beside it" |
| Three sentences, then two identity facts | purpose, maintainer and provenance in that order ahead of the facts; exactly two facts, distinct terms, non-empty values, and no release wording anywhere in the view                                                        | same file, "which artifact a Commander is looking at"                        |
| Answers read with their questions        | every topic, once each, in the declared order, question and answer resolved from the active catalogue                                                                                                                        | same file, "the questions the modal answers"                                 |
| Four summary claims, then the notice     | the four summary lines above a disclaimer byte-identical to a fresh generator extraction of root `LICENSE`                                                                                                                   | same file, "the one legal body the modal embeds"                             |
| The notice in its own language           | the excerpt region carries `lang="en"` while the interface root is `de`                                                                                                                                                      | same file, "sweeps the modal in the other shipped locale"                    |
| One control, nothing that leaves         | exactly one button in the modal, no `a[href]`, no popup, no request to any origin                                                                                                                                            | same file, "the modal offers no way out of the application"                  |
| Structure, names, roles, states          | axe over the closed background and every open state; heading order, target size, document overflow and clipping alongside it                                                                                                 | same file, "the floor beneath every open state"                              |
| Return over an unchanged capability      | route, fragment, history length, build revision, selected slot and stored records all unchanged across open and close                                                                                                        | same file, "the one destination FR-002 requires"                             |

What none of that can do is judge whether a Commander who has only **heard** this modal comes away
knowing what the application is, which versions they are running, and that the game data is
Frontier's while the calculations are the bundled Almanac's. That judgment is the whole point of step
17, and it is what is still owed.

## When a run happens

Append the rows to [`e2e/manual/results/screen-reader.md`](../../../e2e/manual/results/screen-reader.md),
not to this file — one row per configuration and step, with what was actually announced rather than a
paraphrase of what should have been. Then replace the status section above with a reference to the
run, and record any disagreement as a defect here rather than as a wording change made quietly in the
catalogue.
