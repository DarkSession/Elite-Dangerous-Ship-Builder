# Screen-reader record: the Equipment Builder

Required by T077, and by the same rule feature 012 records against its own modal: the automated axe
sweep is a floor, the manual assistive-technology protocol is the proof, and it is release-blocking
until recorded.

This is the record. It states what the protocol asks of this feature, what the automated suite covers
in its place, and — plainly — that no run has been performed.

## The protocol

Feature 011 owns one shared protocol rather than one per feature, so a reader is asked to hear a
whole application rather than a slice of one. This feature's steps are **step 19** of
[`e2e/manual/screen-reader.protocol.md`](../../../e2e/manual/screen-reader.protocol.md), version 10,
and its result rows are the "The equipment bench (feature 013)" section of
[`e2e/manual/results/screen-reader.md`](../../../e2e/manual/results/screen-reader.md).

Step 19 asks a reader to:

1. reach `/equipment` from the tool navigation and hear the bench itself — four named regions where
   there is room for them, one tabbed region where there is not;
2. walk the empty bench: the three ledger groups with their counts, the suit row announced as empty
   and required first, every mount announced as locked **in words**, exactly one live choice among
   them, and the grade ladder and the modification slots not reachable at all;
3. choose a suit and hear the bench fill in — the figures restated once, politely, and the ladder
   announced as five choices with the current one selected;
4. hear a mount the worn suit does not carry announced as held with its reason, and a slot the
   current grade does not open announced with the grade it requires;
5. open a chooser, be moved into it, hear it name what is being chosen and for which mount or slot,
   find the fitted entry announced as fitted, and be returned to the control that opened it;
6. hear shield strength, regeneration and firepower as label-and-value pairs with their units, the
   four resistances as a damage type and a figure, and the bars themselves as nothing at all;
7. hear the material total as types and units with the note about what it covers, and hear a loadout
   with no modifications say there is nothing to gather rather than present an empty list;
8. drill into a row at the narrow width, reach the item view under the tab the ledger was under, and
   find the way back announced;
9. hear the export layer's three formats as one named group of three choices, each with its
   sentence, with the text reachable and copy and download announced by what they do;
10. open an address this build cannot read, hear one assertive announcement that it was refused, and
    hear the bench beneath it as unchanged rather than as empty.

Three configurations: NVDA/Firefox on Windows, TalkBack/Chromium on an Android phone, and a tablet
run — required here rather than optional, because the bench changes composition between the wide and
compact arrangements and half of what a reader walks past changes with it.

## Status: not yet executed

**No screen-reader run has been performed against this build.** The rows in the shared results file
are deliberately left empty rather than filled in from the automated suite, which cannot hear
anything.

The reason is the one feature 011 records for its own rows: this repository's container is Linux,
`guidepup` drives NVDA and VoiceOver from Windows and macOS runners that do not exist here, and
TalkBack has no comparable driver at all. The gap is a missing runner, not a decision that the
judgment does not matter — and it is release-blocking until a run is recorded.

## What is automated in its place

The floor beneath the missing run. All of it runs in feature 011's ten Chromium and Firefox layout
projects unless a line says otherwise.

| The protocol asks                         | Automated evidence                                                                                                                                       | Where                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| The bench reached and named               | `/equipment` answers directly, both tools are named in the shell and the open one is marked                                                              | `e2e/equipment-builder.spec.ts`, "the bench has an address of its own"                                                                                |
| The empty bench walkable, one live choice | every region drawn with no suit on it; the gate's grade ladder and slot previews carry `inert` and `aria-hidden`, and are absent entirely where compact  | `src/app/features/equipment/suit-gate/suit-gate.spec.ts`; `e2e/equipment-accessibility.spec.ts`, "a bench with nothing on it says so and stays sound" |
| Figures restated after a choice           | the shields restated when the grade is raised; a fitted weapon counted into the firepower                                                                | `e2e/equipment-builder.spec.ts`, "assembling a loadout"                                                                                               |
| Held mounts say so in words               | the weapon kept on a mount the worn suit does not carry, and the row asserted to read as held rather than to be dimmed                                   | same file, "a mount the worn suit does not carry"; `e2e/equipment-accessibility.spec.ts`, "reads as held, in words"                                   |
| Grade-locked slots say what they require  | the slot holds what is in it, counts nothing for it, and gives it back when the grade returns                                                            | same file, "a slot the grade no longer opens"                                                                                                         |
| Choosers isolated and named               | the chooser is a native `dialog`; the fitted entry marked fitted; a recipe another slot holds refused and still shown                                    | same file, "fitting modifications"; `e2e/equipment-accessibility.spec.ts`, "a loadout, and a chooser open over it"                                    |
| Bars announced as nothing                 | the resistance track is `aria-hidden` with the signed figure in text beside it                                                                           | `src/app/ui/equipment/resistance-bar.spec.ts`                                                                                                         |
| Material total and its empty case         | the total counted on fitting and given back on removal; the empty case stated as words rather than an empty list                                         | `e2e/equipment-builder.spec.ts`, "fitting modifications"                                                                                              |
| The compact drill-in and the way back     | the item view reached under the `LOADOUT` tab and the back control returning to the ledger, in every compact project                                     | `e2e/responsive.spec.ts`, "the equipment bench, responsively"                                                                                         |
| The export layer                          | the three formats offered as one group, each producing its own content, swept by axe while open                                                          | `e2e/equipment-link.spec.ts`, "offers the loadout as an object, a link and a readable summary"                                                        |
| A refused link announced where they are   | the notice stated on the bench, the bench left as it was, and a loadout already on it untouched                                                          | same file, "a loadout link this version cannot read"                                                                                                  |
| Structure, names, roles, states           | axe, ordered heading walk, target measurement, document overflow and clipping over the empty bench, the fitted bench, both choosers and the export layer | `e2e/equipment-accessibility.spec.ts`, "every bench state"                                                                                            |
| Nothing carried by colour or motion alone | RTL mirroring, an expanded translation, doubled text and reduced motion each asserted to lose no reading and move no package digit                       | same file, "the conditions that break layouts"                                                                                                        |

What none of that can do is judge whether a Commander who has only **heard** this bench can say what
they are wearing, what they are carrying, what the bench could not do, and what the next choice in
front of them is. Half of this screen's meaning is which of two dozen small controls is live right
now, and that judgment is the whole point of step 19.

## When a run happens

Append the rows to [`e2e/manual/results/screen-reader.md`](../../../e2e/manual/results/screen-reader.md),
not to this file — one row per configuration and step, with what was actually announced rather than a
paraphrase of what should have been. Then replace the status section above with a reference to the
run, and record any disagreement as a defect here rather than as a wording change made quietly in the
catalogue.
