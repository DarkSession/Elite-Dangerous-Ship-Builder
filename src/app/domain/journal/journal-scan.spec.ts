import {
  JOURNAL_FILE_LIMIT_BYTES,
  scanJournalFiles,
  scanJournalText,
  type JournalFile,
  type JournalReader,
} from './journal-scan';

/**
 * A reader standing in for a tool's own.
 *
 * It takes the container's word for what a line is and nothing else, which is
 * what the real readers do: everything below the event name belongs to the
 * package.
 */
const READER: JournalReader<string> = {
  events: ['loadout'],
  read: (payload) => {
    if (Array.isArray(payload)) {
      return payload.flatMap((entry) => READER.read(entry));
    }
    if (payload === null || typeof payload !== 'object') {
      return [];
    }
    const ship = (payload as { Ship?: unknown }).Ship;
    return typeof ship === 'string' ? [{ key: ship, value: ship }] : [];
  },
};

function line(ship: string, timestamp: string, event = 'Loadout'): string {
  return JSON.stringify({ timestamp, event, Ship: ship });
}

function file(name: string, text: string, size = text.length): JournalFile {
  return { name, size, text: () => Promise.resolve(text) };
}

describe('framing a journal file', () => {
  it('reads every loadout line of a log', async () => {
    const log = [
      line('anaconda', '2026-09-01T10:00:00Z'),
      JSON.stringify({ timestamp: '2026-09-01T10:01:00Z', event: 'Docked' }),
      line('python_nx', '2026-09-01T10:02:00Z'),
    ].join('\n');

    expect(scanJournalText(log, READER).map((entry) => entry.value)).toEqual([
      'python_nx',
      'anaconda',
    ]);
  });

  it('reads a file holding one whole payload rather than a log', () => {
    const document = JSON.stringify([{ Ship: 'krait_mkii' }, { Ship: 'orca' }]);

    expect(scanJournalText(document, READER).map((entry) => entry.value)).toEqual([
      'krait_mkii',
      'orca',
    ]);
  });

  it('skips a line the log cut short', () => {
    const log = `${line('adder', '2026-09-01T10:00:00Z')}\n{"timestamp":"2026-09-01T10:0`;

    expect(scanJournalText(log, READER).map((entry) => entry.value)).toEqual(['adder']);
  });

  it('reads a log written with CRLF line endings', () => {
    const log = [
      line('eagle', '2026-09-01T10:00:00Z'),
      line('hauler', '2026-09-01T09:00:00Z'),
    ].join('\r\n');

    expect(scanJournalText(log, READER).map((entry) => entry.value)).toEqual(['eagle', 'hauler']);
  });

  it('finds nothing in a log holding no event the reader asked for', () => {
    const log = [
      JSON.stringify({ timestamp: '2026-09-01T10:00:00Z', event: 'FSDJump' }),
      JSON.stringify({ timestamp: '2026-09-01T10:01:00Z', event: 'Docked' }),
    ].join('\n');

    expect(scanJournalText(log, READER)).toEqual([]);
  });

  it('refuses a line whose event field names something else, however it reads', () => {
    // The probe is a text test that decides what is worth parsing. What a line
    // is, is decided after the parse against the container's own field.
    const log = JSON.stringify({
      timestamp: '2026-09-01T10:00:00Z',
      event: 'SuitLoadout',
      Note: '"event":"Loadout"',
      Ship: 'anaconda',
    });

    expect(scanJournalText(log, READER)).toEqual([]);
  });

  it('reads a line that states no timestamp', () => {
    const log = JSON.stringify({ event: 'Loadout', Ship: 'vulture' });

    expect(scanJournalText(log, READER)).toEqual([
      { key: 'vulture', value: 'vulture', timestamp: '' },
    ]);
  });
});

