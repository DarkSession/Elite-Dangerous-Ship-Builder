# Shared Patterns

The patterns more than one screen draws, and where each one lives. FR-001 and FR-005 are the rule
they follow: a screen composes the library, and a pattern a second screen wants is added to the
library before that screen uses it.

## What is a component and what is a mixin

Two kinds of repetition, and they are not fixed the same way.

- An **element tree** drawn twice is a component in `src/app/ui/`. It carries markup, so it carries
  role, name, state and reading order, and those have to be decided once.
- A **declaration body** repeated on markup that differs is a mixin in `src/styles/_responsive.scss`.
  It carries no semantics, so a component would only wrap a plate in a second element and put the
  caller's own children behind a projection boundary.

A pattern that is both is a component. A pattern that is neither — one plate, one screen — stays
where it is drawn.

## Components every screen may compose

| Component           | What it is                                                             | Composed by                                               |
| ------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `ednb-empty-state`  | A heading, an optional sentence and a projected way out                | Build library, ship workspace, hull detail's unknown hull |
| `ednb-layer-footer` | A layer's closing row: a message on the leading edge, actions trailing | Save build, SLEF import, SLEF export                      |
| `ednb-format-layer` | A layer split into a format list and the chosen format's content       | SLEF export, equipment export                             |
| `ednb-waiting-mark` | The waiting mark, and nothing else                                     | Hull artwork, hull schematic, the skeleton                |
| `ednb-skeleton`     | The shape of content that has not arrived, and what it is              | Route chunks, deferred blocks, an incoming build link     |
| `ednb-pip-control`  | The four blocks that set one bank's pips                               | The power rail's pip sets, the distributor table's cells  |

`ednb-pip-control` is the one of the six that is not general: it is feature 005's control, drawn in
two of that feature's own regions, so it lives in `src/app/ui/outfitting/` with the other domain
composites. The rest are foundation components and live in `src/app/ui/components/`.

It is also the one of the six with no preview declaration. A pip block is a control whose whole
reading is its accessible name, and the preview catalogue's expanded-copy sweep requires visible text
on every button it finds. The two regions that draw the blocks sweep them in place instead
(`design/component-preview-catalogue.md`, "What the checker reaches, and what the rule reaches").

### `ednb-empty-state`

A heading, an optional sentence and a projected way out. The way out is projected because it differs
at every call site: a link to the shipyard on one screen, a notice and a link on another, nothing on
a third.

The heading is an `h2` at every call site. On a screen it sits one level under that screen's `h1`; in
a layer it stands beside the layer's own title, which is an `h2` as well. A level of its own would be
one outline decision taken in three places.

Where the block sits is an input with two values. A centred block is the whole screen and centres
itself at every width. A leading one shares its width with something else where there is room, so it
centres itself only below the wide step, where it becomes the whole screen too.

It says what is not there and what to do about it. It never says a screen is empty while the screen
is still finding out — that is a waiting state, and `design/waiting-states.md` owns it.

### `ednb-layer-footer`

`ednb-layer` draws a header and a body. Its footer is a separate component rather than a third slot
because two of the three callers draw the footer inside a component of their own. A slot on the layer
cannot reach into another component's template.

The row is the shared part: the message on the leading edge, the actions on the trailing edge, both
wrapping rather than clipping when the room runs out. The rule above it is an input with three
values, because two of the callers close their body with a rule and one does not.

### `ednb-format-layer`

The layer both export surfaces draw: the formats on the leading edge as a group of cards, the chosen
format's content beside them, one hairline between the two running the height of the panel. Below
the medium step the two stack.

The shell is here because two capabilities draw it. What each format holds stays with the capability
that owns that format.

## Mixins every stylesheet may use

| Mixin                                 | The declarations it owns                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `panel-plate`                         | A bounded plate on the panel ground: the stack, the inset, the ground, the hairline |
| `panel-plate-head($align)`            | The plate's head row: a heading on the leading edge, a note trailing                |
| `toned-block($marker, $ground, $ink)` | A sentence carrying its tone in a leading marker, its ground and its ink            |
| `block-tone($marker, $ground, $ink)`  | One further tone of a block `toned-block` already drew                              |
| `prose-note($colour)`                 | A muted paragraph: prose weight, subdued ink, pretty wrapping                       |
| `bare-list`                           | A list with the browser's markers and indent taken off                              |
| `panel-foot($rule)`                   | The pinned last row of a scrolling column: the raised ground and its hairline       |
| `section-heading($colour, $tracking)` | The micro label a section rule leads with                                           |
| `section-line`                        | The hairline that fills the rest of the section rule's row                          |

`section-rule` stays beside the last two. It draws the same rule as one element with the hairline as
an `::after`, which is the shorter way to write it and the only way that cannot carry a count after
the line. A section that ends in a number uses the two mixins and its own row.

`toned-block` is a mixin rather than `ednb-status-notice`. The notice always draws the tone's name in
words, which is what makes its colour a supplement rather than the carrier. Three blocks use this
mixin, and each one already meets that rule by another route.

- The build status rail draws four tones. Three of them name the severity in a hidden equivalent
  beside the sentence. The fourth is the verdict line, whose own sentence says the build is valid.
- The power shed statements draw one tone. The colour separates nothing, because there is nothing to
  separate it from.
- The defence analysis issues draw one tone, under an unavailable value that has already named the
  absence in words.

Putting any of them through the notice would draw a second name above a sentence that has one, or
need an input that turns the notice's own name off.
