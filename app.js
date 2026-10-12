const coreyDraft = {
  dimensions: [
    { name: 'Fear of failure', note: 'Avoiding action because the outcome might disconfirm capability.' },
    { name: 'Fear of ridicule', note: 'Avoiding visibility because of anticipated judgment.' },
    { name: 'Fear of uncertainty', note: 'Delaying action until more information feels available.' },
    { name: 'Fear of success', note: 'Resisting the identity, responsibility, or change success would require.' },
    { name: 'Avoidance through activity', note: 'Staying busy enough to avoid the decision underneath the work.' }
  ],
  questions: [
    { text: 'You have enough information to make a reversible decision, but still want to research. What is happening?', tag: 'uncertainty' },
    { text: 'Which person is showing the larger Action Gap?', tag: 'comparative judgment' },
    { text: 'What would become possible if the decision were made before you felt ready?', tag: 'readiness' }
  ]
};
const genericDraft = {
  dimensions: [
    { name: 'Primary constraint', note: 'The recurring bottleneck your work helps people recognize.' },
    { name: 'Behavioral signal', note: 'What the constraint looks like in observable decisions.' },
    { name: 'Desired shift', note: 'The change your framework recommends testing.' }
  ],
  questions: [
    { text: 'What distinction do you make that people in your field usually miss?', tag: 'taste extraction' },
    { text: 'Which of these two situations better represents the problem you help solve?', tag: 'comparative judgment' }
  ]
};

