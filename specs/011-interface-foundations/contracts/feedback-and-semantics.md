# Contract: Feedback and Semantics

## Application structure

- Every product route composes one application frame with a header/banner, primary navigation where
  relevant, exactly one route-owned `main`, one visible `h1` and ordered descendant headings.
- Repeated collections use lists, tables or grouped controls according to their relationships; a
  clickable container never wraps independent nested controls.
- Dialogs/layers have associated visible title/description and make background content inert and
  absent from the accessibility tree while active.

## Controls and relationships

- A control's accessible name matches its visible name. Iconography may supplement but not replace
  the visible name.
- Prefer native button, link, select, input, radio, checkbox/switch, disclosure and dialog semantics.
- Labels, descriptions, units, selected/expanded/disabled state and validation errors are
  programmatically related to their control/value.
- Blocking validation prevents only the affected action and leaves the error visible until resolved;
  it does not erase unrelated content.

## Text equivalence

Color, icon, shape, location, order, bar length and animation never carry sole meaning. Every visual
information carrier has adjacent or programmatically associated text naming the state and value.
Decorative images are hidden; meaningful images have complete alternatives. Locale/untranslated
state is conveyed in text, not styling alone.

## Visible feedback and announcements

Visible status/error/notice content is ordinary semantic content, not a live copy of the whole
screen. The global frame owns one assertive and one polite visually hidden outlet.

| Event                      | Outlet    | Behavior                                                         |
| -------------------------- | --------- | ---------------------------------------------------------------- |
| New blocking error         | assertive | Announce one localized bounded summary promptly                  |
| Settled nonblocking change | polite    | Coalesce into one localized summary for the matching revision    |
| Initial render             | none      | Content is available in reading order, not announced as a change |
| Unchanged/replayed event   | none      | Stable event/revision identity deduplicates it                   |
| Stale revision             | none      | Never announce a result no longer presented                      |
| Unaffected values          | none      | Do not repeat surrounding content                                |

Changing locale clears translated outlet text without replaying old events. A genuinely new event
after the switch resolves in the new effective locale.

## Conformance wording

Any interface, documentation or report that states conformance must say WCAG 2.2 AA **except**
criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11. An unqualified AA statement fails the
repository policy check.

The exclusion does not permit replacing correct native semantics with custom nonsemantic controls.
Screen-reader naming, relationships and state remain required.
