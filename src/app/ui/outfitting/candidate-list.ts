import type { OutfittingFamilyId } from '@elite-dangerous-almanac/core/ships/module-families';
import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  isFittedChoice,
  type ModuleChoice,
} from '../../application/outfitting/candidate-membership';
import type { CandidateFamilyView } from '../../application/outfitting/candidate-query';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';
import { AcquisitionBadge } from './acquisition-badge';
import { observeManifest, type CandidateManifest } from './manifest';
import { GameText } from '../components/game-text/game-text';
import { UnavailableFact } from './unavailable-fact';

/** One package figure, formatted, or `null` where the Almanac has none. */
interface RenderedFact {
  readonly field: string;
  readonly label: string;
  readonly value: string | null;
  /** The unit written after the figure, where the canvas writes one. */
  readonly unit?: string;
}

/** Everything one row draws that does not change while its records live. */
interface RenderedRow {
  readonly actionLabel: string;
  readonly mount: string | null;
  readonly code: string | null;
  readonly codeDescription: string | null;
  readonly purchaseGrade: string | null;
  readonly facts: readonly RenderedFact[];
  /** The credit price, kept out of the loop because the coin price sits under it. */
  readonly cost: RenderedFact;
  /** The article's Merc Coin price, formatted, where the Almanac states one. */
  readonly mercCoin: string | null;
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
 * The Almanac's families are the only level of structure, and both canvases
 * draw them: a control carrying the family's name, its count and its caret,
 * with its rows beneath it when it is open. A closed family draws its control
 * and nothing else, which is what lets a 478-choice mount put a screenful in
 * front of a Commander instead of 478 cards (FR-020, decision 15).
 */
@Component({
  selector: 'edsb-candidate-list',
  imports: [AcquisitionBadge, GameText, NgTemplateOutlet, UnavailableFact],
  templateUrl: './candidate-list.html',
  styleUrl: './candidate-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The stylesheet keys off the measurement rather than taking one of its own.
  // Two thresholds — a container query and this — would disagree for a frame on
  // every resize, and a rail drawn under the accordion's reveal rule can be
  // handed no family to select (`manifest.ts`).
  host: { '[attr.data-manifest]': 'manifest()' },
})
export class CandidateList {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Brings the module already in the mount to the middle of the scroller.
   *
   * Opening a mount opens the family holding what is fitted, and that family
   * can sit anywhere in the Almanac's order — three quarters of the way down a
   * list of seventy-seven. The row the Commander came to see was on screen only
   * in the sense that it was in the document. Centring it puts what is fitted in
   * front of them with its siblings above and below, which is the comparison the
   * list exists for.
   *
   * After render, because it reads a laid-out box. It tracks the fitted choice
   * itself, so it runs when the chooser arrives and when a fit changes what is
   * in the mount, and not on a query — a search must not pull the scroller back
   * to a row the Commander has typed past. A closed family draws no such row and
   * nothing is scrolled.
   */
  readonly #centreFitted = afterRenderEffect(() => {
    // Only while there is nothing typed. `fittedChoice()` goes null and back as
    // a search filters the fitted row out and in again, and scrolling on that
    // would drag the list back to a row the Commander has typed past.
    if (this.searching() || this.fittedChoice() === null) {
      return;
    }

    // Whichever box this manifest scrolls its rows in: the accordion's single
    // scroller, or the rail composition's variant pane.
    const list = this.#host.nativeElement.querySelector<HTMLElement>(
      '.candidates__body, .candidates__pane',
    );
    const row = list?.querySelector<HTMLElement>('.candidate--fitted');
    if (list === null || list === undefined || row === undefined || row === null) {
      return;
    }

