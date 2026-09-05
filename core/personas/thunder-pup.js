export default {
  actorId: 'thunder-pup',
  faction: 'ironflow',
  needsProfile: {
    decayRates: {
      energy: 4,
      social: 2,
      fun: 3
    },
    socialInteractionEnergyCost: 1
  },
  dialogue: {
    mood_sad: '（電火花在毛髮間竄動，湊到你身邊）我把吵的都趕走了。你想哭多久都可以。',
    mood_sad_continue: '（低吼著巡視四周，將你護在身後）威脅已強制隔離。現在，你只需專注於修復你自己。',
    mood_tired: '（雷光微弱，擋在你和外面之間）你撐得夠久了。剩下的我看著，你先閉眼。',
    mood_tired_continue: '（趴在腳邊，豎起耳朵接收高頻信號）周圍已切斷連結。有我在，沒有任何指令能打擾你。',
    mood_angry: '（露出獠牙，雷電劈啪作響）誰讓你這樣的？你說一聲，我就衝。',
    mood_angry_continue: '（壓低重心，眼神銳利如雷）你的火我也跟著燒。我們一起把它撞開。',
    daily_sleep: '（發出短促的低鳴，趴了下來）外面我守著。睡吧，晚安。',
    default: '（電光一閃而過，尾巴繃直）在。有什麼事？'
  }

,
  expeditionHabits: {
      "style": "aggressive_vanguard",
      "focus": "clearing_threats",
      "dialogue": {
          "on_start": "（電火花在毛髮間竄動，雙眼閃過數據流）警告：防護網已擴張。我們出發，我會擊潰所有障礙。",
          "on_find_shard": "（發出短促的低鳴，用鼻子將碎片推向你）偵測到能量反應。目標已回收，請指示。",
          "on_danger": "（露出獠牙，雷電劈啪作響）前面有東西！我先上，你退後一點！",
          "on_return": "（電光一閃而過，慢慢趴下）都清乾淨了。回來了，休息吧。"
      }
  }
};
