export type BuildLinkCodecErrorCode =
  | 'invalidEncoding'
  | 'integrityCheckFailed'
  | 'unsupportedEnvelope'
  | 'unsupportedTableVersion'
  | 'invalidPayload'
  | 'unknownIdentity'
  | 'reconstructionFailed';

/** What a failure additionally names, beyond the standard error options. */
export interface BuildLinkCodecErrorOptions extends ErrorOptions {
  /**
   * The game slot key this failure concerns.
   *
   * Structured rather than only present in the message, because the message is
   * an internal English string that is never rendered: a refusal a Commander
   * reads is built from the code and this key (build-link contract, "Error
   * presentation").
   */
  readonly slot?: string | null;
}

export class BuildLinkCodecError extends Error {
  /** The slot the codec could name, or `null` when the failure names none. */
  readonly slot: string | null;

  constructor(
    readonly code: BuildLinkCodecErrorCode,
    message: string,
    options?: BuildLinkCodecErrorOptions,
  ) {
    super(message, options);
    this.name = 'BuildLinkCodecError';
    this.slot = options?.slot ?? null;
  }
}
