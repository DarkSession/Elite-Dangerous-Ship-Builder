import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { CandidateSection } from '../../application/outfitting/acquisition-labels';
import type { ModuleChoice } from '../../application/outfitting/candidate-membership';
import type { CandidateSectionView } from '../../application/outfitting/candidate-query';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { AcquisitionBadge } from './acquisition-badge';
import { ModuleIdentityBadge } from './module-identity-badge';
import { UnavailableFact } from './unavailable-fact';

/** One package figure, formatted, or `null` where the Almanac has none. */
interface RenderedFact {
  readonly field: string;
  readonly label: string;
  readonly value: string | null;
}

/** Everything one row draws that does not change while its records live. */
interface RenderedRow {
  readonly actionLabel: string;
  readonly purchaseGrade: string | null;
  readonly facts: readonly RenderedFact[];
}

/**
 * The modules a mount takes, in the order the contract fixes.
 *
 * Two compositions of one list, and one radio group across both. Canvas 1c
 * draws an aligned manifest under a single header row; canvas 1d draws stacked
 * cards, each restating what its figures are. Neither is a squeezed version of
 * the other: seven columns at 390 CSS pixels either scroll the document or
 * truncate the names a Commander is choosing between, and both are worse than
 * repeating the labels.
 *
 * The list carries no ranking, no recommendation and no comparison with what is
 * fitted. Every figure on a row is a value the Almanac published for that
 * module; the difference between two of them is a judgement this feature does
 * not make (module-catalogue contract, "Candidate facts").
 *
 * Sections and name groups are real structure with real headings. The canvas
 * draws neither, so the headings are `visually-hidden` — a reader hears where
 * the unique rewards begin, and the screen stays the flat list the canvas draws
 * with its `REWARD ONLY` markers on the rows.
 */
