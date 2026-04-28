/* Quiz Game
 * Features: 3 categories (Science, Technology, History) + Mixed,
 *           3 difficulty levels, 15 questions per round, per-question timer,
 *           combo/streak scoring, grade + medal system, answer review,
 *           best score tracking, animated feedback
 */

// Question Bank 
const QUESTIONS = {
    
    science: [
    // Easy
    { q: 'What is the chemical symbol for water?', opts: ['H₂O','CO₂','NaCl','O₂'], ans: 0, diff: 'Easy' },
    { q: 'How many planets are in our solar system?', opts: ['7','8','9','10'], ans: 1, diff: 'Easy' },
    { q: 'What force keeps us on the ground?', opts: ['Magnetism','Friction','Gravity','Tension'], ans: 2, diff: 'Easy' },
    { q: 'What gas do plants absorb during photosynthesis?', opts: ['Oxygen','Nitrogen','CO₂','Hydrogen'], ans: 2, diff: 'Easy' },
    { q: 'What is the center of an atom called?', opts: ['Electron','Proton','Nucleus','Neutron'], ans: 2, diff: 'Easy' },
    // Medium
    { q: 'What is the speed of light (approx)?', opts: ['3×10⁸ m/s','3×10⁶ m/s','3×10¹⁰ m/s','3×10⁴ m/s'], ans: 0, diff: 'Medium' },
    { q: 'What is the powerhouse of the cell?', opts: ['Nucleus','Ribosome','Mitochondria','Golgi body'], ans: 2, diff: 'Medium' },
    { q: 'What is the atomic number of Carbon?', opts: ['4','6','8','12'], ans: 1, diff: 'Medium' },
    { q: 'Which blood type is the universal donor?', opts: ['A+','B-','AB+','O-'], ans: 3, diff: 'Medium' },
    { q: 'What unit measures electric current?', opts: ['Volt','Watt','Ampere','Ohm'], ans: 2, diff: 'Medium' },
    // Hard
    { q: 'What is the half-life of Carbon-14?', opts: ['1,000 years','5,730 years','10,000 years','50,000 years'], ans: 1, diff: 'Hard' },
    { q: 'What is the Heisenberg Uncertainty Principle about?', opts: ['Quantum energy levels','Measuring position and momentum simultaneously','Speed of light','Wave-particle duality'], ans: 1, diff: 'Hard' },
    { q: 'Which particle has a fractional charge?', opts: ['Electron','Proton','Quark','Neutron'], ans: 2, diff: 'Hard' },
    { q: 'What is the Avogadro constant (approx)?', opts: ['6.02×10²³','6.02×10¹⁰','3.14×10⁸','1.38×10⁻²³'], ans: 0, diff: 'Hard' },
    { q: 'DNA replication is described as:', opts: ['Conservative','Dispersive','Semi-conservative','Fully conservative'], ans: 2, diff: 'Hard' },
    ],

    technology: [
    // Easy
    { q: 'What does CPU stand for?', opts: ['Central Processing Unit','Core Processing Unit','Computer Power Unit','Central Power Unit'], ans: 0, diff: 'Easy' },
    { q: 'Which language is used for web page styling?', opts: ['HTML','JavaScript','CSS','Python'], ans: 2, diff: 'Easy' },
    { q: 'What does HTML stand for?', opts: ['HyperText Markup Language','HighText Machine Language','HyperText Modern Language','HyperText Main Link'], ans: 0, diff: 'Easy' },
    { q: 'What does RAM stand for?', opts: ['Read Access Memory','Random Access Memory','Run Active Memory','Rapid Array Memory'], ans: 1, diff: 'Easy' },
    { q: 'Who founded Microsoft?', opts: ['Steve Jobs','Mark Zuckerberg','Bill Gates','Elon Musk'], ans: 2, diff: 'Easy' },
    // Medium
    { q: 'What is the base of binary number system?', opts: ['8','10','2','16'], ans: 2, diff: 'Medium' },
    { q: 'Which data structure uses LIFO order?', opts: ['Queue','Stack','Array','Tree'], ans: 1, diff: 'Medium' },
    { q: 'What does HTTP stand for?', opts: ['HyperText Transfer Protocol','HighText Transfer Protocol','HyperText Transmission Protocol','HyperText Transport Process'], ans: 0, diff: 'Medium' },
    { q: 'Which sorting algorithm has O(n log n) average complexity?', opts: ['Bubble Sort','Selection Sort','Merge Sort','Insertion Sort'], ans: 2, diff: 'Medium' },
    { q: 'What does SQL stand for?', opts: ['Structured Query Language','Standard Query Language','Strong Query Language','Simple Query Language'], ans: 0, diff: 'Medium' },
    // Hard
    { q: 'What is Big O notation for linear search?', opts: ['O(1)','O(log n)','O(n)','O(n²)'], ans: 2, diff: 'Hard' },
    { q: 'Which protocol operates at Layer 3 of the OSI model?', opts: ['TCP','HTTP','IP','Ethernet'], ans: 2, diff: 'Hard' },
    { q: 'In OOP, what is polymorphism?', opts: ['Hiding data','One class inheriting another','Objects taking many forms','Combining two classes'], ans: 2, diff: 'Hard' },
    { q: 'What is a deadlock in OS?', opts: ['CPU overload','Two processes waiting on each other indefinitely','Memory overflow','Disk failure'], ans: 1, diff: 'Hard' },
    { q: 'What does ACID stand for in databases?', opts: ['Atomicity Consistency Isolation Durability','Access Control Integrity Data','Async Consistent Indexed Database','Atomic Command Indexed Durable'], ans: 0, diff: 'Hard' },
    ],
    
    history: [
    // Easy
    { q: 'In which year did World War II end?', opts: ['1943','1944','1945','1946'], ans: 2, diff: 'Easy' },
    { q: 'Who was the first President of the United States?', opts: ['Abraham Lincoln','Thomas Jefferson','George Washington','John Adams'], ans: 2, diff: 'Easy' },
    { q: 'Who wrote the Declaration of Independence?', opts: ['George Washington','Benjamin Franklin','Thomas Jefferson','John Adams'], ans: 2, diff: 'Easy' },
    { q: 'In which country was the first modern Olympic Games held (1896)?', opts: ['France','England','USA','Greece'], ans: 3, diff: 'Easy' },
    { q: 'Which ancient wonder was located at Alexandria?', opts: ['Colossus','The Lighthouse','Hanging Gardens','Statue of Zeus'], ans: 1, diff: 'Easy' },
    // Medium
    { q: 'In which year did the Berlin Wall fall?', opts: ['1987','1988','1989','1991'], ans: 2, diff: 'Medium' },
    { q: 'Which empire was the largest in world history?', opts: ['Roman Empire','British Empire','Mongol Empire','Ottoman Empire'], ans: 2, diff: 'Medium' },
    { q: 'Who invented the printing press?', opts: ['Leonardo da Vinci','Galileo Galilei','Johannes Gutenberg','Isaac Newton'], ans: 2, diff: 'Medium' },
    { q: 'The French Revolution began in which year?', opts: ['1776','1789','1804','1815'], ans: 1, diff: 'Medium' },
    { q: 'Who was the first human to journey into outer space?', opts: ['Neil Armstrong','Buzz Aldrin','Yuri Gagarin','Alan Shepard'], ans: 2, diff: 'Medium' },
    // Hard
    { q: 'The Battle of Thermopylae was fought between which two forces?', opts: ['Rome vs Carthage','Greeks vs Persians','Athens vs Sparta','Alexander vs Persia'], ans: 1, diff: 'Hard' },
    { q: 'Which treaty ended World War I?', opts: ['Treaty of Paris','Treaty of Vienna','Treaty of Versailles','Treaty of Berlin'], ans: 2, diff: 'Hard' },
    { q: 'The Magna Carta was signed in which year?', opts: ['1066','1215','1415','1492'], ans: 1, diff: 'Hard' },
    { q: 'Who was the first female Prime Minister of the UK?', opts: ['Angela Merkel','Indira Gandhi','Margaret Thatcher','Golda Meir'], ans: 2, diff: 'Hard' },
    { q: 'The Opium Wars were fought between China and which country?', opts: ['France','USA','Russia','Britain'], ans: 3, diff: 'Hard' },
    ],
};

