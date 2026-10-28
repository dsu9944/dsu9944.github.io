/* Ethan's "From school today" focus list. See ../../README.md for how to use it.
   Each entry: {date:'YYYY-MM-DD', topicId:'<topic id>', title:'Shown to Ethan', note:'Optional note', until:'YYYY-MM-DD'}
   The entry is active from date to until (inclusive). It stays weighted in the mix and Friday review for the rest of that week. */
window.DAILY_FOCUS = window.DAILY_FOCUS || [];
window.DAILY_TOPICS_EXTRA = window.DAILY_TOPICS_EXTRA || [];

/* Add entries below this line, for example:
DAILY_FOCUS.push({date:'2026-10-22', topicId:'time', title:'Telling time', note:'Practised at school today', until:'2026-10-24'});
*/

/* ===== Sorting and classifying (school topic, 28 Oct 2026). Not on the mastery path. ===== */
window.DAILY_TOPICS_EXTRA.push((function(){
  let HH=null;
  const COL={red:'#ef4444',blue:'#3b82f6',yellow:'#facc15',green:'#22c55e',purple:'#a855f7',orange:'#f97316'};
  const CN=Object.keys(COL);
  const SH={circle:{s:'circle',p:'circles',n:0},triangle:{s:'triangle',p:'triangles',n:3},square:{s:'square',p:'squares',n:4},rectangle:{s:'rectangle',p:'rectangles',n:4},pentagon:{s:'pentagon',p:'pentagons',n:5},hexagon:{s:'hexagon',p:'hexagons',n:6}};
  const SN=Object.keys(SH);
  const ROLL={sphere:1,cylinder:1,cone:1},FLATONLY=['cube','rectangular prism','square pyramid','triangular prism','triangular pyramid'];
  const LET='ABCDEF';
  const sidesTxt=n=>n===0?'no straight sides':n+' sides';
  const desc=it=>`${it.size==='small'?'small ':it.size==='big'?'big ':''}<b>${it.col}</b> ${SH[it.shape].s}`;
  const attr=(it,k)=>k==='col'?it.col:k==='shape'?it.shape:k==='size'?it.size:k==='sides'?SH[it.shape].n:null;
  /* draw one 2D shape at (cx,cy), half-size s */
  function shp(it,cx,cy,s){const f=COL[it.col],st='stroke="#1f2937" stroke-width="3"';
    if(it.shape==='circle')return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="${f}" ${st}/>`;
    if(it.shape==='square'){const a=s*0.85;return `<rect x="${cx-a}" y="${cy-a}" width="${2*a}" height="${2*a}" fill="${f}" ${st}/>`;}
    if(it.shape==='rectangle')return `<rect x="${cx-s*1.25}" y="${cy-s*0.62}" width="${s*2.5}" height="${s*1.24}" fill="${f}" ${st}/>`;
    const n=SH[it.shape].n,pts=[];for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;pts.push(`${(cx+s*Math.cos(a)).toFixed(1)},${(cy+s*Math.sin(a)+(n===3?s*0.15:0)).toFixed(1)}`);}
    return `<polygon points="${pts.join(' ')}" fill="${f}" ${st}/>`;}
  const lab=(x,y,t,fs=14,w='normal')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${fs}" font-weight="${w}" fill="#374151" font-family="sans-serif">${t}</text>`;
  const solidAt=(k,x,y,w)=>HH&&HH.solidSVG?HH.solidSVG(k,{size:w}).replace('<svg class="shape"',`<svg x="${x}" y="${y}" height="${(w*150/180).toFixed(0)}"`):'';
  const wrap=(w,h,b,lbl)=>`<svg class="shape" viewBox="0 0 ${w} ${h}" width="${w}" style="max-width:100%;height:auto" role="img" aria-label="${lbl||'sorting picture'}">${b}</svg>`;
  /* a row of lettered items (2D shapes or 3D solids) */
  function row(items,{letters=true,ring=-1}={}){const W=112,H=letters?160:140;let b='';
    items.forEach((it,i)=>{const cx=W/2+i*W;
      if(i===ring)b+=`<rect x="${cx-52}" y="4" width="104" height="${H-8}" rx="14" fill="#fef9c3" stroke="#f59e0b" stroke-width="3" stroke-dasharray="7 4"/>`;
      const y0=letters?28:8;if(letters)b+=`<circle cx="${cx}" cy="18" r="13" fill="#1f2937"/>`+lab(cx,23,LET[i],15,'bold').replace('fill="#374151"','fill="#fff"');
      if(it.solid){b+=solidAt(it.solid,cx-48,y0+4,96)+lab(cx,y0+108,it.solid,13);}
      else{b+=shp(it,cx,y0+48,it.size==='small'?19:36)+lab(cx,y0+110,it.col,15);}});
    return wrap(items.length*W,H,b,'row of shapes');}
  /* sorting hoops; groups:[{label,items}] ; extra = item waiting to be sorted */
  function hoops(groups,{extra=null,hl=-1}={}){const GW=210;let b='',w=groups.length*GW+(extra?150:0);
    groups.forEach((g,gi)=>{const cx=GW/2+gi*GW,cy=140;
      b+=`<ellipse cx="${cx}" cy="${cy}" rx="96" ry="92" fill="${gi===hl?'#fef9c3':'#f8fafc'}" stroke="${gi===hl?'#f59e0b':'#64748b'}" stroke-width="4"/>`+lab(cx,30,g.label,16,'bold');
      const sl=[[-42,-40],[42,-40],[-42,38],[42,38]];
      g.items.forEach((it,i)=>{const [dx,dy]=sl[i%4];if(it.solid)b+=solidAt(it.solid,cx+dx-34,cy+dy-30,68)+lab(cx+dx,cy+dy+36,it.solid.replace('rectangular ','rect. ').replace('triangular ','tri. '),11);
        else b+=shp(it,cx+dx,cy+dy-4,it.size==='small'?14:22)+lab(cx+dx,cy+dy+28,it.col,12);});});
    if(extra){const cx=groups.length*GW+75;b+=`<rect x="${cx-62}" y="50" width="124" height="180" rx="14" fill="#fff" stroke="#7c3aed" stroke-width="3" stroke-dasharray="8 5"/>`+lab(cx,40,'Sort me!',15,'bold');
      if(extra.solid)b+=solidAt(extra.solid,cx-50,90,100)+lab(cx,200,extra.solid,13);else b+=shp(extra,cx,130,extra.size==='small'?20:36)+lab(cx,200,extra.col,15);}
    return wrap(w,250,b,'sorting hoops');}
  /* a mixed pile in a grid; hl(it) true = ringed */
  function pile(items,hl){const C=Math.min(6,items.length),W=92,Hh=104,R=Math.ceil(items.length/C);let b='';
    items.forEach((it,i)=>{const cx=W/2+(i%C)*W,cy=44+Math.floor(i/C)*Hh;
      if(hl&&hl(it))b+=`<rect x="${cx-42}" y="${cy-40}" width="84" height="94" rx="12" fill="#fef9c3" stroke="#f59e0b" stroke-width="3"/>`;
      b+=shp(it,cx,cy,it.size==='small'?19:30)+lab(cx,cy+46,it.col,14);});
    return wrap(C*W,R*Hh+8,b,'mixed pile of shapes');}
  /* two-rule Venn diagram */
  function venn(A,B,items,{extra=null}={}){let b=`<ellipse cx="215" cy="180" rx="140" ry="130" fill="rgba(239,68,68,.07)" stroke="#334155" stroke-width="4"/><ellipse cx="365" cy="180" rx="140" ry="130" fill="rgba(59,130,246,.07)" stroke="#334155" stroke-width="4"/>`+lab(150,34,A.label,16,'bold')+lab(430,34,B.label,16,'bold');
    const slots={a:[[120,120],[170,95],[115,200],[165,235]],m:[[290,105],[290,175],[290,245]],b:[[460,120],[410,95],[465,200],[415,235]],o:[[38,70],[542,70],[38,300],[542,300]]},used={a:0,m:0,b:0,o:0};
    items.forEach(it=>{const r=(A.test(it)?(B.test(it)?'m':'a'):(B.test(it)?'b':'o'));const p=slots[r][used[r]++];if(!p)return;b+=shp(it,p[0],p[1]-4,it.size==='small'?13:19)+lab(p[0],p[1]+27,(A.sz||B.sz?it.size+' ':'')+it.col,11);});
    let w=580;if(extra){b+=`<rect x="600" y="80" width="130" height="180" rx="14" fill="#fff" stroke="#7c3aed" stroke-width="3" stroke-dasharray="8 5"/>`+lab(665,70,'Where do I go?',14,'bold')+shp(extra,665,155,extra.size==='small'?20:34)+lab(665,225,extra.size+' '+extra.col,15);w=740;}
    return wrap(w,330,b,'Venn diagram');}
  const region=(A,B,it)=>A.test(it)?(B.test(it)?2:0):(B.test(it)?1:3);
  /* random 2D item */
  const rItem=(H,o={})=>({col:o.col||H.pick(CN),shape:o.shape||H.pick(SN),size:o.size||(H.chance(0.5)?'big':'small')});
  /* values for a non-key attribute so no value appears exactly once */
  function noSingle(H,n,pool){if(H.chance(0.4))return Array(n).fill(H.pick(pool));const [a,b]=H.shuffle(pool.slice()).slice(0,2);const k=H.rnd(2,n-2);return H.shuffle(Array(k).fill(a).concat(Array(n-k).fill(b)));}
  const fits=(groups,k)=>{const vals=groups.map(g=>new Set(g.items.map(it=>attr(it,k))));if(vals.some(s=>s.size!==1))return false;const all=vals.map(s=>[...s][0]);return new Set(all).size===all.length;};

  function gOdd(H,l){const n=l>=2?5:4;const key=H.pick(['col','shape','size']);
    for(let t=0;t<60;t++){let vals={};
      if(key==='col'){const [v,w]=H.shuffle(CN.slice()).slice(0,2);vals.col=Array(n-1).fill(v).concat([w]);}
      else vals.col=noSingle(H,n,CN);
      if(key==='shape'){let v=H.pick(SN),w=H.pick(SN.filter(s=>SH[s].n!==SH[v].n));vals.shape=Array(n-1).fill(v).concat([w]);}
      else vals.shape=noSingle(H,n,SN.filter(s=>s!=='rectangle'));
      if(key==='size'){const v=H.pick(['big','small']);vals.size=Array(n-1).fill(v).concat([v==='big'?'small':'big']);}
      else vals.size=Array(n).fill(H.pick(['big','small']));
      /* the odd item is last in vals: move it to a random spot, keep others aligned */
      let items=[];for(let i=0;i<n;i++)items.push({col:vals.col[i],shape:vals.shape[i],size:vals.size[i]});
      const odd=items.pop();const pos=H.rnd(0,n-1);items.splice(pos,0,odd);
      /* check: on key, exactly one item differs; on other attributes, no lone value */
      let ok=true;['col','shape','size'].forEach(k=>{const c={};items.forEach(it=>{const v=attr(it,k);c[v]=(c[v]||0)+1;});const lone=Object.values(c).filter(x=>x===1).length;
        if(k===key){if(!(Object.keys(c).length===2&&lone===1&&c[attr(odd,k)]===1))ok=false;}else if(lone)ok=false;});
      if(!ok)continue;
      const others=items.filter((x,i)=>i!==pos)[0];
      const why=key==='col'?`${LET[pos]} is <b>${odd.col}</b>, but all the others are <b>${others.col}</b>`:key==='shape'?`${LET[pos]} is a ${SH[odd.shape].s} with ${sidesTxt(SH[odd.shape].n)}, but all the others are ${SH[others.shape].p}`:`${LET[pos]} is <b>${odd.size}</b>, but all the others are ${others.size}`;
      const kw=key==='col'?'colour':key==='shape'?'shape':'size';
      return Object.assign({sub:'odd',prompt:`Which one is the <b>odd one out</b>?`,vis:row(items),hint:`Look at colour, then shape, then size. Which one is different from all the others?`,
        explain:`Check one thing at a time: colour, shape, size.<br>It is sorted by <b>${kw}</b>: ${why}.<br>So the odd one out is <b>${LET[pos]}</b>.`+row(items,{ring:pos})},H.fixedOpts(LET.slice(0,n).split(''),pos,''));}
    throw new Error('odd: no set');}

  function gGroup(H,l){const by=H.pick(l>=1?['col','sides','sides']:['col','sides']);const ng=l>=2?3:H.pick([2,3]);
    if(by==='col'){const cs=H.shuffle(CN.slice()).slice(0,ng);const groups=cs.map(c=>({label:c[0].toUpperCase()+c.slice(1),items:[rItem(H,{col:c}),rItem(H,{col:c})]}));
      const gi=H.rnd(0,ng-1);let ex=rItem(H,{col:cs[gi]});
      return Object.assign({sub:'group',prompt:`These shapes are sorted by <b>colour</b>. Which group does the new shape go in?`,vis:hoops(groups,{extra:ex}),hint:`Look at the colour word under the new shape.`,
        explain:`The new shape is a ${desc(ex)}.<br>The groups are sorted by colour, so shape and size do not matter.<br>It goes in the <b>${groups[gi].label}</b> group.`+hoops(groups.map((g,i)=>i===gi?{label:g.label,items:g.items.concat([ex])}:g),{hl:gi})},H.fixedOpts(groups.map(g=>g.label),gi));}
    const ns=H.shuffle([0,3,4,5,6]).slice(0,ng).sort((a,b)=>a-b);const byN=n=>SN.filter(s=>SH[s].n===n);
    const groups=ns.map(n=>({label:n===0?'No straight sides':n+' sides',items:[rItem(H,{shape:H.pick(byN(n))}),rItem(H,{shape:H.pick(byN(n))})]}));
    const gi=H.rnd(0,ng-1);const n=ns[gi];let shape=H.pick(byN(n));if(n===4)shape=groups[gi].items.some(i=>i.shape==='square')?'rectangle':'square';
    const ex=rItem(H,{shape});
    return Object.assign({sub:'group',prompt:`These shapes are sorted by <b>number of sides</b>. Which group does the new shape go in?`,vis:hoops(groups,{extra:ex}),hint:`Count the straight sides of the new shape.`,
      explain:`The new shape is a ${desc(ex)}. It has ${sidesTxt(n)}.<br>Colour and size do not matter for this sort.<br>It goes in the <b>${groups[gi].label}</b> group.`+(n===4?' Squares and rectangles both have 4 sides, so they go together.':'')+hoops(groups.map((g,i)=>i===gi?{label:g.label,items:g.items.concat([ex])}:g),{hl:gi})},H.fixedOpts(groups.map(g=>g.label),gi));}

  const HOW=['By colour','By size','By number of sides','2D shapes and 3D objects'];
  function gHow(H,l){const rule=H.pick(['col','size','sides','dim']);const ng=(rule==='size'||rule==='dim')?2:(l>=2?3:H.pick([2,3]));
    for(let t=0;t<80;t++){let groups;
      if(rule==='dim'){const flat=[rItem(H),rItem(H),rItem(H)];const so=H.shuffle(['cube','sphere','cylinder','cone','square pyramid','rectangular prism']).slice(0,3).map(s=>({solid:s}));
        if(new Set(flat.map(i=>i.col)).size<2||new Set(flat.map(i=>SH[i.shape].n)).size<2||new Set(flat.map(i=>i.size)).size<2)continue;
        groups=H.shuffle([{label:'Group 1',items:flat},{label:'Group 2',items:so}]);groups.forEach((g,i)=>g.label='Group '+(i+1));
        return Object.assign({sub:'how',prompt:`How were these sorted?`,vis:hoops(groups),hint:`Are the things in each group flat, or solid things you could pick up?`,
          explain:`One group has flat <b>2D shapes</b> (${flat.map(desc).join(', ')}).<br>The other group has solid <b>3D objects</b> (${so.map(s=>s.solid).join(', ')}).<br>Colours, sizes and sides are mixed, so the rule is <b>2D shapes and 3D objects</b>.`},H.fixedOpts(HOW,3));}
      const keyVals=rule==='col'?H.shuffle(CN.slice()).slice(0,ng):rule==='size'?['big','small']:H.shuffle([0,3,4,5,6]).slice(0,ng);
      groups=keyVals.map((v,i)=>({label:'Group '+(i+1),items:[0,1,2].map(()=>rule==='col'?rItem(H,{col:v}):rule==='size'?rItem(H,{size:v}):rItem(H,{shape:H.pick(SN.filter(s=>SH[s].n===v))}))}));
      const others=['col','size','sides'].filter(k=>k!==rule);if(!fits(groups,rule)||others.some(k=>fits(groups,k)))continue;
      /* each group must be mixed in the other attributes */
      if(groups.some(g=>others.some(k=>new Set(g.items.map(it=>attr(it,k))).size<2)))continue;
      const idx=rule==='col'?0:rule==='size'?1:2;
      const lines=groups.map(g=>`${g.label}: all ${rule==='col'?'<b>'+g.items[0].col+'</b>':rule==='size'?g.items[0].size:sidesTxt(SH[g.items[0].shape].n)}`).join('<br>');
      return Object.assign({sub:'how',prompt:`How were these sorted?`,vis:hoops(groups),hint:`Find what is the SAME inside each group. Check colour, size and number of sides.`,
        explain:`Look for what is the same inside each group.<br>${lines}.<br>The other things are mixed, so they were sorted <b>${HOW[idx].toLowerCase()}</b>.`},H.fixedOpts(HOW,idx));}
    throw new Error('how: no set');}

  function gRoll(H,l){const v=H.pick(l>=1?['roll','noroll','noflat','grp','grp','both']:['roll','noroll','noflat','grp']);
    const show=list=>`<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${list.map(k=>`<figure style="margin:0;text-align:center">${H.solidSVG(k,{size:110})}<figcaption style="font-size:.95rem">${k}</figcaption></figure>`).join('')}</div>`;
    if(v==='roll'){const r=H.pick(Object.keys(ROLL)),o=H.shuffle(FLATONLY.slice()).slice(0,3),all=H.shuffle([r].concat(o));
      return Object.assign({sub:'roll',prompt:`Which object can <b>roll</b>?`,vis:show(all),hint:`Things with a curved surface can roll.`,explain:`The ${r} has a <b>curved surface</b>, so it can roll.<br>The ${o.join(', ')} only have flat faces, so they slide or stack but do not roll.<br>Answer: <b>${r}</b>.`},H.opts(r,o,{cls:'txt'}));}
    if(v==='noroll'){const r=H.pick(FLATONLY),o=Object.keys(ROLL),all=H.shuffle([r].concat(o));
      return Object.assign({sub:'roll',prompt:`Which object can <b>NOT</b> roll?`,vis:show(all),hint:`Look for the one with only flat faces and no curved surface.`,explain:`The ${o.join(', ')} all have a curved surface, so they can roll.<br>The ${r} has only <b>flat faces</b>, so it cannot roll. It can slide or stack.<br>Answer: <b>${r}</b>.`},H.opts(r,o,{cls:'txt'}));}
    if(v==='noflat'){const o=H.shuffle(['cube','cylinder','cone','rectangular prism','square pyramid']).slice(0,3),all=H.shuffle(['sphere'].concat(o));
      return Object.assign({sub:'roll',prompt:`Which object has <b>no flat faces</b> at all?`,vis:show(all),hint:`Could it sit still on a flat face?`,explain:`The ${o.join(', ')} each have at least one flat face.<br>A sphere (like a ball) is curved all over, so it has no flat faces.<br>Answer: <b>sphere</b>.`},H.opts('sphere',o,{cls:'txt'}));}
    if(v==='both'){const o=['sphere','cube',H.pick(['rectangular prism','square pyramid'])],all=H.shuffle(['cylinder'].concat(o));
      return Object.assign({sub:'roll',prompt:`Which object can <b>roll AND stack</b>?`,vis:show(all),hint:`It needs a curved side to roll and flat ends to stack.`,explain:`The sphere rolls, but nothing can stack on it. The ${o[1]} and the ${o[2]} have only flat faces, so they do not roll.<br>A cylinder (like a tin can) has a curved side to roll and two flat ends to stack.<br>Answer: <b>cylinder</b>.`},H.opts('cylinder',o,{cls:'txt'}));}
    /* which group */
    const kind=H.pick(['roll','curve']);const L=kind==='roll'?['Can roll','Cannot roll']:['Has a curved surface','Only flat faces'];
    const k=H.pick(['sphere','cylinder','cone'].concat(FLATONLY));const gi=ROLL[k]?0:1;
    const ex0=H.shuffle(Object.keys(ROLL).filter(x=>x!==k)).slice(0,2),ex1=H.shuffle(FLATONLY.filter(x=>x!==k)).slice(0,2);
    const groups=[{label:L[0],items:ex0.map(s=>({solid:s}))},{label:L[1],items:ex1.map(s=>({solid:s}))}];
    return Object.assign({sub:'roll',prompt:`Which group does the <b>${k}</b> go in?`,vis:hoops(groups,{extra:{solid:k}}),hint:kind==='roll'?`Would it roll if you pushed it on the floor?`:`Does it have any curved part?`,
      explain:gi===0?`The ${k} has a <b>curved surface</b>${k==='sphere'?' all over':''}, so it can roll.<br>It goes in <b>${L[0]}</b>.`:`The ${k} has only <b>flat faces</b>, with no curved part, so it cannot roll (it slides or stacks).<br>It goes in <b>${L[1]}</b>.`},H.fixedOpts(L,gi));}

  function gCount(H,l){const n=H.rnd(l>=1?9:7,l>=1?12:9);
    for(let t=0;t<60;t++){const items=Array.from({length:n},()=>rItem(H,{col:H.pick(CN.slice(0,l>=1?4:3))}));
      const mode=H.pick(l>=2?['col','sides','and','not']:l>=1?['col','sides','and']:['col','shape']);
      let test,ask,rule;
      if(mode==='col'){const c=H.pick(items).col;test=i=>i.col===c;ask=`Sort them by colour. How many are in the <b>${c}</b> group?`;rule=`the ${c} ones`;}
      else if(mode==='shape'){const s=H.pick(items).shape;test=i=>i.shape===s;ask=`Sort them by shape. How many <b>${SH[s].p}</b> are there?`;rule=`the ${SH[s].p}`;}
      else if(mode==='sides'){const k=H.pick([3,4]);test=i=>SH[i.shape].n===k;ask=`Sort them by number of sides. How many shapes have <b>exactly ${k} sides</b>?`;rule=k===4?'shapes with 4 sides (squares AND rectangles)':'shapes with 3 sides (triangles)';}
      else if(mode==='and'){const it0=H.pick(items);const c=it0.col,k=SH[it0.shape].n||H.pick([3,4]);test=i=>i.col===c&&SH[i.shape].n===k;ask=`How many shapes are <b>${c} AND have ${k===0?'no straight sides':k+' sides'}</b>?`;rule=`shapes that are ${c} and have ${sidesTxt(k)}`;}
      else{const s=H.pick(['circle','triangle']);test=i=>i.shape!==s;ask=`How many shapes are <b>NOT ${SH[s].p}</b>?`;rule=`shapes that are not ${SH[s].p}`;}
      const a=items.filter(test).length;if(a<2||a>n-2)continue;
      return Object.assign({sub:'count',prompt:ask,vis:pile(items),hint:`Point to each one that fits and count as you go. Tick them off so you don't count one twice.`,
        explain:`Find ${rule}. They are ringed below.<br>Count them: ${Array.from({length:a},(x,i)=>i+1).join(', ')}.<br>Answer: <b>${a}</b>.`+pile(items,test)},H.num(a));}
    throw new Error('count: no set');}

  function rules(H){const c=H.pick(CN.slice(0,4));const A={label:c[0].toUpperCase()+c.slice(1),test:i=>i.col===c,txt:`<b>${c}</b>`,q:`Is it ${c}?`,yes:`it is <b>${c}</b>`,no:`it is not ${c}`};
    const b=H.pick(['tri','four','big','curve']);
    const B=b==='tri'?{label:'Triangles',test:i=>i.shape==='triangle',txt:'a triangle',q:'Is it a triangle?',yes:'it is a triangle',no:'it is not a triangle'}
      :b==='four'?{label:'4 sides',test:i=>SH[i.shape].n===4,txt:'has 4 sides',q:'Does it have 4 sides?',yes:'it has 4 sides',no:'it does not have 4 sides'}
      :b==='big'?{label:'Big',sz:1,test:i=>i.size==='big',txt:'big',q:'Is it big?',yes:'it is big',no:'it is small, not big'}
      :{label:'Circles',test:i=>i.shape==='circle',txt:'a circle',q:'Is it a circle?',yes:'it is a circle',no:'it is not a circle'};
    return {A,B,c};}
  function vennSet(H,A,B,c,n){for(let t=0;t<200;t++){const items=Array.from({length:n},()=>rItem(H,{col:H.chance(0.5)?c:H.pick(CN.slice(0,4))}));const cnt=[0,0,0,0];items.forEach(it=>cnt[region(A,B,it)]++);
      if(cnt[0]<=4&&cnt[1]<=4&&cnt[2]<=3&&cnt[3]<=4&&cnt[0]&&cnt[1]&&cnt[2])return {items,cnt};}throw new Error('venn: no set');}
  function gVenn(H,l){const {A,B,c}=rules(H);const n=l>=2?9:7;const {items,cnt}=vennSet(H,A,B,c,n);const R=[`Only in "${A.label}"`,`Only in "${B.label}"`,'In the middle (both)','Outside (neither)'];
    const why=it=>`${A.q} ${A.test(it)?'Yes':'No'}: ${A.test(it)?A.yes:A.no}. ${B.q} ${B.test(it)?'Yes':'No'}: ${B.test(it)?B.yes:B.no}`;
    if(l>=2&&H.chance(0.5)){const q=H.pick([2,0,1]);const nm=q===2?`in the <b>middle</b> (${A.label} AND ${B.label})`:q===0?`${A.label} but <b>NOT</b> ${B.label}`:`${B.label} but <b>NOT</b> ${A.label}`;
      return Object.assign({sub:'venn',prompt:`How many shapes are ${nm}?`,vis:venn(A,B,items),hint:`The middle part is inside BOTH circles. "Only" parts are inside one circle but not the other.`,
        explain:`The left circle is "${A.label}" and the right circle is "${B.label}".<br>${q===2?'The middle is where the circles overlap: those shapes fit both rules':'Look in the part of that circle that is not in the overlap'}.<br>Count them: <b>${cnt[q]}</b>.`+venn(A,B,items)},H.num(cnt[q]));}
    let ex,g;for(let t=0;t<50;t++){ex=rItem(H,{col:H.chance(0.5)?c:H.pick(CN.slice(0,4))});g=region(A,B,ex);if(t>5||g!==3||H.chance(0.3))break;}
    return Object.assign({sub:'venn',prompt:`This Venn diagram sorts by two rules. Where does the new shape go?`,vis:venn(A,B,items,{extra:ex}),hint:`Ask two questions: ${A.q} ${B.q}`,
      explain:`The new shape is a ${desc(ex)}.<br>${why(ex)}.<br>So it goes <b>${R[g].toLowerCase()}</b>.`},H.fixedOpts(R,g));}

  function gTwo(H,l){const {A,B,c}=rules(H);
    for(let t=0;t<100;t++){const want=H.shuffle([2,0,1,H.pick([0,1,3])]);const items=want.map(w=>{let it;for(let k=0;k<300;k++){it=rItem(H,{col:H.chance(0.5)?c:H.pick(CN.slice(0,4))});if(region(A,B,it)===w)break;}return it;});const both=items.map(it=>A.test(it)&&B.test(it));
      if(both.filter(Boolean).length!==1)continue;if(!items.some(it=>A.test(it)&&!B.test(it))||!items.some(it=>!A.test(it)&&B.test(it)))continue;const pos=both.indexOf(true);
            return Object.assign({sub:'tworule',prompt:`Which shape is ${A.txt} <b>AND</b> ${B.label==='4 sides'?'has 4 sides':B.txt}?`,vis:row(items),hint:`Both rules must be true. Cross out any that break one rule.`,
        explain:items.map((it,i)=>`${LET[i]} (${it.col} ${SH[it.shape].s}): ${A.test(it)?A.yes:A.no}, ${B.test(it)?B.yes:B.no}`).join('<br>')+`<br>Only <b>${LET[pos]}</b> fits both rules.`+row(items,{ring:pos})},H.fixedOpts(['A','B','C','D'],pos,''));}
    throw new Error('tworule: no set');}

  return {id:'sorting',title:'Sorting & Classifying',icon:'🧺',code:'MA1-DATA-01 · MA1-2DS-01 · MA1-3DS-01 → MA2',
    blurb:'Sorting by colour, shape, size and number of sides, 3D objects that roll or stack, and two-rule (Venn) sorting.',
    subs:l=>l>=2?['odd','group','how','roll','count','venn','tworule']:l>=1?['odd','group','how','roll','count','venn']:['odd','group','how','roll','count'],
    gen(H,l,sub){HH=H;if(sub==='odd')return gOdd(H,l);if(sub==='group')return gGroup(H,l);if(sub==='how')return gHow(H,l);if(sub==='roll')return gRoll(H,l);
      if(sub==='venn')return gVenn(H,l);if(sub==='tworule')return gTwo(H,l);return gCount(H,l);},
    example(H){HH=H;const P=[{col:'red',shape:'triangle',size:'big'},{col:'blue',shape:'square',size:'big'},{col:'red',shape:'circle',size:'small'},{col:'blue',shape:'triangle',size:'small'},{col:'red',shape:'rectangle',size:'big'},{col:'blue',shape:'circle',size:'big'}];
      const byCol=hoops([{label:'Red',items:P.filter(i=>i.col==='red')},{label:'Blue',items:P.filter(i=>i.col==='blue')}]);
      const bySide=hoops([{label:'3 sides',items:P.filter(i=>SH[i.shape].n===3)},{label:'4 sides',items:P.filter(i=>SH[i.shape].n===4)},{label:'No straight sides',items:P.filter(i=>SH[i.shape].n===0)}]);
      return {html:`<p><b>Sorting</b> means putting things that are the same in some way into a group. Here are 6 shapes (the colour word is under each one):</p>${pile(P)}
<p><b>Sort by colour:</b> the red ones go together and the blue ones go together. Shape and size don't matter.</p>${byCol}
<p><b>Sort the same shapes by number of sides:</b> the triangles have 3 sides, the square and the rectangle both have 4 sides, and the circles have no straight sides.</p>${bySide}
<p><b>3D objects:</b> things with a curved surface (sphere, cylinder, cone) can <b>roll</b>. Things with flat faces (cube, prism) can <b>stack</b> or slide. A cylinder can do both!</p>${hoops([{label:'Can roll',items:[{solid:'sphere'},{solid:'cylinder'},{solid:'cone'}]},{label:'Cannot roll',items:[{solid:'cube'},{solid:'rectangular prism'},{solid:'square pyramid'}]}])}
<p><b>Two rules at once:</b> in a Venn diagram, the middle is for things that fit <b>both</b> rules, like a shape that is red <b>and</b> a triangle. Shapes that fit neither rule go outside.</p>${venn({label:'Red',test:i=>i.col==='red'},{label:'Triangles',test:i=>i.shape==='triangle'},P)}`};}};
})());

/* ===== Faces, edges and vertices of 3D objects (school topic, 29 Oct 2026). Not on the mastery path.
   Conventions used everywhere in this topic (stated in the explanations too):
   face = flat surface; edge = where two faces/surfaces meet; vertex = corner point where edges meet.
   cylinder: 2 flat faces + 1 curved surface, 2 edges, 0 vertices.
   cone: 1 flat face + 1 curved surface, 1 edge, 1 vertex (the apex, the pointy top).
   sphere: 1 curved surface, 0 flat faces, 0 edges, 0 vertices. ===== */
window.DAILY_TOPICS_EXTRA.push((function(){
  const AX=0.5,AY=0.42;
  const box=(w,h,d)=>({V:[[0,0,0],[w,0,0],[w,h,0],[0,h,0],[0,0,d],[w,0,d],[w,h,d],[0,h,d]],F:[[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]]});
  const GEO={
    'cube':box(100,100,100),
    'rectangular prism':box(160,90,90),
    'triangular prism':{V:[[0,0,0],[120,0,0],[60,100,0],[0,0,130],[120,0,130],[60,100,130]],F:[[0,1,2],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]]},
    'square pyramid':{V:[[0,0,0],[130,0,0],[130,0,130],[0,0,130],[65,140,65]],F:[[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]},
    'triangular pyramid':{V:[[0,0,0],[150,0,0],[40,0,120],[70,135,35]],F:[[0,1,2],[0,1,3],[1,2,3],[2,0,3]]}};
  /* facts; f = flat faces, c = curved surfaces */
  const D={
    'cube':{f:6,c:0,e:12,v:8,fs:'6 squares',fc:'top 1 + bottom 1 + 4 around the sides = 6',ec:'4 around the top + 4 around the bottom + 4 going up the sides = 12',vc:'4 corners on top + 4 corners on the bottom = 8',like:'a dice'},
    'rectangular prism':{f:6,c:0,e:12,v:8,fs:'6 rectangles',fc:'top 1 + bottom 1 + 4 around the sides = 6',ec:'4 around the top + 4 around the bottom + 4 going up the sides = 12',vc:'4 corners on top + 4 corners on the bottom = 8',like:'a cereal box'},
    'triangular prism':{f:5,c:0,e:9,v:6,fs:'2 triangles and 3 rectangles',fc:'2 triangle ends + 3 rectangles = 5',ec:'3 on the front triangle + 3 on the back triangle + 3 joining them = 9',vc:'3 corners on the front triangle + 3 on the back triangle = 6',like:'a tent or a Toblerone box'},
    'square pyramid':{f:5,c:0,e:8,v:5,fs:'1 square and 4 triangles',fc:'1 square base + 4 triangles = 5',ec:'4 around the square base + 4 going up to the top = 8',vc:'4 corners on the base + 1 at the top = 5',like:'the pyramids in Egypt'},
    'triangular pyramid':{f:4,c:0,e:6,v:4,fs:'4 triangles',fc:'1 triangle base + 3 triangles = 4',ec:'3 around the base + 3 going up to the top = 6',vc:'3 corners on the base + 1 at the top = 4',like:'a party hat with a triangle base'},
    'cylinder':{f:2,c:1,e:2,v:0,fs:'2 circles',like:'a tin can'},
    'cone':{f:1,c:1,e:1,v:1,fs:'1 circle',like:'an ice-cream cone'},
    'sphere':{f:0,c:1,e:0,v:0,fs:'none',like:'a ball'}};
  const POLY=Object.keys(GEO),CURV=['cylinder','cone','sphere'],ALL=POLY.concat(CURV);
  const W={f:'faces',e:'edges',v:'vertices'},W1={f:'face',e:'edge',v:'vertex'};
  const CONV='(We count a <b>face</b> as a flat surface. A curved surface is counted on its own.)';
  /* ---- polyhedron drawing: oblique view, hidden edges dashed ---- */
  function geom(k){const g=GEO[k];const P=g.V.map(([x,y,z])=>[x+AX*z,y+AY*z]);const cen=[0,1,2].map(i=>g.V.reduce((s,p)=>s+p[i],0)/g.V.length);
    const vis=g.F.map(f=>{const p=f.map(i=>g.V[i]);let n=[0,0,0];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);}
      const fc=[0,1,2].map(i=>p.reduce((s,q)=>s+q[i],0)/p.length);if(n[0]*(fc[0]-cen[0])+n[1]*(fc[1]-cen[1])+n[2]*(fc[2]-cen[2])<0)n=n.map(x=>-x);return n[0]*AX+n[1]*AY-n[2]>1e-6;});
    const E=[],ek={};g.F.forEach((f,fi)=>f.forEach((a,i)=>{const b=f[(i+1)%f.length],key=Math.min(a,b)+'-'+Math.max(a,b);if(!ek[key]){ek[key]={a:Math.min(a,b),b:Math.max(a,b),faces:[]};E.push(ek[key]);}ek[key].faces.push(fi);}));
    E.forEach(e=>e.hidden=!e.faces.some(fi=>vis[fi]));const vh=g.V.map((p,i)=>!g.F.some((f,fi)=>vis[fi]&&f.includes(i)));
    return {g,P,vis,E,vh};}
  const FILL='#bfdbfe',HF='#fde047',HE='#ea580c',HV='#dc2626';
  function poly(k,{size=170,hl={},labels=false}={}){const {g,P,vis,E,vh}=geom(k);
    const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),pad=16,sc=Math.min(170/(x1-x0),130/(y1-y0));
    const S=i=>[(pad+(P[i][0]-x0)*sc).toFixed(1),(pad+(y1-P[i][1])*sc).toFixed(1)];const w=(x1-x0)*sc+2*pad,h=(y1-y0)*sc+2*pad;
    let b='';g.F.forEach((f,fi)=>{if(!vis[fi])return;const on=hl.faces==='all'||(hl.face!=null&&hl.face===fi);b+=`<polygon points="${f.map(i=>S(i).join(',')).join(' ')}" fill="${on?HF:FILL}" stroke="none"/>`;});
    const hlE=e=>hl.edges==='all'||(hl.edge&&((hl.edge[0]===e.a&&hl.edge[1]===e.b)||(hl.edge[0]===e.b&&hl.edge[1]===e.a)));
    E.filter(e=>e.hidden).forEach(e=>{const [p,q]=[S(e.a),S(e.b)];b+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${hlE(e)?HE:'#1f2937'}" stroke-width="${hlE(e)?5:2.5}" stroke-dasharray="7 5"/>`;});
    E.filter(e=>!e.hidden).forEach(e=>{const [p,q]=[S(e.a),S(e.b)];b+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${hlE(e)?HE:'#1f2937'}" stroke-width="${hlE(e)?7:3.5}" stroke-linecap="round"/>`;});
    const hv=i=>hl.verts==='all'||hl.vert===i;
    g.V.forEach((p,i)=>{if(!hv(i))return;const s=S(i);b+=`<circle cx="${s[0]}" cy="${s[1]}" r="7" fill="${vh[i]?'#fff':HV}" stroke="${HV}" stroke-width="3"/>`;});
    if(hl.edges==='all'||hl.verts==='all'){const L=hl.edges==='all'?E.map(e=>{const p=S(e.a),q=S(e.b);return [(+p[0]+ +q[0])/2,(+p[1]+ +q[1])/2];}):g.V.map((p,i)=>S(i).map(Number));
      if(labels)L.forEach((p,i)=>{b+=`<text x="${p[0]}" y="${p[1]-8}" font-size="13" font-weight="bold" text-anchor="middle" fill="#7c2d12" font-family="sans-serif" stroke="#fff" stroke-width="3" paint-order="stroke">${i+1}</text>`;});}
    if(hl.text)hl.text.forEach(t=>{const s=t.v!=null?S(t.v).map(Number):null;const x=s?s[0]+(t.dx||0):t.x,y=s?s[1]+(t.dy||0):t.y;b+=`<text x="${x}" y="${y}" font-size="15" font-weight="bold" fill="${t.col||'#111827'}" font-family="sans-serif" stroke="#fff" stroke-width="4" paint-order="stroke">${t.s}</text>`;});
    const ex=hl.text?80:0,ey=hl.text?30:0;return `<svg class="shape" viewBox="${-ex/2} ${-ey/2} ${w+ex} ${h+ey}" width="${Math.round(size*(w+ex)/200)}" style="max-width:100%;height:auto" role="img" aria-label="${k}">${b}</svg>`;}
  /* curved solids: hl = 'flat' | 'curved' | 'edges' | 'apex' */
  function curved(k,{size=170,hl=''}={}){const st='stroke="#1f2937" stroke-width="3.5"',dash='stroke="#1f2937" stroke-width="2.5" stroke-dasharray="7 5" fill="none"';const F=FILL,C='#c7d2fe';let b='';
    const eS=hl==='edges'?`stroke="${HE}" stroke-width="7"`:st,eD=hl==='edges'?`stroke="${HE}" stroke-width="5" stroke-dasharray="7 5" fill="none"`:dash;
    if(k==='cylinder'){b=`<rect x="40" y="40" width="120" height="110" fill="${hl==='curved'?HF:C}"/><line x1="40" y1="40" x2="40" y2="150" ${st}/><line x1="160" y1="40" x2="160" y2="150" ${st}/>`+
      `<path d="M40 150 A60 16 0 0 0 160 150" fill="none" ${eS}/><path d="M40 150 A60 16 0 0 1 160 150" ${eD}/><ellipse cx="100" cy="40" rx="60" ry="16" fill="${hl==='flat'?HF:F}" ${eS}/>`;}
    else if(k==='cone'){b=`<polygon points="40,150 100,25 160,150" fill="${hl==='curved'?HF:C}"/><line x1="40" y1="150" x2="100" y2="25" ${st}/><line x1="160" y1="150" x2="100" y2="25" ${st}/>`+
      (hl==='flat'?`<ellipse cx="100" cy="150" rx="60" ry="16" fill="${HF}" opacity=".8"/>`:'')+`<path d="M40 150 A60 16 0 0 0 160 150" fill="none" ${eS}/><path d="M40 150 A60 16 0 0 1 160 150" ${eD}/>`+(hl==='apex'?`<circle cx="100" cy="25" r="8" fill="${HV}" stroke="${HV}" stroke-width="3"/>`:'');}
    else b=`<circle cx="100" cy="95" r="68" fill="${hl==='curved'?HF:C}" ${st}/><path d="M32 95 A68 18 0 0 0 168 95" fill="none" stroke="#1f2937" stroke-width="2"/><path d="M32 95 A68 18 0 0 1 168 95" ${dash}/>`;
    return `<svg class="shape" viewBox="0 0 200 175" width="${size}" style="max-width:100%;height:auto" role="img" aria-label="${k}">${b}</svg>`;}
  const pic=(k,o)=>GEO[k]?poly(k,o):curved(k,o);
  const fig=(k,o={})=>`<figure style="margin:0;text-align:center;display:inline-block">${pic(k,Object.assign({size:130},o))}<figcaption style="font-size:.95rem">${o.cap||k}</figcaption></figure>`;
  const rowF=(list,o)=>`<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:flex-end">${list.map(k=>fig(k,o)).join('')}</div>`;
  const art=k=>/^[aeiou]/.test(k)?'an':'a';
  const Cap=s=>s[0].toUpperCase()+s.slice(1);
  /* counting steps for any solid and property */
  const countSteps=(k,p)=>{const d=D[k];if(GEO[k])return d[p+'c'];
    if(p==='f')return k==='sphere'?'a sphere has no flat faces, only 1 curved surface':`${d.f} flat circle face${d.f>1?'s':''}, plus 1 curved surface (not counted as a face)`;
    if(p==='e')return k==='cylinder'?'1 edge where the top meets the curved surface + 1 at the bottom = 2':k==='cone'?'1 edge where the circle base meets the curved surface':'no faces meet, so 0 edges';
    return k==='cone'?'1 vertex: the pointy top (the apex)':`no corners, so 0 vertices`;};
  const hlFor=(k,p)=>GEO[k]?(p==='f'?{faces:'all'}:p==='e'?{edges:'all'}:{verts:'all'}):(p==='f'?'flat':p==='e'?'edges':'apex');

  function gCount(H,l){const k=H.pick(l>=2?POLY:l>=1?POLY:['cube','square pyramid','triangular prism']);const p=H.pick(l>=1?['f','e','v','e','v']:['f','v']);const d=D[k];
    const hint=p==='f'?'Faces are the flat surfaces. Count the ones you can see, then the hidden ones at the back and bottom.':p==='e'?'Edges are the lines where two faces meet. Count the solid lines and the dashed (hidden) lines.':'Vertices are the corners. Count the corners you can see, then the hidden ones where the dashed lines meet.';
    return Object.assign({sub:'count',prompt:`How many <b>${W[p]}</b> does this ${k} have?`,vis:poly(k,{})+`<div class="small">Dashed lines are hidden edges at the back.</div>`,hint,
      explain:`${Cap(W[p])} are ${p==='f'?'the flat surfaces':p==='e'?'where two faces meet':'the corner points'}.<br>Count them in parts: ${countSteps(k,p)}.<br>A ${k} has <b>${d[p]}</b> ${W[p]}.`+poly(k,{hl:hlFor(k,p),labels:true})},H.num(d[p]));}

  function gWhich(H,l){for(let t=0;t<50;t++){const p=H.pick(['f','e','v']);const k=H.pick(POLY);const val=D[k][p];
      const others=H.shuffle(POLY.filter(x=>x!==k&&D[x][p]!==val));if(others.length<2)continue;const opt=others.slice(0,l>=1?3:2);if(l>=1&&p==='v'&&H.chance(0.4)&&!opt.includes('cone'))opt[opt.length-1]='cone';
      if(opt.some(x=>D[x][p]===val))continue;const list=H.shuffle([k].concat(opt));
      return Object.assign({sub:'which',prompt:`Which object has exactly <b>${val} ${W[p]}</b>?`,vis:rowF(list,{size:120}),hint:`Count the ${W[p]} on each one. Dashed lines show hidden edges.`,
        explain:list.map(x=>`${Cap(x)}: ${D[x][p]} ${W[p]}${x==='cone'&&p==='v'?' (the apex)':''}`).join('<br>')+`<br>Only the <b>${k}</b> has ${val} ${W[p]}.`},H.opts(k,opt,{cls:'txt'}));}
    throw new Error('which: none');}

  const DESC={'cube':['I have 6 flat faces and they are all squares.','I have 6 square faces, 12 edges and 8 vertices.'],
    'rectangular prism':['I have 6 flat faces. They are rectangles, and they are not all squares.','I am shaped like a cereal box: 6 rectangle faces, 12 edges, 8 vertices.'],
    'triangular prism':['I have 2 triangle faces and 3 rectangle faces.','I have 5 faces, 9 edges and 6 vertices.'],
    'square pyramid':['I have 1 square face and 4 triangle faces that meet at a point.','I have 5 faces, 8 edges and 5 vertices.'],
    'triangular pyramid':['All 4 of my faces are triangles.','I have 4 faces, 6 edges and 4 vertices.'],
    'cylinder':['I have 2 flat circle faces and 1 curved surface. I can roll and stack.'],
    'cone':['I have 1 flat circle face, 1 curved surface and 1 pointy vertex.'],
    'sphere':['I have 1 curved surface, no flat faces, no edges and no vertices.']};
  function gName(H,l){const k=H.pick(ALL);const ds=DESC[k];const s=l>=1?H.pick(ds):ds[0];
    let dis=H.shuffle(ALL.filter(x=>x!==k));if(k==='cube')dis=['rectangular prism'].concat(dis.filter(x=>x!=='rectangular prism'));if(k==='rectangular prism')dis=['cube'].concat(dis.filter(x=>x!=='cube'));
    const d=D[k];const facts=GEO[k]?`A ${k} has ${d.f} faces (${d.fs}), ${d.e} edges and ${d.v} vertices`:k==='sphere'?'A sphere has 1 curved surface and no flat faces, edges or vertices':k==='cone'?'A cone has 1 flat circle face, 1 curved surface, 1 edge and 1 vertex (the apex)':'A cylinder has 2 flat circle faces, 1 curved surface, 2 edges and 0 vertices';
    return Object.assign({sub:'name',prompt:`What am I? <i>“${s}”</i>`,hint:`Picture each object and check every clue.`,
      explain:`Check each clue.<br>${facts}, so every clue fits.<br>It is like ${d.like}. Answer: <b>${k}</b>.`+rowF([k],{size:140})},H.opts(k,dis,{cls:'txt'}));}

  function gCurved(H,l){const v=H.pick(l>=1?['onlyflat','both','nflat','ncurved','edgecv','edgecv']:['onlyflat','both','nflat','ncurved']);
    if(v==='onlyflat'){const k=H.pick(POLY),o=H.shuffle(CURV.slice());const list=H.shuffle([k].concat(o));
      return Object.assign({sub:'curved',prompt:`Which object has <b>only flat surfaces</b> (no curved surface)?`,vis:rowF(list,{size:120}),hint:`Could it roll? Things with a curved surface can roll.`,
        explain:`The ${o.join(', ')} each have a curved surface.<br>The ${k} has only flat faces (${D[k].fs}).<br>Answer: <b>${k}</b>.`},H.opts(k,o,{cls:'txt'}));}
    if(v==='both'){const k=H.pick(['cylinder','cone']),o=['sphere'].concat(H.shuffle(POLY.slice()).slice(0,2));const list=H.shuffle([k].concat(o));
      return Object.assign({sub:'curved',prompt:`Which object has <b>both</b> flat faces <b>and</b> a curved surface?`,vis:rowF(list,{size:120}),hint:`Look for one flat part AND one curved part.`,
        explain:`A sphere is only curved. The ${o.slice(1).join(' and the ')} only have flat faces.<br>The ${k} has ${k==='cylinder'?'2 flat circle faces':'1 flat circle face'} and 1 curved surface.<br>Answer: <b>${k}</b>.`},H.opts(k,o,{cls:'txt'}));}
    if(v==='nflat'){const k=H.pick(CURV);return Object.assign({sub:'curved',prompt:`How many <b>flat faces</b> does a ${k} have?`,vis:curved(k,{}),hint:`Only count the flat parts, not the curved part.`,
      explain:`${CONV}<br>${Cap(countSteps(k,'f'))}.<br>Answer: <b>${D[k].f}</b>.`+curved(k,{hl:'flat',size:140})},H.num(D[k].f));}
    if(v==='ncurved'){const k=H.pick(CURV.concat(H.pick(POLY)));return Object.assign({sub:'curved',prompt:`How many <b>curved surfaces</b> does ${art(k)} ${k} have?`,vis:pic(k,{}),hint:`A curved surface is bendy, like the side of a can.`,
      explain:`${GEO[k]?`A ${k} has only flat faces (${D[k].fs})`:`The ${k} has one curved surface${k==='sphere'?' all the way round':' going round it'}`}.<br>Answer: <b>${D[k].c}</b>.`+pic(k,GEO[k]?{size:140}:{hl:'curved',size:140})},H.num(D[k].c));}
    /* edges / vertices of curved solids, with the convention stated */
    const k=H.pick(['cylinder','cone']),p=k==='cylinder'?H.pick(['e','v']):H.pick(['e','v']);
    return Object.assign({sub:'curved',prompt:`How many <b>${W[p]}</b> does a ${k} have? <span class="small">(An edge is where two surfaces meet. A vertex is a corner or point.)</span>`,vis:curved(k,{}),hint:p==='e'?`Find where the flat circle meets the curved surface.`:`Is there a pointy corner anywhere?`,
      explain:`${p==='e'?'An edge is where two surfaces meet.':'A vertex is a corner or a point.'}<br>${Cap(countSteps(k,p))}.<br>Answer: <b>${D[k][p]}</b>.`+curved(k,{hl:p==='e'?'edges':(k==='cone'?'apex':''),size:140})},H.num(D[k][p]));}

  function gShape(H,l){const v=H.pick(l>=1?['allsq','base','tpr','tpr','spy','cylf']:['allsq','base','tpr','cylf']);
    if(v==='allsq'){const k=H.pick(['cube','triangular pyramid']);const a=k==='cube'?'squares':'triangles';
      return Object.assign({sub:'shape',prompt:`All the faces of a <b>${k}</b> are the same shape. What shape are they?`,vis:poly(k,{}),hint:`Look at the front face. The others match it.`,
        explain:`Look at one face, then check the others.<br>A ${k} has ${D[k].fs}.<br>Answer: <b>${a}</b>.`+poly(k,{hl:{faces:'all'},size:140})},H.fixedOpts(['squares','triangles','circles','rectangles'],['squares','triangles','circles','rectangles'].indexOf(a)));}
    if(v==='base'){const k=H.pick(['square pyramid','triangular pyramid','cone','cylinder']);const a=k==='square pyramid'?'square':k==='triangular pyramid'?'triangle':'circle';const L=['square','triangle','circle','rectangle'];
      return Object.assign({sub:'shape',prompt:`What shape is the <b>flat bottom face</b> of this ${k}?`,vis:pic(k,{}),hint:`Imagine standing it on paper and tracing around the bottom.`,
        explain:`If you trace around the bottom of ${art(k)} ${k}, you get ${art(a)} ${a}.<br>${k==='square pyramid'?'Its other 4 faces are triangles.':k==='triangular pyramid'?'All 4 of its faces are triangles.':'The rest of it is a curved surface.'}<br>Answer: <b>${a}</b>.`},H.fixedOpts(L,L.indexOf(a)));}
    if(v==='tpr'){const q=H.pick(['tri','rect']);const a=q==='tri'?2:3;
      return Object.assign({sub:'shape',prompt:`A triangular prism has 5 faces. How many of them are <b>${q==='tri'?'triangles':'rectangles'}</b>?`,vis:poly('triangular prism',{}),hint:`The two ends are one shape. The faces joining them are another shape.`,
        explain:`The 2 ends (front and back) are triangles.<br>The 3 faces joining the ends are rectangles: 2 + 3 = 5 faces.<br>Answer: <b>${a}</b>.`+poly('triangular prism',{hl:{faces:'all'},size:140})},H.num(a));}
    if(v==='spy'){const q=H.pick(['tri','sq']);const a=q==='tri'?4:1;
      return Object.assign({sub:'shape',prompt:`A square pyramid has 5 faces. How many of them are <b>${q==='tri'?'triangles':'squares'}</b>?`,vis:poly('square pyramid',{}),hint:`Look at the bottom, then at the sides that meet at the top.`,
        explain:`The bottom (base) is 1 square.<br>The 4 sides are triangles that meet at the top: 1 + 4 = 5 faces.<br>Answer: <b>${a}</b>.`},H.num(a));}
    return Object.assign({sub:'shape',prompt:`What shape are the 2 flat faces of a <b>cylinder</b>?`,vis:curved('cylinder',{}),hint:`Look at the top of a tin can.`,
      explain:`A cylinder has 2 flat faces, one at each end, and 1 curved surface.<br>Each flat face is a circle.<br>Answer: <b>circles</b>.`+curved('cylinder',{hl:'flat',size:140})},H.fixedOpts(['squares','triangles','circles','rectangles'],2));}

  function gCompare(H,l){for(let t=0;t<60;t++){const p=H.pick(['f','e','v']);const [a,b]=H.shuffle(POLY.slice()).slice(0,2);const va=D[a][p],vb=D[b][p];
      if(l>=2&&va!==vb){const hi=va>vb?a:b,lo=va>vb?b:a;const dd=Math.abs(va-vb);
        return Object.assign({sub:'compare',prompt:`How many more <b>${W[p]}</b> does ${art(hi)} ${hi} have than ${art(lo)} ${lo}?`,vis:rowF([hi,lo],{size:130}),hint:`Count the ${W[p]} on each, then take away.`,
          explain:`${Cap(hi)}: ${countSteps(hi,p)}.<br>${Cap(lo)}: ${countSteps(lo,p)}.<br>${D[hi][p]} − ${D[lo][p]} = <b>${dd}</b> more.`},H.num(dd));}
      if(l<2&&va===vb&&!H.chance(0.3))continue;
      const L=[Cap(a),Cap(b),'They have the same number'];const ans=va>vb?0:va<vb?1:2;
      return Object.assign({sub:'compare',prompt:`Which has more <b>${W[p]}</b>: ${art(a)} ${a} or ${art(b)} ${b}?`,vis:rowF([a,b],{size:130}),hint:`Count the ${W[p]} on each one, then compare.`,
        explain:`${Cap(a)}: ${countSteps(a,p)}.<br>${Cap(b)}: ${countSteps(b,p)}.<br>${ans===2?`Both have ${va}, so <b>they have the same number</b>.`:`${Math.max(va,vb)} is more than ${Math.min(va,vb)}, so the <b>${ans===0?a:b}</b> has more.`}`},H.fixedOpts(L,ans));}
    throw new Error('compare: none');}

  return {id:'fev',title:'Faces, Edges & Vertices',icon:'🧊',dedupByText:true,code:'MA1-3DS-01 → MA2-3DS-01',
    blurb:'Counting the faces, edges and vertices of 3D objects, flat and curved surfaces, and the shapes of faces.',
    subs:l=>l>=1?['count','which','name','curved','shape','compare']:['count','which','name','curved','shape'],
    gen(H,l,sub){if(sub==='count')return gCount(H,l);if(sub==='which')return gWhich(H,l);if(sub==='name')return gName(H,l);if(sub==='curved')return gCurved(H,l);if(sub==='shape')return gShape(H,l);return gCompare(H,l);},
    example(H){
      const cube=poly('cube',{size:230,hl:{face:0,edge:[2,6],vert:1,text:[{v:0,dx:30,dy:-45,s:'face',col:'#854d0e'},{v:2,dx:42,dy:-8,s:'edge',col:HE},{v:1,dx:10,dy:22,s:'vertex',col:HV}]}});
      const tbl=`<table class="tbl" style="margin:8px auto;border-collapse:collapse;font-size:.95rem"><tr><th style="padding:3px 8px">Object</th><th style="padding:3px 8px">Faces (flat)</th><th style="padding:3px 8px">Curved surfaces</th><th style="padding:3px 8px">Edges</th><th style="padding:3px 8px">Vertices</th></tr>`+
        ALL.map(k=>`<tr><td style="padding:3px 8px">${k}</td><td style="text-align:center">${D[k].f}</td><td style="text-align:center">${D[k].c}</td><td style="text-align:center">${D[k].e}</td><td style="text-align:center">${D[k].v}${k==='cone'?' (apex)':''}</td></tr>`).join('')+`</table>`;
      return {html:`<p>3D objects are made of surfaces. On this cube:</p><div style="text-align:center">${cube}</div>
<p>🟨 A <b>face</b> is a flat surface. 🟧 An <b>edge</b> is where two faces meet. 🔴 A <b>vertex</b> is a corner point where edges meet (more than one = <b>vertices</b>). Dashed lines are hidden edges at the back.</p>
<p><b>Count in parts so you don't miss any.</b> Cube: faces = top 1 + bottom 1 + 4 sides = <b>6</b>. Edges = 4 on top + 4 on the bottom + 4 going up = <b>12</b>. Vertices = 4 on top + 4 on the bottom = <b>8</b>.</p>
${rowF(['cube','rectangular prism','triangular prism','square pyramid','triangular pyramid'],{size:120})}
<p><b>Curved surfaces:</b> a curved surface is not counted as a face. A <b>cylinder</b> has 2 flat circle faces, 1 curved surface, 2 edges and 0 vertices. A <b>cone</b> has 1 flat circle face, 1 curved surface, 1 edge and 1 vertex (the pointy apex). A <b>sphere</b> has just 1 curved surface: no faces, edges or vertices.</p>
${rowF(['cylinder','cone','sphere'],{size:120})}${tbl}`};}};
})());

/* Order matters: the FIRST active entry becomes the "From school today" section, so the newest topic goes first.
   Every entry dated this week still gets extra weight in the mix and in Friday's week review. */
DAILY_FOCUS.push({date:'2026-10-29', topicId:'fev', title:'Faces, edges and vertices', note:'Practised at school', until:'2026-10-30'});
DAILY_FOCUS.push({date:'2026-10-28', topicId:'sorting', title:'Sorting: colour, shape and 3D objects', note:'Practised at school', until:'2026-10-30'});
