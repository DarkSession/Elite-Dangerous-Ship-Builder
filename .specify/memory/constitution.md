# Elite Dangerous Ship Builder Constitution

The Elite Dangerous Ship Builder is a browser application for planning ship
loadouts: pick a hull, fit and engineer modules, read the resulting build
metrics, and hand the build to other tools as SLEF.

## Core Principles

### I. Client-Side Only (NON-NEGOTIABLE)

The application is a static, client-side single-page application. There is no
backend, no application server, no database and no application API of our own.
Every capability — hull and module catalogues, engineering, build metrics, save,
load, import and export — MUST run in the browser.

Consequences that follow from this and MUST be honoured:

- Build state lives in the browser (in-memory, `localStorage`) or in a URL. It
  is never uploaded.
- The application MUST remain fully usable offline after first load, and MUST
  be deployable as static files to any static host.
- No accounts, no authentication, no server-side persistence and no server-side
  sharing. A build is shared by handing someone a URL or a SLEF payload.
- No telemetry, analytics or third-party network beacons. Any future outbound
  request needs an amendment to this constitution.

### II. The Almanac Is the Source of Truth (NON-NEGOTIABLE)

Elite Dangerous game data and derived calculations come from
`@elite-dangerous-almanac/core`. Ship hulls, slots, modules, blueprints,
experimental effects, jump range, power, shields, armour, weapon metrics and
SLEF parsing/serialisation MUST be taken from that package.

- The application MUST NOT hand-maintain a parallel copy of game data, and MUST
  NOT reimplement a calculation the package already provides.
- Domain identities are the package's identities: `symbol` for hulls and
  modules, `fdname` for blueprints, experimental effects and decorative
  modifications, and the game's own slot keys (never positional indices).
- Import the package's leaf subpaths (e.g.
  `@elite-dangerous-almanac/core/ships/ships`) rather than pulling in
  catalogues a screen does not need.

**Defects and gaps in the library are fixed in the library.** When the package
returns a wrong value, is missing a datum or calculation, or has an awkward API,
the ship builder does not paper over it:

