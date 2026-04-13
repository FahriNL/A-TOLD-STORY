export const GameState = {
  episode: 1,
  scene: null,
  flags: {},
  relations: {},   // { charId: { trust: 50, respect: 50 } }
  memory: [],      // [{ text, icon, episode, scene }]
  choices: {},     // { choiceId: optionIndex }
  choiceLog: [],   // list of strings for episode review
  inventory: [],   // list of item strings/objects
  difficulty: 'normal',
  playtime: 0      // In seconds
};

export const StateManager = {
  setFlag(k, v) { 
    GameState.flags[k] = v; 
  },
  
  getFlag(k, fallback = false) { 
    return GameState.flags[k] ?? fallback; 
  },

  modifyRelation(charId, stat, delta) {
    if (!GameState.relations[charId]) {
      GameState.relations[charId] = { trust: 50, respect: 50 };
    }
    const r = GameState.relations[charId];
    r[stat] = Math.max(0, Math.min(100, (r[stat] ?? 50) + delta));
  },

  addMemory(text, icon = '•') {
    GameState.memory.push({ 
      text, 
      icon, 
      episode: GameState.episode, 
      scene: GameState.scene 
    });
  },

  logChoice(text) {
    if(text) GameState.choiceLog.push(text);
  },

  hasItem(itemKey) {
    return GameState.inventory.includes(itemKey);
  },

  addItem(itemKey) {
    if (!this.hasItem(itemKey)) GameState.inventory.push(itemKey);
  },

  removeItem(itemKey) {
    GameState.inventory = GameState.inventory.filter(i => i !== itemKey);
  },

  checkCondition(cond) {
    if (!cond) return true;
    
    // Flag check
    if (cond.flag !== undefined) {
      return this.getFlag(cond.flag) === cond.is;
    }
    
    // Relation check
    if (cond.relation) {
      const val = GameState.relations[cond.relation]?.[cond.stat] ?? 50;
      const strVal = String(cond.value);
      
      if (strVal.startsWith('>=')) return val >= parseInt(strVal.slice(2));
      if (strVal.startsWith('<=')) return val <= parseInt(strVal.slice(2));
      if (strVal.startsWith('>'))  return val >  parseInt(strVal.slice(1));
      if (strVal.startsWith('<'))  return val <  parseInt(strVal.slice(1));
      
      return val === parseInt(strVal);
    }
    
    // Choice check (for endings mainly)
    if (cond.choice !== undefined) {
      return GameState.choices[cond.choice] === cond.was;
    }

    // Inventory check
    if (cond.item !== undefined) {
      const has = this.hasItem(cond.item);
      return cond.is ? has : !has;
    }
    
    return true;
  },

  save() { 
    try {
      localStorage.setItem('tts_save', JSON.stringify(GameState)); 
    } catch(e) {
      console.warn("Storage failed", e);
    }
  },
  
  load() {
    try {
      const d = localStorage.getItem('tts_save');
      if (d) {
        Object.assign(GameState, JSON.parse(d));
        return true;
      }
    } catch(e) {
      console.warn("Load failed", e);
    }
    return false;
  }
};
