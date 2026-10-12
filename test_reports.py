from pathlib import Path

ROOT = Path(__file__).parent


def test_report_contract_exists():
    fn = (ROOT / 'functions/api/reports.js').read_text()
    rubric = (ROOT / 'functions/lib/corey-action-gap.js').read_text()
    assert 'onRequestPost' in fn
    assert 'report_receipt_id' in fn
    assert 'heuristic' in fn
    assert 'scoring' in rubric


def test_frontend_requests_and_renders_report():
    js = (ROOT / 'app.js').read_text()
    assert "fetch('/api/reports'" in js
    assert 'personalizedReport' in js
    assert 'MISSING' in (ROOT / 'functions/api/reports.js').read_text()
