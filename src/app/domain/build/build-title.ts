/**
 * What to call a build that carries no name a Commander gave it.
 *
 * FR-010's rule, in one place because two screens ask it and they must not
 * disagree: the build's own ship name, else its ident, else the hull it is
 * built on. The library titles an unnamed row with it, and the save layer
 * starts its name field from it (Commander request 2026-08-28).
 *
 * Blank is not a name. A ship name of spaces is what a Commander gets for
 * pressing space in the outfitting field, and a title of nothing would leave a
 * row that looks untitled and a save field that looks empty — which is the
 * defect this rule is here to prevent.
 *
 * The caller supplies the hull's name already resolved, and the last word for
 * where even that is missing. Neither is derivable here: one needs the game
 * text catalogue and the other needs the active locale, and this stays a pure
 * rule about a build so both screens can apply it to what they are holding.
 */
export function deriveBuildTitle(
  build: { readonly shipName: string | null; readonly shipIdent: string | null },
  hullName: string | null,
  fallback: string,
): string {
  return build.shipName?.trim() || build.shipIdent?.trim() || hullName?.trim() || fallback;
}
