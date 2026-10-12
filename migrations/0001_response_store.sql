CREATE TABLE IF NOT EXISTS response_receipts (
  response_receipt_id TEXT PRIMARY KEY,
  eval_slug TEXT NOT NULL,
  eval_version INTEGER NOT NULL,
  source_host TEXT NOT NULL,
  consent INTEGER NOT NULL CHECK (consent = 1),
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
);

CREATE TABLE IF NOT EXISTS response_answers (
  response_receipt_id TEXT NOT NULL REFERENCES response_receipts(response_receipt_id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  answer_text TEXT NOT NULL,
  PRIMARY KEY (response_receipt_id, question_index)
);

CREATE INDEX IF NOT EXISTS idx_response_receipts_eval ON response_receipts(eval_slug, eval_version, created_at);
