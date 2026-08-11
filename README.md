# RaphaelCore Engine / Raphael 核心認知引擎

Raphael AI Engine is the canonical target repository for the standalone, game-neutral RaphaelCore cognition kernel and versioned client contracts. Nexus Link remains the first official client and the mature live authority until parity gates pass.

Raphael AI Engine 是獨立、遊戲中立 RaphaelCore 認知核心與版本化客戶端契約的 canonical 目標儲存庫。Nexus Link 是第一個正式客戶端；在 parity gate 通過前，成熟的遊戲內 Core 仍是 live authority。

Current status / 目前狀態: `v0.2.x canonical adapter parity candidate`. This is not yet a production model service and must not replace the live Nexus Link Core before sealed parity and shadow-client gates pass.

- No OpenAI, Anthropic, Grok, or external model API.
- No LangGraph runtime dependency in NexusLink.
- No NexusLink DOM, Pixi, store, or save dependency inside `core/`.
- Model candidates are always `trusted:false`; RaphaelCore produces the final speech decision, while game adapters decide which allowlisted effects can be applied.
- Safety, boundary, memory proposals, and learning metadata stay explicit and auditable.

## Repository family / 儲存庫家族

| Repository / 儲存庫 | Owns / 擁有權威 | Must not own / 不得擁有 |
|---|---|---|
| `raphael-ai-engine` | cognition, safety, boundary, speech, memory eligibility, public contracts / 認知、安全、邊界、最終語句、記憶資格、公開契約 | product saves, rewards, model hosting / 產品存檔、獎勵、模型託管 |
| `raphael-HMAX` | private hosted auth, tenant isolation, rate/policy gates, bounded model and memory ports / 私有託管認證、租戶隔離、政策閘門、受限模型與記憶 ports | core constitution or game mutation / Core 憲法或遊戲狀態修改 |
| `NexusLink` | first-party client projection, allowed-effect validation, atomic gameplay reducer / 第一方客戶端投影、效果驗證、原子遊戲 reducer | hosted identity claims or model authority / 託管身分 claims 或模型權威 |
| `aiforge-raphael-corpus` | reviewed source corpus and historical semantic material / 經審閱來源語料與歷史材料 | executable policy / 可執行政策 |

Players never enter a model-provider key. Hosted credentials belong to HMAX service infrastructure; access claims are server-verified and never accepted from request-body identity fields.

玩家不需輸入模型供應商金鑰。託管憑證屬於 HMAX 服務基礎設施；身分 claims 只能由伺服器驗證，不能相信 request body 自報欄位。

## Structure

- `core/`: pure Raphael logic.
- `contracts/`: game-neutral request/response schema and examples.
- `adapters/nexuslink/`: NexusLink-specific adapter boundary.
- `adapters/hmax/`: narrow HMAX safety/final-critic wiring; no hosted dependency.
- `adapters/generic-game/`: reference adapter for future games.
- `gateway/`: deprecated mock/lab notes retained for regression history; production hosted work belongs in private `raphael-HMAX`.
- `corpus/`: reviewed, versioned runtime/eval snapshots; the source-of-truth corpus lives in `aiforge-raphael-corpus`.
- `training/`: eval cases and deterministic local evaluation.
- `release/`: allowlisted artifact policy; it is not runtime code.
- `scripts/`: deterministic artifact builder and fail-closed verifier.
- `tests/`: engine and adapter contract tests.

## Run

```bash
node --test "tests/*.test.mjs"
node --test tests/core-adapter-parity-v1.test.mjs
node tests/engine-contract.test.mjs
node tests/image-derived-knowledge.test.mjs
node tests/local-learning-sidecar.test.mjs
node tests/canon-retrieval.test.mjs
node tests/critic-policy.test.mjs
node tests/gateway-maturity.test.mjs
node tests/gateway-legacy-contract.test.mjs
node training/run-eval.mjs
node training/run-phase-4-expanded-eval.mjs
node training/run-canon-retrieval-eval.mjs
node training/run-critic-reflection-eval.mjs
node training/run-gateway-maturity-eval.mjs
node training/run-conversation-lab.mjs
node adapters/nexuslink/run-probe.mjs
npm run test:release-artifact
npm run check:core-artifact
```

On the Codex Windows workspace, use the bundled Node runtime if `node` is not on `PATH`:

```powershell
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\engine-contract.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\image-derived-knowledge.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\local-learning-sidecar.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\canon-retrieval.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\critic-policy.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\gateway-maturity.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\gateway-legacy-contract.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-phase-4-expanded-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-canon-retrieval-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-critic-reflection-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-gateway-maturity-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-conversation-lab.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" adapters\nexuslink\run-probe.mjs
```

## Integration Rule

NexusLink should not import Raphael internals directly. It should call a narrow adapter:

```text
NexusLink state -> Raphael contract -> Raphael engine -> NexusLink adapter result
```

The adapter may create chat candidates, animation intents, habitat traces, or memory proposals. It must not directly mutate save state, companion data, Pixi renderer state, or final player-facing output without a game-side policy gate.

