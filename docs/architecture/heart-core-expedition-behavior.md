# Heart-Core Expedition Behavior System

## Overview
The Heart-Core Expedition Behavior System is designed to integrate the companion's personality (Persona) directly into the "Heart-Core Expedition" (心核遠征) game mode. It ensures that each companion reacts uniquely when participating in an expedition, finding items (shards), facing danger, or returning from a journey.

## Architecture

The system consists of two primary components:
1. **Persona `expeditionHabits` Definition**
2. **`expeditionPolicy` Evaluation**

### 1. Persona `expeditionHabits`
Each character persona (e.g., `greyshade-cat.js`, `thunder-pup.js`) now includes an `expeditionHabits` block defining their specific playstyle and dialogue.

```javascript
  expeditionHabits: {
    style: "shadow_walker", // The exploration style (e.g., aggressive_vanguard, cautious_explorer)
    focus: "scouting_and_safety", // The primary focus (e.g., clearing_threats, evasion, exploration)
    dialogue: {
      on_start: "出發時的專屬台詞",
      on_find_shard: "發現碎片時的專屬台詞",
      on_danger: "遭遇危險時的專屬台詞",
      on_return: "歸來時的專屬台詞"
    }
  }
```

### 2. Expedition Policy (`core/expeditionPolicy.js`)
The `evaluateExpeditionBehavior({ persona, expeditionState, eventType })` function is responsible for:
- Receiving the incoming `eventType` (`start`, `find_shard`, `danger`, `return`).
- Extracting the companion's specific dialogue from `expeditionHabits`.
- Determining the corresponding `microAction` (e.g., `prepare_expedition`, `defensive_stance`).
- Determining the corresponding PAD `mood` (e.g., `alert`, `excited`, `curious`).

### 3. Engine Integration (`core/index.js`)
When `runRaphaelEngine` detects `mode === 'expedition'` or the presence of an `expeditionEvent`, it invokes `evaluateExpeditionBehavior`.
The resulting text, micro-action, and mood are seamlessly woven into the `replyCandidate` and `emotionState`, overriding default conversational responses to provide a highly contextualized and immediate reaction to the game mode.

## Extension & Customization
To add a new companion to the Expedition mode, simply define their `expeditionHabits` in their persona file. The engine will automatically pick up the new habits and weave them into the AI's output without any additional code changes.
