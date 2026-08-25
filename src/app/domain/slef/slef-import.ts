import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import type { SlefEntry } from '@elite-dangerous-almanac/core/ships/slef';
import { normalizeIncomingBuild } from '../build/build-ingress-normalizer';
import { classifyConstructionFailure, classifyNormalizationFailure } from './slef-import-failures';
import {
  SLEF_IMPORT_LIMIT_BYTES,
  type EngineeringQualityCompletion,
  type SlefImportCandidate,
  type SlefImportFailure,
  type SlefRequestToken,
  type SlefSourceAttribution,
} from './slef-import.models';

/** Either a detached, fully normalized build, or the reason there is none. */
export type SlefImportResult =
  | { readonly ok: true; readonly candidate: SlefImportCandidate }
  | { readonly ok: false; readonly failure: SlefImportFailure };

/**
 * One pasted string, taken as far as a candidate — and no further.
 *
 * Nothing here touches the active build. The whole pipeline runs on a detached
 * loadout the Commander is not looking at, so a refusal at any step costs them
 * nothing: the build on screen, its revision, its records, its fragment and its
 * history are all exactly where they were (import contract, "Atomicity").
 *
 * The order of the first two gates is not incidental. The size is measured
 * against the *original* string before anything else happens, so a 90-megabyte
 * paste is refused before the package is handed it — and the bytes that were
 * measured are the bytes that get inspected, because nothing trims, normalizes
 * or re-serializes in between.
 *
 * The application reads no format. `inspectSlef` gets the exact string; there
 * is no `JSON.parse`, no shape sniffing, no "looks like a journal event"
 * heuristic and no repair of anything the package rejects.
 */
export function importSlef(text: string, requestToken: SlefRequestToken): SlefImportResult {
  // 1. Size, on the original bytes, before any package work.
  const utf8Bytes = new TextEncoder().encode(text).byteLength;
  if (utf8Bytes > SLEF_IMPORT_LIMIT_BYTES) {
    return refuse({ kind: 'tooLarge', utf8Bytes, limitBytes: SLEF_IMPORT_LIMIT_BYTES });
  }

  // 2. Nothing to import. Checked without transforming the draft.
  if (text.trim().length === 0) {
    return refuse({ kind: 'empty' });
  }

  // 3. Inspection, by the package, on the exact string.
  let inspection;
  try {
    inspection = inspectSlef(text);
  } catch {
    // The package threw. Its prose is not read, displayed or parsed for facts;
    // a `SyntaxError` from a JSON reader means one thing and the application
    // says that one thing in its own words (research, decision 4).
    return refuse({ kind: 'syntax' });
  }

  // 4. Exactly one observed entry — valid or rejected — or nothing happens.
  const observed = inspection.entries.length + inspection.diagnostics.length;
  if (observed !== 1) {
    return refuse({ kind: 'cardinality', observed, diagnostics: inspection.diagnostics });
  }

  // 5. The one observed entry was the rejected one.
  const [entry] = inspection.entries;
  if (entry === undefined) {
    return refuse({ kind: 'diagnostics', diagnostics: inspection.diagnostics });
  }

  return construct(entry, requestToken);
}

/**
 * Steps 6 to 10, through feature 002's one ingress gate.
 *
 * The gate owns the ordering: record what the source said about partial rolls,
 * construct through the package — which refuses an unknown hull and returns
 * every fixed mount already populated — correlate, then complete. Feature 004
 * supplies the entry and reads the answer. A SLEF-only normalization loop here
 * is how one ingress path ends up skipping a check the others make (import
 * contract, "Normalization boundary").
 */
function construct(entry: SlefEntry, requestToken: SlefRequestToken): SlefImportResult {
  const ingress = normalizeIncomingBuild(entry.data);

  if (ingress.kind === 'unusable') {
    return refuse(classifyConstructionFailure(entry.data.Ship));
  }
  if (ingress.kind === 'refused') {
    return refuse(classifyNormalizationFailure(ingress.failures));
  }

  // Only now: every figure below describes a finished build.
  return {
    ok: true,
    candidate: {
      loadout: ingress.candidate,
      sourceAttribution: attribution(entry),
      qualityCompletions: ingress.notices.map((notice): EngineeringQualityCompletion => ({
        slotKey: notice.slotKey,
        moduleSymbol: notice.moduleSymbol,
        blueprintFdname: notice.blueprintFdname,
        previousQuality: notice.previousQuality,
        quality: notice.quality,
      })),
      validation: ingress.candidate.validation(),
      requestToken,
    },
  };
}

/**
 * Who the envelope said produced the entry.
 *
 * A bare journal event arrives with the package's own empty synthetic header,
 * and so does an envelope whose producer wrote empty strings. The two are not
 * told apart here: guessing which kind of input this was from an absence would
 * be a classification the package deliberately does not make (data model,
 * "SlefImportCandidate").
 */
function attribution(entry: SlefEntry): SlefSourceAttribution | null {
  const appName = entry.header.appName;
  if (typeof appName !== 'string' || appName.length === 0) {
    return null;
  }
  return { appName, appVersion: String(entry.header.appVersion) };
}

function refuse(failure: SlefImportFailure): SlefImportResult {
  return { ok: false, failure };
}
