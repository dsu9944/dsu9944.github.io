# Kids Learning Hub – Daily Lesson

Each child has a 15-minute lesson page that works offline (it also opens straight from disk via file://):

- `alexia/daily/index.html` (Year 4, stretching to Year 5)
- `ethan/daily/index.html` (Year 2, stretching to Year 3)

The lesson is the same all day and changes the next day. Monday to Thursday is the **Daily Mix**. Friday is the **Week Review**, and Saturday/Sunday give a catch-up review. Progress is saved in the browser under `kidsHub.p.<child>.daily`. The pages only read the existing game keys and never change them.

## "From school today" (focus.js)

Each child's folder has a `daily/focus.js` file that starts out empty. To make the lesson focus on what was taught at school, add a line like this to the file:

```js
DAILY_FOCUS.push({date:'2026-10-22', topicId:'percent', title:'Percentages', note:'Did 10%, 25%, 50% of amounts', until:'2026-10-24'});
```

- The focus runs from `date` to `until` (inclusive). If you leave out `until`, it runs on `date` only. On those days the school topic makes up most of the lesson (about 17 of 27 questions): a "From school today" section with a worked example and 6 questions (hints showing on the first 2), then 6 of the 8 mixed-practice questions, 3 of the 4 Fix-it questions and 2 of the 3 Challenge questions. The warm-up drops to 3 questions and the current path topic to 3, which is still enough for mastery tracking.
- If two entries are active on the same day, the one listed first in the file is the school focus.
- On Friday (the week review), every school topic dated that week makes up 13 of the 18 review questions and gets a place in the "Toughest of the week" section.
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

**Question format.** Every question needs `prompt` (HTML), `hint` and `explain`, and can also have `vis` (HTML/SVG picture). The answer is set up in one of two ways:

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
