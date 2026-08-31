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
 * How this composition reveals a family.
 *
 * One model, two shapes. Canvas 1d draws an accordion: any number of families
 * open at once, each with a caret, and none open at all is a state it draws.
 * Canvas 1c, since the 2026-08-25 revision, draws a rail beside a variant pane
 * — every family listed, exactly one selected, no caret, and a pane that is
 * never empty. *Revealed* is the accordion's open family and the rail's
 * selected one, which is the word the requirements are restated in
 * (module-replacement design, "What exclusive selection does to FR-021, FR-022
 * and FR-023").
 *
 * The difference is not arrangement, so it cannot live in a stylesheet: a rail
 * that let two families be selected would draw two panes, and an accordion that
 * closed the rest whenever one opened would take away a comparison canvas 1d
 * offers. It is the reveal rule itself, and it belongs with the state that
 * holds what is revealed.
 */
export type FamilyReveal = 'accordion' | 'rail';

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
   * The key of the exact choice already in the mount, where it offers one.
   *
   * The same `find` that yields the family above, kept rather than thrown away.
   * It is what lets the chooser report the module in the mount as the row that
   * is chosen: a radio group's checked option is the option currently in force,
   * and a mount that already holds a module has one. Before it, opening a
   * fitted mount opened the right family and scrolled the right row into view
   * while leaving every row in the group reporting unchecked — the fitted state
   * carried by the row's own ground alone (Commander request 2026-08-26).
   *
   * `null` on an empty mount, or where the article the mount carries is not
   * among the choices offered back.
   */
  readonly fittedChoiceKey: string | null;
  /**
   * The family the Commander had open on the mount before this one.
   *
   * Consulted only when this mount has no fitted family of its own to seed
   * from, and only when it actually offers that family. Carried on the state
   * beside `fittedFamilyId` because it is the same kind of thing — a seed the
   * default open set is restored from every time a query is cleared, rather
   * than a set that has to be kept in step (FR-021, FR-023).
   */
  readonly carriedFamilyId: OutfittingFamilyId | null;
  /**
   * Which families are open right now.
   *
   * Seeded, not remembered. It is replaced wholesale every time the chooser is
   * presented for a different mount, a different reading language, a different
   * reveal model or a different query, and a Commander's toggle lives only
   * until the next one — which is what FR-021 and FR-023 describe and what
   * keeps the open set from needing an invalidation rule of its own
   * (decision 15). A rebuild that changes none of those four is the same
   * presentation at a later revision and keeps the toggles: the store holds
   * them and lays them over the seed through `withRevealedFamilies`.
   */
  readonly openFamilies: ReadonlySet<OutfittingFamilyId>;
  /**
   * Which of the two reveal models this composition is under.
   *
   * Carried on the state rather than passed to each call, because every rule
   * that seeds, searches or toggles the set has to agree about it — and a
   * composition change is a re-seed, not a translation of the set that was
   * there (FR-021).
   */
  readonly reveal: FamilyReveal;
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
  carriedFamilyId: OutfittingFamilyId | null = null,
): CandidateQueryState {
  const choices = orderChoices(membership.choices, collator);
  const fittedChoice = choices.find((choice) => isFittedChoice(choice, fitted));

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
      fittedFamilyId: fittedChoice?.presentation.familyId ?? null,
      fittedChoiceKey: fittedChoice?.key ?? null,
      carriedFamilyId,
      openFamilies: new Set(),
      // The accordion is the model a state arrives under; the composition that
      // is actually drawing it says so a step later, through `withReveal`. It
      // is the compact answer, which is the one every renderer can draw.
      reveal: 'accordion',
    },
    '',
  );
}

/**
 * The same ordered, indexed chooser under the other reveal model.
 *
 * Separate from `openCandidateQuery` so a composition change costs a re-seed
 * and not a re-sort: the collator ran over every pair and the fold over every
 * string when the mount was opened, and neither answer changes because the
 * region grew wide enough for a rail (SC-002). Re-seeding is the point rather
 * than a side effect — the default under a rail is not the default under an
 * accordion, and a set carried across would be one composition's answer drawn
 * in the other's shape.
 */
export function withReveal(state: CandidateQueryState, reveal: FamilyReveal): CandidateQueryState {
  return state.reveal === reveal ? state : { ...state, reveal };
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
    openFamilies: revealedAfterQuery(state, terms.length, matched),
  };
}

/**
 * Which families a query leaves revealed, under whichever model is drawing.
 *
 * The rail reveals the first family holding a match, whatever the match count.
 * FR-023's screenful rule exists to stop one keystroke building several hundred
 * cards, and a rail cannot do that at any count: it paints one family's rows and
 * lists the rest as names. So the rule is the accordion's, and always was in
 * effect — the measurement behind it was taken at 390px (module-replacement
 * design, "Scoped to the compact composition on 2026-08-25").
 *
 * What both models keep is the part that mattered: a family holding a match is
 * never absent, because `groupFamilies` renders exactly the families the results
 * contain.
 */
function revealedAfterQuery(
  state: CandidateQueryState,
  terms: number,
  matched: readonly ModuleChoice[],
): ReadonlySet<OutfittingFamilyId> {
  if (terms === 0) {
    return seedFamilies(state);
  }
  if (state.reveal === 'rail') {
    return firstFamilyOf(matched);
  }
  // A search that narrowed the list to something readable opens everything it
  // found, so no match is hidden behind a control a Commander would have to
  // guess at. A search that matched more than a screenful opens nothing: at
  // that width the families themselves are the answer — which one holds what
  // was asked for, and how many — and opening them all draws hundreds of rows
  // a Commander is about to type past anyway (FR-023).
  return matched.length > OPEN_ON_SEARCH_LIMIT ? new Set() : familiesOf(matched);
}

