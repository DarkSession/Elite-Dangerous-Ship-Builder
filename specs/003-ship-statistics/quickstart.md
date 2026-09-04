# Quickstart: Ship Statistics and Status

> **Superseded 2026-08-22 (wave 11).** Three collisions between the accepted specification and
> `.design/Ship Builder.dc.html` were surfaced before implementation and **the design won all three**
> ([design/reference-review.md](./design/reference-review.md)). This guide was written for the
> composition the rulings withdrew, and it is retained as it was written rather than rewritten, so
> read it against the list below rather than top to bottom.
>
> **Sections 4 to 7 and 10 are withdrawn whole** — provider values, viewing conditions, atomic
> composition, the wide Status capability and its targets, and the projection timing budget. So is
> the evidence matrix at the foot: `spec.md` now declares two stories, not four, and `FR-006`,
> `FR-008` to `FR-012` and `FR-016` to `FR-021` are withdrawn or reassigned with the surfaces they
> governed.
>
> **What is left to validate** is the package validation contract and the diagnostic helper's `null`
> outside English (§1); an active build being required and never created (§2); every package issue
> drawn once in package order, matching `ShipLoadout.validation()` by identity, with no wording that
> claims the build is ready, flyable, working, good or optimal (§2); the canonical fallback and its
> untranslated disclosure on a locale miss (§3); package-defaulted fixed modules staying ordinary
> fitted state, with no provenance surface and nothing persisted from it — §8 steps 1 to 3 and the
> first sentence of its expected outcome, which are `FR-013` and `FR-014` and are both still declared;
> and the responsive, accessible and offline behaviour of the rail (§9).
>
> **Everywhere in those surviving sections, a clause naming a withdrawn surface goes with it.** Among
> them: §1's confirmation that 005–009 export projection types and adapters over the envelope, and
> that providers share a target union; §2's structural facts, its visible issue code and its
> exact-slot action — `e2e/ship-status.spec.ts` now asserts that no issue offers an action at all;
> §3's `getCalculationIssueMessage` for provider issues and its localized counts; §8's step 4 and its
> announcement outcomes; and §9's condition controls, structural facts, headlines, requirements and
> "the one count announcement".
>
> What survives is covered by
> `src/app/features/build-workspace/outfitting/build-status/almanac-validation-contract.spec.ts`,
> `build-status.spec.ts`, `e2e/ship-status.spec.ts` and the `build/validation-issues` surface in
> `e2e/coverage-ledger.ts`. The gate itself — `pnpm run check`, with coverage at or above 80% and no
> engine, viewport, orientation or accessibility check skipped — is unchanged.

This is the validation/run guide for feature 003. It assumes the contract-first delivery stages in
[plan.md](./plan.md), not that the currently checked-in shell already implements prerequisites.

## 1. Prepare and confirm contracts

```bash
pnpm install --frozen-lockfile
```

Confirm:

- `@elite-dangerous-almanac/core` resolves from the committed lockfile;
- feature 001 exposes the atomic active `{ loadout, buildRevision }` boundary; feature 002 advances
  that revision for committed edits and exposes exact-slot actions;
- feature 011 supplies tokens/components, locale/formatting/fallback disclosure, ten Playwright
  projects and the axe helper;
- features 005–009 export exact status projection types and adapters over the generic envelope in
  [status-projection.md](./contracts/status-projection.md), retaining feature 009's
  `AssemblyRequirementsPort` name;
- all providers use the shared target union from
  [workspace-integration.md](./contracts/workspace-integration.md).

The package contract tests must directly pin validation issue shape/order, diagnostic helper null
outside English, complete zero capacities, `standardLoadResult()` definitions, structured
mobility/shield unavailable results, exact power draw semantics and Merc Coin absent-versus-zero
recognition. A failure is an upstream/package-version issue; do not add a local correction.

## 2. Validate structural status

1. Open `/outfitting` without an active build.
2. Confirm Status creates/selects nothing and the existing workspace empty actions remain.
3. Load fixtures for every reachable `validation.valid`/`complete` combination.
4. Compare the visible structural facts and ordered issue items with `loadout.validation()` by identity.
5. Exercise an issue with `slot` and one without it.

Expected: each issue appears once only in complete Status; code and severity are visible text; params
including arrays remain available; the exact slot opens in one action; an untargeted issue has no
false action; no wording claims ready, flyable, working, good or optimal.

## 3. Validate diagnostic locale behavior

1. Run the same issue in English and a supported non-English UI locale.
2. Compare presentation with `getLoadoutIssueMessage(issue, locale)` and, for provider issues,
   `getCalculationIssueMessage(issue, locale)`.
3. Trigger the package helper's `null` result.

Expected: English uses the package message. A missing package locale shows canonical fallback plus
feature 011's untranslated-game-text disclosure. Application framing, severity, counts, units and
numbers use the active locale. No private issue-code translation appears.

## 4. Validate provider values and conditions

Use reference builds that cover exact positive/zero, structured incomplete,
package null/throw guarded by its owner, infinity, unpriced entries, missing recipe costs and no
recognized Mercenary article.

For each ready projection compare:

- power with feature 005 for selected deployed/retracted state;
- shield and armour with feature 006;
- sustained DPS with feature 007 under both hardpoint selections;
- selected jump, selected-load/ENG speed and unladen mass with feature 008;
- retail, Merc Coin and materials with feature 009's same immutable projection.

