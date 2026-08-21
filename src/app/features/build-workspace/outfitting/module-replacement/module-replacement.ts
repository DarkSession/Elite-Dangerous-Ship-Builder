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
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import type { ModuleChoice } from '../../../../application/outfitting/candidate-membership';
import type { SlotView } from '../../../../application/outfitting/slot-view';
import { GameTextPresenter, type GameTextPresentation } from '../../../../i18n/game-text.presenter';
import { MessageService } from '../../../../i18n/message.service';
import { Layer } from '../../../../ui/components/layer/layer';
import { ModuleIdentityBadge } from '../../../../ui/outfitting/module-identity-badge';

/**
 * Choosing what goes in one mount.
 *
 * The reference draws the wide bench as a manifest of rows and the compact one
 * as a full-screen layer of cards. Both are this component; the arrangement is
 * decided in CSS from the space the region is given.
 *
 * What the reference does *not* draw, and this adds deliberately, is the
 * confirmation. Canvas 1c shows no Fit control at wide width — a row appears to
 * be the decision. Selecting has no side effect here and a separate explicit
 * action commits, so one confirmation is one atomic Commander decision and one
 * history frame, at both widths (reference review, "Interaction and semantics").
 *
 * Selecting a row changes only this component's own draft. The build is
 * untouched until the fit action is pressed, and cancelling changes nothing at
 * all — there is nothing to restore, because nothing happened.
 */
@Component({
  selector: 'edsb-module-replacement',
  imports: [Layer, ModuleIdentityBadge, NgTemplateOutlet],
  templateUrl: './module-replacement.html',
  styleUrl: './module-replacement.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleReplacement {
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);
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

  /** The row a Commander has picked. Draft state; it changes no build. */
  readonly selectedChoiceKey = signal<string | null>(null);

  readonly heading = computed(() =>
    this.#messages.message('outfitting.replacement.title', {
      slot: this.slot().displayName.text ?? this.slot().canonicalName,
    }),
  );

  readonly fitLabel = this.#messages.messageSignal('outfitting.replacement.fit');
  readonly cancelLabel = this.#messages.messageSignal('action.cancel');
  readonly listLabel = this.#messages.messageSignal('outfitting.replacement.list');
  readonly packageEmptyLabel = this.#messages.messageSignal('outfitting.replacement.package-empty');

  /** Every choice the package offers, at the current build revision. */
  readonly choices = computed<readonly ModuleChoice[]>(
    () => this.store.membership()?.choices ?? [],
  );

  readonly packageEmpty = computed(() => this.choices().length === 0);

  readonly canFit = computed(() => this.selectedChoiceKey() !== null);

  /**
   * The package's name for a choice, in the Commander's language.
   *
   * A variant is named as the article it is, not as the stock module it is
   * based on: a Commander choosing between the stock form and a reward form
   * is choosing between two things, and one name for both would hide that.
   */
  nameOf(choice: ModuleChoice): GameTextPresentation {
    return choice.kind === 'variant'
      ? this.#gameText.preEngineeredVariantName(choice.variant)
      : this.#gameText.moduleName(choice.module.symbol);
  }

  choose(choiceKey: string): void {
    this.selectedChoiceKey.set(choiceKey);
  }

  /** Commits the picked row, as one decision. */
  fit(): void {
    const choiceKey = this.selectedChoiceKey();
    if (choiceKey === null) {
      return;
    }
    const choice = this.choices().find((candidate) => candidate.key === choiceKey);
    if (choice === undefined) {
      return;
    }

    const result = this.store.dispatch(
      choice.kind === 'stock'
        ? { kind: 'fitStock', slotKey: this.slot().key, choiceKey }
        : { kind: 'fitVariant', slotKey: this.slot().key, choiceKey },
    );

    if (result.kind === 'committed' || result.kind === 'unchanged') {
      this.selectedChoiceKey.set(null);
      this.closed.emit();
    }
    // A refusal keeps the surface open with the pick intact. The Almanac's
    // reason is published by the workspace's refusal notice; closing here would
    // take the Commander away from the thing the reason is about.
  }

  cancel(): void {
    this.selectedChoiceKey.set(null);
    this.closed.emit();
  }
}
