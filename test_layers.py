from pathlib import Path

ROOT = Path(__file__).parent


def test_persistence_and_published_assessment_surfaces_exist():
    html = (ROOT / 'index.html').read_text()
    js = (ROOT / 'app.js').read_text()
    assert 'saveDraftBtn' in html
    assert 'publishBtn' in html
    assert 'respondentView' in html
    assert 'localStorage' in js
    assert 'encodeDraft' in js
    assert 'renderRespondent' in js
    assert 'data/evals/corey-action-gap.v1.json' in js

def test_version_receipt_is_part_of_export_contract():
    js = (ROOT / 'app.js').read_text()
    assert 'version:' in js
    assert 'versions' in js
    assert 'published_url' in js
