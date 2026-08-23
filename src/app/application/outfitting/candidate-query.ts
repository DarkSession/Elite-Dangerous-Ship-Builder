import {
  OUTFITTING_FAMILIES,
  type OutfittingFamilyId,
} from '@elite-dangerous-almanac/core/ships/module-families';
import {
  isFittedChoice,
  type CandidateMembership,
  type FittedArticle,
  type ModuleChoice,
} from './candidate-membership';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { compareRating } from './rating-order';
import { fold, foldQuery } from './text-folding';

/**
 * The package's own family order, as a rank.
 *
 * `OUTFITTING_FAMILIES` is a `Record` the Almanac writes in its own order —
 * armour, then the core mounts, then the optionals, then the weapons — and that
 * order is the one the chooser lists families in. Sorting the names instead
 * would be this application deciding that `Beam Lasers` comes before
 * `Cannons` in every language, which is a rule about game text we do not own
 * (FR-020).
 */
const FAMILY_RANK: ReadonlyMap<string, number> = new Map(
  Object.keys(OUTFITTING_FAMILIES).map((familyId, rank) => [familyId, rank]),
);

/**
 * What the chooser is currently doing, as one distinguishable state.
 *
 * `noMatches` and `packageEmpty` are deliberately separate. "Nothing matched
 * what you typed" and "the Almanac offers nothing for this mount" look
 * identical on screen — an empty list — and mean opposite things: one is fixed
 * by clearing the query and one cannot be fixed at all (module-catalogue
 * contract, "Search").
 */
export type CandidateStatus =
  'loading' | 'ready' | 'noMatches' | 'packageEmpty' | 'stale' | 'refused';

/** The three states the chooser cannot work out for itself. */
export type CandidateStatusOverride = 'loading' | 'stale' | 'refused';

/**
 * One choice's searchable text, folded once when the index is built.
 *
 * Four fields and no fifth. A symbol, a blueprint id, an acquisition label, an
 * entitlement token or a stat would each make some query "work" and would make
 * the result set unexplainable — a Commander cannot see why `merc` matched a
 * row whose visible text does not contain it (module-catalogue contract,
 * "Search").
 */
export interface CandidateSearchEntry {
  readonly key: string;
  readonly name: string;
  /** The class as its plain decimal digits, which is what a Commander types. */
  readonly class: string;
  readonly rating: string;
  /** Folded mount type, or the empty string where the package publishes none. */
  readonly mount: string;
}

/** The chooser's whole state for one mount at one revision in one language. */
export interface CandidateQueryState {
  readonly slotKey: string;
  readonly buildRevision: number;
  readonly locale: string;
  readonly query: string;
  readonly choices: readonly ModuleChoice[];
  readonly index: readonly CandidateSearchEntry[];
  readonly results: readonly ModuleChoice[];
  readonly status: CandidateStatus;
  /** Whether clearing the query is a route out of the current state. */
  readonly canClear: boolean;
  /**
   * The family of the exact choice already in the mount, where it has one.
   *
   * `null` when the mount is empty, or when the article it carries is not among
   * the choices offered back — the package does not always offer a fitted
   * reward again. It is carried rather than recomputed because it is the seed
   * the default open state is restored from every time a query is cleared
   * (FR-021, FR-023).
   */
  readonly fittedFamilyId: OutfittingFamilyId | null;
  /**
   * Which families are open right now.
   *
   * Seeded, not remembered. It is replaced wholesale on every rebuild and on
   * every query change, and a Commander's toggle lives only until the next one
   * — which is what FR-021 and FR-023 describe and what keeps the open set from
   * needing an invalidation rule of its own (decision 15).
   */
  readonly openFamilies: ReadonlySet<OutfittingFamilyId>;
}

/** One package family, with the choices it holds in the list's own order. */
export interface CandidateFamilyView {
  readonly familyId: OutfittingFamilyId;
  /** The Almanac's name for the family, presented for the reading language. */
  readonly name: GameTextPresentation;
  /** How many of the current results this family holds. */
  readonly count: number;
  readonly open: boolean;
  readonly choices: readonly ModuleChoice[];
}

/**
 * Opens a mount's chooser: ordered once, indexed once.
 *
 * Both are done here rather than per keystroke because neither depends on the
 * query. Ordering calls a collator on every pair and folding normalizes every
 * string, and the largest mount the installed package offers has hundreds of
 * choices — doing either again on each character typed is what puts a phone
 * over the 100 ms the contract allows (SC-002).
 *
 * The state carries the slot, revision and locale it was built from. That is
 * what makes it possible to notice that it is no longer about the build in
 * front of the Commander, rather than fitting something that was offered a
 * revision ago.
 */
