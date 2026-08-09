import {
  RAPHAEL_CANONICAL_CORE_VERSION,
  createCanonicalCoreAdapter,
  finalizeCandidate,
  health,
  safetyPreflight,
} from '../../core/canonicalCoreAdapter.js';
import { RAPHAEL_RUNTIME_CONTRACT_VERSION } from '../../contracts/runtimeContract.js';

export const coreVersion = RAPHAEL_CANONICAL_CORE_VERSION;
export const contractVersion = RAPHAEL_RUNTIME_CONTRACT_VERSION;

export function createHmaxCoreAdapter(options = {}) {
  return createCanonicalCoreAdapter(options);
}

export { finalizeCandidate, health, safetyPreflight };
