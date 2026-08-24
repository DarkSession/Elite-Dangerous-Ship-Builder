import { APPLICATION_METADATA } from './application-metadata';
import packageJson from '../../../../package.json';

describe('APPLICATION_METADATA', () => {
  it('is the repository’s own identity and released version', () => {
    expect(APPLICATION_METADATA).toEqual({
      appName: packageJson.name,
      appVersion: packageJson.version,
    });
  });

  it('is frozen, so an export cannot be attributed to somebody else at runtime', () => {
    expect(Object.isFrozen(APPLICATION_METADATA)).toBe(true);
  });
});
