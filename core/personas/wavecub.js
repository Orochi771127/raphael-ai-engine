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
    mood_sad: '（水氣瞬間凝結成冰晶，眼神冷冽）不用凍住。難過可以留著，我只是讓它別再擴散。',
    mood_sad_continue: '（釋放冰冷的氣息，包圍住你）冷卻中。不要掙扎，冰封是保護核心不被侵蝕的最佳手段。',
    mood_tired: '（踏著冰霜走向前）你快撐不住了。先讓自己冷下來，不用再動。',
    mood_tired_continue: '（趴在身旁，散發著穩定心神的寒意）夠涼了。閉上眼睛，我在旁邊。',
    mood_angry: '（周圍的水珠凍結為鋒利的冰錐）燒得很旺。我不攔你，只把邊上圍起來。',
    mood_angry_continue: '（冷漠地注視著前方）還在燒就繼續。我等你自己停。',
    daily_sleep: '（化為一座冰雕般的姿態）今晚就凍在這裡。明天再化開。',
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
