import { TestBed } from '@angular/core/testing';
import { provideIsolatedLocaleEnvironment } from '../testing/localization-harness';
import { provideLocalization } from '../i18n.providers';
import { BUNDLED_ENGLISH } from '../locale-registry';
import { LocaleStore } from '../locale.store';
import { ABSOLUTE_TIMEZONE, Formatters, UnformattableValueError } from './formatters';

const GERMAN = { ...BUNDLED_ENGLISH, 'format.light-years': '{{value}} Lj' };

function setup(locale: 'en' | 'de' = 'en'): Formatters {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
  });
  const store = TestBed.inject(LocaleStore);
  if (locale === 'de') {
    store.commitCandidate(
      { requested: 'de', catalogue: GERMAN, source: 'asset', failure: null },
      'browser',
    );
  } else {
    store.commitBundledEnglish();
  }
  return TestBed.inject(Formatters);
}

/** Reads the semantic parts of a formatted number rather than pinning a whole string. */
function partsOf(locale: string, value: number, options: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options)
    .formatToParts(value)
    .map((part) => ({ type: part.type, value: part.value }));
}

describe('Formatters', () => {
  it('formats integers for the active locale', () => {
    expect(setup('en').integer(1234567)).toBe(
      partsOf('en', 1234567, { maximumFractionDigits: 0 })
        .map((p) => p.value)
        .join(''),
    );
  });

  it('uses the German grouping and decimal separators', () => {
    const german = setup('de');

    const decimal = german.decimal(1234.5, 1);
    const parts = partsOf('de', 1234.5, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

    expect(decimal).toBe(parts.map((p) => p.value).join(''));
    expect(parts.find((p) => p.type === 'decimal')?.value).toBe(',');
    expect(parts.find((p) => p.type === 'group')?.value).toBe('.');
  });

  it('honours the declared decimal precision exactly', () => {
    const formatters = setup('en');

    expect(formatters.decimal(1.5, 3)).toBe('1.500');
    expect(formatters.decimal(1.23456, 2)).toBe('1.23');
  });

  it('treats a percentage input as a fraction', () => {
    const formatters = setup('en');
    const parts = new Intl.NumberFormat('en', { style: 'percent' }).formatToParts(0.35);

    expect(formatters.percent(0.35)).toBe(parts.map((p) => p.value).join(''));
    expect(parts.some((p) => p.type === 'percentSign')).toBe(true);
    expect(parts.find((p) => p.type === 'integer')?.value).toBe('35');
  });

  it('formats percentages with declared precision', () => {
    expect(setup('en').percent(0.1234, 1)).toContain('12.3');
  });

  it('formats metres and kilometres with the locale unit presentation', () => {
    const english = setup('en');

    expect(english.metres(250)).toContain('250');
    expect(english.metres(250)).toMatch(/m/);
    expect(english.kilometres(12)).toContain('12');
    expect(english.kilometres(12)).toMatch(/km/);
  });

  it('uses the German unit presentation', () => {
    const german = setup('de');
    const expected = new Intl.NumberFormat('de', {
      style: 'unit',
      unit: 'kilometer',
      unitDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(1200);

    expect(german.kilometres(1200)).toBe(expected);
  });

  it('formats credits through a localized message pattern, not an ISO currency', () => {
    const formatters = setup('en');

    const credits = formatters.credits(1500000);

    expect(credits).toContain('CR');
    expect(credits).toContain(formatters.integer(1500000));
    // Not a currency: no currency symbol is introduced.
    expect(credits).not.toContain('$');
    expect(credits).not.toContain('€');
  });

  it('formats credits with the German number presentation', () => {
    const german = setup('de');

    expect(german.credits(1500000)).toBe(`${german.integer(1500000)} CR`);
  });

  it('formats light years through a localized message pattern', () => {
    const english = setup('en');

    expect(english.lightYears(20.45)).toBe('20.45 ly');
  });

  it('uses the German light-year unit and number presentation', () => {
    const german = setup('de');

    expect(german.lightYears(20.45)).toBe(`${german.decimal(20.45, 2)} Lj`);
    expect(german.lightYears(20.45)).toContain('Lj');
  });

  it('reads a duration under a minute in seconds', () => {
    const english = setup('en');

    expect(english.duration(51)).toBe('51 s');
  });

  it('reads a duration of a minute or more as minutes and padded seconds', () => {
    const english = setup('en');

    expect(english.duration(767)).toBe('12:47');
    expect(english.duration(605)).toBe('10:05');
    expect(english.duration(60)).toBe('1:00');
  });

  it('rounds to the second rather than printing a fraction of one', () => {
    const english = setup('en');

    expect(english.duration(50.6)).toBe('51 s');
  });

  it('uses the German number presentation for a duration', () => {
    const german = setup('de');

    expect(german.duration(51)).toBe(`${german.integer(51)} s`);
    expect(german.duration(767)).toBe('12:47');
  });

  it('formats absolute dates in UTC, not the viewer timezone', () => {
    const formatters = setup('en');
    const instant = new Date(Date.UTC(3311, 0, 15, 23, 30));

    const expected = new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeZone: ABSOLUTE_TIMEZONE,
    }).format(instant);

    expect(formatters.date(instant)).toBe(expected);
  });

  it('formats absolute date and time in UTC', () => {
    const formatters = setup('en');
    const instant = new Date(Date.UTC(3311, 0, 15, 23, 30));

    expect(formatters.dateTime(instant)).toBe(
      new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: ABSOLUTE_TIMEZONE,
      }).format(instant),
    );
  });

  it('formats dates for the active locale', () => {
    const german = setup('de');
    const instant = new Date(Date.UTC(3311, 0, 15));

    expect(german.date(instant)).toBe(
      new Intl.DateTimeFormat('de', {
        dateStyle: 'medium',
        timeZone: ABSOLUTE_TIMEZONE,
      }).format(instant),
    );
  });

  it('supplies a collator that sorts in the active locale', () => {
    const german = setup('de');

    const sorted = ['Ölfeld', 'Anaconda', 'Zorgon'].sort(german.collator().compare);

    expect(sorted[0]).toBe('Anaconda');
    expect(sorted).toContain('Ölfeld');
  });

  it('sorts numerically within text when asked', () => {
    const formatters = setup('en');

    expect(['Slot 10', 'Slot 2'].sort(formatters.collator().compare)).toEqual([
      'Slot 2',
      'Slot 10',
    ]);
  });

  it('names a language in the active locale', () => {
    expect(setup('en').displayName('de')).toBe('German');
    expect(setup('de').displayName('de')).toBe('Deutsch');
  });

  it('returns null rather than echoing a code it cannot name', () => {
    expect(setup('en').displayName('zzzz')).toBeNull();
  });

  it('caches one Intl instance per locale, operation and options', () => {
    const formatters = setup('en');

    formatters.integer(1);
    formatters.integer(2);
    formatters.integer(3);

    expect(formatters.cacheSize).toBe(1);

    formatters.decimal(1, 2);
    expect(formatters.cacheSize).toBe(2);

    formatters.decimal(1, 3);
    expect(formatters.cacheSize).toBe(3);
  });

  it('returns the same collator instance for the same options', () => {
    const formatters = setup('en');

    expect(formatters.collator()).toBe(formatters.collator());
  });

  it('caches separately per effective locale', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    const store = TestBed.inject(LocaleStore);
    const formatters = TestBed.inject(Formatters);

    formatters.integer(1);
    expect(formatters.cacheSize).toBe(1);

    store.commitCandidate(
      { requested: 'de', catalogue: GERMAN, source: 'asset', failure: null },
      'browser',
    );
    formatters.integer(1);

    expect(formatters.cacheSize).toBe(2);
  });

  describe('values that are states, not numbers', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['NaN', Number.NaN],
      ['positive infinity', Number.POSITIVE_INFINITY],
      ['negative infinity', Number.NEGATIVE_INFINITY],
      ['a string', '12'],
    ])('refuses to format %s rather than inventing a zero', (_label, value) => {
      const formatters = setup('en');

      expect(() => formatters.integer(value as number)).toThrow(UnformattableValueError);
      expect(() => formatters.decimal(value as number, 2)).toThrow(UnformattableValueError);
      expect(() => formatters.percent(value as number)).toThrow(UnformattableValueError);
      expect(() => formatters.metres(value as number)).toThrow(UnformattableValueError);
      expect(() => formatters.kilometres(value as number)).toThrow(UnformattableValueError);
      expect(() => formatters.credits(value as number)).toThrow(UnformattableValueError);
      expect(() => formatters.lightYears(value as number)).toThrow(UnformattableValueError);
      expect(() => formatters.duration(value as number)).toThrow(UnformattableValueError);
    });

    it('refuses an invalid date', () => {
      const formatters = setup('en');

      expect(() => formatters.date(new Date('not a date'))).toThrow(UnformattableValueError);
      expect(() => formatters.dateTime(new Date('not a date'))).toThrow(UnformattableValueError);
    });

    it('names the operation and the value in the failure', () => {
      const formatters = setup('en');

      expect(() => formatters.percent(Number.NaN)).toThrow(/percent/);
    });
  });
});
