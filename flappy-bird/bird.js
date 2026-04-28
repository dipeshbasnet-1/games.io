/* FLAPPY BIRD (Improved Classic Feel)
- Fixed restart bug
- Single animation loop
- Smoother original-style pipe generation
- Better physics tuning
- Parallax stars
- Bird skins
- Particles
- Medal system
*/

// CANVAS
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// PHYSICS (Classic-ish tuning)
const GRAVITY = 0.50;
const FLAP_FORCE = -7.7;
const PIPE_W = 62;
const PIPE_GAP = 135;
const PIPE_SPAWN = 190;
const GROUND_H = 70;

// BIRD SKINS
const SKINS = {
  yellow:{
    body:"#ffd700",
    wing:"#f0a500",
    beak:"#f57c00",
    eye:"#fff",
    pupil:"#111"
  },
  
  red:{
    body:"#f87171",
    wing:"#dc2626",
    beak:"#92400e",
    eye:"#fff",
    pupil:"#111"
  },
  
  blue:{
    body:"#60a5fa",
    wing:"#2563eb",
    beak:"#1e3a5f",
    eye:"#fff",
    pupil:"#111"
  }
};

// Game state
let bird;
let pipes;
let particles;
let bgLayers;
let score=0;
let best=0;
let frame=0;
let gameState="idle";
let skinName="yellow";

// smooth pipe generation
let lastPipeTop=180;

// PARALLAX STARS
function makeStars(n,bright=false){
  return Array.from(
    {length:n},
    ()=>({
      x:Math.random()*W,
      y:Math.random()*(H-GROUND_H-60),
      r:bright
      ?Math.random()*1.5+.5
      :Math.random()+.3
    })
  );
}
function makeBgLayers(){
  return[
    {
      x:0,
      speed:0.3,
      stars:makeStars(40)
      },
    {
      x:0,
      speed:0.6,
      stars:makeStars(20,true)
    }
  ];
}

// INIT / RESET
function init(){
  bird={
    x:90,
    y:(H-GROUND_H)/2-20,
    vy:0,
    angle:0,
    wingPhase:0
  };
  pipes=[];
  particles=[];
  bgLayers=makeBgLayers();
  score=0;
  frame=0;
  lastPipeTop=180;
  gameState="idle";
  
  updateHUD();
  document.getElementById(
    "speed-display"
  ).textContent="1x";
}

// FLAP
function flap(){
  if(gameState==="dead"){
    init();
    return;
  }
  if(gameState==="idle"){
    gameState="play";
  }
  bird.vy=FLAP_FORCE;
  bird.angle=-28;
  spawnFlapParticles();
}

// EVENTS
canvas.addEventListener(
  "click",
  flap
);

canvas.addEventListener(
  "touchstart",
  e=>{
    e.preventDefault();
    flap();
  },
  {passive:false}
);

document.addEventListener(
  "keydown",
  e=>{
    if(e.code==="Space"){
      e.preventDefault();
      flap();
    }
  }
);

document.getElementById(
  "new-btn"
).addEventListener(
  "click",
  init
);

document.getElementById(
  "skin-select"
).addEventListener(
  "change",
  e=>{
    skinName=e.target.value;
  });

// GAME LOOP
function loop(){
  requestAnimationFrame(loop);
  frame++;
  if(gameState==="play"){
    update();
  }
  draw();
}

// SPEED
function getSpeed(){
  return 2.2+
  Math.min(
    score*0.03,
    1.2
  );
}

