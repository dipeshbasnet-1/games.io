/* =============================================
   SKY RUSH — js/input.js
   InputHandler: keyboard + touch/swipe controls.
   Dispatches game actions via callbacks.
   ============================================= */

class InputHandler {
  constructor() {
    this.keys     = {};
    this.actions  = {
      left:  false,
      right: false,
      up:    false,
      down:  false,
      pause: false,
    };

    // Touch tracking
    this._touchStartX = null;
    this._touchStartY = null;
    this._touchStartT = null;

    // Callbacks set by game.js
    this.onLeft   = null;
    this.onRight  = null;
    this.onJump   = null;
    this.onSlide  = null;
    this.onPause  = null;

    this._bindKeyboard();
    this._bindTouch();
  }

  /* ──────────────────────────────────
     KEYBOARD
  ────────────────────────────────── */
  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (this.keys[e.code]) return; // prevent key repeat
      this.keys[e.code] = true;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.onLeft?.();
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.onRight?.();
          break;

        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          this.onJump?.();
          break;

        case 'ArrowDown':
        case 'KeyS':
          this.onSlide?.();
          break;

        case 'Escape':
        case 'KeyP':
          this.onPause?.();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  /* ──────────────────────────────────
     TOUCH / SWIPE
  ────────────────────────────────── */
  _bindTouch() {
    const canvas = document.getElementById('game-canvas');

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this._touchStartX = t.clientX;
      this._touchStartY = t.clientY;
      this._touchStartT = Date.now();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this._touchStartX === null) return;

      const t    = e.changedTouches[0];
      const dx   = t.clientX - this._touchStartX;
      const dy   = t.clientY - this._touchStartY;
      const dt   = Date.now() - this._touchStartT;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Tap = short distance, short time → jump
      if (dist < 20 && dt < 200) {
        this.onJump?.();
        return;
      }

      // Swipe threshold
      if (dist < 30) return;

      // Determine swipe direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal
        if (dx < 0) this.onLeft?.();
        else        this.onRight?.();
      } else {
        // Vertical
        if (dy < 0) this.onJump?.();
        else        this.onSlide?.();
      }

      this._touchStartX = null;
      this._touchStartY = null;
    }, { passive: false });
  }

  /* ──────────────────────────────────
     RESET (called on new game)
  ────────────────────────────────── */
  reset() {
    this.keys    = {};
    this.actions = { left: false, right: false, up: false, down: false, pause: false };
  }
}