export type BuildLinkCodecErrorCode =
  | 'invalidEncoding'
  | 'integrityCheckFailed'
  | 'unsupportedEnvelope'
  | 'unsupportedTableVersion'
  | 'invalidPayload'
  | 'unknownIdentity'
  | 'reconstructionFailed';

export class BuildLinkCodecError extends Error {
  constructor(
    readonly code: BuildLinkCodecErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'BuildLinkCodecError';
  }
}
