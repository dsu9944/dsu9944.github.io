# Kids Learning Hub – Daily Lesson

Each child has a 15-minute lesson page that works offline (it also opens straight from disk via file://):

- `alexia/daily/index.html` (Year 4, stretching to Year 5)
- `ethan/daily/index.html` (Year 2, stretching to Year 3)

The lesson is the same all day and changes the next day. Monday to Thursday is the **Daily Mix**. Friday is the **Week Review**, and Saturday/Sunday give a catch-up review. Progress is saved in the browser under `kidsHub.p.<child>.daily`. The pages only read the existing game keys and never change them.

## "From school today" (focus.js)

Each child's folder has a `daily/focus.js` file that starts out empty. To make the lesson open with a short section of about 5 minutes on what was taught at school, add a line like this to the file:

```js
DAILY_FOCUS.push({date:'2026-10-22', topicId:'percent', title:'Percentages', note:'Did 10%, 25%, 50% of amounts', until:'2026-10-24'});
```

- The section runs from `date` to `until` (inclusive). If you leave out `until`, it runs on `date` only. It starts with a worked example, then gives guided practice with the hints showing.
- For the rest of that week, the topic gets extra weight in the mixed practice and in the Friday review.
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

## Testing

Add `?date=YYYY-MM-DD` to the page address to see the lesson for another day, e.g. `ethan/daily/index.html?date=2026-10-23` for a Friday review.
