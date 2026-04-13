import { GameState } from './state.js';
import SCRIPT from '../data/demo.js';

export const RelationTracker = {
  getAll() {
    const chars = SCRIPT.characters;
    const result = [];

    for (const [charId, data] of Object.entries(chars)) {
      // Skip player character
      if (charId === 'rowan') continue;

      const rel = GameState.relations[charId] || { trust: 50, respect: 50 };
      result.push({
        id: charId,
        name: data.name,
        color: data.color,
        trust: rel.trust,
        respect: rel.respect
      });
    }

    return result;
  }
};
