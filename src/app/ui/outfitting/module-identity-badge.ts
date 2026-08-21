import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { GameText } from '../components/game-text/game-text';

/**
 * What identifies one module.
 *
 * The canvas writes it as a name over a tracked mono code line —
 * `Huge Multi-Cannon` above `4A GIMBALLED` — and that is what this renders. The
 * class, the rating and the mount are three separate package values, never a
 * string parsed out of a symbol: `4A` looks like it could be read off
 * `Hpt_MultiCannon_Gimbal_Huge`, and on the Python Mk II's thrusters that habit
 * is already wrong (constitution II).
 *
 * `symbol` is shown only when `showSymbol` is set. Most module names are unique
 * enough to choose by; a few are not, and where two rows would otherwise read
 * identically the identity has to be visible rather than hidden behind an
 * ellipsis (module-replacement design, "identity ambiguity").
 */
@Component({
  selector: 'edsb-module-identity-badge',
  imports: [GameText],
  templateUrl: './module-identity-badge.html',
  styleUrl: './module-identity-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleIdentityBadge {
  readonly #messages = inject(MessageService);

  /** The package's name for the article, with its provenance. */
  readonly name = input.required<GameTextPresentation>();

  /** The package identity. Rendered only where two rows would otherwise match. */
  readonly symbol = input<string | null>(null);
  readonly showSymbol = input(false);

  /** The package's own class number. Never parsed from anything. */
  readonly moduleClass = input<number | null>(null);
  readonly rating = input<string | null>(null);
  readonly mount = input<string | null>(null);

  /** The canvas's `4A`: class and rating together, when the package has both. */
  readonly code = computed(() => {
    const moduleClass = this.moduleClass();
    const rating = this.rating();
    return moduleClass === null || rating === null ? null : `${moduleClass}${rating}`;
  });

  /** The mount, named in the Commander's language rather than as a token. */
  readonly mountLabel = computed(() => {
    const mount = this.mount();
    switch (mount) {
      case 'Fixed':
        return this.#messages.message('outfitting.mount.fixed');
      case 'Gimballed':
        return this.#messages.message('outfitting.mount.gimballed');
      case 'Turreted':
        return this.#messages.message('outfitting.mount.turreted');
      default:
        return null;
    }
  });

  /** The class and rating, spelled out for anyone reading the code aloud. */
  readonly codeDescription = computed(() => {
    const moduleClass = this.moduleClass();
    const rating = this.rating();
    return moduleClass === null || rating === null
      ? null
      : this.#messages.message('outfitting.module.code', {
          class: moduleClass,
          rating,
        });
  });
}
