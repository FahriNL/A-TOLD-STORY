import { GameState, StateManager } from './state.js';
import { ControllerHandler, GPGlyph } from './controller.js';

// Rich episode review with visual UI, no location.reload() needed
export const EpisodeReview = {
  getOverlay() {
    let overlay = document.getElementById('review-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'review-overlay';
      overlay.className = 'overlay-layer';
      overlay.hidden = true;
      document.getElementById('game').appendChild(overlay);
    }
    return overlay;
  },

  async run(_beat) {
    return new Promise(resolve => {
      const overlay = this.getOverlay();
      overlay.hidden = false;

      const log = GameState.choiceLog;
      const rels = GameState.relations;

      // Build choice log HTML
      const logHTML = log.length
        ? log.map((str, i) => `
            <li class="review-log-item" style="animation-delay:${i * 0.08}s">
              <span class="review-icon">📌</span>
              <span>${str}</span>
            </li>`).join('')
        : '<li class="review-log-item"><span class="review-icon">—</span><span>Tidak ada pilihan mayor tercatat.</span></li>';

      // Build relation snapshot
      let relHTML = '';
      for (const [charId, stats] of Object.entries(rels)) {
        const charData = GameState._scriptChars?.[charId];
        const name = charData ? charData.name : charId.charAt(0).toUpperCase() + charId.slice(1);
        const color = charData?.color || '#888';
        relHTML += `
          <div class="review-rel-row">
            <span class="review-rel-name" style="color:${color}">${name}</span>
            <div class="stat-bar-bg" style="flex:1;margin:0 10px">
              <div class="stat-bar" style="width:${stats.trust ?? 50}%"></div>
            </div>
            <span>${stats.trust ?? 50}</span>
          </div>`;
      }

      overlay.innerHTML = `
        <div class="review-backdrop"></div>
        <div class="review-container review-appear">
          <div class="review-header">
            <div class="review-badge">RINGKASAN EPISODE</div>
            <h1 class="review-title">Perjalananmu Sejauh Ini</h1>
            <p class="review-subtitle">Setiap pilihan meninggalkan jejak.</p>
          </div>

          <div class="review-body">
            <div class="review-section">
              <h3 class="review-section-title">📜 Pilihan Kamu</h3>
              <ul class="review-log-list">${logHTML}</ul>
            </div>
            ${relHTML ? `
            <div class="review-section">
              <h3 class="review-section-title">🤝 Status Relasi</h3>
              <div class="review-relations">${relHTML}</div>
            </div>` : ''}
          </div>

          <div class="review-footer">
            <button class="review-btn" id="btn-review-menu"><span class="gp-hint menu-gp-badge">${GPGlyph.b}</span>Menu Utama</button>
            <button class="review-btn review-btn-primary" id="btn-review-continue"><span class="gp-hint menu-gp-badge">${GPGlyph.a}</span>Lanjutkan &rarr;</button>
          </div>
        </div>
      `;

      const btnMenu = document.getElementById('btn-review-menu');
      const btnCont = document.getElementById('btn-review-continue');

      const cleanupGP = () => {
        ControllerHandler.off('navUp', navToggle);
        ControllerHandler.off('navDown', navToggle);
        ControllerHandler.off('confirm', navConfirm);
        ControllerHandler.off('cancel', navCancel);
      };

      btnMenu.onclick = () => {
        cleanupGP();
        this._close(overlay);
        location.reload();
      };

      btnCont.onclick = () => {
        cleanupGP();
        GameState.choiceLog = [];
        this._close(overlay, resolve);
      };

      // Gamepad Navigation for Review
      let focusIdx = 1; // Default to Continue
      const updateFocus = () => {
        btnMenu.classList.toggle('gp-focused', focusIdx === 0);
        btnCont.classList.toggle('gp-focused', focusIdx === 1);
      };
      updateFocus();

      btnMenu.addEventListener('pointerenter', () => { focusIdx = 0; updateFocus(); });
      btnCont.addEventListener('pointerenter', () => { focusIdx = 1; updateFocus(); });

      const navToggle = () => { focusIdx = focusIdx === 0 ? 1 : 0; updateFocus(); };
      const navConfirm = () => {
        if (focusIdx === 0) btnMenu.click();
        else btnCont.click();
      };
      const navCancel = () => { btnMenu.click(); }; // B goes to Menu

      ControllerHandler.on('navUp', navToggle);
      ControllerHandler.on('navDown', navToggle);
      ControllerHandler.on('confirm', navConfirm);
      ControllerHandler.on('cancel', navCancel);
    });
  },

  _close(overlay, cb) {
    overlay.querySelector('.review-container')?.classList.add('review-exit');
    setTimeout(() => {
      overlay.hidden = true;
      overlay.innerHTML = '';
      if (cb) cb(null);
    }, 400);
  }
};
