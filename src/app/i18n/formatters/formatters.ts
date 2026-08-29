import { Injectable, inject } from '@angular/core';
import { LocaleStore } from '../locale.store';
import { MessageService } from '../message.service';

/**
 * The named formatting operations the application offers.
 *
 * Components request one of these by name and never construct an `Intl` object
 * or call an implicit `toLocaleString()`, so precision, unit behaviour and
 * timezone are decided centrally and once (localization contract, "Named
 * formatters").
 */
export type FormatterKind =
  | 'integer'
  | 'decimal'
  | 'percent'
  | 'duration'
  | 'metres'
  | 'kilometres'
  | 'bytes'
  | 'kilobytes'
  | 'date'
  | 'date-time'
  | 'relative-time'
  | 'collator'
  | 'display-name';

/**
 * Absolute timestamps are formatted in UTC.
 *
 * The explicit contract matters: a build, a journal entry and a saved record
 * are the same instant for every Commander, so rendering one in the viewer's
 * local zone would make two people reading the same build disagree about when
 * it happened.
 */
export const ABSOLUTE_TIMEZONE = 'UTC';

/** Where a duration stops being read in seconds and starts being read in minutes. */
const SECONDS_PER_MINUTE = 60;

/** One day, in milliseconds. Every longer unit below is a multiple of it. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The units a relative time is expressed in, longest first.
 *
 * The three longest are approximations and are meant to be: a month is not a
 * fixed span and a year is not either, so `365 / 12` days is the month a reader
 * means when they say "about a month ago". They are only ever chosen for a
 * distance that already exceeds them, so the approximation decides which word
 * is used and never how far away something is.
 *
 * Weeks, months and years joined the list on 2026-08-27, because the library's
 * edited column reads them: without them a record edited a month ago said
 * "31 days ago", where the canvas draws "1 mo ago" (FR-010).
 */
const RELATIVE_UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * DAY_MS],
  ['month', Math.round((365 / 12) * DAY_MS)],
  ['week', 7 * DAY_MS],
  ['day', DAY_MS],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

/** Raised when a value that is not a finite number reaches a numeric formatter. */
export class UnformattableValueError extends Error {
  constructor(kind: FormatterKind, value: unknown) {
    super(`A ${kind} formatter received a value that is not a finite number: ${String(value)}.`);
    this.name = 'UnformattableValueError';
  }
}

/**
 * Cached, locale-aware formatting.
 *
 * One `Intl` instance exists per (effective locale, operation, options) and is
 * reused — constructing them is expensive and a metrics panel formats hundreds
 * of values per render.
 *
 * Credits and light years deliberately do not go through `Intl` units: credits
 * are not an ISO currency and a light year is not a standard `Intl` unit.
 * Fabricating either would produce confidently wrong output, so both resolve
 * through a localized message pattern wrapping an `Intl`-formatted number.
 *
 * Null, invalid, incomplete, unavailable and semantic infinity are not
 * formatting problems — they are states, and they belong to the unavailable and
 * incomplete components. Sending one here raises rather than inventing a zero
 * (constitution IV: never fabricate values).
 */
@Injectable({ providedIn: 'root' })
export class Formatters {
  readonly #store = inject(LocaleStore);
  readonly #messages = inject(MessageService);
  readonly #cache = new Map<string, unknown>();

  /** The locale every operation below formats for. */
  get locale(): string {
    return this.#store.effectiveLocale();
  }

  /** A whole number or count. */
  integer(value: number): string {
    this.#assertFinite('integer', value);
    return this.#numberFormat('integer', { maximumFractionDigits: 0 }).format(value);
  }

