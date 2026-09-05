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
import { MessageService } from '../../../../i18n/message.service';
import { Layer } from '../../../../ui/components/layer/layer';
import { CandidateList } from '../../../../ui/outfitting/candidate-list';
import type { CandidateManifest } from '../../../../ui/outfitting/manifest';
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
  selector: 'ednb-module-replacement',
  imports: [CandidateList, CandidateSearch, Layer, NgTemplateOutlet],
  templateUrl: './module-replacement.html',
  styleUrl: './module-replacement.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleReplacement {
  readonly #messages = inject(MessageService);
  readonly store = inject(OutfittingStore);

  readonly slot = input.required<SlotView>();

  /**
   * The panel's own heading, where the surface it sits in has one to give.
   *
   * Canvas 1c writes `FITTING · HARDPOINT 1` on the same row as the search
   * field and `REMOVE MODULE`, so the heading belongs to this panel's head
   * rather than to a rule above it (wave 5).
   *
   * It is drawn at both widths. The layer's own title says what the screen is
   * for — `Change module` — and the mount it is open on is a different fact: a
   * Commander who opened the wrong row had nothing on the screen to tell them
   * so (Commander request 2026-08-27).
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

  /** The row a Commander picked, the mount they picked it for, and when. */
  readonly #pick = signal<{
    readonly key: string;
    readonly revision: number;
    readonly slotKey: string;
  } | null>(null);

  readonly query = computed(() => this.store.candidateQuery());

  /** True when the pick was made against a build that has since changed. */
  readonly stale = computed(() => {
    const pick = this.#pick();
    return pick !== null && pick.revision !== this.store.revision();
  });

  /**
   * The pick, or nothing once it stops being about the mount on screen.
   *
   * The mount is checked as well as the revision. Selecting a different mount
   * spends no revision — it is a change of what is being looked at, not of the
   * build — so a pick made on one mount used to survive into the next, and the
   * row it had marked was still marked there. Two mounts of the same size are
   * offered the same modules under the same keys, so that was the *same* row,
   * and the radio the browser had physically checked was never written back to
   * unchecked. Pressing it again set `checked` on an input that was already
   * checked, no `change` event was fired, and nothing happened: the reported
   * case of a module that cannot be fitted to a second, empty hardpoint
   * (reported 2026-08-26).
   */
  readonly selectedChoiceKey = computed(() => {
    const pick = this.#pick();
    if (pick === null || this.stale() || pick.slotKey !== this.slot().key) {
      return null;
    }
    return pick.key;
  });

  /**
   * The row the manifest marks as the chosen one.
   *
   * The pick where there is one, and otherwise **the module already in the
   * mount**. A radio group's checked option is the option currently in force,
   * and a mount that already holds a module has one — so opening a fitted mount
   * used to open the right family and scroll the right row into view while
   * every row in the group still reported unchecked, leaving the fitted state
   * carried by that row's own ground alone (Commander request 2026-08-26).
   *
   * Kept apart from `selectedChoiceKey` deliberately. That one is a *decision a
   * Commander made*, and it is what the layer's `FIT MODULE` commits; this one
   * is what the list draws. Folding the two together would arm that control on
   * a mount nobody had touched, and pressing it would spend a press to fit the
   * module that is already there.
   */
  readonly markedChoiceKey = computed(
    () => this.selectedChoiceKey() ?? this.query()?.fittedChoiceKey ?? null,
  );

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
    this.#pick.set({
      key: choiceKey,
      revision: this.store.revision(),
      slotKey: this.slot().key,
    });
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
   * Straight through to the store and nowhere near the transaction: no
   * revision, no checkpoint, no rebuilt index. What a Commander opens lives
   * until the chooser is presented for a different mount, reading language,
   * reveal model or search, which is where FR-021's seed takes over again. An
   * edit to this same mount is not one of the four.
   */
  toggleFamily(familyId: OutfittingFamilyId): void {
    this.store.toggleFamily(familyId);
  }

  /**
   * Passes the manifest's own measurement on to the state that seeds families.
   *
   * The rail and the accordion do not reveal a family the same way, and the
   * revealed set lives in the store — so the store has to be told which of the
   * two is drawing. The measurement is the manifest's because the threshold is
   * the manifest's container, not this region's (`manifest.ts`, FR-021).
   */
  setManifest(manifest: CandidateManifest): void {
    this.store.setFamilyReveal(manifest === 'rail' ? 'rail' : 'accordion');
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
      // The pick is spent either way: it was a decision, the decision has been
      // taken, and what the row means from here is that it is the module in the
      // mount. Nothing is lost by forgetting it — `markedChoiceKey` falls back
      // to the mount's own fitted row, so the manifest goes on marking exactly
      // the row that was just chosen, and the radio goes on agreeing with it.
      //
      // Carrying it forward instead was tried and was worse. `stale` asks
      // whether the pick was made against a build that has since changed, and a
      // pick held at the revision it produced answers yes to the very next edit
      // anywhere in the workspace — a priority toggle, an undo, an engineering
      // pass — at which point the panel replaced the whole manifest with "this
      // has moved on" and never came back, because nothing inline closes the
      // panel or clears the pick.
      this.#pick.set(null);

      // Only a layer closes. Inline the panel is simply there for the marked
      // mount, so the manifest stays where the Commander is reading it
      // (canvas 1c).
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
