import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import {
  projectCostAndMaterials,
  type CostAndMaterials,
} from '../../../../domain/cost-materials/cost-materials';
import { Formatters } from '../../../../i18n/formatters/formatters';
import { GameTextPresenter } from '../../../../i18n/game-text.presenter';
import type { MessageKey } from '../../../../i18n/locale-registry';
import { MessageService } from '../../../../i18n/message.service';
import { relationId } from '../../../../ui/a11y/text-equivalence';
import { GameText } from '../../../../ui/components/game-text/game-text';
import {
  sortMaterialLines,
  type MaterialLineView,
} from '../../../../ui/outfitting/material-cost-list';
import { MaterialGrade } from '../../../../ui/outfitting/material-grade';

/** One row of the `COST` block: a label, a figure, and how the canvas weights it. */
interface CostRow {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  /** `total` is the canvas's amber anchor; `quiet` is its faint rebuy micro-line. */
  readonly weight: 'plain' | 'total' | 'quiet';
}

/**
 * The row labels, as message keys.
 *
 * Written out rather than composed from the row id, because `MessageKey` is the
 * catalogue's own key union — a template-built key would compile without ever
 * proving the message exists.
 */
const COST_LABELS = {
  hull: 'cost-materials.cost.hull',
  modules: 'cost-materials.cost.modules',
  total: 'cost-materials.cost.total',
  rebuy: 'cost-materials.cost.rebuy',
} as const satisfies Record<string, MessageKey>;

/**
 * What the build costs and what it needs, in the outfitting status rail.
 *
 * Canvas 1c draws these two blocks in the 306 px rail beside the ledger and the
 * bench; canvas 1d stacks the same two blocks in its Status mode. Same DOM,
 * same order, at both widths — which composition appears is decided in CSS from
 * the space the region is given, so 400% zoom and a long translation pick the
 * narrow arrangement for the same reason a phone does.
 *
 * Six collisions between the feature specification and these canvases were
 * surfaced and ruled on in wave 10, and the design won all six. So the `TOTAL`
 * row, the `REBUY 5%` label, the three aggregate counts and the Merc Coin row
 * inside the materials block are all here — and the material traces, unpriced
 * evidence and lower-bound wording the specification once asked for are not.
 * Nothing in these blocks is interactive, because the canvas draws no control
 * in either of them (`design/reference-review.md`, rulings A–F).
 */
