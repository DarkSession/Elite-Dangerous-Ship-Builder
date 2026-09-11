import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import type { PartialEngineeringFailure } from '../../domain/ships/build/build-ingress-result';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { AnnouncementService } from '../announcements/announcement.service';
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
 * previous build needs to know now, not when they next read the page — so it is
 * announced as well as drawn, and announced from here rather than from the
 * notice it is drawn in. `failures` is the refusal itself and ingress hands
 * over a new set per refused candidate, so the effect runs once per event; an
 * effect over the drawn lines would run again for every committed locale
 * (011/FR-009).
 *
 * A refusal already standing when the screen opens is the one case a first-run
 * guard cannot judge, so this component does not try. The refusal is reported
 * from the saved builds, which stand over whatever screen a Commander is on
 * rather than over this one in particular — so a Commander who opens a refused
 * record from elsewhere and then comes to the workspace builds this notice with
 * the refusal already there, and it has no transition to watch. That looks
 * exactly like a Commander returning to a refusal they were told about on their
 * last visit. One is an event, the other is initial content. `unannounced` is
 * the store's answer, because the store is what saw the report happen.
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
  readonly #announcements = inject(AnnouncementService);

  readonly failures = input.required<readonly PartialEngineeringFailure[]>();

  /** Whether a reader still has to be told about the standing refusal. */
  readonly unannounced = input(false);

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

  /**
   * Said once the refusal has been spoken, so it is not spoken again.
   *
   * The notice counts the lines, and the store remembers. Neither can do the
   * other's half: the count is a rule about what is drawn, and the memory has
   * to outlive a component that is rebuilt on every visit to the workspace.
   */
  readonly announced = output<void>();

  constructor() {
    effect(() => {
      const failures = this.failures();
      const unannounced = this.unannounced();
      if (failures.length === 0 || !unannounced) {
        return;
      }
      // Everything the sentence says is read in here, so the only thing this
      // effect depends on is the refusal and whether it has been spoken. One
      // announcement for the whole batch: a reader is told how many modules
      // there are, and the lines themselves stay on the page to be read one at
      // a time.
      untracked(() => {
        this.#announcements.announce({
          kind: 'outfitting.ingress-refused',
          urgency: 'assertive',
          messageKey: 'outfitting.notice.announced',
          params: {
            title: this.title(),
            count: this.#formatters.integer(this.lines().length),
          },
        });
        this.announced.emit();
      });
    });
  }
}
