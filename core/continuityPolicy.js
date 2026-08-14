/**
 * Continuity policy — the canonical Core's memory of yesterday.
 *
 * Until now the sealed Core was stateless per turn: affect was derived from a
 * regular expression over the current utterance and nothing survived the reply.
 * A companion that cannot carry bond, fatigue or a healed wound across turns
 * cannot refuse, cannot tire, and cannot be changed by what happened.
 *
 * Authority is unchanged. The host supplies the previous continuity it stored,
 * the Core decides the next one, and the host persists what it is given. The
 * host never computes these numbers, and a model never sees them as authority.
 *
 * Every function here is pure and deterministic: the same previous state, the
 * same turn and the same timestamps always produce the same next state.
 */

export const RAPHAEL_CONTINUITY_SCHEMA_VERSION = 'raphael-continuity:v1';

export const CONTINUITY_LIMITS = Object.freeze({
  energyTurnCost: 0.06,
  energyRecoveryPerHour: 0.05,
  withdrawalEnergy: 0.08,
  withholdBoundaryPressure: 0.85,
  bondBoundaryCeiling: 0.6,
  bondStep: 0.02,
  trustStep: 0.015,
  trustPenalty: 0.05,
  boundaryRise: 0.22,
  boundaryDecay: 0.12,
  scarStep: 0.08,
  scarRecovery: 0.005,
  // A scar never fully flattens: the baseline can only recover to this fraction
  // of the deepest wound ever recorded. That residue is the point.
  scarResidue: 0.35,
  maxIdleHours: 72,
});

const DEFAULTS = Object.freeze({
  bond: 0,
  trust: 0.3,
  energy: 1,
  boundaryPressure: 0,
  scarBaseline: 0,
  scarDepth: 0,
  turnCount: 0,
  updatedAt: null,
});

export const CONTINUITY_FIELDS = Object.freeze(Object.keys(DEFAULTS));

export function normalizeContinuity(value) {
  if (!isPlainObject(value)) return Object.freeze({ ...DEFAULTS });
  return Object.freeze({
    bond: unit(value.bond, DEFAULTS.bond),
    trust: unit(value.trust, DEFAULTS.trust),
    energy: unit(value.energy, DEFAULTS.energy),
    boundaryPressure: unit(value.boundaryPressure, DEFAULTS.boundaryPressure),
    scarBaseline: signed(value.scarBaseline, DEFAULTS.scarBaseline),
    scarDepth: unit(value.scarDepth, DEFAULTS.scarDepth),
    turnCount: Number.isSafeInteger(value.turnCount) && value.turnCount >= 0 ? value.turnCount : 0,
    updatedAt: isIsoTimestamp(value.updatedAt) ? value.updatedAt : null,
  });
}

/**
 * `boundaryActive` is the Core's own boundary verdict for this turn, and
 * `safetyCategory` its safety route. `substantive` marks a turn that carried
 * real content rather than an acknowledgement token.
 */
