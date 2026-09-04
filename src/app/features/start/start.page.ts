import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HELP_MANIFEST } from '../../platform/build/help-manifest.generated';
import { MessageService } from '../../i18n/message.service';
import { LegalExcerpt } from '../../ui/components/legal-excerpt/legal-excerpt';
import { ToolCard } from '../../ui/components/tool-card/tool-card';
import { AppNavigation } from '../shared/app-navigation';

/**
 * The start page: what NavBeacon is, and the tools it carries.
 *
 * Drawn in `.design/Home.dc.html`, artboards `1a` (1440px) and `1b` (390px).
 * The canvas's own note — "Top bar carried over from the builders; the middle
 * is the tool selector" — is the whole shape of this screen: the shell above it
 * is unchanged and unaware of it, and what this file owns is the masthead, the
 * selector and the band at the foot.
 *
 * The tools come from the one registry the tool bar reads, so a tool the
 * application gains appears in both at once.
 *
 * The attribution is the help manifest's `exactText`, handed to the component
 * that exists to reproduce someone else's words as text and to mark the
 * language they were written in. It is not translated and not restated: a
 * second copy could drift from the licence file the manifest hashes, and
 * rewording a notice is this application editing something it only carries.
 *
 * No state. Nothing is fetched, stored, read from a build or written to one.
 */
@Component({
  selector: 'edsb-start-page',
  imports: [LegalExcerpt, ToolCard],
  templateUrl: './start.page.html',
  styleUrl: './start.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPage {
  readonly #messages = inject(MessageService);
  readonly #navigation = inject(AppNavigation);
  readonly #router = inject(Router);

  readonly heading = this.#messages.messageSignal('home.heading');
  readonly tagline = this.#messages.messageSignal('home.tagline');

  /** Recomputed on a locale commit, because every string in it is resolved. */
  readonly tools = computed(() => {
    this.#messages.locale();
    return this.#navigation.catalogue();
  });

  readonly disclaimer = HELP_MANIFEST.disclaimer;

  /**
   * An ordinary click on a tool becomes a router navigation; anything else is
   * left to the browser, so a middle-click and a modifier-click still open the
   * tool in their own tab or window. The same rule the shell applies to its own
   * tool tabs (`app.ts`, `navigateFromShell`).
   */
  open(href: string, event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    void this.#router.navigateByUrl(href);
  }
}