const $ = (id) => document.getElementById(id);
let currentDraft = null;
const draftKey = (host) => `creator-eval:draft:${host}`;
const versionsKey = (host) => `creator-eval:versions:${host}`;
function cloneDraft(draft) { return JSON.parse(JSON.stringify(draft)); }
function persistDraft() {
  if (!currentDraft) return;
  localStorage.setItem(draftKey(currentDraft.host), JSON.stringify(currentDraft));
  if ($('saveStatus')) $('saveStatus').textContent = 'Saved locally on this device.';
}
function restoreDraft(draft) {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey(draft.host)) || 'null');
    return saved && saved.title && saved.dimensions ? saved : draft;
  } catch { return draft; }
}
function encodeDraft(draft) {
  const bytes = new TextEncoder().encode(JSON.stringify(draft));
  let binary = ''; bytes.forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeDraft(value) {
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}
function saveVersion() {
  if (!currentDraft) return;
  const versions = JSON.parse(localStorage.getItem(versionsKey(currentDraft.host)) || '[]');
  const version = { version: versions.length + 1, saved_at: new Date().toISOString(), draft: null };
  currentDraft.version = version.version;
  version.draft = cloneDraft(currentDraft);
  versions.unshift(version);
  localStorage.setItem(versionsKey(currentDraft.host), JSON.stringify(versions.slice(0, 10)));
  renderVersionHistory();
  $('saveStatus').textContent = `Version ${version.version} saved locally.`;
}
function renderVersionHistory() {
  if (!currentDraft || !$('versionHistory')) return;
  const versions = JSON.parse(localStorage.getItem(versionsKey(currentDraft.host)) || '[]');
  $('versionHistory').hidden = versions.length === 0;
  $('versionHistory').innerHTML = versions.map((item) => `<div class="version-item"><span>Version ${item.version}</span><span>${new Date(item.saved_at).toLocaleString()}</span></div>`).join('');
}
function renderPersonalizedReport(data) {
  const report = data.report;
  $('personalizedReport').hidden = false;
  $('personalizedReport').innerHTML = `<div class="report-kicker">DRAFT REPORT · RECEIPT ${esc(data.report_receipt_id)}</div><h3>Current constraint: ${esc(report.primary_constraint)}</h3><div class="report-confidence">CONFIDENCE: ${esc(report.confidence)} · METHOD: ${esc(report.method)}</div><p>${esc(report.observation)}</p><p>${esc(report.interpretation)}</p><div class="report-experiment"><span>NEXT EXPERIMENT</span><p>${esc(report.next_experiment)}</p></div><div class="report-retest">RE-TEST · ${esc(report.re_test)}</div><small>${esc(report.claim_boundary)}</small>`;
}
function renderRespondent(draft) {
  document.querySelector('.hero').hidden = true;
  $('workspace').hidden = true;
  $('respondentView').hidden = false;
  $('respondentContent').innerHTML = `<article class="respondent-card"><div class="eyebrow">${esc(draft.host || 'CREATOR EVAL')}</div><h2>${esc(draft.title)}</h2><p class="respondent-question">${esc(draft.question)}</p><form id="respondentForm" class="respondent-form">${draft.questions.map((q, i) => `<div class="respondent-question-row"><label for="response-${i}">${esc(q.text)}</label><textarea id="response-${i}" rows="3" required></textarea></div>`).join('')}<label class="consent-row"><input id="responseConsent" type="checkbox" required> I agree that these responses may be stored for this evaluation and used to generate a report.</label><button class="respondent-submit" type="submit">Submit responses →</button></form><div id="respondentReceipt" class="respondent-receipt" hidden></div><div id="personalizedReport" class="personalized-report" hidden></div></article>`;
  $('respondentForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const answers = draft.questions.map((_, i) => $(`response-${i}`).value);
    const payload = { eval_slug: draft.slug || (draft.host || 'creator-eval').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase(), eval_version: Number(draft.version || 1), source_host: draft.host || 'unknown', consent: $('responseConsent').checked, answers };
    try {
      const response = await fetch('/api/responses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Response store unavailable.');
      $('respondentReceipt').hidden = false;
      $('respondentReceipt').innerHTML = `<strong>Response recorded.</strong><br>Receipt: ${esc(data.response_receipt_id)}<br>Status: ${esc(data.status)}.`;
      const reportResponse = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ response_receipt_id: data.response_receipt_id, eval_slug: payload.eval_slug, answers }) });
      const reportData = await reportResponse.json();
      if (!reportResponse.ok) throw new Error(reportData.error || 'Report generation unavailable.');
      renderPersonalizedReport(reportData);
    } catch (error) {
      localStorage.setItem(`creator-eval:response:${Date.now()}`, JSON.stringify({ ...payload, stored: 'local-only fallback', error: error.message }));
      $('respondentReceipt').hidden = false;
      $('respondentReceipt').innerHTML = `<strong>Response recorded in this browser.</strong><br>This is a local-only fallback because the response store is unavailable. No score or report was claimed.`;
    }
  });
}
function bootRespondent() {
  const shared = new URLSearchParams(location.search).get('eval');
  if (!shared) return;
  const draft = decodeDraft(shared);
  if (draft && draft.title && draft.questions) renderRespondent(draft);
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function hostFromInput(value) {
  try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return ''; }
}
function renderDimensions() {
  $('dimensionCount').textContent = `${currentDraft.dimensions.length} FOUND`;
  $('dimensions').innerHTML = currentDraft.dimensions.map((d, i) => `
    <article class="dimension" data-index="${i}">
      <div class="dimension-top"><span class="number">0${i+1}</span><input class="inline-input dim-name" value="${esc(d.name)}"><button class="remove" aria-label="Remove dimension">×</button></div>
      <textarea class="inline-input dim-note" rows="2">${esc(d.note)}</textarea>
    </article>`).join('');
  document.querySelectorAll('.dimension').forEach((el) => {
    const i = Number(el.dataset.index);
    el.querySelector('.dim-name').addEventListener('input', (e) => { currentDraft.dimensions[i].name = e.target.value; persistDraft(); });
    el.querySelector('.dim-note').addEventListener('input', (e) => { currentDraft.dimensions[i].note = e.target.value; persistDraft(); });
    el.querySelector('.remove').addEventListener('click', () => { currentDraft.dimensions.splice(i, 1); persistDraft(); renderDimensions(); renderCalibration(); });
  });
}
function renderQuestions() {
  $('questions').innerHTML = currentDraft.questions.map((q, i) => `
    <article class="question" data-index="${i}"><span class="question-number">Q${String(i+1).padStart(2,'0')}</span><textarea class="inline-input q-text" rows="2">${esc(q.text)}</textarea><input class="tag-input" value="${esc(q.tag)}"><button class="remove" aria-label="Remove question">×</button></article>`).join('');
  document.querySelectorAll('.question').forEach((el) => {
    const i = Number(el.dataset.index);
    el.querySelector('.q-text').addEventListener('input', (e) => { currentDraft.questions[i].text = e.target.value; persistDraft(); });
    el.querySelector('.tag-input').addEventListener('input', (e) => { currentDraft.questions[i].tag = e.target.value; persistDraft(); });
    el.querySelector('.remove').addEventListener('click', () => { currentDraft.questions.splice(i, 1); persistDraft(); renderQuestions(); });
  });
}
function renderCalibration() {
  if (!currentDraft.calibration) currentDraft.calibration = currentDraft.dimensions.map((d) => ({ dimension: d.name, decision: 'pending', evidence_link: '' }));
  currentDraft.calibration = currentDraft.dimensions.map((d) => currentDraft.calibration.find((c) => c.dimension === d.name) || ({ dimension: d.name, decision: 'pending', evidence_link: '' }));
  $('calibrationDecisions').innerHTML = currentDraft.dimensions.map((d, i) => {
    const item = currentDraft.calibration[i];
    return `<article class="calibration-card" data-index="${i}">
      <div><div class="calibration-name">${esc(d.name)}</div><div class="calibration-note">${esc(d.note)}</div></div>
      <div class="calibration-actions" role="group" aria-label="Calibration decision for ${esc(d.name)}">
        ${['strong','weak','unrelated'].map((decision) => `<button type="button" data-decision="${decision}" class="${item.decision === decision ? 'selected' : ''}">${decision === 'strong' ? 'Strong signal' : decision === 'weak' ? 'Weak signal' : 'Unrelated'}</button>`).join('')}
      </div>
      <input class="evidence-link" placeholder="Evidence note or public URL fragment (optional)" value="${esc(item.evidence_link)}" aria-label="Evidence for ${esc(d.name)}">
    </article>`;
  }).join('');
  document.querySelectorAll('.calibration-card').forEach((card) => {
    const i = Number(card.dataset.index);
    card.querySelectorAll('[data-decision]').forEach((button) => button.addEventListener('click', () => {
      currentDraft.calibration[i].decision = button.dataset.decision;
      persistDraft();
      renderCalibration();
    }));
    card.querySelector('.evidence-link').addEventListener('input', (event) => { currentDraft.calibration[i].evidence_link = event.target.value; persistDraft(); });
  });
}
function renderWorkspace() {
  renderDimensions(); renderQuestions(); renderCalibration();
  $('evalTitle').value = currentDraft.title;
  $('question').value = currentDraft.question;
}
function makeDraft(host) {
  const source = host === 'coreywilkspsyd.com' ? coreyDraft : genericDraft;
  return { host, title: host === 'coreywilkspsyd.com' ? 'The Action Gap Assessment' : 'The Expertise Assessment', question: host === 'coreywilkspsyd.com' ? "What's most likely preventing you from turning your ambition into action right now?" : 'What is the hidden constraint your framework helps people see?', dimensions: structuredClone(source.dimensions), questions: structuredClone(source.questions) };
}
function loadCompiledDraft(host) {
  if (host !== 'coreywilkspsyd.com') return Promise.reject(new Error('No compiled source record for this host.'));
  return fetch('/data/evals/corey-action-gap.v1.json').then((response) => { if (!response.ok) throw new Error('Compiled record unavailable.'); return response.json(); });
}
$('analyzeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const value = $('siteUrl').value.trim();
  const host = hostFromInput(value);
  if (!host) { $('formStatus').textContent = 'Enter a complete public URL, including https://'; return; }
  $('formStatus').textContent = 'Reading the public site and drafting its hidden evaluation model…';
  loadCompiledDraft(host).then((draft) => ({ draft })).catch(() => fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: value }) })
    .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Analysis failed.'); return data; }))
    .then((data) => {
      currentDraft = restoreDraft({ ...data.draft, host });
      $('sourceHost').textContent = host;
      $('formStatus').textContent = 'Draft ready. It is an interpretation, not a claim of truth.';
      $('workspace').hidden = false;
      renderWorkspace();
      $('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    })
    .catch((error) => {
      currentDraft = restoreDraft({ ...makeDraft(host), host });
      $('sourceHost').textContent = host;
      $('formStatus').textContent = `${error.message} Showing a local scaffold for review.`;
      $('workspace').hidden = false;
      renderWorkspace();
      $('workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
$('addDimension').addEventListener('click', () => { currentDraft.dimensions.push({name:'New dimension',note:'What this dimension means and what observable behavior would support it.'}); persistDraft(); renderDimensions(); renderCalibration(); });
$('addQuestion').addEventListener('click', () => { currentDraft.questions.push({text:'Write a scenario that separates weak, average, and excellent judgment.',tag:'new'}); persistDraft(); renderQuestions(); });
$('evalTitle').addEventListener('input', (e) => { currentDraft.title = e.target.value; persistDraft(); });
$('question').addEventListener('input', (e) => { currentDraft.question = e.target.value; persistDraft(); });
$('resetBtn').addEventListener('click', () => { $('workspace').hidden = true; $('formStatus').textContent = ''; $('siteUrl').focus(); });
$('saveDraftBtn').addEventListener('click', () => { persistDraft(); renderVersionHistory(); });
$('saveVersionBtn').addEventListener('click', () => { persistDraft(); saveVersion(); });
$('publishBtn').addEventListener('click', () => {
  if (!currentDraft) return;
  persistDraft();
  const published_url = `${window.location.origin}${window.location.pathname}?eval=${encodeDraft(currentDraft)}`;
  $('saveStatus').textContent = 'Respondent preview opened in a new tab. This is not a public response store yet.';
  window.open(published_url, '_blank', 'noopener');
});
$('exportBtn').addEventListener('click', () => {
  const payload = { source: currentDraft.host, version: currentDraft.version || 0, title: currentDraft.title, question: currentDraft.question, dimensions: currentDraft.dimensions, questions: currentDraft.questions, calibration: currentDraft.calibration, published_url: `${window.location.origin}${window.location.pathname}?eval=${encodeDraft(currentDraft)}`, reporting: { fields: ['score by dimension','evidence responses','interpretation','confidence','recommended experiment','re-test date'], claim_boundary: 'A draft interpretation is not a diagnosis.', evidence_link: 'Each dimension should carry a creator-provided evidence note or public URL fragment.' } };
  $('exportOutput').hidden = false;
  $('exportOutput').textContent = JSON.stringify(payload, null, 2);
  $('exportOutput').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
bootRespondent();
