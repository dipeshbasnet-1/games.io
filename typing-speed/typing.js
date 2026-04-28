/*Typing Speed Test
 * Features: Words / Quotes / Code modes, 15s/30s/60s/120s timer,
 *           live WPM (correct only) + raw WPM, accuracy %, error count,
 *           character-level highlighting, grading system, best score per mode
 */

// Word / Quote / Code pools 
const POOLS = {
    words: `the quick brown fox jumps over the lazy dog time about would their there been from they which
    what this will each look many some into over also back after use two how our work first well way even
    new want because any these give day most us great between need large often hand high place year live
    me see number no come its way could people than first water been call oil its now find long day did
    get come made may part over where much going before know must through before right boy following came
    show also around form three small set put end does another well large must big even such because turn
    here why asked went men read need land different home us move try kind hand picture again change play`.split(/\s+/).filter(Boolean),

    quotes: [
    `The only way to do great work is to love what you do.`,
    `In the middle of every difficulty lies opportunity.`,
    `It does not matter how slowly you go as long as you do not stop.`,
    `Life is what happens when you are busy making other plans.`,
    `The future belongs to those who believe in the beauty of their dreams.`,
    `Success is not the key to happiness. Happiness is the key to success.`,
    `The best time to plant a tree was twenty years ago. The second best time is now.`,
    `An unexamined life is not worth living.`,
    `Spread love everywhere you go. Let no one ever come to you without leaving happier.`,
    `When you reach the end of your rope, tie a knot in it and hang on.`,
    ],

    code: [
    `function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }`,
    `const arr = [1, 2, 3, 4, 5]; const sum = arr.reduce((acc, val) => acc + val, 0);`,
    `for (let i = 0; i < arr.length; i++) { if (arr[i] % 2 === 0) console.log(arr[i]); }`,
    `class Stack { constructor() { this.items = []; } push(item) { this.items.push(item); } }`,
    `const fetchData = async (url) => { const res = await fetch(url); return res.json(); };`,
    `function binarySearch(arr, target) { let lo = 0, hi = arr.length - 1; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); if (arr[mid] === target) return mid; else if (arr[mid] < target) lo = mid + 1; else hi = mid - 1; } return -1; }`,
    ],
};

//  State 
let timeMode    = 60;   // seconds
let typeMode    = 'words';
let text        = [];   // array of characters
let typed       = [];   // what user has typed
let startTime   = null;
let timerInterval = null;
let timeLeft    = 60;
let started     = false;
let finished    = false;
let totalErrors = 0;
let best        = {};   // { 'words-60': wpm, ... }

//  Generate text 
function generateText() {
    if (typeMode === 'words') {
        const words = [];
        const pool  = POOLS.words;
        while (words.join(' ').length < 300) {
            words.push(pool[Math.floor(Math.random() * pool.length)]);
        }
        
        return words.join(' ');
    }
    if (typeMode === 'quotes') {
        const q = POOLS.quotes;
       return q[Math.floor(Math.random() * q.length)];
    }
    
    if (typeMode === 'code') {
        const c = POOLS.code;
        return c[Math.floor(Math.random() * c.length)];
    }
}

// Init/Restart
function restart() {
    clearInterval(timerInterval);
    started     = false;
    finished    = false;
    totalErrors = 0;
    timeLeft    = timeMode;
    typed       = [];
    startTime   = null;
    
    text = generateText().split('');

    renderText();
    updateStats(0, 100, 0);
    document.getElementById('progress-bar').style.width = '100%';
    document.getElementById('timer-display').textContent = timeLeft + 's';
    document.getElementById('result-panel').classList.add('hidden');
    document.getElementById('type-input').value      = '';
    document.getElementById('type-input').disabled   = false;
    document.getElementById('type-input').focus();
}

// Render text display 
function renderText(typedArr = []) {
    const display = document.getElementById('text-display');
    let html = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i] === ' ' ? '\u00a0' : text[i];  // non-breaking space
        if (i < typedArr.length) {
            if (typedArr[i] === text[i]) {
                html += `<span class="ch correct">${ch}</span>`;
            } else {
                const cls = text[i] === ' ' ? 'ch wrong space-wrong' : 'ch wrong';
                html += `<span class="${cls}">${ch}</span>`;
            }
        } else if (i === typedArr.length) {
            html += `<span class="ch current">${ch}</span>`;
        } else {
            html += `<span class="ch pending">${ch}</span>`;
        }
    }
    // Extra characters typed beyond text length
    for (let i = text.length; i < typedArr.length; i++) {
        html += `<span class="ch extra">${typedArr[i]}</span>`;
    }
    display.innerHTML = html;
    
    // Scroll current character into view
    const cur = display.querySelector('.current, .ch:last-child');
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

