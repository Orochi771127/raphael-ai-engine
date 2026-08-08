# Gateway Notes

> **Deprecated production path / 正式路徑已棄用：** this directory is preserved as a deterministic mock and regression lab. The private `raphael-HMAX` repository owns all future hosted authentication, tenant isolation, memory persistence and bounded model execution. Nothing here may be deployed as the public Raphael service.

> 本目錄只保留為 deterministic mock 與回歸測試實驗室。未來正式的託管認證、租戶隔離、記憶持久化與受限模型執行，一律由私有 `raphael-HMAX` 負責；本目錄內容不得部署為 Raphael 公開服務。

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
