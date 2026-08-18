# Contract: Distribution Artifacts

This contract defines the build boundary that makes versions, legal text and provenance traceable to
the artifacts actually shipped. It is a Node/tooling contract, not a runtime API.

## Inputs

The generator reads only local installed/repository artifacts:

| Input                                                        | Authoritative value                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| root `package.json`                                          | application name/version                                             |
| root `LICENSE`                                               | complete application licence and application-specific Frontier terms |
| resolved Almanac `package.json`                              | exact package name/version and `bugs.url`                            |
| resolved Almanac `LICENSE`                                   | complete Almanac licence/scope/Frontier terms                        |
| resolved Almanac `THIRD_PARTY_NOTICES.md`                    | complete third-party and Frontier notice                             |
| `legal/almanac/LICENSE`                                      | committed source-distribution mirror of installed Almanac licence    |
| `legal/almanac/THIRD_PARTY_NOTICES.md`                       | committed source-distribution mirror of installed notice             |
| release workflow evidence or non-release build ID/git commit | build classification/identifier                                      |

The package root is located from
`import.meta.resolve('@elite-dangerous-almanac/core/ships/ships')` and relative URLs, matching the
existing codec generator. The pipeline does not use a package-manager store path, registry request or
unexported browser import.

## Required validation

Generation fails with a named diagnostic before Angular compilation when any of these conditions is
true:

- a manifest/legal file is absent, unreadable, invalid UTF-8, zero bytes or whitespace-only;
- the installed manifest name is not `@elite-dangerous-almanac/core` or either version is empty;
- a committed package mirror differs by even one byte from its installed artifact;
- a computed byte count or SHA-256 does not match the text placed in the generated manifest;
- a required document ID is absent/duplicated;
- `bugs.url` is not the exact expected HTTPS Almanac issues destination or contains a query/fragment;
- release evidence is missing/mismatched, requests release for `0.0.0`, or does not match the root
  version;
- a non-release build has no permitted CI/commit identifier, or the identifier contains personal,
  path, branch, whitespace, URL or other unsafe content;
- generated output would contain an absolute machine/workspace path;
- an installed package regresses to the #307 contradiction.

The #307 assertion is a regression check tied to the package-owned statement, not a consumer rewrite.
Retain a check that installed provenance references do not falsely claim the installed files are absent.

## Build identity

- `applicationVersion` is copied exactly from root `package.json#version`.
- `almanac.version` is copied exactly from installed package `package.json#version`.
- Only an explicit release-workflow input whose version/ref equals `applicationVersion` emits
  `kind: release`; optimisation mode is irrelevant.
- Every other build emits `kind: nonRelease` and a required safe build ID. CI supplies an immutable
  ID; a repository build may use an abbreviated commit with `dirty` suffix. The allowed format is
  deliberately conservative and bounded.
- No branch, user, email, runner, host, workspace path, timestamp or random value is included.

The UI renders separate localised labels. Neither value may be described as the live game or live
catalogue version.

## Legal bytes and outputs

The generated TypeScript module contains immutable data equivalent to:

```text
DistributionManifestV1 {
  build: BuildIdentity
  almanac: { packageName, version, issueTrackerUrl }
  documents: [applicationLicense, almanacLicense, almanacThirdPartyNotices]
}
```

Each document includes exact UTF-8 text, byte length and SHA-256. JSON/string escaping used to create
valid TypeScript is transport encoding only: re-encoding the runtime string must reproduce the source
bytes and hash. Generation formats its own TypeScript deterministically.

The generated module is ignored and rebuilt before standalone typecheck/test/build commands. Raw
application/package legal artifacts are also copied to the static distribution without transformation
for traceability and service-worker prefetch. A post-build verifier requires those output bytes to
match the authoritative inputs and confirms that the browser manifest exposes the same versions and
hashes.

## Source-distribution sync

An explicit maintainer command may synchronise `legal/almanac/` after a package upgrade. Normal
typecheck/test/build/check commands never overwrite those committed files; they fail on drift so the
legal change remains reviewable. The root `LICENSE` remains authoritative for application code and
its non-relicensing statement.

## Pipeline integration

- Run generation before every command that imports the generated TypeScript module, including direct
  typecheck, unit test, development serve and production build.
- Run generator tests in `pnpm run test:scripts` and include that step in split CI as well as
  `pnpm run check`.
- Run post-build verification against the production static output.
- Keep the generated module and temporary test outputs ignored; keep `legal/almanac/` tracked.
- Do not use Angular's `3rdpartylicenses.txt` as a substitute for any required document.

## Released regression

Almanac 0.1.1 includes the released
[#307](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/307) correction. Exact generation
preserves it. The application may not edit the statement, apply a patch-package step, suppress the
section or replace it with private copy.