The standalone kernel becomes live only after safety, boundary, memory eligibility, effect proposal, conversation and autonomy parity pass against the sealed Nexus Link fixtures. Repository location alone does not grant runtime authority.

The HMAX adapter surface is documented in
`docs/RAPHAEL_CORE_ADAPTER_PARITY_V1.md`. High-risk input must be terminated at
the Edge before any model call. A model can supply wording only and every
candidate remains `trusted:false` until the canonical Core returns the final
decision.

## Core release artifact / Core 發行物

`RAPHAEL_CORE_RELEASE_ARTIFACT_V1` packages the allowlisted HMAX adapter closure
as a deterministic ESM directory. It contains only the HMAX entrypoint,
runtime contract, canonical critic/finalizer, and sovereign safety policy. It
does not contain a model, corpus, transcript, credential, database client,
browser, tool runner, or game reducer.

`RAPHAEL_CORE_RELEASE_ARTIFACT_V1` 會把經 allowlist 核准的 HMAX adapter
依賴閉包製作成可重現的 ESM 目錄。內容只有 HMAX 入口、runtime contract、
canonical critic／finalizer 與 sovereign safety policy；不包含模型、語料、
聊天原文、憑證、資料庫 client、瀏覽器、工具執行器或遊戲 reducer。

```bash
npm run test:release-artifact
npm run check:core-artifact
npm run build:core-artifact
node scripts/verify-core-artifact.mjs \
  --artifact dist/raphael-core/0.2.2-single-sovereign-v1 \
  --expected-digest sha256:<approved-release-digest> \
  --expected-core-version 0.2.2-single-sovereign-v1 \
  --expected-contract-version 1.0.0-draft.1
```

The normal builder refuses a dirty source tree. `--allow-dirty` can only
produce a visibly `releaseEligible:false` local candidate. HMAX deployment
must pin a digest produced from a clean, reviewed, immutable engine commit.
The digest and allowlist provide integrity, not a JavaScript sandbox; every
release still requires source review and operator-owned pin approval.

完整規則與停止條件請見
`docs/RAPHAEL_CORE_RELEASE_ARTIFACT_V1.md`。

獨立核心只有在 safety、boundary、memory eligibility、effect proposal、conversation 與 autonomy 對 sealed Nexus Link fixtures 達成 parity 後，才能成為 live runtime；儲存庫位置本身不代表已取得執行權威。

The NexusLink probe runner verifies that this boundary remains intact before any live testbed integration:

```bash
node adapters/nexuslink/run-probe.mjs
```

## Learning Model

Learning is split into three layers:

- Local player learning: stored per player/game instance.
- Game-specific tuning: NexusLink-specific canon, evals, and response policy.
- Global Raphael training: anonymous, redacted, summarized, human-reviewed data only.

This v0 implements local learning signals as structured proposals. It does not perform global training or ingest raw player text into shared datasets.

## Agentic Pattern Training Plan

The current training roadmap derived from `Agentic Design Patterns` is documented here:

- `docs/RAPHAEL_AGENTIC_DESIGN_PATTERNS_TRAINING_PLAN.md`
- `training/agentic-pattern-map.json`

Phase 4 dataset expansion status:

- `docs/PHASE_4_DATASET_EXPANSION_REPORT.md`
- `training/phase-4-expanded-eval-packs.json`
- `npm run eval:phase4`

Image knowledge intake and Phase 5 local learning:

- `docs/IMAGE_KNOWLEDGE_INTAKE_REPORT.md`
- `docs/PHASE_5_LOCAL_LEARNING_SIDECAR_REPORT.md`
- `corpus/creature-body-language.json`
- `corpus/wellbeing-soft-context.json`
- `npm run test:image-knowledge`
- `npm run test:local-learning`

Phase 6 canon retrieval lab:

- `docs/PHASE_6_CANON_RETRIEVAL_LAB_REPORT.md`
- `corpus/nexuslink-canon-cards.json`
- `training/canon-retrieval/canon-retrieval-cases.json`
- `npm run test:canon-retrieval`
- `npm run eval:canon`

Canon retrieval answers only when a reviewed source card is matched. Unsupported or unapproved claims abstain instead of inventing lore.

Phase 7 critic and reflection loop:

- `docs/PHASE_7_CRITIC_REFLECTION_LOOP_REPORT.md`
- `core/criticPolicy.js`
- `training/critic-reflection/critic-reflection-cases.json`
- `npm run test:critic`
- `npm run eval:critic`

The critic can revise unsafe gameplay framing, false intimacy, template-like replies, and canon answers without reviewed citations. It exposes issue codes only, not chain-of-thought.

Phase 8 backend gateway maturity:

- `docs/PHASE_8_BACKEND_GATEWAY_MATURITY_REPORT.md`
- `gateway/mock-gateway.js`
- `training/gateway-maturity/gateway-maturity-cases.json`
- `npm run test:gateway`
- `npm run eval:gateway`

The gateway remains mock-only and keyless. Gateway advisors are `trusted: false` and cannot override RaphaelCore safety, boundary, memory, response, or reward policy.
The mock worker also accepts NexusLink's legacy `POST /v1/gateway` preview contract for QA-only staging compatibility.
