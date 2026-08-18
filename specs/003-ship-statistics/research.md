# Research: Ship Statistics and Status

Research used the accepted specifications and plans for features 001, 002 and 005–011, the exact
installed `@elite-dangerous-almanac/core@0.1.1` declarations, and rendered inspection of
`.design/Ship Builder.dc.html` canvases 1c and 1d. The installed package is ESM-only,
side-effect-free and pre-1.0; implementation must use leaf exports and pin regression behavior.

## Decision 1: stage shared contracts before area providers

**Decision**: Feature 003 first defines `ViewingConditions`, revision context, the generic provider
envelope, fixed summary identities, the shared workspace target union and feature 009's already
accepted generic `AssemblyRequirementsPort`. Features 005–009 then update their owning contracts to
export exact status projection types and adapters. Only then does feature 003 define the concrete
five-provider bundle and land final composition/UI.

**Rationale**: Treating all of 005–009 as prerequisites creates a cycle because those plans already
consume feature 003 conditions and navigation. Contract-first staging lets area owners implement
against stable types without moving their calculations into feature 003.

**Alternatives considered**:

- Implement 003 after all area features: circular and leaves each area to invent conditions.
- Implement calculations temporarily in 003: violates the accepted area ownership and Almanac rule.
- Let each area own a separate condition store: risks divergent visible states and persisted drift.

## Decision 2: compose synchronously from one immutable context

**Decision**: A pure `composeStatusProjection(context, providers)` invokes all five ports
synchronously with the same `{ loadout, buildRevision, conditions, conditionsRevision }`. Every port
returns a revision-stamped projection. An explicitly pending provider produces `pending`. A ready
envelope stamped for another context, or an unexpected thrown application error, produces
`failure`; only a complete matching tuple becomes `ready`.

**Rationale**: All installed package calculations are local and synchronous. This avoids speculative
request tokens while making mixed revisions structurally impossible. It also lets an area reuse its
pure projector beneath both its detail store and the feature 003 adapter.

**Alternatives considered**:

- Subscribe to five independently settled stores: can combine old and new area snapshots.
- Deep-compare the mutable `ShipLoadout`: object identity and cached package objects are not a
  revision boundary.
- Add asynchronous orchestration now: unnecessary complexity for local synchronous providers.

## Decision 3: retain package validation rather than remodelling it

**Decision**: `StructuralProjection` retains the complete `LoadoutValidation` returned by
`loadout.validation` and a positionally aligned target list. The UI renders one item for each issue,
in package order, without grouping or deduplication. `valid` and `complete` remain independent facts.

Issue presentation includes the stable `code` as textual kind, exact package `severity`, optional
slot/symbol, the full `LoadoutIssueParams` value shape (including string arrays) and diagnostic text.
Only `issue.slot` authorizes an exact-slot target.

**Rationale**: Copying selected fields risks dropping future structured context. Rendering a private
friendly label for each issue code would create application-owned game diagnostic text.

**Alternatives considered**:

- Map codes to local issue names: forbidden private diagnostic translation.
- Parse `message` for slot/constraint: locale-fragile and invents targets.
- Collapse repeated issues: violates the exact package report.

## Decision 4: use released diagnostic locale helpers

**Decision**: Presentation calls feature 011's adapter over
`getLoadoutIssueMessage(issue, activeLocale)` and
`getCalculationIssueMessage(issue, activeLocale)`. When the package returns `null`, feature 011 shows
the package's canonical fallback with its standard untranslated-game-text disclosure. Application
framing, generic severity labels, units and counts remain localized normally.

**Rationale**: Almanac 0.1.1 deliberately returns canonical English only for English locales. The
application may disclose that boundary but may not own a German or other private diagnostic table.

**Alternatives considered**:

- Read `issue.message` directly for every locale: misses the package locale contract.
- Hide prose outside English: loses required diagnostics.
- Translate package codes/messages locally: violates the package source-of-truth boundary.

## Decision 5: area providers own headline semantics

Feature 003 fixes the seven headline slots and their targets, not their calculation unions. Each
provider returns its accepted owner-authored semantic value, conditions and qualifications unchanged.

