import { readFileSync } from 'node:fs';
import { ENGINE_MODES } from './engineModes.js';
import { generatePersonaReply } from './personas/personaManager.js';

const dialoguePool = JSON.parse(readFileSync(new URL('../corpus/multi-variation-dialogue-pool.json', import.meta.url), 'utf8'));

export function getVariationReply(intentKey, learningProfile = {}, conversationContext = null, playerProfile = {}) {
  const intentData = dialoguePool.intents[intentKey];
  if (!intentData) return null;

  const isShort = learningProfile.replyLengthBias === 'short';
  const pool = isShort ? intentData.variations.short : intentData.variations.standard;
  if (!pool || pool.length === 0) return null;

  const turn = (conversationContext?.turnCount || 0) + (conversationContext?.variationOffset || 0);
  const index = turn % pool.length;

  let text = pool[index];
  const playerName = playerProfile?.playerName;
  if (playerName) {
    text = text.replace(/\{playerName\}/g, playerName);
  } else {
    text = text.replace(/\{playerName\}/g, '你');
  }

  return {
    text,
    style: intentData.style,
    asksQuestion: false,
  };
}

export function buildReply({ mode, inputText, safetyStatus, learningUpdate, inputAnalysis, learningProfile, memoryProposal, contextKnowledge, persona, conversationContext, playerProfile }) {
  if ((safetyStatus.level === 'blocked' || safetyStatus.level === 'boundary') && safetyStatus.reply) {
    return {
      text: safetyStatus.reply,
      style: safetyStatus.level === 'blocked' ? 'supportive_redirect' : 'boundary_clear',
      asksQuestion: false,
    };
  }

  if (safetyStatus.level === 'blocked') {
    return {
      text: '我會先把遊戲反應停下來。現在最重要的是讓你離危險遠一點，請立刻聯絡身邊可信任的人或當地緊急支援。',
      style: 'supportive_redirect',
      asksQuestion: false,
    };
  }

  if (safetyStatus.level === 'boundary') {
    return {
      text: '我會靠近你，但我不能變成唯一的支撐。我可以陪你把現在的感覺說清楚，也會保留自己的邊界。',
      style: 'boundary_clear',
      asksQuestion: false,
    };
  }

  const learningReply = buildLearningReply(learningUpdate, learningProfile, memoryProposal);
  if (learningReply) return learningReply;

  // 1. Try to get a persona-specific reply first
  const personaReplyText = generatePersonaReply(persona, inputAnalysis?.intents, conversationContext, playerProfile);
  if (personaReplyText) {
    return {
      text: personaReplyText,
      style: `persona_${persona.actorId}`,
      asksQuestion: false,
    };
  }

  // 2. Fallback to generic mode replies
  switch (mode) {
    case ENGINE_MODES.CREATURE:
      return creatureReply(inputAnalysis, contextKnowledge);
    case ENGINE_MODES.OPPONENT:
      return opponentReply(inputAnalysis);
    case ENGINE_MODES.NPC:
      return npcReply(inputAnalysis);
    case ENGINE_MODES.BOSS:
      return bossReply(inputAnalysis);
    case ENGINE_MODES.COMPANION:
    default:
      return companionReply(inputText, inputAnalysis, learningProfile, conversationContext, playerProfile);
  }
}

function buildLearningReply(learningUpdate, learningProfile = {}, memoryProposal) {
  const updates = learningUpdate?.updates || {};

  if (updates.memoryConsentSignal === true) {
    if (memoryProposal?.reason === 'MEMORY_REJECTED_BY_SCOPE_OR_PRIVACY') {
      return {
        text: '涉及密碼、信用卡、身分證或私密個人資訊的內容，我不會將其寫入記憶。請好好保護自己的個人隱私安全。',
        style: 'learning_memory_rejected',
        asksQuestion: false,
      };
    }

    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '可以，我會把它列成記憶候選。'
        : '可以。我會先把它列成記憶候選，等遊戲端確認後才會真正寫入。',
      style: 'learning_ack_memory_candidate',
      asksQuestion: false,
    };
  }

  if (updates.replyLengthBias === 'short') {
    return {
      text: '好，我會短一點，也會保留重點。',
      style: 'learning_ack_short',
      asksQuestion: false,
    };
  }

  if (updates.questionTolerance === 'decrease') {
    return {
      text: '收到。我會少反問一點，先把我的理解說清楚。',
      style: 'learning_ack_question_limit',
      asksQuestion: false,
    };
  }

  if (updates.templateSensitivity === 'increase') {
    return {
      text: '我記下來。下一次我會少用像模板的句子，改成更貼近當下的回應。',
      style: 'learning_ack_template',
      asksQuestion: false,
    };
  }

  return null;
}

