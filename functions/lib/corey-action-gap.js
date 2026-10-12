export const scoring = {
  version: 1,
  method: 'keyword_signal_v1',
  claim_boundary: 'Heuristic signal only; not a diagnosis, trait score, or causal finding.',
  dimensions: {
    'Fear of failure': ['fail', 'failure', 'mistake', 'wrong', 'disappoint'],
    'Fear of ridicule': ['judge', 'judgment', 'ridicule', 'embarrass', 'visibility', 'think of me'],
    'Fear of uncertainty': ['uncertain', 'uncertainty', 'more information', 'research', 'certainty', 'not sure', 'ready', 'wait'],
    'Fear of success': ['success', 'responsibility', 'identity', 'pressure', 'change'],
    'Avoidance through activity': ['busy', 'complex', 'procrast', 'productive', 'distract', 'activity']
  }
};

export function scoreAnswers(answers) {
  const combined = answers.map((answer) => String(answer || '').toLowerCase()).join(' ');
  const results = Object.entries(scoring.dimensions).map(([dimension, terms]) => {
    const matched_terms = terms.filter((term) => combined.includes(term));
    return { dimension, signal_count: matched_terms.length, matched_terms };
  });
  const ranked = [...results].sort((a, b) => b.signal_count - a.signal_count);
  const top = ranked[0];
  return {
    scores: results,
    primary_constraint: top && top.signal_count > 0 ? top.dimension : 'MISSING',
    confidence: top && top.signal_count >= 2 ? 'low-to-moderate' : 'low',
    method: scoring.method,
    claim_boundary: scoring.claim_boundary
  };
}
