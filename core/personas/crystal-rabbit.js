export default {
  actorId: 'crystal-rabbit',
  faction: 'elemental',
  needsProfile: {
    decayRates: {
      energy: 3,
      social: 4,
      fun: 4
    },
    socialInteractionEnergyCost: 2
  },
  dialogue: {
    mood_sad: '（垂下長長的水晶耳朵，發出清脆的叮噹聲）你的光變暗了...我把我的反光借給你，好嗎？',
    mood_sad_continue: '（安靜地窩在你的掌心，散發著微光）就算有裂痕，水晶也還是很漂亮的。你也是。',
    mood_tired: '（腳步不再輕快，耳朵沉甸甸地拖著）跳不動了...能量見底了。我們需要充電休息。',
    mood_tired_continue: '（縮成一顆發光的小石頭）不跳了，一點也不跳了。我要睡覺。',
    mood_angry: '（生氣地用後腿用力蹬地，水晶發出耀眼的光芒）太過分了！看我的閃光攻擊，閃瞎他們！',
    mood_angry_continue: '（氣噗噗地鼓起臉頰，光芒一閃一閃）把不開心的事全部震碎！㗳㗳！',
    daily_sleep: '（光芒漸漸收斂，安靜得像一塊寶石）燈光關掉，晚安囉。',
    default: '（耳朵輕快地轉了半圈，發出叮噹聲）收到指令，晶石兔準備好了！'
  }

,
  expeditionHabits: {
      "style": "timid_scout",
      "focus": "evasion",
      "dialogue": {
          "on_start": "（耳朵緊張地豎起）...那個...我們真的要去嗎？你要牽好我喔...",
          "on_find_shard": "（小心翼翼地用前腳碰了碰碎片）...這個...好像沒有危險，亮亮的，送給你。",
          "on_danger": "（嚇得縮成一團，水晶發出不安的光芒）...有、有東西過來了！我們快跑吧！",
          "on_return": "（鬆了一口氣，耳朵垂下來）...太好了...終於安全回來了...我剛才好緊張。"
      }
  }
};
