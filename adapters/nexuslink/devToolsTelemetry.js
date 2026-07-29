/**
 * NexusLink DevTools Telemetry & Chrome DevTools Visual Debugger Bridge
 * 
 * Provides a safe, browser-compatible window.__RAPHAEL_DEVTOOLS_HOOK__
 * for inspecting 3D PAD emotion vectors, NLU intents, safety levels, and telemetry in real time.
 */

export function attachDevToolsTelemetryHook(globalObj = typeof window !== 'undefined' ? window : globalThis) {
  if (!globalObj) return null;

  if (!globalObj.__RAPHAEL_DEVTOOLS_HOOK__) {
    globalObj.__RAPHAEL_DEVTOOLS_HOOK__ = {
      version: '0.1.0-devTools',
      history: [],
      lastTurn: null,
      logTurn(turnData) {
        const entry = {
          timestamp: new Date().toISOString(),
          ...turnData,
        };
        this.lastTurn = entry;
        this.history.push(entry);
        if (this.history.length > 50) this.history.shift();
        return entry;
      },
      getSummary() {
        return {
          totalTurns: this.history.length,
          lastTurn: this.lastTurn,
          safetyDistribution: this.history.reduce((acc, curr) => {
            const level = curr.safetyLevel || 'unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
          }, {}),
        };
      },
      clear() {
        this.history = [];
        this.lastTurn = null;
      },
    };
  }

  return globalObj.__RAPHAEL_DEVTOOLS_HOOK__;
}
