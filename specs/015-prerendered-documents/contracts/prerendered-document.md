# Contract: the document a content-bearing address answers with

**Feature**: 015 | **Satisfies**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-007,
FR-011, FR-012, FR-020

The interface here is the HTTP response a reader gets. Its consumers are search
engines, AI crawlers, link checkers and Commanders — none of whom run this
repository's code, so this is a real external contract rather than an internal
one.

## Shape

A single HTML document, served with a 200 status at the advertised address, made
of three parts.

```
<head>   the eleven substitutions feature 011 established — unchanged
<body>   <app-root>…the rendered screen…</app-root>
         the module scripts ng build already injects
```

## The head — unchanged, and it must stay that way

Every generated document carries, exactly as `documentHead` already produces them:

| Tag                                                    | Value                                       |
| ------------------------------------------------------ | ------------------------------------------- |
| `<title>`                                              | The address's own title, in bundled English |
| `<link rel="canonical">`                               | `${origin}/${path}`                         |
| `description`, `og:description`, `twitter:description` | The address's own description               |
| `og:title`, `twitter:title`                            | The title                                   |
| `og:url`                                               | The canonical                               |
| `og:image`, `twitter:image`                            | The hull's illustration, or the site card   |
| `og:image:alt`                                         | The title                                   |

**Rules**

- This feature adds a body. It does not weaken, reorder or reinterpret the head
  (FR-005).
- The substitution is applied **to the generated document for that address**, not
  to a content-free shell. Applying it to a shell is the old behaviour and would
  destroy every body this feature produces
  ([address-set.md](./address-set.md) §5).
- A substitution whose anchor tag is absent MUST throw. A silent no-op here looks
  exactly like a published address (`publish-static-routes.mjs:22-23`).
- Every substitution passes a **function** to `String.replace`, so `$&`, `` $` ``,
  `$'` and `$1`–`$9` in a translated string cannot splice matched markup back in.
- `<base href>`, robots, theme-color, JSON-LD, icons and the manifest link are
  inherited from `src/index.html` unchanged.

## The body — what this feature adds

### Every document

- The rendered screen for that address, in **bundled English** (FR-011).
- Enough text that a reader running no script can state what the address is about.
- **A heading naming the address's subject, first in document order.** The shell
  renders one bar composition and hides the other with `display: none`, so a hull's
  document carries two `<h1>` elements in markup while exactly one is rendered and
  exactly one is in the accessibility tree. A reader applying no CSS sees both, so
  document order is the contract: the first `<h1>` is the address's subject
  (`design/first-frame.md`).

### A hull's document — `ships/<hull>` (FR-002)

States, as text:

| Figure                                                 |
| ------------------------------------------------------ |
| Manufacturer                                           |
| Size (landing pad class)                               |
| Maximum speed                                          |
| Base shield                                            |
| Hull mass                                              |
| Crew                                                   |
| Mass lock                                              |
| Hardpoint counts by class — huge, large, medium, small |
| Internal capacity by size                              |

A hull's document legitimately also contains the catalogue, because
`ships/:hull` is a child route of `ships` and the catalogue is on screen behind
the inspector at wide widths. That is the screen, not a mistake.

### The catalogue's document — `ships` (FR-003)

Names every hull the catalogue lists, and links to each hull's own address.

### The root's document — `''`

States what Nav Beacon is and the tools it carries.

## Prohibitions

A generated document MUST NOT contain:

- **Any Commander data** — no build, no saved record, no note, no name, no
  identifier (FR-007, constitution I).
- **The application version.** It is stamped in CI only, immediately before
  `ng build`, so a body carrying it would bake a CI-only value into static HTML
  and diverge from a locally built document (FR-007, research decision 14).
- **Any runtime environment configuration** (FR-007, 9.1.0 Technology Constraints).
- **Any cross-origin request URL.** Already enforced mechanically by
  `productionOutputViolations` over `dist/navbeacon/browser`.
- **A fabricated figure.** Where the package reports a value unavailable, the
  document states the absence rather than a plausible number (FR-004,
  constitution IV).

## Honesty gate (FR-020)

Every figure in every generated document is compared against the pinned package by
an automated check, so a document that silently stops matching fails the build
rather than being published.

**Where**: `scripts/check-prerendered-documents.mjs`, run by
`pnpm run test:scripts`, which CI runs (`ci.yml:122-123`). It is a script test
rather than an end-to-end test because comparing a document to the package
requires importing the package.

**What it asserts**

1. Every content-bearing address has a document.
2. Each hull's document contains that hull's figures, as the package reports them.
3. No document contains a prohibited item from the list above.
4. Every document's head still matches `documentHead` for its address.
5. Every document's first `<h1>` names that address's subject, and no document's
   body is an empty `<app-root>` — the signature of the publishing script having
   overwritten what the builder produced (address-set.md §5).

## Failure behaviour

| Situation                            | Required behaviour                                                                                | Requirement |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------- |
| The takeover does not complete       | The Commander is left with the readable document, not an empty page                               | FR-012      |
| An address has no generated document | The running application resolves it; the Commander sees the screen they would otherwise have seen | FR-015      |
| The address resolves to no hull      | Behaves as today. No generated document for a hull that does not exist                            | FR-016      |
| A substitution anchor is missing     | The build fails                                                                                   | FR-005      |
| A figure does not match the package  | The build fails                                                                                   | FR-020      |

## What this contract does not cover

- **The two benches.** `/outfitting` and `/equipment` are advertised, keep their
  head, and get no body. See [address-set.md](./address-set.md).
- **Which file the document is written to.** That is a hosting concern; see
  [address-set.md](./address-set.md).
- **Language other than English.** No per-language address exists (011/FR-017).
