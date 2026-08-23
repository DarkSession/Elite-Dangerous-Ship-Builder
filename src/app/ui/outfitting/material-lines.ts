import type { GameTextPresentation } from '../../i18n/game-text.presenter';

/** One material a job consumes, already resolved and formatted. */
export interface MaterialLineView {
  readonly symbol: string;
  readonly name: GameTextPresentation;
  /** The package's own rarity grade, 1–5. `null` where it publishes none. */
  readonly grade: number | null;
  /** The count, formatted for the active locale. */
  readonly count: string;
}

/**
 * Orders a material list the way a Commander gathers one: commonest first.
 *
 * Shared rather than written twice (ruling G,
 * `specs/009-cost-and-materials/design/reference-review.md`). The Engineer
 * panel's own list was withdrawn in wave 11 — neither canvas draws one and the
 * rail's build-wide total is the only materials block there is — so the rail is
 * for now the one caller. The ordering stays here rather than inside it: it is
 * how a Commander gathers a shopping list, not how one block happens to sort.
 *
 * The collator is passed in so ties break in the application's active
 * language rather than the runtime's — `localeCompare` with no locale reads
 * the browser's, which is a different language from the one on screen
 * whenever a Commander has chosen one.
 *
 * An ungraded row sorts last. An unknown rarity is not a common one, and
 * heading the list with it would claim something the package never said.
 */
export function sortMaterialLines(
  lines: readonly MaterialLineView[],
  collator: Intl.Collator,
): readonly MaterialLineView[] {
  // A name the package supplies no text for falls back to the symbol, which is
  // the row's own identity and the only other stable thing about it. Without
  // it two nameless rows would order differently on each render.
  const key = (line: MaterialLineView): string => line.name.text ?? line.symbol;

  return [...lines].sort((left, right) => {
    const byRarity =
      (left.grade ?? Number.MAX_SAFE_INTEGER) - (right.grade ?? Number.MAX_SAFE_INTEGER);
    return byRarity === 0 ? collator.compare(key(left), key(right)) : byRarity;
  });
}
