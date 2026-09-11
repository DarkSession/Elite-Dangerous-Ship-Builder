## ADDED Requirements

### Requirement: The address keeps the published link

While a build's link is published, the address MUST carry it. An address that comes back without
the published link MUST have it stated again in place, with no history entry added, so the
address a Commander copies or reloads opens the build that is open.

A link the address carries instead of the published one MUST be left alone. Only a lost link is
stated again, never a replaced one: an incoming build link is how a Commander reaches another
build, and an address that restated the open build over it could not be navigated.

Restoration MUST be bounded to the document the link was published onto. A Commander who leaves
the workspace MUST NOT arrive at another screen carrying a build link.

Source: 001/FR-020.

#### Scenario: The address loses the published link

- **WHEN** the address of the screen a published build belongs to comes back without that link
- **THEN** the published link is stated again in the address
- **AND** no history entry is added

#### Scenario: A link is published onto an address the Commander has left

- **WHEN** a build is opened and a surface is raised over the workspace before the link is
  published
- **AND** the Commander returns to the workspace
- **THEN** the address carries the published link

#### Scenario: The address carries a different build link

- **WHEN** the address carries a build link other than the one published
- **THEN** the published link is not stated again
- **AND** the incoming link is interpreted under the standing ingress rules

#### Scenario: The Commander leaves the workspace

- **WHEN** the address is for a document other than the one the link was published onto
- **THEN** the published link is not stated again

#### Scenario: No link is published

- **WHEN** no build link is published, because there is no build or the link was refused
- **THEN** nothing is stated into the address
