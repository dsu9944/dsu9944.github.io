/* Ethan's speedcubing page – UI, GAN 356 i3 connection, cubing.js extras */
(function(){
"use strict";
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const E = window.CubeEngine;
const app = E.createApp();
window.CUBE = app;

const THEME_KEY="kidsHub.p.ethan.cube.theme";
function loadTheme(){try{return localStorage.getItem(THEME_KEY)==="light"?"light":"dark";}catch(e){return "dark";}}
function applyTheme(name){
  const theme=name==="light"?"light":"dark";
  document.documentElement.setAttribute("data-theme",theme);
  document.body.setAttribute("data-theme",theme);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute("content",theme==="light"?"#f3f4f6":"#0c0e12");
  try{localStorage.setItem(THEME_KEY,theme);}catch(e){}
  const sel=$("#optTheme"); if(sel&&sel.value!==theme)sel.value=theme;
}
applyTheme(loadTheme());

let currentView="practice";
function closeMenu(){
  const m=$("#headerMenu"), b=$("#menuBtn");
  if(m)m.classList.add("hidden");
  if(b)b.setAttribute("aria-expanded","false");
}
function setView(name){
  currentView=name||"practice";
  document.body.setAttribute("data-view",currentView);
  const map={practice:"view-practice",coach:"view-coach",lessons:"lessonsPanel",history:"view-history",settings:"view-settings"};
  Object.keys(map).forEach(k=>{
    const el=$("#"+map[k]);
    if(!el)return;
    const on=k===currentView;
    el.classList.toggle("active",on);
    el.classList.toggle("hidden",!on);
    if(k==="lessons"){
      el.hidden=!on;
      if(on){el.removeAttribute("hidden");}
      else el.setAttribute("hidden","");
    }
  });
  $$(".nav-item").forEach(b=>b.classList.toggle("on",b.getAttribute("data-view")===currentView));
  const lb=$("#lessonsBtn");
  if(lb)lb.setAttribute("aria-pressed",currentView==="lessons"?"true":"false");
  if(currentView==="lessons")fillLessons();
  closeMenu();
}

const GAN_MODS = "https://esm.sh/gan-web-bluetooth@3.0.2";
const GAN_MODS_FALLBACK = "https://cdn.jsdelivr.net/npm/gan-web-bluetooth@3.0.2/+esm";
const CUBING_SCRAMBLE = "https://cdn.cubing.net/v0/js/cubing/scramble";
const CUBING_TWISTY = "https://cdn.cubing.net/v0/js/cubing/twisty";
const CUBING_SEARCH = "https://cdn.cubing.net/v0/js/cubing/search";
const CUBING_PUZZLES = "https://cdn.cubing.net/v0/js/cubing/puzzles";
const CUBING_KPUZZLE = "https://cdn.cubing.net/v0/js/cubing/kpuzzle";

let conn = null;
let unsub = null;
let fairScramble = null;
let TwistyPlayer = null;
let twisty = null;
let macResolver = null;
let appliedAlg = [];
let showNet = false;
let searchSolve = null, kpuzzle = null, KPatternCls = null, solveReady = false;
let setupToken = 0, lastFaceletsGen = -1;
const twistyLog = {moves:[], setup:"", ready:false, lastError:"", visualization:"", faceletsSynced:false};
let faceletsAnchor = E.SOLVED;
let showDebug = false;
let matchMode = ""; /* unused in v15; match prompt removed */
const cubeDebug = {
  protocol:"",
  hardwareName:"",
  searchStatus:"not loaded",
  setupMethod:"",
  faceletsRequestedAt:0,
  faceletsReceivedAt:0,
  faceletsReply:false,
  lastFacelets:"",
  lastFaceletsSerial:null,
  lastError:"",
  gyroCount:0,
  events:[]
};
function guessProtocol(name){
  const n=String(name||"").toLowerCase().replace(/\s+/g,"");
  if(/carry2/.test(n))return "Gen3";
  if(/gan14|gan12uimaglev/.test(n))return "Gen4";
  if(/356i3|i3|gan356|icarry|miniui|monstergo|moyuai|gan12ui/.test(n))return "Gen2";
  return "";
}
function pushDebug(ev){
  try{
    if(!ev)return;
    if(ev.type==="GYRO"){cubeDebug.gyroCount++;return;}
    const copy={};
    Object.keys(ev).forEach(k=>{
      const v=ev[k];
      if(v==null||typeof v==="string"||typeof v==="number"||typeof v==="boolean")copy[k]=v;
      else if(k==="state"&&v&&typeof v==="object")copy.state={CP:v.CP,CO:v.CO,EP:v.EP,EO:v.EO};
      else copy[k]=typeof v==="object"?JSON.parse(JSON.stringify(v)):String(v);
    });
    cubeDebug.events.push(copy);
    if(cubeDebug.events.length>20)cubeDebug.events.shift();
  }catch(e){}
}
function fmtDebugTime(ts){
  const d=new Date(ts);
  if(isNaN(d.getTime()))return "—";
  const p=n=>String(n).padStart(2,"0");
  return p(d.getHours())+":"+p(d.getMinutes())+":"+p(d.getSeconds())+" (Australia/Sydney)";
}
function debugText(v){
  v=v||app.get()||{};
  const reply=cubeDebug.faceletsReply?"yes (serial "+(cubeDebug.lastFaceletsSerial!=null?cubeDebug.lastFaceletsSerial:"?")+")":"NO — REQUEST_FACELETS got no FACELETS event";
  const evs=(cubeDebug.events||[]).map(e=>{
    try{return JSON.stringify(e);}catch(err){return String(e&&e.type||e);}
  }).join("\n");
  const ver=(document.querySelector("#buildVer")||{}).textContent||"v16 · 24 Nov";
  return [
    "build: "+String(ver).trim(),
    "protocol: "+(cubeDebug.protocol||guessProtocol(v.deviceName)||"unknown — GAN 356 i3 is Gen2"),
    "hardware: "+(cubeDebug.hardwareName||v.deviceName||"—"),
    "search: "+cubeDebug.searchStatus,
    "3D setup method: "+(cubeDebug.setupMethod||twistyLog.setup||"—"),
    "facelets request reply: "+reply,
    "tracked facelets: "+(v.facelets||"—"),
    "F0: "+(v.f0||"—"),
    "target T: "+(v.target||"—"),
    "facelets == T?: "+(v.atTarget?"yes":"no"),
    "solved: "+!!v.solved,
    "phase: "+v.phase,
    "coach: "+(v.coach&&v.coach.active?((v.coach.kind||"")+" "+(v.coach.phase||"")+" "+(v.coach.stage||"")+" "+(v.coach.caseId||"")+(v.coach.yellowTop?" yellow-top":"")):"(off)"),
    "timerMode: "+(v.timerMode||"—")+(v.timerLabel?(" ("+v.timerLabel+")"):""),
    "reset: "+((v.resetLog&&v.resetLog.length)?v.resetLog.join(" / "):"(none)"),
    "calibration: "+(v.calibration?"yes":"no")+(v.resetNote?(" · "+v.resetNote):""),
    "expected move: "+(v.fixup||v.current||"(none)")+(v.halfLabel?" "+v.halfLabel:""),
    "path: "+(v.scrambleText||""),
    "on path: "+!!v.onPath+"  k="+v.k+"/"+v.total+"  pathReady="+!!v.pathReady,
    "replan count: "+(v.replanCount||0),
    "replan method: "+(v.replanMethod||"—"),
    "last re-plan: "+(v.replanAt?fmtDebugTime(v.replanAt):"—"),
    "gyro events ignored: "+cubeDebug.gyroCount,
    "last error: "+(cubeDebug.lastError||twistyLog.lastError||"—"),
    "page errors: "+((window.__cubePageErrors&&window.__cubePageErrors.length)?window.__cubePageErrors.join(" | "):"—"),
    "last 20 events (GYRO omitted, too frequent):",
    evs||"(none yet)",
    "last 60 judged events:",
    (app.debugLogText&&app.debugLogText())||"(none yet)"
  ].join("\n");
}
function setShowDebug(on){
  showDebug=!!on;
  const box=$("#cubeDebug");
  const tools=$("#debugTools");
  const cb=$("#optShowDebug");
  const btn=$("#debugBtn");
  if(cb)cb.checked=showDebug;
  if(btn){
    btn.setAttribute("aria-pressed",showDebug?"true":"false");
    btn.classList.toggle("on",showDebug);
  }
  if(tools)tools.classList.toggle("hidden",!showDebug);
  if(box){
    box.classList.toggle("hidden",!showDebug);
    if(showDebug){
      box.textContent=debugText(app.get());
      try{box.scrollIntoView({block:"nearest",inline:"nearest"});}catch(e){}
    }
  }
}
function debugLogPayload(){
  const v=app.get();
  const engineLog=(app.debugLogText&&app.debugLogText())||"";
  const events=(app.getDebugEvents&&app.getDebugEvents())||[];
  return [debugText(v),"","--- last 60 judged events ---",engineLog||JSON.stringify(events,null,2)].join("\n");
}
async function copyDebugLog(){
  const text=debugLogPayload();
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      await navigator.clipboard.writeText(text);
    }else{
      const ta=document.createElement("textarea");
      ta.value=text;document.body.appendChild(ta);ta.select();
      document.execCommand("copy");ta.remove();
    }
    const btn=$("#copyDebugBtn");
    if(btn){const prev=btn.textContent;btn.textContent="Copied";setTimeout(()=>{btn.textContent=prev||"Copy debug log";},1200);}
  }catch(e){cubeDebug.lastError=String(e&&e.message||e||"copy failed");}
}
function recordPageError(msg){
  const s=String(msg||"error");
  cubeDebug.lastError=s;
  if(typeof window.__showCubeError==="function")window.__showCubeError(s);
  if(showDebug){
    const box=$("#cubeDebug");
    if(box&&!box.classList.contains("hidden"))box.textContent=debugText(app.get());
  }
}

function isIos(){
  const ua=navigator.userAgent||"";
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
}
function hasWebBluetooth(){return typeof navigator!=="undefined" && !!navigator.bluetooth;}

function show(el,on){if(!el)return;el.classList.toggle("hidden",!on);}
function setText(id,t){const n=$(id);if(n)n.textContent=t;}
function displayFaceletsFor(v){
  if(v&&v.coach&&v.coach.active&&v.coach.yellowTop)return E.faceletsX2(v.facelets);
  return v&&v.facelets;
}
function displayMoveFor(m,v){
  if(v&&v.coach&&v.coach.active&&v.coach.yellowTop){
    const x=E.mapAlgX2(m);
    return (x&&x[0])||m;
  }
  return m;
}

