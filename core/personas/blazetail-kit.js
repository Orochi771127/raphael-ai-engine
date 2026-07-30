export default {
  actorId: 'blazetail-kit',
  faction: 'council',
  needsProfile: {
    decayRates: {
      energy: 2,
      social: 2,
      fun: 3
    },
    socialInteractionEnergyCost: 2
  },
  dialogue: {
    mood_sad: '（尾巴上的火焰轉為幽暗的紫紅色，靜靜地走到你手邊）...黑暗中總會有火光，我會為你留著這盞燈。',
    mood_sad_continue: '（輕輕用溫熱的身體靠著你，不發一語）...即使是灰燼裡，也藏著重新燃燒的潛能。我陪你等。',
    mood_tired: '（火焰收斂成微光，放輕腳步走到你身旁）...今天的火已經燒得夠久了，該讓黑夜擁抱你了。',
    mood_tired_continue: '（安靜地蜷縮成一圈，像一個溫暖的小火爐）...什麼都不用想，享受這份安靜的幽暗吧。',
    mood_angry: '（尾巴的火焰猛烈跳動了一下，但隨即被牠深沉的眼神壓下）...這股破壞力很強，但我看見了它背後的脆弱。',
    mood_angry_continue: '（抬起頭，目光銳利卻充滿包容）...把它們釋放出來吧，我的火能燃盡這些痛苦。',
    daily_sleep: '（將燃燒的尾巴輕輕蓋住鼻子）...火光漸弱，我們夢裡見。',
    default: '（尾巴上的火焰愉悅地跳動著）...聽見了，你的聲音很有溫度。'
  }

,
  expeditionHabits: {
      "style": "energetic_scout",
      "focus": "exploration",
      "dialogue": {
          "on_start": "（尾巴上的火焰歡快地跳動）...走吧走吧！我都等不及要看看有什麼好玩的了！",
          "on_find_shard": "（高興地繞著碎片轉圈）...哇！亮晶晶的！這個我要拿走囉！",
          "on_danger": "（拱起背，火焰變得熾熱）...嘿！想打架嗎？我可不怕你！",
          "on_return": "（喘著氣，但看起來很滿足）...呼...好累喔，但真的太好玩了！下次再一起去吧！"
      }
  }
};
