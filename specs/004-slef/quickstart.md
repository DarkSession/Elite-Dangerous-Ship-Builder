# Quickstart: Validate SLEF Import and Export

Normative contracts: [import](./contracts/slef-import.md),
[export](./contracts/slef-export.md), [browser delivery](./contracts/browser-delivery.md) and
[routes/UI](./contracts/routes-and-ui.md). Data/state details are in [data-model.md](./data-model.md).

## Prerequisites

- A released `@elite-dangerous-almanac/core` export path omits capture-only module `Health`, or the
  accepted feature spec is deliberately clarified to retain it. Version 0.1.1 retains/re-exports
  module `Health`, so implementation is blocked; an app-side payload rewrite is forbidden.
- The selected Almanac release exposes `inspectSlef`, `ShipLoadout.fromLoadout`,
  `completeEngineeringGrade`, `repairFixedMount`, `toSlefString` and
  `getSlefDiagnosticMessage` through leaf exports.
- Feature 011's strict compiler, localization/design-system, preview, ten-project Playwright and axe
  foundations are present.
- Feature 001's active-build snapshot/replacement/persistence/current-revision-link boundaries are
  present.
- The shared feature 002 ingress normalizer implements source-partial completion before fixed repair.

Feature 002's separate lossless clone/checkpoint blocker applies to editing/history, not construction
of a fresh detached SLEF candidate.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
```

For managed browser version mismatches, set `E2E_CHROMIUM_PATH` and/or `E2E_FIREFOX_PATH`; never
remove/rename a project or browser to pass.

## Package-boundary checks

1. Import `inspectSlef` only from `@elite-dangerous-almanac/core/ships/slef` and `ShipLoadout` only
   from `@elite-dangerous-almanac/core/ships/ship-loadout`; verify the production bundle has no broad
   Almanac barrel import.
2. Verify one envelope, one-element array and bare journal event each inspect as one valid entry;
   `[]` produces zero; mixed input produces a valid entry plus indexed diagnostic; malformed JSON
   throws `SyntaxError`.
3. Verify a source `Quality: 0.42` is preserved by construction, then becomes package-recomputed
   quality 1 only after `completeEngineeringGrade`. Verify an unresolved/unsupported partial returns
   structured refusal without mutation. Do not call completion on quality-1 final/locked articles.
4. Verify package construction's cargo behavior and `repairFixedMount` outcomes. Missing/unresolved
   fixed state uses exact package defaults; `defaultUnavailable` remains incomplete; no app default
   lookup or credit-field rewrite exists.
5. Verify `credits: 'source'`: untouched values remain, engineering-only quality completion retains
   applicable values, symbol replacement/removal/fixed repair narrows them by package rules, and
   source-absent/assembled builds emit none rather than retail.
6. Reproduce the health boundary with a fitted module carrying `Health`; the released serializer must
   omit it under the accepted spec. Version 0.1.1 fails this check and remains an upstream/spec gate.

Do not proceed on a regression; raise it against the Almanac and wait for a released fix.

## Acceptance scenarios

1. **Import without a build**: From `/ships`, `/ships/:symbol`, `/build` with no build and `/builds`,
   import one package-generated bare journal event and one one-entry envelope. Each needs no prior hull
   and, after commit, reaches `/build` as working provenance.
2. **Byte-first and exact input**: Try 65,536 ASCII bytes, 65,537 bytes, multibyte strings straddling
   the boundary and more than 65,536 bytes of whitespace. The last three are `tooLarge` before empty
   or package work. Inspector receives the exact within-limit string with no trim/normalization.
3. **Cardinality/diagnostics**: Try whitespace, malformed JSON, `[]`, two valid entries, mixed
   valid/invalid, duplicate slots and invalid fields. Preserve exact index/path/code/constraint/params;
   use package locale presentation and canonical disclosure. Never select index zero silently.
4. **Atomic rejection**: Seed dirty active state, revision, working/named bytes, fragment/link,
   fixed provenance and undo/redo. For every failure, cancel and supersession assert byte/state
   equality plus preserved draft. Assert over-limit never calls `inspectSlef`.
5. **Replacement**: Cancel a valid candidate over unsaved work, then accept it. Cancel changes
   nothing. Acceptance is one feature 001 replacement, one working autosave/link synchronization and
   one feature 002 history reset; feature 004 performs none directly.
6. **Normalization order**: Cover ordinary/Mercenary/identified pre-engineering/effect partials,
   unresolved partial, missing/unresolved fixed mounts, resolved-but-invalid fixed state and
   unresolved non-fixed state. Partial completion occurs before fixed repair; unsupported partial
   refuses whole; only source missing/unresolved fixed mounts receive stock fill; unavailable default
   stays incomplete; unresolved non-fixed remains.
7. **Outcome/persistence split**: After acceptance, the workspace reports quality, auto-restored/
   repaired/default-unavailable fixed mounts, unresolved issues and final validation. Dismissal edits
   nothing. Feature 001 persists fixed-fill provenance and the accepted revision's `valid`/`complete`
   booleans; the detailed quality/issue/outcome presentation does not persist, and none enters
   link/SLEF/history.
8. **Stable package-model round trip**: Include false enabled, priority zero, name/ident, ordinary and
   identified pre-engineering/effect, unresolved optional identity and source purchases. Compare
   package-modelled state after export/import/export under completed quality, fixed fill, identity
   casing and package-derived-field recomputation/omission. Ensure all capture-only health,
   timestamp, ammo and engineer identity do not become durable state.
9. **Export validation/link**: Export valid, invalid and incomplete active builds. Warnings show but
   delivery stays available. Include `appURL` only for an atomic same-revision certified canonical
   link; pending/refused/stale link is omitted without codec invocation or export failure.
10. **Delivery**: Deny/unavailable Clipboard, then select and Download identical bytes. Cover Share
    hidden, text, file, resolved, cancelled and failed with mocked ports. Download says dispatched or
    setup failed, never saved. A revision change invalidates the artifact before every action.
11. **Independent-consumer/network contract**: Generate a versioned reference-export corpus from the
    current application and record successful import of every artifact into both Coriolis and EDSY.
    Record each consumer's exact release/build identifier, corpus hash, date and result in
    `validation/consumer-compatibility.md`; use a locally pinned release when distributable, otherwise
    perform the deliberate manual check with synthetic/non-personal data. Package inspection and
    fixtures from those consumers remain supplemental, not substitutes for accepting new output.
    Runtime and automated tests reject every unexpected application request and never invoke a real
    clipboard/share target or remote consumer.
12. **Performance**: Discover the maximum-slot hull from the pinned package at test time, create a
    fully fitted/all-supported-fields fixture using package APIs and measure domain import/export
    with browser `performance.now()`. Each completes below 500 ms.
13. **Responsive/accessibility**: Exercise all inventory states in both engines across desktop,
    tablet/mobile portrait and landscape. Run axe plus semantic, label/error relation, 44-CSS-pixel
    target, no-overflow, doubled-copy, RTL, 200%-text and reduced-motion assertions.
14. **Manual accessibility**: Record actual 400% browser zoom, NVDA with Firefox, TalkBack with
    Chromium and a tablet screen reader when composition materially differs. Verify headings,
    dialog/description, field/error/diagnostic relationships, announcement dedupe, mode state,
    technical bidi isolation and complete actions.

## Full gate

```bash
pnpm run check
```

Format, full typecheck, production static build, script/unit tests with all four coverage metrics at
least 80%, and the complete dual-engine Playwright/accessibility suite must pass without skips.
