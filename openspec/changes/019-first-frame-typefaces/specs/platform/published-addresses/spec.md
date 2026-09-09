## ADDED Requirements

### Requirement: The first frame is drawn in the application's own typefaces

A served document MUST be drawn in the application's own typefaces from the frame it first
paints. The stylesheet that declares those faces MUST be applied before the document paints,
and the document MUST ask for a face of every family it draws with beside the document
itself, so that a face arrives with that stylesheet rather than behind it. Text a Commander
can read MUST NOT be drawn in a fallback family and drawn again in the family the document
asks for.

A face is asked for by the document from an address relative to the deployment base, in
anonymous mode, and it is one the applied stylesheet declares.

Source: 019/FR-001.

#### Scenario: A Commander opens an advertised address

- **WHEN** the first frame of an advertised address paints
- **THEN** it is drawn in the typefaces the application declares
- **AND** no text on it is drawn again in another family

#### Scenario: A document is served

- **WHEN** a published document is served
- **THEN** every stylesheet it applies is applied before it paints
- **AND** it asks for a face of every family it draws with, each one declared by that
  stylesheet
