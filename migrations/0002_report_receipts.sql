CREATE TABLE IF NOT EXISTS report_receipts (
  report_receipt_id TEXT PRIMARY KEY,
  response_receipt_id TEXT NOT NULL UNIQUE REFERENCES response_receipts(response_receipt_id) ON DELETE CASCADE,
  eval_slug TEXT NOT NULL,
  report_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
);

CREATE INDEX IF NOT EXISTS idx_report_receipts_response ON report_receipts(response_receipt_id);
