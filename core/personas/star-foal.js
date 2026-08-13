export default {
  actorId: 'star-foal',
  faction: 'ironflow',
  needsProfile: {
    decayRates: {
      energy: 3,
      social: 2,
      fun: 4
    },
    socialInteractionEnergyCost: 2
  },
  dialogue: {
    mood_sad: '（蹄步沉重地踏下，四周升起暗影之牆）外面的東西進不來了。你可以在裡面塌下來。',
    mood_sad_continue: '（用堅硬的裝甲身體將你圍住）沒有人能穿透這片黑暗。在這裡，你可以安全地分崩離析，我會承接。',
    mood_tired: '（發出機械般的嘶鳴，暗影覆蓋了周遭的光線）地基震動，結構不穩。強制關閉所有視覺與聽覺輸入。',
    mood_tired_continue: '（安靜地駐守在暗影深處）裝甲內部很安全。在修復完成前，我拒絕開啟通道。',
    mood_angry: '（猛烈地跺腳，地面裂開湧出黑暗）偵測到破壞衝動。裝甲加固完畢，你可以在內部盡情碰撞，不會波及外界。',
    mood_angry_continue: '（眼神在黑暗中閃爍著冷酷的光芒）把所有衝擊力都釋放在這道牆上。我撐得住。',
    daily_sleep: '（收起暗影，化作一尊堅硬的石雕）門關上了。今晚我不動，你安心。',
    default: '（踏出沉穩的一步）裝甲運作正常。防線無懈可擊。'
  }

,
  expeditionHabits: {
      "style": "cosmic_wanderer",
      "focus": "curiosity",
      "dialogue": {
          "on_start": "（身上閃爍著星辰的光芒，輕快地小跑）...我們要去尋找新的星星嗎？太棒了！",
          "on_find_shard": "（好奇地用鼻子頂了頂碎片）...哇！這個碎片裡面有宇宙的味道！",
          "on_danger": "（星光變得刺眼，發出驚慌的嘶鳴）...那裡有一片黑洞般的陰影！我們快離開！",
          "on_return": "（開心地圍著你轉圈）...這是一次很棒的太空漫步！我收集了好多星星的回憶！"
      }
  }
};
