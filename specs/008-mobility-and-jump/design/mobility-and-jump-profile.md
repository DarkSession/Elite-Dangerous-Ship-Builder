# Mobility, Mass and Jump Profile

## Purpose and placement

This logical surface presents complete package jump, flight mobility, aggregate capacity and fitted
module mass facts for the active build. It lives inside `/build` and is reached through feature 003's
Mobility headline/capability navigation. It owns no route, build mutation or viewing-condition store.

## Semantic order

DOM and screen-reader order is fixed even when wide layouts form columns:

1. capability heading and active-build identity;
2. shared selected load and ENG-pip context/control from feature 003;
3. fitted FSD identity and jump availability;
4. maximum, unladen and laden jump profiles, each with single range, total range and jump count;
5. sparse returned FSD parameters;
6. fitted thruster identity, enabled/power/resolution observation and mobility availability;
7. speed, boost, pitch, roll, yaw and both selected-load multipliers;
8. sparse returned thruster curve facts;
9. unladen mass, main fuel, reserve fuel and cargo capacity with owning issues;
10. complete exact-slot fitted-module mass collection.

The condition context precedes every affected result. Jump groups remain together and always identify
their load. Equal numeric values do not merge.

## Wide and tablet composition

- A fluid upper region may place Jump Performance and Mobility Performance side by side when both
  remain comfortably legible.
- Each region keeps its source identity adjacent to the values it qualifies.
- Mass and Capacity follows as complete diagnostic groups. Per-module Mass follows as a semantic
  list/table that can use its own internal overflow if labels cannot wrap safely.
- Wide visual placement never reorders heading or accessibility relationships.

Tablet portrait may stack the two performance regions; tablet landscape may retain columns. No
breakpoint removes source parameters, issues, multipliers or module rows.

## Narrow, landscape and zoomed composition

- Shared conditions occupy the first full-width block.
- Jump profiles become three labelled cards in maximum/unladen/laden order.
- Mobility fields and sparse source facts use wrapping definition groups.
- Mass/capacity issues sit immediately after the result they qualify.
- Module masses become exact-slot cards; no wide-only column disappears.
- At 400% zoom the same stack is used, without document-level horizontal scrolling.

Mobile landscape is a complete surface, not a shortened summary. Roll, both multipliers, total ranges,
jump counts, capacities, diagnostics and every module mass remain present.

## Jump Performance region

The region begins with the exact fitted drive name/slot and optional enabled state. A ready summary
contains three load groups:

- maximum: best one-jump load and its one-load total/count;
- unladen: full-main-tank, empty-hold single/total/count;
- laden: full-main-tank, full-hold single/total/count.

Every range is labelled light-years and every count is labelled jumps; proximity alone never
communicates which is which. Zero fuel shows numeric zero with explanatory load wording, not an empty
state. Missing/incomplete dependencies show no numeric placeholder and retain their issues.

Sparse drive facts form a separate “returned drive parameters” definition group. The group does not
calculate headroom, fuel-per-jump or percentage of optimal mass.

## Mobility Performance region

The region begins with exact thruster source identity and a textual state: present, absent, disabled,
unpowered or unresolved only when directly established. The shared selected load and ENG pips are
repeated as context, not stored again.

A ready result presents all seven package fields. Zero performance above maximum supported mass is
explicitly described as a package zero result and remains visually/programmatically different from
unavailable mobility. Null mobility never shows catalogue hull speeds as an estimate.

Sparse thruster thresholds/multipliers appear in a separate returned-parameters group. No bars or
percentage labels imply a local curve scale.

## Mass and Capacity region

Three independent result groups present:

- unladen mass;
- main and reserve fuel capacity as separate fields;
- cargo capacity.

Each incomplete group has its complete ordered package issue collection attached with semantic list
relationships. A complete zero stays numeric zero. One failed group does not hide independent ready
groups.

## Per-module Mass collection

Every fitted module has one entry containing package game name, symbol where useful for diagnosis,
exact slot and post-engineering mass or explicit unavailable state. Duplicate symbols remain
distinguishable by slot. Optional exact-slot actions hand feature 002 the original key.

No module subtotal, hull/module/fuel decomposition or reconciliation difference is displayed because
the package provides the authoritative aggregate separately.

## State behavior

### No active build

Use the shared workspace empty state and existing hull-selection intent. Render no fabricated zeros.

### Projecting

Retain the previous snapshot only in its old revision context or replace the affected surface with
the shared updating state. Never show old numbers under new load/pip/source labels.

### Incomplete dependency

Keep all available independent results. Hide only numeric dependents that the package could not
answer and show all owning issues.

### Unavailable jump or mobility

State the directly observed source context. Do not infer cause from a generic throw/null, and do not
substitute hull catalogue facts.

### Package zero

Show locale-formatted zero plus semantic text for zero fuel or above-supported-mass performance.
Colour/icon may supplement but never carry the distinction.

### Failure

Use feature 011's shared alert for unexpected current-revision failure. Offer no stale or estimated
numeric value.

## Interaction and announcements

Feature 003 owns load/pip drafting and Apply behavior. Invalid drafts do not update this surface.
Feature 008 may expose disclosure controls and exact-slot actions only. Touch/pointer targets use the
shared minimum size and do not depend on hover.

One accepted condition or settled build revision produces one concise polite announcement naming the
new load/ENG context and result availability changes. Ordered diagnostics remain readable content;
they are not each announced in a noisy sequence.

## Localization and formatting

Every owned heading, label, load identity, source state, unit, sentinel and announcement resolves
through feature 011. Number formatting covers light-years, m/s, degrees/s, tonnes, multipliers and
integer jump counts. Game names and diagnostic text remain Almanac-owned and use the shared
untranslated disclosure when needed.

## Component previews

Previews cover populated, empty, loading, error and disabled states where meaningful, plus:

- zero fuel and zero cargo;
- each incomplete aggregate and combined issues;
- absent/unresolved FSD;
- absent/disabled/unpowered/unresolved thrusters;
- mobility null and ready all-zero performance;
- optional source facts present/absent;
- engineered/zero/unknown module mass and duplicate symbols;
- desktop, tablet and mobile widths, portrait/landscape, expanded text, RTL and reduced motion.
