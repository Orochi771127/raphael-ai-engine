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

export const coreVersion = RAPHAEL_CANONICAL_CORE_VERSION;
export const contractVersion = RAPHAEL_RUNTIME_CONTRACT_VERSION;
export const canonCatalogSchemaVersion = RAPHAEL_CANON_CATALOG_SCHEMA_VERSION;

export function createHmaxCoreAdapter(options = {}) {
  return createCanonicalCoreAdapter(options);
}

export { createCanonCatalog, finalizeCandidate, health, safetyPreflight };
