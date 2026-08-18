# Drives & Mass Capability

## Purpose and placement

Drives & Mass presents the active build's complete package jump summary, selected-load mobility,
mass/capacity diagnostics and per-module mass. It is a capability mode inside `/build`, reached by
the shared `mobilityAndJump` detail target. It owns no route, build editor or viewing-condition
control.

## Stable semantic order

The DOM and screen-reader order is fixed:

1. Drives & Mass heading and active-build identity;
2. read-only selected load and ENG-pip context from feature 003;
3. Jump Performance heading, exact fitted FSD identity/state and availability;
4. maximum, unladen and laden groups, each with single range, total range and jump count;
5. sparse fitted-FSD facts and, when shown, separately labelled combined boost parameter;
6. Mobility Performance heading, exact fitted thruster identity/state and availability;
7. speed, boost, pitch, roll, yaw and both selected-load multipliers;
8. sparse fitted-thruster curve facts;
9. independent unladen mass, main fuel, reserve fuel and cargo results with owning issues; and
10. every exact-slot fitted-module mass row.

Wide grid placement does not alter that semantic order. Jump values are not duplicated into a
separate summary block.

## Responsive composition

At desktop and tablet landscape widths, Jump Performance and Mobility Performance may sit in two
fluid columns when source identity, labels, values and issues remain readable. Mass and Capacity
then spans the available width, followed by the complete module-mass collection.

At tablet portrait, mobile portrait/landscape, 200% text and 400% zoom, the same regions stack in the
order above. Every field, issue, sparse fact and module row remains present. A module table becomes
exact-slot cards/definition rows if that avoids horizontal overflow; no page-level horizontal
scrolling is allowed.

## Selected condition context

Show the settled load identity and ENG pips used by the package call before affected results. This is
read-only context. Feature 003's complete Status capability is the sole home of load/pip draft,
Apply and Reset controls, so Drives & Mass does not embed or clone them.

## Jump Performance

Show the core FSD slot's exact package key, localized module/slot text and source state adjacent to
the result it qualifies. A ready summary contains exactly three labelled groups:

- maximum: one-jump fuel, empty hold;
- unladen: full main tank, empty hold; and
- laden: full main tank, full hold.

Each group visibly names single range, total range and jump count with units. Equal values remain
separate. Zero fuel is a numeric zero result, not an empty card.

If any aggregate or standard-load guard is incomplete, show no summary number and associate the
exact owning package issues. Sparse FSD parameters follow in a definition group. Combined
`jumpBoost`, when included, is labelled as an active-booster/build parameter rather than an FSD
record field. Do not show mass factor, percentage, headroom, fuel-per-jump calculation or inferred
SCO state.

## Mobility Performance

Show exact thruster slot/source identity and the package result state. A complete result presents all
seven fields. An incomplete result presents its exact issues, whose fields/reasons distinguish absent,
disabled, shed, unresolved and power-input failures. Do not replace it with hull catalogue speed or
rotation.

Complete all-zero performance above supported mass remains visibly/programmatically a ready package
zero. Sparse curve facts are a separate definition group with no arbitrary bar scale or locally
drawn curve.

## Mass and Capacity

Present three independent result groups:

- unladen mass;
- main and reserve fuel capacity as separately labelled values; and
- cargo capacity.

Each incomplete group owns its full ordered issue list. A complete zero stays numeric. An incomplete
group does not hide independent complete groups.

## Per-module Mass

Every fitted module appears once with localized package module/slot text, exact slot key where useful
for diagnosis, symbol where useful, and post-engineering mass or explicit unavailable. Duplicate
symbols remain distinct by slot. Optional reveal actions emit the shared exact-slot target.

Do not show a module subtotal, hull/modules/fuel decomposition, reconciliation delta, spatial mass
bubble or centre of mass. A package-trusted aggregate may remain complete beside an unavailable row.

## Surface states and feedback

### No active build

Use the workspace's shared no-build state and hull-selection intent. Render no zero placeholders.

### Package blockers/incomplete result

Keep independent available sections. Replace only the dependent numeric group with localized
unavailable framing and its exact issue relationships.

### Package zero

Show locale-formatted zero and text that preserves the load/result meaning. Colour may supplement
but cannot carry the distinction.

### Unexpected failure

The detailed store shows feature 011's shared current-revision alert and no stale/estimated numeric
value. Feature 003's synchronous status transaction handles the same throw as `projectionFailed`.

### Announcements

One settled build/condition revision produces one concise polite announcement summarizing changed
availability and selected context. Diagnostics remain ordinary readable content rather than a burst
of live-region messages.

## Localization and component previews

Every owned heading, label, load identity, state, unit and announcement resolves through feature 011. Numbers use named locale formatters for light-years, m/s, degrees/s, tonnes, multipliers and
integer counts. Almanac owns module/slot names and diagnostics; canonical fallback is disclosed.

Preview the meaningful states from [screen-inventory.md](./screen-inventory.md) at desktop, tablet
and mobile widths, portrait/landscape, expanded text, RTL and reduced motion. Source identity,
result, unit and issue association must survive every variant.
