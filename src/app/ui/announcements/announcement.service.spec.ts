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

    announcements.announce({
      kind: 'build.invalid',
      urgency: 'assertive',
      messageKey: 'error.blocking.summary',
      params: { reason: 'power draw exceeds output' },
    });

    expect(announcements.assertive()).toContain('power draw exceeds output');
    expect(announcements.polite()).toBe('');
  });

  it('publishes a settled change politely', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'build.updated',
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['status.success']);
    expect(announcements.assertive()).toBe('');
  });

  it('announces the second of two events spoken in identical words', () => {
    const { announcements } = setup();
    const failure = {
      kind: 'navigation.failed',
      urgency: 'polite' as const,
      messageKey: 'navigation.failed.notice' as const,
    };

    announcements.announce(failure);
    const first = announcements.politeEvent();
    announcements.announce(failure);
    const second = announcements.politeEvent();

    // Two navigations that failed say one sentence. The text alone cannot tell
    // the outlet that anything happened, and a live region that did not change
    // is one a reader is not told about again — so what the outlet is handed
    // carries which event it is, and the second reaches a reader (011/FR-009).
    expect(first?.text).toBe(BUNDLED_ENGLISH['navigation.failed.notice']);
    expect(second?.text).toBe(first?.text);
    expect(second?.identity).not.toBe(first?.identity);
  });

  it('announces every request it is given, for one kind at one urgency', () => {
    const { announcements } = setup();
    const event = {
      kind: 'catalogue.match-count',
      urgency: 'polite' as const,
      messageKey: 'status.success' as const,
    };

    announcements.announce(event);
    const first = announcements.politeEvent();
    announcements.announce(event);
    const second = announcements.politeEvent();
    announcements.announce(event);

    // Nothing here decides that a caller has spoken too often. A caller that
    // must not be heard twice decides that before it calls, because the facts
    // that answer it are the caller's (011/FR-009).
    expect(second?.identity).not.toBe(first?.identity);
    expect(announcements.politeEvent()?.identity).not.toBe(second?.identity);
  });

  it('treats the two urgencies as separate outlets', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'build.state',
      urgency: 'polite',
      messageKey: 'status.success',
    });
    announcements.announce({
      kind: 'build.state',
      urgency: 'assertive',
      messageKey: 'status.error',
    });

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['status.success']);
    expect(announcements.assertive()).toBe(BUNDLED_ENGLISH['status.error']);
  });

  it('carries the kind in the identity, so one outlet can tell two events apart', () => {
    const { announcements } = setup();

    announcements.announce({
      kind: 'power.updated',
      urgency: 'polite',
      messageKey: 'status.success',
    });
    const power = announcements.politeEvent();
    announcements.announce({
      kind: 'mass.updated',
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(power?.identity).toContain('power.updated');
    expect(announcements.politeEvent()?.identity).toContain('mass.updated');
  });

  it('clears outlet text on a locale switch without replaying old events', () => {
    const { announcements, store } = setup();
    announcements.announce({
      kind: 'build.updated',
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

    expect(announcements.polite()).toBe('');
  });

  it('keeps the sequence running across a locale switch', () => {
    const { announcements, store } = setup();
    announcements.announce({
      kind: 'build.updated',
      urgency: 'polite',
      messageKey: 'status.success',
    });
    const before = announcements.politeEvent();

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
      urgency: 'polite',
      messageKey: 'status.success',
    });

    // A reused number would hand the outlet an event it has already drawn, and
    // the region would not change for the one that followed the switch.
    expect(announcements.politeEvent()?.identity).not.toBe(before?.identity);
    expect(announcements.polite()).toBe('Erfolg');
  });

  it('exposes both outlets as one state projection', () => {
    const { announcements } = setup();
    announcements.announce({
      kind: 'a',
      urgency: 'polite',
      messageKey: 'status.success',
    });

    expect(announcements.state()).toEqual({
      assertive: '',
      polite: BUNDLED_ENGLISH['status.success'],
    });
  });

  it('forgets everything on reset, the sequence included', () => {
    const { announcements } = setup();
    const event = { kind: 'a', urgency: 'polite' as const, messageKey: 'status.success' as const };
    announcements.announce(event);
    const first = announcements.politeEvent()?.identity;

    announcements.reset();

    expect(announcements.polite()).toBe('');
    expect(announcements.politeEvent()).toBeNull();

    // The sequence is the whole of the policy's memory, so a reset empties it
    // too: the next event is the first one again. `clearOutlets()` is the
    // opposite case and is read above — it empties what is held and leaves the
    // number where it stands, because the outlet has already drawn it.
    announcements.announce(event);
    expect(announcements.politeEvent()?.identity).toBe(first);
  });
});
