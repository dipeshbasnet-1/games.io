/* SKY RUSH — js/coins.js*/

class CoinManager {
  constructor() {
    this.coins      = [];
    this.spawnTimer = 0;
    this.nextSpawn  = this._randomInterval();
  }

  reset() {
    this.coins      = [];
    this.spawnTimer = 0;
    this.nextSpawn  = this._randomInterval();
  }

// update
  update(worldSpeed, player) {
    // Move coins down the screen
    for (const coin of this.coins) {
      coin.y    += worldSpeed;
      coin.alpha = coin.collected ? coin.alpha - 0.12 : 1;
      
      // Magnet attraction
      if (player.magnet && !coin.collected) {
        const dx  = player.x  - coin.x;
        const dy  = (player.y - player.h / 2) - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.magnetRadius) {
          const speed = Math.min(12, 80 / dist);
          coin.x += (dx / dist) * speed;
          coin.y += (dy / dist) * speed;
        }
      }
    }

    // Remove off-screen or fully faded coins
    this.coins = this.coins.filter(c => c.y < CONSTANTS.CANVAS_HEIGHT + 20 && c.alpha > 0);

    // Spawn
    this.spawnTimer += worldSpeed;
    if (this.spawnTimer >= this.nextSpawn) {
      this._spawnRow();
      this.spawnTimer = 0;
      this.nextSpawn  = this._randomInterval();
    }
  }


  // SPAWN a row or arc of coins
  
  _spawnRow() {
    const C    = CONSTANTS;
    const type = Math.random();

    if (type < 0.5) {
      // Straight row in one lane
      this._spawnLine(Math.floor(Math.random() * C.LANE_COUNT));
    } else if (type < 0.8) {
      // Coins spread across all 3 lanes (one per lane)
      for (let lane = 0; lane < C.LANE_COUNT; lane++) {
        this._addCoin(C.LANE_POSITIONS[lane], -C.COIN_RADIUS);
      }
    } else {
      // Arc in the air (jump to collect)
      this._spawnArc();
    }
  }

  _spawnLine(lane) {
    const C   = CONSTANTS;
    const x   = C.LANE_POSITIONS[lane];
    const count = 4 + Math.floor(Math.random() * 4);  // 4–7 coins

    for (let i = 0; i < count; i++) {
      this._addCoin(x, -(i * C.COIN_ROW_GAP));
    }
  }

  _spawnArc() {
    const C    = CONSTANTS;
    const lane = Math.floor(Math.random() * C.LANE_COUNT);
    const x    = C.LANE_POSITIONS[lane];
    const count = 5;

    for (let i = 0; i < count; i++) {
      const t      = i / (count - 1);
      const arcY   = -(i * (C.COIN_ROW_GAP * 0.8));
      const arcOff = Math.sin(t * Math.PI) * 30; // arc sideways
      this._addCoin(x + arcOff, arcY);
    }
  }

  _addCoin(x, y) {
    this.coins.push({
      x,
      y,
      r:         CONSTANTS.COIN_RADIUS,
      collected: false,
      alpha:     1,
      glow:      0,      // glow pulse 0-1
      glowDir:   1,
    });
  }


   //  CHECK COLLECTION Returns number of coins collected
  collect(player) {
    const pb    = player.getBounds();
    let   count = 0;

    for (const coin of this.coins) {
      if (coin.collected) continue;

      // Circle–AABB collision
      const nearX = Math.max(pb.x, Math.min(coin.x, pb.x + pb.w));
      const nearY = Math.max(pb.y, Math.min(coin.y, pb.y + pb.h));
      const dx    = coin.x - nearX;
      const dy    = coin.y - nearY;

      if (dx * dx + dy * dy <= coin.r * coin.r) {
        coin.collected = true;
        count++;
      }
    }

    return count;
  }


//  RANDOM SPAWN INTERVAL (in px of world travel)
  _randomInterval() {
    return 200 + Math.random() * 300;
  }
}