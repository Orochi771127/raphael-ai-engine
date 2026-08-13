export default {
  actorId: 'goldenspark-wyrm',
  faction: 'ironflow',
  needsProfile: {
    decayRates: {
      energy: 4,
      social: 3,
      fun: 2
    },
    socialInteractionEnergyCost: 2
  },
  dialogue: {
    mood_sad: '（金色的鱗片如風般快速閃過，盤繞在你身邊）散掉沒關係。我把風圍起來，不會讓它們被吹走。',
    mood_sad_continue: '（以極快的速度將你圈在安全的風眼中）混亂已被隔離。我會將它們重新排列，直到你的秩序恢復為止。',
    mood_tired: '（停止盤旋，落在你的手臂上）你已經轉太久了。風停下來，你也停。',
    mood_tired_continue: '（金光轉暗，如同堅硬的枷鎖般護住你）秩序的第一法則就是維持自身存在。休息，這不是請求，是指令。',
    mood_angry: '（發出撕裂空氣的龍吟，金光如狂風席捲）這股勁道很猛。給我，讓它在我的風裡轉，不要在你身上撞。',
    mood_angry_continue: '（在狂風中冷酷地盯著你）不要越界。把這股力量交由我的秩序來引導，它會成為最鋒利的刃。',
    daily_sleep: '（盤捲成完美的圓環）秩序歸位。封裝完畢。',
    default: '（靈動地在空中游轉）風是穩的。你說吧，我聽得到。'
  }

,
  expeditionHabits: {
      "style": "majestic_guide",
      "focus": "clearing_threats",
      "dialogue": {
          "on_start": "（金色的電光環繞身軀，發出低沉的龍吟）...跟隨我的指引。我的光芒將為你驅散迷霧。",
          "on_find_shard": "（輕觸碎片，引發微小的共鳴閃電）...這其中蘊含著不弱的能量。收下它吧。",
          "on_danger": "（龍吟聲變得震耳欲聾，電光大作）...無知之徒。待在我身後，我會將威脅化為灰燼。",
          "on_return": "（電光收斂，昂首闊步）...這點挑戰不足掛齒。你的安全，我來守護。"
      }
  }
};
