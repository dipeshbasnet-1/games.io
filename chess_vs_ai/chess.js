// Chess vs AI
/** Features:
 *  - Full chess rules: castling, en-passant, pawn promotion
 *  - Minimax AI with Alpha-Beta pruning
 *  - Piece-square tables for positional evaluation
 *  - Legal-move highlighting, check detection, checkmate/stalemate
 *  - Captured pieces display
 */

//  Piece Unicode 
const PIECES = {
    K: { w: '♔', b: '♚' },
    Q: { w: '♕', b: '♛' },
    R: { w: '♖', b: '♜' },
    B: { w: '♗', b: '♝' },
    N: { w: '♘', b: '♞' },
    P: { w: '♙', b: '♟' },
};

//  Piece Values 
const PIECE_VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

// Piece-Square Tables (White's perspective; flip for Black)
const PST = {
    P: [
        [  0,  0,  0,  0,  0,  0,  0,  0],
        [ 50, 50, 50, 50, 50, 50, 50, 50],
        [ 10, 10, 20, 30, 30, 20, 10, 10],
        [  5,  5, 10, 25, 25, 10,  5,  5],
        [  0,  0,  0, 20, 20,  0,  0,  0]
        [  5, -5,-10,  0,  0,-10, -5,  5],
        [  5, 10, 10,-20,-20, 10, 10,  5],
        [  0,  0,  0,  0,  0,  0,  0,  0],
    ],
    N: [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50],
    ],
    B: [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20],
    ],
    R: [
        [  0,  0,  0,  5,  5,  0,  0,  0],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [ -5,  0,  0,  0,  0,  0,  0, -5],
        [  5, 10, 10, 10, 10, 10, 10,  5],
        [  0,  0,  0,  0,  0,  0,  0,  0],
    ],
    Q: [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [  0,  0,  5,  5,  5,  5,  0, -5],
        [ -5,  0,  5,  5,  5,  5,  0, -5],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20],
    ],
    K: [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20],
    ],
};

// Game State 
let board, turn, selected, legalCache, lastMove, gameOver;
let promotePending, capturedByWhite, capturedByBlack, enPassantTarget;

// Board Initialization
function initBoard() {
    const b = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRow = ['R','N','B','Q','K','B','N','R'];
    for (let c = 0; c < 8; c++) {
        b[0][c] = { t: backRow[c], c: 'b', moved: false };
        b[7][c] = { t: backRow[c], c: 'w', moved: false };
        b[1][c] = { t: 'P', c: 'b', moved: false };
        b[6][c] = { t: 'P', c: 'w', moved: false };
    }
    return b;
}

function newGame() {
    board = initBoard();
    turn = 'w';
    selected = null;
    legalCache = null;
    lastMove = null;
    gameOver = false;
    promotePending = null;
    capturedByWhite = [];
    capturedByBlack = [];
    enPassantTarget = null;
    document.getElementById('promo-modal').style.display = 'none';
    render();
    setStatus('Your turn — play as White');
}

// Board Utilities
function copyBoard(b) {
    return b.map(row => row.map(p => p ? { ...p } : null));
}

function inBounds(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function opponent(color) {
    return color === 'w' ? 'b' : 'w';
}

// Attack Detection
function isAttacked(b, r, c, byColor) {
    for (let rr = 0; rr < 8; rr++) {
        for (let cc = 0; cc < 8; cc++) {
            const p = b[rr][cc];
            if (!p || p.c !== byColor) continue;
            if (rawAttacks(b, rr, cc).some(([mr, mc]) => mr === r && mc === c)) return true;
        }
    }
    return false;
}

function inCheck(b, color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (b[r][c] && b[r][c].t === 'K' && b[r][c].c === color) {
                return isAttacked(b, r, c, opponent(color));
            }
        }
    }
    return false;
}

// Raw Attacks (ignores check, for attack maps) 
function rawAttacks(b, r, c) {
    const p = b[r][c];
    if (!p) return [];
    const moves = [];
    const opp = opponent(p.c);
    
    const slide = (dr, dc) => {
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc)) {
        moves.push([rr, cc]);
        if (b[rr][cc]) break;
        rr += dr; cc += dc;
    }
};

