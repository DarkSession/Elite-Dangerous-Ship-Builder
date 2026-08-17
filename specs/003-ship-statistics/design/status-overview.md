# Screen Design: Status Overview

**Route**: existing `/build`  
**Reference**: `.design/Ship Builder.dc.html`, canvases 1c and 1d  
**Purpose**: let a Commander understand exactly what Almanac reports, inspect headline results under
explicit conditions and reach the owning slot/detail in one action.

## Information order

1. Status heading and compact build identity supplied by the workspace.
2. Viewing conditions: load, SYS/ENG/WEP pips, hardpoints, total/error and Apply.
3. Structural facts: errors reported/not reported; required/classified loadout complete/incomplete.
4. Ordered package issues, or an explicit none-reported statement.
5. Separate fixed-mount normalisation provenance, when present.
6. Power draw/capacity summary and six metric cards: shield, armour, sustained DPS, selected jump,
   top speed and unladen mass.
7. Visible qualifications, or an explicit none-reported statement when both issue and qualification
   sets are empty.
8. Assembly requirements: retail credit fields, conditional Merc Coin and materials.

This order keeps status evidence before results and places the controls before everything they affect.

## Wide composition

- The established workspace retains a narrow status/requirements rail for glanceable settled values.
- Activating Status expands the full central outlet; the rail never becomes the only location for
  diagnostics, qualifications or condition controls.
- Conditions form a compact wrapping bar. The headline region uses a fluid card grid with one power
  summary and six consistently structured metric cards.
- Ordered issues and provenance use full-width lists so long package text and identities can wrap.
- Assembly requirements follow the headline grid rather than competing with the slot ledger.

## Tablet composition

- Status occupies the full workspace outlet below shared build controls.
- Conditions wrap into labeled groups without changing semantic order.
- Headline cards form at most two columns unless text measurement proves more columns preserve full
  labels, values, units and state text.
- Issues, provenance and assembly summaries remain full width.

## Narrow and 400% composition

- The mobile 1d-style Status capability opens a single stacked document region.
- Controls come first, with 44 CSS px minimum targets and visible total/validation.
- Every headline is a full-width card; two columns are allowed only when no label/unit/state truncates.
- Issue and provenance actions are native buttons/links occupying a clear touch target. Untargeted
  records have no false affordance.
- Nothing requires a horizontally scrolling table. Long canonical messages, symbols, locale-formatted
  units, expanded translations and RTL content wrap.

## Card anatomy

Every result card contains:

- localized meaning;
- locale-formatted value and visible unit, or explicit state text;
- relevant selected conditions;
- qualification/incomplete/unavailable/infinite meaning in text;
- one native detail action only when the owning port supplies a target.

Power keeps draw and capacity together. A retracted summary omits deployed-only utilisation/headroom
instead of calculating replacements. A retracted DPS card states the observable hardpoint condition
without inventing numeric zero. A genuine package zero is announced as a value, not unavailable.

## Issues and provenance

The structural facts are a definition list. Package issues are a semantic list preserving order.
Each item exposes localized issue kind and severity text, canonical package diagnostic, structured
context suitable for display, and an exact-slot action only when supplied.

Normalisation provenance has a separate heading and explanation that it is local workflow history,
not an Almanac issue. Its exact stored slot may be targeted. Neither list uses colour/icon alone.

## States

- no active build: defer to the existing workspace empty state;
- calculating/updating: identify the new current context without showing stale values beneath it;
- all exact/no issues: say no package issues or qualified results were reported, never “ready”;
- invalid and incomplete simultaneously;
- issue with target / issue without target;
- exact zero / lower bound / structured incomplete / unavailable / semantic infinity / absent Merc Coin;
- fixed-mount provenance present / cleared;
- application calculation failure, distinct from ordinary package diagnostics.

## Announcements

Visible content stays outside the live region. A single visually hidden polite region receives one
localized message only when a settled issue or qualification count changes. Initial content,
unchanged figures and stale revisions are silent.

## Design-system and accessibility requirements

- Compose feature 011 headings, cards, status text, segmented/radio controls, numeric pip controls,
  buttons, notices and tokens. No local colour, type, spacing, radius, elevation or motion literal.
- Use native semantic controls and heading order under the workspace's single visible `h1`.
- At 200% text and 400% zoom preserve content/action parity and prevent page overflow.
- Honor reduced motion without delaying snapshot publication.
- Automated accessibility checks cover every state in Chromium and Firefox across desktop, tablet,
  mobile portrait and landscape.
- Any conformance statement retains the constitution's keyboard-operation exclusions.