/**
 * The same state with the Commander's own reveals in place of the seed.
 *
 * A rebuild is not always a new presentation. Fitting a module, undoing a fit
 * and redoing it all move the build revision, and the chooser is built again
 * for the same mount, the same reading language and the same query — so the
 * families a Commander opened and closed are still about exactly what is in
 * front of them. Seeding again there re-opened a family they had just closed
 * the moment they fitted something from another one, which is a toggle undone
 * by an edit that had nothing to do with it (Commander request 2026-08-31).
 *
 * A family the new results do not hold simply draws nothing: `groupFamilies`
 * renders the families the results contain and no others.
 */
export function withRevealedFamilies(
  state: CandidateQueryState,
  openFamilies: ReadonlySet<OutfittingFamilyId>,
): CandidateQueryState {
  return { ...state, openFamilies };
}

/**
 * Reveals one family, and changes nothing else.
 *
 * Under the accordion this is a toggle: the family opens if it was closed and
 * closes if it was open, and every other family stays as it was. Under the rail
 * it is a selection, and selection is exclusive and total — the chosen family
 * becomes the only revealed one, and choosing the one already selected leaves it
 * selected rather than emptying the pane. The canvas's rail always has a
 * selection and never paints an empty pane, so there is no state here for
 * "none" to mean (FR-022).
 */
export function toggleFamily(
  state: CandidateQueryState,
  familyId: OutfittingFamilyId,
): CandidateQueryState {
  if (state.reveal === 'rail') {
    return { ...state, openFamilies: new Set([familyId]) };
  }
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

/**
 * The default: the family holding the exact fitted choice, and no other.
 *
 * Where no available family holds it — an empty mount, or an article the package
 * no longer offers back — the family the Commander was last reading takes over,
 * if this mount offers it. Working down a row of empty hardpoints means fitting
 * the same kind of thing several times, and closing the category on every mount
 * made them open it again for each one (reported 2026-08-26). It is a carry, not
 * a memory: it survives one step, is only ever consulted when the mount itself
 * has nothing to say, and is dropped the moment this mount does not offer that
 * family at all.
 *
 * Where neither has an answer the two models part. The accordion reveals
 * nothing, which is a state canvas 1d draws. The rail reveals the first family
 * in package order, because the canvas's rail always has a selection and an
 * empty pane beside a full rail is a state it does not draw. That is not a
 * substitute this application chose: it is what the drawing does (FR-021, and
 * module-replacement design, "What exclusive selection does to FR-021, FR-022
 * and FR-023").
 */
function seedFamilies(state: CandidateQueryState): ReadonlySet<OutfittingFamilyId> {
  if (state.fittedFamilyId !== null) {
    return new Set([state.fittedFamilyId]);
  }
  const carried = state.carriedFamilyId;
  if (carried !== null && familiesOf(state.choices).has(carried)) {
    return new Set([carried]);
  }
  return state.reveal === 'rail' ? firstFamilyOf(state.choices) : new Set();
}

/** The first family in the list's own order, which is the package's. */
function firstFamilyOf(choices: readonly ModuleChoice[]): ReadonlySet<OutfittingFamilyId> {
  const first = choices[0];
  return first === undefined ? new Set() : new Set([first.presentation.familyId]);
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
 * Two choices on price, dearest first, with the unpriced last.
 *
 * The package publishes no credit price for every article — one sold only for
 * Merc Coin has a price, and it is not in credits — and `null` cannot be
 * subtracted from a number without deciding what it is worth. It is worth
 * nothing that can be compared against a price, so it goes after every priced
 * choice of the same class rather than sorting as though it were free
 * (FR-003). Two unpriced choices are equal here and fall to the keys below.
 *
 * Written as branches rather than as a sentinel standing in for `null`: the
 * sentinel that says "after everything" is `-Infinity`, and subtracting one
 * `-Infinity` from another is `NaN`, which a comparator hands to `sort` as an
 * order it cannot use.
 */
function comparePrice(left: ModuleChoice, right: ModuleChoice): number {
  const leftCost = left.presentation.facts.cost;
  const rightCost = right.presentation.facts.cost;

  if (leftCost === rightCost) return 0;
  if (leftCost === null) return 1;
  if (rightCost === null) return -1;

  return rightCost - leftCost;
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
 * two keys a mount is actually shopped by: class descending — the biggest
 * module the mount takes is the one being looked for — and then the package's
 * own price for the article, descending, because the best of a size is the
 * dearest of it. The name led both of these until 2026-08-27, which sorted
 * `Beam Laser` before `Burst Laser` before `Cannon` and made a Commander read
 * down a whole family for the size they were fitting (Commander request).
 *
 * The name is still here, one key lower, compared with the active locale's own
 * rules at base sensitivity so `Multi-Cannon` and `multi-cannon` sort as one
 * module rather than two. Rating ascending, the stock article before the
 * rewards built on it, and the package's own ordinals settle the rest, so two
 * indistinguishable rows still come out in the order the Almanac published
 * them and the order stays total (module-catalogue contract, "Families and
 * order").
 */
function orderChoices(
  choices: readonly ModuleChoice[],
  collator: Intl.Collator,
): readonly ModuleChoice[] {
  return [...choices].sort((left, right) => {
    const byFamily = familyRank(left) - familyRank(right);
    if (byFamily !== 0) return byFamily;

    const byClass = right.presentation.class - left.presentation.class;
    if (byClass !== 0) return byClass;

    const byPrice = comparePrice(left, right);
    if (byPrice !== 0) return byPrice;

    const byName = collator.compare(nameOf(left), nameOf(right));
    if (byName !== 0) return byName;

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
