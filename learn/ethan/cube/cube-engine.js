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
  m=String(m||"").trim().replace(/[’`]/g,"'");
  if(!m)return "";
  const f=m[0].toUpperCase();
  if(FACES.indexOf(f)<0)return "";
  if(/2/.test(m))return f+"2";
  if(/'/.test(m))return f+"'";
  return f;
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
    const qs=expandToQuarters(M);
    qs.forEach((qt,qi)=>{
      s=applyMove(s,qt);q++;
      const doneMove=qi===qs.length-1;
      snaps.push({state:s,k:doneMove?i+1:i,partial:doneMove?0:qi+1,totalParts:qs.length,current:doneMove?(moves[i+1]||null):M,q});
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

function createTracker(scramble,start,targetState){
  start=start||SOLVED;
  let {moves,snaps}=pathSnapshots(scramble,start);
  let target=targetState||snaps[snaps.length-1].state;
  let state=start,lastMove="",fixup="",lastOn=snaps[0];
  function snapshot(){
    const done=eq(state,target);
    const p=packProgress(lastOn,moves,done,!fixup&&!!lastOn);
    p.state=state;p.target=target;p.fixup=done?"":fixup;p.lastMove=lastMove;
    p.on=!!(!fixup&&!done&&lastOn);
    if(done){p.current=null;p.currentScramble=null;p.k=moves.length;p.partial=0;p.half=false;p.halfLabel="";p.fixup="";p.on=false;}
    else if(fixup){p.current=fixup;}
    return p;
  }
  function apply(m){
    m=normalizeMove(m);
    if(!m)return snapshot();
    state=applyMove(state,m);
    lastMove=m;
    if(eq(state,target)){fixup="";lastOn=snaps[snaps.length-1];return snapshot();}
    const found=matchSnap(snaps,state);
    if(found){fixup="";lastOn=found;return snapshot();}
    fixup=invertMove(m);
    return snapshot();
  }
  function setState(f){
    if(f&&f.length===54){
      state=f;
      if(eq(state,target)){fixup="";lastOn=snaps[snaps.length-1];}
      else{
        const found=matchSnap(snaps,state);
        if(found){fixup="";lastOn=found;}
        else fixup="";
      }
    }
    return snapshot();
  }
  function reset(){state=start;lastMove="";fixup="";lastOn=snaps[0];return snapshot();}
  function repath(current,remaining,asFixup){
    remaining=parseAlg(remaining);
    if(current&&current.length===54)state=current;
    const built=pathSnapshots(remaining,state);
    moves=built.moves;snaps=built.snaps;
    lastOn=snaps[0];lastMove="";
    if(eq(state,target)){fixup="";lastOn=snaps[snaps.length-1]||snaps[0];}
    else{
      const found=matchSnap(snaps,state);
      const atStart=!!(found&&found.k===0&&!found.partial);
      if(asFixup&&moves[0]&&(atStart||!found)){
        fixup=moves[0];
        lastOn=found||snaps[0];
      }else if(found){fixup="";lastOn=found;}
      else fixup="";
    }
    return snapshot();
  }
  function setTarget(t){if(t&&t.length===54)target=t;return snapshot();}
  return {apply,setState,reset,repath,setTarget,get:snapshot,get target(){return target;},get moves(){return moves;}};
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

function randomMoveScramble(rng){
  rng=typeof rng==="function"?rng:Math.random;
  const faces=FACES.split(""),opp={U:"D",D:"U",R:"L",L:"R",F:"B",B:"F"};
  const suf=["","'","2"];
  const out=[];let last="",last2="",guard=0;
  while(out.length<25&&guard++<4000){
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
  return {v:1,mac:"",splitsMode:"lbl",inspect:true,sound:true,solves:[],days:{},session:null,points:0,stars:0,bestStreak:0,pb:null};
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

  function settings(){return {splitsMode:S.splitsMode||"lbl",inspect:S.inspect!==false,sound:S.sound!==false,mac:S.mac||""};}
  function save(){saveRaw(S,ls);}
  function setSetting(k,val){
    if(k==="splitsMode")S.splitsMode=val==="cfop"?"cfop":"lbl";
    else if(k==="inspect")S.inspect=!!val;
    else if(k==="sound")S.sound=!!val;
    else if(k==="mac")S.mac=validMac(val);
    save();emit();
  }
  function setMac(m){S.mac=validMac(m);deviceMAC=S.mac;save();emit();return S.mac;}

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
  function armAfterScramble(){
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
    emit();
  }
  function newAttempt(){
    const kind=currentKind();
    const drillStage=(kind==="drill"&&S.session&&S.session.drillStage)||null;
    return {kind,drillStage,scramble:fmtAlg(tracker.get().moves),started:false,moves:[],t0:null,hostT0:null,splits:{},moveCount:0,penalty:null,source:connected?"cube":"manual"};
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
    const pen=inspectPenalty();
    clearInspect();
    phase="running";
    run.started=true;
    run.t0=ts&&ts.cubeTimestamp!=null?ts.cubeTimestamp:null;
    run.hostT0=ts&&ts.localTimestamp!=null?ts.localTimestamp:now();
    run.timerHost0=now();
    if(pen)run.penalty=pen;
    emit();
  }
  function elapsedNow(){
    if(!run||!run.started)return 0;
    if(phase==="stopped"&&run.ms!=null)return run.ms;
    const fit=linearFitElapsed(run.moves);
    if(fit!=null&&run.moves.length>=2)return fit;
    return Math.max(0,now()-(run.timerHost0||now()));
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
    if(!run||!run.started||phase!=="running")return false;
    const goal=run.drillStage||"solved";
    const flags=stageFlags(f);
    const done=goal==="solved"?flags.solved:!!flags[goal];
    if(!done)return false;
    const ms=(()=>{
      const fit=linearFitElapsed(run.moves.concat(ts?[ts]:[]));
      if(fit!=null&&(run.moves.length>=1))return Math.max(0,Math.round(fit));
      return Math.max(0,Math.round(now()-(run.timerHost0||now())));
    })();
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
    const keep=celebration;
    const sessionDone=!!(S.session&&S.session.finished);
    if(!sessionDone){
      newScramble(null,{keepCelebration:true,keepFacelets:true});
      if(keep)celebration=keep;
    }
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
        if(connected||rec.source==="cube"){
          const w=weakestStage(S.solves,S.splitsMode);
          sess.phase="drill";sess.drillStage=w.id;sess.drill=[];
        }else{
          sess.phase="ao5";sess.ao5=[];
        }
      }
    }else if(sess.phase==="drill"){
      sess.drill=sess.drill||[];sess.drill.push(rec.id);
      if(sess.drill.length>=3){sess.phase="ao5";sess.ao5=[];}
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
    sess.summary={ao5,pb,weak,stars,n:recs.length};
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
  function skipLessonPhase(){
    const sess=S.session;if(!sess||sess.finished)return;
    if(sess.phase==="warmup"){sess.phase=connected?"drill":"ao5";if(sess.phase==="drill"){sess.drillStage=weakestStage(S.solves,S.splitsMode).id;sess.drill=[];}else sess.ao5=[];}
    else if(sess.phase==="drill"){sess.phase="ao5";sess.ao5=[];}
    else if(sess.phase==="ao5")finishSession();
    save();newScramble();emit();
  }
  function abandonLesson(){if(S.session&&!S.session.finished){S.session=null;save();emit();}}

  let officialScramble=[], scrambleTargetState=SOLVED, pathReady=true, pathPromise=null, faceletsGen=0;
  function bumpFacelets(){faceletsGen++;}
  function whenPathReady(){return pathPromise||Promise.resolve(fmtAlg(tracker.get().moves));}
  function adoptPath(moves,opts){
    opts=opts||{};
    pathReady=true;
    tracker=createTracker(moves,facelets,scrambleTargetState);
    const t=tracker.setState(facelets);
    if(t.done)armAfterScramble();
    else phase="scrambling";
    if(!(opts.keepCelebration)){/* celebration already handled by caller */}
    emit();
    return fmtAlg(tracker.get().moves);
  }
  function recomputeRemaining(asFixup){
    if(eq(facelets,scrambleTargetState)){
      tracker.setState(facelets);
      pathReady=true;
      armAfterScramble();
      return Promise.resolve([]);
    }
    const short=solveFromToSync(facelets,scrambleTargetState,4);
    if(short){
      pathReady=true;
      tracker.repath(facelets,short,asFixup);
      emit();
      return Promise.resolve(short);
    }
    pathReady=false;
    const p=solveFromTo(facelets,scrambleTargetState).then(path=>{
      if(!eq(facelets,scrambleTargetState)&&phase==="scrambling"){
        if(path&&path.length){pathReady=true;tracker.repath(facelets,path,asFixup);}
        else {pathReady=true;}
        emit();
      }
      return path||[];
    });
    pathPromise=p;
    emit();
    return p;
  }
  function newScramble(alg,opts){
    opts=opts||{};
    clearInspect();
    if(!opts.keepCelebration)celebration=null;
    run=null;
    const official=parseAlg(alg||randomMoveScramble());
    officialScramble=official;
    scrambleTargetState=applyAlg(SOLVED,official);
    if(!connected&&!opts.keepFacelets)facelets=SOLVED;
    bumpFacelets();
    if(eq(facelets,scrambleTargetState)){
      pathReady=true;pathPromise=Promise.resolve("");
      tracker=createTracker([],facelets,scrambleTargetState);
      armAfterScramble();
      return "";
    }
    if(isSolved(facelets)){
      pathPromise=Promise.resolve(fmtAlg(official));
      return adoptPath(official,opts);
    }
    const short=solveFromToSync(facelets,scrambleTargetState,4);
    if(short){
      pathPromise=Promise.resolve(fmtAlg(short));
      return adoptPath(short,opts);
    }
    pathReady=false;
    phase="scrambling";
    tracker=createTracker([],facelets,scrambleTargetState);
    emit();
    const p=solveFromTo(facelets,scrambleTargetState).then(path=>{
      if(path&&path.length)return adoptPath(path,opts);
      pathReady=true;
      return adoptPath(official,opts);
    });
    pathPromise=p;
    return fmtAlg(official);
  }
  function setScramble(alg){return newScramble(alg);}
  function skipScramble(){return newScramble();}

  function onMove(evt){
    const m=normalizeMove(evt&&(evt.move||evt));
    if(!m)return;
    const ts={
      move:m,
      localTimestamp:evt&&evt.localTimestamp!=null?evt.localTimestamp:(now()),
      cubeTimestamp:evt&&evt.cubeTimestamp!=null?evt.cubeTimestamp:null
    };
    facelets=applyMove(facelets,m);
    if(evt&&evt.facelets&&evt.facelets.length===54)facelets=evt.facelets;
    if(phase==="needSolved"){
      phase="scrambling";
    }
    if(phase==="scrambling"){
      if(eq(facelets,scrambleTargetState)){tracker.setState(facelets);armAfterScramble();return tracker.get();}
      const t=tracker.apply(m);
      if(t.done||eq(facelets,scrambleTargetState)){armAfterScramble();return t;}
      if(!t.on){recomputeRemaining(true);return tracker.get();}
      emit();
      return t;
    }
    if(phase==="inspect"||phase==="ready"){
      if(!run)run=newAttempt();
      run.source="cube";
      run.moves.push(ts);
      startTimer(ts);
      markSplits(facelets,0,0);
      if(stopIfDone(facelets,ts))return;
      emit();return;
    }
    if(phase==="running"&&run){
      run.moves.push(ts);
      run.moveCount=run.moves.length;
      const el=elapsedNow();
      markSplits(facelets,Math.round(el),run.moveCount);
      if(stopIfDone(facelets,ts))return;
      emit();
    }else emit();
  }
  function onFacelets(f){
    if(!f||f.length!==54)return;
    facelets=f;
    if(phase==="needSolved")phase="scrambling";
    if(phase==="scrambling"){
      if(eq(facelets,scrambleTargetState)){tracker.setState(f);armAfterScramble();return;}
      const t=tracker.setState(f);
      if(t.done){armAfterScramble();return;}
      if(!t.on){recomputeRemaining(true);return;}
      emit();
      return;
    }
    if((phase==="inspect"||phase==="ready")&&eq(facelets,SOLVED)&&run&&!run.started){
      /* ignore; wait for a move or a later solved-after-solve path */
    }
    if(phase==="running"&&run){
      markSplits(facelets,Math.round(elapsedNow()),run.moves.length);
      if(stopIfDone(facelets,null))return;
    }
    emit();
  }
  function markSolved(){
    facelets=SOLVED;
    if(phase==="scrambling"){
      if(eq(SOLVED,scrambleTargetState)){tracker.setState(SOLVED);armAfterScramble();}
      else{
        pathReady=true;
        tracker=createTracker(officialScramble,SOLVED,scrambleTargetState);
        phase="scrambling";
        emit();
      }
    }else emit();
    return {requestReset:true};
  }
  function resetToSolved(){return markSolved();}

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
    else{connected=false;battery=null;deviceName="";emit();}
  }
  function setBattery(n){battery=n;emit();}
  function setIos(v){ios=!!v;emit();}

  function view(){
    const t=tracker.get();
    const st=stats();
    const sess=S.session;
    return {
      facelets,solved:isSolved(facelets),phase,
      scramble:t.moves,scrambleText:fmtAlg(t.moves),officialScramble,officialText:fmtAlg(officialScramble),
      k:t.k,onPath:t.on,fixup:t.fixup,scrambled:t.done,target:t.target,pathReady,faceletsGen,
      cubies:cubiesFromFacelets(facelets),
      current:t.current,currentScramble:t.currentScramble,partial:t.partial,totalParts:t.totalParts,half:t.half,halfLabel:t.halfLabel,total:t.total,
      connected,battery,deviceName,deviceMAC:deviceMAC||S.mac||"",
      inspectLeft,inspectOn:S.inspect!==false,
      running:phase==="running",elapsed:elapsedNow(),
      run,hold:hold&&{ready:!!hold.ready,held:now()-(hold.t0||0)},
      settings:settings(),stats:st,solves:S.solves.slice(),
      session:sess,celebration,ios,lastSyncBody,lastError,
      kind:currentKind(),
      stages:stageFlags(facelets),
      svg:svgNet(facelets,260)
    };
  }

  function nextAfterStop(){if(phase==="stopped")newScramble();}

  /* public */
  const api={
    STORE,SOLVED,RESULTS_SYNC_URL,STAGE_LABEL,STAGE_KID,
    applyMove,applyAlg,parseAlg,normalizeMove,invertMove,fmtAlg,
    stageFlags,stagesFor,reachedStages,createTracker,progressOnPath,
    formatTime,officialMs,averageOf,bestSingle,bestSplits,weakestStage,splitSegments,
    validMac,randomMoveScramble,svgNet,linearFitElapsed,tps,dayKey,streakFromDays,
    resultsSyncUrl,syncCubeSession,loadRaw,saveRaw,defState,
    on:fn=>{listeners.push(fn);return ()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};},
    get:view,emit,save,
    newScramble,setScramble,skipScramble,onMove,onFacelets,resetToSolved,markSolved,feedMove:onMove,feedFacelets:onFacelets,
    whenPathReady,bumpFacelets,
    simulateConnected,setConnected,setBattery,setIos,setSetting,setMac,
    startLesson,skipLessonPhase,abandonLesson,finishSession,
    setPenalty,deleteSolve,manualDown,manualUp,manualStop,manualReadyCheck,
    startTimer,finishSolve,nextAfterStop,elapsedNow,
    getState:()=>S,getFacelets:()=>facelets,getPhase:()=>phase,lastSync:()=>lastSyncBody,
    setError:m=>{lastError=m||"";emit();}
  };
  return api;
}

const Engine={
  STORE,RESULTS_SYNC_URL,SOLVED,FACES,COL,CYCLES,LBL,CFOP,STAGE_LABEL,STAGE_KID,
  applyMove,applyAlg,parseAlg,normalizeMove,invertMove,fmtAlg,isSolved,
  stageFlags,stagesFor,reachedStages,whiteCross,firstLayer,secondLayer,f2lDone,ollDone,
  createTracker,progressOnPath,scrambleTarget,combineMoves,expandToQuarters,pathSnapshots,
  invertAlg,cubiesFromFacelets,isValidFacelets,invertCubies,mulCubies,relativeCubies,cubiesEqual,solveFromTo,solveFromToSync,setSolveFromTo,
  formatTime,officialMs,averageOf,bestSingle,bestSplits,weakestStage,splitSegments,
  validMac,randomMoveScramble,svgNet,linearFitElapsed,tps,dayKey,streakFromDays,
  resultsSyncUrl,syncCubeSession,loadRaw,saveRaw,defState,createApp
};
root.CubeEngine=Engine;
if(typeof module!=="undefined"&&module.exports)module.exports=Engine;
})(typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:this);
