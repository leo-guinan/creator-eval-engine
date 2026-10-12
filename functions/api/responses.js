function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestPost(context) {
  if (!context.env.DB) return json({ error: 'Response store is not configured.' }, 503);
  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON body.' }, 400); }
  const evalSlug = typeof body.eval_slug === 'string' ? body.eval_slug.trim() : '';
  const sourceHost = typeof body.source_host === 'string' ? body.source_host.trim() : '';
  const version = Number(body.eval_version);
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (!evalSlug || !sourceHost || !Number.isInteger(version) || version < 1 || body.consent !== true || answers.length === 0 || answers.length > 100) {
    return json({ error: 'A versioned eval, source host, consent, and bounded answers are required.' }, 400);
  }
  const cleaned = answers.map((answer) => typeof answer === 'string' ? answer.trim().slice(0, 5000) : '').filter(Boolean);
  if (cleaned.length !== answers.length) return json({ error: 'Every answer must be non-empty text.' }, 400);
  const receiptId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const statements = [context.env.DB.prepare('INSERT INTO response_receipts (response_receipt_id, eval_slug, eval_version, source_host, consent, created_at) VALUES (?, ?, ?, ?, 1, ?)').bind(receiptId, evalSlug, version, sourceHost, createdAt), ...cleaned.map((answer, index) => context.env.DB.prepare('INSERT INTO response_answers (response_receipt_id, question_index, answer_text) VALUES (?, ?, ?)').bind(receiptId, index, answer))];
  try {
    await context.env.DB.batch(statements);
    return json({ response_receipt_id: receiptId, eval_slug: evalSlug, eval_version: version, status: 'received', created_at: createdAt });
  } catch (error) {
    return json({ error: 'Response could not be recorded.', detail: error.message }, 500);
  }
}
