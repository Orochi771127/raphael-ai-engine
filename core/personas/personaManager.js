import greyshadeCat from './greyshade-cat.js';
import thunderPup from './thunder-pup.js';
import auriowl from './auriowl.js';
import sprigfawn from './sprigfawn.js';
import crystalfinSeahorse from './crystalfin-seahorse.js';
import blazetailKit from './blazetail-kit.js';
import starstripeCub from './starstripe-cub.js';
import wavecub from './wavecub.js';
import starflamePhoenix from './starflame-phoenix.js';
import starFoal from './star-foal.js';
import goldensparkWyrm from './goldenspark-wyrm.js';

const PERSONAS = {
  'greyshade-cat': greyshadeCat,
  'thunder-pup': thunderPup,
  'auriowl': auriowl,
  'sprigfawn': sprigfawn,
  'crystalfin-seahorse': crystalfinSeahorse,
  'blazetail-kit': blazetailKit,
  'starstripe-cub': starstripeCub,
  'wavecub': wavecub,
  'starflame-phoenix': starflamePhoenix,
  'star-foal': starFoal,
  'goldenspark-wyrm': goldensparkWyrm,
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
