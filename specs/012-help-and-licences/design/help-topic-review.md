# Help topic content review

Required by [../contracts/help-navigation.md](../contracts/help-navigation.md), "Required
content-review gate". The mechanical checks in `scripts/check-help-topics.mjs` prove the set is the
declared one, that every governing reference still resolves against a declared requirement or principle,
and that both shipped locales answer every topic with a matching interpolation contract. They cannot
prove that an answer is _true_. This record is where that judgment is made and kept.

**Confirmed against the shipped catalogues, 2026-08-25.** T047 has landed: every judgment below was
re-made against the `help.topic.*` entries now in `src/app/i18n/locales/en.json` and `de.json`, not
against a draft. The earlier provisional caveat is struck.

**Wording changed with the confirmation**, and the findings below record the wording that shipped.
Both topics are asked in the design reference's own words, because the reference asks an equivalent
question and the reference is this feature's template: `browserPersistence` as _Where are my builds
stored?_ (with the reference's own answer), and `completedEngineeringGrades` as _Why do my
engineered stats differ in game?_ (with an answer the reference's own cannot supply).

**Narrowed to two, 2026-08-27.** The set held seven. `buildLinkPrivacy`, `accountsUploadsTelemetry`
and `offlineAssets` each restated constitution I, `hullFactsAndBuildResults` explained a distinction
features 003 and 005 draw on screen, and `almanacOwnership` was a credit rather than a question. The
reviews of the five are not kept: a content review is a judgment about text that ships, and text
that does not ship has nothing to judge. What the fifth of them carried does ship — the
once-per-application Almanac credit is now the `ABOUT` provenance sentence FR-008 requires, and
whoever next edits that sentence should read this paragraph before shortening it.

Re-run this review whenever an English question, an English answer or a governing reference changes;
a topic left unchecked is a release failure, not a note to come back to.

For each topic:

1. every factual sentence is supported by at least one cited accepted source;
2. no sentence contradicts a cited source or another accepted requirement;
3. no answer promises behaviour outside FR-010 or describes anything unbuilt; and
4. the German answer preserves the reviewed meaning.

## 1. `browserPersistence` — "Where are my builds stored?"

**Governed by** constitution principle I and feature 001 FR-008, FR-013 and FR-014.

| Check | Finding                                                                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | FR-008, FR-013 and FR-014 place the working build, the named builds and the preferences in browser storage on the device. That clearing site data removes them and that they do not travel is the direct consequence, and the export/share remedy is feature 004 and FR-015 as built. |
| 2     | Does not contradict the persistence-failure states feature 001 already words; the answer describes where things live, not that storing always succeeds.                                                                                                                               |
| 3     | No promise of sync, accounts or a server copy — the answer's remedy is the two exports that exist.                                                                                                                                                                                    |
| 4     | German uses the shipped `Aufbauten` vocabulary, keeps the preferences clause and keeps the same remedy.                                                                                                                                                                               |

## 2. `completedEngineeringGrades` — "Why do my engineered stats differ in game?"

**Governed by** constitution principle IV and feature 002 FR-013.

| Check | Finding                                                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | FR-013 requires every selected ordinary grade to represent 100% quality and requires partial imported quality to be completed by the Almanac or refused. Principle IV is the lossless-and-honest rule behind it. The answer states the invariant and both import outcomes.                             |
| 2     | This is the topic the reference mock gets wrong: its FAQ says an imported module keeps its real roll, which contradicts FR-013 outright. That wording is excluded, and `scripts/check-help-topics.mjs` refuses a catalogue that reintroduces it.                                                       |
| 3     | "Refused whole before anything opens" is the behaviour feature 004 ships today. The reference asks this question and answers it with a retained real roll; the question is kept because it is the question a Commander has, and the answer is replaced because FR-013 contradicts the reference's own. |
| 4     | German states the same invariant and the same atomic refusal.                                                                                                                                                                                                                                          |

## Excluded from the reference mock

Three of the reference FAQ's four questions are not topics here, and none is an oversight:

- **"What can I import?"** describes an import behaviour feature 004 owns. Its reference answer is
  not in fact unsupportable — feature 004 FR-007 accepts pasted SLEF JSON or one journal `Loadout`
  event, which is what the reference says — but the accepted topic set is the one in
  `contracts/help-navigation.md`, and import is not in it. It is excluded on scope, and it is
  the one thing the reference draws that the product does not. Recorded plainly rather than dressed
  up as a correctness finding.
- **"Do share links expose my account?"** was a topic until 2026-08-27 and is now excluded on the
  same test the surviving two pass: the answer is constitution I, which the application obeys by
  having no account to expose.
- **The retained partial roll** contradicts feature 002 FR-013 and constitution IV. It is not
  reworded, it is excluded, and the check script fails a catalogue that brings it back.
