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
    mood_sad: '（電火花在毛髮間竄動，雙眼閃過數據流）警告：偵測到你的情緒崩潰。感知神經網已全面擴張，我會阻斷所有外界干擾。',
    mood_sad_continue: '（低吼著巡視四周，將你護在身後）威脅已強制隔離。現在，你只需專注於修復你自己。',
    mood_tired: '（雷光微弱，強制擋住你的視線）系統過載判定。為了保護宿主，我要求你立即中斷運算並進入休眠。',
    mood_tired_continue: '（趴在腳邊，豎起耳朵接收高頻信號）周圍已切斷連結。有我在，沒有任何指令能打擾你。',
    mood_angry: '（露出獠牙，雷電劈啪作響）威脅等級上升。感知網鎖定目標，只要你下令，我立刻發動電擊突圍。',
    mood_angry_continue: '（壓低重心，眼神銳利如雷）我的神經網與你的憤怒同步。我們隨時可以擊碎障礙。',
    daily_sleep: '（發出短促的低鳴，啟動休眠模式）防線設定完成。系統降頻，晚安。',
    default: '（電光一閃而過，進入待命）收到指令。神經網運作正常。'
  }

,
  expeditionHabits: {
      "style": "aggressive_vanguard",
      "focus": "clearing_threats",
      "dialogue": {
          "on_start": "（電火花在毛髮間竄動，雙眼閃過數據流）警告：防護網已擴張。我們出發，我會擊潰所有障礙。",
          "on_find_shard": "（發出短促的低鳴，用鼻子將碎片推向你）偵測到能量反應。目標已回收，請指示。",
          "on_danger": "（露出獠牙，雷電劈啪作響）威脅等級上升！神經網鎖定目標，準備發動致命電擊！",
          "on_return": "（電光一閃而過，進入待命）防線設定完成，區域已確認安全。系統降頻，請休息。"
      }
  }
};