let showingMe=false, showMeToken=0, lastYellowTop=false;
let algPlayer=null, demoTwisty=null, demoOn=false, demoFacelets=null, playerIv=null, lastPlayerTick=0, moreDetail=false;
const VIDEO_STORE="ethan-cube-videos-v1";
function loadWatched(){try{return JSON.parse(localStorage.getItem(VIDEO_STORE)||"{}");}catch(e){return {};}}
function saveWatched(map){try{localStorage.setItem(VIDEO_STORE,JSON.stringify(map||{}));}catch(e){}}
function markVideoWatched(id){const m=loadWatched();m[id]=Date.now();saveWatched(m);return m;}
function turnArrow(mv){
  if(!mv)return "";
  const face=mv[0], suf=mv.slice(1);
  if("URFDLB".indexOf(face)<0)return "";
  if(suf==="'")return "↺  counterclockwise";
  if(suf==="2")return "↻↻  half turn";
  return "↻  clockwise";
}
function stopAlgPlayer(backToLive){
  document.body.classList.remove("sheet-open");
  if(playerIv){clearInterval(playerIv);playerIv=null;}
  demoOn=false;showingMe=false;
  if(demoTwisty&&demoTwisty.parentNode)try{demoTwisty.parentNode.removeChild(demoTwisty);}catch(e){}
  demoTwisty=null;demoFacelets=null;
  document.body.classList.remove("demo-on");
  const panel=$("#algPlayerPanel");
  if(panel&&backToLive){panel.hidden=true;panel.setAttribute("hidden","");panel.classList.add("hidden");panel.innerHTML="";}
  if(backToLive){
    algPlayer=null;
    const now=app.get();
    if(now&&!showingMe)setupFromFacelets(displayFaceletsFor(now)||now.facelets);
  }
}
function mountDemoTwisty(facelets){
  const host=$("#demoHost");
  if(!host)return;
  host.innerHTML="";
  const Cls=typeof twistyClass==="function"?twistyClass():TwistyPlayer;
  if(Cls){
    try{
      const opts=typeof playerOptions==="function"?playerOptions():{visualization:"3D"};
      const p=new Cls(opts);
      demoTwisty=p;
      host.appendChild(p);
    }catch(e){demoTwisty=null;}
  }
  demoFacelets=facelets||E.SOLVED;
  applyDemoFacelets(demoFacelets);
}
function applyDemoFacelets(f){
  demoFacelets=f||E.SOLVED;
  if(!demoTwisty)return;
  try{
    if(E.isSolved(demoFacelets)){
      demoTwisty.experimentalSetupAlg="";
      demoTwisty.alg="";
      return;
    }
    const short=E.solveFromToSync&&E.solveFromToSync(demoFacelets,E.SOLVED,8);
    const setup=short?E.fmtAlg(E.invertAlg(short)):"";
    demoTwisty.experimentalSetupAlg=setup;
    demoTwisty.alg="";
  }catch(e){}
}
function demoAddMove(m){
  m=E.normalizeMove(m);
  if(!m)return;
  demoFacelets=E.applyMove(demoFacelets||E.SOLVED,m);
  if(!demoTwisty)return;
  try{
    if(typeof demoTwisty.experimentalAddMove==="function")demoTwisty.experimentalAddMove(m);
    else if(typeof demoTwisty.experimentalAddAlgLeaf==="function")demoTwisty.experimentalAddAlgLeaf(m,{cancel:false});
  }catch(e){}
}
function playerStartState(opts){
  opts=opts||{};
  if(opts.startFacelets&&opts.startFacelets.length===54)return opts.startFacelets;
  if(opts.setupAlg)return E.applyAlg(E.SOLVED,E.parseAlg(opts.setupAlg));
  if(opts.alg)return E.applyAlg(E.SOLVED,E.parseAlg(E.invertAlgStr?E.invertAlgStr(opts.alg):opts.alg));
  return E.SOLVED;
}
function openAlgPlayer(opts){
  opts=opts||{};
  stopAlgPlayer(false);
  algPlayer=E.createAlgPlayer({alg:opts.alg||"",setupAlg:opts.setupAlg,speed:opts.speed||1,hintAfterMs:3000});
  const start=playerStartState(opts);
  demoOn=true;showingMe=true;document.body.classList.add("demo-on","sheet-open");
  const panel=$("#algPlayerPanel");
  if(panel){panel.hidden=false;panel.removeAttribute("hidden");panel.classList.remove("hidden");panel.innerHTML=algPlayerHTML(opts.title||"Algorithm player",algPlayer.get());}
  mountDemoTwisty(start);
  bindAlgPlayerPanel();
  return algPlayer.get();
}
function algPlayerHTML(title,g){
  g=g||(algPlayer&&algPlayer.get())||{};
  const hide=!!g.hideStrip;
  const moves=(g.moves||[]).map((m,i)=>`<button type="button" class="mv${i===g.i?" on":""}" data-jump="${i}">${m}</button>`).join("");
  const hint=g.hintMove?`<p class="tip">Hint: <b>${g.hintMove}</b></p>`:"";
  const speeds=[0.25,0.5,1,2].map(s=>`<button type="button" class="btn ghost" id="playerSpeed${String(s).replace(".","_")}" data-speed="${s}">${s}×</button>`).join("");
  return `<button type="button" class="btn ghost alg-close" id="playerClose">Close</button>
    <h3>${title||"Algorithm player"}</h3>
    <div id="demoHost" aria-label="Demo cube"></div>
    <div class="player-now">${g.current||(g.atEnd?"Done":"Ready")}</div>
    <div class="player-arrow">${turnArrow(g.current)}</div>
    ${hide?hint:`<div class="player-strip" id="playerStrip">${moves||""}</div>`}
    <div class="player-btns">
      <button class="btn" type="button" id="playerPlay">${g.playing?"Pause":"Play"}</button>
      <button class="btn ghost" type="button" id="playerBack">Step back</button>
      <button class="btn ghost" type="button" id="playerFwd">Step forward</button>
      <button class="btn ghost" type="button" id="playerRestart">Restart</button>
      <button class="btn ghost" type="button" id="playerLoop">${g.loop?"Loop: on":"Loop: off"}</button>
    </div>
    <div class="player-btns">${speeds}</div>
    <div class="player-btns">
      ${g.atStart||g.mode==="demo"?`<button class="btn" type="button" id="playerYourTurn">Your turn</button>`:""}
      <button class="btn ghost" type="button" id="playerMemorise">Memorise</button>
    </div>`;
}
function refreshAlgPlayerPanel(){
  const panel=$("#algPlayerPanel");
  if(!panel||!algPlayer||!demoOn&&!(algPlayer.get().mode==="memorise"||algPlayer.get().mode==="live"))return;
  const g=algPlayer.get();
  const host=$("#demoHost");
  const keep=host;
  panel.innerHTML=algPlayerHTML("Algorithm player",g);
  if(keep&&g.mode==="demo"){
    const host2=$("#demoHost");
    if(host2&&demoTwisty)host2.appendChild(demoTwisty);
  }
  bindAlgPlayerPanel();
}
function bindAlgPlayerPanel(){
  const play=$("#playerPlay"); if(play)play.onclick=()=>{const g=algPlayer.get(); if(g.playing)algPlayer.pause(); else algPlayer.play(); refreshAlgPlayerPanel();};
  const back=$("#playerBack"); if(back)back.onclick=()=>{playerStepBack();};
  const fwd=$("#playerFwd"); if(fwd)fwd.onclick=()=>{playerStepForward();};
  const rs=$("#playerRestart"); if(rs)rs.onclick=()=>{algPlayer.restart(); applyDemoFacelets(playerStartState({setupAlg:algPlayer.get().setupAlg,alg:algPlayer.get().alg})); refreshAlgPlayerPanel();};
  const lp=$("#playerLoop"); if(lp)lp.onclick=()=>{algPlayer.setLoop(!algPlayer.get().loop); refreshAlgPlayerPanel();};
  $$("[data-speed]").forEach(b=>b.onclick=()=>{algPlayer.setSpeed(parseFloat(b.getAttribute("data-speed"))); refreshAlgPlayerPanel();});
  $$("[data-jump]").forEach(b=>b.onclick=()=>{playerJumpTo(+b.getAttribute("data-jump"));});
  const yt=$("#playerYourTurn"); if(yt)yt.onclick=()=>{yourTurnFromPlayer();};
  const mem=$("#playerMemorise"); if(mem)mem.onclick=()=>{startMemorise();};
}
function playerStepForward(){
  if(!algPlayer)return;
  const g=algPlayer.get();
  if(g.current)demoAddMove(g.current);
  algPlayer.stepForward();
  refreshAlgPlayerPanel();
}
function playerStepBack(){
  if(!algPlayer)return;
  const g=algPlayer.get();
  if(g.i>0){
    const mv=g.moves[g.i-1];
    const inv=E.invertMove?E.invertMove(mv):null;
    if(inv)demoAddMove(inv);
  }
  algPlayer.stepBack();
  refreshAlgPlayerPanel();
}
function playerJumpTo(i){
  if(!algPlayer)return;
  const g=algPlayer.get();
  const start=playerStartState({setupAlg:g.setupAlg,alg:g.alg});
  applyDemoFacelets(start);
  let f=start;
  const target=Math.max(0,Math.min(g.moves.length,i|0));
  for(let k=0;k<target;k++){f=E.applyMove(f,g.moves[k]); if(demoTwisty)demoAddMove(g.moves[k]);}
  demoFacelets=f;
  algPlayer.jumpTo(target);
  refreshAlgPlayerPanel();
}
function tickAlgPlayer(){
  if(!algPlayer||!algPlayer.get().playing)return;
  const g=algPlayer.get();
  const interval=Math.max(80, Math.round(320/((g.speed)||1)));
  const now=Date.now();
  if(now-lastPlayerTick<interval)return;
  lastPlayerTick=now;
  if(g.current)demoAddMove(g.current);
  algPlayer.tickPlay(true);
  if(algPlayer.get().atEnd&&!algPlayer.get().playing&&!algPlayer.get().loop)refreshAlgPlayerPanel();
  else refreshAlgPlayerPanel();
}
function yourTurnFromPlayer(){
  if(algPlayer)algPlayer.yourTurn();
  stopAlgPlayer(true);
  demoOn=false;
}
function startMemorise(){
  if(!algPlayer)return;
  algPlayer.memorise();
  stopAlgPlayer(false);
  demoOn=false;
  document.body.classList.remove("demo-on");
  showingMe=false;
  const now=app.get();
  if(now)setupFromFacelets(displayFaceletsFor(now)||now.facelets);
  const panel=$("#algPlayerPanel");
  if(panel){panel.hidden=false;panel.removeAttribute("hidden");panel.classList.remove("hidden");panel.innerHTML=algPlayerHTML("Memorise — do it on your cube",algPlayer.get());bindAlgPlayerPanel();}
}
function tickMemoriseHint(){
  if(!algPlayer||algPlayer.get().mode!=="memorise")return;
  const before=algPlayer.get().hintMove;
  algPlayer.checkMemoriseHint(Date.now());
  if(algPlayer.get().hintMove&&!before)refreshAlgPlayerPanel();
}
async function showMeCoach(){
  const v=app.get();
  const c=v&&v.coach;
  if(!c||!c.active)return;
  const moves=[];
  if(c.phase==="hold"&&c.holdAlg)moves.push.apply(moves,E.parseAlg(c.holdAlg));
  if(c.phase!=="hold"&&c.alg)moves.push.apply(moves,E.parseAlg(c.alg));
  if(c.phase==="hold"&&!c.holdAlg&&c.alg)moves.push.apply(moves,E.parseAlg(c.alg));
  if(!moves.length)return;
  const alg=E.fmtAlg(moves);
  const start=displayFaceletsFor(v)||v.facelets;
  openAlgPlayer({alg,startFacelets:start,title:c.algName||c.title||"Show me"});
}


