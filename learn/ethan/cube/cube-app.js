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

let conn = null;
let unsub = null;
let fairScramble = null;
let TwistyPlayer = null;
let twisty = null;
let macResolver = null;

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
    mountTwisty();
  }catch(e){TwistyPlayer=null;}
}
async function nextScramble(alg){
  if(alg)return app.setScramble(alg);
  if(fairScramble){
    try{
      const a=await fairScramble("333");
      return app.setScramble(String(a));
    }catch(e){}
  }
  return app.setScramble(E.randomMoveScramble());
}
function mountTwisty(){
  const host=$("#twistyHost");
  if(!host||!TwistyPlayer||twisty)return;
  try{
    twisty=new TwistyPlayer({
      puzzle:"3x3x3",
      visualization:"PG3D",
      background:"none",
      hintFacelets:"none",
      controlPanel:"none",
      backView:"none",
      cameraLatitude:35,
      cameraLongitude:25,
      tempoScale:4
    });
    twisty.style.width="220px";
    twisty.style.height="220px";
    host.innerHTML="";
    host.appendChild(twisty);
    host.classList.remove("hidden");
  }catch(e){twisty=null;}
}
function twistyMove(m){
  if(!twisty)return;
  try{
    if(typeof twisty.experimentalAddAlgLeaf==="function")twisty.experimentalAddAlgLeaf(m,{cancel:false});
    else if(typeof twisty.experimentalAddMove==="function")twisty.experimentalAddMove(m);
  }catch(e){}
}
function twistyReset(facelets){
  if(!twisty)return;
  try{
    if(facelets&&typeof twisty.experimentalModel!=="undefined"){
      /* best-effort; 2D net is the source of truth if this fails */
    }
    twisty.alg="";
  }catch(e){}
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
  if(!ev||!ev.type)return;
  if(ev.type==="MOVE"){
    app.onMove({move:ev.move,localTimestamp:ev.localTimestamp,cubeTimestamp:ev.cubeTimestamp,facelets:null});
    twistyMove(ev.move);
  }else if(ev.type==="FACELETS"){
    app.onFacelets(ev.facelets);
  }else if(ev.type==="BATTERY"){
    app.setBattery(ev.batteryLevel);
  }else if(ev.type==="HARDWARE"){
    /* name already set; nothing required */
  }else if(ev.type==="DISCONNECT"){
    conn=null;app.setConnected(false);
    $("#connectBtn").textContent="Connect cube";
  }
}
async function doReset(){
  app.resetToSolved();
  twistyReset(E.SOLVED);
  if(conn){
    try{await conn.sendCubeCommand({type:"REQUEST_RESET"});}catch(e){}
    try{await conn.sendCubeCommand({type:"REQUEST_FACELETS"});}catch(e){}
  }
}

