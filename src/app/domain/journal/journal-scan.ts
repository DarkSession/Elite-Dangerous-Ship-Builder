/**
 * Reading the game's own journal files.
 *
 * A journal is a log: one JSON object per line, written as the game plays. It is
 * not valid JSON as a whole, so nothing in `@elite-dangerous-almanac/core` can be
 * handed one — the package reads payloads, and a log is a container around them.
 *
 * This module owns that container and nothing inside it. It frames the lines,
 * reads the two fields that name a line rather than the loadout it carries — the
 * event name and the timestamp, both of which the package itself drops on import
 * — and hands each candidate payload to a reader the caller supplies. It parses
 * no loadout, resolves no identity, repairs no line and completes nothing.
 */

/**
 * The largest file this application will read, in bytes.
 *
 * A journal covering a long session runs to a few megabytes. The bound is well
 * above that and well below what reading a file into a string costs a phone.
 */
export const JOURNAL_FILE_LIMIT_BYTES = 25_000_000;

/**
 * A file the Commander chose.
 *
 * The browser's own `File` satisfies this, which is the point: the domain stays
 * free of the DOM, and the layer above hands it the real thing.
 */
export interface JournalFile {
  readonly name: string;
  readonly size: number;
  text(): Promise<string>;
}

/** One thing a reader made of one payload. */
export interface JournalRead<T> {
  /**
   * What makes this loadout the loadout it is.
   *
   * Two lines carrying the same key describe the same thing, and a journal
   * writes a loadout again every time a session starts, so the key is what stops
   * one loadout being offered five times.
   */
  readonly key: string;
  readonly value: T;
}

/** What a tool asks this module to look for. */
export interface JournalReader<T> {
  /**
   * The journal event names this reader takes, lower-cased.
   *
   * They are the container's own field, matched before a line is parsed, so a
   * journal's tens of thousands of unrelated lines cost one regular expression
   * each instead of a parse each.
   */
  readonly events: readonly string[];

  /**
   * Reads one framed payload.
   *
   * Several reads for one payload is ordinary: an exported file holds an array
   * of them. Nothing the reader refuses is guessed at here.
   */
  read(payload: unknown): readonly JournalRead<T>[];
}

/** One loadout a scan found, with the line's own timestamp beside it. */
export interface JournalEntry<T> {
  readonly key: string;
  /** When the game wrote the line, or empty where the line stated nothing. */
  readonly timestamp: string;
  readonly value: T;
}

/** What was read, for the sentence the layer states afterwards. */
export interface JournalScanReport {
  readonly fileCount: number;
  /** The file's name where exactly one was read, and `null` where several were. */
  readonly fileName: string | null;
  readonly eventCount: number;
}

/** Why a scan produced nothing. */
export type JournalScanFailure =
  | { readonly kind: 'noFiles' }
  | {
      readonly kind: 'fileTooLarge';
      readonly fileName: string;
      readonly sizeBytes: number;
      readonly limitBytes: number;
    }
  | { readonly kind: 'noEvents'; readonly fileNames: readonly string[] };

/** Everything a scan found, or the reason there is nothing. */
export type JournalScanResult<T> =
  | {
      readonly ok: true;
      readonly report: JournalScanReport;
      readonly entries: readonly JournalEntry<T>[];
    }
  | { readonly ok: false; readonly failure: JournalScanFailure };

/**
 * Reads one file's text.
 *
 * A file holds either one whole payload — an export another tool wrote — or a
 * log of them. The whole payload is tried first and handed over entire, because
 * an exported array is one document rather than a line each. Only when that
 * yields nothing is the text framed as a log.
 *
 * What comes back is ordered and deduplicated, which is what a caller reading
 * one text wants; reading several texts orders them again across the set.
 */
export function scanJournalText<T>(
  text: string,
  reader: JournalReader<T>,
): readonly JournalEntry<T>[] {
  const whole = readWholeDocument(text, reader);
  return orderJournalEntries(whole.length > 0 ? whole : readLog(text, reader));
}

/**
 * Reads the files a Commander chose, one at a time.
 *
 * One at a time and nothing kept: a file's text is released before the next is
 * read, so what a selection costs follows the loadouts it holds rather than the
 * bytes it was found in. The size bound is measured before a file is read, so an
 * over-sized file is refused rather than loaded and then rejected.
 */
