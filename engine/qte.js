import { ControllerHandler, GPGlyph } from './controller.js';
import { StateManager, GameState } from './state.js';
import { MemorySystem } from './memory.js';

export const QTESystem = {
  getOverlay() { return document.getElementById('qte-overlay'); },

  resolvePromise: null,
  currentBeat: null,
  mode: null,
  gameLoopId: null,
  finished: false,

  mashClicks: 0,
  holdDuration: 0,
  isHolding: false,
  timer: 0,
  originalDuration: 0,

  async run(beat) {
    return new Promise(resolve => {
      this.resolvePromise = resolve;
      this.currentBeat = beat;
      this.mode = beat.mode;
      this.finished = false;

      // Difficulty modifier
      let mod = 1;
      if (GameState.difficulty === 'easy') mod = 1.5;
      else if (GameState.difficulty === 'hard') mod = 0.7;

      this.timer = beat.duration * mod;
      this.originalDuration = this.timer;
      this.mashClicks = 0;
      this.holdDuration = 0;
      this.isHolding = false;

      this.renderUI(beat);
      this.initInput();

      this.lastTime = performance.now();
      this.gameLoopId = requestAnimationFrame(t => this.loop(t));
    });
  },

  renderUI(beat) {
    const overlay = this.getOverlay();
    overlay.hidden = false;
    overlay.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'qte-container';

    // Instruction
    const instruction = document.createElement('div');
    instruction.className = 'qte-instruction qte-pop';
    instruction.textContent = beat.instruction;
    container.appendChild(instruction);

    // Timer display (countdown ring idea kept simple — bar)
    const timerRow = document.createElement('div');
    timerRow.className = 'qte-timer-row';
    timerRow.id = 'qte-timer-row';
    container.appendChild(timerRow);

    if (beat.mode === 'mash' || beat.mode === 'hold') {
      const barBg = document.createElement('div');
      barBg.className = 'qte-bar-bg';
      const barFill = document.createElement('div');
      barFill.className = 'qte-bar-fill';
      barFill.id = 'qte-fill';
      barBg.appendChild(barFill);
      container.appendChild(barBg);

      if (beat.mode === 'mash') {
        const hint = document.createElement('div');
        hint.className = 'qte-hint';
        hint.innerHTML = `Tap secepat mungkin! ${GPGlyph.hint(GPGlyph.a, 'Tekan berulang')}`;
        container.appendChild(hint);
      } else {
        const hint = document.createElement('div');
        hint.className = 'qte-hint';
        hint.innerHTML = `Tahan layar! ${GPGlyph.hint(GPGlyph.a, 'Tahan')}`;
        container.appendChild(hint);
      }
    } else if (beat.mode === 'press') {
      const zone = document.createElement('div');
      zone.className = 'qte-press-zone';

      const target = document.createElement('div');
      target.className = 'qte-press-target';
      // Sweet spot: 40–60% of the bar
      target.style.left = '38%';
      target.style.width = '24%';

      const ind = document.createElement('div');
      ind.className = 'qte-press-indicator';
      ind.id = 'qte-ind';
      ind.style.left = '0%';

      zone.appendChild(target);
      zone.appendChild(ind);
      container.appendChild(zone);

      const hint = document.createElement('div');
      hint.className = 'qte-hint';
      hint.innerHTML = `Tap saat indikator di zona hijau! ${GPGlyph.hint(GPGlyph.a, 'Tekan')}`;
      container.appendChild(hint);
    }

    overlay.appendChild(container);
  },

  initInput() {
    this.handleDown = (e) => {
      if (e) e.stopPropagation();
      if (this.finished) return;
      if (this.mode === 'mash') {
        this.mashClicks++;
        this._updateMashBar();
      } else if (this.mode === 'hold') {
        this.isHolding = true;
      } else if (this.mode === 'press') {
        this._checkPress();
      }
    };
    this.handleUp = () => { this.isHolding = false; };

    // Attach to overlay so it doesn't bleed outside
    const overlay = this.getOverlay();
    overlay.addEventListener('pointerdown', this.handleDown);
    document.addEventListener('pointerup', this.handleUp);
    ControllerHandler.on('confirm', this.handleDown);
  },

  cleanup() {
    cancelAnimationFrame(this.gameLoopId);
    this.gameLoopId = null;
    const overlay = this.getOverlay();
    if (overlay) overlay.removeEventListener('pointerdown', this.handleDown);
    document.removeEventListener('pointerup', this.handleUp);
    ControllerHandler.off('confirm', this.handleDown);
  },

  _updateMashBar() {
    const fill = document.getElementById('qte-fill');
    if (!fill) return;
    const pct = Math.min(100, (this.mashClicks / this.currentBeat.threshold) * 100);
    fill.style.width = `${pct}%`;
  },

  _checkPress() {
    // Progress 0→1 over the timer
    const progress = 1 - (this.timer / this.originalDuration);
    // Target zone 0.38–0.62
    if (progress >= 0.38 && progress <= 0.62) {
      this._finish('success');
    } else {
      this._finish('fail');
    }
  },

  loop(timestamp) {
    if (this.finished) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap dt
    this.lastTime = timestamp;
    this.timer -= dt;

    // Update timer display
    const timerRow = document.getElementById('qte-timer-row');
    if (timerRow) {
      const pct = Math.max(0, (this.timer / this.originalDuration) * 100);
      timerRow.innerHTML = `<div class="qte-timer-bg"><div class="qte-timer-fill" style="width:${pct}%;background:${pct < 30 ? 'var(--danger)' : 'rgba(255,255,255,0.3)'}"></div></div>`;
    }

    if (this.mode === 'press') {
      const ind = document.getElementById('qte-ind');
      if (ind) {
        const progress = 1 - (this.timer / this.originalDuration);
        ind.style.left = `${Math.min(100, progress * 100)}%`;
      }
    } else if (this.mode === 'hold') {
      if (this.isHolding) {
        this.holdDuration += dt;
        const fill = document.getElementById('qte-fill');
        if (fill) fill.style.width = `${Math.min(100, (this.holdDuration / 2) * 100)}%`;
        if (this.holdDuration >= 2) { this._finish('success'); return; }
      }
    } else if (this.mode === 'mash') {
      if (this.mashClicks >= this.currentBeat.threshold) { this._finish('success'); return; }
    }

    if (this.timer <= 0) { this._finish('fail'); return; }

    this.gameLoopId = requestAnimationFrame(t => this.loop(t));
  },

  async _finish(result) {
    if (this.finished) return;
    this.finished = true;
    this.cleanup();

    const overlay = this.getOverlay();
    overlay.hidden = true;

    // Screen flash
    const flash = document.createElement('div');
    flash.className = result === 'success' ? 'flash-success' : 'flash-danger';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // Effects
    const outcomeObj = result === 'success' ? this.currentBeat.onSuccess : this.currentBeat.onFail;
    if (outcomeObj?.effects) {
      for (const eff of outcomeObj.effects) {
        if (eff.type === 'flag')     StateManager.setFlag(eff.key, eff.value);
        if (eff.type === 'relation') StateManager.modifyRelation(eff.char, eff.stat, eff.delta);
        if (eff.type === 'memory')   await MemorySystem.showToast(eff.text);
        if (eff.type === 'log')      StateManager.logChoice(eff.text);
        if (eff.type === 'item_add') StateManager.addItem(eff.item);
      }
    }

    const resolve = this.resolvePromise;
    this.resolvePromise = null;
    resolve({ result, goto: outcomeObj?.goto });
  }
};