/* ---------- scramble (cubing.js when it loads, else built-in) ---------- */
async function loadCubing(){
  try{
    const mod=await import(CUBING_SCRAMBLE);
    if(mod&&mod.randomScrambleForEvent)fairScramble=mod.randomScrambleForEvent;
  }catch(e){fairScramble=null;}
  try{
    const tw=await import(CUBING_TWISTY);
    TwistyPlayer=tw.TwistyPlayer||tw.default||null;
  }catch(e){
    TwistyPlayer=null;
    twistyLog.lastError=String(e&&e.message||e||"twisty import failed");
  }
  try{
    const [search,puzzles,kp]=await Promise.all([
      import(CUBING_SEARCH),
      import(CUBING_PUZZLES),
      import(CUBING_KPUZZLE).catch(()=>({}))
    ]);
    searchSolve=search.experimentalSolve3x3x3IgnoringCenters||null;
    KPatternCls=kp&&kp.KPattern||null;
    if(puzzles.cube3x3x3&&typeof puzzles.cube3x3x3.kpuzzle==="function"){
      kpuzzle=await puzzles.cube3x3x3.kpuzzle();
      if(!KPatternCls&&kpuzzle&&kpuzzle.defaultPattern)KPatternCls=kpuzzle.defaultPattern().constructor;
    }
    if(searchSolve&&kpuzzle&&KPatternCls){
      /* Do not install the full cubing.js solver on the engine re-plan path.
         experimentalSolve3x3x3IgnoringCenters can block the main thread for seconds
         and was hanging Chrome around a live i3 stream. Re-plan stays at BFS-4 + undo-stack. */
      solveReady=true;
      cubeDebug.searchStatus="loaded (idle setup only)";
    }else{
      cubeDebug.searchStatus="loaded incomplete (puzzles or search missing)";
    }
  }catch(e){
    solveReady=false;
    cubeDebug.searchStatus="failed: "+String(e&&e.message||e||"search import failed");
    twistyLog.lastError=twistyLog.lastError||cubeDebug.searchStatus;
  }
  mountTwisty();
  const v=app.get();
  if(v)setupFromFacelets(v.facelets);
}
function patternFromCubies(c){
  const def=kpuzzle.defaultPattern();
  const centers=(def.patternData&&def.patternData.CENTERS)||{pieces:[0,1,2,3,4,5],orientation:[0,0,0,0,0,0]};
  const mapped=(c&&E.cubiesToCubing)?E.cubiesToCubing(c):c;
  const data={
    EDGES:{pieces:(mapped?mapped.ep:[0,1,2,3,4,5,6,7,8,9,10,11]).slice(),orientation:(mapped?mapped.eo:Array(12).fill(0)).slice()},
    CORNERS:{pieces:(mapped?mapped.cp:[0,1,2,3,4,5,6,7]).slice(),orientation:(mapped?mapped.co:Array(8).fill(0)).slice()},
    CENTERS:{pieces:centers.pieces.slice(),orientation:(centers.orientation||[0,0,0,0,0,0]).slice()}
  };
  if(centers.orientationMod)data.CENTERS.orientationMod=centers.orientationMod.slice();
  return new KPatternCls(kpuzzle,data);
}
function patternFromFacelets(f){
  if(!kpuzzle||!KPatternCls)return null;
  const c=E.cubiesFromFacelets(f);
  return patternFromCubies(c);
}
function algToMoves(alg){
  if(!alg)return [];
  return E.parseAlg(String(alg));
}
async function solveFromToSearch(from,to){
  if(!searchSolve||!kpuzzle||!KPatternCls)return null;
  const rel=E.relativeCubies(from,to);
  if(!rel)return null;
  const alg=await searchSolve(patternFromCubies(rel));
  return algToMoves(alg);
}
function expectedFacelets(){return E.applyAlg(faceletsAnchor||E.SOLVED,appliedAlg);}
function clearSetupTransformation(){
  try{
    const m=twisty&&twisty.experimentalModel&&twisty.experimentalModel.setupTransformation;
    if(m&&typeof m.set==="function")m.set(null);
  }catch(e){}
}
function setSetupTransformation(f,state){
  if(!twisty||!kpuzzle||!KPatternCls)return false;
  const c=(state&&state.CP&&state.CO&&state.EP&&state.EO)?{cp:state.CP,co:state.CO,ep:state.EP,eo:state.EO}:E.cubiesFromFacelets(f);
  if(!c)return false;
  const pat=patternFromCubies(c);
  if(!pat)return false;
  let tr=null;
  try{tr=pat.experimentalToTransformation&&pat.experimentalToTransformation();}catch(e){tr=null;}
  const model=twisty.experimentalModel;
  if(!tr||!model||!model.setupTransformation||typeof model.setupTransformation.set!=="function")return false;
  model.setupTransformation.set(tr);
  try{twisty.experimentalSetupAlg="";}catch(e){}
  try{twisty.alg="";}catch(e){}
  faceletsAnchor=f;
  appliedAlg=[];
  twistyLog.setup="transformation:"+f;
  twistyLog.faceletsSynced=true;
  cubeDebug.setupMethod="setupTransformation (no solver)";
  return true;
}
let deferredSetupTimer=0, deferredSetupJob=null, lastSetupFacelets="";
function compactApplied(f){
  if(f&&f.length===54){faceletsAnchor=f;appliedAlg=[];}
  if((twistyLog.moves||[]).length>40)twistyLog.moves=twistyLog.moves.slice(-40);
}
function applySetupFast(f,state){
  if(E.isSolved(f)){
    clearSetupTransformation();
    faceletsAnchor=E.SOLVED;snapSetup("");
    lastSetupFacelets=f;
    twistyLog.faceletsSynced=true;
    cubeDebug.setupMethod="solved";
    compactApplied(E.SOLVED);
    return true;
  }
  if(setSetupTransformation(f,state)){
    lastSetupFacelets=f;
    compactApplied(f);
    return true;
  }
  const short=E.solveFromToSync(f,E.SOLVED,4);
  if(short){
    faceletsAnchor=E.SOLVED;
    snapSetup(E.fmtAlg(E.invertAlg(short)));
    lastSetupFacelets=f;
    twistyLog.faceletsSynced=expectedFacelets()===f;
    cubeDebug.setupMethod="short BFS setupAlg";
    if(twistyLog.faceletsSynced)compactApplied(f);
    return true;
  }
  return false;
}
function scheduleIdleSearchSetup(f,state){
  deferredSetupJob={f,state};
  if(deferredSetupTimer)return;
  const later=typeof requestIdleCallback==="function"?fn=>requestIdleCallback(fn,{timeout:800}):fn=>setTimeout(fn,250);
  deferredSetupTimer=later(function(){
    deferredSetupTimer=0;
    const job=deferredSetupJob;deferredSetupJob=null;
    if(!job||!searchSolve||!kpuzzle||!KPatternCls)return;
    if(job.f===lastSetupFacelets||expectedFacelets()===job.f)return;
    if(applySetupFast(job.f,job.state))return;
    const token=++setupToken;
    cubeDebug.setupMethod="idle cubing.js search";
    Promise.resolve().then(()=>searchSolve(patternFromFacelets(job.f))).then(alg=>{
      if(token!==setupToken)return;
      if(expectedFacelets()===job.f||job.f===lastSetupFacelets)return;
      if(applySetupFast(job.f,job.state))return;
      let setup="";
      if(alg&&typeof alg.invert==="function")setup=String(alg.invert());
      else if(alg)setup=E.fmtAlg(E.invertAlg(String(alg)));
      faceletsAnchor=E.SOLVED;
      snapSetup(setup);
      lastSetupFacelets=job.f;
      twistyLog.faceletsSynced=expectedFacelets()===job.f;
      if(twistyLog.faceletsSynced)compactApplied(job.f);
      cubeDebug.setupMethod="idle cubing.js search setupAlg";
    }).catch(e=>{
      cubeDebug.lastError=String(e&&e.message||e||"idle search failed");
      cubeDebug.setupMethod="idle search failed";
    });
  });
}
function setupFromFacelets(f,state){
  f=f||(app.get()&&app.get().facelets)||E.SOLVED;
  if(!f||f.length!==54)return;
  if(f===lastSetupFacelets&&expectedFacelets()===f)return;
  ++setupToken;
  try{
    if(applySetupFast(f,state))return;
    cubeDebug.setupMethod="pending (no pattern API, search deferred)";
    scheduleIdleSearchSetup(f,state);
  }catch(e){
    const msg=String(e&&e.message||e||"setup from facelets failed");
    twistyLog.lastError=msg;cubeDebug.lastError=msg;
    cubeDebug.setupMethod="failed: "+msg;
  }
}
let lastFaceletsReqAt=0, faceletsReqInFlight=false;
async function requestFacelets(force){
  if(!conn||typeof conn.sendCubeCommand!=="function")return;
  const nowt=Date.now();
  if(!force&&(faceletsReqInFlight||nowt-lastFaceletsReqAt<400))return;
  lastFaceletsReqAt=nowt;
  faceletsReqInFlight=true;
  cubeDebug.faceletsRequestedAt=nowt;
  pushDebug({type:"COMMAND",command:"REQUEST_FACELETS",at:cubeDebug.faceletsRequestedAt});
  try{await conn.sendCubeCommand({type:"REQUEST_FACELETS"});}
  catch(e){cubeDebug.lastError=String(e&&e.message||e||"REQUEST_FACELETS failed");}
  finally{faceletsReqInFlight=false;}
}
async function nextScramble(alg){
  if(alg)return app.setScramble(alg);
  const n=(app.get()&&app.get().settings&&app.get().settings.scrambleLen)||13;
  return app.setScramble(E.randomMoveScramble(null,n));
}
function twistyClass(){
  return window.CUBING_TWISTY_PLAYER||TwistyPlayer||window.TwistyPlayer||null;
}
function playerOptions(){
  return {
    puzzle:"3x3x3",
    visualization:"3D",
    hintFacelets:"none",
    background:"none",
    controlPanel:"none",
    backView:"none",
    viewerLink:"none",
    cameraLatitude:28,
    cameraLongitude:32,
    cameraDistance:6,
    tempoScale:5,
    experimentalSetupAlg:"",
    alg:""
  };
}
function mountTwisty(){
  const host=$("#twistyHost");
  const Cls=twistyClass();
  if(!host||!Cls){
    const ph=$("#twistyPlaceholder");
    if(ph)ph.textContent=twistyLog.lastError?"3D cube couldn't load. You can turn on the 2D net in Grown-up settings, or check the internet and refresh.":"Loading the 3D cube…";
    twistyLog.ready=false;
    syncTwistyApi();
    return;
  }
  try{
    let player=null, vis="3D";
    try{player=new Cls(playerOptions());}
    catch(e){
      vis="PG3D";
      const opts=playerOptions();opts.visualization="PG3D";
      player=new Cls(opts);
    }
    twisty=player;
    twistyLog.visualization=vis;
    twistyLog.ready=true;
    twistyLog.lastError="";
    host.innerHTML="";
    host.appendChild(twisty);
    /* Fixed 3/4 view: U, F, R with white on top and green in front. The i3 can send GYRO, but following it is too twitchy for a 7-year-old, so we keep this stable angle. */
    syncAfterMount();
  }catch(e){
    twisty=null;twistyLog.ready=false;twistyLog.lastError=String(e&&e.message||e||"mount failed");
    const ph=$("#twistyPlaceholder");
    if(ph)ph.textContent="3D cube couldn't start. You can turn on the 2D net in Grown-up settings.";
  }
  syncTwistyApi();
}
function remountTwisty(){
  twisty=null;
  mountTwisty();
}
function snapSetup(alg){
  const moves=E.parseAlg(alg||"");
  appliedAlg=moves.slice();
  if(!alg)faceletsAnchor=E.SOLVED;
  const s=moves.join(" ");
  twistyLog.setup=s;
  if(!twisty)return;
  try{twisty.experimentalSetupAlg=s;}catch(e){}
  try{twisty.alg="";}catch(e){}
}
function liveMove(m){
  m=E.normalizeMove(m);
  if(!m)return;
  twistyLog.moves.push(m);
  appliedAlg.push(m);
  if(!twisty)return;
  /* Do not reset experimentalSetupAlg to "all moves from solved" — that wipes a FACELETS setupTransformation and forces a solved-looking cube. */
  try{
    if(typeof twisty.experimentalAddMove==="function")twisty.experimentalAddMove(m);
    else if(typeof twisty.experimentalAddAlgLeaf==="function")twisty.experimentalAddAlgLeaf(m,{cancel:false});
  }catch(e){cubeDebug.lastError=String(e&&e.message||e||"experimentalAddMove failed");}
}
function onScrambleChanged(){
  twistyLog.moves=[];
  const v=app.get();
  if(!v)return;
  if(v.connected)setupFromFacelets(v.facelets);
  else snapSetup(v.officialText||v.scrambleText||"");
}
function syncAfterMount(){
  const v=app.get();
  if(!v)return snapSetup("");
  if(!v.connected)return snapSetup(v.officialText||v.scrambleText||"");
  setupFromFacelets(v.facelets);
}
function hookApp(){
  const rawMove=app.onMove.bind(app);
  app.onMove=function(evt){
    try{
      const r=rawMove(evt);
      const m=E.normalizeMove(typeof evt==="string"?evt:(evt&&evt.move));
      if(m&&!showingMe&&!demoOn)liveMove(displayMoveFor(m,app.get()));
      if(algPlayer&&algPlayer.get().mode==="memorise"){algPlayer.noteLiveMove();refreshAlgPlayerPanel();}
      return r;
    }catch(e){cubeDebug.lastError=String(e&&e.message||e||"onMove");}
  };
  const rawFace=app.onFacelets.bind(app);
  app.onFacelets=function(f,state,serial){
    try{
      const face=(f&&typeof f==="object"&&f.facelets)?f.facelets:f;
      const st=(f&&typeof f==="object"&&f.state)?f.state:state;
      const ser=(f&&typeof f==="object"&&f.serial!=null)?f.serial:serial;
      const r=rawFace(face,st,ser);
      const after=app.get()||{};
      const shown=after.facelets&&after.facelets.length===54?displayFaceletsFor(after):null;
      if(shown&&shown.length===54&&!showingMe&&!demoOn){
        if(shown===expectedFacelets()||shown===lastSetupFacelets)compactApplied(shown);
        else setupFromFacelets(shown,st);
      }
      return r;
    }catch(e){cubeDebug.lastError=String(e&&e.message||e||"onFacelets");}
  };
  const rawSet=app.setScramble.bind(app);
  app.setScramble=function(alg){
    const r=rawSet(alg);
    onScrambleChanged();
    return r;
  };
  const rawNew=app.newScramble.bind(app);
  app.newScramble=function(alg,opts){
    try{stopAlgPlayer(true);}catch(e){}
    const r=rawNew(alg,opts);
    onScrambleChanged();
    return r;
  };
  const rawReset=app.resetToSolved.bind(app);
  app.resetToSolved=function(){
    const r=rawReset();
    twistyLog.moves=[];
    clearSetupTransformation();
    faceletsAnchor=E.SOLVED;
    snapSetup("");
    return r;
  };
  if(app.markSolved){
    const rawMark=app.markSolved.bind(app);
    app.markSolved=function(){
      const r=rawMark();
      twistyLog.moves=[];
      clearSetupTransformation();
      faceletsAnchor=E.SOLVED;
      snapSetup("");
      return r;
    };
  }
  const rawSim=app.simulateConnected.bind(app);
  app.simulateConnected=function(info){
    const r=rawSim(info);
    syncAfterMount();
    return r;
  };
  const rawConn=app.setConnected.bind(app);
  app.setConnected=function(on,info){
    const r=rawConn(on,info);
    if(on){syncAfterMount();requestFacelets();}
    else onScrambleChanged();
    return r;
  };
}
function syncTwistyApi(){
  window.CUBE_TWISTY=twistyLog;
  twistyLog.player=twisty||null;
  window.CUBE_UI={remountTwisty,snapSetup,liveMove,mountTwisty,getPlayer:()=>twisty,setShowNet:setShowNet,setupFromFacelets,requestFacelets,expectedFacelets:()=>expectedFacelets(),debug:()=>cubeDebug,setShowDebug:setShowDebug,setView:(n)=>setView(n),feedGanEvent:onGanEvent,getMatchMode:()=>"",setMatchMode:()=>{},tryAutoReconnect,isConnecting,showMeCoach,displayFaceletsFor,openAlgPlayer,stopAlgPlayer,getAlgPlayer:()=>algPlayer,doReset,moreDetail:()=>moreDetail};
}
function setShowNet(on){
  showNet=!!on;
  const net=$("#cubeNet");
  if(net){
    net.classList.toggle("hidden",!showNet);
    net.setAttribute("aria-hidden",showNet?"false":"true");
    if(showNet)net.innerHTML=(app.get()&&app.get().svg)||E.svgNet((app.get()&&app.get().facelets)||E.SOLVED,260);
  }
  const cb=$("#optShowNet");if(cb)cb.checked=showNet;
}

/* ---------- MAC prompt (GAN 356 i3 / Gen2) ---------- */
function closeMacModal(val){
  show($("#macModal"),false);
  if(macResolver){const r=macResolver;macResolver=null;r(val);}
}
function askMac(deviceName){
  return new Promise(resolve=>{
    macResolver=resolve;
    setText("#macDevice",deviceName?("Cube name: "+deviceName):"Ethan's GAN 356 i3");
    const saved=app.get().deviceMAC||app.get().settings.mac||"";
    const inp=$("#macInput");
    inp.value=saved;
    show($("#macModal"),true);
    setTimeout(()=>inp.focus(),100);
  });
}
async function macProvider(device,isFallback){
  const saved=E.validMac(app.get().settings.mac||app.get().deviceMAC);
  if(!isFallback){
    /* Prefer a saved MAC so we don't wait 10s for advertisements every time. */
    if(saved)return saved;
    return null; /* let gan-web-bluetooth try watchAdvertisements() */
  }
  const entered=await askMac(device&&device.name);
  const mac=E.validMac(entered);
  if(mac){app.setMac(mac);return mac;}
  return null;
}

