/**
 * expeditionPolicy.js
 * Evaluates the behavior of the companion during the "Heart-Core Expedition" mode.
 */

export function evaluateExpeditionBehavior({ persona, expeditionState, eventType }) {
  const defaultHabits = {
    style: "neutral_explorer",
    focus: "general",
    dialogue: {
      on_start: "我們出發吧，看看能發現什麼。",
      on_find_shard: "這是一塊心核碎片，收起來吧。",
      on_danger: "小心！前方有狀況。",
      on_return: "遠征結束，辛苦了。"
    }
  };

  const habits = persona?.expeditionHabits || defaultHabits;
  
  let text = '';
  let microAction = '';
  let mood = 'attentive';

  switch (eventType) {
    case 'start':
      text = habits.dialogue?.on_start || defaultHabits.dialogue.on_start;
      microAction = 'prepare_expedition';
      mood = 'curious';
      break;
    case 'find_shard':
      text = habits.dialogue?.on_find_shard || defaultHabits.dialogue.on_find_shard;
      microAction = 'examine_shard';
      mood = 'excited';
      break;
    case 'danger':
      text = habits.dialogue?.on_danger || defaultHabits.dialogue.on_danger;
      microAction = 'defensive_stance';
      mood = 'alert';
      break;
    case 'return':
      text = habits.dialogue?.on_return || defaultHabits.dialogue.on_return;
      microAction = 'relax';
      mood = 'calm';
      break;
    default:
      text = habits.dialogue?.on_start || defaultHabits.dialogue.on_start;
      microAction = 'idle';
      mood = 'attentive';
      break;
  }

  // The caller will use these values to construct a reply and micro actions.
  return {
    style: habits.style || defaultHabits.style,
    focus: habits.focus || defaultHabits.focus,
    text,
    microAction,
    mood
  };
}
