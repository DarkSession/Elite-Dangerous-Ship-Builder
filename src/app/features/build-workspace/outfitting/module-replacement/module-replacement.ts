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
import type { OutfittingFamilyId } from '@elite-dangerous-almanac/core/ships/module-families';
import {
  groupFamilies,
  type CandidateFamilyView,
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
   * The panel's own heading, where the surface it sits in has one to give.
   *
   * Canvas 1c writes `FITTING · HARDPOINT 1` on the same row as the search
   * field and `REMOVE MODULE`, so the heading belongs to this panel's head
   * rather than to a rule above it (wave 5).
   */
  readonly panelHeading = input<string | null>(null);

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

  /**
   * Every choice the mount has, as the Almanac's own families.
   *
   * Whatever is open is whole: no paging, no growing window. A scroller that
   * grew as it was reached could not know how tall it was, so its bar shrank
   * under the Commander's thumb every time it loaded more. What families change
   * is how much is open at once, not whether what is open is complete
   * (`content-visibility`, wave 4; module-replacement design, wave 10).
   */
  readonly families = computed<readonly CandidateFamilyView[]>(() => {
    const query = this.query();
    return query === null ? [] : groupFamilies(query.results, query.openFamilies);
  });

  readonly resultCount = computed(() => this.query()?.results.length ?? 0);
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
  readonly fittedHereLabel = this.#messages.messageSignal('outfitting.family.fitted');
  readonly familiesLabel = this.#messages.messageSignal('outfitting.family.heading');

  /** Canvas 1d's `5 · 24 FIT`, on the rule above the family list. */
  readonly familiesSummary = computed(() =>
    this.#messages.message('outfitting.family.summary', {
      families: this.families().length,
      count: this.resultCount(),
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

  /** And which article of it, where the Almanac identifies one. */
  readonly fittedVariant = computed(() => this.slot().module?.variant ?? null);

  /**
   * Takes one row.
   *
   * Canvas 1c draws no `FIT MODULE` and no `CANCEL`: the manifest's amber row
   * is the module in the mount, and choosing another row is the fit. Canvas 1d
   * is where the two-control bar is, because at that width the chooser is a
   * screen of its own over an inert background and leaving it has to be a
   * decision (design-canvas rule).
   */
  choose(choiceKey: string): void {
    this.#pick.set({ key: choiceKey, revision: this.store.revision() });
    if (!this.asLayer()) {
      this.fit();
    }
  }

  search(query: string): void {
    this.store.setQuery(query);
  }

  /**
   * Opens or closes one family.
   *
   * Straight through to the query state and nowhere near the transaction: no
   * revision, no checkpoint, no rebuilt index. What a Commander opens lives
   * until the next rebuild or the next query change, which is where FR-021's
   * seed takes over again.
   */
  toggleFamily(familyId: OutfittingFamilyId): void {
    this.store.toggleFamily(familyId);
  }

  clear(): void {
    this.store.clearQuery();
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
      // Only a layer closes. Inline the panel is simply there for the marked
      // mount, so there is nothing to close and the manifest stays where the
      // Commander is reading it (canvas 1c).
      if (this.asLayer()) {
        this.closed.emit();
      }
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
