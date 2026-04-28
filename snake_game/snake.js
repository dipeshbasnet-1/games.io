/* Snake Game
 * Features: Speed levels, bonus food, levels, particle effects,
 *           smooth grid animation, high score, pause, mobile d-pad
 */

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

// Config
const CELL  = 20;
const COLS  = canvas.width  / CELL;  // 21
const ROWS  = canvas.height / CELL;  // 21

const SPEEDS = { 1: 220, 2: 130, 3: 80, 4: 45 };
const LEVEL_THRESHOLD = 5; // bonus food every 5 points for level-up

// State 
let snake, dir, nextDir, food, bonus, particles;
let score, highScore = 0, length, level, speedLevel = 2;
let gameLoop, running = false, paused = false;

// Overlay helpers 
const overlay     = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg   = document.getElementById('overlay-msg');

function showOverlay(title, msg, btnText = '▶ Play Again') {
    overlayTitle.textContent = title;
    overlayMsg.textContent   = msg;
    document.getElementById('start-btn').textContent = btnText;
    overlay.classList.remove('hidden');
}
function hideOverlay() { overlay.classList.add('hidden'); }

// New game 
function newGame() {
    clearInterval(gameLoop);
    snake   = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir     = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    food    = spawnFood();
    bonus   = null;
    particles = [];
    score   = 0;
    length  = 3;
    level   = 1;
    running = true;
    paused  = false;
    hideOverlay();
    updateHUD();
    gameLoop = setInterval(tick, SPEEDS[speedLevel]);
    scheduleBonusFood();
}

// Spawn helpers
function rnd(max) { return Math.floor(Math.random() * max); }

function spawnFood() {
    let pos;
    do { pos = { x: rnd(COLS), y: rnd(ROWS) }; }
    while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
}

let bonusTimer = null;
function scheduleBonusFood() {
    clearTimeout(bonusTimer);
    bonusTimer = setTimeout(() => {
        if (running && !paused) {
            bonus = spawnFood();
        // Remove bonus after 8 seconds
        setTimeout(() => { bonus = null; draw(); }, 8000);
        }
        scheduleBonusFood();
    }, 12000 + Math.random() * 8000);
}

//  Game tick 
function tick() {
    if (paused) return;
    dir = { ...nextDir };
    
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    
    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver(); return;
    }
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOver(); return;
    }
    
    
    snake.unshift(head);

// Food
if (head.x === food.x && head.y === food.y) {
    score  += level;
    length  = snake.length;
    food    = spawnFood();
    spawnParticles(head.x, head.y, '#f85149');
    checkLevelUp();
} else if (bonus && head.x === bonus.x && head.y === bonus.y) {
    score  += level * 5;
    length  = snake.length;
    bonus   = null;
    spawnParticles(head.x, head.y, '#f0883e');
    checkLevelUp();
} else {
    snake.pop();
}
    updateHUD();
    draw();
}

function checkLevelUp() {
    const newLevel = Math.floor(score / (LEVEL_THRESHOLD * level)) + 1;
    if (newLevel > level) {
        level = newLevel;
        clearInterval(gameLoop);
        const speed = Math.max(SPEEDS[speedLevel] - (level - 1) * 8, 40);
        gameLoop = setInterval(tick, speed);
        updateHUD();
    }
}

// Particles
function spawnParticles(gx, gy, color) {
    const x = gx * CELL + CELL / 2;
    const y = gy * CELL + CELL / 2;
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color,
            r: 2 + Math.random() * 2
        });
    }
}

// Draw
function draw() {
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

// Grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < COLS; x++)
    for (let y = 0; y < ROWS; y++)
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);

