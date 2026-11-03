/* Ethan's English "From school today" focus list. See ../../README.md for how to use it.
   Each entry: {date:'YYYY-MM-DD', topicId:'<topic id>', title:'Shown to Ethan', note:'Optional note', until:'YYYY-MM-DD'}
   The entry is active from date to until (inclusive). It stays weighted in the mix and Friday review for the rest of that week.
   Built-in English topic ids: phonics, sight, wordclass, punct, compound, plurals, past, synant, conj, affix, contract, comp. */
window.DAILY_FOCUS = window.DAILY_FOCUS || [];
window.DAILY_TOPICS_EXTRA = window.DAILY_TOPICS_EXTRA || [];

/* ===== Word detectives: nouns, adjectives, verbs and prepositional phrases (school topic, 3-5 Nov 2026) =====
   Year 2 (Stage 1) stretching into Year 3. Every answer comes from the tagged sentence, so it is checked by the data:
   {word:n} noun, {word:a} adjective, {word:v} verb, [phrase] prepositional phrase. Uses the shared kit (window.ENKIT) at question time. */
window.DAILY_TOPICS_EXTRA.push((function(){
  const K=()=>window.ENKIT;
  /* [sentence, level] - one describing word + noun pair, one verb, one prepositional phrase in each */
  const SENT=[
    ['The {fluffy:a} {dog:n} {slept:v} [under the table].',0],['A {tiny:a} {mouse:n} {ran:v} [behind the door].',0],['The {green:a} {frog:n} {jumped:v} [onto the log].',0],
    ['The {sleepy:a} {cat:n} {sat:v} [on the mat].',0],['A {little:a} {bird:n} {sang:v} [in the tree].',0],['The {happy:a} {girl:n} {ran:v} [up the hill].',0],
    ['My {big:a} {brother:n} {hid:v} [in the cupboard].',0],['The {red:a} {car:n} {stopped:v} [outside the shop].',0],
    ['The {funny:a} {clown:n} {fell:v} [into the pool].',1],['A {grey:a} {possum:n} {climbed:v} [over the fence].',1],['The {shiny:a} {fish:n} {swam:v} [between the rocks].',1],
    ['The {noisy:a} {kids:n} {played:v} [next to the pool].',1],['A {hungry:a} {duck:n} {waddled:v} [across the road].',1],
    ['The {excited:a} {children:n} {played:v} [on the oval].',2],['[Under the bridge], a {grumpy:a} {troll:n} {waited:v}.',2],
    ['[Behind the shed], the {brave:a} {puppy:n} {found:v} a {bone:n}.',2],['A {sleepy:a} {koala:n} {rested:v} [in the gum tree].',2],
    ['The {enormous:a} {whale:n} {dived:v} [beneath the waves].',3],['[Through the dark forest], the {tired:a} {explorer:n} {walked:v}.',3]];
  const PREPS=['in','on','under','behind','over','onto','into','up','outside','between','next','across','beneath','through','by','to','at','beside'];
  const FILLW=/^(the|a|an|my)$/i;
  const NOUNS=['table','garden','teacher','apple','bike','river','school','shoe','pencil','beach','chair','rabbit'];
  const ADJS=['fluffy','tiny','shiny','happy','tall','noisy','muddy','brave','sticky','gigantic','soft','grumpy'];
  const VERBS=['jumped','laughed','climbed','kicked','shouted','sang','painted','swam'];
  /* choose a preposition: [sentence with ___, answer, clue] */
  const PF=[['The cat is ___ the box.','in','inside it'],['The book is ___ the table.','on','on top of it'],['The ball rolled ___ the bed.','under','below it'],
    ['The dog hid ___ the tree.','behind','at the back of it'],['I sat ___ my friend.','next to','right beside them'],['The ball is ___ the two chairs.','between','in the middle of the two'],
    ['The plane flew ___ the house.','over','high above it'],['The fish swim ___ the water.','in','inside it'],['Put your cup ___ the shelf.','on','on top of it'],
    ['The boat went ___ the bridge.','under','below it'],['The sun hid ___ a cloud.','behind','at the back of it'],['The bee flew ___ the flowers.','over','just above them']];
  const PFW=['in','on','under','behind','next to','between','over'];
  const col={n:'#2563eb',a:'#ca8a04',v:'#16a34a',p:'#db2777'};
  function sentQ(H,l){const {parse}=K();const s=H.pick(SENT.filter(x=>x[1]<=l));return Object.assign(parse(s[0]),{src:s[0]});}
  const cap=w=>w.charAt(0).toUpperCase()+w.slice(1);
  return {id:'worddetect',title:'Word detectives',icon:'🔎',dedupByText:true,code:'EN1-VOCAB-01 · EN1-CWT-01 → EN2-CWT-01',
    blurb:'Nouns, adjectives, verbs and prepositional phrases (from class).',
    subs:l=>l>=1?['noun','adj','verb','desc','prep','prep','prepfill','sort','group']:['noun','adj','verb','desc','prep','prep','prepfill','sort'],
    gen(H,l,sub){const {J,sent,M,uniq,CN}=K();
      if(sub==='prepfill'){const [s,a,clue]=H.pick(PF);const d=H.shuffle(PFW.filter(w=>w!==a)).slice(0,3);
        return M(Object.assign({sub,prompt:`Choose the word that fits. <span class="small">(clue: ${clue})</span>`,vis:sent(s.replace('___','<span class="gap">?</span>')),
          hint:'Read the clue at the end. Which little word shows that place?',hint2:'Try each word inside the gap. Which one matches the clue?',
          explain:J([`The clue says “${clue}”.`,`<b>${s.replace('___',a)}</b>`,`“${a}” is a preposition: it shows where.`]),why:`“${a}” shows the place: ${clue}.`},H.opts(a,d,{cls:'txt'})),{type:'pf'});}
      if(sub==='sort'){const kinds=l>=2?['n','a','v']:['n','a'];const c=H.pick(kinds);const w=H.pick(c==='n'?NOUNS:c==='a'?ADJS:VERBS);
        const list=kinds.map(k=>CN[k]);const ans=list.indexOf(CN[c]);
        return M(Object.assign({sub,prompt:`Is “<b>${w}</b>” ${kinds.length===3?'a noun, an adjective or a verb':'a noun or an adjective'}?`,vis:sent(`🔎 ${w}`),
          hint:'Can you put “the” before it? Then it is a thing word.',hint2:kinds.length===3?'Is it “very ___”? Then it describes. Something you do? It is a doing word.':'Can you say “it is very ___”? Then it is a describing word.',
          explain:J([c==='n'?`You can say “the ${w}”. It names a thing.`:c==='a'?`You can say “it is very ${w}”. It describes a thing.`:`“${w}” is something you can do.`,`“${w}” is ${c==='a'?'an':'a'} <b>${CN[c]}</b>.`]),
          why:c==='n'?`“${w}” names a thing, so it is a noun.`:c==='a'?`“${w}” describes a thing, so it is an adjective.`:`“${w}” is a doing word, so it is a verb.`},H.fixedOpts(list,ans,'txt')),{type:'sort'});}
      if(sub==='group'){const c=H.pick(['n','a']);const own=c==='n'?NOUNS:ADJS,oth=c==='n'?ADJS:NOUNS;const g=()=>H.shuffle(own.slice()).slice(0,3);
        const right=g().join(', ');const mk=()=>{const x=H.shuffle(own.slice()).slice(0,2).concat(H.shuffle(oth.slice()).slice(0,1));return H.shuffle(x).join(', ');};
        const d=uniq([mk(),mk(),mk(),mk(),H.shuffle(oth.slice()).slice(0,3).join(', ')]).filter(x=>x!==right);
        return M(Object.assign({sub,prompt:`Which group has <b>only ${CN[c]}s</b>?`,
          hint:c==='n'?'Check every word. Can you put “the” before each one?':'Check every word. Does each one describe how something is?',
          hint2:'One word that does not fit makes the whole group wrong.',
          explain:J([`<b>${right}</b>`,c==='n'?'Every word names a thing, so they are all nouns.':'Every word describes a thing, so they are all adjectives.']),
          why:`Every word in that group is ${c==='a'?'an':'a'} ${CN[c]}.`},H.opts(right,d,{cls:'sent'})),{type:'group'});}
      const {toks,plain,src}=sentQ(H,l);
      if(sub==='prep'){const ph=toks.find(t=>t.c==='p').w;const words=[];toks.forEach(t=>{if(!t.phrase)words.push(t.w);});
        const pre=toks.findIndex(t=>t.phrase);const chunks=[];
        for(let n=2;n<=3;n++)for(let i=0;i+n<=words.length;i++){const ch=words.slice(i,i+n);if(PREPS.includes(ch[0].toLowerCase()))continue;chunks.push(ch.join(' '));}
        const pw=ph.split(' ');const tail=pw.slice(pw[0].toLowerCase()==='next'?2:1).join(' ');
        const d=H.shuffle(uniq(chunks.map(x=>x.replace(/^./,c=>c.toLowerCase())))).slice(0,3);if(l>=1&&tail.split(' ').length>=2)d.unshift(tail.replace(/^./,c=>c.toLowerCase()));
        const ans=ph.replace(/^./,c=>c.toLowerCase());
        return M(Object.assign({sub,prompt:`Find the <b>prepositional phrase</b>. It tells us <b>where</b>.`,vis:sent(plain),
          hint:'Look for the group of words that tells where something is.',hint2:'It starts with a little place word and ends with a thing.',
          explain:J([`Where? <b>${ans}</b>`,`It starts with the preposition “${pw[0].toLowerCase()==='next'?'next to':pw[0].toLowerCase()}” and tells us where.`]),
          why:`“${ans}” tells us where, and starts with a place word.`},H.opts(ans,d.filter(x=>x!==ans),{cls:'txt'})),{type:'prep',src});}
      if(sub==='desc'){const pairs=toks.map((t,i)=>[t,toks[i+1]]).filter(([t,u])=>t.c==='a'&&u&&u.c==='n');const [a,n]=H.pick(pairs);
        const others=uniq(toks.filter(t=>t.c&&t.c!=='p'&&t.c!=='a').map(t=>t.w)).filter(w=>w!==n.w).concat([n.w]).concat(uniq(toks.filter(t=>!t.c&&FILLW.test(t.w)).map(t=>t.w.toLowerCase())).slice(0,1));
        return M(Object.assign({sub,prompt:`Which word <b>describes</b> the ${n.w}?`,vis:sent(plain),hint:`Find the word “${n.w}”. Which word tells what it is like?`,
          hint2:'A describing word tells how something looks, feels or sounds.',
          explain:J([`What is the ${n.w} like? It is <b>${a.w}</b>.`,`“${a.w}” is an adjective. It describes the noun “${n.w}”.`]),why:`“${a.w}” tells us what the ${n.w} is like.`},H.opts(a.w,H.shuffle(others).slice(0,3),{cls:'txt'})),{type:'desc',src});}
      const c=sub==='noun'?'n':sub==='verb'?'v':'a';const a=H.pick(toks.filter(t=>t.c===c));
      const others=uniq(toks.filter(t=>t.c&&t.c!=='p'&&t.c!==c).map(t=>t.w));
      const fill=uniq(toks.filter(t=>!t.c&&FILLW.test(t.w)).map(t=>t.w));
      const d=H.shuffle(others).slice(0,3).concat(fill).slice(0,3);const N=CN[c];
      const H1={n:'A noun names a person, animal, place or thing. Find it.',v:'A verb is a doing word. What happened in the sentence?',a:'An adjective is a describing word. It tells what something is like.'}[c];
      const H2={n:'Can you put “the” or “a” before it? Then it is a noun.',v:'Ask: what did someone or something do? That is the verb.',a:'Find the thing word first. Which word tells you about it?'}[c];
      return M(Object.assign({sub,prompt:`Tap the <b>${N}</b>.`,vis:sent(plain),hint:H1,hint2:H2,
        explain:J([c==='n'?'A noun names a person, animal, place or thing.':c==='v'?'A verb is a doing word.':'An adjective describes a noun.',`<b>${a.w}</b> is ${c==='a'?'an':'a'} ${N}.`]),
        why:c==='n'?`“${a.w}” names a person, animal or thing, so it is a noun.`:c==='v'?`“${a.w}” is what happened (a doing word), so it is a verb.`:`“${a.w}” describes a thing, so it is an adjective.`},H.opts(a.w,d,{cls:'txt'})),{type:c,src});},
    example(){const b=(w,c)=>`<b style="color:${col[c]}">${w}</b>`;
      return {html:`<h3>🔎 Word detectives</h3><div class="esent">The ${b('fluffy','a')} ${b('dog','n')} ${b('slept','v')} ${b('under the table','p')}.</div>
<p>${b('dog','n')} = <b>noun</b> (a thing) · ${b('fluffy','a')} = <b>adjective</b> (describes the dog) · ${b('slept','v')} = <b>verb</b> (doing word)</p>
<p>${b('under the table','p')} = <b>prepositional phrase</b>. It tells us <b>where</b> and starts with a place word (under, on, in, behind).</p>`};}};
})());

/* Order matters: the FIRST active entry becomes the "From school today" section, so the newest topic goes first.
   Every entry dated this week still gets extra weight in the mix and in Friday's week review. */
DAILY_FOCUS.push({date:'2026-11-03', topicId:'worddetect', title:'Word detectives: nouns, adjectives and prepositional phrases', note:'From class today', until:'2026-11-05'});
