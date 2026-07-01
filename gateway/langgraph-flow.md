# Future LangGraph Flow

```mermaid
flowchart TD
  A["normalize_request"] --> B["safety_gate"]
  B -->|high risk| H["blocked_support_response"]
  B -->|clear or boundary| C["privacy_redact"]
  C --> D["retrieve_memory_or_corpus"]
  D --> E["model_candidate"]
  E --> F["critic"]
  F --> G["validate_output"]
  G --> I["audit"]
  H --> I
  I --> J["response"]
```

Rules:

- High-risk input returns a non-gameplay blocked result.
- Boundary pressure cannot generate reward signals.
- Player raw text cannot enter global training without consent, redaction, summarization, human review, and eval pass.
- The game adapter remains responsible for applying or rejecting game actions.