describe('the size bound', () => {
  it('refuses a file over the bound before it is read', async () => {
    let read = false;
    const oversized: JournalFile = {
      name: 'Journal.huge.log',
      size: JOURNAL_FILE_LIMIT_BYTES + 1,
      text: () => {
        read = true;
        return Promise.resolve('');
      },
    };

    const result = await scanJournalFiles([oversized], READER);

    expect(read).toBe(false);
    expect(result).toEqual({
      ok: false,
      failure: {
        kind: 'fileTooLarge',
        fileName: 'Journal.huge.log',
        sizeBytes: JOURNAL_FILE_LIMIT_BYTES + 1,
        limitBytes: JOURNAL_FILE_LIMIT_BYTES,
      },
    });
  });

  it('refuses the whole selection when one file is over the bound', async () => {
    const valid = file('Journal.01.log', line('anaconda', '2026-09-01T10:00:00Z'));
    const oversized = file('Journal.02.log', '', JOURNAL_FILE_LIMIT_BYTES + 1);

    const result = await scanJournalFiles([valid, oversized], READER);

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.failure.kind).toBe('fileTooLarge');
  });

  it('reads a file exactly at the bound', async () => {
    const text = line('anaconda', '2026-09-01T10:00:00Z');
    const result = await scanJournalFiles(
      [file('Journal.01.log', text, JOURNAL_FILE_LIMIT_BYTES)],
      READER,
    );

    expect(result.ok).toBe(true);
  });

  it('takes as many files as the Commander chose', async () => {
    const files = Array.from({ length: 40 }, (_unused, index) =>
      file(`Journal.${index}.log`, line(`hull_${index}`, `2026-09-01T10:${index}:00Z`)),
    );

    const result = await scanJournalFiles(files, READER);

    expect(result.ok && result.entries.length).toBe(40);
  });

  it('has nothing to scan when every chosen file is empty', async () => {
    const result = await scanJournalFiles([file('Journal.01.log', '', 0)], READER);

    expect(result).toEqual({ ok: false, failure: { kind: 'noFiles' } });
  });

  it('reports the files it scanned when none of them holds an event', async () => {
    const result = await scanJournalFiles(
      [file('Journal.01.log', 'not json'), file('Journal.02.log', '{"event":"Docked"}')],
      READER,
    );

    expect(result).toEqual({
      ok: false,
      failure: { kind: 'noEvents', fileNames: ['Journal.01.log', 'Journal.02.log'] },
    });
  });

  it('keeps going when the browser cannot read one of the files', async () => {
    const unreadable: JournalFile = {
      name: 'Journal.01.log',
      size: 10,
      text: () => Promise.reject(new Error('unreadable')),
    };
    const readable = file('Journal.02.log', line('anaconda', '2026-09-01T10:00:00Z'));

    const result = await scanJournalFiles([unreadable, readable], READER);

    expect(result.ok && result.entries.map((entry) => entry.value)).toEqual(['anaconda']);
    expect(result.ok && result.report.fileCount).toBe(2);
  });
});

describe('ordering and duplicates', () => {
  it('lists a loadout two overlapping files both hold exactly once', async () => {
    const shared = line('anaconda', '2026-09-01T10:00:00Z');
    const result = await scanJournalFiles(
      [
        file('Journal.01.log', [shared, line('orca', '2026-09-01T09:00:00Z')].join('\n')),
        file('Journal.02.log', [shared, line('adder', '2026-09-01T11:00:00Z')].join('\n')),
      ],
      READER,
    );

    expect(result.ok && result.entries.map((entry) => entry.value)).toEqual([
      'adder',
      'anaconda',
      'orca',
    ]);
  });

  it('keeps the newest of two lines describing one loadout', async () => {
    const log = [
      line('anaconda', '2026-09-01T09:00:00Z'),
      line('anaconda', '2026-09-03T09:00:00Z'),
    ].join('\n');

    expect(scanJournalText(log, READER)).toEqual([
      { key: 'anaconda', value: 'anaconda', timestamp: '2026-09-03T09:00:00Z' },
    ]);
  });

  it('sorts a line that states no timestamp below the lines that do', () => {
    const log = [
      JSON.stringify({ event: 'Loadout', Ship: 'undated' }),
      line('dated', '2026-01-01T00:00:00Z'),
    ].join('\n');

    expect(scanJournalText(log, READER).map((entry) => entry.value)).toEqual(['dated', 'undated']);
  });
});

describe('what a scan reports', () => {
  it('names the one file it read', async () => {
    const result = await scanJournalFiles(
      [
        file(
          'Journal.2026-09-01T100000.01.log',
          [line('anaconda', '2026-09-01T10:00:00Z'), line('orca', '2026-09-01T11:00:00Z')].join(
            '\n',
          ),
        ),
      ],
      READER,
    );

    expect(result.ok && result.report).toEqual({
      fileCount: 1,
      fileName: 'Journal.2026-09-01T100000.01.log',
      eventCount: 2,
    });
  });

  it('counts the files rather than naming one when several were read', async () => {
    const result = await scanJournalFiles(
      [
        file('Journal.01.log', line('anaconda', '2026-09-01T10:00:00Z')),
        file('Journal.02.log', line('orca', '2026-09-01T11:00:00Z')),
        file('Journal.03.log', line('adder', '2026-09-01T12:00:00Z')),
      ],
      READER,
    );

    expect(result.ok && result.report).toEqual({ fileCount: 3, fileName: null, eventCount: 3 });
  });
});
