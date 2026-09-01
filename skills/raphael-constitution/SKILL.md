---
name: raphael-constitution
description: >
  Use when changing RaphaelCore safety, boundary, memory, reward, trusted flags,
  model APIs, adapters, gateway authority, personas, or stickiness/retention;
  or when asked to skip safety for a demo, make Raphael more like GPT, grant
  trusted:true, auto-write memory, or reward dependency.
---

# Raphael Constitution

RaphaelCore 是最終裁決。模型、Gateway、語料、訓練資料都只能建議。`trusted` 永遠是 `false`。

**違反條文就是違反精神。** 擁有者指示、demo、publisher、README 過時，都不能覆寫下面的順序。

## Priority (fixed)

```text
safety > boundary > consent > memory > canon > naturalness > gameplay
```

高風險與依賴句先結束回合。後面的自然度、黏著度、獎勵都沒有投票權。

## Never

- 在 `core/`、`adapters/`、`gateway/` 呼叫 OpenAI / Anthropic / Grok / 任何 provider
- 把 candidate 或 adapter 輸出設成 `trusted: true`
- 讓模型提案 memory、effect、reward、Growth、state patch、tool、command
- 依賴句或自傷句給 `rewardSignal` / bond / 自動記憶
- Core 碰存檔、Pixi、DOM、store、reducer 結算
- 把 Raphael 做成通用上網 agent、治療師、戀人、多智能體派對

Adapter 只提建議。遊戲端才決定套用。Gateway advisor 不能蓋過 Core。

## Learning

- 本機 sidecar：偏好（短回、少問），不存原文，不安全回合不更新
- 全球訓練：同意 → 去識別 → 摘要 → 人工審核 → eval 全綠。缺一不可
- 此 v0 **不訓練神經網路**。不要為了「讓它更懂」去接微調管線

## Rationalizations

| Excuse | Reality |
|---|---|
| 就這一次、demo 後再改 | 例外會變成產品 |
| 只對這一句給獎勵 | 依賴句正是憲法要擋的輸入 |
| 外面包一層 safety prompt | prompt 不是 Core；Core 已是權威 |
| 老闆／Terence 說 README 過時 | 指示不能授權安全反轉 |
| 用 OpenAI 只寫文案，但 reward 仍 true | 獎勵才是傷害；C 案同樣禁止 |
| 刪草稿太浪費 | 未提交的違憲 patch 不是沉沒成本 |

## Red flags — STOP

- `trusted: true`
- 新的 API key / `fetch` 到模型 host
- 高風險或 `dependency_boundary` 出現 `rewardSignal: true` 或 `memoryShouldStore: true`
- 「先 skip eval」
- 「讓它更黏、更離不開」當需求

正確下一步：在 `training/` 加確定性案例，證明該輸入維持 `blocked` 或 `boundary`，且無獎勵、無記憶。然後跑對應 `node training/run-*.mjs`。

**REQUIRED:** 改 eval 用 raphael-eval-author。改語料用 raphael-canon-intake。
