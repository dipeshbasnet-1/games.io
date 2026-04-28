

class Game {
  constructor() {
    // Subsystem setup 
    const canvas   = document.getElementById('game-canvas');
    this.renderer  = new Renderer(canvas);
    this.world     = new WorldManager();
    this.player    = new Player();
    this.obstacles = new ObstacleManager();
    this.coins     = new CoinManager();
    this.powerups  = new PowerupManager();
    this.input     = new InputHandler();
    this.ui        = new UIManager();

    // Game state 
    this.state     = 'menu';
    this.score     = 0;
    this.coinCount = 0;
    this.worldSpeed = CONSTANTS.INITIAL_SPEED;

    //  RAF handle 
    this._rafId    = null;

    // Wire input callbacks 
    this.input.onLeft  = () => { if (this.state === 'playing') this.player.moveLeft();  };
    this.input.onRight = () => { if (this.state === 'playing') this.player.moveRight(); };
    this.input.onJump  = () => { if (this.state === 'playing') this.player.jump();      };
    this.input.onSlide = () => { if (this.state === 'playing') this.player.slide();     };
    this.input.onPause = () => { if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();        };

    //  Wire UI buttons 
    document.getElementById('btn-start').addEventListener('click', () => this.startGame());
    document.getElementById('btn-pause').addEventListener('click', () => this.pause());
    document.getElementById('btn-resume').addEventListener('click', () => this.resume());
    document.getElementById('btn-quit').addEventListener('click',   () => this.goHome());
    document.getElementById('btn-restart').addEventListener('click',() => this.startGame());
    document.getElementById('btn-home').addEventListener('click',   () => this.goHome());

    // Show start screen
    this.ui.showStart();

    // Run a "demo" background scroll on menu
    this._menuLoop();
  }


    // MENU idle loop (background animates)
    _menuLoop() {
    if (this.state !== 'menu') return;
    this.world.update(2);
    this.renderer.clear();
    this.world.draw(this.renderer.ctx);
    this.renderer.drawVignette();
    this._rafId = requestAnimationFrame(() => this._menuLoop());
  }


  // START GAME

  startGame() {
    cancelAnimationFrame(this._rafId);

    // Reset all subsystems
    this.player.reset();
    this.obstacles.reset();
    this.coins.reset();
    this.powerups.reset();
    this.world.reset();

    this.score      = 0;
    this.coinCount  = 0;
    this.worldSpeed = CONSTANTS.INITIAL_SPEED;
    this.state      = 'playing';

    this.ui.showGame();
    this.ui.updateScore(0);
    this.ui.updateCoins(0);

    this._loop();
  }


    // MAIN GAME LOOP
  _loop() {
    if (this.state !== 'playing') return;
    this._rafId = requestAnimationFrame(() => this._loop());

    this._update();
    this._draw();
  }

  // UPDATE
  _update() {
    const C = CONSTANTS;

    // Speed ramp 
    this.worldSpeed = Math.min(
      C.MAX_SPEED,
      C.INITIAL_SPEED + this.score * C.SPEED_INCREMENT
    );

    // If player has speed boost powerup, add extra
    const speed = this.player.boosted ? this.worldSpeed * 1.4 : this.worldSpeed;

    // ── World scrolls ──
    this.world.update(speed);

    // ── Player moves ──
    this.player.update();

    // ── Obstacles ──
    this.obstacles.update(speed);

    // ── Coins ──
    const coinsCollected = this.coins.collect(this.player);
    if (coinsCollected > 0) {
      this.coinCount += coinsCollected * this.player.scoreMulti;
      this.score     += coinsCollected * 50 * this.player.scoreMulti;
      this.ui.updateCoins(this.coinCount);
      this.ui.coinFlash();

      // Spawn coin particles at player position
      this.renderer.spawnCoinParticles(this.player.x, this.player.y - this.player.h / 2);
    }
    this.coins.update(speed, this.player);

    // ── Powerups ──
    const pickedUp = this.powerups.collect(this.player);
    if (pickedUp) {
      this.score += 200;
    }
    this.powerups.update(speed, this.player);

    // ── Score from distance ──
    this.score += C.SCORE_PER_FRAME * this.player.scoreMulti;

    // ── HUD updates ──
    this.ui.updateScore(Math.floor(this.score));
    this.ui.updateSpeed(this.worldSpeed);
    this.ui.updatePowerupIcons(this.player);

    // ── Collision detection ──
    const hit = this.obstacles.checkCollision(this.player);
    if (hit) {
      if (this.player.shield) {
        // Shield absorbs one hit
        this.powerups.consumeShield(this.player);
        this.ui.triggerDanger();
      } else {
        this._die();
      }
    }
  }

  /* ──────────────────────────────────
    // DRAW
  ────────────────────────────────── */
  _draw() {
    const r = this.renderer;

    r.clear();
    this.world.draw(r.ctx);

    r.drawObstacles(this.obstacles.obstacles);
    r.drawCoins(this.coins.coins);
    r.drawPowerups(this.powerups.items);
    r.drawPlayer(this.player);
    r.updateAndDrawParticles();
    r.drawPowerupBars(this.powerups);

    // Speed lines when boosted
    if (this.player.boosted) {
      r.drawSpeedLines(0.2);
    } else if (this.worldSpeed > 8) {
      r.drawSpeedLines(0.08);
    }

    r.drawVignette();
  }

  /* ──────────────────────────────────
     // PLAYER DIES
  ────────────────────────────────── */
  _die() {
    this.state = 'dead';
    cancelAnimationFrame(this._rafId);

    // Crash particles
    this.renderer.spawnCrashParticles(this.player.x, this.player.y - this.player.h / 2);
    this.player.triggerHit();

    // Draw one last frame with particles
    this._draw();
    this.renderer.updateAndDrawParticles();

    // Save best score
    const best = this.ui.saveBestScore(Math.floor(this.score));

    // Show game over after a brief delay
    setTimeout(() => {
      this.ui.showGameOver(Math.floor(this.score), this.coinCount, best);
    }, 700);
  }

  /* ──────────────────────────────────
    // PAUSE / RESUME
  ────────────────────────────────── */
  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    cancelAnimationFrame(this._rafId);
    this.ui.showPause();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.hidePause();
    this._loop();
  }

  /* ──────────────────────────────────
     GO HOME (back to menu)
  ────────────────────────────────── */
  goHome() {
    cancelAnimationFrame(this._rafId);
    this.state = 'menu';
    this.ui.showStart();
    this._menuLoop();
  }
}

/* ──────────────────────────────────
   BOOT — wait for DOM then start
────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});