import { GameState, StateManager } from './state.js';

export const MemorySystem = {
  _queue: [],
  _busy: false,

  getToast() { return document.getElementById('memory-toast'); },

  // Called from effects: showToast(text)  OR  showToast(text, icon)
  async showToast(text, icon = '✦') {
    StateManager.addMemory(text, icon);     // Always persist to log
    this._queue.push({ text, icon });
    if (!this._busy) this._drain();
  },

  async _drain() {
    this._busy = true;
    while (this._queue.length > 0) {
      const item = this._queue.shift();
      await this._show(item);
    }
    this._busy = false;
  },

  async _show({ text, icon }) {
    const toast = this.getToast();
    if (!toast) return;

    toast.innerHTML = `<span style="margin-right:8px;font-size:1.1em">${icon}</span>${text}`;
    toast.hidden = false;

    toast.classList.remove('toast-enter', 'toast-exit');
    void toast.offsetWidth; // reflow
    toast.classList.add('toast-enter');

    await new Promise(r => setTimeout(r, 2600));

    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');

    await new Promise(r => setTimeout(r, 320));
    toast.hidden = true;
    toast.classList.remove('toast-exit');
  },

  getLog() {
    return GameState.memory;
  }
};
