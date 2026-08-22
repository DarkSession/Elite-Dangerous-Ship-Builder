import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  groupCandidates,
  type CandidateSectionView,
  type CandidateStatus,
} from '../../../../application/outfitting/candidate-query';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import { slotCapabilities } from '../../../../application/outfitting/slot-capabilities';
import type { SlotView } from '../../../../application/outfitting/slot-view';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { MessageService } from '../../../../i18n/message.service';
import { Layer } from '../../../../ui/components/layer/layer';
import { CandidateList } from '../../../../ui/outfitting/candidate-list';
import { CandidateSearch } from '../../../../ui/outfitting/candidate-search';

/** What the surface is showing, including the one state the query cannot know. */
export type ReplacementState = CandidateStatus | 'notReplaceable';

/**
 * How many rows are built before a Commander asks for more.
 *
 * The largest mount the Almanac offers takes 478 modules, and canvas 1c draws
 * six. Building all of them costs more than the whole hundred milliseconds the
 * contract allows between a keystroke and the result on screen (SC-002), and
 * nobody reads four hundred rows without scrolling. A page is far more than a
 * screenful, so the common case — a search that narrows to a handful — is one
 * page and no growing at all.
 */
const PAGE = 60;

/**
 * Choosing what goes in one mount.
 *
 * The reference draws the wide bench as an aligned manifest and the compact one
 * as a full-screen view over an inert background. Both are this component; the
 * arrangement comes from the space the region was given, never from a device
 * label.
 *
 * What the reference does *not* draw, and this adds deliberately, is the
 * confirmation. Canvas 1c shows no fit control at wide width — a row appears to
 * be the decision. Selecting has no side effect here and a separate explicit
 * action commits, so one confirmation is one atomic Commander decision and one
 * history frame, at both widths (reference review, "Interaction and semantics").
 *
 * The pick is held with the revision it was made at. That is what turns "the
 * build changed under this surface" into a state the Commander is told about,
 * rather than a fit of a record that was offered a revision ago and would be
 * refused anyway — after they had been offered it.
 */
