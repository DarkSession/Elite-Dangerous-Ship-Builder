import { toStoredLoadout } from '../equipment/loadout/stored-loadout.serializer';
import type { EquipmentLoadout } from '../equipment/loadout-link/equipment-loadout';
import type { BuildSnapshotV1 } from '../ships/build/build-snapshot';
import {
  LOCAL_RECORD_FORMAT,
  LOCAL_RECORD_VERSION,
  type LocalRecord,
  type LocalRecordKind,
  type RecordSource,
  type RecordValidation,
} from './local-record';

/**
 * What a caller supplies as the record's contents.
 *
 * One field per tool rather than a shared "payload" bag: the two carry
 * different things, and a union is what makes it impossible to write a ship
 * record with a loadout in it.
 */
export type RecordPayload =
  | {
      readonly tool: 'ship';
      readonly build: BuildSnapshotV1;
      readonly validation: RecordValidation;
    }
  | { readonly tool: 'equipment'; readonly loadout: EquipmentLoadout };

/** Everything a caller supplies to write one record. */
export interface RecordDraft {
  readonly id: string;
  readonly kind: LocalRecordKind;
  readonly revisionId: string;
  readonly createdAt: string;
  readonly modifiedAt: string;
  readonly name: string | null;
  readonly note: string | null;
  readonly sourceNamed: RecordSource | null;
  readonly payload: RecordPayload;
}

/**
 * Builds the record that will be stored, field by field.
 *
 * An allowlist rather than a spread. The difference matters: a spread of a
 * larger object would carry whatever else happened to be on it, and this is
 * the boundary that keeps calculated values, catalogue facts and prices out of
 * browser storage. Adding a field here is a decision someone has to make on
 * purpose (persistence contract, "Boundary exclusions").
 */
export function toLocalRecord(draft: RecordDraft): LocalRecord {
  const envelope = {
    format: LOCAL_RECORD_FORMAT,
    version: LOCAL_RECORD_VERSION,
    id: draft.id,
    kind: draft.kind,
    revisionId: draft.revisionId,
    createdAt: draft.createdAt,
    modifiedAt: draft.modifiedAt,
    name: draft.name,
    note: draft.note,
    sourceNamed:
      draft.sourceNamed === null
        ? null
        : {
            recordId: draft.sourceNamed.recordId,
            baseRevisionId: draft.sourceNamed.baseRevisionId,
          },
  } as const;

  if (draft.payload.tool === 'equipment') {
    const loadout = toStoredLoadout(draft.payload.loadout);
    return {
      ...envelope,
      tool: 'equipment',
      // Read from the loadout itself rather than taken from the caller, so the
      // two cannot disagree.
      suitFamily: loadout.suitFamily,
      loadout,
    };
  }

  return {
    ...envelope,
    tool: 'ship',
    hullSymbol: draft.payload.build.shipSymbol,
    validation: {
      valid: draft.payload.validation.valid,
      complete: draft.payload.validation.complete,
    },
    build: toStoredBuild(draft.payload.build),
  };
}

/** The exact JSON that goes into storage, in one call. */
export function serializeLocalRecord(draft: RecordDraft): string {
  return JSON.stringify(toLocalRecord(draft));
}

/**
 * The snapshot, rebuilt through its own allowlist.
 *
 * The serializer does not trust that what it was handed is a snapshot and
 * nothing more: a caller could pass an object that reconstructed a build *and*
 * carried a calculated figure alongside it, and a spread would store both.
 */
function toStoredBuild(build: BuildSnapshotV1): BuildSnapshotV1 {
  return {
    format: build.format,
    version: build.version,
    shipSymbol: build.shipSymbol,
    shipName: build.shipName,
    shipIdent: build.shipIdent,
    modules: build.modules.map((module) => ({
      slot: module.slot,
      symbol: module.symbol,
      enabled: module.enabled,
      priority: module.priority,
      preEngineered:
        module.preEngineered === null
          ? null
          : {
              symbol: module.preEngineered.symbol,
              blueprint: module.preEngineered.blueprint,
              grade: module.preEngineered.grade,
              acquisition: module.preEngineered.acquisition,
              experimental: module.preEngineered.experimental,
            },
      engineering:
        module.engineering === null
          ? null
          : {
              blueprint: module.engineering.blueprint,
              grade: module.engineering.grade,
              quality: module.engineering.quality,
              experimental: module.engineering.experimental,
            },
    })),
  };
}
