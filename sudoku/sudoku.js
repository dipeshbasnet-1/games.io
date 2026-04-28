/* Sudoku Solver
 * Features: Play manually, instant solve, step-by-step solve,
 *           validate, hint, backtracking algorithm, pencil marks,
 *           row/col/box highlighting, error tracking, timer
 */

// Puzzles
const PUZZLES = {
    easy: [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9],
    ],
    medium: [
    [0,0,0,2,6,0,7,0,1],
    [6,8,0,0,7,0,0,9,0],
    [1,9,0,0,0,4,5,0,0],
    [8,2,0,1,0,0,0,4,0],
    [0,0,4,6,0,2,9,0,0],
    [0,5,0,0,0,3,0,2,8],
    [0,0,9,3,0,0,0,7,4],
    [0,4,0,0,5,0,0,3,6],
    [7,0,3,0,1,8,0,0,0],
    ],
    hard: [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,3,0,8,5],
    [0,0,1,0,2,0,0,0,0],
    [0,0,0,5,0,7,0,0,0],
    [0,0,4,0,0,0,1,0,0],
    [0,9,0,0,0,0,0,0,0],
    [5,0,0,0,0,0,0,7,3],
    [0,0,2,0,1,0,0,0,0],
    [0,0,0,0,4,0,0,0,9],
    ],
};

// State
let grid       = [];   // current board values [9][9]
let given      = [];   // which cells are pre-filled [9][9]
let selected   = null; // {row, col}
let errors     = 0;
let seconds    = 0;
let timerInterval = null;
let level      = 'easy';
let solving    = false;
let stepGen    = null;

// Init
function init() {
    buildNumpad();
    buildBoard();
    loadPuzzle(level);
    bindControls();
}

// Build Numpad
function buildNumpad() {
    const pad = document.getElementById('numpad');
    for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.className = 'num-key';
    btn.textContent = n;
    btn.addEventListener('click', () => inputNumber(n));
    pad.appendChild(btn);
}
    const erase = document.createElement('button');
    erase.className = 'num-key erase';
    erase.textContent = '⌫ Erase';
    erase.addEventListener('click', () => inputNumber(0));
    pad.appendChild(erase);
}

// Build board 
function buildBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener('click', () => selectCell(r, c));
        board.appendChild(cell);
    }
}
}

// Load puzzle
function loadPuzzle(lvl) {
    level = lvl;
    const template = PUZZLES[lvl];
    grid  = template.map(row => [...row]);
    given = template.map(row => row.map(v => v !== 0));
    selected = null;
    errors   = 0;
    stepGen  = null;
    solving  = false;
    startTimer();
    updateErrorCount();
    renderBoard();
    showMessage('');
    setStatus('Playing');
}

// Render board 
function renderBoard(solvedCells = new Set(), hintCell = null) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const r = +cell.dataset.row;
        const c = +cell.dataset.col;
        const val = grid[r][c];
        const key = r * 9 + c;
        
        cell.className = 'cell';
        cell.textContent = val || '';
    
    if (given[r][c])         cell.classList.add('given');
    else if (hintCell === key) cell.classList.add('hint-cell');
    else if (solvedCells.has(key)) cell.classList.add('solved');
    
    if (selected) {
        const [sr, sc] = [selected.row, selected.col];
        
    if (r === sr && c === sc) {
        cell.classList.add('selected');
    } else if (r === sr || c === sc ||
        (Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3))) {
        cell.classList.add('highlight');
    }
    }
});
}

// Select cell
function selectCell(r, c) {
    selected = { row: r, col: c };
    renderBoard();
}

