import { ControllerHandler, GPGlyph } from '../engine/controller.js';
import { RelationTracker } from '../engine/relation.js';
import { MemorySystem } from '../engine/memory.js';
import { goToScene } from '../engine/scene.js';
import { StateManager, GameState } from '../engine/state.js';

export const MenuSystem = {
  getMainMenu()      { return document.getElementById('main-menu'); },
  getPauseMenu()     { return document.getElementById('pause-menu'); },
  getRelationPanel() { return document.getElementById('relation-panel'); },
  getMemoryPanel()   { return document.getElementById('memory-log'); },
  getInventoryPanel(){ return document.getElementById('inventory-panel'); },

  /* ── Gamepad Navigation State ── */
  _gpCtx: null,       // current navigation context: { btns, idx, onConfirm, onCancel, cleanupFns }

  init() {
    // Mobile HUD buttons
    document.getElementById('pause-mobile-btn').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (!this.getMainMenu().hidden) return;
      if (this.getPauseMenu().hidden) this.showPause();
      else this.hidePause();
    });

    document.getElementById('inventory-mobile-btn').addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (!this.getMainMenu().hidden || !this.getPauseMenu().hidden) return;
      if (this.getInventoryPanel().hidden) this.showInventory();
      else this.hidePanel(this.getInventoryPanel());
    });

    // Gamepad shortcuts
    ControllerHandler.on('pause', () => {
      if (this.getMainMenu().hidden) {
        if (this.getPauseMenu().hidden) this.showPause();
        else this.hidePause();
      }
    });

    ControllerHandler.on('openRelations', () => {
      if (this.getMainMenu().hidden && this.getPauseMenu().hidden) {
        if (this.getRelationPanel().hidden) this.showRelations();
        else this.hidePanel(this.getRelationPanel());
      }
    });

    // B button as universal "back" for panels
    ControllerHandler.on('cancel', () => {
      // Close panels first
      const relP = this.getRelationPanel();
      const memP = this.getMemoryPanel();
      const invP = this.getInventoryPanel();
      if (!relP.hidden) { this.hidePanel(relP); return; }
      if (!memP.hidden) { this.hidePanel(memP); return; }
      if (!invP.hidden) { this.hidePanel(invP); return; }
      // Then close pause
      if (!this.getPauseMenu().hidden) { this.hidePause(); return; }
    });
  },

  /* ─────────────────────────────────────────────────
     Gamepad Navigation Helper
     Binds navUp/navDown/confirm to a list of buttons
  ───────────────────────────────────────────────── */
  _gpNavSetup(btns, { onCancel = null } = {}) {
    this._gpNavCleanup(); // remove previous

    if (!btns || btns.length === 0) return;

    const ctx = { btns, idx: 0, cleanupFns: [] };

    // Highlight first
    this._gpHighlight(ctx);

    const navUp = () => {
      ctx.idx = (ctx.idx - 1 + ctx.btns.length) % ctx.btns.length;
      // Skip disabled
      let tries = ctx.btns.length;
      while (ctx.btns[ctx.idx].disabled && tries-- > 0) {
        ctx.idx = (ctx.idx - 1 + ctx.btns.length) % ctx.btns.length;
      }
      this._gpHighlight(ctx);
    };
    const navDown = () => {
      ctx.idx = (ctx.idx + 1) % ctx.btns.length;
      let tries = ctx.btns.length;
      while (ctx.btns[ctx.idx].disabled && tries-- > 0) {
        ctx.idx = (ctx.idx + 1) % ctx.btns.length;
      }
      this._gpHighlight(ctx);
    };
    const confirm = () => {
      const btn = ctx.btns[ctx.idx];
      if (btn && !btn.disabled) btn.click();
    };
    const cancel = () => {
      if (onCancel) onCancel();
    };

    ControllerHandler.on('navUp', navUp);
    ControllerHandler.on('navDown', navDown);
    ControllerHandler.on('confirm', confirm);
    ControllerHandler.on('cancel', cancel);
    ctx.cleanupFns.push(
      () => ControllerHandler.off('navUp', navUp),
      () => ControllerHandler.off('navDown', navDown),
      () => ControllerHandler.off('confirm', confirm),
      () => ControllerHandler.off('cancel', cancel)
    );

    // Hover sync: if the user hovers with a pointer, update idx
    btns.forEach((btn, i) => {
      const enter = () => {
        ctx.idx = i;
        this._gpHighlight(ctx);
      };
      btn.addEventListener('pointerenter', enter);
      ctx.cleanupFns.push(() => btn.removeEventListener('pointerenter', enter));
    });

    this._gpCtx = ctx;
  },

  _gpHighlight(ctx) {
    ctx.btns.forEach((btn, i) => {
      btn.classList.toggle('gp-focused', i === ctx.idx);
    });
  },

  _gpNavCleanup() {
    if (this._gpCtx) {
      this._gpCtx.cleanupFns.forEach(fn => fn());
      this._gpCtx.btns.forEach(btn => btn.classList.remove('gp-focused'));
      this._gpCtx = null;
    }
  },

  /* ─────────────────────────────────────────────────
     MAIN MENU
  ───────────────────────────────────────────────── */
  showMain() {
    // Load save check (don't actually override GameState here)
    const hasSave = !!localStorage.getItem('tts_save');

    const menu = this.getMainMenu();
    menu.hidden = false;
    menu.innerHTML = `
      <div class="main-menu-bg"></div>
      <div class="main-menu-content" id="layer-main">
        <div class="main-title-group">
          <div class="main-eyebrow">Interactive Story Engine</div>
          <h1 class="main-title">A TOLD STORY</h1>
          <div class="main-subtitle">Tiap kata, tiap pilihan, meninggalkan bekas.</div>
        </div>

        <div class="diff-row">
          <button class="diff-btn" id="diff-easy">Mudah</button>
          <button class="diff-btn diff-active" id="diff-normal">Normal</button>
          <button class="diff-btn" id="diff-hard">Sulit</button>
        </div>

        <button class="menu-btn" id="btn-start-game">▶ Mulai</button>

        <button class="menu-btn continue-btn" id="btn-continue" ${hasSave ? '' : 'disabled'}>
          ${hasSave ? '▶ Lanjutkan Simpanan' : '— Belum ada simpanan —'}
        </button>

        ${GPGlyph.row([GPGlyph.dpadUD, 'Pilih'], [GPGlyph.a, 'Pilih'], [GPGlyph.start, 'Pause'])}
      </div>

      <!-- LAYER 2: SEASON SELECTION -->
      <div class="main-menu-content layer-hidden" id="layer-seasons">
        <div class="main-title-group">
          <h2 class="pause-title">Pilih Musim</h2>
        </div>
        <div class="ep-grid" style="grid-template-columns: 1fr;">
          <button class="ep-btn" id="btn-season1">
            <span class="ep-num">M1</span>
            <span class="ep-label">Musim 1: Kepingan Berdarah</span>
          </button>
        </div>
        <button class="menu-btn" id="btn-season-back" style="margin-top:24px">↩ Kembali</button>
        ${GPGlyph.row([GPGlyph.dpadUD, 'Pilih'], [GPGlyph.a, 'Buka'], [GPGlyph.b, 'Kembali'])}
      </div>

      <!-- LAYER 3: EPISODE SELECTION -->
      <div class="main-menu-content layer-hidden" id="layer-episodes">
        <div class="main-title-group">
          <h2 class="pause-title" id="episodes-title">Musim 1</h2>
        </div>
        
        <div class="ep-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
          <button class="ep-btn" id="btn-ep1">
            <span class="ep-num">01</span>
            <span class="ep-label">Pedang Tumpul &amp; Lidah Tajam</span>
          </button>
          <button class="ep-btn" id="btn-ep2">
            <span class="ep-num">02</span>
            <span class="ep-label">Harga Sebuah Kata</span>
          </button>
          <button class="ep-btn" id="btn-ep3">
            <span class="ep-num">03</span>
            <span class="ep-label">Sang Penjual Kata</span>
          </button>
          <button class="ep-btn" id="btn-ep4">
            <span class="ep-num">04</span>
            <span class="ep-label">Mitos Area Belum Terjamah</span>
          </button>
          <button class="ep-btn" id="btn-ep5">
            <span class="ep-num">05</span>
            <span class="ep-label">Penyusupan ke Lumina</span>
          </button>
          <button class="ep-btn" id="btn-ep6">
            <span class="ep-num">06</span>
            <span class="ep-label">Suara dalam Gelap</span>
          </button>
          <button class="ep-btn" id="btn-ep7">
            <span class="ep-num">07</span>
            <span class="ep-label">Gambar yang Bercerita</span>
          </button>
        </div>
        
        <button class="menu-btn" id="btn-ep-back" style="margin-top:24px">↩ Kembali</button>
        ${GPGlyph.row([GPGlyph.dpadUD, 'Pilih'], [GPGlyph.a, 'Mulai'], [GPGlyph.b, 'Kembali'])}
      </div>
    `;

    // Layer state machine
    const layerMain = document.getElementById('layer-main');
    const layerSeasons = document.getElementById('layer-seasons');
    const layerEps = document.getElementById('layer-episodes');

    const setupLayerMain = () => {
      layerMain.classList.remove('layer-hidden');
      layerSeasons.classList.add('layer-hidden');
      layerEps.classList.add('layer-hidden');
      this._gpNavSetup([document.getElementById('btn-start-game'), document.getElementById('btn-continue')]);
    };

    const setupLayerSeasons = () => {
      layerMain.classList.add('layer-hidden');
      layerSeasons.classList.remove('layer-hidden');
      layerEps.classList.add('layer-hidden');
      this._gpNavSetup([document.getElementById('btn-season1'), document.getElementById('btn-season-back')], {
        onCancel: setupLayerMain
      });
    };

    const setupLayerEpisodes = () => {
      layerMain.classList.add('layer-hidden');
      layerSeasons.classList.add('layer-hidden');
      layerEps.classList.remove('layer-hidden');
      
      const epBtns = [...menu.querySelectorAll('#layer-episodes .ep-btn'), document.getElementById('btn-ep-back')];
      this._gpNavSetup(epBtns, {
        onCancel: setupLayerSeasons
      });
    };

    document.getElementById('btn-start-game').onclick = setupLayerSeasons;
    document.getElementById('btn-season1').onclick = setupLayerEpisodes;
    document.getElementById('btn-season-back').onclick = setupLayerMain;
    document.getElementById('btn-ep-back').onclick = setupLayerSeasons;

    // Difficulty
    const setDiff = (d) => {
      GameState.difficulty = d;
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('diff-active'));
      document.getElementById(`diff-${d}`).classList.add('diff-active');
    };
    document.getElementById('diff-easy').onclick   = () => setDiff('easy');
    document.getElementById('diff-normal').onclick = () => setDiff('normal');
    document.getElementById('diff-hard').onclick   = () => setDiff('hard');

    // Episode starts — reset relevant state
    const startEp = (title, scene) => {
      this._gpNavCleanup();
      GameState.choiceLog = [];
      GameState.inventory = [];
      GameState.memory = [];
      GameState.relations = {};
      GameState.flags = {};
      GameState.choices = {};
      menu.hidden = true;
      this.playTitleCard(title, scene);
    };

    document.getElementById('btn-ep1').onclick = () => startEp('Episode 1 — Pedang Tumpul & Lidah Tajam', 'intro');
    document.getElementById('btn-ep2').onclick = () => startEp('Episode 2 — Harga Sebuah Kata', 'episode2_start');
    document.getElementById('btn-ep3').onclick = () => startEp('Episode 3 — Sang Penjual Kata', 'episode3_start');
    document.getElementById('btn-ep4').onclick = () => startEp('Episode 4 — Mitos Area Belum Terjamah', 'episode4_start');
    document.getElementById('btn-ep5').onclick = () => startEp('Episode 5 — Penyusupan ke Lumina', 'episode5_start');
    document.getElementById('btn-ep6').onclick = () => startEp('Episode 6 — Suara dalam Gelap', 'episode6_start');
    document.getElementById('btn-ep7').onclick = () => startEp('Episode 7 — Gambar yang Bercerita', 'episode7_start');

    const btnCont = document.getElementById('btn-continue');
    if (hasSave) {
      btnCont.onclick = () => {
        this._gpNavCleanup();
        StateManager.load();
        menu.hidden = true;
        goToScene(StateManager.getFlag('current_scene') || 'intro');
      };
    }

    // Start with main layer focused
    setupLayerMain();
  },

  playTitleCard(title, startScene) {
    const card = document.getElementById('title-card');
    card.hidden = false;
    card.innerHTML = `
      <div class="title-card-inner">
        <div class="title-card-label">A TOLD STORY</div>
        <div class="title-card-episode">${title}</div>
        <div class="title-card-tap">Tap untuk lewati <span class="gp-hint" style="display:inline-flex;align-items:center;gap:4px;margin-left:6px">${GPGlyph.a}<span class="gp-label">Lewati</span></span></div>
      </div>`;

    const skip = () => {
      card.hidden = true;
      card.removeEventListener('pointerdown', skip);
      ControllerHandler.off('confirm', skip);
      clearTimeout(tid);
      goToScene(startScene);
    };

    const tid = setTimeout(skip, 3500);
    card.addEventListener('pointerdown', skip);
    ControllerHandler.on('confirm', skip);
  },

  /* ─────────────────────────────────────────────────
     PAUSE MENU
  ───────────────────────────────────────────────── */
  showPause() {
    const p = this.getPauseMenu();
    p.hidden = false;
    p.innerHTML = `
      <div class="pause-inner">
        <h2 class="pause-title">— JEDA —</h2>
        <button class="menu-btn" id="btn-resume">▶ Lanjutkan</button>
        <button class="menu-btn" id="btn-inv">🎒 Inventory</button>
        <button class="menu-btn" id="btn-rel">🤝 Relasi</button>
        <button class="menu-btn" id="btn-mem">📜 Memory Log</button>
        <button class="menu-btn" id="btn-save">💾 Simpan</button>
        <button class="menu-btn danger-btn" id="btn-quit">↩ Menu Utama</button>
        ${GPGlyph.row([GPGlyph.dpadUD, 'Pilih'], [GPGlyph.a, 'Konfirmasi'], [GPGlyph.b, 'Kembali'])}
      </div>`;

    document.getElementById('btn-resume').onclick = (e) => { e.stopPropagation(); this.hidePause(); };
    document.getElementById('btn-inv').onclick    = (e) => { e.stopPropagation(); this.hidePause(); this.showInventory(); };
    document.getElementById('btn-rel').onclick    = (e) => { e.stopPropagation(); this.hidePause(); this.showRelations(); };
    document.getElementById('btn-mem').onclick    = (e) => { e.stopPropagation(); this.hidePause(); this.showMemoryLog(); };
    document.getElementById('btn-save').onclick   = (e) => { e.stopPropagation(); StateManager.save(); this._flashSaved(); };
    document.getElementById('btn-quit').onclick   = (e) => { e.stopPropagation(); location.reload(); };

    // Gamepad nav for pause buttons
    const pauseBtns = [...p.querySelectorAll('.menu-btn')];
    this._gpNavSetup(pauseBtns);
  },

  _flashSaved() {
    const btn = document.getElementById('btn-save');
    if (!btn) return;
    btn.textContent = '✅ Tersimpan!';
    setTimeout(() => { if(btn) btn.textContent = '💾 Simpan'; }, 1500);
  },

  hidePause() {
    this._gpNavCleanup();
    this.getPauseMenu().hidden = true;
  },

  showRelations() {
    const p = this.getRelationPanel();
    const rels = RelationTracker.getAll();

    let content = rels.length ? '' : '<p style="color:var(--text-muted);padding:20px">Belum ada relasi.</p>';
    rels.forEach(r => {
      content += `
        <div class="relation-item">
          <div class="relation-name" style="color:${r.color}">${r.name}</div>
          <div class="stat-row">
            <span class="stat-label">Trust</span>
            <div class="stat-bar-bg"><div class="stat-bar" style="width:${r.trust}%"></div></div>
            <span class="stat-val">${r.trust}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Respect</span>
            <div class="stat-bar-bg"><div class="stat-bar" style="width:${r.respect}%"></div></div>
            <span class="stat-val">${r.respect}</span>
          </div>
        </div>`;
    });

    p.innerHTML = `
      <div class="panel-flex">
        <div class="panel-header">
          <span>🤝 Relasi Karakter</span>
          <button class="panel-close-btn" id="close-rel">✕</button>
        </div>
        <div class="panel-content">${content}</div>
        <div class="gp-hint-row" style="padding:10px 20px">${GPGlyph.b}<span class="gp-label">Tutup</span></div>
      </div>`;

    p.hidden = false;
    p.classList.remove('slide-out');
    p.classList.add('slide-in');
    document.getElementById('close-rel').addEventListener('pointerdown', (e) => { e.stopPropagation(); this.hidePanel(p); });
  },

  showMemoryLog() {
    const p = this.getMemoryPanel();
    const mems = MemorySystem.getLog();

    let content = mems.length ? '' : '<p style="color:var(--text-muted);padding:20px">Belum ada memori.</p>';
    mems.forEach(m => {
      content += `
        <div class="relation-item">
          <span style="font-size:1.4rem;margin-right:12px">${m.icon}</span>${m.text}
        </div>`;
    });

    p.innerHTML = `
      <div class="panel-flex">
        <div class="panel-header">
          <span>📜 Memory Log</span>
          <button class="panel-close-btn" id="close-mem">✕</button>
        </div>
        <div class="panel-content">${content}</div>
        <div class="gp-hint-row" style="padding:10px 20px">${GPGlyph.b}<span class="gp-label">Tutup</span></div>
      </div>`;

    p.hidden = false;
    p.classList.remove('slide-out');
    p.classList.add('slide-in');
    document.getElementById('close-mem').addEventListener('pointerdown', (e) => { e.stopPropagation(); this.hidePanel(p); });
  },

  showInventory() {
    const p = this.getInventoryPanel();
    const items = GameState.inventory;

    const itemVisuals = {
      lockpick_tools: { icon: '⚒️', name: 'Alat Lockpick', desc: 'Peralatan untuk membuka kunci.' },
      peta_kuno:      { icon: '🗺️', name: 'Peta Kuno',     desc: 'Peta lokasi yang sudah usang.' },
      koin_emas:      { icon: '🪙', name: 'Koin Emas',      desc: 'Bernilai tinggi di kota.' },
      akar_berdarah:  { icon: '🌿', name: 'Akar Kering',    desc: 'Sisa akar dari dungeon.' }
    };

    let content = '<div class="inventory-grid">';
    items.forEach(key => {
      const v = itemVisuals[key] || { icon: '❓', name: key, desc: '' };
      content += `
        <div class="inv-item" title="${v.desc}">
          <div style="font-size:2rem">${v.icon}</div>
          <div class="inv-name">${v.name}</div>
        </div>`;
    });
    if (!items.length) content += '<div class="inv-empty">Tas kosong.</div>';
    content += '</div>';

    p.innerHTML = `
      <div class="panel-flex">
        <div class="panel-header">
          <span>🎒 Inventory</span>
          <button class="panel-close-btn" id="close-inv">✕</button>
        </div>
        <div class="panel-content">${content}</div>
        <div class="gp-hint-row" style="padding:10px 20px">${GPGlyph.b}<span class="gp-label">Tutup</span></div>
      </div>`;

    p.hidden = false;
    p.classList.remove('slide-out');
    p.classList.add('slide-in');
    document.getElementById('close-inv').addEventListener('pointerdown', (e) => { e.stopPropagation(); this.hidePanel(p); });
  },

  hidePanel(panel) {
    panel.classList.remove('slide-in');
    panel.classList.add('slide-out');
    setTimeout(() => {
      panel.hidden = true;
      panel.classList.remove('slide-out');
    }, 300);
  }
};
