

const CONSTANTS = {

  //  Canvas 
  CANVAS_WIDTH:  480,
  CANVAS_HEIGHT: 560,

  // Lanes 
  // 3 lanes: left, center, right
  LANE_COUNT:   3,
  LANE_POSITIONS: [120, 240, 360],  // X centers for each lane

  //  Player 
  PLAYER_WIDTH:  48,
  PLAYER_HEIGHT: 64,
  PLAYER_Y:      420,          // Vertical position (feet)
  JUMP_FORCE:    -16,          // Negative = upward
  GRAVITY:       0.7,
  SLIDE_DURATION: 55,          // Frames the player stays sliding
  LANE_SWITCH_SPEED: 18,       // Frames to complete a lane switch

  //  Speed 
  INITIAL_SPEED:   4,          // World scroll speed (px/frame)
  MAX_SPEED:       12,
  SPEED_INCREMENT: 0.0015,     // Speed added per frame

  //  Obstacles 
  OBSTACLE_MIN_GAP:  280,      // Min pixels between obstacles
  OBSTACLE_MAX_GAP:  520,
  OBSTACLE_TYPES: [
    { id: 'barrier',  w: 48,  h: 52, color: '#ff2d78', label: '🚧' },
    { id: 'traffic',  w: 52,  h: 72, color: '#ff6b00', label: '🚌' },
    { id: 'crate',    w: 44,  h: 44, color: '#8b4513', label: '📦' },
    { id: 'low_bar',  w: 120, h: 24, color: '#aa00ff', label: '—' }, // must slide
    { id: 'high_bar', w: 120, h: 24, color: '#0088ff', label: '—' }, // must jump
  ],

  //  Coins 
  COIN_RADIUS:   10,
  COIN_ROW_GAP:  60,           // Space between coins in a row
  COIN_VALUE:    1,

  // Powerups 
  POWERUP_TYPES: [
    { id: 'shield',  emoji: '🛡️',  color: '#00d4ff', duration: 300 },
    { id: 'magnet',  emoji: '🧲',  color: '#ff00ff', duration: 240 },
    { id: 'x2score', emoji: '✖️2', color: '#ffd700', duration: 200 },
    { id: 'boost',   emoji: '⚡',  color: '#00ff88', duration: 120 },
  ],
  POWERUP_INTERVAL: 600,        // Frames between powerup spawns

  // World / Background 
  GROUND_Y:     500,
  SKYLINE_SPEED_MULTIPLIER: 0.3,  // Parallax factor for bg buildings
  STAR_COUNT:   80,

  // Scoring
  SCORE_PER_FRAME: 1,
  SCORE_MULTIPLIER_DEFAULT: 1,

  // Local Storage key 
  LS_BEST_KEY: 'skyrush_best',
};

// Freeze so constants can't be mutated at runtime
Object.freeze(CONSTANTS);