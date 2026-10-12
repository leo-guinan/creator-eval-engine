const MAX_BYTES = 1_500_000;

function stripTags(value) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/g, "'").replace(/&quot;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function matches(html, pattern, limit = 12) {
  return [...html.matchAll(pattern)].slice(0, limit).map((m) => stripTags(m[1] || '')).filter(Boolean);
}

function draftFromEvidence(host, title, description, headings) {
  const cleanHeadings = headings.filter((h) => h.length > 2).slice(0, 5);
  const dimensions = cleanHeadings.length >= 3
    ? cleanHeadings.map((name) => ({ name, note: `A proposed evaluation dimension extracted from ${host}'s public language. Confirm what strong and weak evidence looks like.` }))
    : [
        { name: 'Primary constraint', note: 'The recurring bottleneck this creator helps people recognize.' },
        { name: 'Behavioral signal', note: 'What that constraint looks like in observable decisions.' },
        { name: 'Desired shift', note: 'The change the creator recommends testing.' },
      ];
  const subject = title || host;
  return {
    title: `The ${subject.replace(/\s+/g, ' ').slice(0, 48)} Assessment`,
    question: `What is the hidden constraint ${host} helps people see, and what should you test next?`,
    dimensions,
    questions: [
      { text: `Which situation most closely matches the problem described in ${host}'s work?`, tag: 'problem recognition' },
      { text: 'What do you already know you should do, but keep postponing or complicating?', tag: 'action gap' },
      { text: 'What observable change would convince you that the constraint is shifting?', tag: 'evidence' },
    ],
    reporting: { fields: ['score by dimension', 'evidence responses', 'interpretation', 'confidence', 'recommended experiment', 're-test date'] },
    evidence: { title, description, headings: cleanHeadings },
  };
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return Response.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  let url;
  try {
    url = new URL(body.url);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch { return Response.json({ error: 'Enter a complete public http(s) URL.' }, { status: 400 }); }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url.toString(), { headers: { 'User-Agent': 'CreatorEvalDraft/0.1' }, signal: controller.signal });
    if (!response.ok) return Response.json({ error: `The source returned HTTP ${response.status}.` }, { status: 422 });
    const html = (await response.text()).slice(0, MAX_BYTES);
    const title = matches(html, /<title[^>]*>([\s\S]*?)<\/title>/i, 1)[0] || '';
    const description = matches(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i, 1)[0] || '';
    const headings = matches(html, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, 12);
    return Response.json({ source: url.hostname, draft: draftFromEvidence(url.hostname, title, description, headings) });
  } catch (error) {
    return Response.json({ error: error.name === 'AbortError' ? 'The source took too long to answer.' : 'The source could not be analyzed.' }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