| Headline            | Owner | Exact package source owned by provider                                                                           | Conditions that actually apply                           | Unit/detail target             |
| ------------------- | ----- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------ |
| Power draw/capacity | 005   | `powerBudget()` selected `.deployed` or `.retracted`, plus `.available`; deployed-only fields only when deployed | hardpoints                                               | MW / `powerAndHeat`            |
| Shield strength     | 006   | completed `shieldMetricsResult({ systemsPips }).value.strength`                                                  | SYS pips are passed; strength remains the returned field | MJ / `defenceProfile`          |
| Armour              | 006   | `armourMetrics().hitPoints`                                                                                      | none                                                     | hull points / `defenceProfile` |
| Sustained DPS       | 007   | `weaponMetrics().total.sustainedDamagePerSecond`                                                                 | package firing output; no hardpoint or pip input         | damage/s / `offenceProfile`    |
| Selected jump       | 008   | guarded `jumpRangeSummary().max`, `.unladen` or `.laden`                                                         | selected load                                            | LY / `mobilityAndJump`         |
| Top speed           | 008   | completed `mobilityMetricsResult({ fuel, cargo, enginesPips }).value.speed`                                      | selected standard load and ENG pips                      | m/s / `mobilityAndJump`        |
| Unladen mass        | 008   | completed `unladenMassResult.value`                                                                              | fixed unladen meaning; independent of selected load      | t / `mobilityAndJump`          |

Assembly requirements come through feature 009's accepted `AssemblyRequirementsPort` over its one
immutable cost/material snapshot and target `costAndMaterials`. Feature 003 never re-calls
price/material functions or reclassifies its states.

**Rationale**: One generic feature 003 result union would flatten meaningful distinctions owned by
the area specs. It would also put Merc Coin absence beside numeric headline states where it does not
belong.

## Decision 6: preserve unknown-power semantics verbatim

**Decision**: The power provider exposes feature 005's exact classification for every displayed
field. While `PowerBudget.unknownDraws` is non-empty, the installed declaration states that every
other figure is a lower-bound answer over known draws and that its boolean verdicts answer only for
known draws. Feature 003 copies the provider projection and qualification without trying to improve
the wording or mathematical direction.

Retracted presentation never derives deployed-only `headroom`, `utilisation` or `withinBudget`.

**Rationale**: The previous plan independently classified headroom and booleans, disagreeing with
the package declaration and feature 005 contract. Area ownership removes that drift.

**Alternatives considered**:

- Reclassify headroom as an upper bound: mathematically tempting but contradicts the package's
  public semantics and is not consumer-owned.
- Withhold all known power values: loses useful package output.

## Decision 7: never invent a retracted DPS state

**Decision**: Hardpoint selection changes only outputs for which the package exposes state-specific
results. `weaponMetrics()` exposes one enabled-weapon firing result and no hardpoint parameter.
Therefore sustained DPS always shows that returned value and identifies its native firing condition;
it is not zeroed, suppressed or marked unavailable when the selected power view is retracted.

**Rationale**: FR-002 prohibits reinterpretation, and FR-007 permits unavailable only when the
package returns null/throws. Feature 007 likewise requires the whole-build total exactly as returned.

**Alternatives considered**:

- Show zero when retracted: fabricated game result.
- Replace it with a nonnumeric “retracted” state: hides an available package value.
- Request a new Almanac method: unnecessary unless product requirements later demand retracted
  damage rather than the existing firing metric.

## Decision 8: standard loads and pips are exact, explicit viewing state

**Decision**: `LoadState` maps to `standardLoadResult('maximum'|'unladen'|'laden')`; jump selection
maps to `.max`, `.unladen` and `.laden`. Feature 008 owns guards for the throwing jump summary and all
mass/fuel/cargo diagnostics.

Pips are stored as integer half-pips `0..8`, total `12`, and divided by two only at a provider call.
The settled default is `4/4/4` half-pips (displayed 2/2/2). Three explicit draft controls plus Apply
accept only in-range half steps totalling six. Invalid drafts leave the prior settled tuple intact.

**Rationale**: Integer representation avoids floating-point invalidity. A draft/Apply interaction
allows every valid tuple without silently selecting which bank should lose a half-pip.

**Alternatives considered**:

- Immediate independent steppers: can expose an invalid total between interactions.
- Automatic redistribution: requires an unspecified donor priority.
- Coupled transfer control: valid but less familiar and harder to name clearly for screen readers.

