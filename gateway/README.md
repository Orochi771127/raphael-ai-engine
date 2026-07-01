# Gateway Notes

The standalone engine can later sit behind a backend gateway. The frontend must not hold API keys.

Recommended future workflow:

```text
normalize_request
-> safety_gate
-> privacy_redact
-> retrieve_memory_or_corpus
-> model_candidate
-> critic
-> validate_output
-> audit
-> response
```

LangGraph can orchestrate the gateway workflow, but RaphaelCore remains final authority for safety, boundary, memory proposals, and game-facing policy. LangChain can be used for canon ingestion, retrieval, dataset generation, and eval management.

Phase 8 adds a mock maturity contract:

- `mock-gateway.js` runs a keyless local version of the gateway workflow.
- `worker-skeleton.js` exposes `/v1/health` and `/v1/raphael/turn` against the mock gateway.
- Gateway output is always `trusted: false`.
- Gateway advisor proposals are never applied as final output.
- `authorityReport.finalAuthority` remains `RaphaelCore`.
- Disabled tools such as public web search and memory sync return policy errors.

This folder is still mock-only. Do not deploy it as a production gateway without adding auth, rate limits, consent handling, privacy redaction, observability, cost controls, and release gates.
