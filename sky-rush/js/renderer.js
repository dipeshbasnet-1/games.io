/* =============================================
   SKY RUSH — js/renderer.js
   Renderer: all canvas drawing operations.
   Draws player, obstacles, coins, powerups,
   particles, and overlay effects.
   ============================================= */

class Renderer {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.particles = [];

    // Resize canvas to fixed game resolution
    canvas.width  = CONSTANTS.CANVAS_WIDTH;
    canvas.height = CONSTANTS.CANVAS_HEIGHT;
  }

  /* ──────────────────────────────────
     CLEAR frame
  ────────────────────────────────── */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /* ──────────────────────────────────
     DRAW PLAYER
  ────────────────────────────────── */
  drawPlayer(player) {
    const ctx = this.ctx;
    const { x, y, w, h, state, animFrame, hitFlash, shield } = player;

    ctx.save();

    // Flicker on hit
    if (hitFlash > 0 && Math.floor(hitFlash / 3) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    const cx = x;
    const by = y; // bottom y

    // ── Shield ring ──
    if (shield) {
      const shieldRadius = 38 + Math.sin(Date.now() / 200) * 4;
      const sg           = ctx.createRadialGradient(cx, by - h/2, shieldRadius * 0.4, cx, by - h/2, shieldRadius);
      sg.addColorStop(0, 'rgba(0,212,255,0.0)');
      sg.addColorStop(1, 'rgba(0,212,255,0.35)');
      ctx.beginPath();
      ctx.arc(cx, by - h / 2, shieldRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,0.8)';
      ctx.lineWidth   = 2.5;
      ctx.stroke();
      ctx.fillStyle   = sg;
      ctx.fill();
    }

    // ── Body shadow ──
    ctx.beginPath();
    ctx.ellipse(cx, by + 4, w * 0.4, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    if (state === 'slide') {
      this._drawSliding(ctx, cx, by, w, h, animFrame);
    } else if (state === 'jump') {
      this._drawJumping(ctx, cx, by, w, h, animFrame);
    } else {
      this._drawRunning(ctx, cx, by, w, h, animFrame);
    }

    // ── Magnet effect ──
    if (player.magnet) {
      ctx.beginPath();
      ctx.arc(cx, by - h / 2, player.magnetRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,0,255,${0.08 + 0.04 * Math.sin(Date.now() / 300)})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawRunning(ctx, cx, by, w, h, frame) {
    const legSwing = Math.sin(frame * Math.PI / 2) * 8;

    // Body
    this._playerBody(ctx, cx, by, w, h);

    // Legs running
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(cx - 6, by - 18);
    ctx.lineTo(cx - 6 + legSwing, by + 2);
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(cx + 6, by - 18);
    ctx.lineTo(cx + 6 - legSwing, by + 2);
    ctx.stroke();
  }

  _drawJumping(ctx, cx, by, w, h, frame) {
    this._playerBody(ctx, cx, by, w, h);

    // Legs tucked
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 8, by - 18);
    ctx.lineTo(cx - 12, by - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, by - 18);
    ctx.lineTo(cx + 12, by - 10);
    ctx.stroke();
  }

  _drawSliding(ctx, cx, by, w, h, frame) {
    const sh = h / 2;

    // Horizontal sliding body
    ctx.save();
    ctx.translate(cx, by - sh / 2);

    // Body elongated
    const grad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    grad.addColorStop(0, '#0080ff');
    grad.addColorStop(0.5, '#00d4ff');
    grad.addColorStop(1, '#0080ff');
    ctx.fillStyle = grad;
    this._roundRect(ctx, -w/2 - 8, -sh/2, w + 16, sh, 10);
    ctx.fill();

    // Visor
    ctx.fillStyle = 'rgba(0,20,40,0.8)';
    this._roundRect(ctx, -w/2, -sh/2 + 6, w * 0.55, sh * 0.45, 4);
    ctx.fill();

    ctx.restore();
  }

  _playerBody(ctx, cx, by, w, h) {
    // Body gradient
    const grad = ctx.createLinearGradient(cx - w/2, by - h, cx + w/2, by);
    grad.addColorStop(0, '#0040aa');
    grad.addColorStop(0.5, '#0080ff');
    grad.addColorStop(1, '#00d4ff');

    // Torso
    ctx.fillStyle = grad;
    this._roundRect(ctx, cx - w/2 + 4, by - h + 16, w - 8, h * 0.55, 8);
    ctx.fill();

    // Head
    ctx.fillStyle = '#0060cc';
    this._roundRect(ctx, cx - w/2 + 8, by - h, w - 16, 22, 6);
    ctx.fill();

    // Visor glow
    ctx.fillStyle = 'rgba(0,200,255,0.9)';
    this._roundRect(ctx, cx - w/2 + 10, by - h + 4, w - 20, 12, 3);
    ctx.fill();

    // Neon chest stripe
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(cx - w/2 + 6, by - h + 24, w - 12, 3);

    // Jetpack / backpack
    ctx.fillStyle = '#001833';
    ctx.fillRect(cx + w/2 - 8, by - h + 18, 10, 24);
    ctx.fillStyle = `rgba(0,255,136,${0.5 + 0.5 * Math.sin(Date.now()/150)})`;
    ctx.fillRect(cx + w/2 - 6, by - h + 36, 6, 6);
  }

  /* ──────────────────────────────────
     DRAW OBSTACLES
  ────────────────────────────────── */
  drawObstacles(obstacles) {
    const ctx = this.ctx;
    for (const obs of obstacles) {
      ctx.save();

      // Glow
      ctx.shadowColor = obs.color;
      ctx.shadowBlur  = 18;

      // Main body
      const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
      grad.addColorStop(0, obs.color + 'cc');
      grad.addColorStop(1, obs.color + '44');
      ctx.fillStyle = grad;
      this._roundRect(ctx, obs.x, obs.y, obs.w, obs.h, 6);
      ctx.fill();

      // Outline
      ctx.strokeStyle = obs.color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      ctx.shadowBlur  = 0;

      // Label emoji in center
      if (obs.label !== '—') {
        ctx.font      = `${Math.min(obs.w, obs.h) * 0.6}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(255,255,255,0.85)';
        ctx.fillText(obs.label, obs.x + obs.w / 2, obs.y + obs.h / 2);
      } else {
        // Bar obstacle — draw warning stripes
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < obs.w; i += 20) {
          ctx.fillRect(obs.x + i, obs.y, 10, obs.h);
        }
      }

      ctx.restore();
    }
  }

  /* ──────────────────────────────────
     DRAW COINS
  ────────────────────────────────── */
  drawCoins(coins) {
    const ctx = this.ctx;
    const t   = Date.now() / 600;

    for (const coin of coins) {
      ctx.save();
      ctx.globalAlpha = coin.alpha;

      // Glow
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur  = 12 + 6 * Math.sin(t + coin.x);

      // Coin circle
      const grad = ctx.createRadialGradient(coin.x - 2, coin.y - 2, 1, coin.x, coin.y, coin.r);
      grad.addColorStop(0, '#ffe066');
      grad.addColorStop(0.7, '#ffd700');
      grad.addColorStop(1, '#cc9900');

      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Shine
      ctx.beginPath();
      ctx.arc(coin.x - 2, coin.y - 2, coin.r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,200,0.6)';
      ctx.fill();

      ctx.restore();
    }
  }

  /* ──────────────────────────────────
     DRAW POWERUPS
  ────────────────────────────────── */
  drawPowerups(items) {
    const ctx = this.ctx;

    for (const item of items) {
      if (item.collected) continue;
      ctx.save();

      const cx = item.x + item.size / 2;
      const cy = item.y + item.size / 2;
      const r  = item.size / 2;
      const { color, emoji } = item.typeData;

      // Spinning glow ring
      ctx.translate(cx, cy);
      ctx.rotate(item.spin);

      ctx.shadowColor = color;
      ctx.shadowBlur  = 20;

      // Outer ring
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      grad.addColorStop(0, color + 'aa');
      grad.addColorStop(1, color + '22');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Emoji label
      ctx.rotate(-item.spin); // un-rotate text so it stays upright
      ctx.font         = `${item.size * 0.55}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'white';
      ctx.shadowBlur   = 0;
      ctx.fillText(emoji, 0, 0);

      ctx.restore();
    }
  }

  /* ──────────────────────────────────
     PARTICLES
  ────────────────────────────────── */
  spawnCoinParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      this.particles.push({
        x, y,
        vx:    Math.cos(angle) * (2 + Math.random() * 2),
        vy:    Math.sin(angle) * (2 + Math.random() * 2) - 2,
        life:  1,
        color: '#ffd700',
        size:  3 + Math.random() * 2,
      });
    }
  }

  spawnCrashParticles(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed - 3,
        life:  1,
        color: Math.random() < 0.5 ? '#ff2d78' : '#ff6600',
        size:  4 + Math.random() * 6,
      });
    }
  }

  updateAndDrawParticles() {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => p.life > 0);

    for (const p of this.particles) {
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += 0.2;
      p.life -= 0.04;

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ──────────────────────────────────
     SPEED BOOST overlay
  ────────────────────────────────── */
  drawSpeedLines(alpha = 0.15) {
    const ctx = this.ctx;
    const C   = CONSTANTS;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth   = 1;

    for (let i = 0; i < 12; i++) {
      const x  = Math.random() * C.CANVAS_WIDTH;
      const y  = Math.random() * C.CANVAS_HEIGHT;
      const len = 20 + Math.random() * 60;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + len);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ──────────────────────────────────
     SCREEN EDGE vignette
  ────────────────────────────────── */
  drawVignette() {
    const ctx = this.ctx;
    const C   = CONSTANTS;
    const rad = ctx.createRadialGradient(
      C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2, C.CANVAS_WIDTH * 0.3,
      C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT / 2, C.CANVAS_WIDTH * 0.8
    );
    rad.addColorStop(0, 'rgba(0,0,0,0)');
    rad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
  }

  /* ──────────────────────────────────
     POWERUP timer bars
  ────────────────────────────────── */
  drawPowerupBars(powerupMgr) {
    const ctx    = this.ctx;
    const C      = CONSTANTS;
    let   barY   = C.CANVAS_HEIGHT - 14;

    for (const type of C.POWERUP_TYPES) {
      const remaining = powerupMgr.getTimeLeft(type.id);
      if (remaining <= 0) continue;

      const pct = remaining / type.duration;
      const barW = 80;
      const barX = C.CANVAS_WIDTH / 2 - barW / 2;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this._roundRect(ctx, barX - 18, barY - 8, barW + 20, 10, 5);
      ctx.fill();

      ctx.fillStyle = type.color;
      ctx.shadowColor = type.color;
      ctx.shadowBlur  = 6;
      this._roundRect(ctx, barX, barY - 7, barW * pct, 8, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font         = '9px Rajdhani';
      ctx.fillStyle    = 'white';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(type.emoji, barX - 16, barY - 3);

      barY -= 14;
    }
  }

  /* ──────────────────────────────────
     HELPERS
  ────────────────────────────────── */
  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}