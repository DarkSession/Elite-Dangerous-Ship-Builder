# Manual protocol: screen-reader journeys

**Protocol id**: `screen-reader`
**Covers**: FR-006, FR-007, FR-008, FR-009, FR-010, FR-020, FR-023, FR-025, FR-026, SC-001
**Version**: 6

## What is automated, and what is left

Three layers, and only the third needs a person.

**Structure, names, roles, states and relationships** are automated. `e2e/screen-reader.spec.ts`
asserts the accessibility tree itself — the exact structure a reader walks — with
`toMatchAriaSnapshot`, alongside the named assertions in `e2e/accessibility/assertions.ts` and an axe
scan of every product and preview state in all ten projects. That is what catches a page which
passes every rule and still presents as "button, button, button".

**Actual speech** is automatable but not from this repository's Linux container. `guidepup` drives
NVDA on Windows and VoiceOver on macOS and captures the spoken phrase log, which turns "the reader
said this" into a diff. It needs a Windows runner in CI. TalkBack has no comparable driver, so the
Android configuration stays manual regardless.

**Whether what is said means anything** is a judgment no capture can make. A reader can announce a
correct name, in the correct order, with the correct state, and still leave a Commander unable to
work out what the screen is for. That is what this protocol exists for, and it is one observation
per configuration rather than twelve.

## Configurations to run

| Configuration | Reader                | Browser            | Device                                                                                |
| ------------- | --------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| desktop       | NVDA                  | Firefox            | Windows desktop                                                                       |
| mobile        | TalkBack              | Chromium           | Android phone                                                                         |
| tablet        | TalkBack or VoiceOver | Chromium or Safari | Tablet, whenever composition or interaction differs materially from both of the above |

The tablet run is required whenever the composition differs — the shell changes
between the compact and medium modes, so it does.

## Environment to record

Operating system and version; browser and version; screen-reader name and
version; device and viewport; orientation; the application build's git SHA; the
date of the run.

## Steps

Run each step in each configuration. Record what was actually announced, not a
paraphrase of what should have been. Steps 1-6 and 8 are asserted structurally
by the automated suite: confirm them, and record a row only where a real reader
disagrees or where the announcement is correct but unusable.

1. **Landmark discovery.** List the landmarks with the reader's landmark
   listing. Expect exactly one banner, one main and at most one navigation. The
   shell publishes no contentinfo. Each must be findable and named where it has
   a name.
2. **Heading discovery.** List the headings. Expect exactly one level-1 heading
   naming the current screen, and levels that descend without skipping.
3. **Matching names.** Move through every control. Expect the announced name to
   contain the words visible on screen. A control announced as something other
   than what it reads is a failure even if both are sensible.
4. **State.** For every control that has one, expect the state to be announced:
   selected, expanded, pressed, checked, invalid, busy, disabled. Expect the
   state to change audibly when it changes visually.
5. **Errors and descriptions.** Move to a field with a description and to a
   field with an error. Expect both to be announced with the field, not as
   separate orphaned text somewhere else on the page.
6. **Layer isolation.** Open a layer. Expect the reader to be moved into it,
   expect its title to be announced, and expect content behind it to be
   unreachable — including by landmark and heading navigation. Dismiss it and
   expect to be returned to the control that opened it.
7. **Urgency and deduplication.** Trigger a blocking error. Expect one assertive
   announcement, promptly. Then trigger a settled change. Expect one polite
   announcement that does not interrupt. Repeat the same change without altering
   anything: expect **silence**. Expect unaffected values never to be announced.
8. **Text equivalents.** Find every status, tone, selected state and metric.
   Expect the meaning to be in words. Nothing may be carried by colour, shape,
   position or motion alone.
9. **Language switching.** Open the Language action and choose the other
   language. Expect the interface to change language completely, expect the
   reader to switch voice or pronunciation to match the new root language, and
   expect no fragment of the previous language to remain.
10. **Canonical game text.** Find a game noun the package does not translate
    into the active language. Expect it to be announced in the language it is
    actually in, and expect the untranslated disclosure to be announced with it.
    Then find a value the package cannot supply: expect it to be announced as
    unavailable, never as a raw symbol and never as a zero.
11. **Quick navigation.** Move by heading, by landmark, by form control and by
    the reader's own gestures on touch. Expect every capability to be reachable
    this way.
12. **Touch completion.** On the touch configurations, complete one full journey
    with single touches only. Expect no hover step and no multi-pointer gesture
    to be required.
13. **Cost and materials.** Open a build, engineer one module, and find the
    `COST` and `MATERIALS` blocks. Expect each block to be reachable and named.
    In `COST`, expect all four rows to be announced as label-and-value pairs —
    hull, modules, total, rebuy — with the currency announced, and expect the
    total and the rebuy to be distinguishable by what is said rather than by
    how they look. In `MATERIALS`, expect the blueprint count, every material's
    name, rarity and quantity, and the type and unit totals. Fit a Mercenary
    article and expect its Merc Coin row to be announced by name, not by its
    colour, and never as credits. Expect **no** control anywhere in either
    block: nothing to expand, nothing to activate, nothing to trace.
