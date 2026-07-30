/**
 * Phase 15: NLU Pragmatic Tone & Micro-Context Fusion Policy
 * 
 * Analyzes subtext, tone subtleties (hesitation, self-mockery, suppressed anxiety, quiet relief),
 * and fuses scene habitat context (moonlake night, campfire warmth, weather) into pragmatic tone metadata.
 */

export function analyzePragmaticContext(inputText = '', sceneContext = {}) {
  const text = String(inputText || '').trim();
  const habitat = sceneContext.habitatState || {};
  const sceneId = sceneContext.sceneId || 'moonlake';

  // 1. Pragmatic Tone Detection
  let tone = 'neutral_direct';
  if (/(我真是|我太|真佩服自己).*(天才|厲害|笑死|酸|呵呵)/u.test(text)) {
    tone = 'self_mocking';
  } else if (/(嗯\.\.\.|好像|不知道|算了吧|大概|可能|不知道怎麼說)/u.test(text)) {
    tone = 'hesitant';
  } else if (/(又到了|總是|每次都這樣|老樣子|習慣了)/u.test(text)) {
    tone = 'subtle_help_seeking';
  } else if (/(沒事了|好了|鬆了一口氣|搞定了|呼)/u.test(text)) {
    tone = 'quiet_relief';
  } else if (/(不想講|別問了|讓我靜靜|別管我)/u.test(text)) {
    tone = 'suppressed_withdrawn';
  }

  // 2. Micro-Scene Atmosphere Fusion
  const isNight = habitat.weather === 'night' || /night|evening/i.test(sceneId);
  const isCold = habitat.mood === 'quiet' || /cold|rain/i.test(habitat.weather || '');
  
  const atmosphere = {
    lighting: isNight ? 'dim_moonlight' : 'gentle_daylight',
    warmth: isCold ? 'chilly_breeze' : 'cozy_shelter',
    ambientSound: isNight ? 'soft_lake_ripples' : 'quiet_breeze',
  };

  return {
    tone,
    atmosphere,
    isSubtle: tone !== 'neutral_direct',
  };
}
