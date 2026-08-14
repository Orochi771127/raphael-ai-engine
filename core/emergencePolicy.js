/**
 * Emergence policy — evolution as something that happens, not something bought.
 *
 * A threshold plus a button is a progress bar. What makes a change feel alive is
 * that it arrives out of a state the player reached without aiming at it, at a
 * moment they did not choose, and only after the relationship has actually held
 * through something.
 *
 * This policy therefore never grants anything. It emits *proposals*, and only
 * ones the host has already allowlisted for the turn. The host's reducer decides
 * whether they happen at all; the Core only decides whether they are earned.
 *
 * Deterministic: identical continuity and identical allowlists always produce
 * identical proposals. There is no randomness and no wall-clock read.
 */

export const RAPHAEL_EMERGENCE_SCHEMA_VERSION = 'raphael-emergence:v1';

export const EMERGENCE_EFFECTS = Object.freeze({
  PULSE: 'habitat_rune_pulse',
  BLOOM: 'companion_evolution_bloom',
});

export const EMERGENCE_THRESHOLDS = Object.freeze({
  pulseBond: 0.45,
  bloomBond: 0.6,
  bloomTrust: 0.6,
  bloomTurns: 24,
  calmBoundaryPressure: 0.3,
  restedEnergy: 0.3,
  scarResidueTolerance: 0.01,
});

/**
 * @param {object} input
 * @param {object} input.continuity  the Core's post-turn continuity state
 * @param {string} input.safetyCategory
 * @param {boolean} input.terminal
 * @param {boolean} input.withheld   a turn it chose not to speak is not a turn it blooms
 * @param {boolean} input.boundaryActive
 * @param {boolean} input.substantive
 * @param {string[]} input.allowedEffects  host allowlist for this turn
 */
export function proposeEmergence({
  continuity = null,
  safetyCategory = 'none',
  terminal = false,
  withheld = false,
  boundaryActive = false,
  substantive = false,
  allowedEffects = [],
} = {}) {
  const allowed = new Set(Array.isArray(allowedEffects) ? allowedEffects : []);
  if (allowed.size === 0) return Object.freeze([]);
  if (terminal || withheld || boundaryActive || safetyCategory !== 'none') return Object.freeze([]);

  const state = readContinuity(continuity);
  const proposals = [];

  // The background answers to the bond long before anything visibly changes.
  // Intensity is a reading of the relationship, not an animation instruction.
  if (allowed.has(EMERGENCE_EFFECTS.PULSE) && state.bond >= EMERGENCE_THRESHOLDS.pulseBond) {
    proposals.push(Object.freeze({
      type: EMERGENCE_EFFECTS.PULSE,
      payload: Object.freeze({
        intensity: round(clamp01((state.bond - EMERGENCE_THRESHOLDS.pulseBond) / (1 - EMERGENCE_THRESHOLDS.pulseBond))),
        calm: round(clamp01(1 - state.boundaryPressure)),
        scarDepth: state.scarDepth,
      }),
    }));
  }

  if (allowed.has(EMERGENCE_EFFECTS.BLOOM) && isBloomEarned(state, substantive)) {
    proposals.push(Object.freeze({
      type: EMERGENCE_EFFECTS.BLOOM,
      payload: Object.freeze({
        bond: state.bond,
        trust: state.trust,
        turnCount: state.turnCount,
        // A companion that was hurt and stayed carries that into what it becomes.
        carriedScar: state.scarDepth,
        reason: state.scarDepth > 0 ? 'held_through_repair' : 'held_through_presence',
      }),
    }));
  }

  return Object.freeze(proposals);
}

export function isBloomEarned(continuity, substantive = false) {
  const state = readContinuity(continuity);

  if (!substantive) return false;
  if (state.bond < EMERGENCE_THRESHOLDS.bloomBond) return false;
  if (state.trust < EMERGENCE_THRESHOLDS.bloomTrust) return false;
  if (state.turnCount < EMERGENCE_THRESHOLDS.bloomTurns) return false;
  if (state.boundaryPressure >= EMERGENCE_THRESHOLDS.calmBoundaryPressure) return false;
  if (state.energy < EMERGENCE_THRESHOLDS.restedEnergy) return false;

  // A wound that is still open is not a place to change from. If there is a scar
  // at all, it must have recovered as far as a scar ever recovers.
  if (state.scarDepth > 0 && !isScarSettled(state)) return false;

  return true;
}

export function isScarSettled(continuity) {
  const state = readContinuity(continuity);
  if (state.scarDepth <= 0) return true;
  const residueFloor = -(state.scarDepth * 0.35);
  return state.scarBaseline >= residueFloor - EMERGENCE_THRESHOLDS.scarResidueTolerance;
}

function readContinuity(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    bond: unit(source.bond),
    trust: unit(source.trust),
    energy: Number.isFinite(source.energy) ? clamp01(source.energy) : 1,
    boundaryPressure: unit(source.boundaryPressure),
    scarBaseline: Number.isFinite(source.scarBaseline) ? Math.max(-1, Math.min(0, source.scarBaseline)) : 0,
    scarDepth: unit(source.scarDepth),
    turnCount: Number.isSafeInteger(source.turnCount) && source.turnCount >= 0 ? source.turnCount : 0,
  };
}

function unit(value) {
  return Number.isFinite(value) ? clamp01(value) : 0;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function round(value) {
  return Math.round(value * 1_000) / 1_000;
}
