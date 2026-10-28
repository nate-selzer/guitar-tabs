// Builds every song folder (any directory with a song.mjs) plus the home page; `<slug>` builds one, and `--chat <dir>` also writes the chat page and song files into <dir>.
import * as alphaTab from './vendor/alphatab/alphaTab.core.min.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { checkName, resolveShapes } from './chords.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
// web/diagram.js is a plain browser script, so it's evaluated here rather than imported.
const chordChart = new Function(fs.readFileSync(path.join(root, 'web/diagram.js'), 'utf8') + '\nreturn chordChart;')();
const q = s => `"${s.replace(/"/g, '\\"')}"`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const DURATIONS = { 1: '.4', 2: '.2', 3: '.2 {d}', 4: '.1' };

const args = process.argv.slice(2);
const chatDir = args.includes('--chat') ? args.splice(args.indexOf('--chat'), 2)[1] : null;
const slugs = args[0] ? [args[0]] : fs.readdirSync(root).filter(d => fs.existsSync(path.join(root, d, 'song.mjs')));
const songs = [];
for (const slug of slugs) songs.push(await buildSong(slug));
if (!args[0]) buildHome();

async function buildSong(slug) {
  const dir = path.join(root, slug);
  const mod = await import(pathToFileURL(path.join(dir, 'song.mjs')).href);
  const song = mod.default;
  // Hand-edited bars from the bar editors (see overrides.mjs), keyed by bar index; they replace the pattern output.
  const overrides = mod.overrides ?? {};
  const chordEdits = mod.chordEdits ?? {};
  const tuningPcs = song.tuning && song.tuning.map(n => 'CCDDEFFGGAAB'.indexOf(n[0]) + (n[1] === '#' ? 1 : n[1] === 'b' ? -1 : 0));

  const shapes = resolveShapes(song, chordEdits);
  // A chart's `name` is what the pages, chord sheet and .gp show; the key stays what song.mjs uses.
  const label = n => shapes[n]?.name ?? n;
  const relabel = tex => tex?.replace(/ch "([^"]*)"/g, (m, n) => (shapes[n]?.name ? `ch ${q(shapes[n].name)}` : m));
  for (const [key, { frets }] of Object.entries(shapes)) {
    const name = label(key);
    for (const p of checkName(name, frets, tuningPcs)) console.warn(`${slug}: ${name} (${frets.map(f => f ?? 'x').join('')}) ${p}`);
  }

  const note = (n, i) => `${shapes[n].frets[i]}.${6 - i}{lr}`;
  const bassStrings = n => shapes[n].bass ?? [shapes[n].frets.findIndex(f => f !== null)];
  const strings = (n, from = 0) => '(' + shapes[n].frets.map((f, i) => (f === null || i < from ? null : note(n, i))).filter(Boolean).join(' ') + ')';
  const chordProps = n => {
    const { base } = chordChart.layout(shapes[n]);
    const props = [base > 1 && `firstfret ${base}`, shapes[n].barres?.length && `barre ${shapes[n].barres.map(b => b.fret).join(' ')}`].filter(Boolean);
    return props.length ? ` {${props.join(' ')}}` : '';
  };
  const chordDef = n => `\\chord (${q(label(n))} ${[...shapes[n].frets].reverse().map(f => f ?? 'x').join(' ')})${chordProps(n)}`;
  const lyrics = lines => lines.map((t, i) => (t ? `lyrics ${i} ${q(t)}` : '')).filter(Boolean).join(' ');

  // Songs can add their own patterns: (chord, quarters, fx, state, { note, bassStrings, shapes }) => alphaTex beats.
  const patterns = {
    // One downstroke per chord, held for its length.
    strum: (c, quarters, fx) => [`${strings(c)}${DURATIONS[quarters]} {bd${fx ? ` ${fx}` : ''}}`],
    // Bass note on each beat (alternating through `bass` strings), then the rest of the chord on the "and".
    boomChuck: (c, quarters, fx, state) => {
      const out = [];
      const lowest = Math.max(...shapes[c].frets.map((f, i) => (f !== null && i < 2 ? i : -1)));
      for (let k = 0; k < quarters; k++) {
        const strs = bassStrings(c);
        out.push(`${note(c, strs[state.alt++ % strs.length])}.8${k === 0 && fx ? ` {${fx}}` : ''}`, `${strings(c, lowest + 1)}.8 {bd}`);
      }
      return out;
    },
    ...song.patterns,
  };

  const renderBar = bar => {
    // pos: quarter-note position in the bar where the current chord starts.
    const state = { alt: 0, pos: 0 };
    let prev = null;
    return bar.beats.flatMap(entry => {
      if (entry.raw) return [entry.raw];
      const [c, quarters, ...lines] = entry;
      if (!c) return (state.pos += quarters, [`r${DURATIONS[quarters]} {${lyrics(lines)}}`]);
      const fx = [c !== prev && `ch ${q(c)}`, lyrics(lines)].filter(Boolean).join(' ');
      prev = c;
      const out = patterns[bar.pattern ?? song.pattern ?? 'strum'](c, quarters, fx, state, { note, bassStrings, shapes });
      state.pos += quarters;
      return out;
    }).join(' ');
  };

  const [num, den] = song.time ?? [4, 4];
  const head = [
    `\\title ${q(song.title)}`,
    `\\artist ${q(song.artist)}`,
    `\\tempo ${song.tempo}`,
    '.',
    `\\track "Guitar"`,
    `\\staff {tabs}`,
    song.tuning ? `\\tuning (${[...song.tuning].reverse().join(' ')})` : '',
    song.capo ? `\\capo ${song.capo}` : '',
    ...Object.keys(shapes).map(chordDef),
  ].filter(Boolean).join('\n');
  const bars = song.bars.map((b, i) => ({
    head: [
      i === 0 ? `\\ts (${num} ${den})` : '',
      b.ac ? '\\ac' : '',
      b.repeatStart ? '\\ro' : '',
      b.ending ? `\\ae (${b.ending})` : '',
      b.repeatEnd ? `\\rc ${b.repeatEnd}` : '',
      b.doubleBar ? '\\db' : '',
    ].filter(Boolean).join(' '),
    pattern: relabel(renderBar(b)),
    override: relabel(overrides[i]),
  }));
  const tex = head + '\n' + bars.map(b => [b.head, b.override ?? b.pattern].filter(Boolean).join(' ')).join(' |\n');

  fs.writeFileSync(path.join(dir, 'song.tex'), tex);
  const settings = new alphaTab.Settings();
  const imp = new alphaTab.importer.AlphaTexImporter();
  imp.initFromString(tex, settings);
  fs.writeFileSync(path.join(dir, `${song.title}.gp`), new alphaTab.exporter.Gp7Exporter().export(imp.readScore(), settings));

  const diagrams = Object.entries(shapes).map(([name, shape]) => `<figure data-chord="${esc(name).replace(/"/g, '&quot;')}"><figcaption>${esc(label(name))}</figcaption>${chordChart.svg(label(name), shape)}</figure>`).join('');
  const facts = [
    song.capo && `Capo <b>${song.capo}</b>`,
    song.capo && 'Frets relative to capo',
    song.tuning && `Tuning <b>${song.tuning.map(n => n.replace(/\d/, '')).join(' ')}</b>`,
    song.key && `Sounds in <b>${song.key}</b>`,
  ].filter(Boolean);
  const fill = (template, extra) => fs.readFileSync(path.join(root, 'templates', template), 'utf8')
    .replaceAll('__TITLE__', esc(song.title))
    .replaceAll('__ARTIST__', esc(song.artist))
    .replaceAll('__SLUG__', slug)
    .replace('__NOTE__', song.note ? `<p class="note">${song.note}</p>` : '')
    .replace('__DIAGRAMS__', () => diagrams)
    .replace('__FACTS__', () => extra(facts).map(f => `<span class="fact">${f}</span>`).join('\n      '));

  const sheet = song.sheet.map(([section, lines]) => [section, lines.map(l => (Array.isArray(l) ? l.map(([c, t]) => [c && label(c), t]) : l))]);
  const tabPage = (scripts, edit) => fill('tab.html', f => [...f, `<b>${num}/${den}</b>`, `♩ = <b>${song.tempo}</b>`])
    .replace('__TEX__', () => tex).replace('__RING__', song.ring ?? 1).replace('__FREE_RING__', JSON.stringify(song.bars.flatMap((b, i) => (b.letRing ? [i] : []))))
    .replace('__EDIT__', () => JSON.stringify(edit).replace(/</g, '\\u003c')).replace('__SCRIPTS__', () => scripts);
  fs.writeFileSync(path.join(dir, 'index.html'), tabPage([
    `<script>window.GT_ASSETS = { base: '../' };</script>`,
    '<script src="../vendor/alphatab/alphaTab.min.js"></script>',
    '<script src="../web/playback.js"></script>',
  ].join('\n'), null));
  fs.writeFileSync(path.join(dir, 'chords.html'), fill('chords.html', f => f)
    .replace('__SHEET__', () => sheet.map(([name, lines]) => `<section><h2>[${esc(name)}]</h2><pre>${lines.map(renderLine).join('\n')}</pre></section>`).join('')));
  fs.writeFileSync(path.join(dir, 'chords.txt'), plainSheet({ ...song, sheet }, Object.fromEntries(Object.entries(shapes).map(([n, s]) => [label(n), s]))));

  if (chatDir) {
    // Chat's preview can't load other files and cuts the page at tag-like text in scripts, so inline everything with `<` before a tag name as \x3c.
    const read = (p, enc = 'utf8') => fs.readFileSync(path.join(root, p), enc);
    const script = p => `<script>${read(p).replace(/<(?=\/|!|html|head|body|style|script)/gi, '\\x3c')}</script>`;
    const page = tabPage([
      `<script type="text/plain" id="sf">${read('vendor/alphatab/soundfont/sonivox.sf2.b64.txt').trim()}</script>`,
      `<script>window.GT_ASSETS = { font: 'data:font/woff2;base64,${read('vendor/alphatab/font/Bravura.woff2', 'base64')}' };</script>`,
      script('vendor/alphatab/alphaTab.min.js'),
      script('web/playback.js'),
      script('web/editor.js'),
      script('web/diagram.js'),
      script('web/chart-editor.js'),
    ].join('\n'), { slug, head, bars, capo: song.capo ?? 0, chords: Object.fromEntries(Object.entries(resolveShapes(song)).map(([n, base]) => [n, { base, shape: shapes[n], edited: n in chordEdits }])) });
    fs.mkdirSync(chatDir, { recursive: true });
    fs.writeFileSync(path.join(chatDir, `${slug}.html`), page);
    for (const f of [`${song.title}.gp`, 'chords.txt', 'song.mjs']) fs.copyFileSync(path.join(dir, f), path.join(chatDir, f));
  }
  return { slug, ...song };
}

