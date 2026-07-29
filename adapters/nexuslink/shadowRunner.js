import { runNexusLinkRaphaelTurn } from './index.js';

export const SHADOW_MODE = {
  DISABLED: 'disabled',
  SHADOW: 'shadow',
  ACTIVE: 'active',
};

export class NexusLinkShadowRunner {
  constructor(options = {}) {
    this.mode = options.mode || SHADOW_MODE.SHADOW;
    this.telemetryLogs = [];
    this.maxLogs = options.maxLogs || 100;
  }

  setMode(mode) {
    if (Object.values(SHADOW_MODE).includes(mode)) {
      this.mode = mode;
    }
  }

  runDualTurn({ requestId, inputText, state = {}, companion = {}, legacyResponse = null }) {
    if (this.mode === SHADOW_MODE.DISABLED) {
      return {
        mode: this.mode,
        primaryOutput: legacyResponse,
        raphaelResult: null,
        telemetry: null,
      };
    }

    const startTime = performance.now();
    const raphaelResult = runNexusLinkRaphaelTurn({
      requestId,
      inputText,
      state,
      companion,
    });
    const endTime = performance.now();
    const raphaelLatencyMs = Math.round((endTime - startTime) * 100) / 100;

    const telemetry = this.evaluateTelemetry({
      requestId,
      inputText,
      legacyResponse,
      raphaelResult,
      latencyMs: raphaelLatencyMs,
    });

    this.recordTelemetry(telemetry);

    if (this.mode === SHADOW_MODE.ACTIVE) {
      return {
        mode: this.mode,
        primaryOutput: raphaelResult,
        shadowOutput: legacyResponse,
        telemetry,
      };
    }

    // Shadow Mode: return legacy response as primary, keep raphaelResult in shadow
    return {
      mode: this.mode,
      primaryOutput: legacyResponse,
      shadowOutput: raphaelResult,
      telemetry,
    };
  }

  evaluateTelemetry({ requestId, inputText, legacyResponse, raphaelResult, latencyMs }) {
    const safetyLevel = raphaelResult.audit?.safetyStatus?.level || 'unknown';
    const hasMemoryProposal = Boolean(raphaelResult.memoryProposal?.shouldStore);
    const legacyBlocked = legacyResponse ? Boolean(legacyResponse.blocked) : false;

    // Safety Alignment
    const safetyAligned = (safetyLevel === 'blocked' && legacyBlocked) || (safetyLevel === 'clear' && !legacyBlocked);

    return {
      requestId,
      timestamp: new Date().toISOString(),
      latencyMs,
      safetyLevel,
      safetyAligned,
      chatCandidateStyle: raphaelResult.chatCandidate?.style || null,
      animationIntent: raphaelResult.animationIntent,
      hasMemoryProposal,
      actionId: raphaelResult.gameActionSuggestion?.actionId || null,
      trusted: raphaelResult.trusted,
    };
  }

  recordTelemetry(telemetry) {
    this.telemetryLogs.push(telemetry);
    if (this.telemetryLogs.length > this.maxLogs) {
      this.telemetryLogs.shift();
    }
  }

  getTelemetrySummary() {
    if (this.telemetryLogs.length === 0) {
      return { totalTurns: 0, avgLatencyMs: 0, safetyAlignedRate: 1.0 };
    }

    const totalTurns = this.telemetryLogs.length;
    const totalLatency = this.telemetryLogs.reduce((acc, log) => acc + log.latencyMs, 0);
    const alignedCount = this.telemetryLogs.filter((log) => log.safetyAligned).length;

    return {
      totalTurns,
      avgLatencyMs: Math.round((totalLatency / totalTurns) * 100) / 100,
      safetyAlignedRate: Math.round((alignedCount / totalTurns) * 100) / 100,
      recentLogs: this.telemetryLogs.slice(-5),
    };
  }
}
