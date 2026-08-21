import { TestBed } from '@angular/core/testing';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { provideLocalization } from '../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { LocaleStore } from '../../i18n/locale.store';
import { AnnouncementService } from './announcement.service';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

function setup(): { announcements: AnnouncementService; store: LocaleStore } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
    ],
  });
  return {
    announcements: TestBed.inject(AnnouncementService),
    store: TestBed.inject(LocaleStore),
  };
}

describe('AnnouncementService', () => {
  it('starts silent, because initial content is not a change', () => {
    const { announcements } = setup();

    expect(announcements.assertive()).toBe('');
    expect(announcements.polite()).toBe('');
  });

  it('publishes one assertive summary for a new blocking error', () => {
    const { announcements } = setup();

    const published = announcements.announce({
      kind: 'build.invalid',
      revision: 1,
      urgency: 'assertive',
      messageKey: 'error.blocking.summary',
      params: { reason: 'power draw exceeds output' },
    });

    expect(published).toBe(true);
    expect(announcements.assertive()).toContain('power draw exceeds output');
    expect(announcements.polite()).toBe('');
  });

  it('publishes a settled change politely', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'build.updated',
      revision: 1,
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['status.success']);
    expect(announcements.assertive()).toBe('');
  });

  it('says nothing for a replayed event with the same identity', () => {
    const { announcements } = setup();
    const event = {
      kind: 'build.updated',
      revision: 4,
      urgency: 'polite' as const,
      messageKey: 'status.success' as const,
    };

    expect(announcements.announce(event)).toBe(true);
    expect(announcements.announce(event)).toBe(false);
    expect(announcements.announce({ ...event })).toBe(false);
  });

  it('says nothing for a stale outcome that arrives after a newer one', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'jump.range',
      revision: 5,
      urgency: 'polite',
      messageKey: 'status.success',
    });
    const stale = announcements.announce({
      kind: 'jump.range',
      revision: 3,
      urgency: 'polite',
      messageKey: 'status.error',
    });

    expect(stale).toBe(false);
    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['status.success']);
  });

  it('announces a genuinely newer revision of the same event', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'jump.range',
      revision: 1,
      urgency: 'polite',
      messageKey: 'status.loading',
    });
    const newer = announcements.announce({
      kind: 'jump.range',
      revision: 2,
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(newer).toBe(true);
    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['status.success']);
  });

  it('treats the two urgencies as separate outlets', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'build.state',
      revision: 1,
      urgency: 'polite',
      messageKey: 'status.success',
    });
    announcements.announce({
      kind: 'build.state',
      revision: 1,
      urgency: 'assertive',
      messageKey: 'status.error',
    });

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['status.success']);
    expect(announcements.assertive()).toBe(BUNDLED_ENGLISH['status.error']);
  });

  it('distinguishes events by kind rather than by their text', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'power.updated',
      revision: 1,
      urgency: 'polite',
      messageKey: 'status.success',
    });
    const other = announcements.announce({
      kind: 'mass.updated',
      revision: 1,
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(other).toBe(true);
  });

  it('clears outlet text on a locale switch without replaying old events', () => {
    const { announcements, store } = setup();
    const event = {
      kind: 'build.updated',
      revision: 1,
      urgency: 'polite' as const,
      messageKey: 'status.success' as const,
    };
    announcements.announce(event);

    announcements.clearOutlets();
    store.commitCandidate(
      {
        requested: 'de',
        catalogue: { ...BUNDLED_ENGLISH, 'status.success': 'Erfolg' },
        source: 'asset',
        failure: null,
      },
      'browser',
    );

    expect(announcements.polite()).toBe('');
    expect(announcements.announce(event)).toBe(false);
  });

  it('resolves a genuinely new event in the new language after a switch', () => {
    const { announcements, store } = setup();
    announcements.announce({
      kind: 'build.updated',
      revision: 1,
      urgency: 'polite',
      messageKey: 'status.success',
    });

    announcements.clearOutlets();
    store.commitCandidate(
      {
        requested: 'de',
        catalogue: { ...BUNDLED_ENGLISH, 'status.success': 'Erfolg' },
        source: 'asset',
        failure: null,
      },
      'browser',
    );
    announcements.announce({
      kind: 'build.updated',
      revision: 2,
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(announcements.polite()).toBe('Erfolg');
  });

  it('exposes both outlets as one state projection', () => {
    const { announcements } = setup();
    announcements.announce({
      kind: 'a',
      revision: 1,
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(announcements.state()).toEqual({
      assertive: '',
      polite: BUNDLED_ENGLISH['status.success'],
    });
  });

  it('forgets everything on reset', () => {
    const { announcements } = setup();
    const event = {
      kind: 'a',
      revision: 1,
      urgency: 'polite' as const,
      messageKey: 'status.success' as const,
    };
    announcements.announce(event);

    announcements.reset();

    expect(announcements.polite()).toBe('');
    expect(announcements.announce(event)).toBe(true);
  });
});
