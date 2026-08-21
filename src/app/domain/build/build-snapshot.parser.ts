import {
  BUILD_SNAPSHOT_FORMAT,
  BUILD_SNAPSHOT_VERSION,
  type BuildSnapshotV1,
  type EngineeringSnapshotV1,
  type PreEngineeredIdentityV1,
  type SnapshotModuleV1,
} from './build-snapshot';

/**
 * Why a stored value is not a snapshot this build can open.
 *
 * `unsupported-version` is separate from `malformed` because the two lead
 * somewhere different: a newer version is a record this build is too old to
 * read and must be retained byte-for-byte, while a malformed one is broken
 * (persistence contract, "Version and migration behavior").
 */
export type SnapshotParseFailure = 'malformed' | 'unsupported-version';

export type SnapshotParseResult =
  | { readonly ok: true; readonly snapshot: BuildSnapshotV1 }
  | { readonly ok: false; readonly failure: SnapshotParseFailure; readonly reason: string };

/**
 * Reads a stored snapshot as untrusted input.
 *
 * Browser bytes are untrusted even when this application wrote them: another
 * tab, another version, a hand-edited store or a partially written value can
 * all produce something that is JSON but is not a build. Every discriminant,
 * scalar and bound is checked before any of it reaches the package.
 */
export function parseBuildSnapshotV1(value: unknown): SnapshotParseResult {
  if (!isRecord(value)) {
    return failed('malformed', 'The snapshot is not an object.');
  }
  if (value['format'] !== BUILD_SNAPSHOT_FORMAT) {
    return failed('malformed', 'The value does not carry the build-snapshot format marker.');
  }
  if (value['version'] !== BUILD_SNAPSHOT_VERSION) {
    return typeof value['version'] === 'number' && value['version'] > BUILD_SNAPSHOT_VERSION
      ? failed('unsupported-version', 'The snapshot was written by a newer version.')
      : failed('malformed', 'The snapshot version is not a supported value.');
  }

  const shipSymbol = value['shipSymbol'];
  if (!isNonEmptyString(shipSymbol)) {
    return failed('malformed', 'The snapshot names no hull.');
  }
  if (!isNullableString(value['shipName']) || !isNullableString(value['shipIdent'])) {
    return failed('malformed', 'A ship label is neither a string nor null.');
  }

  const rawModules = value['modules'];
  if (!Array.isArray(rawModules)) {
    return failed('malformed', 'The snapshot carries no module list.');
  }

  const modules: SnapshotModuleV1[] = [];
  const seenSlots = new Set<string>();

  for (const entry of rawModules) {
    const parsed = parseModule(entry);
    if (!parsed.ok) {
      return parsed;
    }
    // Slot keys are matched case-insensitively by the package, so two entries
    // differing only in case name one mount twice and one of them would be
    // silently dropped on reconstruction.
    const identity = parsed.module.slot.toLowerCase();
    if (seenSlots.has(identity)) {
      return failed('malformed', `Two modules claim the slot "${parsed.module.slot}".`);
    }
    seenSlots.add(identity);
    modules.push(parsed.module);
  }

  return {
    ok: true,
    snapshot: {
      format: BUILD_SNAPSHOT_FORMAT,
      version: BUILD_SNAPSHOT_VERSION,
      shipSymbol,
      shipName: (value['shipName'] as string | null | undefined) ?? null,
      shipIdent: (value['shipIdent'] as string | null | undefined) ?? null,
      modules,
    },
  };
}

type ModuleResult =
  | { readonly ok: true; readonly module: SnapshotModuleV1 }
  | { readonly ok: false; readonly failure: SnapshotParseFailure; readonly reason: string };

function parseModule(value: unknown): ModuleResult {
  if (!isRecord(value)) {
    return failed('malformed', 'A module entry is not an object.');
  }

  const slot = value['slot'];
  const symbol = value['symbol'];
  if (!isNonEmptyString(slot) || !isNonEmptyString(symbol)) {
    return failed('malformed', 'A module entry has no slot key or no module symbol.');
  }

  const enabled = value['enabled'];
  if (enabled !== null && typeof enabled !== 'boolean') {
    return failed('malformed', `The enabled state of "${slot}" is neither a boolean nor null.`);
  }

  const priority = value['priority'];
  if (priority !== null && !isPriority(priority)) {
    return failed('malformed', `The power priority of "${slot}" is outside 0–4.`);
  }

  const preEngineered = parsePreEngineered(value['preEngineered'], slot);
  if (!preEngineered.ok) {
    return preEngineered;
  }

  const engineering = parseEngineering(value['engineering'], slot);
  if (!engineering.ok) {
    return engineering;
  }

  return {
    ok: true,
    module: {
      slot,
      symbol,
      enabled: enabled as boolean | null,
      priority: priority as number | null,
      preEngineered: preEngineered.value,
      engineering: engineering.value,
    },
  };
}

type FieldResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly failure: SnapshotParseFailure; readonly reason: string };

function parsePreEngineered(
  value: unknown,
  slot: string,
): FieldResult<PreEngineeredIdentityV1 | null> {
  if (value === null || value === undefined) {
    return { ok: true, value: null };
  }
  if (!isRecord(value)) {
    return failed('malformed', `The pre-engineered identity of "${slot}" is not an object.`);
  }

  const symbol = value['symbol'];
  const blueprint = value['blueprint'];
  const acquisition = value['acquisition'];
  const grade = value['grade'];
  const experimental = value['experimental'];

  if (!isNonEmptyString(symbol) || !isNonEmptyString(blueprint) || !isNonEmptyString(acquisition)) {
    return failed('malformed', `The pre-engineered identity of "${slot}" is incomplete.`);
  }
  if (!isGrade(grade)) {
    return failed('malformed', `The pre-engineered grade of "${slot}" is outside 1–5.`);
  }
  if (!isNullableString(experimental)) {
    return failed('malformed', `The pre-engineered effect of "${slot}" is not an identity.`);
  }

  return {
    ok: true,
    value: {
      symbol,
      blueprint,
      grade,
      acquisition,
      experimental: (experimental as string | null | undefined) ?? null,
    },
  };
}

function parseEngineering(value: unknown, slot: string): FieldResult<EngineeringSnapshotV1 | null> {
  if (value === null || value === undefined) {
    return { ok: true, value: null };
  }
  if (!isRecord(value)) {
    return failed('malformed', `The engineering of "${slot}" is not an object.`);
  }

  const blueprint = value['blueprint'];
  const grade = value['grade'];
  const quality = value['quality'];
  const experimental = value['experimental'];

  if (!isNullableString(blueprint) || !isNullableString(experimental)) {
    return failed('malformed', `An engineering identity on "${slot}" is not a string or null.`);
  }
  if (!isGrade(grade)) {
    return failed('malformed', `The engineering grade of "${slot}" is outside 1–5.`);
  }
  if (typeof quality !== 'number' || !Number.isFinite(quality) || quality < 0 || quality > 1) {
    return failed('malformed', `The engineering quality of "${slot}" is outside 0–1.`);
  }

  return {
    ok: true,
    value: {
      blueprint: (blueprint as string | null | undefined) ?? null,
      grade,
      quality,
      experimental: (experimental as string | null | undefined) ?? null,
    },
  };
}

function failed(
  failure: SnapshotParseFailure,
  reason: string,
): { readonly ok: false; readonly failure: SnapshotParseFailure; readonly reason: string } {
  return { ok: false, failure, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNullableString(value: unknown): boolean {
  return value === null || value === undefined || typeof value === 'string';
}

function isPriority(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 4;
}

function isGrade(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}
