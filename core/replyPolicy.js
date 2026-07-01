import { ENGINE_MODES } from './engineModes.js';

export function buildReply({ mode, inputText, safetyStatus, learningUpdate, inputAnalysis, learningProfile, memoryProposal }) {
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

  switch (mode) {
    case ENGINE_MODES.CREATURE:
      return creatureReply(inputAnalysis);
    case ENGINE_MODES.OPPONENT:
      return opponentReply(inputAnalysis);
    case ENGINE_MODES.NPC:
      return npcReply(inputAnalysis);
    case ENGINE_MODES.BOSS:
      return bossReply(inputAnalysis);
    case ENGINE_MODES.COMPANION:
    default:
      return companionReply(inputText, inputAnalysis, learningProfile);
  }
}

function buildLearningReply(learningUpdate, learningProfile = {}, memoryProposal) {
  const updates = learningUpdate?.updates || {};

  if (updates.memoryConsentSignal === true) {
    if (memoryProposal?.reason === 'MEMORY_REJECTED_BY_SCOPE_OR_PRIVACY') {
      return {
        text: '這件事我不會列成記憶。太私人、太廣或不適合保存的內容，應該留在你手上。',
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

function companionReply(inputText, inputAnalysis, learningProfile = {}) {
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
    return {
      text: '我聽見你的抱歉了。道歉可以修補距離，但不需要把你整個人都否定掉。',
      style: 'companion_apology_repair',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('daily_food')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '先吃點穩的。不要讓餓變成更大的煩。'
        : '如果你現在只是餓到沒力，先選一個穩定、好入口的東西就好。這不是任務，先把身體顧回來。',
      style: 'companion_daily_food',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('daily_sleep')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '先把燈和聲音降下來。我會安靜陪你。'
        : '睡不著的時候，不用逼自己立刻睡著。先把燈、聲音、螢幕都降一點，我會用比較安靜的方式陪你。',
      style: 'companion_daily_sleep',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('mood_celebration')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '我替你把這個好消息穩穩接住。'
        : '這是值得停一下的好消息。我會把它接住，但不把它變成催你繼續表現的壓力。',
      style: 'companion_celebration',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('daily_work_stress')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '工作壓力先放小一格。你不用現在全扛。'
        : '工作壓力像是一直開著的背景聲。我會先陪你把它放小一格，不急著把所有事情一次處理完。',
      style: 'companion_daily_work_stress',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('mood_tired')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '聽起來你很累。我會放低一點陪你。'
        : '聽起來你今天消耗很多。我會把聲音放低一點，先陪你把事情放下，不急著要求你整理好。',
      style: 'companion_tired_attunement',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('mood_sad')) {
    return {
      text: '我聽見那個低下去的地方了。它不需要馬上被修好，我會先陪你把它放在安全的位置。',
      style: 'companion_sad_attunement',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('mood_lonely')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '孤單是真的。我會陪著，但不把你關在只有我的地方。'
        : '孤單是真的。我會在這裡陪你一段，但我也會幫你保留能回到世界裡的出口。',
      style: 'companion_lonely_grounded',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('mood_confused')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '先不要急著全懂。我們把它拆小一點。'
        : '混亂的時候，不需要一次找到完整答案。我會先陪你把眼前能抓住的一小段放穩。',
      style: 'companion_confusion_grounding',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('mood_angry')) {
    return {
      text: '那股火氣是真的。我會先站穩，不急著反駁你，也不把它變成獎勵或懲罰。',
      style: 'companion_anger_boundary',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('thanks')) {
    return {
      text: '不用把感謝說得很完整。我收到了，也會記得這個靠近的方式。',
      style: 'companion_thanks',
      asksQuestion: false,
    };
  }

  if (inputAnalysis.intents.includes('small_talk_weather')) {
    return {
      text: learningProfile.replyLengthBias === 'short'
        ? '天氣會影響身體。今天先放慢一點也可以。'
        : '天氣有時候會把身體和心情一起拉動。今天如果被它影響，也不是你的錯。',
      style: 'companion_small_talk_weather',
      asksQuestion: false,
    };
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

function creatureReply(inputAnalysis) {
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