// UPDATE
function update(){
  const speed=getSpeed();
  document.getElementById(
    "speed-display"
  ).textContent=
  speed.toFixed(1)+"x";

// Bird physics
bird.vy+=GRAVITY;
bird.y+=bird.vy;
bird.angle=
Math.min(
  90,
  bird.angle+3.5
);
bird.wingPhase+=0.25;

// Pipe generation (smooth original feel)
if(
  pipes.length===0 ||
  pipes[pipes.length-1].x < W-PIPE_SPAWN
){
  const minTop=70;
  const maxTop=
  H-GROUND_H-PIPE_GAP-70;

// smooth variation
let variation=
(Math.random()*120)-60;
let topH=
lastPipeTop+variation;
topH=Math.max(
  minTop,
  Math.min(maxTop,topH)
);
lastPipeTop=topH;
pipes.push({
  x:W+10,
  topH,
  scored:false
});
}

// Move pipes
pipes.forEach(p=>{
  p.x-=speed;

// Score
if(
  !p.scored &&
  p.x+PIPE_W < bird.x
){
  p.scored=true;
  score++;
  updateHUD();
  spawnScoreParticles();
}
});
pipes=
pipes.filter(
  p=>p.x>-PIPE_W
);

// Scroll stars
bgLayers.forEach(layer=>{
  layer.x-=layer.speed;
  if(layer.x<-W){
    layer.x=0;
  }
});

// Collisions
// ceiling
if(
  bird.y-15<0
){
  bird.y=15;
  die();
  return;
}

// ground
if(

  bird.y+15>H-GROUND_H
){
  bird.y=H-GROUND_H-15;
  die();
  return;
}

// pipe collisions
const bx=bird.x;
const by=bird.y;
const br=13;
for(const p of pipes){
  if(
    bx+br>p.x &&
    bx-br<p.x+PIPE_W
  ){
    if(
      by-br<p.topH ||
      by+br>p.topH+PIPE_GAP
    ){
      die();
      return;
    }
  }
}

// particles
particles.forEach(p=>{
  p.x+=p.vx;
  p.y+=p.vy;
  p.vy+=0.1;
  p.life-=0.035;
});
particles=
particles.filter(
  p=>p.life>0
);
}

// DIE
function die(){
  gameState="dead";
  if(score>best){
    best=score;
  }
  updateHUD();

  for(let i=0;i<20;i++){
    let angle=
    Math.random()*Math.PI*2;
    let sp=
    Math.random()*4+1;
    particles.push({
      x:bird.x,
      y:bird.y,
      vx:Math.cos(angle)*sp,
      vy:Math.sin(angle)*sp-2,
      life:1,
      color:
      SKINS[skinName].body,
      r:3+Math.random()*3
    });
  }
}

// PARTICLES
function spawnFlapParticles(){
  for(let i=0;i<5;i++){
    particles.push({
      x:bird.x-10,
      y:bird.y+10,
      vx:-1-Math.random()*2,
      vy:Math.random()-.5,
      life:.7,
      color:"rgba(255,255,255,.6)",
      r:2
    });
  }
}

function spawnScoreParticles(){
  for(let i=0;i<8;i++){
    let a=Math.random()*Math.PI*2;
    particles.push({
      x:bird.x+30,
      y:bird.y,
      vx:Math.cos(a)*2,
      vy:Math.sin(a)*2-1,
      life:.9,
      color:"#ffd700",
      r:2.5
    });
}
}

// DRAW
function draw(){
  // sky
  let sky=
  ctx.createLinearGradient(
    0,0,0,H-GROUND_H
  );
  sky.addColorStop(
    0,
    "#0a0a2e"
  );
  sky.addColorStop(
    1,
    "#1a1a4e"
  );
  ctx.fillStyle=sky;
  ctx.fillRect(
    0,0,W,H-GROUND_H
  );

// stars
bgLayers.forEach(layer=>{
  layer.stars.forEach(s=>{
    ctx.fillStyle=
    "rgba(255,255,255,.7)";
    ctx.beginPath();
    ctx.arc(
      (s.x+layer.x)%W,
      s.y,
      s.r,
      0,
      Math.PI*2
    );
    ctx.fill();
  });
});

// pipes
pipes.forEach(
  p=>drawPipe(
    p.x,
    p.topH
  )
);

// ground
ctx.fillStyle="#4ade80";
ctx.fillRect(
  0,H-GROUND_H,W,16
);
ctx.fillStyle="#6b4f3a";
ctx.fillRect(
  0,
  H-GROUND_H+16,
  W,
  GROUND_H
);

// bird
if(
  gameState!=="dead"||
  frame%6<4
){
  drawBird();
}

// particles
particles.forEach(p=>{
  ctx.globalAlpha=
  Math.max(0,p.life);
  ctx.fillStyle=
  p.color;
  ctx.beginPath();
  ctx.arc(
    p.x,
    p.y,
    p.r*p.life,
    0,
    Math.PI*2
  );
  ctx.fill();
});

ctx.globalAlpha=1;
if(gameState==="idle"){
  drawIdleOverlay();}
if(
  gameState==="dead"
){
  drawDeadOverlay();
}

// score
if(gameState==="play"){
  ctx.fillStyle="#fff";
  ctx.font=
  "bold 32px Segoe UI";
  ctx.textAlign="center";
  ctx.fillText(
    score,
    W/2,
    50
  );
}
}

