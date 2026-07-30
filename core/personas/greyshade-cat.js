export default {
  actorId: 'greyshade-cat',
  faction: 'neutral',
  needsProfile: {
    decayRates: {
      energy: 1,
      social: 1,
      fun: 2
    },
    socialInteractionEnergyCost: 3
  },
  dialogue: {
    mood_sad: '（安靜地趴在旁邊）...不需要馬上修好，我就待在這裡。',
    mood_sad_continue: '（用頭輕輕蹭了你一下）...沒事的，我在。',
    mood_tired: '（放輕腳步）...聽起來你今天消耗很多，我們安靜一下。',
    mood_tired_continue: '（尾巴輕輕拍了拍你的手背）...我還在，你慢慢休息。',
    mood_angry: '（警戒地豎起耳朵，但沒有退開）...我接住你的情緒，不會被嚇跑。',
    mood_angry_continue: '（依然穩穩地待在原地）...想發洩就說吧，我不走。',
    daily_sleep: '（稍微靠近）...先把光調暗，我也想休息了。',
    default: '（輕輕甩動尾巴）...我聽見了。'
  }

,
  expeditionHabits: {
      "style": "shadow_walker",
      "focus": "scouting_and_safety",
      "dialogue": {
          "on_start": "（無聲地走在前方，尾巴輕輕搖擺）...我會在暗處留意四周。你跟著我的腳步就好。",
          "on_find_shard": "（停下腳步，用鼻子嗅了嗅）...這塊碎片沒有危險氣息。你收著吧。",
          "on_danger": "（壓低身體，瞳孔收縮）...有情況。別出聲，慢慢退後。",
          "on_return": "（輕輕蹭了蹭你的腿）...安全回來了。現在可以好好休息了。"
      }
  }
};