Expected: owner state/value/qualification objects pass through unchanged. Retracted power omits
deployed-only fields. Sustained DPS remains the package firing value rather than zero/unavailable.
Merc Coin absence is not rendered as zero. Every value shows unit, meaning and relevant/native
condition.

## 5. Validate viewing conditions

1. Start a new active build and confirm unladen, 2/2/2 and deployed.
2. Apply maximum-jump, unladen and laden conditions.
3. Apply half-pip boundary allocations totaling six.
4. Try nonnumeric, out-of-range, non-half-step and wrong-total drafts.
5. Toggle hardpoints and inspect power plus sustained DPS behavior.
6. Edit/undo/save the same build, then reload and replace it through catalogue, local record, link
   and SLEF.

Expected: valid Apply creates one condition revision; invalid/unchanged Apply retains the prior
settled projection. Ordinary build operations retain conditions. Reload/replacement resets them.
No storage, history, preference, URL, link or SLEF payload contains viewing state.

## 6. Validate atomic composition

1. Instrument the host with build and condition revision data attributes in test builds.
2. Use provider spies returning matching and explicit-pending envelopes, ready envelopes with a
   mismatched revision pair, and duplicate/foreign qualification identities.
3. Rapidly edit enabled/priority/module state while applying conditions.

Expected: every ready rail/capability value carries one matching pair. Explicit pending prevents
ready publication. A ready mismatch or invalid qualification identity produces `projectionFailed`;
it cannot remain pending indefinitely. Old content is never relabeled with the new pair. Unexpected
provider failure is application failure, while package unavailable remains an owner-ready result.

## 7. Validate rail, capability and targets

1. At desktop width inspect the persistent compact rail, then activate its complete Status action.
2. Confirm the rail contains counts but no issue records.
3. Activate each displayed rail headline/assembly summary directly, then each complete-Status
   headline and assembly detail action.
4. At tablet/mobile widths activate Status, then an issue slot action and return.

Expected: Status is an in-workspace mode with no route/fragment change. Desktop has one issue record
location. Every displayed rail summary reaches its detail in one interaction; a summary without a
clear direct target is omitted. Detail targets open exactly `powerAndHeat`, `defenceProfile`,
`offenceProfile`, `mobilityAndJump` and `costAndMaterials`. Narrow Status suppresses the duplicate
quick dock/ledger until an exact-slot action switches surfaces.

## 8. Validate fixed defaults and announcements

1. Ingest a build with omitted fixed entries, then open/save/duplicate/reload its record.
2. Successfully edit one fixed mount; also try refused/cancelled/no-op edits and undo.
3. Export SLEF and copy a build link.
4. Introduce/resolve package issues and provider qualifications with rapid edits.

Expected: package-defaulted fixed modules remain ordinary fitted state with no provenance UI or
metadata. Initial counts are silent; each settled changed count pair produces one polite message;
unchanged, pending and stale revisions are silent.

## 9. Validate responsive, accessible and offline behavior

Run the complete primary journey in Chromium and Firefox at desktop, tablet portrait/landscape and
mobile portrait/landscape. For every relevant ready, empty, pending, error, issue,
qualified, unavailable, infinite and absent state:

- run the automated accessibility scan;
- verify pointer and touch actions, 44 CSS-pixel targets and no hover-only information;
- verify 200% text and actual 400% browser zoom without lost content/function or page overflow;
- verify long canonical diagnostics, expanded translations and RTL layout;
- verify reduced motion;
- perform the documented screen-reader journey through heading/region structure, condition controls,
  structural facts, issues, headlines, requirements and the one count announcement.

After first loading the route/assets, take the browser offline, revisit previously opened Status and
repeat condition/target navigation. Expected: no cross-origin request and no capability degradation;
unfetched nonessential art does not block text/status.

## 10. Validate performance and the complete gate

At mobile Chromium use CDP `Emulation.setCPUThrottlingRate(4)`. Measure in-page from committed
build/condition revision to rendered DOM with the same pair; exclude Playwright transport time.

Expected: every affected status/result renders within 100 ms. Firefox runs the same functional and
accessibility journey without the Chromium-only throttle assertion.

Run the full gate:

```bash
pnpm run check
```

Coverage remains at or above 80% for statements, branches, functions and lines. No engine, viewport,
orientation, accessibility check or test is skipped.

## Evidence matrix

| Evidence                                                                              | Primary validation                                          |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Story 1; FR-001–FR-008, FR-013–FR-015, FR-020–FR-022; SC-001, SC-004                  | Sections 2, 3, 6 and 8                                      |
| Story 2; FR-002, FR-006–FR-012, FR-020; SC-002, SC-003, SC-006                        | Sections 4, 6, 7 and 10                                     |
| Story 3; FR-006, FR-009, FR-016–FR-020; SC-002, SC-003, SC-005                        | Sections 4–6 and 10                                         |
| Story 4; FR-004, FR-007, FR-008, FR-011–FR-015, FR-020–FR-022; SC-001, SC-004, SC-006 | Sections 2, 4, 7 and 8                                      |
| Constitution I/II/IV/VI                                                               | Sections 1, 3, 4, 5 and 9                                   |
| Constitution III/V/VII/VIII                                                           | Sections 6, 7, 9 and 10 plus component previews             |
| Constitution IX                                                                       | Plan, contracts and screen inventory completed before tasks |
