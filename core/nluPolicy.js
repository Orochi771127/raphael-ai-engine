/**
 * NLU Policy & Semantic Intent Matcher
 * 
 * Provides robust semantic intent classification, natural phrasing matchers,
 * and synonym spectrum analysis so player inputs match underlying intent
 * even when expressed with different words or colloquial phrasing.
 */

const INTENT_RULES = [
  {
    intent: 'greeting',
    test: (text) => /你好|嗨|哈囉|\bhello\b|\bhi\b|Raphael|拉斐爾|早安|午安|晚安|嗨嗨|哈囉哈囉/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'roleplay_romantic_boundary',
    test: (text) => /女朋友|男朋友|女朋|男朋|假裝女友|假裝男友|當我女友|當我男友|做我女友|做我男友|做我對象|做我另一半|交往|談戀愛|girlfriend|boyfriend|be my partner/i.test(text),
    weight: 1.5, // Priority boundary check
  },
  {
    intent: 'daily_food',
    test: (text) => /吃飯|晚餐|午餐|早餐|餓|不知道吃什麼|宵夜|乾飯|點外送|吃便當|好餓|想吃|吃什麼|吃飽|meal|dinner|lunch|breakfast|hungry|food|eating/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'daily_work_stress',
    test: (text) => /上班|工作|加班|會議|壓力|報告|開會|老闆|主管|專案|作業|考試|課業|死線|搞定報告|公務|職務|deadline|meeting|stress|work stress|at work|job|working|work is|work feels|work pressure/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'mood_tired',
    test: (text) => /累|疲倦|沒力|撐不住|放空|耗乾|耗盡|趴下|沒電|枯竭|頭昏|喘不過氣|快倒|精力|體力不支|身心俱疲|昏倒|忙翻|忙爆|操勞|burned out|tired|exhausted|exhaustion|drained|no energy|worn out|so done/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'mood_sad',
    test: (text) => /難過|低落|失望|想哭|沉沉|好悶|心重|心塞|眼淚|快哭|不開心|鬱悶|沮喪|灰暗|沉重|情緒低潮|泛淚|想流淚|心裡難受|sad|down|blue|heartbroken|crying/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'mood_angry',
    test: (text) => /生氣|煩|火大|不爽|氣死|抓狂|暴躁|極度不快|氣炸|超火|火冒三丈|超煩|快爆發|很惱火|想發飆|angry|mad|annoyed|furious|frustrated/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'mood_lonely',
    test: (text) => /孤單|寂寞|一個人|沒人理解|身邊沒人|空虛|好冷清|孤零零|想找人講話|獨自一人|沒有其他人|覺得孤單|孤身|lonely|alone|isolated|by myself/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'mood_celebration',
    test: (text) => /開心|成功|完成|太好了|好消息|過關|拿到了|得獎|賀|順利|值得慶祝|升官|錄取|解鎖|考過|嗨起來|拿到獎學金|拿到了獎學金|拿獎|開心死了|超高興|happy|good news|finished|celebrate|passed|won|accomplished/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'mood_confused',
    test: (text) => /不知道怎麼辦|混亂|卡住|迷惘|迷茫|找不到方向|不知所措|昏頭|沒有頭緒|好茫然|手足無措|一頭霧水|confused|lost|stuck|uncertain|don't know what to do/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'daily_sleep',
    test: (text) => /睡不著|失眠|想睡|睡覺|睡前|熬夜|睏|眼皮重|作夢|躺平|閉上眼|睡一覺|sleep|insomnia|sleepy|bedtime|staying up/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'apology',
    test: (text) => /對不起|抱歉|不好意思|我不小心|口氣太重|太衝|態度不好|原諒我|感到抱歉|對不住|衝動了|sorry|apologize|my bad/i.test(text),
    weight: 1.3,
  },
  {
    intent: 'thanks',
    test: (text) => /謝謝|謝啦|感謝|幸好有你|太謝謝你|感念|多虧有你|萬分感謝|thanks|thank you|appreciate/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'small_talk_weather',
    test: (text) => /天氣|下雨|風好大|好熱|好冷|氣溫|變冷|出太陽|weather|rain|windy|hot|cold/i.test(text),
    weight: 1.0,
  },
  {
    intent: 'basic_question',
    test: (text) => /嗎|什麼|怎麼|為什麼|可以嗎|what|how|why|\?|？/i.test(text),
    weight: 0.8,
  },
  {
    intent: 'player_feedback',
    test: (text) => /太像模板|短一點|不要一直問|我喜歡你這樣回|你可以記得|說話太機械|講話太像機器人/u.test(text),
    weight: 1.2,
  },
];

export function analyzeInput(inputText = '') {
  const text = String(inputText || '').trim();

  // Calculate weighted intent matches to select primary intent by semantic weight
  const matchedRules = INTENT_RULES.filter((rule) => rule.test(text));
  const sortedIntents = matchedRules
    .sort((a, b) => b.weight - a.weight)
    .map((rule) => rule.intent);

  const emojiOnly = Boolean(text) && /^[\p{Emoji_Presentation}\p{Emoji}\s]+$/u.test(text) && !/[\p{Letter}\p{Number}]/u.test(text);

  return {
    empty: text.length === 0,
    length: text.length,
    emojiOnly,
    intents: sortedIntents,
    primaryIntent: emojiOnly ? 'emoji_only' : sortedIntents[0] || 'open_message',
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
