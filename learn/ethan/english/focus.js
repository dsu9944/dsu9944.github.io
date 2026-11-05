/* Ethan's English "From school today" focus list. See ../../README.md for how to use it.
   Each entry: {date:'YYYY-MM-DD', topicId:'<topic id>', title:'Shown to Ethan', note:'Optional note', until:'YYYY-MM-DD'}
   The entry is active from date to until (inclusive). It stays weighted in the mix and Friday review for the rest of that week.
   Built-in English topic ids: phonics, sight, wordclass, punct, compound, plurals, past, synant, conj, affix, contract, comp. */
window.DAILY_FOCUS = window.DAILY_FOCUS || [];
window.DAILY_TOPICS_EXTRA = window.DAILY_TOPICS_EXTRA || [];

/* ===== Word detectives: nouns, adjectives, verbs and prepositional phrases (school topic, 3-5 Nov 2026) =====
   Year 2 (Stage 1) stretching into Year 3. Every answer comes from the tagged sentence, so it is checked by the data:
   {word:n} noun, {word:a} adjective, {word:v} verb, [phrase] prepositional phrase. Uses the shared kit (window.ENKIT) at question time.
   pt47u: pitched a little further into Year 3 — longer sentences, mid-sentence phrases, multi-noun/adj picks, tighter distractors. */