// Snake
    snake.forEach((seg, i) => {
        const t = i / snake.length;
        if (i === 0) {
            ctx.fillStyle = '#39d353';
        } else {
            const g = Math.round(211 - t * 60);
            ctx.fillStyle = `rgb(${Math.round(40 + t * 10)}, ${g}, ${Math.round(60 - t * 20)})`;
    }
    const padding = i === 0 ? 1 : 2;
    ctx.beginPath();
    ctx.roundRect(
        seg.x * CELL + padding,
        seg.y * CELL + padding,
        CELL - padding * 2,
        CELL - padding * 2,
        i === 0 ? 6 : 3
    );
    ctx.fill();
    
    // Eyes on head
    if (i === 0) {
        ctx.fillStyle = '#0d1117';
        const ex = dir.x === 1 ? CELL - 5 : dir.x === -1 ? 3 : 4;
        const ey = dir.y === 1 ? CELL - 5 : dir.y === -1 ? 3 : 4;
        ctx.beginPath();
        ctx.arc(seg.x * CELL + ex,         seg.y * CELL + ey,         2.5, 0, Math.PI * 2);
        ctx.arc(seg.x * CELL + CELL - ex,  seg.y * CELL + CELL - ey,  2.5, 0, Math.PI * 2);
        ctx.fill();
    }
});

// Food (red circle with glow)
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    ctx.shadowColor = '#f85149';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = '#f85149';
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

// Bonus food
if (bonus) {
    const bx = bonus.x * CELL + CELL / 2;
    const by = bonus.y * CELL + CELL / 2;
    ctx.shadowColor = '#f0883e';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = '#f0883e';
    ctx.beginPath();
    ctx.arc(bx, by, CELL / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // "x5" label
    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('x5', bx, by + 3);
}

// Particles
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.04;
        ctx.globalAlpha = p.life;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); 
        ctx.fill();
    });
    particles = particles.filter(p => p.life > 0);
    ctx.globalAlpha = 1;
}

//  Game over 
function gameOver() {
    clearInterval(gameLoop);
    clearTimeout(bonusTimer);
    running = false;
    if (score > highScore) {
    highScore = score;
    document.getElementById('high-score').textContent = highScore;
    }
// Flash
    let flashes = 0;
    const flash = setInterval(() => {
        ctx.fillStyle = `rgba(248,81,73,${0.15})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (++flashes > 5) {
            clearInterval(flash);
            showOverlay('Game Over', `Score: ${score} | Best: ${highScore}`)
        }
    }, 100);
}

// HUD 
function updateHUD() {
    document.getElementById('score').textContent      = score;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('length').textContent     = snake.length;
    document.getElementById('level').textContent      = level;
}

//  Controls 
const OPPOSITE = { x: { 1: -1, '-1': 1 }, y: { 1: -1, '-1': 1 } };

function setDir(x, y) {
    if ((x !== 0 && dir.x !== 0) || (y !== 0 && dir.y !== 0)) return; // same axis
    nextDir = { x, y };
}

document.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); setDir(0, -1); break;
        case 'ArrowDown':  case 's': case 'S': e.preventDefault(); setDir(0,  1); break;
        case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); setDir(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); setDir(1,  0); break;
        case ' ':
            e.preventDefault();
            if (running) togglePause();
            break;
        }
});

// D-pad
document.getElementById('up-btn').addEventListener('click',    () => setDir(0, -1));
document.getElementById('down-btn').addEventListener('click',  () => setDir(0,  1));
document.getElementById('left-btn').addEventListener('click',  () => setDir(-1, 0));
document.getElementById('right-btn').addEventListener('click', () => setDir(1,  0));

// Speed buttons
document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        speedLevel = +btn.dataset.speed;
        if (running && !paused) {
            clearInterval(gameLoop);
            gameLoop = setInterval(tick, SPEEDS[speedLevel]);
        }
    });
});

document.getElementById('start-btn').addEventListener('click', newGame);
document.getElementById('new-btn').addEventListener('click',   newGame);
document.getElementById('pause-btn').addEventListener('click', togglePause);

function togglePause() {
    if (!running) return;
    paused = !paused;
    document.getElementById('pause-btn').textContent = paused ? 'Resume' : 'Pause';
    if (paused) {
        ctx.fillStyle = 'rgba(13,17,23,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e6edf3';
        ctx.font      = 'bold 28px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

//  Initial draw 
draw();
showOverlay('Snake', 'Use arrow keys or WASD to move', '▶ Start Game');