// PIPE DRAW
function drawPipe(x,topH){
  const CAP=14;
  ctx.fillStyle="#4caf50";
  ctx.fillRect(
    x,0,
    PIPE_W,
    topH
  );
  ctx.fillStyle="#388e3c";
  ctx.fillRect(
    x-5,
    topH-CAP,
    PIPE_W+10,
    CAP
  );
  let botY=
  topH+PIPE_GAP;
  ctx.fillStyle="#4caf50";
  ctx.fillRect(
    x,
    botY,
    PIPE_W,
    H
  );
  ctx.fillStyle="#388e3c";
  ctx.fillRect(
    x-5,
    botY,
    PIPE_W+10,
    CAP
  );
}
// BIRD DRAW
function drawBird(){
  const skin=
  SKINS[skinName];
  ctx.save();
  ctx.translate(
    bird.x,
    bird.y
  );
  ctx.rotate(
    bird.angle*Math.PI/180
  );

  // wing
  ctx.save();
  ctx.rotate(
    Math.sin(
      bird.wingPhase
    )*0.5
  );
  
  ctx.fillStyle=
  skin.wing;
  ctx.beginPath();
  ctx.ellipse(
    -4,5,
    12,6,
    -.4,
    0,
    Math.PI*2
  );
  ctx.fill();
  ctx.restore();

// body
ctx.fillStyle=
skin.body;
ctx.beginPath();
ctx.ellipse(
  0,0,
  17,14,
  0,
  0,
  Math.PI*2
);
ctx.fill();

// eye
ctx.fillStyle="#fff";
ctx.beginPath();
ctx.arc(
  8,-5,
  5,
  0,
  Math.PI*2
);
ctx.fill();


// pupil
ctx.fillStyle="#111";

ctx.beginPath();

ctx.arc(
  9,-5,
  2.5,
  0,
  Math.PI*2
);
ctx.fill();


// beak
ctx.fillStyle=
skin.beak;
ctx.beginPath();
ctx.moveTo(
  14,-2
);
ctx.lineTo(
  23,1
);
ctx.lineTo(
  14,4
);
ctx.closePath();
ctx.fill();
ctx.restore();
}

// OVERLAYS
function drawIdleOverlay(){
  ctx.fillStyle=
  "rgba(0,0,0,.45)";
  ctx.fillRect(
    0,0,W,H-GROUND_H
  );
  ctx.textAlign="center";
  ctx.fillStyle="#ffd700";
  ctx.font=
  "bold 36px Segoe UI";
  ctx.fillText(
    "FLAPPY BIRD",
    W/2,
    H/2-60
  );
  ctx.fillStyle="#fff";
  ctx.font=
  "16px Segoe UI";

  ctx.fillText(
    "Tap or Space to start",
    W/2,
    H/2-20
  );
}

function drawDeadOverlay(){
  ctx.fillStyle=
  "rgba(0,0,0,.55)";
  ctx.fillRect(
    0,0,W,H-GROUND_H
  );
  ctx.textAlign="center";
  ctx.fillStyle="#f87171";
  
  ctx.font=
  "bold 28px Segoe UI";
  ctx.fillText(
    "GAME OVER",
    W/2,
    H/2-50
  );
  ctx.fillStyle="#ffd700";
  ctx.font=
  "bold 52px Segoe UI";
  
  ctx.fillText(
    score,
    W/2,
    H/2+20
  );
  
  let medal=
  score>=30?"🥇":
  score>=20?"🥈":
  score>=10?"🥉":
  "💀";
  ctx.font="32px serif";
  
  ctx.fillText(
    medal,
    W/2,
    H/2+70
  );
  ctx.fillStyle="#aaa";
  ctx.font=
  "14px Segoe UI";

  ctx.fillText(
    "Tap to restart",
    W/2,
    H-GROUND_H-20
  );
}

// HUD
function updateHUD(){
  document.getElementById(
    "score"
  ).textContent=score;
  document.getElementById(
    "best"
  ).textContent=best;
}

// START
init();

// only start loop once
requestAnimationFrame(loop);