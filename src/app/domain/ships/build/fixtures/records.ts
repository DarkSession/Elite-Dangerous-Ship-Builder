/**
 * Frozen record fixtures.
 *
 * These are *bytes*, not builders. A fixture written by calling the current
 * serializer proves only that the serializer agrees with itself; the point of
 * a frozen fixture is that it was written by a version that no longer exists
 * and must still open. Every published version adds its own here and none is
 * ever edited — editing one would silently retire the compatibility it exists
 * to prove (persistence contract, "Version and migration behavior").
 */

/** A complete, readable version-1 named record. */
export const NAMED_RECORD_V1 = `{
  "format": "edsb.local-record",
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
    "format": "edsb.build",
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
  "format": "edsb.local-record",
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
    "format": "edsb.build",
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
  "format": "edsb.local-record",
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
export const MALFORMED_RECORD = '{"format":"edsb.local-record","version":1,"id":';

/** A readable record naming a hull the installed package does not carry. */
export const UNKNOWN_HULL_RECORD = `{
  "format": "edsb.local-record",
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
    "format": "edsb.build",
    "version": 1,
    "shipSymbol": "Nonexistent_Hull",
    "shipName": null,
    "shipIdent": null,
    "modules": []
  },
  "sourceNamed": null
}`;

/** The identity each fixture is stored under. */
export const FIXTURE_IDS = {
  named: '11111111-1111-4111-8111-111111111111',
  working: '33333333-3333-4333-8333-333333333333',
  unsupported: '55555555-5555-4555-8555-555555555555',
  unknownHull: '77777777-7777-4777-8777-777777777777',
} as const;
