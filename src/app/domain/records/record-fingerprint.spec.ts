import { isDirty } from './record-fingerprint';

describe('dirty state', () => {
  it('treats work with no baseline as unsaved', () => {
    expect(isDirty('a-build', null)).toBe(true);
  });

  it('is clean while the work equals its baseline', () => {
    expect(isDirty('a-build', 'a-build')).toBe(false);
  });

  it('is dirty once the work diverges from its baseline', () => {
    expect(isDirty('a-build', 'the-build-it-was')).toBe(true);
  });

  it('has nothing to lose when nothing is open at all', () => {
    expect(isDirty(null, null)).toBe(false);
    expect(isDirty(null, 'anything')).toBe(false);
  });
});
