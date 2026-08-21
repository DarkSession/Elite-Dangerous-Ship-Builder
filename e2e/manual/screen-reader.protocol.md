# Manual protocol: screen-reader journeys

**Protocol id**: `screen-reader`
**Covers**: FR-006, FR-007, FR-008, FR-009, FR-010, FR-020, FR-023, SC-001
**Version**: 1

## Why this is manual

Automation checks whether markup is well-formed and whether names, roles and
relationships exist. It cannot hear what a screen reader actually says, in what
order, or whether what it says means anything. A page can pass every axe rule
and still announce "button, button, button" — so the automated suite is a floor,
and this is the gate.

The keyboard-operation criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
2.4.11 are outside the conformance target. **Screen-reader quick navigation and
gestures are still required**, and are exercised below: they are how a reader
moves through a page, not a keyboard-operation criterion.

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
paraphrase of what should have been.

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

## Recording the result

Append one row per configuration and step to `results/screen-reader.md`, with
the expected speech or behaviour, what was actually announced, and pass or fail.
A failure records the announcement verbatim. Do not merge configurations into
one row: what NVDA says and what TalkBack says are different observations.