// Difficulty time limits 
const DIFF_TIME = { easy: 20, medium: 15, hard: 10 };
const DIFF_PTS  = { Easy: 100, Medium: 200, Hard: 350 };

// State
let category   = '';
let difficulty = 'medium';
let questions  = [];
let qIndex     = 0;
let score      = 0;
let streak     = 0;
let bestStreak = 0;
let timeLeft   = 15;
let timerInt   = null;
let answered   = false;
let totalTime  = 0;
let startTime  = null;
let history    = [];  // {q, correct, chosen, timeTaken}
let best       = {};  // { 'science-medium': score }

// Screens
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

//Start quiz
function startQuiz(cat) {
    category   = cat;
    difficulty = document.querySelector('input[name="diff"]:checked').value;
    qIndex     = 0;
    score      = 0;
    streak     = 0;
    bestStreak = 0;
    history    = [];
    startTime  = Date.now();

    // Pick questions
    if (cat === 'mixed') {
        const all = [...QUESTIONS.science, ...QUESTIONS.technology, ...QUESTIONS.history];
        questions  = shuffle(all).slice(0, 15);
    } else {
    questions = shuffle(QUESTIONS[cat]).slice(0, 15);
    }

// Filter by difficulty
if (difficulty !== 'medium') {
    const diffLabel = difficulty === 'easy' ? 'Easy' : 'Hard';
    const filtered  = questions.filter(q => q.diff === diffLabel);
    if (filtered.length >= 10) {
        questions = shuffle(filtered).slice(0, 15);
    }
}
    
    document.getElementById('cat-badge').textContent =
    cat.charAt(0).toUpperCase() + cat.slice(1);

    showScreen('quiz-screen');
    showQuestion();
}

