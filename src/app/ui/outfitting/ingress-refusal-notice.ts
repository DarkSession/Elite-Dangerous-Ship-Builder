import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { PartialEngineeringFailure } from '../../domain/ships/build/build-ingress-result';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { OutfittingNotice, type NoticeLine } from './outfitting-notice';
import { slotName } from './slot-naming';

/**
 * A build that was refused before it was ever activated.
 *
 * Ingress has no partial outcome: a candidate whose engineering the Almanac
 * cannot complete losslessly is discarded whole, and the build a Commander is
 * looking at is untouched — its revision, its autosave, its link and its
 * history all exactly as they were (FR-013, SC-005). This is the surface that
 * says so.
 *
 * It names every affected module exactly: the mount, the module, the recipe
 * identity the source stated and the roll it arrived at. "Something was
 * unsupported" is not a thing a Commander can act on; "the drive in
 * FrameShiftDrive came in at 42% of a recipe the Almanac cannot complete" is.
 *
 * The reason itself is the package's own stable code, carried as the identifier
 * it is. The Almanac publishes no sentence for these codes, and writing one
 * here would be an application-owned translation of package vocabulary that the
 * next release could quietly contradict — so the code is named rather than
 * paraphrased, the way an entitlement token already is.
 *
 * It is an alert. A Commander who opened a link and is still looking at their
 * previous build needs to know now, not when they next read the page.
 */
@Component({
  selector: 'ednb-ingress-refusal-notice',
  imports: [OutfittingNotice],
  templateUrl: './ingress-refusal-notice.html',
  styleUrl: './ingress-refusal-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngressRefusalNotice {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly failures = input.required<readonly PartialEngineeringFailure[]>();
  readonly revision = input.required<number>();

  /** The mount labels, already localized, keyed by the package's slot key. */
  readonly slotLabels = input<Readonly<Record<string, string>>>({});

  readonly title = computed(() => this.#messages.message('outfitting.ingress.refusal.title'));

  readonly lines = computed<readonly NoticeLine[]>(() => {
    const failures = this.failures();
    if (failures.length === 0) {
      return [];
    }

    const lines: NoticeLine[] = [
      {
        id: 'framing',
        messageKey: 'outfitting.ingress.refusal.description',
        params: { count: failures.length },
      },
    ];

    for (const failure of failures) {
      const source = failure.source;
      lines.push({
        id: source.slotKey,
        messageKey: 'outfitting.ingress.refusal.module',
        params: {
          slot: slotName(this.slotLabels(), source.slotKey),
          module: source.moduleSymbol,
          quality: this.#formatters.percent(source.quality),
          // The package's own identifier for what it refused. Named, not
          // translated: the Almanac publishes no sentence for these.
          code: failure.code ?? failure.reason,
        },
        // The recipe the source stated, in the package's own spelling. Absent
        // where the source named none, which is itself worth not inventing.
        detail: source.blueprintFdname,
      });
    }

    return lines;
  });
}