if (p.t === 'P') {
    const d = p.c === 'w' ? -1 : 1;
    if (inBounds(r + d, c - 1)) moves.push([r + d, c - 1]);
    if (inBounds(r + d, c + 1)) moves.push([r + d, c + 1]);
} else if (p.t === 'N') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
    .forEach(([dr, dc]) => { if (inBounds(r+dr, c+dc)) moves.push([r+dr, c+dc]); });
} else if (p.t === 'B') {
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr, dc]) => slide(dr, dc));
} else if (p.t === 'R') {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => slide(dr, dc));
} else if (p.t === 'Q') {
    [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => slide(dr, dc));
} else if (p.t === 'K') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
    .forEach(([dr, dc]) => { if (inBounds(r+dr, c+dc)) moves.push([r+dr, c+dc]); });
}
return moves.filter(([rr, cc]) => !b[rr][cc] || b[rr][cc].c !== p.c);
}

// Full Legal Moves (includes castling, en-passant, check filter
function rawMoves(b, r, c, epTarget) {
    const p = b[r][c];
    if (!p) return [];
    const moves = [];
    const opp = opponent(p.c);
    
    const slide = (dr, dc) => {
    let rr = r + dr, cc = c + dc;
    while (inBounds(rr, cc)) {
        moves.push([rr, cc, null]);
        if (b[rr][cc]) break;
        rr += dr; cc += dc;
    }
};

if (p.t === 'P') {
    const d = p.c === 'w' ? -1 : 1;
    // Forward
    if (inBounds(r+d, c) && !b[r+d][c]) {
        moves.push([r+d, c, null]);
        if (!p.moved && inBounds(r+2*d, c) && !b[r+2*d][c])
        moves.push([r+2*d, c, null]);
    }
    // Captures
    [-1,1].forEach(dc => {
        if (!inBounds(r+d, c+dc)) return;
        if (b[r+d][c+dc] && b[r+d][c+dc].c === opp) moves.push([r+d, c+dc, null]);
    // En-passant
        if (epTarget && epTarget[0] === r+d && epTarget[1] === c+dc)
            moves.push([r+d, c+dc, 'ep']);
        });
    
    } else if (p.t === 'N') {
        [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
        .forEach(([dr, dc]) => { if (inBounds(r+dr, c+dc)) moves.push([r+dr, c+dc, null]); });
    } else if (p.t === 'B') {
        [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr, dc]) => slide(dr, dc));
    } else if (p.t === 'R') {
        [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => slide(dr, dc));
    } else if (p.t === 'Q') {
        [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => slide(dr, dc));
    } else if (p.t === 'K') {
        [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
        .forEach(([dr, dc]) => { if (inBounds(r+dr, c+dc)) moves.push([r+dr, c+dc, null]); });
    // Castling
    if (!p.moved && !inCheck(b, p.c)) {
    // Kingside
    if (b[r][7] && !b[r][7].moved && !b[r][5] && !b[r][6] &&
        !isAttacked(b, r, 5, opp) && !isAttacked(b, r, 6, opp))
        moves.push([r, 6, 'castle-k']);
    // Queenside
    if (b[r][0] && !b[r][0].moved && !b[r][1] && !b[r][2] && !b[r][3] &&
        !isAttacked(b, r, 3, opp) && !isAttacked(b, r, 2, opp))
        moves.push([r, 2, 'castle-q']);
    }
}
return moves.filter(([rr, cc]) => !b[rr][cc] || b[rr][cc].c !== p.c);
}

function legalMoves(b, r, c, epTarget) {
    const p = b[r][c];
    if (!p) return [];
    return rawMoves(b, r, c, epTarget).filter(([tr, tc, flag]) => {
        const nb = copyBoard(b);
        applyMove(nb, r, c, tr, tc, flag, null);
        return !inCheck(nb, p.c);
    })
}

// Apply Move
function applyMove(b, fr, fc, tr, tc, flag, promo) {
    const p = b[fr][fc];
    // Castling: move rook
    if (flag === 'castle-k') { b[tr][5] = { ...b[tr][7], moved: true }; b[tr][7] = null; }
    if (flag === 'castle-q') { b[tr][3] = { ...b[tr][0], moved: true }; b[tr][0] = null; }
    // En-passant: remove captured pawn
    if (flag === 'ep') { const d = p.c === 'w' ? 1 : -1; b[tr + d][tc] = null; }
    b[tr][tc] = { ...p, moved: true };
    if (promo) b[tr][tc].t = promo.toUpperCase();
    b[fr][fc] = null;
}

