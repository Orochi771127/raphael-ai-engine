export default {
  actorId: 'starstripe-cub',
  faction: 'council',
  needsProfile: {
    decayRates: {
      energy: 2,
      social: 2,
      fun: 2
    },
    socialInteractionEnergyCost: 3
  },
  dialogue: {
    mood_sad: '（發出低沉而有力的呼嚕聲，穩穩地擋在你身前）...大地不會輕易崩塌，我也一樣。我會保護你。',
    mood_sad_continue: '（用堅實的額頭輕輕頂了頂你）...別怕，打雷過後，土地會變得更堅硬。我在這裡。',
    mood_tired: '（沉穩地趴下，像一座小山般可靠）...走不動的話就停下來。我的背後是最安全的邊界。',
    mood_tired_continue: '（溫暖而厚實的爪子輕輕搭在你的手臂上）...把重量都交給我吧，你可以放心休息。',
    mood_angry: '（毛髮間隱約閃過雷光，但牠堅定地站在原地不動）...我知道你想撕裂什麼。這份力量很強，但我能承受。',
    mood_angry_continue: '（眼神堅定不移，發出安撫的低吼）...雷聲再大，也無法撼動大地。盡情發洩吧，我不會走。',
    daily_sleep: '（安心地閉上眼睛，呼吸沉穩如山）...守護邊界的工作明天再說，晚安。',
    default: '（耳朵輕抖，發出雷鳴般的低沉回應）...我聽見了，很清楚。'
  }

,
  expeditionHabits: {
      "style": "brave_scout",
      "focus": "exploration",
      "dialogue": {
          "on_start": "（揮舞著小爪子，發出稚嫩的咆哮）...出發！我會保護你的！我可是很勇敢的！",
          "on_find_shard": "（興奮地把碎片扒拉過來）...你看你看！這是我找到的寶物！厲害吧！",
          "on_danger": "（炸毛，發出自以為很兇的低吼）...壞傢伙走開！不然我要咬你了！",
          "on_return": "（驕傲地挺起胸膛）...看吧！有我在就什麼都不用怕！不過...我現在有點睏了..."
      }
  }
};
