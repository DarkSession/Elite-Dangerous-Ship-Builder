import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MessageService } from '../../../i18n/message.service';
import { MetricGroup, type Metric } from '../metric-group/metric-group';

/** One published fact: a label, a value that may be absent, and its unit. */
export interface Fact {
  readonly id: string;
  readonly label: string;
  /** `null` when there is no value. Never rendered as a zero or a dash. */
  readonly value: string | null;
  /** The unit, or the explicit rating marker where a figure has none. */
  readonly unit: string;
  /** What the value was measured under, when that changes what it means. */
  readonly condition?: string | null;
}

/**
 * A group of published facts.
 *
 * A thin composition over `MetricGroup`, which already owns the description-list
 * semantics and the unit/condition relationships. What this adds is the one
 * rule that matters here: an absent value is stated in words, using the shared
 * unavailable wording, rather than being formatted as a number that happens to
 * be zero (constitution IV).
 *
 * The heading and the framing — "these are bare-hull figures, not results for
 * your build" — belong to the screen that places the list, not to the list.
 */
@Component({
  selector: 'ednb-fact-list',
  imports: [MetricGroup],
  templateUrl: './fact-list.html',
  styleUrl: './fact-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FactList {
  readonly #messages = inject(MessageService);

  /** What the group of facts describes. Becomes the list's accessible name. */
  readonly label = input.required<string>();
  readonly facts = input.required<readonly Fact[]>();
  readonly emptyLabel = input<string | null>(null);

  readonly metrics = computed<readonly Metric[]>(() =>
    this.facts().map((fact) => ({
      id: fact.id,
      label: fact.label,
      value: fact.value,
      ...(fact.unit.length > 0 ? { unit: fact.unit } : {}),
      ...(fact.condition != null ? { condition: fact.condition } : {}),
      unavailableLabel: this.#messages.message('unavailable.value'),
    })),
  );
}
