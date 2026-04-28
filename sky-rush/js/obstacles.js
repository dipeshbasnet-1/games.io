/* =============================================
   SKY RUSH — js/obstacles.js
   ObstacleManager: spawns, updates, and stores
   all obstacles. Also decides which lanes to fill.
   ============================================= */

class ObstacleManager {
  constructor() {
    this.obstacles    = [];
    this.spawnTimer   = 0;
    this.nextSpawnGap = this._randomGap();
  }

  reset() {
    this.obstacles    = [];
    this.spawnTimer   = 0;
    this.nextSpawnGap = this._randomGap();
  }

  /* ──────────────────────────────────
     UPDATE — move + spawn
  ────────────────────────────────── */
  update(worldSpeed) {
    // Move existing obstacles toward player
    for (const obs of this.obstacles) {
      obs.y += worldSpeed;
    }

    // Remove obstacles that scrolled past the screen
    this.obstacles = this.obstacles.filter(o => o.y < CONSTANTS.CANVAS_HEIGHT + 100);

    // Spawn logic
    this.spawnTimer += worldSpeed;
    if (this.spawnTimer >= this.nextSpawnGap) {
      this._spawn();
      this.spawnTimer   = 0;
      this.nextSpawnGap = this._randomGap();
    }
  }

  /* ──────────────────────────────────
     SPAWN a new obstacle group
  ────────────────────────────────── */
  _spawn() {
    const C     = CONSTANTS;
    const types = C.OBSTACLE_TYPES;

    // Pick a random obstacle type
    const type  = types[Math.floor(Math.random() * types.length)];

    // How many lanes to block (1 or 2; never all 3)
    const blockCount = Math.random() < 0.3 ? 2 : 1;

    // Which lanes to block
    const lanes      = this._pickLanes(blockCount);

    for (const lane of lanes) {
      const xCenter = C.LANE_POSITIONS[lane];

      // Wide obstacles (low_bar / high_bar) span all chosen lanes as one big rect
      if (type.id === 'low_bar' || type.id === 'high_bar') {
        // Only add once for multi-lane; we handle width differently
        if (lane === lanes[0]) {
          const totalW  = lanes.length === 1 ? type.w : type.w * 1.6;
          const centerX = lanes.length > 1
            ? (C.LANE_POSITIONS[lanes[0]] + C.LANE_POSITIONS[lanes[lanes.length-1]]) / 2
            : xCenter;

          this.obstacles.push({
            type: type.id,
            x:    centerX - totalW / 2,
            y:    -type.h,
            w:    totalW,
            h:    type.h,
            color: type.color,
            label: type.label,
            // For jump/slide logic
            mustSlide: type.id === 'low_bar',
            mustJump:  type.id === 'high_bar',
            // Store lane info for collision
            lanes,
          });
        }
      } else {
        // Normal obstacles per lane
        this.obstacles.push({
          type:  type.id,
          x:     xCenter - type.w / 2,
          y:     -type.h,
          w:     type.w,
          h:     type.h,
          color: type.color,
          label: type.label,
          mustSlide: false,
          mustJump:  false,
          lanes: [lane],
        });
      }
    }
  }

  /* ──────────────────────────────────
     Pick which lanes to block
  ────────────────────────────────── */
  _pickLanes(count) {
    const all    = [0, 1, 2];
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).sort();
  }

  /* ──────────────────────────────────
     COLLISION CHECK vs player
     Returns the obstacle hit, or null
  ────────────────────────────────── */
  checkCollision(player) {
    const pb = player.getBounds();

    for (const obs of this.obstacles) {
      // Only check obstacles near the player vertically
      if (obs.y + obs.h < pb.y - 20) continue; // above player
      if (obs.y > pb.y + pb.h + 20)  continue; // below player

      // Broad AABB check
      const hit = pb.x < obs.x + obs.w
               && pb.x + pb.w > obs.x
               && pb.y < obs.y + obs.h
               && pb.y + pb.h > obs.y;

      if (hit) {
        // If player is sliding and obstacle requires slide → no hit
        if (obs.mustSlide && player.isSliding) continue;
        // If player is jumping over high bar (above it) → no hit
        if (obs.mustJump && pb.y + pb.h < obs.y + obs.h * 0.6) continue;

        return obs;
      }
    }
    return null;
  }

  /* ──────────────────────────────────
     Random gap in px between obstacles
  ────────────────────────────────── */
  _randomGap() {
    const { OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP } = CONSTANTS;
    return OBSTACLE_MIN_GAP + Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP);
  }
}