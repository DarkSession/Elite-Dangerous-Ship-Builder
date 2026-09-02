import { deriveBuildTitle } from './build-title';

describe('deriveBuildTitle', () => {
  const build = (shipName: string | null, shipIdent: string | null) => ({ shipName, shipIdent });

  it('calls a build by the name its Commander gave the ship', () => {
    expect(deriveBuildTitle(build('Needle', 'AC-01'), 'Anaconda', 'Untitled')).toBe('Needle');
  });

  it('falls back to the ident where the ship has no name', () => {
    expect(deriveBuildTitle(build(null, 'AC-01'), 'Anaconda', 'Untitled')).toBe('AC-01');
  });

  it('falls back to the hull where there is neither', () => {
    expect(deriveBuildTitle(build(null, null), 'Anaconda', 'Untitled')).toBe('Anaconda');
  });

  it('takes the last word where even the hull is missing', () => {
    expect(deriveBuildTitle(build(null, null), null, 'Untitled')).toBe('Untitled');
  });

  it('treats a field of spaces as absent', () => {
    // What a Commander gets for pressing space in the identity field. A title
    // of nothing is the empty save field this rule exists to prevent.
    expect(deriveBuildTitle(build('   ', '  '), 'Anaconda', 'Untitled')).toBe('Anaconda');
  });
});
