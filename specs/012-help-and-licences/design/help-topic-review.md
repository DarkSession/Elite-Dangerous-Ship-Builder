# Help topic content review

Required by [../contracts/help-navigation.md](../contracts/help-navigation.md), "Required
content-review gate". The mechanical checks in `scripts/check-help-topics.mjs` prove the set is the
seven, that every governing reference still resolves against a declared requirement or principle,
and that both shipped locales answer every topic with a matching interpolation contract. They cannot
prove that an answer is _true_. This record is where that judgment is made and kept.

**Confirmed against the shipped catalogues, 2026-08-25.** T047 has landed: every judgment below was
re-made against the `help.topic.*` entries now in `src/app/i18n/locales/en.json` and `de.json`, not
against a draft. The earlier provisional caveat is struck.

**Wording changed with the confirmation**, and the findings below record the wording that shipped.
Three of the seven are now asked in the design reference's own words, because the reference asks an
equivalent question and the reference is this feature's template: `buildLinkPrivacy` is asked as
_Do share links expose my account?_, `browserPersistence` as _Where are my builds stored?_ (with the
reference's own answer), and `completedEngineeringGrades` as _Why do my engineered stats differ in
game?_ (with an answer the reference's own cannot supply). The remaining four have no question in
the reference and carry the wording settled here.

Re-run this review whenever an English question, an English answer or a governing reference changes;
a topic left unchecked is a release failure, not a note to come back to.

For each topic:

1. every factual sentence is supported by at least one cited accepted source;
2. no sentence contradicts a cited source or another accepted requirement;
3. no answer promises behaviour outside FR-010 or describes anything unbuilt; and
4. the German answer preserves the reviewed meaning.

## 1. `buildLinkPrivacy` — "Do share links expose my account?"

**Governed by** feature 001 FR-015.

| Check | Finding                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | FR-015 requires the payload to stay entirely in the URL fragment and to cause no transmission. The answer states both halves — where the payload is, and that a browser does not send that part — and adds only the ordinary consequence that handing somebody the whole address hands them the encoded build. The reference's own answer stops after the first half; the second is added because this table requires it. |
| 2     | Consistent with feature 004's export, which is a separate deliberate act, and with constitution I.                                                                                                                                                                                                                                                                                                                        |
| 3     | Describes shipped behaviour; no promise.                                                                                                                                                                                                                                                                                                                                                                                  |
| 4     | German says the same three things in the same order and uses the shipped `Aufbau` vocabulary.                                                                                                                                                                                                                                                                                                                             |

## 2. `accountsUploadsTelemetry` — "Are there accounts, uploads or telemetry?"

**Governed by** constitution principle I.

| Check | Finding                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Principle I is client-side only and non-negotiable: no accounts, no authentication, no uploads, no telemetry, no server persistence. The answer enumerates exactly those and adds nothing. |
| 2     | Nothing in features 001–011 introduces any of them; the same principle is what the policy checker enforces on every network-capable API.                                                   |
| 3     | No promise. The answer is a statement about now, not an undertaking about later.                                                                                                           |
| 4     | German enumerates the same five absences.                                                                                                                                                  |

## 3. `browserPersistence` — "Where are my builds stored?"

**Governed by** constitution principle I and feature 001 FR-008, FR-013 and FR-014.

| Check | Finding                                                                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | FR-008, FR-013 and FR-014 place the working build, the named builds and the preferences in browser storage on the device. That clearing site data removes them and that they do not travel is the direct consequence, and the export/share remedy is feature 004 and FR-015 as built. |
| 2     | Does not contradict the persistence-failure states feature 001 already words; the answer describes where things live, not that storing always succeeds.                                                                                                                               |
| 3     | No promise of sync, accounts or a server copy — the answer's remedy is the two exports that exist.                                                                                                                                                                                    |
| 4     | German uses the shipped `Aufbauten` vocabulary, keeps the preferences clause and keeps the same remedy.                                                                                                                                                                               |

## 4. `offlineAssets` — "What works offline?"

**Governed by** constitution principle I and feature 001 FR-006.

| Check | Finding                                                                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | FR-006 makes hull artwork same-origin and non-blocking; the installed shell and bundled data being usable offline is principle I plus the shipped service worker, which `e2e/offline.spec.ts` and `e2e/help-offline.spec.ts` both exercise. |
| 2     | The "only after it has been opened once" qualification is what keeps the answer from contradicting FR-006's cache behaviour, and the closing clause is FR-006's own non-blocking rule.                                                      |
| 3     | Deliberately does not promise that all artwork is precached, because it is not.                                                                                                                                                             |
| 4     | German keeps both the qualification and the non-blocking clause.                                                                                                                                                                            |

## 5. `completedEngineeringGrades` — "Why do my engineered stats differ in game?"

**Governed by** constitution principle IV and feature 002 FR-013.

| Check | Finding                                                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | FR-013 requires every selected ordinary grade to represent 100% quality and requires partial imported quality to be completed by the Almanac or refused. Principle IV is the lossless-and-honest rule behind it. The answer states the invariant and both import outcomes.                             |
| 2     | This is the topic the reference mock gets wrong: its FAQ says an imported module keeps its real roll, which contradicts FR-013 outright. That wording is excluded, and `scripts/check-help-topics.mjs` refuses a catalogue that reintroduces it.                                                       |
| 3     | "Refused whole before anything opens" is the behaviour feature 004 ships today. The reference asks this question and answers it with a retained real roll; the question is kept because it is the question a Commander has, and the answer is replaced because FR-013 contradicts the reference's own. |
| 4     | German states the same invariant and the same atomic refusal.                                                                                                                                                                                                                                          |

## 6. `hullFactsAndBuildResults` — "What is a hull fact and what is a build result?"

**Governed by** feature 001 FR-004 and feature 005 FR-003.

| Check | Finding                                                                                                                                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | FR-004 requires hull facts to be distinguished from module-dependent build results, which is the first sentence. FR-003 owns the deployed/retracted viewing condition results depend on, which is the second.                                                                                 |
| 2     | The citation was corrected during implementation: the contract previously cited feature 003 FR-006 and FR-009, both reassigned on 2026-08-22. The wording did not change — only the requirement it points at, which is now the one that declares the behaviour. See the note in the contract. |
| 3     | Names only the viewing condition feature 005 ships, and gives it as an example rather than as a complete list.                                                                                                                                                                                |
| 4     | German keeps both halves and the same example.                                                                                                                                                                                                                                                |

## 7. `almanacOwnership` — "Where do the game values and calculations come from?"

**Governed by** constitution principle II and feature 003 FR-002.

| Check | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Principle II makes the Almanac the source of truth for catalogue data, validation and calculation; FR-002 is where feature 003 reads its results from it. The answer says exactly that, and that this application neither maintains nor corrects those values. **This topic now also carries the once-per-application package credit** that feature 002's voice ruling of 2026-08-22 assigned to this feature: the `ABOUT` provenance statement that used to carry it is withdrawn with the rest of what the reference does not draw, and a pass that reworded or removed this answer would leave around thirty deliberately uncredited strings with nothing behind them. |
| 2     | Consistent with the ownership policy scripts, which are what stop any capability computing a figure the package publishes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3     | No promise to fix or update game values, which would be a promise this application cannot keep.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4     | German uses the shipped `Almanach` vocabulary and keeps the two negatives.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Excluded from the reference mock

Two of the reference FAQ's four questions are not topics here, and neither is an oversight:

- **"What can I import?"** describes an import behaviour feature 004 owns. Its reference answer is
  not in fact unsupportable — feature 004 FR-007 accepts pasted SLEF JSON or one journal `Loadout`
  event, which is what the reference says — but the accepted topic set is the seven in
  `contracts/help-navigation.md`, and import is not one of them. It is excluded on scope, and it is
  the one thing the reference draws that the product does not. Recorded plainly rather than dressed
  up as a correctness finding.
- **The retained partial roll** contradicts feature 002 FR-013 and constitution IV. It is not
  reworded, it is excluded, and the check script fails a catalogue that brings it back.
