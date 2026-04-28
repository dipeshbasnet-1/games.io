/* =============================================
   SKY RUSH — js/powerups.js
   PowerupManager: spawns powerup items,
   applies effects to player when collected,
   and manages active powerup timers.
   ============================================= */

class PowerupManager {
  constructor() {
    this.items        = [];     // on-screen powerup objects
    this.activeTimers = {};     // { powerupId: framesRemaining }
    this.spawnTimer   = 0;
  }

  reset() {
    this.items        = [];
    this.activeTimers = {};
    this.spawnTimer   = 0;
  }

  /* ──────────────────────────────────
     UPDATE
  ────────────────────────────────── */
  update(worldSpeed, player) {
    // Move items
    for (const item of this.items) {
      item.y    += worldSpeed;
      item.spin += 0.06;
    }

    // Remove off-screen items
    this.items = this.items.filter(i => i.y < CONSTANTS.CANVAS_HEIGHT + 40 && !i.collected);

    // Spawn timer
    this.spawnTimer++;
    if (this.spawnTimer >= CONSTANTS.POWERUP_INTERVAL) {
      this._spawn();
      this.spawnTimer = 0;
    }

    // Tick active timers
    for (const id of Object.keys(this.activeTimers)) {
      this.activeTimers[id]--;
      if (this.activeTimers[id] <= 0) {
        this._deactivate(id, player);
        delete this.activeTimers[id];
      }
    }
  }

  /* ──────────────────────────────────
     COLLECT check vs player
  ────────────────────────────────── */
  collect(player) {
    const pb = player.getBounds();

    for (const item of this.items) {
      if (item.collected) continue;

      // Simple AABB
      const hit = pb.x < item.x + item.size
               && pb.x + pb.w > item.x
               && pb.y < item.y + item.size
               && pb.y + pb.h > item.y;

      if (hit) {
        item.collected = true;
        this._activate(item.typeData, player);
        return item.typeData;
      }
    }
    return null;
  }

  /* ──────────────────────────────────
     ACTIVATE a powerup effect
  ────────────────────────────────── */
  _activate(typeData, player) {
    const id  = typeData.id;
    // Reset or set timer
    this.activeTimers[id] = typeData.duration;

    switch (id) {
      case 'shield':
        player.shield = true;
        break;
      case 'magnet':
        player.magnet = true;
        break;
      case 'x2score':
        player.scoreMulti = 2;
        break;
      case 'boost':
        player.boosted = true;
        break;
    }
  }

  /* ──────────────────────────────────
     DEACTIVATE when timer expires
  ────────────────────────────────── */
  _deactivate(id, player) {
    switch (id) {
      case 'shield':
        player.shield = false;
        break;
      case 'magnet':
        player.magnet = false;
        break;
      case 'x2score':
        player.scoreMulti = 1;
        break;
      case 'boost':
        player.boosted = false;
        break;
    }
  }

  /* Consume shield (called on hit) */
  consumeShield(player) {
    player.shield = false;
    delete this.activeTimers['shield'];
    player.triggerHit();
  }

  /* ──────────────────────────────────
     SPAWN a random powerup item
  ────────────────────────────────── */
  _spawn() {
    const C        = CONSTANTS;
    const types    = C.POWERUP_TYPES;
    const typeData = types[Math.floor(Math.random() * types.length)];
    const lane     = Math.floor(Math.random() * C.LANE_COUNT);
    const size     = 36;

    this.items.push({
      typeData,
      x:         C.LANE_POSITIONS[lane] - size / 2,
      y:         -size,
      size,
      spin:      0,
      collected: false,
    });
  }

  /* ──────────────────────────────────
     Check if a specific powerup is active
  ────────────────────────────────── */
  isActive(id) {
    return (this.activeTimers[id] || 0) > 0;
  }

  getTimeLeft(id) {
    return this.activeTimers[id] || 0;
  }
}