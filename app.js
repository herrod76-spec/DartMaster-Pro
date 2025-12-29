const state={
  players:[],
  mode:null,
  device:null,
  gameId:null,
  socket:null,
  tournament:null
};

// Device Detection
function detectDevice(){
  const w=window.innerWidth;
  state.device=w>=768?'tablet':'handy';
  document.body.dataset.device=state.device;
}
window.addEventListener('resize',detectDevice);
detectDevice();

// Init
function init(){ renderModeSelect(); }

// Modus Auswahl
function renderModeSelect(){
  const app=document.getElementById("app");
  app.innerHTML=`
    <h2>Modus wählen</h2>
    <button onclick="start('match')">Match <span class="info-icon" title="Wettkampfmodus mit Legs/Sets">ℹ️</span></button>
    <button onclick="start('training')">Training <span class="info-icon" title="Alle Dartübungen verfügbar">ℹ️</span></button>
  `;
}

// Startmodus
function start(mode){ 
  state.mode=mode; 
  renderPlayerSetup(); 
}

// Spieler Setup
function renderPlayerSetup(){
  const app=document.getElementById("app");
  app.innerHTML=`
    <h2>Spieler hinzufügen (1-6)</h2>
    <div id="players"></div>
    <button onclick="addPlayerInput()">+ Spieler</button>
    <button onclick="startGame()">Start</button>
  `;
  addPlayerInput();
}

function addPlayerInput(){
  const div=document.getElementById("players");
  if(div.children.length>=6) return;
  const input=document.createElement('input');
  input.placeholder="Spieler "+(div.children.length+1)+" Name";
  div.appendChild(input);
}

// Start Game
function startGame(){
  const names=[...document.querySelectorAll("#players input")].map(i=>i.value).filter(n=>n);
  if(names.length<1) return alert("Mindestens 1 Spieler");
  state.players=names.map(n=>({name:n,score:501,throws:[],turnStart:501}));
  state.gameId="game-"+Date.now();
  renderScoreDashboard();
  setupSocket();
}

// Score Dashboard
function renderScoreDashboard(){
  const app=document.getElementById("app");
  let html=`<h2>Score Dashboard</h2><div id="playerScores">`;
  state.players.forEach(p=>html+=`<div>${p.name}: <span id="${p.name}-score">${p.score}</span></div>`);
  html+=`</div>
    <div id="dartboard"></div>
    <button onclick="renderModeSelect()">Zurück zur Moduswahl</button>
    <button onclick="exportStatsCSV(state.players)">Export CSV</button>
  `;
  app.innerHTML=html;
  renderDartboard();
}

// Dartboard
function renderDartboard(){
  const board=document.getElementById("dartboard");
  board.innerHTML="";
  for(let i=20;i>=1;i--){
    const btn=document.createElement("button");
    btn.innerText=i;
    btn.onclick=()=>throwDart(i,1);
    board.appendChild(btn);
  }
  const bull=document.createElement("button");
  bull.innerText="Bull";
  bull.onclick=()=>throwDart(25,2);
  board.appendChild(bull);
}

// Dart werfen
function throwDart(value,mult){
  const player=state.players[0]; // einfacher Turnus
  const hit=value*mult;
  const rest=player.score-hit;
  if(rest<0||(rest===0&&mult!==2)){ bust(player); return; }
  player.score=rest;
  player.throws.push({value,mult});
  document.getElementById(player.name+"-score").innerText=player.score;
  if(player.score===0){ winLeg(player); }
}

// Bust
function bust(player){
  player.score=player.turnStart;
  player.throws=[];
  alert(player.name+" hat gebustet!");
}

// Leg gewinnen
function winLeg(player){
  alert(player.name+" gewinnt das Leg!");
  triggerConfetti();
}

// Konfetti
function triggerConfetti(){
  const canvas=document.getElementById("fx");
  const ctx=canvas.getContext("2d");
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  for(let i=0;i<150;i++){
    ctx.fillStyle=`rgba(${Math.random()*255},${Math.random()*255},0,0.8)`;
    ctx.beginPath();
    ctx.arc(Math.random()*canvas.width,Math.random()*canvas.height,5,0,Math.PI*2);
    ctx.fill();
  }
}

// CSV Export
function exportStatsCSV(stats){
  const csv=stats.map(r=>Object.values(r).join(",")).join("\n");
  const blob=new Blob([csv],{type:'text/csv'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download='dart_stats.csv';
  link.click();
}

// Multiplayer Socket Placeholder
function setupSocket(){ state.socket=null; }

// KI-Analyse Placeholder (Gemini 2.5 vorbereitet)
async function analyzeSession(sessionData){
  console.log("Gemini KI Analyse:",sessionData);
}

// Init
init();
