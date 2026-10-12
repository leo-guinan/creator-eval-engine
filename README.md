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
6. Respondent submissions require explicit consent and are written to the Cloudflare D1 response store, producing a response receipt ID.
7. If the store is unavailable, the browser uses a visibly labeled local-only fallback.
8. A creator-approved rubric can generate a draft personalized report with a report receipt.

## Response store boundary

The D1 schema stores an eval slug/version, source host, consent flag, timestamp, response receipt ID, and bounded answer text. It does not collect email, IP address, user agent, or other identity fields.

## Report boundary

The first rubric is intentionally narrow and deterministic: keyword signals over response text. It emits `MISSING` when no supported signal exists, labels confidence as low or low-to-moderate, names the method, and includes a claim boundary. It does not diagnose, infer traits, or claim causality. New evals require their own approved scoring rubric; the endpoint rejects unknown slugs. Reports are persisted against response receipt IDs and repeated requests are idempotent.


Do not commit respondent answers, emails, access tokens, API keys, private creator notes, or raw crawl dumps. This repository is for compiled public-safe definitions and schemas, not participant data.

## Verification

```text
pytest -q test_calibration.py test_layers.py test_response_store.py test_reports.py
node --check app.js
node --check functions/api/analyze.js
node --check functions/api/responses.js
node --check functions/api/reports.js
python3 verify_ui.py
```

The current respondent view is deliberately labeled a preview. It does not score answers or claim to generate a validated report. Submission storage is consent-gated and receipt-backed; the browser fallback is visibly labeled when the store is unavailable.
