// 2048 GAME VARIABLES

// Board size (default 4x4)
let SIZE = 4;

// Game grid stores all tile values
let grid = [];

// For undo feature
let previousGrid = null;
let previousScore = 0;

// Score tracking
let score = 0;
let best = 0;

// Touch swipe positions
let startX = 0;
let startY = 0;

// CREATE EMPTY BOARD
function makeEmpty(){
  return Array.from(
    {length: SIZE},
    ()=>Array(SIZE).fill(0)
  );
}

// START / RESET GAME
function newGame(){
  grid = makeEmpty();
  score = 0;
  previousGrid = null;

// Add two starting tiles
  addRandom();
  addRandom();
  
  render();
  updateHUD();
  }

// ADD RANDOM TILE (2 OR 4)
function addRandom(){
  let empty=[];
  
  // Find all empty cells
for(let r=0;r<SIZE;r++){
  for(let c=0;c<SIZE;c++){
    if(grid[r][c]===0){
      empty.push([r,c]);
    }
  }
}
if(!empty.length) return;

// Pick random empty spot
let pick=
empty[
  Math.floor(
    Math.random()*empty.length
  )
];

// 90% chance 2
// 10% chance 4
grid[pick[0]][pick[1]]=
Math.random()<0.9 ? 2 : 4;
}

// SLIDE + MERGE A SINGLE ROW
function slide(row){

// remove zeros
let arr=row.filter(v=>v);
let gained=0;

// merge matching neighbors
for(let i=0;i<arr.length-1;i++){
  if(arr[i]===arr[i+1]){
    arr[i]*=2;
    gained+=arr[i];
    arr.splice(i+1,1);
  }
}

// fill remaining with zeros
while(arr.length<SIZE){
  arr.push(0);
}

return{
  row:arr,
  gained
};
}

// MOVE TILES
// left / right / up / down
function move(dir){

// save previous state for undo
previousGrid=
grid.map(r=>[...r]);
previousScore=score;

let moved=false;
let gained=0;

// LEFT
if(dir==="left"){
  for(let r=0;r<SIZE;r++){
    let old=[...grid[r]];
    let res=slide(old);
    grid[r]=res.row;
    if(old.toString()!=res.row.toString())
      moved=true;
    gained+=res.gained;
  }
}

// RIGHT 
if(dir==="right"){
  for(let r=0;r<SIZE;r++){
    let old=[...grid[r]];
    let reversed=[...old].reverse();
    let res=slide(reversed);
    let final=res.row.reverse();
    grid[r]=final;
    
    if(old.toString()!=final.toString())
      moved=true;
    
    gained+=res.gained;
  }
}

// UP 
if(dir==="up"){
  for(let c=0;c<SIZE;c++){
    let col=
    grid.map(r=>r[c]);
    
    let old=[...col];
    let res=slide(col);

// put merged column back
for(let r=0;r<SIZE;r++){
  grid[r][c]=res.row[r];
}

if(old.toString()!=res.row.toString())
  moved=true;
gained+=res.gained;
}
}

// DOWN 
if(dir==="down"){
  for(let c=0;c<SIZE;c++){
    
    let col=
    grid.map(r=>r[c]).reverse();
    
    let old=[...col];
    
    let res=slide(col);
    
    let final=res.row.reverse();
    
    for(let r=0;r<SIZE;r++){
      grid[r][c]=final[r];
    }
    
    if(old.reverse().toString()!=final.toString())
      moved=true;
    gained+=res.gained;
  }
}

// no move happened
if(!moved) return;

// update score
score+=gained;
if(score>best){
  best=score;
}

// add new tile
addRandom();

render();
updateHUD();

// game over check
if(!canMove()){
  setTimeout(
    ()=>alert("Game Over"),
    100
  );
}
}

// CHECK IF MOVES STILL POSSIBLE
function canMove(){
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      
    // empty cell exists
    if(grid[r][c]===0)
    return true;
    
    // horizontal merge possible
    if(
      c<SIZE-1 &&
      grid[r][c]===grid[r][c+1]
    )
    return true;
    
    // vertical merge possible

    if(
      r<SIZE-1 &&
      grid[r][c]===grid[r+1][c]
    )
    return true;
  }
}
return false;
}

// UNDO LAST MOVE
function undo(){
  if(!previousGrid) return;
  grid=
  previousGrid.map(r=>[...r]);
  score=previousScore;
  render();
  updateHUD();
}

// DRAW BOARD
function render(){
  const board=
  document.getElementById("board");
  board.innerHTML="";
  board.style.gridTemplateColumns=
  `repeat(${SIZE},1fr)`;
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      let value=grid[r][c];
      let cell=
      document.createElement("div");
      cell.className="cell";
      if(value){
        if(value>2048){
          cell.dataset.super="1";
        }
        else{
          cell.dataset.val=value;
        }
        cell.textContent=value;
      }
      board.appendChild(cell);
    }
  }
}

// UPDATE SCORE DISPLAY
function updateHUD(){
  document.getElementById(
    "score"
  ).textContent=score;
  document.getElementById(
    "best"
  ).textContent=best;
}

// KEYBOARD CONTROLS
document.addEventListener(
  "keydown",
  e=>{
    if(e.key==="ArrowLeft")
      move("left");
      if(e.key==="ArrowRight")
        move("right");
        if(e.key==="ArrowUp")
          move("up");
          if(e.key==="ArrowDown")
            move("down");
          }
        );

// SWIPE CONTROLS (TOUCH)

// touch start
document.querySelector(
  ".board-wrapper"
).addEventListener(
  "touchstart",
  e=>{
    startX=
    e.touches[0].clientX;
    startY=
    e.touches[0].clientY;
  },
  {passive:true}
);

// touch end
document.querySelector(
  ".board-wrapper"
).addEventListener(
  "touchend",
  e=>{
    let dx=
    e.changedTouches[0].clientX-startX;
    let dy=
    e.changedTouches[0].clientY-startY;

// horizontal swipe
if(
  Math.abs(dx)>
  Math.abs(dy)
){
  move(
    dx>0
    ?"right"
    :"left"
  );
}

// vertical swipe
else{
  move(
    dy>0
    ?"down"
    :"up"
  );
}},
{passive:true}
);

// BUTTON EVENTS

// new game button
document
.getElementById("new-btn")
.addEventListener(
  "click",
  newGame
);

// undo button
document
.getElementById("undo-btn")
.addEventListener(
  "click",
  undo
);

// BOARD SIZE SWITCHER
document.querySelectorAll(
  ".size-btn"
).forEach(btn=>{
  btn.addEventListener(
    "click",
    ()=>{
      
      document
      .querySelectorAll(".size-btn")
      .forEach(
        b=>b.classList.remove("active")
      );
      
      btn.classList.add("active");
      
      SIZE=
      parseInt(
        btn.dataset.size
      );
      
      newGame();
    })
  });

// START GAME
newGame();