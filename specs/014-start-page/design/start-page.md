# Screen: Start Page

**Route**: `''` | **Component**: `src/app/features/start/start.page.ts` |
**Reference**: `.design/Home.dc.html`, artboards `1a` and `1b`

The screen a Commander gets when they open Nav Beacon itself. It states what the product is,
offers the tools it carries, and closes with the notice attached to the material it uses.

## What it composes

| From                   | What                                                                  |
| ---------------------- | --------------------------------------------------------------------- |
| the shell (`app.ts`)   | the tool bar and the action row, unchanged and unaware of this screen |
| `ednb-tool-card` (new) | one per tool                                                          |
| `ednb-legal-excerpt`   | the attribution band                                                  |
| the token layer        | every colour, size, tracking and gap. Nothing is hard-coded           |
| `AppNavigation`        | `catalogue()`, the tools with their copy                              |
| `helpManifest`         | `disclaimer.exactText` and `disclaimer.language`                      |

The page owns its own layout — the masthead stack, the selector grid, the footer band — and
no other visual value.

## Document outline

```text
h1                 home.heading            "TOOLS FOR COMMANDERS"
p                  home.tagline            "A growing set of tools for the galaxy."
region             home.tools.label
  a  (tool card)   tools.ship              subjects, summary | short
  a  (tool card)   tools.equipment         subjects, summary | short
contentinfo        the attribution
```

One `h1`, because this is one screen about one thing. The tool names inside the cards are
not headings: they are the accessible names of links, and a heading inside a link would put
the outline inside the navigation.

## States

The screen has no loading state, no error state and no empty state in practice — the
registry is a source literal, so it is present before the first frame and cannot fail to
arrive. It is still declared:

| State    | What it looks like                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------- |
| default  | the masthead, every tool, the band                                                                    |
| empty    | not reachable: `TOOLS` is non-empty by construction, and R2 keeps it that way. Asserted, not rendered |
| loading  | not applicable: nothing is fetched                                                                    |
| error    | not applicable: nothing can fail                                                                      |
| disabled | not applicable: the screen has no controls of its own                                                 |

`ednb-tool-card`'s own preview declaration carries the five states the component contract
asks for, with a machine-readable reason for the ones its inputs cannot represent.

## Behaviour

- Activating a card navigates to the tool's `href` through the router, and the card is an
  anchor, so a middle-click, a modifier-click and a copied address all behave (FR-006).
- Nothing on this screen is stateful. Leaving and returning draws the same screen.
- Going back from a tool opened here returns here, because the route is a screen rather than
  a redirect that replaced itself in history (FR-007).

## Responsive

The masthead and the selector follow the composition modes; the card's own content follows
them too, because the page decides the form, not the card
(`design/screen-inventory.md`, Composition).

Both description forms are in the document at every width; the stylesheet shows one. At no
width are both visible, and at no width is neither — which is what `e2e/start-page.spec.ts`
asserts at each of the ten projects (FR-019).

## What this screen must not grow

The standing rule, restated for the next person: this screen draws a masthead, a tool
selector and an attribution band. A search field, a recent-builds strip, a news panel, a
"what's new" note, a version line and a language chooser are all things a start page
plausibly wants and none of them is on the canvas. If one is wanted, it goes on the canvas
first.
