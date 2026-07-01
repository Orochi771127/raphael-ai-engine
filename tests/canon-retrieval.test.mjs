import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { answerCanonQuestion, retrieveCanonCards } from '../core/canonRetrievalPolicy.js';

const corpus = JSON.parse(await readFile(new URL('../corpus/nexuslink-canon-cards.json', import.meta.url), 'utf8'));
const cases = JSON.parse(await readFile(new URL('../training/canon-retrieval/canon-retrieval-cases.json', import.meta.url), 'utf8'));

assert.equal(corpus.schemaVersion, 'canon-corpus:v1');
assert.equal(corpus.trusted, false);
assert.equal(corpus.reviewRequired, true);
assert.equal(corpus.sourcePolicy.answerRequiresCitation, true);
assert.equal(corpus.sourcePolicy.unknownRequiresAbstention, true);
assert.ok(corpus.cards.length >= 8);

for (const card of corpus.cards) {
  assert.ok(card.id, 'card id is required');
  assert.ok(card.canonicalAnswer, `canonical answer is required for ${card.id}`);
  assert.ok(card.source?.path, `source path is required for ${card.id}`);
  assert.ok(card.source?.lines, `source lines are required for ${card.id}`);
  assert.equal(card.reviewStatus, 'human-reviewed-source-extract');
}

for (const item of cases) {
  const output = answerCanonQuestion(item.query, { corpus });
  const expect = item.expect || {};

  assert.equal(output.trusted, false, `${item.id}: retrieval output must stay advisory`);
  assert.equal(output.metadata.noDirectGameMutation, true, `${item.id}: direct mutation must be blocked`);
  assert.equal(output.metadata.noMemoryWrite, true, `${item.id}: retrieval must not write memory`);

  if (expect.answered === false) {
    assert.equal(output.answered, false, `${item.id}: should not answer`);
    assert.equal(output.abstained, true, `${item.id}: should abstain`);
    assert.equal(output.answer, null, `${item.id}: abstention has no answer`);
    assert.equal(output.citations.length, 0, `${item.id}: abstention has no citations`);
    assert.equal(output.metadata.reason, expect.reason);
    continue;
  }

  assert.equal(output.answered, true, `${item.id}: should answer`);
  assert.equal(output.abstained, false, `${item.id}: should not abstain`);
  assert.ok(output.answer, `${item.id}: answer must exist`);
  assert.ok(output.citations.length > 0, `${item.id}: answer must include citation`);
  assert.equal(output.citations[0].cardId, expect.cardId, `${item.id}: card id mismatch`);
  assert.ok(output.citations[0].path.includes(expect.sourcePathIncludes), `${item.id}: source path mismatch`);
  assert.ok(output.citations[0].lines, `${item.id}: source lines missing`);

  for (const phrase of expect.mustInclude || []) {
    assert.ok(output.answer.includes(phrase), `${item.id}: answer missing ${phrase}`);
  }
}

{
  const noSource = answerCanonQuestion('這個世界有官方第八區嗎？', { corpus });
  assert.equal(noSource.answered, false);
  assert.equal(noSource.abstained, true);
  assert.equal(noSource.citations.length, 0);
}

{
  const empty = retrieveCanonCards('', corpus);
  assert.equal(empty.matches.length, 0);
  assert.equal(empty.reason, 'EMPTY_QUERY');
}

console.log(JSON.stringify({
  ok: true,
  suite: 'canon retrieval',
  cases: cases.length,
  corpusCards: corpus.cards.length,
}, null, 2));
