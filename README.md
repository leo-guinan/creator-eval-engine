# Creator Eval Engine

A source-bounded tool for turning a creator or coach's public framework into an editable evaluation draft.

Live surface: https://tools.leoasaservice.com/

## What is stored as code

`data/registry.json` is the lookup registry.

`data/evals/*.json` contains compiled, public-safe evaluation drafts. Each record keeps:

- source host and coverage boundary;
- proposed dimensions;
- questions;
- creator calibration state;
- reporting fields and provenance chain;
- attribution/claim limits.

The current Corey record is a draft interpretation of public material. It is not a diagnosis, endorsement, or claim that the creator approved the model.

## Runtime layers

1. Public website analysis extracts bounded structure from a submitted public URL.
2. Compiled records can be looked up from `data/evals/` before a fresh extraction.
3. Creator calibration marks dimensions as strong, weak, or unrelated and adds evidence notes.
4. Drafts persist locally in the browser and can be versioned locally.
5. A respondent preview can be shared as an encoded draft URL.
6. Preview responses remain local-only until a consented response store is added.

## Privacy boundary

Do not commit respondent answers, emails, access tokens, API keys, private creator notes, or raw crawl dumps. This repository is for compiled public-safe definitions and schemas, not participant data.

## Verification

```text
pytest -q test_calibration.py test_layers.py
node --check app.js
node --check functions/api/analyze.js
python3 verify_ui.py
```

The current respondent view is deliberately labeled a preview. It does not score, transmit, or claim to generate a validated report.
