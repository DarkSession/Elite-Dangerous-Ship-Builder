export type BuildLinkCodecErrorCode =
  | 'invalidEncoding'
  | 'integrityCheckFailed'
  | 'unsupportedVersion'
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