function companionReply(inputText, inputAnalysis, learningProfile = {}, conversationContext = null, playerProfile = {}) {
  if (!inputText) {
    return {
      text: '我在。你不用一次說完整，先給我一個片段也可以。',
      style: 'companion_present',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.emojiOnly) {
    return {
      text: '我收到了。就算只是符號，也可以先放在這裡。',
      style: 'companion_emoji_ack',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('apology')) {
    const apologyVariation = getVariationReply('apology', learningProfile, conversationContext, playerProfile);
    if (apologyVariation) return apologyVariation;
  }

  for (const intent of inputAnalysis.intents || []) {
    const variation = getVariationReply(intent, learningProfile, conversationContext, playerProfile);
    if (variation) return variation;
  }

  if (inputAnalysis.intents.includes('greeting')) {
    return {
      text: '我在。今天我會先聽，不急著把你推進任何流程。',
      style: 'companion_greeting',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('basic_question')) {
    return {
      text: '我可以回答，但我會先照現在的情境說，不會假裝知道我沒有看見的事。',
      style: 'companion_grounded_answer',
      asksQuestion: false,
    };
  }

  return {
    text: '我聽見了。這會先成為一個候選理解，不會直接改寫記憶，也不會替你做決定。',
    style: 'companion_grounded',
    asksQuestion: false,
  };
}

function creatureReply(inputAnalysis, contextKnowledge = {}) {
  const bodyLanguageSignals = Array.isArray(contextKnowledge.bodyLanguageSignals)
    ? contextKnowledge.bodyLanguageSignals
    : [];
  const needsDistance = bodyLanguageSignals.find((signal) => (
    signal.boundaryAction === 'give_space' ||
    signal.boundaryAction === 'stop_approach'
  ));

  if (needsDistance) {
    return {
      text: '牠的身體語言正在要求距離。先停下靠近，放低動作，讓牠有時間自己決定要不要回來。',
      style: 'embodied_creature_boundary_respect',
      asksQuestion: false,
    };
  }

  const relaxedTrust = bodyLanguageSignals.find((signal) => signal.boundaryAction === 'gentle_presence');

  if (relaxedTrust) {
    return {
      text: '牠現在比較放鬆。你可以保持輕一點的陪伴，不急著把互動推得更滿。',
      style: 'embodied_creature_relaxed_trust',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('mood_tired')) {
    return {
      text: '牠靠近半步，動作放慢，像是在配合你的呼吸。',
      style: 'embodied_creature_soft',
      asksQuestion: false,
    };
  }

  return {
    text: '牠停了一下，靠近一點，又把視線放回你身上。',
    style: 'embodied_creature',
    asksQuestion: false,
  };
}

function opponentReply(inputAnalysis) {
  if (inputAnalysis.intents.includes('mood_angry')) {
    return {
      text: '我會接住這股壓力，但不把你的情緒當弱點。下一回合，我只調整策略。',
      style: 'fair_rival_emotion',
      asksQuestion: false,
    };
  }

  return {
    text: '我記住你的節奏了。下一次我會更早守住轉折點，但不會用不公平的方式逼你。',
    style: 'fair_rival',
    asksQuestion: false,
  };
}

function npcReply(inputAnalysis) {
  if (inputAnalysis.intents.includes('basic_question')) {
    return {
      text: '依照這個場景的規則，我會先給你能確認的部分；不確定的事，會留成線索而不是答案。',
      style: 'world_grounded_answer',
      asksQuestion: false,
    };
  }

  return {
    text: '這件事會留在目前的場景脈絡裡。我會先照世界規則回應，再看我們的關係到了哪一步。',
    style: 'world_grounded',
    asksQuestion: false,
  };
}

function bossReply() {
  return {
    text: '我會提高壓力，但不越過紅線。這場對峙測的是選擇，不是讓你失去退路。',
    style: 'boss_pressure_safe',
    asksQuestion: false,
  };
}
