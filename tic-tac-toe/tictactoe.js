/* Tic Tac Toe AI
 * Features: Unbeatable Minimax AI, Easy AI, 2-player mode,
 *           Win line animation, score tracking, player piece choice
 */

// State
let board    = Array(9).fill('');
let human    = 'X';
let computer = 'O';
let current  = 'X';
let gameOver = false;
let mode     = 'ai-hard';   // 'ai-hard' | 'ai-easy' | '2p'
let scores   = { X: 0, O: 0, D: 0 };

const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],  // rows
    [0,3,6],[1,4,7],[2,5,8],  // cols
    [0,4,8],[2,4,6],           // diags
];

// Win combo screen coordinates for SVG line
const WIN_LINES = {
    '0,1,2': [0.5, 0.5/3, 2.5, 0.5/3],
    '3,4,5': [0.5, 1.5,   2.5, 1.5],
    '6,7,8': [0.5, 2.5+0.5/3, 2.5, 2.5+0.5/3],
    '0,3,6': [0.5/3, 0.5, 0.5/3, 2.5],
    '1,4,7': [1.5,   0.5, 1.5,   2.5],
    '2,5,8': [2.5+0.5/3, 0.5, 2.5+0.5/3, 2.5],
    '0,4,8': [0.2, 0.2, 2.8, 2.8],
    '2,4,6': [2.8, 0.2, 0.2, 2.8],
};

//  Minimax 
function minimax(b, isMaximizing, depth, alpha, beta) {
    const winner = checkWinner(b);
    if (winner === computer) return  10 - depth;
    if (winner === human)    return -10 + depth;
    if (b.every(v => v))     return 0; 
    
    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
        if (!b[i]) {
            b[i] = computer;
            best = Math.max(best, minimax(b, false, depth + 1, alpha, beta));
            b[i] = '';
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
        }
    }
    return best;
    
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (!b[i]) {
            b[i] = human;
            best = Math.min(best, minimax(b, true, depth + 1, alpha, beta));
            b[i] = '';
            beta = Math.min(beta, best);
            if (beta <= alpha) break;
        }
    }
    return best;
    }
}

function getBestMove(b) {
    let best = -Infinity, move = -1;
    for (let i = 0; i < 9; i++) {
    if (!b[i]) {
        b[i] = computer;
        const score = minimax(b, false, 0, -Infinity, Infinity);
        b[i] = '';
        if (score > best) { best = score; move = i; }
    }
    }
    return move;
}

function getEasyMove(b) {
// 30% chance of best move, otherwise random
    if (Math.random() < 0.3) return getBestMove(b);
    const empty = b.map((v, i) => v ? null : i).filter(i => i !== null);
    return empty[Math.floor(Math.random() * empty.length)];
}

// Check winner 
function checkWinner(b) {
    for (const [a, x, c] of WIN_COMBOS) {
        if (b[a] && b[a] === b[x] && b[x] === b[c]) return b[a];
    }
    return null;
}

function getWinCombo(b) {
    for (const combo of WIN_COMBOS) {
        const [a, x, c] = combo;
        if (b[a] && b[a] === b[x] && b[x] === b[c]) return combo;
    } 
    return null;
}

// Render 
function renderBoard(winCombo = null) {
    document.querySelectorAll('.cell').forEach((cell, i) => {
    cell.dataset.val = board[i];
    cell.textContent = board[i];
    cell.classList.remove('winner');
    if (winCombo && winCombo.includes(i)) cell.classList.add('winner');
    });
}

function drawWinLine(combo) {
    const key    = combo.join(',');
    const coords = WIN_LINES[key];
    if (!coords) return;
    const line = document.getElementById('win-line');
    line.setAttribute('x1', coords[0]);
    line.setAttribute('y1', coords[1]);
    line.setAttribute('x2', coords[2]);
    line.setAttribute('y2', coords[3]);
    line.setAttribute('opacity', '1');
}

function clearWinLine() {
    document.getElementById('win-line').setAttribute('opacity', '0');
}

