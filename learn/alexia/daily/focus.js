/* Alexia's "From school today" focus list. See ../../README.md for how to use it.
   Each entry: {date:'YYYY-MM-DD', topicId:'<topic id>', title:'Shown to Alexia', note:'Optional note', until:'YYYY-MM-DD'}
   The entry is active from date to until (inclusive). It stays weighted in the mix and Friday review for the rest of that week. */
window.DAILY_FOCUS = window.DAILY_FOCUS || [];
window.DAILY_TOPICS_EXTRA = window.DAILY_TOPICS_EXTRA || [];

/* Add entries below this line, for example:
DAILY_FOCUS.push({date:'2026-10-22', topicId:'percent', title:'Percentages', note:'Practised at school today', until:'2026-10-24'});
*/
DAILY_FOCUS.push({date:'2026-10-22', topicId:'money', title:'Money: dollars and cents', note:'Practised at school', until:'2026-10-24'});

/* ===== Multiplying with zeros (school topic, 2 Nov 2026: "multiply big numbers with zeros like 7000 × 40"). Not on the mastery path.
   Method used everywhere: cover the zeros, multiply the front digits, then put back ALL the covered zeros.
   Watch out: when the front digits make a number ending in 0 (5 × 4 = 20), that 0 stays as well. ===== */