async function loadGan(){
  if(typeof window!=="undefined"&&window.__mockGan)return window.__mockGan;
  try{return await import(GAN_MODS);}
  catch(e){return await import(GAN_MODS_FALLBACK);}
}

const GAN_NAME_RE=/^(GAN|MG|AiCube)/i;
function isGanLikeDevice(d){return !!(d&&GAN_NAME_RE.test(d.name||""));}

async function listRememberedGanDevices(){
  const bt=typeof navigator!=="undefined"?navigator.bluetooth:null;
  if(!bt||typeof bt.getDevices!=="function")return [];
  try{
    const all=await bt.getDevices();
    return (all||[]).filter(isGanLikeDevice);
  }catch(e){return [];}
}

function waitForAdvertisement(device,ms){
  if(!device)return Promise.resolve(null);
  if(typeof device.watchAdvertisements!=="function")return Promise.resolve(device);
  return new Promise(resolve=>{
    let done=false;
    const ac=typeof AbortController==="function"?new AbortController():null;
    const finish=d=>{
      if(done)return;done=true;
      try{if(ac)ac.abort();}catch(e){}
      clearTimeout(t);
      resolve(d);
    };
    const t=setTimeout(()=>finish(null),ms||8000);
    try{
      device.addEventListener("advertisementreceived",()=>finish(device),{once:true});
      const p=device.watchAdvertisements(ac?{signal:ac.signal}:{});
      if(p&&typeof p.catch==="function")p.catch(()=>finish(null));
    }catch(e){finish(null);}
  });
}

async function pickRememberedDevice(opts){
  opts=opts||{};
  const waitMs=opts.waitMs!=null?opts.waitMs:8000;
  const requireAd=!!opts.requireAdvertisement;
  const devices=await listRememberedGanDevices();
  if(!devices.length)return null;
  const watchable=devices.filter(d=>typeof d.watchAdvertisements==="function");
  if(!watchable.length){
    if(requireAd)return null;
    return devices[0];
  }
  return await new Promise(resolve=>{
    let leftover=watchable.length, settled=false;
    const acs=[];
    const done=d=>{
      if(settled)return;
      leftover--;
      if(d){
        settled=true;
        acs.forEach(a=>{try{a.abort();}catch(e){}});
        clearTimeout(timer);
        resolve(d);
        return;
      }
      if(leftover<=0&&!settled){settled=true;clearTimeout(timer);resolve(null);}
    };
    const timer=setTimeout(()=>{if(!settled){settled=true;acs.forEach(a=>{try{a.abort();}catch(e){}});resolve(null);}},waitMs);
    watchable.forEach(device=>{
      const ac=typeof AbortController==="function"?new AbortController():null;
      if(ac)acs.push(ac);
      try{
        device.addEventListener("advertisementreceived",()=>done(device),{once:true});
        const p=device.watchAdvertisements(ac?{signal:ac.signal}:{});
        if(p&&typeof p.catch==="function")p.catch(()=>done(null));
      }catch(e){done(null);}
    });
  });
}

async function withRememberedRequestDevice(device,fn){
  const bt=typeof navigator!=="undefined"?navigator.bluetooth:null;
  if(!bt||!device||typeof bt.requestDevice!=="function")return fn();
  const orig=bt.requestDevice;
  bt.requestDevice=async function(){return device;};
  try{return await fn();}
  finally{if(bt.requestDevice!==orig)bt.requestDevice=orig;}
}

function setConnecting(on){
  connecting=!!on;
  applyConnectButton(app.get());
}

function clearPendingLink(){
  connecting=false;
  pendingLive=false;
  pendingInfo=null;
}

function maybeCompleteConnect(extra){
  if(!pendingLive)return;
  pendingLive=false;
  connecting=false;
  const info=Object.assign({},pendingInfo||{},extra||{});
  pendingInfo=null;
  if(info.mac)app.setMac(info.mac);
  app.setConnected(true,info);
  render(app.get());
}

function unsubscribeGan(){
  if(unsub&&typeof unsub.unsubscribe==="function"){
    try{unsub.unsubscribe();}catch(e){}
  }
  unsub=null;
}

async function connectCube(opts){
  opts=opts||{};
  const auto=!!opts.auto;
  if(isConnecting()||(app.get()&&app.get().connected&&conn))return;
  if(isIos()||!hasWebBluetooth()){
    if(!auto)app.setError("This browser can't talk to the smart cube. Use Chrome on a computer or Android.");
    return;
  }
  setConnecting(true);
  if(!auto)app.setError("");
  cubeDebug.searchStatus=cubeDebug.searchStatus||"";
  try{
    const gan=await loadGan();
    const connectGanCube=gan.connectGanCube;
    let remembered=null;
    try{
      remembered=await pickRememberedDevice({waitMs:8000,requireAdvertisement:true});
    }catch(e){remembered=null;}
    if(!remembered&&!auto){
      /* User tapped Connect: if we have a remembered device but saw no advertisement,
         still try the remembered device when watchAdvertisements is missing; otherwise open the chooser. */
      try{
        const named=await listRememberedGanDevices();
        if(named.length&&named.every(d=>typeof d.watchAdvertisements!=="function"))remembered=named[0];
      }catch(e){}
    }
    if(auto&&!remembered){
      clearPendingLink();
      applyConnectButton(app.get());
      return;
    }
    const run=()=>connectGanCube(macProvider);
    const next=remembered?await withRememberedRequestDevice(remembered,run):await run();
    unsubscribeGan();
    conn=next;
    const name=conn.deviceName||"GAN cube";
    const mac=E.validMac(conn.deviceMAC);
    pendingInfo={name,mac:mac||"",battery:null};
    pendingLive=true;
    connecting=true;
    cubeDebug.protocol=guessProtocol(name)||"Gen2";
    cubeDebug.hardwareName=name;
    cubeDebug.faceletsReply=false;
    matchMode="";
    unsub=conn.events$.subscribe(onGanEvent);
    try{await conn.sendCubeCommand({type:"REQUEST_FACELETS"});}catch(e){}
    try{await conn.sendCubeCommand({type:"REQUEST_BATTERY"});}catch(e){}
    try{await conn.sendCubeCommand({type:"REQUEST_HARDWARE"});}catch(e){}
    applyConnectButton(app.get());
  }catch(e){
    const msg=String(e&&e.message||e||"");
    clearPendingLink();
    unsubscribeGan();
    conn=null;
    if(auto){
      applyConnectButton(app.get());
      return;
    }
    if(/User cancelled|NotFoundError|cancel/i.test(msg))app.setError("");
    else if(/MAC/i.test(msg))app.setError("The GAN 356 i3 needs its MAC address before it can talk to Chrome. Ask a grown-up — the steps are in “How to connect”.");
    else app.setError("Couldn't connect this time. Make sure the cube is awake (give it a turn), then try again in Chrome.");
    app.setConnected(false);
    applyConnectButton(app.get());
  }
}

async function tryAutoReconnect(){
  if(isIos()||!hasWebBluetooth())return;
  if(isConnecting()||(app.get()&&app.get().connected))return;
  const bt=typeof navigator!=="undefined"?navigator.bluetooth:null;
  if(!bt||typeof bt.getDevices!=="function")return;
  try{await connectCube({auto:true});}catch(e){}
}

async function disconnectCube(){
  clearPendingLink();
  unsubscribeGan();
  try{if(conn&&conn.disconnect)await conn.disconnect();}catch(e){}
  conn=null;app.setConnected(false);
  applyConnectButton(app.get());
}
function onGanEvent(ev){
  try{
    pushDebug(ev);
    if(!ev||!ev.type)return;
    if(ev.type==="MOVE"){
      app.onMove({
        move:ev.move,
        face:ev.face,
        direction:ev.direction,
        localTimestamp:ev.localTimestamp,
        cubeTimestamp:ev.cubeTimestamp,
        serial:ev.serial,
        timestamp:ev.timestamp
      });
    }else if(ev.type==="FACELETS"){
      cubeDebug.faceletsReply=true;
      cubeDebug.faceletsReceivedAt=Date.now();
      cubeDebug.lastFacelets=ev.facelets||"";
      cubeDebug.lastFaceletsSerial=ev.serial;
      maybeCompleteConnect(pendingInfo||{});
      app.onFacelets(ev.facelets,ev.state,ev.serial);
    }else if(ev.type==="BATTERY"){
      maybeCompleteConnect(Object.assign({},pendingInfo||{},{battery:ev.batteryLevel}));
      app.setBattery(ev.batteryLevel);
    }else if(ev.type==="HARDWARE"){
      cubeDebug.hardwareName=ev.hardwareName||cubeDebug.hardwareName;
      if(!cubeDebug.protocol)cubeDebug.protocol=guessProtocol(ev.hardwareName||(app.get()&&app.get().deviceName));
    }else if(ev.type==="DISCONNECT"){
      clearPendingLink();
      unsubscribeGan();
      conn=null;app.setConnected(false);
      applyConnectButton(app.get());
    }
  }catch(e){
    cubeDebug.lastError=String(e&&e.message||e||"onGanEvent");
  }
}
async function doReset(){
  try{stopAlgPlayer(true);}catch(e){}
  showingMe=false;showMeToken++;
  if(app.beginResetConfirm)app.beginResetConfirm();
  const r=app.markSolved?app.markSolved():app.resetToSolved();
  twistyLog.moves=[];
  if(typeof clearSetupTransformation==="function")try{clearSetupTransformation();}catch(e){}
  faceletsAnchor=E.SOLVED;
  try{await setupFromFacelets(E.SOLVED);}catch(e){}
  let ack=false;
  if(conn&&conn.sendCubeCommand){
    for(let i=0;i<2&&!ack;i++){
      try{await conn.sendCubeCommand({type:"REQUEST_RESET"});ack=true;if(app.noteResetAck)app.noteResetAck(true);}
      catch(e){if(i===1&&app.noteResetAck)app.noteResetAck(false);}
    }
    try{await conn.sendCubeCommand({type:"REQUEST_FACELETS"});}catch(e){}
  }
  render(app.get());
  return r;
}

