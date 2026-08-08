export const RAPHAEL_RUNTIME_CONTRACT_VERSION = "1.0.0-draft.1";
const TOP = new Set(["contractVersion", "requestId", "idempotencyKey", "client", "actor", "input", "context", "allowedEffects", "consent", "capabilities"]);
const FORBIDDEN_AUTHORITY = new Set(["tenantId", "subjectId", "playerId", "sessionId", "accessToken", "apiKey"]);

export function validateRuntimeRequest(request) {
  object(request, "$request"); unknown(request, TOP, "$request");
  if (request.contractVersion !== RAPHAEL_RUNTIME_CONTRACT_VERSION) fail("unsupported_contract_version");
  for (const key of ["requestId", "idempotencyKey"]) if (typeof request[key] !== "string" || !request[key]) fail(`missing_${key}`);
  object(request.client, "client"); object(request.actor, "actor"); object(request.input, "input"); object(request.context, "context"); object(request.consent, "consent"); object(request.capabilities, "capabilities");
  if (typeof request.client.productId !== "string" || typeof request.actor.companionId !== "string" || typeof request.input.text !== "string") fail("missing_identity_or_input");
  if (!Number.isFinite(request.context.stateVersion)) fail("invalid_state_version");
  if (!Array.isArray(request.allowedEffects) || !request.allowedEffects.every((value) => typeof value === "string")) fail("invalid_allowed_effects");
  if (request.consent.cloudProcessing !== true && request.consent.cloudProcessing !== false) fail("invalid_cloud_consent");
  rejectAuthority(request);
  return request;
}
export function freezeRuntimeRequest(request) { validateRuntimeRequest(request); return deepFreeze(typeof structuredClone === "function" ? structuredClone(request) : JSON.parse(JSON.stringify(request))); }
export function authorityReport() { return { cognition: "RaphaelCore", speech: "RaphaelCore", memoryEligibility: "RaphaelCore", persistence: "MemoryPort", gameMutation: "ClientReducer" }; }
function object(value, path) { if (!value || typeof value !== "object" || Array.isArray(value)) fail(`invalid_object:${path}`); }
function unknown(value, allowed, path) { for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`unknown_field:${path}.${key}`); }
function rejectAuthority(value, path = "$request") { if (!value || typeof value !== "object") return; for (const [key, child] of Object.entries(value)) { if (FORBIDDEN_AUTHORITY.has(key)) fail(`body_authority_forbidden:${path}.${key}`); rejectAuthority(child, `${path}.${key}`); } }
function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); Object.values(value).forEach(deepFreeze); return value; }
function fail(code) { const error = new Error(code); error.code = code.split(":")[0]; throw error; }
