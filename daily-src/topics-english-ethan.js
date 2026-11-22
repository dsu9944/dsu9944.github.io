/* ===== Ethan's English practice topics (NSW English K–10 Syllabus 2022, Stage 1 → Stage 2) =====
   About 10 minutes a day. Mostly tap-the-answer, with some short typed spelling on a letter keypad.
   Engine levels 0..3 (a new topic starts at 1): 0 = Year 2 review, 1 = early Year 3, 2 = Year 3, 3 = upper Year 3 / early Year 4 stretch.
   pt47u, pt55u, pt59u, then pt104u (4th step-up): upper Year 3 and early Year 4 (harder -tion/-sion, typo-prone spelling, word-class traps, inference).
   Every question has: hint (short), hint2 ("More help"), explain (steps) and why (one line for the results list). */
const ENK=(function(){
  const J=a=>a.join('<br>');
  const sent=s=>`<div class="esent">${s}</div>`;
  const emo=e=>e?`<div class="emo">${e}</div>`:'';
  const M=(o,meta)=>Object.assign(o,{meta});
  const uniq=a=>a.filter((x,i)=>a.indexOf(x)===i);
  /* tiles: letters with a purple gap box where the missing part goes */
  const tiles=(w,gapAt,gapLen)=>`<div class="tiles">${w.split('').map((c,i)=>i===gapAt?`<span class="gapt">?</span>`:(i>gapAt&&i<gapAt+gapLen)?'':`<span>${c.toUpperCase()}</span>`).join('')}</div>`;
  /* typed spelling on a letter keypad: q.keys turns the number keypad into letter keys */
  const FILL='aeioustrnlhy'.split('');
  function spellE(ans,{pre='',post='',extra=4}={}){const own=uniq(ans.split(''));const more=FILL.filter(c=>!own.includes(c));
    const keys=uniq(own.concat(shuffle(more.slice()).slice(0,Math.max(0,Math.min(extra,12-own.length))))).sort();
    return {kind:'entry',fields:[{id:'a',len:ans.length+1}],layout:`${pre}[[a]]${post}`,answer:{a:ans},keys,check:v=>String(v.a||'').toLowerCase()===ans};}
  /* sentence tokens: {word:n} {word:v} {word:a} {word:d}, [prepositional phrase] */
  function parse(s){const toks=[];const re=/\{([^:}]+):([nvad])\}|\[([^\]]+)\]|([A-Za-z’']+)/g;let m;
    while((m=re.exec(s))){if(m[1])toks.push({w:m[1],c:m[2]});else if(m[3])toks.push({w:m[3],c:'p',phrase:true});else toks.push({w:m[4],c:''});}
    const plain=s.replace(/\{([^:}]+):[nvad]\}/g,'$1').replace(/\[([^\]]+)\]/g,'$1');return {toks,plain};}
  const CN={n:'noun',v:'verb',a:'adjective',d:'adverb'};
  return {J,sent,emo,M,uniq,tiles,spellE,parse,CN};
})();
window.ENKIT=ENK;
const ENE=(function(){
  const {J,sent,emo,M,uniq,tiles,spellE,parse,CN}=ENK;
  /* Prefer upper Year 3 / early Year 4; almost always stretch one level. Once a topic has started, drop Year 2 and early Year 3 fillers. */
  function poolLvl(arr,l,idx){const stretch=Math.min(3,l+(l>=1&&chance(0.9)?1:0));let ok=arr.filter(x=>x[idx]<=stretch);if(!ok.length)ok=arr.filter(x=>x[idx]<=l);
    const floor=l>=3?3:(l>=1?2:0);const prefer=ok.filter(x=>x[idx]>=floor);if(prefer.length)return prefer;
    const mid=ok.filter(x=>x[idx]>=Math.max(0,floor-1));return mid.length?mid:ok;}
  const pickL=(arr,l,idx)=>pick(poolLvl(arr,l,idx));

  /* ---------------- warm-up: rhymes, syllables, ABC order ---------------- */
  const RHY=[['cat',['hat','mat','bat'],['dog','cup','sun','pen'],0],['dog',['log','frog','fog'],['cat','bed','sun','pig'],0],['sun',['fun','run','bun'],['sit','sea','sock','hat'],0],
    ['bed',['red','fed','shed'],['bad','bus','bin','hop'],0],['pig',['dig','wig','big'],['pen','pot','bag','peg'],0],['cake',['lake','snake','bake'],['cook','kite','cape','tap'],1],
    ['night',['light','kite','bright'],['nest','knot','neat','new'],1],['tree',['bee','sea','key'],['tray','try','toe','ten'],1],['coat',['boat','goat','note'],['cot','cut','cart','cool'],1],
    ['star',['car','jar','far'],['stair','stop','sky','step'],1],['moon',['spoon','soon','balloon'],['moan','mean','mine','mud'],1],
    ['chair',['bear','pear','hair'],['cheer','chin','chop','shoe'],2],['clock',['sock','rock','block'],['cloud','click','clap','lake'],2],['snow',['grow','toe','glow'],['snap','snake','sneeze','sun'],2],
    ['great',['late','eight','straight'],['greet','grant','green','gate'],3],['heard',['bird','third','stirred'],['heart','hard','head','herd'],3],
    ['weight',['late','eight','straight'],['wait','white','wheat','height'],3],['through',['blue','flew','shoe'],['though','thought','throw','tough'],3],
    ['break',['steak','ache','make'],['brake','bread','breaked','brick'],3]];
  const SYL=[['cat',1],['frog',1],['school',1],['sun',1],['rabbit',2],['pencil',2],['monkey',2],['tiger',2],['apple',2],['window',2],
    ['elephant',3],['banana',3],['dinosaur',3],['kangaroo',3],['umbrella',3],['computer',3],['butterfly',3],['crocodile',3],
    ['helicopter',4],['watermelon',4],['caterpillar',4],['alligator',4],
    ['information',4],['invitation',4],['celebration',4],['calculator',4],['Australia',4],
    ['hippopotamus',5],['electricity',5],['university',5],['imagination',5],['refrigerator',5]];
  const ABCW=['ant','bus','cat','duck','egg','fish','goat','hat','ink','jam','kite','lion','moon','nest','owl','pig','queen','rain','sun','tap','van','web','yak','zoo'];
  const ABC2=[['sand','seal','sock','sun'],['bat','bed','bin','bus'],['cake','cloud','cow','cup'],['tap','ten','tiger','tree'],['map','milk','moon','mud'],['pan','pet','pig','pond'],['rat','red','ring','rock'],['dad','den','dig','dog']];
  const ABC3=[['stand','star','stamp','stay'],['chair','chop','chin','chess'],['break','brush','brave','bring'],['cloud','clap','clock','close'],['train','trap','tree','trick'],['splash','split','spoon','sport']];
  const ABC4=[['stream','stroke','strip','straw'],['three','throw','thrill','thrust'],['scratch','scream','scroll','script'],['grain','grant','grape','grass']];
  const quick={id:'quick',title:'Quick Sounds',icon:'⚡',warm:true,dedupByText:true,code:'EN1-PHOKW-01 · EN1-SPELL-01',
    blurb:'Rhyming words, clapping syllables and ABC order.',
    subs:l=>l>=1?['rhyme','syll','abc']:['rhyme','syll'],
    gen(H,l,sub){
      if(sub==='syll'){const [w,n]=pick(SYL.filter(x=>l>=2?x[1]>=4:l>=1?x[1]>=3:x[1]<=2));
        const choices=n>=5?['2','3','4','5']:['1','2','3','4'];
        return M(Object.assign({sub,prompt:`How many syllables (beats) in <b>${w}</b>?`,vis:emo('👏'),hint:'Clap the word slowly. Count each clap you make.',hint2:'Put your hand under your chin. Count each time it drops.',
          explain:J([`Clap it: ${w}.`,`That is <b>${n}</b> beat${n>1?'s':''}.`]),why:`“${w}” has ${n} beat${n>1?'s':''} when you clap it.`},fixedOpts(choices,choices.indexOf(String(n)),'txt')),{type:'syll'});}
      if(sub==='abc'){let ws,mode=l>=2?(chance(0.65)?3:2):(l>=1&&chance(0.75)?1:0);
        if(mode===3)ws=shuffle(pick(ABC4).slice());else if(mode===2)ws=shuffle(pick(ABC3).slice());else if(mode===1)ws=shuffle(pick(ABC2).slice());else ws=shuffle(ABCW.slice()).slice(0,4);
        const a=ws.slice().sort()[0];
        const h1=mode>=3?'They begin with the same opening letters. Look at the 4th letter.':mode===2?'They start with the same two letters. Look at the third letter.':mode===1?'All the words start the same. Look at the second letter instead.':'Look at the first letter of each word. Which comes first in the alphabet?';
        const ex1=mode>=3?'They begin with the same opening letters, so look at the 4th.':mode===2?'They start with the same two letters, so look at the third.':mode===1?'They all start with the same letter, so look at the second letter.':'Look at the first letters.';
        const wh=mode>=3?`Look at the fourth letters: “${a}” comes first in the alphabet.`:mode===2?`Look at the third letters: “${a}” comes first in the alphabet.`:mode===1?`Look at the second letters: “${a}” comes first in the alphabet.`:`“${a.charAt(0)}” comes first in the alphabet, so “${a}” is first.`;
        return M(Object.assign({sub,prompt:'Which word comes <b>first</b> in ABC order?',vis:'',hint:h1,
          hint2:'Sing the alphabet slowly. Stop when you reach one of the letters.',explain:J([ex1,`<b>${a}</b> comes first.`]),
          why:wh},opts(a,ws.filter(x=>x!==a),{cls:'txt'})),{type:'abc'});}
      const [w,yes,no]=pickL(RHY,l,3);const a=pick(yes);const d=shuffle(no.slice()).slice(0,3);
      return M(Object.assign({sub:'rhyme',prompt:`Which word <b>rhymes</b> with “${w}”?`,vis:'',hint:'Rhyming words sound the same at the end. Say each word out loud.',hint2:'Say the end sound of the word. Listen for it in each choice.',
        explain:J([`${w} … ${a}.`,'They sound the same at the end, so they rhyme.']),why:`“${w}” and “${a}” sound the same at the end.`},opts(a,d,{cls:'txt'})),{type:'rhyme'});
    },
    example(){return {html:`<p>⚡ Quick Sounds: rhymes (cat, hat), clapping beats (ra-bbit = 2) and ABC order.</p>`};}};

  /* ---------------- 1. phonics: digraphs and vowel teams ---------------- */
  const DIG=[ /* word, emoji, clue, part, position, distractors, level */
    ['ship','🚢','It sails on the sea','sh','start',['ck','ng','th'],0],['fish','🐟','It swims in water','sh','end',['ch','th','ck'],0],
    ['chick','🐥','A baby chicken','ch','start',['sh','wh','ng'],0],['cheese','🧀','Mice love to eat it','ch','start',['sh','th','wh'],0],
    ['thumb','👍','Thumbs up!','th','start',['sh','ch','wh'],0],['three','3️⃣','The number after two','th','start',['sh','ch','wh'],0],
    ['whale','🐋','A huge sea animal','wh','start',['th','ch','ng'],0],['wheel','🛞','A car has four of these','wh','start',['th','sh','ch'],1],
    ['duck','🦆','It says quack','ck','end',['ch','th','wh'],0],['sock','🧦','You wear it on your foot','ck','end',['ch','th','wh'],0],
    ['clock','⏰','It tells the time','ck','end',['ch','sh','wh'],1],['ring','💍','You wear it on your finger','ng','end',['ck','th','wh'],0],
    ['king','👑','He wears a crown','ng','end',['sh','th','wh'],0],['bench','🪑','A long seat in the park','ch','end',['sh','ck','th'],1],
    ['brush','🪥','You clean your teeth with it','sh','end',['ch','ck','ng'],1],['swing','🛝','You go back and forth on it','ng','end',['ck','sh','th'],1],
    ['moth','🦋','It flies at night, near lights','th','end',['sh','ck','ng'],2],['whisk','🥣','You mix eggs with it','wh','start',['th','sh','ch'],2],
    ['thrush','🐦','A small brown songbird','th','start',['sh','ch','wh'],3],['stretch','🤸','You do this after a run','ch','end',['sh','th','ck'],3],
  ];
  const VT=[ /* word, emoji, clue, vowel team, distractors, level */
    ['rain','🌧️','Water falling from clouds','ai',['ay','ee','igh'],0],['train','🚂','It runs on a track','ai',['ay','ow','ee'],0],['snail','🐌','A slow animal with a shell','ai',['ay','ee','ou'],0],
    ['paint','🎨','You use it to colour a picture','ai',['ay','ee','ow'],1],['play','🛝','What you do at lunch time','ay',['ai','ee','igh'],0],['tray','🍽️','You carry food on it','ay',['ai','ee','ow'],1],
    ['tree','🌳','It has leaves and branches','ee',['ea','ai','igh'],0],['bee','🐝','It buzzes and makes honey','ee',['ea','ay','ow'],0],['sheep','🐑','A farm animal with wool','ee',['ea','ai','ou'],0],
    ['feet','🦶','You stand on them','ee',['ai','ow','igh'],1],['leaf','🍃','It falls from a tree','ea',['ee','ai','ow'],0],['beach','🏖️','Sand by the sea','ea',['ai','ow','ou'],1],
    ['seal','🦭','A sea animal with flippers','ea',['ai','ow','igh'],1],['teacher','🧑‍🏫','The grown-up who teaches your class','ea',['ee','ai','ow'],2],
    ['night','🌙','When it is dark and you sleep','igh',['ie','ai','ou'],0],['light','💡','It helps you see in the dark','igh',['ie','ai','ou'],0],['high','🪁','Way up in the sky','igh',['ai','ee','ay'],1],
    ['bright','☀️','Full of light, like the sun','igh',['ai','ee','ou'],2],['snow','❄️','Cold and white, it falls in winter','ow',['ou','ai','ee'],0],['cow','🐄','A farm animal that says moo','ow',['ou','ee','ai'],0],
    ['owl','🦉','A bird that hoots at night','ow',['ou','ai','ay'],1],['clown','🤡','A funny person at the circus','ow',['ou','ai','ee'],1],['mouse','🐭','A small animal that squeaks','ou',['ow','ai','ee'],0],
    ['cloud','☁️','Fluffy and white in the sky','ou',['ow','ai','ee'],0],['house','🏠','A home you live in','ou',['ow','ai','ee'],1],['mouth','👄','You eat and talk with it','ou',['ow','ai','ee'],1],
    ['shout','📣','To call out very loudly','ou',['ow','ai','ee'],2],['crown','👑','A king wears it','ow',['ou','ai','ee'],2],['dream','💭','What you see when you sleep','ea',['ee','ai','ow'],2],
    ['fright','😱','A sudden scare','igh',['ie','ai','ou'],3],['sprout','🌱','A tiny new plant pushing up','ou',['ow','oa','ai'],3],['stream','🏞️','A small river of fresh water','ea',['ee','ai','ie'],3],
  ];
  const FAM={ai:['rain','tail','wait','snail','paint','train'],ay:['day','say','play','way','tray'],ee:['see','tree','green','sheep','bee','feet'],ea:['sea','eat','read','leaf','beach','dream'],
    igh:['night','light','right','high','bright'],ou:['out','loud','house','cloud','mouse','shout']};
  const OWL=['cow','owl','clown','crown'];const FAMOW={a:['now','how','down','town','cow','owl','clown','crown'],b:['slow','grow','show','snow','glow']};
  const famEx=(w,p)=>{let L=p==='ow'?(OWL.includes(w)?FAMOW.a:FAMOW.b):FAM[p];return pick(L.filter(x=>x!==w));};
  /* Year 3–4 spelling stretch: -tion, silent letters, doubling the last letter */
  const PAT=[
    ['station','🚉','A place where trains stop','tion',['sion','cian','shun'],2,'tion'],
    ['action','🎬','Something you do','tion',['sion','cian','shun'],2,'tion'],
    ['nation','🌏','Another word for a country','tion',['sion','cian','shun'],3,'tion'],
    ['question','❓','You ask one in class','tion',['sion','shun','cian'],3,'tion'],
    ['knife','🔪','You cut food with it','k',['n','f','e'],2,'silent'],
    ['write','✏️','You do this with a pencil','w',['r','t','i'],2,'silent'],
    ['lamb','🐑','A baby sheep','b',['m','l','a'],2,'silent'],
    ['castle','🏰','A king or queen lives here','t',['c','s','l'],3,'silent'],
    ['knee','🦵','It bends in the middle of your leg','k',['n','e','w'],3,'silent'],
    ['hopping','🐸','A frog is doing this right now','hopping',['hoping','hoping','hoppping'],2,'double'],
    ['running','🏃','Moving very fast on your feet','running',['runing','runnning','runnig'],2,'double'],
    ['stopped','🛑','The car did this at the lights','stopped',['stoped','stoppped','stopt'],2,'double'],
    ['hoping','🤞','Wishing that something will happen','hoping',['hopping','hopeing','hoppping'],3,'double'],
    ['smiling','😊','What you do when you are glad','smiling',['smileing','smilling','smilin'],3,'double'],
    ['invention','💡','A new idea someone has made','tion',['sion','cian','shun'],3,'tion'],
    ['attention','👂','You pay this in class','tion',['sion','cian','shun'],3,'tion'],
    ['division','➗','Sharing a number into equal parts','sion',['tion','cian','shun'],3,'tion'],
    ['television','📺','You watch shows on it','sion',['tion','cian','shun'],3,'tion'],
    ['dangerous','⚠️','Not safe to do','ous',['us','ious','ise'],3,'tion'],
    ['poisonous','☠️','Something that can make you very sick','ous',['us','ious','ise'],3,'tion'],
    ['listen','👂','You do this with your ears','t',['l','s','n'],3,'silent'],
    ['doubt','🤔','To be unsure about something','b',['d','o','t'],3,'silent'],
    ['wreck','🚢','A smashed ship','w',['r','e','k'],3,'silent'],
    ['honest','🤝','Someone who always tells the truth','h',['o','n','t'],3,'silent'],
    ['island','🏝️','Land with water all around it','s',['i','l','a'],3,'silent'],
    ['closing','🚪','The shop is doing this at the end of the day','closing',['closeing','clossing','closin'],3,'double'],
    ['planned','🗓️','We already ___ the party yesterday','planned',['planed','plannned','pland'],3,'double'],
    ['celebration','🎉','A party for something special','tion',['sion','cian','shun'],3,'tion'],
    ['information','ℹ️','Facts you find out about something','tion',['sion','cian','shun'],3,'tion'],
    ['invitation','✉️','A note asking someone to come','tion',['sion','cian','shun'],3,'tion'],
    ['direction','➡️','The way you need to go','tion',['sion','cian','shun'],3,'tion'],
    ['description','📝','Words that tell what something is like','tion',['sion','cian','shun'],3,'tion'],
    ['decision','⚖️','A choice you have made','sion',['tion','cian','shun'],3,'tion'],
    ['confusion','😵','When things feel mixed up','sion',['tion','cian','shun'],3,'tion'],
    ['permission','✅','Being allowed to do something','sion',['tion','cian','shun'],3,'tion'],
    ['explosion','💥','A sudden loud burst','sion',['tion','cian','shun'],3,'tion'],
    ['occasion','🎈','A special event or time','sion',['tion','cian','shun'],3,'tion'],
    ['mysterious','🕵️','Hard to explain or full of secrets','ous',['us','ious','ise'],3,'tion'],
    ['curious','🧐','Wanting to find things out','ous',['us','ious','ise'],3,'tion'],
    ['whistle','🎵','You blow it to make a high sound','t',['w','h','s'],3,'silent'],
    ['receipt','🧾','The slip you get after you pay','p',['r','c','t'],3,'silent'],
    ['beginning','▶️','The very start of something','beginning',['begining','beginnning','beggining'],3,'double'],
    ['coming','🚶','On the way here now','coming',['comeing','comming','comingg'],3,'double']];
  const phonics={id:'phonics',title:'Sounds and Letters',icon:'🔤',dedupByText:true,code:'EN1-PHOKW-01 · EN1-SPELL-01 → EN2-SPELL-01',
    blurb:'Digraphs, vowel teams, and Year 3–4 stretch: -tion/-sion/-ous, silent letters and suffix rules.',
    subs:l=>l>=2?['digraph','vowel','spell','pattern']:l>=1?['digraph','vowel','vowel','spell']:['digraph','vowel','vowel'],
    gen(H,l,sub){
      if(sub==='pattern'){const [w,e,clue,p,d,lv,k]=pickL(PAT,l,5);
        if(k==='silent')return M(Object.assign({sub,prompt:`Which letter is <b>silent</b> in “${w}”?`,vis:emo(e)+`<div class="small">${clue}</div>`+sent(`<b>${w}</b>`),
          hint:'Say the word slowly. Which letter cannot be heard at all?',hint2:'Cover each letter as you say the word. One is not sounded.',
          explain:J([`Say it: ${w}.`,`You do not hear the letter <b>${p}</b>.`]),why:`In “${w}”, the letter ${p} is silent.`},opts(p,d,{cls:'txt'})),{type:'pattern',w});
        if(k==='double')return M(Object.assign({sub,prompt:'Which spelling is correct?',vis:emo(e)+`<div class="small">${clue}</div>`,
          hint:'Short vowel plus one last consonant? Double that letter before the ending.',hint2:'A long vowel or a word ending in e usually does not double.',
          explain:J([`<b>${p}</b> is the correct spelling.`,`Check the vowel sound, then the last consonant.`]),why:`“${p}” follows the doubling (or drop-e) spelling rule.`},opts(p,d,{cls:'txt'})),{type:'pattern',w});
        const at=w.indexOf(p);const shun=p==='tion'||p==='sion';
        return M(Object.assign({sub,prompt:'Which letters finish the picture word?',vis:emo(e)+`<div class="small">${clue}</div>`+tiles(w,at,p.length),
          hint:shun?'This ending sounds a bit like “shun”. Picture the whole word in a book.':'This ending often means “full of”. Picture the letters in a book.',
          hint2:shun?'Lots of naming words use the same four-letter ending.':'Say the ending slowly. Which letters make that sound?',
          explain:J([`Say it: ${w}.`,`The ending is spelt <b>${p}</b>.`]),why:`“${w}” ends with the letters ${p}.`},opts(p,d,{cls:'txt'})),{type:'pattern',w});}
      if(sub==='digraph'){const [w,e,clue,p,pos,d]=pickL(DIG,l,6);const at=pos==='start'?0:w.lastIndexOf(p);
        return M(Object.assign({sub,prompt:'Which two letters finish the picture word?',vis:emo(e)+`<div class="small">${clue}</div>`+tiles(w,at,p.length),
          hint:'Say the picture word slowly. Which two letters make that sound?',hint2:`Listen carefully to the sound at the ${pos} of the word.`,
          explain:J([`Say it: ${w}.`,`The sound at the ${pos} is spelt <b>${p}</b>.`,`<b>${w}</b>`]),why:`“${w}” is spelt with ${p} at the ${pos}.`},opts(p,d,{cls:'txt'})),{type:'digraph',w});}
      const [w,e,clue,p,d]=pickL(VT,l,5);const at=w.indexOf(p),ex=famEx(w,p);
      if(sub==='spell'){const q=spellE(p,{pre:`<span class="spw">${w.slice(0,at)}</span>`,post:`<span class="spw">${w.slice(at+p.length)}</span>`,extra:5});
        return M(Object.assign({sub,prompt:'Type the missing letters to spell the picture word.',vis:emo(e)+`<div class="small">${clue}</div>`,
          hint:'Say the word slowly. Listen to the long vowel sound in it.',hint2:`Think of “${ex}”. It has the same sound, spelt the same way.`,
          explain:J([`Say it: ${w}.`,`The long vowel sound is spelt <b>${p}</b>, like in ${ex}.`,`<b>${w}</b>`]),why:`“${w}” uses the ${p} team, like “${ex}”.`},q),{type:'vspell',w});}
      return M(Object.assign({sub:'vowel',prompt:'Which vowel team spells the picture word?',vis:emo(e)+`<div class="small">${clue}</div>`+tiles(w,at,p.length),
        hint:'Say the word slowly. Listen to the long vowel sound in it.',hint2:`Think of “${ex}”. It has the same sound, spelt the same way.`,
        explain:J([`Say it: ${w}.`,`The long vowel sound is spelt <b>${p}</b>, like in ${ex}.`,`<b>${w}</b>`]),why:`“${w}” uses the ${p} team, like “${ex}”.`},opts(p,d,{cls:'txt'})),{type:'vowel',w});
    },
    example(){return {html:`<h3>🔤 Two letters, one sound</h3><p><b>sh</b> in 🚢 <b>sh</b>ip · <b>ch</b> in 🧀 <b>ch</b>eese · <b>th</b> in 👍 <b>th</b>umb</p><p>Vowel teams: <b>ai</b> in r<b>ai</b>n, <b>ee</b> in tr<b>ee</b>, <b>igh</b> in n<b>igh</b>t, <b>ou</b> in h<b>ou</b>se</p><p>💡 Say the word slowly and listen for the sound.</p>`};}};

  /* ---------------- 2. sight words / high-frequency spelling ---------------- */
  const SW=[ /* word, 3 wrong spellings, sentence (___), tricky part, level */
    ['said',['sed','siad','sayd'],'Mum ___ it was time for bed.','ai',0],['was',['wos','woz','waz'],'The dog ___ very muddy.','a',0],
    ['they',['thay','thei','tey'],'Mia and Sam said ___ were hungry.','ey',0],['come',['cum','kom','comm'],'Can you ___ to my party?','o',0],
    ['some',['sume','somm','soam'],'Can I have ___ juice, please?','o',0],['there',['thare','ther','thear'],'Put the box over ___.','ere',0],
    ['were',['wer','wur','whur'],'We ___ late for the bus.','ere',0],['have',['hav','haf','havv'],'I ___ a new bike.','ave',0],
    ['because',['becos','becuz','becaus'],'I wore a hat ___ it was sunny.','au',1],['friend',['frend','freind','frind'],'My best ___ is Leo.','ie',1],
    ['people',['peple','peeple','pepole'],'Lots of ___ came to the show.','eo',1],['where',['wher','whare','wair'],'Do you know ___ my hat is?','ere',1],
    ['could',['cud','coud','culd'],'I ___ see the moon last night.','oul',1],['would',['wud','woud','wuld'],'I ___ like a drink, please.','oul',1],
    ['water',['worter','wotter','watter'],'Fish swim in the ___.','a',1],['school',['skool','scool','shool'],'We walk to ___ each day.','ch',1],
    ['should',['shud','shoud','shild'],'You ___ wear a helmet on your bike.','oul',3],['does',['duz','dus','doez'],'Where ___ the cat sleep?','oe',3],
    ['once',['wons','wunce','onse'],'I went on a plane ___, when I was little.','o',2],['laugh',['laff','larf','lauf'],'Funny jokes make me ___.','augh',3],
    ['Wednesday',['Wensday','Wendsday','Wednsday'],'After Tuesday comes ___.','dn',3],['busy',['bizzy','bizy','buzy'],'The shops are very ___ today.','u',3],
    ['enough',['enuff','enogh','enouph'],'Have you had ___ to eat?','ough',3],['though',['tho','thow','thou'],'It was cold, ___ the sun was out.','ough',3],
    ['famous',['famus','fameous','famouse'],'The actor is very ___.','ou',3],['special',['speacial','speshal','specal'],'Today is a ___ day.','ci',3],
    ['straight',['strate','strait','straite'],'Draw a ___ line across the page.','aight',3],
    ['surprise',['suprise','surprize','serprise'],'The party was a big ___.','ur',3],
    ['favourite',['favorit','favrit','favourit'],'Blue is my ___ colour.','our',3],
    ['separate',['seperate','seprate','seperete'],'Please ___ the recycling.','a',3],
    ['through',['throo','thrugh','thur'],'We walked ___ the tunnel.','ough',3],
    ['thought',['thort','thoght','thougt'],'I ___ the answer was six.','ough',3],
    ['believe',['beleive','belive','belief'],'I ___ we can finish this.','ie',3],
    ['receive',['recieve','receve','riceive'],'Did you ___ my message?','ei',3],
    ['caught',['caut','caugt','cought'],'Sam ___ the ball with one hand.','augh',3],
    ['naughty',['norty','nauty','noughty'],'The ___ puppy chewed the shoe.','augh',3],
    ['height',['hight','heigth','hieth'],'What is the ___ of that tree?','eigh',3],
    ['library',['libary','librery','librey'],'We borrowed a book from the ___.','ra',3],
    ['knowledge',['nowledge','knowlege','knolledge'],'She has a lot of ___ about birds.','know',3],
    ['disappear',['dissappear','disapear','dissapear'],'The coins seemed to ___ in his hand.','pp',3],
    ['necessary',['neccessary','necesary','neccesary'],'A coat is ___ on a cold day.','ss',3],
    ['interesting',['intresting','intersting','interisting'],'That was an ___ science lesson.','e',3],
    ['different',['diffrent','differnt','diferent'],'Each snowflake looks ___.','e',3],
  ];
  const where=(w,p)=>{const i=w.indexOf(p);return i===0?'beginning':i+p.length>=w.length?'end':'middle';};
  const HP=[['there','The books are over ___.',['their',"they're"],'in that place',2],['their','The children packed ___ bags.',['there',"they're"],'belonging to them',2],
    ["they're",'I think ___ coming to the party.',['there','their'],'short for they are',2],['to','We walked ___ the park.',['too','two'],'towards a place',2],
    ['too','This bag is ___ heavy to lift.',['to','two'],'means more than enough',2],['two','Sam has ___ pet rabbits.',['to','too'],'the number',2],
    ['your','Is this ___ lunch box?',["you're",'yore'],'belonging to you',3],["you're",'I think ___ a great friend.',['your','yore'],'short for you are',3],
    ['hear','Can you ___ that bird singing?',['here','hair'],'to use your ears',3],['here','Please sit ___ next to me.',['hear','hair'],'in this place',3],
    ['knew','I ___ the answer already.',['new','gnu'],'past tense of know',3],['new','Mia got a ___ school bag.',['knew','gnu'],'not old',3],
    ['whose','___ bag is this on the hook?',["who's",'whoos'],'belonging to whom',3],
    ["who's",'___ coming to lunch today?',['whose','whos'],'short for who is',3],
    ['weather','The ___ was sunny all week.',['whether','wether'],'sun, rain or wind',3],
    ['whether',"I don't know ___ to laugh or cry.",['weather','wether'],'if one thing or another',3],
    ['passed','The bus ___ the school gate.',['past','passt'],'went by',3],
    ['past','It happened in the ___.',['passed','passt'],'time already gone',3],
    ['quiet','Please be ___ in the library.',['quite','quit'],'not noisy',3],
    ['quite','This puzzle is ___ tricky.',['quiet','quit'],'fairly or rather',3],
    ['allowed','We are not ___ to run in the hall.',['aloud','alouded'],'given permission',3],
    ['aloud','Please read the poem ___.',['allowed','alouded'],'out loud, so others can hear',3],
    ['peace','The garden was full of ___.',['piece','peice'],'calm, not fighting',3],
    ['piece','Can I have a ___ of cake?',['peace','peice'],'a part of something',3],
    ['break','Be careful not to ___ the glass.',['brake','braik'],'to smash or snap',3],
    ['brake','Press the ___ to stop the bike.',['break','braik'],'the part that stops a vehicle',3],
    ['which','___ path should we take?',['witch','wich'],'asking for a choice',3],
    ['witch','The story was about a kind ___.',['which','wich'],'a storybook character',3]];
  const sight={id:'sight',title:'Tricky Words',icon:'👀',dedupByText:true,code:'EN1-SPELL-01 · EN2-SPELL-01',
    blurb:'Tricky high-frequency spellings, plus Year 3–4 homophones in context (whose/who’s, weather/whether, past/passed).',
    subs:l=>l>=2?['pick','fill','homo']:['pick','pick','fill'],
    gen(H,l,sub){
      if(sub==='homo'){const [w,s,d,clue]=pickL(HP,l,4);const sen=s.replace('___','<span class="gap"></span>');
        return M(Object.assign({sub,prompt:'Which word fits the sentence?',vis:sent(sen),
          hint:'Read the whole sentence. Think what the gap must mean.',hint2:`Think about the meaning of the gap: this choice means “${clue}”.`,
          explain:J([`The sentence needs a word that means “${clue}”.`,`The right word is <b>${w}</b>.`,s.replace('___','<b>'+w+'</b>')]),
          why:`“${w}” fits because it means ${clue}.`},opts(w,d,{cls:'txt'})),{type:'homo',w});}
      const [w,bad,s,p]=pickL(SW,l,4);const sen=s.replace('___','<span class="gap"></span>');
      if(sub==='fill'){const i=w.indexOf(p);const q=spellE(p,{pre:`<span class="spw">${w.slice(0,i)}</span>`,post:`<span class="spw">${w.slice(i+p.length)}</span>`,extra:5});
        return M(Object.assign({sub,prompt:'Type the missing letters to finish the word.',vis:sent(sen),
          hint:'Read the sentence. Say the missing word, then think how it looks.',hint2:`Type ${p.length} letter${p.length>1?'s':''}. This is a word you see in lots of books.`,
          explain:J([`The word is <b>${w}</b>.`,`The tricky part is <b>${p}</b>.`,`Read it again: ${s.replace('___','<b>'+w+'</b>')}`]),why:`“${w}” has ${p} in the ${where(w,p)}. Try to picture it.`},q),{type:'sfill',w});}
      return M(Object.assign({sub:'pick',prompt:'Which word is spelt correctly?',vis:sent(sen),hint:'Look closely at each word. Picture how it looks in a book.',
        hint2:`The tricky part of this word is in the ${where(w,p)}.`,explain:J([`<b>${w}</b> is the right spelling.`,`Watch the tricky part: <b>${p}</b>.`]),
        why:`“${w}” is a tricky word: it has ${p} in the ${where(w,p)}.`},opts(w,bad,{cls:'txt'})),{type:'spick',w});},
    example(){return {html:`<h3>👀 Tricky words</h3><p>Some words don’t sound the way they look, so we learn them by sight.</p><p><b>s<u>ai</u>d</b> sounds like “sed” · <b>w<u>a</u>s</b> sounds like “woz”</p><p>💡 Look, say, cover, write, check.</p>`};}};

  /* ---------------- 3. nouns, verbs, adjectives ---------------- */
  const WC=[
    ['The {fluffy:a} {dog:n} {chased:v} a {red:a} {ball:n}.',0],['A {tiny:a} {frog:n} {jumped:v} into the {pond:n}.',0],['{Mum:n} {baked:v} a {yummy:a} {cake:n}.',0],
    ['The {big:a} {bus:n} {stopped:v} at the {school:n}.',0],['My {little:a} {sister:n} {sang:v} a {happy:a} {song:n}.',0],['The {hungry:a} {koala:n} {ate:v} some {leaves:n}.',0],
    ['Dad {washed:v} the {muddy:a} {car:n}.',1],['The {cold:a} {wind:n} {blew:v} my {hat:n} away.',1],['A {brown:a} {horse:n} {ran:v} across the {field:n}.',1],
    ['The {sleepy:a} {cat:n} {curled:v} up on the {mat:n}.',1],['{Sam:n} {kicked:v} the {soft:a} {ball:n}.',1],['Two {noisy:a} {birds:n} {sat:v} on the {fence:n}.',1],
    ['The {kind:a} {teacher:n} {read:v} a {funny:a} {book:n}.',1],['We {built:v} a {tall:a} {tower:n} with {blocks:n}.',1],['The {shiny:a} {fish:n} {swam:v} past the {rock:n}.',1],
    ['The {enormous:a} {whale:n} {splashed:v} its {gigantic:a} {tail:n}.',2],['{Grandpa:n} {planted:v} {bright:a} {flowers:n} in the {garden:n}.',2],
    ['A {gentle:a} {breeze:n} {rustled:v} the {dry:a} {grass:n}.',2],['The {curious:a} {scientist:n} {examined:v} a {rare:a} {fossil:n}.',2],
    ['The {grumpy:a} {pirate:n} {buried:v} his {golden:a} {treasure:n} under the {sand:n}.',3],
    ['After the {fierce:a} {storm:n}, the {brave:a} {crew:n} {repaired:v} the {ship:n}.',3],
    ['The {clever:a} {fox:n} {slipped:v} {silently:d} through the {dark:a} {forest:n}.',2],
    ['{Maya:n} {whispered:v} {quietly:d} so she would not wake the {sleepy:a} {baby:n}.',2],
    ['The {ancient:a} {castle:n} {stood:v} {proudly:d} above the {misty:a} {valley:n}.',3],
    ['{Sam:n} {answered:v} the {tricky:a} {question:n} {correctly:d} in {class:n}.',3],
    ['{Lina:n} {wrote:v} a {detailed:a} {report:n} after she {examined:v} the {fossil:n}.',3],
    ['The {tired:a} {hikers:n} {rested:v} {briefly:d} before the {steep:a} {climb:n}.',3],
    ['{Tom:n} {has:v} already {eaten:v} the {last:a} {apple:n}, so we {need:v} another {one:n}.',3],
    ['A {sudden:a} {crash:n} {startled:v} the {sleepy:a} {audience:n}.',3],
    ['The {empty:a} {bottle:n} {rolled:v} {slowly:d} across the {kitchen:n} {floor:n}.',3],
    ['The {cook:n} {tasted:v} the {spicy:a} {soup:n} {carefully:d}.',3],
    ['A {visit:n} from {Grandma:n} {cheered:v} the {sick:a} {boy:n}.',3],
    ['The {light:n} {sparkled:v} on the {calm:a} {lake:n}.',3],
    ['Because the {gate:n} was {stuck:a}, the {keeper:n} {tugged:v} {firmly:d} on the {rusty:a} {handle:n}.',3],
    ['After the {speech:n}, a {long:a} {silence:n} {filled:v} the {hall:n}.',3],
  ];
  const WCH={n:['A noun is a person, place or thing. Find the thing word.','Can you put “the” or “a” in front of it? Then it is a noun.'],
    v:['A verb is a doing word. What happens in the sentence?','Ask: what did someone or something do? That word is the verb.'],
    a:['An adjective is a describing word. It tells what something is like.','Find a thing word. Which word just before it describes it?'],
    d:['An adverb tells how, when or where something happens.','Many adverbs end with -ly and sit near the verb.']};
  function classQ(H,l,sub,data,topicId){
    for(let tries=0;tries<16;tries++){
      const src=pickL(data,l,1)[0];const {toks,plain}=parse(src);
      if(sub==='desc'){const pairs=toks.map((t,i)=>[t,toks[i+1]]).filter(([t,u])=>t.c==='a'&&u&&u.c==='n');if(!pairs.length)continue;const [a,n]=pick(pairs);
        const others=uniq(toks.filter(t=>t.c!=='a'&&t.c!=='p'&&t.w!==n.w&&t.w.length>1).map(t=>t.c?t.w:t.w.toLowerCase()));const d=shuffle(others).slice(0,3);
        return M(Object.assign({sub,prompt:`Which word <b>describes</b> the ${n.w}?`,vis:sent(plain),hint:`Find the word “${n.w}”. Look at the word just before it.`,hint2:'A describing word tells how something looks, feels or sounds.',
          explain:J([`What is the ${n.w} like? It is <b>${a.w}</b>.`,`“${a.w}” is an adjective: it describes the ${n.w}.`]),why:`“${a.w}” tells us what the ${n.w} is like.`},opts(a.w,d,{cls:'txt'})),{type:'desc',src});}
      let c=sub==='noun'?'n':sub==='verb'?'v':sub==='adv'?'d':'a';let cand=toks.filter(t=>t.c===c);if(!cand.length&&sub!=='adv'){c='a';cand=toks.filter(t=>t.c===c);}if(!cand.length)continue;const a=pick(cand);
      const others=uniq(toks.filter(t=>t.c&&t.c!=='p'&&t.c!==c).map(t=>t.w));
      const fill=uniq(toks.filter(t=>!t.c&&t.w.length>2&&!/^(the|a|an|my|his|her|its|our|their)$/i.test(t.w)).map(t=>t.w));
      const d=shuffle(others.concat(l>=1?[]:fill)).slice(0,3);const N=CN[c];
      return M(Object.assign({sub,prompt:`Which word is ${c==='a'||c==='d'?'an':'a'} <b>${N}</b>?`,vis:sent(plain),hint:WCH[c][0],hint2:WCH[c][1],
        explain:J([c==='n'?'A noun names a person, place or thing.':c==='v'?'A verb is a doing word.':c==='d'?'An adverb tells how, when or where something happens.':'An adjective describes a noun.',`<b>${a.w}</b> is ${c==='a'||c==='d'?'an':'a'} ${N}.`]),
        why:c==='n'?`“${a.w}” names a person, place or thing, so it is a noun.`:c==='v'?`“${a.w}” is what happens (a doing word), so it is a verb.`:c==='d'?`“${a.w}” tells how, when or where something happens, so it is an adverb.`:`“${a.w}” describes a thing, so it is an adjective.`},opts(a.w,d,{cls:'txt'})),{type:c,src});}
    throw new Error(sub||'classQ');}
  const CMP=[['big','bigger','biggest',0],['small','smaller','smallest',0],['tall','taller','tallest',0],['fast','faster','fastest',1],
    ['happy','happier','happiest',1],['funny','funnier','funniest',1],['hot','hotter','hottest',1],['sad','sadder','saddest',2],
    ['good','better','best',2],['bad','worse','worst',2],['careful','more careful','most careful',3],['beautiful','more beautiful','most beautiful',3],
    ['interesting','more interesting','most interesting',3],['far','further','furthest',3],['little','less','least',3]];
  const wordclass={id:'wordclass',title:'Nouns, Verbs and Adjectives',icon:'🏷️',dedupByText:true,code:'EN1-VOCAB-01 · EN1-CWT-01 → EN2-CWT-01',
    blurb:'Nouns, verbs, adjectives, adverbs, plus comparative and superlative forms.',
    subs:l=>l>=2?['noun','verb','adj','adv','desc','comp','super']:l>=1?['noun','verb','adj','desc','comp','super']:['noun','verb','adj','desc'],
    gen(H,l,sub){
      if(sub==='comp'||sub==='super'){const [base,cmp,sup]=pickL(CMP,l,3);const a=sub==='comp'?cmp:sup;const ask=sub==='comp'?`Which word is the <b>comparative</b> of “${base}”?`:`Which word is the <b>superlative</b> of “${base}”?`;
        const d=sub==='comp'?uniq([sup,base,base+'est',base+'er']).filter(x=>x!==a):uniq([cmp,base,base+'er',base+'est']).filter(x=>x!==a);
        return M(Object.assign({sub,prompt:ask,vis:sent(`The word family of <b>${base}</b>`),
          hint:sub==='comp'?'Comparative means more of the quality. Often ends with -er, or uses more.':'Superlative means the most. Often ends with -est, or uses most.',
          hint2:sub==='comp'?`Compare two things: which form of “${base}” fits?`:`Compare three or more: which form of “${base}” is the top?`,
          explain:J([sub==='comp'?`More ${base} → <b>${cmp}</b>.`:`The most ${base} → <b>${sup}</b>.`,`Base word: ${base}.`]),
          why:sub==='comp'?`“${cmp}” means more ${base}.`:`“${sup}” means the most ${base}.`},opts(a,d,{cls:'txt'})),{type:sub});}
      return classQ(H,l,sub,WC,'wordclass');},
    example(){return {html:`<h3>🏷️ Word jobs</h3>${sent('The <b style="color:#ca8a04">fluffy</b> <b style="color:#2563eb">dog</b> <b style="color:#16a34a">chased</b> a ball.')}<p><b style="color:#2563eb">Noun</b> · <b style="color:#16a34a">Verb</b> · <b style="color:#ca8a04">Adjective</b></p><p>Compare: big → <b>bigger</b> → <b>biggest</b> · good → <b>better</b> → <b>best</b></p>`};}};

  /* ---------------- 4. capital letters, full stops, question marks ---------------- */
  const ENDQ=['Where is my lunch box','Can we go to the beach','What time is it','Do you like pizza','How many legs does a spider have','Who ate the last apple','Why is the sky blue','Are you coming to my party','Is it raining outside','When does school finish'];
  const ENDS=['The dog is asleep','I like to swim','We have art on Monday','My bike is blue','The sun is hot today','Kangaroos can hop very fast','Grandma made soup for lunch','The library has lots of books'];
  const ENDS2=['I wonder where my hat is','Mum asked who ate the cake','I know why the sky is blue','Dad asked when we should leave','I wonder how frogs swim','She told me where the keys are','I know who left the gate open'];
  const ENDE=['Watch out','Wow, what a huge wave','Help, the bath is overflowing','Hooray, we won the game','Ouch, that hurt'];
  const CAPS=[['We went to the park with {sam}.','name'],['On {monday} we have sport.','day'],['Mum and {i} made pancakes.','i'],['We live in {sydney}.','place'],
    ['My friend {mia} has a puppy.','name'],['In {december} it is very hot.','month'],['We drove to {brisbane} for the holidays.','place'],['Next {friday} is my birthday.','day'],
    ['Dad and {i} went fishing.','i'],['Our dog {max} loves the beach.','name'],['My cousin lives in {perth}.','place'],['It snowed in {july}.','month']];
  const CORR=[['we went to {sydney} on the train','.'],['did {mia} bring her lunch','?'],['on {saturday} we played soccer','.'],['can {leo} come to my house','?'],
    ['in {july} it gets cold','.'],['my dog {rex} can catch a ball','.'],['is {ava} in your class','?'],['we saw koalas in {melbourne}','.']];
  const capW=w=>w.charAt(0).toUpperCase()+w.slice(1);
  const PM={'.':'<span class="pmark">.</span> full stop','?':'<span class="pmark">?</span> question mark','!':'<span class="pmark">!</span> exclamation mark'};
  const LISTQ=[
    ['I packed a book, a drink and a sandwich.','I packed a book a drink and a sandwich.','I packed, a book, a drink and a sandwich.','I packed a book a drink, and, a sandwich.'],
    ['We saw kangaroos, emus and koalas.','We saw kangaroos emus and koalas.','We saw, kangaroos, emus and koalas.','We saw kangaroos emus, and, koalas.'],
    ['Mia bought apples, pears and plums.','Mia bought apples pears and plums.','Mia bought, apples, pears and plums.','Mia bought apples pears, and, plums.'],
    ['The flag is red, white and blue.','The flag is red white and blue.','The flag is, red, white and blue.','The flag is red white, and, blue.'],
    ['Pack your hat, jumper, lunch and water.','Pack your hat jumper, lunch and water.','Pack your hat, jumper lunch and water.','Pack, your hat, jumper, lunch and water.']];
  const SPEEQ=[
    ['Sam said, “I am ready.”','Sam said I am ready.','“Sam said, I am ready.','Sam said, I am ready”'],
    ['“Look at that wave!” cried Leo.','Look at that wave! cried Leo.','“Look at that wave! cried Leo.','Look at that wave!” cried Leo.'],
    ['Mum asked, “Have you washed your hands?”','Mum asked, Have you washed your hands?','Mum asked “Have you washed your hands?','“Mum asked, Have you washed your hands?”'],
    ['“When do we leave?” asked Dad.','“When do we leave,” asked Dad?','When do we leave?” asked Dad.','“when do we leave?” asked Dad.'],
    ['“Please wait here,” whispered Mum.','“Please wait here” whispered Mum.','Please wait here,” whispered Mum.','“Please wait here,” Whispered Mum.'],
    ['Dad said, “Bring your jumper.”','Dad said “Bring your jumper.”','Dad said, “bring your jumper.”','Dad said, “Bring your jumper”.']];
  const punct={id:'punct',title:'Capitals and Full Stops',icon:'✏️',dedupByText:true,code:'EN1-CWT-01 · EN2-CWT-01',
    blurb:'Capitals, end marks, and Year 3 stretch: commas in lists and speech marks.',
    subs:l=>l>=2?['end','cap','correct','list','speech']:['end','end','cap','correct'],
    gen(H,l,sub){
      if(sub==='list'){const row=pick(LISTQ);const [right,...d]=row;
        return M(Object.assign({sub,prompt:'Which sentence uses <b>commas in a list</b> correctly?',vis:'',
          hint:'A list of three or more things needs commas between the items.',hint2:'Place a comma after each item except the last one.',
          explain:J([`<b>${right}</b>`,`Use commas to separate the things in the list.`]),why:'Commas separate the items in a list of three or more.'},opts(right,d,{cls:'sent'})),{type:'list'});}
      if(sub==='speech'){const row=pick(SPEEQ);const [right,...d]=row;
        return M(Object.assign({sub,prompt:'Which sentence uses <b>speech marks</b> correctly?',vis:'',
          hint:'Speech marks go around the exact words a person says.',hint2:'A comma often comes just before the spoken words begin.',
          explain:J([`<b>${right}</b>`,`The marks wrap only the spoken words.`]),why:'Speech marks wrap the exact words that were spoken.'},opts(right,d,{cls:'sent'})),{type:'speech'});}
      if(sub==='cap'){const [s,kind]=pick(CAPS);const m=s.match(/\{(\w+)\}/)[1];const shown=s.replace(/\{(\w+)\}/,'$1');const ws=shown.replace(/[.]/g,'').split(' ').slice(1).filter(w=>w!==m&&w.length>1);
        const a=m;const d=shuffle(uniq(ws)).slice(0,3);const why={name:'is a person’s or pet’s name',day:'is a day of the week',month:'is a month',place:'is the name of a place',i:'means “I”, which is always a capital'}[kind];
        return M(Object.assign({sub,prompt:'Which word needs a <b>capital letter</b>?',vis:sent(shown),hint:'Names of people, places, days and months need a capital letter.',
          hint2:kind==='i'?'When you talk about yourself, that little word is always a capital.':'Which word is a special name for one person, place or time?',
          explain:J([`“${m}” ${why}.`,`Write it as <b>${m==='i'?'I':capW(m)}</b>.`]),why:`“${m}” ${why}, so it needs a capital.`},opts(a,d,{cls:'txt'})),{type:'cap'});}
      if(sub==='correct'){const [s,mk]=pick(CORR);const right=capW(s.replace(/\{(\w+)\}/,(x,w)=>capW(w)))+mk;
        const w1=s.replace(/\{(\w+)\}/,(x,w)=>capW(w))+mk,w2=capW(s.replace(/\{(\w+)\}/,'$1'))+mk,w3=capW(s.replace(/\{(\w+)\}/,(x,w)=>capW(w)))+(mk==='?'?'.':'?');
        return M(Object.assign({sub,prompt:'Which sentence is written <b>correctly</b>?',vis:'',hint:'Check three things: the first letter, any names, and the end mark.',
          hint2:'A sentence starts with a capital. Names need capitals too. Is it asking?',explain:J(['Capital letter at the start.','Capital letter for the name.',mk==='?'?'It asks something, so it ends with ?':'It tells something, so it ends with a full stop.',`<b>${right}</b>`]),
          why:`It needs a capital at the start, a capital for the name, and ${mk==='?'?'a question mark':'a full stop'}.`},opts(right,[w1,w2,w3],{cls:'sent'})),{type:'correct'});}
      const pool=[...ENDQ.map(s=>[s,'?']),...ENDS.map(s=>[s,'.'])].concat(l>=2?ENDE.map(s=>[s,'!']).concat(ENDS2.map(s=>[s,'.'])):[]);const [s,mk]=pick(pool);
      const list=l>=2?['.','?','!']:['.','?'];
      return M(Object.assign({sub:'end',prompt:'Which mark goes at the <b>end</b>?',vis:sent(`${s}<span class="gap"></span>`),hint:'Read it out loud. Is it asking something, or telling something?',
        hint2:l>=2?'Asking needs one mark. Telling needs another. A strong feeling or warning needs a third.':'Questions often start with who, what, where, why, how, can or do.',
        explain:J([mk==='?'?'It asks something, so it is a question.':mk==='!'?'It shows a strong feeling or a warning.':'It tells something, so it is a statement.',`It ends with <b>${mk}</b>`]),
        why:mk==='?'?'It is asking something, so it needs a question mark.':mk==='!'?'It shows a strong feeling, so it needs an exclamation mark.':ENDS2.includes(s)?'It tells us about a question, but it does not ask one. So: full stop.':'It is telling something, so it needs a full stop.'},fixedOpts(list.map(x=>PM[x]),list.indexOf(mk),'txt')),{type:'end'});
    },
    example(){return {html:`<h3>✏️ Sentence rules</h3><p>1️⃣ Start with a <b>capital letter</b>.<br>2️⃣ Names of people, places, days and months get capitals too (<b>M</b>ia, <b>S</b>ydney, <b>M</b>onday).<br>3️⃣ End with a <b>.</b> for telling, or a <b>?</b> for asking.</p>${sent('<b>C</b>an <b>L</b>eo come to my house<b>?</b>')}`};}};

  /* ---------------- 5. compound words ---------------- */
  const CW=[['sun','flower','🌻',0],['foot','ball','⚽',0],['rain','bow','🌈',0],['cup','cake','🧁',0],['star','fish','⭐',0],['butter','fly','🦋',0],['tooth','brush','🪥',0],
    ['pop','corn','🍿',0],['snow','man','☃️',0],['bed','room','🛏️',0],['play','ground','🛝',1],['sand','castle','🏰',1],['lady','bird','🐞',1],['jelly','fish','🪼',1],
    ['back','pack','🎒',1],['door','bell','🔔',1],['rain','coat','🧥',1],['water','melon','🍉',1],['sea','shell','🐚',1],['grand','mother','👵',2],['every','one','👨‍👩‍👧',2],
    ['some','thing','❓',2],['light','house','🗼',2],['tea','pot','🫖',2],['hand','bag','👜',2],['pan','cake','🥞',2],['wheel','chair','🧑‍🦽',3],['finger','nail','💅',3],['earth','quake','🌍',3],['note','book','📓',3],['head','light','💡',3],['shop','keeper','🛍️',3]];
  const REALC=new Set(CW.map(x=>x[0]+x[1]).concat('sunshine snowball snowflake starlight raindrop footprint bathroom bedtime playtime handshake backyard doorway cupboard sandpit rainfall seaweed toothpaste firefly sunset sunrise someone anyone everything nothing somewhere everywhere nowhere anything sandbox handball basketball ballroom sunglasses mailbox snowman football footpath teacup teaspoon housework doormat lighthouse playroom bedroom backpack fishbowl starship sunburn sandman seaside seahorse handstand handmade backbone'.split(' ')));
  const NONC=['pencil','monkey','garden','yellow','rabbit','kitten','tomato','dinner','turtle','spider','jacket','dragon','sister','purple','number','orange','lemon','tiger','zebra','planet'];
  const NONC2=['carpet','window','magnet','pillow','helmet','basket','market','planet','garden','jacket'];
  const compound={id:'compound',title:'Compound Words',icon:'🧩',dedupByText:true,code:'EN1-SPELL-01 · EN1-VOCAB-01',
    blurb:'Two small words join to make one new word: sun + flower = sunflower.',
    subs:l=>['join','which','split'],
    gen(H,l,sub){const [a,b,e]=pickL(CW,l,3),w=a+b;
      if(sub==='which'){const d=shuffle((l>=2?NONC2:NONC).slice()).slice(0,3);
        return M(Object.assign({sub,prompt:'Which one is a <b>compound word</b>?',vis:'',hint:'A compound word is two small words joined to make one word.',hint2:'Cover part of each word. Can you see two real words?',
          explain:J([`<b>${w}</b> = ${a} + ${b}.`,'The other words cannot be split into two real words.']),why:`“${w}” is made of two words: ${a} + ${b}.`},opts(w,d,{cls:'txt'})),{type:'which'});}
      if(sub==='split'){const bad=[[w.slice(0,a.length-1),w.slice(a.length-1)],[w.slice(0,a.length+1),w.slice(a.length+1)],[w.slice(0,2),w.slice(2)]].filter(p=>p[0]!==a&&p[0].length>0&&p[1].length>0).map(p=>p.join(' + '));
        return M(Object.assign({sub,prompt:`Which two words make <b>${w}</b>?`,vis:emo(e),hint:'Find a small word at the start that you already know.',hint2:'The other part should be a real word too. Check both parts.',
          explain:J([`${w} = <b>${a} + ${b}</b>.`,'Both parts are real words.']),why:`“${w}” splits into two real words: ${a} + ${b}.`},opts(`${a} + ${b}`,uniq(bad).concat([`${a}s + ${b}`]),{cls:'txt'})),{type:'split'});}
      const others=shuffle(CW.filter(x=>x[1]!==b).map(x=>x[1])).filter(x=>!REALC.has(a+x));const d=uniq([b+a].concat(others.slice(0,4).map(x=>a+x))).filter(x=>x!==w).slice(0,3);
      return M(Object.assign({sub:'join',prompt:`<b>${a}</b> + <b>${b}</b> = ?`,vis:emo(e),hint:'Put the first word, then the second word straight after it. No space.',hint2:'Read the two words together quickly. Which choice matches, in the same order?',
        explain:J([`${a} + ${b} = <b>${w}</b>.`,'Keep the words in the same order.']),why:`Join “${a}” then “${b}” with no space: ${w}.`},opts(w,d,{cls:'txt'})),{type:'join'});},
    example(){return {html:`<h3>🧩 Compound words</h3><p>Two small words join to make a new word:</p><p style="font-size:1.3rem">☀️ sun + 🌸 flower = 🌻 <b>sunflower</b><br>🦶 foot + ⚽ ball = <b>football</b></p>`};}};

  /* ---------------- 6. plurals ---------------- */
  const PL=[['cat','s',0],['dog','s',0],['frog','s',0],['book','s',0],['tree','s',0],['hand','s',0],['apple','s',0],['shoe','s',1],['kite','s',1],
    ['fox','es',0],['box','es',0],['bus','es',0],['dish','es',0],['brush','es',0],['watch','es',1],['glass','es',1],['dress','es',1],['bench','es',1],['lunch','es',1],['beach','es',2],['wish','es',2],
    ['baby','ies',2],['puppy','ies',2],['party','ies',2],['berry','ies',2],['lady','ies',3],['story','ies',3],['city','ies',3],['pony','ies',3],
    ['child','irr',2,'children'],['mouse','irr',2,'mice'],['tooth','irr',2,'teeth'],['foot','irr',3,'feet'],['goose','irr',3,'geese'],['man','irr',3,'men'],['woman','irr',3,'women'],['sheep','irr',3,'sheep'],
    ['leaf','ves',2],['wolf','ves',2],['knife','ves',3],['life','ves',3],['thief','ves',3],['calf','ves',3],['loaf','ves',3],['person','irr',3,'people']];
  const plOf=(w,k,irr)=>k==='irr'?irr:k==='ies'?w.slice(0,-1)+'ies':k==='ves'?w.replace(/fe?$/,'ves'):w+k;
  const plH2=(w,k)=>k==='irr'?'This plural changes the word. Picture how it looks in a book.':k==='ies'?'Does it end in a consonant then y? Change the y to i first.':k==='ves'?'Many words ending in f or fe change that ending to ves.':'Words ending in s, x, sh, ch or ss add -es. Most words add -s.';
  const plurals={id:'plurals',title:'More Than One (-s, -es)',icon:'🍎',dedupByText:true,code:'EN1-SPELL-01 · EN2-SPELL-01',
    blurb:'Plurals: -s/-es, y→ies, f→ves, and irregular forms (child → children, mouse → mice).',
    subs:l=>l>=1?['pick','pick','type']:['pick','pick'],
    gen(H,l,sub){const row=pickL(PL,l,2);const w=row[0],k=row[1],irr=row[3];const a=plOf(w,k,irr);
      const why=k==='s'?`Most words just add -s: ${a}.`:k==='es'?`“${w}” ends in ${w.match(/(sh|ch|ss|s|x)$/)[1]}, so add -es: ${a}.`:k==='irr'?`“${w}” is an irregular plural: one ${w} → two ${a}.`:k==='ves'?`“${w}” ends in f or fe: change that ending to ves (${a}).`:`“${w}” ends in a consonant then y: change y to i and add -es.`;
      const ex=J([k==='s'?'Most words add <b>-s</b>.':k==='es'?'Words ending in s, x, sh, ch or ss add <b>-es</b>. You can hear the extra beat.':k==='irr'?`“${w}” does not just add -s. Learn the new plural form.`:k==='ves'?'Words ending in <b>f</b> or <b>fe</b> often change to <b>ves</b>.':'Consonant + y: change the <b>y</b> to <b>i</b>, then add <b>-es</b>.',`one ${w} → two <b>${a}</b>`]);
      if(sub==='type'){const q=spellE(a,{extra:4});
        return M(Object.assign({sub,prompt:`one ${w}, two …? Type the word.`,vis:sent(`one <b>${w}</b> → two <span class="gap"></span>`),hint:k==='irr'?'This one changes spelling. Say the plural you know from books.':'Say it out loud. Do you hear an extra beat at the end?',hint2:plH2(w,k),explain:ex,why},q),{type:'ptype',k});}
      const d=k==='irr'?uniq([w+'s',w+'es',w+'ies',a===w?w+'s':w]).filter(x=>x!==a):k==='ves'?uniq([w+'s',w+'es',w+'ves',w.replace(/fe?$/,'fs')]).filter(x=>x!==a):uniq([w+'s',w+'es',w.endsWith('y')?w+'s':w+'ss',w.endsWith('y')?w.slice(0,-1)+'es':w+'z']).filter(x=>x!==a);
      return M(Object.assign({sub:'pick',prompt:`one ${w}, two …?`,vis:sent(`one <b>${w}</b> → two <span class="gap"></span>`),hint:k==='irr'?'This one changes spelling. Say the plural you know from books.':'Say it out loud. Do you hear an extra beat at the end?',hint2:plH2(w,k),explain:ex,why},opts(a,d,{n:3,cls:'txt'})),{type:'ppick',k});},
    example(){return {html:`<h3>🍎 More than one</h3><p>Most words add <b>-s</b>: cat → cat<b>s</b></p><p>Words ending in <b>s, x, sh, ch, ss</b> add <b>-es</b>: fox → fox<b>es</b></p><p>Some change: child → <b>children</b>, mouse → <b>mice</b></p>`};}};

  /* ---------------- 7. past tense -ed ---------------- */
  const PT=[['jump','r',0],['play','r',0],['help','r',0],['kick','r',0],['walk','r',0],['look','r',0],['cook','r',0],['paint','r',0],['pull','r',0],['push','r',0],['wash','r',1],['climb','r',1],['open','r',1],
    ['bake','e',1],['smile','e',1],['dance','e',2],['skate','e',2],['wave','e',2],['like','e',2],['clap','d',2],['stop','d',2],['skip','d',2],['drop','d',2],['hug','d',2],['grab','d',3],['plan','d',3],
    ['cry','y',2],['carry','y',2],['tidy','y',3],['try','y',3],
    ['go','irr',2,'went'],['see','irr',2,'saw'],['run','irr',2,'ran'],['eat','irr',2,'ate'],['come','irr',2,'came'],['give','irr',3,'gave'],['take','irr',3,'took'],['make','irr',3,'made'],['find','irr',3,'found'],['think','irr',3,'thought'],
    ['buy','irr',3,'bought'],['catch','irr',3,'caught'],['bring','irr',3,'brought'],['write','irr',3,'wrote'],['hide','irr',3,'hid'],['begin','irr',3,'began'],
    ['fly','irr',3,'flew'],['grow','irr',3,'grew'],['know','irr',3,'knew'],['speak','irr',3,'spoke'],['swim','irr',3,'swam'],['break','irr',3,'broke'],['choose','irr',3,'chose'],['wear','irr',3,'wore']];
  const TENSE=[['Yesterday the children ran to the gate.','past'],['The children run to the gate every morning.','present'],
    ['Sam wrote a letter to his gran last night.','past'],['Sam writes a letter to his gran every week.','present'],
    ['The birds flew over the lake at dawn.','past'],['The birds fly over the lake at dawn.','present'],
    ['Mia caught the ball with both hands.','past'],['Mia catches the ball with both hands.','present'],
    ['We began the project after lunch.','past'],['We begin the project after lunch.','present']];
  const pastOf=(v,k,irr)=>k==='irr'?irr:k==='e'?v+'d':k==='d'?v+v.slice(-1)+'ed':k==='y'?v.slice(0,-1)+'ied':v+'ed';
  const ptD=(v,k,a)=>k==='irr'?uniq([v+'ed',v+'d',v+'t',v+'n']).filter(x=>x!==a):k==='e'?[v+'ed',v+'t',v.slice(0,-1)+'t']:k==='d'?[v+'ed',v+'t',v+v.slice(-1)+'d']:k==='y'?[v+'ed',v+'d',v.slice(0,-1)+'yed']:[v+'t',v+'d',v+v.slice(-1)+'ed'];
  const PTH2={r:'Most doing words just add -ed to the end. Nothing else changes.',e:'This word already ends in e. You only need one more letter.',d:'Short word, one vowel, one last consonant? Double that last letter first.',y:'Consonant then y? Change the y to i, then add the ending.',irr:'This yesterday word changes spelling. Picture the word you know from books.'};
  const PTW={r:v=>`Most doing words just add -ed: ${pastOf(v,'r')}.`,e:v=>`“${v}” already ends in e, so just add -d.`,d:v=>`Short word with one vowel: double the last letter, then add -ed.`,y:v=>`Consonant then y: change y to i, then add -ed.`,irr:(v,a)=>`“${v}” is irregular: yesterday you say “${a}”.`};
  const past={id:'past',title:'Yesterday Words (-ed)',icon:'⏪',dedupByText:true,code:'EN1-SPELL-01 · EN2-SPELL-01',
    blurb:'Past tense: -ed suffix rules, irregular verbs, and telling past from present tense.',
    subs:l=>l>=2?['pick','type','tense']:l>=1?['pick','pick','type']:['pick','pick'],
    gen(H,l,sub){
      if(sub==='tense'){const pastS=TENSE.filter(x=>x[1]==='past'),presS=TENSE.filter(x=>x[1]==='present');const wantP=chance(0.6);const a=pick(wantP?pastS:presS)[0];const d=shuffle((wantP?presS:pastS).map(x=>x[0])).slice(0,3);
        return M(Object.assign({sub,prompt:wantP?'Which sentence is written in the <b>past tense</b>?':'Which sentence is written in the <b>present tense</b>?',vis:'',
          hint:wantP?'Past tense is for something that already happened.':'Present tense is for something that happens now or often.',
          hint2:wantP?'Look at the verb. Has the action already finished?':'Look at the verb. Does this happen now, or often?',
          explain:J([wantP?'Past tense is for an action that already happened.':'Present tense is for an action that happens now or often.',`<b>${a}</b>`]),
          why:wantP?'The verb shows the action already happened.':'The verb shows the action happens now or often.'},opts(a,d,{cls:'sent'})),{type:'tense'});}
      const row=pickL(PT,l,2);const v=row[0],k=row[1],irr=row[3];const a=pastOf(v,k,irr);const vis=sent(`Today I <b>${v}</b>. Yesterday I <span class="gap"></span>.`);
      const ex=J(['Yesterday means it already happened, so we use the past tense.',k==='r'?'Add <b>-ed</b>.':k==='e'?'It ends in <b>e</b>, so just add <b>-d</b>.':k==='d'?'Double the last letter, then add <b>-ed</b>.':k==='irr'?`“${v}” changes to a new word.`:'Change <b>y</b> to <b>i</b>, then add <b>-ed</b>.',`${v} → <b>${a}</b>`]);
      const hint=k==='irr'?'Yesterday means it already happened. This word changes its spelling.':'Yesterday means it already happened. Add the past tense ending to the word.';
      const why=typeof PTW[k]==='function'&&k==='irr'?PTW.irr(v,a):PTW[k](v);
      if(sub==='type'){const q=spellE(a,{extra:3});return M(Object.assign({sub,prompt:'Type the yesterday word.',vis,hint,hint2:PTH2[k],explain:ex,why},q),{type:'ttype',k});}
      return M(Object.assign({sub:'pick',prompt:'Which word finishes the sentence?',vis,hint,hint2:PTH2[k],explain:ex,why},opts(a,ptD(v,k,a),{cls:'txt'})),{type:'tpick',k});},
    example(){return {html:`<h3>⏪ Yesterday words</h3><p>Many doing words add <b>-ed</b>: jump → jump<b>ed</b></p><p>Some change: go → <b>went</b>, see → <b>saw</b>, run → <b>ran</b></p>`};}};

  /* ---------------- 8. synonyms and antonyms ---------------- */
  const SYN=[['big','large',['tiny','slow','wet'],0],['small','little',['huge','loud','fast'],0],['happy','glad',['sad','cross','cold'],0],['fast','quick',['slow','soft','old'],0],
    ['shut','close',['open','push','give'],0],['shout','yell',['whisper','sit','listen'],0],['start','begin',['finish','sleep','lose'],0],['smile','grin',['frown','cry','walk'],0],
    ['cold','chilly',['hot','sunny','dry'],1],['scared','afraid',['brave','happy','hungry'],1],['tired','sleepy',['awake','lively','noisy'],1],['angry','cross',['calm','glad','kind'],1],
    ['laugh','giggle',['cry','frown','yawn'],1],['huge','enormous',['tiny','short','thin'],2],['quiet','silent',['noisy','bright','fast'],2],['hurry','rush',['wait','dawdle','stop'],2],
    ['brave','bold',['scared','shy','lazy'],2],['damp','wet',['dry','warm','rough'],3],['gaze','stare',['blink','shut','sleep'],3],
    ['vanish','disappear',['appear','arrive','gather'],3],['glance','peek',['stare','shout','grab'],3],['scarce','rare',['common','plenty','usual'],3],['clever','intelligent',['silly','clumsy','slow'],3],
    ['furious','enraged',['annoyed','cross','upset'],3],['rapid','swift',['sudden','busy','early'],3],['precious','valuable',['pretty','shiny','heavy'],3],
    ['cautious','careful',['fearful','slow','quiet'],3],['ancient','very old',['elderly','historic','used'],3],
    ['reluctant','unwilling',['lazy','tired','shy'],3],['astonished','amazed',['confused','worried','curious'],3],
    ['ordinary','usual',['special','famous','perfect'],3],['certain','sure',['lucky','brave','honest'],3]];
  const ANT=[['big','small',['large','huge','tall'],0],['hot','cold',['warm','sunny','boiling'],0],['up','down',['high','over','top'],0],['happy','sad',['glad','cheerful','jolly'],0],
    ['fast','slow',['quick','rapid','speedy'],0],['wet','dry',['damp','soggy','moist'],0],['full','empty',['packed','stuffed','heavy'],0],['old','new',['ancient','aged','grey'],0],
    ['day','night',['morning','sun','week'],0],['loud','quiet',['noisy','booming','big'],0],['push','pull',['shove','press','move'],1],['early','late',['soon','first','quick'],1],
    ['win','lose',['beat','score','play'],1],['float','sink',['swim','drift','bob'],1],['top','bottom',['peak','up','high'],1],['smooth','rough',['flat','silky','soft'],2],
    ['shallow','deep',['low','flat','thin'],2],['always','never',['often','forever','every'],2],['arrive','leave',['come','reach','enter'],3],['ancient','modern',['old','dusty','huge'],3],
    ['scarce','plentiful',['rare','few','limited'],3],['generous','selfish',['kind','giving','helpful'],3],
    ['brave','cowardly',['careful','quiet','calm'],3],['expand','shrink',['grow','stretch','spread'],3],['victory','defeat',['prize','score','game'],3],
    ['reluctant','eager',['afraid','tired','lazy'],3],['ordinary','extraordinary',['plain','simple','usual'],3],
    ['certain','uncertain',['careful','honest','ready'],3]];
  const synant={id:'synant',title:'Same and Opposite',icon:'🔁',dedupByText:true,code:'EN1-VOCAB-01 · EN2-VOCAB-01',
    blurb:'Synonyms (same meaning: big → large) and antonyms (opposites: big → small).',
    subs:l=>['syn','ant'],
    gen(H,l,sub){const L=sub==='ant'?ANT:SYN;const [w,a,d]=pickL(L,l,3);
      return M(Object.assign({sub,prompt:sub==='ant'?`Which word is the <b>opposite</b> of “${w}”?`:`Which word means the <b>same</b> as “${w}”?`,vis:'',
        hint:sub==='ant'?`An antonym means the opposite. Think of the other end, like ${['up','down'].includes(w)||['up','down'].includes(a)?'in and out':'up and down'}.`:'A synonym means the same, or nearly the same. Try it in a sentence.',
        hint2:sub==='ant'?'Put “not” in front of the word. Which choice means that?':'Swap each choice into a sentence. Does it still mean the same thing?',
        explain:J(sub==='ant'?[`The opposite of “${w}” is <b>${a}</b>.`,`“${w}” and “${a}” are at opposite ends.`]:[`“${w}” and <b>${a}</b> mean the same.`,`Swap “${a}” in for “${w}”: the meaning stays nearly the same.`]),why:sub==='ant'?`“${a}” is the opposite of “${w}”.`:`“${a}” means nearly the same as “${w}”.`},opts(a,d,{cls:'txt'})),{type:sub});},
    example(){return {html:`<h3>🔁 Same and opposite</h3><p><b>Synonyms</b> mean the same: big → large, happy → glad</p><p><b>Antonyms</b> are opposites: big → small, hot → cold</p>`};}};

  /* ---------------- 9. joining words: and, but, because, so ---------------- */
  const CJ=[['I have a cat ___ a dog.','and',0],['We ate pizza ___ drank juice.','and',0],['Mia can swim ___ ride a bike.','and',0],['I brushed my teeth ___ went to bed.','and',1],
    ['I wanted to play outside ___ it was raining.','but',0],['The cake looked yummy ___ it tasted bad.','but',0],['Leo ran fast ___ he did not win.','but',1],['I like apples ___ I do not like pears.','but',1],
    ['I put on my coat ___ it was cold.','because',0],['The baby cried ___ she was hungry.','because',0],['We went inside ___ it started to rain.','because',1],['I am tired ___ I stayed up late.','because',1],
    ['It was cold ___ I put on my coat.','so',0],['I was hungry ___ I ate an apple.','so',0],['The dog was muddy ___ we gave it a bath.','so',1],['It started to rain ___ we went inside.','so',1],
    ['The shop was shut ___ we went home.','so',2],['I could not find my hat ___ I looked everywhere.','but',2],['Our class clapped ___ the show was great.','because',2],
    ['We stayed inside ___ the storm passed.','until',2],['I will come ___ I finish my homework.','when',2],['Take a jumper ___ it gets cold later.','if',2],
    ['___ it was raining, the match still went ahead.','Although',3],['She read a book ___ she waited for the bus.','while',3],['You cannot go out ___ you pack your bag.','unless',3],
    ['We will start lunch ___ everyone is sitting down.','when',3],['___ you heat ice, it turns into water.','If',3],
    ['The path was muddy, ___ we still kept walking.','yet',3],['I have lived here ___ I was five.','since',3],
    ['Brush your teeth ___ you go to bed.','before',3],['We went straight home ___ the match ended.','after',3],
    ['___ the hill was steep, they kept climbing.','Even though',3],
    ['We packed extra water ___ the walk was long.','because',3],
    ['The museum was busy, ___ the children stayed close to Dad.','so',3],
    ['I would have been late, ___ the bus came early.','but',3]];
  const CJD={and:['but','because','so'],but:['so','because','although'],because:['so','but','when'],so:['because','but','if'],
    when:['because','if','while'],if:['because','when','unless'],while:['because','when','and'],until:['when','because','so'],unless:['if','because','until'],Although:['Because','So','But'],If:['When','Because','Although'],
    yet:['but','so','because'],since:['when','because','until'],before:['after','until','when'],after:['before','until','when'],'Even though':['Because','Although','If']};
  const CJH={and:'Both parts tell similar news. Pick the word that adds more.',but:'The second part is a surprise. Pick the word that shows a change.',because:'The second part gives a reason. Pick the word that explains why.',so:'The second part is what happened next, as a result.',
    when:'This joining word tells the time that something happens.',if:'This joining word shows a possible condition or chance.',while:'Two things are happening at the same time.',until:'Something keeps going up to a certain time.',unless:'The second part is the condition that must be true.',Although:'The second part is a surprise after the first part.',If:'The first part is the condition for what follows.',
    yet:'The second part is a contrast. Pick the joining word for that.',since:'This joining word can tell when something started in the past.',
    before:'This joining word shows one thing happens first in time.',after:'This joining word shows one thing happens later in time.','Even though':'The second part is a surprise after the first part.'};
  const CJW={and:'“and” adds more news.',but:'“but” shows a change or surprise.',because:'“because” gives a reason (why).',so:'“so” tells what happened as a result.',
    when:'“when” tells the time something happens.',if:'“if” shows a condition.',while:'“while” means at the same time.',until:'“until” means up to that time.',unless:'“unless” means except if.',Although:'“Although” shows a contrast or surprise.',If:'“If” shows a condition for what follows.',
    yet:'“yet” shows a contrast, like “but”.',since:'“since” tells when something began.',before:'“before” means earlier in time.',after:'“after” means later in time.','Even though':'“Even though” shows a contrast or surprise.'};
  const conj={id:'conj',title:'Joining Words',icon:'🔗',dedupByText:true,code:'EN1-CWT-01 · EN2-CWT-01',
    blurb:'Joining ideas with and, but, because, so, and Year 3–4 words (although, unless, yet, since, even though).',
    subs:l=>[null],
    gen(H,l){const [s,a]=pickL(CJ,l,2);
      return M(Object.assign({sub:a,prompt:'Which joining word fits <b>best</b>?',vis:sent(s.replace('___','<span class="gap"></span>')),hint:'Read the sentence with each choice. Which one makes the most sense?',hint2:CJH[a],
        explain:J([CJW[a],s.replace('___','<b>'+a+'</b>')]),why:CJW[a]},opts(a,CJD[a],{cls:'txt'})),{type:'conj',a});},
    example(){return {html:`<h3>🔗 Joining words</h3><p><b>and</b> adds more · <b>but</b> shows a change · <b>because</b> gives a reason · <b>so</b> tells the result</p>${sent('It was cold, <b>so</b> I put on my coat.')}`};}};

  /* ---------------- 10. prefixes and suffixes: un-, re-, -ful, -less ---------------- */
  const AF=[['happy','un','not happy',0],['kind','un','not kind',0],['tidy','un','not tidy',0],['lock','un','the opposite of lock',0],['pack','un','the opposite of pack',1],['fair','un','not fair',1],['safe','un','not safe',1],['zip','un','the opposite of zip',2],['lucky','un','not lucky',2],
    ['do','re','do again',0],['read','re','read again',0],['fill','re','fill again',0],['build','re','build again',1],['paint','re','paint again',1],['tell','re','tell again',2],['write','re','write again',2],
    ['help','ful','full of help',0],['care','ful','full of care',0],['colour','ful','full of colour',1],['play','ful','full of play',1],['thank','ful','full of thanks',2],['hope','ful','full of hope',2],['joy','ful','full of joy',3],
    ['care','less','without care',0],['fear','less','without fear',1],['use','less','without use',1],['end','less','without an end',2],['home','less','without a home',2],['hope','less','without hope',3],['harm','less','without harm',3],
    ['agree','dis','not agree',2],['appear','dis','the opposite of appear',3],['view','pre','view before',2],['heat','pre','heat before',3],
    ['kind','ness','the state of being kind',2],['dark','ness','the state of being dark',3],['pay','ment','the act of paying',2],['move','ment','the act of moving',3],
    ['quick','ly','in a quick way',2],['careful','ly','in a careful way',3],['act','tion','the naming word from act',3],
    ['behave','mis','behave badly',3],['place','mis','put in the wrong place',3],['spell','mis','spell wrongly',3],
    ['load','over','load too much',3],['sleep','over','sleep too much',3],
    ['danger','ous','having a lot of danger',3],['fame','ous','known by many people',3],['market','super','a bigger market',3],['honest','dis','not honest',3],['joy','ous','having a lot of joy',3],['nerve','ous','feeling worried',3],['connect','tion','the naming word from connect',3]];
  const afW=(r,x)=>['un','re','dis','pre','mis','over','super'].includes(x)?x+r:x==='tion'&&r.endsWith('t')?r+'ion':r+x;
  const AFM={un:'not, or the opposite',re:'again',dis:'not, or the opposite',pre:'before',ful:'full of',less:'without',ness:'the state of being',ment:'the act of',ly:'in that way',tion:'the naming word from a verb',mis:'wrongly, or badly',over:'too much',super:'bigger, or above',ous:'having that quality'};
  const affix={id:'affix',title:'Word Starts and Endings',icon:'🧱',dedupByText:true,code:'EN1-VOCAB-01 · EN2-SPELL-01',
    blurb:'Prefixes un-/re-/dis-/pre-/mis-/over- and suffixes -ful, -less, -ness, -ment, -ly, -tion, -ous.',
    subs:l=>['mean','mean','part'],
    gen(H,l,sub){const [r,x,m]=pickL(AF,l,3),a=afW(r,x);
      if(sub==='part'){const others=AF.filter(y=>y[1]===x&&y[0]!==r).map(y=>afW(y[0],y[1]));const ex=others.length?pick(others):({un:'unhappy',re:'redo',dis:'disagree',pre:'preview',ful:'hopeful',less:'careless',ness:'kindness',ment:'payment',ly:'quickly',tion:'station',mis:'misspell',over:'overload',super:'supermarket',ous:'dangerous'}[x]);const lab={un:'un-',re:'re-',dis:'dis-',pre:'pre-',ful:'-ful',less:'-less',ness:'-ness',ment:'-ment',ly:'-ly',tion:'-tion',mis:'mis-',over:'over-',super:'super-',ous:'-ous'}[x];
        return M(Object.assign({sub,prompt:`In <b>${a}</b>, what does <b>${lab}</b> mean?`,vis:'',hint:`Think of another word with ${lab}, like “${ex}”. What does it do there?`,hint2:`Cover ${lab}. Read the root word “${r}”. How did the meaning change?`,
          explain:J([`${lab} means <b>${AFM[x]}</b>.`,`${a} = ${m}.`]),why:`${lab} means “${AFM[x]}”, so ${a} means ${m}.`},opts(AFM[x],Object.values(AFM).filter(v=>v!==AFM[x]),{cls:'txt'})),{type:'apart',x});}
      const d=['un','re','dis','pre','ful','less','ness','ment','ly','mis','over','ous','super'].filter(y=>y!==x).map(y=>afW(r,y)).filter((w,i,arr)=>w!==a&&arr.indexOf(w)===i).slice(0,3);
      return M(Object.assign({sub:'mean',prompt:`Which word means <b>${m}</b>?`,vis:'',hint:`Find the root word “${r}”. Then think which start or ending changes it.`,hint2:'un- means not. re- means again. -ful means full of. -less means without.',
        explain:J([`${m} → <b>${a}</b>.`,`${{un:'un-',re:'re-',dis:'dis-',pre:'pre-',ful:'-ful',less:'-less',ness:'-ness',ment:'-ment',ly:'-ly',tion:'-tion',mis:'mis-',over:'over-',super:'super-',ous:'-ous'}[x]} means ${AFM[x]}.`]),why:`${a} = ${m}.`},opts(a,d,{cls:'txt'})),{type:'amean',x});},
    example(){return {html:`<h3>🧱 Word starts and endings</h3><p><b>un-</b> = not: <b>un</b>happy · <b>re-</b> = again: <b>re</b>do</p><p><b>-ful</b> = full of: help<b>ful</b> · <b>-less</b> = without: care<b>less</b></p>`};}};

  /* ---------------- 11. apostrophes for contractions ---------------- */
  const CT=[['do not',"don't",'o',0],['cannot',"can't",'no',0],['is not',"isn't",'o',0],['it is',"it's",'i',0],['I am',"I'm",'a',0],['did not',"didn't",'o',0],['you are',"you're",'a',0],['we are',"we're",'a',1],
    ['they are',"they're",'a',1],['she is',"she's",'i',1],['I will',"I'll",'wi',1],['was not',"wasn't",'o',1],['we will',"we'll",'wi',2],['I have',"I've",'ha',2],['could not',"couldn't",'o',2],['let us',"let's",'u',2],
    ['would not',"wouldn't",'o',3],['they will',"they'll",'wi',3],['you have',"you've",'ha',3],['he is',"he's",'i',3]];
  const ctBad=c=>{const i=c.indexOf("'"),s=c.replace("'",'');const L=[s];if(i>1)L.push(s.slice(0,i-1)+"'"+s.slice(i-1));if(i<s.length)L.push(s.slice(0,i+1)+"'"+s.slice(i+1));L.push(s.slice(0,i)+','+s.slice(i));return uniq(L).filter(x=>x!==c);};
  const POSS=[['dog','bone',"the dog's bone",'one owner',1],['girl','hat',"the girl's hat",'one owner',1],['teacher','desk',"the teacher's desk",'one owner',2],
    ['dogs','kennel',"the dogs' kennel",'more than one owner',2],['children','toys',"the children's toys",'special plural owner',3],
    ['boy','bike',"the boy's bike",'one owner',1],['cats','bowl',"the cats' bowl",'more than one owner',3],
    ['women','hats',"the women's hats",'special plural owner',3],
    ['class','work',"the class's work",'one owner',3],
    ['girls','bags',"the girls' bags",'more than one owner',3],
    ['people','votes',"the people's votes",'special plural owner',3]];
  const contract={id:'contract',title:'Short Words (Apostrophes)',icon:'✂️',dedupByText:true,code:'EN1-CWT-01 · EN2-CWT-01',
    blurb:'Contractions, possessive apostrophes, and telling it’s from its.',
    subs:l=>l>=2?['short','long','gone','own','its']:l>=1?['short','long','gone']:['short','long'],
    gen(H,l,sub){
      if(sub==='its'){const row=pick([['The dog wagged ___ tail.','its',"it's",'belonging to the dog'],['I think ___ going to rain.',"it's",'its','it is'],['The book is missing ___ last page.','its',"it's",'belonging to the book'],['Mum says ___ time for bed.',"it's",'its','it is']]);const [sen,a,d,clue]=row;
        return M(Object.assign({sub,prompt:'Which word fits the sentence?',vis:sent(sen.replace('___','<span class="gap"></span>')),
          hint:'Decide if the gap means it is, or shows belonging.',hint2:`Think carefully about the meaning of the gap: it means “${clue}”.`,
          explain:J([`The gap means “${clue}”.`,`The right choice is <b>${a}</b>.`]),why:`“${a}” is right because it means ${clue}.`},opts(a,uniq([d,"its'","its's"]).filter(x=>x!==a),{cls:'txt'})),{type:'its'});}
      if(sub==='own'){const [own,thing,right,clue]=pickL(POSS,l,4);
        const wrongs=uniq([`the ${own}s ${thing}`,`the ${own} ${thing}`,own.endsWith('s')?`the ${own}'s ${thing}`:`the ${own}s' ${thing}`,`the ${own}' ${thing}`]).filter(x=>x!==right);
        return M(Object.assign({sub,prompt:`Which shows that the ${thing} belongs to the ${own}? <span class="small">(${clue})</span>`,vis:'',
          hint:'An apostrophe can show belonging. Think: one owner, or more than one?',hint2:clue==='one owner'?"One owner: add ’s to the owner’s name.":clue==='more than one owner'?"Plural owner that already ends in s: just add the apostrophe after s.":"Some plurals (children) add ’s even though they are plural.",
          explain:J([`<b>${right}</b>`,`Clue: ${clue}.`]),why:`${right} shows belonging (${clue}).`},opts(right,wrongs,{cls:'txt'})),{type:'own'});}
      const [lg,c,gone]=pickL(CT,l,3);const ex=J([`${lg} → <b>${c}</b>`,`The apostrophe takes the place of the missing letter${gone.length>1?'s':''}: <b>${gone}</b>.`]);
      if(sub==='long'){const d=shuffle(CT.filter(x=>x[0]!==lg&&x[1]!==c).map(x=>x[0])).slice(0,3);
        return M(Object.assign({sub,prompt:`<b>${c}</b> is short for …`,vis:'',hint:'Say the short word slowly. Which two words do you hear?',hint2:'The first part is usually a whole word you already know.',explain:ex,why:`“${c}” is the short way to say “${lg}”.`},opts(lg,d,{cls:'txt'})),{type:'clong'});}
      if(sub==='gone'){const d=['o','a','i','e','wi','ha','no','u'].filter(x=>x!==gone&&!gone.includes(x)&&!x.includes(gone));const dd=shuffle(d).slice(0,3);
        return M(Object.assign({sub,prompt:`<b>${lg}</b> → <b>${c}</b>. Which letter${gone.length>1?'s':''} did the apostrophe replace?`,vis:'',hint:'Write the two words. Then compare them with the short word.',hint2:'Which letters are in the long words, but not in the short word?',explain:ex,why:`In “${c}”, the apostrophe stands for the missing ${gone}.`},opts(gone,dd,{cls:'txt'})),{type:'cgone'});}
      return M(Object.assign({sub:'short',prompt:`Which is the short way to write <b>${lg}</b>?`,vis:'',hint:'The apostrophe goes exactly where the missing letters used to be.',hint2:'Write both words. Cross out the letters you drop. Put the apostrophe there.',explain:ex,why:`The apostrophe goes where the ${gone} was taken out: ${c}.`},opts(c,ctBad(c),{cls:'txt'})),{type:'cshort'});},
    example(){return {html:`<h3>✂️ Short words</h3><p>We can squash two words together. The <b>apostrophe</b> ( ’ ) shows where letters were taken out.</p><p style="font-size:1.25rem">do n<s>o</s>t → don<b>’</b>t · I <s>a</s>m → I<b>’</b>m · it <s>i</s>s → it<b>’</b>s</p>`};}};

  /* ---------------- 12. reading: short passages ---------------- */
  const P=[
    {t:'The Lost Hat',lv:0,x:'Tom had a red hat. One windy day, the wind blew his hat into a tree. Tom’s dad got a ladder. He climbed up and got the hat back. Tom said thank you and gave Dad a big hug.',
     q:[['literal','What colour was Tom’s hat?','red',['blue','green','yellow']],['literal','What did Dad use to get the hat?','a ladder',['a rope','a stick','a chair']],['infer','How did Tom feel at the end?','happy and thankful',['still worried about the wind','cross with Dad','too tired to talk']],['vocab','In the story, “climbed” means','went up',['ran around','looked for','called out']]]},
    {t:'Koalas',lv:0,x:'Koalas live in gum trees in Australia. They eat gum leaves. Koalas sleep for up to 20 hours a day! A baby koala is called a joey. It lives in its mum’s pouch.',
     q:[['literal','What do koalas eat?','gum leaves',['grass','bark','berries']],['literal','What is a baby koala called?','a joey',['a cub','a kitten','a pup']],['infer','Why might you not see a koala moving much?','It sleeps most of the day.',['It only comes out at night.','Gum leaves make it too heavy to climb.','Joeys cannot leave the pouch.']],['vocab','In the text, a “pouch” is','a pocket of skin for a baby',['a nest high in the tree','a bag the joey carries','a hollow in the trunk']]]},
    {t:'Sports Day',lv:1,x:'On Sports Day, Ava wore her blue team shirt. She came first in the sack race and second in the egg-and-spoon race. When she crossed the line, she jumped up and down and waved to her gran.',
     q:[['literal','Which race did Ava win?','the sack race',['the egg-and-spoon race','the relay race','the long jump']],['literal','Who did Ava wave to?','her gran',['her teacher','her dad','her brother']],['infer','How did Ava feel when she crossed the line?','excited',['disappointed she came second','too tired to keep going','nervous about waving']],['vocab','In the story, “crossed the line” means','finished the race',['started the sack race','waved to her gran','changed team shirts']]]},
    {t:'The Storm',lv:1,x:'Dark clouds filled the sky. Mia heard a loud rumble. She grabbed her toys from the yard and ran inside, just as big drops began to fall.',
     q:[['infer','What was about to happen?','a storm',['a light shower that would pass','just dark clouds blowing over','a windy but dry afternoon']],['literal','What did Mia grab from the yard?','her toys',['her hat','her bike','the washing']],['infer','Why did Mia run inside?','She did not want to get wet.',['She wanted to put the toys away.','She heard a warning on the radio.','She was late for dinner.']],['vocab','In the story, a “rumble” is','a deep rolling sound',['a bright flash of light','a sudden gust of wind','a shout from next door']]]},
    {t:'Ants',lv:2,x:'Ants are tiny insects. They live in big groups called colonies. Each colony has a queen who lays the eggs. Worker ants find food and carry it back to the nest. An ant can carry something much heavier than its own body.',
     q:[['literal','Who lays the eggs?','the queen',['the worker ants','the baby ants','the king']],['literal','What is a big group of ants called?','a colony',['a herd','a flock','a pack']],['infer','Which words best describe ants?','strong for their size',['only strong when the queen helps','strong but only in small groups','stronger than most birds']],['vocab','In the text, “colonies” means','large groups living together',['the eggs the queen lays','the food workers carry home','the nests under the soil']]]},
    {t:'The Lunchbox Mix-up',lv:2,x:'Jack opened his lunchbox and frowned. Inside was a cheese sandwich, but Jack does not like cheese. Then he saw the name on the lid. It said “Josh”. Jack looked over at Josh, who was holding a lunchbox with a dinosaur sticker.',
     q:[['infer','Why did Jack frown?','He saw food he does not like.',['The lunchbox would not open.','He had already eaten.','Josh had taken his sticker.']],['literal','Whose name was on the lid?','Josh',['Jack','Mum','the teacher']],['infer','What will Jack most likely do next?','Swap lunchboxes with Josh.',['Ask Mum for a new sandwich.','Hide the dinosaur sticker.','Eat the cheese sandwich anyway.']],['vocab','In the story, “frowned” means','looked unhappy or annoyed',['looked hungry','looked proud','looked sleepy']]]},
    {t:'Bean Seed',lv:3,x:'Lily planted a bean seed in a pot. She watered it every morning and put it on the sunny windowsill. After a week, a tiny green shoot poked out of the soil. Lily drew a picture of it in her diary.',
     q:[['literal','Where did Lily put the pot?','on the sunny windowsill',['beside the back door','on a high shelf','near the kitchen tap']],['infer','Why did Lily water the seed every morning?','to help it grow',['to wash dirt off the leaves','to cool the windowsill','to fill the diary page']],['infer','Why did Lily draw the shoot in her diary?','She wanted to record how it was growing.',['She had finished her homework early.','She needed a present for Dad.','The teacher told her to draw weather.']],['vocab','In the story, “poked out” means','appeared through the soil',['fell off the side of the pot','was drawn in the diary','blocked the sun from the glass']]]},
    {t:'The Night Market',lv:3,x:'Lanterns hung above the stalls as music drifted down the street. Mei clutched her coins and stopped at a stall piled with steamed buns. The seller smiled, but Mei shook her head and walked on until she reached a stall selling paper kites. She counted her coins twice, then chose a blue one with a long tail.',
     q:[['literal','What did Mei buy?','a blue kite',['a steamed bun','a lantern','a book of songs']],['infer','Why did Mei walk past the bun stall?','She was saving her money for a kite.',['The seller was unfriendly.','The buns had sold out.','She had already eaten.']],['infer','How do we know the kites cost most of her money?','She counted her coins twice before choosing.',['She asked the seller for a bag.','She hung a lantern above the stall.','She shook her head at the music.']],['vocab','In the story, “clutched” means','held tightly',['dropped on the path','counted carefully','hid in a pocket']]]},
    {t:'The Library Notice',lv:3,x:'A handwritten notice was taped to the library door: “Closed today — the roof is being repaired. All borrowed books may be returned on Monday. Story Club will meet in the hall at the usual time.” Maya had a book due that afternoon and her little brother wanted Story Club. She turned to him and said, “We can still go, just not in there.”',
     q:[['literal','When may borrowed books be returned?','on Monday',['this afternoon','at Story Club','after the roof is painted']],['infer','Why is the library closed today?','The roof is being repaired.',['Story Club has been cancelled.','Maya’s book is overdue.','The hall is being painted.']],['infer','What does Maya mean by “just not in there”?','Story Club will be in the hall, not the library.',['The library will open after lunch.','Her brother cannot come to Story Club.','They must return the book today.']],['vocab','In the notice, “borrowed” means','taken to use and then give back',['bought and kept for ever','hidden under a desk','written by hand']]]},
    {t:'The Relay Baton',lv:3,x:'Noah was third in the relay. He wiped his hands on his shorts and watched the second runner pound towards him. The baton slapped into his palm, but it wobbled. For a second he almost dropped it. Then his fingers closed tight and he flew down the track, eyes on Priya waiting at the last change.',
     q:[['literal','Which runner was Noah?','the third runner',['the first runner','the second runner','the last runner']],['infer','Why did Noah wipe his hands?','He did not want to drop the baton.',['The track was wet from rain.','His shorts were muddy.','Priya had asked him to stop.']],['infer','Who was waiting to run last?','Priya',['Noah','the second runner','the teacher']],['vocab','In the story, “pound” means','run with heavy, fast steps',['hit the baton with a fist','stand still and wait','whisper to the crowd']]]},
    {t:'Whale Watch',lv:3,x:'The class stood on the headland with the wind in their faces. For a long time the sea was empty. Then a dark shape rose and a spout of water shot into the air. “There!” whispered Mr Chen. Nobody cheered. They watched in silence until the whale slipped under again, as if they might scare it away.',
     q:[['literal','Where was the class standing?','on the headland',['on the beach path','in the school hall','on a ferry deck']],['infer','Why did nobody cheer when the whale appeared?','They did not want to frighten it.',['They had not seen it clearly.','Mr Chen told them to go home.','The wind was too loud to shout.']],['infer','What does the spout of water tell us?','The whale was breathing out at the surface.',['A boat had crashed nearby.','Rain had started to fall.','The class had thrown a stone.']],['vocab','In the story, a “headland” is','high land sticking out by the sea',['a cave under the cliffs','the deck of a ferry','a path down to the beach']]]},
    {t:'The Borrowed Umbrella',lv:3,x:'On the way to the bus, Ami noticed the sky had turned a heavy grey. She almost turned back for her umbrella, but the bus was already pulling in. At the next stop an older boy stood up and held out a folded one. “Keep it till tomorrow,” he said, and hopped off before she could ask his name. Ami arrived at school dry, the umbrella dripping in her hand, and wondered how she would ever return it.',
     q:[['literal','How did Ami arrive at school?','dry, holding a dripping umbrella',['soaked, without a bag','late, running for the bell','with her own umbrella']],['infer','Why did Ami almost turn back?','She thought it was about to rain.',['She had forgotten her school bag.','The bus was not coming.','She wanted to talk to the boy.']],['infer','Why was it hard for Ami to return the umbrella?','She did not know the boy’s name.',['The umbrella was already broken.','The teacher had taken it.','She had left it on the bus.']],['vocab','In the story, a “heavy grey” sky means','dark, as if a storm is coming',['pale and sunny','full of smoke from a fire','covered in thick fog']]]},
    {t:'The Science Fair',lv:3,x:'Jae’s volcano had failed twice at home, and the science fair was after lunch. He stayed in the classroom while the others went out to play, mixing the powder more slowly this time and checking his notes. When his name was called, the model bubbled just enough. He did not grin until he was back at his table, packing the tray away.',
     q:[['literal','When was the science fair?','after lunch',['before school','during playtime','the next morning']],['infer','Why did Jae stay inside at playtime?','He wanted one more careful practice.',['The teacher would not let him go out.','His volcano had already been packed away.','He was feeling too unwell to play.']],['infer','Why did Jae wait until later to grin?','He was concentrating until he knew it had worked.',['He had not wanted the volcano to bubble.','Someone else had finished his model.','The fair had been cancelled.']],['vocab','In the story, “failed” means','did not work as planned',['won a prize','was packed away early','was too slow to start']]]},
  ];
  const comp={id:'comp',title:'Reading Detective',icon:'📖',dedupByText:true,code:'EN1-RECOM-01 → EN2-RECOM-01',
    blurb:'Reading short stories and facts: literal questions, inference from clues, and vocabulary in context.',
    subs:l=>l>=2?['infer','infer','vocab','literal']:['literal','infer'],
    gen(H,l,sub){const stretch=Math.min(3,l+(l>=1?1:0));const floor=l>=3?3:(l>=1?2:0);const ps=P.filter(p=>p.lv<=stretch);const prefer=ps.filter(p=>p.lv>=floor);const pool=prefer.length?prefer:ps;for(let t=0;t<40;t++){const p=pick(pool);const qs=p.q.filter(x=>x[0]===sub);if(!qs.length)continue;const [k,qq,a,d]=pick(qs);
        return M(Object.assign({sub,prompt:qq,vis:`<div class="passage"><b>${p.t}</b><p>${p.x}</p></div>`,
          hint:k==='literal'?'The answer is written in the story. Find the sentence that tells you.':k==='vocab'?'Read the sentence around the word. Which meaning fits best?':'The answer is not written exactly. Use clues from the story.',
          hint2:k==='literal'?'Look for a key word from the question in the story.':k==='vocab'?'Swap each choice into the sentence. Which one still makes sense?':'Think about what the clues show. What would you feel or do?',
          explain:J([k==='literal'?'This is a “right there” question: the answer is in the text.':k==='vocab'?'Use the words around it to work out the meaning.':'This is a “think and search” question: put the clues together.',`Answer: <b>${a}</b>`]),
          why:k==='literal'?`The story tells us: ${a}.`:k==='vocab'?`In this story, that word means: ${a}.`:`The clues in the story point to: ${a}.`},opts(a,d,{cls:'sent'})),{type:'comp',k});}
      throw new Error('comp');},
    example(){return {html:`<h3>📖 Reading detective</h3><p><b>Right there</b>: the answer is written in the story.<br><b>Think and search</b>: use clues to work it out.</p><p>💡 Read the story first, then the question, then look back at the story.</p>`};}};

  return {quick,phonics,sight,wordclass,punct,compound,plurals,past,synant,conj,affix,contract,comp};
})();
const TOPICS_ENE=Object.values(ENE);
const CFG_ENE={player:'ethan',name:'Ethan',theme:'ethan',year:'upper Year 3 → early Year 4',warm:'quick',
  path:['phonics','sight','wordclass','punct','compound','plurals','past','synant','conj','affix','contract','comp'],start:'phonics',games:{},moreLabel:'More help'};
