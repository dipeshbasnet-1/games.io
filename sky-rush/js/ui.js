/* =============================================
   SKY RUSH — js/ui.js
   UIManager: controls DOM screens, HUD updates,
   score display, and screen transitions.
   ============================================= */

class UIManager {
  constructor() {
    // Screens
    this.startScreen    = document.getElementById('start-screen');
    this.gameScreen     = document.getElementById('game-screen');
    this.pauseScreen    = document.getElementById('pause-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');

    // HUD elements
    this.scoreDisplay  = document.getElementById('score-display');
    this.coinDisplay   = document.getElementById('coin-display');
    this.speedDisplay  = document.getElementById('speed-display');
    this.shieldIcon    = document.getElementById('shield-indicator');
    this.magnetIcon    = document.getElementById('magnet-indicator');

    // Game over elements
    this.finalScore    = document.getElementById('final-score');
    this.finalCoins    = document.getElementById('final-coins');
    this.finalBest     = document.getElementById('final-best');

    // Start screen best
    this.displayBest   = document.getElementById('display-best');

    // Pause button
    this.btnPause      = document.getElementById('btn-pause');
  }

  /* ──────────────────────────────────
     SHOW SCREENS
  ────────────────────────────────── */
  showStart() {
    this._show(this.startScreen);
    this._hide(this.gameScreen);
    this._hide(this.pauseScreen);
    this._hide(this.gameoverScreen);
    this.btnPause.style.display = 'none';

    // Refresh best score on start
    const best = localStorage.getItem(CONSTANTS.LS_BEST_KEY) || 0;
    this.displayBest.textContent = best;
  }

  showGame() {
    this._hide(this.startScreen);
    this._show(this.gameScreen);
    this._hide(this.pauseScreen);
    this._hide(this.gameoverScreen);
    this.btnPause.style.display = 'block';
  }

  showPause() {
    this._show(this.pauseScreen);
    this.pauseScreen.classList.remove('hidden');
  }

  hidePause() {
    this._hide(this.pauseScreen);
  }

  showGameOver(score, coins, best) {
    this._show(this.gameoverScreen);
    this.gameoverScreen.classList.remove('hidden');
    this.finalScore.textContent = score;
    this.finalCoins.textContent = coins;
    this.finalBest.textContent  = best;
    this.btnPause.style.display = 'none';
  }

  /* ──────────────────────────────────
     HUD UPDATES
  ────────────────────────────────── */
  updateScore(score) {
    this.scoreDisplay.textContent = score;
  }

  updateCoins(coins) {
    this.coinDisplay.textContent = `🪙 ${coins}`;
  }

  updateSpeed(speed) {
    this.speedDisplay.textContent = `${speed.toFixed(1)}x`;
  }

  updatePowerupIcons(player) {
    this.shieldIcon.classList.toggle('hidden', !player.shield);
    this.magnetIcon.classList.toggle('hidden', !player.magnet);
  }

  /* Coin collected flash */
  coinFlash() {
    this.coinDisplay.classList.remove('score-pop');
    void this.coinDisplay.offsetWidth; // reflow
    this.coinDisplay.classList.add('score-pop');
  }

  /* ──────────────────────────────────
     DANGER flash on canvas wrapper
  ────────────────────────────────── */
  triggerDanger() {
    const gs = this.gameScreen;
    gs.classList.remove('danger-flash');
    void gs.offsetWidth;
    gs.classList.add('danger-flash');
    setTimeout(() => gs.classList.remove('danger-flash'), 800);
  }

  /* ──────────────────────────────────
     BEST SCORE — save & retrieve
  ────────────────────────────────── */
  saveBestScore(score) {
    const current = parseInt(localStorage.getItem(CONSTANTS.LS_BEST_KEY) || '0', 10);
    if (score > current) {
      localStorage.setItem(CONSTANTS.LS_BEST_KEY, score);
      return score;
    }
    return current;
  }

  getBestScore() {
    return parseInt(localStorage.getItem(CONSTANTS.LS_BEST_KEY) || '0', 10);
  }

  /* ──────────────────────────────────
     HELPERS
  ────────────────────────────────── */
  _show(el) { el.classList.add('active'); el.classList.remove('hidden'); }
  _hide(el) { el.classList.remove('active'); el.classList.add('hidden'); }
}