/* Word Scramble
 * Features: 4 categories (CS/Tech, Animals, Countries, Mixed),
 *           click tiles to build answer, remove letters by clicking slots,
 *           30s per-word countdown timer, hint system (reveals one letter),
 *           combo streak scoring, bonus for speed, best score tracking,
 *           10-word rounds, full result screen with stats
 */

// Word Banks
const WORD_BANKS = {
    cs: [
        { word: 'ALGORITHM',   hint: 'Step-by-step procedure for calculations' },
        { word: 'VARIABLE',    hint: 'Named storage location in programming' },
        { word: 'RECURSION',   hint: 'A function calling itself' },
        { word: 'BOOLEAN',     hint: 'True or False data type' },
        { word: 'COMPILER',    hint: 'Converts source code to machine code' },
        { word: 'DATABASE',    hint: 'Organized collection of structured data' },
        { word: 'FUNCTION',    hint: 'A reusable named block of code' },
        { word: 'NETWORK',     hint: 'Interconnected group of computers' },
        { word: 'ITERATOR',    hint: 'Object used to traverse a collection' },
        { word: 'INTERFACE',   hint: 'Contract defining methods a class must have' },
        { word: 'FRAMEWORK',   hint: 'Pre-built structure for building software' },
        { word: 'EXCEPTION',   hint: 'Runtime error that disrupts normal flow' },
        { word: 'ENCRYPTION',  hint: 'Converting data into a coded form' },
        { word: 'INHERITANCE', hint: 'Child class adopting parent class properties' },
        { word: 'POLYMORPHISM',hint: 'One interface, many implementations' },
        { word: 'DEBUGGING',   hint: 'Finding and fixing errors in code' },
        { word: 'ABSTRACTION', hint: 'Hiding complex details, showing only essentials' },
        { word: 'BANDWIDTH',   hint: 'Amount of data transmitted per second' },
        { word: 'PROTOTYPE',   hint: 'Early model or template of a product' },
        { word: 'REPOSITORY',  hint: 'Storage location for version-controlled code' },
    ],
    
    animals: [
        { word: 'ELEPHANT',    hint: 'Largest land animal with a trunk' },
        { word: 'CROCODILE',   hint: 'Large reptile living near water' },
        { word: 'BUTTERFLY',   hint: 'Insect with colorful wings' },
        { word: 'PENGUIN',     hint: 'Flightless bird that swims in cold climates' },
        { word: 'CHEETAH',     hint: 'Fastest land animal on Earth' },
        { word: 'DOLPHIN',     hint: 'Highly intelligent marine mammal' },
        { word: 'FLAMINGO',    hint: 'Pink bird that stands on one leg' },
        { word: 'GORILLA',     hint: 'Largest living primate' },
        { word: 'KANGAROO',    hint: 'Marsupial native to Australia' },
        { word: 'CHAMELEON',   hint: 'Lizard that changes its skin color' },
        { word: 'PORCUPINE',   hint: 'Rodent covered in sharp quills' },
        { word: 'WOLVERINE',   hint: 'Fierce, stocky carnivorous mammal' },
        { word: 'OCTOPUS',     hint: 'Eight-armed sea creature' },
        { word: 'RHINOCEROS',  hint: 'Large mammal with a horn on its nose' },
        { word: 'HAMSTER',     hint: 'Small rodent kept as a pet' },
    ],
    countries: [
        { word: 'AUSTRALIA',   hint: 'Country and continent in the Southern Hemisphere' },
        { word: 'ARGENTINA',   hint: 'Second-largest country in South America' },
        { word: 'PORTUGAL',    hint: 'Country in southwestern Europe' },
        { word: 'ETHIOPIA',    hint: 'Oldest independent country in Africa' },
        { word: 'MALAYSIA',    hint: 'Southeast Asian country split by the South China Sea' },
        { word: 'COLOMBIA',    hint: 'South American country famous for coffee' },
        { word: 'INDONESIA',   hint: 'Archipelago nation with over 17,000 islands' },
        { word: 'SWITZERLAND', hint: 'Landlocked country famous for watches and chocolate' },
        { word: 'PHILIPPINES', hint: 'Island nation in Southeast Asia' },
        { word: 'VENEZUELA',   hint: 'South American country with Angel Falls' },
        { word: 'CAMEROON',    hint: 'Central African country called "Africa in miniature"' },
        { word: 'SINGAPORE',   hint: 'City-state island in Southeast Asia' },
        { word: 'TANZANIA',    hint: 'East African country home to Kilimanjaro' },
        { word: 'UKRAINE',     hint: 'Largest country entirely in Europe' },
        { word: 'MONGOLIA',    hint: 'Landlocked country between Russia and China' },
    ],
};