export function openCandidateQuery(
  membership: CandidateMembership,
  locale: string,
  collator: Intl.Collator,
  fitted: FittedArticle | null = null,
): CandidateQueryState {
  const choices = orderChoices(membership.choices, collator);

  return applyQuery(
    {
      slotKey: membership.slotKey,
      buildRevision: membership.buildRevision,
      locale,
      query: '',
      choices,
      index: buildIndex(choices, locale),
      results: choices,
      status: 'ready',
      canClear: false,
      fittedFamilyId:
        choices.find((choice) => isFittedChoice(choice, fitted))?.presentation.familyId ?? null,
      openFamilies: new Set(),
    },
    '',
  );
}

/**
 * Runs one query against an already-built index.
 *
 * The only work per keystroke: fold the query, split it, and walk the index.
 * Results are the retained choice objects in their existing order, so a search
 * never reorders anything and a fit always passes the package's own record.
 */
export function applyQuery(
  state: CandidateQueryState,
  query: string,
  override: CandidateStatusOverride | null = null,
): CandidateQueryState {
  const terms = foldQuery(query, state.locale);
  const matched =
    terms.length === 0 ? state.choices : keep(state.choices, matchingKeys(state.index, terms));

  return {
    ...state,
    query,
    results: matched,
    status: override ?? intrinsicStatus(state.choices.length, terms.length, matched.length),
    // Clearing is only a way out while there is something to clear.
    canClear: query.length > 0,
    // A search that narrowed the list to something readable opens everything it
    // found, so no match is hidden behind a control a Commander would have to
    // guess at. A search that matched more than a screenful opens nothing: at
    // that width the families themselves are the answer — which one holds what
    // was asked for, and how many — and opening them all draws hundreds of rows
    // a Commander is about to type past anyway (FR-023). An empty query goes
    // back to the fitted module's family alone (FR-021).
    openFamilies:
      terms.length === 0
        ? seedFamilies(state)
        : matched.length > OPEN_ON_SEARCH_LIMIT
          ? new Set()
          : familiesOf(matched),
  };
}

/** Opens or closes exactly one family, and changes nothing else. */
export function toggleFamily(
  state: CandidateQueryState,
  familyId: OutfittingFamilyId,
): CandidateQueryState {
  const open = new Set(state.openFamilies);
  if (!open.delete(familyId)) {
    open.add(familyId);
  }
  return { ...state, openFamilies: open };
}

/**
 * How many matches a search may open at once.
 *
 * Above it the families stay closed. The figure is a screenful rather than an
 * arithmetic bound: 25 rows is more than any supported viewport shows at once,
 * so a Commander whose search opened everything can always still see that it
 * did, while the first letter of a broad term — which matches most of a
 * 478-choice mount — stops building hundreds of cards that are about to be
 * typed past (module-replacement design, "Module families").
 */
const OPEN_ON_SEARCH_LIMIT = 25;

/** The default: the fitted choice's family alone, or nothing at all. */
function seedFamilies(state: CandidateQueryState): ReadonlySet<OutfittingFamilyId> {
  return state.fittedFamilyId === null ? new Set() : new Set([state.fittedFamilyId]);
}

function familiesOf(choices: readonly ModuleChoice[]): ReadonlySet<OutfittingFamilyId> {
  return new Set(choices.map((choice) => choice.presentation.familyId));
}

/** Whether a state describes the build and language currently on screen. */
export function isCurrent(
  state: CandidateQueryState,
  slotKey: string,
  buildRevision: number,
  locale: string,
): boolean {
  return (
    state.slotKey === slotKey && state.buildRevision === buildRevision && state.locale === locale
  );
}

/**
 * The results as the package's families, for rendering.
 *
 * Derived rather than stored: the ordering already puts each family's choices
 * together, so this walks the list once and marks where the family changes.
 * Storing a second, parallel shape would be two things to keep in step.
 *
 * A family with nothing in the current results is simply not here. A search
 * that matched nothing in `Beam Lasers` must not draw a `Beam Lasers` control
 * with nothing behind it, so absence is how a family without a match is shown
 * (FR-023).
 */
export function groupFamilies(
  results: readonly ModuleChoice[],
  openFamilies: ReadonlySet<OutfittingFamilyId>,
): readonly CandidateFamilyView[] {
  const families: CandidateFamilyView[] = [];

  for (const choice of results) {
    const familyId = choice.presentation.familyId;
    let current = families.at(-1);
    if (current === undefined || current.familyId !== familyId) {
      current = {
        familyId,
        name: choice.presentation.family,
        count: 0,
        open: openFamilies.has(familyId),
        choices: [],
      };
      families.push(current);
    }

    (current.choices as ModuleChoice[]).push(choice);
    (current as { count: number }).count += 1;
  }

  return families;
}

