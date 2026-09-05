# Waiting States

What a screen draws between asking for something and having it. FR-029 is the rule. This record
accounts for every wait in the application.

## The two components

`ednb-waiting-mark` draws the waiting mark and nothing else. It draws one image, hidden from a
reader, and holds the path to it, so no screen has to know where the file is. Use it for a wait that
already has a place of its own, such as a fixed-ratio plate with a picture on the way.

`ednb-skeleton` draws the shape of content that has not arrived: bars that hold the space the content
will take, the waiting mark above them, and a sentence a reader gets. Use it for a wait that would
otherwise leave a blank region.

Both stand where the content will be. Neither stands in a corner, and neither covers the screen.

## Text, and what is read

The skeleton's bars are hidden from a reader. Its sentence is not: the region carries words for what
is pending, so the shapes supplement a sentence rather than stand in place of one.

The region is a `status`. A live region is read when its content changes, and this one is mounted
with its sentence already in it, so the reading a Commander gets is the one they reach rather than
one the region is relied on to make. The words are the promise here; the announcement is not.

The region carries no `aria-busy`. An assistive technology holds a live region marked busy until the
flag drops, and this region exists only while the wait is on. The flag would suppress any reading of
it at all.

The waiting mark carries no words of its own. A screen that draws it has its own sentence: the hull
illustration describes its picture, and the schematic describes its plate. A second region here would
state the same fact twice. This is the feedback contract's rule of one event and one notice, applied
to a state.

## Motion

The waiting mark is the only thing that moves. The skeleton's bars hold still. A bar that pulsed
would state a second time what the mark above it states, and one animation is one thing to stop.

The application's own reduced-motion rule cannot reach the mark. The mark is an SVG loaded through
`img`, which makes it a separate document that this application's stylesheet does not style. The mark
therefore carries its own reduced-motion rule inside the file. The file is an EDAssets mark under
CC BY-NC-SA 4.0, and that rule is an adaptation of it. Root `LICENSE` records the adaptation.

## Every wait, and what it draws

| Wait                                    | What is on the way                                      | What the Commander sees                                            |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| First arrival at any address            | The route's own chunk                                   | A page skeleton inside the frame, where the screen will be         |
| First arrival at a hull's own address   | The catalogue chunk and the hull-detail chunk, together | A page skeleton, until the screen is drawn                         |
| The first hull opened from the manifest | The hull-detail chunk                                   | A skeleton in the inspector, where the hull will be                |
| The exchange block, first opening       | The SLEF codec and both layers                          | A layer holding a skeleton, once the wait is perceptible           |
| The library block, first opening        | The library layer                                       | The same                                                           |
| A build link arriving with the page     | The link codec and its table                            | A skeleton where the build will be, and a sentence naming the link |
| A hull illustration                     | The picture                                             | The waiting mark on the reserved plate, and the plate's sentence   |
| A hull schematic                        | The mount geometry the marks are placed from            | The waiting mark on the plate, and the plate's own sentence        |

`/ships/:hull` is a child address, so a cold arrival there fetches two chunks. The router asks for
both at once and activates the screen when both have arrived. The page skeleton is raised by the
first fetch and lowered when the navigation ends, which is after the screen is created. It therefore
stands for the whole of that wait — across both chunks, and across the gap between the last one
landing and the screen being drawn. A navigation that is cancelled or fails lowers it too, so a chunk
that never arrives is a wait that still ends.

The inspector draws no second skeleton on that arrival. It cannot: the router resolves the catalogue
and the hull together, so the catalogue does not exist to draw anything while its own chunk is on the
wire. The page skeleton is the whole of what a cold arrival shows.

Opening a hull from the manifest is the inspector's own case. The manifest is already drawn, the
hull's screen is a chunk of its own, and the skeleton holds the rail for that fetch. The rail reads
the fetch the router reports rather than the screen that has not arrived: the screen is what writes
the symbol the rail is otherwise keyed on, so a rail keyed on the symbol would be empty for exactly
as long as the wait it is meant to describe. Every hull after the first draws nothing, because the
chunk is fetched and the router reports no fetch.

A route chunk that is already loaded draws nothing. The router reports only a chunk it must fetch,
and the skeleton stands only while the frame has never held a screen. The router takes the old screen
out and puts the new one in inside one step, so a frame that has held a screen holds one from then
on. A move between two screens therefore keeps the screen a Commander is reading until the next
screen is ready.

The two deferred blocks wait 200 milliseconds before they draw, and then hold what they draw for 400
milliseconds. A Commander does not perceive a wait shorter than the first figure. A layer that
appeared and closed inside one frame would be harder to read than a press that takes a moment.

## What draws no waiting state, and why

- **A language catalogue.** The application starts on complete bundled English and commits the other
  language in one step. Nothing is missing, and a skeleton would replace text a Commander can already
  read.
- **Icons and marks.** These are sized in the document, prefetched by the service worker, and
  decorative. A placeholder would be the only thing that ever moved them.
- **Saving, exporting, importing and choosing a candidate.** Each of these already carries a named
  status of its own. Exporting states `Preparing this export` in a loading notice, saving reports its
  own outcome, and a candidate list names its own loading state. A second waiting state over any of
  them would state one fact twice.
