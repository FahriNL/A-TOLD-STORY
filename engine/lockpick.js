import { ControllerHandler, GPGlyph } from './controller.js';
import { StateManager, GameState } from './state.js';

export const LockpickGame = {
  getOverlay() { return document.getElementById('lockpick-overlay'); },
  getCanvas()  { return document.getElementById('lockpick-canvas'); },

  resolvePromise: null,
  currentBeat: null,
  loopId: null,
  finished: false,

  pinsTotal: 3,
  pinsSet: 0,
  attemptsRemaining: 3,
  pickAngle: 0,
  isPressing: false,
  tensionProgress: 0,
  sweetSpotBase: 0,
  sweetSpotWidth: 20,
  ctx: null,

  async run(beat) {
    return new Promise(resolve => {
      this.resolvePromise = resolve;
      this.currentBeat = beat;
      this.finished = false;
      this.attemptsRemaining = beat.attempts ?? 3;
      this.pinsTotal = beat.pins ?? 3;
      this.pinsSet = 0;

      // Sweet spot width * difficulty modifier
      let diffMod = 1;
      if (GameState.difficulty === 'easy') diffMod = 1.6;
      else if (GameState.difficulty === 'hard') diffMod = 0.5;

      const base = beat.difficulty === 'easy' ? 40
                 : beat.difficulty === 'hard' ? 10
                 : 22;
      this.sweetSpotWidth = base * diffMod;

      this.randomizeSweetSpot();
      this.initUI();
      this.initInput();

      this.lastTime = performance.now();
      this.loopId = requestAnimationFrame(t => this.loop(t));
    });
  },

  randomizeSweetSpot() {
    this.sweetSpotBase = -80 + Math.random() * 160;
    this.tensionProgress = 0;
    this.pickAngle = 0;
    this.isPressing = false;
  },

  initUI() {
    const overlay = this.getOverlay();
    overlay.hidden = false;
    overlay.innerHTML = '';

    const cvs = this.getCanvas();
    const size = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.6, 380);
    cvs.width  = size;
    cvs.height = size;
    this.ctx = cvs.getContext('2d');

    const uiWrap = document.createElement('div');
    uiWrap.className = 'lockpick-ui';

    const tensionWrap = document.createElement('div');
    tensionWrap.className = 'tension-bar-wrapper';
    tensionWrap.id = 'lp-tension';

    const tensionBar = document.createElement('div');
    tensionBar.className = 'tension-bar';
    tensionBar.id = 'lp-tension-bar';
    tensionWrap.appendChild(tensionBar);

    uiWrap.appendChild(tensionWrap);
    uiWrap.appendChild(cvs);

    const hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;bottom:16px;left:0;right:0;text-align:center;font-size:0.75rem;color:rgba(255,255,255,0.4)';
    hint.innerHTML = `Drag memutar — Tahan saat sweet spot
      ${GPGlyph.row([GPGlyph.ls, 'Putar'], [GPGlyph.a, 'Tahan'])}`;

    overlay.appendChild(uiWrap);
    overlay.appendChild(hint);
  },

  initInput() {
    const cvs = this.getCanvas();

    this.handleStart = (e) => {
      e.preventDefault();
      this.isPressing = true;
      this._updateAngleFromEvent(e);
    };
    this.handleEnd = (e) => {
      e.preventDefault();
      this.isPressing = false;
    };
    this.handleMove = (e) => {
      e.preventDefault();
      this._updateAngleFromEvent(e);
    };

    cvs.addEventListener('pointerdown', this.handleStart, { passive: false });
    document.addEventListener('pointerup', this.handleEnd);
    cvs.addEventListener('pointermove', this.handleMove, { passive: false });
    cvs.setPointerCapture;
  },

  _updateAngleFromEvent(e) {
    const cvs = this.getCanvas();
    const rect = cvs.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;

    let tx = e.clientX ?? (e.touches?.[0]?.clientX);
    let ty = e.clientY ?? (e.touches?.[0]?.clientY);
    if (!tx) return;

    const dx = tx - cx;
    const dy = ty - cy;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    // Clamp to -90..90
    angle = Math.max(-90, Math.min(90, angle));
    this.pickAngle = angle;
  },

  cleanup() {
    cancelAnimationFrame(this.loopId);
    this.loopId = null;
    const cvs = this.getCanvas();
    if (cvs) {
      cvs.removeEventListener('pointerdown', this.handleStart);
      cvs.removeEventListener('pointermove', this.handleMove);
    }
    document.removeEventListener('pointerup', this.handleEnd);
  },

  loop(timestamp) {
    if (this.finished) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    const tensionWrap = document.getElementById('lp-tension');
    const tensionBar  = document.getElementById('lp-tension-bar');
    const overlay = this.getOverlay();

    // Gamepad input
    if (ControllerHandler.active) {
      const gp = navigator.getGamepads?.()?.[0];
      if (gp) {
        if (Math.abs(gp.axes[0]) > 0.12) {
          this.pickAngle = Math.max(-90, Math.min(90, this.pickAngle + gp.axes[0] * 90 * dt));
        }
        this.isPressing = gp.buttons[0]?.pressed ?? false;
      }
    }

    const dist = Math.abs(this.pickAngle - this.sweetSpotBase);
    const inSpot = dist <= this.sweetSpotWidth / 2;

    if (this.isPressing) {
      if (inSpot) {
        this.tensionProgress += dt / 0.8;
        tensionWrap?.classList.add('tension-shake');
        overlay.classList.add('lockpick-pulse');
        if (this.tensionProgress >= 1) {
          this.pinsSet++;
          this.tensionProgress = 0;
          tensionWrap?.classList.remove('tension-shake');
          overlay.classList.remove('lockpick-pulse');
          if (this.pinsSet >= this.pinsTotal) {
            this.finish('success');
            return;
          }
          this.randomizeSweetSpot();
        }
      } else {
        this.tensionProgress += dt / 0.45;
        tensionWrap?.classList.add('tension-shake');
        if (this.tensionProgress >= 1) {
          this.attemptsRemaining--;
          this.tensionProgress = 0;
          tensionWrap?.classList.remove('tension-shake');
          overlay.classList.remove('lockpick-pulse');

          // Snap flash
          const flash = document.createElement('div');
          flash.className = 'flash-danger';
          document.body.appendChild(flash);
          setTimeout(() => flash.remove(), 600);

          if (this.attemptsRemaining <= 0) {
            this.finish('fail');
            return;
          }
          this.randomizeSweetSpot();
        }
      }
    } else {
      this.tensionProgress = Math.max(0, this.tensionProgress - dt * 1.5);
      tensionWrap?.classList.remove('tension-shake');
      overlay.classList.remove('lockpick-pulse');
    }

    if (tensionBar) {
      tensionBar.style.height = `${Math.min(100, this.tensionProgress * 100)}%`;
      tensionBar.style.background = inSpot ? 'var(--success)' : 'var(--danger)';
    }

    this.renderCanvas(inSpot);
    this.loopId = requestAnimationFrame(t => this.loop(t));
  },

  renderCanvas(inSpot) {
    if (!this.ctx) return;
    const w = this.ctx.canvas.width;
    const h = this.ctx.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const R = w * 0.38;

    this.ctx.clearRect(0, 0, w, h);

    // Outer ring
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, R, 0, Math.PI * 2);
    this.ctx.lineWidth = 10;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    this.ctx.stroke();

    // Sweet spot arc (visible feedback, slightly transparent so it's not obvious)
    const spBase = (this.sweetSpotBase - 90) * Math.PI / 180;
    const spHalf = (this.sweetSpotWidth / 2) * Math.PI / 180;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, R, spBase - spHalf, spBase + spHalf);
    this.ctx.lineWidth = 10;
    this.ctx.strokeStyle = inSpot
      ? `rgba(64, 192, 112, ${0.3 + this.tensionProgress * 0.7})`
      : 'rgba(64, 192, 112, 0.18)';
    this.ctx.stroke();

    // Pin indicators
    const pinSpacing = 24;
    const pinStartX = cx - ((this.pinsTotal - 1) * pinSpacing) / 2;
    for (let i = 0; i < this.pinsTotal; i++) {
      this.ctx.beginPath();
      this.ctx.arc(pinStartX + i * pinSpacing, cy - R - 18, 7, 0, Math.PI * 2);
      this.ctx.fillStyle = i < this.pinsSet
        ? `rgba(64,192,112,1)`
        : 'rgba(255,255,255,0.15)';
      this.ctx.fill();
    }

    // Attempts text
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.font = `${Math.round(w * 0.04)}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Nyawa: ${'❤'.repeat(this.attemptsRemaining)}`, cx, cy + R + 24);

    // Lock body ring (rotates with tension)
    const rotOffset = this.isPressing ? this.tensionProgress * (inSpot ? 0.08 : -0.05) : 0;
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(rotOffset);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, R * 0.25, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(40,40,60,1)`;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.restore();

    // Pick line
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate((this.pickAngle - 90) * Math.PI / 180);
    this.ctx.beginPath();
    this.ctx.moveTo(R * 0.25, 0);
    this.ctx.lineTo(R - 5, 0);
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = inSpot
      ? `rgba(64,192,112,${0.6 + this.tensionProgress * 0.4})`
      : 'rgba(200,200,220,0.8)';
    this.ctx.lineCap = 'round';
    this.ctx.stroke();
    this.ctx.restore();
  },

  finish(result) {
    if (this.finished) return;
    this.finished = true;
    this.cleanup();
    this.getOverlay().hidden = true;

    const outcomeObj = result === 'success' ? this.currentBeat.onSuccess : this.currentBeat.onFail;
    if (outcomeObj?.effects) {
      for (const eff of outcomeObj.effects) {
        if (eff.type === 'flag')     StateManager.setFlag(eff.key, eff.value);
        if (eff.type === 'relation') StateManager.modifyRelation(eff.char, eff.stat, eff.delta);
        if (eff.type === 'log')      StateManager.logChoice(eff.text);
        if (eff.type === 'item_add') StateManager.addItem(eff.item);
      }
    }

    const resolve = this.resolvePromise;
    this.resolvePromise = null;
    resolve({ result, goto: outcomeObj?.goto });
  }
};