- The problem MUST be called out and raised against
  [Elite-Dangerous-Almanac](https://github.com/DarkSession/Elite-Dangerous-Almanac),
  with a minimal reproduction.
- The fix MUST land in the library, and the ship builder MUST then consume the
  released version. Correcting, patching, clamping, re-deriving or
  special-casing a library result inside this application is prohibited —
  including "just this once" adjustments buried in a component or a formatter.
- A blocked feature waits on the upstream fix. Shipping a workaround to save
  time is not an available trade: it forks the source of truth, and every
  consumer of the library keeps the bug.
- The only sanctioned local code is presentation of what the library returns
  (formatting, ordering, labelling) — never a different value from the one it
  computed.
- If a workaround is ever unavoidable, it requires an explicit amendment to this
  constitution naming the upstream issue and the removal condition. It is a
  constitutional exception, not an implementation detail.

### III. Domain Logic Outside the UI

Build state and the rules that govern it live in framework-agnostic TypeScript
services and state stores. Components render state and dispatch intent; they do
not own outfitting rules.

- A build's behaviour MUST be testable without rendering a component.
- Presentation concerns MUST NOT leak into domain code, and domain state MUST
  NOT be duplicated inside component fields.
- Feature work adds domain capability first, UI second.

### IV. Lossless, Honest Builds

A build is round-trippable and never silently wrong.

- Import → edit → export MUST preserve everything the application understands
  and MUST NOT invent values the source did not contain. Absent data stays
  absent; it is never substituted with zero or a guess.
- Where the package reports a value as unavailable or a build as invalid or
  incomplete (`validation`, the nullable aggregates and their `*Result`
  counterparts), the application MUST surface that state rather than hide it
  behind a plausible-looking number.
- Malformed or hostile input (a tampered URL, a pasted SLEF file) MUST fail
  visibly and safely, leaving any existing build intact.

### V. Works on Desktop, Tablet and Mobile (NON-NEGOTIABLE)

Commanders plan builds at a desk, on the sofa with a tablet, and on a phone
while reading Discord. All three are first-class targets; none is a degraded
fallback.

- Every feature MUST be fully usable on desktop, tablet and mobile. A capability
  that exists on one form factor and not another is incomplete, not "desktop
  first".
- Layouts MUST be responsive and fluid rather than pinned to fixed widths. The
  page MUST NOT scroll horizontally at any supported viewport; wide content
  (statistics tables, module lists) scrolls within its own container.
- All interactions MUST work by touch as well as by pointer and keyboard.
  Interactive targets MUST be large enough to hit reliably on a phone, and
  nothing essential may depend on hover.
- Portrait and landscape orientations MUST both work on tablet and mobile.
- The application MUST remain accessible: keyboard-operable, screen-reader
  navigable, and legible at increased text sizes on every form factor.
- End-to-end tests MUST cover desktop, tablet and mobile viewports (see
  principle VII). A feature is not done until it passes on all three.

### VI. Speaks the Commander's Language (NON-NEGOTIABLE)

Elite Dangerous is played in many languages, and a loadout planner that reads
only in English excludes Commanders for no reason other than how it was built.

What this principle binds is the architecture, not a catalogue of languages.
Shipping with a single language is acceptable; making a string untranslatable,
or formatting a figure for one locale only, is not.

- Every user-facing string the application owns MUST be translatable and
  resolved through the localisation layer. Display text MUST NOT be hard-coded
  in a component, a template or a formatter.
- The Commander MUST be able to choose a language, and the choice MUST persist
  in the browser (principle I) rather than being inferred once and forgotten.
- Numbers, percentages, credits, distances and dates MUST be formatted for the
  active locale. Translated labels wrapped around English-formatted figures do
  not satisfy this principle.
- Translations MUST ship as static assets bundled with the application. No
  runtime translation service, no outbound request, no server-side rendering of
  translated text (principle I).
- A missing translation MUST fall back to a language the Commander can read. A
  raw message key, an empty string or a placeholder MUST NOT reach the screen.
- Layouts MUST survive translation. Text expansion and right-to-left scripts are
  held to principle V's requirements: no horizontal page scrolling, nothing
  truncated to the point of ambiguity, at every supported viewport.

**Game text belongs to the library.** Ship, module, blueprint, experimental
effect and material names, and the package's own diagnostic messages, are text
`@elite-dangerous-almanac/core` owns.

- Translating them is a capability of that package, requested and delivered
  there under principle II.
- This application MUST NOT hand-maintain a private translation of game data. A
  local translation table forks the source of truth exactly as a private
  catalogue would, and every consumer of the library keeps the gap.
- Until the package carries a locale, game nouns appear in the language it
  provides, and the application says so rather than presenting an untranslated
  name as a translation.

### VII. Tested Before It Ships (NON-NEGOTIABLE)

Correctness is enforced by the build, not by inspection.

- Unit test coverage MUST be at least **80%** — statements, branches, functions
  and lines. The threshold is enforced by the test runner, and a build that
  falls below it fails. Lowering the threshold to make a build pass is
  prohibited.
- Coverage is a floor, not a goal. Domain logic — build state, engineering,
  persistence, import and export — is expected to sit well above it, and
  coverage MUST NOT be manufactured with tests that assert nothing.
- End-to-end tests are written with **Playwright** and MUST run as part of the
  build. Every user story's primary journey MUST have an end-to-end test, run
  against desktop, tablet and mobile viewports.
- `pnpm run check` — format, typecheck, build, unit tests with coverage, and the
  Playwright suite — MUST pass before a change is proposed for merge, and MUST
  pass in CI.
- A bug fix starts with a failing test that reproduces the bug.
- Tests MUST NOT be skipped, quarantined or deleted to get a build green. A
  genuinely flaky test is a defect to fix, not to mute.

### VIII. Specification Before Implementation

Work follows the Spec Kit flow: specify → clarify (when needed) → plan → tasks
→ implement. A feature's spec.md describes user-visible behaviour and
requirements without prescribing implementation.

- Specs are behavioural: what a Commander can do, and how the result is
  verified.
- Ambiguity is recorded as `[NEEDS CLARIFICATION]` rather than resolved by
  silent assumption.
- Code that contradicts an accepted spec is a defect in one of the two; the
  mismatch is resolved deliberately, not left standing.

## Technology Constraints

- **Framework**: Angular (standalone, zoneless, signal-based state), TypeScript
  in strict mode.
- **Package manager**: pnpm. `pnpm-lock.yaml` is committed, and installs in CI
  use `--frozen-lockfile`.
- **Runtime**: Node.js per `.nvmrc` / `package.json#engines` for tooling; modern
  evergreen browsers for the app itself, on desktop, tablet and mobile. The dev
  container in `.devcontainer/` is the reference environment.
- **Data dependency**: `@elite-dangerous-almanac/core`, which is ESM-only and
  side-effect free.
- **Testing**: Vitest via the Angular unit-test builder, with coverage
  thresholds configured in `angular.json`; Playwright for end-to-end, with
  desktop, tablet and mobile projects configured in `playwright.config.ts`.
- **Build output**: static assets only. No server-side rendering, no runtime
  environment configuration baked into the bundle.

## Development Workflow

- Feature specs live in `specs/<NNN>-<short-name>/`. The constitution governs
  them all.
- `pnpm run check` — format check, typecheck, build, unit tests with coverage,
  and the Playwright suite — MUST pass before a change is proposed for merge.
- Tests accompany domain logic, and each user story's primary journey gets an
  end-to-end test across the three form factors.
- UI design is deliberately deferred: the specs describe behaviour and the
  information a screen must convey, not its visual design. Visual design is a
  separate, later workstream and MUST NOT be treated as a blocker for domain
  work. Responsiveness, touch support and accessibility (principle V) and
  translatability (principle VI) are behavioural requirements, not design
  choices, and are in scope from the start.
- A defect traced to `@elite-dangerous-almanac/core` is raised and fixed
  upstream (principle II). The ship builder tracks the released fix; it does not
  route around it.

## Governance

This constitution supersedes other practices. Amendments require a documented
rationale in the amending change, a version bump under the policy below, and
review of any spec the change invalidates.

- **MAJOR**: a principle is removed or redefined in a way that invalidates
  existing specs (for example, introducing a server).
- **MINOR**: a principle or section is added, or materially expanded.
- **PATCH**: clarification and wording that does not change obligations.

Every review MUST verify compliance with these principles. Added complexity has
to justify itself against them; when it cannot, the simpler option wins.

**Version**: 1.2.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-13

### Amendment history

- **1.2.0** — Added principle VI (speaks the Commander's language): every string
  the application owns is translatable and locale-formatted, translations ship
  as static assets, and game text stays the library's to translate under
  principle II. Tested-before-it-ships renumbered to VII and
  specification-before-implementation to VIII.

  The principle binds architecture rather than a language inventory, so it
  invalidates no accepted spec. Specs 001 to 005 predate it and state no
  language requirement; they inherit the obligation as they inherit principle V,
  and how a Commander selects a language, what falls back when a translation is
  missing, and which languages ship still need a feature spec of their own.
- **1.1.0** — Added principle V (works on desktop, tablet and mobile) and
  principle VI (tested before it ships: ≥80% unit coverage, Playwright
  end-to-end in the build); specification-before-implementation renumbered to
  VII. Hardened principle II: library defects are fixed in
  `@elite-dangerous-almanac/core`, and workarounds in this application are
  prohibited rather than merely discouraged.
- **1.0.0** — Initial ratification.
