## MODIFIED Requirements

### Requirement: Concurrent pages and records

A record deleted by another live page MUST NOT clear that page's active build. The build MUST remain
usable, autosave MUST pause, and resuming MUST be an explicit Commander action, because nobody at
this page decided anything. Resuming MUST write the build, whether or not it has changed since the
record was discarded. The pause MUST be about the discarded record alone: a page that moves onto
another record MUST autosave into it unasked, and MUST NOT keep stating a discard that is not about
the build it now holds.

Two live pages MUST NOT autosave to one record. Each page's autosave target is an unnamed record it
minted or took over for itself, one for each tool it carries, because a page holds a build and a
loadout at the same time and neither may be written into the other's record. A page that finds
another live page claiming one of those identities MUST fork that one under a fresh identity before
either page next writes, and MUST leave its other tool's record where it is. A page that forks MUST
write its work into the fresh record, whether or not it has changed since the record it left, so
that the identity its claim names is one a reload can restore from. Two pages MAY hold the same
named record open, because neither autosaves into it; concurrent manual writes to one record MUST
offer overwrite, keep both and cancel.

A record deleted on this page MUST leave this tab claiming nothing for the tool that was
autosaving into it. The claim is what a reload reads, so one left behind would have the tool
restore from a record that is gone.

Source: 001/FR-012, 017/FR-010.

#### Scenario: Another page deletes this page's record

- **WHEN** another live page deletes the record this page is autosaving into
- **THEN** this page keeps its build usable and pauses autosave
- **AND** the Commander resumes autosave by an explicit action

#### Scenario: Resuming a build that has not changed

- **WHEN** a Commander resumes autosave after another page deleted the record, without having
  changed the build
- **THEN** the build is written to a record again

#### Scenario: Another build is opened while autosave is paused

- **WHEN** a Commander opens another build while autosave is paused on a discarded record
- **THEN** the build that opens is autosaved without being asked for
- **AND** the workspace states nothing about the record that was discarded

#### Scenario: Two pages claim one autosave identity

- **WHEN** a page finds another live page claiming its autosave record identity
- **THEN** it forks under a fresh identity before either page next writes
- **AND** its work is written into that identity, whether or not it has changed

#### Scenario: A page carries a build and a loadout

- **WHEN** a page autosaves a build and a loadout at the same time
- **THEN** each is written to an unnamed record of its own
- **AND** a fork of one leaves the other where it is

#### Scenario: This page deletes the record a tool autosaves into

- **WHEN** a Commander deletes the record this page's build or loadout autosaves into
- **THEN** this tab claims nothing for that tool
- **AND** a page built in this tab afterwards restores no build or loadout from it

#### Scenario: A conflicting manual save from another tab

- **WHEN** two pages write manually to one record
- **THEN** the application offers overwrite, keep both and cancel
- **AND** neither version is silently lost
