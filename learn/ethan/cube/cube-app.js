/* Ethan's speedcubing page – UI, GAN 356 i3 connection, cubing.js extras */
(function(){
"use strict";
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const E = window.CubeEngine;
const app = E.createApp();
window.CUBE = app;

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
let matchMode = ""; /* "" | "ask" | "help" | "done" */
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
  const ver=(document.querySelector("#buildVer")||{}).textContent||"v10 · 18 Nov";
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
    evs||"(none yet)"
  ].join("\n");
}
function setShowDebug(on){
  showDebug=!!on;
  const box=$("#cubeDebug");
  const cb=$("#optShowDebug");
  const btn=$("#debugBtn");
  if(cb)cb.checked=showDebug;
  if(btn){
    btn.setAttribute("aria-pressed",showDebug?"true":"false");
    btn.classList.toggle("on",showDebug);
  }
  if(box){
    box.classList.toggle("hidden",!showDebug);
    if(showDebug){
      box.textContent=debugText(app.get());
      try{box.scrollIntoView({block:"nearest",inline:"nearest"});}catch(e){}
    }
  }
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
      E.setSolveFromTo(solveFromToSearch);
      solveReady=true;
      cubeDebug.searchStatus="loaded";
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
async function setupFromFacelets(f,state){
  f=f||(app.get()&&app.get().facelets)||E.SOLVED;
  if(!f||f.length!==54)return;
  const token=++setupToken;
  try{
    if(E.isSolved(f)){
      clearSetupTransformation();
      faceletsAnchor=E.SOLVED;snapSetup("");
      twistyLog.faceletsSynced=true;
      cubeDebug.setupMethod="solved";
      return;
    }
    if(setSetupTransformation(f,state))return;
    const short=E.solveFromToSync(f,E.SOLVED,4);
    if(short){
      faceletsAnchor=E.SOLVED;
      snapSetup(E.fmtAlg(E.invertAlg(short)));
      twistyLog.faceletsSynced=expectedFacelets()===f;
      cubeDebug.setupMethod="short BFS setupAlg";
      return;
    }
    if(!searchSolve||!kpuzzle||!KPatternCls){
      cubeDebug.setupMethod="pending (no pattern API, search not ready)";
      return;
    }
    const alg=await searchSolve(patternFromFacelets(f));
    if(token!==setupToken)return;
    let setup="";
    if(alg&&typeof alg.invert==="function")setup=String(alg.invert());
    else if(alg)setup=E.fmtAlg(E.invertAlg(String(alg)));
    faceletsAnchor=E.SOLVED;
    snapSetup(setup);
    twistyLog.faceletsSynced=expectedFacelets()===f;
    cubeDebug.setupMethod="cubing.js search setupAlg";
  }catch(e){
    const msg=String(e&&e.message||e||"setup from facelets failed");
    twistyLog.lastError=msg;cubeDebug.lastError=msg;
    cubeDebug.setupMethod="failed: "+msg;
  }
}
async function requestFacelets(){
  if(!conn||typeof conn.sendCubeCommand!=="function")return;
  cubeDebug.faceletsRequestedAt=Date.now();
  pushDebug({type:"COMMAND",command:"REQUEST_FACELETS",at:cubeDebug.faceletsRequestedAt});
  try{await conn.sendCubeCommand({type:"REQUEST_FACELETS"});}catch(e){cubeDebug.lastError=String(e&&e.message||e||"REQUEST_FACELETS failed");}
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
      if(m)liveMove(m);
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
      if(face&&face.length===54&&face!==expectedFacelets())setupFromFacelets(face,st);
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
  window.CUBE_UI={remountTwisty,snapSetup,liveMove,mountTwisty,getPlayer:()=>twisty,setShowNet:setShowNet,setupFromFacelets,requestFacelets,expectedFacelets:()=>expectedFacelets(),debug:()=>cubeDebug,setShowDebug:setShowDebug,feedGanEvent:onGanEvent,getMatchMode:()=>matchMode,setMatchMode:m=>{matchMode=m||"";render(app.get());}};
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
  try{return await import(GAN_MODS);}
  catch(e){return await import(GAN_MODS_FALLBACK);}
}

async function connectCube(){
  if(isIos()||!hasWebBluetooth()){
    app.setError("This browser can't talk to the smart cube. Use Chrome on a computer or Android.");
    return;
  }
  const btn=$("#connectBtn");
  btn.disabled=true;btn.textContent="Looking for the cube…";
  app.setError("");
  try{
    const gan=await loadGan();
    const connectGanCube=gan.connectGanCube;
    conn=await connectGanCube(macProvider);
    if(unsub&&typeof unsub.unsubscribe==="function")try{unsub.unsubscribe();}catch(e){}
    const name=conn.deviceName||"GAN cube";
    const mac=E.validMac(conn.deviceMAC);
    if(mac)app.setMac(mac);
    app.setConnected(true,{name,mac:mac||"",battery:null});
    cubeDebug.protocol=guessProtocol(name)||"Gen2";
    cubeDebug.hardwareName=name;
    cubeDebug.faceletsReply=false;
    matchMode="ask";
    unsub=conn.events$.subscribe(onGanEvent);
    try{await conn.sendCubeCommand({type:"REQUEST_FACELETS"});}catch(e){}
    try{await conn.sendCubeCommand({type:"REQUEST_BATTERY"});}catch(e){}
    try{await conn.sendCubeCommand({type:"REQUEST_HARDWARE"});}catch(e){}
    btn.textContent="Connected";
  }catch(e){
    const msg=String(e&&e.message||e||"");
    if(/User cancelled|NotFoundError|cancel/i.test(msg))app.setError("");
    else if(/MAC/i.test(msg))app.setError("The GAN 356 i3 needs its MAC address before it can talk to Chrome. Ask a grown-up — the steps are in “How to connect”.");
    else app.setError("Couldn't connect this time. Make sure the cube is awake (give it a turn), then try again in Chrome.");
    app.setConnected(false);
    btn.textContent="Connect cube";
  }
  btn.disabled=false;
  render(app.get());
}
async function disconnectCube(){
  try{if(conn&&conn.disconnect)await conn.disconnect();}catch(e){}
  conn=null;app.setConnected(false);
  $("#connectBtn").textContent="Connect cube";
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
      app.onFacelets(ev.facelets,ev.state,ev.serial);
      let matchChanged=false;
      if(!matchMode&&app.get()&&app.get().connected){matchMode="ask";matchChanged=true;}
      if(matchMode==="help"&&ev.facelets&&ev.facelets===E.SOLVED){matchMode="done";matchChanged=true;}
      if(matchChanged)render(app.get());
    }else if(ev.type==="BATTERY"){
      app.setBattery(ev.batteryLevel);
    }else if(ev.type==="HARDWARE"){
      cubeDebug.hardwareName=ev.hardwareName||cubeDebug.hardwareName;
      if(!cubeDebug.protocol)cubeDebug.protocol=guessProtocol(ev.hardwareName||(app.get()&&app.get().deviceName));
    }else if(ev.type==="DISCONNECT"){
      conn=null;app.setConnected(false);
      $("#connectBtn").textContent="Connect cube";
    }
  }catch(e){
    cubeDebug.lastError=String(e&&e.message||e||"onGanEvent");
  }
}
async function doReset(){
  app.resetToSolved();
  if(conn){
    try{await conn.sendCubeCommand({type:"REQUEST_RESET"});}catch(e){}
    try{await conn.sendCubeCommand({type:"REQUEST_FACELETS"});}catch(e){}
  }
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
function calloutHTML(v){
  if(v.phase==="running"){
    return `<div class="live-timer" id="liveTimer">${E.formatTime(v.elapsed||0)}</div><p class="callout-sub">Go! The timer stops when the cube is solved.</p>`;
  }
  if(v.phase==="stopped"){
    const rec=v.lastSolve||(v.solves&&v.solves[v.solves.length-1]);
    const t=rec?E.formatTime(rec.ms,rec.penalty):E.formatTime(v.elapsed||0);
    const sec=Math.ceil((v.nextIn||0)/1000);
    const next=sec>0?`<p class="callout-sub">Next scramble in ${sec}…</p>`:`<p class="callout-sub">Loading the next scramble…</p>`;
    return `<div class="callout done">Solved!</div><div class="live-timer done" id="liveTimer">${t}</div>${splitsLine(v)}${next}`;
  }
  if(v.phase==="inspect"){
    const s=Math.ceil((v.inspectLeft||0)/1000);
    return `<div class="callout next">Scrambled! Inspection ${s>0?s:0}</div><p class="callout-sub">Look at the cube. Your first turn starts the timer.</p>`;
  }
  if(v.phase==="ready"){
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
function scrambleHTML(v){
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
  return E.formatTime(v.elapsed||0);
}
function phaseHint(v){
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
    const msg=v.celebration==="pb"?"🎉 New personal best! "+t : (t?t+" — nice solve!":"Done!");
    return msg+(sec>0?" Next scramble in "+sec+"…":"");
  }
  if(v.celebration==="pb"&&v.phase==="scrambling"){
    const rec=v.solves[v.solves.length-1];
    return "🎉 New personal best! "+(rec?E.formatTime(rec.ms,rec.penalty)+" — ":"")+"Here's the next scramble.";
  }
  return v.connected?"Connected and ready.":"Connect Ethan's GAN 356 i3, or use the timer by itself.";
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
function sessionHTML(v){
  /* Session lives in the main banner above the scramble. Keep this slot empty so we don't show a disconnected widget. */
  return "";
}
function splitsHTML(v){
  const mode=v.settings.splitsMode||"lbl";
  const ids=E.stagesFor(mode);
  const run=v.run&&v.run.splits||{};
  const best=v.stats.bestSplits||{};
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
  const w=320,h=90,pad=8;
  const ys=pts.map(p=>p.ms),min=Math.min(...ys),max=Math.max(...ys),span=Math.max(1,max-min);
  const x=i=>pad+i*(w-2*pad)/Math.max(1,(trend.length-1));
  const y=ms=>h-pad-((ms-min)/span)*(h-2*pad);
  const d=pts.map((p,k)=>(k?"L":"M")+x(p.i).toFixed(1)+","+y(p.ms).toFixed(1)).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" class="chart" aria-label="Solve time trend">${d?`<path d="${d}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>`:""}${pts.map(p=>`<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.ms).toFixed(1)}" r="3.5" fill="#16a34a"/>`).join("")}</svg>`;
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

function render(v){
  document.body.classList.toggle("connected",!!v.connected);
  document.body.classList.toggle("ios",!!v.ios);
  document.body.classList.toggle("pb",v.celebration==="pb");
  show($("#iosNote"),!!v.ios);
  show($("#btNote"),!v.ios&&!hasWebBluetooth());
  const batt=$("#battery");
  if(v.connected){
    setText("#connStatus",(v.deviceName||"GAN 356 i3")+(v.deviceMAC?" · "+v.deviceMAC:""));
    show(batt,v.battery!=null);
    if(v.battery!=null){batt.textContent="🔋 "+v.battery+"%";batt.classList.toggle("low",v.battery<20);}
    $("#connectBtn").textContent="Disconnect";
  }else{
    setText("#connStatus",v.ios?"Timer-only on this iPhone/iPad":"Not connected — timer still works");
    show(batt,false);
    $("#connectBtn").textContent="Connect cube";
  }
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
    scr.classList.toggle("locked",!!v.locked);
  }
  const startSol=$("#startSolveBtn");
  if(startSol)startSol.classList.toggle("hidden",v.phase!=="scrambling");
  const fix=$("#fixup");
  if(fix)show(fix,false);

  const timer=$("#timer");
  timer.textContent=timerText(v);
  timer.className="timer ph-"+v.phase+(v.hold&&v.hold.ready?" ready":"");
  setText("#hint",phaseHint(v));
  $("#splits").innerHTML=splitsHTML(v);

  const st=v.stats||{};
  setText("#statPb",st.pb?st.pb.text:"—");
  setText("#statAo5",st.ao5?st.ao5.text:"—");
  setText("#statAo12",st.ao12?st.ao12.text:"—");
  setText("#statStreak",(st.streak||0)+" day"+(st.streak===1?"":"s"));
  setText("#statStars","★ "+(st.stars||0));
  $("#chart").innerHTML=chartSVG(st.trend);
  const bs=st.bestSplits||{};
  $("#bestSplits").innerHTML=E.stagesFor(v.settings.splitsMode).map(id=>`<li><b>${E.STAGE_LABEL[id]}</b> ${bs[id]?bs[id].text:"—"}</li>`).join("");
  $("#history").innerHTML=historyHTML(v);
  const sb=$("#sessionBanner");
  if(sb)sb.innerHTML=sessionBannerHTML(v);
  const box=$("#sessionBox");
  if(box)box.innerHTML=sessionHTML(v);


  const insp=$("#optInspect");if(insp)insp.checked=v.settings.inspect!==false;
  const mode=$("#optMode");if(mode)mode.value=v.settings.splitsMode||"lbl";
  const slen=$("#optScrambleLen");if(slen&&document.activeElement!==slen)slen.value=v.settings.scrambleLen||13;
  setText("#savedMac",v.settings.mac||"not saved yet");

  const cele=$("#cele");
  show(cele,v.celebration==="pb");
  if(v.celebration==="pb")setText("#celeText","New personal best! "+(st.pb?st.pb.text:""));
  if(showDebug){
    const dbg=$("#cubeDebug");
    if(dbg)dbg.textContent=debugText(v);
  }
  const ask=$("#matchAsk"), help=$("#matchHelp");
  if(ask)ask.classList.toggle("hidden",!(v.connected&&matchMode==="ask"));
  if(help)help.classList.toggle("hidden",!(v.connected&&matchMode==="help"));
}

function onAppView(v){
  render(v);
  if(v.faceletsGen!=null&&v.faceletsGen!==lastFaceletsGen){
    lastFaceletsGen=v.faceletsGen;
    requestFacelets();
  }
}
app.on(onAppView);

function bind(){
  $("#connectBtn").addEventListener("click",()=>{if(app.get().connected)disconnectCube();else connectCube();});
  $("#resetBtn").addEventListener("click",()=>{
    doReset();
    /* Stay on the help copy until FACELETS come back solved (confirms the i3 memory reset). */
    if(matchMode==="ask"){matchMode="help";}
    render(app.get());
  });
  const resync=$("#resyncBtn");
  if(resync)resync.addEventListener("click",()=>{requestFacelets();const v=app.get();if(v)setupFromFacelets(v.facelets);});
  $("#newScrambleBtn").addEventListener("click",()=>nextScramble());
  $("#helpToggle").addEventListener("click",()=>$("#helpPanel").classList.toggle("hidden"));
  $("#grownToggle").addEventListener("click",()=>$("#grownPanel").classList.toggle("hidden"));
  $("#macSave").addEventListener("click",()=>closeMacModal($("#macInput").value));
  $("#macCancel").addEventListener("click",()=>closeMacModal(null));
  $("#macInput").addEventListener("keydown",e=>{if(e.key==="Enter")closeMacModal($("#macInput").value);if(e.key==="Escape")closeMacModal(null);});
  $("#macClear").addEventListener("click",()=>{app.setMac("");setText("#savedMac","not saved yet");});
  $("#optInspect").addEventListener("change",e=>app.setSetting("inspect",e.target.checked));
  $("#optMode").addEventListener("change",e=>app.setSetting("splitsMode",e.target.value));
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
  const yes=$("#matchYes");
  if(yes)yes.addEventListener("click",()=>{matchMode="done";render(app.get());});
  const no=$("#matchNo");
  if(no)no.addEventListener("click",()=>{matchMode="help";render(app.get());});
  function onSessionClick(e){
    const btn=e.target.closest?e.target.closest("button"):e.target;
    if(!btn||!btn.id)return;
    try{
      if(btn.id==="startLessonBtn"){app.startLesson();onScrambleChanged();}
      else if(btn.id==="skipPhaseBtn"){app.skipLessonPhase();onScrambleChanged();}
      else if(btn.id==="skipDrillBtn"){if(app.skipDrill)app.skipDrill();else app.skipLessonPhase();onScrambleChanged();}
      else if(btn.id==="stopSessionBtn"||btn.id==="abandonBtn"){if(app.stopSession)app.stopSession();else app.abandonLesson();onScrambleChanged();}
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
  setInterval(()=>{try{if(app.get().hold)app.manualReadyCheck();}catch(e){}},50);
  let liveTimerRaf=0, liveTimerIv=0;
  function tickLiveTimer(){
    try{
      if(app.tickNext)app.tickNext();
      const v=app.get();
      if(!v)return;
      if(v.phase==="running"){
        const t=E.formatTime(v.elapsed||0);
        const live=$("#liveTimer"); if(live)live.textContent=t;
        const timer=$("#timer"); if(timer)timer.textContent=t;
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
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();