// Evaluation
function evaluate(b) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = b[r][c];
            if (!p) continue;
            const val = PIECE_VALUE[p.t] || 0;
            const pstRow = p.c === 'w' ? r : 7 - r;
            const pst = PST[p.t] ? (PST[p.t][pstRow][c] || 0) : 0;
            score += (p.c === 'w' ? 1 : -1) * (val + pst);
        }
    }
    return score;
}

// All Legal Moves for a Side 
function allMoves(b, color, epTarget) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (!p || p.c !== color) continue;
        legalMoves(b, r, c, epTarget).forEach(([tr, tc, flag]) => {
        moves.push([r, c, tr, tc, flag]);
    });
    }
}
return moves;
}

// Move Ordering (captures first, for better pruning) 
function orderMoves(b, moves) {
    return moves.sort((a, b) => {
        const capA = b[a[2]][a[3]] ? PIECE_VALUE[b[a[2]][a[3]].t] || 0 : 0;
        const capB = b[b[2]][b[3]] ? PIECE_VALUE[b[b[2]][b[3]].t] || 0 : 0;
        return capB - capA
    });
}

// Minimax with Alpha-Beta
function minimax(b, depth, alpha, beta, maximizing, epTarget) {
    const color = maximizing ? 'w' : 'b';
    let moves = allMoves(b, color, epTarget);
    
    if (depth === 0 || moves.length === 0) {
        if (moves.length === 0) {
            return inCheck(b, color) ? (maximizing ? -50000 : 50000) : 0; // checkmate or stalemate
            }
            return evaluate(b);
        }
        
        moves = orderMoves(b, moves);
        
        if (maximizing) {
            let best = -Infinity;
            for (const [fr, fc, tr, tc, flag] of moves) {
                const nb = copyBoard(b); 
                let newEP = null;
                if (nb[fr][fc].t === 'P' && Math.abs(tr - fr) === 2) newEP = [(fr + tr) >> 1, tc];
                applyMove(nb, fr, fc, tr, tc, flag, null);
                const v = minimax(nb, depth - 1, alpha, beta, false, newEP);
                best = Math.max(best, v);
                alpha = Math.max(alpha, v);
                if (beta <= alpha) break;
    }
    return best;
} else {
    let best = Infinity;
    for (const [fr, fc, tr, tc, flag] of moves) {
        const nb = copyBoard(b);
        let newEP = null;
        if (nb[fr][fc].t === 'P' && Math.abs(tr - fr) === 2) newEP = [(fr + tr) >> 1, tc];
        applyMove(nb, fr, fc, tr, tc, flag, null);
        const v = minimax(nb, depth - 1, alpha, beta, true, newEP);
        best = Math.min(best, v);
        beta = Math.min(beta, v);
        if (beta <= alpha) break;
    }
    return best;
}
}

// AI Move
function aiMove() {
    const depth = parseInt(document.getElementById('diff-select').value);
    const moves = allMoves(board, 'b', enPassantTarget);
    
    if (!moves.length) { endGame('b'); return; }
    
    let best = Infinity;
    let bestMoves = [];
    
    for (const [fr, fc, tr, tc, flag] of moves) {
        const nb = copyBoard(board);
        let newEP = null;
        if (nb[fr][fc].t === 'P' && Math.abs(tr - fr) === 2) newEP = [(fr + tr) >> 1, tc]
        applyMove(nb, fr, fc, tr, tc, flag, null);
        const v = minimax(nb, depth - 1, -Infinity, Infinity, true, newEP);
        if (v < best) { best = v; bestMoves = [[fr, fc, tr, tc, flag, newEP]]; }
        else if (v === best) bestMoves.push([fr, fc, tr, tc, flag, newEP]);
    }
    
    const [fr, fc, tr, tc, flag, newEP] = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    const captured = board[tr][tc];
    if (captured) capturedByBlack.push(captured);
    if (flag === 'ep') { const d = board[fr][fc].c === 'w' ? 1 : -1; const epCap = board[tr + d][tc]; if (epCap) capturedByBlack.push(epCap); }
    
    applyMove(board, fr, fc, tr, tc, flag, null);

// Auto-promote AI pawn to Queen
if (board[tr][tc].t === 'P' && tr === 7) board[tr][tc].t = 'Q';

enPassantTarget = newEP;
lastMove = [[fr, fc], [tr, tc]];
turn = 'w';
render();

const wMoves = allMoves(board, 'w', enPassantTarget);
if (!wMoves.length) { endGame(inCheck(board, 'w') ? 'b' : 'draw'); return; }
if (inCheck(board, 'w')) setStatus('Check! Your turn');
else setStatus('Your turn — play as White');
}