14. **Hull anatomy.** Open a build and find the `HULL ANATOMY` region. Expect
    each plate to be reachable and announced with the hull's name and which way
    up it is. Move through the mounts: expect each one to be announced as a
    button naming the mount the way the ledger row beside it names it, its kind
    — hardpoint or utility mount — which side it is on, whether it is fitted or
    empty, and whether it is engineered or stock. Expect nothing about a mount
    to depend on its colour, its dashes or where it sits on the hull. Activate
    one and expect the matching ledger row to become selected, and the anatomy
    mount to be announced as pressed; expect **no second reading** of the same
    facts anywhere else on the screen. On `Federation_Corvette`, find
    `Medium Hardpoint 1`, which the package draws on both sides: expect two
    occurrences that differ only in the side they name, and expect selecting
    either to press both. Select an internal mount from the ledger and expect
    nothing on the plates to change. Finally, with the developer tools offline
    or the network disconnected, open a hull whose schematics have not been
    seen: expect each plate to announce that it is temporarily unavailable and
    to offer a retry, expect one announcement per side rather than one per
    mount, and expect the complete ledger to remain fully operable.

15. **Importing and exporting a build.** Find the `IMPORT` action from the
    shipyard, with no build open. Activate it and expect a dialog announced by
    name, with its description read, and the page behind it unreachable. Find
    the payload field: expect its visible label to be announced, and expect the
    one status line to be reachable and to say what the draft measures against
    the limit. Paste something that is not JSON and submit: expect the refusal
    to be announced **once**, expect it to be associated with the field so
    landing on the payload reads it, and expect the field to be announced as
    invalid. Paste a payload the Almanac rejects: expect each diagnostic to be
    announced as five labelled facts — entry, property, code, constraint and
    reason — expect the property path and the code to be read left to right
    even in a right-to-left interface, and expect an untranslated reason to be
    announced in the language it is actually in with its disclosure. Import a
    valid payload: expect one polite announcement naming the hull, expect
    **no** announcement of the payload itself or of the diagnostic list, and
    expect to land in the workspace. Then open `EXPORT`: expect the format list
    to be announced as a group with the selected format's state said in words,
    expect the payload field to be announced as read-only rather than
    unavailable, and expect the entry count and size to be reachable. Activate
    `COPY` and expect one polite announcement of the result — never the payload
    — and expect the same result not to be announced twice. Activate
    `DOWNLOAD` and expect it to be announced as handed to the browser, never as
    saved. Where the platform offers `SHARE`, expect a cancelled share to be
    announced as nothing sent. In every one of these states expect the payload
    to remain reachable and selectable.

16. **A newly published version.** With the application open, have a newer
    version published behind it. A modal layer comes up, announced by name
    (**Updating**), saying that a newer version was published and that this
    session is restarting on it, and saying where the open build lives across
    the restart. Expect that layer to take focus, expect the page behind it to
    be unreachable by heading, landmark or gesture while it stands, and expect
    to find **nothing to press inside it** — no dismiss, no confirm, no "not
    now". The restart is not a question and the layer offers no answer to one.

    Stay on it and expect the page to restart by itself, roughly ten seconds
    in, with nothing having been activated. This is the step that carries the
    cost of excluding WCAG 2.2.1 for this mechanism (constitution V): a time
    limit no reader can extend or turn off. What the exclusion buys is that the
    layer only has to be **read**, not decided on, so what to check is reading
    time — whether ten seconds is enough for the two sentences at the reader's
    own rate and verbosity. If it is not, that is a number to revisit, and
    `UPDATE_OVERLAY_MS` in `src/app/application/updates/application-update.store.ts`
    is where it lives. Record the rate and the setting alongside the verdict.

    The session that comes up says so: expect a notice announced once,
    **Updated**, naming the version now running, and expect it to be findable
    on the page afterwards rather than only having been spoken. It carries a
    named control (**Continue**) that only dismisses the notice. Expect the
    announcement **not** to repeat on the next load of that session.

    Then the state where the restart could not be carried out: the layer is
    gone, and the shell carries a polite notice that a newer version was
    published, beside a named control (**Update now**) with its description.
    Expect the notice to be announced once without interrupting what is being
    read, expect it to stay findable on the page, and expect the control to be
    announced as a button named the way it reads on screen. Expect the notice
    **not** to be announced again when a further version is published behind
    the first.

    Then the unrepairable state, which the shell exposes as an alert rather
    than as a status. Expect the notice to be spoken once as it arrives, expect
    the assertive outlet's summary to be heard as a second, **different**
    sentence rather than the same one again, and expect the two together to
    make clear both what is wrong and what to do about it. This step is the one
    that settles a judgment the code cannot make for itself: whether a `status`
    inserted with its text is reliably spoken and an `alert` is, which is why
    the polite path repeats its notice in the outlet and the assertive path
    does not. `updateStatus` in `src/app/app.ts` chooses the tone, and the
    version effect in the same file's constructor chooses what each outlet
    carries. If a reader disagrees on either half, record the announcement
    verbatim — the split is a decision to revisit, not a rule.

