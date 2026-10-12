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

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }
  const responseReceiptId = typeof body.response_receipt_id === 'string' ? body.response_receipt_id.trim() : '';
  const evalSlug = typeof body.eval_slug === 'string' ? body.eval_slug.trim() : '';
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!responseReceiptId || !evalSlug || answers.length === 0 || answers.length > 100 || answers.some((answer) => typeof answer !== 'string' || !answer.trim())) {
    return json({ error: 'A response receipt, eval slug, and bounded answers are required.' }, 400);
  }
  if (evalSlug !== 'corey-action-gap') return json({ error: 'No approved scoring rubric exists for this eval.' }, 422);
  const scored = scoreAnswers(answers);
  const reportReceiptId = crypto.randomUUID();
  const primary = scored.primary_constraint;
  return json({
    report_receipt_id: reportReceiptId,
    response_receipt_id: responseReceiptId,
    report: {
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
    }
  });
}
