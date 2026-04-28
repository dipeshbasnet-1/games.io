const CLASSIC = ["rock","paper","scissors"];
const EXTENDED = ["rock","paper","scissors","lizard","spock"];

const BEATS = {
  rock:["scissors","lizard"],
  paper:["rock","spock"],
  scissors:["paper","lizard"],
  lizard:["paper","spock"],
  spock:["rock","scissors"]
};

const EMOJI = {
  rock:"✊",
  paper:"✋",
  scissors:"✌️",
  lizard:"🦎",
  spock:"🖖"
};

let mode="classic";
let choices=CLASSIC;

let score={you:0,ai:0,draw:0};
let history=[];
let playerSeq=[];
let round=1;

// INIT
buildChoices();

// MODE SWITCH
document.querySelectorAll(".mode-btn").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".mode-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    mode=btn.dataset.mode;
    choices = mode==="classic"?CLASSIC:EXTENDED;

    resetGame();
    buildChoices();
  };
});

// BUILD BUTTONS
function buildChoices(){
  const div=document.getElementById("choices");
  div.innerHTML="";
  choices.forEach(c=>{
    const btn=document.createElement("div");
    btn.className="choice";
    btn.innerHTML=`<span>${EMOJI[c]}</span>${c}`;
    btn.onclick=()=>play(c);
    div.appendChild(btn);
  });
}

// PLAY
function play(choice){
  const aiChoice=getAIChoice();

  let result="";
  if(choice===aiChoice) result="draw";
  else if(BEATS[choice].includes(aiChoice)) result="win";
  else result="lose";

  playerSeq.push(choice);
  if(playerSeq.length>30) playerSeq.shift();

  if(result==="win") score.you++;
  if(result==="lose") score.ai++;
  if(result==="draw") score.draw++;

  history.push(result[0].toUpperCase());
  if(history.length>10) history.shift();

  updateUI(choice,aiChoice,result);
  updateInsight();

  round++;
}

// SMART AI
function getAIChoice(){
  if(playerSeq.length<5) return random();

  let freq={};
  choices.forEach(c=>freq[c]=0);

  playerSeq.forEach(c=>freq[c]++);

  let predicted=Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b);

  let counter = choices.find(c=>BEATS[c].includes(predicted));
  return counter || random();
}

function random(){
  return choices[Math.floor(Math.random()*choices.length)];
}

// UI
function updateUI(you,ai,result){
  document.getElementById("you-move").textContent=EMOJI[you];
  document.getElementById("ai-move").textContent=EMOJI[ai];

  document.getElementById("result").textContent =
    `${you} vs ${ai} → ${result.toUpperCase()}`;

  document.getElementById("you").textContent=score.you;
  document.getElementById("ai").textContent=score.ai;
  document.getElementById("draw").textContent=score.draw;

  document.getElementById("round").textContent=round;
  document.getElementById("history").textContent=history.join(" ");
}

// INSIGHT
function updateInsight(){
  if(playerSeq.length<5){
    document.getElementById("insight").textContent =
      "Play few more rounds for AI analysis...";
    return;
  }

  let freq={};
  choices.forEach(c=>freq[c]=0);
  playerSeq.forEach(c=>freq[c]++);

  let top=Object.keys(freq).reduce((a,b)=>freq[a]>freq[b]?a:b);

  document.getElementById("insight").textContent =
    `You favor "${top}" (${Math.round(freq[top]/playerSeq.length*100)}%)`;
}

// RESET
document.getElementById("reset").onclick=resetGame;
document.getElementById("new").onclick=resetGame;

function resetGame(){
  score={you:0,ai:0,draw:0};
  history=[];
  playerSeq=[];
  round=1;

  updateUI("❓","❓","Start");
  document.getElementById("history").textContent="";
  document.getElementById("insight").textContent="Play few rounds...";
}