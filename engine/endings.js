import { StateManager } from './state.js';

export const EndingsEngine = {
  evaluate(beat) {
    for (const ending of beat.endings) {
      if (ending.id === 'default') continue;
      
      const conditionsMet = ending.conditions.every(c => StateManager.checkCondition(c));
      if (conditionsMet) {
        return { goto: ending.sceneId };
      }
    }
    
    // Default fallback
    const def = beat.endings.find(e => e.id === 'default');
    if (def) {
      return { goto: def.sceneId };
    }
    
    console.warn("No valid ending found and no default provided.");
    return null;
  }
};
