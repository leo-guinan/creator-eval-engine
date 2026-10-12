from pathlib import Path

ROOT = Path(__file__).parent


def test_report_receipts_are_persisted():
    sql = (ROOT / 'migrations/0002_report_receipts.sql').read_text()
    fn = (ROOT / 'functions/api/reports.js').read_text()
    assert 'CREATE TABLE IF NOT EXISTS report_receipts' in sql
    assert 'INSERT INTO report_receipts' in fn
    assert 'response_receipt_id' in fn


def test_report_api_requires_durable_store():
    fn = (ROOT / 'functions/api/reports.js').read_text()
    assert 'context.env.DB' in fn
    assert 'report_json' in fn