window.DAILY_TOPICS_EXTRA.push((function(){
  const K=()=>window.ENKIT;
  /* [sentence, level] — prefer richer Year 3 stretch: multiple nouns/adjectives, phrases mid-sentence */
  const SENT=[
    ['The {fluffy:a} {dog:n} {slept:v} [under the table].',0],['A {tiny:a} {mouse:n} {ran:v} [behind the door].',0],['The {green:a} {frog:n} {jumped:v} [onto the log].',0],
    ['The {sleepy:a} {cat:n} {sat:v} [on the mat].',0],['A {little:a} {bird:n} {sang:v} [in the tree].',0],['The {happy:a} {girl:n} {ran:v} [up the hill].',0],
    ['My {big:a} {brother:n} {hid:v} [in the cupboard].',0],['The {red:a} {car:n} {stopped:v} [outside the shop].',0],
    ['The {funny:a} {clown:n} {fell:v} [into the pool].',1],['A {grey:a} {possum:n} {climbed:v} [over the fence].',1],['The {shiny:a} {fish:n} {swam:v} [between the rocks].',1],
    ['The {noisy:a} {kids:n} {played:v} [next to the pool].',1],['A {hungry:a} {duck:n} {waddled:v} [across the road].',1],
    ['The {clever:a} {fox:n} {hid:v} [behind the bush].',1],['A {bright:a} {star:n} {shone:v} [above the hills].',1],['The {muddy:a} {boots:n} {stood:v} [by the door].',1],
    ['The {excited:a} {children:n} {played:v} [on the oval] after {lunch:n}.',2],
    ['[Under the bridge], a {grumpy:a} {troll:n} {waited:v} for the {goats:n}.',2],
    ['[Behind the shed], the {brave:a} {puppy:n} {found:v} a {bone:n}.',2],
    ['A {sleepy:a} {koala:n} {rested:v} [in the gum tree] near the {creek:n}.',2],
    ['[Beside the creek], the {quiet:a} {frog:n} {croaked:v} at the {moon:n}.',2],
    ['The {careful:a} {painter:n} {worked:v} [on the ladder] with a {brush:n}.',2],
    ['The {tiny:a} {spider:n} {spun:v} a {silky:a} {web:n} [across the window].',2],
    ['Mum {placed:v} the {fresh:a} {apples:n} [into the basket] on the {bench:n}.',2],
    ['The {enormous:a} {whale:n} {dived:v} [beneath the waves] toward the {reef:n}.',3],
    ['[Through the dark forest], the {tired:a} {explorer:n} {walked:v} past a {cave:n}.',3],
    ['[Across the wide river], a {wooden:a} {bridge:n} {stood:v} above the {rapids:n}.',3],
    ['The {ancient:a} {castle:n} {loomed:v} [above the valley] in the {mist:n}.',3],
    ['A {fierce:a} {storm:n} {shook:v} the {tall:a} {trees:n} [along the cliff].',3],
    ['The {curious:a} {scientist:n} {examined:v} a {rare:a} {fossil:n} [inside the cave].',3],
    ['[Between the two hills], a {narrow:a} {path:n} {wound:v} toward the {village:n}.',3],
    ['Sam {carried:v} the {heavy:a} {backpack:n} [over the mountain] with his {friends:n}.',3]];
  const PREPS=['in','on','under','behind','over','onto','into','up','outside','between','next','across','beneath','through','by','to','at','beside','above','along','toward','towards','near','past','with','for','after'];
  const FILLW=/^(the|a|an|my|his|her|their|our|its)$/i;
  const NOUNS=['table','garden','teacher','apple','bike','river','school','shoe','pencil','beach','chair','rabbit','rocket','castle','doctor','sandwich','ladder','tunnel','village','fossil','backpack','scientist','reef','valley','bridge','explorer','storm','spider','basket','creek'];
  const ADJS=['fluffy','tiny','shiny','happy','tall','noisy','muddy','brave','sticky','gigantic','soft','grumpy','gentle','rusty','cosy','fierce','sparkly','ancient','curious','narrow','silky','fresh','enormous','wooden','rare','heavy','excited','careful'];
  const VERBS=['jumped','laughed','climbed','kicked','shouted','sang','painted','swam','whispered','galloped','sketched','paddled','examined','carried','loomed','dived','wound','spun','placed','shook'];
  /* choose a preposition: [sentence with ___, answer, clue] — denser Year 3 cues, still one clear fit */
  const PF=[['The cat is ___ the box.','in','inside it'],['The book is ___ the table.','on','on top of it'],['The ball rolled ___ the bed.','under','below it'],
    ['The dog hid ___ the tree.','behind','at the back of it'],['I sat ___ my friend.','next to','right beside them'],['The ball is ___ the two chairs.','between','in the middle of the two'],
    ['The plane flew ___ the house.','over','high above it'],['The fish swim ___ the water.','in','inside it'],['Put your cup ___ the shelf.','on','on top of it'],
    ['The boat went ___ the bridge.','under','below it'],['The sun hid ___ a cloud.','behind','at the back of it'],['The bee flew ___ the flowers.','over','just above them'],
    ['The keys are ___ my bag.','in','inside it'],['Hang your coat ___ the hook.','on','on top of it'],['The mouse ran ___ the fridge.','under','below it'],
    ['We waited ___ the gate.','beside','right next to it'],['The tunnel goes ___ the mountain.','through','from one side to the other'],['The bird nested ___ the roof.','under','below it'],
    ['Stand ___ the two markers.','between','in the middle of the two'],['The kite flew ___ the trees.','above','higher than them'],
    ['The path winds ___ the hills.','between','with a hill on each side'],['She slipped the note ___ the book.','inside','into the pages'],
    ['The train raced ___ the long tunnel.','through','from one end to the other'],['Keep the ladder ___ the wall.','against','touching it upright'],
    ['We walked ___ the noisy market.','past','going by it'],['The treasure lay ___ the old floorboards.','beneath','hidden below them'],
    ['Put your bag ___ the two seats.','between','in the middle of them'],['The owl watched ___ the high branch.','from','looking down from there']];
  const PFW=['in','on','under','behind','next to','between','over','through','above','beside','inside','against','past','beneath','from'];
  const col={n:'#2563eb',a:'#ca8a04',v:'#16a34a',p:'#db2777'};
  function sentPool(H,l){const stretch=Math.min(3,l+(l>=1&&H.chance(0.4)?1:0));let ok=SENT.filter(x=>x[1]<=stretch);if(!ok.length)ok=SENT.filter(x=>x[1]<=l);
    const floor=Math.max(0,stretch-1);const prefer=ok.filter(x=>x[1]>=floor);return prefer.length?prefer:ok;}
  function sentQ(H,l){const {parse}=K();const s=H.pick(sentPool(H,l));return Object.assign(parse(s[0]),{src:s[0]});}
  const cap=w=>w.charAt(0).toUpperCase()+w.slice(1);
  /* content-word distractors only — skip "the/a" giveaways */
  /* Distractors: other tagged content words that are NOT the same class as the answer (fuzz: no same-class traps). Skip the/a. */
  function hardD(H,toks,keep,n=3,banClass=null){const {uniq}=K();
    const others=uniq(toks.filter(t=>t.c&&t.c!=='p'&&t.c!==banClass&&!keep.has(t.w.toLowerCase())).map(t=>t.w));
    const fillers=uniq(toks.filter(t=>!t.c&&!FILLW.test(t.w)&&t.w.length>2).map(t=>t.w));
    return H.shuffle(others.concat(fillers)).slice(0,n);}
  return {id:'worddetect',title:'Word detectives',icon:'🔎',dedupByText:true,code:'EN1-VOCAB-01 · EN1-CWT-01 → EN2-CWT-01',
    blurb:'Nouns, adjectives, verbs and prepositional phrases (from class).',
    subs:l=>l>=2?['noun','adj','verb','desc','prep','prep','alln','alla','prepfill','sort','group','count']
               :l>=1?['noun','adj','verb','desc','prep','prep','alln','prepfill','sort','group']
                    :['noun','adj','verb','desc','prep','prep','prepfill','sort'],
    gen(H,l,sub){const {J,sent,M,uniq,CN}=K();
      if(sub==='prepfill'){const [s,a,clue]=H.pick(PF);const d=H.shuffle(PFW.filter(w=>w!==a)).slice(0,3);
        return M(Object.assign({sub,prompt:`Choose the word that fits. <span class="small">(clue: ${clue})</span>`,vis:sent(s.replace('___','<span class="gap">?</span>')),
          hint:'Read the clue carefully. Which little place word fits best?',hint2:'Test every choice. Which one matches the clue best?',
          explain:J([`The clue says “${clue}”.`,`<b>${s.replace('___',a)}</b>`,`“${a}” is a preposition: it shows where.`]),why:`“${a}” shows the place: ${clue}.`},H.opts(a,d,{cls:'txt'})),{type:'pf'});}
      if(sub==='sort'){const kinds=l>=1?['n','a','v']:['n','a'];const c=H.pick(kinds);const w=H.pick(c==='n'?NOUNS:c==='a'?ADJS:VERBS);
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
      if(sub==='alln'||sub==='alla'){const want=sub==='alln'?'n':'a';const words=uniq(toks.filter(t=>t.c===want).map(t=>t.w));
        if(words.length>=2){
          const right=words.slice().sort((a,b)=>plain.toLowerCase().indexOf(a.toLowerCase())-plain.toLowerCase().indexOf(b.toLowerCase())).join(', ');
          const pool=uniq(toks.filter(t=>t.c&&t.c!=='p').map(t=>t.w));
          const mk=()=>{const mix=H.shuffle(pool.slice()).slice(0,Math.min(words.length,pool.length));
            if(mix.every(w=>toks.some(t=>t.w===w&&t.c===want))){const wrong=pool.find(w=>!words.includes(w));if(wrong)mix[mix.length-1]=wrong;}
            return mix.join(', ');};
          let d=uniq([mk(),mk(),mk(),mk(),mk()]).filter(x=>x!==right&&x.split(', ').length===words.length);
          while(d.length<3){const pad=H.shuffle(pool.slice()).slice(0,words.length);if(pad.every(w=>words.includes(w)))pad[pad.length-1]=pool.find(w=>!words.includes(w))||pad[0];
            const s=pad.join(', ');if(s!==right&&!d.includes(s))d.push(s);else break;}
          const label=want==='n'?'nouns':'adjectives';
          return M(Object.assign({sub,prompt:`Which list shows <b>every ${want==='n'?'noun':'adjective'}</b> in the sentence?`,vis:sent(plain),
            hint:`Scan the sentence. Collect each ${want==='n'?'naming':'describing'} word, then match the full list.`,
            hint2:'A list that misses one, or sneaks in a wrong job word, is not right.',
            explain:J([`The ${label} are: <b>${right}</b>.`,want==='n'?'Each names a person, animal, place or thing.':'Each describes a noun.']),
            why:`Every ${want==='n'?'noun':'adjective'} in the sentence is: ${right}.`},H.opts(right,d,{cls:'sent'})),{type:'all',src});}
        sub=want==='n'?'noun':'adj';
      }
      if(sub==='count'){const c=H.pick(['n','a']);const n=toks.filter(t=>t.c===c).length;const label=c==='n'?'nouns':'adjectives';
        const optsN=uniq([n,n+1,Math.max(1,n-1),n+2,2,3,4].filter(x=>x>=1&&x<=6)).slice(0,4);
        while(optsN.length<4)optsN.push(optsN.length+1);
        const list=optsN.map(String);const ans=list.indexOf(String(n));
        return M(Object.assign({sub,prompt:`How many <b>${label}</b> are in this sentence?`,vis:sent(plain),
          hint:`Count every ${c==='n'?'naming':'describing'} word. Do not count the doing words.`,
          hint2:c==='n'?'Names of people, animals, places and things all count.':'Only the words that describe a noun count.',
          explain:J([`The ${label} are: <b>${toks.filter(t=>t.c===c).map(t=>t.w).join(', ')}</b>.`,`That is <b>${n}</b>.`]),
          why:`There ${n===1?'is':'are'} ${n} ${label.slice(0,n===1?-1:undefined)} in the sentence.`},H.fixedOpts(list,ans,'txt')),{type:'count',src});}
      if(sub==='prep'){const ph=toks.find(t=>t.c==='p').w;const words=[];toks.forEach(t=>{if(!t.phrase)words.push(t.w);});
        const chunks=[];
        for(let n=2;n<=3;n++)for(let i=0;i+n<=words.length;i++){const ch=words.slice(i,i+n);if(PREPS.includes(ch[0].toLowerCase()))continue;chunks.push(ch.join(' '));}
        const pw=ph.split(' ');const tail=pw.slice(pw[0].toLowerCase()==='next'?2:1).join(' ');
        /* distractors must NOT start with a preposition (fuzz rule) — prefer content chunks + phrase tails */
        let d=H.shuffle(uniq(chunks.map(x=>x.replace(/^./,c=>c.toLowerCase())))).slice(0,3);
        if(l>=1&&tail.split(' ').length>=2&&!PREPS.includes(tail.split(' ')[0].toLowerCase()))d.unshift(tail.replace(/^./,c=>c.toLowerCase()));
        const ans=ph.replace(/^./,c=>c.toLowerCase());
        d=d.filter(x=>x!==ans&&!PREPS.includes(x.split(' ')[0].toLowerCase())).slice(0,3);
        while(d.length<3){const pad=H.pick(words.filter(w=>w.length>2));if(pad&&!d.includes(pad)&&pad.toLowerCase()!==ans)d.push(pad);else break;}
        return M(Object.assign({sub,prompt:`Find the <b>prepositional phrase</b>. It tells us <b>where</b>.`,vis:sent(plain),
          hint:'Look for the group of words that tells where something is.',hint2:'It starts with a little place word and ends with a thing.',
          explain:J([`Where? <b>${ans}</b>`,`It starts with the preposition “${pw[0].toLowerCase()==='next'?'next to':pw[0].toLowerCase()}” and tells us where.`]),
          why:`“${ans}” tells us where, and starts with a place word.`},H.opts(ans,d,{cls:'txt'})),{type:'prep',src});}
      if(sub==='desc'){const pairs=toks.map((t,i)=>[t,toks[i+1]]).filter(([t,u])=>t.c==='a'&&u&&u.c==='n');const [a,n]=H.pick(pairs);
        const others=hardD(H,toks,new Set([a.w.toLowerCase()]),3,'a');
        /* ensure the noun is among distractors sometimes for a closer call */
        if(others.length<3&&!others.includes(n.w))others.push(n.w);
        return M(Object.assign({sub,prompt:`Which word <b>describes</b> the ${n.w}?`,vis:sent(plain),hint:`Find the word “${n.w}”. Which word tells what it is like?`,
          hint2:'A describing word tells how something looks, feels or sounds.',
          explain:J([`What is the ${n.w} like? It is <b>${a.w}</b>.`,`“${a.w}” is an adjective. It describes the noun “${n.w}”.`]),why:`“${a.w}” tells us what the ${n.w} is like.`},H.opts(a.w,H.shuffle(others).slice(0,3),{cls:'txt'})),{type:'desc',src});}
      const c=sub==='noun'?'n':sub==='verb'?'v':'a';const a=H.pick(toks.filter(t=>t.c===c));
      const d=hardD(H,toks,new Set([a.w.toLowerCase()]),3,c);const N=CN[c];
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