// Show Question
function showQuestion() {
    answered = false;
    const q  = questions[qIndex];

// Progress
    const pct = (qIndex / questions.length) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('q-counter').textContent     = `${qIndex + 1} / ${questions.length}`;
    document.getElementById('live-score').textContent    = score;
    document.getElementById('live-streak').textContent   = streak;

// Question
    document.getElementById('q-difficulty').textContent = q.diff;
    document.getElementById('q-text').textContent       = q.q;

// Shuffle options keeping track of correct
const shuffled = q.opts.map((text, i) => ({ text, isAns: i === q.ans }));
shuffle(shuffled);

// Options
    const grid    = document.getElementById('options-grid');
    grid.innerHTML = '';
    const labels   = ['A', 'B', 'C', 'D'];
    shuffled.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-label">${labels[i]}</span><span>${opt.text}</span>`;
        btn.addEventListener('click', () => handleAnswer(btn, opt.isAns, q));
        grid.appendChild(btn);
    });

    // Timer
    timeLeft = DIFF_TIME[difficulty] || 15;
    updateTimerDisplay();
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) handleTimeout(q);
    }, 1000);

    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('feedback-msg').classList.add('hidden');
    document.getElementById('feedback-msg').className = 'feedback-msg hidden';
}

// Handle answer
function handleAnswer(btn, isCorrect, q) {
    if (answered) return;
    answered = true;
    clearInterval(timerInt);

    const timeTaken = (DIFF_TIME[difficulty] || 15) - timeLeft;

// Disable all options, reveal correct
    document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        const isAns = b.querySelector('span:last-child').textContent === q.opts[q.ans];
        if (isAns) b.classList.add('correct');
    });

    let pts = 0;
    if (isCorrect) {
        btn.classList.add('correct');
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        pts = (DIFF_PTS[q.diff] || 100) + Math.max(0, (timeLeft * 10)) + (streak > 1 ? streak * 20 : 0);
        score += pts;
        showFeedback(true, `+${pts} pts${streak > 1 ? ` (${streak}x streak!)` : ''}`);
    } else {
        btn.classList.add('wrong');
        streak = 0;
        showFeedback(false, `Correct answer: ${q.opts[q.ans]}`);
    }

    history.push({ q: q.q, correct: isCorrect, chosen: btn.querySelector('span:last-child').textContent, answer: q.opts[q.ans], timeTaken });

    document.getElementById('live-score').textContent  = score;
    document.getElementById('live-streak').textContent = streak;
    document.getElementById('next-btn').classList.remove('hidden');
}

