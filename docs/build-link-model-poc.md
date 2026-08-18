# Build-link pinned symbol models — proof of concept

## Status

Proof of concept on a branch; not part of the shipped format. Table 1 carries no models, so every
frozen literal, every published-link obligation, and every adaptive layout decision is byte-for-byte
unchanged. The demonstration lives in `build-link-codec-models.spec.ts`, which clones table 1 as an
in-memory table 2 with a `MODELS` block and measures it against production table 1.

## What it demonstrates

The arithmetic renderer currently codes every symbol against a uniform distribution over its
cardinality. Real builds are heavily skewed: grades are usually maximal, engineered modules usually
carry an experimental effect, identities almost always resolve through their contextual candidate
set, and explicit enabled states are usually `on`. This POC lets a table pin integer frequency
weights for those symbols, so the arithmetic coder assigns short intervals to common values.

Because the weights are data in the versioned, immutable table, canonicality is untouched: encoder
and decoder read the same frozen numbers, and the decoder's exact reserialization check works
exactly as before.

## Design constraints kept

- **Bit packing ignores models entirely.** Packed bodies are unchanged, and the packed-bit cost
  proxy that selects every adaptive layout (index-set modes, baseline-versus-absolute, references)
  is model-independent. Layout choices are therefore identical with and without models.
- **The canonical body is still the shorter of the packed and arithmetic renderings.** A model that
  mispredicts a build can only push that build back to its packed rendering; it can never produce a
  link longer than bit packing.
- **Models are optional table data.** A table without a `MODELS` block behaves exactly as today.
  Table 1 is such a table. A future table that pins models is a new table number like any other
  catalogue change, covered by the existing content-hash discipline.

## Modelled symbols

| Model                  | Symbol                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `GRADE_IS_MAX`         | The ordinary record's maximum-grade boolean                     |
| `EXPERIMENTAL_PRESENT` | The ordinary record's experimental-effect presence boolean      |
| `CONTEXT_HIT`          | Contextual-set membership of module/blueprint/effect identities |
| `POWER_ON`             | Explicit enabled states (absent / off / on)                     |
| `POWER_PRIORITY`       | Explicit priorities (absent / 0–4)                              |
| `CONTEXT_INDEX_DECAY`  | Geometric prior over contextual-set positions (placeholder)     |
| `CONTEXT_ADAPTATION`   | Per-run adaptive contexts over back-reference indexes           |
| `NAME_CHARACTERS`      | Per-character weights for the ship name (English-like)          |
| `IDENT_CHARACTERS`     | Per-character weights for the ship ident (callsign-like)        |

The weight lists are integers; a symbol's interval is its weight's share of the list total. The
coder's 64-bit state keeps floor-division exact for totals far above the enforced
`MAX_MODEL_WEIGHT_TOTAL` cap.

## Adaptive contexts

`CONTEXT_ADAPTATION` adds deterministic within-stream learning: a back-reference index is coded
against a per-run frequency context that starts uniform and bumps the coded symbol's weight by the
pinned increment after each use, so a target referenced repeatedly in one build gets cheaper each
time. Encoder, decoder, and canonical reserialization replay the identical symbol sequence, which
is all the mechanism needs — no new canonicality machinery. Adaptation lives only in the two
renderers and the arithmetic reader, never at symbol-capture or cost-model time, so the packed
render and every packed-cost layout decision stay model-independent. Contexts are keyed by the
identity of their dictionary array, so per-run back-reference dictionaries key their own context
on both sides.

Two measured findings shaped the design:

- **Candidate-set literals must not adapt.** A first draft adapted every contextual-set index and
  the Corvette grew from 97 to 102 characters: the grammar's back-referencing already dedupes
  repeats out of the literal streams, so what remains is repetition-poor, and each new distinct
  value paid for the counts accumulated by earlier ones. The insight generalises: adaptive models
  fight explicit dictionary coding unless they are confined to the streams where repetition
  survives — the reference indexes themselves.
- **A small increment saturates the win.** With adaptation confined to reference streams, an
  increment of 8 already captures the full Anaconda saving (65 characters) while leaving the
  diverse-reference Corvette exactly at its static-prior length (97); increments of 32, 128, and
  1,024 progressively hand the Corvette's gain back (98, 99, 102) by penalising each new
  reference target. The POC pins 8.

## What is deliberately not solved here

- **Identity weights are a placeholder.** Table 1's candidate sets are catalogue-ordered, so
  `CONTEXT_INDEX_DECAY` has no popularity signal to exploit, and measurement confirms it: a 63/64
  decay leaves the Anaconda at 71 but costs the Corvette two characters (99 instead of 97), a 7/8
  decay gains the Anaconda two more (69) while pushing the Corvette past its arithmetic rendering
  entirely (back to its 114-character packed body). The POC therefore pins the decay uniform and
  keeps the knob only to exercise the mechanism. A production table would pin popularity-ordered
  candidate sets (free — ordering is already table data) or explicit per-set weights, which is
  where most of the remaining win lives. That requires a usage corpus and is table-generation
  work, not codec work.
- **Weights are hand-estimated.** The POC's skews are defensible priors, not measurements.
- **The table generator does not emit `MODELS`** and the content-hash/capacity tooling has not been
  extended. Both are mechanical follow-ups once real weights exist.
- **Grammar-conditional models** (for example, conditioning an experimental effect on its blueprint)
  are out of scope; the mechanism supports them by pinning more cumulative tables, at more table
  bytes.

## Measured results

`build-link-codec-models.spec.ts` prints the comparison on every run and asserts that no reference
or hull link lengthens while the engineered references shrink. The comparison baseline is the same
table without models: comparing across table versions would fold in an unrelated ±1-character
artifact, because the version value changes the payload bytes and CRC and can move the Base70
digit count on its own.

With the POC weights (semantic priors, per-field character models, reference-stream adaptation at
increment 8, identity indexes uniform):

| Reference build              | Unmodelled | Modelled | Saving |
| ---------------------------- | ---------: | -------: | -----: |
| Empty Sidewinder             |         12 |       12 |      — |
| Stock Krait Mk II            |         11 |       11 |      — |
| Engineered Anaconda          |         76 |       65 | −14.5% |
| Supplied engineered Corvette |        108 |       97 | −10.2% |
| Named stock Krait Mk II      |         38 |       34 | −10.5% |

The win concentrates exactly where links are longest — dense engineered builds — while empty and
stock links keep their packed rendering unchanged. The static priors carry the Corvette (whose
engineering is diverse), adaptation carries the Anaconda (whose few records repeat across many
mounts), and the split character models carry the labels: the earlier single English model saved
the named build one character because the callsign-style ident paid for rare letters and digits;
ident-specific weights recover the rest.
