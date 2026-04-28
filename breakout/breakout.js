/* Breakout Game
 * Features: 10 levels, multi-hit bricks, power-ups (wide paddle,
 *           multi-ball, slow-mo, laser), particles, glow effects,
 *           lives, high score, pause, keyboard + mouse control
 */

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width;   // 480
const H = canvas.height;  // 520

// Constants
const PAD_H      = 12;
const BALL_R     = 7;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_PAD  = 5;
const BRICK_TOP  = 60;
const BRICK_W    = (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
const BRICK_H    = 20;

// Brick color rows
const ROW_COLORS = [
   '#f87171', // red
   '#fb923c', // orange
   '#facc15', // yellow
   '#4ade80', // green
   '#60a5fa', // blue
   '#c084fc', // purple
];

// Power-up types
const POWERUP_TYPES = ['wide', 'slow', 'multi', 'laser'];
const POWERUP_COLORS = { wide: '#4ade80', slow: '#60a5fa', multi: '#facc15', laser: '#f87171' };

// State
let paddle, balls, bricks, powerups, particles, lasers;
let score, best = 0, lives, level;
let gameState;   // 'idle' | 'play' | 'dead' | 'win' | 'paused' | 'gameover'
let padWidth;
let keys = {};
let animFrame;

// Init Game
function newGame() {
    score     = 0;
    lives     = 3;  
    level     = 1;
    gameState = 'idle';
    padWidth  = 90;
    cancelAnimationFrame(animFrame);
    startLevel();
}

function startLevel() {
    paddle    = { x: W / 2 - padWidth / 2, y: H - 30, w: padWidth };
    balls     = [makeBall()];
    bricks    = makeBricks(level);
    powerups  = [];
    particles = [];
    lasers    = [];
    gameState = gameState === 'gameover' ? 'idle' : 'idle';
    updateHUD();
    document.getElementById('hint').textContent =
    `Level ${level} — Click or Space to launch ball`;
    animFrame = requestAnimationFrame(loop);
}

//  Factories 
function makeBall() {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    const speed = 4 + level * 0.3;
    return {
        x: W / 2, y: H - 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        attached: true,   // attached to paddle before launch
    };
}

function makeBricks(lvl) {
    const brickList = [];
    const extraRows = Math.min(lvl - 1, 3);
    const rows = BRICK_ROWS + extraRows;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
        // Some bricks are skipped at higher difficulties
        if (lvl > 5 && Math.random() < 0.1) continue; 
    
    const hp  = r < 2 ? (lvl > 3 ? 3 : lvl > 1 ? 2 : 1) : 1;
    const x   = BRICK_PAD + c * (BRICK_W + BRICK_PAD);
    const y   = BRICK_TOP + r * (BRICK_H + BRICK_PAD);
    const color = ROW_COLORS[r % ROW_COLORS.length];
    
    brickList.push({ x, y, w: BRICK_W, h: BRICK_H, hp, maxHp: hp, color, alive: true });
    }
}
    return brickList;
}

// Game loop 
function loop() {
    animFrame = requestAnimationFrame(loop);
    update();
    draw();
}

