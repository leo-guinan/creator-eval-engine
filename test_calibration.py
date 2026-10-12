from pathlib import Path

ROOT = Path(__file__).parent


def test_calibration_loop_has_decision_surface():
    html = (ROOT / 'index.html').read_text()
    js = (ROOT / 'app.js').read_text()
    assert 'calibration' in html
    assert 'calibrationDecisions' in js
    assert 'data-decision' in js


def test_calibration_loop_preserves_exported_decisions():
    js = (ROOT / 'app.js').read_text()
    assert 'calibration: currentDraft.calibration' in js
    assert 'evidence_link' in js
