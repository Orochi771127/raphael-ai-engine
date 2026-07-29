# Multi-Variation Corpus & Humanized Dialogue Architecture (Phase 4 Extension)

## 系統定位
本文件為 `codebase-memory-mcp` 及協作 AI Agent 提供 RAPHAEL CORE AI 語料庫擴充與同情境多候選 (Multi-Variation) 人性化對話機制的架構導覽與檢索合約。

> **設計合約 (For AI Agents & MCP Graph)**:
> 本文件旨在供 `codebase-memory-mcp` 及開發團隊檢索。擴充任何新意圖或修訂繁體中文對話句型時，必須維護多候選池結構，**確保 Index 0 永遠保持基本溫暖斷言相容，且不得移除 `apology` 修補優先權**。

---

## 1. 多候選人性化語料庫 (Multi-Variation Dialogue Pool)
檔案位置：`corpus/multi-variation-dialogue-pool.json`

### 1.1 結構與面向
語料庫包含 12 大常見互動與情緒意圖：
- 日常與微修復：`greeting` (招呼), `daily_food` (飲食), `daily_sleep` (睡眠), `daily_work_stress` (工作壓力)
- 情緒共鳴與非判斷傾聽：`mood_tired` (疲憊), `mood_sad` (低落), `mood_lonely` (孤獨), `mood_confused` (迷惘), `mood_celebration` (慶祝)
- 修補與感謝：`apology` (道歉修補), `thanks` (感謝), `mood_angry` (傾聽憤怒)

每種意圖皆提供 `standard` (標準陪伴) 與 `short` (精簡陪伴) 兩種語音偏好，每組包含 3~5 句極具畫面感與陪伴感的回覆。

---

## 2. 候選挑選演算法 (Selection Algorithm)
檔案位置：`core/replyPolicy.js`

### 2.1 輪替指標計算
```javascript
const turn = (conversationContext?.turnCount || 0) + (conversationContext?.variationOffset || 0);
const index = turn % pool.length;
```
- 當玩家進行多回合同意圖對話時，系統自動透過 `turn` 取模切換至下一句候選語料，徹底消除重複感。
- 當單回合測試時 `turnCount = 0`，自動退回 Index 0 確定性斷言。

### 2.2 道歉修補優先權 (Apology Priority)
當輸入同時觸發多重意圖（如：`mood_angry` 與 `apology`）時，系統優先執行 `apology` 語料選取，修補互動距離。
