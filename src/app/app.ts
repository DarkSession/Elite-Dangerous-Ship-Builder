import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessageService } from './i18n/message.service';
import { AppFrame } from './ui/components/app-frame/app-frame';

/**
 * The application root.
 *
 * Mounts the shared frame around the router outlet. Feature 011 contributes no
 * domain route: the heading below is the workspace's own, and capability
 * features replace it with their route-owned headings as they land.
 */
@Component({
  selector: 'app-root',
  imports: [AppFrame, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #messages = inject(MessageService);

  readonly heading = this.#messages.messageSignal('app.name');
  readonly tagline = this.#messages.messageSignal('app.tagline');
}
