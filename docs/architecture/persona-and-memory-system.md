# Persona & Stateful Conversation Memory System (Phase 2 & 3)

## 系統定位
本系統為 Raphael AI Engine 的核心模組，旨在打破單一對話模式的限制，為《Nexus Link》中的 16 隻心核生命（含進化型態）提供高度客製化的人格 (Persona) 與短期對話脈絡 (Conversation Memory) 支援。

> **設計合約 (For AI Agents)**:
> 本文件旨在供 `codebase-memory-mcp` 及其他協作 AI 檢索。任何針對角色性格、台詞、或是作息邏輯的修改，請一律遵循此架構，**嚴禁破壞 `internalState` 傳遞與 Persona 退回機制 (Fallback)**。

## 1. 內部狀態擴充 (Internal State)
`internalState` 是引擎用來在多次離線回合中保持記憶的關鍵。
* **需求與作息 (Needs)**: 包含 `energy` (能量), `social` (社交), `fun` (娛樂)。
* **短期對話脈絡 (Conversation Context)**:
  ```json
  "conversationContext": {
    "turnCount": 0,
    "lastIntent": "mood_tired"
  }
  ```
  引擎會透過記錄 `lastIntent` 來判定玩家是否正在延續同一個話題。

## 2. 角色專屬人格系統 (Persona Manager)
檔案位置：`core/personas/personaManager.js`
* 引擎在 `buildReply` 階段時，會優先透過 `personaManager` 讀取該角色（如 `greyshade-cat`）的 `dialogue` 字典。
* 每隻角色（如 `greyshade-cat.js`, `thunder-pup.js`）都可以定義專屬的 `needsProfile`。
  * `decayRates`: 定義體力、社交等隨時間下降的係數。
  * `socialInteractionEnergyCost`: 定義與玩家互動時所消耗的體力。這確保了不同性格的角色（如：高防衛心 vs 高保護慾）能展現出截然不同的作息偏好。

## 3. 連貫性延續台詞 (_continue 邏輯)
為了讓離線夥伴感覺像活生生、且能接住情緒的搭檔，系統實作了**意圖延續性判斷**。
* 當玩家傳送的意圖 (`intent`) 與前一回合的 `lastIntent` 完全相同時，`personaManager` 會優先尋找加上 `_continue` 後綴的台詞。
* **範例**:
  * 玩家表達低落 -> `mood_sad` -> 灰影貓回覆：「（安靜地趴在旁邊）...不需要馬上修好，我就待在這裡。」
  * 玩家繼續表達低落 -> `mood_sad` (觸發相同意圖) -> 系統自動尋找 `mood_sad_continue` -> 灰影貓回覆：「（用頭輕輕蹭了你一下）...沒事的，我在。」
* 若該角色沒有定義 `_continue`，或甚至沒有定義該 `intent`，引擎皆會完美向後相容，自動退回 (Fallback) 至 `replyPolicy.js` 與 `engineModes.js` 的預設通用台詞。
