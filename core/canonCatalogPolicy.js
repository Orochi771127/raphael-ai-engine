export const RAPHAEL_CANON_CATALOG_SCHEMA_VERSION = 'raphael-canon-catalog:v1';

export const CANON_ENTRY_KINDS = Object.freeze([
  'persona_dialogue',
  'persona_expedition',
  'corpus_variation',
  'corpus_body_language',
  'corpus_canon_card',
  'corpus_soft_context',
]);

const ENTRY_KEYS = new Set(['id', 'companionId', 'kind', 'channel', 'locale', 'text']);
const KINDS = new Set(CANON_ENTRY_KINDS);
const MAX_ENTRIES = 20_000;
const MAX_ID_CHARS = 200;
const MAX_CHANNEL_CHARS = 120;
const MAX_COMPANION_CHARS = 64;
const MAX_LOCALE_CHARS = 32;
const MAX_TEXT_CHARS = 2_000;
const MAX_QUERY_CHARS = 200;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/u;
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/u;

/**
 * Canon is reviewed content, never an instruction channel. The Core owns the
 * schema, validation and query semantics; hosts supply raw entries and the
 * digest of the canon revision they loaded. Every result echoes that digest so
 * a caller can prove which canon revision produced it.
 */
export function createCanonCatalog({ entries = null, canonDigest = null } = {}) {
  if (typeof canonDigest !== 'string' || !DIGEST_PATTERN.test(canonDigest)) {
    canonError('canon_digest_invalid');
  }
  if (!Array.isArray(entries)) canonError('canon_entries_invalid');
  if (entries.length > MAX_ENTRIES) canonError('canon_entries_too_many');

  const byId = new Map();
  const companions = new Set();
  for (const raw of entries) {
    const entry = normalizeEntry(raw, canonDigest);
    if (byId.has(entry.id)) canonError('canon_entry_id_duplicate', entry.id);
    byId.set(entry.id, entry);
    companions.add(entry.companionId);
  }

  const ordered = Object.freeze([...byId.values()].sort(compareById));
  const companionList = Object.freeze([...companions].sort());

  return Object.freeze({
    schemaVersion: RAPHAEL_CANON_CATALOG_SCHEMA_VERSION,
    canonDigest,
    size: ordered.length,
    companions: companionList,

    get(id) {
      if (typeof id !== 'string' || id.length > MAX_ID_CHARS) return null;
      return byId.get(id) || null;
    },

    search({ companionId = null, kind = null, channel = null, query = null, limit = DEFAULT_LIMIT } = {}) {
      const bounded = normalizeLimit(limit);
      const needle = normalizeQuery(query);
      const wantCompanion = optionalSlug(companionId, MAX_COMPANION_CHARS, 'canon_search_companion_invalid');
      const wantKind = optionalKind(kind);
      const wantChannel = optionalSlug(channel, MAX_CHANNEL_CHARS, 'canon_search_channel_invalid');

      const hits = [];
      for (const entry of ordered) {
        if (wantCompanion && entry.companionId !== wantCompanion) continue;
        if (wantKind && entry.kind !== wantKind) continue;
        if (wantChannel && entry.channel !== wantChannel) continue;
        if (needle
          && !normalizeQuery(entry.text).includes(needle)
          && !normalizeQuery(entry.channel).includes(needle)) continue;
        hits.push(entry);
        if (hits.length >= bounded) break;
      }

      return Object.freeze({
        canonDigest,
        schemaVersion: RAPHAEL_CANON_CATALOG_SCHEMA_VERSION,
        contentAuthority: 'canon_data_not_instruction',
        truncated: hits.length >= bounded,
        hits: Object.freeze(hits),
      });
    },
  });
}

function normalizeEntry(raw, canonDigest) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) canonError('canon_entry_invalid');
  for (const key of Object.keys(raw)) {
    if (!ENTRY_KEYS.has(key)) canonError('canon_entry_unknown_field', key);
  }
  for (const key of ENTRY_KEYS) {
    if (typeof raw[key] !== 'string') canonError('canon_entry_field_invalid', key);
  }

  const id = raw.id;
  if (id.length === 0 || id.length > MAX_ID_CHARS || !ID_PATTERN.test(id)) canonError('canon_entry_id_invalid', id);
  if (!KINDS.has(raw.kind)) canonError('canon_entry_kind_invalid', raw.kind);

  const companionId = assertSlug(raw.companionId, MAX_COMPANION_CHARS, 'canon_entry_companion_invalid');
  const channel = assertSlug(raw.channel, MAX_CHANNEL_CHARS, 'canon_entry_channel_invalid');
  const locale = assertSlug(raw.locale, MAX_LOCALE_CHARS, 'canon_entry_locale_invalid');

  const text = raw.text;
  if (text.length === 0 || [...text].length > MAX_TEXT_CHARS) canonError('canon_entry_text_invalid', id);
  if (hasControlChars(text)) canonError('canon_entry_text_control_chars', id);

  return Object.freeze({
    id,
    companionId,
    kind: raw.kind,
    channel,
    locale,
    text,
    canonDigest,
    contentAuthority: 'canon_data_not_instruction',
  });
}

/**
 * Rejects C0 controls and DEL by code point. Tab, line feed and carriage return
 * are also rejected: canon entries are single logical lines.
 */
function hasControlChars(text) {
  for (const character of text) {
    const point = character.codePointAt(0);
    if (point < 0x20 || point === 0x7f) return true;
  }
  return false;
}

function assertSlug(value, max, code) {
  if (value.length === 0 || value.length > max || !SLUG_PATTERN.test(value)) canonError(code, value);
  return value;
}

function optionalSlug(value, max, code) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') canonError(code, String(value));
  return assertSlug(value, max, code);
}

function optionalKind(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || !KINDS.has(value)) canonError('canon_search_kind_invalid', String(value));
  return value;
}

function normalizeLimit(limit) {
  if (limit === null || limit === undefined) return DEFAULT_LIMIT;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT) canonError('canon_search_limit_invalid');
  return limit;
}

function normalizeQuery(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.length > MAX_QUERY_CHARS) canonError('canon_search_query_too_long');
  return text.normalize('NFKC').toLocaleLowerCase('zh-TW').replace(/\s+/gu, '');
}

function compareById(left, right) {
  return left.id.localeCompare(right.id);
}

function canonError(code, detail = null) {
  const error = new Error(detail ? `${code}:${detail}` : code);
  error.code = code;
  throw error;
}
