## Purpose

A published version reaches a running session by itself. This capability owns detecting a version
that supersedes the running one, restarting on it, the notice the restarted session draws, and a
cached application the service worker cannot repair.

## Requirements

### Requirement: Applying a published version

A session running a version that has been superseded MUST detect the newly published one without a
Commander-initiated reload and MUST apply it by itself. It MUST NOT do so unannounced: the restart
MUST be preceded by visible text saying what is happening, on screen before the page is replaced and
for no longer than the moment before it, and the session that comes up on the newer version MUST
state as visible text that the update was applied and which version it is now running. That statement
MUST be dismissible by a named control, MUST take itself down once it has stood, and MUST NOT return
on a later navigation in the same session. Neither statement MUST offer a control that calls the
restart off, defers it or asks anything: an update is applied, not proposed.

Source: 011/FR-025, 011/SC-007.

#### Scenario: A newer version is published while a session is open

- **WHEN** a version is published that supersedes the one an open session runs
- **THEN** the session detects it without the Commander reloading the page
- **AND** the session applies it by itself

#### Scenario: The overlay before the restart

- **WHEN** the restart is about to happen
- **THEN** visible text says what is happening
- **AND** it is on screen before the page is replaced and for no longer than the moment before it

#### Scenario: The session that comes up on the newer version

- **WHEN** the session comes up on the newer version
- **THEN** visible text states that the update was applied and which version the session is running
- **AND** that statement is dismissible by a named control
- **AND** it takes itself down once it has stood
- **AND** it does not return on a later navigation in the same session

#### Scenario: A Commander looks for a way to call the restart off

- **WHEN** a Commander reads either statement
- **THEN** neither offers a control that calls the restart off, defers it or asks anything

### Requirement: A restart that could not be carried out

A session whose restart could not be carried out MUST state as visible text that a newer version is
available and MUST offer a named control that applies it. A session that never applies it MUST be
served the newer version the next time the application starts.

Source: 011/FR-025.

#### Scenario: The restart cannot be carried out

- **WHEN** a session cannot carry out the restart
- **THEN** visible text states that a newer version is available
- **AND** a named control applies it

#### Scenario: The newer version is never applied in that session

- **WHEN** a session ends without applying the newer version
- **THEN** the next start of the application is served the newer version

### Requirement: The one time limit the application carries

Applying an update — the restart and the notice the restarted session draws — is a time limit that
meets none of WCAG 2.2.1's conditions. Success criterion 2.2.1 Timing Adjustable is excluded by
constitution V for this mechanism and no other, and this MUST be the application's only time limit. A
second time limit MUST come from an amendment rather than from a reading of this requirement. Every
conformance statement in this repository MUST name 2.2.1 among the excluded criteria.

Source: 011/FR-025.

#### Scenario: A conformance statement is written

- **WHEN** the application states its WCAG conformance
- **THEN** the statement names 2.2.1 among the excluded criteria

#### Scenario: Another mechanism wants a time limit

- **WHEN** a mechanism other than applying an update wants a time limit
- **THEN** it needs an amendment rather than a reading of this requirement

### Requirement: A cached application the worker cannot repair

A cached application in a state the worker cannot repair MUST be stated as a blocking error carrying a
named control that recovers it. Recovery MUST NOT depend on the Commander clearing a cache or forcing
a reload from outside the interface. Recovery MUST NOT happen on a clock: an unrepairable cache is an
error rather than an improvement, and there is no working page under the warning to protect.

Source: 011/FR-026.

#### Scenario: The worker cannot repair the cache

- **WHEN** the cached application is in a state the worker cannot repair
- **THEN** the application states a blocking error
- **AND** the error carries a named control that recovers it

#### Scenario: The route back to a working application

- **WHEN** a Commander recovers an unrepairable cache
- **THEN** recovery does not depend on clearing a cache or forcing a reload from outside the interface
- **AND** recovery does not happen on a clock
