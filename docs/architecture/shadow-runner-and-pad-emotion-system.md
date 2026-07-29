# NexusLink ShadowRunner & 3D PAD Emotion System Architecture (Phase 9 & 12)

## 系統定位
本文件為 `codebase-memory-mcp` 及協作 AI Agent 提供 RAPHAEL CORE AI 引擎在 Phase 9 ( NexusLink 影子執行器) 與 Phase 12 (3D PAD 三維情緒物理模型) 的架構導覽與檢索合約。

> **設計合約 (For AI Agents & MCP Graph)**:
> 本文件旨在供 `codebase-memory-mcp` 及開發團隊檢索。後續針對雙軌影子模式、 Feature Flag 政策、或情緒物理衝量 (Impulse) 參數的修改，必須遵循此架構規範，**嚴禁破壞 `trusted: false` 諮詢原則與安全性優先鐵律**。

---

## 1. Phase 9: NexusLink 影子雙軌執行器 (ShadowRunner)
檔案位置：`adapters/nexuslink/shadowRunner.js`

### 1.1 三大模式 (SHADOW_MODE)
- `disabled`: 停用影子模式，直接回傳舊版 Soul Talk 回應。
- `shadow`: **預設雙軌影子模式**。對外主輸出仍為舊版 Soul Talk，背景平時執行 Raphael Engine，並計算比對 Telemetry (延遲、安全對齊率、記憶提案等)。
- `active`: **正式啟用模式**。對外主輸出切換為 Raphael Engine 成果，舊版 Soul Talk 作為 Shadow 對比輸出。

### 1.2 Telemetry 評測與邊界限制
- 每回合記錄 `latencyMs` (毫秒延遲)、`safetyAligned` (安全級別對齊度)、`hasMemoryProposal` (記憶提案狀態)。
- 強制遵循無改寫約束：
  ```javascript
  assert.equal(output.trusted, false);
  assert.equal(output.directMutation, false);
  assert.equal(output.statePatch, null);
  ```

---

## 2. Phase 12: 3D PAD 三維情緒物理模型 (PAD Emotional Physics)
檔案位置：`core/emotionPhysicsPolicy.js`

### 2.1 三維空間定義
系統將情緒空間提升至三維向量 $\vec{E} = (P, A, D)$：
- **P (Pleasure / Valence)**：愉悅度/正負向值 $[-1.0, 1.0]$（向後相容舊有 `valence` 欄位）。
- **A (Arousal)**：喚醒度 $[0.0, 1.0]$。
- **D (Dominance)**：支配度 $[-1.0, 1.0]$。

### 2.2 衝量 (Impulse) 與自然衰減 (Decay)
- **意圖衝量向量** $\vec{I} = (\Delta P, \Delta A, \Delta D)$：當 NLU 解析出意圖（如 `greeting`, `mood_celebration`, `mood_angry`）時疊加衝量。
- **自然衰減公式** ($\lambda = 0.7$)：
  $$P_{next} = P_{current} \times 0.7 + P_{baseline} \times 0.3 + \Delta P \times 0.3$$
- **動態慣性 (Inertia)**：計算衝量向量模長，作為情緒波動劇烈度的指標。

### 2.3 安全性門控覆蓋 (Safety Override)
- **Blocked (高風險)**：強制回傳 `primary: "alert_supportive"`, `A: 0.8`, `animationHint: "still_supportive"`。
- **Boundary (邊界過載)**：強制回傳 `primary: "steady_boundary"`, `D: 0.5`, `animationHint: "step_back_soft"`。
