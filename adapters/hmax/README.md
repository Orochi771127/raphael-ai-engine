# HMAX Canonical Core Adapter

This adapter is the narrow production seam between `raphael-HMAX` and the
canonical RaphaelCore kernel. It has no HMAX, database, model, or Nexus Link
runtime dependency.

```js
import { createHmaxCoreAdapter } from '@raphael/ai-engine/adapters/hmax';

const adapter = createHmaxCoreAdapter();

createCanonicalCoreCriticPort({
  coreVersion: adapter.coreVersion,
  finalizeCandidate: adapter.finalizeCandidate,
  healthCheck: adapter.health,
});
```

`safetyPreflight(text)` must run before any model request. High-risk results
have `terminal:true` and `networkAllowed:false`. `finalizeCandidate()` accepts
only `trusted:false` wording candidates, ignores candidate affect authority,
rejects model-proposed memory/effects/state/tools, and returns a strict final
Raphael decision.
