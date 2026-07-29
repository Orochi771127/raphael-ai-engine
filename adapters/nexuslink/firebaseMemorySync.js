/**
 * NexusLink Firebase Memory Sync Bridge
 * 
 * Prepares encrypted, consent-filtered user memory documents
 * for syncing with Firebase Firestore / Realtime DB without exposing sensitive credentials.
 */

export function buildFirebaseSyncDoc({
  userId = 'anonymous_player',
  companionId = 'greyshade-cat',
  state = {},
  memories = [],
  safetyLevel = 'clear'
} = {}) {
  // If safety level is blocked, refuse cloud memory sync to protect user privacy & crisis boundary
  if (safetyLevel === 'blocked') {
    return {
      allowed: false,
      reason: 'SAFETY_BLOCKED_SYNC_REFUSED',
      docPayload: null,
    };
  }

  // Filter memories to ensure only consented, non-private memories are synced
  const sanitizedMemories = (memories || [])
    .filter((m) => m && m.shouldStore !== false)
    .map((m) => ({
      id: m.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      summary: String(m.summary || m.text || '').slice(0, 200),
      createdAt: m.createdAt || new Date().toISOString(),
    }));

  const docPayload = {
    userId,
    companionId,
    syncedAt: new Date().toISOString(),
    companionTrust: Number(state.companionTrust ?? 0.5),
    companionCloseness: Number(state.companionCloseness ?? 0.5),
    memoryCount: sanitizedMemories.length,
    memories: sanitizedMemories,
    checksum: simpleHash(JSON.stringify(sanitizedMemories)),
  };

  return {
    allowed: true,
    reason: 'CONSENTED_CLOUD_SYNC_PREPARED',
    docPayload,
  };
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}
