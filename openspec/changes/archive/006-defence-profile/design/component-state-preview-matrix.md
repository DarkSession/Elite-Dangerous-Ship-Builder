# Component State and Preview Matrix

> **Withdrawn at implementation, 2026-08-24.** This matrix listed preview declarations for
> `DefenceProfile`, `ShieldProfile`, `ShieldRecovery`, `CellBankList`, `ArmourProfile`,
> `DefenceSourceList`, `CalculationIssueList`, `DamageDefenceCollection` and
> `DefenceStatusSummary`.

The preview manifest covers the shared primitives in `src/app/ui/`, and the repository policy
checker reconciles it against the components exported from there. Every component this feature adds
is a feature block under `src/app/features/build-workspace/outfitting/`, composed out of primitives
that already carry their own preview states — the same position features 003, 009 and 005 reached
before it.

Nothing this feature adds to `src/app/ui/` therefore needs a preview declaration, because it adds
nothing there. The states this matrix used to enumerate are covered where they can actually be
observed: in the component suites beside their source, and in the journeys in
`e2e/defence.spec.ts`. They are listed in [design/screen-inventory.md](./screen-inventory.md),
"Required states".
