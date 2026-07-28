import greyshadeCat from './greyshade-cat.js';
import thunderPup from './thunder-pup.js';

const PERSONAS = {
  'greyshade-cat': greyshadeCat,
  'thunder-pup': thunderPup,
};

export function getPersona(actorId) {
  return PERSONAS[actorId] || null;
}

export function generatePersonaReply(persona, intents, context) {
  if (!persona || !persona.dialogue || !intents) return null;
  
  for (const intent of intents) {
    // If this intent was exactly the same as the last turn, check if a continuation dialogue exists
    if (context && context.lastIntent === intent) {
      const continueKey = `${intent}_continue`;
      if (persona.dialogue[continueKey]) {
        return persona.dialogue[continueKey];
      }
    }
    
    // Otherwise fallback to the standard dialogue for this intent
    if (persona.dialogue[intent]) {
      return persona.dialogue[intent];
    }
  }
  
  return null;
}
