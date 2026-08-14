import {
  RAPHAEL_CANONICAL_CORE_VERSION,
  createCanonicalCoreAdapter,
  finalizeCandidate,
  health,
  safetyPreflight,
} from '../../core/canonicalCoreAdapter.js';
import { RAPHAEL_RUNTIME_CONTRACT_VERSION } from '../../contracts/runtimeContract.js';
import {
  RAPHAEL_CANON_CATALOG_SCHEMA_VERSION,
  createCanonCatalog,
} from '../../core/canonCatalogPolicy.js';
import {
  RAPHAEL_CONTINUITY_SCHEMA_VERSION,
  normalizeContinuity,
} from '../../core/continuityPolicy.js';
import { RAPHAEL_EMERGENCE_SCHEMA_VERSION } from '../../core/emergencePolicy.js';

export const coreVersion = RAPHAEL_CANONICAL_CORE_VERSION;
export const contractVersion = RAPHAEL_RUNTIME_CONTRACT_VERSION;
export const canonCatalogSchemaVersion = RAPHAEL_CANON_CATALOG_SCHEMA_VERSION;
export const continuitySchemaVersion = RAPHAEL_CONTINUITY_SCHEMA_VERSION;
export const emergenceSchemaVersion = RAPHAEL_EMERGENCE_SCHEMA_VERSION;

export function createHmaxCoreAdapter(options = {}) {
  return createCanonicalCoreAdapter(options);
}

export { createCanonCatalog, finalizeCandidate, health, normalizeContinuity, safetyPreflight };
