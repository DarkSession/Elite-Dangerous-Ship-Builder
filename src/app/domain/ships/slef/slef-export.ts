import {
  SLEF_EXPORT_FILENAME,
  SLEF_EXPORT_MIME_TYPE,
  type ActiveExportSnapshot,
  type CanonicalLink,
  type LinkOmissionReason,
  type SlefExportArtifact,
  type SlefExportHeader,
} from './slef-export.models';
import type { ApplicationMetadata } from '../../../platform/build/application-metadata';

/**
 * The serialization options, frozen.
 *
 * `fitted` keeps the order the build carries, which is the order an imported
 * payload arrived in and the order a round trip has to preserve.
 * `explicitPower: false` follows SLEF's "require what is necessary, do not
 * force the rest", so a build that never touched a priority does not claim one.
 * `indent: 2` is what a Commander reads on screen and pastes into a forum
 * (export contract, "Package invocation").
 */
const SERIALIZATION = { moduleOrder: 'fitted', explicitPower: false, indent: 2 } as const;

/**
 * One SLEF entry for exactly one active revision.
 *
 * Exactly one package call, and no application step either side of it. The
 * payload is whatever `toSlefString` returned — not reparsed, not reformatted,
 * not stripped of a field the application does not model. Deleting `Health`
 * because "the application does not use it" would make the application the
 * author of somebody else's format (export contract, "Payload boundary").
 *
 * Credits are the package's default: current catalogue retail. `credits:
 * 'source'` is never passed, so a captured purchase figure is not requested,
 * cannot be retained and cannot reach an export (FR-005).
 */
export function generateSlefExportArtifact(
  snapshot: ActiveExportSnapshot,
  metadata: ApplicationMetadata,
): SlefExportArtifact {
  const header = exportHeader(snapshot.canonicalLink, metadata);
  const payload = snapshot.loadout.toSlefString({ ...SERIALIZATION, header });

  return Object.freeze({
    revision: snapshot.revision,
    payload,
    utf8Bytes: new TextEncoder().encode(payload).byteLength,
    moduleCount: snapshot.loadout.fittedModules().length,
    filename: SLEF_EXPORT_FILENAME,
    mimeType: SLEF_EXPORT_MIME_TYPE,
    header,
    linkOmission: linkOmissionReason(snapshot.canonicalLink),
    validation: snapshot.loadout.validation(),
  });
}

/**
 * The envelope header, with `appURL` present only for a certified link.
 *
 * Every other link state omits it. An absent, pending, refused or stale link
 * are four ways of *not having* a link for this revision, and writing any of
 * them into an export would point a consumer at a build that is not the one
 * being exported. The omission is disclosed to the Commander; it is not an
 * export failure (export contract, "Package invocation").
 */
export function exportHeader(link: CanonicalLink, metadata: ApplicationMetadata): SlefExportHeader {
  const base = { appName: metadata.appName, appVersion: metadata.appVersion };
  return link.kind === 'certified' ? { ...base, appURL: link.url } : base;
}

/** Why the header carries no `appURL`, or `null` when it carries one. */
export function linkOmissionReason(link: CanonicalLink): LinkOmissionReason | null {
  return link.kind === 'certified' ? null : link.kind;
}
