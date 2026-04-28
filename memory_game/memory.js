/* Memory Game
 * Features: 4x4, 5x4, 6x6 grids, flip animation, match detection,
 *           move counter, timer, best score tracking, peek mode
 */

// Emojis
const EMOJIS = [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼',
    '🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦄',
    '🦋','🐬','🦒','🦕','🌸','🍕','🎸','🎯',
    '🚀','🍎','🎃','⚡','🌈','🏆','💎','🎵',
    '🍦','🦀','🌺','🎲',
];

// Config 
const GRID_CONFIGS = {
    4: { cols: 4, rows: 4, pairs: 8,  cardSize: '80px'  },
    5: { cols: 5, rows: 4, pairs: 10, cardSize: '90px'  },
    6: { cols: 6, rows: 6, pairs: 18, cardSize: '80px'  },
};

//  State 
let cards        = [];   // array of {emoji, flipped, matched}
let flipped      = [];   // indices of currently face-up cards
let moves        = 0;
let matchedPairs = 0;
let totalPairs   = 0;
let canFlip      = true;
let seconds      = 0;
let timerInterval = null;
let gridSize     = 5;
let bestMoves    = {};   // { '4': n, '5': n, '6': n }

// Init
function init() {
    bindControls();
    newGame();
}

function newGame() {
    const cfg = GRID_CONFIGS[gridSize];
    totalPairs   = cfg.pairs;
    matchedPairs = 0;
    moves        = 0;
    flipped      = [];
    canFlip      = true;

    // Shuffle emojis
    const pool = [...EMOJIS].sort(() => Math.random() - .5).slice(0, cfg.pairs);
    const deck = [...pool, ...pool].sort(() => Math.random() - .5);
    
    cards = deck.map(emoji => ({ emoji, flipped: false, matched: false }));
    
    stopTimer();
    seconds = 0;
    updateStats();
    hideWinBanner();
    renderBoard(cfg);
}

// Render 
function renderBoard(cfg) {
    const board = document.getElementById('board');
    board.style.gridTemplateColumns = `repeat(${cfg.cols}, ${cfg.cardSize})`;
    board.innerHTML = ''; 
    
    cards.forEach((card, i) => {
        const el = document.createElement('div');
        el.className = 'card' + (card.flipped ? ' flipped' : '') + (card.matched ? ' matched' : '');
        el.style.width  = cfg.cardSize;
        el.style.height = cfg.cardSize;
        el.innerHTML = `
        <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front">${card.emoji}</div>
        </div>
    `;
    el.addEventListener('click', () => flipCard(i));
    board.appendChild(el);
    });
}

// Flip card
function flipCard(index) {
    if (!canFlip) return;
    if (cards[index].flipped || cards[index].matched) return;
    if (flipped.length >= 2) return;
    
    // Start timer on first flip
    if (moves === 0 && flipped.length === 0) startTimer();
    
    cards[index].flipped = true;
    flipped.push(index);
    updateCardEl(index);
    
    if (flipped.length === 2) {
        canFlip = false;
        moves++;
        updateStats();
        setTimeout(checkMatch, 750);
    }
}

function checkMatch() {
    const [a, b] = flipped;
    if (cards[a].emoji === cards[b].emoji) {
    // Match!
    cards[a].matched = true;
    cards[b].matched = true;
    matchedPairs++;
    updateStats();
    updateCardEl(a);
    updateCardEl(b);
    flipped  = [];
    canFlip  = true;
    
    if (matchedPairs === totalPairs) {
        stopTimer();
        setTimeout(showWin, 400);
    }
    } else {
    // No match — show "wrong" shake then flip back
    getCardEl(a).classList.add('wrong');
    getCardEl(b).classList.add('wrong');
    setTimeout(() => {
        cards[a].flipped = false;
        cards[b].flipped = false;
        updateCardEl(a);
        updateCardEl(b);
        flipped  = [];
        canFlip  = true;
        }, 700);
    }
}

// Card element helpers 
function getCardEl(index) {
    return document.getElementById('board').children[index];
}

function updateCardEl(index) {
    const el    = getCardEl(index);
    const card  = cards[index];
    el.className = 'card' +
    (card.flipped  ? ' flipped'  : '') +
    (card.matched  ? ' matched'  : '');
}

// Timer
function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
    seconds++;
    updateStats();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Stats 
function updateStats() {
    document.getElementById('moves').textContent  = moves;
    document.getElementById('pairs').textContent  = `${matchedPairs}/${totalPairs}`;
    document.getElementById('timer').textContent  = formatTime(seconds);
    const bKey = String(gridSize);
    document.getElementById('best-moves').textContent = bestMoves[bKey] || '—';
}

// Win
function showWin() {
    const bKey = String(gridSize);
    const isNewBest = !bestMoves[bKey] || moves < bestMoves[bKey];
    if (isNewBest) bestMoves[bKey] = moves;
    
    document.getElementById('win-stats').textContent =
    `${moves} moves · ${formatTime(seconds)}${isNewBest ? ' · 🏆 New best!' : ''}`;
    
    document.getElementById('win-banner').classList.remove('hidden');
}

function hideWinBanner() {
    document.getElementById('win-banner').classList.add('hidden');
}

// Peek mode
function peek() {
    if (!canFlip) return;
    canFlip = false;
    // Flip all unmatched cards
    cards.forEach((card, i) => {
    if (!card.matched) { card.flipped = true; updateCardEl(i); }
    });
    setTimeout(() => {
        cards.forEach((card, i) => {
            if (!card.matched) { card.flipped = false; updateCardEl(i); }
        });
        canFlip = true;
    }, 3000);
}

// Controls
function bindControls() {
    document.getElementById('new-btn').addEventListener('click', newGame);
    document.getElementById('play-again-btn').addEventListener('click', newGame);
    document.getElementById('peek-btn').addEventListener('click', peek);
    
    document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gridSize = +btn.dataset.size;
        newGame();
    });
    });
}

// Start
init();