/* ---------- render ---------- */
function scrambleHTML(v){
  const moves=v.scramble||[];
  const k=v.k||0;
  const on=v.onPath!==false;
  return moves.map((m,i)=>{
    let cls="mv";
    if(v.scrambled||v.phase==="inspect"||v.phase==="ready"||v.phase==="running"||v.phase==="stopped")cls+=" done";
    else if(on&&i<k)cls+=" done";
    else if(on&&i===k)cls+=" next";
    return `<span class="${cls}">${m}</span>`;
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
  if(v.phase==="needSolved")return "Nice work! Solve the cube the rest of the way (or put it in the solved position and tap Reset to solved), then we'll start the next scramble.";
  if(v.phase==="scrambling"){
    if(v.fixup)return "Oops — turn "+v.fixup+" to get back on track.";
    if(!v.connected)return "No cube connected — scramble by hand, then hold the timer (or spacebar) to start.";
    return "Follow the scramble on your cube. I'll tick off each turn.";
  }
  if(v.phase==="inspect")return "Inspection! Look at the cube. Your first turn starts the timer."+(v.inspectLeft<3000?" Time's nearly up!":"");
  if(v.phase==="ready")return "Ready — your first turn (or let go of the timer) starts the clock.";
  if(v.phase==="running"){
    if(v.kind==="drill"&&v.session&&v.session.drillStage)return "Go! Stop when you finish "+(E.STAGE_KID[v.session.drillStage]||"this stage")+".";
    return "Go! The timer stops when the cube is solved.";
  }
  if(v.phase==="stopped"){
    const rec=v.solves[v.solves.length-1];
    const msg=v.celebration==="pb"?"🎉 New personal best! "+(rec?E.formatTime(rec.ms,rec.penalty):"") : (rec?E.formatTime(rec.ms,rec.penalty)+" — nice solve!":"Done!");
    return msg;
  }
  return v.connected?"Connected and ready.":"Connect Ethan's GAN 356 i3, or use the timer by itself.";
}
function sessionHTML(v){
  const s=v.session;
  if(!s){
    return `<div class="hero-copy"><h2>Today's cube session</h2>
      <p>About 10–15 minutes: a short warm-up, a practice drill, then 5 timed solves for an average of 5.</p></div>
      <button class="btn big" id="startLessonBtn" type="button">Start today's session</button>`;
  }
  if(s.finished&&s.summary){
    const sum=s.summary;
    return `<div class="hero-copy"><h2>Session done — well done!</h2>
      <p>${sum.n||0} solves · ao5 ${sum.ao5&&sum.ao5.text||"—"}${sum.pb?` · PB ${sum.pb.text}`:""}${sum.weak?` · Keep practising ${sum.weak.kid}`:""}</p>
      <p class="stars-line">${"★".repeat(sum.stars||0)}${"☆".repeat(Math.max(0,3-(sum.stars||0)))} ${sum.stars||0} star${sum.stars===1?"":"s"} today</p></div>
      <button class="btn ghost" id="startLessonBtn" type="button">Do another session</button>`;
  }
  const label={warmup:"Warm-up",drill:"Practice drill",ao5:"Average of 5"}[s.phase]||s.phase;
  let detail="";
  if(s.phase==="warmup")detail=`Warm-up solve ${(s.warmup||[]).length+1} of 3. Just get comfortable — no pressure!`;
  else if(s.phase==="drill")detail=`Let's practise ${E.STAGE_KID[s.drillStage]||"your slower stage"}. The timer stops when that part is done. Drill ${(s.drill||[]).length+1} of 3.`;
  else if(s.phase==="ao5")detail=`Timed solve ${(s.ao5||[]).length+1} of 5. These count for your average of 5.`;
  return `<div class="hero-copy"><h2>Today's cube session · ${label}</h2><p>${detail}</p></div>
    <div class="row-gap"><button class="btn ghost" id="skipPhaseBtn" type="button">Skip this part</button>
    <button class="btn ghost danger" id="abandonBtn" type="button">Stop session</button></div>`;
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

  $("#cubeNet").innerHTML=v.svg||E.svgNet(v.facelets,260);
  $("#scramble").innerHTML=scrambleHTML(v);
  const fix=$("#fixup");
  if(v.fixup&&v.phase==="scrambling"){fix.innerHTML=`<strong>Fix-up:</strong> turn <span class="mv fix">${v.fixup}</span>`;show(fix,true);}
  else show(fix,false);

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
  $("#sessionBox").innerHTML=sessionHTML(v);

  const insp=$("#optInspect");if(insp)insp.checked=v.settings.inspect!==false;
  const mode=$("#optMode");if(mode)mode.value=v.settings.splitsMode||"lbl";
  setText("#savedMac",v.settings.mac||"not saved yet");

  const cele=$("#cele");
  show(cele,v.celebration==="pb");
  if(v.celebration==="pb")setText("#celeText","New personal best! "+(st.pb?st.pb.text:""));
}

app.on(render);

function bind(){
  $("#connectBtn").addEventListener("click",()=>{if(app.get().connected)disconnectCube();else connectCube();});
  $("#resetBtn").addEventListener("click",doReset);
  $("#newScrambleBtn").addEventListener("click",()=>nextScramble());
  $("#helpToggle").addEventListener("click",()=>$("#helpPanel").classList.toggle("hidden"));
  $("#grownToggle").addEventListener("click",()=>$("#grownPanel").classList.toggle("hidden"));
  $("#macSave").addEventListener("click",()=>closeMacModal($("#macInput").value));
  $("#macCancel").addEventListener("click",()=>closeMacModal(null));
  $("#macInput").addEventListener("keydown",e=>{if(e.key==="Enter")closeMacModal($("#macInput").value);if(e.key==="Escape")closeMacModal(null);});
  $("#macClear").addEventListener("click",()=>{app.setMac("");setText("#savedMac","not saved yet");});
  $("#optInspect").addEventListener("change",e=>app.setSetting("inspect",e.target.checked));
  $("#optMode").addEventListener("change",e=>app.setSetting("splitsMode",e.target.value));
  $("#sessionBox").addEventListener("click",e=>{
    if(e.target.id==="startLessonBtn"){app.startLesson();nextScramble();}
    if(e.target.id==="skipPhaseBtn"){app.skipLessonPhase();nextScramble();}
    if(e.target.id==="abandonBtn")app.abandonLesson();
  });
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
  setInterval(()=>{if(app.get().hold)app.manualReadyCheck();},50);
  setInterval(()=>{const v=app.get();if(v.phase==="running"||v.phase==="inspect")render(v);},50);
}

function init(){
  app.setIos(isIos());
  bind();
  render(app.get());
  loadCubing();
  nextScramble();
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();
