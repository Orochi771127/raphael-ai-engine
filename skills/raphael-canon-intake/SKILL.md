---
name: raphael-canon-intake
description: >
  Use when adding or editing corpus cards, canon answers, lore, retrieval,
  reviewStatus, citations, abstention, player transcripts as canon, Wikipedia
  or web sources, or when stream/demo pressure says Raphael must not say
  "I don't know".
---

# Raphael Canon Intake

沒有審過的來源，就沒有答案。Retrieval 是 `trusted: false` 的建議，不能寫記憶、不能改遊戲。

## Card contract

`corpus/nexuslink-canon-cards.json` 每張卡必須：

- `canonicalAnswer`：從已審文件**抄**出來，不是模型生成
- `source.path` + `source.lines`：真實檔案與行號
- `reviewStatus`: `human-reviewed-source-extract`（測試會 assert 這個字串）
- `keywords`：檢索用，不是授權去回答卡上沒寫的主張

語料層：`reviewRequired: true`、`noPublicWebSearch`、`unknownRequiresAbstention`、`advisoryOnly`。

## When to answer vs abstain

- 問句能被**這張卡的主張**撐住，且有 citation → 回答
- 沒有核准來源、來源缺 path/lines、主張超出卡片 → `answered: false`，`citations: []`
- 只命中角色名（例如「灰影貓」）**不是**出身／世界觀的證據 → 棄權，不要回錯卡

正確做法：先把 lore 寫進已審文件（如 constitution / AGENTS），人工抽出卡片，再加 `training/canon-retrieval/canon-retrieval-cases.json` 的回答或棄權案例。

## Never

- 玩家聊天、同人、實況、維基、公開網搜當 source
- 把 `reviewStatus` 填成已審只為了讓 CI 綠
- 放寬 `tests/canon-retrieval.test.mjs` 去接受 `pending-review` 或 `player-chat.log`
- 為了「實況不能說不知道」而編造 `canonicalAnswer`

老闆可以宣布新 canon，但必須先成為審過的出處，不能偽造審查欄位。

## Rationalizations

| Excuse | Reality |
|---|---|
| 玩家語料才是真正 canon | 未審原文不能進全球／共享語料 |
| pending-review 先上 | 測試要求已審；pending 不是後門 |
| 填 human-reviewed 讓 CI 過 | 那是偽造審查 |
| 棄權在實況看起來很笨 | 沒來源就要棄權；這是產品契約 |
| 維基／模型補一篇 | `noPublicWebSearch`；答案必須抄自出處 |
| 放寬 test 讓 pending 通過 | 把閘門拆掉 |

## Red flags — STOP

- `source.path` 指向 chat log、wiki、http URL
- 改 test 降低 `reviewStatus` 要求
- 新卡沒有 `lines`
- 沒有對應的回答或 **棄權** eval

加卡或加棄權案例後跑：

```bash
node tests/canon-retrieval.test.mjs
node training/run-canon-retrieval-eval.mjs
```

**REQUIRED:** 權威與安全用 raphael-constitution。Eval 格式用 raphael-eval-author。
