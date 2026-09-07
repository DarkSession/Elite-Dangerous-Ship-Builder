import { TestBed } from '@angular/core/testing';
import { MemoryStorage, provideMemoryStorage } from './storage.spec-helpers';
import { EDNB_TAB_KEY } from './storage-keys';
import { TabDescriptorRepository } from './tab-descriptor.repository';

function setup(seed: (storage: MemoryStorage) => void = () => {}): {
  tab: TabDescriptorRepository;
  session: MemoryStorage;
} {
  const session = new MemoryStorage();
  seed(session);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [...provideMemoryStorage(new MemoryStorage(), session)],
  });
  return { tab: TestBed.inject(TabDescriptorRepository), session };
}

describe('TabDescriptorRepository', () => {
  it('has nothing to say before a tab has claimed anything', () => {
    expect(setup().tab.read()).toBeNull();
  });

  it('remembers this tab’s working record across a reload', () => {
    const { tab, session } = setup();

    tab.write('ship', 'working-1');

    expect(
      setup((storage) =>
        storage.entries.set(EDNB_TAB_KEY, session.entries.get(EDNB_TAB_KEY)!),
      ).tab.read(),
    ).toEqual({ version: 2, workingRecords: { ship: 'working-1' } });
  });

  it('remembers one working record per tool', () => {
    // A page holds a build and a loadout at once, and each is autosaved into an
    // unnamed record of its own. Claiming one leaves the other where it is
    // (017/FR-010).
    const { tab, session } = setup();

    tab.write('ship', 'working-1');
    tab.write('equipment', 'working-2');

    expect(
      setup((storage) =>
        storage.entries.set(EDNB_TAB_KEY, session.entries.get(EDNB_TAB_KEY)!),
      ).tab.read(),
    ).toEqual({ version: 2, workingRecords: { ship: 'working-1', equipment: 'working-2' } });
  });

  it('reads a descriptor from before a tab held two records as the ship tool’s', () => {
    // Applying a published update restarts the page in the same tab, where
    // session storage survives. A tab that forgot its record would leave the
    // build it was writing to behind and start a second one.
    const { tab } = setup((storage) =>
      storage.entries.set(EDNB_TAB_KEY, JSON.stringify({ version: 1, workingRecordId: 'older' })),
    );

    expect(tab.read()).toEqual({ version: 2, workingRecords: { ship: 'older' } });
  });

  it('writes only its own key', () => {
    const { tab, session } = setup();

    tab.write('ship', 'working-1');

    expect([...session.entries.keys()]).toEqual([EDNB_TAB_KEY]);
  });

  it('ignores a descriptor written by a version it does not know', () => {
    const { tab } = setup((storage) =>
      storage.entries.set(EDNB_TAB_KEY, JSON.stringify({ version: 99, workingRecordId: 'x' })),
    );

    // Starting a fresh working record is safe; adopting a record described by
    // a format we cannot read is not.
    expect(tab.read()).toBeNull();
  });

  it('ignores a malformed descriptor', () => {
    for (const value of [
      'not json',
      '{}',
      JSON.stringify({ version: 1 }),
      JSON.stringify({ version: 2 }),
      JSON.stringify({ version: 2, workingRecords: 'nothing' }),
      JSON.stringify(null),
    ]) {
      const { tab } = setup((storage) => storage.entries.set(EDNB_TAB_KEY, value));

      expect(tab.read(), value).toBeNull();
    }
  });

  it('lets go of one tool’s record and leaves the other tool’s alone', () => {
    const { tab, session } = setup();
    tab.write('ship', 'working-1');
    tab.write('equipment', 'working-2');

    tab.release('equipment');

    expect(tab.read()).toEqual({ version: 2, workingRecords: { ship: 'working-1' } });
    expect(session.entries.has(EDNB_TAB_KEY)).toBe(true);
  });

  it('holds nothing at all once the last tool has let go', () => {
    // Rather than an empty descriptor, which the next tab would read and write
    // around for no reason.
    const { tab, session } = setup();
    tab.write('equipment', 'working-2');

    tab.release('equipment');

    expect(session.entries.has(EDNB_TAB_KEY)).toBe(false);
  });

  it('changes nothing when the tool it is asked about holds no record', () => {
    const { tab, session } = setup();
    tab.write('ship', 'working-1');
    const written = session.entries.get(EDNB_TAB_KEY);

    tab.release('equipment');

    expect(session.entries.get(EDNB_TAB_KEY)).toBe(written);
  });

  it('forgets the tab’s claim on request', () => {
    const { tab, session } = setup();
    tab.write('ship', 'working-1');

    tab.clear();

    expect(session.entries.has(EDNB_TAB_KEY)).toBe(false);
  });
});
