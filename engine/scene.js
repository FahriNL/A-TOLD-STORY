import { GameState, StateManager } from './state.js';
import { DialogueSystem } from './dialogue.js';
import { ChoiceSystem } from './choices.js';
import { QTESystem } from './qte.js';
import { LockpickGame } from './lockpick.js';
import { TransitionSystem } from './transition.js';
import { EndingsEngine } from './endings.js';
import { EpisodeReview } from './review.js';
import { ControllerHandler } from './controller.js';
import { Renderer } from '../ui/renderer.js';
import { MenuSystem } from '../ui/menus.js';
import SCRIPT from '../data/demo.js';

// Expose script characters to review system via GameState side-channel
GameState._scriptChars = SCRIPT.characters;

let _navigating = false;

export async function goToScene(sceneId, transition = 'fade') {
  if (_navigating) return;
  _navigating = true;

  try {
    await TransitionSystem.out(transition);

    GameState.scene = sceneId;
    StateManager.setFlag('current_scene', sceneId);

    const scene = SCRIPT.scenes[sceneId];
    if (!scene) {
      console.warn(`Scene "${sceneId}" not found`);
      _navigating = false;
      return;
    }

    Renderer.setBackground(scene.background);
    await TransitionSystem.in();

    for (const beat of scene.beats) {
      const result = await runBeat(beat);
      if (result && result.goto) {
        _navigating = false;
        return goToScene(result.goto, beat.transition || 'fade');
      }
    }

    StateManager.save();
  } finally {
    _navigating = false;
  }
}

async function runBeat(beat) {
  switch (beat.type) {
    case 'dialogue':
      return DialogueSystem.run(beat);

    case 'choice':
      return ChoiceSystem.run(beat);

    case 'qte':
      return QTESystem.run(beat);

    case 'lockpick':
      return LockpickGame.run(beat);

    case 'endings':
      return EndingsEngine.evaluate(beat);

    case 'episode_review':
      return EpisodeReview.run(beat);

    case 'setFlag':
    case 'flag':
      StateManager.setFlag(beat.key, beat.value);
      break;

    case 'relation':
      StateManager.modifyRelation(beat.char, beat.stat, beat.delta);
      break;

    case 'memory':
      StateManager.addMemory(beat.text, beat.icon);
      break;

    case 'log':
      StateManager.logChoice(beat.text);
      break;

    case 'goto':
      return { goto: beat.scene };

    default:
      console.warn(`Unknown beat type: "${beat.type}"`);
  }
  return null;
}

function initGame() {
  ControllerHandler.init();
  MenuSystem.init();
  MenuSystem.showMain();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
