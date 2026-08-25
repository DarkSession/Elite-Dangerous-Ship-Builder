import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { ActiveBuildStore } from '../../application/active-build/active-build.store';
import { AutosaveService } from '../../application/build-library/autosave.service';
import type { PersistenceStatus as Status } from '../../application/active-build/active-build.models';
import { provideLocalization } from '../../i18n/i18n.providers';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { PersistenceStatus } from './persistence-status';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

class SilentLifecycle {
  onFlush(): () => void {
    return () => {};
  }
}

class SilentChannel {
  readonly available = false;
  post(): void {}
  subscribe(): () => void {
    return () => {};
  }
}

function render(status: Status) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PersistenceStatus],
    providers: [
      provideLocalization(),
      ...provideMemoryStorage(new MemoryStorage()),
      { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
      { provide: PageLifecycleAdapter, useValue: new SilentLifecycle() },
      { provide: BroadcastChannelAdapter, useValue: new SilentChannel() },
    ],
  });

  const active = TestBed.inject(ActiveBuildStore);
  active.commit({
    loadout: ShipLoadout.default('Anaconda'),
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId: null,
    baseline: null,
  });
  active.setPersistence(status);

  const fixture = TestBed.createComponent(PersistenceStatus);
  fixture.detectChanges();
  return { fixture, active, autosave: TestBed.inject(AutosaveService) };
}

const textOf = (fixture: { nativeElement: unknown }) =>
  ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');

const buttons = (fixture: { nativeElement: unknown }) => [
  ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
];

describe('PersistenceStatus', () => {
  it('names every state a Commander has to act on, never by colour alone', () => {
    const expected: readonly (readonly [Status, string])[] = [
      ['retention-limit', 'recoverable working builds'],
      ['quota-full', 'storage is full'],
      ['unavailable', 'not allowing the application to store'],
      ['write-failed', 'last save did not go through'],
      ['record-deleted-externally', 'discarded somewhere else'],
    ];

    for (const [status, words] of expected) {
      const { fixture } = render(status);

      expect(textOf(fixture), status).toContain(words);
    }
  });

  it('draws nothing at all while storage is doing its job', () => {
    // Neither canvas has a "saved" banner. Repeating it every few seconds over
    // the top of someone's reading is worse than silence, and the states that
    // matter are the ones above.
    for (const status of ['ready', 'saving', 'saved'] as const) {
      const { fixture } = render(status);

      expect(textOf(fixture).trim(), status).toBe('');
    }
  });

  it('says editing still works in every failure state', () => {
    for (const status of [
      'quota-full',
      'unavailable',
      'write-failed',
      'retention-limit',
    ] as const) {
      const { fixture, active } = render(status);

      expect(textOf(fixture), status).toMatch(/still works|Editing/i);
      expect(active.loadout(), status).not.toBeNull();
    }
  });

  it('reports a failure as an alert rather than as an incidental update', () => {
    const { fixture } = render('write-failed');

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
  });

  it('does not interrupt with an alert while it is simply saving', () => {
    const { fixture } = render('saving');

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeNull();
  });

  it('offers a retry when a write failed', () => {
    const { fixture } = render('write-failed');

    expect(buttons(fixture).map((button) => button.textContent?.trim())).toContain(
      'Try saving again',
    );
  });

  it('offers management and a retry when there is no room', () => {
    for (const status of ['quota-full', 'retention-limit'] as const) {
      const { fixture } = render(status);
      const labels = buttons(fixture).map((button) => button.textContent?.trim());

      expect(labels, status).toContain('Choose builds to discard');
      expect(labels, status).toContain('Try saving again');
    }
  });

  it('requires an explicit resume after the record was discarded elsewhere', () => {
    const { fixture, autosave } = render('record-deleted-externally');
    autosave.pauseAfterExternalDelete();
    expect(autosave.paused()).toBe(true);

    buttons(fixture)
      .find(
        (button) => button.textContent?.includes('wieder') || button.textContent?.includes('again'),
      )!
      .click();

    expect(autosave.paused()).toBe(false);
  });

  it('offers nothing to do when saving is going normally', () => {
    for (const status of ['saved', 'saving', 'ready'] as const) {
      const { fixture } = render(status);

      expect(buttons(fixture), status).toHaveLength(0);
    }
  });
});
