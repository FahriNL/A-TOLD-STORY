import { GameState, StateManager } from './state.js';
import { MemorySystem } from './memory.js';
import { ControllerHandler, GPGlyph } from './controller.js';
import { DialogueSystem } from './dialogue.js';

export const ChoiceSystem = {
  getWrap() { return document.getElementById('choice-wrap'); },
  resolvePromise: null,
  countdownTimeout: null,
  optionsData: [],
  selectedIndex: 0,
  currentBeatId: null,

  async run(beat) {
    return new Promise(resolve => {
      this.resolvePromise = resolve;
      this.optionsData = beat.options;
      this.currentBeatId = beat.id;
      this.selectedIndex = 0;

      const wrap = this.getWrap();
      wrap.innerHTML = '';
      wrap.hidden = false;

      this.optionsData.forEach((opt, index) => {
        const meetsReq = StateManager.checkCondition(opt.requires);
        const btn = document.createElement('div');
        btn.className = `choice-btn${meetsReq ? '' : ' locked'}`;
        if (index === 0 && meetsReq) btn.classList.add('active');

        btn.innerHTML = `${opt.text}${meetsReq ? '' : ' 🔒'}`;

        if (meetsReq) {
          btn.addEventListener('pointerenter', () => this.setSelection(index));
          btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.submitChoice(index);
          });
        }

        wrap.appendChild(btn);
      });

      // Default active to first unlocked
      const firstUnlocked = this.optionsData.findIndex(o => StateManager.checkCondition(o.requires));
      if (firstUnlocked >= 0) this.setSelection(firstUnlocked);

      // Controller hints row
      const hintRow = document.createElement('div');
      hintRow.className = 'gp-hint-row';
      hintRow.innerHTML = `${GPGlyph.dpadUD}<span class="gp-label">Pilih</span>
        <span style="margin:0 4px;color:rgba(255,255,255,0.12)">│</span>
        ${GPGlyph.a}<span class="gp-label">Konfirmasi</span>`;
      wrap.appendChild(hintRow);

      this.setupGamepad();

      if (beat.timed) {
        this.startTimer(beat.duration || 8, beat.default ?? 0);
      }
    });
  },

  setSelection(index) {
    if (index < 0 || index >= this.optionsData.length) return;
    if (!StateManager.checkCondition(this.optionsData[index].requires)) return;

    this.selectedIndex = index;
    const btns = this.getWrap().querySelectorAll('.choice-btn');
    btns.forEach((b, i) => {
      b.classList.toggle('active', i === index);
    });
  },

  setupGamepad() {
    this._navUp = () => this.navigate(-1);
    this._navDown = () => this.navigate(1);
    this._confirm = () => {
      if (!this.getWrap().hidden) this.submitChoice(this.selectedIndex);
    };
    ControllerHandler.on('navUp', this._navUp);
    ControllerHandler.on('navDown', this._navDown);
    ControllerHandler.on('confirm', this._confirm);
  },

  cleanupGamepad() {
    ControllerHandler.off('navUp', this._navUp);
    ControllerHandler.off('navDown', this._navDown);
    ControllerHandler.off('confirm', this._confirm);
  },

  navigate(dir) {
    let idx = this.selectedIndex;
    for (let i = 0; i < this.optionsData.length; i++) {
      idx = (idx + dir + this.optionsData.length) % this.optionsData.length;
      if (StateManager.checkCondition(this.optionsData[idx].requires)) {
        this.setSelection(idx);
        return;
      }
    }
  },

  startTimer(durationSecs, defaultIndex) {
    const wrap = this.getWrap();
    const timerBg = document.createElement('div');
    timerBg.className = 'choice-timer-bg';
    const timerBar = document.createElement('div');
    timerBar.className = 'choice-timer-bar';
    timerBg.appendChild(timerBar);
    wrap.appendChild(timerBg);

    // Force layout before animating
    timerBar.getBoundingClientRect();
    timerBar.style.transition = `transform ${durationSecs}s linear`;
    timerBar.style.transform = 'scaleX(0)';

    this.countdownTimeout = setTimeout(() => {
      this.submitChoice(defaultIndex);
    }, durationSecs * 1000);
  },

  async submitChoice(index) {
    if (this.countdownTimeout) {
      clearTimeout(this.countdownTimeout);
      this.countdownTimeout = null;
    }
    this.cleanupGamepad();

    const opt = this.optionsData[index];
    if (!opt) return;

    if (this.currentBeatId) {
      GameState.choices[this.currentBeatId] = index;
    }

    this.getWrap().hidden = true;
    DialogueSystem.hide();

    // Process effects
    if (opt.effects) {
      for (const eff of opt.effects) {
        switch (eff.type) {
          case 'flag':        StateManager.setFlag(eff.key, eff.value); break;
          case 'relation':    StateManager.modifyRelation(eff.char, eff.stat, eff.delta); break;
          case 'memory':      await MemorySystem.showToast(eff.text); break;
          case 'log':         StateManager.logChoice(eff.text); break;
          case 'item_add':    StateManager.addItem(eff.item); break;
          case 'item_remove': StateManager.removeItem(eff.item); break;
        }
      }
    }

    const resolve = this.resolvePromise;
    this.resolvePromise = null;
    resolve({ goto: opt.goto });
  }
};
