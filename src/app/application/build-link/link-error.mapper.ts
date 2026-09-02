import { Injectable, inject } from '@angular/core';
import { BuildLinkCodecError } from '../../domain/build-link/build-link-codec-error';
import { MessageService } from '../../i18n/message.service';
import type { MessageKey } from '../../i18n/locale-registry';
import type { LinkFailureCode } from '../active-build/active-build.models';

export type { LinkFailureCode };

/** One failure, in the terms the presentation layer works with. */
export interface LinkFailure {
  readonly code: LinkFailureCode;
  /** The game slot key the codec named, when it named one. */
  readonly slot: string | null;
}

/** A failure, said in the Commander's language. */
export interface LinkFailureText {
  readonly message: string;
  /** Which mount is involved, when the codec could say. */
  readonly detail: string | null;
}

/**
 * Every reason a link failed, in one place, keyed by a stable code.
 *
 * A `BuildLinkCodecError` message is an internal English string written for
 * whoever is reading a stack trace. None of them is ever rendered: they name
 * table versions, bit widths and canonical forms, they are not translated, and
 * they would tell a Commander nothing they could act on (build-link contract,
 * "Error presentation").
 */
const MESSAGE_KEYS: Readonly<Record<LinkFailureCode, MessageKey>> = {
  invalidEncoding: 'link.error.invalidEncoding',
  integrityCheckFailed: 'link.error.integrityCheckFailed',
  unsupportedEnvelope: 'link.error.unsupportedEnvelope',
  unsupportedTableVersion: 'link.error.unsupportedTableVersion',
  invalidPayload: 'link.error.invalidPayload',
  unknownIdentity: 'link.error.unknownIdentity',
  reconstructionFailed: 'link.error.reconstructionFailed',
  tooLong: 'link.error.tooLong',
};

@Injectable({ providedIn: 'root' })
export class LinkErrorMapper {
  readonly #messages = inject(MessageService);

  /**
   * Classifies whatever was thrown.
   *
   * Anything that is not a codec error is a reconstruction failure: the link
   * was read but the build behind it could not be produced, which is precisely
   * what an unexpected exception on this path means.
   */
  classify(error: unknown): LinkFailure {
    if (error instanceof BuildLinkCodecError) {
      return { code: error.code, slot: error.slot };
    }
    return { code: 'reconstructionFailed', slot: null };
  }

  /** The failure, in words, with the mount named where there is one. */
  describe(failure: LinkFailure): LinkFailureText {
    return {
      message: this.#messages.message(MESSAGE_KEYS[failure.code]),
      detail:
        failure.slot === null
          ? null
          : this.#messages.message('link.refused.slot', { slot: failure.slot }),
    };
  }
}
