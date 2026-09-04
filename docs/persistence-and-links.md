# Persistence and links

What this application keeps in a browser, what it publishes in an address, and what it promises
about both across releases. Feature 001 owns everything here.

## The key space this application owns

Everything written to a browser store is named in `src/app/platform/storage/storage-keys.ts`.
Enumeration filters on these prefixes: a key this application did not write is never read,
migrated, repaired or removed, even when it looks like one of ours. That rule covers a key the
product wrote under an earlier prefix as well, so the records under one are left where they are
and are not opened here — the Commander ruled for one prefix over a key space carrying two
(`docs/navbeacon-migration.md`).

| Key                   | Store              | Holds                                                                             |
| --------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `ednb:record:<uuid>`  | `localStorage`     | One build, named or not. One key per record; there is no index.                   |
| `ednb:tab`            | `sessionStorage`   | This page's descriptor: which unnamed record it autosaves into.                   |
| `ednb:catalogue`      | `sessionStorage`   | This tab's browsing position in the catalogue: search, filters, order, anchor.    |
| `ednb:update-applied` | `sessionStorage`   | That this tab restarted onto a newer version, so the arriving session can say so. |
| `ednb.persistence.v1` | `BroadcastChannel` | Autosave-record claims between live pages, and cross-tab invalidation.            |
| `ednb:record:<uuid>`  | Web Locks          | Serialises deliberate writes to one record. Per record, never global.             |

No index key exists on purpose. An index is a second source of truth that can disagree with the
records it lists, and a Commander whose index was lost would have builds that are present in the
browser and invisible in the application.

## A record for every build, and the seven days an unnamed one has

**Revised 2026-08-25 (Commander request).** There is no per-tab working record that the next build
writes over, and no count limit. Every build a Commander works on has a record of its own from the
moment it exists, and the bound on the ones they never named is time rather than number.

- A build with no record yet — a stock creation, a decoded link, a SLEF import — is written to a
  freshly minted unnamed record before anything else happens to it.
- Opening a stored record writes nothing at all. The build is already recoverable from what was
  opened; the **first modelled edit** forks an unnamed record, carrying which named save it came
  from, and every autosave from then on goes there.
- Both of those moments first look for an unnamed record already holding exactly this modelled
  state and take that record over rather than writing a second copy of it. Taking a record over
  does not touch `modifiedAt`.
- Autosave never writes to a named record. The check reads the stored record's own `kind` rather
  than the page's belief about it, so a record named in another tab is covered too.
- `ednb:tab` carries the unnamed record this page is autosaving into, across a reload. A duplicated
  tab clones it and claims an id that is already live; the BroadcastChannel handshake forks the
  later claimant before either page next writes. Two pages holding one _named_ record open is not a
  collision, because neither writes to it.

**Exactly three things remove a record**, and no fourth:

1. a deletion the Commander confirmed;
2. the manual save that consumes the unnamed record it saved from — naming it writes the name onto
   that same key, and writing the build into an existing record removes the unnamed one only after
   that write has succeeded;
3. the **seven-day expiry** of an unnamed record.

The expiry is the only one nobody presses, so it is built as narrowly as that deserves. The deadline
is `modifiedAt` plus seven days, derived and never stored. The sweep runs at application start and
before every listing read, and never on a timer — a row vanishing under a Commander reading the
library is the one removal this design cannot make visible. It never touches a named record, and
never touches one a live page has announced as its autosave target. It writes nothing and announces
nothing: every unnamed row states its own remaining life beforehand, and that countdown is the whole
of the notice. Naming a record ends its expiry outright.

There is no count limit and no eviction of any other kind. Nothing a Commander saved is discarded to
make room for something else: a full browser quota says there is no room and offers the record
manager, where each record is selected individually and removed only after an explicit confirmation.
Deciding which of someone's builds mattered least is not a decision this application makes, and
expiry is never offered as a way out of a full quota.

Editing continues in every persistence failure state: blocked storage, a full store, a failed write
and a record discarded in another tab all change what the status says and change nothing about
whether the build can be edited, calculated, shared or exported.

## Supported record versions

Stored records are a versioned envelope, `format: "ednb.local-record"`, carrying one tool's payload:
a modelled build as `format: "ednb.build"`, or a loadout as `format: "ednb.loadout"`.

| Version | Status                                                                                   |
| ------- | ---------------------------------------------------------------------------------------- |
| 1       | Superseded. Never written by this release; one found under this prefix migrates on open. |
| 2       | Current. Written by this release and read by it.                                         |

Version 2 adds one field: `tool`, which is `"ship"` or `"equipment"` and says which payload the
envelope carries.

```text
ednb.local-record v2
├── tool: "ship"       → hullSymbol, validation, build
└── tool: "equipment"  → suitFamily, loadout
```

Everything else is shared by both: `format`, `version`, `id`, `kind`, `revisionId`, `createdAt`,
`modifiedAt`, `name`, `note` and `sourceNamed`. **One key space and no index**: both tools' records
live under `ednb:record:<uuid>`, and the library lists them together, each row naming the tool that
made it. A row's summary comes from the envelope alone — for a loadout, its name and its
`suitFamily` — so listing never rebuilds a loadout and never asks the package anything.

A version 1 record has no `tool` field, and **its absence means `"ship"`**: every record written
before the bench existed is a ship's, whether or not it says so. It migrates to version 2 on open.

There is no version 0. Version 1 is the first published version, and a record declaring a version
this release does not know is **not guessed at**: it is listed in the library as a record this
version cannot open, with whatever metadata could be read without guessing, and left byte-for-byte
alone. So is a record whose payload this release can read but whose identities the installed
`@elite-dangerous-almanac/core` no longer carries — an unknown hull, suit, weapon or recipe. Nothing
partial is ever opened.

Migration happens on open, never on enumeration, and replaces a record's own key only after decode,
migration, package reconstruction and re-serialisation have all succeeded. If any step fails the
original bytes stay authoritative.

The envelope carries record metadata and one tool's payload. It never carries calculated values,
catalogue facts, prices, purchase provenance or browsing state. That holds for both tools: a stored
loadout is a suit family, a grade, what is on each catalogue mount and what is in each modification
slot — every shield figure, damage figure and material requirement is asked of the package on open.

A saved loadout carries **every** catalogue mount and **every** modification slot, held or locked or
neither, so saving is never destructive of a choice a Commander made.

## Published link versions

A build link is `<origin><base>/outfitting#b.<payload>`.

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
[ship-link-codec.md](./ship-link-codec.md).

## The loadout link

A loadout link is `<origin><base>/equipment#e.<payload>`, under the same 500-character bound and the
same rules about what a fragment is. **The prefix is what claims it**: `b.` is the ship tool's and
`e.` is the bench's, so a link minted by one is never offered to the other's decoder, and a fragment
belonging to neither is left uninterpreted.

What it carries is the suit family and grade, what is on each of the catalogue's three mounts with
its grade, and the four modification slots of each item. It carries the catalogue's whole mount set
rather than the worn suit's, which is what makes a weapon on a mount the suit does not offer
expressible: held content round-trips instead of being dropped. What it never carries is the record
a loadout was opened from, which item the item view is showing, the undo tape, or any figure the
package can answer — enumerated beside the ship tool's list in
`src/app/application/build-link/link-payload.allowlist.ts`.

A loadout that cannot cross that boundary is refused rather than simplified, and so is a link that
arrives unreadable: the bench keeps what is on it, the reason is stated where the Commander is, and
the mount involved is named in the library's own words rather than by its journal key. The format is
specified in [equipment-link-codec.md](./equipment-link-codec.md).
