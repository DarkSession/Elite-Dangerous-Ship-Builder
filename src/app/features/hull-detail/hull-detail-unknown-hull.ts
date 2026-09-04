import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from '../../i18n/message.service';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { ActionLink } from '../../ui/components/action/action-link';
import { EmptyState } from '../../ui/components/empty-state/empty-state';
import { StatusNotice } from '../../ui/components/status/status-notice';

/**
 * What the detail screen says about an address no hull answers to.
 *
 * Three things it deliberately does not do: guess a hull from a near miss,
 * show any fact, or offer to create a build. A mistyped or stale address is a
 * dead end that says so and offers the way back — not a screen that quietly
 * builds something else (FR-005).
 *
 * The address is echoed so a Commander can see what was actually asked for,
 * isolated from the surrounding text direction because it is not prose.
 *
 * It is the shared empty state, drawn leading rather than centred: at the wide
 * composition this screen is a rail beside the manifest, and a centred column
 * in a rail stands away from the hull list it belongs to.
 */
@Component({
  selector: 'ednb-hull-detail-unknown-hull',
  imports: [ActionLink, EmptyState, RouterLink, StatusNotice],
  templateUrl: './hull-detail-unknown-hull.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullDetailUnknownHull {
  readonly #messages = inject(MessageService);

  readonly hull = input.required<string>();

  readonly catalogueRoute = NAVIGATION_ROUTES.catalogue;

  readonly title = this.#messages.messageSignal('hullDetail.unknown.title');
  readonly backLabel = this.#messages.messageSignal('hullDetail.back');

  readonly description = computed(() =>
    this.#messages.message('hullDetail.unknown.description', { hull: this.hull() }),
  );
}
