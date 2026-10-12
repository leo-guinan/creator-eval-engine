from pathlib import Path

ROOT = Path(__file__).parent


def test_report_lookup_contract_exists():
    fn = (ROOT / 'functions/api/reports.js').read_text()
    html = (ROOT / 'index.html').read_text()
    js = (ROOT / 'app.js').read_text()
    assert 'onRequestGet' in fn
    assert 'report_receipt_id' in fn
    assert 'reportLookup' in html
    assert "fetch(`/api/reports?report_receipt_id=" in js


def test_report_history_is_local_and_explicit():
    js = (ROOT / 'app.js').read_text()
    assert 'creator-eval:report-history' in js
    assert 'kept in this browser only' in (ROOT / 'index.html').read_text()
