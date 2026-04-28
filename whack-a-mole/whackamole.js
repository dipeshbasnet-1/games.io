/* Whack-a-Mole
 * Features: 9 holes, combo multiplier, golden moles (5x points),
 *           difficulty modes, miss tracking, speed increases over time,
 *           score popups, best score, 30s/45s timer
 */

// Constants
const HOLE_COUNT = 9;
const MOLE_HTML  = `
  <div class="mole">
    <div class="mole-body">
      <div class="mole-eyes">
        <div class="eye"></div>
        <div class="eye"></div>
      </div>
      <div class="mole-nose"></div>
      <div class="mole-mouth"></div>
    </div>
  </div>
`;

// Difficulty presets 
const DIFFICULTIES = {
  easy:   { minUp: 1400, maxUp: 2200, minInterval: 900,  maxInterval: 1600 },
  normal: { minUp: 900,  maxUp: 1500, minInterval: 600,  maxInterval: 1100 },
  hard:   { minUp: 500,  maxUp: 900,  minInterval: 350,  maxInterval: 700  },
};

// State 
let score    = 0;
let best     = 0;
let misses   = 0;
let combo    = 1;
let comboMax = 1;
let timeLeft = 30;
let totalTime = 30;
let running  = false;
let diff     = 'normal';
let holeTimers = [];
let tickInterval = null;
let moleTimers   = [];

// Build grid 
function buildGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (let i = 0; i < HOLE_COUNT; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.dataset.i  = i;
    hole.innerHTML  = MOLE_HTML;
    
    hole.addEventListener('click',      e => handleWhack(hole, e));
    hole.addEventListener('touchstart', e => { e.preventDefault(); handleWhack(hole, e.changedTouches[0]); }, { passive: false });
    
    grid.appendChild(hole);
  }
}

// Start Game
function startGame() {
  if (running) return;
  running  = true;
  score    = 0;
  misses   = 0;
  combo    = 1;
  comboMax = 1;
  const cfg = getDiffConfig();
  timeLeft  = +document.querySelector('.diff-btn.active').dataset.time;
  totalTime = timeLeft;

  updateHUD();
  hideResult();
  hideMoles();
  document.getElementById('start-btn').textContent = '⏹ Running…';
  document.getElementById('start-btn').disabled    = true;

  // Timer tick
  tickInterval = setInterval(() => {
    timeLeft -= 0.1;
    updateTimer();
    if (timeLeft <= 0) endGame();
  }, 100);

  scheduleMoles();
}

// Schedule moles 
function scheduleMoles() {
  if (!running) return;
  showRandomMole();
  const cfg      = getDiffConfig();
  const elapsed  = totalTime - timeLeft;
  const speedFactor = Math.max(0.5, 1 - elapsed / totalTime * 0.5);
  const interval = lerp(cfg.minInterval, cfg.maxInterval, Math.random()) * speedFactor;
  const t = setTimeout(scheduleMoles, interval);
  moleTimers.push(t);
}

function showRandomMole() {
  const holes = document.querySelectorAll('.hole');
  // Pick a hole that is NOT currently showing a mole
  const available = [...holes].filter(h => !h.dataset.active);
  if (!available.length) return;
  const hole = available[Math.floor(Math.random() * available.length)];

  // Golden mole: 15% chance
  const isGolden = Math.random() < 0.15;
  hole.classList.toggle('golden', isGolden);
  hole.dataset.active  = '1';
  hole.dataset.golden  = isGolden ? '1' : '';

  const mole = hole.querySelector('.mole');
  mole.classList.add('up');
  mole.classList.remove('whacked');

  const cfg      = getDiffConfig();
  const elapsed  = totalTime - timeLeft;
  const speedFactor = Math.max(0.55, 1 - elapsed / totalTime * 0.45);
  const upTime   = lerp(cfg.minUp, cfg.maxUp, Math.random()) * speedFactor;

  const t = setTimeout(() => {
    if (hole.dataset.active) {
      // Mole escaped — break combo
      hideMole(hole);
      combo = 1;
      updateHUD();
    }
  }, upTime);
  holeTimers.push(t);
}

