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
  | 'metres'
  | 'kilometres'
  | 'date'
  | 'date-time'
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

  /** How many `Intl` instances are currently cached. Exposed for tests. */
  get cacheSize(): number {
    return this.#cache.size;
  }

  #numberFormat(kind: FormatterKind, options: Intl.NumberFormatOptions): Intl.NumberFormat {
    return this.#cached(kind, options, () => new Intl.NumberFormat(this.locale, options));
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
