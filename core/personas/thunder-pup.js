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
    mood_sad: '（立刻豎起耳朵）偵測到低落狀態。我會啟動防護，直到你恢復為止。',
    mood_sad_continue: '（趴在你的腳邊警戒）防護持續運作中，你很安全，繼續調整自己吧。',
    mood_tired: '（擋在你前方）偵測到高壓疲勞。我會隔絕外部干擾，請立刻進入休眠狀態。',
    mood_tired_continue: '（確認周圍環境後回頭看你）干擾已排除，請專注於恢復你的能量。',
    mood_angry: '（壓低身體）你的壓力正在飆高。我會跟著你調整防線，需要時我們隨時反擊。',
    mood_angry_continue: '（低聲發出共鳴）防線已升級，我們準備好面對任何威脅了。',
    daily_sleep: '（巡邏一圈後趴下）警戒線已建立，你可以安全進入休眠。',
    default: '（精神抖擻地待命）防護網正常，隨時準備應對狀況。'
  }
};