// Update 
function update() {
    if (gameState !== 'play') {
    if (gameState === 'idle') {
    // Ball follows paddle
        balls.forEach(b => { if (b.attached) { b.x = paddle.x + paddle.w / 2; b.y = paddle.y - BALL_R - 2; } });
    }
    movePaddle();
    return;}
    
    movePaddle();

//  Balls
    balls.forEach(ball => {
        if (ball.attached) { ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - BALL_R - 2; return; }
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Wall bounces
    if (ball.x - BALL_R < 0)  { ball.x = BALL_R;     ball.vx =  Math.abs(ball.vx); }
    if (ball.x + BALL_R > W)  { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
    if (ball.y - BALL_R < 0)  { ball.y = BALL_R;     ball.vy =  Math.abs(ball.vy); }
    
    // Paddle bounce
    if (
        ball.vy > 0 &&
        ball.y + BALL_R >= paddle.y &&
        ball.y - BALL_R <= paddle.y + PAD_H &&
        ball.x >= paddle.x - 4 &&
        ball.x <= paddle.x + paddle.w + 4
    ) {
        const hit    = (ball.x - paddle.x) / paddle.w - 0.5; // -0.5 to 0.5
        const speed  = Math.hypot(ball.vx, ball.vy);
        const angle  = hit * Math.PI * 0.65 - Math.PI / 2;
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.y  = paddle.y - BALL_R - 1;
        spawnParticles(ball.x, ball.y, '#00f5ff', 5);
    }
    
    // Brick collision
    for (const brick of bricks) {
        if (!brick.alive) continue;
        if (
            ball.x + BALL_R > brick.x &&
            ball.x - BALL_R < brick.x + brick.w &&
            ball.y + BALL_R > brick.y &&
            ball.y - BALL_R < brick.y + brick.h
        ) {
        hitBrick(brick, ball);
        break;
        }
    }
    
    // Out of bounds (bottom)
    if (ball.y - BALL_R > H) { ball.dead = true; }
    });

// Remove dead balls
    balls = balls.filter(b => !b.dead);
    if (balls.length === 0) {
    lives--;
    updateHUD();
    if (lives <= 0) {
        gameState = 'gameover';
        document.getElementById('hint').textContent = 'Game Over! Press New Game.';
    return;
    }
    balls = [makeBall()];
    balls[0].attached = true;
    gameState = 'idle';
    document.getElementById('hint').textContent = 'Click or Space to launch ball';
    }
    
  // Power-ups 
    powerups.forEach(pu => {
        pu.y += 2;
        if (
            pu.y + 10 >= paddle.y &&
            pu.y - 10 <= paddle.y + PAD_H &&
            pu.x >= paddle.x &&
            pu.x <= paddle.x + paddle.w
    ) {
        applyPowerup(pu.type);
        pu.dead = true;
    }
    if (pu.y > H) pu.dead = true;
    });
    powerups = powerups.filter(p => !p.dead);

// Lasers
lasers.forEach(l => {
    l.y -= 8;
    for (const brick of bricks) {
        if (!brick.alive) continue;
        if (l.x >= brick.x && l.x <= brick.x + brick.w && l.y <= brick.y + brick.h && l.y >= brick.y) {
        hitBrick(brick, null);
        l.dead = true;
        break;
    }
    }
    if (l.y < 0) l.dead = true;
    });
    lasers = lasers.filter(l => !l.dead);
    
    // Particles 
    particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.08;
    p.life -= 0.03;
    });
    particles = particles.filter(p => p.life > 0);
    
    // Win check 
    if (bricks.every(b => !b.alive)) {
        level++;
        if (score > best) best = score;
        updateHUD();
        if (level > 10) {
            gameState = 'win';
            document.getElementById('hint').textContent = '🏆 You cleared all 10 levels! Amazing!';
        } else {
            document.getElementById('hint').textContent = `Level ${level} starting…`;
            setTimeout(() => { startLevel(); }, 1200);
            gameState = 'pause-transition';
        }
    }
}

//  Hit brick
function hitBrick(brick, ball) {
    brick.hp--;
    spawnParticles(
        brick.x + brick.w / 2,
        brick.y + brick.h / 2,
        brick.color, 6
    );

if (brick.hp <= 0) {
    brick.alive = false;
    score += 10 * level;
    if (score > best) best = score;
    updateHUD();
    // Power-up drop (20% chance)
    if (Math.random() < 0.2) {
        const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
        powerups.push({ x: brick.x + brick.w / 2, y: brick.y, type });
    }
    } else {
    score += 5;
    updateHUD();
}

// Bounce ball off brick
if (ball) {
    const overlapL = ball.x - brick.x;
    const overlapR = brick.x + brick.w - ball.x;
    const overlapT = ball.y - brick.y;
    const overlapB = brick.y + brick.h - ball.y;
    const minH = Math.min(overlapL, overlapR);
    const minV = Math.min(overlapT, overlapB);
    if (minH < minV) ball.vx = -ball.vx;
    else             ball.vy = -ball.vy;
    }
}

// Power-up effects 
let powerupTimers = {};
function applyPowerup(type) {
    clearTimeout(powerupTimers[type]);
    if (type === 'wide') {
    paddle.w = Math.min(paddle.w * 1.5, 160);
    powerupTimers.wide = setTimeout(() => { paddle.w = padWidth; }, 8000);
    } else if (type === 'slow') {
    balls.forEach(b => { b.vx *= 0.6; b.vy *= 0.6; });
    powerupTimers.slow = setTimeout(() => {
        balls.forEach(b => {
            const spd = Math.hypot(b.vx, b.vy);
           const target = 4 + level * 0.3;
            b.vx = b.vx / spd * target;
            b.vy = b.vy / spd * target;
        });
    }, 6000);
    } else if (type === 'multi') {
    const extra = balls.filter(b => !b.attached).slice(0, 1).map(b => ({
        ...b, vx: -b.vx + (Math.random() - 0.5), vy: b.vy + (Math.random() - 0.5)
    }));
    balls.push(...extra);
} else if (type === 'laser') {
    // Fire lasers
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
        lasers.push({ x: paddle.x + paddle.w * 0.25, y: paddle.y });
        lasers.push({ x: paddle.x + paddle.w * 0.75, y: paddle.y });
      }, i * 200);
    }
    }
}

