import { assertHelpManifest, type HelpManifestV1 } from './help-manifest';

const DIGEST = 'a'.repeat(64);

const manifest = (overrides: Partial<HelpManifestV1> = {}): HelpManifestV1 =>
  ({
    schemaVersion: 1,
    build: { kind: 'nonRelease', applicationVersion: '0.0.0', buildId: 'abc1234' },
    almanac: { packageName: '@elite-dangerous-almanac/core', version: '0.1.7' },
    disclaimer: {
      documentId: 'frontierDisclaimer',
      source: 'LICENSE',
      language: 'en',
      exactText: 'Ship Builder was created using assets and imagery from Elite Dangerous.',
      byteLength: 70,
      sha256: DIGEST,
    },
    destinations: {
      repositoryLicense: {
        id: 'repositoryLicense',
        url: 'https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
        purpose: 'completeLegalTerms',
        leavesApplication: true,
        mayRequireNetwork: true,
      },
      almanacLicense: {
        id: 'almanacLicense',
        url: 'https://github.com/DarkSession/Elite-Dangerous-Almanac/blob/main/LICENSE',
        purpose: 'completeLegalTerms',
        leavesApplication: true,
        mayRequireNetwork: true,
      },
    },
    sourceDistribution: [
      {
        id: 'almanacLicense',
        mirrorPath: 'legal/almanac/LICENSE',
        byteLength: 2426,
        sha256: DIGEST,
      },
    ],
    ...overrides,
  }) as HelpManifestV1;

describe('assertHelpManifest', () => {
  it('accepts the manifest the generator emits', () => {
    expect(() => assertHelpManifest(manifest())).not.toThrow();
  });

  it('returns the manifest so it can be asserted at the point of import', () => {
    const subject = manifest();
    expect(assertHelpManifest(subject)).toBe(subject);
  });

  it('rejects a schema version it was not written for', () => {
    expect(() => assertHelpManifest(manifest({ schemaVersion: 2 as 1 }))).toThrow(/schemaVersion/);
  });

  it('rejects an empty application version, rather than showing a blank one', () => {
    expect(() =>
      assertHelpManifest(manifest({ build: { kind: 'release', applicationVersion: '   ' } })),
    ).toThrow(/applicationVersion/);
  });

  it('requires a non-release build to name which build it is', () => {
    expect(() =>
      assertHelpManifest(
        manifest({
          build: { kind: 'nonRelease', applicationVersion: '1.2.3', buildId: '' },
        }),
      ),
    ).toThrow(/buildId/);
  });

  it('rejects an empty bundled Almanac version', () => {
    expect(() =>
      assertHelpManifest(
        manifest({ almanac: { packageName: '@elite-dangerous-almanac/core', version: '' } }),
      ),
    ).toThrow(/almanac.version/);
  });

  describe('the one embedded legal body', () => {
    it('rejects a document that is not the Frontier disclaimer', () => {
      const subject = manifest();
      expect(() =>
        assertHelpManifest({
          ...subject,
          disclaimer: { ...subject.disclaimer, documentId: 'mitLicence' as 'frontierDisclaimer' },
        }),
      ).toThrow(/legal body other than the Frontier disclaimer/);
    });

    it('rejects a disclaimer that claims another source or a translation', () => {
      const subject = manifest();
      expect(() =>
        assertHelpManifest({
          ...subject,
          disclaimer: { ...subject.disclaimer, language: 'de' as 'en' },
        }),
      ).toThrow(/root LICENSE and stay in English/);
    });

    it('rejects empty disclaimer text', () => {
      const subject = manifest();
      expect(() =>
        assertHelpManifest({ ...subject, disclaimer: { ...subject.disclaimer, exactText: '' } }),
      ).toThrow(/exactText/);
    });

    it('requires a positive byte count', () => {
      const subject = manifest();
      expect(() =>
        assertHelpManifest({ ...subject, disclaimer: { ...subject.disclaimer, byteLength: 0 } }),
      ).toThrow(/byteLength/);
    });

    it.each([['short'], ['A'.repeat(64)], [`${'a'.repeat(63)}g`], ['']])(
      'rejects %s as a SHA-256 digest',
      (candidate) => {
        const subject = manifest();
        expect(() =>
          assertHelpManifest({
            ...subject,
            disclaimer: { ...subject.disclaimer, sha256: candidate },
          }),
        ).toThrow(/64 lowercase hexadecimal/);
      },
    );
  });

  describe('external destinations', () => {
    it('rejects a manifest carrying no destination at all', () => {
      expect(() =>
        assertHelpManifest(manifest({ destinations: {} as HelpManifestV1['destinations'] })),
      ).toThrow(/exactly the destinations/);
    });

    it('rejects a manifest carrying only one of the two', () => {
      const subject = manifest();
      expect(() =>
        assertHelpManifest({
          ...subject,
          destinations: {
            repositoryLicense: subject.destinations.repositoryLicense,
          } as HelpManifestV1['destinations'],
        }),
      ).toThrow(/exactly the destinations/);
    });

    it('rejects a third destination, which would be a navigation nobody reviewed', () => {
      const subject = manifest();
      expect(() =>
        assertHelpManifest({
          ...subject,
          destinations: {
            ...subject.destinations,
            almanacIssues: subject.destinations.repositoryLicense,
          } as HelpManifestV1['destinations'],
        }),
      ).toThrow(/exactly the destinations/);
    });

    it.each(['repositoryLicense', 'almanacLicense'] as const)(
      'requires %s to be the complete legal terms',
      (id) => {
        const subject = manifest();
        expect(() =>
          assertHelpManifest({
            ...subject,
            destinations: {
              ...subject.destinations,
              [id]: {
                ...subject.destinations[id],
                purpose: 'packageDefectReport' as 'completeLegalTerms',
              },
            },
          }),
        ).toThrow(new RegExp(`${id} must be a completeLegalTerms destination`));
      },
    );

    it.each(['repositoryLicense', 'almanacLicense'] as const)(
      'requires %s to carry its own id rather than the other one',
      (id) => {
        const subject = manifest();
        const other = id === 'repositoryLicense' ? 'almanacLicense' : 'repositoryLicense';
        expect(() =>
          assertHelpManifest({
            ...subject,
            destinations: { ...subject.destinations, [id]: { ...subject.destinations[other] } },
          }),
        ).toThrow(new RegExp(`${id} must be a completeLegalTerms destination`));
      },
    );

    it.each(['repositoryLicense', 'almanacLicense'] as const)(
      'requires %s to admit that it leaves the application',
      (id) => {
        const subject = manifest();
        expect(() =>
          assertHelpManifest({
            ...subject,
            destinations: {
              ...subject.destinations,
              [id]: { ...subject.destinations[id], leavesApplication: false as true },
            },
          }),
        ).toThrow(/leaves the app/);
      },
    );

    it.each(['repositoryLicense', 'almanacLicense'] as const)('rejects an empty %s URL', (id) => {
      const subject = manifest();
      expect(() =>
        assertHelpManifest({
          ...subject,
          destinations: {
            ...subject.destinations,
            [id]: { ...subject.destinations[id], url: '' },
          },
        }),
      ).toThrow(new RegExp(`destinations.${id}.url`));
    });
  });

  it('checks every source-distribution mirror record it carries', () => {
    expect(() =>
      assertHelpManifest(
        manifest({
          sourceDistribution: [
            { id: 'almanacNotices', mirrorPath: '', byteLength: 1, sha256: DIGEST },
          ],
        }),
      ),
    ).toThrow(/mirrorPath/);
  });
});