// Status
function setStatus(icon, cls, text) {
    const iconEl = document.getElementById('status-icon');
    iconEl.textContent = icon;
    iconEl.className   = 'status-icon ' + cls;
    document.getElementById('status-text').textContent = text;
}

function updateScoreboard() {
    document.getElementById('score-x').textContent = scores.X;
    document.getElementById('score-o').textContent = scores.O;
    document.getElementById('score-d').textContent = scores.D;

if (mode === '2p') {
    document.getElementById('lbl-x').textContent = 'Player X';
    document.getElementById('lbl-o').textContent = 'Player O';
} else {
    document.getElementById('lbl-x').textContent = human === 'X' ? `You (X)` : `AI (X)`;
    document.getElementById('lbl-o').textContent = human === 'O' ? `You (O)` : `AI (O)`;
}
}

// Handle click 
function handleClick(i) {
    if (gameOver || board[i]) return;
    if (mode !== '2p' && current === computer) return;
    
    makeMove(i, current);
}

function makeMove(i, player) {
    board[i] = player;
    current  = player === 'X' ? 'O' : 'X';
    
    const winner = checkWinner(board);
    const combo  = getWinCombo(board);
    
    if (winner) {
        renderBoard(combo);
        drawWinLine(combo);
        gameOver = true;
        scores[winner]++;
        updateScoreboard();
        const isHuman = (mode === '2p') || (winner === human);
        setStatus(winner, winner.toLowerCase(),
        mode === '2p'
        ? `Player ${winner} wins! 🎉`
        : isHuman
            ? 'You win! 🎉'
            : 'AI wins! 🤖');
        return;
    }
    
if (board.every(v => v)) {
    renderBoard();
    gameOver = true;
    scores.D++;
    updateScoreboard();
    setStatus('—', '', "It's a draw!");
    return;
    }

renderBoard();

    // AI turn
    if (mode !== '2p' && current === computer) {
        setStatus(computer, computer.toLowerCase(), 'AI is thinking...');
        setTimeout(() => {
            const move = mode === 'ai-hard' ? getBestMove(board) : getEasyMove(board);
            if (move !== -1 && move !== undefined) makeMove(move, computer);
        }, 350);
    return;
    }

    const isMyTurn = (mode === '2p') || (current === human);
    setStatus(current, current.toLowerCase(),
    mode === '2p'
    ? `Player ${current}'s turn`
    : isMyTurn ? 'Your turn' : 'AI thinking...');
}

// New game
function newGame() {
    board    = Array(9).fill('');
    gameOver = false;
    clearWinLine();

// If player chose O, AI goes first
if (mode !== '2p' && human === 'O') {
    current = 'X'; // X = computer
    renderBoard();
    setStatus('X', 'x', 'AI goes first...');
    setTimeout(() => {
        const move = mode === 'ai-hard' ? getBestMove(board) : getEasyMove(board);
        makeMove(move, computer);
    }, 400);
    } else {
        current = 'X';
        renderBoard();
        setStatus('X', 'x', mode === '2p' ? "Player X's turn" : 'Your turn');
    }
}

// Bindings 
document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => handleClick(+cell.dataset.i));
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mode = btn.dataset.mode;
        document.getElementById('player-choice').style.display =
        mode === '2p' ? 'none' : '';
        scores = { X: 0, O: 0, D: 0 };
        updateScoreboard();
        newGame();
    });
});

document.querySelectorAll('.piece-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.piece-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        human    = btn.dataset.piece;
        computer = human === 'X' ? 'O' : 'X';
        scores   = { X: 0, O: 0, D: 0 };
        updateScoreboard();
        newGame();
    });
});

document.getElementById('new-btn').addEventListener('click', newGame);
document.getElementById('reset-score-btn').addEventListener('click', () => {
    scores = { X: 0, O: 0, D: 0 };
    updateScoreboard();
    newGame();
});

// Start
updateScoreboard();
newGame();