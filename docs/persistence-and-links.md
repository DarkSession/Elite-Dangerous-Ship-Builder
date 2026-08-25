# Persistence and links

What this application keeps in a browser, what it publishes in an address, and what it promises
about both across releases. Feature 001 owns everything here.

## The key space this application owns

Everything written to a browser store is named in `src/app/platform/storage/storage-keys.ts`.
Enumeration filters on these prefixes: a key this application did not write is never read,
migrated, repaired or removed, even when it looks like one of ours.

| Key                   | Store              | Holds                                                                         |
| --------------------- | ------------------ | ----------------------------------------------------------------------------- |
| `edsb:record:<uuid>`  | `localStorage`     | One saved build, working or named. One key per record; there is no index.     |
| `edsb:tab`            | `sessionStorage`   | This tab's descriptor: which working record it owns.                          |
| `edsb:catalogue`      | `sessionStorage`   | This tab's browsing position in the shipyard: search, filters, order, anchor. |
| `edsb.persistence.v1` | `BroadcastChannel` | Working-record ownership negotiation and cross-tab invalidation.              |
| `edsb:record:<uuid>`  | Web Locks          | Serialises deliberate writes to one record. Per record, never global.         |

No index key exists on purpose. An index is a second source of truth that can disagree with the
records it lists, and a Commander whose index was lost would have builds that are present in the
browser and invisible in the application.

## Working records and the retention limit

A working record is this tab's autosave. It is written by editing, restored on reload, and belongs
to exactly one top-level browsing context; a duplicated tab forks its own before either page next
saves.

**This browser keeps 20 working records** (`WORKING_RECORD_LIMIT`). What happens at the limit is
the part worth stating precisely:

- an existing working record always updates, whatever the count;
- the twenty-first _new_ working record performs **no write and no deletion**; and
- named records are excluded from the count entirely.

There is no age eviction, no count eviction, no least-recently-used eviction and no eviction on tab
closure. Nothing a Commander saved is discarded to make room for something else — the application
says there is no room and offers the record manager, where each record is selected individually and
removed only after an explicit confirmation. Deciding which of someone's builds mattered least is
not a decision this application makes.

Editing continues in every persistence failure state: blocked storage, a full store, a failed write
and a record discarded in another tab all change what the status says and change nothing about
whether the build can be edited, calculated, shared or exported.

## Supported record versions

Stored records are a versioned envelope, `format: "edsb.local-record"`, with the modelled build
inside as `format: "edsb.build"`.

| Version | Status                                           |
| ------- | ------------------------------------------------ |
| 1       | Current. Written by this release and read by it. |

There is no version 0. Version 1 is the first published version, and a record declaring a version
this release does not know is **not guessed at**: it is listed in the library as a build this
version cannot open, with whatever metadata could be read without guessing, and left byte-for-byte
alone.

Migration happens on open, never on enumeration, and replaces a record's own key only after decode,
migration, package reconstruction and re-serialisation have all succeeded. If any step fails the
original bytes stay authoritative.

The envelope carries record metadata and the modelled build. It never carries calculated values,
catalogue facts, prices, purchase provenance or browsing state.

## Published link versions

A build link is `<origin><base>/build#b.<payload>`.

- The value after `#` starts `b.` and is **at most 500 characters including that prefix**.
- Origin, deployment base path and the `#` itself are outside that limit.
- Path and query carry no build data. A fragment is never transmitted by a browser, which is the
  whole reason the payload lives there.

| Table version | Status                                                                           |
| ------------- | -------------------------------------------------------------------------------- |
| 1             | Current. Links are published with it, and every published table stays decodable. |

The payload version selects its decoder, so a link published by an earlier release keeps working.
A **newer** version is never guessed: it is refused with a reason a Commander can read.

What a link carries is package-resolved hull and module identities, game slot keys, the
package-identified pre-engineered variant, ordinary blueprint and effect identity and grade, module
enabled state and priority, and the nullable ship name and ident. What it never carries is notes,
save names, record and tab ids, timestamps, revisions, validation snapshots, catalogue facts,
prices and browsing state — enumerated in
`src/app/application/build-link/link-payload.allowlist.ts`.

A build that cannot cross that boundary losslessly is refused rather than simplified. A refusal
takes the stale fragment down with it, keeps the build exactly as it is, names the mount involved
where the codec could name one, and offers the file export instead.

The capacity behind the 500-character promise — the widest installed hull, every mount filled and
engineered, both labels at their length limit — is asserted against the committed table by
`scripts/build-link-codec-capacity.test.mjs`. The format itself is specified in
[build-link-codec.md](./build-link-codec.md).
