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
export const COVERED_FEATURES: readonly string[] = [
  '011-interface-foundations',
  '001-ship-selection-and-loading',
];

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

/**
 * The one measurement project outside the matrix.
 *
 * SC-002 is measured under Chromium's CPU throttling, which is a DevTools
 * Protocol capability Firefox does not have. Rather than a test that skips
 * itself in five of the ten projects — which the constitution forbids — the
 * measurement lives in its own file and its own project, and the behaviour it
 * measures is separately covered in all ten (module-catalogue contract,
 * "Verification").
 */
export const TIMING_PROJECT = 'chromium-mobile-timing';

/** The file that project runs, and the only one it runs. */
export const TIMING_SPEC = '**/outfitting-timing.spec.ts';

/** Every Playwright project name the matrix generates, plus the timing project. */
export const PROJECT_NAMES: readonly string[] = [
  ...ENGINES.flatMap((engine) => LAYOUT_PROFILES.map((profile) => `${engine}-${profile}`)),
  TIMING_PROJECT,
];

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
    surfaceId: 'system/design-reference',
    requirements: ['011/FR-002', '001/FR-001'],
    journey: 'catalogue/reference-language',
    axe: false,
    assertions: [
      'the command bar is the reference plate closed by the heavy amber rule and opened by the flag',
      'headings are tracked uppercase condensed and numbers are monospace',
      'every row reserves the leading marker and only the current row fills it',
      'no product surface is rounded',
      'no text falls below the lifted ramp floor',
      'the metric grid is ruled by its own one-pixel gaps',
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
    surfaceId: 'system/accessibility-tree',
    requirements: ['011/FR-006', '011/FR-008'],
    journey: 'product/semantics',
    axe: false,
    assertions: [
      'the shell presents one banner, one main and one level-1 heading in that order',
      'both announcement outlets are named rather than anonymous live regions',
      'a layer presents as a named dialog that owns its content',
      'a choice group is one named group whose options expose their own state',
      'a field error is associated with its field rather than left as loose text',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'system/manual-protocols',
    requirements: ['011/FR-023', '011/SC-001'],
    journey: 'manual/protocols',
    axe: false,
    assertions: ['a versioned protocol and result record exists for every primary capability'],
    manualRecord: 'screen-reader',
  },
  // -------------------------------------------------------------------------
  // Feature 001: ship selection and build loading.
  // -------------------------------------------------------------------------
  {
    surfaceId: 'ships/catalogue',
    requirements: ['001/FR-001', '001/FR-002', '001/SC-001'],
    journey: 'product/ship-catalogue',
    axe: true,
    assertions: [
      'every installed hull is listed, with name, manufacturer, size, hardpoints and retail price',
      'search, every facet and both directions of every sort field constrain the list',
      'a missing value is stated in words and never rendered as a zero',
      'ties are broken by the package’s own order, identically in both directions',
      'the wide manifest uses table semantics with named bidirectional sort buttons',
      'the narrow list restates every label as a definition list',
      'the match count precedes the results and is announced once, politely',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'ships/catalogue-session',
    requirements: ['001/FR-003'],
    journey: 'product/ship-catalogue',
    axe: false,
    assertions: [
      'constraints, order and the anchored result survive a trip to hull detail and back',
      'no catalogue state appears in the route path, the query, the fragment or a build record',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'ships/:symbol',
    requirements: ['001/FR-004', '001/FR-005', '001/FR-006'],
    journey: 'product/hull-detail',
    axe: true,
    assertions: [
      'every specified hull fact is shown with its unit, or marked as a rating with none',
      'speed and rotation endpoints name the viewing condition they were measured under',
      'the slot layout uses the game’s own keys, including the irregular ones',
      'an unknown symbol is a named error with no facts, no build and no creation action',
      'a missing illustration is explained as temporary and disables nothing',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'ships/:symbol/create-stock-build',
    requirements: ['001/FR-007', '001/FR-009'],
    journey: 'product/hull-detail',
    axe: true,
    assertions: [
      'creation is explicit and produces exactly the package default loadout',
      'every fixed mount is populated before the build becomes active',
      'creation is unavailable, and says so, when the package has no default loadout',
      'replacing unsaved work is confirmed first; cancelling changes neither build nor route',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'build',
    requirements: ['001/FR-008', '001/FR-010', '001/FR-014'],
    journey: 'product/build-working-state',
    axe: true,
    assertions: [
      'the tab’s working build is restored after a reload',
      'persistence status is visible text with an icon, never colour alone',
      'every persistence failure leaves the build editable',
      'a stored record is migrated losslessly or left byte-for-byte unchanged',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'builds',
    requirements: ['001/FR-011', '001/FR-012', '001/FR-013', '001/SC-002'],
    journey: 'product/build-library',
    axe: true,
    assertions: [
      'records list name or working state, hull, modified instant and recorded validation',
      'name, rename, duplicate and delete each act on a record identity, never a display name',
      'a duplicate name warns and then proceeds, creating a separate record',
      'two pages saving one named record are offered overwrite, keep both and cancel',
      'the retention limit and a full quota offer explicit discard and never evict automatically',
      'notes and record identities never enter a build link or a SLEF export',
    ],
    manualRecord: 'screen-reader',
  },
  {
    surfaceId: 'build/share-link',
    requirements: [
      '001/FR-015',
      '001/FR-016',
      '001/FR-017',
      '001/FR-018',
      '001/FR-019',
      '001/FR-020',
      '001/FR-021',
      '001/SC-003',
    ],
    journey: 'product/build-link',
    axe: true,
    assertions: [
      'the payload is entirely in the fragment; the path and query carry no build data',
      'a published value starts “b.” and is at most 500 characters including that prefix',
      'a pasted, navigated or initial fragment all take the same candidate-first path',
      'an invalid, truncated, over-limit or unsupported payload leaves the active build unchanged',
      'editing replaces the fragment without adding a history entry per edit',
      'a build the codec cannot represent is refused with its slot and reason, and offers SLEF',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/no-transmission',
    requirements: ['001/SC-004'],
    journey: 'product/build-link',
    axe: false,
    assertions: [
      'no request URL contains build-link payload data',
      'no automatic cross-origin request occurs during catalogue, detail, storage or share flows',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'ships/unrecognised-path-**',
    requirements: ['001/FR-005'],
    journey: 'product/ship-catalogue',
    axe: false,
    assertions: [
      'an address this application does not serve returns to the shipyard rather than an empty screen',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/cross-route-conformance',
    requirements: ['001/FR-005', '001/FR-010', '001/FR-014'],
    journey: 'product/interface-conformance',
    axe: true,
    assertions: [
      'each of the four product routes has one main, one visible h1 and no skipped heading level',
      'every control’s accessible name is the words on its face, on every route',
      'exactly one polite and one assertive outlet exist, and nothing else is live',
      'one blocking condition raises one prompt, naming both outcomes in its own words',
      'every route survives 200% text, 400% zoom, expanded German copy and a mirrored direction',
      'removing motion removes no state, no feedback and no control',
    ],
    manualRecord: 'zoom-400',
  },
  {
    surfaceId: 'system/performance-budgets',
    requirements: ['001/SC-001', '001/SC-003'],
    journey: 'product/performance',
    axe: false,
    assertions: [
      'search, filter and order constrain the complete installed manifest without a perceptible wait',
      'the workspace restores this tab’s working build before it offers the build’s own actions',
      'a burst of edits coalesces into one record rather than one write each',
      'a build is published as a link inside the codec’s sub-50 ms target',
    ],
    manualRecord: null,
  },
  {
    surfaceId: 'system/offline-capability',
    requirements: ['001/FR-006', '001/FR-014', '001/SC-004'],
    journey: 'product/offline-privacy',
    axe: false,
    assertions: [
      'the shell and bundled English read with no network at all',
      'an illustration seen once stays available offline',
      'an illustration that cannot be fetched blocks nothing, and recovers on retry without a reload',
      'nothing of another origin, and nothing of a build, is ever cached',
    ],
    manualRecord: null,
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