export async function scanJournalFiles<T>(
  files: readonly JournalFile[],
  reader: JournalReader<T>,
): Promise<JournalScanResult<T>> {
  const chosen = files.filter((file) => file.size > 0);
  if (chosen.length === 0) {
    return { ok: false, failure: { kind: 'noFiles' } };
  }

  const oversized = chosen.find((file) => file.size > JOURNAL_FILE_LIMIT_BYTES);
  if (oversized !== undefined) {
    return {
      ok: false,
      failure: {
        kind: 'fileTooLarge',
        fileName: oversized.name,
        sizeBytes: oversized.size,
        limitBytes: JOURNAL_FILE_LIMIT_BYTES,
      },
    };
  }

  const found: JournalEntry<T>[] = [];
  for (const file of chosen) {
    let text: string;
    try {
      text = await file.text();
    } catch {
      // A file the browser could not read holds nothing this scan can use. The
      // report names how many files were read, so an unreadable one is not
      // silently counted as empty.
      continue;
    }
    found.push(...scanJournalText(text, reader));
  }

  const entries = orderJournalEntries(found);
  if (entries.length === 0) {
    return {
      ok: false,
      failure: { kind: 'noEvents', fileNames: chosen.map((file) => file.name) },
    };
  }

  const [first] = chosen;
  return {
    ok: true,
    report: {
      fileCount: chosen.length,
      fileName: chosen.length === 1 && first !== undefined ? first.name : null,
      eventCount: entries.length,
    },
    entries,
  };
}

/**
 * Newest first, each loadout once.
 *
 * A journal timestamp is ISO 8601 in UTC, so comparing the text compares the
 * instant. A line that stated no timestamp sorts last rather than first: nothing
 * is known about when it was written, and guessing would put it above lines that
 * say.
 */
export function orderJournalEntries<T>(
  entries: readonly JournalEntry<T>[],
): readonly JournalEntry<T>[] {
  const sorted = [...entries].sort((left, right) => {
    if (left.timestamp === right.timestamp) {
      return 0;
    }
    if (left.timestamp === '') {
      return 1;
    }
    if (right.timestamp === '') {
      return -1;
    }
    return right.timestamp.localeCompare(left.timestamp);
  });

  const seen = new Set<string>();
  return sorted.filter((entry) => {
    if (seen.has(entry.key)) {
      return false;
    }
    seen.add(entry.key);
    return true;
  });
}

/** The text as one document: an export, or a single event object. */
function readWholeDocument<T>(text: string, reader: JournalReader<T>): readonly JournalEntry<T>[] {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return [];
  }

  // A document that names its own event is held to it, exactly as a log line
  // is. One that names none — an export's envelope, or a bare event object — is
  // the reader's to accept or refuse.
  const event = containerEvent(payload);
  if (event !== '' && !reader.events.includes(event)) {
    return [];
  }

  return reader.read(payload).map((read) => ({ ...read, timestamp: containerTimestamp(payload) }));
}

/** The text as a log: one object per line, and most lines about something else. */
function readLog<T>(text: string, reader: JournalReader<T>): readonly JournalEntry<T>[] {
  const probe = eventProbe(reader.events);
  const entries: JournalEntry<T>[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.charAt(0) !== '{' || !probe.test(line)) {
      continue;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(line);
    } catch {
      // A line the log cut short, or one that is not an object after all.
      continue;
    }

    if (!reader.events.includes(containerEvent(payload))) {
      continue;
    }

    const timestamp = containerTimestamp(payload);
    for (const read of reader.read(payload)) {
      entries.push({ ...read, timestamp });
    }
  }

  return entries;
}

/**
 * The cheap test that keeps a 25 MB log affordable.
 *
 * It is a test on the line's text, not on a parsed field, and it decides only
 * whether a line is worth parsing. What a line actually is, is decided after the
 * parse, against the container's own `event` field.
 */
function eventProbe(events: readonly string[]): RegExp {
  return new RegExp(`"event"\\s*:\\s*"(?:${events.join('|')})"`, 'i');
}

/** The container's event name, lower-cased, or empty where it states none. */
function containerEvent(payload: unknown): string {
  const value = field(payload, 'event');
  return typeof value === 'string' ? value.toLowerCase() : '';
}

/** The container's timestamp, or empty where it states none. */
function containerTimestamp(payload: unknown): string {
  const value = field(payload, 'timestamp');
  return typeof value === 'string' ? value : '';
}

function field(payload: unknown, name: string): unknown {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  return (payload as Record<string, unknown>)[name];
}