@Component({
  selector: 'edsb-candidate-list',
  imports: [AcquisitionBadge, ModuleIdentityBadge, UnavailableFact],
  templateUrl: './candidate-list.html',
  styleUrl: './candidate-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidateList {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  /** Resolved row text and figures, kept for as long as their records live. */
  readonly #rows = new WeakMap<ModuleChoice, RenderedRow>();

  readonly sections = input.required<readonly CandidateSectionView[]>();

  /** What the whole list is. Bound as the group's legend. */
  readonly label = input.required<string>();

  /** The row a Commander has picked. Draft state; it changes no build. */
  readonly selectedKey = input<string | null>(null);

  /** The symbol currently fitted in this mount, so its rows can say so. */
  readonly fittedSymbol = input<string | null>(null);

  readonly chosen = output<string>();

  readonly moduleColumn = this.#messages.messageSignal('outfitting.column.module');
  readonly fittedLabel = this.#messages.messageSignal('outfitting.candidate.fitted');
  readonly stockLabel = this.#messages.messageSignal('outfitting.candidate.stock');
  readonly variantLabel = this.#messages.messageSignal('outfitting.candidate.pre-engineered');

  /** The figure columns, named once for the wide manifest's header row. */
  readonly factColumns = computed(() => this.#factLabels());

  sectionLabel(section: CandidateSection): string {
    return this.#messages.message(
      section === 'uniqueReward'
        ? 'outfitting.section.uniqueReward'
        : 'outfitting.section.standard',
    );
  }

  groupLabel(name: string | null, count: number): string {
    return this.#messages.message('outfitting.candidate.group', { name: name ?? '', count });
  }

  /**
   * Whether a choice is what is fitted right now.
   *
   * Compared on the package's own symbol, which is the identity the Almanac
   * fitted the module under. A row that matches is marked in words, so "this is
   * already what is in the mount" does not depend on seeing the amber ground
   * the canvas draws behind it.
   */
  isFitted(choice: ModuleChoice): boolean {
    return this.fittedSymbol() !== null && choice.module.symbol === this.fittedSymbol();
  }

  /** The row's state, in words: what it is, and whether it is already in place. */
  stateLabel(choice: ModuleChoice): string {
    if (this.isFitted(choice)) {
      return this.fittedLabel();
    }
    return choice.kind === 'stock' ? this.stockLabel() : this.variantLabel();
  }

  /**
   * One row's resolved text and figures, worked out once.
   *
   * Formatting five figures and composing an action label are not free, and the
   * largest mount the Almanac offers has hundreds of rows. Doing that work from
   * the template means doing it again for every row on every keystroke, which is
   * the difference between a chooser that keeps up on a phone and one that does
   * not (SC-002).
   *
   * A `WeakMap` keyed on the package's own record needs no invalidation: a new
   * build revision or a new reading language produces new records, so the old
   * entries are simply never asked for again.
   */
  row(choice: ModuleChoice): RenderedRow {
    const cached = this.#rows.get(choice);
    if (cached !== undefined) {
      return cached;
    }

    const resolved = this.#resolve(choice);
    this.#rows.set(choice, resolved);
    return resolved;
  }

  /**
   * A row's name and its figures.
   *
   * Everything that tells two rows apart goes into the name, because the
   * package's own names do not: the Anaconda's huge hardpoint offers
   * `Multi-Cannon` at 4A both fixed and gimballed, and again as a Mercenary
   * article and a community-goal one. Name, class, rating, mount and route
   * together are what a Commander is choosing between, and a control announcing
   * only the first two says the same words three times (module-replacement
   * design, "Candidate action names").
   *
   * The figures keep every absence: a field the Almanac never published stays
   * `null` all the way to the component that says so in words, and the purchase
   * grade is never presented as a current ordinary grade. There is no zero
   * anywhere on this path (constitution IV).
   */
  #resolve(choice: ModuleChoice): RenderedRow {
    const presentation = choice.presentation;
    const facts = presentation.facts;
    const labels = this.#factLabels();
    const parts = [
      presentation.name.text ?? choice.module.symbol,
      `${presentation.class}${presentation.rating}`,
      this.#mountLabel(presentation.mount),
      ...presentation.labels.map((label) =>
        this.#messages.message(label.messageKey, label.params ?? undefined),
      ),
    ];

    return {
      actionLabel: this.#messages.message('outfitting.candidate.select', {
        module: parts.filter((part) => part.length > 0).join(' '),
      }),
      purchaseGrade:
        presentation.purchaseGrade === null
          ? null
          : this.#messages.message('outfitting.candidate.purchase-grade', {
              grade: presentation.purchaseGrade,
            }),
      facts: [
        { ...labels[0]!, value: this.#decimal(facts.damage, 1) },
        { ...labels[1]!, value: this.#decimal(facts.mass, 1) },
        { ...labels[2]!, value: this.#decimal(facts.powerDraw, 2) },
        { ...labels[3]!, value: this.#decimal(facts.distributorDraw, 2) },
        { ...labels[4]!, value: facts.cost === null ? null : this.#formatters.integer(facts.cost) },
      ],
    };
  }

  /** The mount, named in the Commander's language rather than as a token. */
  #mountLabel(mount: string | null): string {
    switch (mount) {
      case 'Fixed':
        return this.#messages.message('outfitting.mount.fixed');
      case 'Gimballed':
        return this.#messages.message('outfitting.mount.gimballed');
      case 'Turreted':
        return this.#messages.message('outfitting.mount.turreted');
      default:
        return '';
    }
  }

  #factLabels(): readonly { readonly field: string; readonly label: string }[] {
    return [
      { field: 'damage', label: this.#messages.message('outfitting.column.damage') },
      { field: 'mass', label: this.#messages.message('outfitting.column.mass') },
      { field: 'power', label: this.#messages.message('outfitting.column.power') },
      { field: 'draw', label: this.#messages.message('outfitting.column.draw') },
      { field: 'cost', label: this.#messages.message('outfitting.column.cost') },
    ];
  }

  #decimal(value: number | null, digits: number): string | null {
    return value === null || !Number.isFinite(value)
      ? null
      : this.#formatters.decimal(value, digits);
  }
}
