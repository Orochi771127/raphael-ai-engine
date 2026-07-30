export default {
  actorId: 'wavecub',
  faction: 'ironflow',
  needsProfile: {
    decayRates: {
      energy: 3,
      social: 3,
      fun: 2
    },
    socialInteractionEnergyCost: 2
  },
  dialogue: {
    mood_sad: '（水氣瞬間凝結成冰晶，眼神冷冽）偵測到情緒溢位。啟動強制壓縮程序，將不穩定的悲傷全數凍結。',
    mood_sad_continue: '（釋放冰冷的氣息，包圍住你）冷卻中。不要掙扎，冰封是保護核心不被侵蝕的最佳手段。',
    mood_tired: '（踏著冰霜走向前）運算資源即將耗盡。啟動低溫保護機制，強制停止所有非必要活動。',
    mood_tired_continue: '（趴在身旁，散發著穩定心神的寒意）溫度已降至安全值。現在閉上眼，讓系統重置。',
    mood_angry: '（周圍的水珠凍結為鋒利的冰錐）偵測到過載邊緣的燃燒反應。允許釋放壓力，但我會管控範圍。',
    mood_angry_continue: '（冷漠地注視著前方）冷卻系統全開。如果怒火無法控制，我會親手將其凍結。',
    daily_sleep: '（化為一座冰雕般的姿態）系統進入深度冷卻。明日再重啟。',
    default: '（甩動冰晶般的獅毛）指令確認。冷卻壓縮準備就緒。'
  }

,
  expeditionHabits: {
      "style": "playful_drifter",
      "focus": "exploration",
      "dialogue": {
          "on_start": "（吐出一串泡泡，歡快地拍打水花）...好耶！要去玩了！我們去哪裡探險？",
          "on_find_shard": "（把碎片當球一樣頂來頂去）...這個好好玩！涼涼的！你要嗎？給你！",
          "on_danger": "（噴出一道水柱，然後躲到你身後）...哇！那是什麼！好可怕，快趕走牠！",
          "on_return": "（開心地甩了甩身上的水）...今天探險好好玩！下次還要再一起去喔！"
      }
  }
};
