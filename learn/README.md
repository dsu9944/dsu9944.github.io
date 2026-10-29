# Kids Learning Hub – Daily Lesson

Each child has a 15-minute lesson page that works offline (it also opens straight from disk via file://):

- `alexia/daily/index.html` (Year 4, stretching to Year 5)
- `ethan/daily/index.html` (Year 2, stretching to Year 3)

**Lesson length:** Alexia's lesson is 18 questions every day (Mon–Thu Daily Mix: 3 warm-up, 4 new topic, 6 mixed, 3 Fix-it, 2 challenge; Friday/weekend review: 3 warm-up, 12 review, 3 toughest). Ethan's lesson is 25–30 questions. The sizes are set per child in `CFG.sizes` in `daily-src/topics-<child>.js`. Redo questions are extra and don't count toward the total.

**Hints:** each question has a 💡 Hint that shows the first steps using the question's own numbers, and a second level behind a 🔎 button ("Show me more help" for Alexia, "More help" for Ethan) that walks through more of the method without giving the answer. Ethan's hints are kept to one or two short steps.

The lesson is the same all day and changes the next day. Monday to Thursday is the **Daily Mix**. Friday is the **Week Review**, and Saturday/Sunday give a catch-up review. Progress is saved in the browser under `kidsHub.p.<child>.daily`. The pages only read the existing game keys and never change them.

## "From school today" (focus.js)

Each child's folder has a `daily/focus.js` file that starts out empty. To make the lesson focus on what was taught at school, add a line like this to the file:

```js
DAILY_FOCUS.push({date:'2026-10-22', topicId:'percent', title:'Percentages', note:'Did 10%, 25%, 50% of amounts', until:'2026-10-24'});
```

- The focus runs from `date` to `until` (inclusive). If you leave out `until`, it runs on `date` only. On those days the school topic makes up most of the lesson (Ethan: about 17 of 27 questions; Alexia: 12 of 18). There is a "From school today" section with a worked example and 6 questions (hints showing on the first 2), then most of the mixed-practice, Fix-it and Challenge questions. The warm-up gets shorter (Ethan 3, Alexia 1) and the current path topic gets 3 questions, which is still enough for mastery tracking.
- If two entries are active on the same day, the one listed first in the file is the school focus.
- On Friday (the week review), every school topic dated that week makes up 13 of the 18 review questions (Alexia: 9 of 13) and gets a place in the "Toughest of the week" section.
- `topicId` must be one of the IDs listed below or a module you added (see the next section). The page ignores an unknown ID.
- Delete the line when you no longer need it. The file can be edited in any text editor, and no rebuild is needed.

**Topic IDs, Alexia:** `eqfrac` Equivalent Fractions, `addfrac` Adding & Subtracting Fractions, `decline` Decimals on a Number Line, `thou` Decimals to Thousandths, `multdiv` Multiplication & Division, `fracqty` Fractions of Amounts & Mixed Numbers, `percent` Percentages, `money` Money & Decimals, `time24` 24-hour Time & Timetables, `areaper` Area & Perimeter, `angles` Angles, `chance` Chance & Probability, `data` Data & Graphs, `nets` 3D Objects & Nets.

**Topic IDs, Ethan:** `facts` Adding & Subtracting, `placeval` Place Value, `data` Data & Graphs, `muldiv` Multiplication & Division, `fractions` Halves, Quarters & Eighths, `money` Money, `time` Telling Time, `measure` Length, Area & Mass, `shapes` Shapes, Objects & Maps, `chance` Chance.

The topics are listed in path order, which follows the NSW Mathematics K–10 Syllabus (2022). A topic counts as mastered at 80% or more over 2 lessons, and then the next topic unlocks. You can change the current topic with **Go back** / **Skip ahead** in the "For grown-ups" panel at the bottom of the lesson page.

## Adding a new question generator

**Quick way (no build):** add a module to `daily/focus.js` with `DAILY_TOPICS_EXTRA.push({...})`. It can then be used as a focus `topicId`:

```js
DAILY_TOPICS_EXTRA.push({
  id:'roman', title:'Roman Numerals', icon:'🏛️', code:'extra',
  subs: lvl => ['read'],                       // question kinds available at level 0-3
  gen(H, lvl, sub){                            // return one question
    const n = H.rnd(1,10), R = ['I','II','III','IV','V','VI','VII','VIII','IX','X'][n-1];
    return Object.assign({sub, prompt:'What number is <b>'+R+'</b>?',
      hint:'I = 1, V = 5, X = 10', explain:R+' = <b>'+n+'</b>'}, H.num(n));
  },
  example(H){ return {html:'<p>I = 1, V = 5, X = 10. IV = 4.</p>'}; }  // worked example
});
```

**Permanent way:** add the module object to `TOPICS_A` or `TOPICS_E` in `/workspace/kids-hub/daily-src/topics-alexia.js` or `topics-ethan.js`. To put it on the learning path, add its ID to the `path` in `CFG_A`/`CFG_E`. Then run `node build.js` in `daily-src/`, which regenerates both `daily/index.html` files and leaves `focus.js` alone.

**Question format.** Every question needs `prompt` (HTML), `hint` and `explain`, and can also have `vis` (HTML/SVG picture) and `hint2` (the second, 🔎 hint level). The answer is set up in one of two ways:

- Multiple choice: `kind:'choice', choices:[...], answer:<index>`. The easy way is `H.opts(correct, [wrong...])` or `H.fixedOpts([...], correct)`.
- Typed answer: `kind:'entry', fields:[{id,len}], layout:'… [[id]] …', answer:{id:value}`. The ready-made helpers are `H.num(n)` (whole number), `H.decE(x)` (decimal), `H.fracE(n,d)`, `H.mixedE(w,n,d)`, `H.timeE(h,m)` and `H.qrE(q,r)`. An optional `check(vals)` accepts other correct forms.

`H` also has `rnd`, `pick` and `shuffle`, which use the day's seed, plus the picture helpers (`barSVG`, `clockSVG`, `rectSVG`, `angleSVG`, `moneySVG`, `colSVG`, `pieSVG` and more; see `daily-src/vis.js`).

## Redo of missed questions

- **Daily lesson:** a missed question comes back 3–5 questions later, with the answer options in a new order. If it is missed again, it comes back once more with the same type of question and new numbers. Any that are still waiting are asked in a "Try again round" before the results screen. Each question gets 3 tries at most; after that the answer is shown and the lesson moves on. Score, stars, mastery and the Fix-it history only count first tries. Fixing a question gives +2 points, and the results screen shows how many were fixed. The redo queue is saved with the lesson, so pausing or refreshing keeps it.
- **Games:** missed questions are asked again at the end of the round, before the results screen. It is the same question with the options reshuffled, with up to 2 extra tries. Stars, unlocking and the saved stats only count first tries, and the saved progress format is unchanged.

## Section tiles (daily lesson home)
Each tile on "Today's lesson" (School, Warm-up, New, Mix, Fix-it, Challenge, Review, Tough) is a button. Tapping one starts or resumes today's lesson at that section's first unanswered question. The other sections stay in the lesson and are still asked afterwards. Questions are seeded by their plan position, so the order never changes the questions, the score or mastery. A finished section's tile, or any tile once today is done, starts extra practice of that section. Extra practice doesn't change the day's score, mastery or the Fix-it history.

## Review mistakes together (parent review)
The results screen and the home screen (once today's lesson is started) have a "👨‍👦 Review mistakes together (N)" button. It lists every question answered wrong at the first try, showing:
- the picture;
- the first answer;
- the redo attempts;
- the correct answer;
- the steps;
- read-aloud;
- "Try it again", which reshuffles the question and doesn't score.

You can view the list or one mistake at a time. The day picker covers earlier days and the whole week. The data is kept in the daily store (`rev`) for the last 14 days only. Each of the 5 games has the same button on its results screen, covering that round only; nothing is stored.

## Testing

Add `?date=YYYY-MM-DD` to the page address to see the lesson for another day, e.g. `ethan/daily/index.html?date=2026-10-23` for a Friday review.

## Alexia's English Revision (5 minutes a day)
`alexia/english/index.html` is a separate 5-minute English lesson for Alexia. It follows the NSW English K–10 Syllabus (2022), Stage 2 into Stage 3, and is pitched at Year 4 stretching into Year 5. It is opened from the purple "📖 English Revision (5 min)" card next to Today's Lesson on Alexia's hub page.

- **Separate progress:** it is stored under `kidsHub.p.alexia.english`, so it never touches the maths Daily Lesson (`kidsHub.p.alexia.daily`) or the games.
- **Same engine:** it uses the same lesson engine, with a 5-minute timer and about 10–12 multiple-choice questions. It keeps the redo of wrong answers, "Review mistakes together" (with read-aloud), the grown-ups panel, Friday week review and `?date=YYYY-MM-DD` for testing.
- **Topic path** (each topic unlocks at 80%+ over 2 lessons):
  1. Word classes
  2. Sentence types
  3. Apostrophes
  4. Homophones
  5. Prefixes and suffixes
  6. Direct speech
  7. Similes and metaphors
  8. Reading comprehension

  Every day has a quick-words warm-up (spelling, synonyms, antonyms).
- **Normal day:** 2 warm-up questions, 3 on the new topic, 3 mixed, 1 fix-it and 1 challenge.
- **School-focus day:** the school topic is about two-thirds of the lesson and opens with a worked example.
- **Review day:** Friday is review day; Saturday and Sunday are catch-up review days. It covers this week's practice and mistakes, plus the week's school topic.
- **From school:** add entries to `alexia/english/focus.js`, in the same format as the maths `focus.js`. The first entry is the Word Spy ch.4 letter games (anagrams, palindromes, pangrams, lipograms, secret codes) from 30 Oct to 1 Nov 2026.
- **Source:** the page is built from `daily-src` with `node build-english.js`. That script patches a copy of the shared engine, so the maths pages are not affected.
