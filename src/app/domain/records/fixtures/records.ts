/**
 * Frozen record fixtures.
 *
 * These are *bytes*, not builders. A fixture written by calling the current
 * serializer proves only that the serializer agrees with itself; the point of a
 * frozen fixture is that it is read rather than generated, so a decoder cannot
 * be changed and its test changed with it. Every published version adds its own
 * here (persistence contract, "Version and migration behavior").
 *
 * They carry the current `ednb` prefix. The product's key space moved with its
 * name and nothing reads across the move, so a record under the earlier prefix
 * is not one of this application's keys and no fixture holds one: these state
 * the shapes the decoder accepts, and which release wrote a given shape is not
 * something a fixture can prove any more (`docs/navbeacon-migration.md`).
 */

/** A complete, readable version-1 named record. */
export const NAMED_RECORD_V1 = `{
  "format": "ednb.local-record",
  "version": 1,
  "id": "11111111-1111-4111-8111-111111111111",
  "kind": "named",
  "revisionId": "22222222-2222-4222-8222-222222222222",
  "createdAt": "2026-01-02T03:04:05.000Z",
  "modifiedAt": "2026-01-02T03:04:05.000Z",
  "name": "Anaconda explorer",
  "note": "Long-range fit.",
  "hullSymbol": "Anaconda",
  "validation": { "valid": true, "complete": true },
  "build": {
    "format": "ednb.build",
    "version": 1,
    "shipSymbol": "Anaconda",
    "shipName": null,
    "shipIdent": null,
    "modules": [
      {
        "slot": "FrameShiftDrive",
        "symbol": "Int_Hyperdrive_Size6_Class5",
        "enabled": null,
        "priority": null,
        "preEngineered": null,
        "engineering": null
      }
    ]
  },
  "sourceNamed": null
}`;

/** A version-1 working record, with the provenance a fork leaves behind. */
export const WORKING_RECORD_V1 = `{
  "format": "ednb.local-record",
  "version": 1,
  "id": "33333333-3333-4333-8333-333333333333",
  "kind": "working",
  "revisionId": "44444444-4444-4444-8444-444444444444",
  "createdAt": "2026-01-02T03:04:05.000Z",
  "modifiedAt": "2026-01-02T04:05:06.000Z",
  "name": null,
  "note": null,
  "hullSymbol": "SideWinder",
  "validation": { "valid": true, "complete": false },
  "build": {
    "format": "ednb.build",
    "version": 1,
    "shipSymbol": "SideWinder",
    "shipName": "Gimel",
    "shipIdent": "SW-01",
    "modules": []
  },
  "sourceNamed": {
    "recordId": "11111111-1111-4111-8111-111111111111",
    "baseRevisionId": "22222222-2222-4222-8222-222222222222"
  }
}`;

/** A record written by a version this build is too old to read. */
export const UNSUPPORTED_NEWER_RECORD = `{
  "format": "ednb.local-record",
  "version": 99,
  "id": "55555555-5555-4555-8555-555555555555",
  "kind": "named",
  "revisionId": "66666666-6666-4666-8666-666666666666",
  "createdAt": "2026-01-02T03:04:05.000Z",
  "modifiedAt": "2026-01-02T03:04:05.000Z",
  "name": "From the future",
  "hullSymbol": "Anaconda",
  "somethingNew": { "we": "cannot read this" }
}`;

/** A record whose bytes are not a record at all. */
export const MALFORMED_RECORD = '{"format":"ednb.local-record","version":1,"id":';

/** A readable record naming a hull the installed package does not carry. */
export const UNKNOWN_HULL_RECORD = `{
  "format": "ednb.local-record",
  "version": 1,
  "id": "77777777-7777-4777-8777-777777777777",
  "kind": "named",
  "revisionId": "88888888-8888-4888-8888-888888888888",
  "createdAt": "2026-01-02T03:04:05.000Z",
  "modifiedAt": "2026-01-02T03:04:05.000Z",
  "name": "A hull that is not carried",
  "note": null,
  "hullSymbol": "Nonexistent_Hull",
  "validation": { "valid": true, "complete": true },
  "build": {
    "format": "ednb.build",
    "version": 1,
    "shipSymbol": "Nonexistent_Hull",
    "shipName": null,
    "shipIdent": null,
    "modules": []
  },
  "sourceNamed": null
}`;