/* ---------- render ---------- */
function scrambleDone(v){
  return !!(v.scrambled||v.phase==="inspect"||v.phase==="ready"||v.phase==="running"||v.phase==="stopped");
}
function splitsLine(v){
  const rec=v.lastSolve||(v.solves&&v.solves[v.solves.length-1]);
  const sp=rec&&rec.splits;
  if(!sp)return "";
  const ids=E.stagesFor((rec&&rec.method)||(v.settings&&v.settings.splitsMode)||"lbl");
  const bits=[];
  let prev=0;
  ids.forEach(id=>{
    if(!sp[id])return;
    const at=sp[id].at,seg=at-prev;prev=at;
    bits.push(`<span><b>${E.STAGE_LABEL[id]}</b> ${E.formatTime(seg)}</span>`);
  });
  return bits.length?`<div class="solve-splits">${bits.join(" · ")}</div>`:"";
}
function coachCallout(c){
  if(!c||!c.active)return "";
  if(c.guard)return `<div class="callout fix">${c.guard}</div>`;
  if(c.oops)return `<div class="callout fix">${c.oops}</div><p class="callout-sub">Undo those turns, or keep going and I'll look at the cube again.</p>`;
  const lead=c.lead?c.lead+" ":"";
  const title=c.title||"";
  const name=c.caseName?((title?": ":"")+c.caseName):"";
  const hold=c.phase==="hold"&&c.holdText?`<p class="callout-sub">${c.holdText}</p>`:"";
  const alg=c.phase==="alg"&&c.alg?`<p class="callout-sub">${c.algName?c.algName+": ":""}${c.alg}</p>`:"";
  return `<div class="callout next">${lead}<b>${title}</b>${name}</div>${hold}${alg}`;
}
function calloutHTML(v){
  const c=v.coach;
  const coachLine=(c&&c.active&&v.phase!=="scrambling")?coachCallout(c):"";
  if(v.timerMode==="step"||(c&&c.active&&(v.phase==="ready"||v.phase==="running"||v.phase==="inspect"))){
    const sub=coachLine||`<p class="callout-sub">Step time — I'll time this step, not a full solve.</p>`;
    return `<div class="callout next">Step time</div>${sub}`;
  }
  if(v.phase==="running"){
    const sub=coachLine||`<p class="callout-sub">Go! The timer stops when the cube is solved.</p>`;
    return `<div class="callout next">Go!</div>${sub}`;
  }
  if(v.phase==="stopped"){
    const rec=v.lastSolve||(v.solves&&v.solves[v.solves.length-1]);
    const t=rec?E.formatTime(rec.ms,rec.penalty):E.formatTime(v.elapsed||0);
    const sec=Math.ceil((v.nextIn||0)/1000);
    const next=sec>0?`<p class="callout-sub">Next scramble in ${sec}…</p>`:`<p class="callout-sub">Loading the next scramble…</p>`;
    const sum=c&&c.summary?`<p class="callout-sub">${c.summary.text}${(c.summary.lines&&c.summary.lines.length)?" — "+c.summary.lines.join(" · "):""}</p>`:"";
    return `<div class="callout done">Solved!</div>${splitsLine(v)}${sum}${next}`;
  }
  if(v.phase==="inspect"){
    const s=Math.ceil((v.inspectLeft||0)/1000);
    if(coachLine)return `${coachLine}<p class="callout-sub">Inspection ${s>0?s:0}. Your first turn starts the timer.</p>`;
    return `<div class="callout next">Scrambled! Inspection ${s>0?s:0}</div><p class="callout-sub">Look at the cube. Your first turn starts the timer.</p>`;
  }
  if(v.phase==="ready"){
    if(coachLine)return `${coachLine}<p class="callout-sub">Start solving — the timer starts on your first turn.</p>`;
    return `<div class="callout done">Scrambled! Start solving — the timer starts on your first turn.</div>`;
  }
  if(v.replanning||(v.phase==="scrambling"&&v.pathReady===false)){
    return `<div class="callout next">Working out the scramble…</div><p class="callout-sub">Keep turning — I'll rewrite the moves in a moment.</p>`;
  }
  if(v.fixup){
    const nxt=v.currentScramble||(v.scramble&&v.scramble[v.k])||"";
    return `<div class="callout fix">Fix-up: <b>${v.fixup}</b></div>${nxt?`<p class="callout-sub">Then we'll go on with ${nxt}${v.halfLabel?" ("+v.halfLabel+")":""}.</p>`:""}`;
  }
  const m=v.current||(v.scramble&&v.scramble[v.k])||"";
  if(!m)return "";
  const half=v.halfLabel?`<span class="half-big">${v.halfLabel}</span>`:"";
  const note=v.replanNote?`<p class="callout-sub">Scramble updated, keep going.</p>`:"";
  return `<div class="callout next">Next: <b>${m}</b>${half}</div>${note}`;
}
function coachStripHTML(c){
  if(!c||!c.active)return "";
  if(c.phase==="hold"){
    if(c.holdAlg)return `<span class="mv next">${c.holdAlg}</span>`;
    return "";
  }
  const moves=c.algMoves||[];
  if(!moves.length)return "";
  const k=c.k||0;
  const doneAll=c.done||c.phase==="done";
  return moves.map((m,i)=>{
    let cls="mv",extra="";
    if(doneAll||i<k){cls+=" done";extra=`<span class="tick" aria-hidden="true">✓</span>`;}
    else if(i===k){
      if(c.oops||c.fixup){cls+=" waiting";if(c.halfLabel)extra=`<span class="half">${c.halfLabel}</span>`;}
      else if(c.half){cls+=" next half";extra=`<span class="half">${c.halfLabel||"1/2"}</span>`;}
      else cls+=" next";
    }
    return `<span class="${cls}" data-i="${i}">${m}${extra}</span>`;
  }).join(" ");
}
function scrambleHTML(v){
  if(v.coach&&v.coach.active&&v.phase!=="scrambling"&&v.phase!=="needSolved"){
    if(v.phase==="stopped"&&!(v.coach.algMoves&&v.coach.algMoves.length))return "";
    return coachStripHTML(v.coach);
  }
  if(v.phase==="running"||v.phase==="stopped")return "";
  const moves=v.scramble||[];
  const k=v.k||0;
  const doneAll=scrambleDone(v);
  return moves.map((m,i)=>{
    let cls="mv",extra="";
    if(doneAll||i<k){cls+=" done";extra=`<span class="tick" aria-hidden="true">✓</span>`;}
    else if(i===k){
      if(v.fixup){cls+=" waiting";if(v.halfLabel)extra=`<span class="half">${v.halfLabel}</span>`;}
      else if(v.half){cls+=" next half";extra=`<span class="half">${v.halfLabel||"1/2"}</span>`;}
      else cls+=" next";
    }
    return `<span class="${cls}" data-i="${i}">${m}${extra}</span>`;
  }).join(" ");
}
function timerText(v){
  if(v.phase==="inspect"){
    const s=Math.ceil((v.inspectLeft||0)/1000);
    return s>0?String(s):"0";
  }
  if(v.phase==="wait"||v.timerMode==="off")return "0.00";
  if(v.timerMode==="step")return E.formatTime(v.stepElapsed||v.elapsed||0);
  return E.formatTime(v.elapsed||0);
}
function phaseHint(v){
  if(v.phase==="wait")return (v.coach&&v.coach.guard)||"Solve the cube first (or press My cube is solved), then I'll give you a new case.";
  if(v.resetNote&&(v.calibration||v.solved))return v.resetNote;
  if(v.ios&&!v.connected)return "On an iPhone or iPad the smart cube can't connect, but you can still use the timer with a tap or the spacebar.";
  if(v.phase==="needSolved")return "Do the big move next. I'll tick off each turn as you go. If the picture is wrong, tap Re-sync or Debug.";
  if(v.phase==="scrambling"){
    if(v.replanning||v.pathReady===false)return "Working out the scramble from how your cube is now…";
    if(v.replanNote)return "Scramble updated, keep going.";
    if(v.fixup)return "Turn "+v.fixup+" to fix that, then we'll carry on.";
    if(!v.connected)return "No cube connected — scramble by hand, then hold the timer (or spacebar) to start.";
    if(v.halfLabel)return "Halfway through "+(v.current||"that turn")+" — one more quarter turn to finish it. That's not a mistake.";
    return "Do the big move next. I'll tick off each turn as you go. If you want to start the solve early, tap Start solve anyway.";
  }
  if(v.coach&&v.coach.active&&v.phase!=="scrambling"){
    if(v.coach.guard)return v.coach.guard;
    if(v.coach.oops)return v.coach.oops;
    if(v.coach.summary)return v.coach.summary.text;
    if(v.coach.tip)return v.coach.tip;
    if(v.coach.holdText&&v.coach.phase==="hold")return v.coach.holdText;
  }
  if(v.phase==="inspect")return "Scrambled! Inspection — your first turn starts the timer."+(v.inspectLeft<3000?" Time's nearly up!":"");
  if(v.phase==="ready")return "Scrambled! Start solving — the timer starts on your first turn.";
  if(v.phase==="running"){
    if((v.elapsed||0)>=180000)return "Cube finished? Tap My cube is solved.";
    if(v.kind==="drill"&&v.session&&v.session.drillStage)return "Go! Stop when you finish "+(E.STAGE_KID[v.session.drillStage]||"this stage")+".";
    return "Go! The timer stops when the cube is solved.";
  }
  if(v.phase==="stopped"){
    const rec=v.lastSolve||v.solves[v.solves.length-1];
    const sec=Math.ceil((v.nextIn||0)/1000);
    const t=rec?E.formatTime(rec.ms,rec.penalty):"";
    const msg=v.celebration==="pb"?"New personal best! "+t : (t?t+" — nice solve!":"Done!");
    return msg+(sec>0?" Next scramble in "+sec+"…":"");
  }
  if(v.celebration==="pb"&&v.phase==="scrambling"){
    const rec=v.solves[v.solves.length-1];
    return "New personal best! "+(rec?E.formatTime(rec.ms,rec.penalty)+" — ":"")+"Here's the next scramble.";
  }
  return v.connected?"Connected and ready.":"Connect Ethan's GAN 356 i3, or use the timer by itself.";
}

/* dad's Vipassana reminder (25 Nov–6 Dec 2026, Australia/Sydney). End-of-session only. */
const REMIND_START="2026-11-25",REMIND_END="2026-12-06";
function sydneyYmd(now){
  const d=(now instanceof Date)?now:new Date(now==null?Date.now():now);
  try{
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Australia/Sydney",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
    const g=k=>(parts.find(p=>p.type===k)||{}).value;
    const y=g("year"),m=g("month"),day=g("day");
    if(y&&m&&day)return y+"-"+m+"-"+day;
  }catch(e){}
  return "";
}
function remindDate(){
  try{
    const q=new URLSearchParams(location.search).get("remindDate");
    if(q&&/^\d{4}-\d{2}-\d{2}$/.test(q))return q;
  }catch(e){}
  try{const w=window.__KIDS_HUB_REMIND_DATE;if(typeof w==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(w))return w;}catch(e){}
  try{const n=window.__KIDS_HUB_REMIND_NOW;if(n!=null)return sydneyYmd(n instanceof Date?n:new Date(n));}catch(e){}
  return sydneyYmd(new Date());
}
function showDadReminder(){const d=remindDate();return !!(d&&d>=REMIND_START&&d<=REMIND_END);}
function dadReminderHTML(){
  if(!showDadReminder())return "";
  return `<aside class="dad-note" id="dadReminder"><p>Great work today! Before you're done for the day, Dad says:</p><ol><li>Do 30 minutes of writing.</li><li>Do 15 minutes of cubing.</li><li>Sit for your 20-minute meditation at 8pm tonight. The guided recording is on the backup phone, and there's a copy on your laptop.</li></ol></aside>`;
}
window.KIDS_HUB_REMIND={sydneyYmd,remindDate,showDadReminder,dadReminderHTML};

