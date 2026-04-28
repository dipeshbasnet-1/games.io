/* =============================================
   SKY RUSH — js/world.js
   WorldManager: generates the scrolling city
   background, stars, lane lines, and ground.
   All purely visual; no gameplay logic here.
   ============================================= */

class WorldManager {
  constructor() {
    this._buildStars();
    this._buildBuildings();
    this.groundOffset   = 0;
    this.bgOffset       = 0;
    this.laneGlowPhase  = 0;
  }

  reset() {
    this._buildStars();
    this._buildBuildings();
    this.groundOffset   = 0;
    this.bgOffset       = 0;
    this.laneGlowPhase  = 0;
  }

  /* ──────────────────────────────────
     Generate random stars
  ────────────────────────────────── */
  _buildStars() {
    this.stars = [];
    const C    = CONSTANTS;
    for (let i = 0; i < C.STAR_COUNT; i++) {
      this.stars.push({
        x:       Math.random() * C.CANVAS_WIDTH,
        y:       Math.random() * C.CANVAS_HEIGHT * 0.6,
        r:       Math.random() * 1.5 + 0.3,
        alpha:   Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        speed:   Math.random() * 0.02 + 0.005,
      });
    }
  }

  /* ──────────────────────────────────
     Generate random city silhouette buildings
  ────────────────────────────────── */
  _buildBuildings() {
    const C    = CONSTANTS;
    const W    = C.CANVAS_WIDTH;

    this.buildings = [];
    let x = 0;

    while (x < W * 3) {  // 3 screens wide for looping parallax
      const w = 30 + Math.random() * 60;
      const h = 60 + Math.random() * 180;
      const hasAntenna = Math.random() < 0.3;
      const color      = Math.random() < 0.5 ? '#0d1b3e' : '#111c40';

      this.buildings.push({
        x,
        y:   C.GROUND_Y - h,
        w,
        h,
        color,
        hasAntenna,
        // Random lit windows
        windows: this._randomWindows(w, h),
      });
      x += w + Math.random() * 12;
    }

    // Total width of one building "tile"
    this.bgTotalW = x;
  }

  _randomWindows(bw, bh) {
    const windows = [];
    const cols    = Math.floor(bw / 12);
    const rows    = Math.floor(bh / 14);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.45) {
          windows.push({
            cx: 6 + c * 12,
            cy: 6 + r * 14,
            lit: Math.random() < 0.5,
          });
        }
      }
    }
    return windows;
  }

  /* ──────────────────────────────────
     UPDATE each frame
  ────────────────────────────────── */
  update(worldSpeed) {
    const C = CONSTANTS;

    // Ground tiles scroll at full speed
    this.groundOffset = (this.groundOffset + worldSpeed) % 80;

    // Buildings scroll slower (parallax)
    this.bgOffset = (this.bgOffset + worldSpeed * C.SKYLINE_SPEED_MULTIPLIER) % (this.bgTotalW / 3);

    // Stars twinkle
    for (const star of this.stars) {
      star.twinkle += star.speed;
    }

    // Lane glow pulse
    this.laneGlowPhase += 0.04;
  }

  /* ──────────────────────────────────
     DRAW everything (called by renderer)
  ────────────────────────────────── */
  draw(ctx) {
    this._drawSky(ctx);
    this._drawStars(ctx);
    this._drawBuildings(ctx);
    this._drawGround(ctx);
    this._drawLanes(ctx);
  }

  /* ── Sky gradient ── */
  _drawSky(ctx) {
    const C  = CONSTANTS;
    const gd = ctx.createLinearGradient(0, 0, 0, C.GROUND_Y);
    gd.addColorStop(0,    '#020817');
    gd.addColorStop(0.5,  '#050a1a');
    gd.addColorStop(1,    '#0d1b3e');
    ctx.fillStyle = gd;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.GROUND_Y);
  }

  /* ── Stars ── */
  _drawStars(ctx) {
    for (const s of this.stars) {
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    }
  }

  /* ── City silhouette ── */
  _drawBuildings(ctx) {
    const C = CONSTANTS;
    ctx.save();
    ctx.translate(-this.bgOffset, 0);

    for (const b of this.buildings) {
      // Building body
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Windows
      for (const w of b.windows) {
        ctx.fillStyle = w.lit ? 'rgba(255,220,100,0.7)' : 'rgba(255,220,100,0.08)';
        ctx.fillRect(b.x + w.cx - 2, b.y + w.cy - 3, 5, 6);
      }

      // Antenna
      if (b.hasAntenna) {
        ctx.strokeStyle = b.color;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, b.y);
        ctx.lineTo(b.x + b.w / 2, b.y - 20);
        ctx.stroke();
        // Blinking light
        const blink = Math.sin(Date.now() / 600) > 0;
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y - 22, 2, 0, Math.PI * 2);
        ctx.fillStyle = blink ? '#ff2d78' : '#330010';
        ctx.fill();
      }

      // Neon sign on some buildings
      if (b.w > 50 && Math.random() < 0.003) {
        ctx.fillStyle = `hsla(${Math.random()*360},100%,70%,0.8)`;
        ctx.font      = '8px monospace';
        ctx.fillText('NEON', b.x + 4, b.y + b.h / 2);
      }
    }

    ctx.restore();
  }

  /* ── Scrolling ground ── */
  _drawGround(ctx) {
    const C  = CONSTANTS;
    const W  = C.CANVAS_WIDTH;
    const H  = C.CANVAS_HEIGHT;
    const gY = C.GROUND_Y;

    // Ground fill gradient
    const gd = ctx.createLinearGradient(0, gY, 0, H);
    gd.addColorStop(0, '#0a1020');
    gd.addColorStop(1, '#050a1a');
    ctx.fillStyle = gd;
    ctx.fillRect(0, gY, W, H - gY);

    // Horizontal ground lines (simulate perspective tiles)
    for (let i = 0; i < 10; i++) {
      const y = gY + ((i * 14 + this.groundOffset) % (H - gY));
      ctx.strokeStyle = `rgba(0,212,255,${0.08 - i * 0.005})`;
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  /* ── Lane divider lines ── */
  _drawLanes(ctx) {
    const C       = CONSTANTS;
    const lanePos = C.LANE_POSITIONS;
    const glow    = 0.3 + 0.15 * Math.sin(this.laneGlowPhase);

    // Draw 2 dividers (between the 3 lanes)
    const dividers = [
      (lanePos[0] + lanePos[1]) / 2,
      (lanePos[1] + lanePos[2]) / 2,
    ];

    for (const dx of dividers) {
      const grad = ctx.createLinearGradient(dx, 0, dx, C.CANVAS_HEIGHT);
      grad.addColorStop(0,   `rgba(0,212,255,0)`);
      grad.addColorStop(0.3, `rgba(0,212,255,${glow})`);
      grad.addColorStop(0.8, `rgba(0,212,255,${glow})`);
      grad.addColorStop(1,   `rgba(0,212,255,0)`);

      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1;
      ctx.setLineDash([12, 18]);
      ctx.lineDashOffset = -this.groundOffset * 1.5;
      ctx.beginPath();
      ctx.moveTo(dx, 0);
      ctx.lineTo(dx, C.CANVAS_HEIGHT);
      ctx.stroke();
    }

    ctx.setLineDash([]); // reset dash
  }
}