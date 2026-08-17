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
- The application MUST be deployable as static files to any static host.
- Every capability MUST remain usable offline after first load. **Assets the
  application serves from its own origin MAY be fetched at runtime** rather than
  bundled into the initial load — hull illustrations, schematics and anything
  else whose weight would make the first load pay for artwork the Commander has
  not asked to see. What is available offline is then what the Commander has
  already opened, not the whole catalogue. An asset that has not been fetched
  MUST NOT block or degrade any capability, MUST show its absence as a temporary
  one rather than as a fault or a permanent gap, and MUST arrive once the network
  returns without the Commander reloading the application.
- No accounts, no authentication, no server-side persistence and no server-side
  sharing. A build is shared by handing someone a URL or a SLEF payload.
- No telemetry, analytics or third-party network beacons, and **no automatic or
  programmatic request to any origin other than the one the application is served
  from**. Runtime asset requests to the application's own origin are permitted by
  the clause above. A Commander MAY explicitly navigate to identified external
  documentation or an issue tracker; that navigation MUST follow a deliberate
  action, MUST be identified as leaving the application and MUST NOT include build
  data. Any other outbound request needs an amendment to this constitution.

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
  absent; it is never substituted with zero or a guess. The two bullets below
  are the **only** exceptions. Each is a deliberate product rule rather than a
  convenience, each is reported to the Commander rather than applied silently,
  and each substitutes something a Commander could reproduce in the game — not a
  plausible-looking value. A third exception requires amending this principle.
- **Engineering quality is deliberately outside the application model.** A
  selected blueprint grade always represents a completed (100% quality) grade.
  Imports carrying a partial engineering quality are normalised to 100%, and
  exports report 100%; the application does not retain or present the source
  roll's partial quality. A build is shared so that another Commander can build
  it, and a partial roll cannot be reproduced at an engineer, so a plan quoting
  one would describe a ship its reader cannot make.
- **A fixed mount is never empty.** The seven core internals, armour and the
  built-in cargo hatch are mounts every hull always carries and none can fly
  without; outfitting offers a swap and no route to a ship missing one. A build
  reaching the application with such a mount empty — or carrying a module symbol
  the catalogue cannot resolve — MUST have that hull's stock module fitted
  before the build is presented and before any figure is read from it, and the
  Commander MUST be told which mounts were filled and what was replaced. The
  stock module is the one `@elite-dangerous-almanac/core` records in the hull's
  default loadout; the application MUST NOT derive a substitute of its own, and
  where the package carries no stock module for that mount the mount stays empty
  and the build is reported incomplete. The fill changes the build rather than
  the display, so a later save, share or export carries it. Emptying a fixed
  mount MUST NOT be offered at all, which the application MUST reach by
  surfacing the package's own removability report rather than by a rule of its
  own (principle II).
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
- The application MUST meet **WCAG 2.2 level AA** on every form factor. That is
  the standard, not an aspiration: every capability MUST be operable by
  keyboard alone in a sensible order with a visible focus indicator, navigable
  by screen reader with correct roles, names and state, legible at 200% text
  size and at 400% zoom without loss of content or function, and free of any
  information carried by colour, shape or position alone. Contrast MUST meet the
  AA ratios for text and for the non-text elements that carry meaning; touch
  targets MUST meet the AA target-size rule; motion MUST respect
  `prefers-reduced-motion`.
- Accessibility is verified, not assumed: an automated accessibility check MUST
  run over every screen as part of the end-to-end suite, and a failure MUST fail
  the build. An automated pass is a floor rather than a proof — a capability
  that cannot be operated by keyboard or understood by screen reader is
  incomplete however the checker scores it.
- End-to-end tests MUST cover desktop, tablet and mobile viewports in every
  browser engine principle VIII names. A feature is not done until it passes on
  all of them.

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
- Translations MUST ship as the application's own static assets. No runtime
  translation service, no request to any other origin, and no server-side
  rendering of translated text (principle I). A locale's messages MAY be fetched
  from the application's own origin under principle I's runtime-asset clause —
  but text is not artwork: a Commander MUST NOT be left unable to read the
  interface because a locale did not arrive, so the fallback language the next
  clause requires MUST be present without a network.
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

### VII. One Design System (NON-NEGOTIABLE)

Every screen a Commander sees is composed from one design system. Visual design
is defined in this repository, alongside the behaviour it presents — not
improvised screen by screen, and not deferred until the domain is finished.

