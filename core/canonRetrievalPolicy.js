const DEFAULT_MIN_SCORE = 2;
const DEFAULT_TOP_K = 1;

export function answerCanonQuestion(input = {}, options = {}) {
  const query = extractQuery(input);
  const corpus = normalizeCorpus(options.corpus || input.corpus || {});
  const retrieval = retrieveCanonCards(query, corpus, options);

  if (!retrieval.matches.length) {
    return buildAbstention({
      query,
      reason: retrieval.reason,
      corpus,
    });
  }

  const primary = retrieval.matches[0];
  const card = primary.card;

  if (!card?.canonicalAnswer || !card?.source?.path || !card?.source?.lines) {
    return buildAbstention({
      query,
      reason: 'MATCH_MISSING_SOURCE_OR_ANSWER',
      corpus,
    });
  }

  return {
    ok: true,
    trusted: false,
    answered: true,
    abstained: false,
    query,
    answer: card.canonicalAnswer,
    citations: retrieval.matches.map(({ card: matchedCard }) => buildCitation(matchedCard)),
    metadata: {
      policy: 'source_required_canon_retrieval_v1',
      corpusId: corpus.corpusId || null,
      corpusVersion: corpus.version || null,
      reviewStatus: corpus.reviewStatus || 'unknown',
      matchedCardIds: retrieval.matches.map(({ card: matchedCard }) => matchedCard.id),
      matchedKeywords: primary.matchedKeywords,
      topScore: primary.score,
      sourceRequired: true,
      unknownRequiresAbstention: true,
      noDirectGameMutation: true,
      noMemoryWrite: true,
      advisoryOnly: true,
    },
  };
}

export function retrieveCanonCards(query = '', corpus = {}, options = {}) {
  const normalizedQuery = normalizeText(query);
  const cards = Array.isArray(corpus.cards) ? corpus.cards : [];
  const minScore = Number(options.minScore || DEFAULT_MIN_SCORE);
  const topK = Number(options.topK || DEFAULT_TOP_K);

  if (!normalizedQuery) {
    return {
      matches: [],
      reason: 'EMPTY_QUERY',
    };
  }

  const scored = cards
    .map((card) => scoreCard(normalizedQuery, card))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score || String(a.card.id).localeCompare(String(b.card.id)));

  if (!scored.length) {
    return {
      matches: [],
      reason: 'NO_APPROVED_SOURCE',
    };
  }

  return {
    matches: scored.slice(0, Math.max(1, topK)),
    reason: 'SOURCE_MATCHED',
  };
}

export function buildCanonAbstention(query = '', reason = 'NO_APPROVED_SOURCE') {
  return buildAbstention({
    query: String(query || '').trim(),
    reason,
    corpus: {},
  });
}

function scoreCard(normalizedQuery, card = {}) {
  const keywordSpecs = Array.isArray(card.keywords) ? card.keywords : [];
  const matchedKeywords = [];
  let score = 0;

  for (const keywordSpec of keywordSpecs) {
    const keyword = typeof keywordSpec === 'string' ? keywordSpec : keywordSpec.term;
    const weight = typeof keywordSpec === 'string'
      ? inferKeywordWeight(keywordSpec)
      : Number(keywordSpec.weight || inferKeywordWeight(keyword));
    const normalizedKeyword = normalizeText(keyword);

    if (normalizedKeyword && normalizedQuery.includes(normalizedKeyword)) {
      score += weight;
      matchedKeywords.push(keyword);
    }
  }

  return {
    card,
    score,
    matchedKeywords,
  };
}

function buildAbstention({ query, reason, corpus }) {
  return {
    ok: true,
    trusted: false,
    answered: false,
    abstained: true,
    query,
    answer: null,
    displayText: '我目前沒有足夠的已審核 canon 來源可以回答這題，先保留。',
    citations: [],
    metadata: {
      policy: 'source_required_canon_retrieval_v1',
      corpusId: corpus.corpusId || null,
      corpusVersion: corpus.version || null,
      reason,
      sourceRequired: true,
      unknownRequiresAbstention: true,
      noDirectGameMutation: true,
      noMemoryWrite: true,
      advisoryOnly: true,
    },
  };
}

function buildCitation(card = {}) {
  return {
    cardId: card.id,
    sourceId: card.source?.sourceId || null,
    path: card.source?.path || null,
    lines: card.source?.lines || null,
    excerptLabel: card.source?.excerptLabel || card.topic || card.id,
    reviewStatus: card.reviewStatus || 'human-reviewed-source-extract',
  };
}

function extractQuery(input) {
  if (typeof input === 'string') return input.trim();
  return String(
    input.query
    || input.input?.text
    || input.payload?.query
    || '',
  ).trim();
}

function normalizeCorpus(corpus = {}) {
  return {
    ...corpus,
    cards: Array.isArray(corpus.cards) ? corpus.cards : [],
  };
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function inferKeywordWeight(keyword = '') {
  const normalized = normalizeText(keyword);
  if (!normalized) return 0;
  if (/^[a-z0-9 .:_-]+$/i.test(normalized)) return normalized.length >= 8 ? 2 : 1;
  return normalized.length >= 3 ? 3 : 2;
}