window.DAILY_TOPICS_EXTRA.push((function(){
  let R=null;
  const st=(...a)=>a.filter(Boolean).map((s,i)=>`<b>Step ${i+1}:</b> ${s}`).join('<br>');
  /* Australian style: 4-digit numbers as is (7000), 5+ digits with a space every 3 digits (280 000) */
  const f=n=>{const s=String(n);return s.length<5?s:s.replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0');};
  const pw=k=>Math.pow(10,k);
  const zc=n=>{let k=0;while(n>0&&n%10===0){n/=10;k++;}return k;};
  const fr=n=>n/pw(zc(n));
  const zw=k=>k===1?'1 zero':k+' zeros';
  const clean=v=>String(v==null?'':v).replace(/[\s,\u00a0\u2009]/g,'');
  /* typed answer that accepts 280000, 280 000 or 280,000 */
  const entry=(ans,o={})=>{const q=R.num(ans,Object.assign({len:Math.max(4,String(ans).length+1)},o));q.check=v=>clean(v.a)===String(ans);return q;};
  /* trap distractors: wrong number of zeros, and the front digits written without the zeros from 5 × 4 = 20 type facts */
  const traps=(a,b)=>{const ans=a*b,d=fr(a)*fr(b),z=zc(a)+zc(b);const t=[ans/10,ans*10,d*pw(z-1),d*pw(Math.max(0,z-2)),d*pw(z+1)];
    if(d%10===0)t.unshift(d/10*pw(z));return t.filter(x=>x!==ans&&x>0&&Number.isInteger(x));};
  const choice=(ans,a,b)=>{const c=R.opts(f(ans),traps(a,b).map(f));c.cls='txt';return c;};
  /* make a factor: a front digit d with k zeros */
  const mk=(d,k)=>d*pw(k);
  const nd=(lo=2,hi=9)=>R.rnd(lo,hi);
  /* pick front digits; five=true forces a 5 × even pair (product ends in 0) */
  const pair=(five,avoid)=>{for(let g=0;g<40;g++){let x=nd(),y=nd();if(five){x=5;y=R.pick([2,4,6,8]);if(R.chance(0.5))[x,y]=[y,x];}
      if(!five&&avoid&&(x*y)%10===0)continue;return [x,y];}return [3,4];};
  /* hint text for a × b (never shows the final product) */
  function hints(a,b){const da=fr(a),db=fr(b),za=zc(a),zb=zc(b),d=da*db,z=za+zb;
    const h1=st(`Cover the zeros and multiply the front digits: ${da} × ${db}.`,`Count the zeros you covered: ${f(a)} has ${za||'none'}, ${f(b)} has ${zb||'none'}. ${z===1?'Put that 1 zero back on the end.':`Put all ${z} back on the end.`}`);
    const h2=d%10===0
      ?st(`${da} × ${db} = ${d}. The 0 in ${d} belongs to the fact, so keep it!`,`${za&&zb?`${za} + ${zb} = ${z}, so `:''}${zw(z)} ${z===1?'goes':'go'} after ${d}. That makes one extra zero!`)
      :st(`${da} × ${db} = ${d}.`,`${za} + ${zb} = ${z}, so ${zw(z)} ${z===1?'goes':'go'} on the end of ${d}.`,`Write it out, then count the zeros at the end to check.`);
    return {hint:h1,hint2:h2};}
  const expl=(a,b,u='')=>{const da=fr(a),db=fr(b),z=zc(a)+zc(b),d=da*db;return `${da} × ${db} = ${d}, then put back ${zc(a)} + ${zc(b)} = ${zw(z)}: ${f(a)} × ${f(b)} = <b>${f(a*b)}</b>${u?' '+u:''}${d%10===0?` (the 0 from ${d} is extra, so there are ${zc(a*b)} zeros altogether)`:''}.`;};
  /* one a × b question, typed or multiple choice */
  function mult(a,b,mc){const q=Object.assign({prompt:`${f(a)} × ${f(b)} = ?`,explain:expl(a,b)},hints(a,b));
    return Object.assign(q,mc?choice(a*b,a,b):entry(a*b));}
  /* sub-types (graded easy -> hard by level) */
  function gD1(l){const [x,y]=pair(false,l<1);const a=x,b=mk(y,R.rnd(1,l<1?2:3));return mult(a,b,R.chance(0.3));}
  function gTT(l,five){const [x,y]=pair(five,!five);return mult(mk(x,1),mk(y,R.rnd(1,l<1?1:2)),R.chance(0.35));}
  function gTH(l,five){const [x,y]=pair(five,!five&&l<2);const ka=3,kb=l<1?1:R.rnd(1,2);const s=R.chance(0.5);const a=mk(x,ka),b=mk(y,kb);return s?mult(a,b,R.chance(0.35)):mult(b,a,R.chance(0.35));}
  function gHH(l,five){const [x,y]=pair(five,!five);return mult(mk(x,2),mk(y,2),R.chance(0.35));}
  function gMiss(l){const [x,y]=pair(false,true);const ka=R.rnd(1,l<1?1:2),kb=R.rnd(1,l<2?1:2);const a=mk(x,ka),b=mk(y,kb),p=a*b,da=x,db=y,z=ka+kb;
    return Object.assign({sub:'miss',prompt:`What number goes in the box? &nbsp; <b>□ × ${f(b)} = ${f(p)}</b>`,
      hint:st(`Cover the zeros: what times ${db} makes ${da*db}?`,`${f(p)} has ${zw(z)} at the end and ${f(b)} has ${zw(kb)}. The box gets the zeros left over.`),
      hint2:st(`Use your ${db} times tables to find the front digit.`,`${z} − ${kb} = ${z-kb}, so the box number ends in ${zw(z-kb)}.`,`Check: multiply your number by ${f(b)}. Do you get ${f(p)}?`),
      explain:`${da} × ${db} = ${da*db}, and ${zw(z)} − ${zw(kb)} leaves ${zw(ka)}, so □ = <b>${f(a)}</b>. Check: ${f(a)} × ${f(b)} = ${f(p)}.`},entry(a));}
  function gZeros(l){const five=l>=1?R.chance(0.6):R.chance(0.3);const [x,y]=pair(five,!five);const ka=R.rnd(1,3),kb=R.rnd(1,2);const a=mk(x,ka),b=mk(y,kb),z=zc(a*b);
    const c=R.opts(String(z),[z-1,z+1,z+2,z-2].filter(v=>v>0).map(String));c.cls='txt';
    return Object.assign({sub:'zeros',prompt:`How many zeros are at the <b>end</b> of the answer to <b>${f(a)} × ${f(b)}</b>?`,
      hint:st(`Count the zeros in ${f(a)} and in ${f(b)}.`,`Then work out ${x} × ${y}. Does that answer end in 0 too?`),
      hint2:st(`${f(a)} has ${zw(ka)} and ${f(b)} has ${zw(kb)}. Add those together.`,`Now work out ${x} × ${y}. If that answer ends in 0, add one more zero to your count.`),
      explain:`${f(a)} × ${f(b)} = ${f(a*b)}. ${x} × ${y} = ${x*y}${(x*y)%10===0?' (one extra zero)':''} and ${ka} + ${kb} covered zeros, so <b>${z}</b> zeros at the end.`},c);}
  const WORD=[
    (a,b)=>[`A school orders <b>${f(a)}</b> boxes of pencils. Each box holds <b>${f(b)}</b> pencils. How many pencils is that?`,'pencils'],
    (a,b)=>[`A farmer plants <b>${f(a)}</b> rows of trees with <b>${f(b)}</b> trees in each row. How many trees?`,'trees'],
    (a,b)=>[`A stadium sells <b>${f(b)}</b> tickets for each of <b>${f(a)}</b> games. How many tickets altogether?`,'tickets'],
    (a,b)=>[`A bakery makes <b>${f(b)}</b> bread rolls every day for <b>${f(a)}</b> days. How many rolls is that?`,'rolls'],
    (a,b)=>[`A truck carries <b>${f(a)}</b> crates. Each crate has <b>${f(b)}</b> apples. How many apples?`,'apples']];
  function gWord(l){const five=l>=1&&R.chance(0.4);const [x,y]=pair(five,!five);const a=mk(x,R.rnd(1,l<1?1:2)),b=mk(y,l<1?R.rnd(2,3):R.rnd(2,3));
    const [txt,unit]=R.pick(WORD)(a,b);const h=hints(a,b);
    return Object.assign({sub:'word',prompt:txt,hint:st(`This is ${f(a)} × ${f(b)}.`,`Cover the zeros: ${fr(a)} × ${fr(b)}. Then put back ${zw(zc(a))} + ${zw(zc(b))}.`),hint2:h.hint2,
      explain:expl(a,b,unit)},R.chance(0.3)?choice(a*b,a,b):entry(a*b,{post:` ${unit}`}));}
  function gTrap(l){const [x,y]=pair(true);const a=mk(x,R.rnd(1,3)),b=mk(y,R.rnd(1,2));const ans=a*b;const c=choice(ans,a,b);
    return Object.assign({sub:'trap',prompt:`Careful! Which answer is right? &nbsp; <b>${f(a)} × ${f(b)}</b>`,explain:expl(a,b)},hints(a,b),c);}
  return {id:'zeros',title:'Multiplying with Zeros',icon:'0️⃣',code:'MA2-MR-01 → MA3-MR-01',
    blurb:'Multiplying numbers that end in zeros, like 7000 × 40: cover the zeros, multiply, then put the zeros back.',
    /* engine levels run 0-3 and a new topic starts at 1, so 0 and 1 both use the easy set */
    subs:L=>{const l=Math.max(0,L-1);return l>=2?['th','th','hh','hh','tt5','th5','miss','miss','word','trap','zeros']:l>=1?['d1','tt','tt5','th','th','hh','miss','word','trap','zeros']:['d1','d1','tt','th','th','miss','word','zeros'];},
    gen(H,L,sub){R=H;const l=Math.max(0,L-1);const q=sub==='d1'?gD1(l):sub==='tt'?gTT(l,false):sub==='tt5'?gTT(l,true):sub==='th'?gTH(l,false):sub==='th5'?gTH(l,true):sub==='hh'?gHH(l,l>=2&&H.chance(0.5)):
      sub==='miss'?gMiss(l):sub==='zeros'?gZeros(l):sub==='trap'?gTrap(l):gWord(l);q.sub=sub;if(q.explain)q.explain=`<span>${q.explain}</span>`;/* .expl is a flex column: keep the sentence on one line */return q;},
    example(H){R=H;return {html:`<p><b>Multiplying with zeros:</b> cover the zeros, multiply the front digits, then put the zeros back.</p>
<p style="font-size:1.4rem;text-align:center"><b>7000 × 40</b></p>
<ol class="steps" style="text-align:left;display:inline-block;margin:0 auto"><li><b>Cover the zeros:</b> 7<span style="opacity:.35">000</span> × 4<span style="opacity:.35">0</span> → <b>7 × 4 = 28</b></li>
<li><b>Count the zeros you covered:</b> 7000 has 3, 40 has 1 → <b>1 + 3 = 4 zeros</b></li>
<li><b>Put them back on the end:</b> 28 → 28<b>0000</b> = <b>280 000</b></li></ol>
<p><b>Watch out:</b> 500 × 40 → 5 × 4 = <b>20</b>. Keep the 0 from 20, then add the 2 + 1 = 3 covered zeros: 20<b>000</b> = <b>20 000</b> (4 zeros altogether, not 3).</p>
<p><b>Missing number:</b> □ × 30 = 2400 → what times 3 makes 24? <b>8</b>. 2400 has 2 zeros and 30 has 1, so the box gets 1 zero: □ = <b>80</b>.</p>`};}};
})());

DAILY_FOCUS.push({date:'2026-11-03', topicId:'zeros', title:'Multiplying with zeros (e.g. 7000 × 40)', note:'From class today', until:'2026-11-05'});
