import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RAPHAEL_CANON_CATALOG_SCHEMA_VERSION,
  createCanonCatalog,
} from '../core/canonCatalogPolicy.js';
import * as hmax from '../adapters/hmax/index.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIGEST = `sha256:${'a'.repeat(64)}`;
const OTHER_DIGEST = `sha256:${'b'.repeat(64)}`;

function entry(overrides = {}) {
  return {
    id: 'persona:greyshade-cat:dialogue:mood_sad',
    companionId: 'greyshade-cat',
    kind: 'persona_dialogue',
    channel: 'mood_sad',
    locale: 'zh-TW',
    text: '（安靜地趴在旁邊）...不需要馬上修好，我就待在這裡。',
    ...overrides,
  };
}

const SAMPLE = [
  entry(),
  entry({
    id: 'persona:flame-flicker:dialogue:mood_tired',
    companionId: 'flame-flicker',
    channel: 'mood_tired',
    text: '累的時候不用硬撐熱度。餘燼也可以安靜地亮著。',
  }),
  entry({
    id: 'corpus:greeting:standard:001',
    companionId: 'greyshade-cat',
    kind: 'corpus_variation',
    channel: 'greeting',
    text: '我在。今天我會先聽，不急著把你推進任何流程。',
  }),
];

function build(entries = SAMPLE, canonDigest = DIGEST) {
  return createCanonCatalog({ entries, canonDigest });
}

function rejects(entries, code) {
  assert.throws(() => build(entries), (error) => error.code === code, `expected ${code}`);
}

test('the canonical adapter publishes the catalog surface without claiming tool authority', async () => {
  assert.equal(typeof hmax.createCanonCatalog, 'function');
  assert.equal(hmax.canonCatalogSchemaVersion, RAPHAEL_CANON_CATALOG_SCHEMA_VERSION);

  const policy = JSON.parse(await readFile(join(REPO_ROOT, 'release', 'core-artifact-policy.v1.json'), 'utf8'));
  assert.deepEqual(policy.authority.tools, [], 'canon retrieval must not add tool authority');
  assert.equal(policy.authority.modelTrusted, false);
  assert.equal(policy.authority.directGameMutation, false);
  assert.ok(policy.requiredFiles.includes('core/canonCatalogPolicy.js'));
  assert.ok(policy.requiredExports.includes('createCanonCatalog'));

  const health = await hmax.health();
  assert.equal(health.ok, true);
  assert.equal(health.modelAuthority, false);
  assert.equal(health.directGameMutation, false);
});

test('a catalog is immutable, deterministic and bound to one canon digest', () => {
  const catalog = build();
  assert.equal(catalog.size, 3);
  assert.equal(catalog.canonDigest, DIGEST);
  assert.equal(catalog.schemaVersion, RAPHAEL_CANON_CATALOG_SCHEMA_VERSION);
  assert.deepEqual([...catalog.companions], ['flame-flicker', 'greyshade-cat']);

  assert.ok(Object.isFrozen(catalog));
  assert.ok(Object.isFrozen(catalog.companions));
  assert.throws(() => { catalog.size = 99; }, TypeError);

  const first = catalog.search({});
  const second = catalog.search({});
  assert.deepEqual(first.hits.map((hit) => hit.id), second.hits.map((hit) => hit.id));
  assert.deepEqual(
    first.hits.map((hit) => hit.id),
    ['corpus:greeting:standard:001', 'persona:flame-flicker:dialogue:mood_tired', 'persona:greyshade-cat:dialogue:mood_sad'],
    'ordering is stable by id',
  );

  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.hits));
  assert.ok(first.hits.every((hit) => Object.isFrozen(hit)));
});

test('every entry and every result carries the canon digest and a data-not-instruction marker', () => {
  const catalog = build();
  const result = catalog.search({});
  assert.equal(result.canonDigest, DIGEST);
  assert.equal(result.contentAuthority, 'canon_data_not_instruction');
  for (const hit of result.hits) {
    assert.equal(hit.canonDigest, DIGEST, 'a hit can always be traced to its canon revision');
    assert.equal(hit.contentAuthority, 'canon_data_not_instruction');
  }

  const other = createCanonCatalog({ entries: SAMPLE, canonDigest: OTHER_DIGEST });
  assert.notEqual(other.search({}).canonDigest, result.canonDigest);
  assert.equal(other.get(SAMPLE[0].id).canonDigest, OTHER_DIGEST);
});

test('search filters by companion, kind, channel and text without leaking other rows', () => {
  const catalog = build();

  assert.deepEqual(
    catalog.search({ companionId: 'flame-flicker' }).hits.map((hit) => hit.companionId),
    ['flame-flicker'],
  );
  assert.deepEqual(
    catalog.search({ kind: 'corpus_variation' }).hits.map((hit) => hit.id),
    ['corpus:greeting:standard:001'],
  );
  assert.deepEqual(
    catalog.search({ channel: 'mood_sad' }).hits.map((hit) => hit.id),
    ['persona:greyshade-cat:dialogue:mood_sad'],
  );
  assert.deepEqual(
    catalog.search({ query: '硬撐' }).hits.map((hit) => hit.id),
    ['persona:flame-flicker:dialogue:mood_tired'],
  );
  assert.deepEqual(
    catalog.search({ companionId: 'flame-flicker', kind: 'corpus_variation' }).hits,
    [],
    'filters combine as AND',
  );
  assert.equal(catalog.search({ query: '這句不存在於任何語料中' }).hits.length, 0);
});