## Decision 9: viewing state is ephemeral and replacement-scoped

**Decision**: Conditions default to unladen, 2/2/2 and deployed on a new document and every active
build replacement. Ordinary edits, undo/redo and saving the same active build do not reset them.
They are absent by type from build snapshots, local records, history, preferences, routes/fragments,
compact links and SLEF.

**Rationale**: The spec defines viewing conditions, not Commander preferences or build data.

## Decision 10: one compatible workspace target union

**Decision**:

```ts
type WorkspaceTarget =
  | { kind: 'slot'; slotKey: string }
  | {
      kind: 'detail';
      capability:
        | 'powerAndHeat'
        | 'defenceProfile'
        | 'offenceProfile'
        | 'mobilityAndJump'
        | 'costAndMaterials';
    };
```

Headline and assembly cards always have a detail target. Validation issues have a slot target only
when the package supplies `slot`. Feature 009's internal `materialTrace` disclosure remains local to
its detail capability and is not a workspace navigation target.

**Rationale**: This matches accepted capability names, removes the prior `cost`/`costAndMaterials`
conflict and avoids arbitrary anchors that no owner contract guarantees.

## Decision 11: adapt the actual 1c/1d reference honestly

Rendered design inspection found:

- 1c is a three-column workspace with a 306px persistent rail ordered as status warning, power,
  six metrics, cost and materials/Merc Coin. Its central mode selector has no Status item.
- 1d has Status as a peer in-memory capability mode. Its Status content repeats figures again in a
  compact dock before the slot ledger.
- Neither canvas contains load, pip or hardpoint controls.

Adopt the rail, power-first hierarchy, six-card set, assembly order and mobile in-workspace Status
mode. Add a desktop Status peer mode and a labeled rail action to it. The rail mirrors facts and
counts but never repeats issue records. On narrow/zoomed layouts, active Status suppresses the
duplicate compact dock and slot ledger until the Commander leaves Status or follows an exact-slot
action.

Reject authored warning sentences, optional-empty warnings, reverse-engineered power bars,
comparison arrows, combined credit totals, unowned blueprint/material totals, remote material
images, Google Fonts requests, and the unproven local Merc Coin artwork. Use the repository design
system, same-origin licensed assets where established, or complete text.

## Decision 12: announcements follow settled summary identities

**Decision**: The visible Status capability is not a live region. After a `ready` projection settles,
compare its issue count and unique provider-qualified summary IDs with the previous settled pair.
The fixed identities are `power`; `shieldStrength`, `armour`; `sustainedDps`; `jumpRange`,
`topSpeed`, `unladenMass`; and `retailCredits`, `mercCoin`, `materials`, partitioned respectively
across features 005–009. A provider includes an identity once exactly when that visible summary is
qualified, incomplete or unavailable under its owner contract; an absent Merc Coin summary does not
count. Feature 003 validates identity ownership/uniqueness and derives the count without
reclassifying an owner state. Initial content and unchanged counts are silent. A changed pair
produces one coalesced polite localized message; stale/pending projections never announce.

**Rationale**: This satisfies FR-021 without repeatedly reading every updated number or diagnostic.

## Package/repository readiness

Almanac 0.1.1 contains the required structured validation/calculation results, standard-load result,
powered mobility/shield diagnostics, power consumers, unknown-hull rejection, cost/material APIs and
diagnostic locale helpers. There is no unresolved package release blocker.

The application source currently contains only the shell and build-link domain. Features 001, 002,
005–009 and 011 are repository implementation prerequisites. Their absence is a delivery dependency,
not permission to add a fallback calculator, private translation or provisional target.

## Test strategy

Unit/contract tests cover exact validation identity/order, diagnostic helper/fallback behavior,
defaults and every valid/invalid pip boundary, reset/exclusion rules, one context passed to every
provider, revision mismatch/pending/failure handling, provider-state identity, exact targets,
provenance references and coalesced announcements.

Playwright covers the four user stories in both engines at desktop, tablet portrait/landscape and
mobile portrait/landscape, including axe scans, touch actions, locale switch/fallback, offline reload,
expanded/RTL text, actual 400% zoom, reduced motion and a manual screen-reader script. Chromium CDP
4x throttling measures committed revision to matching rendered revision within 100 ms.