/** A complete, readable version-2 ship record: the same build, with `tool`. */
export const NAMED_RECORD_V2 = `{
  "format": "ednb.local-record",
  "version": 2,
  "tool": "ship",
  "id": "11111111-1111-4111-8111-111111111111",
  "kind": "named",
  "revisionId": "22222222-2222-4222-8222-222222222222",
  "createdAt": "2026-01-02T03:04:05.000Z",
  "modifiedAt": "2026-01-02T03:04:05.000Z",
  "name": "Anaconda explorer",
  "note": "Long-range fit.",
  "hullSymbol": "Anaconda",
  "validation": { "valid": true, "complete": true },
  "build": {
    "format": "ednb.build",
    "version": 1,
    "shipSymbol": "Anaconda",
    "shipName": null,
    "shipIdent": null,
    "modules": [
      {
        "slot": "FrameShiftDrive",
        "symbol": "Int_Hyperdrive_Size6_Class5",
        "enabled": null,
        "priority": null,
        "preEngineered": null,
        "engineering": null
      }
    ]
  },
  "sourceNamed": null
}`;

/**
 * A version-2 loadout record.
 *
 * Held content on purpose: a Maverick is worn and the second primary holds a
 * sniper, which is the state a saved loadout has to survive (FR-018a).
 */
export const LOADOUT_RECORD_V2 = `{
  "format": "ednb.local-record",
  "version": 2,
  "tool": "equipment",
  "id": "99999999-9999-4999-8999-999999999999",
  "kind": "named",
  "revisionId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "createdAt": "2026-01-02T03:04:05.000Z",
  "modifiedAt": "2026-01-02T03:04:05.000Z",
  "name": "Silent Entry",
  "note": null,
  "suitFamily": "utilitysuit",
  "loadout": {
    "format": "ednb.loadout",
    "version": 1,
    "suitFamily": "utilitysuit",
    "suitGrade": 4,
    "suitModifications": ["suit_increasedshieldregen", null, null, null],
    "weapons": [
      {
        "symbol": "wpn_m_assaultrifle_plasma_fauto",
        "grade": 3,
        "modifications": [null, null, null, null]
      },
      {
        "symbol": "wpn_m_sniper_plasma_charged",
        "grade": 2,
        "modifications": [null, null, null, null]
      },
      null
    ]
  },
  "sourceNamed": null
}`;

/** A version-2 loadout naming a suit the installed package does not carry. */
export const UNKNOWN_SUIT_RECORD = `{
  "format": "ednb.local-record",
  "version": 2,
  "tool": "equipment",
  "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "kind": "named",
  "revisionId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "createdAt": "2026-01-02T03:04:05.000Z",
  "modifiedAt": "2026-01-02T03:04:05.000Z",
  "name": "A suit that is not carried",
  "note": null,
  "suitFamily": "nonexistentsuit",
  "loadout": {
    "format": "ednb.loadout",
    "version": 1,
    "suitFamily": "nonexistentsuit",
    "suitGrade": 1,
    "suitModifications": [null, null, null, null],
    "weapons": [null, null, null]
  },
  "sourceNamed": null
}`;

/** The identity each fixture is stored under. */
export const FIXTURE_IDS = {
  named: '11111111-1111-4111-8111-111111111111',
  working: '33333333-3333-4333-8333-333333333333',
  unsupported: '55555555-5555-4555-8555-555555555555',
  unknownHull: '77777777-7777-4777-8777-777777777777',
  loadout: '99999999-9999-4999-8999-999999999999',
  unknownSuit: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
} as const;
