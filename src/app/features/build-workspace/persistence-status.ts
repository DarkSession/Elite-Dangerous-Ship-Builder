import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActiveBuildStore } from '../../application/active-build/active-build.store';
import { AutosaveService } from '../../application/build-library/autosave.service';
import { WORKING_RECORD_LIMIT } from '../../application/build-library/retention.service';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { ActionButton } from '../../ui/components/action/action-button';
import { StatusNotice, type StatusTone } from '../../ui/components/status/status-notice';

/** What a persistence state offers the Commander to do about it. */
interface StatusAction {
  readonly id: 'retry' | 'resume' | 'manage';
  readonly label: string;
}

/**
 * What is wrong with persistence, in words — and nothing when nothing is.
 *
 * None of these states makes the build unusable. That is the whole message: a
 * Commander whose browser will not store anything can still build, calculate,
 * share and export — they simply have to know that closing the tab will cost
 * them the build (FR-014).
 *
 * A failure is an `alert`, because it changes what a Commander should do next.
 * The working states — ready, saving, saved — draw nothing: the reference has
 * no banner for them, and repeating "saved" every few seconds over the top of
 * someone's reading is worse than silence.
 */
@Component({
  selector: 'edsb-persistence-status',
  imports: [ActionButton, StatusNotice],
  templateUrl: './persistence-status.html',
  styleUrl: './persistence-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersistenceStatus {
  readonly #active = inject(ActiveBuildStore);
  readonly #autosave = inject(AutosaveService);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  readonly label = this.#messages.messageSignal('persistence.label');

  readonly status = computed(() => this.#active.persistence());

  readonly message = computed(() => {
    switch (this.status()) {
      case 'saving':
        return this.#messages.message('persistence.saving');
      case 'saved':
        return this.#messages.message('persistence.saved');
      case 'retention-limit':
        return this.#messages.message('persistence.retention-limit', {
          limit: this.#formatters.integer(WORKING_RECORD_LIMIT),
        });
      case 'quota-full':
        return this.#messages.message('persistence.quota-full');
      case 'unavailable':
        return this.#messages.message('persistence.unavailable');
      case 'write-failed':
        return this.#messages.message('persistence.write-failed');
      case 'record-deleted-externally':
        return this.#messages.message('persistence.record-deleted-externally');
      default:
        return this.#messages.message('persistence.ready');
    }
  });

  readonly tone = computed<StatusTone>(() => {
    switch (this.status()) {
      case 'saving':
        return 'loading';
      case 'saved':
        return 'success';
      case 'retention-limit':
      case 'quota-full':
      case 'record-deleted-externally':
        return 'warning';
      case 'unavailable':
      case 'write-failed':
        return 'error';
      default:
        return 'info';
    }
  });

  /** Whether this state is one a Commander has to know about. */
  readonly problem = computed(() => this.tone() === 'warning' || this.tone() === 'error');

  readonly actions = computed<readonly StatusAction[]>(() => {
    switch (this.status()) {
      case 'write-failed':
      case 'unavailable':
        return [{ id: 'retry', label: this.#messages.message('persistence.retry') }];
      case 'quota-full':
      case 'retention-limit':
        return [
          { id: 'manage', label: this.#messages.message('persistence.manage') },
          { id: 'retry', label: this.#messages.message('persistence.retry') },
        ];
      case 'record-deleted-externally':
        return [{ id: 'resume', label: this.#messages.message('persistence.resume') }];
      default:
        return [];
    }
  });

  select(action: StatusAction): void {
    if (action.id === 'resume') {
      this.#autosave.resume();
      return;
    }
    if (action.id === 'retry') {
      this.#autosave.flush();
    }
    // Managing records is a navigation the workspace owns; the status only
    // says that it is the thing to do.
  }
}
