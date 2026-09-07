## MODIFIED Requirements

### Requirement: Naming, saving, reopening and deleting a loadout

Users MUST be able to name the open loadout, save it, reopen a saved loadout and
delete one.

A manual save MUST consume the unnamed record the loadout was autosaved into and MUST leave
no copy of it behind: naming that loadout MUST name the same local identity, and writing it
into a saved record MUST delete the unnamed one afterwards. Saving a copy under another name
MUST create a further record and leave the original where it is. The saved list MUST NOT
hold both a save and the unnamed record it was made from, because the two are one loadout
and a Commander who saved once has one loadout to find again.

Source: 013/FR-016, 017/FR-007.

#### Scenario: A named loadout is saved

- **WHEN** a Commander saves an edited loadout under a name
- **THEN** it appears in the saved list, identified by that name, its suit and its
  modification count

#### Scenario: A saved loadout is reopened

- **WHEN** a Commander opens a saved loadout
- **THEN** every choice is restored exactly as saved

#### Scenario: An autosaved loadout is named

- **WHEN** a Commander names a loadout the bench has autosaved into an unnamed record
- **THEN** the saved list holds one record for that loadout, under the name
- **AND** no unnamed record of it is left behind

#### Scenario: An autosaved loadout replaces a saved one

- **WHEN** a Commander saves such a loadout over a loadout already in the list
- **THEN** the loadout is written into the record it replaced
- **AND** the unnamed record it was autosaved into is gone

## ADDED Requirements

### Requirement: Autosave of the open loadout

The open loadout MUST be recoverable from a stored record at all times, without being asked
for and without a Commander action, and MUST be restored after a reload. A loadout that has
no record yet MUST be autosaved to an unnamed record of its own from the moment it is on the
bench. A loadout opened from an existing record MUST be autosaved to an unnamed record of its
own from its first change.

Wherever a record is taken for a loadout — at either of those two moments — an unnamed
record already holding identical stored state MUST be taken over rather than a second copy of
it stored. A record holding a ship build MUST NOT be taken over for a loadout, because the two
hold different content and are never the same state. Autosave MUST NEVER write to a named
record: a Commander who names a loadout has said which version they want kept, so editing a
named loadout forks an unnamed record and the named record moves only when the Commander
saves.

Starting an empty bench, opening a saved loadout and reading one from a link MUST NOT
overwrite or discard the record of the loadout before it. An unnamed loadout record MUST be
kept and MUST expire under the same rule as any other unnamed record, and MUST NOT expire
while the page that autosaves into it is live.

Source: 017/FR-007, 017/SC-003.

#### Scenario: Reloading the tab

- **WHEN** a Commander reloads the tab with a loadout on the bench
- **THEN** the loadout the bench was holding is restored

#### Scenario: The same loadout arrives twice

- **WHEN** a Commander opens the same loadout link twice
- **THEN** the bench takes over the unnamed record already holding that stored state
- **AND** one record exists rather than two

#### Scenario: Editing a loadout opened from a named record

- **WHEN** a Commander changes a loadout opened from a named record
- **THEN** the named record is unchanged
- **AND** the change is autosaved to an unnamed record of its own, listed as such

#### Scenario: Opening a named loadout and not changing it

- **WHEN** a Commander opens a named loadout and makes no change
- **THEN** nothing is written

#### Scenario: A build record is never taken over

- **WHEN** the bench takes a record for a loadout
- **THEN** a record holding a ship build is never taken over for it

#### Scenario: Replacing what is on the bench

- **WHEN** a Commander starts an empty bench or opens another loadout
- **THEN** the loadout before it remains as the record it was autosaved to
- **AND** the saved list still holds it

### Requirement: What the bench says about storing

A store that refuses a write MUST be stated where the Commander is, and MUST NOT make the
loadout unusable: a Commander whose browser stores nothing MUST still be able to assemble,
read, share and export a loadout. A blocked store, a full store and a failed write MUST each
be stated in words rather than by an unchanged control.

A record deleted by another live page MUST NOT clear the bench. The loadout MUST stay usable,
autosave MUST pause, and resuming MUST be an explicit Commander action, because nobody at this
page decided anything. Resuming MUST write the loadout, whether or not it has changed since
the record was discarded.

A record deleted on this page MUST clear the bench, which is the opposite answer to the
opposite event: a Commander who deletes the record the bench autosaves into decided that here,
and writing it back on the next change would undo what they confirmed. The deleted record MUST
NOT be written again. A loadout the address still carries MUST open again from the address, as
any loadout in an address does, into a record of its own.

Source: 017/FR-008.

#### Scenario: The browser refuses to store anything

- **WHEN** the browser refuses every write while a loadout is on the bench
- **THEN** the bench states that nothing is being stored
- **AND** the loadout can still be changed, shared and exported

#### Scenario: The store is full

- **WHEN** the browser store is full and autosave cannot write
- **THEN** the bench states what happened and offers a way to choose records to discard

#### Scenario: This page deletes the record the bench autosaves into

- **WHEN** a Commander deletes the record this bench autosaves into, from this page
- **THEN** the bench holds no loadout
- **AND** the deleted record is never written again

#### Scenario: The address still carries the loadout whose record was deleted

- **WHEN** a Commander returns to an address carrying the loadout whose record they deleted
- **THEN** the loadout opens from the address, in a record of its own
- **AND** the record they deleted stays deleted

#### Scenario: Resuming a loadout that has not changed

- **WHEN** a Commander resumes autosave after another page deleted the record, without
  having changed the loadout
- **THEN** the loadout is written to a record again

#### Scenario: Another page deletes this page's record

- **WHEN** another live page deletes the record this bench autosaves into
- **THEN** the loadout stays on the bench and autosave pauses
- **AND** the Commander resumes autosave by an explicit action

### Requirement: A loadout in the address outranks the restored one

Where the address carries a loadout and the page also holds a record of its own, the loadout
in the address MUST open. A link that is refused MUST leave the restored loadout on the bench
and MUST say why the link was refused.

Source: 017/FR-009.

#### Scenario: A shared loadout is opened in a tab that has a record

- **WHEN** a Commander opens an address carrying a loadout in a tab that holds a record of its own
- **THEN** the loadout in the address opens on the bench

#### Scenario: The link in the address is refused

- **WHEN** the loadout in the address cannot be read
- **THEN** the restored loadout stays on the bench
- **AND** the Commander is told why the link was refused