/**
 * The contract's order, as one comparator.
 *
 * The collator is passed in rather than constructed here: it belongs to the
 * central formatter cache, and it must be at base sensitivity so case and
 * accents do not separate two names a Commander reads as the same module —
 * the same decision the search folding makes, taken by the locale's own rules
 * rather than by ours.
 *
 * The package's family first, in the package's own order, so every choice in a
 * family is one run and the runs come out as the Almanac lists them. Then the
 * name a Commander reads, compared with the active locale's own rules at base
 * sensitivity so `Multi-Cannon` and `multi-cannon` sort as one module rather
 * than two. Then class descending — the biggest module a mount takes is the one
 * being looked for — rating ascending, and the stock article before the rewards
 * built on it. The package's own ordinals settle the rest, so two
 * indistinguishable rows still come out in the order the Almanac published them
 * (module-catalogue contract, "Families and order").
 */
export function orderChoices(
  choices: readonly ModuleChoice[],
  collator: Intl.Collator,
): readonly ModuleChoice[] {
  return [...choices].sort((left, right) => {
    const byFamily = familyRank(left) - familyRank(right);
    if (byFamily !== 0) return byFamily;

    const byName = collator.compare(nameOf(left), nameOf(right));
    if (byName !== 0) return byName;

    const byClass = right.presentation.class - left.presentation.class;
    if (byClass !== 0) return byClass;

    const byRating = compareRating(left.presentation.rating, right.presentation.rating);
    if (byRating !== 0) return byRating;

    const byKind = kindRank(left) - kindRank(right);
    if (byKind !== 0) return byKind;

    const bySource = left.sourceOrdinal - right.sourceOrdinal;
    if (bySource !== 0) return bySource;

    return variantOrdinal(left) - variantOrdinal(right);
  });
}

/** Folds each choice's four searchable fields, once. */
export function buildIndex(
  choices: readonly ModuleChoice[],
  locale: string,
): readonly CandidateSearchEntry[] {
  return choices.map((choice) => ({
    key: choice.key,
    name: fold(nameOf(choice), locale),
    class: String(choice.presentation.class),
    rating: fold(choice.presentation.rating, locale),
    mount: choice.presentation.mount === null ? '' : fold(choice.presentation.mount, locale),
  }));
}

/** Every term must appear somewhere in a choice's fields, or it does not match. */
function matchingKeys(
  index: readonly CandidateSearchEntry[],
  terms: readonly string[],
): ReadonlySet<string> {
  const keys = new Set<string>();

  for (const entry of index) {
    if (terms.every((term) => matches(entry, term))) {
      keys.add(entry.key);
    }
  }

  return keys;
}

function matches(entry: CandidateSearchEntry, term: string): boolean {
  return (
    entry.name.includes(term) ||
    entry.class.includes(term) ||
    entry.rating.includes(term) ||
    (entry.mount.length > 0 && entry.mount.includes(term))
  );
}

function keep(
  choices: readonly ModuleChoice[],
  keys: ReadonlySet<string>,
): readonly ModuleChoice[] {
  return choices.filter((choice) => keys.has(choice.key));
}

function intrinsicStatus(total: number, terms: number, matched: number): CandidateStatus {
  if (total === 0) return 'packageEmpty';
  if (terms > 0 && matched === 0) return 'noMatches';
  return 'ready';
}

/**
 * The name sorting and grouping compare on.
 *
 * A package name the active locale has no translation for still has canonical
 * text, and only a name the package has nothing at all for arrives here empty.
 * Empty sorts first, which keeps the ordering total rather than leaving those
 * rows in whatever order the sort happened to leave them.
 */
function nameOf(choice: ModuleChoice): string {
  return choice.presentation.name.text ?? '';
}

/**
 * Where a choice's family sits in the package's own list.
 *
 * A family the pinned package's rank table does not know sorts last rather than
 * being dropped: the choice is still one the Almanac offered for this mount,
 * and losing it from the list would be worse than listing it at the end.
 */
function familyRank(choice: ModuleChoice): number {
  return FAMILY_RANK.get(choice.presentation.familyId) ?? FAMILY_RANK.size;
}

function kindRank(choice: ModuleChoice): number {
  return choice.kind === 'stock' ? 0 : 1;
}

function variantOrdinal(choice: ModuleChoice): number {
  return choice.kind === 'variant' ? choice.variantOrdinal : -1;
}
