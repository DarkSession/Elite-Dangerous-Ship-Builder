import {
  FIXTURE_SLOTS,
  ROUTE_DISTINCT_SYMBOL,
  defaultBuild,
  packageText,
  routeDistinctVariants,
} from '../../domain/outfitting/outfitting.fixtures';
import { candidateMembership, type ModuleChoice } from './candidate-membership';
import {
  applyQuery,
  buildIndex,
  isCurrent,
  openCandidateQuery,
  type CandidateQueryState,
} from './candidate-query';
import { compareRating } from './rating-order';

/**
 * The chooser's order and its search, asserted against the package.
 *
 * Nothing here writes down an expected list of modules. The Almanac's catalogue
 * changes with the game, and a test that pinned its contents would fail on a
 * package update that is entirely correct. What is pinned is the *relation*
 * between neighbouring rows, which is what the contract actually fixes.
 */

/** Anything outside ASCII: the accented package names the folding has to reach. */
const NON_ASCII = /[^\u0000-\u007f]/u;

function collatorFor(locale: string): Intl.Collator {
  return new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
}

function open(slotKey: string, locale = 'en', revision = 1): CandidateQueryState {
  const loadout = defaultBuild();
  return openCandidateQuery(
    candidateMembership(loadout, slotKey, revision, packageText(locale)),
    locale,
    collatorFor(locale),
  );
}

function nameOf(choice: ModuleChoice): string {
  return choice.presentation.name.text ?? '';
}

describe('candidate ordering', () => {
  const slots = [FIXTURE_SLOTS.hardpoint, FIXTURE_SLOTS.core, FIXTURE_SLOTS.optional];

  for (const slotKey of slots) {
    it(`orders ${slotKey} by section, name, class, rating and then the package's own ordinals`, () => {
      const collator = collatorFor('en');
      const choices = open(slotKey).choices;

      expect(choices.length).toBeGreaterThan(1);

      for (let index = 1; index < choices.length; index += 1) {
        const previous = choices[index - 1]!;
        const current = choices[index]!;

        // Unique rewards are the final block, so a standard choice never
        // follows one.
        if (previous.presentation.section !== current.presentation.section) {
          expect(previous.presentation.section).toBe('standard');
          expect(current.presentation.section).toBe('uniqueReward');
          continue;
        }

        const byName = collator.compare(nameOf(previous), nameOf(current));
        expect(byName).toBeLessThanOrEqual(0);
        if (byName !== 0) {
          continue;
        }

        // Same name: class descending.
        expect(previous.presentation.class).toBeGreaterThanOrEqual(current.presentation.class);
        if (previous.presentation.class !== current.presentation.class) {
          continue;
        }

        // Same class: rating ascending.
        const byRating = compareRating(previous.presentation.rating, current.presentation.rating);
        expect(byRating).toBeLessThanOrEqual(0);
        if (byRating !== 0) {
          continue;
        }

        // Same rating: the stock record before the variants built on it, then
        // the package's own ordinals.
        if (previous.kind !== current.kind) {
          expect(previous.kind).toBe('stock');
          continue;
        }
        expect(previous.sourceOrdinal).toBeLessThanOrEqual(current.sourceOrdinal);
        if (
          previous.kind === 'variant' &&
          current.kind === 'variant' &&
          previous.sourceOrdinal === current.sourceOrdinal
        ) {
          expect(previous.variantOrdinal).toBeLessThan(current.variantOrdinal);
        }
      }
    });
  }

  it('puts every unique reward after every standard choice', () => {
    const choices = open(FIXTURE_SLOTS.hardpoint).choices;
    const firstReward = choices.findIndex(
      (choice) => choice.presentation.section === 'uniqueReward',
    );

    expect(firstReward).toBeGreaterThan(0);
    expect(
      choices.slice(firstReward).every((choice) => choice.presentation.section === 'uniqueReward'),
    ).toBe(true);
  });

  it('keeps route-distinct variants distinct and in the package order', () => {
    const variants = routeDistinctVariants();
    const choices = open(FIXTURE_SLOTS.fittedHardpoint).choices.filter(
      (choice) => choice.kind === 'variant' && choice.module.symbol === ROUTE_DISTINCT_SYMBOL,
    );

    // Every route the package publishes is still its own row.
    expect(choices.length).toBe(variants.length);
    expect(new Set(choices.map((choice) => choice.key)).size).toBe(choices.length);

    // Within one section the package's ordinal decides, so two rows that are
    // otherwise identical never swap.
    for (const section of ['standard', 'uniqueReward'] as const) {
      const ordinals = choices
        .filter((choice) => choice.presentation.section === section)
        .map((choice) => (choice.kind === 'variant' ? choice.variantOrdinal : -1));
      expect([...ordinals].sort((left, right) => left - right)).toEqual(ordinals);
    }
  });
});