  /** A number with a declared precision. The caller states the digits; there is no default guess. */
  decimal(value: number, fractionDigits: number): string {
    this.#assertFinite('decimal', value);
    return this.#numberFormat('decimal', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }

  /**
   * A percentage. The input contract is a **fraction**: `0.35` renders as 35%.
   *
   * Stated explicitly because the alternative convention is the single most
   * common source of a value being wrong by two orders of magnitude.
   */
  percent(fraction: number, fractionDigits = 0): string {
    this.#assertFinite('percent', fraction);
    return this.#numberFormat('percent', {
      style: 'percent',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(fraction);
  }

  /**
   * A duration in seconds, as canvas 1c sets one.
   *
   * Two readings, and the artboard draws both: `51 s` under a minute, `12:47`
   * at or above one. Which appears is the length of the duration rather than a
   * caller's choice, so a recovery that crosses a minute does not change shape
   * between two figures a reader is comparing.
   *
   * The seconds inside the second form are padded through `Intl` rather than
   * with a literal zero, because the padding digit belongs to the locale's own
   * numbering system.
   */
  duration(value: number): string {
    this.#assertFinite('duration', value);
    const seconds = Math.round(value);
    if (seconds < SECONDS_PER_MINUTE) {
      return this.#messages.message('format.seconds', { value: this.integer(seconds) });
    }
    return this.#messages.message('format.minutes', {
      minutes: this.integer(Math.floor(seconds / SECONDS_PER_MINUTE)),
      seconds: this.#numberFormat('duration', {
        minimumIntegerDigits: 2,
        maximumFractionDigits: 0,
      }).format(seconds % SECONDS_PER_MINUTE),
    });
  }

  /** A distance in metres, with the locale's own unit presentation. */
  metres(value: number, fractionDigits = 0): string {
    this.#assertFinite('metres', value);
    return this.#numberFormat('metres', {
      style: 'unit',
      unit: 'meter',
      unitDisplay: 'short',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }

  /** A distance in kilometres, with the locale's own unit presentation. */
  kilometres(value: number, fractionDigits = 0): string {
    this.#assertFinite('kilometres', value);
    return this.#numberFormat('kilometres', {
      style: 'unit',
      unit: 'kilometer',
      unitDisplay: 'short',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }

  /**
   * A payload size, in the locale's own byte units.
   *
   * Below a kilobyte the exact byte count is what a Commander needs — it is the
   * figure the 64-KiB gate is measured against — so it is stated exactly.
   * Above it, a rounded kilobyte reading is what the reference draws beside a
   * payload (canvas 1c, `exp-meta`), and an exact 68,514-byte figure there
   * would be precision nobody asked for.
   */
  bytes(value: number): string {
    this.#assertFinite('integer', value);
    if (Math.abs(value) < 1000) {
      return this.#numberFormat('bytes', {
        style: 'unit',
        unit: 'byte',
        unitDisplay: 'short',
        maximumFractionDigits: 0,
      }).format(value);
    }
    return this.#numberFormat('kilobytes', {
      style: 'unit',
      unit: 'kilobyte',
      unitDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value / 1000);
  }

  /** Credits, as a localized message pattern around a locale-formatted number. */
  credits(value: number): string {
    this.#assertFinite('integer', value);
    return this.#messages.message('format.credits', { value: this.integer(value) });
  }

  /** Light years, as a localized message pattern around a locale-formatted number. */
  lightYears(value: number, fractionDigits = 2): string {
    this.#assertFinite('decimal', value);
    return this.#messages.message('format.light-years', {
      value: this.decimal(value, fractionDigits),
    });
  }

  /** An absolute date in UTC. */
  date(value: Date): string {
    this.#assertValidDate(value);
    return this.#dateFormat('date', {
      dateStyle: 'medium',
      timeZone: ABSOLUTE_TIMEZONE,
    }).format(value);
  }

  /** An absolute date and time in UTC. */
  dateTime(value: Date): string {
    this.#assertValidDate(value);
    return this.#dateFormat('date-time', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: ABSOLUTE_TIMEZONE,
    }).format(value);
  }

  /**
   * How far `target` is from `from`, in the committed locale's own words.
   *
   * The unit is chosen by the distance rather than by the caller — days beyond
   * a day, hours beyond an hour, minutes below that — so a row counting down
   * does not shift between two shapes a reader is comparing. `Intl` supplies
   * the unit label and the direction, which is the point of using it: "in 6
   * days" and "vor 2 Stunden" are one call, and a count of days assembled in a
   * template would be an English string no catalogue could reach (principle
   * VI).
   *
   * Where the runtime has no `Intl.RelativeTimeFormat` at all, the absolute date
   * is given instead. It answers the same question less conveniently, in the
   * same locale, and inventing an English "in 6 days" there would be worse than
   * a date (localization contract, "Named formatters").
   */
  relativeTime(target: Date, from: Date): string {
    this.#assertValidDate(target);
    this.#assertValidDate(from);

    const difference = target.getTime() - from.getTime();
    const [unit, size] = RELATIVE_UNITS.find(([, span]) => Math.abs(difference) >= span) ??
      RELATIVE_UNITS[RELATIVE_UNITS.length - 1] ?? ['minute', 60 * 1000];

    const formatter = this.#relativeFormat();
    return formatter === null
      ? this.date(target)
      : formatter.format(Math.trunc(difference / size), unit);
  }

  /** A collator for sorting display text in the active locale. */
  collator(options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true }): Intl.Collator {
    return this.#cached('collator', options, () => new Intl.Collator(this.locale, options));
  }

  /**
   * The active locale's name for a language tag.
   *
   * Returns `null` rather than the raw code when the runtime cannot name it —
   * a bare tag is an identity, not a name, and must not become display text.
   */
  displayName(code: string, type: Intl.DisplayNamesOptions['type'] = 'language'): string | null {
    const names = this.#cached(
      'display-name',
      { type },
      () => new Intl.DisplayNames([this.locale], { type }),
    );
    try {
      const resolved = names.of(code);
      return resolved === undefined || resolved === code ? null : resolved;
    } catch {
      return null;
    }
  }

  /**
   * How many `Intl` instances are currently cached. Exposed for tests.
   *
   * One map holds them all — number formats, collators, display names, dates
   * and relative times — so this is never a count of one kind of formatter.
   */
  get cacheSize(): number {
    return this.#cache.size;
  }

  #numberFormat(kind: FormatterKind, options: Intl.NumberFormatOptions): Intl.NumberFormat {
    return this.#cached(kind, options, () => new Intl.NumberFormat(this.locale, options));
  }

  /**
   * The relative-time formatter, or `null` where the runtime has none.
   *
   * `numeric: 'auto'` so a locale that has a word for "yesterday" uses it
   * rather than counting to one.
   */
  #relativeFormat(): Intl.RelativeTimeFormat | null {
    const options: Intl.RelativeTimeFormatOptions = { numeric: 'auto' };
    return this.#cached('relative-time', options, () => {
      try {
        return new Intl.RelativeTimeFormat(this.locale, options);
      } catch {
        return null;
      }
    });
  }

  #dateFormat(kind: FormatterKind, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    return this.#cached(kind, options, () => new Intl.DateTimeFormat(this.locale, options));
  }

  /** Caches by effective locale, operation and options — the three things that change output. */
  #cached<T>(kind: FormatterKind, options: object, create: () => T): T {
    const key = `${this.locale}|${kind}|${JSON.stringify(options)}`;
    const existing = this.#cache.get(key);
    if (existing !== undefined) {
      return existing as T;
    }
    const created = create();
    this.#cache.set(key, created);
    return created;
  }

  #assertFinite(kind: FormatterKind, value: unknown): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new UnformattableValueError(kind, value);
    }
  }

  #assertValidDate(value: Date): void {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new UnformattableValueError('date', value);
    }
  }
}