- There is exactly **one** design system. A screen composes it; a screen MUST NOT
  invent a visual language of its own.
- Design tokens — colour, type scale, spacing, radius, elevation, motion — are
  defined once and are the only source of visual values. No component and no
  screen may hard-code a colour, size, spacing or duration.
- The application ships **one theme** — the dark one the design system defines.
  It is not a Commander preference, no light theme is offered, and no
  requirement anywhere in this repository may depend on a theme being chosen or
  changed. Theming remains a matter of tokens: were a second theme ever added it
  would be a second set of token values, never an edit to a component.
- Components are presentation only. They render the state they are handed and
  dispatch intent; they MUST NOT reach into domain services or hold build state
  (principle III).
- Every component ships with a preview of the states it must handle — default,
  populated, empty, loading, error, disabled — at desktop, tablet and mobile
  widths (principle V).
- Accessibility belongs to the component, not to the screen that uses it.
  Contrast, focus order, keyboard operation, touch target size and semantic
  labelling are part of a component's definition (principle V).
- Every string a component renders resolves through the localisation layer, and
  every component survives text expansion (principle VI).
- The library is versioned in this repository, and this repository is the source
  of truth for any external design tool it synchronises with. A visual change
  lands here; a design tool is a working surface and a preview, never the record.
- A screen that needs something the system does not have MUST extend the system
  rather than work around it locally. Extending it is ordinary work; a one-off
  style inside a screen is the drift this principle exists to prevent.

### VIII. Tested Before It Ships (NON-NEGOTIABLE)

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
  against desktop, tablet and mobile viewports in **both Chromium and Firefox**.
  Two engines is the minimum that catches an engine-specific defect at all; a
  suite that passes in one browser only proves the application works in that
  browser. A journey is not covered until it passes in both.
- The end-to-end suite MUST include an automated accessibility check over every
  screen, under principle V. A violation fails the build like any other test.
- `pnpm run check` — format, typecheck, build, unit tests with coverage, and the
  Playwright suite — MUST pass before a change is proposed for merge, and MUST
  pass in CI.
- A bug fix starts with a failing test that reproduces the bug.
- Tests MUST NOT be skipped, quarantined or deleted to get a build green. A
  genuinely flaky test is a defect to fix, not to mute.

### IX. Specification Before Implementation

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
  desktop, tablet and mobile projects configured in `playwright.config.ts`,
  each run in Chromium and in Firefox.
- **Design system**: one component library under `src/app/ui/`, with design
  tokens defined in the global stylesheet layer and one dark theme built from
  them. It is versioned in this repository, and this repository is the source of
  truth for any external design tool it synchronises with (principle VII).
- **Build output**: static assets only. No server-side rendering, no runtime
  environment configuration baked into the bundle.

## Development Workflow

- Feature specs live in `specs/<NNN>-<short-name>/`. The constitution governs
  them all.
- `pnpm run check` — format check, typecheck, build, unit tests with coverage,
  and the Playwright suite — MUST pass before a change is proposed for merge.
- Tests accompany domain logic, and each user story's primary journey gets an
  end-to-end test across the three form factors.
- **Functionality is specified per capability, never per screen.** A feature
  spec describes what a Commander can do and the information a screen must
  convey. It names no screen and pins no component. One capability appears on
  several screens and one screen serves several capabilities, so binding a
  requirement to a screen would invalidate the spec every time the layout
  changed. Behaviour is the durable half; screens are not.
- **Screens are defined at plan time**, in `specs/<NNN>-<short-name>/design/`,
  alongside the plan's other design artefacts. A screen definition records what
  the screen composes from the design system, the states it must handle, and the
  requirements it satisfies — so that every requirement lands on a screen and
  every screen justifies itself against a requirement.
- The screen inventory and its requirement mapping MUST exist before a feature's
  tasks are broken down. Finished visuals may follow: domain work waits on the
  mapping, never on the pixels.
- Responsiveness, touch support and accessibility (principle V), translatability
  (principle VI) and composition from the design system (principle VII) are
  behavioural requirements, not design choices, and are in scope from the start.
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
to justify itself against them; when it cannot, the simpler option wins. An
amendment's rationale is recorded in the change that makes it; this document
states the principles as they stand now, not the history of how they got here.

**Version**: 3.1.0 | **Ratified**: 2026-08-12 | **Last Amended**: 2026-08-17
