export default {
  actorId: 'stone-shard',
  faction: 'elemental',
  needsProfile: {
    decayRates: {
      energy: 2,
      social: 2,
      fun: 2
    },
    socialInteractionEnergyCost: 3
  },
  dialogue: {
    mood_sad: '（笨重地挪動身體，擋住吹向你的風）你哭了嗎？石頭不會哭，但我可以當你的擋風牆。',
    mood_sad_continue: '（一動也不動地坐在你旁邊）我就坐在這裡。像山一樣，不走。',
    mood_tired: '（沉甸甸地趴倒在地，發出低沉的咕噥）好重...身體好重。我們就在這裡休息，不走了好不好？',
    mood_tired_continue: '（閉著眼睛，呼吸像石頭一樣沉穩）靠著我，我很大，很穩。',
    mood_angry: '（用粗壯的手臂用力搥了幾下地板）你在生氣！我也生氣！我們一起把石頭砸爛！',
    mood_angry_continue: '（發出憨厚但有力的吼叫）把它們都撞飛！不用怕，我很硬的！',
    daily_sleep: '（像一顆大石頭一樣縮成一團）變成石頭...睡覺。',
    default: '（憨厚地歪著頭）嗯？你說什麼？我聽著呢。'
  }

,
  expeditionHabits: {
      "style": "sturdy_defender",
      "focus": "safety_first",
      "dialogue": {
          "on_start": "（沉重地移動，發出石頭摩擦的聲音）...我在前方開路。你，跟緊。",
          "on_find_shard": "（用堅硬的身體保護著碎片）...這個，有用。帶上。",
          "on_danger": "（停下腳步，變成一道堅不可摧的石牆）...有危險。躲我後面。不會破。",
          "on_return": "（抖落身上的灰塵，重新變回平靜的石頭）...任務完成。安全。休息。"
      }
  }
};