// Build mixed pool
WORD_BANKS.mixed = shuffle([
    ...WORD_BANKS.cs,
    ...WORD_BANKS.animals,
    ...WORD_BANKS.countries,
]).slice(0, 40);

// State
let category   = 'cs';
let wordList   = [];
let wordIndex  = 0;
let answer     = [];       // letters placed in slots
let tileUsed   = [];       // which source tiles are used
let tileMap    = [];       // maps slot → tile index
let score      = 0;
let best       = 0;
let streak     = 0;
let bestStreak = 0;
let hintUsed   = false;
let hintCount  = 0;
let timeLeft   = 30;
let timerInt   = null;
let startTime  = null;
let roundTimes = [];
let roundCorrect = 0;
const ROUND_SIZE = 10;

// Scramble
function scrambleWord(word) {
    let arr = word.split('');
    let tries = 0;
    do {
        arr = shuffle(arr);
        tries++;
    } while (arr.join('') === word && tries < 20);
    return arr;
}

// Start new game 
function newGame() {
    score      = 0;
    streak     = 0;
    bestStreak = 0;
    wordIndex  = 0;
    roundTimes = [];
    roundCorrect = 0;
    
    // Build round word list
    const pool = [...WORD_BANKS[category]];
    wordList   = shuffle(pool).slice(0, ROUND_SIZE);
    
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('feedback').className = 'feedback hidden';

    updateTopStats();
    startWord();
}

//Start a word 
function startWord() {
    if (wordIndex >= wordList.length) { showResult(); return; }
    
    hintUsed  = false;
    answer    = [];
    tileUsed  = [];
    tileMap   = [];
    startTime = Date.now();
    
    const entry = wordList[wordIndex];
    const tiles = scrambleWord(entry.word);
    tileUsed    = Array(tiles.length).fill(false);
    
    // Reset answer array to word length
    for (let i = 0; i < entry.word.length; i++) answer.push('');
    
    document.getElementById('hint-text').textContent = `Hint: ${entry.hint}`;
    document.getElementById('feedback').className = 'feedback hidden';
    
    renderScrambled(tiles);
    renderTiles(tiles);
    renderSlots(entry.word.length);
    updateTopStats();
    startTimer();
}

// Render scrambled word (decorative) 
function renderScrambled(tiles) {
    const el = document.getElementById('scrambled-display');
    el.innerHTML = tiles.map(l =>
        `<div class="scrambled-letter">${l}</div>`
    ).join('');
}

// Render clickable letter tiles 
function renderTiles(tiles) {
    const row = document.getElementById('tile-row');
    row.innerHTML = '';
    tiles.forEach((letter, i) => {
        const tile = document.createElement('div');
        tile.className    = 'letter-tile';
        tile.textContent  = letter;
        tile.dataset.idx  = i;
        tile.addEventListener('click', () => clickTile(i, letter, tile));
        row.appendChild(tile); 
    });
}

// Render answer slots 
function renderSlots(len) {
    const container = document.getElementById('answer-slots');
    container.innerHTML = '';
    for (let i = 0; i < len; i++) {
        const slot = document.createElement('div');
        slot.className   = 'answer-slot';
        slot.dataset.pos = i;
        slot.addEventListener('click', () => clickSlot(i));
        container.appendChild(slot);
    }
}

