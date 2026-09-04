import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { relationId } from '../../ui/a11y/text-equivalence';
import { InlineLink } from '../../ui/components/inline-link/inline-link';
import { Layer } from '../../ui/components/layer/layer';
import { LegalExcerpt } from '../../ui/components/legal-excerpt/legal-excerpt';
import { VersionFacts } from '../../ui/components/version-facts/version-facts';
import type { HelpDialogViewModel } from '../../application/help/help.presenter';

/**
 * The one Help · About modal, as the reference draws it.
 *
 * A header carrying the title and the way out, over a single scrolling column
 * of three hairline-separated sections in the reference's own order — `ABOUT`,
 * `FAQ`, `LICENCE`. Every canvas of the reference draws the same three, and
 * draws them nowhere else, so there is one of these in the application and the
 * frame owns it.
 *
 * It is presentation only: it takes a finished view model and emits the one
 * intent it has. Which build the manifest describes, which language the text
 * is in and whether the modal is open are all decided above it — a component
 * that reached for any of those would be a second place they could be decided
 * from (constitution III).
 *
 * Wide and narrow are not two components. The shared layer resolves its
 * adaptive presentation in CSS, so the same DOM is a centred bounded dialog
 * where there is room and a full-width sheet where there is not, and a reader
 * meets one reading order either way.
 */
@Component({
  selector: 'ednb-help-dialog',
  imports: [InlineLink, Layer, LegalExcerpt, VersionFacts],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDialog {
  readonly open = input(false);
  readonly view = input.required<HelpDialogViewModel>();
  readonly dismissLabel = input.required<string>();

  readonly dismissed = output<void>();

  readonly sections = computed(() => this.view().sections);
  readonly about = computed(() => this.view().about);
  readonly topics = computed(() => this.view().topics);
  readonly licence = computed(() => this.view().licence);

  // Named per instance rather than by a literal. The preview catalogue renders
  // the shell beside other states, and two elements sharing an id turn one of
  // the headings into a section label for the wrong section.
  readonly aboutId = relationId('help-about');
  readonly faqId = relationId('help-faq');
  readonly licenceId = relationId('help-licence');
}
