/**
 * The verification coverage ledger.
 *
 * One machine-readable record joining every surface the suite covers to the
 * requirements it evidences, the journey that exercises it, whether it is
 * scanned by axe, the named assertions that go beyond a scan, and the manual
 * protocol that covers what automation cannot judge.
 *
 * The point of the ledger is that "every" cannot silently drift. The policy
 * checker reconciles it against the route table, the exported UI components,
 * the preview declarations and the Playwright project names, and requires every
 * requirement id declared by a covered feature to appear here at least once,
 * naming the unregistered ids on failure. A new screen, state or component that
 * is not registered fails the build rather than quietly escaping the suite.
 *
 * **Ids are feature-qualified.** The same requirement number means different
 * things in different features, so an entry registers the feature number
 * alongside it and the checker compares per feature. Bare ids would let one
 * feature's coverage silently satisfy another's. Only ids inside a
 * `requirements` array count as registered.
 *
 * Capability features append their own entries and add their directory to
 * `COVERED_FEATURES` as they land. Adding a feature there immediately requires
 * every id its specification declares, so the list is the one deliberate place
 * where the scope of "every" is stated.
 */

/**
 * The feature directories whose requirements this ledger must account for.
 *
 * Feature 011 is the interface foundation; capability features join as they are
 * implemented. This is not a way to defer coverage for a feature that exists —
 * a feature with product code and no entry here is the drift the ledger is for.
 */
export const COVERED_FEATURES: readonly string[] = ['011-interface-foundations'];

/** The five layout profiles, each run in both engines. */
export const LAYOUT_PROFILES = [
  'desktop',
  'tablet-portrait',
  'tablet-landscape',
  'mobile-portrait',
  'mobile-landscape',
] as const;

export type LayoutProfile = (typeof LAYOUT_PROFILES)[number];

/** The two engines every profile runs in. CI may shard this; it may not reduce it. */
export const ENGINES = ['chromium', 'firefox'] as const;

export type Engine = (typeof ENGINES)[number];

/** Every Playwright project name the matrix generates. */
export const PROJECT_NAMES: readonly string[] = ENGINES.flatMap((engine) =>
  LAYOUT_PROFILES.map((profile) => `${engine}-${profile}`),
);

/** One covered surface and state. */
export interface CoverageEntry {
  /** Stable address: a product route and state, or a preview component state. */
  readonly surfaceId: string;
  /** Nonempty traceability set of requirement and success-criteria ids. */
  readonly requirements: readonly string[];
  /** The journey that exercises it. Primary journeys run in all ten projects. */
  readonly journey: string;
  /** True for every rendered product or preview state. */
  readonly axe: boolean;
  /** Named semantic and responsive checks that state expected meaning beyond axe. */
  readonly assertions: readonly string[];
  /** Protocol id for primary assistive-technology and actual-zoom coverage. */
  readonly manualRecord: string | null;
}

/**
 * The cross-cutting entries owned by the interface foundation itself.
 *
 * These evidence the design-system requirements (FR-001–FR-005) and the
 * verification requirements (FR-021–FR-024), which describe the system as a
 * whole rather than any one user story's surface.
 */
