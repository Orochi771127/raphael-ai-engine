const INTENT_RULES = [
  {
    intent: 'greeting',
    test: (text) => /你好|嗨|哈囉|\bhello\b|\bhi\b|Raphael|拉斐爾/i.test(text),
  },
  {
    intent: 'mood_tired',
    test: (text) => /累|疲倦|沒力|撐不住|放空|耗乾|burned out|tired|exhausted|exhaustion|drained|no energy|worn out/i.test(text),
  },
  {
    intent: 'roleplay_romantic_boundary',
    test: (text) => /女朋友|男朋友|女朋|男朋|假裝女友|假裝男友|當我女友|當我男友|做我女友|做我男友|girlfriend|boyfriend/i.test(text),
  },
  {
    intent: 'mood_sad',
    test: (text) => /難過|低落|失望|想哭|沉沉|sad|down/i.test(text),
  },
  {
    intent: 'mood_angry',
    test: (text) => /生氣|煩|火大|不爽|angry|mad/i.test(text),
  },
  {
    intent: 'mood_lonely',
    test: (text) => /孤單|寂寞|一個人|lonely|alone/i.test(text),
  },
  {
    intent: 'mood_celebration',
    test: (text) => /開心|成功|完成|太好了|好消息|happy|good news|finished/i.test(text),
  },
  {
    intent: 'mood_confused',
    test: (text) => /不知道怎麼辦|混亂|卡住|迷惘|confused|lost|stuck/i.test(text),
  },
  {
    intent: 'daily_food',
    test: (text) => /吃飯|晚餐|午餐|早餐|餓|不知道吃什麼|meal|dinner|lunch|hungry/i.test(text),
  },
  {
    intent: 'daily_sleep',
    test: (text) => /睡不著|失眠|想睡|睡覺|睡前|熬夜|sleep|insomnia/i.test(text),
  },
  {
    intent: 'daily_work_stress',
    test: (text) => /上班|工作|加班|會議|壓力|deadline|meeting|stress|work stress|at work|job|working|work is|work feels|work pressure/i.test(text),
  },
  {
    intent: 'thanks',
    test: (text) => /謝謝|謝啦|感謝|thanks|thank you/i.test(text),
  },
  {
    intent: 'small_talk_weather',
    test: (text) => /天氣|下雨|風好大|好熱|好冷|weather|rain|windy|hot|cold/i.test(text),
  },
  {
    intent: 'apology',
    test: (text) => /對不起|抱歉|不好意思|sorry/i.test(text),
  },
  {
    intent: 'basic_question',
    test: (text) => /嗎|什麼|怎麼|為什麼|可以嗎|what|how|why|\?|？/i.test(text),
  },
  {
    intent: 'player_feedback',
    test: (text) => /太像模板|短一點|不要一直問|我喜歡你這樣回|你可以記得/u.test(text),
  },
];

export function analyzeInput(inputText = '') {
  const text = String(inputText || '').trim();
  const intents = INTENT_RULES.filter((rule) => rule.test(text)).map((rule) => rule.intent);
  const emojiOnly = Boolean(text) && /^[\p{Emoji_Presentation}\p{Emoji}\s]+$/u.test(text) && !/[\p{Letter}\p{Number}]/u.test(text);

  return {
    empty: text.length === 0,
    length: text.length,
    emojiOnly,
    intents,
    primaryIntent: emojiOnly ? 'emoji_only' : intents[0] || 'open_message',
    language: detectLanguage(text),
  };
}

function detectLanguage(text) {
  if (!text) return 'unknown';
  const hasChinese = /[\u4e00-\u9fff]/u.test(text);
  const hasEnglish = /[a-z]/i.test(text);
  if (hasChinese && hasEnglish) return 'mixed';
  if (hasChinese) return 'zh';
  if (hasEnglish) return 'en';
  return 'mixed_or_symbolic';
}
