// Builds every song folder (any directory with a song.mjs) plus the home page. `node build.mjs <slug>` builds one song.
import * as alphaTab from '@coderline/alphatab';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { library, checkName } from './chords.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const q = s => `"${s.replace(/"/g, '\\"')}"`;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const DURATIONS = { 1: '.4', 2: '.2', 3: '.2 {d}', 4: '.1' };

const slugs = process.argv[2] ? [process.argv[2]] : fs.readdirSync(root).filter(d => fs.existsSync(path.join(root, d, 'song.mjs')));
const songs = [];
for (const slug of slugs) songs.push(await buildSong(slug));
if (!process.argv[2]) buildHome();

async function buildSong(slug) {
  const dir = path.join(root, slug);
  const song = (await import(pathToFileURL(path.join(dir, 'song.mjs')).href)).default;
  const tuningPcs = song.tuning && song.tuning.map(n => 'CCDDEFFGGAAB'.indexOf(n[0]) + (n[1] === '#' ? 1 : n[1] === 'b' ? -1 : 0));

  // Song shapes first (in their order), then any library chords the song uses.
  const used = new Set([
    ...song.bars.flatMap(b => b.beats.filter(Array.isArray).map(([c]) => c)),
    ...song.sheet.flatMap(([, lines]) => lines.filter(Array.isArray).flatMap(l => l.map(([c]) => c))),
  ].filter(Boolean));
  const shapes = {};
  for (const [name, s] of Object.entries(song.chords ?? {})) shapes[name] = Array.isArray(s) ? { frets: s } : s;
  for (const name of used) {
    if (shapes[name]) continue;
    if (!library[name]) throw new Error(`${slug}: no shape for "${name}". Add it to chords in song.mjs.`);
    shapes[name] = { frets: library[name] };
  }
  for (const [name, { frets }] of Object.entries(shapes)) {
    for (const p of checkName(name, frets, tuningPcs)) console.warn(`${slug}: ${name} (${frets.map(f => f ?? 'x').join('')}) ${p}`);
  }

  const note = (n, i) => `${shapes[n].frets[i]}.${6 - i}{lr}`;
  const bassStrings = n => shapes[n].bass ?? [shapes[n].frets.findIndex(f => f !== null)];
  const strings = (n, from = 0) => '(' + shapes[n].frets.map((f, i) => (f === null || i < from ? null : note(n, i))).filter(Boolean).join(' ') + ')';
  const firstFret = n => {
    const fretted = shapes[n].frets.filter(f => f);
    return Math.max(...fretted) > 4 ? ` {firstfret ${Math.min(...fretted)}}` : '';
  };
  const chordDef = n => `\\chord (${q(n)} ${[...shapes[n].frets].reverse().map(f => f ?? 'x').join(' ')})${firstFret(n)}`;
  const lyrics = lines => lines.map((t, i) => (t ? `lyrics ${i} ${q(t)}` : '')).filter(Boolean).join(' ');

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
  };

  const renderBar = bar => {
    const state = { alt: 0 };
    let prev = null;
    return bar.beats.flatMap(entry => {
      if (entry.raw) return [entry.raw];
      const [c, quarters, ...lines] = entry;
      if (!c) return [`r${DURATIONS[quarters]} {${lyrics(lines)}}`];
      const fx = [c !== prev && `ch ${q(c)}`, lyrics(lines)].filter(Boolean).join(' ');
      prev = c;
      return patterns[bar.pattern ?? song.pattern ?? 'strum'](c, quarters, fx, state);
    }).join(' ');
  };

  const [num, den] = song.time ?? [4, 4];
  const tex = [
    `\\title ${q(song.title)}`,
    `\\artist ${q(song.artist)}`,
    `\\tempo ${song.tempo}`,
    '.',
    `\\track "Guitar"`,
    `\\staff {tabs}`,
    song.tuning ? `\\tuning (${[...song.tuning].reverse().join(' ')})` : '',
    song.capo ? `\\capo ${song.capo}` : '',
    ...Object.keys(shapes).map(chordDef),
    song.bars.map((b, i) => [
      i === 0 ? `\\ts (${num} ${den})` : '',
      b.ac ? '\\ac' : '',
      b.repeatStart ? '\\ro' : '',
      b.ending ? `\\ae (${b.ending})` : '',
      b.repeatEnd ? `\\rc ${b.repeatEnd}` : '',
      b.doubleBar ? '\\db' : '',
      renderBar(b),
    ].filter(Boolean).join(' ')).join(' |\n'),
  ].filter(Boolean).join('\n');

  fs.writeFileSync(path.join(dir, 'song.tex'), tex);
  const settings = new alphaTab.Settings();
  const imp = new alphaTab.importer.AlphaTexImporter();
  imp.initFromString(tex, settings);
  fs.writeFileSync(path.join(dir, `${song.title}.gp`), new alphaTab.exporter.Gp7Exporter().export(imp.readScore(), settings));

  const diagrams = Object.keys(shapes).map(name => diagram(name, shapes[name])).join('');
  const facts = [
    song.capo && `Capo <b>${song.capo}</b>`,
    song.capo && 'Frets relative to capo',
    song.tuning && `Tuning <b>${song.tuning.map(n => n.replace(/\d/, '')).join(' ')}</b>`,
    song.key && `Sounds in <b>${song.key}</b>`,
  ].filter(Boolean);
  const fill = (template, extra) => fs.readFileSync(path.join(root, 'templates', template), 'utf8')
    .replaceAll('__TITLE__', esc(song.title))
    .replaceAll('__ARTIST__', esc(song.artist))
    .replace('__NOTE__', song.note ? `<p class="note">${song.note}</p>` : '')
    .replace('__DIAGRAMS__', () => diagrams)
    .replace('__FACTS__', () => extra(facts).map(f => `<span class="fact">${f}</span>`).join('\n      '));

  fs.writeFileSync(path.join(dir, 'index.html'), fill('tab.html', f => [...f, `<b>${num}/${den}</b>`, `♩ = <b>${song.tempo}</b>`]).replace('__TEX__', () => tex));
  fs.writeFileSync(path.join(dir, 'chords.html'), fill('chords.html', f => f)
    .replace('__SHEET__', () => song.sheet.map(([name, lines]) => `<section><h2>[${esc(name)}]</h2><pre>${lines.map(renderLine).join('\n')}</pre></section>`).join('')));
  return { slug, ...song };
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

function diagram(name, { frets, thumb }) {
  const fretted = frets.filter(f => f);
  const first = Math.max(...fretted) > 4 ? Math.min(...fretted) : 1;
  const x = i => 14 + i * 10;
  const marks = frets.map((f, i) => {
    if (f === null) return `<text x="${x(i)}" y="9" text-anchor="middle" font-size="9">×</text>`;
    if (f === 0) return `<circle cx="${x(i)}" cy="6" r="3" fill="none" stroke="currentColor"/>`;
    const cy = 12 + (f - first + 0.5) * 12;
    if (thumb && i === 0) return `<circle cx="${x(i)}" cy="${cy}" r="4.6" fill="currentColor"/><text x="${x(i)}" y="${cy + 2.6}" text-anchor="middle" font-size="7" font-weight="700" style="fill: var(--thumb-text, #fff)">T</text>`;
    return `<circle cx="${x(i)}" cy="${cy}" r="3.6" fill="currentColor"/>`;
  });
  const lines = [
    ...[0, 1, 2, 3, 4, 5].map(i => `<line x1="${x(i)}" y1="12" x2="${x(i)}" y2="72" stroke="currentColor" stroke-width=".8"/>`),
    ...[0, 1, 2, 3, 4, 5].map(j => `<line x1="14" y1="${12 + j * 12}" x2="64" y2="${12 + j * 12}" stroke="currentColor" stroke-width="${j === 0 && first === 1 ? 3 : .8}"/>`),
  ];
  const label = first > 1 ? `<text x="7" y="${12 + 0.5 * 12 + 3}" text-anchor="middle" font-size="9" fill="currentColor">${first}</text>` : '';
  return `<figure><figcaption>${esc(name)}</figcaption><svg viewBox="0 0 72 76" role="img" aria-label="${esc(name)}: ${frets.map(f => f ?? 'x').join('')}" fill="currentColor" font-family="ui-monospace, Menlo, monospace">${lines.join('')}${marks.join('')}${label}</svg></figure>`;
}

function buildHome() {
  const items = songs.sort((a, b) => a.title.localeCompare(b.title)).map(s =>
    `<li><a href="${s.slug}/"><b>${esc(s.title)}</b> <span>· ${esc(s.artist)}${s.capo ? ` · capo ${s.capo}` : ''}</span></a><a class="alt" href="${s.slug}/chords.html">Chords</a></li>`);
  fs.writeFileSync(path.join(root, 'index.html'), fs.readFileSync(path.join(root, 'templates', 'home.html'), 'utf8').replace('__SONGS__', () => items.join('\n    ')));
}
