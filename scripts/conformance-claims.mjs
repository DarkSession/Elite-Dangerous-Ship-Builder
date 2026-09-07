/**
 * The rule that every statement of the conformance target carries its
 * exclusions.
 *
 * It lives on its own because two policies apply it to two different bodies of
 * text. `check-interface-foundations.mjs` runs it over the product source and
 * the four documents that state the target on the project's behalf;
 * `check-specification-record.mjs` runs it over the specification record. The
 * rule is the same rule, and a second copy of the excluded set is how a
 * repository ends up asserting one number in the constitution and another in
 * three dozen documents.
 *
 * Nothing here reads the filesystem, and nothing here imports a compiler. A
 * caller passes `{ [file]: contents }` and gets violations back, so the
 * specification lane can apply the rule without loading the parsers the product
 * policy needs.
 */

/**
 * The criteria the constitution excludes from the conformance target.
 *
 * Seven are the keyboard-operation block principle V excludes. The eighth,
 * 2.2.1, is excluded for applying an update and for nothing else: a published
 * version is applied without asking, so the announcement before it carries
 * nothing that calls it off, and the notice on the other side of the restart
 * takes itself down. Neither time limit meets any of that criterion's
 * conditions (constitution 9.0.0).
 */
export const EXCLUDED_CRITERIA = [
  '2.1.1',
  '2.1.2',
  '2.1.4',
  '2.2.1',
  '2.4.1',
  '2.4.3',
  '2.4.7',
  '2.4.11',
];

/** A claim of WCAG 2.2 AA conformance, however it is phrased. */
const CONFORMANCE_CLAIM = /WCAG\s*2\.2\s*(?:Level\s*)?AA/gi;

/**
 * One string as a pattern that matches exactly itself.
 *
 * Every metacharacter, not just the dot. Escaping the one character a caller
 * happens to pass today is how a hand-rolled escape becomes wrong later: a
 * criterion that ever contains a backslash would otherwise escape the character
 * after it instead of itself, and the pattern would match something the caller
 * never wrote.
 */
function escapedForRegExp(literal) {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rejects a conformance claim that does not name its exclusions.
 *
 * The target is WCAG 2.2 AA *minus eight criteria*, and a claim that omits that
 * qualification is not a shorthand — it is a stronger claim than the project
 * can support, made to whoever reads it. Every statement therefore carries the
 * criteria it excludes, in the same sentence, so it cannot be quoted without
 * them (FR-015).
 *
 * `sources` is `{ [file]: contents }`. A claim qualifies when its own paragraph
 * names all eight criteria.
 */
export function conformanceClaimViolations(sources) {
  const found = [];

  for (const [file, contents] of Object.entries(sources)) {
    const paragraphs = contents.split(/\n\s*\n/);
    let offset = 0;

    for (const paragraph of paragraphs) {
      const line = contents.slice(0, offset).split('\n').length;
      offset += paragraph.length + 2;

      CONFORMANCE_CLAIM.lastIndex = 0;
      if (!CONFORMANCE_CLAIM.test(paragraph)) {
        continue;
      }

      // Bounded by digits rather than matched as a substring. `2.4.1` occurs
      // inside `2.4.11`, so a plain `includes` accepts a statement that names
      // seven criteria and omits 2.4.1 — a different seven from the one FR-015
      // calls out, and exactly the half-carried amendment this rule exists to
      // fail.
      const missing = EXCLUDED_CRITERIA.filter(
        (criterion) => !new RegExp(`(?<!\\d)${escapedForRegExp(criterion)}(?!\\d)`).test(paragraph),
      );
      if (missing.length > 0) {
        found.push({
          file,
          line,
          rule: 'unqualified-conformance-claim',
          message:
            'A WCAG 2.2 AA claim does not name the excluded criteria ' +
            `${missing.join(', ')}. State the target as AA except ${EXCLUDED_CRITERIA.join(', ')}.`,
        });
      }
    }
  }

  return found;
}