// Input handler 
document.getElementById('type-input').addEventListener('input', e => {
    if (finished) return;
    
    const val = e.target.value;
    
    // Start timer on first keystroke
    if (!started && val.length > 0) {
        started   = true;
        startTime = Date.now();
        timerInterval = setInterval(tick, 100);
    }
    
    
    typed = val.split('');

    //  Count errors
    let errors = 0;
    for (let i = 0; i < typed.length; i++) {
        if (i >= text.length || typed[i] !== text[i]) errors++;
    }
    totalErrors = errors; 
    
    renderText(typed);

  // Live stats
    const elapsed  = started ? (Date.now() - startTime) / 60000 : 0;
    const correctChars = typed.filter((ch, i) => i < text.length && ch === text[i]).length;
    const rawChars     = typed.length;
    const wpm    = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
    const rawWpm = elapsed > 0 ? Math.round((rawChars / 5) / elapsed) : 0;
  const acc    = typed.length > 0 ? Math.round((1 - totalErrors / typed.length) * 100) : 100;
    updateStats(wpm, acc, rawWpm);

    // Auto-finish if typed entire text correctly
    if (typed.length >= text.length && errors === 0) {
    endTest();
    }
    // If quotes/code mode: allow finishing even with some errors after reaching end
    if ((typeMode === 'quotes' || typeMode === 'code') && typed.length >= text.length) {
    endTest();
    }
});

// Timer tick
function tick() {
    if (!started) return;
    timeLeft = Math.max(0, timeMode - (Date.now() - startTime) / 1000);
    const pct = timeLeft / timeMode * 100;
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('timer-display').textContent = Math.ceil(timeLeft) + 's';
    
    // Live WPM update
    const elapsed = (Date.now() - startTime) / 60000;
    const correct = typed.filter((ch, i) => i < text.length && ch === text[i]).length;
    const wpm     = elapsed > 0 ? Math.round((correct / 5) / elapsed) : 0;
    const rawWpm  = elapsed > 0 ? Math.round((typed.length / 5) / elapsed) : 0;
    const acc     = typed.length > 0 ? Math.round((1 - totalErrors / typed.length) * 100) : 100;
    updateStats(wpm, acc, rawWpm);
    
    if (timeLeft <= 0) endTest();
}

//  End test 
function endTest() {
    if (finished) return;
    finished = true;
    clearInterval(timerInterval);
    document.getElementById('type-input').disabled = true;
    
    const elapsed      = (Date.now() - startTime) / 60000 || (timeMode / 60);
    const correctChars = typed.filter((ch, i) => i < text.length && ch === text[i]).length;
    const rawChars     = typed.length;
    const wpm          = Math.round((correctChars / 5) / elapsed);
    const rawWpm       = Math.round((rawChars / 5) / elapsed);
    const acc          = typed.length > 0 ? Math.round((1 - totalErrors / typed.length) * 100) : 100;
    const errors       = totalErrors;
    
    const grade = wpm >= 100 ? 'S 🏆' : wpm >= 80 ? 'A ⭐' : wpm >= 60 ? 'B 👍' : wpm >= 40 ? 'C 😊' : wpm >= 20 ? 'D 🙂' : 'F 😅';  
    
    // Best score
    const bKey = `${typeMode}-${timeMode}`;
    let isNew  = false;
    if (!best[bKey] || wpm > best[bKey]) { best[bKey] = wpm; isNew = true; }
    
    // Show result panel
    document.getElementById('res-wpm').textContent    = wpm;
    document.getElementById('res-raw').textContent    = rawWpm;
    document.getElementById('res-acc').textContent    = acc + '%';
    document.getElementById('res-chars').textContent  = correctChars;
    document.getElementById('res-errors').textContent = errors;
    document.getElementById('res-grade').textContent  = grade;
    document.getElementById('best-row').textContent   = isNew
    ? `🏆 New best for ${typeMode} ${timeMode}s: ${wpm} WPM!`
    : `Your best for ${typeMode} ${timeMode}s: ${best[bKey]} WPM`;

    document.getElementById('result-panel').classList.remove('hidden');
}

// Update live stats 
function updateStats(wpm, acc, raw) {
    document.getElementById('wpm').textContent     = wpm;
    document.getElementById('raw-wpm').textContent = raw;
    document.getElementById('accuracy').textContent = acc + '%';
}

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const val  = btn.dataset.val;
        document.querySelectorAll(`.mode-btn[data-type="${type}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (type === 'time') timeMode = +val;
        if (type === 'mode') typeMode = val;
        restart();
    });
});

// Controls buttons
document.getElementById('restart-btn').addEventListener('click', restart);
document.getElementById('next-btn').addEventListener('click', restart);
document.getElementById('try-again-btn').addEventListener('click', restart);

// Focus input when clicking text display
document.getElementById('text-display').addEventListener('click', () => {
    document.getElementById('type-input').focus();
});

// Start
restart();