export const COVERAGE_LEDGER: readonly CoverageEntry[] = [
  {
    surfaceId: 'shell/landmarks-and-headings',
    requirements: ['011/FR-008', '011/SC-001'],
    journey: 'product/semantics',
    axe: true,
    assertions: [
      'exactly one banner, one main and at most one primary navigation',
      'exactly one visible h1, owned by the route rather than synthesized by the shell',
      'heading levels descend without skipping',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'shell/controls',
    requirements: ['011/FR-006', '011/FR-007'],
    journey: 'product/semantics',
    axe: true,
    assertions: [
      'every control exposes an accessible name containing its visible text',
      'selected, expanded, pressed, checked, invalid, busy and disabled state is exposed',
      'every journey completes by click on desktop and by tap on touch profiles',
      'no meaning is reachable only through hover or a multi-pointer gesture',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'ui/labelled-fields',
    requirements: ['011/FR-007'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'a visible label is programmatically associated with its control',
      'a description and an error are associated by aria-describedby',
      'a placeholder is never used as a label',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'ui/values-and-metrics',
    requirements: ['011/FR-007', '011/FR-010'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'a value is related to its unit and measurement condition',
      'an unavailable value is stated in words, never as a zero or a dash',
      'a technical value is bidi-isolated so direction cannot reorder it',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'shell/announcements',
    requirements: ['011/FR-009'],
    journey: 'product/announcements',
    axe: true,
    assertions: [
      'exactly one assertive and one polite outlet exist and no other region is live',
      'a new blocking error publishes one assertive summary',
      'a settled change coalesces to one polite summary for its source revision',
      'initial, unchanged, stale and unaffected content produces no announcement',
      'a locale switch clears outlet text without replaying prior events',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'ui/text-equivalence',
    requirements: ['011/FR-010'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'a status tone is named in text, so colour is never the only signal',
      'a selected state has visible text beyond its border and tint',
      'every visual information carrier has a visible or associated text equivalent',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'ui/layers',
    requirements: ['011/FR-007', '011/FR-008'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'a layer has a visible title associated with it',
      'background content is inert and excluded from the accessibility tree while it is open',
      'dismissal restores the invoking control',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'preview/component-catalogue',
    requirements: ['011/FR-004', '011/FR-005'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'every exported component declares all five required states',
      'a state that cannot be represented carries a nonempty machine-readable rationale',
      'every rendered state names at least one expectation',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/design-tokens',
    requirements: ['011/FR-001', '011/FR-002', '011/FR-003', '011/SC-004'],
    journey: 'static/design-system',
    axe: false,
    assertions: [
      'every governed visual property resolves to a token',
      'exactly one semantic dark set exists with no theme control or stored preference',
      'every intended semantic pair records contrast evidence',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/shared-component-library',
    requirements: ['011/FR-001', '011/FR-004', '011/FR-005'],
    journey: 'static/design-system',
    axe: false,
    assertions: [
      'every exported ui component has exactly one preview declaration',
      'every required state has a fixture or a nonempty N/A rationale',
      'no route recreates a shared primitive',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'preview/catalogue',
    requirements: ['011/FR-004', '011/FR-022'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'every applicable declaration renders at its stable address',
      'the production tokens and localization providers are in use',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'shell/composition-modes',
    requirements: ['011/FR-011', '011/SC-003'],
    journey: 'product/responsive',
    axe: true,
    assertions: [
      'every action and datum available on desktop is available on a phone in landscape',
      'exactly one action composition is rendered — the other leaves the accessibility tree',
      'the compact action layer names itself in visible text rather than an ellipsis',
      'the document never scrolls horizontally at any of the five profiles',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'shell/reflow-and-text-scale',
    requirements: ['011/FR-011', '011/SC-003'],
    journey: 'product/responsive',
    axe: true,
    assertions: [
      'content stays complete at 200% root text size with no horizontal page scroll',
      'content stays complete at the 320x256 CSS-pixel viewport WCAG defines 400% zoom to equal',
      'every action survives with visible text and a reachable target at that viewport',
      'the sticky banner releases and travels with the page in a short viewport',
      'no text is truncated without a bounded scroller to reach the rest',
      'a layer presents at full height rather than as a clipped centred dialog',
      'both conditions hold together: the zoom-equivalent viewport at 200% text',
    ],
    manualRecord: 'zoom-400',
  },
  {
    surfaceId: 'system/target-and-contrast',
    requirements: ['011/FR-012'],
    journey: 'product/responsive',
    axe: true,
    assertions: [
      'every effective target meets the 44 CSS-pixel design baseline',
      'a control and the label that activates it are measured as one target',
      'every visible text run meets 4.5:1, or 3:1 where it is large',
      'every declared visual carrier meets 3:1 against its composited background',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'shell/reduced-motion',
    requirements: ['011/FR-013'],
    journey: 'product/responsive',
    axe: false,
    assertions: [
      'the preference is reported to the page',
      'no element retains a transition or animation longer than a millisecond',
      'every state, landmark, named action and status region survives without motion',
      'no meaning was carried by the motion that was removed',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'preview/expanded-and-rtl',
    requirements: ['011/FR-014'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'copy at roughly twice English length does not truncate or overflow the page',
      'reading order is identical under expanded copy and right-to-left',
      'root lang and dir are published for the direction under test',
      'inline edges follow direction, so no physical left/right styling survives the flip',
      'a technical identifier is bidi-isolated and cannot be reordered',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'ui/adaptive-layer',
    requirements: ['011/FR-011', '011/FR-014'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'one state and intent contract serves dialog, sheet and full-height presentations',
      'the adaptive presentation resolves in CSS, so it follows zoom and text scale',
      'a short viewport promotes a sheet to full height rather than clipping it',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'shell/locale-startup',
    requirements: ['011/FR-016', '011/FR-017'],
    journey: 'product/locale',
    axe: true,
    assertions: [
      'a matching browser language selects the shipped language on first use',
      'an unsupported browser language selects English and requests no catalogue',
      'the browser setting is the only input: no language control and nothing stored',
      'no application-owned display text is hard-coded outside the catalogues',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'shell/locale-commit',
    requirements: ['011/FR-016', '011/FR-019'],
    journey: 'product/locale',
    axe: true,
    assertions: [
      'root lang, dir, title and every message change in one committed revision',
      'no frame mixes two languages and no raw key or placeholder is ever visible',
      'the prior complete language stays visible while a candidate loads',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'shell/locale-fallback',
    requirements: ['011/FR-019'],
    journey: 'product/locale',
    axe: true,
    assertions: [
      'a failed or incomplete catalogue commits complete English exactly once',
      'the fallback is stated as visible text naming what was requested',
      'exactly one polite announcement is published per committed fallback',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'system/locale-assets-offline',
    requirements: ['011/FR-019', '011/SC-006'],
    journey: 'product/offline',
    axe: false,
    assertions: [
      'catalogues are same-origin static assets under /i18n/',
      'complete English is readable with no network at all',
      'a browser-matched catalogue loaded once stays readable offline',
      'exactly one service worker exists and it owns the only cache',
      'English and German declare identical nonblank keys and interpolation variables',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'ui/formatted-values',
    requirements: ['011/FR-018'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'numbers, percentages and dates follow the active locale',
      'credits and light years resolve through a localized pattern, not a fabricated Intl unit',
      'an absolute timestamp is formatted in UTC rather than the viewer timezone',
      'a value that is not a finite number raises rather than rendering a zero',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'ui/game-text',
    requirements: ['011/FR-020'],
    journey: 'preview/sweep',
    axe: true,
    assertions: [
      'package text carries the language it is actually in',
      'canonical text is shown and disclosed as untranslated, with the disclosure associated',
      'an absent package value is stated as unavailable rather than as a raw symbol',
      'the application keeps no private game-text translation',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'system/browser-matrix',
    requirements: ['011/FR-021', '011/SC-005'],
    journey: 'static/verification',
    axe: false,
    assertions: [
      'ten named projects exist across five profiles and two engines',
      'the four touch profiles declare hasTouch',
      'no project is removed or renamed to pass a run',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/accessibility-gate',
    requirements: ['011/FR-022', '011/SC-002'],
    journey: 'static/verification',
    axe: false,
    assertions: [
      'axe scans WCAG A and AA through 2.2 with no disabled rules',
      'an in-scope violation fails the build with the full result attached',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/conformance-claims',
    requirements: ['011/FR-015'],
    journey: 'static/verification',
    axe: false,
    assertions: [
      'no unqualified WCAG 2.2 AA claim exists in the product source or the project documents',
      'every claim that is made names all seven excluded criteria: 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7, 2.4.11',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/manual-protocols',
    requirements: ['011/FR-023', '011/SC-001'],
    journey: 'manual/protocols',
    axe: false,
    assertions: ['a versioned protocol and result record exists for every primary capability'],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'system/policy-checker',
    requirements: ['011/FR-024', '011/SC-004'],
    journey: 'static/verification',
    axe: false,
    assertions: [
      'literal application display text fails the build',
      'a governed visual literal outside the token sources fails the build',
      'a missing component-state preview fails the build',
      'every requirement and success-criteria id is registered in this ledger',
    ],
    manualRecord: null,
  },
];

/** Every requirement id the ledger currently evidences. */
export function registeredRequirementIds(
  ledger: readonly CoverageEntry[] = COVERAGE_LEDGER,
): ReadonlySet<string> {
  return new Set(ledger.flatMap((entry) => entry.requirements));
}

/** Entries whose journey runs in all ten projects. */
export function primaryJourneyEntries(
  ledger: readonly CoverageEntry[] = COVERAGE_LEDGER,
): readonly CoverageEntry[] {
  return ledger.filter((entry) => entry.journey.startsWith('product/'));
}
