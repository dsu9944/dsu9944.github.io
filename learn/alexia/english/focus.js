/* Alexia's English "From school today" focus list. See ../../README.md for how to use it.
   Each entry: {date:'YYYY-MM-DD', topicId:'<topic id>', title:'Shown to Alexia', note:'Optional note', until:'YYYY-MM-DD'}
   The entry is active from date to until (inclusive). It stays weighted in the mix and Friday review for the rest of that week.
   Built-in English topic ids: wordclass, sentences, apostrophe, homophones, affixes, speech, figurative, comprehension. */
window.DAILY_FOCUS = window.DAILY_FOCUS || [];
window.DAILY_TOPICS_EXTRA = window.DAILY_TOPICS_EXTRA || [];

/* ===== Word Spy ch.4 "Letters, letters, letters": anagrams, palindromes, pangrams, lipograms and codes (school topic, 30 Oct 2026) =====
   Every answer is checked by code: anagrams by sorted letters, palindromes by reversing the letters, pangrams and lipograms by counting letters. */
window.DAILY_TOPICS_EXTRA.push((function(){
  const J=a=>a.join('<br>');
  const letters=s=>String(s).toLowerCase().replace(/[^a-z]/g,'');
  const sortL=s=>letters(s).split('').sort().join('');
  const isAnagram=(a,b)=>letters(a)!==letters(b)&&sortL(a)===sortL(b);
  const isPal=s=>{const t=letters(s);return t.length>1&&t===t.split('').reverse().join('');};
  const AZ='abcdefghijklmnopqrstuvwxyz'.split('');
  const missingL=s=>{const t=letters(s);return AZ.filter(c=>!t.includes(c));};
  const sent=s=>`<div class="esent">${s}</div>`;
  const tiles=w=>`<div class="tiles">${w.toUpperCase().split('').map(c=>c===' '?'<i></i>':`<span>${c}</span>`).join('')}</div>`;
  const M=(o,meta)=>Object.assign(o,{meta});

  /* anagram pairs (both directions are asked) */
  const ANA=[['listen','silent'],['earth','heart'],['night','thing'],['below','elbow'],['state','taste'],['study','dusty'],['lemon','melon'],['peach','cheap'],['sword','words'],
    ['stressed','desserts'],['meat','team'],['pots','stop'],['evil','live'],['inch','chin'],['save','vase'],['lump','plum'],['shrub','brush'],['panel','plane'],['ocean','canoe'],
    ['march','charm'],['teach','cheat'],['rescue','secure'],['angel','glean'],['tea','eat'],['art','rat']].filter(p=>p[0]!=='angel');
  const ANAP=[['the eyes','they see',['the seas','yes, then','see them']],['dormitory','dirty room',['dirty rooms','dining room','tidy room']],
    ['eleven plus two','twelve plus one',['eleven plus one','twelve plus two','ten plus three']],['a gentleman','elegant man',['gentle man','elegant men','a giant man']],
    ['astronomer','moon starer',['moon stars','star gazer','more stars']],['school master','the classroom',['the class rooms','the schoolroom','a classmate']]];
  /* curated real words, used as near-miss distractors (picked for sharing the most letters) */
  const BANK=('listen silent tinsel lister lessen settle earth heart hearth heat hater hates night thing think tight tongs below elbow bowel? bowls blow elbows state taste tests stage steak study dusty sturdy stud lemon melon lemons demon money peach cheap reach chase cheat sword words world swore swords stressed desserts dresses stresses meat team mate? meet tame pots stop spot? tops post posh evil live vile? veil? love inch chin chip itch save vase vast sale shave lump plum plump lamp jump shrub brush shrug brushes blush panel plane plan planet pane ocean canoe clean acorn ocelot march charm match chart harm teach cheat cheap beach chest rescue secure recuse? cure rescued tea eat tear seat ate art rat tar? car arm '+
    'elephant kangaroo pencil rainbow pizza guitar banana rocket turtle castle volcano octopus penguin dolphin umbrella giraffe koala wombat parrot butterfly tiger rabbit lantern camera orange')
    .split(' ').filter(w=>w&&!w.endsWith('?'));
  function near(word,n,H,avoid){const tw=letters(word),cnt=w=>{const a=tw.split('');let s=0;letters(w).split('').forEach(c=>{const i=a.indexOf(c);if(i>=0){a.splice(i,1);s++;}});return s-Math.abs(letters(w).length-tw.length);};
    const c=H.shuffle(BANK.filter(w=>letters(w)!==tw&&!isAnagram(w,word)&&!(avoid||[]).includes(w))).sort((a,b)=>cnt(b)-cnt(a));return c.slice(0,n);}

  const PICS=[['elephant','🐘','A huge grey animal with a trunk'],['kangaroo','🦘','An Australian animal that hops'],['pencil','✏️','You write and draw with it'],['rainbow','🌈','Colours in the sky after rain'],
    ['pizza','🍕','A round food with cheese on top'],['guitar','🎸','An instrument with strings'],['banana','🍌','A long yellow fruit'],['rocket','🚀','It blasts off into space'],
    ['turtle','🐢','A reptile with a shell'],['castle','🏰','Where a king and queen might live'],['volcano','🌋','A mountain that can erupt'],['octopus','🐙','A sea animal with eight arms'],
    ['penguin','🐧','A bird that swims but cannot fly'],['dolphin','🐬','A clever sea mammal that clicks and whistles'],['umbrella','☂️','Keeps you dry in the rain'],['giraffe','🦒','The tallest animal'],['butterfly','🦋','It was once a caterpillar'],['camera','📷','Takes photos']];
  const PALW=['level','radar','kayak','civic','refer','noon','racecar','madam','rotor','stats','solos','tenet','deed','peep','wow','eye','mum','dad','redder','pop'];
  const NONPALW=['lever','radio','kayaks','civil','refers','moon','racecars','madman','rotate','start','solo','tenth','deer','pepper','wool','eyes','mums','dab','reader','pope'];
  const PALP=['top spot','nurses run','step on no pets','never odd or even','was it a car or a cat I saw','my gym','too hot to hoot','no lemon, no melon','taco cat','borrow or rob','tuna nut','race car'];
  const NONPALP=['top stop','nurses ran','step on the pets','never odd or odd','was it a cat or a rat I saw','my gum','too hot to hoop','no lemon, no melons','taco cats','borrow or bob','nut tuna','race cars'];
  const PAN=['The quick brown fox jumps over the lazy dog.','The five boxing wizards jump quickly.','How vexingly quick daft zebras jump!','Sphinx of black quartz, judge my vow.',
    'Jackdaws love my big sphinx of quartz.','Quick zephyrs blow, vexing daft Jim.','We promptly judged antique ivory buckles for the next prize.','Crazy Fredrick bought many very exquisite opal jewels.','Five quacking zephyrs jolt my wax bed.'];
  const NEARPAN=['The quick brown fox jumped over the lazy dog.','The quick brown fox jumps over the lazy frog.','Sphinx of black quartz, judge my cow.','The quick brown wolf jumps over the lazy dog.',
    'Jackdaws like my big sphinx of quartz.','The four boxing wizards jump quickly.'].filter(t=>missingL(t).length===1);
  const NOE=['A big black cat sat on a warm mat.','Lucy and Sam ran to a big park.','I saw a shark swim past my boat.','Kids at our school play footy at lunch.','My mum cooks good pasta on Sundays.','A koala clung to a branch all night.','Grandpa told us a funny story.'];
  const WITHE=['The cat sat on the mat.','We ran to the big park.','Seven sharks swam past us.','My mum cooked pasta on Tuesday.','A koala slept in a tree.','Grandma told us a scary tale.','Five ducks swim in the pond.','The sun came out at lunch.'];
  const LIPO=[['A big black cat sat on a warm mat.','e'],['Grandpa told us a funny story.','e'],['A koala clung to a branch all night.','e'],['Tom went to the shop with his little brother.','a'],
    ['We put six eggs in the bowl.','a'],['Lily and her friends swam in the sea.','o'],['The dog ran across the sunny yard.','i'],['My cat Max can catch a ball.','e']];
  const CODEW=['cat','dog','sun','map','key','spy','book','code','clue','ship','star','moon','frog','cake','rain','gold','note','door','fish','owl','hat','pen','lamp','tree'];
  const CODEP=['meet at noon','look up','find the key','top secret','word spy','go left','hide the map','open the door'];
  const shift=(s,k)=>s.toUpperCase().replace(/[A-Z]/g,c=>String.fromCharCode((c.charCodeAt(0)-65+k+26)%26+65));
  const num=s=>s.toUpperCase().split(' ').map(w=>w.split('').map(c=>c.charCodeAt(0)-64).join('-')).join(' / ');

  function gAnagram(H,l){
    if(l>=2&&H.chance(0.4)){const [a,b,d]=H.pick(ANAP);const [src,ans]=H.chance(0.5)?[a,b]:[a,b];
      return M(Object.assign({sub:'anagram',prompt:`Which is an <b>anagram</b> of “${src}”?`,vis:tiles(src),hint:'Use every letter exactly once. Cross them off as you go.',
        explain:J(['An anagram uses exactly the same letters in a new order.',`“${src}” → <b>${ans}</b>`,`Check: both have the letters ${sortL(src).toUpperCase().split('').join(' ')}.`])},H.opts(ans,d,{cls:'sent'})),{type:'anagram',src});}
    const p=H.pick(ANA);const [src,ans]=H.chance(0.5)?p:[p[1],p[0]];const d=near(src,3,H,[ans]);
    return M(Object.assign({sub:'anagram',prompt:`Which word is an <b>anagram</b> of <b>${src.toUpperCase()}</b>?`,vis:tiles(src),hint:'An anagram uses exactly the same letters, each one once. Check letter by letter.',
      explain:J(['An anagram uses exactly the same letters in a new order.',`${src.toUpperCase()} → <b>${ans.toUpperCase()}</b>`,`Check: both have ${sortL(src).toUpperCase().split('').join(' ')}. The other words have a letter added, missing or different.`])},H.opts(ans,d,{cls:'txt'})),{type:'anagram',src});}
  function gUnscramble(H,l){const pool=PICS.filter(p=>l>=1||p[0].length<=7);const [w,em,clue]=H.pick(pool);
    let sc=w;for(let i=0;i<30&&(sc===w||BANK.includes(sc)||sc.slice(0,2)===w.slice(0,2));i++)sc=H.shuffle(w.split('')).join('');
    const same=PICS.map(p=>p[0]).filter(x=>x!==w&&!isAnagram(x,w));const d=H.shuffle(same).sort((a,b)=>Math.abs(a.length-w.length)-Math.abs(b.length-w.length)).slice(0,3);
    return M(Object.assign({sub:'unscramble',prompt:`Unscramble the letters to find the word. Clue: <b>${clue}</b>.`,vis:`<div class="emo">${em}</div>${tiles(sc)}`,hint:'Look at the picture, then find the first letter.',
      explain:J([`The letters ${sc.toUpperCase().split('').join(' ')} can be rearranged.`,`Clue: ${clue}.`,`They spell <b>${w.toUpperCase()}</b>.`])},H.opts(w,d,{cls:'txt'})),{type:'unscramble',letters:sc});}
  function gPalin(H,l){
    const phr=l>=1&&H.chance(0.5);const P=phr?PALP:PALW,N=phr?NONPALP:NONPALW;
    if(H.chance(0.5)){const a=H.pick(P);const d=H.shuffle(N.slice()).slice(0,3);
      return M(Object.assign({sub:'palin',prompt:`Which one is a <b>palindrome</b> (reads the same forwards and backwards)?`,vis:'',hint:'Read each one backwards, letter by letter. Ignore spaces and commas.',
        explain:J(['A palindrome reads the same forwards and backwards (ignore spaces and punctuation).',`<b>${a}</b> backwards: ${letters(a).split('').reverse().join('').toUpperCase()}.`,'It matches, so it is a palindrome.'])},H.opts(a,d,{cls:phr?'sent':'txt'})),{type:'palpick'});}
    const yes=H.chance(0.5);const t=yes?H.pick(P):H.pick(N);const rev=letters(t).split('').reverse().join('').toUpperCase();
    return M(Object.assign({sub:'palin',prompt:'Is this a <b>palindrome</b>?',vis:sent(`<b>${t}</b>`),hint:'Write or say the letters backwards. Are they the same?',
      explain:J([`Letters forwards: ${letters(t).toUpperCase()}.`,`Letters backwards: ${rev}.`,yes?'They match → <b>Yes</b>, it is a palindrome.':'They are different → <b>No</b>, it is not a palindrome.'])},H.fixedOpts(['Yes','No'],yes?0:1,'txt')),{type:'palyn',text:t,yes});}
  function gPalinMake(H,l){const pool=PALW.filter(w=>w.length>=(l>=1?5:4));const w=H.pick(pool);const n=w.length;
    const pos=H.pick([...Array(n).keys()].filter(i=>!(n%2===1&&i===(n-1)/2)));const ans=w[pos];
    const shown=w.split('').map((c,i)=>i===pos?'_':c).join('');const d=H.shuffle(AZ.filter(c=>c!==ans&&'aeiouyrstlnmdpk'.includes(c))).slice(0,3);
    return M(Object.assign({sub:'palinmake',prompt:'Which letter fills the gap to make a <b>palindrome</b>?',vis:`<div class="tiles">${shown.toUpperCase().split('').map(c=>c==='_'?'<span class="gapt">?</span>':`<span>${c}</span>`).join('')}</div>`,hint:'A palindrome is a mirror: the first letter matches the last, the second matches the second-last…',
      explain:J(['In a palindrome, letters match in pairs from the outside in.',`The gap is letter ${pos+1}, so it must match letter ${n-pos}, which is <b>${ans.toUpperCase()}</b>.`,`${w.toUpperCase()} reads the same both ways.`])},H.opts(ans.toUpperCase(),d.map(c=>c.toUpperCase()),{cls:'txt'})),{type:'palmake',pattern:shown});}
  function gPangram(H,l){
    if(l>=1&&H.chance(0.6)){const t=H.pick(NEARPAN);const m=missingL(t);if(m.length!==1)throw new Error('nearpan '+t);const ans=m[0];
      const d=H.shuffle(AZ.filter(c=>letters(t).includes(c))).slice(0,3);
      return M(Object.assign({sub:'pangram',prompt:'This is <b>almost</b> a pangram. Which letter of the alphabet is missing?',vis:sent(t),hint:'Go through the choices and hunt for each one in the sentence.',
        explain:J(['A pangram uses every letter A to Z at least once.',`Check each choice: ${[ans].concat(d).sort().map(c=>c.toUpperCase()+(c===ans?' ✗ not there':' ✓ found')).join(', ')}.`,`The missing letter is <b>${ans.toUpperCase()}</b>.`])},H.opts(ans.toUpperCase(),d.map(c=>c.toUpperCase()),{cls:'txt'})),{type:'panmiss',text:t});}
    const yes=H.chance(0.5);const t=yes?H.pick(PAN):H.pick(NEARPAN);const m=missingL(t);
    return M(Object.assign({sub:'pangram',prompt:'Is this sentence a <b>pangram</b> (does it use every letter of the alphabet)?',vis:sent(t),hint:'Look for the tricky letters first: J, Q, X, Z, then V, K and S.',
      explain:J(['A pangram uses every letter A to Z at least once.',yes?'Every letter from A to Z appears, even J, Q, X and Z.':`The letter <b>${m[0].toUpperCase()}</b> is missing.`,yes?'So <b>Yes</b>, it is a pangram.':'So <b>No</b>, it is not a pangram.'])},H.fixedOpts(['Yes','No'],yes?0:1,'txt')),{type:'panyn',text:t,yes});}
  function gLipogram(H,l){
    if(H.chance(0.5)){const a=H.pick(NOE);const d=H.shuffle(WITHE.slice()).slice(0,3);
      return M(Object.assign({sub:'lipogram',prompt:'A <b>lipogram</b> bans a letter. Which sentence does <b>not</b> use the letter <b>E</b>?',vis:'',hint:'Hunt for E in every word of each sentence.',
        explain:J(['A lipogram is writing that never uses one particular letter.',`<b>${a}</b> has no E anywhere.`,'Each of the other sentences has at least one E.'])},H.opts(a,d,{cls:'sent'})),{type:'lipopick',letter:'e'});}
    const [t,ban]=H.pick(LIPO.filter(x=>l>=1||x[1]==='e'));const d=H.shuffle(AZ.filter(c=>letters(t).includes(c))).slice(0,3);
    return M(Object.assign({sub:'lipogram',prompt:'This sentence is a <b>lipogram</b>. Which letter is banned (never used)?',vis:sent(t),hint:'Look for each choice in the sentence. The banned letter is nowhere.',
      explain:J(['A lipogram never uses one particular letter.',`${[ban].concat(d).sort().map(c=>c.toUpperCase()+(c===ban?' ✗ never used':' ✓ used')).join(', ')}.`,`The banned letter is <b>${ban.toUpperCase()}</b>.`])},H.opts(ban.toUpperCase(),d.map(c=>c.toUpperCase()),{cls:'txt'})),{type:'lipoban',text:t,letter:ban});}
  function gCode(H,l){const phrase=l>=2&&H.chance(0.5);const ans=phrase?H.pick(CODEP):H.pick(CODEW);const mode=H.pick(l>=1?['shift1','num','shift2']:['shift1','num']);
    const k=mode==='shift2'?2:1;const code=mode==='num'?num(ans):shift(ans,k);
    const others=(phrase?CODEP:CODEW).filter(w=>w!==ans);let d=H.shuffle(others.filter(w=>w.length===ans.length)).concat(H.shuffle(others.filter(w=>w.length!==ans.length)));
    d=d.slice(0,2);if(mode!=='num')d.push(shift(ans,2*k).toLowerCase());else d.push(H.pick(others.filter(w=>!d.includes(w))));
    const rule=mode==='num'?'Each letter is swapped for its place in the alphabet: A = 1, B = 2, C = 3 … Z = 26.':`Each letter was moved <b>${k} step${k>1?'s':''} forward</b> in the alphabet (${k===1?'A → B, B → C … Z → A':'A → C, B → D … Y → A, Z → B'}).`;
    return M(Object.assign({sub:'code',prompt:`Crack the code! ${rule} What does it say?`,vis:`<div class="cipher">${code}</div>`,hint:mode==='num'?'Count along the alphabet: 1 = A, 5 = E, 10 = J, 15 = O, 20 = T.':`To decode, move each letter ${k} step${k>1?'s':''} <b>back</b>.`,
      explain:J([mode==='num'?'Turn each number back into its letter.':`To decode, move each letter ${k} back: ${shift(ans,k).replace(/ /g,'')[0]} → ${ans.toUpperCase()[0]}.`,`${code} → <b>${ans.toUpperCase()}</b>`])},H.opts(ans.toUpperCase(),d.map(x=>x.toUpperCase()),{cls:phrase?'sent':'txt'})),{type:'code',mode,k,code});}

  return {id:'wordspy',title:'Word Spy: Letter Games',icon:'🕵️',dedupByText:true,code:'EN2-VOCAB-01 · EN2-SPELL-01 · EN2-UARL-01 → EN3',
    blurb:'From The Word Spy (ch.4 “Letters, letters, letters”): anagrams, palindromes, pangrams, lipograms and secret codes.',
    subs:l=>['anagram','unscramble','palin','palinmake','pangram','lipogram','code'],
    gen(H,l,sub){if(sub==='anagram')return gAnagram(H,l);if(sub==='unscramble')return gUnscramble(H,l);if(sub==='palin')return gPalin(H,l);if(sub==='palinmake')return gPalinMake(H,l);
      if(sub==='pangram')return gPangram(H,l);if(sub==='lipogram')return gLipogram(H,l);return gCode(H,l);},
    _check:{letters,sortL,isAnagram,isPal,missingL,shift,num},
    example(){const az=AZ.map(c=>`<span>${c.toUpperCase()}</span>`).join('');
      return {html:`<h3>🕵️ The Word Spy’s letter games</h3>
<div class="wsx"><div class="wsc"><b>🔀 Anagram</b><p>The <b>same letters</b> in a new order.</p>${tiles('listen')}<div>↓</div>${tiles('silent')}<p class="small">the eyes → they see</p></div>
<div class="wsc"><b>🔁 Palindrome</b><p>Reads the <b>same forwards and backwards</b>.</p>${tiles('racecar')}<p class="small">top spot · step on no pets<br>Check the outside letters, then move in.</p></div>
<div class="wsc"><b>🔤 Pangram</b><p>Uses <b>every letter</b> A–Z at least once.</p>${sent('The quick brown fox jumps over the lazy dog.')}<div class="azs">${az}</div></div>
<div class="wsc"><b>🚫 Lipogram</b><p>Writing that <b>bans a letter</b>.</p>${sent('A big black cat sat on a warm mat.')}<p class="small">No letter E anywhere!</p></div></div>
<div class="wsc wide"><b>🔐 Secret codes</b><p><b>Shift code:</b> move each letter one step on: C→D, A→B, T→U, so CAT is written <span class="cipher sm">DBU</span>. To read it, move each letter one step <b>back</b>.<br><b>Number code:</b> A = 1, B = 2, C = 3 … so <span class="cipher sm">3-1-20</span> = CAT.</p></div>`};}};
})());

/* Order matters: the FIRST active entry becomes the "From school today" section, so the newest topic goes first.
   Every entry dated this week still gets extra weight in the mix and in Friday's week review. */
DAILY_FOCUS.push({date:'2026-10-30', topicId:'wordspy', title:'Word Spy ch.4: Letters, letters, letters', note:'From class today', until:'2026-11-01'});
