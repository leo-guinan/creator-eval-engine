from pathlib import Path

ROOT = Path(__file__).parent


def test_response_store_contract_exists():
    assert (ROOT / 'migrations/0001_response_store.sql').exists()
    sql = (ROOT / 'migrations/0001_response_store.sql').read_text()
    fn = (ROOT / 'functions/api/responses.js').read_text()
    assert 'CREATE TABLE IF NOT EXISTS response_receipts' in sql
    assert 'onRequestPost' in fn
    assert 'consent' in fn
    assert 'response_receipt_id' in fn


def test_frontend_uses_remote_response_receipt():
    js = (ROOT / 'app.js').read_text()
    assert "fetch('/api/responses'" in js
    assert 'response_receipt_id' in js
    assert 'local-only fallback' in js