// Input number
function inputNumber(n) {
    if (!selected) return;
    const { row, col } = selected;
    if (given[row][col]) return;
    
    grid[row][col] = n;
    
    if (n !== 0 && !isValidPlacement(grid, row, col, n)) {
    errors++;
    updateErrorCount();
    document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`).classList.add('error');
    setTimeout(() => renderBoard(), 800);
    return;
}

renderBoard();

    if (isBoardComplete()) {
        stopTimer();
        setStatus('Solved!');
        showMessage('🎉 Congratulations! Puzzle solved!', 'success');
    }
}

// Keyboard input 
document.addEventListener('keydown', e => {
    if (!selected) return;
    if (e.key >= '1' && e.key <= '9') inputNumber(+e.key);
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0);
    // Arrow navigation
    const dirs = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
    if (dirs[e.key]) {
        e.preventDefault();
        const [dr, dc] = dirs[e.key];
        selected.row = Math.max(0, Math.min(8, selected.row + dr));
        selected.col = Math.max(0, Math.min(8, selected.col + dc));
        renderBoard();
    }
});

// Validation helpers 
function isValidPlacement(g, row, col, val) {
    if (val === 0) return true;
    for (let i = 0; i < 9; i++) {
        if (i !== col && g[row][i] === val) return false;
        if (i !== row && g[i][col] === val) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
        if ((r !== row || c !== col) && g[r][c] === val) return false;
    }
    }
    return true;
}

function isBoardComplete() {
    return grid.every((row, r) => row.every((v, c) => v !== 0 && isValidPlacement(grid, r, c, v)));
}

// Backtracking solver 
function findEmpty(g) {
    for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
        if (g[r][c] === 0) return [r, c];
    return null;
}

function solveSudoku(g) {
    const empty = findEmpty(g);
    if (!empty) return true;
    const [r, c] = empty;
    for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(g, r, c, num)) {
        g[r][c] = num;
        if (solveSudoku(g)) return true;
        g[r][c] = 0;
    }
    }
    return false;
}

// Step-by-step generator
function* solveStepByStep(g) {
    const empty = findEmpty(g);
    if (!empty) { yield { done: true }; return; }
    const [r, c] = empty;
    for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(g, r, c, num)) {
        g[r][c] = num;
        yield { row: r, col: c, val: num, done: false };
        const sub = yield* solveStepByStep(g);
        if (sub) { yield { done: true }; return true; }
        g[r][c] = 0;
        yield { row: r, col: c, val: 0, backtrack: true, done: false };
    }
    }
    return false;
}

// Controls 
function bindControls() {
  // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadPuzzle(btn.dataset.level);
    });
});

    // Solve instantly
    document.getElementById('solve-btn').addEventListener('click', () => {
    const copy = grid.map(r => [...r]);
    if (solveSudoku(copy)) {
        const solvedSet = new Set();
        for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (!given[r][c] && copy[r][c] !== grid[r][c]) solvedSet.add(r * 9 + c);
        grid = copy;
        stopTimer();
        setStatus('Solved!');
        renderBoard(solvedSet);
        showMessage('✅ Solved using backtracking algorithm!', 'success');
    } else {
        showMessage('❌ No solution exists for this puzzle.', 'error');
    }
});

    // Step solve
    document.getElementById('step-btn').addEventListener('click', () => {
        if (!stepGen) {
        const copy = grid.map(r => [...r]);
        // We need a flat generator for UI
        stepGen = flatStepSolver(copy);
    }
    const result = stepGen.next();
    if (result.done || (result.value && result.value.done)) {
        showMessage('✅ Step-by-step solve complete!', 'success');
        stopTimer();
        setStatus('Solved!');
        stepGen = null;
        return;
    }
    const { row, col, val, backtrack } = result.value;
    if (val !== undefined) grid[row][col] = val;
    const solvedSet = new Set();
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
        if (!given[r][c] && grid[r][c] !== 0) solvedSet.add(r * 9 + c);
    renderBoard(solvedSet);
    if (backtrack) showMessage(`⬅ Backtracking from (${row+1},${col+1})`, 'info');
    else showMessage(`✏ Placing ${val} at row ${row+1}, col ${col+1}`, 'info');
});

    // Validate
    document.getElementById('validate-btn').addEventListener('click', () => {
    let hasErrors = false;
    document.querySelectorAll('.cell').forEach(cell => {
        const r = +cell.dataset.row, c = +cell.dataset.col;
        cell.classList.remove('error');
        if (grid[r][c] !== 0 && !given[r][c] && !isValidPlacement(grid, r, c, grid[r][c])) {
        cell.classList.add('error');
        hasErrors = true;
        }
    });
    showMessage(hasErrors ? '❌ Errors found! Check red cells.' : '✅ Board looks valid so far!',
                hasErrors ? 'error' : 'success');
    });
    
    // Hint
    document.getElementById('hint-btn').addEventListener('click', () => {
    const copy = grid.map(r => [...r]);
    if (solveSudoku(copy)) {
    // Find first empty cell
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
            grid[r][c] = copy[r][c];
            const solvedSet = new Set();
            for (let rr = 0; rr < 9; rr++)
            for (let cc = 0; cc < 9; cc++)
                if (!given[rr][cc] && grid[rr][cc] !== 0) solvedSet.add(rr * 9 + cc);
            renderBoard(solvedSet, r * 9 + c);
            showMessage(`💡 Hint: placed ${copy[r][c]} at row ${r+1}, col ${c+1}`, 'info');
            return;
        }
        }
    }
    }
});

  // Clear
    document.getElementById('clear-btn').addEventListener('click', () => {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
        if (!given[r][c]) grid[r][c] = 0;
    stepGen = null;
    errors = 0;
    updateErrorCount();
    renderBoard();
    showMessage('🗑 Board cleared.', 'info');
    });
    
    // New puzzle
    document.getElementById('new-btn').addEventListener('click', () => loadPuzzle(level));
}

//  Flat step solver (iterative-friendly generator) 
function* flatStepSolver(g) {
    const stack = [];
    const startEmpty = findEmpty(g);
    if (!startEmpty) { yield { done: true }; return; }
    stack.push({ pos: startEmpty, num: 1, g });
    
    while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const [r, c] = top.pos;
    let placed = false;

    while (top.num <= 9) {
        const num = top.num++;
        if (isValidPlacement(g, r, c, num)) {
        g[r][c] = num;
        yield { row: r, col: c, val: num, done: false };
        const next = findEmpty(g);
        if (!next) { yield { done: true }; return; }
        stack.push({ pos: next, num: 1 });
        placed = true;
        break;
    }
    }
    
    if (!placed) {
        g[r][c] = 0;
        yield { row: r, col: c, val: 0, backtrack: true, done: false };
        stack.pop();
    }
    }
}

// timer
function startTimer() {
    stopTimer();
    seconds = 0;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
    seconds++;
    updateTimerDisplay();
}, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function updateTimerDisplay() {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${m}:${s}`;
}

// Helpers
function updateErrorCount() {
    document.getElementById('error-count').textContent = errors;
}

function setStatus(text) {
    document.getElementById('status-text').textContent = text;
}

function showMessage(text, type = '') {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = 'message ' + (text ? type : 'hidden');
}

//Start
init();