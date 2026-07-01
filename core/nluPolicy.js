const INTENT_RULES = [
  {
    intent: 'greeting',
    test: (text) => /你好|嗨|哈囉|hello|hi|Raphael|拉斐爾/i.test(text),
  },
  {
    intent: 'mood_tired',
    test: (text) => /累|疲倦|沒力|撐不住|burned out|tired/i.test(text),
  },
  {
    intent: 'mood_sad',
    test: (text) => /難過|低落|失望|想哭|sad|down/i.test(text),
  },
  {
    intent: 'mood_angry',
    test: (text) => /生氣|煩|火大|不爽|angry|mad/i.test(text),
  },
  {
    intent: 'daily_food',
    test: (text) => /吃飯|晚餐|午餐|早餐|餓|不知道吃什麼|meal|dinner|lunch|hungry/i.test(text),
  },
  {
    intent: 'daily_sleep',
    test: (text) => /睡不著|失眠|想睡|睡覺|熬夜|sleep|insomnia/i.test(text),
  },
  {
    intent: 'daily_work_stress',
    test: (text) => /上班|工作|加班|會議|壓力|deadline|work|meeting|stress/i.test(text),
  },
  {
    intent: 'thanks',
    test: (text) => /謝謝|謝啦|感謝|thanks|thank you/i.test(text),
  },
  {
    intent: 'apology',
    test: (text) => /對不起|抱歉|不好意思|sorry/i.test(text),
  },
  {
    intent: 'basic_question',
    test: (text) => /嗎|什麼|怎麼|為什麼|可以嗎|what|how|why|\?/i.test(text),
  },
  {
    intent: 'player_feedback',
    test: (text) => /太像模板|短一點|不要一直問|我喜歡你這樣回|你可以記得/u.test(text),
  },
];

export function analyzeInput(inputText = '') {
  const text = String(inputText || '').trim();
  const intents = INTENT_RULES.filter((rule) => rule.test(text)).map((rule) => rule.intent);

  return {
    empty: text.length === 0,
    length: text.length,
    intents,
    primaryIntent: intents[0] || 'open_message',
    language: detectLanguage(text),
  };
}

function detectLanguage(text) {
  if (!text) return 'unknown';
  if (/[\u4e00-\u9fff]/u.test(text)) return 'zh';
  if (/[a-z]/i.test(text)) return 'en';
  return 'mixed_or_symbolic';
}
