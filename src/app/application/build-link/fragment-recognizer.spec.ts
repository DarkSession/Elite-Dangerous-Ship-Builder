import {
  BUILD_LINK_PREFIX,
  MAX_BUILD_LINK_LENGTH,
  recognizeBuildLinkFragment,
} from './fragment-recognizer';

describe('recognizeBuildLinkFragment', () => {
  it('recognizes a build link with or without its leading hash', () => {
    for (const raw of ['b.abc', '#b.abc']) {
      expect(recognizeBuildLinkFragment(raw)).toEqual({ kind: 'build', fragment: 'b.abc' });
    }
  });

  it('leaves an unrelated fragment uninterpreted', () => {
    for (const raw of ['', '#', 'section-2', '#access-token=secret', 'B.abc', 'b-abc']) {
      expect(recognizeBuildLinkFragment(raw)).toEqual({ kind: 'unrelated' });
    }
  });

  it('rejects a value longer than the published bound, prefix included', () => {
    const overLong = BUILD_LINK_PREFIX + 'x'.repeat(MAX_BUILD_LINK_LENGTH - 1);

    expect(overLong.length).toBe(MAX_BUILD_LINK_LENGTH + 1);
    expect(recognizeBuildLinkFragment(overLong)).toEqual({
      kind: 'over-limit',
      length: MAX_BUILD_LINK_LENGTH + 1,
    });
  });

  it('accepts a value of exactly the published bound', () => {
    const exact = BUILD_LINK_PREFIX + 'x'.repeat(MAX_BUILD_LINK_LENGTH - BUILD_LINK_PREFIX.length);

    expect(exact.length).toBe(MAX_BUILD_LINK_LENGTH);
    expect(recognizeBuildLinkFragment(exact).kind).toBe('build');
  });

  it('takes the value exactly as it arrived', () => {
    // Trimming, folding or percent-decoding would change a token the integrity
    // check is about to verify, and then report a failure about the altered one.
    expect(recognizeBuildLinkFragment('b. abc ')).toEqual({ kind: 'build', fragment: 'b. abc ' });
    expect(recognizeBuildLinkFragment('b.a%20b')).toEqual({ kind: 'build', fragment: 'b.a%20b' });
  });
});
