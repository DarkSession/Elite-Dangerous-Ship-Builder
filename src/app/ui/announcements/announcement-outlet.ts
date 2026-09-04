import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { AnnouncementService } from './announcement.service';

/**
 * The application's two live regions.
 *
 * Exactly one assertive outlet and one polite outlet, owned by the frame. No
 * other region in the application is live: making a metrics panel live would
 * re-announce every unaffected value whenever one of them changed
 * (feedback contract, "Visible feedback and announcements").
 *
 * The outlets are visually hidden but present in the accessibility tree —
 * `display: none` would announce nothing at all — and they are always mounted,
 * because a live region inserted at the same moment as its text is frequently
 * missed by screen readers.
 */
@Component({
  selector: 'ednb-announcement-outlet',
  templateUrl: './announcement-outlet.html',
  styleUrl: './announcement-outlet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementOutlet {
  readonly #announcements = inject(AnnouncementService);
  readonly #messages = inject(MessageService);

  readonly assertive = this.#announcements.assertive;
  readonly polite = this.#announcements.polite;

  readonly assertiveLabel = this.#messages.messageSignal('shell.announcements.urgent.label');
  readonly politeLabel = this.#messages.messageSignal('shell.announcements.polite.label');
}
