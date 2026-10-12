import { scoreAnswers } from '../lib/corey-action-gap.js';

const experiments = {
  'Fear of uncertainty': 'Choose one reversible decision. Limit information gathering to 30 minutes, then decide before the timer ends.',
  'Fear of failure': 'Define the smallest version of the action that can fail cheaply. Run it before improving the plan.',
  'Fear of ridicule': 'Share one unfinished but useful idea with a bounded audience and record what actually happened.',
  'Fear of success': 'Name the responsibility you are avoiding and design one support or boundary that would make it survivable.',
  'Avoidance through activity': 'Stop one low-value task for a week and use that time on the decision underneath the busywork.',
  'MISSING': 'Answer with one concrete recent situation before treating this draft as informative.'
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestGet(context) {
  if (!context.env.DB) return json({ error: 'Report store is not configured.' }, 503);
  const reportReceiptId = new URL(context.request.url).searchParams.get('report_receipt_id')?.trim() || '';
  if (!reportReceiptId) return json({ error: 'A report receipt ID is required.' }, 400);
  const row = await context.env.DB.prepare('SELECT report_receipt_id, response_receipt_id, eval_slug, report_json, created_at, status FROM report_receipts WHERE report_receipt_id = ?').bind(reportReceiptId).first();
  if (!row) return json({ error: 'Report receipt not found.' }, 404);
  return json({ report_receipt_id: row.report_receipt_id, response_receipt_id: row.response_receipt_id, eval_slug: row.eval_slug, created_at: row.created_at, status: row.status, report: JSON.parse(row.report_json) });
}

export async function onRequestPost(context) {
  if (!context.env.DB) return json({ error: 'Report store is not configured.' }, 503);
  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }
  const responseReceiptId = typeof body.response_receipt_id === 'string' ? body.response_receipt_id.trim() : '';
  const evalSlug = typeof body.eval_slug === 'string' ? body.eval_slug.trim() : '';
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!responseReceiptId || !evalSlug || answers.length === 0 || answers.length > 100 || answers.some((answer) => typeof answer !== 'string' || !answer.trim())) {
    return json({ error: 'A response receipt, eval slug, and bounded answers are required.' }, 400);
  }
  if (evalSlug !== 'corey-action-gap') return json({ error: 'No approved scoring rubric exists for this eval.' }, 422);
  const responseExists = await context.env.DB.prepare('SELECT response_receipt_id FROM response_receipts WHERE response_receipt_id = ?').bind(responseReceiptId).first();
  if (!responseExists) return json({ error: 'Response receipt not found.' }, 404);
  const existing = await context.env.DB.prepare('SELECT report_receipt_id, report_json FROM report_receipts WHERE response_receipt_id = ?').bind(responseReceiptId).first();
  if (existing) return json({ report_receipt_id: existing.report_receipt_id, response_receipt_id: responseReceiptId, report: JSON.parse(existing.report_json), idempotent: true });
  const scored = scoreAnswers(answers);
  const reportReceiptId = crypto.randomUUID();
  const primary = scored.primary_constraint;
  const report = {
    status: 'draft',
    primary_constraint: primary,
    confidence: scored.confidence,
    observation: primary === 'MISSING' ? 'The supplied responses did not produce a supported signal under the current rubric.' : `The current rubric found ${scored.scores.find((item) => item.dimension === primary).signal_count} lexical signal(s) associated with ${primary}.`,
    interpretation: 'This is a heuristic interpretation of response language, not a diagnosis or causal claim.',
    next_experiment: experiments[primary],
    re_test: '30 days',
    scores: scored.scores,
    method: scored.method,
    claim_boundary: scored.claim_boundary
  };
  const createdAt = new Date().toISOString();
  try {
    await context.env.DB.prepare('INSERT INTO report_receipts (report_receipt_id, response_receipt_id, eval_slug, report_json, created_at) VALUES (?, ?, ?, ?, ?)').bind(reportReceiptId, responseReceiptId, evalSlug, JSON.stringify(report), createdAt).run();
    return json({ report_receipt_id: reportReceiptId, response_receipt_id: responseReceiptId, report });
  } catch (error) {
    return json({ error: 'Report could not be recorded.', detail: error.message }, 500);
  }
}