describe('candidate search', () => {
  it('returns the whole ordered collection for an empty query', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);

    expect(state.status).toBe('ready');
    expect(state.results).toEqual(state.choices);
    expect(state.canClear).toBe(false);
  });

  it('requires every term to match, across name, class, rating and mount', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);
    const subject = state.choices.find(
      (choice) => choice.presentation.mount !== null && choice.presentation.name.text !== null,
    )!;
    const firstWord = subject.presentation.name.text!.split(/\s+/u)[0]!;

    const matched = applyQuery(
      state,
      `${firstWord} ${subject.presentation.rating} ${subject.presentation.mount}`,
    );

    expect(matched.status).toBe('ready');
    expect(matched.results).toContain(subject);

    // Every survivor satisfies all three terms, which is what AND means. A term
    // that matched only one field would leave rows here that fail the others.
    for (const choice of matched.results) {
      const fields = [
        choice.presentation.name.text ?? '',
        String(choice.presentation.class),
        choice.presentation.rating,
        choice.presentation.mount ?? '',
      ].map((field) => field.toLowerCase());

      for (const term of [firstWord, subject.presentation.rating, subject.presentation.mount!]) {
        expect(fields.some((field) => field.includes(term.toLowerCase()))).toBe(true);
      }
    }
  });

  it('ignores case and accents on both sides of the comparison', () => {
    const state = open(FIXTURE_SLOTS.hardpoint, 'de');
    const accented = state.choices.find((choice) => NON_ASCII.test(nameOf(choice)));

    expect(accented).toBeDefined();

    const stripped = nameOf(accented!).normalize('NFKD').replace(/\p{M}/gu, '').toUpperCase();

    expect(applyQuery(state, stripped).results).toContain(accented!);
  });

  it('never matches a symbol, a blueprint, an acquisition token or a stat', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);
    const variant = state.choices.find((choice) => choice.kind === 'variant')!;

    expect(applyQuery(state, variant.module.symbol).status).toBe('noMatches');
    if (variant.kind === 'variant') {
      expect(applyQuery(state, variant.variant.blueprint).status).toBe('noMatches');
      expect(applyQuery(state, variant.variant.acquisition).status).toBe('noMatches');
    }

    const cost = state.choices.find((choice) => choice.presentation.facts.cost !== null)!;
    expect(applyQuery(state, String(cost.presentation.facts.cost)).status).toBe('noMatches');
  });

  it('reports no matches with the query kept and a way back to the whole list', () => {
    const state = applyQuery(open(FIXTURE_SLOTS.hardpoint), 'zzzz nothing');

    expect(state.status).toBe('noMatches');
    expect(state.query).toBe('zzzz nothing');
    expect(state.results).toEqual([]);
    expect(state.canClear).toBe(true);

    const cleared = applyQuery(state, '');
    expect(cleared.status).toBe('ready');
    expect(cleared.results).toEqual(state.choices);
    expect(cleared.canClear).toBe(false);
  });

  it('separates a successful empty package answer from a search that found nothing', () => {
    const state = open(FIXTURE_SLOTS.cargoHatch);

    expect(state.choices).toEqual([]);
    expect(state.status).toBe('packageEmpty');
    expect(state.canClear).toBe(false);
  });

  it('carries the transient states the query cannot work out for itself', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);

    expect(applyQuery(state, '', 'stale').status).toBe('stale');
    expect(applyQuery(state, '', 'refused').status).toBe('refused');
    expect(applyQuery(state, '', 'loading').status).toBe('loading');
  });
});

describe('candidate index', () => {
  it('indexes exactly the four contract fields', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);
    const entry = state.index[0]!;

    expect(Object.keys(entry).sort()).toEqual(['class', 'key', 'mount', 'name', 'rating']);
    expect(entry.key).toBe(state.choices[0]!.key);
    expect(entry.class).toBe(String(state.choices[0]!.presentation.class));
  });

  it('rebuilds when the mount changes', () => {
    const hardpoint = open(FIXTURE_SLOTS.hardpoint);

    expect(isCurrent(hardpoint, FIXTURE_SLOTS.hardpoint, 1, 'en')).toBe(true);
    expect(isCurrent(hardpoint, FIXTURE_SLOTS.core, 1, 'en')).toBe(false);
  });

  it('rebuilds when the build revision changes', () => {
    const state = open(FIXTURE_SLOTS.hardpoint, 'en', 1);

    expect(isCurrent(state, FIXTURE_SLOTS.hardpoint, 1, 'en')).toBe(true);
    expect(isCurrent(state, FIXTURE_SLOTS.hardpoint, 2, 'en')).toBe(false);
  });

  it('rebuilds when the reading language changes', () => {
    const english = open(FIXTURE_SLOTS.hardpoint, 'en');
    const german = open(FIXTURE_SLOTS.hardpoint, 'de');

    expect(isCurrent(english, FIXTURE_SLOTS.hardpoint, 1, 'de')).toBe(false);
    // The names really do differ, so a stale index would search the wrong text.
    expect(buildIndex(german.choices, 'de')[0]!.name).not.toBe(english.index[0]!.name);
  });
});
