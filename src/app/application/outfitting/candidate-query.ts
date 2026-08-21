import type { CandidateSection } from './acquisition-labels';
import type { CandidateMembership, ModuleChoice } from './candidate-membership';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { compareRating } from './rating-order';
import { fold, foldQuery } from './text-folding';

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
}

/** One run of choices the package names the same thing. */
export interface CandidateGroup {
  readonly name: GameTextPresentation;
  readonly choices: readonly ModuleChoice[];
}

/** One section of the chooser, in the order it is listed. */
export interface CandidateSectionView {
  readonly section: CandidateSection;
  readonly groups: readonly CandidateGroup[];
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
  };
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
 * The results as sections and name groups, for rendering.
 *
 * Derived rather than stored: the ordering already puts each section's choices
 * together and each name's choices together inside it, so this walks the list
 * once and marks where it changes. Storing a second, parallel shape would be
 * two things to keep in step.
 */
export function groupCandidates(
  results: readonly ModuleChoice[],
  collator: Intl.Collator,
): readonly CandidateSectionView[] {
  const sections: CandidateSectionView[] = [];

  for (const choice of results) {
    const section = choice.presentation.section;
    let current = sections.at(-1);
    if (current === undefined || current.section !== section) {
      current = { section, groups: [] };
      sections.push(current);
    }

    const groups = current.groups as CandidateGroup[];
    const last = groups.at(-1);
    if (last !== undefined && collator.compare(nameOf(last.choices[0]!), nameOf(choice)) === 0) {
      (last.choices as ModuleChoice[]).push(choice);
    } else {
      groups.push({ name: choice.presentation.name, choices: [choice] });
    }
  }

  return sections;
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
 * Sections first, so the unique rewards are the final block however they sort
 * inside it. Then the name a Commander reads, compared with the active
 * locale's own rules at base sensitivity so `Multi-Cannon` and `multi-cannon`
 * are one group rather than two. Then class descending — the biggest module a
 * mount takes is the one being looked for — rating ascending, and the stock
 * article before the rewards built on it. The package's own ordinals settle the
 * rest, so two indistinguishable rows still come out in the order the Almanac
 * published them (module-catalogue contract, "Sections, groups and order").
 */
export function orderChoices(
  choices: readonly ModuleChoice[],
  collator: Intl.Collator,
): readonly ModuleChoice[] {
  const sectionRank: Record<CandidateSection, number> = { standard: 0, uniqueReward: 1 };

  return [...choices].sort((left, right) => {
    const bySection =
      sectionRank[left.presentation.section] - sectionRank[right.presentation.section];
    if (bySection !== 0) return bySection;

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

function kindRank(choice: ModuleChoice): number {
  return choice.kind === 'stock' ? 0 : 1;
}

function variantOrdinal(choice: ModuleChoice): number {
  return choice.kind === 'variant' ? choice.variantOrdinal : -1;
}
