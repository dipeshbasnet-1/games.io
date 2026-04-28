//  Hub
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const W=600,H=400,PAD_W=10,PAD_H=70,BALL_R=8;

let mode='ai';
let aiLevel='easy';

let p1,p2,ball,score,state;
let keys={};
let mouse={y:H/2};

// Input
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  mouse.y=e.clientY-r.top;
});

canvas.addEventListener('click',()=>{
  if(state==='idle') state='play';
});

document.addEventListener('keydown',e=>{
  keys[e.key]=true;
  if(e.code==='Space' && state==='idle'){
    e.preventDefault();
    state='play';
  }
});

document.addEventListener('keyup',e=>delete keys[e.key]);

// Mode
function setMode(m,btn){
  mode=m;
  document.querySelectorAll('.row:nth-child(1) button')
    .forEach(b=>b.classList.remove('active-btn'));
  btn.classList.add('active-btn');

  document.querySelectorAll('.row:nth-child(2) button')
    .forEach(b=>b.disabled = (mode==='2p'));

  init();
}

function setAI(level,btn){
  aiLevel=level;
  document.querySelectorAll('.row:nth-child(2) button')
    .forEach(b=>b.classList.remove('active-btn'));
  btn.classList.add('active-btn');
  init();
}

// Init
function init(){
  p1={x:20,y:H/2-PAD_H/2};
  p2={x:W-20-PAD_W,y:H/2-PAD_H/2};

  ball={
    x:W/2,
    y:H/2,
    vx:(Math.random()<.5?1:-1)*4,
    vy:(Math.random()-.5)*4
  };

  score={a:0,b:0};
  state='idle';

  updateScoreUI();

  requestAnimationFrame(loop);
}

// Loop
let last=0;
function loop(ts){
  requestAnimationFrame(loop);
  const dt=Math.min((ts-last)/16,3);
  last=ts;

  if(state==='play') update(dt);
  draw();
}

// Update
function update(dt){

  // LEFT
  if(keys['w']||keys['W']) p1.y-=6*dt;
  if(keys['s']||keys['S']) p1.y+=6*dt;
  p1.y=Math.max(0,Math.min(H-PAD_H,p1.y));

  // RIGHT
  if(mode==='2p'){
    if(keys['ArrowUp']) p2.y-=6*dt;
    if(keys['ArrowDown']) p2.y+=6*dt;
  } else {
    let speed,error;
    if(aiLevel==='easy'){speed=2.5;error=30;}
    else if(aiLevel==='medium'){speed=3.5;error=20;}
    else if(aiLevel==='hard'){speed=5;error=10;}
    else{speed=7;error=0;}

    const target = ball.y - PAD_H/2 + (Math.random()*error - error/2);
    const diff = target - p2.y;

    p2.y += Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
  }

  p2.y=Math.max(0,Math.min(H-PAD_H,p2.y));

  // BALL
  ball.x+=ball.vx*dt;
  ball.y+=ball.vy*dt;

  if(ball.y<0 || ball.y>H) ball.vy*=-1;

  // COLLISION
  if(ball.x<p1.x+PAD_W && ball.y>p1.y && ball.y<p1.y+PAD_H){
    ball.vx=Math.abs(ball.vx);
  }

  if(ball.x>p2.x && ball.y>p2.y && ball.y<p2.y+PAD_H){
    ball.vx=-Math.abs(ball.vx);
  }

  // SCORE
  if(ball.x<0){score.b++; reset();}
  if(ball.x>W){score.a++; reset();}
}

// Reset
function reset(){
  ball.x=W/2;
  ball.y=H/2;
  ball.vx=(Math.random()<.5?1:-1)*4;
  ball.vy=(Math.random()-.5)*4;
  state='idle';

  updateScoreUI();

  const center=document.getElementById('centerText');

  if(score.a>score.b) center.textContent="🔥 YOU LEAD";
  else if(score.b>score.a) center.textContent="⚡ AI DOMINATING";
  else center.textContent="⚖️ TIE GAME";
}

function updateScoreUI(){
  document.getElementById('leftLabel').textContent =
    mode==='2p'?'P1':'YOU';

  document.getElementById('rightLabel').textContent =
    mode==='2p'?'P2':'AI';

  document.getElementById('leftScore').textContent = score.a;
  document.getElementById('rightScore').textContent = score.b;
}

//  Draw
function draw(){
  ctx.fillStyle='#0a0a0a';
  ctx.fillRect(0,0,W,H);

  ctx.setLineDash([10,10]);
  ctx.strokeStyle='#222';
  ctx.beginPath();
  ctx.moveTo(W/2,0);
  ctx.lineTo(W/2,H);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle='#4ade80';
  ctx.fillRect(p1.x,p1.y,PAD_W,PAD_H);

  ctx.fillStyle='#60a5fa';
  ctx.fillRect(p2.x,p2.y,PAD_W,PAD_H);

  ctx.fillStyle='#fff';
  ctx.beginPath();
  ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2);
  ctx.fill();

  if(state==='idle'){
    ctx.fillStyle='#888';
    ctx.font='14px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Press SPACE to start',W/2,H-20);
  }
}

init();