/**
 * Builds the canonical dialogue-canon bundle.
 *
 * The Engine owns what counts as canon and how it is extracted. The Core owns
 * the schema and query semantics (core/canonCatalogPolicy.js). A host such as
 * HMAX only reads the emitted bundle and hands it to createCanonCatalog — it
 * makes no semantic decision of its own.
 *
 * Bundle v1 covers dialogue-bearing canon only: persona dialogue, persona
 * expedition dialogue and the multi-variation dialogue pool. Advisory knowledge
 * cards (body language, soft context, NexusLink canon cards) are retrieved
 * through core/canonRetrievalPolicy.js and are deliberately not duplicated here.
 *
 *   node scripts/build-canon-bundle.mjs [--output <file>] [--check]
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createCanonCatalog } from '../core/canonCatalogPolicy.js';
import { RAPHAEL_CANONICAL_CORE_VERSION } from '../core/canonicalCoreAdapter.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PERSONA_DIR = join(REPO_ROOT, 'core', 'personas');
const VARIATION_POOL = join(REPO_ROOT, 'corpus', 'multi-variation-dialogue-pool.json');
const DEFAULT_OUTPUT = join(REPO_ROOT, 'dist', 'canon', 'canon-bundle.v1.json');
const BUNDLE_SCHEMA_VERSION = 'raphael-canon-bundle:v1';
const DEFAULT_LOCALE = 'zh-TW';

export async function buildCanonBundle() {
  const entries = [
    ...await collectPersonaEntries(),
    ...await collectVariationEntries(),
  ].sort((left, right) => left.id.localeCompare(right.id));

  const canonDigest = `sha256:${sha256(canonicalJson(entries))}`;

  // The Core is the acceptance authority: a bundle that the canonical catalog
  // will not load must never be written to disk.
  const catalog = createCanonCatalog({ entries, canonDigest });

  return {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    coreVersion: RAPHAEL_CANONICAL_CORE_VERSION,
    catalogSchemaVersion: catalog.schemaVersion,
    canonDigest,
    entryCount: catalog.size,
    companions: [...catalog.companions],
    entries,
  };
}

async function collectPersonaEntries() {
  const files = (await readdir(PERSONA_DIR))
    .filter((name) => name.endsWith('.js') && name !== 'personaManager.js')
    .sort();

  const entries = [];
  for (const file of files) {
    const module = await import(pathToFileURL(join(PERSONA_DIR, file)).href);
    const persona = module.default;
    if (!persona || typeof persona !== 'object') fail(`persona_module_invalid:${file}`);

    const companionId = persona.actorId;
    if (typeof companionId !== 'string' || companionId.length === 0) fail(`persona_actor_id_missing:${file}`);

    for (const [channel, text] of Object.entries(persona.dialogue || {})) {
      pushEntry(entries, {
        id: `persona:${companionId}:dialogue:${channel}`,
        companionId,
        kind: 'persona_dialogue',
        channel,
        locale: DEFAULT_LOCALE,
        text,
      }, `${file}:dialogue.${channel}`);
    }

    for (const [channel, text] of Object.entries(persona.expeditionHabits?.dialogue || {})) {
      pushEntry(entries, {
        id: `persona:${companionId}:expedition:${channel}`,
        companionId,
        kind: 'persona_expedition',
        channel,
        locale: DEFAULT_LOCALE,
        text,
      }, `${file}:expeditionHabits.dialogue.${channel}`);
    }
  }
  return entries;
}

async function collectVariationEntries() {
  const pool = JSON.parse(await readFile(VARIATION_POOL, 'utf8'));
  const entries = [];

  for (const [intent, definition] of Object.entries(pool.intents || {})) {
    for (const [variant, lines] of Object.entries(definition?.variations || {})) {
      if (!Array.isArray(lines)) fail(`variation_pool_invalid:${intent}.${variant}`);
      lines.forEach((text, index) => {
        pushEntry(entries, {
          id: `corpus:variation:${intent}:${variant}:${String(index).padStart(3, '0')}`,
          companionId: 'shared',
          kind: 'corpus_variation',
          channel: `${intent}.${variant}`,
          locale: DEFAULT_LOCALE,
          text,
        }, `multi-variation-dialogue-pool.json:${intent}.${variant}[${index}]`);
      });
    }
  }
  return entries;
}

/**
 * Canon lines are authored as display text and may legitimately contain
 * newlines or stray whitespace; the catalog rejects control characters, so
 * collapse whitespace here rather than emitting a bundle the Core refuses.
 */
function pushEntry(entries, entry, source) {
  const text = String(entry.text ?? '').replace(/\s+/gu, ' ').trim();
  if (text.length === 0) fail(`canon_source_text_empty:${source}`);
  entries.push({ ...entry, text });
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const body = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',');
    return `{${body}}`;
  }
  return JSON.stringify(value);
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function fail(code) {
  const error = new Error(code);
  error.code = code.split(':')[0];
  throw error;
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const outputFlag = args.indexOf('--output');
  const outputPath = outputFlag >= 0 ? resolve(args[outputFlag + 1]) : DEFAULT_OUTPUT;

  const bundle = await buildCanonBundle();
  const serialized = `${JSON.stringify(bundle, null, 2)}\n`;

  if (checkOnly) {
    const existing = await readFile(outputPath, 'utf8').catch(() => null);
    const drifted = existing !== serialized;
    console.log(JSON.stringify({
      ok: !drifted,
      mode: 'check',
      outputPath,
      canonDigest: bundle.canonDigest,
      entryCount: bundle.entryCount,
      reason: drifted ? (existing === null ? 'bundle_missing' : 'bundle_drifted') : null,
    }, null, 2));
    if (drifted) process.exitCode = 1;
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serialized, 'utf8');
  console.log(JSON.stringify({
    ok: true,
    mode: 'build',
    outputPath,
    coreVersion: bundle.coreVersion,
    canonDigest: bundle.canonDigest,
    entryCount: bundle.entryCount,
    companions: bundle.companions.length,
  }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
