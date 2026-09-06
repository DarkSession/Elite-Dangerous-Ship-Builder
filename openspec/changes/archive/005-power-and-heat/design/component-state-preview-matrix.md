# Component State and Preview Matrix

> **Withdrawn 2026-08-23 (wave 12).** This matrix listed preview declarations for
> `PowerBudgetSummary`, `PriorityBandCollection`, `ModulePowerBreakdown`, `HeatProfile`,
> `DistributorPerformance`, `PowerHeatAnnouncer` and `PowerAndHeatCapability` at three widths.

The preview manifest covers the shared primitives in `src/app/ui/`, and the repository policy
checker reconciles it against the components exported from there. Every component this feature adds
is a feature block under `src/app/features/build-workspace/outfitting/`, composed out of primitives
that already carry their own preview states — the same position feature 003 reached in its wave 11
and feature 009 before it.

Nothing this feature adds to `src/app/ui/` therefore needs a preview declaration, because it adds
nothing there. The states this matrix used to enumerate are covered where they can actually be
observed: in the component suites beside their source, and in the ten-project journeys in
`e2e/power-and-heat.spec.ts`. They are listed in
[design/screen-inventory.md](./screen-inventory.md), "Required states".