//  Click a letter tile → place in first empty slot 
function clickTile(tileIdx, letter, tileEl) {
    if (tileUsed[tileIdx]) return;
    const firstEmpty = answer.indexOf('');
    if (firstEmpty === -1) return;
    
    tileUsed[tileIdx] = true;
    answer[firstEmpty] = letter;
    tileMap[firstEmpty] = tileIdx;
    tileEl.classList.add('used');
    
    updateSlotDisplay();  
}

// Click a slot → remove that letter, free its tile 
function clickSlot(pos) {
    if (!answer[pos]) return;
    
    const tileIdx = tileMap[pos];
    tileUsed[tileIdx] = false;
    
    const tileEl = document.querySelector(`.letter-tile[data-idx="${tileIdx}"]`);
    if (tileEl) tileEl.classList.remove('used');  
    
    answer[pos] = '';
    tileMap[pos] = undefined;
    updateSlotDisplay();
}

// Update slot display 
function updateSlotDisplay() {
    const slots = document.querySelectorAll('.answer-slot');
    slots.forEach((slot, i) => {
        slot.textContent = answer[i] || '';
        slot.classList.toggle('filled', !!answer[i]);
    });
}

// Check answer
function checkAnswer() {
    const word    = wordList[wordIndex].word;
    const guess   = answer.join('');
    
    if (guess.length < word.length) {
        showFeedback('Fill in all the letters first!', 'info');
        return;
    }
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    if (guess === word) {
    // Correct!
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    const speedBonus = Math.max(0, (30 - timeTaken) * 5);
    const comboBonus = streak > 1 ? streak * 20 : 0;
    const baseScore  = hintUsed ? 50 : 100;
    const pts        = baseScore + speedBonus + comboBonus;
    score += pts;
    roundCorrect++;
    roundTimes.push(timeTaken);
    
    flashSlots('correct-flash');
    showFeedback(`✓ Correct! +${pts} pts${streak > 1 ? ` (${streak}x streak!)` : ''}${hintUsed ? ' (hint used)' : ''}`, 'correct');
    
    updateTopStats();
    clearInterval(timerInt);
    wordIndex++;
    setTimeout(startWord, 1100);
    } else {
        streak = 0;
        flashSlots('wrong-flash');
        showFeedback(`✗ Not quite! Keep trying…`, 'wrong');
    }
}

// Flash Slots
function flashSlots(cls) {
    const slots = document.querySelectorAll('.answer-slot');
    slots.forEach(s => { s.classList.add(cls); setTimeout(() => s.classList.remove(cls), 450); });
}

// Clear answer
function clearAnswer() {
    answer = answer.map(() => '');
    tileUsed = tileUsed.map(() => false);
    tileMap  = [];
    document.querySelectorAll('.letter-tile').forEach(t => t.classList.remove('used'));
    updateSlotDisplay();
}

//  Hint: reveals first unplaced correct letter 
function giveHint() {
    if (hintCount >= 3) { showFeedback('No more hints! (max 3 per game)', 'info'); return; }
    hintUsed = true;
    hintCount++;
    
    const word = wordList[wordIndex].word;
    // Find first empty slot and place correct letter
    const firstEmpty = answer.indexOf('');
    if (firstEmpty === -1) { showFeedback('All slots filled!', 'info'); return; }
    
    const correctLetter = word[firstEmpty];
    
    // Find an unused tile with this letter
    const tiles = document.querySelectorAll('.letter-tile');
    for (const tile of tiles) {
        const idx = +tile.dataset.idx;
        if (!tileUsed[idx] && tile.textContent === correctLetter) {
            tileUsed[idx] = true;
            answer[firstEmpty] = correctLetter;
            tileMap[firstEmpty] = idx;
            tile.classList.add('used');
            tile.classList.add('hint-reveal');
            setTimeout(() => tile.classList.remove('hint-reveal'), 600);
            updateSlotDisplay();
            showFeedback(`💡 Hint used (${3 - hintCount} remaining). -50% score for this word`, 'info');
            return;
        }
    }
}

