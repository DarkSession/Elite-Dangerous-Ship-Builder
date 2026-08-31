import {
  OUTFITTING_FAMILIES,
  type OutfittingFamilyId,
} from '@elite-dangerous-almanac/core/ships/module-families';
import {
  FIXTURE_SLOTS,
  ROUTE_DISTINCT_SYMBOL,
  defaultBuild,
  packageText,
  routeDistinctVariants,
} from '../../domain/outfitting/outfitting.fixtures';
import { candidateMembership, type FittedArticle, type ModuleChoice } from './candidate-membership';
import {
  applyQuery,
  buildIndex,
  groupFamilies,
  isCurrent,
  openCandidateQuery,
  toggleFamily,
  withReveal,
  withRevealedFamilies,
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

function collatorFor(locale: string): Intl.Collator {
  return new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
}

function open(
  slotKey: string,
  locale = 'en',
  revision = 1,
  fitted: FittedArticle | null = null,
  carried: OutfittingFamilyId | null = null,
): CandidateQueryState {
  const loadout = defaultBuild();
  return openCandidateQuery(
    candidateMembership(loadout, slotKey, revision, packageText(locale)),
    locale,
    collatorFor(locale),
    fitted,
    carried,
  );
}

/**
 * How many matches a search may open, mirrored from the module under test.
 *
 * Written here rather than imported because it is what the test is asserting
 * about: a change to the figure has to be a deliberate change to this file too.
 */
const SCREENFUL = 25;

/**
 * A query narrow enough that everything it matched opens.
 *
 * Terms are tried longest-first until one lands inside the screenful, so the
 * test asserts the open-everything rule against a real package result rather
 * than against a term that happened to be narrow on the day it was written.
 */
function narrowSearch(state: CandidateQueryState): CandidateQueryState {
  const words = new Set(
    state.choices.flatMap((choice) => (choice.presentation.name.text ?? '').split(/\s+/u)),
  );

  for (const word of words) {
    if (word.length < 3) {
      continue;
    }
    const searched = applyQuery(state, word);
    const families = new Set(searched.results.map((choice) => choice.presentation.familyId));
    if (searched.results.length <= SCREENFUL && families.size > 1) {
      return searched;
    }
  }
  throw new Error('no word in the fixture mount matched more than one family inside a screenful');
}

/**
 * The same mount under canvas 1c's rail rather than canvas 1d's accordion.
 *
 * A composition change and nothing else: `withReveal` re-seeds the revealed set
 * and touches neither the order nor the index, which is what keeps a resize
 * from paying for a re-sort (SC-002).
 */
function rail(state: CandidateQueryState): CandidateQueryState {
  return applyQuery(withReveal(state, 'rail'), state.query);
}

/** The package's own family order, which is the order the chooser lists them in. */
const FAMILY_ORDER = Object.keys(OUTFITTING_FAMILIES);

function rankOf(choice: ModuleChoice): number {
  return FAMILY_ORDER.indexOf(choice.presentation.familyId);
}

function nameOf(choice: ModuleChoice): string {
  return choice.presentation.name.text ?? '';
}

describe('candidate ordering', () => {
  const slots = [FIXTURE_SLOTS.hardpoint, FIXTURE_SLOTS.core, FIXTURE_SLOTS.optional];

  for (const slotKey of slots) {
    it(`orders ${slotKey} by family, class, price, name, rating and the package's own ordinals`, () => {
      const collator = collatorFor('en');
      const choices = open(slotKey).choices;

      expect(choices.length).toBeGreaterThan(1);

      for (let index = 1; index < choices.length; index += 1) {
        const previous = choices[index - 1]!;
        const current = choices[index]!;

        // Families come out in the package's own order, and each is one run.
        const byFamily = rankOf(previous) - rankOf(current);
        expect(byFamily).toBeLessThanOrEqual(0);
        if (byFamily !== 0) {
          continue;
        }

        // Inside a family: class descending.
        expect(previous.presentation.class).toBeGreaterThanOrEqual(current.presentation.class);
        if (previous.presentation.class !== current.presentation.class) {
          continue;
        }

        // Same class: the package's price descending, and a choice it publishes
        // no price for after every priced one rather than sorted as free.
        const previousCost = previous.presentation.facts.cost;
        const currentCost = current.presentation.facts.cost;
        if (previousCost !== currentCost) {
          expect(previousCost).not.toBeNull();
          if (currentCost !== null) {
            expect(previousCost!).toBeGreaterThan(currentCost);
          }
          continue;
        }

        // Same price: the name a Commander reads.
        const byName = collator.compare(nameOf(previous), nameOf(current));
        expect(byName).toBeLessThanOrEqual(0);
        if (byName !== 0) {
          continue;
        }

        // Same name: rating ascending.
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

  it('sorts by price inside a class, and leaves an unpriced choice after the priced ones', () => {
    // The relation test above proves the order holds; this proves the price key
    // is doing work in it, so a comparator that dropped the key would not pass
    // by being vacuously true on a fixture where every class holds one row.
    let pricedPairs = 0;

    for (const slotKey of slots) {
      const choices = open(slotKey).choices;

      for (let index = 1; index < choices.length; index += 1) {
        const previous = choices[index - 1]!;
        const current = choices[index]!;

        if (
          rankOf(previous) !== rankOf(current) ||
          previous.presentation.class !== current.presentation.class
        ) {
          continue;
        }

        const previousCost = previous.presentation.facts.cost;
        const currentCost = current.presentation.facts.cost;

        // Whatever else separates two rows of one class in one family, an
        // unpriced row is never above a priced one (FR-003).
        if (previousCost === null) {
          expect(currentCost).toBeNull();
          continue;
        }
        if (currentCost !== null && previousCost !== currentCost) {
          expect(previousCost).toBeGreaterThan(currentCost);
          pricedPairs += 1;
        }
      }
    }

    expect(pricedPairs).toBeGreaterThan(0);
  });

  it('puts every choice in exactly one family, in the package\u2019s own order', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);
    const families = groupFamilies(state.results, new Set());

    expect(families.length).toBeGreaterThan(1);
    // Every choice is accounted for once, which is what "exactly one family"
    // means: nothing is dropped and nothing is listed twice (FR-020, SC-006).
    expect(families.reduce((total, family) => total + family.choices.length, 0)).toBe(
      state.results.length,
    );
    expect(new Set(families.map((family) => family.familyId)).size).toBe(families.length);
    expect(families.map((family) => FAMILY_ORDER.indexOf(family.familyId))).toEqual(
      [...families.map((family) => FAMILY_ORDER.indexOf(family.familyId))].sort(
        (left, right) => left - right,
      ),
    );

    for (const family of families) {
      expect(family.count).toBe(family.choices.length);
      expect(family.name.text).toBe(OUTFITTING_FAMILIES[family.familyId]);
      expect(
        family.choices.every((choice) => choice.presentation.familyId === family.familyId),
      ).toBe(true);
    }
  });

  it('keeps a unique reward in its base module\u2019s family, not a section of its own', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);
    const reward = state.choices.find((choice) => choice.presentation.section === 'uniqueReward')!;
    const base = state.choices.find(
      (choice) => choice.kind === 'stock' && choice.module.symbol === reward.module.symbol,
    )!;

    expect(reward.presentation.familyId).toBe(base.presentation.familyId);
    // And its labels are untouched: the heading went, the row's marking did not
    // (FR-024).
    expect(reward.presentation.labels.map((label) => label.kind)).toContain('uniqueReward');
  });

  it('keeps route-distinct variants distinct and in the package order', () => {
    const variants = routeDistinctVariants();
    const choices = open(FIXTURE_SLOTS.fittedHardpoint).choices.filter(
      (choice) => choice.kind === 'variant' && choice.module.symbol === ROUTE_DISTINCT_SYMBOL,
    );

    // Every route the package publishes is still its own row.
    expect(choices.length).toBe(variants.length);
    expect(new Set(choices.map((choice) => choice.key)).size).toBe(choices.length);

    // Every route-distinct row of one module shares that module's family, and
    // inside it the package's ordinal decides — so two rows that are otherwise
    // identical never swap.
    expect(new Set(choices.map((choice) => choice.presentation.familyId)).size).toBe(1);
    const ordinals = choices.map((choice) =>
      choice.kind === 'variant' ? choice.variantOrdinal : -1,
    );
    expect([...ordinals].sort((left, right) => left - right)).toEqual(ordinals);
  });
});

/**
 * The open set: three seeds and one toggle.
 *
 * Everything here is about the seeds this module computes. `openFamilies` is
 * *derived* at this level and nothing in it is remembered: `openCandidateQuery`
 * and `applyQuery` set it outright every time they are called, which is what
 * FR-021 and FR-023 describe.
 *
 * A Commander's own toggles are laid over that seed by the store, through
 * `withRevealedFamilies`, and the store is where their lifetime is decided and
 * tested (decision 15, `outfitting.store.spec.ts`).
 */
describe('open families', () => {
  /** The mount the default build arrives with something already fitted in. */
  const FITTED = FIXTURE_SLOTS.fittedHardpoint;

  function fittedArticleOf(state: CandidateQueryState): FittedArticle {
    const choice = state.choices.find((candidate) => candidate.kind === 'stock')!;
    return { symbol: choice.module.symbol, variant: null };
  }

  it('opens the fitted choice\u2019s family, and only that one', () => {
    const bare = open(FITTED);
    const fitted = fittedArticleOf(bare);
    const state = open(FITTED, 'en', 1, fitted);

    const expected = state.choices.find(
      (choice) => choice.kind === 'stock' && choice.module.symbol === fitted.symbol,
    )!.presentation.familyId;

    expect(state.fittedFamilyId).toBe(expected);
    expect([...state.openFamilies]).toEqual([expected]);
  });

  it('opens nothing when no available family holds that exact choice', () => {
    // An empty mount, and a mount whose fitted article the package does not
    // offer back, are the same case: there is no family to open (FR-021).
    const empty = open(FITTED);
    expect(empty.fittedFamilyId).toBeNull();
    expect([...empty.openFamilies]).toEqual([]);

    const unknown = open(FITTED, 'en', 1, { symbol: 'not-a-symbol', variant: null });
    expect(unknown.fittedFamilyId).toBeNull();
    expect([...unknown.openFamilies]).toEqual([]);
  });

  it('opens every family a narrow query matched, and drops the rest', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);
    const searched = narrowSearch(state);

    expect(searched.results.length).toBeGreaterThan(0);
    expect(searched.results.length).toBeLessThanOrEqual(SCREENFUL);
    const matchedFamilies = new Set(searched.results.map((choice) => choice.presentation.familyId));
    expect(matchedFamilies.size).toBeGreaterThan(1);
    expect(new Set(searched.openFamilies)).toEqual(matchedFamilies);

    // Every family that survives the grouping is open, so no match is behind a
    // closed control, and a family with no match is absent rather than empty.
    const families = groupFamilies(searched.results, searched.openFamilies);
    expect(families.every((family) => family.open)).toBe(true);
    expect(families.every((family) => family.count > 0)).toBe(true);
  });

  it('opens nothing when a query matched more than a screenful, and still counts it', () => {
    // A term that matches most of a mount has not answered anything a Commander
    // can read. What they can read is which families hold the matches and how
    // many, so the families stand closed with their counts and the rows are not
    // drawn — which is what brought SC-002 inside its budget (FR-023).
    const state = open(FIXTURE_SLOTS.hardpoint);
    const broad = applyQuery(state, 'a');

    expect(broad.results.length).toBeGreaterThan(SCREENFUL);
    expect([...broad.openFamilies]).toEqual([]);

    const families = groupFamilies(broad.results, broad.openFamilies);
    expect(families.every((family) => !family.open)).toBe(true);
    expect(families.every((family) => family.count > 0)).toBe(true);
    // Not one family holding a match went missing; only the rows are withheld.
    expect(families.reduce((running, family) => running + family.count, 0)).toBe(
      broad.results.length,
    );
  });

  it('restores the fitted-family seed when the query goes back to empty', () => {
    const bare = open(FITTED);
    const state = open(FITTED, 'en', 1, fittedArticleOf(bare));
    const seed = [...state.openFamilies];

    const searched = narrowSearch(state);
    expect([...searched.openFamilies]).not.toEqual(seed);

    expect([...applyQuery(searched, '').openFamilies]).toEqual(seed);
  });

  it('changes exactly one id per toggle, and nothing else about the state', () => {
    const state = narrowSearch(open(FIXTURE_SLOTS.hardpoint));
    const first = [...state.openFamilies][0]!;

    const closed = toggleFamily(state, first);
    expect(closed.openFamilies.has(first)).toBe(false);
    expect(new Set([...state.openFamilies].filter((id) => id !== first))).toEqual(
      new Set(closed.openFamilies),
    );
    // Nothing else moved: same records, same order, same index, same status.
    expect(closed.choices).toBe(state.choices);
    expect(closed.index).toBe(state.index);
    expect(closed.results).toBe(state.results);
    expect(closed.status).toBe(state.status);
    expect(closed.query).toBe(state.query);

    expect([...toggleFamily(closed, first).openFamilies].sort()).toEqual(
      [...state.openFamilies].sort(),
    );
  });

  it('reveals the first family in package order when the rail has no fitted one', () => {
    // The accordion draws "none open" and the rail cannot: canvas 1c's rail
    // always has a selection and never paints an empty pane, so where no
    // available family holds the fitted choice it takes the first one the
    // package lists (FR-021, as restated on 2026-08-25).
    const empty = rail(open(FITTED));
    const first = empty.choices[0]!.presentation.familyId;

    expect(empty.fittedFamilyId).toBeNull();
    expect([...empty.openFamilies]).toEqual([first]);
  });

  it('reveals the fitted family under either model, when there is one', () => {
    const bare = open(FITTED);
    const fitted = fittedArticleOf(bare);
    const accordion = open(FITTED, 'en', 1, fitted);

    expect([...rail(accordion).openFamilies]).toEqual([...accordion.openFamilies]);
  });

  it('reveals one family per rail selection, and never none', () => {
    const state = rail(open(FIXTURE_SLOTS.hardpoint));
    const [first, second] = state.choices
      .map((choice) => choice.presentation.familyId)
      .filter((id, index, all) => all.indexOf(id) === index);

    const moved = toggleFamily(state, second!);
    expect([...moved.openFamilies]).toEqual([second]);

    // Selecting the family already selected leaves it selected. Under the
    // accordion the same press closes it, and that is the difference: a rail
    // has no "none" for a second press to mean.
    expect([...toggleFamily(moved, second!).openFamilies]).toEqual([second]);
    expect([...toggleFamily(moved, first!).openFamilies]).toEqual([first]);
  });

  it('reveals the first family holding a match, whatever the rail search matched', () => {
    // FR-023's screenful rule is the accordion's, and always was: it exists to
    // stop one keystroke building several hundred cards, and a rail paints one
    // family's rows at any match count. What both keep is that a family holding
    // a match is never absent.
    const state = rail(open(FIXTURE_SLOTS.hardpoint));
    const broad = applyQuery(state, 'a');

    expect(broad.results.length).toBeGreaterThan(SCREENFUL);
    expect([...broad.openFamilies]).toEqual([broad.results[0]!.presentation.familyId]);

    const families = groupFamilies(broad.results, broad.openFamilies);
    expect(families.filter((family) => family.open)).toHaveLength(1);
    expect(families.every((family) => family.count > 0)).toBe(true);
    expect(families.reduce((running, family) => running + family.count, 0)).toBe(
      broad.results.length,
    );

    const narrow = narrowSearch(state);
    expect([...narrow.openFamilies]).toEqual([narrow.results[0]!.presentation.familyId]);
  });

  it('restores the rail\u2019s own default when the query goes back to empty', () => {
    const state = rail(open(FIXTURE_SLOTS.hardpoint));
    const seed = [...state.openFamilies];

    const searched = applyQuery(state, 'a');
    expect([...applyQuery(searched, '').openFamilies]).toEqual(seed);
  });

  it('re-seeds on a composition change without re-ordering or re-indexing', () => {
    const accordion = open(FIXTURE_SLOTS.hardpoint);
    const asRail = rail(accordion);

    expect(asRail.choices).toBe(accordion.choices);
    expect(asRail.index).toBe(accordion.index);
    // The accordion opens nothing on an empty mount; the rail opens the first.
    expect([...accordion.openFamilies]).toEqual([]);
    expect(asRail.openFamilies.size).toBe(1);

    // And asking for the model already in force is not a new state at all.
    expect(withReveal(accordion, 'accordion')).toBe(accordion);
  });

  it('keeps membership across a language change that relabels and reorders', () => {
    const english = open(FIXTURE_SLOTS.hardpoint);
    const german = open(FIXTURE_SLOTS.hardpoint, 'de');

    const membershipOf = (state: CandidateQueryState) =>
      new Map(state.choices.map((choice) => [choice.key, choice.presentation.familyId]));

    // Same choice, same family, whatever it is called and wherever the locale's
    // collator puts it (SC-009).
    expect(membershipOf(german)).toEqual(membershipOf(english));

    const germanFamilies = groupFamilies(german.results, new Set());
    const englishFamilies = groupFamilies(english.results, new Set());
    expect(germanFamilies.map((family) => family.familyId)).toEqual(
      englishFamilies.map((family) => family.familyId),
    );
    // At least one family really is named differently, or this proves nothing.
    expect(
      germanFamilies.some(
        (family, index) => family.name.text !== englishFamilies[index]!.name.text,
      ),
    ).toBe(true);
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
    const accented = state.choices.find((choice) => {
      const name = nameOf(choice);
      return name.normalize('NFKD').replace(/\p{M}/gu, '') !== name;
    });

    expect(accented).toBeDefined();

    const stripped = nameOf(accented!).normalize('NFKD').replace(/\p{M}/gu, '').toUpperCase();

    expect(applyQuery(state, stripped).results).toContain(accented!);
  });

  it('never matches a symbol, a blueprint, an acquisition token or a stat', () => {
    const state = open(FIXTURE_SLOTS.hardpoint);
    const variant = state.choices.find((choice) => choice.kind === 'variant')!;

    expect(applyQuery(state, variant.module.symbol).status).toBe('noMatches');
    if (variant.kind === 'variant') {
      expect(applyQuery(state, variant.variant.blueprintSymbol).status).toBe('noMatches');
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

describe('the family carried from the mount before', () => {
  /** A family the empty fixture hardpoint actually offers. */
  function offeredFamily(): OutfittingFamilyId {
    return open(FIXTURE_SLOTS.hardpoint).choices[0]!.presentation.familyId;
  }

  it('opens the family the Commander was last reading on an empty mount', () => {
    const carried = offeredFamily();
    const state = open(FIXTURE_SLOTS.hardpoint, 'en', 1, null, carried);

    // Working down a row of empty hardpoints means fitting the same kind of
    // thing several times; closing the category on each one made a Commander
    // open it again for every mount.
    expect([...state.openFamilies]).toEqual([carried]);
  });

  it('never overrides the family the mount itself is carrying', () => {
    const empty = open(FIXTURE_SLOTS.hardpoint);
    const other = empty.choices[0]!.presentation.familyId;
    const fittedState = open(FIXTURE_SLOTS.fittedHardpoint);
    const fitted = fittedState.choices[0]!;

    const state = open(
      FIXTURE_SLOTS.fittedHardpoint,
      'en',
      1,
      { symbol: fitted.module.symbol, variant: fitted.kind === 'variant' ? fitted.variant : null },
      other,
    );

    // What is in the mount always wins: the carry is only consulted where the
    // mount has nothing of its own to say.
    expect(state.fittedFamilyId).not.toBeNull();
    expect([...state.openFamilies]).toEqual([state.fittedFamilyId]);
  });

  it('drops a carry the mount does not offer at all', () => {
    const hardpointFamilies = new Set(
      open(FIXTURE_SLOTS.hardpoint).choices.map((choice) => choice.presentation.familyId),
    );
    const foreign = open(FIXTURE_SLOTS.optional)
      .choices.map((choice) => choice.presentation.familyId)
      .find((family) => !hardpointFamilies.has(family));

    expect(foreign, 'the two fixture mounts share every family').toBeDefined();

    const carried = open(FIXTURE_SLOTS.hardpoint, 'en', 1, null, foreign!);
    const plain = open(FIXTURE_SLOTS.hardpoint);

    expect([...carried.openFamilies]).toEqual([...plain.openFamilies]);
  });

  it('survives clearing a search, the way the fitted seed does', () => {
    const carried = offeredFamily();
    const state = open(FIXTURE_SLOTS.hardpoint, 'en', 1, null, carried);

    expect([...applyQuery(applyQuery(state, 'zzz'), '').openFamilies]).toEqual([carried]);
  });

  describe('the reveals the store lays over the seed', () => {
    it('takes them in place of the seed', () => {
      const state = open(FIXTURE_SLOTS.hardpoint);
      const families = [...new Set(state.results.map((choice) => choice.presentation.familyId))];
      expect(families.length).toBeGreaterThan(1);

      const revealed = withRevealedFamilies(state, new Set(families.slice(0, 2)));

      expect([...revealed.openFamilies]).toEqual(families.slice(0, 2));
    });

    it('keeps an empty set, because closing them all is a Commander\u2019s own answer', () => {
      const state = open(FIXTURE_SLOTS.hardpoint);

      expect([...withRevealedFamilies(state, new Set()).openFamilies]).toEqual([]);
    });

    it('drops a reveal for a family these results no longer hold', () => {
      const state = open(FIXTURE_SLOTS.hardpoint);
      const held = [...new Set(state.results.map((choice) => choice.presentation.familyId))];
      expect(held.length).toBeGreaterThan(0);

      // A rebuild at the same presentation can offer a different set of
      // families. An id for one that is gone must not be carried on.
      const revealed = withRevealedFamilies(
        state,
        new Set([held[0]!, 'not-a-family' as OutfittingFamilyId]),
      );

      expect([...revealed.openFamilies]).toEqual([held[0]]);
    });

    it('falls back to the seed when every revealed family is gone', () => {
      const state = open(FIXTURE_SLOTS.hardpoint);

      // Not the same statement as "I closed them all", so the seed answers
      // rather than an empty rail with nothing to draw.
      const revealed = withRevealedFamilies(state, new Set(['not-a-family' as OutfittingFamilyId]));

      expect([...revealed.openFamilies]).toEqual([...state.openFamilies]);
    });
  });
});
