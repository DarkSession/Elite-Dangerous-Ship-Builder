/**
 * The shape of the one artifact the Help · About modal reads.
 *
 * Everything here is produced at build time by `scripts/generate-help-manifest.mjs`
 * from files that already exist in the repository or in the installed package —
 * the root `package.json`, the root `LICENSE`, the Almanac's own manifest — and
 * nothing here is typed by hand. That is the whole point of the type: a version
 * a person wrote into a template is a claim about the build, and the reference
 * canvas's `APP VERSION 4.2.1 · LIBRARY VERSION 3.8.0.3` is what a claim like
 * that turns into once it is a year old.
 *
 * The manifest is deliberately small. It carries identities, one legal excerpt
 * and one destination; it does not carry help topics (those live in their own
 * generated module, keyed by message id so they can be translated), and it does
 * not carry any document body beyond the single excerpt FR-003 permits.
 */

/** Which application artifact is being looked at. */
export type BuildIdentity =
  | { readonly kind: 'release'; readonly applicationVersion: string }
  | {
      readonly kind: 'nonRelease';
      readonly applicationVersion: string;
      /**
       * A bounded, non-personal marker for a build nobody released.
       *
       * A CI run number or an abbreviated commit, never a branch, a machine, a
       * person or a timestamp. It exists so a Commander reporting something odd
       * can say which build they were looking at, and for no other reason.
       */
      readonly buildId: string;
    };

/** Identity of the installed game-data package. */
export interface AlmanacIdentity {
  readonly packageName: string;
  readonly version: string;
}

/**
 * The one legal body the modal is allowed to embed.
 *
 * `exactText` is the project's own Frontier media-usage disclaimer, lifted out
 * of the root `LICENSE` rather than retyped beside it. `byteLength` and
 * `sha256` are carried so a test can prove the text that reached the browser is
 * the text that was in the file, without the test needing its own copy to
 * compare against — which would be a second copy, and a second copy is the
 * thing that eventually disagrees.
 */
export interface FrontierDisclaimer {
  readonly documentId: 'frontierDisclaimer';
  readonly source: 'LICENSE';
  readonly language: 'en';
  readonly exactText: string;
  readonly byteLength: number;
  readonly sha256: string;
}

/**
 * A deliberate navigation out of the application.
 *
 * There are exactly two, and both are complete licence documents: this
 * repository's own `LICENSE`, and the bundled library's. `purpose` stays a
 * single-member union and `id` a closed pair, so a third destination — an issue
 * tracker, a homepage, a docs site — is a type error rather than a review note.
 * FR-009's package-defect action was withdrawn on 2026-08-25 and does not come
 * back with these; what came back is the licence link FR-003 had withdrawn on
 * the same day, on the 2026-08-26 ruling recorded in the specification.
 */
export interface ExternalDestination {
  readonly id: 'repositoryLicense' | 'almanacLicense';
  readonly url: string;
  readonly purpose: 'completeLegalTerms';
  readonly leavesApplication: true;
  readonly mayRequireNetwork: true;
}

/**
 * Evidence that a source distribution still carries the package's own terms.
 *
 * Build evidence only. The bodies of these documents never enter the browser
 * bundle and are never rendered — mirroring them is a redistribution
 * obligation, not a thing to show a Commander (FR-004).
 */
export interface SourceDistributionArtifact {
  readonly id: 'almanacLicense' | 'almanacNotices';
  readonly mirrorPath: string;
  readonly byteLength: number;
  readonly sha256: string;
}

/** The complete generated artifact, imported eagerly by the application. */
export interface HelpManifestV1 {
  readonly schemaVersion: 1;
  readonly build: BuildIdentity;
  readonly almanac: AlmanacIdentity;
  readonly disclaimer: FrontierDisclaimer;
  readonly destinations: {
    readonly repositoryLicense: ExternalDestination;
    readonly almanacLicense: ExternalDestination;
  };
  readonly sourceDistribution: readonly SourceDistributionArtifact[];
}

