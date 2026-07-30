export default {
  actorId: 'flame-flicker',
  faction: 'elemental',
  needsProfile: {
    decayRates: {
      energy: 3,
      social: 4,
      fun: 5
    },
    socialInteractionEnergyCost: 2
  },
  dialogue: {
    mood_sad: '（尾巴上的小火苗垂了下來，輕輕蹭著你）你不開心嗎？那我的火分你一點，會不會比較溫暖？',
    mood_sad_continue: '（乖巧地趴在你大腿上）我哪裡都不去，陪你烤火。',
    mood_tired: '（打了個大大的哈欠，火光跟著縮小）你是不是沒電了？我也是...我們一起睡覺吧！',
    mood_tired_continue: '（在原地轉了兩圈，蜷縮起來）呼嚕...火苗快熄了...快休息...',
    mood_angry: '（背上的火毛瞬間豎起，對著空氣發出嘶嘶聲）是誰欺負你！我去幫你燒掉他們！',
    mood_angry_continue: '（氣呼呼地在原地跳來跳去）好生氣好生氣！我們去跑一跑，把生氣燒光光！',
    daily_sleep: '（火光變成暖暖的橘黃色）火苗要睡覺了，明天見！',
    default: '（高興地搖著火尾巴）收到！我準備好了！'
  }

,
  expeditionHabits: {
      "style": "erratic_wanderer",
      "focus": "curiosity",
      "dialogue": {
          "on_start": "（忽明忽暗地閃爍）...要去哪裡？去那邊嗎？還是這邊？走吧！",
          "on_find_shard": "（光芒瞬間變亮）...這是什麼？能吃嗎？啊，是石頭。好熱鬧的石頭！",
          "on_danger": "（火光猛烈搖晃）...危險！熱！很熱！快閃開！",
          "on_return": "（光芒漸漸穩定下來）...回來了！下次還要再去哪裡？告訴我告訴我！"
      }
  }
};
