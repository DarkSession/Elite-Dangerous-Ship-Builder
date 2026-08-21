import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageService } from '../../i18n/message.service';
import { NAVIGATION_ROUTES } from '../shared/app-navigation';
import { ActionLink } from '../../ui/components/action/action-link';
import { StatusNotice } from '../../ui/components/status/status-notice';

/**
 * What the detail screen says about a hull the Almanac does not carry.
 *
 * Three things it deliberately does not do: guess a hull from a near miss,
 * show any fact, or offer to create a build. A mistyped or stale symbol is a
 * dead end that says so and offers the way back — not a screen that quietly
 * builds something else (FR-005).
 *
 * The symbol is echoed so a Commander can see what was actually asked for,
 * isolated from the surrounding text direction because it is an identifier.
 */
@Component({
  selector: 'edsb-hull-detail-unknown-symbol',
  imports: [ActionLink, RouterLink, StatusNotice],
  templateUrl: './hull-detail-unknown-symbol.html',
  styleUrl: './hull-detail-unknown-symbol.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullDetailUnknownSymbol {
  readonly #messages = inject(MessageService);

  readonly symbol = input.required<string>();

  readonly catalogueRoute = NAVIGATION_ROUTES.catalogue;

  readonly title = this.#messages.messageSignal('hullDetail.unknown.title');
  readonly backLabel = this.#messages.messageSignal('hullDetail.back');

  readonly description = computed(() =>
    this.#messages.message('hullDetail.unknown.description', { symbol: this.symbol() }),
  );
}