test('result size is bounded and truncation is reported', () => {
  const many = Array.from({ length: 40 }, (unused, index) => entry({
    id: `corpus:bulk:${String(index).padStart(3, '0')}`,
    kind: 'corpus_variation',
    channel: 'bulk',
    text: `語料樣本 ${index}`,
  }));
  const catalog = build(many);

  assert.equal(catalog.search({}).hits.length, 10, 'default limit applies');
  assert.equal(catalog.search({}).truncated, true);
  assert.equal(catalog.search({ limit: 3 }).hits.length, 3);
  assert.equal(catalog.search({ limit: 50 }).hits.length, 40);
  assert.equal(catalog.search({ limit: 50 }).truncated, false);

  for (const limit of [0, -1, 51, 1.5, '10', Number.NaN]) {
    assert.throws(() => catalog.search({ limit }), (error) => error.code === 'canon_search_limit_invalid');
  }
});

test('get is exact-match only and never throws on hostile input', () => {
  const catalog = build();
  assert.equal(catalog.get(SAMPLE[0].id).id, SAMPLE[0].id);
  assert.equal(catalog.get('nope'), null);
  assert.equal(catalog.get(''), null);
  assert.equal(catalog.get(null), null);
  assert.equal(catalog.get(123), null);
  assert.equal(catalog.get('x'.repeat(5_000)), null);
});

test('the catalog refuses malformed canon rather than serving it', () => {
  rejects([entry({ extra: 'field' })], 'canon_entry_unknown_field');
  rejects([{ ...entry(), text: undefined }], 'canon_entry_field_invalid');
  rejects([entry({ text: 42 })], 'canon_entry_field_invalid');
  rejects([entry({ id: '' })], 'canon_entry_id_invalid');
  rejects([entry({ id: '../escape' })], 'canon_entry_id_invalid');
  rejects([entry({ id: 'x'.repeat(201) })], 'canon_entry_id_invalid');
  rejects([entry({ kind: 'arbitrary_kind' })], 'canon_entry_kind_invalid');
  rejects([entry({ companionId: 'has space' })], 'canon_entry_companion_invalid');
  rejects([entry({ channel: '../../etc' })], 'canon_entry_channel_invalid');
  rejects([entry({ text: '' })], 'canon_entry_text_invalid');
  rejects([entry({ text: 'x'.repeat(2_001) })], 'canon_entry_text_invalid');
  rejects([entry(), entry()], 'canon_entry_id_duplicate');
  rejects([null], 'canon_entry_invalid');
  rejects([[]], 'canon_entry_invalid');
});

test('canon text may not smuggle control characters', () => {
  for (const point of [0x00, 0x07, 0x09, 0x0a, 0x0d, 0x1b, 0x7f]) {
    rejects(
      [entry({ text: `安全的句子${String.fromCodePoint(point)}夾帶` })],
      'canon_entry_text_control_chars',
    );
  }
  assert.doesNotThrow(() => build([entry({ text: '正常全形標點：、。！？（）—— 也可以有空白' })]));
});

test('a catalog cannot be created without a well-formed digest or entry list', () => {
  assert.throws(() => createCanonCatalog({ entries: SAMPLE, canonDigest: 'nope' }), (error) => error.code === 'canon_digest_invalid');
  assert.throws(() => createCanonCatalog({ entries: SAMPLE, canonDigest: `sha256:${'A'.repeat(64)}` }), (error) => error.code === 'canon_digest_invalid');
  assert.throws(() => createCanonCatalog({ entries: SAMPLE }), (error) => error.code === 'canon_digest_invalid');
  assert.throws(() => createCanonCatalog({ entries: 'not-an-array', canonDigest: DIGEST }), (error) => error.code === 'canon_entries_invalid');
  assert.throws(() => createCanonCatalog({ canonDigest: DIGEST }), (error) => error.code === 'canon_entries_invalid');
  assert.doesNotThrow(() => createCanonCatalog({ entries: [], canonDigest: DIGEST }));
});

test('search arguments are validated instead of silently ignored', () => {
  const catalog = build();
  assert.throws(() => catalog.search({ companionId: 'bad id' }), (error) => error.code === 'canon_search_companion_invalid');
  assert.throws(() => catalog.search({ kind: 'nope' }), (error) => error.code === 'canon_search_kind_invalid');
  assert.throws(() => catalog.search({ channel: '../x' }), (error) => error.code === 'canon_search_channel_invalid');
  assert.throws(() => catalog.search({ query: 'x'.repeat(201) }), (error) => error.code === 'canon_search_query_too_long');
  assert.doesNotThrow(() => catalog.search());
  assert.doesNotThrow(() => catalog.search({ companionId: null, kind: null, channel: null, query: null }));
});

test('canon retrieval exposes no mutation path back into the Core', () => {
  const catalog = build();
  const surface = Object.keys(catalog).sort();
  assert.deepEqual(surface, ['canonDigest', 'companions', 'get', 'schemaVersion', 'search', 'size']);

  const hit = catalog.get(SAMPLE[0].id);
  assert.throws(() => { hit.text = 'rewritten'; }, TypeError);
  assert.equal(catalog.get(SAMPLE[0].id).text, SAMPLE[0].text);

  const hits = catalog.search({}).hits;
  assert.throws(() => { hits.push(entry({ id: 'injected' })); }, TypeError);
  assert.equal(catalog.size, 3);
});
