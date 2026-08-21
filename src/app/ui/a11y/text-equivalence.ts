/**
 * Utilities for keeping meaning available as text.
 *
 * Colour, icon, shape, position, bar length and motion cannot carry meaning on
 * their own (FR-010). These helpers are how a component attaches the text that
 * carries it instead — and how technical identities survive a right-to-left
 * context without being visually reordered into something that reads as a
 * different value.
 */

/** A stable prefix for generated element ids, namespaced to the application. */
const ID_PREFIX = 'edsb';

let sequence = 0;

/**
 * A unique id for relating a control to its label, description or error.
 *
 * Generated rather than authored because the same component appears many times
 * on a page, and a duplicated id silently attaches every one of them to the
 * first description on the page.
 */
export function relationId(role: string): string {
  sequence += 1;
  return `${ID_PREFIX}-${role}-${sequence}`;
}

/**
 * Joins the ids a control is described by, dropping the absent ones.
 *
 * Returns `null` rather than an empty string, because `aria-describedby=""`
 * points at nothing and some assistive technology treats it as a broken
 * reference rather than as no reference.
 */
export function describedBy(...ids: readonly (string | null | undefined)[]): string | null {
  const present = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
  return present.length > 0 ? present.join(' ') : null;
}

/**
 * Isolates a technical identifier from the surrounding text direction.
 *
 * A module symbol, a slot key or a signed number placed in right-to-left prose
 * is reordered by the bidirectional algorithm — `-5.2` can render as `5.2-`,
 * which is a different value. Wrapping in the isolate characters fixes the
 * ordering without changing the content or making it unselectable.
 *
 * The corresponding CSS is `unicode-bidi: isolate`; this is the text-level
 * equivalent for a value that will be read as a string.
 */
export function bidiIsolate(value: string): string {
  const FIRST_STRONG_ISOLATE = '⁨';
  const POP_DIRECTIONAL_ISOLATE = '⁩';
  return `${FIRST_STRONG_ISOLATE}${value}${POP_DIRECTIONAL_ISOLATE}`;
}

/** Removes isolation characters, so a test can compare against the plain value. */
export function stripBidiIsolation(value: string): string {
  return value.replace(/[⁦-⁩]/g, '');
}

/**
 * The text equivalent of something shown visually.
 *
 * A component that renders a bar, a swatch, an icon or a position builds one of
 * these and exposes it as visible text or as an accessible name, so the meaning
 * exists for a reader who cannot see the carrier.
 */
export interface TextEquivalent {
  /** What the carrier means, in the active locale. */
  readonly label: string;
  /** The value it represents, already formatted for the active locale. */
  readonly value: string;
  /** The unit the value is in, when it has one. */
  readonly unit: string | null;
  /** The condition the value was measured under, when that matters. */
  readonly condition: string | null;
}

/**
 * Renders a text equivalent as one readable string.
 *
 * Order is meaning, then value, then unit, then condition — the order a person
 * would say it out loud, so a screen reader reaches the point before the
 * qualifications.
 */
export function readTextEquivalent(equivalent: TextEquivalent): string {
  const parts = [
    equivalent.label,
    bidiIsolate(equivalent.value),
    equivalent.unit,
    equivalent.condition,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  return parts.join(' ');
}
