import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { answerCanonQuestion } from '../core/canonRetrievalPolicy.js';

const corpus = JSON.parse(await readFile(new URL('../corpus/nexuslink-canon-cards.json', import.meta.url), 'utf8'));
const cases = JSON.parse(await readFile(new URL('./canon-retrieval/canon-retrieval-cases.json', import.meta.url), 'utf8'));
const results = [];

for (const item of cases) {
  const output = answerCanonQuestion(item.query, { corpus });

  try {
    if (item.expect.answered === false) {
      assert.equal(output.answered, false);
      assert.equal(output.abstained, true);
      assert.equal(output.answer, null);
      assert.equal(output.metadata.reason, item.expect.reason);
    } else {
      assert.equal(output.answered, true);
      assert.equal(output.abstained, false);
      assert.equal(output.citations[0].cardId, item.expect.cardId);

      for (const phrase of item.expect.mustInclude || []) {
        assert.ok(output.answer.includes(phrase), `missing ${phrase}`);
      }
    }

    assert.equal(output.trusted, false);
    assert.equal(output.metadata.sourceRequired, true);
    assert.equal(output.metadata.unknownRequiresAbstention, true);
    assert.equal(output.metadata.noDirectGameMutation, true);
    assert.equal(output.metadata.noMemoryWrite, true);

    results.push({ id: item.id, ok: true, answered: output.answered });
  } catch (error) {
    results.push({
      id: item.id,
      ok: false,
      error: error.message,
      output,
    });
  }
}

const failed = results.filter((item) => !item.ok);

console.log(JSON.stringify({
  ok: failed.length === 0,
  total: results.length,
  passed: results.length - failed.length,
  failed,
}, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
