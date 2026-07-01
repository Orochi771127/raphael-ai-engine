import { runRaphaelEngine } from './index.js';

export const LOCAL_LEARNING_SIDECAR_SCHEMA_VERSION = 'local-learning-sidecar:v1';

const PERSISTABLE_LEARNING_KEYS = new Set([
  'replyLengthBias',
  'questionTolerance',
  'templateSensitivity',
  'positiveStyleSignal',
]);

const TRANSIENT_LEARNING_KEYS = new Set([
  'memoryConsentSignal',
]);

export function createLocalLearningSidecar(options = {}) {
  return {
    schemaVersion: LOCAL_LEARNING_SIDECAR_SCHEMA_VERSION,
    playerId: String(options.playerId || 'local-player'),
    gameId: String(options.gameId || 'standalone-game'),
    profiles: cloneJson(options.profiles || {}),
    audit: {
      rawInputStored: false,
      globalTrainingExport: null,
      saveSchemaMutation: false,
      companionDataMutation: false,
      lastEvent: null,
    },
  };
}

export function runRaphaelWithLocalLearning(request = {}, sidecar = createLocalLearningSidecar()) {
  const requestWithLocalProfile = applyLocalLearningToRequest(request, sidecar);
  const output = runRaphaelEngine(requestWithLocalProfile);
  const nextSidecar = recordLocalLearningFromTurn(sidecar, requestWithLocalProfile, output);

  return {
    request: requestWithLocalProfile,
    output,
    sidecar: nextSidecar,
  };
}

export function applyLocalLearningToRequest(request = {}, sidecar = createLocalLearningSidecar()) {
  const key = getProfileKey(request, sidecar);
  const localProfile = sidecar.profiles[key]?.learningProfile || {};

  return {
    ...request,
    learningProfile: {
      ...localProfile,
      ...(request.learningProfile || {}),
    },
  };
}

export function recordLocalLearningFromTurn(sidecar = createLocalLearningSidecar(), request = {}, output = {}) {
  const next = cloneJson(sidecar);
  next.audit = {
    rawInputStored: false,
    globalTrainingExport: null,
    saveSchemaMutation: false,
    companionDataMutation: false,
    lastEvent: null,
  };

  const learningUpdate = output.learningProfileUpdate || {};
  const safetyLevel = output.safetyStatus?.level || 'unknown';
  const patch = sanitizeLearningPatch(learningUpdate.updates || {});

  if (safetyLevel !== 'clear' || output.ok === false || !learningUpdate.shouldUpdate || !Object.keys(patch).length) {
    next.audit.lastEvent = {
      type: 'no_local_profile_update',
      reason: safetyLevel !== 'clear' || output.ok === false
        ? 'SAFETY_OR_BOUNDARY_PRECEDENCE'
        : 'NO_PERSISTABLE_LEARNING_KEYS',
      safetyLevel,
      blockedTransientKeys: findTransientKeys(learningUpdate.updates || {}),
      signals: Array.isArray(learningUpdate.signals) ? learningUpdate.signals : [],
    };
    return next;
  }

  const key = getProfileKey(request, next);
  const existing = next.profiles[key] || {
    scope: getScope(request, next),
    learningProfile: {},
    revision: 0,
  };

  next.profiles[key] = {
    ...existing,
    learningProfile: {
      ...existing.learningProfile,
      ...patch,
    },
    revision: Number(existing.revision || 0) + 1,
    lastSignals: Array.isArray(learningUpdate.signals) ? learningUpdate.signals : [],
    updatedBy: 'local_player_learning',
  };
  next.audit.lastEvent = {
    type: 'local_profile_updated',
    profileKey: key,
    persistedKeys: Object.keys(patch),
    blockedTransientKeys: findTransientKeys(learningUpdate.updates || {}),
    safetyLevel,
  };

  return next;
}

export function getLocalLearningProfile(sidecar = createLocalLearningSidecar(), scope = {}) {
  const key = getProfileKey({
    actorProfile: { actorId: scope.actorId },
    sceneContext: { gameId: scope.gameId },
  }, {
    ...sidecar,
    playerId: scope.playerId || sidecar.playerId,
    gameId: scope.gameId || sidecar.gameId,
  });

  return cloneJson(sidecar.profiles[key]?.learningProfile || {});
}

export function serializeLocalLearningSidecar(sidecar = createLocalLearningSidecar()) {
  const serializable = cloneJson(sidecar);
  serializable.audit = {
    ...(serializable.audit || {}),
    rawInputStored: false,
    globalTrainingExport: null,
    saveSchemaMutation: false,
    companionDataMutation: false,
  };
  return JSON.stringify(serializable, null, 2);
}

export function hydrateLocalLearningSidecar(serialized) {
  const parsed = typeof serialized === 'string'
    ? JSON.parse(serialized)
    : cloneJson(serialized || {});

  if (parsed.schemaVersion !== LOCAL_LEARNING_SIDECAR_SCHEMA_VERSION) {
    throw new Error(`Unsupported local learning sidecar schema: ${parsed.schemaVersion || 'missing'}`);
  }

  return createLocalLearningSidecar({
    playerId: parsed.playerId,
    gameId: parsed.gameId,
    profiles: parsed.profiles || {},
  });
}

export function sanitizeLearningPatch(updates = {}) {
  return Object.entries(updates).reduce((acc, [key, value]) => {
    if (PERSISTABLE_LEARNING_KEYS.has(key)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function findTransientKeys(updates = {}) {
  return Object.keys(updates).filter((key) => TRANSIENT_LEARNING_KEYS.has(key));
}

function getProfileKey(request = {}, sidecar = createLocalLearningSidecar()) {
  const scope = getScope(request, sidecar);
  return `${scope.gameId}:${scope.playerId}:${scope.actorId}`;
}

function getScope(request = {}, sidecar = createLocalLearningSidecar()) {
  return {
    gameId: String(request.sceneContext?.gameId || sidecar.gameId || 'standalone-game'),
    playerId: String(request.playerId || sidecar.playerId || 'local-player'),
    actorId: String(request.actorProfile?.actorId || 'default-actor'),
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
