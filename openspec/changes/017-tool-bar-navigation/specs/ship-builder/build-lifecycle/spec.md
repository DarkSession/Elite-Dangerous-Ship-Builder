## MODIFIED Requirements

### Requirement: Concurrent pages and records

A record deleted by another live page MUST NOT clear that page's active build. The build MUST remain
usable, autosave MUST pause, and resuming MUST be an explicit Commander action, because nobody at
this page decided anything.

Two live pages MUST NOT autosave to one record. Each page's autosave target is an unnamed record it
minted or took over for itself, one for each tool it carries, because a page holds a build and a
loadout at the same time and neither may be written into the other's record. A page that finds
another live page claiming one of those identities MUST fork that one under a fresh identity before
either page next writes, and MUST leave its other tool's record where it is. Two pages MAY hold the
same named record open, because neither autosaves into it; concurrent manual writes to one record
MUST offer overwrite, keep both and cancel.

Source: 001/FR-012, 017/FR-010.

#### Scenario: Another page deletes this page's record

- **WHEN** another live page deletes the record this page is autosaving into
- **THEN** this page keeps its build usable and pauses autosave
- **AND** the Commander resumes autosave by an explicit action

#### Scenario: Two pages claim one autosave identity

- **WHEN** a page finds another live page claiming its autosave record identity
- **THEN** it forks under a fresh identity before either page next writes

#### Scenario: A page carries a build and a loadout

- **WHEN** a page autosaves a build and a loadout at the same time
- **THEN** each is written to an unnamed record of its own
- **AND** a fork of one leaves the other where it is

#### Scenario: A conflicting manual save from another tab

- **WHEN** two pages write manually to one record
- **THEN** the application offers overwrite, keep both and cancel
- **AND** neither version is silently lost
