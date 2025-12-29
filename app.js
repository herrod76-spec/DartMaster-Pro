const app = document.getElementById("app");
const GEMINI_API_KEY = ""; // <--- Gemini Key eintragen
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

let state = {
  view: "device",
  device: null,
  players: [{id:1,name:"Spieler 1",score:501,history:[],avg:0}],
  activePlayer:0,
  gameCategory:"Training",
  gameMode:"Freies Training",
  currentTurn:[],
  showOverlay:null,
};

// ---------------- Device Auswahl ----------------
function renderDeviceSelection(){
  app.innerHTML=`
    <div class="center">
      <h1>DartMaster Pro Web</h1>
      <button onclick="selectDevice('Tablet')">Tablet</button>
      <button onclick="selectDevice('Handy')">Handy</button>
    </div>
  `;
}

function selectDevice(dev){
  state.device=dev;
  state.view="setup";
  renderPlayerSetup();
}

// ---------------- Spieler Setup ----------------
function renderPlayerSetup(){
  let html = `<div class="center"><h2>Spieler Setup</h2>`;
  state.players.forEach((p,i)=>{
    html+=`<input id="player${i}" value="${p.name}" placeholder="Spieler ${i+1}" />`;
  });
  if(state.players.length<6) html+=`<button onclick="addPlayer()">+ Spieler</button>`;
  html+=`<button onclick="startSession()">Start Session</button></div>`;
  app.innerHTML=html;
}

function addPlayer(){
  state.players.push({id:state.players.length+1,name:"Spieler "+(state.players.length+1),score:501,history:[],avg:0});
  renderPlayerSetup();
}

function startSession(){
  state.players.forEach((p,i)=>{
    const input=document.getElementById("player"+i);
    if(input.value) p.name=input.value;
  });
  state.view="session";
  renderSession();
}

// ---------------- Session ----------------
let fxCanvas = document.getElementById("fx");
let fxCtx = fxCanvas.getContext("2d");
fxCanvas.width = window.innerWidth;
fxCanvas.height = window.innerHeight;
let particles = [];

function renderSession(){
  let html = `<div class="center"><h2>${state.players[state.activePlayer].name}</h2>`;
  html+=`<div>Score: ${state.players[state.activePlayer].score}</div>`;
  html+=`<button onclick="generateAnalysis(state.players[state.activePlayer])">KI Analyse</button>`;
  html+=`<div id="dartboard">`;
  for(let n=20;n>=1;n--){
    html+=`<button class="round-btn" onclick="hit(${n},1,'${n}')">${n}</button>`;
    html+=`<button class="round-btn" onclick="hit(${n},2,'D${n}')">D</button>`;
    html+=`<button class="round-btn" onclick="hit(${n},3,'T${n}')">T</button>`;
  }
  html+=`<button class="round-btn" onclick="hit(25,1,'BULL')">BULL</button>`;
  html+=`<button class="round-btn" onclick="hit(25,2,'D-BULL')">DBULL</button>`;
  html+=`<button class="round-btn" onclick="miss()">MISS</button>`;
  html+=`</div>`;
  html+=`<button onclick="resetSession()">Reset</button>`;
  html+=`<button onclick="renderPlayerSetup()">Zurück</button>`;
  html+=`<button onclick="exportCSV()">Export CSV</button>`;
  html+=`</div>`;
  app.innerHTML=html;
}

// ---------------- Score / Hit ----------------
function hit(val,mult,label){
  const p=state.players[state.activePlayer];
  if(state.gameCategory==="Spiel"){
    if(p.score - val*mult<0) { nextTurn(); return; }
    p.score-=val*mult;
  } else { p.score+=val*mult; }
  p.history.push({val,mult,label});
  checkVictory(p);
  nextTurn();
}

function miss(){ nextTurn(); }

function nextTurn(){
  state.activePlayer=(state.activePlayer+1)%state.players.length;
  renderSession();
}

function resetSession(){
  state.players.forEach(p=>{
    p.score=state.gameCategory==="Spiel"?501:0;
    p.history=[];p.avg=0;
  });
  state.activePlayer=0;
  renderSession();
}

// ---------------- Export ----------------
function exportCSV(){
  const csv = state.players.map(p=>[p.name,p.score,p.avg,p.history.length].join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download="dart_stats.csv";
  link.click();
}

// ---------------- KI Analyse ----------------
let analysisOverlay = document.createElement("div");
analysisOverlay.id = "analysis-overlay";
analysisOverlay.style.cssText = `
  position:absolute;top:0;left:0;width:100%;height:100%;
  background:rgba(0,0,0,0.95);color:white;display:none;
  z-index:1000;overflow:auto;padding:2rem;font-family:sans-serif;`;
document.body.appendChild(analysisOverlay);

async function generateAnalysis(player){
  analysisOverlay.innerHTML=`<h2>Analysiere ${player.name}...</h2><p>Bitte warten...</p>`;
  analysisOverlay.style.display="block";

  const prompt = `Du bist ein professioneller Dart-Coach. Analysiere die Session von: ${player.name}.
  Stats: Modus ${state.gameMode}, AVG ${player.avg.toFixed(1)}, Darts ${player.history.length}.
  Verlauf: ${player.history.slice(-25).map(h=>h.label).join(", ")}.
  Antworte als JSON: { "technik": "...", "fokus": "...", "scoring": "...", "tipp": "...", "score":0-100 }`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}],
        systemInstruction:{parts:[{text:"Du bist ein professioneller Dart-Coach, sachlich und sportlich"}]},
        generationConfig:{responseMimeType:"application/json"}
      })
    });
    const data = await response.json();
    const report = JSON.parse(data.candidates[0].content.parts[0].text);

    analysisOverlay.innerHTML=`
      <h2>Analyse: ${player.name}</h2>
      <p><strong>Technik:</strong> ${report.technik}</p>
      <p><strong>Mentale Stärke:</strong> ${report.fokus}</p>
      <p><strong>Scoring/Strategie:</strong> ${report.scoring}</p>
      <p><strong>Trainings-Tipp:</strong> ${report.tipp}</p>
      <p><strong>Performance-Score:</strong> ${report.score}</p>
      <button onclick="closeAnalysis()">Schließen</button>
    `;
  } catch(e){
    console.error(e);
    analysisOverlay.innerHTML=`<h2>Fehler bei der Analyse</h2><p>${e}</p><button onclick="closeAnalysis()">Schließen</button>`;
  }
}

function closeAnalysis(){
  analysisOverlay.style.display="none";
}

// ---------------- Confetti ----------------
function checkVictory(player){
  if(state.gameCategory==="Spiel" && player.score===0){
    spawnConfetti();
    alert(`${player.name} gewinnt!`);
  }
}

function spawnConfetti(){
  for(let i=0;i<200;i++){
    particles.push({
      x:Math.random()*fxCanvas.width,
      y:Math.random()*fxCanvas.height-50,
      r:Math.random()*4+2,
      dx:(Math.random()-0.5)*4,
      dy:Math.random()*-5-2,
      color:`hsl(${Math.random()*360},100%,50%)`
    });
  }
}

function animateConfetti(){
  fxCtx.clearRect(0,0,fxCanvas.width,fxCanvas.height);
  particles.forEach((p,i)=>{
    p.x+=p.dx; p.y+=p.dy;
    p.dy+=0.05;
    fxCtx.fillStyle=p.color;
    fxCtx.beginPath();
    fxCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    fxCtx.fill();
    if(p.y>fxCanvas.height) particles.splice(i,1);
  });
  requestAnimationFrame(animateConfetti);
}
animateConfetti();

// ---------------- Initial ----------------
renderDeviceSelection();
