import { TestBed } from '@angular/core/testing';
import { provideIsolatedLocaleEnvironment } from './testing/localization-harness';
import { provideLocalization } from './i18n.providers';
import { BUNDLED_ENGLISH, type MessageKey } from './locale-registry';
import { LocaleStore } from './locale.store';
import { MessageService } from './message.service';

function setup(): { messages: MessageService; store: LocaleStore } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
  });
  return { messages: TestBed.inject(MessageService), store: TestBed.inject(LocaleStore) };
}

describe('MessageService', () => {
  it('resolves an application message for the active locale', () => {
    const { messages } = setup();

    expect(messages.message('app.name')).toBe('Nav Beacon');
    expect(messages.message('action.cancel')).toBe('Cancel');
  });

  it('interpolates language-neutral parameters', () => {
    const { messages } = setup();

    expect(
      messages.message('app.document-title', { page: 'Saved builds', app: 'Ship Builder' }),
    ).toBe('Saved builds · Ship Builder');
  });

  it('leaves a message with no parameters untouched', () => {
    const { messages } = setup();

    expect(messages.message('unavailable.value')).toBe('Unavailable');
  });

  it('resolves an unknown key to the generic unavailable message, never the key', () => {
    const { messages } = setup();

    const resolved = messages.message('no.such.key' as MessageKey);

    expect(resolved).toBe(BUNDLED_ENGLISH['message.unavailable']);
    expect(resolved).not.toContain('no.such.key');
  });

  it('resolves a blank value to the generic unavailable message', () => {
    const { messages, store } = setup();
    store.commitCandidate(
      {
        requested: 'de',
        catalogue: { ...BUNDLED_ENGLISH, 'action.cancel': '' },
        source: 'asset',
        failure: null,
      },
      'browser',
    );

    expect(messages.message('action.cancel')).toBe(BUNDLED_ENGLISH['message.unavailable']);
  });

  it('follows the committed catalogue when the locale changes', () => {
    const { messages, store } = setup();

    expect(messages.message('action.cancel')).toBe('Cancel');

    store.commitCandidate(
      {
        requested: 'de',
        catalogue: { ...BUNDLED_ENGLISH, 'action.cancel': 'Abbrechen' },
        source: 'asset',
        failure: null,
      },
      'browser',
    );

    expect(messages.message('action.cancel')).toBe('Abbrechen');
    expect(messages.locale()).toBe('de');
  });

  it('exposes the locale and direction the resolved text is actually in', () => {
    const { messages } = setup();

    expect(messages.locale()).toBe('en');
    expect(messages.direction()).toBe('ltr');
  });

  it('re-resolves a message signal when a locale commits', () => {
    const { messages, store } = setup();
    const label = messages.messageSignal('locale.self-name');

    expect(label()).toBe('English');

    store.commitCandidate(
      {
        requested: 'de',
        catalogue: { ...BUNDLED_ENGLISH, 'locale.self-name': 'Deutsch' },
        source: 'asset',
        failure: null,
      },
      'browser',
    );

    expect(label()).toBe('Deutsch');
  });

  it('never leaves an unmatched placeholder in resolved text', () => {
    const { messages } = setup();

    const resolved = messages.message('locale.fallback.notice', { locale: 'Deutsch' });

    expect(resolved).not.toContain('{{');
    expect(resolved).toContain('Deutsch');
  });
});
