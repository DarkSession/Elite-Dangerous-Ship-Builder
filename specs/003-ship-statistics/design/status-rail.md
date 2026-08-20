# Screen Design: Wide Status Rail

**Route**: existing `/build`

**Reference**: canvas 1c right rail
**Purpose**: keep the active revision's most important status and requirements glanceable while
providing one clear action to the complete Status capability.

## Information order

1. Build Status heading and action to open complete Status.
2. Independent validity and completeness facts.
3. Package issue and qualified-summary counts.
4. Selected power draw/capacity compact projection.
5. Six compact headline cards: shield, armour, sustained DPS, selected jump, speed and mass.
6. Compact retail, conditional Merc Coin and material summaries from feature 009.

The rail contains no validation issue record. Counts are not
issues, so every issue still appears exactly once in the complete capability.

## Behavior

- Every value, state, unit and relevant condition comes from one ready `StatusProjection`.
- The action to complete Status is always visibly labeled and meets the shared touch-target token.
- Every displayed compact headline and assembly summary is itself an unambiguous named one-action
  target to its provider detail capability. If that action cannot remain perceivable and usable at
  the available width, omit the compact value from the rail rather than require rail → Status →
  detail.
- A build/condition edit replaces the rail with current-context pending until a matching projection
  is ready. It never labels older values as current.
- Application failure uses the shared prompt-error pattern and preserves access to build editing.

## Layout

The rail is shown only when the workspace can preserve usable ledger/outlet widths and full rail
content. It is fluid within design-system limits rather than hard-coded to the mock's 306px. At
tablet/narrow/zoomed widths it disappears and the complete Status capability provides content
parity. The document never scrolls horizontally.

## States

- valid/complete, valid/incomplete, invalid/complete where package-reachable, invalid/incomplete;
- zero/nonzero issue and qualification counts;
- every owner-provided compact result state;
- Merc Coin absent/present and assembly complete/qualified;
- pending and application failure;
- long locale/RTL text.

## Accessibility

Use a complementary region named by the visible Build Status heading. Structural facts use a
definition list; compact metrics use a semantic list. Status and severity meaning is textual. The
rail is not live, does not require hover and is omitted rather than visually squeezed at zoom.
