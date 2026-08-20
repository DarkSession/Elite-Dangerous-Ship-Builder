# Contract: Responsive and Accessibility Verification

## Browser/profile matrix

Generate these five profiles for each engine, producing ten explicitly named projects:

| Profile          | Viewport | Primary input |
| ---------------- | -------- | ------------- |
| Desktop          | 1440×900 | pointer/click |
| Tablet portrait  | 834×1112 | touch/tap     |
| Tablet landscape | 1112×834 | touch/tap     |
| Mobile portrait  | 390×844  | touch/tap     |
| Mobile landscape | 844×390  | touch/tap     |

Engine descriptors set `browserName` and engine-appropriate defaults explicitly; Firefox projects
must not inherit Desktop Chrome device settings. `hasTouch: true` applies to the four touch profiles.
`E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH` may point to compatible installed executables without
renaming or removing projects.

Every primary journey runs in all ten projects. CI may shard the same matrix; it may not reduce it.
Retries remain diagnostic only and `failOnFlakyTests` is enabled in CI.

## Product and preview coverage ledger

Maintain a machine-readable ledger joining:

- every product route and stable relevant state;
- every primary journey and owning requirements;
- every exported UI component and applicable preview state;
- required axe and named semantic/responsive assertions;
- manual screen-reader/actual-zoom protocol ids for primary capabilities.

Static tests compare the ledger with route/UI exports, preview declarations and Playwright project
names. A new screen, state or component cannot silently avoid the suite.

## Automated checks

For every rendered product/relevant state and applicable preview declaration:

- run `@axe-core/playwright` after the state settles with WCAG A/AA tags through WCAG 2.2 AA;
- assert the expected banner/navigation/main/headings, visible/matching names, roles, state and
  label/description/error/unit relationships;
- assert each visual information carrier has its visible/programmatic text equivalent;
- assert meaningful targets meet the shared 44 CSS-pixel baseline, or record and verify every
  condition of a genuine WCAG 2.2 Target Size exception;
- assert `documentElement.scrollWidth <= clientWidth`; any necessary component-owned overflow is
  labelled, bounded and does not hide the only copy of an action or meaning;
- assert root `lang`/`dir`, localized formatting, bidi isolation and absence of raw keys/placeholders;
- exercise pointer/click in desktop and touch/tap in touch projects with no prerequisite hover or
  multipointer gesture;
- emulate `prefers-reduced-motion: reduce` and confirm state/feedback equivalence while nonessential
  animation/transition disappears;
- render doubled/long copy and RTL providers in both engines and assert stable semantic order and no
  truncation of required meaning.

Automate 200% text using a test-only root text-scale provider before application render. Also run a
320 CSS-pixel reflow variant in both engines; this is a variant, not an eleventh/twelfth project. A
390-pixel mobile project alone is not the WCAG 400%-reflow proxy.

## Axe scope and constitutional exclusions

Start with no disabled axe rules and never suppress a whole WCAG tag or page region. If an axe rule
maps solely to one of the constitutionally excluded keyboard criteria, a future exception requires:

1. a versioned rule-to-criterion record using the installed axe rule metadata;
2. an automated assertion that every mapped criterion is in the seven-item exclusion set;
3. retained feature-specific semantic assertions;
4. no suppression of any in-scope criterion also covered by that rule.

Attach the full axe JSON result to a failure. Automated results are a floor and cannot replace manual
meaning/screen-reader evaluation.

## Manual accessibility gates

Store versioned protocol and result records for every primary capability:

- NVDA with Firefox on desktop;
- TalkBack with Chromium on mobile;
- a tablet screen reader whenever composition or interaction differs materially;
- actual 400% browser zoom in Chromium and Firefox;
- pointer and single-touch completion in portrait and landscape.

Each record names OS, browser, assistive-technology versions, viewport/orientation, capability/state,
steps, expected speech/behavior, actual result, date and pass/fail. Protocols cover landmark/heading
discovery, matching names, states/errors, dialog/layer isolation, text equivalents, assertive/polite
urgency and deduplication, language switching and canonical-game-text disclosure. Screen-reader
quick navigation/gestures remain required even though the named keyboard-operation criteria are
excluded.

## Static/build gates

`pnpm run check` keeps formatting, production build, unit coverage and E2E, and adds:

- TypeScript `strict` and Angular `strictTemplates` compilation;
- fixture-tested Angular/TypeScript/PostCSS interface policy checks;
- repository-wide English/German exact-key, nonblank-value, interpolation-variable and
  reviewed-wording validation after every capability change;
- UI export/preview/coverage-ledger reconciliation;
- production-output assertion that no preview route/chunk exists;
- production-service-worker offline validation for shell/English and a previously opened German
  asset;
- all ten projects, all applicable axe scans and no skipped/focused/quarantined tests.

The current 80% statement, branch, function and line thresholds remain unchanged.
