# Contract: Feedback and Semantics

## Application structure

- Every product route appears within one application frame with a banner/header, primary navigation
  where present, one route-owned `main`, one visible `h1` and ordered descendant headings.
- Context actions retain visible text in wide layouts. Compact overflow opens a named action layer in
  which every action again has visible text; an ellipsis or question mark is not the sole name.
- Repeated data uses a semantic list, table or grouped control matching its relationships. A
  clickable container never swallows independent nested controls.
- A meaningful visualization has a named text equivalent and correlation to the underlying values.
  The anatomy image, bars and nodes in the reference are redundant views, never sole information.
- Dialogs/sheets/full-height layers have a visible associated title and description where needed.
  While active, background content is inert and excluded from the accessibility tree; dismissal
  restores the invoking context.

Keyboard-operation criteria are constitutionally excluded, but that exclusion does not weaken
screen-reader names, roles, state, relationships, reading order or native semantics.

## Controls and value relationships

- Prefer native button, link, input, select, textarea, radio, checkbox/switch, disclosure and dialog
  semantics. Tabs, listboxes and custom choices use shared audited components only when native
  elements cannot express the relationship.
- Each visible label is programmatically related to its control; placeholders and `title` are never
  labels. Accessible name normalizes to the visible name.
- Selected, expanded, pressed, checked, invalid, busy, disabled and current state is exposed whenever
  the component contract can hold it.
- Descriptions, errors, units, viewing conditions, unavailable reasons and untranslated disclosure
  are programmatically related to the relevant control/value.
- Blocking validation prevents only the affected commit. It leaves the error and unrelated content
  present until the Commander resolves or dismisses the operation.

## Text equivalence

Color, icon, shape, location, order, line style, bar length and animation cannot carry sole meaning.
Every carrier has visible or associated text naming the state and value. Decorative graphics are
hidden from assistive technology. Informative images have a complete alternative or point to the
equivalent semantic data. Technical identifiers and directional punctuation are bidi-isolated
without changing their content.

## Visible feedback and announcements

Visible status, notice and error content remains ordinary semantic content. The frame owns one hidden
assertive outlet and one hidden polite outlet. It never makes a whole metrics panel live.

The visible region carries every notice that is standing, not the first of them. A language that
could not be loaded and a newer version waiting to be applied are independent facts about one
session, and a region that showed one behind the other would drop whichever arrived second without
saying so.

| Event                            | Outlet    | Contract                                                                                                                                                                    |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New blocking error               | assertive | Publish one localized bounded summary promptly                                                                                                                              |
| Settled nonblocking change       | polite    | Coalesce to one localized summary for the committed source revision                                                                                                         |
| Initial render                   | none      | Content is discoverable in reading order, not announced as a change                                                                                                         |
| Unchanged/replayed event         | none      | Stable `(kind, revision, urgency)` identity deduplicates it                                                                                                                 |
| Stale async outcome              | none      | Never announce a result that no longer owns the presented revision                                                                                                          |
| Unaffected values                | none      | Do not repeat surrounding content                                                                                                                                           |
| Newer version published          | none      | The modal overlay is the announcement: it takes focus and makes the outlet, which is inside the frame, inert                                                                |
| Restart could not be carried out | polite    | One localized summary per version revision, at the moment the overlay comes down and a reader can reach the outlet; a further version behind it is not a second event       |
| Unrepairable cached version      | assertive | Publish one localized summary promptly; it supersedes a waiting version. The visible notice is an alert in its own right, so the outlet summarizes rather than repeating it |

Visible feedback and announcement events are separate projections. Removing translated outlet text
during a locale switch does not replay old events. A genuinely new event afterward resolves with the
new effective locale. Auto-dismiss timing cannot be the only route to reading or acting on feedback.

## Conformance wording

The interface states no conformance target. FR-015 is a prohibition, not an obligation to publish: it
constrains how a claim is phrased wherever one is made, and the product makes none. The project
documents that do state it use one wording:

> WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

An unqualified product/documentation claim fails the policy check. The checker scopes claims to
application/documentation statements and does not flag the constitution/spec passages that define
the rule itself.