17. **Help, licences and provenance.** From a capability with no build open,
    discover the frame's Help entry: in the banner row where there is room for
    it and inside the named action layer where there is not — and expect to
    find **no** second help control anywhere else, on any capability, plate,
    rail or layer.

    Listen to what the banner row's entry is called. Since 2026-08-26 it is
    drawn there as a `?` rather than as words, so this step is the one that
    proves the mark did not become the name: expect a button announced as
    **Help**, expect nothing announced as "question mark" or as a graphic, and
    expect the action-layer entry to be announced by that same name. If a
    reader announces the glyph, or announces nothing, the mark has taken over
    the name and that is a defect against 012/FR-001, not a preference. Activate it and expect one dialog announced by name, with
    the content behind it unreachable by heading, landmark or gesture.

    Walk the headings inside it. Expect the reference's own three sections in
    the reference's own order — `ABOUT`, `FAQ`, `LICENCE` — and expect each of
    the questions to be a heading **under** the `FAQ` heading rather than
    beside it, so heading navigation reaches the questions as a list of
    questions. In `ABOUT`, expect the purpose, the maintainer and the Almanac
    provenance to be read as three sentences in that order before any fact is
    reached. Then expect exactly two identity facts, each announced as
    its own term and value, and expect the two terms to distinguish which
    version is which without seeing them side by side; expect nothing to be
    said about what kind of build it is. In `FAQ`, expect each answer to be
    read with the question it answers. In `LICENCE`, expect three summary lines
    announced as a list of three separate claims, then the Frontier notice
    announced in the language it is actually in — expect the reader to switch
    voice or pronunciation for it while the interface is in another language,
    and expect **no** sentence anywhere telling you what language it is in or
    where it came from.

    Expect exactly one control in the whole modal: its close. Expect no link,
    nothing announced as leaving the application and nothing announced as
    needing a network. Close it and expect to be returned to the control that
    opened it, with the capability beneath unchanged.

    The judgment this step exists for: whether a Commander who has only heard
    this modal comes away knowing what the application is, which versions they
    are running, and that the game data is Frontier's and the calculations are
    the bundled Almanac's. That is a question about meaning, and no snapshot of
    the accessibility tree can answer it.

18. **Drives & Mass.** Open a build and open the `DRIVES` mode of the anatomy
    region. Expect two regions, each announced by its own heading — thruster
    load and Frame Shift Drive — and expect each heading to carry the fitted
    module's own identity so a Commander knows which mount the figures below it
    belong to, without seeing them side by side.

    In the thruster card, expect the headline mass to be announced with its
    unit and with the load it was weighed at, and expect the position on the
    curve to be announced as a share of the module's optimal mass rather than
    as a bare percentage. Walk the three legend rows: expect each to be
    announced as a name, the canvas's qualifier and a figure with its unit —
    hull with the bulkhead, modules with how many are fitted, fuel with the
    bare word `Tank` and **no** capacity beside it. Expect the bar itself to be
    announced as nothing at all: every part of it is decoration, and its
    meaning is the three figures already read. Then the speed envelope: expect
    all five readings — top speed, boost, pitch, roll and yaw — each announced
    with its own unit, and expect metres per second and degrees per second to
    be distinguishable by what is said.

    Switch the thrusters off through the ledger's own power control and come
    back. Expect the envelope to be replaced by the package's own reasons,
    announced as a named list; expect the card to say the mount is switched off
    rather than absent; and expect **no** speed anywhere — a hull catalogue
    figure standing in here would be announced as an answer and is exactly what
    FR-005 forbids. Expect the curve marks and the drive card beside it to
    survive: what was lost is the build's mobility, not the module's stats.

    In the drive card, expect the three head cells — jump laden, jump unladen
    and mass lock — to be announced as label-and-value pairs, and expect the
    two jump figures to be recognisable as the ends of the three ranges read
    below them rather than as a separate answer. Expect each range row to be
    announced as its load and one figure in light years. Expect the legend
    under them to be announced as three more pairs — optimal mass, fuel per
    jump, total range with the jumps that tank makes. Where the drive is
    Overcharge-capable, expect the badge's meaning to be announced **once**, in
    words, and never as the three letters alone.

    Finally the status rail. Find the `JUMP`, `SPEED` and `MASS` cells: expect
    each to be announced with its unit, expect **no** control among them, and
    expect each to say the same figure the card in the `DRIVES` mode says. Two
    different numbers for one quantity, on one screen, both sounding like
    answers, is the failure FR-009 exists to prevent — and a reader hearing
    them minutes apart is the observation that catches it.

    The judgment this step exists for: whether a Commander who has only heard
    these two cards can say what their ship weighs, how fast it flies, how far
    it jumps, and which of those the application could not answer. Every figure
    here is a number with a unit, qualified by a load and an allocation set
    somewhere else, and whether that survives being spoken in sequence is a
    question no snapshot of the accessibility tree can answer.

## Recording the result

Append one row per configuration and step to `results/screen-reader.md`, with
the expected speech or behaviour, what was actually announced, and pass or fail.
A failure records the announcement verbatim. Do not merge configurations into
one row: what NVDA says and what TalkBack says are different observations.
