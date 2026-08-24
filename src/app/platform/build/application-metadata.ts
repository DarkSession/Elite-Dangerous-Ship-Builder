import { name as packageName, version as packageVersion } from '../../../../package.json';

/**
 * Who produced an export, resolved at build time.
 *
 * SLEF attribution belongs to the application, not to the Almanac, so the
 * package requires a caller to supply it. Both halves come from the repository
 * itself: the name is the package's own identifier and the version is the
 * released `package.json#version`. Neither is a runtime configuration request —
 * a build that has to ask a server who it is has a server — and neither is a
 * literal typed here, which is the failure the reference review named as
 * "fabricated app/library versions".
 *
 * The name is deliberately *not* the localized `app.name` message. An export
 * travels to Coriolis, EDSY and Inara, where `appName` is an identity a
 * consumer matches on; a value that changed with the reader's language would be
 * a different producer in every locale.
 */
export interface ApplicationMetadata {
  readonly appName: string;
  readonly appVersion: string;
}

/** The one producer identity this build exports under. */
export const APPLICATION_METADATA: ApplicationMetadata = Object.freeze({
  appName: packageName,
  appVersion: packageVersion,
});
