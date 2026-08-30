# Almanac source-distribution mirrors

`LICENSE` and `THIRD_PARTY_NOTICES.md` in this directory are **byte-exact copies** of the same two
files in the installed `@elite-dangerous-almanac/core` package. They are here because the terms the
package travels under require a source distribution of this repository to carry them, and a
distribution that ships only the root `LICENSE` would not (feature 012, FR-004).

## Rules

- **They are copies, not documents this project wrote.** Do not edit a character of either file — not
  a heading, not a line ending, not a trailing newline. `scripts/generate-help-manifest.mjs` compares
  them against the installed package byte for byte on every read-only run, and one byte of drift
  fails the build by name.
- **An ordinary build never rewrites them.** Generation, `pnpm run build`, `pnpm run check` and every
  Angular or Playwright command read these files and refuse to proceed when they disagree with the
  package. None of them repairs the disagreement silently.
- **`pnpm run legal:sync` is the only path that writes them**, and it is a maintainer action. Run it
  when — and only when — the `@elite-dangerous-almanac/core` version changes, in the same change as
  the dependency bump, and review the resulting diff as legal text rather than as a lockfile
  artifact. New or altered terms are the thing the review is for.
- **The generator also fails on an unmirrored artifact.** If an Almanac upgrade adds a top-level
  `LICENSE*`, `LICENCE*`, `COPYING*`, `NOTICE*` or `*THIRD_PARTY*` file this directory does not
  mirror, generation stops and names it, so a new obligation cannot arrive unnoticed.

## What these files are not

They are not modal content. The Help · About modal embeds exactly one legal body — the project's own
Frontier media-usage disclaimer, extracted from the repository's root `LICENSE` — and offers exactly
one external link, to that root `LICENSE` on GitHub. Neither file here is rendered, linked or
summarised in the application (feature 012, FR-003).
