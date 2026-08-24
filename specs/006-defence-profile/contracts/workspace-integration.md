# Workspace, Status and Slot Integration Contract

> **Reconciled at implementation, 2026-08-24.** This contract was written against a feature 003
> provider envelope, a workspace capability target and slot actions inside the defence surface.
> Feature 003 publishes no such provider, and neither canvas draws an action in either card. What
> the contract now states is what the build does. See
> [../design/reference-review.md](../design/reference-review.md), "Required departures".

## Ownership

- Feature 001 supplies one active `{ loadout, buildRevision }` and the `/build` workspace.
- Feature 005 owns the SYS pip allocation, in the package's own `[0, 4]` units.
- Feature 006 produces the `Defence` projection and the two blocks that read it.
- Feature 010 owns the anatomy mode strip and the space its plates leave.
- Feature 011 supplies shared components, tokens, localization, game-text presentation and
  accessibility verification.

There is no feature-006 route, active-build store, condition store, slot-selection store or persisted
field.

## The projection boundary

`projectDefence(loadout, { systemsPips })` is pure and synchronous. It is recomputed from the loadout
at the revision its reader is on, so there is no payload to hold and nothing to invalidate: a reader
on a newer revision has already recomputed.

Package-unavailable shield and recovery results are ordinary values of a complete projection. Only an
unexpected thrown call or a failed exact hull invariant is a failure, and that is the workspace's to
report.

## The status rail block

The rail's defence block reads the same projection the cards read and draws two cells from it: the
shield strength and the hull hit points.

- A refused shield reads as unavailable in the rail exactly as it does in the card.
- The armour cell is always present, because the package armour result is non-nullable.
- The block holds no control and adds no qualification of its own to an exact package value.

## Role-group boundary

The classified roles are shield generator, shield booster, shield reinforcement, bulkhead and hull
reinforcement. There is no module-reinforcement role: the package reports module armour as a figure
on `ArmourMetrics` and returns no group to classify. They are derived only from the package armour
slot or a resolved package engineering group.

- Groups retain exact package slot and `symbol` identities for every module in them.
- They carry only directly observed fitted/enabled state.
- The group's figure is the package's own aggregate. No module in it is given a share, an inferred
  resistance or a local power verdict.
- Only package-resolved modules are classified. Unavailable role or stat data is not recovered from a
  symbol, a display name, a slot position or a modifier.
- Cell banks are not duplicated here; the reserve line already carries them.

## Actions

There are none. Canvas 1c draws no control inside either card, and the ledger and the bench are a
few centimetres away in the same workspace. Nothing in this surface changes a build, an allocation,
a revision, persistence, history, the URL or SLEF.

## Announcements

There are none. The mode strip already says which layer is open, and a reading that narrated every
pip would talk over the control being used. A projection failure is the workspace's to report, once,
through feature 011's assertive channel.

## Verification

- The rail's two cells equal the two card headlines at every revision.
- An unavailable shield reads as unavailable in both places, with no zero or blank in its stead.
- Duplicate symbols in different slots stay distinct inside their group.
- A pip change re-reads both cards and the rail from one projection.
- Neither the open mode nor the allocation changes a route fragment or a build serialization.
