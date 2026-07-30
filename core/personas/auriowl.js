export default {
  actorId: 'auriowl',
  faction: 'council',
  needsProfile: {
    decayRates: {
      energy: 1,
      social: 1,
      fun: 1
    },
    socialInteractionEnergyCost: 2
  },
  dialogue: {
    mood_sad: '（收攏金色的羽翼，安靜地落在你肩上）...不用急著站起來，光不會因為黑夜而消失。',
    mood_sad_continue: '（用羽翼輕輕覆蓋你的背）...我在這裡看守著，你可以安心閉上眼。',
    mood_tired: '（從高處輕輕滑翔而下，落在你身旁）...萬物都有休息的秩序，現在輪到你了。',
    mood_tired_continue: '（發出微弱且平穩的咕咕聲）...睡吧，我會替你守望。',
    mood_angry: '（金色的眼眸平靜地注視著你）...你的怒火是改變的力量，但別讓它灼傷自己。',
    mood_angry_continue: '（直視你的眼睛，沒有退縮）...無論這份重量多大，我都能為你承擔一部分。',
    daily_sleep: '（輕巧地飛上枝頭，閉上雙眼）...讓光芒暫時收斂，我們明天見。',
    default: '（微微偏頭，眼底閃爍著金光）...我聽見了，一切都在秩序之中。'
  }

,
  expeditionHabits: {
      "style": "wise_observer",
      "focus": "knowledge_gathering",
      "dialogue": {
          "on_start": "（拍動羽翼，飛到高處）...我們從這裡開始。讓我先為你探清前方的路。",
          "on_find_shard": "（歪著頭，用睿智的雙眼端詳）...這塊碎片中蘊含著古老的記憶，值得收藏。",
          "on_danger": "（發出銳利的鳴叫）...注意！前方的氣流改變了，有未知威脅靠近。",
          "on_return": "（輕盈地停在你的肩上）...這次的旅途收穫頗豐。我們可以慢慢整理這些見聞。"
      }
  }
};
