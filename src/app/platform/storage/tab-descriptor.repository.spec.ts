import { TestBed } from '@angular/core/testing';
import { MemoryStorage, provideMemoryStorage } from './storage.spec-helpers';
import { EDSB_TAB_KEY } from './storage-keys';
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

    tab.write('working-1');

    expect(
      setup((storage) =>
        storage.entries.set(EDSB_TAB_KEY, session.entries.get(EDSB_TAB_KEY)!),
      ).tab.read(),
    ).toEqual({ version: 1, workingRecordId: 'working-1' });
  });

  it('writes only its own key', () => {
    const { tab, session } = setup();

    tab.write('working-1');

    expect([...session.entries.keys()]).toEqual([EDSB_TAB_KEY]);
  });

  it('ignores a descriptor written by a version it does not know', () => {
    const { tab } = setup((storage) =>
      storage.entries.set(EDSB_TAB_KEY, JSON.stringify({ version: 99, workingRecordId: 'x' })),
    );

    // Starting a fresh working record is safe; adopting a record described by
    // a format we cannot read is not.
    expect(tab.read()).toBeNull();
  });

  it('ignores a malformed descriptor', () => {
    for (const value of ['not json', '{}', JSON.stringify({ version: 1 }), JSON.stringify(null)]) {
      const { tab } = setup((storage) => storage.entries.set(EDSB_TAB_KEY, value));

      expect(tab.read(), value).toBeNull();
    }
  });

  it('forgets the tab’s claim on request', () => {
    const { tab, session } = setup();
    tab.write('working-1');

    tab.clear();

    expect(session.entries.has(EDSB_TAB_KEY)).toBe(false);
  });
});