// SKip word
function skipWord() {
    clearInterval(timerInt);
    streak = 0;
    const word = wordList[wordIndex].word;
    showFeedback(`Skipped! The word was: ${word}`, 'wrong');
    roundTimes.push(30);
    wordIndex++;
    updateTopStats();
    setTimeout(startWord, 1000);
}

// Timer
function startTimer() {
    clearInterval(timerInt);
    timeLeft = 30;
    updateTimerDisplay();
    timerInt = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
        clearInterval(timerInt);
        streak = 0;
        const word = wordList[wordIndex].word;
        showFeedback(`Time's up! The word was: ${word}`, 'wrong');
        roundTimes.push(30);
        wordIndex++;
        updateTopStats();
        setTimeout(startWord, 1100);
    }
    }, 1000);
}

function updateTimerDisplay() {
    const pct  = timeLeft / 30 * 100;
    const fill = document.getElementById('timer-fill');
    fill.style.width = pct + '%';
    fill.className   = 'timer-fill' + (pct < 20 ? ' danger' : pct < 40 ? ' warn' : '');
    document.getElementById('timer-num').textContent = timeLeft;
}

// feedback
function showFeedback(msg, type) {
    const el = document.getElementById('feedback');
    el.textContent = msg;
    el.className   = 'feedback ' + type;
}

// Top stats
function updateTopStats() {
    if (score > best) best = score;
    document.getElementById('score').textContent    = score;
    document.getElementById('word-num').textContent = `${Math.min(wordIndex + 1, ROUND_SIZE)} / ${ROUND_SIZE}`;
    document.getElementById('streak').textContent   = streak;
    document.getElementById('best').textContent     = best;
}

// Result Screen
function showResult() {
    clearInterval(timerInt);
    const avgTime = roundTimes.length
    ? Math.round(roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length)
    : 0;

    const pct   = Math.round(roundCorrect / ROUND_SIZE * 100);
    const icon  = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👍' : '🎯';
    const title = pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Great job!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!';
    
    document.getElementById('result-icon').textContent  = icon;
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-desc').textContent  =
    `You got ${roundCorrect} out of ${ROUND_SIZE} words correct (${pct}%)`;
    document.getElementById('rs-score').textContent   = score;
    document.getElementById('rs-correct').textContent = `${roundCorrect}/${ROUND_SIZE}`;
    document.getElementById('rs-streak').textContent  = bestStreak;
    document.getElementById('rs-time').textContent    = avgTime + 's';
    
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('word-card').style.display = 'none';
    document.querySelectorAll('.answer-area,.tile-area,.controls,.timer-wrap,.feedback').forEach(el => {
        el.style.display = 'none';
    });
}

// Utility
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Controls
document.getElementById('check-btn').addEventListener('click', checkAnswer);
document.getElementById('clear-btn').addEventListener('click', clearAnswer);
document.getElementById('hint-btn').addEventListener('click', giveHint);
document.getElementById('skip-btn').addEventListener('click', skipWord);
document.getElementById('play-again-btn').addEventListener('click', () => {
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('word-card').style.display = '';
    document.querySelectorAll('.answer-area,.tile-area,.controls,.timer-wrap').forEach(el => {
        el.style.display = '';
    });
    hintCount = 0;
    newGame();
});

// Category buttons
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active');
        category = btn.dataset.cat;
        hintCount = 0;
        newGame();
    });
});

// Keyboard: Enter = check, Escape = clear
document.addEventListener('keydown', e => {
    if (e.key === 'Enter')  checkAnswer();
    if (e.key === 'Escape') clearAnswer();
});

// Start
newGame();