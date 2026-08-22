/**
 * The one folding both sides of a search go through.
 *
 * Case and accents are not how a Commander distinguishes one module from
 * another, so "Multi-Cannon", "MULTI-CANNON" and a query typed with a stray
 * diacritic all have to reach the same rows. NFKD splits a composed letter into
 * its base plus its marks, the marks are dropped, and the remainder is lowered
 * in the reading locale — Turkish dotted and dotless `i` differ, and a locale
 * lowercasing is the only one that gets that right.
 *
 * Indexed fields and query terms call this same function. Two foldings that
 * drift apart is a search that stops matching what it displays.
 */
export function fold(value: string, locale: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase(locale);
}

/**
 * A query as the terms it is matched by: folded, split on Unicode whitespace,
 * empties discarded.
 *
 * An empty result means an empty query, which is not "no matches" — it is the
 * whole ordered collection (module-catalogue contract, "Search").
 */
export function foldQuery(query: string, locale: string): readonly string[] {
  return fold(query, locale)
    .split(/\s+/u)
    .filter((term) => term.length > 0);
}
