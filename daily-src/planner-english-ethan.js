/* ---------- lesson planning: Ethan's English practice, about 10 minutes (18-20 questions) ----------
   Normal day: 2 warm-up, 6 new-topic, 6 mixed, 2 fix-it, 2 challenge (18).
   School-focus weekday: the school topic is about 2/3 (14 of 20): worked example + 8 school, 5 new-topic, then mix/fix/challenge on the school topic.
   pt47u + pt55u + pt59u + pt104u: later school/new/challenge/mix items stretch a level (more of the mix now stretches); Word detectives prefers multi-step types.
   Review day (Fri, or Sat/Sun catch-up): this week's practice and mistakes (20); a school topic from this week is about 2/3. */
function planLesson(date,variant=0){
  RNG=mulberry32(hashStr(`${PLAYER}|${date}|plan|${variant}`));
  const items=[],add=(sec,t,o={})=>items.push(Object.assign({sec,t,lvl:Math.min(3,T(t).lvl+(o.up||0)),sub:o.sub||null},o.kind?{kind:o.kind}:{},o.guided?{guided:true}:{}));
  const focusToday=activeFocus(date),wf=weekFocus(date),cur=curTopic();
  const pool=doneTopics().concat(cur&&T(cur).les.length?[cur]:[]).concat(wf.filter(x=>!PATH.includes(x)||PATH.indexOf(x)>S.cur)).filter((x,i,a)=>a.indexOf(x)===i);
  const mixW=id=>{const t=S.topics[id];const since=t&&t.last?Math.min(6,daysBetween(t.last,date)):6;return 1+3*(1-acc(id))+since/2+(wf.includes(id)?3:0)+(id===cur?0.5:0);};
  const mistakes=(pred,days)=>{const m={};S.log.filter(e=>!e.ok&&e.d<date&&daysBetween(e.d,date)<=days&&TOPICS[e.t]&&!TOPICS[e.t].warm&&pred(e)).forEach(e=>{const k=e.t+'|'+(e.s||'');m[k]=(m[k]||0)+1;});return m;};
  const subOf=(m,t)=>{const ks=Object.keys(m).filter(k=>k.split('|')[0]===t&&k.split('|')[1]);return ks.length?wpick(ks,k=>m[k]).split('|')[1]:null;};
  const newSec=n=>{if(!cur)return;if(T(cur).les.length===0)add('new',cur,{kind:'example'});for(let i=0;i<n;i++)add('new',cur,{guided:i<1&&T(cur).les.length===0,up:i>=n-3?1:0});};
  const review=isReviewDay(date);
  let kind=review?'review':'mix';
  if(!review&&focusToday.length){
    const fe=focusToday[0],f=fe.topicId,fresh=T(f).les.length===0,fm=mistakes(e=>e.t===f,14);
    /* Harder Word detectives stretch for later school items (multi-noun lists, mid-sentence prep). */
    const hardSubs=f==='worddetect'?['prep','alln','group','count','alla','desc']:null;
    if(fresh||date===fe.date)add('school',f,{kind:'example'});
    for(let i=0;i<8;i++){const pin=i>=4?subOf(fm,f):null;const hs=(!pin&&hardSubs&&i>=3)?hardSubs[(i+variant)%hardSubs.length]:null;
      add('school',f,{guided:fresh&&i<2,sub:pin||hs||null,up:i>=4?1:0});}
    if(cur&&cur!==f)newSec(5);else{add('warm',CFG.warm,{});const opl=pool.filter(x=>x!==f);interleave(opl.length?opl:[CFG.warm],3,mixW).forEach(t=>add('mix',t));}
    const opl=pool.filter(x=>x!==f);const other=opl.length?wpick(opl,mixW):null;
    add('mix',f,{up:1});if(other)add('mix',other);else add('warm',CFG.warm,{});add('mix',f);
    add('fix',f,{sub:subOf(fm,f)});add('fix',f,{sub:subOf(fm,f)});
    add('challenge',f,{up:1,sub:hardSubs?hardSubs[variant%hardSubs.length]:null});add('challenge',f,{up:1,sub:hardSubs?hardSubs[(variant+1)%hardSubs.length]:null});
  }else if(!review){
    for(let i=0;i<2;i++)add('warm',CFG.warm,{});
    newSec(6);
    const pl=pool.length?pool:(cur?[cur]:[CFG.warm]);
    interleave(pl,6,mixW).forEach((t,i)=>add('mix',t,{up:i>=2?1:0}));
    const rm=mistakes(()=>true,14),rk=Object.keys(rm);
    for(let i=0;i<2;i++){const fk=rk.length?wpick(rk,k=>rm[k]):(pl.slice().sort((a,b)=>acc(a)-acc(b))[0]+'|');const [t,s]=fk.split('|');add('fix',t,{sub:s||null});}
    const ch=pool.concat(cur?[cur]:[]);for(let i=0;i<2;i++)add('challenge',ch.length?pick(ch):CFG.warm,{up:1});
  }else{
    const sf=wf.concat(focusToday.map(f=>f.topicId)).filter((x,i,a)=>a.indexOf(x)===i);
    let nf=14;
    if(focusToday.length){const fe=focusToday[0],f=fe.topicId,fresh=T(f).les.length===0;
      if(fresh||date===fe.date)add('school',f,{kind:'example'});
      const fm=mistakes(e=>e.t===f,14);const hardSubs=f==='worddetect'?['prep','alln','group','count','desc']:null;
      for(let i=0;i<8;i++){const pin=i>=4?subOf(fm,f):null;const hs=(!pin&&hardSubs&&i>=3)?hardSubs[(i+variant)%hardSubs.length]:null;
        add('school',f,{guided:fresh&&i<2,sub:pin||hs||null,up:i>=4?1:0});}nf=6;}
    add('warm',CFG.warm,{});if(!focusToday.length)add('warm',CFG.warm,{});
    const wk={};S.log.filter(e=>e.d>=WEEKOF(date)[0]&&e.d<date&&TOPICS[e.t]&&!TOPICS[e.t].warm).forEach(e=>{const k=e.t+'|'+(e.s||'');const o=wk[k]||(wk[k]={n:0,w:0});o.n++;if(!e.ok)o.w++;});
    wf.forEach(t=>{const k=t+'|';const o=wk[k]||(wk[k]={n:0,w:0});o.n+=2;o.focus=true;});
    let keys=Object.keys(wk);
    if(new Set(keys.map(k=>k.split('|')[0])).size<3)pool.forEach(t=>{if(!keys.some(k=>k.startsWith(t+'|')))keys.push(t+'|');});
    const w=k=>1+3*((wk[k]||{}).w||0)+((wk[k]||{}).focus?3:0)+((wk[k]||{}).n?1:0);
    const tp=k=>k.split('|')[0],sb=k=>k.split('|')[1]||null;
    const okeys=keys.filter(k=>!sf.includes(tp(k)));
    if(!keys.length&&cur){newSec(6);for(let i=0;i<6;i++)add('review',cur,{});}
    else if(!okeys.length&&cur&&!sf.length){newSec(6);}
    if(sf.length){
      const fk=t=>{const ks=keys.filter(k=>tp(k)===t&&sb(k)&&wk[k]&&wk[k].w>0);return ks.length?wpick(ks,k=>wk[k].w):t+'|';};
      /* review questions: about 2/3 on this week's school topic(s), the rest other topics, interleaved */
      const nO=okeys.length?Math.min(4,Math.max(2,Math.floor(nf/3.5))):0,nF=nf-nO;const o2=okeys.length?interleave(okeys,nO,w):[];
      /* at most ~half pinned to a weak question type, the rest mix all the focus question types */
      const fs=[];for(let i=0;i<nF;i++){const t=sf[i%sf.length];fs.push(i%2===0&&i<nF*0.5?fk(t):t+'|');}
      const seq=[];for(let i=0;fs.length||o2.length;i++){if(i%2===1&&o2.length)seq.push(o2.shift());else seq.push(fs.length?fs.shift():o2.shift());}
      seq.forEach(k=>add('review',tp(k),{sub:sb(k)}));
    }else if(keys.length){let last=null;
      for(let i=0;i<14;i++){const c=keys.length>1?keys.filter(k=>tp(k)!==last||keys.every(x=>tp(x)===last)):keys;const k=wpick(c,w);last=tp(k);add('review',tp(k),{sub:sb(k)});}
    }
    const tough=keys.filter(k=>(wk[k]||{}).w>0).sort((a,b)=>wk[b].w-wk[a].w);const tl=[];
    const nTough=focusToday.length?3:4;
    if(sf.length){const k=tough.find(x=>sf.includes(tp(x)));tl.push(k||sf[0]+'|');if(sf.length)tl.push(sf[0]+'|');}
    tough.forEach(k=>{if(tl.length<nTough&&!tl.includes(k))tl.push(k);});
    const fill=sf.length?sf:(keys.length?keys.map(tp):pool.length?pool:(cur?[cur]:[CFG.warm]));
    while(tl.length<nTough)tl.push(fill[tl.length%fill.length]+'|');
    tl.forEach(k=>{const hasW=(wk[k]||{}).w>0;add('tough',tp(k),{sub:sb(k),up:hasW?0:1});});
  }
  /* one "tell a grown-up" prompt on a non-warm question */
  const cand=items.map((x,i)=>i).filter(i=>items[i].kind!=='example'&&!['warm','school'].includes(items[i].sec));
  shuffle(cand).slice(0,1).forEach(i=>items[i].tell=true);
  return {kind,items};
}
