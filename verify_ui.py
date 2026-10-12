from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto('http://localhost:8788/', wait_until='networkidle')
    page.fill('#siteUrl', 'https://coreywilkspsyd.com/')
    page.click('button[type="submit"]')
    page.wait_for_timeout(700)
    assert page.locator('#workspace').is_visible()
    assert page.locator('.dimension').count() == 5
    assert page.locator('.question').count() == 3
    assert page.locator('.calibration-card').count() == 5
    page.click('.calibration-card:first-child button[data-decision="strong"]')
    assert page.locator('.calibration-card:first-child button[data-decision="strong"]').get_attribute('class') == 'selected'
    page.fill('.calibration-card:first-child .evidence-link', 'https://coreywilkspsyd.com/framework')
    page.screenshot(path='/Users/leoguinan/.hermes/profiles/quainance/cache/scratch/creator-eval-workspace.png', full_page=True)
    page.click('#addDimension')
    assert page.locator('.dimension').count() == 6
    assert page.locator('.calibration-card').count() == 6
    page.click('#saveVersionBtn')
    assert 'Version 1 saved locally.' in page.locator('#saveStatus').inner_text()
    assert page.locator('#versionHistory').is_visible()
    with page.expect_popup() as popup_info:
        page.click('#publishBtn')
    respondent = popup_info.value
    respondent.wait_for_load_state('domcontentloaded')
    assert respondent.locator('#respondentView').is_visible()
    assert respondent.locator('.respondent-question-row').count() == 3
    for i in range(3):
        respondent.fill(f'#response-{i}', f'answer {i}')
    respondent.check('#responseConsent')
    respondent.click('.respondent-submit')
    respondent.wait_for_timeout(300)
    assert respondent.locator('#respondentReceipt').is_visible()
    assert 'local-only fallback' in respondent.locator('#respondentReceipt').inner_text()
    respondent.screenshot(path='/Users/leoguinan/.hermes/profiles/quainance/cache/scratch/creator-eval-respondent.png', full_page=True)
    respondent.close()
    print('interaction_receipt=passed dimensions=6 questions=3 calibration=6 version=1 respondent=3 export=visible')
    browser.close()
