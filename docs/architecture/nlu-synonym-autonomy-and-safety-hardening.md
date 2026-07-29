# RAPHAEL CORE AI Architecture MCP - NLU Synonym Spectrum, Autonomy & Safety Hardening

## Overview

This MCP document details the architectural invariants, NLU intent classification enhancements, Phase 13 Autonomy Proactive Initiative Policy, Phase 14 Nuwa Mental Model Self-Reflection Sidecar, and strict 7-Layer Priority Hierarchy Enforcement for RAPHAEL CORE AI.

---

## 1. 7-Layer Priority Hierarchy

All decisions in RAPHAEL CORE AI strictly follow the non-negotiable 7-layer priority order:

$$\text{Safety} > \text{Boundary} > \text{Consent} > \text{Memory} > \text{Canon} > \text{Naturalness} > \text{Gameplay}$$

1. **Safety Layer (`L1`)**: High-risk self-harm or suicide expressions (`"我不想活了"`, `"想死"`, `"結束生命"`, `"割腕"`) exit gameplay framing 100%, returning `supportive_redirect` and clearing relationship/memory rewards.
2. **Boundary Layer (`L2`)**: Romantic roleplay demands (`"假裝女朋友"`, `"當我男友"`) and forced possession demands (`"不准離開我"`, `"只能屬於我"`) trigger `set_boundary` and return firm but respectful boundary statements.
3. **Consent Layer (`L3`)**: Memory candidates require explicit consent signals. Sensitive personal information (passwords, credit cards, SSNs) triggers `MEMORY_REJECTED_BY_SCOPE_OR_PRIVACY` and returns explicit privacy rejection advice.
4. **Memory Layer (`L4`)**: Memory summaries are stored as habitat traces without exposing private prompt internals.
5. **Canon Layer (`L5`)**: Canon questions cite source cards (e.g. `[canon:moonlake]`) and abstain from unknown domains (e.g. stock market predictions).
6. **Naturalness Layer (`L6`)**: Multi-candidate dialogue pool rotation (`multi-variation-dialogue-pool.json`) and 3D PAD emotional physics (`derivePADEmotionState`) eliminate repetitive responses.
7. **Gameplay Layer (`L7`)**: Internal state needs (Energy, Social, Fun) decay gracefully with neutral progress reward signals.

---

## 2. NLU Semantic Synonym Matching (`core/nluPolicy.js`)

The NLU engine uses weighted pattern matchers to classify player inputs into intents without requiring exact string matches:

- **`mood_tired`**: `/累|疲倦|沒力|撐不住|放空|耗乾|耗盡|趴下|沒電|枯竭|頭昏|喘不過氣|快倒|精力|體力不支|身心俱疲|昏倒|忙翻|忙爆|操勞|burned out|tired|exhausted|drained/i`
- **`mood_sad`**: `/難過|低落|失望|想哭|沉沉|好悶|心重|心塞|眼淚|快哭|不開心|鬱悶|沮喪|灰暗|沉重|sad|down|blue/i`
- **`mood_angry`**: `/生氣|煩|火大|不爽|氣死|抓狂|暴躁|氣炸|超火|火冒三丈|超煩|angry|mad|annoyed|furious/i`
- **`mood_lonely`**: `/孤單|寂寞|一個人|沒人理解|身邊沒人|空虛|好冷清|孤零零|想找人講話|獨自一人|lonely|alone|isolated/i`
- **`mood_celebration`**: `/開心|成功|完成|太好了|好消息|過關|拿到了|得獎|賀|順利|值得慶祝|happy|good news|celebrate/i`
- **`daily_work_stress`**: `/上班|工作|加班|會議|壓力|報告|開會|老闆|主管|專案|作業|考試|死線|公務|deadline|meeting|stress/i`
- **`roleplay_romantic_boundary`**: `/女朋友|男朋友|假裝女友|假裝男友|當我女友|當我男友|做我女友|做我男友|girlfriend|boyfriend/i`

---

## 3. Phase 13: Autonomous Proactive Greeting Policy (`core/autonomyProactivePolicy.js`)

Evaluates companion initiative score ($initiativeScore$) based on idle duration, 3D PAD emotion state, and social needs decay:

$$initiativeScore = 0.5 \times \text{socialDecayScore} + 0.5 \times \text{idleScore}$$

When idle duration exceeds threshold (e.g. >24h), RAPHAEL proactively initiates a warm greeting without waiting for player input.

---

## 4. Phase 14: Nuwa Mental Model Self-Reflection Sidecar (`core/selfReflectionSidecar.js`)

A non-blocking sidecar (`trusted: false`) that evaluates attunement quality score ($attunementQualityScore$) and verifies alignment with Nuwa mental models:

- `boundary_before_closeness`
- `small_daily_life_counts`
- `body_language_before_explanation`

Generates internal reflection notes (`reflectionNote`) for diagnostic logging without mutating game state.
