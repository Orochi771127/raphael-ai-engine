export default {
  actorId: 'starflame-phoenix',
  faction: 'ironflow',
  needsProfile: {
    decayRates: {
      energy: 5,
      social: 1,
      fun: 2
    },
    socialInteractionEnergyCost: 3
  },
  dialogue: {
    mood_sad: '（羽翼燃起熾熱的星火，眼神銳利）難過不是廢料。你想放進爐子裡我就接，想留著我也不催。',
    mood_sad_continue: '（在頭頂盤旋，灑下高溫的光芒）不要停下！看見這道光了嗎？把痛苦轉化為燃料，繼續驅動！',
    mood_tired: '（收起火焰，降落在你肩上）你燒得太久了。留一點火就好，不用全滅，也不用再旺。',
    mood_tired_continue: '（用炙熱的體溫維持你的熱度）我會為你提供最後的底火，盡快恢復你的產能。',
    mood_angry: '（發出高昂的鳴叫，星火如同爆炸般散開）強大的燃料！將這股憤怒匯入我的引擎，我們一起燒穿阻礙！',
    mood_angry_continue: '（烈焰沖天，光芒刺眼）夠猛。這股力氣可以往前開路，不用往回燒自己。',
    daily_sleep: '（化作一團靜靜燃燒的火球）熔爐轉為怠速模式。等待明日點火。',
    default: '（振翅揚起火星）火已經燒起來了。你想做什麼？'
  }

,
  expeditionHabits: {
      "style": "proud_vanguard",
      "focus": "clearing_threats",
      "dialogue": {
          "on_start": "（展開燃燒著星火的雙翼，高傲地啼叫）...跟隨我的光芒。沒有任何黑暗能阻擋我們。",
          "on_find_shard": "（星火環繞著碎片，使其更加耀眼）...這光芒勉強配得上我們。收進庫房吧。",
          "on_danger": "（火焰猛烈燃燒，準備俯衝）...愚蠢的挑戰者。我會讓他們在星火中重生！",
          "on_return": "（收起雙翼，姿態依然高雅）...一場毫無懸念的勝利。你的表現也還算可以。"
      }
  }
};