// Whack! 
function handleWhack(hole, event) {
  if (!running) return;
  if (!hole.dataset.active) {
    // Missed — hit empty hole
    misses++;
    combo = 1;
    document.getElementById('misses').textContent = misses;
    updateHUD();
    showFloatingText(event.clientX, event.clientY, 'Miss!', '#f87171');
    return;
  }

  const isGolden = hole.dataset.golden === '1';
  const pts      = isGolden ? 50 * combo : 10 * combo;

  score += pts;
  combo  = Math.min(combo + 1, 10);
  if (combo > comboMax) comboMax = combo;

  // Visual feedback
  const mole = hole.querySelector('.mole');
  mole.classList.add('whacked');
  showFloatingText(event.clientX, event.clientY, `+${pts}`, isGolden ? '#ffd700' : '#4ade80');
  if (combo > 2) showComboText(event.clientX, event.clientY, `${combo}x COMBO!`);

  setTimeout(() => hideMole(hole), 180);

  if (score > best) best = score;
  updateHUD();
}

function hideMole(hole) {
  const mole = hole.querySelector('.mole');
  mole.classList.remove('up', 'whacked');
  hole.classList.remove('golden');
  delete hole.dataset.active;
  delete hole.dataset.golden;
}

function hideMoles() {
  document.querySelectorAll('.hole').forEach(h => {
    hideMole(h);
  });
}

// End game
function endGame() {
  running = false;
  clearInterval(tickInterval);
  moleTimers.forEach(clearTimeout);
  holeTimers.forEach(clearTimeout);
  moleTimers = [];
  holeTimers = [];
  hideMoles();

  setTimeout(() => {
    const grade =
      score >= 500 ? 'S 🏆' :
      score >= 300 ? 'A ⭐' :
      score >= 150 ? 'B 👍' :
      score >= 50  ? 'C 😊' : 'D 😢';

    showResult(
      `Time's up! Score: ${score} pts | Best combo: x${comboMax} | Misses: ${misses} | Grade: ${grade}`
    );
    document.getElementById('start-btn').textContent = '▶ Play Again';
    document.getElementById('start-btn').disabled    = false;
    document.getElementById('timer-fill').style.width = '0%';
    document.getElementById('timer-text').textContent = '0s';
  }, 400);
}

// Hud
function updateHUD() {
  document.getElementById('score').textContent  = score;
  document.getElementById('best').textContent   = best;
  document.getElementById('misses').textContent = misses;
  const comboEl = document.getElementById('combo');
  comboEl.textContent = `x${combo}`;
  comboEl.style.color = combo >= 5 ? '#f0883e' : combo >= 3 ? '#ffd700' : '#fff';
}

function updateTimer() {
  const pct  = Math.max(0, timeLeft / totalTime * 100);
  const fill = document.getElementById('timer-fill');
  fill.style.width = pct + '%';
  fill.classList.toggle('danger', pct < 25);
  document.getElementById('timer-text').textContent = Math.ceil(timeLeft) + 's';
}

// floating text
function showFloatingText(cx, cy, text, color) {
  const el = document.createElement('div');
  el.className   = 'score-pop';
  el.textContent = text;
  el.style.left  = (cx - 20) + 'px';
  el.style.top   = (cy - 30) + 'px';
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function showComboText(cx, cy, text) {
  const el = document.createElement('div');
  el.className   = 'combo-badge';
  el.textContent = text;
  el.style.left  = (cx - 50) + 'px';
  el.style.top   = (cy - 60) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 500);
}

// Result
function showResult(msg) {
  const el = document.getElementById('result-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideResult() {
  document.getElementById('result-msg').classList.add('hidden');
}

// Difficulty
function getDiffConfig() { return DIFFICULTIES[diff]; }

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (running) return;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    diff = btn.dataset.diff;
  });
});

// Helpers
function lerp(a, b, t) { return a + (b - a) * t; }

// Bindings
document.getElementById('start-btn').addEventListener('click', startGame);

// Init
buildGrid();
updateHUD();
updateTimer();