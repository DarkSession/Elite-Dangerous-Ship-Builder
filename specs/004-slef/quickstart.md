# Quickstart: Validate SLEF Import and Export

Normative contracts: [import](./contracts/slef-import.md), [export](./contracts/slef-export.md) and
[browser delivery](./contracts/browser-delivery.md).

## Upstream prerequisite

Do not implement until a released Almanac version satisfies
[quality normalization #292](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/292) and
[fixed-mount repair #298](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/298). Include
the related [cargo-hatch validation #293](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/293)
in the upgrade verification. Pin the release, rerun [research](./research.md) reproductions and the
constitution gate. Beta.12 is expected to retain `Quality: 0.42` and lack immutable repair.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
```

For managed browser version mismatches, set `E2E_CHROMIUM_PATH`/`E2E_FIREFOX_PATH`; never remove a
project.

## Acceptance scenarios

1. **Import without a build**: On `/build` with no active loadout, import one package-generated bare
   journal event, then one one-entry envelope. Both produce the same modelled build without a prior
   hull choice or request.
2. **Atomic rejection**: With dirty active/local/link/history state, try empty, syntax error, `[]`, two
   valid, mixed valid/invalid, invalid fields, 65,537 ASCII bytes and multibyte text over 65,536 bytes.
   All preserve draft and every active/stored byte; oversize never calls the inspector; diagnostics
   preserve index/path/code/constraint/params.
3. **Replacement**: Cancel a valid import over unsaved work, verify no change, then accept. Acceptance
   is one replacement, resets edit history and autosaves only after commit.
4. **Normalization**: Package fixtures cover partial ordinary/effect engineering, every supported
   pre-engineered route, missing/unresolved fixed mounts and unresolved non-fixed module. Package
   recomputes quality 1, exact defaults fill fixed mounts, unavailable defaults remain incomplete,
   unresolved optional identities remain, and every outcome is reported.
5. **Stable round trip**: Include false enabled, priority zero, name/ident and all supported fields.
   Export/import/export compares equal except completed quality/fixed fill; reports never appear in
   SLEF.
6. **Source purchase**: Untouched capture re-exports valid source values; package edit/normalization
   invalidates affected values; absent/new-build values remain absent; retail never substitutes.
7. **Invalid/link-refused export**: Package warnings show but SLEF is generated; refused link merely
   omits `appURL`; package inspector and independent consumer fixtures accept the entry.
8. **Delivery**: Deny clipboard, then select/download identical bytes. Test share absent/text/file,
   cancellation and failure. Artifact/alternatives always remain and no real target receives data.
9. **Performance/network**: Generate a package 39-slot fully fitted/all-fields fixture. Browser-domain
   import/export each finish under 500 ms; reject every unexpected request.
10. **Responsive/a11y**: Exercise every state in Chromium/Firefox across desktop, tablet/mobile
    portrait/landscape with axe, roles/names/state, touch, 200% text, 400% zoom, expanded/RTL text,
    reduced motion and no page overflow.

## Full gate

```bash
pnpm run check
```

Formatting, typecheck, static build, script/unit tests with all coverage metrics at least 80%, and the
complete dual-engine Playwright/accessibility suite must pass without skips.