// Plain-text chord sheet for pasting into Ultimate Guitar: a shape legend, then chords over lyrics.
// Annotations like "(barre)" are dropped from chord lines so UG recognizes the chord names.
function plainSheet(song, shapes) {
  const ascii = c => c.replace(/♭/g, 'b').replace(/♯/g, '#');
  const strip = c => c && ascii(c.replace(/\s*\(.*?\)/, ''));
  const width = Math.max(...Object.keys(shapes).map(n => n.length)) + 2;
  return [
    song.capo ? `Capo: ${song.capo}${['st', 'nd', 'rd'][song.capo - 1] ?? 'th'} fret` : '',
    song.tuning ? `Tuning: ${song.tuning.map(n => n.replace(/\d/, '')).join(' ')}` : '',
    song.note ? ascii(song.note).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s*\([^)]*\)/g, '') : '',
    '',
    ...Object.entries(shapes).map(([n, { frets, fingers }]) => ascii(n).padEnd(width) + frets.map(f => f ?? 'x').join('') + (fingers?.[0] === 'T' ? '  (thumb on low E)' : '')),
    ...song.sheet.flatMap(([name, lines]) => ['', `[${name}]`, ...lines.map(line => {
      if (typeof line === 'string') return line;
      let chords = '';
      let lyric = '';
      for (const [c, t] of line.map(([c, t]) => [strip(c), t])) {
        const w = Math.max(t.length, c ? c.length + 1 : 0);
        chords += (c ?? '').padEnd(w);
        lyric += t.padEnd(w);
      }
      return [chords.trimEnd(), lyric.trimEnd()].filter(Boolean).join('\n');
    })]),
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n').trim() + '\n';
}

// A sheet line is [chord|null, lyric] segments, each chord sitting over the start of its lyric; a plain string is a note.
function renderLine(line) {
  if (typeof line === 'string') return `<i>${esc(line)}</i>`;
  let chords = '';
  let lyric = '';
  for (const [c, t] of line) {
    const width = Math.max(t.length, c ? c.length + 1 : 0);
    chords += c ? `<b>${esc(c)}</b>${' '.repeat(width - c.length)}` : ' '.repeat(width);
    lyric += t.padEnd(width);
  }
  return [chords.trimEnd(), esc(lyric.trimEnd())].filter(Boolean).join('\n');
}

function buildHome() {
  const items = songs.sort((a, b) => a.title.localeCompare(b.title)).map(s =>
    `<li><a href="${s.slug}/"><b>${esc(s.title)}</b> <span>· ${esc(s.artist)}${s.capo ? ` · capo ${s.capo}` : ''}</span></a><a class="alt" href="${s.slug}/chords.html">Chords</a></li>`);
  fs.writeFileSync(path.join(root, 'index.html'), fs.readFileSync(path.join(root, 'templates', 'home.html'), 'utf8').replace('__SONGS__', () => items.join('\n    ')));
}
