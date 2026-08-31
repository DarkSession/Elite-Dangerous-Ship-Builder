/**
 * The height below which nothing can be stacked.
 *
 * Below it a viewport cannot show one region under another and still show a row
 * of either: the stacked compositions become one page thousands of pixels long
 * with the last of them unreachable in practice, and chrome frozen to the top
 * of it is chrome that never leaves. Two decisions turn on that one height —
 * which composition the outfitting region takes, and whether the shell's banner
 * keeps its place — so it is declared once here rather than restated at each
 * (responsive composition, "Reference and selection rule").
 *
 * Stated in rem, because the height a Commander needs is a height in their own
 * text, not in ours.
 */
export const STACKABLE_MINIMUM_REM = 30;

/** The stylesheets' own query, composed from that minimum. */
export const SHORT_VIEWPORT = `(max-height: ${STACKABLE_MINIMUM_REM}rem)`;

/**
 * The same minimum, in the CSS pixels a Commander's own text size makes of it.
 *
 * This deliberately does not agree with the query above, and the difference is
 * the point. `rem` inside a media query is the *initial* value of `font-size`,
 * which is the Commander's own browser default: the query follows a text size
 * set there, and cannot follow a `font-size` set on the root element. This one
 * is the root's computed size, so it follows both — and it is read fresh on
 * every measurement rather than resolved once, so a text-scale change moves the
 * threshold with it instead of leaving it at load-time pixels.
 */
export function stackableMinimum(): number {
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return STACKABLE_MINIMUM_REM * rem;
}