@Component({
  selector: 'edsb-cost-materials',
  imports: [GameText, MaterialGrade],
  templateUrl: './cost-materials.html',
  styleUrl: './cost-materials.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostMaterials {
  readonly #active = inject(ActiveBuildStore);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);
  readonly #gameText = inject(GameTextPresenter);

  readonly costHeadingId = relationId('cost');
  readonly materialsHeadingId = relationId('materials');

  readonly costHeading = this.#messages.messageSignal('cost-materials.cost.heading');
  readonly materialsHeading = this.#messages.messageSignal('cost-materials.materials.heading');
  readonly mercCoinLabel = this.#messages.messageSignal(
    'outfitting.engineering.materials.merc-coin',
  );

  /**
   * The projection for the active build, recomputed once per revision.
   *
   * `revision()` is read first because the loadout signal holds one mutable
   * package object: an edit changes what it contains without changing the
   * reference, so the revision is what actually says "this is different now".
   */
  readonly #projection = computed<CostAndMaterials | null>(() => {
    this.#active.revision();
    const loadout = this.#active.loadout();
    return loadout === null ? null : projectCostAndMaterials(loadout);
  });

  /** Nothing is drawn without a build. The workspace already says why it is empty. */
  readonly shown = computed(() => this.#projection() !== null);

  /**
   * Whether the materials block is drawn at all.
   *
   * Rows *or* a Merc Coin figure, because the canvas puts Merc Coin inside this
   * block (ruling C) and a build can have a recognised purchase with nothing
   * crafted — a Mercenary article at its purchase grade is bought, not crafted,
   * so it has a price and no shopping list. Neither canvas draws that
   * combination; hiding the block would hide the price, which FR-006 requires
   * to be shown whenever an article is recognised, so the block appears
   * carrying only the row it has.
   */
  readonly materialsShown = computed(
    () => this.materialRows().length > 0 || this.mercCoin() !== null,
  );

  /** The canvas's four rows, in its order: Hull, Modules, TOTAL, REBUY 5%. */
  readonly costRows = computed<readonly CostRow[]>(() => {
    const credits = this.#projection()?.credits;
    if (credits === undefined) {
      return [];
    }

    return [
      this.#row('hull', credits.hull, 'plain'),
      this.#row('modules', credits.modules, 'plain'),
      this.#row('total', credits.total, 'total'),
      this.#row('rebuy', credits.rebuy, 'quiet'),
    ];
  });

  /**
   * The currency, for a reader who cannot see which block this is.
   *
   * Both canvases draw these four figures bare — the `cr` suffix appears on the
   * fit table and the manifest, not here — so the unit is not drawn either. It
   * is announced instead, which is the one thing that may exist without being
   * drawn: invisible, and costing the design nothing.
   */
  readonly creditsUnit = this.#messages.messageSignal('cost-materials.cost.unit');

  /** `14 BLUEPRINTS`, opposite the materials heading. `null` when the block is absent. */
  readonly blueprintCount = computed(() => {
    const materials = this.#projection()?.materials ?? null;
    return materials === null
      ? null
      : this.#messages.message('cost-materials.materials.blueprints', {
          count: this.#formatters.integer(materials.blueprints),
        });
  });

  /**
   * The consolidated rows, ordered commonest first and then by name.
   *
   * A shopping list in the order a Commander gathers one — literally the same
   * comparator the Engineer panel's list uses, so the two cannot drift apart.
   * Both canvases actually draw this list in *descending* rarity; that was
   * ruled against in wave 10 so the two material lists in the application agree
   * with each other rather than each matching its own artboard
   * (`design/reference-review.md`, ruling G).
   *
   * The package returns its own catalogue order, which is neither, so the
   * ordering is applied here rather than in the projection: it is a reading
   * decision, and its tie-break needs the localised name that only this layer
   * has.
   */
  readonly materialRows = computed<readonly MaterialLineView[]>(() =>
    sortMaterialLines(
      (this.#projection()?.materials?.rows ?? []).map((row) => ({
        symbol: row.symbol,
        name: this.#gameText.materialName(row.symbol),
        grade: row.grade,
        count: this.#formatters.integer(row.count),
      })),
      this.#formatters.collator(),
    ),
  );

  /**
   * The footer's two counts, which the canvas sets at opposite ends of the row.
   *
   * Two strings rather than one, because they are two facts and the canvas
   * separates them by the width of the block rather than by punctuation. `null`
   * when the block draws no rows.
   */
  readonly materialTotals = computed(() => {
    const materials = this.#projection()?.materials ?? null;
    if (materials === null) {
      return null;
    }
    return {
      types: this.#messages.message('cost-materials.materials.types', {
        count: this.#formatters.integer(materials.types),
      }),
      units: this.#messages.message('cost-materials.materials.units', {
        count: this.#formatters.integer(materials.units),
      }),
    };
  });

  /**
   * The Merc Coin figure, or `null` when nothing here was bought with it.
   *
   * Formatted as a plain number rather than through the credits pattern: they
   * are different currencies and nothing may sum, convert or compare them
   * (FR-005).
   */
  readonly mercCoin = computed(() => {
    const value = this.#projection()?.mercCoin ?? null;
    return value === null ? null : this.#formatters.integer(value);
  });

  #row(id: keyof typeof COST_LABELS, value: number, weight: CostRow['weight']): CostRow {
    return {
      id,
      label: this.#messages.message(COST_LABELS[id]),
      // The canvas's own figure: a locale-formatted integer with no unit
      // beside it. `Formatters.credits` would append the `CR` pattern, which
      // neither block draws.
      value: this.#formatters.integer(value),
      weight,
    };
  }
}
