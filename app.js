// Minimaler Starter-Code
const state = { players: [], mode: null, gameId: null, socket: null, tournament: null };
function init(){ renderModeSelect(); }
function renderModeSelect(){
  const app = document.getElementById("app");
  app.innerHTML = `<button onclick="start('match')">Match</button><button onclick="start('training')">Training</button>`;
}
function start(mode){ state.mode = mode; renderPlayerSetup(); }
function renderPlayerSetup(){
  const app = document.getElementById("app");
  app.innerHTML = `<h2>Spieler hinzufügen</h2><div id="playerInputs"></div><button onclick="addPlayerInput()">+ Spieler</button><button onclick="startGame()">Start</button>`;
  addPlayerInput();
}
function addPlayerInput(){ const div = document.getElementById("playerInputs"); const input = document.createElement("input"); input.placeholder="Spielername"; div.appendChild(input); }
function startGame(){
  const names = [...document.querySelectorAll("#playerInputs input")].map(i=>i.value).filter(n=>n);
  if(names.length<1) return alert("Mindestens 1 Spieler");
  state.players = names.map(n=>({name:n, score:501, throws:[], turnStart:501}));
  state.gameId = "game-"+Date.now();
  setupSocket();
  renderScoreDashboard();
}
function renderScoreDashboard(){
  const app = document.getElementById("app");
  let html = `<h2>Score Dashboard</h2><div id="players">`;
  state.players.forEach(p=> html+=`<div>${p.name}: <span id="${p.name}-score">${p.score}</span></div>`);
  html+="</div><div id='board'></div>";
  app.innerHTML = html;
  renderDartboardButtons();
}
function renderDartboardButtons(){
  const board = document.getElementById("board");
  board.innerHTML = "";
  for(let i=20;i>=1;i--){ const btn=document.createElement("button"); btn.innerText=i; btn.onclick=()=>throwDart(i,1); board.appendChild(btn); }
  const bull = document.createElement("button"); bull.innerText="Bull"; bull.onclick=()=>throwDart(25,2); board.appendChild(bull);
}
function throwDart(value,mult){
  const player = state.players[0];
  const hit = value*mult;
  const rest = player.score - hit;
  if(rest<0 || (rest===0 && mult!==2)) return bust(player);
  player.score = rest;
  player.throws.push({value,mult});
  document.getElementById(player.name+"-score").innerText=player.score;
  sendThrow(player,value,mult);
  if(player.score===0) winLeg(player);
}
function bust(player){ player.score=player.turnStart; player.throws=[]; alert(player.name+" hat gebustet!"); }
function winLeg(player){ alert(player.name+" gewinnt das Leg!"); triggerConfetti(); }
function setupSocket(){ state.socket = new WebSocket('wss://DEIN_SERVER_HIER'); state.socket.addEventListener('open',()=>console.log('Connected')); state.socket.addEventListener('message', e=>{ const msg = JSON.parse(e.data); if(msg.type==='updateScore'){ document.getElementById(msg.player+"-score").innerText=msg.score; } }); }
function sendThrow(player,value,mult){ if(!state.socket) return; state.socket.send(JSON.stringify({type:'throw', gameId:state.gameId, player:player.name, score:player.score, throw:{value,mult}})); }
function triggerConfetti(){ const canvas=document.getElementById("fx"); const ctx=canvas.getContext("2d"); canvas.width=window.innerWidth; canvas.height=window.innerHeight; for(let i=0;i<100;i++){ ctx.fillStyle="rgba(255,215,0,0.8)"; ctx.beginPath(); ctx.arc(Math.random()*canvas.width,Math.random()*canvas.height,5,0,Math.PI*2); ctx.fill(); } }
init();