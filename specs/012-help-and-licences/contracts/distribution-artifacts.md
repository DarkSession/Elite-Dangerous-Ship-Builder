# Contract: Distribution Artifacts

This contract defines the build boundary that makes the modal's versions, one legal excerpt,
external destinations and source-distribution terms traceable to the artifacts actually shipped. It
is a Node/tooling contract, not a runtime API.

## Inputs

The generator reads only local installed/repository artifacts plus explicit release metadata:

| Input                                                    | Authoritative value                                            |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| root `package.json`                                      | application name/version                                       |
| root `LICENSE`                                           | project-specific Frontier disclaimer and distribution boundary |
| resolved Almanac `package.json`                          | exact package name/version and `bugs.url`                      |
| resolved Almanac `LICENSE`                               | package terms mirrored in source distribution                  |
| resolved Almanac `THIRD_PARTY_NOTICES.md`                | package notices mirrored in source distribution                |
| `legal/almanac/LICENSE`                                  | tracked mirror of installed package licence                    |
| `legal/almanac/THIRD_PARTY_NOTICES.md`                   | tracked mirror of installed package notices                    |
| audited repository-licence URL constant                  | sole complete-legal-terms destination                          |
| release-workflow evidence or non-release CI/git evidence | build classification and identifier                            |

The Almanac root is located from
`import.meta.resolve('@elite-dangerous-almanac/core/ships/ships')` and relative URLs, matching the
existing codec-table generator. The pipeline does not depend on a pnpm-store path, registry request,
git remote, unexported browser import or runtime filesystem.

## Disclaimer extraction

The generator must:

1. decode root `LICENSE` as strict UTF-8;
2. find exactly one Markdown section headed
   `Elite Dangerous game data and imagery (Frontier media-usage notice)`;
3. within that section, find exactly one `Under those rules:` marker;
4. select the immediately following non-empty contiguous Markdown-indented block;
5. remove exactly four structural leading spaces from each block line and no other content;
6. reject a blank, malformed, duplicate, nested or section-crossing result; and
7. record the resulting UTF-8 bytes, byte count, SHA-256, source `LICENSE` and language `en`.

The selected block is the only legal body emitted to the browser manifest. The generator must not
emit the surrounding MIT terms, Almanac wording, third-party notices or a rewritten summary as legal
text. A generated-runtime check independently re-encodes the emitted string and compares its byte
count/hash with a fresh source extraction.

## External destinations

The audited application constant is exactly:

```text
https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE
```

It must parse as HTTPS with host `github.com`, the expected repository/ref/path, and no credentials,
port, query or fragment. It is the only destination tagged `completeLegalTerms`.

The Almanac issue destination comes from the installed manifest and must be exactly:

```text
https://github.com/DarkSession/Elite-Dangerous-Almanac/issues
```

It is tagged `packageDefectReport`, not legal terms. Any missing, changed or unsafe destination fails
generation so a package/repository change receives review rather than silently widening navigation.

## Build identity

- `applicationVersion` is copied exactly from root `package.json#version`.
- `almanac.version` is copied exactly from the resolved installed `package.json#version`.
- Only explicit release-workflow input whose version/ref equals `applicationVersion` emits
  `kind: release`; `0.0.0` and missing/mismatched evidence cannot be releases.
- Every other build emits `kind: nonRelease` and a required safe immutable `buildId`.
- CI may provide a bounded run/artifact identifier. A repository build may use an abbreviated commit
  plus optional `dirty` marker.
- The accepted identifier format excludes whitespace, URLs, slashes, backslashes, colon-separated
  paths, branch names, user/email/host/runner/account names, timestamps and random values.
- Production optimisation is not release evidence.

The UI receives separate application and Almanac values and may never label either as a live-game or
live-catalogue version.

## Source-distribution mirrors

Both installed Almanac legal inputs must be valid UTF-8, non-empty and non-whitespace. Their tracked
counterparts under `legal/almanac/` must be byte-for-byte identical. Normal generation/check commands
are read-only with respect to tracked mirrors and fail on any drift.

A separate explicit maintainer sync command may copy current installed artifacts after a dependency
upgrade. The resulting legal diff is reviewed alongside the package update. Root `LICENSE` remains
tracked and must continue to state that the application MIT licence does not grant rights in package
game data or artwork.

Mirrored document bodies do not enter `HelpManifestV1`, the initial bundle or the modal. They satisfy
the source-distribution boundary without creating additional legal-details destinations.

## Generated output

The deterministic TypeScript module contains data equivalent to:

```text
HelpManifestV1 {
  schemaVersion: 1
  build: BuildIdentity
  almanac: { packageName, version, issueTrackerUrl }
  disclaimer: { documentId, source, language, exactText, byteLength, sha256 }
  destinations: { repositoryLicense, almanacIssues }
}
```

Generation may escape characters to produce valid TypeScript, but re-encoding the runtime
`exactText` must reproduce the extracted bytes. Output is stable for identical inputs, contains no
absolute workspace path and is imported eagerly by the application frame. The generated module is
ignored and rebuilt before typecheck, unit tests, development serve and production build.

## Required failures

Generation/check/release fails with a source-specific diagnostic when:

- a required manifest/legal/mirror file is absent, unreadable, invalid UTF-8, empty or whitespace-only;
- the root disclaimer section, marker or block is absent, duplicated, malformed or empty;
- emitted disclaimer bytes, byte count or hash differ from fresh source extraction;
- the installed package name is not `@elite-dangerous-almanac/core`, or either version is empty;
- an installed legal artifact differs by one byte from its source-distribution mirror;
- root `LICENSE` no longer distinguishes application MIT rights from package artwork/game data;
- either external destination is absent, unexpected, non-HTTPS or contains forbidden URL parts;
- more or fewer than one `completeLegalTerms` destination would be emitted;
- release evidence is missing/mismatched/placeholder, or a non-release ID is missing/unsafe;
- generated output contains an absolute path, personal/environment identifier, build data or an
  unrequested complete legal document.

There is no runtime missing/loading/error fallback for these failures.

## Pipeline integration

- Add a generator/check command before every Angular command importing the generated module.
- Run generator tests through `pnpm run test:scripts` and therefore `pnpm run check`.
- Verify generated/runtime exact-text bytes and identity values in unit and production E2E tests.
- Keep generated output and temporary test fixtures ignored; keep `LICENSE` and `legal/almanac/`
  tracked.
- Do not use Angular's generic `3rdpartylicenses.txt` as a replacement for required source mirrors or
  as modal content.
