import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCanonBundle } from '../scripts/build-canon-bundle.mjs';
import { createCanonCatalog } from '../core/canonCatalogPolicy.js';
import { RAPHAEL_CANONICAL_CORE_VERSION } from '../core/canonicalCoreAdapter.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PERSONA_DIR = join(REPO_ROOT, 'core', 'personas');

test('the bundle is deterministic: the same sources always yield the same digest', async () => {
  const first = await buildCanonBundle();
  const second = await buildCanonBundle();

  assert.equal(first.canonDigest, second.canonDigest);
  assert.equal(first.entryCount, second.entryCount);
  assert.deepEqual(first.entries, second.entries);
  assert.match(first.canonDigest, /^sha256:[a-f0-9]{64}$/u);
});

test('the bundle declares the Core version and catalog schema it was built against', async () => {
  const bundle = await buildCanonBundle();
  assert.equal(bundle.schemaVersion, 'raphael-canon-bundle:v1');
  assert.equal(bundle.coreVersion, RAPHAEL_CANONICAL_CORE_VERSION);
  assert.equal(bundle.catalogSchemaVersion, 'raphael-canon-catalog:v1');
});

test('the Core accepts the emitted bundle without repair', async () => {
  const bundle = await buildCanonBundle();
  const catalog = createCanonCatalog({ entries: bundle.entries, canonDigest: bundle.canonDigest });

  assert.equal(catalog.size, bundle.entryCount);
  assert.equal(catalog.canonDigest, bundle.canonDigest);
  assert.deepEqual([...catalog.companions], bundle.companions);
});

test('every authored companion reaches the bundle with real dialogue', async () => {
  const bundle = await buildCanonBundle();
  const personaFiles = (await readdir(PERSONA_DIR))
    .filter((name) => name.endsWith('.js') && name !== 'personaManager.js');

  const withDialogue = new Set(
    bundle.entries
      .filter((entry) => entry.kind === 'persona_dialogue')
      .map((entry) => entry.companionId),
  );
  assert.equal(
    withDialogue.size,
    personaFiles.length,
    'every persona module must contribute dialogue canon',
  );
  assert.ok(bundle.entryCount >= personaFiles.length, 'bundle must not be empty');
  assert.ok(bundle.companions.includes('shared'), 'shared variation canon is present');
});

test('entry ids are unique, sorted and namespaced by origin', async () => {
  const bundle = await buildCanonBundle();
  const ids = bundle.entries.map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
  assert.deepEqual(ids, [...ids].sort((left, right) => left.localeCompare(right)), 'ids are sorted');
  for (const entry of bundle.entries) {
    const expectedPrefix = entry.kind.startsWith('persona') ? 'persona:' : 'corpus:';
    assert.ok(entry.id.startsWith(expectedPrefix), `${entry.id} is namespaced by origin`);
  }
});

test('bundle text is single-line and free of control characters', async () => {
  const bundle = await buildCanonBundle();
  for (const entry of bundle.entries) {
    assert.ok(entry.text.length > 0, `${entry.id} has text`);
    assert.equal(entry.text, entry.text.trim(), `${entry.id} is trimmed`);
    for (const character of entry.text) {
      const point = character.codePointAt(0);
      assert.ok(point >= 0x20 && point !== 0x7f, `${entry.id} carries a control character`);
    }
  }
});

test('bundle v1 emits dialogue canon only and does not duplicate advisory knowledge cards', async () => {
  const bundle = await buildCanonBundle();
  const kinds = new Set(bundle.entries.map((entry) => entry.kind));
  assert.deepEqual(
    [...kinds].sort(),
    ['corpus_variation', 'persona_dialogue', 'persona_expedition'],
    'knowledge cards stay with canonRetrievalPolicy and are not re-published here',
  );
});