@Component({
  selector: 'edsb-module-replacement',
  imports: [CandidateList, CandidateSearch, Layer, NgTemplateOutlet],
  templateUrl: './module-replacement.html',
  styleUrl: './module-replacement.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleReplacement {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly store = inject(OutfittingStore);

  readonly slot = input.required<SlotView>();

  /**
   * Whether this is a full-screen layer rather than an inline region.
   *
   * Canvas 1c draws it inline beside the ledger; canvas 1d draws it over an
   * inert background. The decision comes from the space the workspace was
   * given, never from a device label.
   */
  readonly asLayer = input(false);

  readonly closed = output<void>();

  /** The row a Commander picked, and the revision they picked it at. */
  readonly #pick = signal<{ readonly key: string; readonly revision: number } | null>(null);

  readonly query = computed(() => this.store.candidateQuery());

  /** True when the pick was made against a build that has since changed. */
  readonly stale = computed(() => {
    const pick = this.#pick();
    return pick !== null && pick.revision !== this.store.revision();
  });

  /** The pick, or nothing once it stops being about the build on screen. */
  readonly selectedChoiceKey = computed(() => (this.stale() ? null : (this.#pick()?.key ?? null)));

  /** How many rows are currently built. Grows; never shrinks a Commander's view. */
  readonly #window = signal(PAGE);

  readonly sections = computed<readonly CandidateSectionView[]>(() => {
    const query = this.query();
    return query === null
      ? []
      : groupCandidates(query.results.slice(0, this.#window()), this.#formatters.collator());
  });

  /** How many choices there are — not how many are built. */
  readonly resultCount = computed(() => this.query()?.results.length ?? 0);

  /** How many are built, so the surface can say which part of the list this is. */
  readonly builtCount = computed(() => Math.min(this.resultCount(), this.#window()));

  readonly hasMore = computed(() => this.resultCount() > this.#window());
  readonly canClear = computed(() => this.query()?.canClear ?? false);

  /**
   * What the surface is showing, as one value.
   *
   * `notReplaceable` comes first because it is about the mount rather than the
   * query: a mount the Almanac takes no other module in has nothing to search
   * and nothing to fit, and offering a search over it would be a control with
   * nothing behind it (FR-009).
   */
  readonly state = computed<ReplacementState>(() => {
    if (this.store.selectedCapabilities()?.canOpenReplacement === false) {
      return 'notReplaceable';
    }

    const query = this.query();
    if (query === null) {
      return 'loading';
    }
    if (this.stale()) {
      return 'stale';
    }
    if (this.store.lastEditFailure()?.slotKey === this.slot().key) {
      return 'refused';
    }
    return query.status;
  });

  readonly showList = computed(() => this.state() === 'ready' || this.state() === 'refused');

  readonly heading = computed(() =>
    this.#messages.message('outfitting.replacement.title', {
      slot: this.slot().displayName.text ?? this.slot().canonicalName,
    }),
  );

  /** Canvas 1d's `24 FIT` beside the screen's title. */
  readonly countLabel = computed(() =>
    this.#messages.message('outfitting.results.count', { count: this.resultCount() }),
  );

  readonly noMatchesLabel = computed(() =>
    this.#messages.message('outfitting.replacement.no-matches', {
      query: this.query()?.query ?? '',
    }),
  );

  readonly fitLabel = this.#messages.messageSignal('outfitting.replacement.fit');
  readonly removeLabel = this.#messages.messageSignal('outfitting.capability.remove');
  readonly cancelLabel = this.#messages.messageSignal('action.cancel');
  // The layer's own header control, which every other layer in the product
  // names the same way. Naming it `Cancel` too would put two controls with one
  // name in one dialog, and a reader moving between them would have nothing to
  // tell them apart.
  readonly closeLabel = this.#messages.messageSignal('action.close');
  readonly listLabel = this.#messages.messageSignal('outfitting.replacement.list');
  readonly packageEmptyLabel = this.#messages.messageSignal('outfitting.replacement.package-empty');
  readonly loadingLabel = this.#messages.messageSignal('outfitting.replacement.loading');
  readonly staleLabel = this.#messages.messageSignal('outfitting.replacement.stale');
  readonly notReplaceableLabel = this.#messages.messageSignal(
    'outfitting.replacement.not-replaceable',
  );
  readonly clearLabel = this.#messages.messageSignal('outfitting.search.clear');
  readonly moreLabel = this.#messages.messageSignal('outfitting.replacement.more');

  readonly builtLabel = computed(() =>
    this.#messages.message('outfitting.replacement.built', {
      built: this.builtCount(),
      total: this.resultCount(),
    }),
  );

  readonly canFit = computed(() => this.selectedChoiceKey() !== null);

  /**
   * Whether the mount can be emptied, asked of the package at this revision.
   *
   * Canvas 1c draws `REMOVE MODULE` in this panel's own header, beside the
   * search — not in the ledger and not in canvas 1d's action bar, which carries
   * exactly two controls. Emptying a mount is choosing what goes in it, so it
   * lives with the rest of that choice at both widths.
   */
  readonly canRemove = computed(() => {
    this.store.revision();
    const loadout = this.store.loadout();
    return loadout === null ? false : slotCapabilities(loadout, this.slot()).canRemove;
  });

  /** The symbol currently in the mount, so its rows can say they are fitted. */
  readonly fittedSymbol = computed(() => this.slot().module?.symbol ?? null);

  choose(choiceKey: string): void {
    this.#pick.set({ key: choiceKey, revision: this.store.revision() });
  }

  search(query: string): void {
    this.store.setQuery(query);
    // A new query is a new list. Keeping a grown window would build hundreds of
    // rows for a search that narrowed to three.
    this.#window.set(PAGE);
  }

  clear(): void {
    this.store.clearQuery();
    this.#window.set(PAGE);
  }

  /** Builds the next page. */
  more(): void {
    this.#window.update((built) => built + PAGE);
  }

  /**
   * Builds the next page as the end of the list comes into reach.
   *
   * One viewport of slack, so the rows are there by the time they are scrolled
   * to rather than appearing under the Commander. The explicit control does the
   * same thing for anyone who is not scrolling.
   */
  onScroll(event: Event): void {
    const scroller = event.target as HTMLElement;
    if (this.hasMore() && scroller.scrollTop + scroller.clientHeight * 2 >= scroller.scrollHeight) {
      this.more();
    }
  }

  /** Commits the picked row, as one decision. */
  fit(): void {
    const choiceKey = this.selectedChoiceKey();
    if (choiceKey === null) {
      return;
    }
    const choice = this.query()?.choices.find((candidate) => candidate.key === choiceKey);
    if (choice === undefined) {
      return;
    }

    const result = this.store.dispatch(
      choice.kind === 'stock'
        ? { kind: 'fitStock', slotKey: this.slot().key, choiceKey }
        : { kind: 'fitVariant', slotKey: this.slot().key, choiceKey },
    );

    if (result.kind === 'committed' || result.kind === 'unchanged') {
      this.#pick.set(null);
      this.closed.emit();
    }
    // A refusal keeps the surface open with the pick intact. The Almanac's
    // reason is published by the workspace's refusal notice; closing here would
    // take the Commander away from the thing the reason is about.
  }

  /** Empties the mount, as one decision, exactly like fitting one. */
  remove(): void {
    const result = this.store.dispatch({ kind: 'remove', slotKey: this.slot().key });
    if (result.kind === 'committed' || result.kind === 'unchanged') {
      this.#pick.set(null);
      this.closed.emit();
    }
  }

  cancel(): void {
    this.#pick.set(null);
    this.store.clearQuery();
    this.closed.emit();
  }
}
