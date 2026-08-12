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

### II. The Almanac Is the Source of Truth

Elite Dangerous game data and derived calculations come from
`@elite-dangerous-almanac/core`. Ship hulls, slots, modules, blueprints,
experimental effects, jump range, power, shields, armour, weapon metrics and
SLEF parsing/serialisation MUST be taken from that package.

- The application MUST NOT hand-maintain a parallel copy of game data, and MUST
  NOT reimplement a calculation the package already provides.
- Domain identities are the package's identities: `symbol` for hulls and
  modules, `fdname` for blueprints, experimental effects and decorative
  modifications, and the game's own slot keys (never positional indices).
- If a needed datum or calculation is missing from the package, the gap is
  raised upstream. A local workaround MUST be isolated, documented as
  temporary, and reference the upstream issue.
- Import the package's leaf subpaths (e.g.
  `@elite-dangerous-almanac/core/ships/ships`) rather than pulling in
  catalogues a screen does not need.

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

### V. Specification Before Implementation

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
  evergreen browsers for the app itself. The dev container in `.devcontainer/`
  is the reference environment.
- **Data dependency**: `@elite-dangerous-almanac/core`, which is ESM-only and
  side-effect free.
- **Build output**: static assets only. No server-side rendering, no runtime
  environment configuration baked into the bundle.

## Development Workflow

- Feature specs live in `specs/<NNN>-<short-name>/`. The constitution governs
  them all.
- `pnpm run check` (format, typecheck, build, test) MUST pass before a change is
  proposed for merge.
- Tests accompany domain logic. A bug fix starts with a test that reproduces the
  bug.
- UI design is deliberately deferred: the specs describe behaviour and the
  information a screen must convey, not its visual design. Visual design is a
  separate, later workstream and MUST NOT be treated as a blocker for domain
  work.

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

**Version**: 1.0.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-12
