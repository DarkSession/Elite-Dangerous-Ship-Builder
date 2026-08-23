# Manual protocol: screen-reader journeys

**Protocol id**: `screen-reader`
**Covers**: FR-006, FR-007, FR-008, FR-009, FR-010, FR-020, FR-023, SC-001
**Version**: 2

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

## Recording the result

Append one row per configuration and step to `results/screen-reader.md`, with
the expected speech or behaviour, what was actually announced, and pass or fail.
A failure records the announcement verbatim. Do not merge configurations into
one row: what NVDA says and what TalkBack says are different observations.