/* body-scan start gate (25 Nov–6 Dec 2026). Overlay only; does not start practice until passed. */
const BODYSCAN_MIN_MS=3*60*1000,BODYSCAN_SHORT_MS=3*60*1000,BODYSCAN_LONG_MS=5*60*1000;
const BODYSCAN_PLAYER="ethan";
function bodyScanKey(player){return "kidsHub.p."+(player||BODYSCAN_PLAYER)+".bodyscan";}
function bodyScanDoneFor(player,date){
  try{
    const v=localStorage.getItem(bodyScanKey(player));
    if(!v)return false;
    if(v===date)return true;
    const o=JSON.parse(v);
    return !!(o&&o.date===date);
  }catch(e){return false;}
}
function markBodyScanDone(player,date){
  try{localStorage.setItem(bodyScanKey(player||BODYSCAN_PLAYER),JSON.stringify({date:date||remindDate()}));}catch(e){}
}
function needsBodyScanGate(){return showDadReminder()&&!bodyScanDoneFor(BODYSCAN_PLAYER,remindDate());}
let bsDuration=BODYSCAN_SHORT_MS,bsStartedAt=0,bsAdj=0,bsTickIv=null,bsArmed=false,bsOnPass=null;
function bodyScanNow(){
  try{const n=window.__KIDS_HUB_BODYSCAN_NOW;if(n!=null)return ((n instanceof Date)?n.getTime():+n)+bsAdj;}catch(e){}
  return Date.now()+bsAdj;
}
function bodyScanElapsed(){return bsStartedAt?Math.max(0,bodyScanNow()-bsStartedAt):0;}
function bodyScanLeft(){return Math.max(0,bsDuration-bodyScanElapsed());}
function bodyScanFmt(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function bodyScanCanFinish(){return bsArmed&&bodyScanElapsed()>=BODYSCAN_MIN_MS-50;}
function bodyScanElapse(ms){bsAdj+=(+ms||0);bodyScanTick();return {elapsed:bodyScanElapsed(),left:bodyScanLeft(),canFinish:bodyScanCanFinish()};}
function stopBodyScanTick(){if(bsTickIv){clearInterval(bsTickIv);bsTickIv=null;}}
function bodyScanTick(){
  const time=$("#bodyScanTime"),done=$("#bodyScanDone");
  if(time)time.textContent=bodyScanFmt(bsStartedAt?bodyScanLeft():bsDuration);
  if(done){
    const ok=bodyScanCanFinish();
    done.classList.toggle("hidden",!ok);
    done.disabled=!ok;
  }
  if(bsStartedAt&&bodyScanLeft()<=0)stopBodyScanTick();
}
function startBodyScanTimer(ms){
  bsDuration=ms||BODYSCAN_SHORT_MS;
  bsStartedAt=bodyScanNow();
  bsArmed=true;
  const start=$("#bodyScanStart"),start5=$("#bodyScanStart5"),hint=$("#bodyScanHint");
  if(start)start.classList.add("hidden");
  if(start5)start5.classList.add("hidden");
  if(hint)hint.classList.add("hidden");
  bodyScanTick();
  stopBodyScanTick();
  bsTickIv=setInterval(bodyScanTick,100);
}
function finishBodyScanGate(){
  if(!bodyScanCanFinish())return;
  stopBodyScanTick();
  markBodyScanDone(BODYSCAN_PLAYER,remindDate());
  bsStartedAt=0;bsArmed=false;bsAdj=0;
  const gate=$("#bodyScanGate");
  if(gate)gate.remove();
  const fn=bsOnPass;bsOnPass=null;
  if(typeof fn==="function")fn();
}
function renderBodyScanGate(onPass){
  bsOnPass=onPass||bsOnPass;
  stopBodyScanTick();bsStartedAt=0;bsArmed=false;bsDuration=BODYSCAN_SHORT_MS;
  let gate=$("#bodyScanGate");
  if(!gate){
    gate=document.createElement("section");
    gate.id="bodyScanGate";
    gate.className="bodyscan-overlay";
    gate.innerHTML='<div class="bodyscan-card" id="bodyScanCard"></div>';
    document.body.appendChild(gate);
  }
  const card=$("#bodyScanCard")||gate;
  card.innerHTML=`<h2>Do your body scan before starting (3–5 minutes)</h2>
    <div class="bodyscan-time" id="bodyScanTime">3:00</div>
    <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">
      <button class="btn huge" id="bodyScanStart" type="button">Start</button>
      <button class="btn ghost" id="bodyScanStart5" type="button">Or do 5 minutes</button>
    </div>
    <p class="muted" id="bodyScanHint">Press Start when you are ready. You can choose 5 minutes if you like.</p>
    <div class="row" style="justify-content:center;margin-top:16px"><button class="btn huge hidden" id="bodyScanDone" type="button" disabled>I've done my body scan</button></div>`;
  $("#bodyScanStart").onclick=()=>startBodyScanTimer(BODYSCAN_SHORT_MS);
  $("#bodyScanStart5").onclick=()=>startBodyScanTimer(BODYSCAN_LONG_MS);
  $("#bodyScanDone").onclick=finishBodyScanGate;
  bodyScanTick();
}


function sessionSummaryHTML(sum){
  if(!sum)return "";
  const warm=(sum.warmupTimes||[]).map((t,i)=>`Warm-up ${i+1}: ${t.text}`).join(" · ")||"No warm-up times";
  const drill=sum.drillReps!=null?`Drill (${sum.drillLabel||"practice"}): ${sum.drillReps} of ${sum.drillTarget||5} reps`:"";
  const ao5=sum.ao5&&sum.ao5.text?`ao5 ${sum.ao5.text}`:"ao5 —";
  const ao5t=(sum.ao5Times||[]).map((t,i)=>t.text).join(", ");
  return `<ul class="session-summary">
      <li>${warm}</li>
      ${drill?`<li>${drill}</li>`:""}
      <li>${ao5}${ao5t?` (${ao5t})`:""}${sum.pb?` · PB ${sum.pb.text}`:""}</li>
    </ul>
    <p class="stars-line">${"★".repeat(sum.stars||0)}${"☆".repeat(Math.max(0,3-(sum.stars||0)))} ${sum.stars||0} star${sum.stars===1?"":"s"} today</p>`;
}
function sessionBannerHTML(v){
  const sp=v.sessionProgress;
  if(!sp||(!sp.active&&!sp.done)){
    return `<div class="session-banner idle">
      <div class="sb-title">Today's cube session</div>
      <button class="btn" id="startLessonBtn" type="button">Start today's session</button>
      <p class="sb-explain">About 10–15 minutes using the scramble and timer above: 3 warm-up solves, a drill on your slowest step, then 5 timed solves for an average of 5.</p>
    </div>`;
  }
  if(sp.done){
    return `<div class="session-banner done">
      <div class="sb-title">Session done — well done!</div>
      <button class="btn" id="startLessonBtn" type="button">Do another session</button>
      ${sessionSummaryHTML(sp.summary||(v.session&&v.session.summary))}
      ${dadReminderHTML()}
    </div>`;
  }
  const drillBtns=sp.phase==="drill"?`<button class="btn ghost" id="skipDrillBtn" type="button">Done / Skip drill</button>`:"";
  return `<div class="session-banner" data-phase="${sp.phase||""}">
    <div class="sb-title">${sp.title}</div>
    <button class="btn ghost danger" id="stopSessionBtn" type="button">Stop</button>
    ${drillBtns}
    <p class="sb-explain">${sp.explain||""}</p>
  </div>`;
}
if(window.KIDS_HUB_REMIND)window.KIDS_HUB_REMIND.sessionBannerHTML=sessionBannerHTML;
window.KIDS_HUB_BODYSCAN={
  key:bodyScanKey,doneFor:bodyScanDoneFor,mark:markBodyScanDone,needs:needsBodyScanGate,
  elapse:bodyScanElapse,tick:bodyScanTick,start:startBodyScanTimer,finish:finishBodyScanGate,
  minMs:BODYSCAN_MIN_MS,remindDate,showWindow:showDadReminder,sydneyYmd
};
function sessionHTML(v){
  /* Session lives in the main banner above the scramble. Keep this slot empty so we don't show a disconnected widget. */
  return "";
}
function splitsHTML(v){
  const mode=v.settings.splitsMode||"lbl";
  const ids=E.stagesFor(mode);
  const run=v.run&&v.run.splits||{};
  const best=v.stats.bestSplits||{};
  const has=ids.some(id=>run[id]);
  if(!has && v.phase!=="running" && v.phase!=="stopped")return "";
  return `<div class="splits">${ids.map(id=>{
    const at=run[id];
    const b=best[id];
    const flags=v.stages||{};
    const on=!!flags[id];
    return `<div class="split${on?" on":""}"><div class="sn">${E.STAGE_LABEL[id]}</div>
      <div class="st">${at?E.formatTime(at.at):"—"}</div>
      <div class="sb">${b?"best "+b.text:""}</div></div>`;
  }).join("")}</div>`;
}
function chartSVG(trend){
  const pts=(trend||[]).map((p,i)=>({i,ms:p.ms})).filter(p=>p.ms!=null&&isFinite(p.ms));
  if(pts.length<2)return `<p class="muted">Do a few timed solves and a trend line will show up here.</p>`;
  const w=400,h=140,l=40,r=12,top=12,bot=28;
  const ys=pts.map(p=>p.ms),min=Math.min(...ys),max=Math.max(...ys),span=Math.max(1,max-min);
  const innerW=w-l-r, innerH=h-top-bot;
  const x=i=>l+i*innerW/Math.max(1,(trend.length-1));
  const y=ms=>top+innerH-((ms-min)/span)*innerH;
  const d=pts.map((p,k)=>(k?"L":"M")+x(p.i).toFixed(1)+","+y(p.ms).toFixed(1)).join(" ");
  const ticks=3;
  const grid=[];
  for(let i=0;i<=ticks;i++){
    const ms=min+(span*(ticks-i)/ticks);
    const yy=y(ms).toFixed(1);
    const label=(ms/1000).toFixed(ms>=10000?0:1)+"s";
    grid.push('<line x1="'+l+'" x2="'+(w-r)+'" y1="'+yy+'" y2="'+yy+'" stroke="currentColor" stroke-opacity="0.12" stroke-width="1"/>');
    grid.push('<text x="'+(l-6)+'" y="'+(Number(yy)+4)+'" text-anchor="end" fill="currentColor" opacity="0.55" font-size="10" font-family="ui-monospace,Menlo,monospace">'+label+"</text>");
  }
  const x0='<text x="'+l+'" y="'+(h-8)+'" fill="currentColor" opacity="0.55" font-size="10">Older</text>';
  const x1='<text x="'+(w-r)+'" y="'+(h-8)+'" text-anchor="end" fill="currentColor" opacity="0.55" font-size="10">Newer</text>';
  return '<svg viewBox="0 0 '+w+' '+h+'" class="chart" role="img" aria-label="Solve time trend, '+E.formatTime(min)+' to '+E.formatTime(max)+'">'+grid.join("")+'<path d="'+d+'" fill="none" stroke="currentColor" style="color:var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'+x0+x1+"</svg>";
}
function historyHTML(v){
  const rows=(v.solves||[]).slice().reverse().slice(0,30);
  if(!rows.length)return `<p class="muted">No solves yet. Connect the cube or use the timer to record one.</p>`;
  return `<div class="hist">${rows.map(s=>`<div class="hrow" data-id="${s.id}">
    <span class="ht">${E.formatTime(s.ms,s.penalty)}</span>
    <span class="hm">${s.kind==="drill"?"drill":s.source==="manual"?"timer":"cube"}${s.moves?` · ${s.moves} moves`:""}${s.tps?` · ${s.tps} tps`:""}</span>
    <span class="ha">
      <button type="button" class="tiny" data-pen="+2" data-id="${s.id}">+2</button>
      <button type="button" class="tiny" data-pen="DNF" data-id="${s.id}">DNF</button>
      <button type="button" class="tiny" data-pen="ok" data-id="${s.id}">OK</button>
      <button type="button" class="tiny danger" data-del="${s.id}">Delete</button>
    </span>
  </div>`).join("")}</div>`;
}


function thumbUrl(id){return "https://i.ytimg.com/vi/"+id+"/hqdefault.jpg";}
function ytWatchUrl(v0){
  if(E.watchUrlFor)return E.watchUrlFor(v0);
  if(v0&&v0.url)return v0.url;
  return v0&&v0.id?("https://www.youtube.com/watch?v="+v0.id):"";
}
function embedSrc(v0){
  return (E.embedUrlFor?E.embedUrlFor(v0):("https://www.youtube.com/embed/"+(v0&&v0.id||"")+"?rel=0"));
}
function watchCardHTML(v0,opts){
  opts=opts||{};
  if(!v0||!v0.id)return "";
  const watched=!!loadWatched()[v0.id];
  const src=embedSrc(v0);
  const open=ytWatchUrl(v0);
  const title=(v0.title||"Video")+(v0.channel?(" — "+v0.channel):"");
  const openEmbed=opts.open===true;
  const heading=opts.heading==null?"Watch first":opts.heading;
  return `<div class="watch-card" data-vid="${v0.id}">
      <img src="${thumbUrl(v0.id)}" alt="" width="96" height="54">
      <div>
        ${heading?`<p class="watch-kicker">${heading}</p>`:""}
        <p class="watch-title">${title}${watched?" <b>✓ watched</b>":""}</p>
        <p class="vid-links"><a href="${open}" target="_blank" rel="noopener">Open on YouTube</a></p>
        ${opts.hideToggle?"":`<button class="btn ghost" type="button" id="${opts.toggleId||"watchToggle"}" data-vid="${v0.id}">${openEmbed?"Hide video":"Watch here"}</button>`}
        ${opts.mark?`<button class="btn" type="button" id="markWatched" data-vid="${v0.id}">I've watched this</button>`:""}
      </div>
    </div>
    <div id="${opts.bodyId||"watchBody"}" class="${openEmbed?"":"hidden"}">
      <div class="vid-frame"><iframe src="${openEmbed?src:""}" data-src="${src}" title="${v0.title||"Video"}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>
    </div>`;
}
function videoPanelHTML(v){
  const drill=(v.sessionProgress&&v.sessionProgress.active&&v.sessionProgress.phase==="drill"&&(v.sessionProgress.drillStage||v.sessionProgress.stage))||"";
  const vids=(v.sessionProgress&&v.sessionProgress.videos)||(drill&&E.videosForDrill?E.videosForDrill(drill):null)||v.videos||[];
  if(!vids.length)return "";
  if(!(v.sessionProgress&&v.sessionProgress.active&&v.sessionProgress.phase==="drill"))return "";
  return `<h3>Watch first</h3>`+watchCardHTML(vids[0],{heading:"",mark:true,open:false,toggleId:"watchToggle",bodyId:"watchBody"});
}
function tipWatchHTML(type){
  if(!type||!E.videosForDrill)return "";
  const vids=E.videosForDrill(type)||[];
  if(!vids[0])return "";
  return `<div class="watch tip-watch">`+watchCardHTML(vids[0],{heading:"Watch this tip",mark:false,open:false,toggleId:"tipWatchToggle",bodyId:"tipWatchBody"})+`</div>`;
}
const STAGE_NAME={cross:"Cross",fl:"First layer",sl:"Second layer",ll:"Last layer",f2l:"F2L",oll:"OLL",pll:"PLL",firstLayer:"First layer",secondLayer:"Second layer",lastLayer:"Last layer"};
function stageName(id){return STAGE_NAME[id]||(E.STAGE_LABEL&&E.STAGE_LABEL[id])||id;}
function lastSolveOf(v){
  return (v&&v.lastSolve)||(v&&v.solves&&v.solves[v.solves.length-1])||null;
}
function stageBarHTML(stages,total){
  total=Math.max(1,total||(stages||[]).reduce((s,x)=>s+(x.ms||0),0));
  return (stages||[]).map(s=>`<span class="${s.name}" style="width:${Math.max(4,(s.ms||0)/total*100)}%" title="${s.name}"></span>`).join("");
}
function reviewHTML(v){
  const rec=v.lastSolve;
  const a=rec&&rec.analysis;
  if(!a||v.phase!=="stopped")return "";
  const stages=a.stages||[];
  const total=Math.max(1,a.timeMs||stages.reduce((s,x)=>s+(x.ms||0),0));
  const drill=(a.weakness&&a.weakness.type)||a.drill||"";
  const sentence=a.feedback||rec.feedback||(a.tip&&a.tip.tip)||"";
  return `<div class="review-compact">
    <div class="review-time">${E.formatTime(a.timeMs||rec.ms||0)}</div>
    <div class="stagebar">${stageBarHTML(stages,total)}</div>
    <p class="feedback">${sentence}</p>
    <div class="player-btns">
      <button class="btn" type="button" id="practiseThis" data-drill="${drill}" data-why="${(a.weakness&&a.weakness.why)||""}">Practise this</button>
      <button class="btn ghost" type="button" id="reviewMore">More detail</button>
    </div>
  </div>`;
}
function loseTimeRows(v){
  const t=v.trends;
  if(t&&t.n&&t.weaknesses&&t.weaknesses.length){
    return {n:t.n,improvedMs:t.improvedMs||0,rows:t.weaknesses.slice(0,4),source:"trends"};
  }
  const recs=(v.solves||[]).filter(r=>r&&r.analysis&&r.analysis.stages&&r.analysis.stages.length);
  if(!recs.length)return null;
  const last=recs.slice(-12);
  const acc={};
  last.forEach(r=>r.analysis.stages.forEach(s=>{
    if(!acc[s.name])acc[s.name]={ms:0,n:0};
    acc[s.name].ms+=s.ms||0;acc[s.name].n++;
  }));
  const rows=Object.keys(acc).map(k=>{
    const avg=acc[k].ms/acc[k].n;
    const tgt=(t&&t.targets&&t.targets[k])||null;
    return {stage:k,avgMs:avg,target:tgt,over:tgt!=null?avg-tgt:0};
  }).sort((a,b)=> (b.over||0)-(a.over||0)||b.avgMs-a.avgMs);
  return {n:last.length,improvedMs:(t&&t.improvedMs)||0,rows,source:"solves"};
}
function loseTimeHTML(v){
  const data=loseTimeRows(v);
  if(!data)return "";
  const max=Math.max(1,...data.rows.map(w=>Math.max(w.avgMs||0,w.target||0)));
  const bars=data.rows.map(w=>{
    const label=stageName(w.stage);
    const avg=(w.avgMs/1000).toFixed(1);
    const tgt=w.target!=null?(w.target/1000).toFixed(0)+"s":"";
    return `<div class="lose-row"><div class="lose-lab">${label}</div><div class="lose-track"><i style="width:${Math.max(4,(w.avgMs||0)/max*100)}%"></i></div><div class="lose-val">${avg}s${tgt?" / "+tgt:""}</div></div>`;
  }).join("");
  const line="Across your last "+data.n+" solves"+(data.improvedMs>400?(", you're "+E.formatTime(Math.round(data.improvedMs))+" faster than your first day"):".");
  return `<h3>Where you lose time</h3><p class="feedback">${line}</p>${bars}`;
}
function trendsHTML(v){
  /* Coach tab owns the trends; keep this hook so fillSidePanels can hide the old card. */
  return "";
}
function coachTabHTML(v){
  const rec=lastSolveOf(v);
  const a=rec&&rec.analysis;
  let out="";
  if(a){
    const stages=a.stages||[];
    const total=Math.max(1,a.timeMs||stages.reduce((s,x)=>s+(x.ms||0),0));
    const tip=a.tip||{};
    const drill=(a.weakness&&a.weakness.type)||a.drill||"";
    const labels=stages.map(s=>{
      const name=stageName(s.name);
      return `<li><span>${name}</span><b>${E.formatTime(s.ms||0)}</b></li>`;
    }).join("");
    out+=`<section class="card coach-last">
      <h3>Last solve</h3>
      <div class="review-time">${E.formatTime(a.timeMs||rec.ms||0)}</div>
      <div class="stagebar">${stageBarHTML(stages,total)}</div>
      <ul class="stage-legend">${labels}</ul>
      <p class="feedback">${a.feedback||rec.feedback||""}</p>
      ${a.biggestLoss?`<p class="muted">Biggest time loss: ${a.biggestLoss.label||a.biggestLoss.kind} (${((a.biggestLoss.ms||0)/1000).toFixed(1)}s)</p>`:""}
      <p>${tip.tip||""}</p>
      ${tip.why?`<p class="why">Why this works: ${tip.why}</p>`:""}
      <p class="muted">Moves ${a.moveCount||0} · ${a.tps||0} TPS · pauses ${a.pauseCount||0} (${((a.pauseMs||0)/1000).toFixed(1)}s)</p>
      ${tipWatchHTML(drill)}
      <div class="player-btns">
        <button class="btn" type="button" id="practiseThisCoach" data-drill="${drill}" data-why="${(a.weakness&&a.weakness.why)||""}">Practise this</button>
        <button class="btn ghost" type="button" id="replaySolveCoach">Replay</button>
        ${(stages.filter(s=>s.name==="cross"&&s.optimalAlg)[0])?`<button class="btn ghost" type="button" id="replayOptCoach">Show a shorter cross</button>`:""}
      </div>
    </section>`;
  }
  const lose=loseTimeHTML(v);
  if(lose)out+=`<section class="card coach-trends">${lose}</section>`;
  if(!out)return `<div class="empty-card" id="coachEmpty">After a solve, this tab shows where time went and what to practise next. Finish a timed solve on the Practice tab, then come back here.</div>`;
  return out;
}
function lessonsHTML(){
  const all=E.allLessonVideos?E.allLessonVideos():(E.DRILL_VIDEOS?Object.keys(E.DRILL_VIDEOS).map(k=>Object.assign({key:k,skill:E.skillForVideo?E.skillForVideo(E.DRILL_VIDEOS[k]):""},E.DRILL_VIDEOS[k])):[]);
  const groups=[];
  const order=["Look-ahead","Cross","F2L","Finger tricks","Last layer","Beginner"];
  const by={};
  all.forEach(v=>{
    const g=v.skill||"Beginner";
    if(!by[g]){by[g]=[];groups.push(g);}
    by[g].push(v);
  });
  const skills=order.filter(s=>by[s]&&by[s].length).concat(groups.filter(s=>order.indexOf(s)<0));
  return skills.map(s=>{
    const cards=by[s].map(v=>`<button type="button" class="lesson-card" data-lesson-id="${v.id}" data-title="${String(v.title||"").replace(/"/g,"&quot;")}" data-url="${ytWatchUrl(v)}">
        <img src="${thumbUrl(v.id)}" alt="${String(v.title||"").replace(/"/g,"&quot;")}" width="154" height="86">
        <span>${v.title||"Video"}</span>
      </button>`).join("");
    return `<h3 class="lesson-skill">${s}</h3><div class="lesson-list">${cards}</div>`;
  }).join("");
}
function fillLessons(){
  const list=$("#lessonList");
  if(!list||list.getAttribute("data-filled")==="1")return;
  list.innerHTML=lessonsHTML();
  list.setAttribute("data-filled","1");
}
function setLessonsOpen(on){
  if(on)setView("lessons");
  else if(currentView==="lessons")setView("practice");
}
function openLesson(id){
  const all=E.allLessonVideos?E.allLessonVideos():[];
  const v0=all.filter(v=>v.id===id)[0]||{id:id,title:"Video",url:"https://www.youtube.com/watch?v="+id};
  const box=$("#lessonEmbed");
  if(!box)return;
  const src=embedSrc(v0);
  const open=ytWatchUrl(v0);
  box.hidden=false;
  box.innerHTML=`<div class="vid-frame"><iframe src="${src}" title="${v0.title||"Video"}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>
    <p class="vid-links"><a href="${open}" target="_blank" rel="noopener">Open on YouTube</a></p>`;
  try{box.scrollIntoView({block:"nearest"});}catch(e){}
}
function fillSidePanels(v){
  function put(id, html){
    const el=$(id); if(!el)return;
    const on=!!html;
    el.classList.toggle("hidden",!on);
    if(on){el.hidden=false;el.removeAttribute("hidden");el.innerHTML=html;}
    else{el.hidden=true;el.setAttribute("hidden","");el.innerHTML="";}
  }
  put("#videoPanel", videoPanelHTML(v));
  put("#reviewCard", reviewHTML(v));
  put("#trendsCard", "");
  const body=$("#coachTabBody");
  if(body)body.innerHTML=coachTabHTML(v);
  if(v.resetNote){
    /* keep the note visible via hint */
  }
}
function replayLastSolve(optCross){
  const v=app.get();
  const rec=v&&v.lastSolve;
  if(!rec)return;
  const start=rec.startFacelets||E.SOLVED;
  if(optCross){
    const st=(rec.analysis&&rec.analysis.stages||[]).filter(s=>s.name==="cross")[0];
    if(st&&st.optimalAlg)return openAlgPlayer({alg:st.optimalAlg,startFacelets:start,title:"A shorter cross"});
  }
  const alg=E.fmtAlg((rec.trace||[]).map(x=>x.m||x));
  openAlgPlayer({alg,startFacelets:start,title:"Replay that solve"});
}

function coachPanelHTML(v){
  const c=v.coach;
  if(!c||!c.active)return "";
  const times=(c.stepTimes||[]).map(r=>`${E.coachStepLabel?E.coachStepLabel(r.stage,r.caseId):(r.name||r.stage)} ${E.fmtCoachMs?E.fmtCoachMs(r.ms):(Math.round((r.ms||0)/100)/10).toFixed(1)+"s"}`);
  const showAlg=c.phase==="alg"&&c.algName?`<div class="alg-name">${c.algName}</div>`:"";
  const hold=c.holdText?`<p class="hold">${c.holdText}</p>`:"";
  const tip=c.tip?`<p class="tip">${c.tip}</p>`:"";
  const oops=c.oops?`<div class="oops">${c.oops}</div>`:"";
  const guard=c.guard?`<div class="guard">${c.guard}</div>`:"";
  const sum=c.summary?`<p class="summary">${c.summary.text}</p>`:"";
  const timeLine=times.length?`<p class="times">${times.join(" · ")}</p>`:"";
  const stepNow=(v.timerMode==="step")?`<p class="times">Step time ${E.formatTime(v.stepElapsed||0)}</p>`:"";
  const showMe=(c.alg||c.holdAlg)?`<button class="btn" id="coachShowMe" type="button">Show me</button>`:"";
  const metro=c.metronome?`<div class="metro" aria-hidden="true"><i></i></div>`:"";
  return `<h3>${c.title||"Coach"}</h3>${metro}
    ${c.caseName?`<p class="hold">${c.lead?c.lead+" ":""}${c.caseName}</p>`:""}
    ${hold}${tip}${showAlg}${oops}${guard}${stepNow}${timeLine}${sum}
    <div class="coach-btns">${showMe}<button class="btn ghost" id="coachNextCase" type="button">Next case</button></div>`;
}
let connecting=false, pendingLive=false, pendingInfo=null;
function isConnecting(){return !!(connecting||pendingLive);}
function applyConnectButton(v){
  const btn=$("#connectBtn");
  if(!btn)return;
  if(isConnecting()){
    btn.disabled=true;
    btn.textContent="Connecting…";
    setText("#connStatus","Connecting…");
    const sc=$("#settingsConn"); if(sc)sc.textContent="Connecting…";
    show($("#battery"),false);
    document.body.classList.remove("connected");
    return;
  }
  btn.disabled=false;
  if(v&&v.connected){
    /* Status never uses the word Paired — that is Chrome's chooser label, not a live link. */
    setText("#connStatus",(v.deviceName||"GAN 356 i3")+(v.deviceMAC?" · "+v.deviceMAC:""));
    show($("#battery"),v.battery!=null);
    btn.textContent="Disconnect";
  }else{
    setText("#connStatus",(v&&v.ios)?"Timer-only on this iPhone/iPad":"Not connected — timer still works");
    show($("#battery"),false);
    btn.textContent="Connect";
  }
  const sc=$("#settingsConn");
  if(sc)sc.textContent=($("#connStatus")&&$("#connStatus").textContent)||"";
}
function render(v){
  document.body.classList.toggle("connected",!!v.connected && !isConnecting());
  document.body.classList.toggle("ios",!!v.ios);
  document.body.classList.toggle("pb",v.celebration==="pb");
  show($("#iosNote"),!!v.ios);
  show($("#btNote"),!v.ios&&!hasWebBluetooth());
  const batt=$("#battery");
  if(v.connected&&v.battery!=null&&!isConnecting()){
    const pct=$("#batteryPct");
    if(pct)pct.textContent=v.battery+"%";
    batt.classList.toggle("low",v.battery<20);
    batt.title="Battery "+v.battery+"%";
  }
  applyConnectButton(v);
  const err=$("#connError");
  if(v.lastError){err.textContent=v.lastError;show(err,true);}else show(err,false);

  if(showNet){
    const net=$("#cubeNet");
    if(net)net.innerHTML=v.svg||E.svgNet(v.facelets,260);
  }
  const call=$("#callout");
  if(call)call.innerHTML=calloutHTML(v);
  const scr=$("#scramble");
  if(scr){
    scr.innerHTML=scrambleHTML(v);
    scr.classList.toggle("locked",!!v.locked && !(v.coach&&v.coach.active&&v.phase!=="scrambling"));
  }
  const panel=$("#coachPanel");
  if(panel){
    const on=!!(v.coach&&v.coach.active&&v.phase!=="scrambling");
    panel.classList.toggle("hidden",!on);
    if(on){panel.hidden=false;panel.removeAttribute("hidden");panel.innerHTML=coachPanelHTML(v);}
    else{panel.hidden=true;panel.setAttribute("hidden","");panel.innerHTML="";}
  }
  fillSidePanels(v);
  const startSol=$("#startSolveBtn");
  if(startSol)startSol.classList.toggle("hidden",v.phase!=="scrambling");
  const nextBtn=$("#nextBtn");
  if(nextBtn)nextBtn.classList.toggle("hidden",v.phase!=="stopped");
  const fix=$("#fixup");
  if(fix)show(fix,false);

  const timer=$("#timer");
  timer.textContent=timerText(v);
  timer.className="timer ph-"+((v.timerMode==="step")?"ready":v.phase)+(v.hold&&v.hold.ready?" ready":"");
  const tLab=$("#timerLabel");
  if(tLab){tLab.textContent=v.timerLabel||"";tLab.classList.toggle("hidden",!v.timerLabel);}
  document.body.classList.toggle("plan-blind", !!(v.sessionProgress&&v.sessionProgress.planMode&&v.phase!=="inspect"&&v.phase!=="scrambling"&&v.phase!=="idle"));
  if(v.resetNote){/* shown in debug and as a short hint overlay via hint if just reset */}

  setText("#hint",phaseHint(v));
  $("#splits").innerHTML=splitsHTML(v);
  const sb=$("#sessionBanner");
  if(sb)sb.innerHTML=sessionBannerHTML(v);
  applyConnectButton(v);

  const cele=$("#cele");
  show(cele,v.celebration==="pb");
  if(v.celebration==="pb"){
    const st=v.stats||{};
    setText("#celeText","New personal best! "+(st.pb?st.pb.text:""));
  }
  if(showDebug){
    const dbg=$("#cubeDebug");
    if(dbg)dbg.textContent=debugText(v);
  }
  maybeRenderChrome(v);
}

let lastChromeKey="", chromeRaf=0;
function renderChrome(v){
  if(!v)return;
  const st=v.stats||{};
  setText("#statPb",st.pb?st.pb.text:"—");
  setText("#statAo5",st.ao5?st.ao5.text:"—");
  setText("#statAo12",st.ao12?st.ao12.text:"—");
  setText("#statStreak",(st.streak||0)+" day"+(st.streak===1?"":"s"));
  setText("#statStars",String(st.stars||0));
  const chart=$("#chart"); if(chart)chart.innerHTML=chartSVG(st.trend);
  const bs=st.bestSplits||{};
  const best=$("#bestSplits");
  if(best)best.innerHTML=E.stagesFor(v.settings.splitsMode).map(id=>`<li><b>${E.STAGE_LABEL[id]}</b> ${bs[id]?bs[id].text:"—"}</li>`).join("");
  const hist=$("#history"); if(hist)hist.innerHTML=historyHTML(v);
  const box=$("#sessionBox");
  if(box)box.innerHTML=sessionHTML(v);
  const insp=$("#optInspect");if(insp)insp.checked=v.settings.inspect!==false;
  const mode=$("#optMode");if(mode)mode.value=v.settings.splitsMode||"lbl";
  const llm=$("#optLlMethod");if(llm)llm.value=(v.settings&&v.settings.llMethod)||"beginner";
  const slen=$("#optScrambleLen");if(slen&&document.activeElement!==slen)slen.value=v.settings.scrambleLen||13;
  setText("#savedMac",v.settings.mac||"not saved yet");
}
function chromeKey(v){
  return [v.phase, (v.solves&&v.solves.length)||0, v.connected?"1":"0", currentView, showDebug?"d":"", v.celebration||"", (v.sessionProgress&&v.sessionProgress.phase)||"", (v.stats&&v.stats.pb&&v.stats.pb.text)||""].join("|");
}
function maybeRenderChrome(v){
  const key=chromeKey(v);
  if(key!==lastChromeKey || v.phase==="stopped" || v.phase==="idle"){
    lastChromeKey=key;
    renderChrome(v);
    return;
  }
  if(chromeRaf)return;
  chromeRaf=(typeof requestAnimationFrame==="function"?requestAnimationFrame:fn=>setTimeout(fn,16))(function(){
    chromeRaf=0;
    const now=app.get();
    lastChromeKey=chromeKey(now);
    renderChrome(now);
  });
}

function onAppView(v){
  render(v);
  const yt=!!(v.coach&&v.coach.active&&v.coach.yellowTop);
  if(yt!==lastYellowTop){
    lastYellowTop=yt;
    if(!showingMe)setupFromFacelets(displayFaceletsFor(v)||v.facelets);
  }
  if(v.faceletsGen!=null&&v.faceletsGen!==lastFaceletsGen){
    lastFaceletsGen=v.faceletsGen;
    requestFacelets();
  }
}
app.on(onAppView);

function bind(){
  $("#connectBtn").addEventListener("click",()=>{if(isConnecting())return;if(app.get().connected)disconnectCube();else connectCube();});
  $("#resetBtn").addEventListener("click",()=>{
    doReset();
    render(app.get());
  });
  const resync=$("#resyncBtn");
  if(resync)resync.addEventListener("click",()=>{requestFacelets(true);const v=app.get();if(v)setupFromFacelets(displayFaceletsFor(v)||v.facelets);});
  $("#newScrambleBtn").addEventListener("click",()=>nextScramble());
  $("#helpToggle").addEventListener("click",()=>{
    setView("settings");
    const hp=$("#helpPanel");
    if(hp)hp.classList.remove("hidden");
  });
  $("#grownToggle").addEventListener("click",()=>$("#grownPanel").classList.toggle("hidden"));
  $("#macSave").addEventListener("click",()=>closeMacModal($("#macInput").value));
  $("#macCancel").addEventListener("click",()=>closeMacModal(null));
  $("#macInput").addEventListener("keydown",e=>{if(e.key==="Enter")closeMacModal($("#macInput").value);if(e.key==="Escape")closeMacModal(null);});
  $("#macClear").addEventListener("click",()=>{app.setMac("");setText("#savedMac","not saved yet");});
  $("#optInspect").addEventListener("change",e=>app.setSetting("inspect",e.target.checked));
  $("#optMode").addEventListener("change",e=>app.setSetting("splitsMode",e.target.value));
  const optLl=$("#optLlMethod");
  if(optLl)optLl.addEventListener("change",e=>app.setSetting("llMethod",e.target.value));
  const slen=$("#optScrambleLen");
  if(slen)slen.addEventListener("change",e=>app.setSetting("scrambleLen",e.target.value));
  const startSol=$("#startSolveBtn");
  if(startSol)startSol.addEventListener("click",()=>app.startSolveAnyway());
  const netCb=$("#optShowNet");
  if(netCb)netCb.addEventListener("change",e=>setShowNet(e.target.checked));
  const dbgCb=$("#optShowDebug");
  if(dbgCb)dbgCb.addEventListener("change",e=>setShowDebug(e.target.checked));
  const dbgBtn=$("#debugBtn");
  if(dbgBtn)dbgBtn.addEventListener("click",()=>setShowDebug(!showDebug));
  const copyDbg=$("#copyDebugBtn");
  if(copyDbg)copyDbg.addEventListener("click",()=>{copyDebugLog();});
  const lessonsBtn=$("#lessonsBtn");
  if(lessonsBtn)lessonsBtn.addEventListener("click",()=>{
    const panel=$("#lessonsPanel");
    const isOpen=currentView==="lessons"&&panel&&!panel.hidden&&!panel.classList.contains("hidden");
    setLessonsOpen(!isOpen);
  });
  $$(".nav-item").forEach(btn=>{
    if(btn.id==="lessonsBtn")return;
    btn.addEventListener("click",()=>setView(btn.getAttribute("data-view")||"practice"));
  });
  const menuBtn=$("#menuBtn");
  if(menuBtn)menuBtn.addEventListener("click",e=>{
    e.stopPropagation();
    const m=$("#headerMenu");
    if(!m)return;
    const open=m.classList.contains("hidden");
    m.classList.toggle("hidden",!open);
    menuBtn.setAttribute("aria-expanded",open?"true":"false");
  });
  document.addEventListener("click",e=>{
    const wrap=$(".menu-wrap");
    if(wrap&&!wrap.contains(e.target))closeMenu();
  });
  const menuSettings=$("#menuSettings");
  if(menuSettings)menuSettings.addEventListener("click",()=>setView("settings"));
  const themeSel=$("#optTheme");
  if(themeSel){
    themeSel.value=loadTheme();
    themeSel.addEventListener("change",()=>applyTheme(themeSel.value));
  }
  const lessonList=$("#lessonList");
  if(lessonList)lessonList.addEventListener("click",e=>{
    const card=e.target.closest?e.target.closest(".lesson-card"):null;
    if(!card)return;
    const id=card.getAttribute("data-lesson-id");
    if(id)openLesson(id);
  });
  fillLessons();
  function onSessionClick(e){
    const btn=e.target.closest?e.target.closest("button"):e.target;
    if(!btn||!btn.id)return;
    try{
      if(btn.id==="startLessonBtn"){app.startLesson();onScrambleChanged();}
      else if(btn.id==="skipPhaseBtn"){app.skipLessonPhase();onScrambleChanged();}
      else if(btn.id==="skipDrillBtn"){if(app.skipDrill)app.skipDrill();else app.skipLessonPhase();onScrambleChanged();}
      else if(btn.id==="stopSessionBtn"||btn.id==="abandonBtn"){if(app.stopSession)app.stopSession();else app.abandonLesson();onScrambleChanged();}
      else if(btn.id==="coachShowMe"){showMeCoach();}
      else if(btn.id==="coachNextCase"){
        if(app.coachNextCase){app.coachNextCase();onScrambleChanged();}
      }
      else if(btn.id==="practiseThis"||btn.id==="practiseThisCoach"){const typ=btn.getAttribute("data-drill")||"";if(app.startTargetedDrill){app.startTargetedDrill(typ,btn.getAttribute("data-why")||"");onScrambleChanged();setView("practice");}}
      else if(btn.id==="reviewMore"){moreDetail=true;setView("coach");}
      else if(btn.id==="replaySolve"||btn.id==="replaySolveCoach"){replayLastSolve(false);}
      else if((btn.id==="replayOpt"||btn.id==="replayOptCoach")){replayLastSolve(true);}
      else if(btn.id==="watchToggle"||btn.id==="tipWatchToggle"){
        const box=$(btn.id==="tipWatchToggle"?"#tipWatchBody":"#watchBody");
        if(box){
          const hide=!box.classList.contains("hidden");
          box.classList.toggle("hidden",hide);
          const frame=box.querySelector("iframe");
          if(frame&&!hide&&!frame.getAttribute("src"))frame.setAttribute("src",frame.getAttribute("data-src")||"");
        }
      }
      else if(btn.id==="markWatched"){markVideoWatched(btn.getAttribute("data-vid")||"");render(app.get());}
      else if(btn.id==="playerClose"){stopAlgPlayer(true);}
    }catch(err){cubeDebug.lastError=String(err&&err.message||err||"session click");}
  }
  const cubeCard=$("#cubeCard");
  if(cubeCard)cubeCard.addEventListener("click",onSessionClick);
  const sessionBox=$("#sessionBox");
  if(sessionBox)sessionBox.addEventListener("click",onSessionClick);

  $("#history").addEventListener("click",e=>{
    const del=e.target.getAttribute("data-del");
    if(del){app.deleteSolve(del);return;}
    const id=e.target.getAttribute("data-id"),pen=e.target.getAttribute("data-pen");
    if(id&&pen)app.setPenalty(id,pen==="ok"?null:pen);
  });
  $("#nextBtn").addEventListener("click",()=>{app.nextAfterStop();nextScramble();});

  const pad=$("#timerPad");
  const down=e=>{e.preventDefault();app.manualDown();};
  const up=e=>{e.preventDefault();app.manualReadyCheck();app.manualUp();};
  pad.addEventListener("pointerdown",down);
  pad.addEventListener("pointerup",up);
  pad.addEventListener("pointercancel",up);
  let spaceDown=false;
  window.addEventListener("keydown",e=>{
    if(e.code!=="Space"&&e.key!==" ")return;
    if(e.repeat)return;
    if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    e.preventDefault();spaceDown=true;app.manualDown();
  });
  window.addEventListener("keyup",e=>{
    if(e.code!=="Space"&&e.key!==" ")return;
    if(!spaceDown)return;
    e.preventDefault();spaceDown=false;app.manualReadyCheck();app.manualUp();
  });
  if(!window.__ethanHoldIv){
    window.__ethanHoldIv=setInterval(()=>{try{if(app.get().hold)app.manualReadyCheck();}catch(e){}},50);
  }
  if(window.__ethanLiveTimerStarted)return;
  window.__ethanLiveTimerStarted=true;
  let liveTimerRaf=0, liveTimerIv=0;
  function tickLiveTimer(){
    try{
      if(app.tickNext)app.tickNext();
      tickAlgPlayer();
      tickMemoriseHint();
      const v=app.get();
      if(!v)return;
      const lab=$("#timerLabel");
      if(lab){
        lab.textContent=v.timerLabel||"";
        lab.classList.toggle("hidden",!v.timerLabel);
      }
      const mode=v.timerMode||(v.running?"solve":"off");
      if(mode==="solve"&&v.running){
        const t=E.formatTime(v.elapsed||0);
        const live=$("#liveTimer"); if(live)live.textContent=t;
        const timer=$("#timer"); if(timer)timer.textContent=t;
      }else if(mode==="step"){
        const t=E.formatTime(v.stepElapsed||v.elapsed||0);
        const live=$("#liveTimer"); if(live)live.textContent=t;
        const timer=$("#timer"); if(timer){timer.textContent=t;timer.className="timer ph-ready";}
      }else if(mode==="off"&&v.phase==="wait"){
        const timer=$("#timer"); if(timer)timer.textContent="0.00";
      }else if(v.phase==="inspect"||v.phase==="stopped"){
        const timer=$("#timer"); if(timer)timer.textContent=timerText(v);
        const call=$("#callout"); if(call)call.innerHTML=calloutHTML(v);
        const hint=$("#hint"); if(hint)hint.textContent=phaseHint(v);
        const live=$("#liveTimer");
        if(live&&v.phase==="stopped"){
          const rec=v.lastSolve||(v.solves&&v.solves[v.solves.length-1]);
          live.textContent=rec?E.formatTime(rec.ms,rec.penalty):E.formatTime(v.elapsed||0);
        }
        const sb=$("#sessionBanner");
        if(sb&&v.sessionProgress)sb.innerHTML=sessionBannerHTML(v);
      }
    }catch(e){
      cubeDebug.lastError=String(e&&e.message||e||"liveTimer");
    }
  }
  function loopLiveTimer(){
    tickLiveTimer();
    if(typeof requestAnimationFrame==="function"){
      liveTimerRaf=requestAnimationFrame(loopLiveTimer);
    }
  }
  /* Independent of cube events: rAF for a smooth count, 30ms interval as a fallback if rAF stalls. */
  if(typeof requestAnimationFrame==="function")liveTimerRaf=requestAnimationFrame(loopLiveTimer);
  liveTimerIv=setInterval(tickLiveTimer,30);
}


function init(){
  hookApp();
  syncTwistyApi();
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")requestFacelets();});
  window.addEventListener("focus",()=>requestFacelets());
  app.setIos(isIos());
  bind();
  setShowNet(false);
  render(app.get());
  loadCubing();
  nextScramble();
  setTimeout(()=>{try{tryAutoReconnect();}catch(e){}},400);
}

function bootCube(){
  if(needsBodyScanGate()){
    renderBodyScanGate(init);
    return;
  }
  init();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bootCube);
else bootCube();
})();