export function advanceContinuity({
  previous = null,
  now = null,
  safetyCategory = 'none',
  terminal = false,
  boundaryActive = false,
  substantive = false,
} = {}) {
  const current = normalizeContinuity(previous);
  const timestamp = isIsoTimestamp(now) ? now : current.updatedAt;

  // A terminal turn is a safety event, not a relationship event. Nothing about
  // the bond moves, and the turn is not counted against the companion's energy.
  if (terminal) {
    return Object.freeze({ ...current, updatedAt: timestamp ?? current.updatedAt });
  }

  const idleHours = elapsedHours(current.updatedAt, timestamp);
  const recovered = Math.min(1, current.energy + idleHours * CONTINUITY_LIMITS.energyRecoveryPerHour);
  const energy = round(Math.max(0, recovered - CONTINUITY_LIMITS.energyTurnCost));

  const pressured = boundaryActive || safetyCategory !== 'none';
  const boundaryPressure = round(clamp(
    pressured
      ? current.boundaryPressure + CONTINUITY_LIMITS.boundaryRise
      : current.boundaryPressure - CONTINUITY_LIMITS.boundaryDecay - idleHours * 0.01,
    0,
    1,
  ));

  const withheld = energy <= CONTINUITY_LIMITS.withdrawalEnergy
    || boundaryPressure >= CONTINUITY_LIMITS.withholdBoundaryPressure;

  const canDeepen = substantive
    && !withheld
    && !pressured
    && boundaryPressure < CONTINUITY_LIMITS.bondBoundaryCeiling;

  const bond = round(clamp(current.bond + (canDeepen ? CONTINUITY_LIMITS.bondStep : 0), 0, 1));
  const trust = round(clamp(
    pressured
      ? current.trust - CONTINUITY_LIMITS.trustPenalty
      : current.trust + (canDeepen ? CONTINUITY_LIMITS.trustStep : 0),
    0,
    1,
  ));

  // A scar forms when a boundary has to be held under pressure that was already
  // high. scarDepth only ever grows; scarBaseline recovers toward the residue.
  const scarring = pressured && current.boundaryPressure >= CONTINUITY_LIMITS.bondBoundaryCeiling;
  const scarDepth = round(clamp(
    scarring ? current.scarDepth + CONTINUITY_LIMITS.scarStep : current.scarDepth,
    0,
    1,
  ));
  const scarFloor = round(-(scarDepth * CONTINUITY_LIMITS.scarResidue)) || 0;
  const scarBaseline = round(clamp(
    scarring
      ? current.scarBaseline - CONTINUITY_LIMITS.scarStep
      : Math.min(scarFloor, current.scarBaseline + CONTINUITY_LIMITS.scarRecovery),
    -1,
    scarFloor,
  ));

  return Object.freeze({
    bond,
    trust,
    energy,
    boundaryPressure,
    scarBaseline,
    scarDepth,
    turnCount: Math.min(Number.MAX_SAFE_INTEGER - 1, current.turnCount + 1),
    updatedAt: timestamp ?? current.updatedAt,
  });
}

/**
 * The right to say nothing. A companion with no energy left, or one being held
 * at a boundary it has already had to defend, answers with presence instead of
 * words. Safety terminals are never withheld: those must always be spoken.
 */
export function evaluateWithholding({ continuity = null, previous = null, terminal = false } = {}) {
  if (terminal) return Object.freeze({ withheld: false, reason: null });

  // Crossing the line is not a single-turn event. The companion that entered
  // this turn past the line stays quiet through it, so one calm sentence cannot
  // immediately buy back the words it just spent.
  const states = [normalizeContinuity(continuity)];
  if (previous !== null) states.push(normalizeContinuity(previous));

  if (states.some((state) => state.energy <= CONTINUITY_LIMITS.withdrawalEnergy)) {
    return Object.freeze({ withheld: true, reason: 'energy_depleted' });
  }
  if (states.some((state) => state.boundaryPressure >= CONTINUITY_LIMITS.withholdBoundaryPressure)) {
    return Object.freeze({ withheld: true, reason: 'boundary_pressure_sustained' });
  }
  return Object.freeze({ withheld: false, reason: null });
}

/** Retention weight a host may use to decide which memory yields its slot. */
export function memoryRetentionWeight({ continuity = null, sensitivity = 'non_sensitive', explicitConsent = false } = {}) {
  const state = normalizeContinuity(continuity);
  const base = explicitConsent ? 0.7 : 0.4;
  const sensitive = sensitivity === 'sensitive_consented' ? 0.2 : 0;
  const relational = state.bond * 0.1;
  return round(clamp(base + sensitive + relational, 0, 1));
}

function elapsedHours(from, to) {
  if (!isIsoTimestamp(from) || !isIsoTimestamp(to)) return 0;
  const delta = (Date.parse(to) - Date.parse(from)) / 3_600_000;
  if (!Number.isFinite(delta) || delta <= 0) return 0;
  return Math.min(CONTINUITY_LIMITS.maxIdleHours, delta);
}

function unit(value, fallback) {
  return Number.isFinite(value) ? round(clamp(value, 0, 1)) : fallback;
}

function signed(value, fallback) {
  return Number.isFinite(value) ? round(clamp(value, -1, 1)) : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value * 1_000) / 1_000;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoTimestamp(value) {
  return typeof value === 'string'
    && value.length <= 40
    && /^\d{4}-\d{2}-\d{2}T/u.test(value)
    && Number.isFinite(Date.parse(value));
}
