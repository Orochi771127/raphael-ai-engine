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

This folder is currently mock-only. Do not deploy it as a production gateway without adding auth, rate limits, consent handling, privacy redaction, and release gates.