    // The list's own box is scrolled rather than `scrollIntoView`, which walks
    // every scrollable ancestor up to the document. At a short viewport the
    // region deliberately stops bounding itself and the page is what scrolls
    // (module-replacement, the short-viewport release) — so delegating would
    // take the search field and the `FITTED HERE` block off screen to centre a
    // row, which is the opposite of what this is for.
    list.scrollTop = row.offsetTop - list.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
  });

  /** Resolved row text and figures, kept for as long as their records live. */
  readonly #rows = new WeakMap<ModuleChoice, RenderedRow>();

  readonly families = input.required<readonly CandidateFamilyView[]>();

  /**
   * Whether a query is narrowing the list right now.
   *
   * Read for one thing only: while a Commander is typing, the list stops
   * bringing the fitted row into view.
   */
  readonly searching = input(false);

  /**
   * Canvas 1d's `FITTED HERE` heading, where that composition draws it.
   *
   * `null` at the wide composition, which draws no such block: the panel is
   * open beside the ledger and the fitted row is a scroll away. At 390 px the
   * family holding it may be far below the fold, so the same row is drawn twice
   * on purpose (module-replacement design, "Narrow and 400%-zoom composition").
   */
  readonly fittedHeading = input<string | null>(null);

  /** Canvas 1d's `FAMILIES` heading, drawn in the same composition. */
  readonly familiesHeading = input<string | null>(null);

  /** Canvas 1d's `5 · 24 FIT` counter, beside that heading. */
  readonly familiesSummary = input<string | null>(null);

  /** What the whole list is. Bound as the group's legend. */
  readonly label = input.required<string>();

  /** The row a Commander has picked. Draft state; it changes no build. */
  readonly selectedKey = input<string | null>(null);

  /** The symbol currently fitted in this mount, so its rows can say so. */
  readonly fittedSymbol = input<string | null>(null);

  /**
   * The article the mount carries, where the Almanac identifies it as one of
   * its pre-engineered rewards. `null` for an ordinary stock module.
   *
   * A reward shares its symbol with the stock article it is built from, and the
   * Almanac sells more than one reward under one name — the same blaster
   * through the Merc-Coin shop at grade 1 and through a community goal at grade
   * 5. So the identity is the whole record, not the symbol and not the name:
   * matching on either marked two different articles as the one in the mount
   * (wave 4).
   */
  readonly fittedVariant = input<PreEngineeredVariant | null>(null);

  /**
   * Which manifest this width draws, measured from the chooser's own box.
   *
   * Read here rather than passed in, because the threshold is this element's
   * container and no ancestor's: at 1200px the workspace is already in its
   * three-column composition while the bench it left in the middle is nowhere
   * near wide enough for a rail beside a pane.
   */
  readonly manifest = observeManifest();

  readonly chosen = output<string>();

  /**
   * The reveal model this manifest is under, for whoever holds the revealed set.
   *
   * The rail and the accordion do not reveal families the same way, and the
   * difference is a rule rather than an arrangement, so the state that holds
   * what is revealed has to know which of the two is drawing it
   * (`candidate-query.ts`, `FamilyReveal`).
   */
  readonly manifestChanged = output<CandidateManifest>();

  readonly #reportManifest = effect(() => this.manifestChanged.emit(this.manifest()));

  /** One family opened or closed. View state; it changes no build. */
  readonly familyToggled = output<OutfittingFamilyId>();

  /** The prefix every family control and region id is built from. */
  readonly #idBase = relationId('candidate-family');

  /** The one pane the rail's rows all point at. */
  readonly paneId = relationId('candidate-pane');

  /**
   * The family the rail has selected, and whose rows the pane draws.
   *
   * Exactly one, by construction: under the rail the revealed set is always a
   * single id and `seedFamilies` falls back to the first family in package
   * order, so the pane is never empty. The `?? families()[0]` is not a second
   * rule — it is what the pane draws for the one frame between a resize and the
   * re-seed that follows it, rather than painting nothing.
   *
   * The rail marks its selected row from this rather than from each family's
   * own `open`, so the row that is marked and the rows that are drawn can never
   * be two different families — including in that one frame.
   */
  readonly revealedFamily = computed<CandidateFamilyView | null>(() => {
    const families = this.families();
    return families.find((family) => family.open) ?? families[0] ?? null;
  });

  readonly familiesLabel = this.#messages.messageSignal('outfitting.family.heading');
  readonly moduleColumn = this.#messages.messageSignal('outfitting.column.module');
  readonly classColumn = this.#messages.messageSignal('outfitting.column.class');
  /**
   * The third and last column of the revised wide manifest.
   *
   * Named on its own rather than taken from `factColumns()`, because that list
   * is the compact card's five labelled figures and this head has three cells.
   * Reading the last of five to draw the third of three is the kind of coupling
   * that survives exactly until one of the two changes.
   */
  readonly costColumn = this.#messages.messageSignal('outfitting.column.cost');
  readonly fittedLabel = this.#messages.messageSignal('outfitting.candidate.fitted');
  readonly mercCoinLabel = this.#messages.messageSignal(
    'outfitting.engineering.materials.merc-coin',
  );
  readonly variantLabel = this.#messages.messageSignal('outfitting.candidate.pre-engineered');

  /**
   * The row already in the mount, taken from the results themselves.
   *
   * Derived rather than passed in a second time, so the pinned block and the
   * row the family list marks `FITTED` cannot disagree. A search that filters
   * the fitted article out draws no block: the alternative is a `FITTED HERE`
   * row standing over a list that does not contain it.
   */
  readonly fittedChoice = computed<ModuleChoice | null>(() => {
    for (const family of this.families()) {
      const found = family.choices.find((choice) => this.isFitted(choice));
      if (found !== undefined) {
        return found;
      }
    }
    return null;
  });

  /** The figure columns, named once for the wide manifest's header row. */
  readonly factColumns = computed(() => this.#factLabels());

  /** The family control's id, so its own region can be named by it. */
  familyControlId(familyId: OutfittingFamilyId): string {
    return `${this.#idBase}-control-${familyId}`;
  }

  /** The region a family control opens, named by that control. */
  familyRegionId(familyId: OutfittingFamilyId): string {
    return `${this.#idBase}-region-${familyId}`;
  }

  /**
   * How many choices a family holds, in words.
   *
   * The canvas draws a bare number in its chip. The number stays exactly as
   * drawn and this is spoken beside it, so the control's accessible name is its
   * family name and its count rather than a name and a stray digit (FR-022).
   */
  familyCountLabel(count: number): string {
    return this.#messages.message('outfitting.family.count', { count });
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
    const symbol = this.fittedSymbol();
    return symbol !== null && isFittedChoice(choice, { symbol, variant: this.fittedVariant() });
  }

  /**
   * The row's state in words, where it has one worth drawing.
   *
   * `FITTED` and the pre-engineered marker are both on the canvas — one as the
   * amber ground behind the row a mount already carries, the other as the row's
   * reward badge — and both are stated in words because colour and a glyph are
   * never the sole cue. An ordinary stock module is the absence of either, and
   * the canvas writes nothing on those rows; a `STOCK` line under every one of
   * two hundred names was a third line the manifest never had.
   */
  stateLabel(choice: ModuleChoice): string | null {
    if (this.isFitted(choice)) {
      return this.fittedLabel();
    }
    return choice.kind === 'stock' ? null : this.variantLabel();
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
      mount: this.#mountLabel(presentation.mount) || null,
      code: `${presentation.class}${presentation.rating}`,
      codeDescription: this.#messages.message('outfitting.module.code', {
        class: presentation.class,
        rating: presentation.rating,
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
      ],
      cost: {
        ...labels[4]!,
        value: facts.cost === null ? null : this.#formatters.integer(facts.cost),
        // The canvas heads the column `COST` and writes `cr` after every figure
        // in it, in its own quieter ink and its own narrow column — which is
        // what lines the credit figures up with the coin figures under them.
        unit: this.#messages.message('outfitting.unit.credits'),
      },
      // Canvas 1c writes a Mercenary article's coin price under its credit
      // price, in the same cell and in the Merc ink. The two are never added:
      // Merc Coin has no credit equivalent, so a single figure would be an
      // exchange rate the game does not have (constitution IV).
      mercCoin:
        choice.kind === 'variant' && typeof choice.variant.mercCoinCost === 'number'
          ? this.#formatters.integer(choice.variant.mercCoinCost)
          : null,
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
