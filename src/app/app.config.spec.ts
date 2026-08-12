import { appConfig } from './app.config';

describe('appConfig', () => {
  it('provides the application-level providers used to bootstrap the app', () => {
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });
});
