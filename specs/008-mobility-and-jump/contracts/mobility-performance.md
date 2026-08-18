# Mobility Performance Contract

## Inputs

One projection uses feature 003's settled condition revision:

- exact selected load identity and package-produced fuel/cargo inputs;
- exact selected ENG pips in `[0, 4]`, including half steps;
- the same active build revision used by jump, mass and source projections.

Mass/fuel/cargo diagnostic results required by the selected load must be complete before the method
is called. Invalid feature 003 drafts trigger no projection.

## Package boundary

Call `ShipLoadout.mobilityMetrics({ fuel, cargo, enginesPips })` exactly once per settled projection.
A non-null result maps every field unchanged:

- `speed`;
- `boost`;
- `pitch`;
- `roll`;
- `yaw`;
- `massCurveMultiplier`;
- `rotationMassCurveMultiplier`.

The application does not call the data-free mobility/curve functions, interpolate pips, combine mass
or calculate a multiplier.

## Result semantics

- Non-null numeric values are ready, including exact zero in every field when mass is above the
  thruster maximum.
- Package `null` is unavailable and never receives hull base speed/rotation as a fallback.
- Incomplete selected-load dependencies remain incomplete/unavailable with their package issues and
  prevent the call.
- A handled package throw remains generic unavailable unless a direct package/source observation
  establishes a narrower reason.

## Thruster source and state

The package fitted snapshot provides exact slot, symbol, game text, enabled state and sparse
post-engineering curve facts. Feature 005 provides the package-authored exact-slot power observation
after Almanac #299. The presentation may name:

- absent: no package-fitted thruster;
- disabled: fitted snapshot explicitly disabled;
- unpowered: feature 005 observation explicitly reports shed/unpowered;
- unresolved: occupied slot cannot supply effective facts or authoritative power state;
- present: resolved enabled/powered source.

Source state does not change the numeric method result. In particular, feature 008 must not locally
null beta.12's incorrect finite value for a shed thruster; implementation waits for the released fix
to Almanac #296.

## Returned source facts

Only fields present in the fitted package record appear:

- shared `minMass`, `optMass`, `maxMass`, `minMultiplier`, `optMultiplier`, `maxMultiplier`;
- optional speed `min/opt/maxSpeedMultiplier`;
- optional rotation `min/opt/maxRotationMultiplier`.

The two actual selected-load multiplier fields come from `mobilityMetrics()`. No threshold is turned
into percentage-of-optimal, headroom, bar length or application curve.

## Revision and announcement behavior

- Load and ENG pips shown beside mobility are those passed to the package call.
- Build/condition changes invalidate the whole prior result.
- Rapid edits publish only the latest matching revision and create one concise settled announcement.
- An unexpected current-revision error contains no stale mobility figures.

## Verification

Tests compare every field directly with one live package call for maximum, unladen and laden loads and
ENG 0, 0.5, 2 and 4. They distinguish null from above-supported-mass zero; cover absent, disabled,
unpowered and unresolved thrusters; prove no hull fallback; verify sparse curve facts; and retain the
#296 regression as blocked until a fixed release is consumed.