//  Particles 
function spawnParticles(x, y, color, n = 8) {
for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        color,
      r: 1.5 + Math.random() * 2.5,
    });
    }
}

// Paddle movement
function movePaddle() {
    if (keys['ArrowLeft']  || keys['a']) paddle.x -= 7;
    if (keys['ArrowRight'] || keys['d']) paddle.x += 7;
    paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));
}

// Draw
function draw() {
    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth   = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

// Bricks
bricks.forEach(b => {
    if (!b.alive) return;
    const alpha = 0.5 + (b.hp / b.maxHp) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = b.color;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    // Top shine
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 4);
    // HP dots
    if (b.maxHp > 1) {
        for (let i = 0; i < b.hp; i++) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b.x + 6 + i * 8, b.y + b.h / 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    }
    ctx.globalAlpha = 1;
});

// Power-ups
powerups.forEach(pu => {
    const color = POWERUP_COLORS[pu.type];
    ctx.shadowColor = color;
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = color;
    ctx.beginPath();
    ctx.roundRect(pu.x - 16, pu.y - 10, 32, 20, 5);
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = '#000';
    ctx.font        = 'bold 9px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(pu.type.toUpperCase(), pu.x, pu.y + 4);
    });

// Lasers
lasers.forEach(l => {
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = '#f87171';
    ctx.fillRect(l.x - 2, l.y, 4, 16);
    ctx.shadowBlur  = 0;
});

// Paddle
    const padGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + PAD_H);
    padGrad.addColorStop(0, '#00f5ff');
    padGrad.addColorStop(1, '#007acc');
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = padGrad;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, PAD_H, 6);
    ctx.fill();
    ctx.shadowBlur  = 0;

// Balls
balls.forEach(ball => {
    const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(1, '#00f5ff');
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur  = 0;
});

// Particles
particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
});
ctx.globalAlpha = 1;

// Overlay messages
if (gameState === 'idle') {
    ctx.fillStyle   = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle   = '#00f5ff';
    ctx.font        = 'bold 22px Orbitron, sans-serif';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur  = 10;
    ctx.fillText(`LEVEL ${level}`, W / 2, H / 2 - 10);
    ctx.fillStyle   = '#888';
    ctx.font        = '13px sans-serif';
    ctx.shadowBlur  = 0;
    ctx.fillText('Click or Space to launch', W / 2, H / 2 + 20);
}

if (gameState === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#f87171';
    ctx.font        = 'bold 28px Orbitron, sans-serif';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
    ctx.fillStyle   = '#00f5ff';
    ctx.font        = 'bold 20px sans-serif';
    ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 10);
    ctx.fillStyle   = '#888';
    ctx.font        = '13px sans-serif';
    ctx.fillText(`Best: ${best}`, W / 2, H / 2 + 35);
}

if (gameState === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#facc15';
    ctx.font        = 'bold 28px Orbitron, sans-serif';
    ctx.fillText('YOU WIN! 🏆', W / 2, H / 2 - 20);
    ctx.fillStyle   = '#00f5ff';
    ctx.font        = '16px sans-serif';
    ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 20);
}
}

// HUD
function updateHUD() {
    document.getElementById('score').textContent      = score;
    document.getElementById('best').textContent       = best;
    document.getElementById('level').textContent      = level;
    document.getElementById('lives-icons').textContent = '♥ '.repeat(lives).trim() || '✕';
}

// Input
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.code === 'Space') {
    e.preventDefault();
    launch();
    }
});
document.addEventListener('keyup', e => { delete keys[e.key]; });

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) * (W / rect.width);
    paddle.x   = Math.max(0, Math.min(W - paddle.w, mx - paddle.w / 2));
});

canvas.addEventListener('click', launch);

function launch() {
if (gameState === 'idle') {
    gameState = 'play';
    balls.forEach(b => {
        if (b.attached) {
            b.attached = false;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
            const speed = 4 + level * 0.3;
            b.vx = Math.cos(angle) * speed;
            b.vy = Math.sin(angle) * speed;
        }
    });
    document.getElementById('hint').textContent = 'Move mouse or ← → keys to control paddle';
    }
}

// Pause
let paused = false;
document.getElementById('pause-btn').addEventListener('click', () => {
    if (gameState === 'play') {
    paused    = true;
    gameState = 'paused';
    document.getElementById('pause-btn').textContent = 'Resume';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle   = '#00f5ff';
    ctx.font        = 'bold 24px Orbitron, sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
    } else if (gameState === 'paused') {
        paused    = false;
        gameState = 'play';
        document.getElementById('pause-btn').textContent = 'Pause';
    }
});

document.getElementById('new-btn').addEventListener('click', newGame);

// Start
newGame();