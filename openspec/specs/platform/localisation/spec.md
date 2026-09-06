## Purpose

One localisation layer resolves every application-owned string and every number, credit,
distance, percentage and date the application shows. The browser language setting picks the
reading language, and game text comes from the Almanac rather than from a translation kept
here.

## Requirements

### Requirement: Application text resolves through the localisation layer

Every application-owned user-facing string MUST resolve through the localisation layer.
Hard-coded display text in components, templates and formatters is prohibited.

Source: 011/FR-016.

#### Scenario: A component shows text

- **WHEN** a component, a template or a formatter shows application-owned text
- **THEN** it resolves that text through the localisation layer

#### Scenario: Display text is hard-coded

- **WHEN** display text is written into a component, a template or a formatter
- **THEN** the text does not ship

### Requirement: Language selection from the browser setting

The application MUST select a shipped language matching the browser language setting and
MUST fall back to English when none matches. The initial shipped application languages MUST
be English and German. The browser language setting is the only input: the application MUST
NOT offer a language control and MUST NOT persist a language of its own.

Source: 011/FR-017.

#### Scenario: The browser language matches a shipped language

- **WHEN** the browser language setting names a shipped application language
- **THEN** the application presents its own text in that language

#### Scenario: The browser language matches no shipped language

- **WHEN** the browser language setting names no shipped application language
- **THEN** the application presents its own text in English

#### Scenario: A Commander looks for a language control

- **WHEN** a Commander reads any screen
- **THEN** the application offers no language control
- **AND** it persists no language of its own

### Requirement: Locale-aware formatting

Numbers, percentages, credits, distances and dates MUST use the active locale.

Source: 011/FR-018.

#### Scenario: A value is formatted

- **WHEN** the application shows a number, a percentage, a credit value, a distance or a date
- **THEN** it formats that value for the active locale

### Requirement: Complete catalogues shipped as static assets

Translations MUST ship as same-origin static assets and complete English fallback text MUST
be available without a network. Every selectable shipped application locale MUST contain the
same application-owned message keys and interpolation variables as bundled English, with no
blank value. Adding, removing or changing an application-owned message MUST update every
shipped locale in the same change. An incomplete or malformed catalogue MUST NOT be partially
published; the interface MUST remain on its prior complete locale or fall back atomically to
bundled English. Raw keys, empty strings and placeholders MUST not appear.

Source: 011/FR-019, 011/SC-006.

#### Scenario: The application runs without a network

- **WHEN** the application starts with no network available
- **THEN** the complete bundled English fallback text is available
- **AND** the application serves its translations from same-origin static assets

#### Scenario: The shipped catalogues are compared

- **WHEN** the shipped application locales are compared with bundled English
- **THEN** each carries the same application-owned message keys and interpolation variables
- **AND** no value is blank

#### Scenario: An application-owned message changes

- **WHEN** a change adds, removes or alters an application-owned message
- **THEN** the same change updates every shipped locale

#### Scenario: A catalogue is incomplete or malformed

- **WHEN** a catalogue is incomplete or malformed
- **THEN** the application does not publish it in part
- **AND** the interface stays on its prior complete locale or falls back atomically to bundled
  English
- **AND** no raw key, empty string or placeholder appears on screen

### Requirement: Game text from the Almanac

Game text MUST come from the Almanac. If the package cannot supply the active locale, its
canonical text MUST be requested and, when present, shown, carrying the language it is
actually in and a disclosure — programmatically associated with the text — saying why it is
not in the reading language. The disclosure carries that state; a badge beside the text MUST
NOT mark it. If the package supplies no canonical text, the value MUST be unavailable. The
application MUST NOT keep a private game-text translation.

Package localisation covers modules, blueprints, experimental effects, materials,
hull/manufacturer, slot/restriction, pre-engineered variant, engineering-group,
effect-description and structured diagnostic families. A helper can explicitly return `null`
when the requested locale or the text itself is unavailable. The application MUST NOT fill
either miss with private game-text or diagnostic translations.

Source: 011/FR-020.

#### Scenario: The package supplies the active locale

- **WHEN** the Almanac supplies game text in the active locale
- **THEN** the application shows that text

#### Scenario: The package supplies canonical text only

- **WHEN** the Almanac cannot supply the active locale and its canonical text is present
- **THEN** the application shows the canonical text
- **AND** the text carries the language it is actually in
- **AND** a disclosure programmatically associated with the text says why it is not in the
  reading language

#### Scenario: The package supplies no text

- **WHEN** the Almanac returns `null` for the requested locale and for the canonical text
- **THEN** the value is explicitly unavailable
- **AND** the application does not fill the miss with a game-text or diagnostic translation of
  its own
