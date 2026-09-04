import { SITE_ORIGIN, canonicalAddress } from './site-address';

describe('canonical address', () => {
  it('names the production site rather than wherever the document is served from', () => {
    expect(canonicalAddress('/ships')).toBe('https://navbeacon.app/ships');
    expect(SITE_ORIGIN).toBe('https://navbeacon.app');
  });

  it('resolves the root and the empty path to one address, not two', () => {
    expect(canonicalAddress('/')).toBe(`${SITE_ORIGIN}/`);
    expect(canonicalAddress('')).toBe(`${SITE_ORIGIN}/`);
  });

  it('drops a trailing slash so a route is one address', () => {
    expect(canonicalAddress('/builds/')).toBe(`${SITE_ORIGIN}/builds`);
  });

  it('drops the fragment, because that is where a build lives', () => {
    expect(canonicalAddress('/outfitting#H4sIAAAA')).toBe(`${SITE_ORIGIN}/outfitting`);
  });

  it('drops the query as well', () => {
    expect(canonicalAddress('/ships?sort=jump')).toBe(`${SITE_ORIGIN}/ships`);
  });

  it('keeps a nested route whole', () => {
    expect(canonicalAddress('/ships/Anaconda')).toBe(`${SITE_ORIGIN}/ships/Anaconda`);
  });

  it('accepts a path the router hands over without a leading slash', () => {
    expect(canonicalAddress('ships')).toBe(`${SITE_ORIGIN}/ships`);
  });
});