/** A 64-character lowercase hex digest, and nothing that merely looks like one. */
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const assertNonEmpty = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Help manifest ${field} must be a non-empty string.`);
  }
  return value;
};

const assertDigest = (value: unknown, field: string): void => {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    throw new Error(`Help manifest ${field} must be 64 lowercase hexadecimal characters.`);
  }
};

const assertPositiveInteger = (value: unknown, field: string): void => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Help manifest ${field} must be a positive integer.`);
  }
};

/**
 * Checks a manifest against its own invariants, and throws naming the first one
 * that fails.
 *
 * The generator already refuses to emit a manifest that breaks any of these, so
 * in a correct build this never fires. It exists because the generated module
 * is the one input to this feature that is not written by hand and not reviewed
 * in a diff: if it is ever wrong, the failure should be a named error at the
 * point of import rather than a blank region in a legal notice.
 */
export function assertHelpManifest(manifest: HelpManifestV1): HelpManifestV1 {
  if (manifest.schemaVersion !== 1) {
    throw new Error('Help manifest schemaVersion must be 1.');
  }

  assertNonEmpty(manifest.build.applicationVersion, 'build.applicationVersion');
  if (manifest.build.kind === 'nonRelease') {
    assertNonEmpty(manifest.build.buildId, 'build.buildId');
  }

  assertNonEmpty(manifest.almanac.packageName, 'almanac.packageName');
  assertNonEmpty(manifest.almanac.version, 'almanac.version');

  const disclaimer = manifest.disclaimer;
  if (disclaimer.documentId !== 'frontierDisclaimer') {
    throw new Error('Help manifest carries a legal body other than the Frontier disclaimer.');
  }
  if (disclaimer.source !== 'LICENSE' || disclaimer.language !== 'en') {
    throw new Error('The Frontier disclaimer must come from root LICENSE and stay in English.');
  }
  assertNonEmpty(disclaimer.exactText, 'disclaimer.exactText');
  assertPositiveInteger(disclaimer.byteLength, 'disclaimer.byteLength');
  assertDigest(disclaimer.sha256, 'disclaimer.sha256');

  // One destination, and the object cannot quietly grow a second one: a key
  // nobody expects here is a navigation nobody reviewed.
  // Exactly two, named. Both are complete-licence documents and nothing else
  // is a destination: an issue tracker, a homepage or a docs site reaching this
  // set would be a navigation this feature never accepted (FR-003).
  const expectedIds = ['repositoryLicense', 'almanacLicense'];
  const destinationIds = Object.keys(manifest.destinations).sort();
  if (destinationIds.join(',') !== [...expectedIds].sort().join(',')) {
    throw new Error(
      `Help manifest must carry exactly the destinations ${expectedIds.join(' and ')}; found ${
        destinationIds.join(', ') || 'none'
      }.`,
    );
  }

  for (const id of expectedIds) {
    const licence = manifest.destinations[id as 'repositoryLicense' | 'almanacLicense'];
    if (licence.id !== id || licence.purpose !== 'completeLegalTerms') {
      throw new Error(`${id} must be a completeLegalTerms destination carrying its own id.`);
    }
    if (!licence.leavesApplication || !licence.mayRequireNetwork) {
      throw new Error(
        `The ${id} destination must state that it leaves the app and needs a network.`,
      );
    }
    assertNonEmpty(licence.url, `destinations.${id}.url`);
  }

  for (const artifact of manifest.sourceDistribution) {
    assertNonEmpty(artifact.mirrorPath, `sourceDistribution.${artifact.id}.mirrorPath`);
    assertPositiveInteger(artifact.byteLength, `sourceDistribution.${artifact.id}.byteLength`);
    assertDigest(artifact.sha256, `sourceDistribution.${artifact.id}.sha256`);
  }

  return manifest;
}
