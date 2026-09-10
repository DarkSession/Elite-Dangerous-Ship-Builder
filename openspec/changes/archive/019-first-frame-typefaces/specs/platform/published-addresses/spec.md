## ADDED Requirements

### Requirement: The first frame is drawn in the application's own typefaces

A served document MUST be drawn in the application's own typefaces from the frame it first
paints. The stylesheet that declares those faces MUST be applied before the document paints,
and the document MUST ask for a face of every family it draws with beside the document
itself, so that a face arrives with that stylesheet rather than behind it.

A face is asked for by the document from an address relative to the deployment base, in
anonymous mode, and it is one the applied stylesheet declares.

The faces are declared `font-display: swap`, which is the limit of this requirement: a
Commander on a connection slow enough that a face has not arrived by the paint reads the
text in a fallback family and reads it again in the family the document asks for. Readable
text is worth that over invisible text. What the requirement holds is that nothing in the
served output puts a face behind the paint that the connection alone would not.

Source: 019/FR-001.

#### Scenario: A Commander opens an advertised address

- **WHEN** the first frame of an advertised address paints, with the faces it asked for
  arrived
- **THEN** it is drawn in the typefaces the application declares
- **AND** it is drawn in no family it did not ask for beside the document

#### Scenario: A document is served

- **WHEN** a published document is served
- **THEN** every stylesheet it applies is applied before it paints
- **AND** it asks for a face of every family it draws with, each one declared by that
  stylesheet
