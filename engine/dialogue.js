import SCRIPT from '../data/demo.js';
import { ControllerHandler, GPGlyph } from './controller.js';

export const DialogueSystem = {
  isTyping: false,
  isWaiting: false,
  skipRequested: false,
  resolvePromise: null,
  typingSpeed: 40,
  currentTimeout: null,
  inputInitialized: false,

  getBox() { return document.getElementById('dialogue-box'); },
  getLeftPortrait() { return document.getElementById('portrait-left'); },
  getRightPortrait() { return document.getElementById('portrait-right'); },

  initInput() {
    if (this.inputInitialized) return;
    this.inputInitialized = true;

    // Only trigger on the dialogue box itself, not global
    const handler = (e) => {
      // Ignore clicks on buttons, panels, HUD items
      if (e.target.closest('#pause-mobile-btn, #inventory-mobile-btn, #choice-wrap, #pause-menu, #relation-panel, #memory-log, #inventory-panel, #review-overlay, .menu-btn, .choice-btn, .hud-btn')) return;
      this.handleInput();
    };
    document.addEventListener('pointerdown', handler);
    ControllerHandler.on('confirm', () => this.handleInput());
  },

  handleInput() {
    if (!this.isTyping && !this.isWaiting) return;
    if (this.isTyping) {
      this.skipRequested = true;
    } else if (this.isWaiting && this.resolvePromise) {
      const resolve = this.resolvePromise;
      this.cleanup();
      resolve();
    }
  },

  async run(beat) {
    this.initInput();

    return new Promise(resolve => {
      this.resolvePromise = resolve;
      this.isWaiting = false;
      this.skipRequested = false;
      this.isTyping = true;

      this.renderUI(beat);
      this.typeText(beat.text);
    });
  },

  renderUI(beat) {
    const box = this.getBox();
    box.hidden = false;
    box.innerHTML = '';

    if (beat.mode === 'narration' || !beat.speaker) {
      box.classList.add('narration');
      box.innerHTML = `<div class="dialogue-text" id="dlg-text"></div>
        <div class="dialogue-gp-hint" id="dlg-gp-hint">${GPGlyph.a}<span class="gp-label">Lanjut</span></div>`;
    } else {
      box.classList.remove('narration');
      const charData = SCRIPT.characters[beat.speaker.toLowerCase()];
      const name = charData ? charData.name : beat.speaker;
      const color = charData ? charData.color : '#888';

      box.innerHTML = `
        <div class="speaker-name" style="color: ${color}">${name}</div>
        <div class="dialogue-text" id="dlg-text"></div>
        <div class="dialogue-gp-hint" id="dlg-gp-hint">${GPGlyph.a}<span class="gp-label">Lanjut</span></div>
      `;

      if (beat.portrait) {
        this.renderPortrait(beat.speaker, color, beat.portrait);
      }
    }
  },

  renderPortrait(speaker, color, position) {
    const charInitials = speaker.substring(0, 2).toUpperCase();
    const portraitHTML = `<div class="portrait portrait-enter" style="--color: ${color}">${charInitials}</div>`;

    if (position === 'left') {
      this.getLeftPortrait().innerHTML = portraitHTML;
    } else if (position === 'right') {
      this.getRightPortrait().innerHTML = portraitHTML;
    }
  },

  typeText(text) {
    const textEl = document.getElementById('dlg-text');
    if (!textEl) return;
    let i = 0;

    const type = () => {
      if (this.skipRequested) {
        textEl.textContent = text;
        this.isTyping = false;
        this.isWaiting = true;
        textEl.insertAdjacentHTML('beforeend', '<span class="typewriter-cursor"></span>');
        return;
      }

      if (i < text.length) {
        textEl.textContent = text.substring(0, i + 1);
        i++;
        this.currentTimeout = setTimeout(type, this.typingSpeed);
      } else {
        this.isTyping = false;
        this.isWaiting = true;
        textEl.insertAdjacentHTML('beforeend', '<span class="typewriter-cursor"></span>');
      }
    };

    type();
  },

  cleanup() {
    clearTimeout(this.currentTimeout);
    this.currentTimeout = null;
    this.isTyping = false;
    this.isWaiting = false;
    this.resolvePromise = null;
    this.skipRequested = false;

    const textEl = document.getElementById('dlg-text');
    if (textEl) {
      const cursor = textEl.querySelector('.typewriter-cursor');
      if (cursor) cursor.remove();
    }
  },

  hide() {
    const box = this.getBox();
    if (box) box.hidden = true;
    const lp = this.getLeftPortrait();
    const rp = this.getRightPortrait();
    if (lp) lp.innerHTML = '';
    if (rp) rp.innerHTML = '';
  }
};
