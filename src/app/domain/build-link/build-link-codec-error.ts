export type BuildLinkCodecErrorCode =
  | 'invalidEncoding'
  | 'integrityCheckFailed'
  | 'unsupportedEnvelope'
  | 'unsupportedTableVersion'
  | 'invalidPayload'
  | 'unknownIdentity';

export class BuildLinkCodecError extends Error {
  constructor(
    readonly code: BuildLinkCodecErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BuildLinkCodecError';
  }
}
