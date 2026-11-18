(function(root){
"use strict";
const STORE="kidsHub.p.ethan.cube";
const RESULTS_SYNC_URL="https://script.google.com/macros/s/AKfycbyDh1N9JhBxdKMo5Crn7JLXuItlZaqUINTUzwS5QwZCjfmg3_D5QNybpqO2nQSre80-/exec";
const SOLVED="UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
const FACES="URFDLB";
const COL={U:"#f8fafc",R:"#dc2626",F:"#16a34a",D:"#eab308",L:"#f97316",B:"#2563eb"};
const COL_STROKE={U:"#cbd5e1",R:"#991b1b",F:"#166534",D:"#a16207",L:"#c2410c",B:"#1e3a8a"};
/* Clockwise quarter-turn cycles in Kociemba facelet order (URFDLB). Verified vs gan-web-bluetooth F R example and sexy-move x6. */
const CYCLES={
  U:[[0,2,8,6],[1,5,7,3],[9,18,36,45],[10,19,37,46],[11,20,38,47]],
  R:[[2,51,29,20],[5,48,32,23],[8,45,35,26],[9,11,17,15],[10,14,16,12]],
  F:[[6,9,29,44],[7,12,28,41],[8,15,27,38],[18,20,26,24],[19,23,25,21]],
  D:[[15,51,42,24],[16,52,43,25],[17,53,44,26],[27,29,35,33],[28,32,34,30]],
  L:[[0,18,27,53],[3,21,30,50],[6,24,33,47],[36,38,44,42],[37,41,43,39]],
  B:[[0,42,35,11],[1,39,34,14],[2,36,33,17],[45,47,53,51],[46,50,52,48]]
};
const LBL=["cross","firstLayer","secondLayer","lastLayer"];
const CFOP=["cross","f2l","oll","pll"];
const STAGE_LABEL={cross:"Cross",firstLayer:"First layer",secondLayer:"Second layer",lastLayer:"Last layer",f2l:"F2L",oll:"OLL",pll:"PLL"};
const STAGE_KID={cross:"the white cross",firstLayer:"the first layer",secondLayer:"the second layer",lastLayer:"the last layer",f2l:"the first two layers",oll:"orienting the last layer",pll:"permuting the last layer"};

function clone(s){return s;}
function isSolved(f){return f===SOLVED;}
function normalizeMove(m){
  m=String(m||"").trim().replace(/[’`′ʼ]/g,"'");
  if(!m)return "";
  const f=m[0].toUpperCase();
  if(FACES.indexOf(f)<0)return "";
  if(/2/.test(m))return f+"2";
  if(/'/.test(m))return f+"'";
  return f;
}
/* Face+direction fallback for gan-web-bluetooth (face 0-5, direction 0=CW, 1=CCW). */
function moveFromEvent(evt){
  if(typeof evt==="string")return normalizeMove(evt);
  if(!evt||typeof evt!=="object")return "";
  const direct=normalizeMove(evt.move);
  if(direct)return direct;
  let face=evt.face;
  if(typeof face==="number"&&face>=0&&face<=5)face=FACES.charAt(face);
  face=String(face||"").trim().toUpperCase();
  if(!face||FACES.indexOf(face[0])<0)return "";
  face=face[0];
  const d=evt.direction;
  if(d===2||d==="2")return face+"2";
  if(d===3||d==="3"||d===1||d==="1"||d==="'"||d==="CCW"||d==="ccw")return face+"'";
  return face;
}
function invertMove(m){
  m=normalizeMove(m);
  if(!m)return "";
  if(m[1]==="2")return m;
  return m.length===1?m+"'":m[0];
}
function parseAlg(s){
  if(Array.isArray(s))return s.map(normalizeMove).filter(Boolean);
  const out=[];String(s||"").replace(/[URFDLB](?:2'|2|'|)?/gi,m=>{const n=normalizeMove(m);if(n)out.push(n);});
  return out;
}
function fmtAlg(moves){return parseAlg(moves).join(" ");}
function applyMove(facelets,move){
  move=normalizeMove(move);
  if(!move||facelets.length!==54)return facelets;
  const f=move[0],times=move[1]==="2"?2:move[1]==="'"?3:1;
  let a=facelets.split("");
  const cyc=CYCLES[f];
  for(let t=0;t<times;t++){
    const b=a.slice();
    cyc.forEach(c=>{for(let i=0;i<c.length;i++)a[c[(i+1)%c.length]]=b[c[i]];});
  }
  return a.join("");
}
function applyAlg(facelets,alg){return parseAlg(alg).reduce(applyMove,facelets);}
function eq(a,b){return a===b;}

/* ---- stage detection: white (U) is the cross colour, in cube-fixed facelet space ---- */
function sticker(f,i){return f[i];}
function whiteCross(f){
  return f[1]==="U"&&f[3]==="U"&&f[5]==="U"&&f[7]==="U"&&f[19]==="F"&&f[10]==="R"&&f[46]==="B"&&f[37]==="L";
}
function firstLayer(f){
  if(!whiteCross(f))return false;
  if(f[0]!=="U"||f[2]!=="U"||f[6]!=="U"||f[8]!=="U")return false;
  return f[18]==="F"&&f[20]==="F"&&f[9]==="R"&&f[11]==="R"&&f[45]==="B"&&f[47]==="B"&&f[36]==="L"&&f[38]==="L";
}
function secondLayer(f){
  if(!firstLayer(f))return false;
  return f[21]==="F"&&f[23]==="F"&&f[12]==="R"&&f[14]==="R"&&f[48]==="B"&&f[50]==="B"&&f[39]==="L"&&f[41]==="L";
}
function f2lDone(f){return secondLayer(f);}
function ollDone(f){
  if(!f2lDone(f))return false;
  for(let i=27;i<=35;i++)if(f[i]!=="D")return false;
  return true;
}
function pllDone(f){return isSolved(f);}
function lastLayer(f){return isSolved(f);}
function yellowCross(f){
  return f2lDone(f)&&f[28]==="D"&&f[30]==="D"&&f[32]==="D"&&f[34]==="D";
}
function stageFlags(f){
  const cross=whiteCross(f),fl=firstLayer(f),sl=secondLayer(f);
  return {cross,firstLayer:fl,secondLayer:sl,f2l:sl,llCross:yellowCross(f),oll:ollDone(f),pll:pllDone(f),lastLayer:pllDone(f),solved:isSolved(f)};
}
function stagesFor(mode){return (mode==="cfop"?CFOP:LBL).slice();}
function reachedStages(f,mode){const flags=stageFlags(f);return stagesFor(mode).filter(id=>flags[id]);}

/* ---- scramble progress + fix-up ---- */
function scrambleTarget(scramble){return applyAlg(SOLVED,scramble);}
function prefixState(scramble,k){return applyAlg(SOLVED,parseAlg(scramble).slice(0,k));}
/* A half-turn like R2 is two quarter turns. GAN i3 (Gen2) reports those as two separate MOVE events (R then R), not one "R2". */
function invertAlg(alg){return parseAlg(alg).slice().reverse().map(invertMove);}

/* Kociemba cubies (same CP/CO/EP/EO convention as gan-web-bluetooth FACELETS.state). */
const CORNER_FACELETS=[[8,9,20],[6,18,38],[0,36,47],[2,45,11],[29,26,15],[27,44,24],[33,53,42],[35,17,51]];
const CORNER_COLORS=["URF","UFL","ULB","UBR","DFR","DLF","DBL","DRB"];
const EDGE_FACELETS=[[5,10],[7,19],[3,37],[1,46],[32,16],[28,25],[30,43],[34,52],[23,12],[21,41],[50,39],[48,14]];
const EDGE_COLORS=["UR","UF","UL","UB","DR","DF","DL","DB","FR","FL","BL","BR"];
function sortStr(s){return String(s).split("").sort().join("");}
function cubiesFromFacelets(f){
  if(!f||f.length!==54)return null;
  const cp=[],co=[],ep=[],eo=[];
  for(let i=0;i<8;i++){
    const cols=CORNER_FACELETS[i].map(x=>f[x]).join("");
    const id=CORNER_COLORS.findIndex(c=>sortStr(c)===sortStr(cols));
    const ori=cols.split("").findIndex(ch=>ch==="U"||ch==="D");
    if(id<0||ori<0)return null;
    cp.push(id);co.push(ori);
  }
  for(let i=0;i<12;i++){
    const cols=EDGE_FACELETS[i].map(x=>f[x]).join("");
    const id=EDGE_COLORS.findIndex(c=>sortStr(c)===sortStr(cols));
    if(id<0)return null;
    ep.push(id);eo.push(cols[0]===EDGE_COLORS[id][0]?0:1);
  }
  return {cp,co,ep,eo};
}
function isValidFacelets(f){return !!(f&&f.length===54&&cubiesFromFacelets(f));}
function invertCubies(c){
  const icp=Array(8),ico=Array(8),iep=Array(12),ieo=Array(12);
  for(let i=0;i<8;i++){icp[c.cp[i]]=i;ico[c.cp[i]]=(3-c.co[i])%3;}
  for(let i=0;i<12;i++){iep[c.ep[i]]=i;ieo[c.ep[i]]=c.eo[i];}
  return {cp:icp,co:ico,ep:iep,eo:ieo};
}
function mulCubies(A,B){
  const C={cp:[],co:[],ep:[],eo:[]};
  for(let i=0;i<8;i++){C.cp[i]=A.cp[B.cp[i]];C.co[i]=(A.co[B.cp[i]]+B.co[i])%3;}
  for(let i=0;i<12;i++){C.ep[i]=A.ep[B.ep[i]];C.eo[i]=(A.eo[B.ep[i]]+B.eo[i])%2;}
  return C;
}
function relativeCubies(from,to){
  const A=typeof from==="string"?cubiesFromFacelets(from):from;
  const B=typeof to==="string"?cubiesFromFacelets(to):to;
  if(!A||!B)return null;
  return mulCubies(invertCubies(A),B);
}
function cubiesEqual(a,b){
  if(!a||!b)return false;
  return a.cp.join()===b.cp.join()&&a.co.join()===b.co.join()&&a.ep.join()===b.ep.join()&&a.eo.join()===b.eo.join();
}
function faceletsFromCubies(c){
  if(!c||!c.cp||!c.ep)return null;
  const f=SOLVED.split("");
  for(let i=0;i<8;i++){
    const home=CORNER_COLORS[c.cp[i]],ori=c.co[i]||0;
    const slots=CORNER_FACELETS[i];
    for(let k=0;k<3;k++)f[slots[k]]=home[(k-ori+3)%3];
  }
  for(let i=0;i<12;i++){
    const home=EDGE_COLORS[c.ep[i]],ori=c.eo[i]?1:0;
    const slots=EDGE_FACELETS[i];
    f[slots[0]]=home[ori];
    f[slots[1]]=home[1-ori];
  }
  return f.join("");
}
function solvedCubies(){return cubiesFromFacelets(SOLVED);}

/* cubing.js 3x3 orbit order is not Kociemba/GAN order. Cubing U-corners run URF,UBR,ULB,UFL (swap Kociemba 1/3);
   U/D edges are swapped in pairs (UR/UF, UB/UL, DR/DF, DB/DL) and BR/BL are swapped; FR/FL stay. */
const C2K_CORNER=[0,3,2,1,4,5,6,7];
const C2K_EDGE=[1,0,3,2,5,4,7,6,8,9,11,10];
function cubiesToCubing(c){
  if(!c)return null;
  const cp=[],co=[],ep=[],eo=[];
  for(let i=0;i<8;i++){const k=C2K_CORNER[i];cp[i]=C2K_CORNER[c.cp[k]];co[i]=c.co[k];}
  for(let i=0;i<12;i++){const k=C2K_EDGE[i];ep[i]=C2K_EDGE[c.ep[k]];eo[i]=c.eo[k];}
  return {cp,co,ep,eo};
}


let solveFromToImpl=null;
function setSolveFromTo(fn){solveFromToImpl=typeof fn==="function"?fn:null;}
function solveFromToSync(from,to,maxDepth){
  if(!from||!to)return null;
  if(from===to)return [];
  maxDepth=maxDepth==null?4:Math.min(maxDepth,4);
  const faces=["U","R","F","D","L","B"], moves=[];
  faces.forEach(f=>{moves.push(f,f+"'",f+"2");});
  const q=[[from,[]]], seen={};seen[from]=1;
  for(let qi=0;qi<q.length;qi++){
    const st=q[qi][0],path=q[qi][1];
    if(path.length>=maxDepth)continue;
    const last=path.length?path[path.length-1][0]:"";
    for(let i=0;i<moves.length;i++){
      const m=moves[i];
      if(m[0]===last)continue;
      const n=applyMove(st,m);
      if(seen[n])continue;
      const p=path.concat(m);
      if(n===to)return p;
      seen[n]=1;q.push([n,p]);
    }
  }
  return null;
}
function solveFromTo(from,to){
  if(from===to)return Promise.resolve([]);
  const short=solveFromToSync(from,to,4);
  if(short)return Promise.resolve(short);
  if(typeof solveFromToImpl==="function"){
    return Promise.resolve(solveFromToImpl(from,to)).then(r=>{
      if(Array.isArray(r))return parseAlg(r);
      if(typeof r==="string")return parseAlg(r);
      return null;
    }).catch(()=>null);
  }
  return Promise.resolve(null);
}

function expandToQuarters(m){
  m=normalizeMove(m);
  if(!m)return [];
  if(m[1]==="2")return [m[0],m[0]];
  return [m];
}
function pathSnapshots(scramble,start){
  const moves=parseAlg(scramble);
  start=start||SOLVED;
  const snaps=[{state:start,k:0,partial:0,totalParts:moves[0]?expandToQuarters(moves[0]).length:0,current:moves[0]||null,q:0}];
  let s=start,q=0;
  moves.forEach((M,i)=>{
    const next=moves[i+1]||null;
    /* A half turn is two quarter turns in THE SAME direction: R R or R' R' (the i3 never sends "R2"). */
    if(M[1]==="2"){
      const cw=applyMove(s,M[0]),ccw=applyMove(s,M[0]+"'");
      q++;
      snaps.push({state:cw,k:i,partial:1,totalParts:2,current:M,q,dir:M[0]});
      snaps.push({state:ccw,k:i,partial:1,totalParts:2,current:M,q,dir:M[0]+"'"});
      s=applyMove(s,M);q++;
      snaps.push({state:s,k:i+1,partial:0,totalParts:next?expandToQuarters(next).length:0,current:next,q});
      return;
    }
    const qs=expandToQuarters(M);
    qs.forEach((qt,qi)=>{
      s=applyMove(s,qt);q++;
      const doneMove=qi===qs.length-1;
      snaps.push({state:s,k:doneMove?i+1:i,partial:doneMove?0:qi+1,totalParts:qs.length,current:doneMove?next:M,q});
    });
  });
  return {moves,snaps};
}
function matchSnap(snaps,facelets){
  let found=null;
  snaps.forEach(s=>{if(s.state===facelets)found=s;});
  return found;
}
function packProgress(found,moves,done,on){
  const half=!!(found&&found.partial>0);
  return {
    k:found?found.k:0,on:!!on,done:!!done,total:moves.length,moves,
    partial:found?found.partial:0,totalParts:found?found.totalParts:0,
    current:found?found.current: (moves[0]||null),
    currentScramble:found?found.current:(moves[0]||null),
    half,halfLabel:half?found.partial+"/"+found.totalParts:""
  };
}
function progressOnPath(facelets,scramble,start){
  const {moves,snaps}=pathSnapshots(scramble,start);
  const target=snaps[snaps.length-1].state;
  const done=eq(facelets,target);
  const found=matchSnap(snaps,facelets);
  return packProgress(found,moves,done,!!found);
}
function combineMoves(a,b){
  a=normalizeMove(a);b=normalizeMove(b);
  if(!a)return b;if(!b)return a;
  if(a[0]!==b[0])return null;
  const tw=m=>m[1]==="2"?2:m[1]==="'"?3:1;
  const n=(tw(a)+tw(b))%4;
  return n===0?"":n===1?a[0]:n===2?a[0]+"2":a[0]+"'";
}
function moveTurns(m){
  m=normalizeMove(m);
  if(!m)return 0;
  return m[1]==="2"?2:m[1]==="'"?3:1;
}
function moveFromTurns(face,n){
  n=((n%4)+4)%4;
  return n===0?"":n===1?face:n===2?face+"2":face+"'";
}
/* Cancel adjacent same-face turns and merge into ', 2, or a single quarter. */
function simplifyAlg(alg){
  const out=[];
  parseAlg(alg).forEach(m=>{
    if(!out.length){out.push(m);return;}
    const a=out[out.length-1];
    if(a[0]!==m[0]){out.push(m);return;}
    const c=moveFromTurns(a[0],moveTurns(a)+moveTurns(m));
    out.pop();
    if(c)out.push(c);
  });
  return out;
}
function remainingFromSnap(found,moves){
  moves=parseAlg(moves);
  if(!found)return moves.slice();
  const rest=moves.slice(found.k);
  if(found.partial>0&&rest[0]&&rest[0][1]==="2"){
    const fin=normalizeMove(found.dir||rest[0][0]);
    return (fin?[fin]:[]).concat(rest.slice(1));
  }
  return rest.slice();
}

function buildStepTable(scramble,start){
  const moves=parseAlg(scramble);
  start=start||SOLVED;
  const steps=[];
  let s=start;
  for(let k=0;k<moves.length;k++){
    const M=moves[k];
    const rec={k,move:M,before:s,done:applyMove(s,M),cw:null,ccw:null};
    if(M[1]==="2"){rec.cw=applyMove(s,M[0]);rec.ccw=applyMove(s,M[0]+"'");}
    steps.push(rec);
    s=rec.done;
  }
  return {moves,steps,start,end:s};
}
function hitStep(f,rec){
  if(!rec||!f)return null;
  if(eq(f,rec.before))return {kind:"before",k:rec.k,partial:0,dir:"",move:rec.move};
  if(rec.cw&&eq(f,rec.cw))return {kind:"mid",k:rec.k,partial:1,dir:rec.move[0],move:rec.move};
  if(rec.ccw&&eq(f,rec.ccw))return {kind:"mid",k:rec.k,partial:1,dir:rec.move[0]+"'",move:rec.move};
  if(eq(f,rec.done))return {kind:"done",k:rec.k,partial:0,dir:"",move:rec.move};
  return null;
}
/* State-based classify: current step, a one-step window forward, and stale previous-step mids. */
function classifyState(f,table,k){
  if(!f||!table)return {ok:false,kind:"off",k:k||0,partial:0,dir:"",stale:false,doneAll:false};
  const steps=table.steps||[];
  k=Math.max(0,Math.min(k||0,steps.length));
  if(eq(f,table.end)){
    return {ok:true,kind:"doneAll",k:steps.length,partial:0,dir:"",stale:false,doneAll:true,move:null};
  }
  if(k>=steps.length){
    return {ok:false,kind:"off",k:steps.length,partial:0,dir:"",stale:false,doneAll:false};
  }
  const cur=hitStep(f,steps[k]);
  if(cur){
    if(cur.kind==="done"){
      const nk=k+1;
      if(nk>=steps.length)return {ok:true,kind:"doneAll",k:nk,partial:0,dir:"",stale:false,doneAll:true,move:null};
      return {ok:true,kind:"before",k:nk,partial:0,dir:"",stale:false,doneAll:false,move:steps[nk].move};
    }
    return Object.assign({ok:true,stale:false,doneAll:false},cur);
  }
  if(k+1<steps.length){
    const nxt=hitStep(f,steps[k+1]);
    if(nxt){
      if(nxt.kind==="done"){
        const nk=k+2;
        if(nk>=steps.length)return {ok:true,kind:"doneAll",k:nk,partial:0,dir:"",stale:false,doneAll:true,move:null};
        return {ok:true,kind:"before",k:nk,partial:0,dir:"",stale:false,doneAll:false,move:steps[nk].move};
      }
      return Object.assign({ok:true,stale:false,doneAll:false},nxt);
    }
  }
  if(k>0){
    const prev=hitStep(f,steps[k-1]);
    if(prev&&prev.kind!=="done"){
      return {ok:true,kind:"stale",k:k,partial:0,dir:"",stale:true,doneAll:false,move:steps[k].move};
    }
  }
  return {ok:false,kind:"off",k:k,partial:0,dir:"",stale:false,doneAll:false,move:steps[k]?steps[k].move:null};
}

function createTracker(scramble,start,targetState){
  start=start||SOLVED;
  let table=buildStepTable(scramble,start);
  let {moves,steps}=table;
  let target=targetState||table.end;
  let state=start,k=0,lastMove="",fixup="",confirmedOff=false,offPending=false;
  let lastOn={state:start,k:0,partial:0,totalParts:moves[0]&&moves[0][1]==="2"?2:1,current:moves[0]||null,q:0,dir:"",midSource:""};
  let midSource="";
  let lastFaceletsSerial=null;
  let tentative=null;
  let judged=classifyState(state,table,0);

  function snapshot(){
    const hit=judged;
    const done=!!(hit&&hit.doneAll)||eq(state,target)||k>=moves.length;
    const cur=done?null:((hit&&hit.ok&&hit.move)||moves[k]||null);
    const half=!!(hit&&hit.ok&&hit.kind==="mid");
    const on=!done&&!confirmedOff&&!!(hit&&hit.ok);
    return {
      k:done?moves.length:(hit&&hit.ok?hit.k:k),
      on,done,total:moves.length,moves,
      partial:half?1:0,totalParts:cur&&cur[1]==="2"?2:1,
      current:cur,currentScramble:cur,
      half,halfLabel:half?"1/2":"",
      state,target,fixup:(done||!confirmedOff)?"":fixup,
      lastMove,dir:(hit&&hit.dir)||"",
      midSource,offPending:!!offPending&&!done&&!confirmedOff,
      judgedKind:(hit&&hit.kind)||"off",
      stale:!!(hit&&hit.stale),
      confirmedOff:!!confirmedOff&&!done
    };
  }
  function adopt(hit,newState,src){
    if(hit&&hit.stale)return snapshot();
    if(newState)state=newState;
    if(!hit||!hit.ok){
      offPending=true;
      judged=hit||{ok:false,kind:"off",k:k,partial:0,dir:"",stale:false,doneAll:false};
      return snapshot();
    }
    offPending=false;confirmedOff=false;fixup="";
    judged=hit;
    if(hit.doneAll){
      k=moves.length;
      lastOn={state:state,k:moves.length,partial:0,totalParts:0,current:null,q:0,dir:"",midSource:""};
      midSource="";
      return snapshot();
    }
    k=hit.k;
    midSource=src||midSource||"";
    lastOn={state:state,k:hit.k,partial:hit.kind==="mid"?1:0,totalParts:hit.move&&hit.move[1]==="2"?2:1,current:hit.move||moves[k]||null,q:0,dir:hit.dir||"",midSource:midSource};
    return snapshot();
  }
  function apply(m,opts){
    opts=opts||{};
    m=normalizeMove(m);
    if(!m)return snapshot();
    lastMove=m;
    if(opts.serial!=null&&lastFaceletsSerial!=null&&opts.serial===lastFaceletsSerial){
      midSource=midSource==="facelets"?"both":midSource;
      if(lastOn)lastOn=Object.assign({},lastOn,{midSource:midSource});
      return snapshot();
    }
    /* If a previous MOVE was unverified, keep applying to that live model so
       a quick undo (F then F') can return to an acceptable state without a red flash. */
    const from=(offPending&&tentative)?tentative:state;
    const next=applyMove(from,m);
    const hit=classifyState(next,table,k);
    if(hit.ok){tentative=null;return adopt(hit,next,opts.source||"move");}
    /* MOVE did not land on an acceptable state (wrong face letter, race, typo).
       Keep the last confirmed highlight; remember a tentative state in case no
       FACELETS arrive to correct it. Never confirm a red error here. */
    tentative=next;
    offPending=true;
    return snapshot();
  }
  function setState(f,opts){
    opts=opts||{};
    if(!f||f.length!==54)return snapshot();
    if(opts.serial!=null)lastFaceletsSerial=opts.serial;
    const hit=classifyState(f,table,k);
    if(hit.stale)return snapshot();
    if(hit.ok){tentative=null;return adopt(hit,f,opts.source||"facelets");}
    state=f;
    tentative=null;
    offPending=true;
    confirmedOff=false;
    judged=hit;
    return snapshot();
  }
  function confirmOff(){
    const cand=(!judged||judged.ok)?(tentative||state):state;
    const hit=classifyState(cand,table,k);
    if(hit.ok&&!hit.stale){tentative=null;return adopt(hit,cand,midSource);}
    if(hit.stale){offPending=false;tentative=null;return snapshot();}
    if(cand)state=cand;
    tentative=null;
    offPending=false;
    confirmedOff=true;
    fixup=invertMove(lastMove)||(moves[k]?invertMove(moves[k][1]==="2"?moves[k][0]:moves[k]):"")||"";
    judged=hit;
    return snapshot();
  }
  function clearOff(){
    offPending=false;confirmedOff=false;fixup="";tentative=null;
    return snapshot();
  }
  function reset(){
    state=start;k=0;lastMove="";fixup="";confirmedOff=false;offPending=false;midSource="";lastFaceletsSerial=null;tentative=null;
    lastOn={state:start,k:0,partial:0,totalParts:moves[0]&&moves[0][1]==="2"?2:1,current:moves[0]||null,q:0,dir:"",midSource:""};
    judged=classifyState(state,table,0);
    return snapshot();
  }
  function repath(current,remaining,asFixup){
    remaining=parseAlg(remaining);
    if(current&&current.length===54)state=current;
    table=buildStepTable(remaining,state);
    moves=table.moves;steps=table.steps;
    if(!targetState)target=table.end;
    lastMove="";midSource="";lastFaceletsSerial=null;k=0;
    const hit=classifyState(state,table,0);
    if(hit.ok)return adopt(hit,state,"");
    if(asFixup&&moves[0]){
      confirmedOff=true;offPending=false;fixup=moves[0];
      judged={ok:false,kind:"off",k:0,partial:0,dir:"",stale:false,doneAll:false,move:moves[0]};
      lastOn={state:state,k:0,partial:0,totalParts:moves[0][1]==="2"?2:1,current:moves[0],q:0,dir:"",midSource:""};
      return snapshot();
    }
    confirmedOff=false;offPending=true;fixup="";
    judged=hit;
    return snapshot();
  }
  function setTarget(t){if(t&&t.length===54)target=t;return snapshot();}
  function remaining(){
    const cur=snapshot();
    if(cur.done)return [];
    const rest=moves.slice(cur.k);
    if(cur.half&&cur.current)return [cur.current].concat(rest.slice(1));
    return rest;
  }
  function judge(f){return classifyState(f||state,table,k);}
  return {apply,setState,reset,repath,setTarget,remaining,get:snapshot,judge,confirmOff,clearOff,
    get target(){return target;},get moves(){return moves;},get lastOn(){return lastOn;},
    get offPending(){return offPending;}};
}


/* ---- timing helpers ---- */

function formatTime(ms,pen){
  if(pen==="DNF"||ms==null||!isFinite(ms))return "DNF";
  const official=pen==="+2"?ms+2000:ms;
  const neg=official<0,a=Math.abs(Math.round(official));
  const m=Math.floor(a/60000),s=Math.floor((a%60000)/1000),cs=Math.floor((a%1000)/10);
  const core=m>0?m+":"+String(s).padStart(2,"0")+"."+String(cs).padStart(2,"0"):s+"."+String(cs).padStart(2,"0");
  return (neg?"-":"")+core+(pen==="+2"?"+":"");
}
function officialMs(sol){
  if(!sol||sol.penalty==="DNF")return Infinity;
  return (sol.ms||0)+(sol.penalty==="+2"?2000:0);
}
function averageOf(n,solves){
  const slice=solves.filter(s=>s&&s.kind!=="drill").slice(-n);
  if(slice.length<n)return null;
  const vals=slice.map(officialMs);
  const dnf=vals.filter(v=>!isFinite(v)).length;
  if(dnf>1)return {ms:Infinity,dnf:true,text:"DNF"};
  const sorted=vals.slice().sort((a,b)=>a-b);
  const mid=sorted.slice(1,-1);
  if(mid.some(v=>!isFinite(v)))return {ms:Infinity,dnf:true,text:"DNF"};
  const avg=mid.reduce((a,b)=>a+b,0)/mid.length;
  return {ms:avg,dnf:false,text:formatTime(avg)};
}
function bestSingle(solves){
  let best=null;
  solves.forEach(s=>{
    if(s.kind==="drill")return;
    const v=officialMs(s);
    if(!isFinite(v))return;
    if(best==null||v<best.ms)best={ms:v,sol:s,text:formatTime(v)};
  });
  return best;
}
function bestSplits(solves,mode){
  const ids=stagesFor(mode||"lbl"),out={};
  ids.forEach(id=>{
    let best=null;
    solves.forEach(s=>{
      if(!s.splits||!s.splits[id]||s.penalty==="DNF")return;
      const at=s.splits[id].at,prev=prevStageAt(s.splits,ids,id);
      const seg=at-(prev||0);
      if(best==null||seg<best.seg)best={seg,at,moves:s.splits[id].moves,text:formatTime(seg)};
    });
    if(best)out[id]=best;
  });
  return out;
}
function prevStageAt(splits,ids,id){
  const i=ids.indexOf(id);
  if(i<=0)return 0;
  for(let k=i-1;k>=0;k--)if(splits[ids[k]])return splits[ids[k]].at;
  return 0;
}
function splitSegments(splits,mode){
  const ids=stagesFor(mode||"lbl"),out={};
  ids.forEach(id=>{
    if(!splits||!splits[id])return;
    const prev=prevStageAt(splits,ids,id);
    out[id]={at:splits[id].at,moves:splits[id].moves,seg:splits[id].at-prev};
  });
  return out;
}
function weakestStage(solves,mode){
  const ids=stagesFor(mode||"lbl"),acc={};
  ids.forEach(id=>acc[id]={n:0,t:0});
  solves.forEach(s=>{
    if(!s.splits||s.penalty==="DNF"||s.kind==="drill")return;
    const segs=splitSegments(s.splits,s.method||mode);
    ids.forEach(id=>{if(segs[id]){acc[id].n++;acc[id].t+=segs[id].seg;}});
  });
  let weak=ids[0],worst=-1;
  ids.forEach(id=>{if(acc[id].n&&acc[id].t/acc[id].n>worst){worst=acc[id].t/acc[id].n;weak=id;}});
  return {id:weak,avg:worst>=0?worst:null,label:STAGE_LABEL[weak],kid:STAGE_KID[weak],counts:acc};
}
const DRILL_REPS=5;
const DRILL_LABEL={cross:"cross",crossPlan:"plan the cross",f2l:"first two layers",lastLayer:"last layer",lookahead:"look ahead",metronome:"look ahead",fingerTricks:"finger tricks"};
const DRILL_MOVES={cross:8,f2l:20,lastLayer:15};
function drillBucket(id){
  if(id==="cross"||id==="crossPlan")return id;
  if(id==="lookahead"||id==="metronome"||id==="fingerTricks")return id;
  if(id==="firstLayer"||id==="secondLayer")return "f2l";
  if(id==="f2l")return "f2l";
  return "lastLayer";
}
function pickDrillStage(solves,mode){
  const recs=(solves||[]).filter(s=>s&&s.analysis);
  if(recs.length){
    const last=recs[recs.length-1];
    if(last.analysis&&last.analysis.weakness&&last.analysis.weakness.type)return last.analysis.weakness.type;
  }
  const w=weakestStage(solves,mode);
  return drillBucket(w&&w.id);
}
function drillGoalReached(f,stage){
  const flags=stageFlags(f||SOLVED);
  const raw=stage;
  stage=drillBucket(stage);
  if(raw==="crossPlan"||stage==="cross"||stage==="crossPlan")return !!flags.cross;
  if(stage==="f2l"||stage==="lookahead"||stage==="metronome")return !!flags.f2l;
  if(stage==="fingerTricks")return !!(flags.solved||flags.lastLayer);
  return !!(flags.solved||flags.lastLayer);
}
function drillExplain(stage,reason){
  const raw=stage;
  stage=drillBucket(stage);
  const why=reason?(" "+reason):"";
  if(raw==="crossPlan"||stage==="crossPlan")return "Drill: plan the cross in inspection. You get 15 seconds to look. Then I'll hide the 3D cube and you do the white cross from memory. Aim for a short path."+why+" 5 reps.";
  if(stage==="cross")return "Drill: white cross. I'll watch the cube and give you a tip. Make the white cross on top, lined up with the side centres."+why+" 5 reps.";
  if(stage==="lookahead"||stage==="metronome")return "Drill: look ahead (slow turning). Turn steadily with the metronome and try not to pause. Watch the next pair while you finish this one."+why+" 5 reps.";
  if(stage==="fingerTricks")return "Drill: clean turning and finger tricks. Use the algorithm player, then do the moves smoothly with no cancelled turns."+why+" 5 reps.";
  if(stage==="f2l")return "Drill: first two layers. After the scramble, put each white corner with its matching edge into the right slot. I'll tell you when the first two layers are done."+why+" 5 reps.";
  return "Drill: last layer. Scramble (first two layers stay solved), then I'll coach you step by step through the last layer."+why+" 5 reps.";
}
/* Rotate the cube 180° around the R–L axis so we can reuse standard U-layer last-layer algs, then flip back (our cross lives on U, last layer on D). */
function faceletsX2(f){
  if(!f||f.length!==54)return f;
  const rot=x=>x[8]+x[7]+x[6]+x[5]+x[4]+x[3]+x[2]+x[1]+x[0];
  const U=f.slice(0,9),R=f.slice(9,18),F=f.slice(18,27),D=f.slice(27,36),L=f.slice(36,45),B=f.slice(45,54);
  return rot(D)+rot(R)+rot(B)+rot(U)+rot(L)+rot(F);
}
function mapAlgX2(alg){
  return parseAlg(alg).map(m=>{
    const map={U:"D",D:"U",F:"B",B:"F",R:"R",L:"L"};
    return (map[m[0]]||m[0])+m.slice(1);
  });
}

/* ---- last-layer coaching (yellow on top in this view; yellow colour letter is still D) ---- */
const COACH_ALGS={
  fruruf:"F R U R' U' F'",
  sune:"R U R' U R U2 R'",
  antisune:"R U2 R' U' R U' R'",
  pi:"R U2 R2 U' R2 U' R2 U2 R",
  ollH:"F R U R' U' R U R' U' R U R' U' F'",
  ollU:"R2 D' R U2 R' D R U2 R",
  ollU2:"R2 D R' U2 R D' R' U2 R'",
  ollL:"R U2 R D R' U2 R D' R2",
  ollT:"R U2 R' U' R U' R2 U2 R U R' U R",
  cperm:"R' F R' B2 R F' R' B2 R2",
  cpermInv:"R2 B2 R F R' B2 R F' R",
  ua:"R U' R U R U R U' R' U' R2",
  ub:"R2 U R U R' U' R' U' R' U R'",
  tperm:"R U R' U' R' F R2 U' R' U' R U R' F'",
  yperm:"F R U' R' U' R U R' F' R U R' U' R' F R F'"
};
COACH_ALGS.hperm=COACH_ALGS.ua+" U "+COACH_ALGS.ua+" U'";
COACH_ALGS.zperm=COACH_ALGS.ua+" U2 "+COACH_ALGS.ub+" U2";

function yellowTopSolved(){return faceletsX2(SOLVED);}
function uTurns(v,n){
  let s=v;
  n=((n%4)+4)%4;
  for(let i=0;i<n;i++)s=applyMove(s,"U");
  return s;
}
/* faceletsX2 is a sticker view only — do not apply algs to that string. Holds and algs run in cube space with mapped moves. */
function applyHoldAlgCube(cubeF,hold,yellowAlg){
  let s=cubeF;
  const hAlg=holdTurns(hold).alg;
  if(hAlg)s=applyAlg(s,mapAlgX2(hAlg));
  if(yellowAlg)s=applyAlg(s,mapAlgX2(yellowAlg));
  return s;
}
function findHoldCube(cubeF,yellowAlg,ok){
  for(let h=0;h<4;h++){
    const t=applyHoldAlgCube(cubeF,h,yellowAlg);
    if(ok(t,h))return h;
  }
  return -1;
}
function aufToSolvedCube(f){
  for(let h=0;h<4;h++){
    if(applyHoldAlgCube(f,h,"")===SOLVED)return h;
  }
  return -1;
}
function yCenters(v){return {U:v[4],R:v[13],F:v[22],D:v[31],L:v[40],B:v[49]};}
function yEdgeCount(v){return [1,3,5,7].filter(i=>v[i]==="D").length;}
function yCornerCount(v){return [0,2,6,8].filter(i=>v[i]==="D").length;}
function yEdgeBits(v){return {UB:v[1]==="D",UR:v[5]==="D",UF:v[7]==="D",UL:v[3]==="D"};}
function cornersPlacedY(v){
  const c=yCenters(v);
  return v[9]===c.R&&v[11]===c.R&&v[18]===c.F&&v[20]===c.F&&v[36]===c.L&&v[38]===c.L&&v[45]===c.B&&v[47]===c.B;
}
function edgesPlacedY(v){
  const c=yCenters(v);
  return v[19]===c.F&&v[10]===c.R&&v[46]===c.B&&v[37]===c.L;
}
function headlightsY(v){
  return {F:v[18]===v[20],R:v[9]===v[11],B:v[45]===v[47],L:v[36]===v[38]};
}
function aufToYellowSolved(v){
  const y=yellowTopSolved();
  for(let h=0;h<4;h++)if(uTurns(v,h)===y)return h;
  return -1;
}
function findHold(v,alg,ok){
  for(let h=0;h<4;h++){
    const t=applyAlg(uTurns(v,h),alg);
    if(ok(t,h))return h;
  }
  return -1;
}
function holdTurns(h){
  h=((h%4)+4)%4;
  if(!h)return {alg:"",text:"You're already holding it the right way."};
  if(h===1)return {alg:"U",text:"Turn the yellow face once clockwise (one U)."};
  if(h===2)return {alg:"U2",text:"Turn the yellow face halfway around (U2)."};
  return {alg:"U'",text:"Turn the yellow face once the other way (U')."};
}
function packCoachStep(opts){
  const hold=opts.hold||0;
  const ht=holdTurns(hold);
  const alg=opts.alg||"";
  return {
    stage:opts.stage,
    caseId:opts.caseId,
    title:opts.title||"",
    caseName:opts.caseName||"",
    hold:hold,
    holdText:opts.holdText||ht.text,
    holdAlg:ht.alg,
    alg:alg,
    algName:opts.algName||"",
    tip:opts.tip||"",
    cubeAlg:alg?mapAlgX2(alg):[],
    done:!!opts.done,
    method:opts.method||"beginner",
    kind:opts.kind||"lastLayer"
  };
}
function detectYellowCross(v,method){
  const n=yEdgeCount(v);
  const b=yEdgeBits(v);
  method=method||"beginner";
  if(n>=4)return null;
  if(n<=1){
    return packCoachStep({
      method,stage:"yellow-cross",caseId:n?"almost-dot":"dot",
      title:"Yellow cross",
      caseName:n?"You have only one yellow edge on top — treat this like a dot.":"You have a dot (no yellow edges on top yet).",
      hold:0,holdText:"Any hold is fine for this first move.",
      alg:COACH_ALGS.fruruf,algName:"F R U R' U' F'",
      tip:"Do F R U R' U' F'. That should make an L shape. Then I'll look again."
    });
  }
  let holdL=-1;
  if(b.UB&&b.UL&&!b.UF&&!b.UR)holdL=0;
  else if(b.UL&&b.UF&&!b.UR&&!b.UB)holdL=1;
  else if(b.UF&&b.UR&&!b.UB&&!b.UL)holdL=2;
  else if(b.UR&&b.UB&&!b.UL&&!b.UF)holdL=3;
  if(holdL>=0){
    return packCoachStep({
      method,stage:"yellow-cross",caseId:"L",
      title:"Yellow cross",
      caseName:"You have an L shape.",
      hold:holdL,holdText:"Hold the L at the back-left (yellow stickers on the back and left edges of the top).",
      alg:COACH_ALGS.fruruf,algName:"F R U R' U' F'",
      tip:"With the L at the back-left, do F R U R' U' F'. That should make a straight line."
    });
  }
  if((b.UL&&b.UR&&!b.UB&&!b.UF)||(b.UB&&b.UF&&!b.UL&&!b.UR)){
    const hold=(b.UL&&b.UR)?0:1;
    return packCoachStep({
      method,stage:"yellow-cross",caseId:"line",
      title:"Yellow cross",
      caseName:"You have a straight line.",
      hold:hold,holdText:"Hold the line left-to-right across the top.",
      alg:COACH_ALGS.fruruf,algName:"F R U R' U' F'",
      tip:"With the line going left to right, do F R U R' U' F'. That should finish the yellow cross."
    });
  }
  return packCoachStep({
    method,stage:"yellow-cross",caseId:"dot",
    title:"Yellow cross",
    caseName:"The yellow edges are not a cross yet.",
    hold:0,holdText:"Any hold is fine.",
    alg:COACH_ALGS.fruruf,algName:"F R U R' U' F'",
    tip:"Do F R U R' U' F', then I'll look again."
  });
}
function suneHoldForOne(v){
  /* U-face: 0=UBL, 2=UBR, 6=UFL, 8=UFR. A U turn sends 0→2, 2→8, 8→6, 6→0. Target is UFL (6). */
  if(v[6]==="D")return 0;
  if(v[8]==="D")return 1;
  if(v[2]==="D")return 2;
  if(v[0]==="D")return 3;
  return 0;
}
function detectSuneCorners(cubeF,method){
  const v=faceletsX2(cubeF);
  const n=yCornerCount(v);
  if(n>=4)return null;
  let hold=0,bestN=-1,bestH=0;
  for(let h=0;h<4;h++){
    const t=faceletsX2(applyHoldAlgCube(cubeF,h,COACH_ALGS.sune));
    const cn=yCornerCount(t),en=yEdgeCount(t);
    if(en===4&&(cn>bestN||(cn===bestN&&h<bestH))){bestN=cn;bestH=h;hold=h;}
  }
  if(bestN<0)hold=n===1?suneHoldForOne(v):0;
  const name=n===0?"None of the yellow corners are facing up yet.":n===1?"One yellow corner is already facing up.":n===2?"Two yellow corners are facing up.":"Three yellow corners are facing up.";
  return packCoachStep({
    method,stage:"orient-corners",caseId:"sune-"+n,
    title:"Orient the yellow corners",
    caseName:name+(n===1?" We'll use Sune.":" We'll use Sune, then look again."),
    hold:hold,
    holdText:n===1?"Hold the cube so the corner that already has yellow on top is at the front-left.":"Hold the cube as I show, then do Sune. I'll look again after.",
    alg:COACH_ALGS.sune,algName:"Sune",
    tip:"Sune is R U R' U R U2 R'. After this I'll tell you if we need to do it again."
  });
}
function cornersPlacedUpToAuf(cubeF){
  for(let h=0;h<4;h++){
    if(cornersPlacedY(faceletsX2(applyHoldAlgCube(cubeF,h,""))))return true;
  }
  return false;
}
function detectCornerPerm(cubeF,method){
  const v=faceletsX2(cubeF);
  if(cornersPlacedY(v)||cornersPlacedUpToAuf(cubeF))return null;
  let hold=-1;
  for(let h=0;h<4;h++){
    if(headlightsY(faceletsX2(applyHoldAlgCube(cubeF,h,""))).B){hold=h;break;}
  }
  if(hold>=0){
    return packCoachStep({
      method,stage:"perm-corners",caseId:"headlights",
      title:"Position the yellow corners",
      caseName:"You have headlights (two corners on one side showing the same colour).",
      hold:hold,holdText:"Hold the headlights at the back.",
      alg:COACH_ALGS.cperm,algName:"Corner perm",
      tip:"With headlights at the back, do R' F R' B2 R F' R' B2 R2."
    });
  }
  return packCoachStep({
    method,stage:"perm-corners",caseId:"diagonal",
    title:"Position the yellow corners",
    caseName:"The corners are swapped diagonally — no headlights yet.",
    hold:0,holdText:"Any hold is fine for this first move. Headlights will appear after.",
    alg:COACH_ALGS.cperm,algName:"Corner perm",
    tip:"Do R' F R' B2 R F' R' B2 R2 once, then I'll look for headlights."
  });
}
function detectEdgePerm(cubeF,method){
  const v=faceletsX2(cubeF);
  if(edgesPlacedY(v))return null;
  const cands=[
    {id:"ua",name:"U-perm (clockwise)",alg:COACH_ALGS.ua,tip:"This U-perm swaps three edges. Hold the finished edge at the back if you can see one."},
    {id:"ub",name:"U-perm (the other way)",alg:COACH_ALGS.ub,tip:"This U-perm swaps three edges the other way. Hold the finished edge at the back if you can see one."},
    {id:"z",name:"Z-perm",alg:COACH_ALGS.zperm,tip:"Two pairs of edges need to swap (Z-perm). This is a longer combo — take it slowly."},
    {id:"h",name:"H-perm",alg:COACH_ALGS.hperm,tip:"All four edges swap with the opposite one (H-perm). This is a longer combo — take it slowly."}
  ];
  let best=null;
  for(let i=0;i<cands.length;i++){
    const c=cands[i];
    const h=findHoldCube(cubeF,c.alg,t=>t===SOLVED||aufToSolvedCube(t)>=0||edgesPlacedY(faceletsX2(t)));
    if(h>=0){
      const len=parseAlg(c.alg).length;
      if(!best||len<best.len)best={c:c,hold:h,len:len};
    }
  }
  if(!best)best={c:cands[0],hold:0,len:parseAlg(cands[0].alg).length};
  const held=faceletsX2(applyHoldAlgCube(cubeF,best.hold,""));
  const cen=yCenters(held);
  const backDone=held[46]===cen.B;
  let holdText=holdTurns(best.hold).text;
  if((best.c.id==="ua"||best.c.id==="ub")&&(backDone||best.hold)){
    holdText="Hold the cube so the edge that already matches its centre is at the back.";
  }
  const caseName=best.c.id==="h"?"You have an H-perm (two opposite pairs).":best.c.id==="z"?"You have a Z-perm (two adjacent swaps).":"Three edges still need to cycle (U-perm).";
  return packCoachStep({
    method,stage:"perm-edges",caseId:best.c.id,
    title:"Position the last-layer edges",
    caseName:caseName,
    hold:best.hold,holdText:holdText,
    alg:best.c.alg,algName:best.c.name,tip:best.c.tip
  });
}
function detectSolvedOrAuf(cubeF,method){
  method=method||"beginner";
  if(cubeF===SOLVED||isSolved(cubeF)){
    return packCoachStep({method,stage:"solved",caseId:"solved",title:"Solved!",caseName:"The last layer is done.",done:true,alg:"",holdText:"Nice work — the cube is solved."});
  }
  const auf=aufToSolvedCube(cubeF);
  if(auf>=0){
    return packCoachStep({
      method,stage:"auf",caseId:"auf",title:"Last turn",
      caseName:"The last layer is all in place — just turn the yellow face until the sides match the centres.",
      hold:auf,holdText:"Turn the yellow face until every side matches its centre.",
      alg:"",tip:"A short turn of the yellow face finishes the cube."
    });
  }
  return null;
}
function detectBeginnerLL(facelets){
  const v=faceletsX2(facelets);
  return detectSolvedOrAuf(facelets,"beginner")||detectYellowCross(v,"beginner")||detectSuneCorners(facelets,"beginner")||detectCornerPerm(facelets,"beginner")||detectEdgePerm(facelets,"beginner")||detectSolvedOrAuf(SOLVED,"beginner");
}

function ollCornerCases(){
  const a=COACH_ALGS;
  return [
    {id:"sune",name:"Sune",alg:a.sune,holdText:"Put the corner that already has yellow on top at the front-left."},
    {id:"antisune",name:"Anti-Sune",alg:a.antisune,holdText:"Hold it as I show, then do Anti-Sune."},
    {id:"pi",name:"Pi (bowtie)",alg:a.pi,holdText:"Hold it as I show, then do the Pi algorithm."},
    {id:"h",name:"H (double headlights)",alg:a.ollH,holdText:"Hold it as I show, then do this headlights algorithm."},
    {id:"u",name:"U-shape",alg:a.ollU,holdText:"Hold it as I show, then do the U-shape algorithm."},
    {id:"u2",name:"U-shape",alg:a.ollU2,holdText:"Hold it as I show, then do the U-shape algorithm."},
    {id:"l",name:"L-shape",alg:a.ollL,holdText:"Hold it as I show, then do the L-shape algorithm."},
    {id:"t",name:"T-shape",alg:a.ollT,holdText:"Hold it as I show, then do the T-shape algorithm."}
  ];
}
function pllCases(){
  const a=COACH_ALGS;
  return [
    {id:"ua",name:"U-perm (clockwise)",alg:a.ua},
    {id:"ub",name:"U-perm (the other way)",alg:a.ub},
    {id:"aa",name:"A-perm",alg:a.cperm},
    {id:"ab",name:"A-perm (the other way)",alg:a.cpermInv},
    {id:"t",name:"T-perm",alg:a.tperm},
    {id:"y",name:"Y-perm",alg:a.yperm},
    {id:"z",name:"Z-perm",alg:a.zperm},
    {id:"h",name:"H-perm",alg:a.hperm}
  ];
}
function detect4LookLL(facelets){
  const v=faceletsX2(facelets);
  const done=detectSolvedOrAuf(facelets,"cfop4look");
  if(done)return done;
  const cross=detectYellowCross(v,"cfop4look");
  if(cross)return cross;
  if(yCornerCount(v)<4){
    let best=null;
    const cases=ollCornerCases();
    for(let i=0;i<cases.length;i++){
      const c=cases[i];
      const h=findHoldCube(facelets,c.alg,t=>{const w=faceletsX2(t);return yEdgeCount(w)===4&&yCornerCount(w)===4;});
      if(h>=0){
        const len=parseAlg(c.alg).length;
        if(!best||len<best.len)best={c:c,hold:h,len:len};
      }
    }
    if(best){
      return packCoachStep({
        method:"cfop4look",stage:"orient-corners",caseId:best.c.id,
        title:"Orient the last-layer corners (2-look OLL)",
        caseName:"This is a "+best.c.name+" case.",
        hold:best.hold,holdText:best.c.holdText,
        alg:best.c.alg,algName:best.c.name,
        tip:"This 4-look algorithm should orient all four corners at once."
      });
    }
    const s=detectSuneCorners(facelets,"cfop4look");
    if(s){s.tip="I don't have a one-shot for this yet — we'll use Sune and look again.";return s;}
  }
  let best=null;
  const cases=pllCases();
  for(let i=0;i<cases.length;i++){
    const c=cases[i];
    const h=findHoldCube(facelets,c.alg,t=>t===SOLVED||aufToSolvedCube(t)>=0);
    if(h>=0){
      const len=parseAlg(c.alg).length;
      if(!best||len<best.len)best={c:c,hold:h,len:len};
    }
  }
  if(best){
    const placed=cornersPlacedY(v);
    return packCoachStep({
      method:"cfop4look",
      stage:placed?"perm-edges":"pll",
      caseId:best.c.id,
      title:"Permute the last layer (2-look PLL)",
      caseName:"This is a "+best.c.name+" case.",
      hold:best.hold,
      holdText:holdTurns(best.hold).text+" Then do "+best.c.name+".",
      alg:best.c.alg,algName:best.c.name,
      tip:"This 4-look algorithm should place the last-layer pieces. You may still need a short yellow-face turn at the end."
    });
  }
  return detectCornerPerm(facelets,"cfop4look")||detectEdgePerm(facelets,"cfop4look")||packCoachStep({method:"cfop4look",stage:"solved",caseId:"solved",title:"Solved!",done:true});
}
function detectStageCoach(facelets,goal){
  const flags=stageFlags(facelets||SOLVED);
  if(goal==="crossPlan")goal="cross";
  if(goal==="lookahead"||goal==="metronome"){
    return packCoachStep({
      kind:"lookahead",method:"tips",stage:"f2l",caseId:flags.f2l?"f2l-done":"lookahead",
      title:"Look ahead",
      caseName:flags.f2l?"The first two layers are done!":"Solve the first two layers slowly and smoothly.",
      hold:0,holdText:"White centre on top. Turn at a steady pace — no bursts.",
      alg:"",tip:"Keep turning slowly enough that you can already see the next corner or edge before you finish this one. If you freeze, that's a pause to practise away.",
      done:!!flags.f2l
    });
  }
  if(goal==="cross"){
    return packCoachStep({
      kind:"cross",method:"tips",stage:"cross",caseId:flags.cross?"cross-done":"cross",
      title:"White cross",
      caseName:flags.cross?"The white cross is done!":"Make the white cross.",
      hold:0,holdText:"Hold the cube with the white centre on top.",
      alg:"",tip:"Make a white plus, and line up each white edge with the side centre of the same colour. Try to do it in 8 moves or fewer.",
      done:!!flags.cross
    });
  }
  return packCoachStep({
    kind:"f2l",method:"tips",stage:"f2l",caseId:flags.f2l?"f2l-done":(flags.cross?"f2l-pairs":"f2l-cross-first"),
    title:"First two layers",
    caseName:flags.f2l?"The first two layers are done!":(flags.cross?"The white cross is done — now pair each white corner with its matching edge and insert them.":"Start with the white cross, then the first two layers."),
    hold:0,holdText:"Keep the white centre on top.",
    alg:"",tip:"Put each white corner with its matching edge into the correct slot. I'll tell you when the first two layers are finished.",
    done:!!flags.f2l
  });
}
function detectDrillCoach(facelets,opts){
  opts=opts||{};
  const goal=drillBucket(opts.goal||opts.stage||"lastLayer");
  if(goal==="cross"||goal==="f2l")return detectStageCoach(facelets,goal);
  const method=opts.llMethod==="cfop4look"?"cfop4look":"beginner";
  return method==="cfop4look"?detect4LookLL(facelets):detectBeginnerLL(facelets);
}
function faceletsOnAlgPath(f,start,alg){
  if(f===start)return true;
  const moves=parseAlg(alg);
  let s=start;
  for(let i=0;i<moves.length;i++){
    const m=moves[i];
    if(m[1]==="2"){
      const midA=applyMove(s,m[0]),midB=applyMove(s,m[0]+"'");
      if(f===midA||f===midB)return true;
    }
    s=applyMove(s,m);
    if(f===s)return true;
  }
  return false;
}
function coachStepLabel(stage,caseId){
  if(stage==="yellow-cross")return "Cross";
  if(stage==="orient-corners")return "Corners (orient)";
  if(stage==="perm-corners")return "Corners (place)";
  if(stage==="perm-edges")return "Edges";
  if(stage==="pll")return "PLL";
  if(stage==="auf")return "Last turn";
  if(stage==="cross")return "Cross";
  if(stage==="f2l")return "F2L";
  return caseId||stage||"Step";
}
function fmtCoachMs(ms){
  if(!isFinite(ms)||ms<0)return "0.0s";
  return (Math.round(ms/100)/10).toFixed(1)+"s";
}
function coachSummaryText(stepTimes,totalMs){
  const rows=stepTimes||[];
  const bits=rows.map(r=>coachStepLabel(r.stage,r.caseId)+" "+fmtCoachMs(r.ms));
  const by={};
  rows.forEach(r=>{
    const k=coachStepLabel(r.stage,r.caseId);
    by[k]=(by[k]||0)+r.ms;
  });
  let slow=null;
  Object.keys(by).forEach(k=>{if(!slow||by[k]>slow.ms)slow={name:k,ms:by[k]};});
  const ll=isFinite(totalMs)?fmtCoachMs(totalMs):(rows.length?fmtCoachMs(rows.reduce((s,r)=>s+r.ms,0)):"0.0s");
  const slowBit=slow?(" · slowest: "+slow.name+" "+fmtCoachMs(slow.ms)):"";
  return {text:"Last layer "+ll+slowBit,lines:bits,totalMs:rows.reduce((s,r)=>s+(r.ms||0),0),slowest:slow};
}

const LL_ALGS=[

  "R U R' U' R' F R2 U' R' U' R U R' F'",
  "R U R' F' R U R' U' R' F R2 U' R'",
  "R U2 R' U' R U' R'",
  "R U R' U R U2 R'",
  "L' U' L U' L' U2 L",
  "F R U R' U' F'",
  "F R U R' U' R U R' U' F'",
  "R U R' U' R' F R F'",
  "R2 D R' U2 R D' R' U2 R'",
  "F R U' R' U' R U R' F'",
  "R' U' F' U F R",
];
function lastLayerScramble(){
  const auf=["","U","U2","U'"];
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  for(let i=0;i<20;i++){
    const seq=(pick(auf)+" "+pick(LL_ALGS)+" "+pick(auf)+" "+pick(LL_ALGS)+" "+pick(auf)).trim();
    const moves=mapAlgX2(seq);
    const st=applyAlg(SOLVED,moves);
    const f=stageFlags(st);
    if(f.f2l&&!f.solved)return moves;
  }
  return mapAlgX2(pick(LL_ALGS));
}
function randomDrillScramble(stage){
  const raw=stage;
  stage=drillBucket(stage);
  if(raw==="crossPlan"||stage==="cross"||stage==="crossPlan")return randomMoveScramble(null,8);
  if(stage==="f2l"||stage==="lookahead"||stage==="metronome")return randomMoveScramble(null,12);
  if(stage==="fingerTricks")return lastLayerScramble();
  return lastLayerScramble();
}

function dayKey(ts){
  const d=ts instanceof Date?ts:new Date(ts||Date.now());
  const p=n=>String(n).padStart(2,"0");
  return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
}
function streakFromDays(days,today){
  if(!days)return 0;
  let n=0,d=today||dayKey(new Date());
  const parse=s=>{const [y,m,dd]=s.split("-").map(Number);return new Date(y,m-1,dd,12);};
  const ymd=x=>{const p=n=>String(n).padStart(2,"0");return x.getFullYear()+"-"+p(x.getMonth()+1)+"-"+p(x.getDate());};
  if(!(days[d]&&(days[d].done||days[d].solves>0))){
    const y=parse(d);y.setDate(y.getDate()-1);d=ymd(y);
  }
  while(days[d]&&(days[d].done||days[d].solves>0)){
    n++;const y=parse(d);y.setDate(y.getDate()-1);d=ymd(y);
  }
  return n;
}
function tps(moves,ms){if(!ms||ms<=0||!moves)return 0;return Math.round(1000*moves/ms*100)/100;}

/* v12 helpers: analysis, alg player, videos, sync, calibration, written feedback */

const PAUSE_GAP_MS=600;
const LBL_TARGET={cross:8000,fl:10000,sl:12000,ll:10000,total:40000};
const CFOP_TARGET={cross:6000,f2l:16000,ll:8000,total:30000};

const DRILL_VIDEOS={
  lookahead:{
    id:"ZhUuDwX1Bhk",title:"How to start practicing Look-Ahead",channel:"TheCubicle",
    url:"https://www.youtube.com/watch?v=ZhUuDwX1Bhk",start:0,drills:["lookahead","metronome"]
  },
  lookaheadPlus:{
    id:"za9RvM1bS0k",title:"A Faster F2L Look Ahead Technique (CFOP)",channel:"J Perm",
    url:"https://www.youtube.com/watch?v=za9RvM1bS0k",start:0,drills:["lookahead"]
  },
  crossPlan:{
    id:"IWXpkfwimo0",title:"Rubik's Cube: 7 Tips For An Efficient Cross Every Solve (CFOP)",channel:"J Perm",
    url:"https://www.youtube.com/watch?v=IWXpkfwimo0",start:0,drills:["crossPlan","cross"]
  },
  crossSkills:{
    id:"Q132-oLj1nA",title:"Intermediate Cross - Techniques",channel:"CubeSkills",
    url:"https://www.youtube.com/watch?v=Q132-oLj1nA",start:0,drills:["crossPlan","cross"]
  },
  fingerTricks:{
    id:"wLuVF9Dk3AQ",title:"Rubik's Cube: Finger Tricks Tutorial (Beginner to Advanced)",channel:"J Perm",
    url:"https://www.youtube.com/watch?v=wLuVF9Dk3AQ",start:0,drills:["fingerTricks"]
  },
  beginner:{
    id:"7Ron6MN45LY",title:"Learn How to Solve a Rubik's Cube in 10 Minutes (Beginner Tutorial)",channel:"J Perm",
    url:"https://www.youtube.com/watch?v=7Ron6MN45LY",start:0,drills:["firstLayer","secondLayer","lastLayer","beginner"]
  },
  f2l:{
    id:"Ar_Zit1VLG0",title:"Learn F2L in 6 minutes (Full Intuitive F2L Tutorial)",channel:"J Perm",
    url:"https://www.youtube.com/watch?v=Ar_Zit1VLG0",start:0,drills:["f2l"]
  },
  oll2look:{
    id:"GhmYBgLoQQg",title:"Rubik's Cube: Easy 2-Look OLL Tutorial (Beginner CFOP)",channel:"J Perm",
    url:"https://www.youtube.com/watch?v=GhmYBgLoQQg",start:0,drills:["lastLayer","oll"]
  },
  pll2look:{
    id:"f_Yor-ydZjs",title:"Rubik's Cube: Easy 2-Look PLL Tutorial (Beginner CFOP)",channel:"J Perm",
    url:"https://www.youtube.com/watch?v=f_Yor-ydZjs",start:0,drills:["lastLayer","pll"]
  }
};

function videosForDrill(type){
  const t=String(type||"");
  const out=[];
  const seen={};
  Object.keys(DRILL_VIDEOS).forEach(k=>{
    const v=DRILL_VIDEOS[k];
    if((v.drills||[]).indexOf(t)>=0 && !seen[v.id]){seen[v.id]=1;out.push(Object.assign({key:k},v));}
  });
  if(!out.length && (t==="warmup"||t==="ao5"||!t)){
    out.push(Object.assign({key:"beginner"},DRILL_VIDEOS.beginner));
  }
  return out;
}

function invertAlgStr(alg){return fmtAlg(invertAlg(typeof alg==="string"?parseAlg(alg):alg||[]));}

function createAlgPlayer(opts){
  opts=opts||{};
  let moves=parseAlg(opts.alg||"");
  let setupAlg=opts.setupAlg!=null?String(opts.setupAlg):invertAlgStr(moves);
  let i=0, playing=false, loop=!!opts.loop, speed=Number(opts.speed)>0?Number(opts.speed):1;
  let mode=opts.mode||"demo";
  let watched=false, hideStrip=false, hintAfter=opts.hintAfterMs!=null?opts.hintAfterMs:3000;
  let lastLiveAt=0, hinted=false;
  const listeners=[];
  function emit(){const v=get();for(let k=0;k<listeners.length;k++){try{listeners[k](v);}catch(e){}}}
  function get(){
    return {
      moves:moves.slice(),
      i,
      current:i<moves.length?moves[i]:"",
      prev:i>0?moves[i-1]:"",
      playing,loop,speed,
      setupAlg,alg:fmtAlg(moves),
      atStart:i===0,
      atEnd:i>=moves.length,
      mode,watched,
      hideStrip:mode==="memorise"&&watched&&hideStrip,
      hintMove:(mode==="memorise"&&hinted)?(moves[i]||""):"",
      hintAfterMs:hintAfter,
      total:moves.length
    };
  }
  function load(next){
    next=next||{};
    moves=parseAlg(next.alg||"");
    setupAlg=next.setupAlg!=null?String(next.setupAlg):invertAlgStr(moves);
    i=0;playing=false;loop=!!next.loop;speed=Number(next.speed)>0?Number(next.speed):speed||1;
    mode=next.mode||"demo";watched=false;hideStrip=false;hinted=false;lastLiveAt=0;
    emit();
    return get();
  }
  function play(){if(i>=moves.length)i=0;playing=true;hinted=false;emit();return get();}
  function pause(){playing=false;emit();return get();}
  function setSpeed(s){const n=Number(s);if(n>0)speed=n;emit();return get();}
  function stepForward(){if(i<moves.length)i++;playing=false;if(i>=moves.length)watched=true;hinted=false;emit();return get();}
  function stepBack(){if(i>0)i--;playing=false;hinted=false;emit();return get();}
  function restart(){i=0;playing=false;hinted=false;emit();return get();}
  function setLoop(on){loop=!!on;emit();return get();}
  function jumpTo(k){i=Math.max(0,Math.min(moves.length,k|0));playing=false;if(i>=moves.length)watched=true;hinted=false;emit();return get();}
  function tickPlay(advance){
    if(!playing)return get();
    if(advance){
      if(i<moves.length)i++;
      if(i>=moves.length){
        watched=true;
        if(loop)i=0;
        else playing=false;
      }
      emit();
    }
    return get();
  }
  function yourTurn(){playing=false;mode="live";hideStrip=false;hinted=false;lastLiveAt=Date.now();emit();return get();}
  function memorise(){playing=false;mode="memorise";hideStrip=true;watched=true;i=0;hinted=false;lastLiveAt=Date.now();emit();return get();}
  function noteLiveMove(){lastLiveAt=Date.now();hinted=false;return get();}
  function checkMemoriseHint(now){
    if(mode!=="memorise"||!hideStrip)return get();
    const t=now!=null?now:Date.now();
    if(lastLiveAt && t-lastLiveAt>=hintAfter && !hinted){hinted=true;emit();}
    return get();
  }
  function on(fn){if(typeof fn==="function")listeners.push(fn);return function(){const x=listeners.indexOf(fn);if(x>=0)listeners.splice(x,1);};}
  return {load,play,pause,setSpeed,stepForward,stepBack,restart,setLoop,jumpTo,tickPlay,yourTurn,memorise,noteLiveMove,checkMemoriseHint,get,on,invertAlgStr:function(){return setupAlg;}};
}

function isCancelPair(a,b){
  if(!a||!b)return false;
  const fa=a[0],fb=b[0];
  if(fa!==fb)return false;
  const sa=a.length>1?a.slice(1):"",sb=b.length>1?b.slice(1):"";
  return (sa===""&&sb==="'")||(sa==="'"&&sb==="")||(sa==="2"&&sb==="2");
}

function wastedFromMoves(moves){
  const m=moves||[];
  let cancel=0,uRuns=0,rot=0,i=0;
  while(i<m.length){
    if(i+1<m.length && isCancelPair(m[i],m[i+1])){cancel++;i+=2;continue;}
    const face=m[i][0];
    if(face==="x"||face==="y"||face==="z"){rot++;i++;continue;}
    if(face==="U"||face==="u"){
      let run=0,j=i;
      while(j<m.length && (m[j][0]==="U"||m[j][0]==="u")){run++;j++;}
      if(run>3)uRuns++;
      i=j;continue;
    }
    i++;
  }
  return {cancel,uRuns,rotations:rot};
}

function pauseSpans(moves,gapMs){
  gapMs=gapMs==null?PAUSE_GAP_MS:gapMs;
  const out=[];
  for(let i=1;i<moves.length;i++){
    const a=moves[i-1].t,b=moves[i].t;
    if(a==null||b==null)continue;
    const d=b-a;
    if(d>gapMs)out.push({from:i-1,to:i,ms:d,after:moves[i-1].m,before:moves[i].m});
  }
  return out;
}

const CROSS_MOVES=["U","U'","U2","D","D'","D2","L","L'","L2","R","R'","R2","F","F'","F2","B","B'","B2"];
function crossPiecesKey(f){
  const c=cubiesFromFacelets(f);
  if(!c)return null;
  let key=0;
  for(let p=0;p<4;p++){
    let pos=-1;
    for(let i=0;i<12;i++)if(c.ep[i]===p){pos=i;break;}
    if(pos<0)return null;
    key=key*24+(pos*2+(c.eo[pos]&1));
  }
  return key;
}
function whiteCrossSolved(f){
  if(!f)return false;
  const c=cubiesFromFacelets(f);if(!c)return false;
  return c.ep[0]===0&&c.ep[1]===1&&c.ep[2]===2&&c.ep[3]===3&&!c.eo[0]&&!c.eo[1]&&!c.eo[2]&&!c.eo[3];
}
function optimalCross(facelets){
  if(!facelets)return {moves:[],len:0,found:false};
  if(whiteCrossSolved(facelets))return {moves:[],len:0,found:true};
  const startKey=crossPiecesKey(facelets);
  if(startKey==null)return {moves:[],len:-1,found:false};
  const dist=Object.create(null);
  const prev=Object.create(null);
  dist[startKey]=0;
  const q=[facelets];
  let qi=0;
  const MAX=8;
  while(qi<q.length){
    const f=q[qi++];
    const k=crossPiecesKey(f);
    const d=dist[k];
    if(d>=MAX)continue;
    for(let i=0;i<CROSS_MOVES.length;i++){
      const mv=CROSS_MOVES[i];
      const nf=applyMove(f,mv);
      const nk=crossPiecesKey(nf);
      if(nk==null||dist[nk]!=null)continue;
      dist[nk]=d+1;
      prev[nk]={k,mv};
      if(whiteCrossSolved(nf)){
        const sol=[];
        let x=nk;
        while(x!==startKey){
          const p=prev[x];
          if(!p)break;
          sol.push(p.mv);
          x=p.k;
        }
        sol.reverse();
        return {moves:sol,len:sol.length,found:true};
      }
      q.push(nf);
    }
  }
  return {moves:[],len:-1,found:false};
}

function classifyStageAt(facelets,method){
  if(!facelets)return "unknown";
  if(isSolved(facelets))return "solved";
  if(!whiteCrossSolved(facelets))return "cross";
  if(method==="cfop"){
    if(!f2lSolved(facelets))return "f2l";
    return "ll";
  }
  if(!firstLayerSolved(facelets))return "fl";
  if(!secondLayerSolved(facelets))return "sl";
  return "ll";
}

function firstLayerSolved(f){
  if(!f)return false;
  if(!whiteCrossSolved(f))return false;
  const c=cubiesFromFacelets(f);if(!c)return false;
  for(let i=0;i<4;i++)if(c.cp[i]!==i||(c.co[i]&3))return false;
  return true;
}
function secondLayerSolved(f){
  if(!firstLayerSolved(f))return false;
  const c=cubiesFromFacelets(f);if(!c)return false;
  for(let i=4;i<8;i++)if(c.ep[i]!==i||c.eo[i])return false;
  return true;
}
function f2lSolved(f){return secondLayerSolved(f);}

function splitSolveStages(startFacelets,moves,method,totalMs){
  method=method==="cfop"?"cfop":"lbl";
  const stamped=(moves||[]).map((m,i)=>typeof m==="string"?{m,t:null,i}:{m:m.m||m.move,t:m.t,i});
  let f=startFacelets||SOLVED;
  const ev=[{t:0,f,stage:classifyStageAt(f,method),i:-1}];
  for(let i=0;i<stamped.length;i++){
    const mv=stamped[i].m;
    if(!mv)continue;
    f=applyMove(f,mv);
    ev.push({t:stamped[i].t,f,stage:classifyStageAt(f,method),i,m:mv});
  }
  const names=method==="cfop"?["cross","f2l","ll"]:["cross","fl","sl","ll"];
  const stages=[];
  let cur=ev[0].stage, startMove=0, startT=0, startF=ev[0].f;
  function close(endEv,name,endMoveExclusive){
    if(names.indexOf(name)<0)return;
    const endT=endEv.t!=null?endEv.t:(totalMs||0);
    const dur=Math.max(0,(endT||0)-(startT||0));
    const slice=stamped.slice(startMove,endMoveExclusive).filter(x=>x&&x.m);
    const pauses=pauseSpans(slice);
    const rec={
      name,ms:dur,moves:slice.length,tps:tps(slice.length,dur),
      pauseMs:pauses.reduce((s,p)=>s+p.ms,0),
      pauses:pauses.length,
      longestPause:pauses.reduce((m,p)=>Math.max(m,p.ms),0),
      waste:wastedFromMoves(slice.map(x=>x.m)),
      startFacelets:startF
    };
    if(name==="cross"){
      const opt=optimalCross(startF);
      rec.optimal=opt.len;
      rec.foundOptimal=opt.found;
      rec.extra=opt.found?Math.max(0,slice.length-opt.len):0;
      rec.optimalAlg=fmtAlg(opt.moves||[]);
    }
    stages.push(rec);
  }
  for(let i=1;i<ev.length;i++){
    if(ev[i].stage!==cur){
      close(ev[i],cur,ev[i].i+1);
      cur=ev[i].stage;
      startMove=ev[i].i+1;
      startT=ev[i].t!=null?ev[i].t:startT;
      startF=ev[i].f;
    }
  }
  const last=ev[ev.length-1];
  if(cur && cur!=="solved")close({t:totalMs!=null?totalMs:last.t},cur,stamped.length);
  const allPauses=pauseSpans(stamped);
  return {method,stages,pauses:allPauses,endFacelets:f,events:ev};
}

function biggestTimeLoss(analysis){
  const a=analysis||{};
  const candidates=[];
  (a.pauses||[]).forEach(p=>{
    candidates.push({kind:"pause",ms:p.ms,label:"a pause",detail:p,stage:p.stage||""});
  });
  (a.stages||[]).forEach(s=>{
    const tgt=(a.targets||{})[s.name];
    if(tgt!=null && s.ms>tgt){
      candidates.push({kind:"slow-stage",ms:s.ms-tgt,label:s.name+" was slower than the target",stage:s.name,detail:s});
    }
    if(s.waste && s.waste.cancel){
      candidates.push({kind:"cancel",ms:Math.min(800,s.waste.cancel*400),label:"cancelled moves (R then R')",stage:s.name,detail:s});
    }
    if(s.name==="cross" && s.extra>0){
      candidates.push({kind:"cross-extra",ms:s.extra*400,label:"extra cross moves",stage:"cross",detail:s});
    }
    if(s.longestPause>PAUSE_GAP_MS){
      candidates.push({kind:"stage-pause",ms:s.longestPause,label:"a pause in "+s.name,stage:s.name,detail:s});
    }
  });
  candidates.sort((x,y)=>y.ms-x.ms);
  return candidates[0]||null;
}

function tipForLoss(loss,analysis){
  const k=loss&&loss.kind;
  const why={
    pause:{
      tip:"Try turning slowly enough that you can already see the next piece before you finish this one.",
      why:"This is look-ahead: slow, smooth turns beat stop-and-start bursts, because your eyes get a head start on the next step."
    },
    "stage-pause":{
      tip:"When you reach that step, look first, then turn. If you freeze, take a breath and name the case out loud.",
      why:"Recognition and turning are two different skills. Practising them apart (look, then go) shrinks the pause."
    },
    "slow-stage":{
      tip:"Do a short drill just for that step, and aim to beat today's time by a little.",
      why:"Deliberate practice on one weak step improves your average faster than doing more full solves."
    },
    cancel:{
      tip:"Watch for turns that undo the one you just did. Pause a beat before you turn if you are not sure.",
      why:"Cancelled moves add lockups and waste time. Cleaner turning (and finger tricks) removes them."
    },
    "cross-extra":{
      tip:"In inspection, plan the whole white cross before you start, and try to stay close to the shortest path.",
      why:"World-class solvers plan the cross in inspection so the solve starts without a search."
    }
  };
  return why[k]||{
    tip:"Do one focused drill for your slowest step, then come back to full solves.",
    why:"Your average comes from your weakest step. Fixing that step first is how deliberate practice works."
  };
}

function stageLabelKid(name){
  return ({cross:"cross",fl:"first-layer corners",sl:"second layer",f2l:"first two layers",ll:"last layer",solved:"solved"})[name]||name||"that step";
}

function writtenFeedback(analysis,ctx){
  ctx=ctx||{};
  const a=analysis||{};
  const sentences=[];
  const timeSec=((a.timeMs||0)/1000).toFixed(1);
  const moves=a.moveCount||0;
  const t=a.tps!=null?a.tps.toFixed(1):"0.0";
  sentences.push("That solve was "+timeSec+"s with "+moves+" moves ("+t+" turns per second).");
  const loss=a.biggestLoss;
  if(loss){
    const sec=(loss.ms/1000).toFixed(1);
    if(loss.kind==="pause"||loss.kind==="stage-pause"){
      sentences.push("The biggest time loss was a "+sec+"s pause"+(loss.stage?" during your "+stageLabelKid(loss.stage):"")+".");
    }else if(loss.kind==="cross-extra"){
      const s=(a.stages||[]).filter(x=>x.name==="cross")[0];
      sentences.push("The biggest time loss was the cross: you used "+(s&&s.moves)+" moves, and a shorter path is "+(s&&s.optimal)+". That's about "+sec+"s you can get back.");
    }else if(loss.kind==="cancel"){
      sentences.push("The biggest time loss was extra cancelled turns — about "+sec+"s of going back on yourself.");
    }else{
      sentences.push("The biggest time loss was your "+stageLabelKid(loss.stage||"slow step")+" — about "+sec+"s over the target.");
    }
    const tip=a.tip||tipForLoss(loss,a);
    sentences.push((tip&&tip.tip)||"Practise that step on its own next.");
  }else{
    sentences.push("Nice and steady — no big pauses or wasted turns stood out.");
    sentences.push("Keep this rhythm and the average will keep falling.");
  }
  if(ctx.sessionLine)sentences.push(ctx.sessionLine);
  return sentences.slice(0,4).join(" ");
}

function analyzeSolve(opts){
  opts=opts||{};
  const method=opts.method==="cfop"?"cfop":"lbl";
  const timeMs=opts.timeMs||0;
  const stamped=(opts.moves||[]).map((m,i)=>{
    if(typeof m==="string")return {m,t:null,i};
    return {m:m.m||m.move||"",t:m.t,i};
  });
  const moveCount=stamped.filter(x=>x.m).length;
  const start=opts.startFacelets||SOLVED;
  const parts=splitSolveStages(start,stamped,method,timeMs);
  const targets=method==="cfop"?CFOP_TARGET:LBL_TARGET;
  const stages=parts.stages.map(s=>{
    const copy=Object.assign({},s);
    copy.target=targets[s.name];
    copy.share=timeMs?s.ms/timeMs:0;
    return copy;
  });
  (parts.pauses||[]).forEach(p=>{
    let st="";
    for(let i=0;i<stages.length;i++){
      /* approximate later */
    }
    const ev=parts.events||[];
    for(let i=0;i<ev.length;i++){
      if(ev[i].i===p.to){st=ev[i].stage;break;}
    }
    p.stage=st;
  });
  const pauseMs=parts.pauses.reduce((s,p)=>s+p.ms,0);
  const waste=wastedFromMoves(stamped.map(x=>x.m));
  const analysis={
    method,timeMs,moveCount,tps:tps(moveCount,timeMs),
    stages,pauses:parts.pauses,pauseMs,pauseCount:parts.pauses.length,
    longestPause:parts.pauses.reduce((m,p)=>Math.max(m,p.ms),0),
    waste,targets,
    startFacelets:start
  };
  analysis.biggestLoss=biggestTimeLoss(analysis);
  analysis.tip=tipForLoss(analysis.biggestLoss,analysis);
  analysis.feedback=writtenFeedback(analysis,opts);
  analysis.weakness=recommendWeakness(analysis);
  analysis.drill=analysis.weakness&&analysis.weakness.drill;
  return analysis;
}

function recommendWeakness(analysis){
  const a=analysis||{};
  const loss=a.biggestLoss;
  const drillFor={
    pause:{type:"lookahead",why:"You lost the most time pausing. Slow-turning look-ahead practice teaches your eyes to find the next piece while you finish this one."},
    "stage-pause":{type:"lookahead",why:"Those freezes are recognition pauses. A metronome / look-ahead drill shrinks the gap between seeing and turning."},
    "cross-extra":{type:"crossPlan",why:"Your cross used more moves than the shortest path. Planning the whole cross in inspection is how faster solvers start every solve."},
    cancel:{type:"fingerTricks",why:"Cancelled turns and lockups get better with clean finger tricks and less frantic bursting."},
    "slow-stage":null
  };
  if(loss&&loss.kind==="slow-stage"){
    const st=loss.stage;
    if(st==="cross")return {type:"crossPlan",why:"Your cross is the slowest part versus the target, so we will plan it in inspection."};
    if(st==="fl")return {type:"firstLayer",why:"First-layer corners took the biggest share, so a short corners drill will help most."};
    if(st==="sl"||st==="f2l")return {type:"f2l",why:"The first two layers took the biggest share of the solve."};
    if(st==="ll")return {type:"lastLayer",why:"The last layer was the slowest step, so we will drill those algorithms with a coach."};
  }
  if(loss&&drillFor[loss.kind])return Object.assign({stage:loss.stage||""},drillFor[loss.kind]);
  const slowest=(a.stages||[]).slice().sort((x,y)=>y.ms-x.ms)[0];
  if(slowest){
    if(slowest.name==="cross")return {type:"cross",why:"The cross used the most time today.",stage:"cross"};
    if(slowest.name==="ll")return {type:"lastLayer",why:"The last layer used the most time today.",stage:"ll"};
    if(slowest.name==="fl")return {type:"firstLayer",why:"First-layer corners used the most time today.",stage:"fl"};
    return {type:slowest.name==="f2l"?"f2l":"secondLayer",why:"That step used the most time today.",stage:slowest.name};
  }
  return {type:"lastLayer",why:"Last-layer algorithms are the highest-leverage next drill.",stage:"ll"};
}

function trendFromRecords(records,method){
  const recs=(records||[]).filter(r=>r&&!r.dnf&&typeof r.t==="number"&&r.t>0);
  const last=recs.slice(-12);
  const firstDay=recs[0]&&recs[0].day;
  const firstDayRecs=recs.filter(r=>r.day===firstDay);
  const avg=function(arr){return arr.length?arr.reduce((s,r)=>s+r.t,0)/arr.length:0;};
  const stageAcc={};
  last.forEach(r=>{
    const stages=(r.analysis&&r.analysis.stages)||[];
    stages.forEach(s=>{
      if(!stageAcc[s.name])stageAcc[s.name]={ms:0,n:0};
      stageAcc[s.name].ms+=s.ms;stageAcc[s.name].n++;
    });
  });
  const stageAvg={};
  Object.keys(stageAcc).forEach(k=>{stageAvg[k]=stageAcc[k].ms/stageAcc[k].n;});
  const targets=method==="cfop"?CFOP_TARGET:LBL_TARGET;
  const weaknesses=[];
  Object.keys(stageAvg).forEach(k=>{
    const tgt=targets[k];
    const over=tgt!=null?stageAvg[k]-tgt:0;
    const share=last.length&&avg(last)?stageAvg[k]/avg(last):0;
    weaknesses.push({stage:k,avgMs:stageAvg[k],target:tgt,over,share});
  });
  weaknesses.sort((a,b)=> (b.over||0)-(a.over||0) || (b.share||0)-(a.share||0));
  const firstAvg=avg(firstDayRecs);
  const nowAvg=avg(last);
  return {
    n:last.length,
    sessionN:recs.length,
    avgMs:nowAvg,
    firstDayAvg:firstAvg,
    improvedMs:firstAvg&&nowAvg?firstAvg-nowAvg:0,
    stageAvg,
    weaknesses:weaknesses.slice(0,3),
    targets
  };
}

function syncPayload(analysis,ctx){
  ctx=ctx||{};
  const a=analysis||{};
  const details={
    time:a.timeMs||0,
    splits:(a.stages||[]).map(s=>({name:s.name,ms:s.ms,moves:s.moves,tps:s.tps,pauses:s.pauses,optimal:s.optimal})),
    moves:a.moveCount||0,
    tps:a.tps||0,
    pauses:a.pauseCount||0,
    pauseMs:a.pauseMs||0,
    weakness:a.weakness&&a.weakness.type||"",
    drill:a.drill||(a.weakness&&a.weakness.drill)||"",
    feedback:a.feedback||""
  };
  return {
    child:ctx.child||"ethan",
    page:ctx.page||"cube",
    path:ctx.path||"/ethan/cube/",
    date:ctx.date||dayKey(),
    kind:ctx.kind||"cube",
    score:ctx.score!=null?ctx.score:"",
    total:ctx.total!=null?ctx.total:"",
    firstTryAccuracy:"",
    timeTakenSec:a.timeMs?Math.round(a.timeMs/10)/100:"",
    topics:details.weakness||"",
    mistakes:details.drill||"",
    sentAt:ctx.sentAt||new Date().toISOString(),
    lesson:"cube",
    details:JSON.stringify(details)
  };
}

function embedUrlFor(video){
  if(!video||!video.id)return "";
  const start=video.start?("&start="+video.start):"";
  /* Plain youtube.com/embed is the github.io-safe default; nocookie is offered as an alternate. */
  return "https://www.youtube.com/embed/"+video.id+"?rel=0"+start;
}
function nocookieUrlFor(video){
  if(!video||!video.id)return "";
  const start=video.start?("&start="+video.start):"";
  return "https://www.youtube-nocookie.com/embed/"+video.id+"?rel=0"+start;
}
function watchUrlFor(video){
  if(!video)return "";
  if(video.url)return video.url;
  if(video.id)return "https://www.youtube.com/watch?v="+video.id;
  return "";
}
function allLessonVideos(){
  const seen={};
  const out=[];
  Object.keys(DRILL_VIDEOS).forEach(k=>{
    const v=DRILL_VIDEOS[k];
    if(!v||!v.id||seen[v.id])return;
    seen[v.id]=1;
    out.push(Object.assign({key:k,skill:skillForVideo(v)},v));
  });
  return out;
}
function skillForVideo(v){
  const d=(v&&v.drills)||[];
  if(d.indexOf("lookahead")>=0||d.indexOf("metronome")>=0)return "Look-ahead";
  if(d.indexOf("crossPlan")>=0||d.indexOf("cross")>=0)return "Cross";
  if(d.indexOf("f2l")>=0)return "F2L";
  if(d.indexOf("fingerTricks")>=0)return "Finger tricks";
  if(d.indexOf("lastLayer")>=0||d.indexOf("oll")>=0||d.indexOf("pll")>=0)return "Last layer";
  return "Beginner";
}


function linearFitElapsed(moveList){
  const pts=(moveList||[]).filter(m=>m&&m.localTimestamp!=null&&m.cubeTimestamp!=null&&isFinite(m.localTimestamp)&&isFinite(m.cubeTimestamp));
  if(pts.length>=2){
    const n=pts.length;
    let sx=0,sy=0,sxy=0,sx2=0;
    pts.forEach(p=>{sx+=p.localTimestamp;sy+=p.cubeTimestamp;sxy+=p.localTimestamp*p.cubeTimestamp;sx2+=p.localTimestamp*p.localTimestamp;});
    const den=n*sx2-sx*sx;
    if(Math.abs(den)>1e-6){
      const b=(n*sxy-sx*sy)/den,a=(sy-b*sx)/n;
      const first=pts[0],last=pts[pts.length-1];
      const t0=a+b*first.localTimestamp,t1=a+b*last.localTimestamp;
      const el=t1-t0;
      if(isFinite(el)&&el>=0)return el;
    }
    const el=pts[pts.length-1].cubeTimestamp-pts[0].cubeTimestamp;
    if(isFinite(el)&&el>=0)return el;
  }
  const withCube=(moveList||[]).filter(m=>m&&m.cubeTimestamp!=null);
  if(withCube.length>=2){
    const el=withCube[withCube.length-1].cubeTimestamp-withCube[0].cubeTimestamp;
    if(isFinite(el)&&el>=0)return el;
  }
  const withLoc=(moveList||[]).filter(m=>m&&m.localTimestamp!=null);
  if(withLoc.length>=2){
    const el=withLoc[withLoc.length-1].localTimestamp-withLoc[0].localTimestamp;
    if(isFinite(el)&&el>=0)return el;
  }
  return null;
}

function validMac(s){
  const m=String(s||"").trim().toUpperCase().replace(/-/g,":").replace(/\s+/g,"");
  if(/^[0-9A-F]{12}$/.test(m))return m.replace(/(..)(?=.)/g,"$1:");
  if(/^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/.test(m))return m;
  return "";
}

function clampScrambleLen(n){
  n=Math.round(Number(n));
  if(!isFinite(n))return 13;
  return Math.max(8,Math.min(20,n));
}
function randomMoveScramble(rng,len){
  rng=typeof rng==="function"?rng:Math.random;
  const n=clampScrambleLen(len==null?13:len);
  const faces=FACES.split(""),opp={U:"D",D:"U",R:"L",L:"R",F:"B",B:"F"};
  const suf=["","'","2"];
  const out=[];let last="",last2="",guard=0;
  while(out.length<n&&guard++<4000){
    const f=faces[Math.floor(rng()*6)%6];
    if(f===last)continue;
    if(last2&&f===last2&&opp[f]===last)continue;
    out.push(f+suf[Math.floor(rng()*3)%3]);
    last2=last;last=f;
  }
  return out.join(" ");
}

/* ---- SVG net (always available, no CDN) ---- */
function svgNet(facelets,size){
  facelets=facelets||SOLVED;size=size||240;
  const u=size/12,gap=u*0.12,cell=u*1.15;
  const faceXY={U:[3,0],L:[0,3],F:[3,3],R:[6,3],B:[9,3],D:[3,6]};
  let x0=Infinity,y0=Infinity,x1=0,y1=0,rects="";
  FACES.split("").forEach((f,fi)=>{
    const [cx,cy]=faceXY[f];
    for(let r=0;r<3;r++)for(let c=0;c<3;c++){
      const i=fi*9+r*3+c,col=COL[facelets[i]]||"#888";
      const x=(cx+c)*cell,y=(cy+r)*cell;
      x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+cell);y1=Math.max(y1,y+cell);
      const s=COL_STROKE[facelets[i]]||"#111";
      rects+=`<rect x="${(x+gap).toFixed(1)}" y="${(y+gap).toFixed(1)}" width="${(cell-gap*2).toFixed(1)}" height="${(cell-gap*2).toFixed(1)}" rx="${(gap*1.4).toFixed(1)}" fill="${col}" stroke="${s}" stroke-width="0.8"/>`;
    }
  });
  const pad=4,w=x1-x0+pad*2,h=y1-y0+pad*2;
  return `<svg viewBox="${(x0-pad).toFixed(1)} ${(y0-pad).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}" width="${size}" height="${(size*h/w).toFixed(0)}" aria-hidden="true">${rects}</svg>`;
}

/* ---- storage ---- */
function defState(){
  return {v:1,mac:"",splitsMode:"lbl",llMethod:"beginner",inspect:true,sound:true,scrambleLen:13,solves:[],days:{},session:null,points:0,stars:0,bestStreak:0,pb:null};
}
function loadRaw(ls){
  ls=ls||(typeof localStorage!=="undefined"?localStorage:null);
  try{const s=Object.assign(defState(),JSON.parse((ls&&ls.getItem(STORE))||"{}"));if(!Array.isArray(s.solves))s.solves=[];if(!s.days)s.days={};return s;}catch(e){return defState();}
}
function saveRaw(S,ls){
  ls=ls||(typeof localStorage!=="undefined"?localStorage:null);
  try{if(ls)ls.setItem(STORE,JSON.stringify(S));}catch(e){}
}

function resultsSyncUrl(){
  if(typeof window!=="undefined"&&Object.prototype.hasOwnProperty.call(window,"KIDS_HUB_RESULTS_SYNC_URL"))return window.KIDS_HUB_RESULTS_SYNC_URL||"";
  return (typeof RESULTS_SYNC_URL==="string"&&RESULTS_SYNC_URL)||"";
}
function syncCubeSession(payload){
  try{
    const url=resultsSyncUrl();
    if(!url||!payload)return false;
    const body=JSON.stringify(payload);
    if(typeof fetch==="function")fetch(url,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body}).catch(()=>{});
    return body;
  }catch(e){return false;}
}

function newId(now){return "s"+now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}

/* ---- app controller ---- */
function createApp(opts){
  opts=opts||{};
  const now=opts.now||(()=> (typeof performance!=="undefined"&&performance.now)?performance.now()+ (performance.timeOrigin||0):Date.now());
  const wall=opts.wall||(()=>Date.now());
  const ls=opts.localStorage||null;
  let S=loadRaw(ls);
  const listeners=[];
  const emit=()=>{const v=view();listeners.forEach(fn=>{try{fn(v);}catch(e){}});};
  let facelets=SOLVED,tracker=createTracker(""),phase="idle";
  let connected=false,battery=null,deviceName="",deviceMAC=S.mac||"";
  let inspectLeft=0,inspectTimer=null,inspectStartedAt=0;
  let run=null; /* current attempt */
  let celebration=null,ios=false,lastSyncBody=null,lastError="";
  let hold=null; /* manual stackmat hold */
  let lastSolveRec=null, nextAt=0;
  let calibCubies=null, resetNote="", resetLog=[], pendingResetConfirm=false;

  function settings(){return {splitsMode:S.splitsMode||"lbl",llMethod:S.llMethod==="cfop4look"?"cfop4look":"beginner",inspect:S.inspect!==false,sound:S.sound!==false,mac:S.mac||"",scrambleLen:clampScrambleLen(S.scrambleLen==null?13:S.scrambleLen)};}
  function save(){saveRaw(S,ls);}
  function setSetting(k,val){
    if(k==="splitsMode")S.splitsMode=val==="cfop"?"cfop":"lbl";
    else if(k==="llMethod")S.llMethod=val==="cfop4look"?"cfop4look":"beginner";
    else if(k==="inspect")S.inspect=!!val;
    else if(k==="sound")S.sound=!!val;
    else if(k==="mac")S.mac=validMac(val);
    else if(k==="scrambleLen")S.scrambleLen=clampScrambleLen(val);
    save();emit();
  }
  function setMac(m){S.mac=validMac(m);deviceMAC=S.mac;save();emit();return S.mac;}

  let coach=null;
  function currentLlMethod(){return S.llMethod==="cfop4look"?"cfop4look":"beginner";}
  function detectLLFor(f){return currentLlMethod()==="cfop4look"?detect4LookLL(f):detectBeginnerLL(f);}
  function startStageCoachFrom(f){
    const stage=run&&run.drillStage?run.drillStage:null;
    const d=detectStageCoach(f,stage);
    coach={active:true,kind:stage,method:"tips",phase:d.done?"done":"tip",detect:d,tracker:null,algStart:f,stepStartedAt:now(),repStartedAt:now(),stepTimes:[],oops:"",guard:"",summary:null,yellowTop:false};
  }
  function startLLCoachFrom(f,keepTimes){
    const d=detectLLFor(f);
    const times=(keepTimes&&coach&&coach.stepTimes)?coach.stepTimes.slice():[];
    const repStartedAt=(keepTimes&&coach&&coach.repStartedAt)?coach.repStartedAt:now();
    const phase=d.done||d.stage==="solved"?"done":((d.hold&&d.hold!==0)||d.stage==="auf"||!d.alg)?"hold":"alg";
    coach={active:true,kind:"lastLayer",method:currentLlMethod(),phase:phase,detect:d,tracker:null,algStart:f,stepStartedAt:now(),repStartedAt:repStartedAt,stepTimes:times,oops:"",guard:"",summary:null,yellowTop:true};
    if(phase==="alg"&&d.cubeAlg&&d.cubeAlg.length){
      coach.tracker=createTracker(d.cubeAlg,f);
      coach.algStart=f;
    }
    if(phase==="done"){
      coach.summary=coachSummaryText(coach.stepTimes,now()-coach.repStartedAt);
    }
  }
  function maybeStartCoach(){
    const kind=currentKind();
    const stage=(run&&run.drillStage)?run.drillStage:null;
    if(kind!=="drill"||!stage){coach=null;return;}
    const raw=stage;
    const bucket=drillBucket(stage);
    if(raw==="crossPlan"||bucket==="cross"||bucket==="crossPlan"||bucket==="f2l"||bucket==="lookahead"||bucket==="metronome"){
      startStageCoachFrom(facelets);
      if(coach&&raw==="crossPlan")coach.planMode=true;
      if(coach&&(bucket==="lookahead"||bucket==="metronome"))coach.metronome=true;
      return;
    }
    if(bucket==="fingerTricks"){startLLCoachFrom(facelets,false);return;}
    startLLCoachFrom(facelets,false);
  }
  function recordCoachStep(prev){
    if(!coach||!prev||!prev.stage||prev.stage==="solved")return;
    const ms=Math.max(0,now()-(coach.stepStartedAt||now()));
    coach.stepTimes.push({stage:prev.stage,caseId:prev.caseId,name:prev.title,ms:ms});
  }
  function closeCoachSolved(f){
    if(!coach)return;
    if(coach.phase!=="done"&&coach.detect&&coach.detect.stage!=="solved")recordCoachStep(coach.detect);
    const d=coach.kind==="lastLayer"?detectLLFor(f||facelets):detectStageCoach(f||facelets,coach.kind);
    d.lead="Done!";
    coach.detect=d;
    coach.phase="done";
    coach.tracker=null;
    coach.oops="";
    coach.summary=coachSummaryText(coach.stepTimes,now()-(coach.repStartedAt||now()));
  }
  function completeCoachStep(f){
    if(!coach||!coach.active)return;
    const prev=coach.detect;
    recordCoachStep(prev);
    if(coach.kind==="cross"||coach.kind==="f2l"){
      const d=detectStageCoach(f,coach.kind);
      coach.detect=d;
      coach.stepStartedAt=now();
      if(d.done)closeCoachSolved(f);
      return;
    }
    const d=detectLLFor(f);
    if(prev&&d&&prev.stage===d.stage&&!d.done)d.lead="Repeat once more.";
    else if(d&&d.stage==="orient-corners")d.lead="Now orient the corners.";
    else if(d&&d.stage==="perm-corners")d.lead="Now position the corners.";
    else if(d&&d.stage==="perm-edges")d.lead="Now position the edges.";
    else if(d&&d.stage==="pll")d.lead="Now permute the last layer.";
    else if(d&&d.stage==="auf")d.lead="Almost there.";
    else if(d&&(d.stage==="solved"||d.done))d.lead="Done!";
    if(d.stage==="solved"||d.done){
      coach.detect=d;coach.phase="done";coach.tracker=null;coach.oops="";
      coach.summary=coachSummaryText(coach.stepTimes,now()-(coach.repStartedAt||now()));
      return;
    }
    coach.detect=d;
    coach.stepStartedAt=now();
    coach.oops="";
    coach.guard="";
    const phase=((d.hold&&d.hold!==0)||d.stage==="auf"||!d.alg)?"hold":"alg";
    coach.phase=phase;
    coach.tracker=null;
    if(phase==="alg"&&d.cubeAlg&&d.cubeAlg.length){
      coach.tracker=createTracker(d.cubeAlg,f);
      coach.algStart=f;
    }
  }
  function onCoachEvent(move,f,serial){
    if(!coach||!coach.active)return;
    if(coach.kind==="cross"||coach.kind==="f2l"){
      const d=detectStageCoach(f,coach.kind);
      if(d.done&&coach.detect&&!coach.detect.done)recordCoachStep(coach.detect);
      coach.detect=d;
      if(d.done){coach.phase="done";coach.summary=coachSummaryText(coach.stepTimes,now()-(coach.repStartedAt||now()));}
      return;
    }
    if(coach.kind!=="lastLayer")return;
    const fresh=detectLLFor(f);
    if(fresh.stage==="solved"||fresh.done){
      if(coach.phase!=="done")closeCoachSolved(f);
      return;
    }
    if(coach.phase==="hold"||coach.phase==="tip"){
      const lead=coach.detect&&coach.detect.lead;
      if(lead&&!fresh.lead)fresh.lead=lead;
      coach.detect=fresh;
      if(fresh.stage==="auf"){coach.phase="hold";return;}
      if((!fresh.hold||fresh.hold===0)&&fresh.alg){
        coach.phase="alg";
        coach.tracker=createTracker(fresh.cubeAlg,f);
        coach.algStart=f;
      }
      return;
    }
    if(coach.phase==="alg"&&coach.tracker){
      let t;
      if(move&&serial!=null&&serial===lastFaceletsSerial){
        /* FACELETS already updated the coach tracker for this serial; the MOVE is the companion (same X2 1/2 handling as the scramble). */
        t=coach.tracker.get();
      }else if(move){
        t=coach.tracker.apply(move,{serial:serial,source:"move"});
      }else{
        t=coach.tracker.setState(f,{serial:serial,source:"facelets"});
      }
      recordJudgeEvent({type:move?"COACH_MOVE":"COACH_FACELETS",move:move||"",serial:serial,facelets:f,localState:t.state,expectedStep:t.current,k:t.k,judged:t.judgedKind,result:judgeResultOf(t)});
      const end=applyAlg(coach.algStart,coach.detect.cubeAlg||[]);
      if(t.done||eq(f,end)){clearCoachOff();coach.oops="";completeCoachStep(f);return;}
      if(t.fixup||t.confirmedOff){
        applyCoachOops(t);
        return;
      }
      if(t.offPending){
        scheduleCoachOffConfirm();
        return;
      }
      clearCoachOff();
      if(faceletsOnAlgPath(f,coach.algStart,coach.detect.cubeAlg||[]))coach.oops="";
    }
  }
  function coachNextCase(){
    if(coach&&coach.kind==="lastLayer"&&!isSolved(facelets)){
      coach.guard="Solve the cube first (or press My cube is solved), then I'll give you a new case.";
      abortTimer({keepCoach:true});
      phase="wait";
      emit();
      return {ok:false,guard:coach.guard};
    }
    if(coach)coach.guard="";
    const scr=newScramble();
    return {ok:true,scramble:scr};
  }
  function coachView(){
    if(!coach||!coach.active)return null;
    const t=coach.tracker&&coach.tracker.get();
    const d=coach.detect||{};
    const curCube=t&&t.current;
    const curDisp=curCube?((mapAlgX2(curCube)||[])[0]||curCube):"";
    return {
      active:true,kind:coach.kind,method:coach.method,phase:coach.phase,
      title:d.title||"",caseId:d.caseId||"",caseName:d.caseName||"",stage:d.stage||"",
      hold:d.hold||0,holdText:d.holdText||"",holdAlg:d.holdAlg||"",lead:d.lead||"",tip:d.tip||"",
      alg:d.alg||"",algMoves:d.alg?parseAlg(d.alg):[],algName:d.algName||"",cubeAlg:d.cubeAlg||[],
      k:t?t.k:0,current:curDisp,currentCube:curCube||"",half:!!(t&&t.half),halfLabel:(t&&t.halfLabel)||"",
      fixup:(t&&t.fixup)||"",fixupDisplay:(t&&t.fixup)?fmtAlg(mapAlgX2(t.fixup)):"",
      oops:coach.oops||"",guard:coach.guard||"",
      stepTimes:(coach.stepTimes||[]).slice(),summary:coach.summary||null,
      yellowTop:!!coach.yellowTop,done:!!(d.done||d.stage==="solved"||coach.phase==="done"),
      metronome:!!coach.metronome,planMode:!!coach.planMode
    };
  }

  function stats(){
    const solves=S.solves||[];
    const pb=bestSingle(solves);
    const ao5=averageOf(5,solves),ao12=averageOf(12,solves);
    const today=dayKey(wall());
    const st=streakFromDays(S.days,today);
    if(st> (S.bestStreak||0))S.bestStreak=st;
    return {
      pb:pb,ao5,ao12,bestSplits:bestSplits(solves,S.splitsMode),
      streak:st,bestStreak:S.bestStreak||0,stars:S.stars||0,points:S.points||0,
      n:solves.filter(s=>s.kind!=="drill").length,
      weakest:weakestStage(solves,S.splitsMode),
      trend:solves.filter(s=>s.kind!=="drill").slice(-30).map(s=>({id:s.id,ms:isFinite(officialMs(s))?officialMs(s):null,date:s.date,penalty:s.penalty||null})),
      today:S.days[today]||null
    };
  }

  function currentKind(){
    if(S.session&&!S.session.finished){
      const p=S.session.phase;
      if(p==="warmup")return "warmup";
      if(p==="drill")return "drill";
      if(p==="ao5")return "ao5";
    }
    return "free";
  }

  function clearInspect(){
    if(inspectTimer){clearInterval(inspectTimer);inspectTimer=null;}
    inspectLeft=0;inspectStartedAt=0;
  }
  function armAfterScramble(opts){
    if(opts&&opts.fromFacelets)armedFromFacelets=true;
    else armedFromFacelets=false;
    clearInspect();
    if(S.inspect!==false){
      phase="inspect";
      inspectStartedAt=now();
      inspectLeft=15000;
      inspectTimer=setInterval(()=>{
        inspectLeft=Math.max(0,15000-(now()-inspectStartedAt));
        if(inspectLeft<=0){/* stay in inspect until first turn; WCA +2/DNF applied at start */}
        emit();
      },50);
    }else{
      phase="ready";
    }
    run=newAttempt();
    maybeStartCoach();
    emit();
  }
  function newAttempt(){
    const kind=currentKind();
    const raw=(kind==="drill"&&S.session&&S.session.drillStage)?S.session.drillStage:null;
    const drillStage=raw?drillBucket(raw):null;
    return {kind,drillStage,drillRaw:raw,scramble:fmtAlg(tracker.get().moves),started:false,moves:[],trace:[],t0:null,hostT0:null,timerHost0:null,startFacelets:facelets,splits:{},moveCount:0,penalty:null,source:connected?"cube":"manual"};
  }
  function coachingActive(){return !!(coach&&coach.active&&coach.phase!=="done");}
  function stepElapsed(){
    if(coachingActive())return Math.max(0,now()-(coach.stepStartedAt||now()));
    return 0;
  }
  function timerModeNow(){
    if(phase==="wait"||phase==="stopped"||phase==="idle"||phase==="scrambling"||phase==="needSolved")return "off";
    if(coachingActive())return "step";
    if(phase==="running"&&run&&run.started)return "solve";
    return "off";
  }
  function abortTimer(opts){
    opts=opts||{};
    clearInspect();
    if(run){run.started=false;run.timerHost0=null;}
    if(!opts.keepCoach){/* caller may keep coach */}
    if(phase==="running")phase=opts.phase||"ready";
  }
  function inspectPenalty(){
    if(phase!=="inspect"||S.inspect===false)return null;
    const used=now()-inspectStartedAt;
    if(used>17000)return "DNF";
    if(used>15000)return "+2";
    return null;
  }

  function startTimer(ts){
    if(!run||run.started)return;
    if(phase==="wait")return;
    const pen=inspectPenalty();
    clearInspect();
    run.started=true;
    run.t0=ts&&ts.cubeTimestamp!=null?ts.cubeTimestamp:null;
    run.hostT0=ts&&ts.localTimestamp!=null?ts.localTimestamp:now();
    run.timerHost0=now();
    if(!run.startFacelets)run.startFacelets=facelets;
    if(pen)run.penalty=pen;
    if(coachingActive()){
      if(phase==="inspect")phase="ready";
      emit();
      return;
    }
    phase="running";
    emit();
  }
  function elapsedNow(){
    if(phase==="wait")return 0;
    if(coachingActive())return stepElapsed();
    if(!run||!run.started)return 0;
    if(phase==="stopped"&&run.ms!=null)return run.ms;
    /* Live display must use the host clock, not cube move timestamps.
       linearFitElapsed only spans the first and last recorded turn, so after two
       turns it froze until the next move. */
    const t0=run.timerHost0;
    if(t0==null)return 0;
    return Math.max(0,now()-t0);
  }
  function markSplits(f,at,moves){
    if(!run)return;
    const mode=S.splitsMode||"lbl";
    const reached=reachedStages(f,mode);
    reached.forEach(id=>{
      if(!run.splits[id])run.splits[id]={at,moves};
    });
  }
  function stopIfDone(f,ts){
    if(!run)return false;
    const coaching=coachingActive();
    const coachJustDone=!!(coach&&coach.active&&coach.phase==="done");
    if(!run.started&&!coaching&&!coachJustDone)return false;
    if(phase!=="running"&&phase!=="wait"&&!coaching&&!coachJustDone)return false;
    const goal=run.drillStage||"solved";
    const flags=stageFlags(f);
    const done=goal==="solved"?flags.solved:(currentKind()==="drill"?drillGoalReached(f,goal):!!flags[goal]);
    if(!done)return false;
    const ms=(()=>{
      if(coaching&&coach.repStartedAt)return Math.max(0,Math.round(now()-coach.repStartedAt));
      const fit=linearFitElapsed(run.moves.concat(ts?[ts]:[]));
      if(fit!=null&&(run.moves.length>=1))return Math.max(0,Math.round(fit));
      return Math.max(0,Math.round(now()-(run.timerHost0||now())));
    })();
    if(coach&&coach.active)closeCoachSolved(f);
    finishSolve(ms,f);
    return true;
  }
  function finishSolve(ms,f){
    if(!run)return;
    phase="stopped";
    clearInspect();
    run.ms=Math.max(0,Math.round(ms));
    run.moveCount=run.moves.length;
    markSplits(f||facelets,run.ms,run.moveCount);
    const rec={
      id:newId(wall),
      date:dayKey(wall()),
      ts:wall(),
      ms:run.ms,
      penalty:run.penalty||null,
      moves:run.moveCount,
      tps:tps(run.moveCount,run.ms),
      splits:run.source==="cube"?Object.assign({},run.splits):null,
      method:S.splitsMode||"lbl",
      scramble:run.scramble,
      source:run.source||(connected?"cube":"manual"),
      kind:run.kind||"free",
      drillStage:run.drillStage||null
    };
    try{
      const t0=run.timerHost0||run.hostT0||0;
      const stamped=(run.moves||[]).map((mv,i)=>{
        if(typeof mv==="string")return {m:mv,t:null,i};
        const m=mv.move||mv.m||"";
        const at=mv.localTimestamp!=null?mv.localTimestamp:mv.t;
        return {m,t:at!=null&&t0?Math.max(0,at-t0):null,i};
      });
      const startF=run.startFacelets||(rec.scramble?applyAlg(SOLVED,parseAlg(rec.scramble)):SOLVED);
      const analysis=analyzeSolve({
        method:rec.method,timeMs:rec.ms,moves:stamped,startFacelets:startF,
        sessionLine:null
      });
      rec.startFacelets=startF;
      rec.trace=stamped.map(x=>({m:x.m,t:x.t}));
      rec.analysis={
        timeMs:analysis.timeMs,moveCount:analysis.moveCount,tps:analysis.tps,
        stages:(analysis.stages||[]).map(s=>({name:s.name,ms:s.ms,moves:s.moves,tps:s.tps,pauseMs:s.pauseMs,pauses:s.pauses,longestPause:s.longestPause,waste:s.waste,optimal:s.optimal,extra:s.extra,optimalAlg:s.optimalAlg,target:s.target,share:s.share})),
        pauseMs:analysis.pauseMs,pauseCount:analysis.pauseCount,longestPause:analysis.longestPause,
        waste:analysis.waste,biggestLoss:analysis.biggestLoss,tip:analysis.tip,
        feedback:analysis.feedback,weakness:analysis.weakness,drill:analysis.drill,targets:analysis.targets,method:analysis.method
      };
      rec.feedback=analysis.feedback;
      rec.weakness=analysis.weakness&&analysis.weakness.type||"";
    }catch(e){rec.analysis=null;}
    try{
      if(rec.analysis){
        const payload=syncPayload(rec.analysis,{child:"ethan",page:"cube",path:"/ethan/cube/",date:rec.date,kind:"cube",sentAt:new Date(wall()).toISOString()});
        lastSyncBody=syncCubeSession(payload)||JSON.stringify(payload);
      }
    }catch(e){}
    const prevPb=bestSingle(S.solves);
    S.solves.push(rec);
    const off=officialMs(rec);
    if(isFinite(off)&&(S.pb==null||off<S.pb))S.pb=off;
    const nowPb=bestSingle(S.solves);
    celebration=null;
    if(rec.kind!=="drill"&&rec.penalty!=="DNF"&&isFinite(off)&&(!prevPb||off<prevPb.ms)){
      celebration="pb";
    }
    S.points=(S.points||0)+ (rec.penalty==="DNF"?2:10)+(celebration==="pb"?20:0);
    if(celebration==="pb")S.stars=(S.stars||0)+1;
    const today=dayKey(wall());
    const d=S.days[today]||(S.days[today]={solves:0,done:false,stars:0});
    d.solves=(d.solves||0)+1;
    const st=streakFromDays(S.days,today);
    S.bestStreak=Math.max(S.bestStreak||0,st);
    save();
    afterSessionSolve(rec);
    lastSolveRec=rec;
    const sessionDone=!!(S.session&&S.session.finished);
    if(!sessionDone){
      nextAt=wall()+3000;
    }else nextAt=0;
    emit();
    return rec;
  }
  function setPenalty(id,pen){
    const s=S.solves.find(x=>x.id===id);
    if(!s)return;
    s.penalty=pen=== "+2"?"+2":pen==="DNF"?"DNF":null;
    const pb=bestSingle(S.solves);
    S.pb=pb?pb.ms:null;
    save();emit();
  }
  function deleteSolve(id){
    S.solves=S.solves.filter(x=>x.id!==id);
    const pb=bestSingle(S.solves);
    S.pb=pb?pb.ms:null;
    save();emit();
  }

  function afterSessionSolve(rec){
    const sess=S.session;
    if(!sess||sess.finished)return;
    if(sess.phase==="warmup"){
      sess.warmup=sess.warmup||[];sess.warmup.push(rec.id);
      if(sess.warmup.length>=3){
        sess.phase="drill";
        sess.drillStage=pickDrillStage(S.solves,S.splitsMode);
        sess.drill=[];
      }
    }else if(sess.phase==="drill"){
      sess.drill=sess.drill||[];sess.drill.push(rec.id);
      if(sess.drill.length>=DRILL_REPS){sess.phase="ao5";sess.ao5=[];}
    }else if(sess.phase==="ao5"){
      sess.ao5=sess.ao5||[];sess.ao5.push(rec.id);
      if(sess.ao5.length>=5)finishSession();
    }
    save();
  }
  function finishSession(){
    const sess=S.session;if(!sess||sess.finished)return;
    sess.finished=true;sess.phase="done";sess.endedAt=wall();
    const today=dayKey(wall());
    const ids=[].concat(sess.warmup||[],sess.drill||[],sess.ao5||[]);
    const recs=ids.map(id=>S.solves.find(s=>s.id===id)).filter(Boolean);
    const ao5=averageOf(5,recs.filter(s=>s.kind==="ao5").length>=5?recs.filter(s=>s.kind==="ao5"):recs);
    const pb=bestSingle(S.solves);
    const weak=weakestStage(S.solves,S.splitsMode);
    const stars=sess.ao5&&sess.ao5.length>=5?3:sess.ao5&&sess.ao5.length?2:1;
    const warmupRecs=(sess.warmup||[]).map(id=>S.solves.find(x=>x.id===id)).filter(Boolean);
    const drillRecs=(sess.drill||[]).map(id=>S.solves.find(x=>x.id===id)).filter(Boolean);
    const trend=trendFromRecords(recs,S.splitsMode);
    const lastA=(recs.slice().reverse().find(s=>s.analysis)||{}).analysis;
    const weakDrill=lastA&&lastA.weakness||{type:drillBucket(sess.drillStage||weak&&weak.id),why:""};
    const sessionLine="Today you did "+recs.length+" timed solves"+(ao5&&ao5.text?(" and your average of 5 was "+ao5.text):".")+(trend.improvedMs>400?(" That's "+formatTime(Math.round(trend.improvedMs))+" faster than your first day."):"");
    const feedback=[sessionLine];
    if(trend.weaknesses&&trend.weaknesses[0]){
      const w0=trend.weaknesses[0];
      feedback.push("You lose the most time on the "+stageLabelKid(w0.stage)+" (about "+(w0.avgMs/1000).toFixed(1)+"s, target "+((w0.target||0)/1000).toFixed(0)+"s).");
    }
    if(weakDrill&&weakDrill.why)feedback.push(weakDrill.why);
    sess.summary={
      ao5,pb,weak,stars,n:recs.length,
      warmupTimes:warmupRecs.map(s=>({ms:s.ms,penalty:s.penalty||null,text:formatTime(s.ms,s.penalty)})),
      drillReps:drillRecs.length,
      drillTarget:DRILL_REPS,
      drillStage:sess.drillStage||null,
      drillLabel:DRILL_LABEL[drillBucket(sess.drillStage)]||sess.drillStage||"",
      ao5Times:recs.filter(s=>s.kind==="ao5").map(s=>({ms:s.ms,penalty:s.penalty||null,text:formatTime(s.ms,s.penalty)})),
      feedback:feedback.filter(Boolean).join(" "),
      trend,nextDrill:weakDrill
    };
    const d=S.days[today]||(S.days[today]={solves:0,done:false,stars:0});
    d.done=true;d.stars=Math.max(d.stars||0,stars);d.ao5=ao5?ao5.text:null;
    S.stars=(S.stars||0)+stars;
    S.bestStreak=Math.max(S.bestStreak||0,streakFromDays(S.days,today));
    save();
    const times=recs.filter(s=>s.kind!=="drill").map(s=>({ms:s.ms,penalty:s.penalty||null,text:formatTime(s.ms,s.penalty),kind:s.kind,splits:s.splits||null}));
    const payload={
      child:"ethan",page:"cube",path:"ethan/cube",date:today,
      kind:"cube-session",
      times,ao5:ao5?{ms:ao5.ms,text:ao5.text,dnf:!!ao5.dnf}:null,
      pb:pb?{ms:pb.ms,text:pb.text}:null,
      splits:bestSplits(S.solves,S.splitsMode),
      weakestStage:weak.id,weakestLabel:weak.label,
      nSolves:recs.length,stars,method:S.splitsMode||"lbl",
      sentAt:new Date(wall()).toISOString()
    };
    lastSyncBody=syncCubeSession(payload)||JSON.stringify(payload);
    emit();
  }
  function startLesson(){
    S.session={date:dayKey(wall()),phase:"warmup",warmup:[],drill:[],ao5:[],drillStage:null,startedAt:wall(),finished:false};
    save();newScramble();emit();
  }
  function startTargetedDrill(type,reason){
    type=type||(lastSolveRec&&lastSolveRec.analysis&&lastSolveRec.analysis.drill)||"lastLayer";
    reason=reason||(lastSolveRec&&lastSolveRec.analysis&&lastSolveRec.analysis.weakness&&lastSolveRec.analysis.weakness.why)||"";
    const today=dayKey(wall());
    if(!S.session||S.session.finished){
      S.session={date:today,phase:"drill",warmup:[],drill:[],ao5:[],drillStage:type,drillReason:reason,startedAt:wall(),finished:false,targeted:true};
    }else{
      S.session.phase="drill";
      S.session.drillStage=type;
      S.session.drillReason=reason;
      S.session.drill=S.session.drill||[];
    }
    save();newScramble();emit();
    return type;
  }
  function skipLessonPhase(){
    const sess=S.session;if(!sess||sess.finished)return;
    if(sess.phase==="warmup"){sess.phase="drill";sess.drillStage=pickDrillStage(S.solves,S.splitsMode);sess.drill=[];}
    else if(sess.phase==="drill"){sess.phase="ao5";sess.ao5=[];}
    else if(sess.phase==="ao5")finishSession();
    save();if(S.session&&!S.session.finished)newScramble();emit();
  }
  function skipDrill(){
    const sess=S.session;if(!sess||sess.finished||sess.phase!=="drill")return;
    sess.phase="ao5";sess.ao5=sess.ao5||[];
    save();newScramble();emit();
  }
  function stopSession(){
    if(!S.session)return;
    if(!S.session.finished)finishSession();
    else emit();
  }
  function abandonLesson(){stopSession();}

  let officialScramble=[], scrambleTargetState=SOLVED, pathReady=true, pathPromise=null, faceletsGen=0;
  let lastFaceletsSerial=null, armedFromFacelets=false;
  let replanCount=0, replanMethod="", replanAt=0, replanNote=false, replanning=false;
  let offPathMoves=[], pathAnchorRemaining=null, replanTimer=null, replanGen=0;
  let offConfirmTimer=null, coachOffTimer=null;
  let debugEvents=[], lastDebugSyncAt=0;
  function bumpFacelets(){faceletsGen++;}
  function whenPathReady(){return pathPromise||Promise.resolve(fmtAlg(tracker.get().moves));}
  function clearOffConfirm(){
    if(offConfirmTimer){clearTimeout(offConfirmTimer);offConfirmTimer=null;}
  }
  function clearCoachOff(){
    if(coachOffTimer){clearTimeout(coachOffTimer);coachOffTimer=null;}
  }
  function clearReplanTimer(){
    if(replanTimer){clearTimeout(replanTimer);replanTimer=null;}
    clearOffConfirm();
  }
  function resetReplanState(){
    clearReplanTimer();
    clearCoachOff();
    replanGen++;
    offPathMoves=[];
    pathAnchorRemaining=null;
    replanning=false;
    replanNote=false;
    pathReady=true;
  }
  function judgeResultOf(t){
    if(!t)return "unknown";
    if(t.done)return "done";
    if(t.fixup||t.confirmedOff)return "red";
    if(t.stale)return "stale";
    if(t.offPending)return "off-pending";
    if(t.half)return "mid";
    if(t.on)return "ok";
    return "off";
  }
  function recordJudgeEvent(rec){
    const t=tracker&&tracker.get?tracker.get():{};
    const ev=Object.assign({
      at:wall(),
      type:rec&&rec.type||"",
      move:rec&&rec.move||"",
      serial:rec&&rec.serial,
      localTimestamp:rec&&rec.localTimestamp,
      cubeTimestamp:rec&&rec.cubeTimestamp,
      facelets:String((rec&&rec.facelets)||facelets||""),
      localState:String(t.state||facelets||""),
      expectedStep:t.current||"",
      k:t.k,
      judged:t.judgedKind||"",
      result:judgeResultOf(t),
      halfLabel:t.halfLabel||"",
      fixup:t.fixup||"",
      offPending:!!t.offPending,
      phase:phase
    }, rec||{});
    debugEvents.push(ev);
    if(debugEvents.length>60)debugEvents=debugEvents.slice(-60);
  }
  function debugLogText(){
    return debugEvents.map(e=>{
      return [e.at,e.type,e.move||"",e.serial!=null?("#"+e.serial):"",e.expectedStep,e.judged,e.result,e.halfLabel,e.fixup||"", (e.facelets||"").slice(0,12)].join(" ");
    }).join("\n");
  }
  function maybeSyncDebug(reason){
    const ts=wall();
    if(ts-lastDebugSyncAt<30000)return false;
    lastDebugSyncAt=ts;
    const t=tracker&&tracker.get?tracker.get():{};
    const payload={
      child:"ethan",
      lesson:"cube-debug",
      details:JSON.stringify({
        reason:reason||"red-error",
        at:ts,
        phase:phase,
        official:fmtAlg(officialScramble||[]),
        expected:t.current||"",
        k:t.k,
        judged:t.judgedKind||"",
        fixup:t.fixup||"",
        events:debugEvents.slice()
      })
    };
    const body=syncCubeSession(payload);
    if(body)lastSyncBody=body;
    return true;
  }
  function scheduleOffConfirm(){
    if(phase!=="scrambling")return;
    clearOffConfirm();
    const myGen=++replanGen;
    offConfirmTimer=setTimeout(()=>{
      offConfirmTimer=null;
      if(myGen!==replanGen||phase!=="scrambling")return;
      const t=tracker.confirmOff();
      recordJudgeEvent({type:"JUDGE",result:judgeResultOf(t),judged:t.judgedKind,fixup:t.fixup,expectedStep:t.current,k:t.k,facelets:facelets,localState:t.state});
      if(t.fixup||t.confirmedOff){
        maybeSyncDebug("red-error");
        emit();
        /* Re-plan after the debounce already elapsed, on the next tick so the red Fix-up is visible first. */
        setTimeout(()=>{if(myGen===replanGen&&phase==="scrambling")runReplanToTarget(myGen);},0);
      }else{
        offPathMoves=[];
        pathAnchorRemaining=tracker.remaining();
        replanning=false;
        pathReady=true;
        emit();
      }
    },400);
  }
  function flushStateJudge(){
    clearOffConfirm();
    const myGen=++replanGen;
    if(phase==="scrambling"){
      const t=tracker.confirmOff();
      recordJudgeEvent({type:"JUDGE",result:judgeResultOf(t),judged:t.judgedKind,fixup:t.fixup,expectedStep:t.current,k:t.k,facelets:facelets,localState:t.state});
      if(t.fixup||t.confirmedOff){
        maybeSyncDebug("red-error");
        setTimeout(()=>{if(replanGen===myGen&&phase==="scrambling")runReplanToTarget(myGen);},0);
      }else{
        offPathMoves=[];
        pathAnchorRemaining=tracker.remaining();
        replanning=false;
        pathReady=true;
      }
    }
    if(coach&&coach.tracker){
      const ct=coach.tracker.confirmOff();
      applyCoachOops(ct);
    }
    emit();
    return tracker.get();
  }
  function applyCoachOops(t){
    if(!coach||!t)return;
    if(!(t.fixup||t.confirmedOff)){
      if(t.on||t.done)coach.oops="";
      return;
    }
    const undo=fmtAlg(mapAlgX2(t.fixup));
    coach.oops="Oops, undo: "+undo;
    const fu=parseAlg(t.fixup);
    const f=facelets;
    const fresh=detectLLFor(f);
    if(fu.length>=4&&!faceletsOnAlgPath(f,coach.algStart,coach.detect.cubeAlg||[])){
      const prev=coach.detect;
      fresh.lead="Oops, I'll look again.";
      coach.detect=fresh;
      coach.oops="Oops, I'll look again. "+(fresh.caseName||"");
      if(!prev||fresh.stage!==prev.stage||fresh.caseId!==prev.caseId||fresh.hold!==prev.hold||fmtAlg(fresh.cubeAlg||[])!==fmtAlg(prev.cubeAlg||[])){
        const phaseC=((fresh.hold&&fresh.hold!==0)||fresh.stage==="auf"||!fresh.alg)?"hold":"alg";
        coach.phase=phaseC;
        coach.tracker=null;
        if(phaseC==="alg"&&fresh.cubeAlg&&fresh.cubeAlg.length){
          coach.tracker=createTracker(fresh.cubeAlg,f);
          coach.algStart=f;
        }
      }
    }
    maybeSyncDebug("coach-red");
  }
  function scheduleCoachOffConfirm(){
    clearCoachOff();
    coachOffTimer=setTimeout(()=>{
      coachOffTimer=null;
      if(!coach||!coach.tracker)return;
      const t=coach.tracker.confirmOff();
      applyCoachOops(t);
      emit();
    },400);
  }
  function pathReaches(from,moves,to){
    return !!(from&&to&&eq(applyAlg(from,moves||[]),to));
  }
  function undoStackPath(offMoves,remaining){
    return simplifyAlg((invertAlg(offMoves||[])).concat(parseAlg(remaining||[])));
  }
  function adoptPath(moves,opts){
    opts=opts||{};
    moves=simplifyAlg(moves||[]);
    pathReady=true;
    replanning=false;
    clearReplanTimer();
    offPathMoves=[];
    pathAnchorRemaining=moves.slice();
    tracker=createTracker(moves,facelets,scrambleTargetState);
    const t=tracker.setState(facelets);
    if(opts.method){
      replanMethod=opts.method;
      replanAt=Date.now();
      replanCount++;
      replanNote=true;
    }
    if(t.done||eq(facelets,scrambleTargetState))armAfterScramble();
    else phase="scrambling";
    emit();
    return fmtAlg(tracker.get().moves);
  }
  function inHalfTurn(t){
    t=t||tracker.get();
    return !!(t&&!t.fixup&&t.on&&!t.offPending&&(t.partial>0||t.half));
  }
  function scheduleReplanToTarget(){
    if(phase!=="scrambling")return;
    if(eq(facelets,scrambleTargetState)){resetReplanState();tracker.setState(facelets);armAfterScramble();return;}
    const t=tracker.get();
    /* Mid X2 (including a slow pause, or X then X' back to the start of that move) is never off-path. */
    if(inHalfTurn(t)||(!t.fixup&&t.on&&t.current&&t.current[1]==="2"&&!t.partial&&offPathMoves.length&&offPathMoves[offPathMoves.length-1]&&offPathMoves[offPathMoves.length-1][0]===t.current[0])){
      clearReplanTimer();
      offPathMoves=[];
      pathAnchorRemaining=tracker.remaining();
      replanning=false;
      pathReady=true;
      return;
    }
    if(!t.fixup&&t.on){ /* back on the current path */
      clearReplanTimer();
      offPathMoves=[];
      pathAnchorRemaining=tracker.remaining();
      replanning=false;
      pathReady=true;
      return;
    }
    const myGen=++replanGen;
    const delay=400;
    const needSolver=offPathMoves.length>=2||(!offPathMoves.length);
    if(needSolver){replanning=true;pathReady=false;emit();}
    clearReplanTimer();
    replanTimer=setTimeout(()=>{replanTimer=null;runReplanToTarget(myGen);},delay);
  }
  function runReplanToTarget(gen){
    if(gen!==replanGen||phase!=="scrambling")return;
    if(eq(facelets,scrambleTargetState)){resetReplanState();tracker.setState(facelets);armAfterScramble();return;}
    const t=tracker.get();
    if(inHalfTurn(t)){clearReplanTimer();offPathMoves=[];replanning=false;pathReady=true;emit();return;}
    if(!t.fixup&&t.on){offPathMoves=[];pathAnchorRemaining=tracker.remaining();replanning=false;pathReady=true;emit();return;}
    const remaining=pathAnchorRemaining!=null?pathAnchorRemaining.slice():tracker.remaining();
    const inversePath=offPathMoves.length===1?simplifyAlg([invertMove(offPathMoves[0])].concat(remaining)):null;
    if(inversePath&&pathReaches(facelets,inversePath,scrambleTargetState)){
      adoptPath(inversePath,{method:"inverse"});
      return;
    }
    const fallback=()=>{
      let stack=undoStackPath(offPathMoves,remaining);
      if(!pathReaches(facelets,stack,scrambleTargetState)){
        const short=solveFromToSync(facelets,scrambleTargetState,4);
        if(short&&pathReaches(facelets,short,scrambleTargetState))stack=short;
      }
      if(!pathReaches(facelets,stack,scrambleTargetState)){
        /* Last resort: still show the undo-stack so he has something to follow. */
        stack=undoStackPath(offPathMoves,remaining);
      }
      adoptPath(stack,{method:"undo-stack"});
    };
    const from=facelets, to=scrambleTargetState;
    replanning=true;pathReady=false;emit();
    const timeout=new Promise(resolve=>setTimeout(()=>resolve(null),3000));
    const work=Promise.resolve().then(()=>solveFromTo(from,to)).catch(()=>null);
    const p=Promise.race([work,timeout]).then(path=>{
      if(gen!==replanGen||phase!=="scrambling")return path||[];
      if(eq(facelets,scrambleTargetState)){resetReplanState();tracker.setState(facelets);armAfterScramble();return path||[];}
      const nowT=tracker.get();
      if(!nowT.fixup&&nowT.on){offPathMoves=[];pathAnchorRemaining=tracker.remaining();replanning=false;pathReady=true;emit();return path||[];}
      const use=path&&pathReaches(from,path,to)?parseAlg(path):null;
      /* Facelets may have moved during the wait; re-check from the latest state. */
      const fromNow=facelets;
      const useNow=use&&pathReaches(fromNow,use,to)?use:null;
      if(useNow)adoptPath(useNow,{method:"solver"});
      else fallback();
      return useNow||[];
    }).catch(()=>{
      if(gen!==replanGen||phase!=="scrambling")return [];
      fallback();
      return [];
    });
    pathPromise=p;
    return p;
  }
  let scrambleStart=SOLVED, scrambleTouched=false;
  function startScrambleFromCurrent(){
    scrambleStart=facelets;
    scrambleTargetState=applyAlg(scrambleStart,officialScramble);
    replanCount=0;replanMethod="";replanAt=0;
    scrambleTouched=false;
    resetReplanState();
    pathReady=true;
    pathPromise=Promise.resolve(fmtAlg(officialScramble));
    tracker=createTracker(officialScramble,scrambleStart,scrambleTargetState);
    pathAnchorRemaining=officialScramble.slice();
    const t=tracker.setState(facelets);
    if(t.done||eq(facelets,scrambleTargetState))armAfterScramble();
    else phase="scrambling";
    emit();
    return fmtAlg(officialScramble);
  }
  function beginOfficialScramble(opts){return startScrambleFromCurrent(opts);}
  function newScramble(alg,opts){
    opts=opts||{};
    coach=null;
    clearInspect();
    if(!opts.keepCelebration)celebration=null;
    run=null;
    nextAt=0;
    if(phase==="running"||phase==="wait"||phase==="inspect"||phase==="ready")phase="idle";
    const sess=S.session;
    const useDrill=!alg&&sess&&!sess.finished&&sess.phase==="drill";
    const official=parseAlg(alg||(useDrill?randomDrillScramble(sess.drillStage):randomMoveScramble(null,S.scrambleLen)));
    officialScramble=official;
    if(!connected&&!opts.keepFacelets)facelets=SOLVED;
    bumpFacelets();
    return startScrambleFromCurrent();
  }
  function setScramble(alg){return newScramble(alg);}
  function skipScramble(){return newScramble();}
  /* Leave a scramble early and start the solve from the current state. Ends when the cube is solved. */
  function startSolveAnyway(){
    if(phase!=="scrambling"&&phase!=="idle"&&phase!=="needSolved")return;
    resetReplanState();
    armAfterScramble();
  }
  function proceedToNextScramble(){
    if(phase!=="stopped")return;
    nextAt=0;
    const keep=celebration;
    const src=run&&run.source;
    if(!connected||src==="manual")facelets=SOLVED;
    newScramble(null,{keepCelebration:true,keepFacelets:!!connected&&src==="cube"});
    if(keep)celebration=keep;
    emit();
  }
  function tickNext(){
    if(phase==="stopped"&&nextAt&&wall()>=nextAt)proceedToNextScramble();
  }
  function nextIn(){
    if(phase!=="stopped"||!nextAt)return 0;
    return Math.max(0,nextAt-wall());
  }

  function onMove(evt){
    /* Prefer gan-web-bluetooth's `move` string; fall back to face+direction (0=CW, 1=CCW). */
    const m=moveFromEvent(evt);
    if(!m)return;
    const ts={
      move:m,
      localTimestamp:evt&&evt.localTimestamp!=null?evt.localTimestamp:(now()),
      cubeTimestamp:evt&&evt.cubeTimestamp!=null?evt.cubeTimestamp:null
    };
    const tBefore=phase==="scrambling"?tracker.get():null;
    const beforeF=facelets;
    const alreadyMid=!!(tBefore&&tBefore.current&&tBefore.current[1]==="2"&&tBefore.partial>0&&tBefore.dir===m);
    const evSerial=evt&&evt.serial;
    if(!alreadyMid){
      if(!(evt&&evt.facelets&&evt.facelets.length===54)){
        const skipApply=(phase==="inspect"||phase==="ready"||phase==="running"||phase==="wait")&&evSerial!=null&&evSerial===lastFaceletsSerial;
        if(!skipApply)facelets=applyMove(facelets,m);
      }
    }
    if(evt&&evt.facelets&&evt.facelets.length===54)facelets=applyCalibFacelets(evt.facelets);
    if(phase==="needSolved")phase="scrambling";
    if(phase==="scrambling"){
      scrambleTouched=true;
      if(eq(facelets,scrambleTargetState)){resetReplanState();tracker.setState(facelets);armAfterScramble();return tracker.get();}
      const before=tracker.get();
      const wasOn=!before.fixup&&!!before.on&&!before.offPending;
      if(wasOn)pathAnchorRemaining=tracker.remaining();
      /* MOVE events only drive animation and highlighting. They must never confirm a red error or a re-plan by themselves. */
      const t=tracker.apply(m,{serial:evSerial,source:"move"});
      recordJudgeEvent({type:"MOVE",move:m,serial:evSerial,localTimestamp:ts.localTimestamp,cubeTimestamp:ts.cubeTimestamp,facelets:facelets,localState:t.state,expectedStep:t.current,k:t.k,judged:t.judgedKind,result:judgeResultOf(t)});
      if(inHalfTurn(t)&&tBefore&&t.k===tBefore.k&&t.partial>0){
        if(eq(facelets,applyMove(t.state,m)))facelets=t.state;
        else if(tBefore.partial===0&&eq(applyMove(beforeF,m),facelets)&&!eq(beforeF,t.state))facelets=beforeF;
      }
      if(t.done||eq(facelets,scrambleTargetState)){resetReplanState();armAfterScramble();return t;}
      if(!t.fixup&&(inHalfTurn(t)||(t.on&&!t.offPending))){
        offPathMoves=[];
        pathAnchorRemaining=tracker.remaining();
        clearReplanTimer();
        replanGen++;
        replanning=false;
        pathReady=true;
        replanNote=false;
        emit();
      }else{
        if(wasOn)offPathMoves=[m];
        else offPathMoves=offPathMoves.concat(m);
        replanNote=false;
        /* Debounce ~400ms with no new event before showing red or re-planning. */
        scheduleOffConfirm();
        emit();
      }
      return t;
    }
    if(phase==="inspect"||phase==="ready"||phase==="wait"){
      recordJudgeEvent({type:"MOVE",move:m,serial:evSerial,localTimestamp:ts.localTimestamp,cubeTimestamp:ts.cubeTimestamp,facelets:facelets,localState:facelets});
      const serial=evt&&evt.serial;
      if(armedFromFacelets&&serial!=null&&serial===lastFaceletsSerial){
        armedFromFacelets=false;
        emit();
        return;
      }
      armedFromFacelets=false;
      if(!run)run=newAttempt();
      run.source="cube";
      run.moves.push(ts);
      startTimer(ts);
      markSplits(facelets,0,0);
      onCoachEvent(m,facelets,evt&&evt.serial);
      if(phase==="wait"&&coach&&isSolved(facelets))coach.guard="";
      if(stopIfDone(facelets,ts))return;
      emit();return;
    }
    if(phase==="running"&&run){
      recordJudgeEvent({type:"MOVE",move:m,serial:evSerial,localTimestamp:ts.localTimestamp,cubeTimestamp:ts.cubeTimestamp,facelets:facelets,localState:facelets});
      run.moves.push(ts);
      run.moveCount=run.moves.length;
      const el=elapsedNow();
      markSplits(facelets,Math.round(el),run.moveCount);
      onCoachEvent(m,facelets,evt&&evt.serial);
      if(stopIfDone(facelets,ts))return;
      emit();
    }else emit();
  }
  function onFacelets(f,state,serial){
    if(f&&typeof f==="object"&&!Array.isArray(f)&&f.facelets){serial=f.serial!=null?f.serial:serial;state=f.state||state;f=f.facelets;}
    if(serial!=null)lastFaceletsSerial=serial;
    if(!f||f.length!==54)return;
    if(pendingResetConfirm)confirmResetFacelets(f,state);
    facelets=applyCalibFacelets(f,state);
    if(state&&state.CP&&!cubiesFromFacelets(f)){/* keep string even if conversion fails */}
    if(phase==="needSolved")phase="scrambling";
    if(phase==="scrambling"){
      if(eq(facelets,scrambleTargetState)){resetReplanState();tracker.setState(facelets,{serial:serial,source:"facelets"});armAfterScramble({fromFacelets:true});return;}
      const t=tracker.setState(facelets,{serial:serial,source:"facelets"});
      recordJudgeEvent({type:"FACELETS",move:"",serial:serial,facelets:facelets,localState:t.state,expectedStep:t.current,k:t.k,judged:t.judgedKind,result:judgeResultOf(t)});
      if(t.done){resetReplanState();armAfterScramble({fromFacelets:true});return;}
      /* First FACELETS often arrives after a scramble was shown from a default (solved) snapshot. Re-base F0/T from the real cube if he hasn't started yet. Do not rebase after a re-plan (new path starts at k=0 from a non-F0 state). */
      const first=(tracker.moves&&tracker.moves[0])||officialScramble[0];
      const midOfFirst=!!(first&&first[1]==="2"&&(eq(facelets,applyMove(scrambleStart,first[0]))||eq(facelets,applyMove(scrambleStart,first[0]+"'"))||eq(facelets,applyMove(scrambleStart,first))));
      if(!scrambleTouched&&t.k===0&&!t.partial&&!t.fixup&&!t.stale&&facelets!==scrambleStart&&!midOfFirst&&replanCount===0&&offPathMoves.length===0&&!replanTimer&&!offConfirmTimer&&fmtAlg(t.moves)===fmtAlg(officialScramble)){
        startScrambleFromCurrent();
        return;
      }
      if(t.stale||(!t.fixup&&(inHalfTurn(t)||(t.on&&!t.offPending)))){
        offPathMoves=[];
        pathAnchorRemaining=tracker.remaining();
        clearReplanTimer();
        replanGen++;
        replanning=false;
        pathReady=true;
      }else{
        scheduleOffConfirm();
      }
      emit();
      return;
    }
    if((phase==="inspect"||phase==="ready")&&eq(facelets,SOLVED)&&run&&!run.started){
      /* ignore; wait for a move or a later solved-after-solve path */
    }
    if(phase!=="scrambling"){
      recordJudgeEvent({type:"FACELETS",move:"",serial:serial,facelets:facelets,localState:facelets});
    }
    if(phase==="inspect"||phase==="ready"||phase==="running"||phase==="wait"){
      onCoachEvent(null,facelets,serial);
      if(phase==="wait"&&coach&&isSolved(facelets))coach.guard="";
    }
    if((phase==="running"||phase==="wait"||coachingActive()||(coach&&coach.active))&&run){
      markSplits(facelets,Math.round(elapsedNow()),run.moves.length);
      if(stopIfDone(facelets,null))return;
    }
    emit();
  }
  function applyCalibFacelets(f,state){
    if(!calibCubies||!f)return f;
    let reported=null;
    if(state&&state.CP&&state.EP)reported={cp:state.CP,co:state.CO,ep:state.EP,eo:state.EO};
    else reported=cubiesFromFacelets(f);
    if(!reported)return f;
    const tru=mulCubies(invertCubies(calibCubies),reported);
    return faceletsFromCubies(tru)||f;
  }
  function logReset(msg){
    resetLog=(resetLog||[]).concat(msg);
    if(resetLog.length>12)resetLog=resetLog.slice(-12);
  }
  function beginResetConfirm(){pendingResetConfirm=true;}
  function confirmResetFacelets(f,state){
    pendingResetConfirm=false;
    const solved=isSolved(f);
    logReset("reset: facelets solved="+(solved?"yes":"no"));
    if(solved){
      calibCubies=null;
      logReset("reset: calibration cleared");
      return {applied:false,solved:true};
    }
    const c=cubiesFromFacelets(f)||(state&&state.CP?{cp:state.CP,co:state.CO,ep:state.EP,eo:state.EO}:null);
    if(!c){logReset("reset: calibration skipped (bad state)");return {applied:false,solved:false};}
    calibCubies=c;
    logReset("reset: calibration applied");
    return {applied:true,solved:false};
  }
  function markSolved(){
    facelets=SOLVED;
    resetNote="Cube reset to solved ✓";
    logReset("reset: sent");
    abortTimer();
    coach=null;
    if(run)run=null;
    if(phase==="running"||phase==="inspect"||phase==="ready"||phase==="wait")phase="idle";
    /* Do not arm calibration here. resetToSolved/markSolved only set the local model
       to solved; doReset() calls beginResetConfirm() after REQUEST_RESET so the next
       hardware FACELETS can confirm or calibrate. Otherwise ordinary test/reset
       facelets would be treated as a drift offset and break scramble tracking. */
    if(officialScramble&&officialScramble.length)startScrambleFromCurrent();
    else emit();
    return {requestReset:true,requestFacelets:true,resetNote:resetNote};
  }
  function resetToSolved(){return markSolved();}
  function noteResetAck(ok){logReset(ok?"reset: ack":"reset: ack failed");emit();}

  /* manual stackmat: press/hold ready, release start, press stop */
  function manualDown(){
    if(phase==="running"){/* will stop on up or treat as stop */}
    if(phase==="stopped"||phase==="idle")return;
    if(phase==="scrambling"){
      /* allow skip-to-ready in manual: treat cube as scrambled */
      if(!connected){facelets=tracker.get().target;tracker.setState(facelets);armAfterScramble();}
      return;
    }
    if(phase==="inspect"||phase==="ready"){
      hold={t0:now(),ready:false};
      emit();
    }
  }
  function manualReadyCheck(){
    if(hold&&!hold.ready&&now()-hold.t0>=280){hold.ready=true;emit();}
    return !!(hold&&hold.ready);
  }
  function manualUp(){
    if(phase==="running"&&run&&run.source==="manual"){
      finishSolve(elapsedNow(),facelets);
      hold=null;return;
    }
    if((phase==="inspect"||phase==="ready")&&hold&&hold.ready){
      if(!run)run=newAttempt();
      run.source="manual";
      const t=now();
      startTimer({localTimestamp:t,cubeTimestamp:null});
      hold=null;emit();return;
    }
    hold=null;emit();
  }
  function manualStop(){
    if(phase==="running")finishSolve(elapsedNow(),facelets);
  }

  function simulateConnected(info){
    info=info||{};
    connected=true;battery=info.battery!=null?info.battery:95;
    deviceName=info.name||"GAN356i3";
    if(info.mac){deviceMAC=validMac(info.mac)||deviceMAC;if(validMac(info.mac)){S.mac=validMac(info.mac);save();}}
    emit();
  }
  function setConnected(on,info){
    if(on)simulateConnected(info);
    else{connected=false;battery=null;deviceName="";calibCubies=null;pendingResetConfirm=false;emit();}
  }
  function setBattery(n){battery=n;emit();}
  function setIos(v){ios=!!v;emit();}

  function sessionProgress(){
    const sess=S.session;
    if(!sess)return null;
    if(sess.finished){
      return {active:false,done:true,title:"Session done",explain:"",summary:sess.summary||null,phase:"done"};
    }
    if(sess.phase==="warmup"){
      const n=(sess.warmup||[]).length;
      return {active:true,done:false,phase:"warmup",title:"Session: Warm-up "+(n+1)+" of 3",explain:"Three warm-up solves to get comfortable. Use the scramble and timer above.",n:n,of:3,stage:null,summary:null};
    }
    if(sess.phase==="drill"){
      const n=(sess.drill||[]).length;
      const stage=drillBucket(sess.drillStage);
      return {active:true,done:false,phase:"drill",title:"Drill: "+(DRILL_LABEL[stage]||stage)+" "+(n+1)+" of "+DRILL_REPS,explain:drillExplain(sess.drillStage||stage,sess.drillReason),n:n,of:DRILL_REPS,stage:stage,drillStage:sess.drillStage,reason:sess.drillReason||"",videos:videosForDrill(sess.drillStage||stage),summary:null,planMode:sess.drillStage==="crossPlan",metronome:sess.drillStage==="lookahead"||sess.drillStage==="metronome"};
    }
    if(sess.phase==="ao5"){
      const n=(sess.ao5||[]).length;
      return {active:true,done:false,phase:"ao5",title:"Timed solve "+(n+1)+" of 5",explain:"Five timed solves for your average of 5 (ao5).",n:n,of:5,stage:null,summary:null};
    }
    return {active:!!sess,done:!!sess.finished,phase:sess.phase,title:"Today's cube session",explain:"",n:0,of:0,stage:null,summary:sess.summary||null};
  }
  function view(){
    const t=tracker.get();
    const st=stats();
    const sess=S.session;
    const sp=sessionProgress();
    return {
      facelets,solved:isSolved(facelets),phase,
      scramble:t.moves,scrambleText:fmtAlg(t.moves),officialScramble,officialText:fmtAlg(officialScramble),
      k:t.k,onPath:t.on,fixup:t.fixup||"",scrambled:t.done,target:t.target,f0:scrambleStart,atTarget:eq(facelets,scrambleTargetState),
      pathReady,faceletsGen,
      replanCount,replanMethod,replanAt,replanNote,replanning,
      cubies:cubiesFromFacelets(facelets),
      current:t.current,currentScramble:t.currentScramble,partial:t.partial,totalParts:t.totalParts,half:t.half,halfLabel:t.halfLabel,total:t.total,
      connected,battery,deviceName,deviceMAC:deviceMAC||S.mac||"",
      inspectLeft,inspectOn:S.inspect!==false,
      running:phase==="running"&&!coachingActive()&&phase!=="wait",
      elapsed:elapsedNow(),
      stepElapsed:stepElapsed(),
      timerMode:timerModeNow(),
      timerLabel:timerModeNow()==="step"?"Step time":(timerModeNow()==="solve"?"Solve time":""),
      resetNote,resetLog:resetLog.slice(),
      calibration:!!calibCubies,
      analysis:lastSolveRec&&lastSolveRec.analysis||null,
      trends:trendFromRecords(S.solves,S.splitsMode),
      videos:videosForDrill((S.session&&!S.session.finished&&S.session.phase==="drill"&&S.session.drillStage)||(lastSolveRec&&lastSolveRec.drillStage)||""),
      lastSolve:lastSolveRec,nextIn:nextIn(),
      sessionProgress:sp,sessionBanner:sp&&(sp.active||sp.done)?sp.title:"",
      sessionExplain:sp?sp.explain:"",
      locked:phase==="inspect"||phase==="ready"||phase==="running"||phase==="stopped",
      run,hold:hold&&{ready:!!hold.ready,held:now()-(hold.t0||0)},
      settings:settings(),stats:st,solves:S.solves.slice(),
      session:sess,celebration,ios,lastSyncBody,lastError,
      kind:currentKind(),
      stages:stageFlags(facelets),
      svg:svgNet(facelets,260),
      coach:coachView()
    };
  }

  function nextAfterStop(){if(phase==="stopped")proceedToNextScramble();}

  /* public */
  const api={
    STORE,SOLVED,RESULTS_SYNC_URL,STAGE_LABEL,STAGE_KID,
    applyMove,applyAlg,parseAlg,normalizeMove,moveFromEvent,invertMove,fmtAlg,
    stageFlags,stagesFor,reachedStages,createTracker,progressOnPath,buildStepTable,classifyState,hitStep,
    formatTime,officialMs,averageOf,bestSingle,bestSplits,weakestStage,splitSegments,pickDrillStage,drillBucket,drillExplain,drillGoalReached,randomDrillScramble,lastLayerScramble,faceletsX2,mapAlgX2,detectBeginnerLL,detect4LookLL,detectDrillCoach,detectStageCoach,COACH_ALGS,coachSummaryText,coachStepLabel,fmtCoachMs,faceletsOnAlgPath,yellowTopSolved,DRILL_REPS,DRILL_LABEL,
    createAlgPlayer,invertAlgStr,analyzeSolve,splitSolveStages,optimalCross,writtenFeedback,recommendWeakness,trendFromRecords,syncPayload,videosForDrill,DRILL_VIDEOS,embedUrlFor,nocookieUrlFor,watchUrlFor,allLessonVideos,skillForVideo,whiteCrossSolved,firstLayerSolved,secondLayerSolved,classifyStageAt,PAUSE_GAP_MS,LBL_TARGET,CFOP_TARGET,faceletsFromCubies,
    validMac,randomMoveScramble,svgNet,linearFitElapsed,tps,dayKey,streakFromDays,
    resultsSyncUrl,syncCubeSession,loadRaw,saveRaw,defState,
    on:fn=>{listeners.push(fn);return ()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};},
    get:view,emit,save,
    newScramble,setScramble,skipScramble,startSolveAnyway,proceedToNextScramble,tickNext,onMove,onFacelets,resetToSolved,markSolved,feedMove:onMove,feedFacelets:onFacelets,
    whenPathReady,bumpFacelets,
    simulateConnected,setConnected,setBattery,setIos,setSetting,setMac,
    startLesson,startTargetedDrill,skipLessonPhase,skipDrill,stopSession,abandonLesson,finishSession,coachNextCase,
    setPenalty,deleteSolve,manualDown,manualUp,manualStop,manualReadyCheck,
    startTimer,finishSolve,nextAfterStop,elapsedNow,abortTimer,timerModeNow,stepElapsed,
    applyCalibFacelets,confirmResetFacelets,beginResetConfirm,noteResetAck,logReset,
    flushStateJudge,getDebugEvents:()=>debugEvents.slice(),debugLogText,maybeSyncDebug,
    resetDebugSync:()=>{lastDebugSyncAt=0;},
    getState:()=>S,getFacelets:()=>facelets,getPhase:()=>phase,lastSync:()=>lastSyncBody,
    getCalibration:()=>calibCubies,setError:m=>{lastError=m||"";emit();}
  };
  return api;
}

const Engine={
  STORE,RESULTS_SYNC_URL,SOLVED,FACES,COL,CYCLES,LBL,CFOP,STAGE_LABEL,STAGE_KID,
  applyMove,applyAlg,parseAlg,normalizeMove,moveFromEvent,invertMove,fmtAlg,isSolved,
  stageFlags,stagesFor,reachedStages,whiteCross,firstLayer,secondLayer,f2lDone,ollDone,
  createTracker,progressOnPath,buildStepTable,classifyState,hitStep,scrambleTarget,combineMoves,simplifyAlg,remainingFromSnap,expandToQuarters,pathSnapshots,
  invertAlg,cubiesFromFacelets,isValidFacelets,invertCubies,mulCubies,relativeCubies,cubiesEqual,faceletsFromCubies,cubiesToCubing,C2K_CORNER,C2K_EDGE,solveFromTo,solveFromToSync,setSolveFromTo,
  formatTime,officialMs,averageOf,bestSingle,bestSplits,weakestStage,splitSegments,pickDrillStage,drillBucket,drillExplain,drillGoalReached,randomDrillScramble,lastLayerScramble,faceletsX2,mapAlgX2,detectBeginnerLL,detect4LookLL,detectDrillCoach,detectStageCoach,COACH_ALGS,coachSummaryText,coachStepLabel,fmtCoachMs,faceletsOnAlgPath,yellowTopSolved,DRILL_REPS,DRILL_LABEL,
  createAlgPlayer,invertAlgStr,analyzeSolve,splitSolveStages,optimalCross,writtenFeedback,recommendWeakness,trendFromRecords,syncPayload,videosForDrill,DRILL_VIDEOS,embedUrlFor,nocookieUrlFor,watchUrlFor,allLessonVideos,skillForVideo,whiteCrossSolved,firstLayerSolved,secondLayerSolved,classifyStageAt,PAUSE_GAP_MS,LBL_TARGET,CFOP_TARGET,
  validMac,randomMoveScramble,clampScrambleLen,svgNet,linearFitElapsed,tps,dayKey,streakFromDays,
  resultsSyncUrl,syncCubeSession,loadRaw,saveRaw,defState,createApp
};
root.CubeEngine=Engine;
if(typeof module!=="undefined"&&module.exports)module.exports=Engine;
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:this);
