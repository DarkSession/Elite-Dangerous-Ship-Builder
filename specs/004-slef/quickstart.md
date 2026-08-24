# Quickstart: Validate SLEF Import and Export

Normative contracts: [import](./contracts/slef-import.md),
[export](./contracts/slef-export.md), [browser delivery](./contracts/browser-delivery.md) and
[routes/UI](./contracts/routes-and-ui.md). Data/state details are in [data-model.md](./data-model.md).

## Prerequisites

- The installed Almanac package exposes `inspectSlef`, `ShipLoadout.fromLoadout`,
  `completeEngineeringGrade`, `toSlefString` and `getSlefDiagnosticMessage` through leaf exports,
  refuses an unknown hull and returns every fixed mount populated.
- Feature 011's strict compiler, localization/design-system, preview, ten-project Playwright and axe
  foundations are present.
- Feature 001's active-build snapshot/replacement/persistence/current-revision-link boundaries are
  present.
- The shared feature 002 ingress normalizer implements source-partial completion after package construction.

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
3. Verify missing and unusable fixed entries become package defaults during construction; unknown
   module fixtures are outside the supported contract.
4. Verify a resolved source `Quality: 0.42` is preserved by construction, then becomes package-
   recomputed quality 1 only after `completeEngineeringGrade`. Verify an unsupported resolved partial
   returns structured refusal without mutation. Do not call completion on quality-1 final articles.
5. Verify package construction returns exact defaults for every missing fixed mount with no
   `repairFixedMount` call, application default lookup, provenance or credit-field rewrite.
6. Verify default credit export uses current package catalogue retail after engineering, symbol
   replacement/removal and package-defaulted fixed construction. Source purchase values must not be
   requested or retained.
7. Import a fitted module carrying `Health`. Its presence or omission on package re-export must not
   affect acceptance or round-trip equality. Separately verify the reconstructed fitted configuration
   returns the same package-derived engineered module integrity.

Do not proceed on a package-owned calculation or model regression; raise it against the Almanac and
wait for a released fix.

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
   undo/redo. For every failure, cancel and supersession assert byte/state
   equality plus preserved draft. Assert over-limit never calls `inspectSlef`.
5. **Replacement**: Cancel a valid candidate over unsaved work, then accept it. Cancel changes
   nothing. Acceptance is one feature 001 replacement, one working autosave/link synchronization and
   one feature 002 history reset; feature 004 performs none directly.
6. **Normalization order**: Cover absent or unusable fixed entries, then
   ordinary/Mercenary/identified partials on resolved modules. Package construction populates fixed
   mounts first and partial completion follows. Unsupported resolved partials refuse whole.
7. **Aftermath/persistence split**: After acceptance, the workspace reports the transient quality
   completions through feature 002's own completion notice and the final validation through feature
   003's build-status rail. Feature 004 draws no report of its own — the canvas has none, and each
   fact appears exactly once (`design/import-outcome.md`, "Divergence"). Dismissal edits nothing.
   Feature 001 persists the accepted revision's `valid`/`complete` booleans; the detailed
   quality/issue presentation does not persist, and none enters link/SLEF/history.
8. **Stable package-model round trip**: Include false enabled, priority zero, name/ident, ordinary and
   identified pre-engineering/effect plus absent fixed entries. Compare package-modelled state after
   export/import/export under completed quality, fixed defaults, identity
   casing and package-derived-field recomputation/omission. Ensure capture-only per-module `Health`,
   timestamp, ammo, engineer identity and historical purchase values do not affect application-model
   equality, while package-derived module integrity remains equal.
9. **Export validation/link**: Export valid, invalid and incomplete active builds. Warnings show but
   delivery stays available. Include `appURL` only for an atomic same-revision certified canonical
   link; pending/refused/stale link is omitted without codec invocation or export failure.
10. **Delivery**: Deny/unavailable Clipboard, then select and Download identical bytes. Cover Share
    hidden, text, file, resolved, cancelled and failed with mocked ports. Download says dispatched or
    setup failed, never saved. A revision change invalidates the artifact before every action.
11. **Independent-consumer/network contract**: Generate a versioned reference-export corpus from the
    current application with `pnpm run slef:corpus`, then record successful import of every artifact
    into both Coriolis and EDSY.
    Record each consumer's exact release/build identifier, corpus hash, date and result in
    `validation/consumer-compatibility.md`; use a locally pinned release when distributable, otherwise
    perform the deliberate manual check with synthetic/non-personal data. Package inspection and
    fixtures from those consumers remain supplemental, not substitutes for accepting new output.
    Runtime and automated tests reject every unexpected application request and never invoke a real
    clipboard/share target or remote consumer.
12. **Performance**: Discover the maximum-slot hull from the installed package at test time, create a
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
