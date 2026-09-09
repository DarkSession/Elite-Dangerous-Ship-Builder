import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import { AnnouncementService, type SpokenEvent } from './announcement.service';

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
 *
 * What each one holds is rendered by the event that put it there rather than by
 * its words, so a second event spoken in the same words as the first still
 * replaces the node in the region. Two failed navigations say the same
 * sentence, and text written over itself is not a change to announce: without
 * this the second of them would be silence
 * (`openspec/specs/platform/accessible-responsive-operation/`).
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

  readonly assertive = computed(() => held(this.#announcements.assertiveEvent()));
  readonly polite = computed(() => held(this.#announcements.politeEvent()));

  readonly assertiveLabel = this.#messages.messageSignal('shell.announcements.urgent.label');
  readonly politeLabel = this.#messages.messageSignal('shell.announcements.polite.label');
}

/** What an outlet holds, as the nothing-or-one list the template renders. */
function held(spoken: SpokenEvent | null): readonly SpokenEvent[] {
  return spoken === null ? [] : [spoken];
}
