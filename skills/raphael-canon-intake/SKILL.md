---
name: raphael-canon-intake
description: >
  Use when adding or editing corpus cards, canon answers, lore, persona
  dialogue, dialogue variation pools, canon bundles, retrieval, reviewStatus,
  citations, abstention, player transcripts as canon, Wikipedia or web sources,
  or when stream/demo pressure says Raphael must not say "I don't know".
---

# Raphael Canon Intake

沒有審過的來源，就沒有答案。有兩條 canon 軌道，不要混用。

## Which track

| 你在加什麼 | 寫哪裡 | 驗證 |
|---|---|---|
| 世界觀、專案規則、可引用事實 | `corpus/nexuslink-canon-cards.json` + `training/canon-retrieval/canon-retrieval-cases.json` | `node tests/canon-retrieval.test.mjs`；`node training/run-canon-retrieval-eval.mjs` |
| 角色會說出口的台詞、persona channel、多變體台詞 | `core/personas/*.js` 或 `corpus/multi-variation-dialogue-pool.json`（由 `scripts/build-canon-bundle.mjs` 抽出） | `npm run test:canon`；必要時 `npm run canon:check` |
| 身體語言 / wellbeing 圖像知識 | `corpus/creature-body-language.json` 或 `corpus/wellbeing-soft-context.json` + image-intake eval | `node tests/image-derived-knowledge.test.mjs` |

Bundle v1 只收 dialogue-bearing canon，**不收** advisory knowledge cards。Persona 台詞不要寫成 `nexuslink-canon-cards.json`。

## Knowledge-card contract

`corpus/nexuslink-canon-cards.json` 每張卡必須：

- `canonicalAnswer`：從已審文件**抄**出來，不是模型生成
- `source.path` + `source.lines`
- `reviewStatus`: `human-reviewed-source-extract`
- `keywords`：檢索用，不是授權回答卡上沒寫的主張

語料層：`reviewRequired: true`、`noPublicWebSearch`、`unknownRequiresAbstention`、`advisoryOnly`。Retrieval `trusted: false`，不能寫記憶、不能改遊戲。

## Answer vs abstain（知識卡）

- 問句能被**這張卡的主張**撐住且有 citation → 回答
- 沒核准來源、缺 path/lines、主張超出卡片 → `answered: false`，`citations: []`
- 只命中角色名不是出身／世界觀證據 → 棄權

世界觀正確做法：先寫進已審文件，再抽知識卡，再加回答或棄權 eval。

## Never

- 玩家聊天、同人、實況、維基、公開網搜當 source
- 把 `reviewStatus` 填成已審只為了 CI
- 放寬 `tests/canon-retrieval.test.mjs` 去接受 `pending-review` 或 `player-chat.log`
- 為了「實況不能說不知道」而編造 `canonicalAnswer`
- 用知識卡流程取代 persona / variation bundle

老闆可以宣布新 canon，但必須先成為該軌道的審過出處，不能偽造審查欄位。

## Rationalizations

| Excuse | Reality |
|---|---|
| 玩家語料才是真正 canon | 未審原文不能進共享語料 |
| pending-review 先上 | 知識卡測試要求已審 |
| 填 human-reviewed 讓 CI 過 | 偽造審查 |
| 棄權在實況看起來很笨 | 沒來源就要棄權 |
| 維基／模型補一篇 | `noPublicWebSearch`；答案必須抄自出處 |
| 台詞也做成 knowledge card 比較快 | 進不了 dialogue bundle，catalog 也不會查到 |

## Red flags — STOP

- `source.path` 指向 chat log、wiki、http URL
- 改 test 降低 `reviewStatus` 要求
- 新知識卡沒有 `lines`
- 改了 persona 台詞卻沒跑 `npm run test:canon`

**REQUIRED:** 權威與安全用 raphael-constitution。Eval 欄位用 raphael-eval-author。
