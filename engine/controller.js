/* ── Xbox Glyph Generator ── */
export const GPGlyph = {
  a:     '<span class="gp-btn gp-a">A</span>',
  b:     '<span class="gp-btn gp-b">B</span>',
  x:     '<span class="gp-btn gp-x">X</span>',
  y:     '<span class="gp-btn gp-y">Y</span>',
  lb:    '<span class="gp-btn gp-bumper">LB</span>',
  rb:    '<span class="gp-btn gp-bumper">RB</span>',
  start: '<span class="gp-btn gp-special">☰</span>',
  dUp:   '<span class="gp-btn gp-dpad">▲</span>',
  dDown: '<span class="gp-btn gp-dpad">▼</span>',
  dpadUD:'<span class="gp-btn gp-dpad">▲▼</span>',
  ls:    '<span class="gp-btn gp-stick">LS</span>',

  /** Wrap glyph + label in a hint span (hidden when no gamepad) */
  hint(glyph, label) {
    return `<span class="gp-hint" style="display:inline-flex;align-items:center;gap:5px">${glyph}<span class="gp-label">${label}</span></span>`;
  },

  /** Full row of hints (hidden when no gamepad) */
  row(...pairs) {
    const inner = pairs.map(([g, l]) => `${g}<span class="gp-label">${l}</span>`).join('<span style="margin:0 6px;color:rgba(255,255,255,0.15)">│</span>');
    return `<div class="gp-hint-row">${inner}</div>`;
  }
};

export const ControllerHandler = {
  active: false,
  callbacks: {},
  gamepadIndex: null,
  lastButtons: [],
  debounceDelay: 200,
  lastTriggerTime: {},

  on(action, cb) { 
    if (!this.callbacks[action]) this.callbacks[action] = [];
    this.callbacks[action].push(cb); 
  },
  
  off(action, cb) {
    if (!this.callbacks[action]) return;
    this.callbacks[action] = this.callbacks[action].filter(f => f !== cb);
  },

  trigger(action) {
    const now = performance.now();
    if (this.lastTriggerTime[action] && (now - this.lastTriggerTime[action] < this.debounceDelay)) {
      return;
    }
    this.lastTriggerTime[action] = now;
    if (this.callbacks[action]) {
      this.callbacks[action].forEach(cb => cb());
    }
  },

  init() {
    window.addEventListener('gamepadconnected', (e) => {
      this.active = true;
      this.gamepadIndex = e.gamepad.index;
      document.body.classList.add('gamepad-active');
      this._setGamepadBadge(true);
      this.poll();
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (e.gamepad.index === this.gamepadIndex) {
        this.active = false;
        this.gamepadIndex = null;
        document.body.classList.remove('gamepad-active');
        this._setGamepadBadge(false);
      }
    });
  },

  _setGamepadBadge(visible) {
    let badge = document.getElementById('gamepad-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'gamepad-badge';
      badge.className = 'hud-btn';
      badge.title = 'Gamepad terhubung';
      badge.style.fontSize = '1rem';
      badge.style.pointerEvents = 'none';
      badge.textContent = '🎮';
      const hud = document.getElementById('hud');
      if (hud) hud.appendChild(badge);
    }
    badge.hidden = !visible;
  },

  poll() {
    if (!this.active) return;
    
    const gp = navigator.getGamepads()[this.gamepadIndex];
    if (!gp) {
      requestAnimationFrame(() => this.poll());
      return;
    }

    // Button Mapping
    // 0: A/Cross -> confirm
    // 1: B/Circle -> cancel
    // 2: X/Square -> altAction
    // 3: Y/Triangle -> openRelations
    // 4: LB/L1 -> navUp
    // 5: RB/R1 -> navDown
    // 9: Start -> pause
    // D-Pad: 12(Up), 13(Down) -> navUp/navDown
    
    const mappings = [
      { id: 0, action: 'confirm' },
      { id: 1, action: 'cancel' },
      { id: 3, action: 'openRelations' },
      { id: 4, action: 'navUp' },
      { id: 5, action: 'navDown' },
      { id: 9, action: 'pause' },
      { id: 12, action: 'navUp' },
      { id: 13, action: 'navDown' }
    ];

    mappings.forEach(map => {
      const btn = gp.buttons[map.id];
      const isPressed = btn && (typeof btn === 'object' ? btn.pressed : btn > 0.5);
      
      if (isPressed && !this.lastButtons[map.id]) {
        this.trigger(map.action);
      }
      this.lastButtons[map.id] = isPressed;
    });

    // Axis support for Left Stick Y (axes[1]) and sometimes D-Pad (axes[9] or axes[5/7])
    // Standard left stick Y is gp.axes[1]. Up is negative, Down is positive.
    const axisY = gp.axes[1] || 0;
    
    // Some controllers map D-Pad to axes[9]. Up is -1 or -0.71, Down is 0.14 or 1.
    const axisDPad = (gp.axes.length > 9) ? gp.axes[9] : 0;
    // D-Pad Y can also be axes[7] in some bindings
    const axisDPadY2 = (gp.axes.length > 7) ? gp.axes[7] : 0;

    const axIsUp = axisY < -0.6 || axisDPad < -0.5 || axisDPadY2 < -0.5;
    const axIsDown = axisY > 0.6 || (axisDPad > 0.1 && axisDPad < 0.8 && axisDPad !== 0.14285714285714285) || axisDPadY2 > 0.5 || axisDPad === 1;

    if (axIsUp && !this.lastAxisUp) this.trigger('navUp');
    if (axIsDown && !this.lastAxisDown) this.trigger('navDown');
    
    this.lastAxisUp = axIsUp;
    this.lastAxisDown = axIsDown;

    requestAnimationFrame(() => this.poll());
  }
};
