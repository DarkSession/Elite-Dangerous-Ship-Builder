import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { PersistenceStatus as Status } from '../../application/build-library/working-record.port';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';
import { ActionButton } from '../../ui/components/action/action-button';
import { StatusNotice, type StatusTone } from '../../ui/components/status/status-notice';

/** Which tool's work the state is about, because the words name it. */
export type PersistenceSubject = 'build' | 'loadout';

/** What a persistence state offers the Commander to do about it. */
export type StatusActionId = 'retry' | 'resume' | 'manage';

interface StatusAction {
  readonly id: StatusActionId;
  readonly label: string;
}

/**
 * What is wrong with persistence, in words — and nothing when nothing is.
 *
 * None of these states makes the work unusable. That is the whole message: a
 * Commander whose browser will not store anything can still build, calculate,
 * share and export — they simply have to know that closing the tab will cost
 * them what is open (001/FR-014, 017/FR-008).
 *
 * A failure is an `alert`, because it changes what a Commander should do next.
 * The working states — ready, saving, saved — draw nothing: the reference has
 * no banner for them, and repeating "saved" every few seconds over the top of
 * someone's reading is worse than silence.
 *
 * Both tools draw this one component. What it is told is the state, whether
 * saving is paused and which tool's work it is about; what it says back is
 * which action was pressed. Nothing here reaches a store or an autosave,
 * because the two screens hold different ones and a component that injected
 * either would be the ship tool's alone.
 */
@Component({
  selector: 'ednb-persistence-status',
  imports: [ActionButton, StatusNotice],
  templateUrl: './persistence-status.html',
  styleUrl: './persistence-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersistenceStatus {
  readonly #messages = inject(MessageService);

  /** What persistence is doing for the work on this screen. */
  readonly status = input.required<Status>();

  /**
   * Whether saving is stopped until the Commander says otherwise.
   *
   * What decides whether resuming is offered. The state says what happened; the
   * flag says saving is actually stopped, and resuming something that is not
   * stopped would be a control that does nothing.
   */
  readonly paused = input(false);

  /** Which tool's work this is about, because the words name it. */
  readonly subject = input<PersistenceSubject>('build');

  /** Which action was pressed. What it means belongs to the screen. */
  readonly actionSelected = output<StatusActionId>();

  readonly label = this.#messages.messageSignal('persistence.label');

  readonly message = computed(() => {
    switch (this.status()) {
      case 'saving':
        return this.#messages.message('persistence.saving');
      case 'saved':
        return this.#messages.message('persistence.saved');
      case 'quota-full':
        return this.#messages.message(this.#key('quota-full'));
      case 'unavailable':
        return this.#messages.message(this.#key('unavailable'));
      case 'write-failed':
        return this.#messages.message(this.#key('write-failed'));
      case 'record-deleted-externally':
        return this.#messages.message(this.#key('record-deleted-externally'));
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
        return [
          { id: 'manage', label: this.#messages.message(this.#key('manage')) },
          { id: 'retry', label: this.#messages.message('persistence.retry') },
        ];
      case 'record-deleted-externally':
        return this.paused()
          ? [{ id: 'resume', label: this.#messages.message(this.#key('resume')) }]
          : [];
      default:
        return [];
    }
  });

  select(action: StatusAction): void {
    this.actionSelected.emit(action.id);
  }

  /** The same message, in the words of the tool it is about. */
  #key(name: SubjectMessage): MessageKey {
    return SUBJECT_MESSAGES[this.subject()][name];
  }
}

/** The messages that name the work rather than merely describing storage. */
type SubjectMessage =
  'quota-full' | 'unavailable' | 'write-failed' | 'record-deleted-externally' | 'resume' | 'manage';

/**
 * One message per state per tool, written out rather than assembled.
 *
 * A key built from a fragment would be invisible to the catalogue checks, which
 * read the keys the application asks for and fail on one that is missing from
 * either language.
 */
const SUBJECT_MESSAGES: Readonly<
  Record<PersistenceSubject, Readonly<Record<SubjectMessage, MessageKey>>>
> = {
  build: {
    'quota-full': 'persistence.quota-full',
    unavailable: 'persistence.unavailable',
    'write-failed': 'persistence.write-failed',
    'record-deleted-externally': 'persistence.record-deleted-externally',
    resume: 'persistence.resume',
    manage: 'persistence.manage',
  },
  loadout: {
    'quota-full': 'persistence.loadout.quota-full',
    unavailable: 'persistence.loadout.unavailable',
    'write-failed': 'persistence.loadout.write-failed',
    'record-deleted-externally': 'persistence.loadout.record-deleted-externally',
    resume: 'persistence.loadout.resume',
    manage: 'persistence.loadout.manage',
  },
};
