/* =============================================
   SKY RUSH — js/player.js
   Player class: position, lanes, jump, slide,
   animation states, collision box.
   ============================================= */

class Player {
  constructor() {
    this.reset();
  }

  reset() {
    const C = CONSTANTS;

    // Lane: 0 = left, 1 = center, 2 = right
    this.lane        = 1;
    this.targetLane  = 1;

    // X is interpolated for smooth switching
    this.x           = C.LANE_POSITIONS[1];
    this.targetX     = C.LANE_POSITIONS[1];
    this.laneTimer   = 0;

    // Y / Jumping
    this.y           = C.PLAYER_Y;
    this.vy          = 0;               // vertical velocity
    this.onGround    = true;
    this.jumpCount   = 0;               // allow 1 double-jump
    this.maxJumps    = 2;

    // Sliding
    this.isSliding   = false;
    this.slideTimer  = 0;

    // Visual state: 'run' | 'jump' | 'slide' | 'hit'
    this.state       = 'run';

    // Animation frame counter
    this.animFrame   = 0;
    this.animTimer   = 0;

    // Dimensions (change when sliding)
    this.w           = C.PLAYER_WIDTH;
    this.h           = C.PLAYER_HEIGHT;

    // Powerups active on player
    this.shield      = false;
    this.magnet      = false;
    this.scoreMulti  = 1;
    this.boosted     = false;

    // Hit flash
    this.hitFlash    = 0;

    // Coin magnet pull radius
    this.magnetRadius = 80;
  }

  /* ──────────────────────────────────
     LANE SWITCHING
  ────────────────────────────────── */
  moveLeft() {
    if (this.targetLane > 0) {
      this.targetLane--;
      this.targetX = CONSTANTS.LANE_POSITIONS[this.targetLane];
      this.laneTimer = CONSTANTS.LANE_SWITCH_SPEED;
    }
  }

  moveRight() {
    if (this.targetLane < CONSTANTS.LANE_COUNT - 1) {
      this.targetLane++;
      this.targetX = CONSTANTS.LANE_POSITIONS[this.targetLane];
      this.laneTimer = CONSTANTS.LANE_SWITCH_SPEED;
    }
  }

  /* ──────────────────────────────────
     JUMPING
  ────────────────────────────────── */
  jump() {
    if (this.jumpCount < this.maxJumps) {
      this.vy         = CONSTANTS.JUMP_FORCE;
      this.onGround   = false;
      this.isSliding  = false;
      this.slideTimer = 0;
      this.jumpCount++;
      this.state = 'jump';
    }
  }

  /* ──────────────────────────────────
     SLIDING
  ────────────────────────────────── */
  slide() {
    if (this.onGround && !this.isSliding) {
      this.isSliding  = true;
      this.slideTimer = CONSTANTS.SLIDE_DURATION;
      this.state      = 'slide';
    }
  }

  /* ──────────────────────────────────
     UPDATE (called every frame)
  ────────────────────────────────── */
  update() {
    const C = CONSTANTS;

    // ── Smooth lane movement ──
    if (this.laneTimer > 0) {
      const t = 1 - (this.laneTimer / C.LANE_SWITCH_SPEED);
      const ease = this._easeInOut(t);
      this.x = this._lerp(this.x, this.targetX, 0.2);
      this.laneTimer--;
    } else {
      this.x = this.targetX;
      this.lane = this.targetLane;
    }

    // ── Gravity & vertical movement ──
    if (!this.onGround) {
      this.vy += C.GRAVITY;
      this.y  += this.vy;

      if (this.y >= C.PLAYER_Y) {
        this.y        = C.PLAYER_Y;
        this.vy       = 0;
        this.onGround = true;
        this.jumpCount = 0;
        if (!this.isSliding) this.state = 'run';
      }
    }

    // ── Slide timer ──
    if (this.isSliding) {
      this.slideTimer--;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.state     = this.onGround ? 'run' : 'jump';
      }
    }

    // ── Hitbox dimensions ──
    if (this.isSliding) {
      this.w = C.PLAYER_WIDTH  + 16;
      this.h = C.PLAYER_HEIGHT / 2;
    } else {
      this.w = C.PLAYER_WIDTH;
      this.h = C.PLAYER_HEIGHT;
    }

    // ── Animation timer ──
    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // ── Hit flash countdown ──
    if (this.hitFlash > 0) this.hitFlash--;
  }

  /* ──────────────────────────────────
     COLLISION BOX (AABB)
  ────────────────────────────────── */
  getBounds() {
    const margin = 8; // shrink hitbox slightly for fairness
    const bx = this.x - this.w / 2 + margin;
    const by = this.y - this.h + margin;
    const bw = this.w - margin * 2;
    const bh = this.h - margin;
    return { x: bx, y: by, w: bw, h: bh };
  }

  /* ──────────────────────────────────
     HELPERS
  ────────────────────────────────── */
  _lerp(a, b, t)        { return a + (b - a) * t; }
  _easeInOut(t)         { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  /* Trigger hit flash (called by game.js) */
  triggerHit() {
    this.hitFlash = 20;
  }
}