// Game Over 
function endGame(winner) {
    gameOver = true
    if (winner === 'draw') setStatus('Draw — stalemate!');
    else if (winner === 'w') setStatus('You win! Checkmate!');
    else setStatus('AI wins! Checkmate!');
}

// Click Handler 
function handleClick(r, c) {
    if (gameOver || turn !== 'w' || promotePending) return;
    
    if (selected) {
    const [sr, sc] = selected;
    const legal = legalCache || [];
    const move = legal.find(([mr, mc]) => mr === r && mc === c);
    
    if (move) {
        const [tr, tc, flag] = move;
        const captured = board[tr][tc];
        if (captured) capturedByWhite.push(captured);
        if (flag === 'ep') { const epCap = board[r + 1][c]; if (epCap) capturedByWhite.push(epCap); }
        
        // Pawn promotion
        if (board[sr][sc].t === 'P' && tr === 0) {
            promotePending = { fr: sr, fc: sc, tr, tc, flag };
            applyMove(board, sr, sc, tr, tc, flag, null);
            lastMove = [[sr, sc], [tr, tc]];
            document.getElementById('promo-modal').style.display = 'flex';
            selected = null; legalCache = null;
            render(); return;
        }
        
        let newEP = null;
        if (board[sr][sc].t === 'P' && Math.abs(tr - sr) === 2) newEP = [(sr + tr) >> 1, tc];
        applyMove(board, sr, sc, tr, tc, flag, null);
        enPassantTarget = newEP;
        lastMove = [[sr, sc], [tr, tc]];
        selected = null; legalCache = null;
        turn = 'b';
        render();
        setStatus('AI is thinking...');
        setTimeout(aiMove, 80);
    } else {
        if (board[r][c] && board[r][c].c === 'w') {
            selected = [r, c];
            legalCache = legalMoves(board, r, c, enPassantTarget);
        } else {
            selected = null; legalCache = null;
        }
        render();
    }

} else {
    if (board[r][c] && board[r][c].c === 'w') {
        selected = [r, c];
        legalCache = legalMoves(board, r, c, enPassantTarget);}
    render();
    }
}

// Promotion Choice 
function doPromo(type) {
    if (!promotePending) return;
    const { tr, tc } = promotePending;
    board[tr][tc].t = type.toUpperCase();
    promotePending = null;
    document.getElementById('promo-modal').style.display = 'none';
    
    const bMoves = allMoves(board, 'b', enPassantTarget);
    if (!bMoves.length) { endGame(inCheck(board, 'b') ? 'w' : 'draw'); return; }
    
    turn = 'b'; render();
    setStatus('AI is thinking...');
    setTimeout(aiMove, 80);
}

// Find King in Check 
function findCheckSquare() {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.t === 'K' && inCheck(board, p.c)) return [r, c];
        }
    }
    return null;
}

// Status Bar
function setStatus(msg) {
    document.getElementById('status').textContent = msg;
}

// Render
function render() {
    const el = document.getElementById('board');
    el.innerHTML = '';
    const ck = findCheckSquare();
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            const isLight = (r + c) % 2 === 0;
            sq.className = 'sq ' + (isLight ? 'light' : 'dark');
            
            const p = board[r][c];
            if (p) {
                sq.textContent = PIECES[p.t][p.c];
                sq.style.color = p.c === 'w' ? '#ffffff' : '#111111';
            }
            
        if (selected && selected[0] === r && selected[1] === c) sq.classList.add('selected');
        else if (lastMove && lastMove.some(([lr, lc]) => lr === r && lc === c)) sq.classList.add('last-move');
        if (ck && ck[0] === r && ck[1] === c) sq.classList.add('in-check');
        if (legalCache && legalCache.some(([mr, mc]) => mr === r && mc === c)) {
        sq.classList.add('legal');
        if (p) sq.classList.add('has-piece');
    }
    
    sq.addEventListener('click', () => handleClick(r, c));
    el.appendChild(sq);
    }
}

// Captured pieces
    document.getElementById('captured-black').innerHTML =
    capturedByBlack.map(p => `<span>${PIECES[p.t][p.c]}</span>`).join('');
    document.getElementById('captured-white').innerHTML =
    capturedByWhite.map(p => `<span>${PIECES[p.t][p.c]}</span>`).join('');
}

// Start 
newGame();