// Timeout
function handleTimeout(q) {
    if (answered) return;
    answered = true;
    clearInterval(timerInt);
    streak = 0;

    document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        if (b.querySelector('span:last-child').textContent === q.opts[q.ans]) b.classList.add('correct');
    }); 

    showFeedback(false, `Time's up! Answer: ${q.opts[q.ans]}`);
    history.push({ q: q.q, correct: false, chosen: '—', answer: q.opts[q.ans], timeTaken: DIFF_TIME[difficulty] });
    document.getElementById('next-btn').classList.remove('hidden');
}

// Feedback
function showFeedback(correct, msg) {
    const el = document.getElementById('feedback-msg');
    el.textContent = msg;
    el.className   = 'feedback-msg ' + (correct ? 'correct' : 'wrong');
}

// Timer display
function updateTimerDisplay() {
    const el = document.getElementById('timer-num');
    el.textContent = timeLeft;
    const circle = document.getElementById('timer-circle');
    const maxTime = DIFF_TIME[difficulty] || 15;
    circle.className = 'timer-circle' +
    (timeLeft <= 3 ? ' danger' : timeLeft <= Math.ceil(maxTime * 0.4) ? ' warning' : '');
}

// Next Question
document.getElementById('next-btn').addEventListener('click', () => {
    qIndex++;
    if (qIndex >= questions.length) {
    showResult();
    } else {
    showQuestion();
    }
});

// Show result 
function showResult() {
    const correct  = history.filter(h => h.correct).length;
    const total    = history.length;
    const acc      = Math.round((correct / total) * 100);
    const avgTime  = Math.round(history.reduce((s, h) => s + h.timeTaken, 0) / total);

    const pct = acc;
    const grade =
    pct === 100         ? 'S+' :
    pct >= 90           ? 'S'  :
    pct >= 80           ? 'A+' :
    pct >= 70           ? 'A'  :
    pct >= 60           ? 'B+' :
    pct >= 50           ? 'B'  :
    pct >= 40           ? 'C'  :
    pct >= 30           ? 'D'  : 'F';

    const medal =
    pct >= 90 ? '🏆' : pct >= 70 ? '🥇' : pct >= 50 ? '🥈' : pct >= 30 ? '🥉' : '😢';

   // Best score
    const bKey = `${category}-${difficulty}`;
    let isNew  = false;
    if (!best[bKey] || score > best[bKey]) { best[bKey] = score; isNew = true; }

    document.getElementById('result-medal').textContent   = medal;
    document.getElementById('result-grade').textContent   = grade;
    document.getElementById('res-score').textContent      = score;
    document.getElementById('res-correct').textContent    = `${correct}/${total}`;
    document.getElementById('res-acc').textContent        = acc + '%';
    document.getElementById('res-streak').textContent     = bestStreak;
    document.getElementById('res-time').textContent       = avgTime + 's';
    document.getElementById('res-best').textContent       = isNew ? `${score} 🆕` : best[bKey];

    // Review list
    const list = document.getElementById('review-list');
    list.innerHTML = '';
    history.forEach((h, i) => {
        const item = document.createElement('div');
        item.className = 'review-item ' + (h.correct ? 'correct' : 'wrong');
        item.innerHTML = `
        <div class="review-q">${i + 1}. ${h.q}</div>
        <div class="review-a">
        Your answer: <span class="${h.correct ? 'cor' : 'err'}">${h.chosen}</span>
        ${!h.correct ? `· Correct: <span class="cor">${h.answer}</span>` : ''}
        · Time: ${h.timeTaken}s
        </div>
        `;
        list.appendChild(item);
    });

    showScreen('result-screen');
}

// Home screen buttons 
document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => startQuiz(card.dataset.cat));
});

document.getElementById('back-btn').addEventListener('click', () => {
    clearInterval(timerInt);
    showScreen('home-screen');
});

document.getElementById('play-again-btn').addEventListener('click', () => startQuiz(category));
document.getElementById('change-cat-btn').addEventListener('click', () => showScreen('home-screen'));

// Utility
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Start
showScreen('home-screen');