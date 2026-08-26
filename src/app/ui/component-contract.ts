/**
 * The contract every exported `src/app/ui/` component honours.
 *
 * Shared components are presentation-only (constitution III). They accept
 * immutable view state, emit typed intent, and never inject a build store, a
 * domain service or an Almanac catalogue. A component asks for work to happen;
 * deciding whether it happens belongs to the capability that owns the state.
 */

/** A stable identity for one exported UI component. */
export type ComponentId = string;

/**
 * The states a component may be asked to preview.
 *
 * Every exported component accounts for all five — with a fixture, or with a
 * machine-readable reason its contract cannot represent that state (FR-004).
 */
export const COMPONENT_STATES = ['default', 'empty', 'loading', 'error', 'disabled'] as const;

export type ComponentState = (typeof COMPONENT_STATES)[number];

/**
 * Cross-cutting conditions a component is rendered under, beyond its own state.
 *
 * Viewport and orientation are deliberately absent: those come from the global
 * Playwright projects, so a declaration never carries five copies of the same
 * state (preview catalogue contract).
 */
const COMPONENT_VARIANTS = [
  'normal',
  'expanded-copy',
  'rtl',
  'reduced-motion',
  'german-format',
  'canonical-untranslated',
  'unavailable-text',
  'long-identity',
  'nested-relationships',
] as const;

export type ComponentVariant = (typeof COMPONENT_VARIANTS)[number];

/**
 * The semantics a component owns and must expose.
 *
 * Native element semantics are preferred everywhere they can express the
 * relationship; this record states what the component guarantees, so a test can
 * assert it and a reviewer can check it without reading the template.
 */
export interface ComponentSemantics {
  /** The role a reader encounters, native or explicit. */
  readonly role: string;
  /**
   * Whether the component's accessible name is required to equal its visible
   * name. True for every control a Commander can act on (FR-007).
   */
  readonly visibleNameMatchesAccessibleName: boolean;
  /** The states this component exposes programmatically when it holds them. */
  readonly exposedStates: readonly ExposedState[];
  /** The relationships this component establishes between a value and its context. */
  readonly relationships: readonly ValueRelationship[];
  /**
   * Meaning carried visually that the component also carries in text.
   *
   * Colour, icon, shape, position, bar length and motion can never be the sole
   * carrier (FR-010); naming the carriers here is what makes that checkable.
   */
  readonly textEquivalents: readonly string[];
}

/** Programmatic state a control exposes when its contract can hold it. */
export type ExposedState =
  'selected' | 'expanded' | 'pressed' | 'checked' | 'invalid' | 'busy' | 'disabled' | 'current';

/** A programmatic association between a value and something that explains it. */
export type ValueRelationship =
  | 'label'
  | 'description'
  | 'error'
  | 'unit'
  | 'viewing-condition'
  | 'unavailable-reason'
  | 'untranslated-disclosure';

/**
 * What a component publishes about itself.
 *
 * Registered once per exported component and reconciled against the preview
 * manifest and the coverage ledger, so a new component cannot quietly avoid
 * either.
 */
export interface UiComponentContract {
  readonly componentId: ComponentId;
  readonly semantics: ComponentSemantics;
  /** The states this component's contract can actually represent. */
  readonly states: readonly ComponentState[];
  /** The cross-cutting variants this component can meaningfully expose. */
  readonly variants: readonly ComponentVariant[];
}

/**
 * A typed intent emitted by a component.
 *
 * Components request work rather than performing it, so the same button can sit
 * in a product route and in a preview fixture without one of them mutating
 * something.
 */
export interface ComponentIntent<TKind extends string = string, TPayload = void> {
  readonly kind: TKind;
  readonly payload: TPayload;
}
