import * as alphaTab from '@coderline/alphatab';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

// low E -> high e, null = muted. bass: [string index, ...] alternated within a bar.
const shapes = {
  'C/G':       { frets: [3,3,2,0,1,null], bass: [1, 0] },
  'Cmaj7/G':   { frets: [3,3,2,0,0,null], bass: [1, 0] },
  'Ddim7':     { frets: [null,5,6,4,6,null] },
  'C (barre)': { frets: [null,3,5,5,5,null] },
  'Cmaj7':     { frets: [null,3,5,4,5,null] },
  'C7':        { frets: [null,3,5,3,5,null] },
  'Am6':       { frets: [null,0,4,2,1,null] },
  'Am6/F#':    { frets: [2,null,4,2,1,null], thumb: true },
  'F':         { frets: [1,null,3,2,1,null], thumb: true },
  'F/G':       { frets: [3,null,3,2,1,null], thumb: true },
  'C':         { frets: [null,3,2,0,1,null] },
  'Gadd4/B':   { frets: [null,2,0,0,1,null] },
  'Em7':       { frets: [0,null,2,0,3,null] },
  'Cadd9':     { frets: [null,3,2,0,3,null] },
  'A♭dim':     { frets: [4,null,0,4,3,null], thumb: true },
  'Ddim':      { frets: [null,null,0,1,3,null] },
};
const q = s => `"${s.replace(/"/g, '\\"')}"`;
const note = (n, i) => `${shapes[n].frets[i]}.${6 - i}`;
const bassStrings = n => shapes[n].bass ?? [shapes[n].frets.findIndex(f => f !== null)];
const chuck = n => {
  const lowest = Math.max(...shapes[n].frets.map((f, i) => (f !== null && i < 2 ? i : -1)));
  return '(' + shapes[n].frets.map((f, i) => (f === null || i <= lowest ? null : note(n, i))).filter(Boolean).join(' ') + ')';
};
const firstFret = n => {
  const fretted = shapes[n].frets.filter(f => f);
  return Math.max(...fretted) > 4 ? ` {firstfret ${Math.min(...fretted)}}` : '';
};
const chordDef = n => `\\chord (${q(n)} ${[...shapes[n].frets].reverse().map(f => f ?? 'x').join(' ')})${firstFret(n)}`;

// Outro picking patterns, played twice per bar in 16ths.
const travisC = ['(3.5 1.2)', '0.3', '2.4', '1.2', '3.6', '0.3', '2.4', '1.2'];
const pickDdim = ['(0.4 3.2)', '1.3', '0.4', '3.2', '0.4', '1.3', '0.4', '3.2'];
const pick = (chord, notes) => [...notes, ...notes]
  .map((n, i) => `${n}.16${i === 0 ? ` {ch ${q(chord)}}` : ''}`)
  .join(' ');

// [chord|null, quarter beats, verse 1 lyric, verse 2 lyric]
const bars = [
  { ac: true, beats: [[null, 1, 'I seen the']] },
  { repeatStart: true, beats: [['C/G', 2, '1. plague of', '2. sweetest thing'], ['Cmaj7/G', 2, 'locusts, the', "that I've"]] },
  { beats: [['Ddim7', 2, 'plague of', 'ever'], ['C (barre)', 2, "lice, an", 'seen']] },
  { beats: [['C (barre)', 1, 'ocean', 'A photo-'], ['C (barre)', 1, 'split right', 'cake, for'], ['Cmaj7', 1, 'down the', 'goodness'], ['C7', 1, 'middle', 'sake']] },
  { beats: [['Am6', 2, "Ain't that", 'Devotion iced in'], ['Am6/F#', 2, 'nice, oh honey', 'green, oh, honey']] },
  { beats: [['F', 2, "Nothin' on this", 'nothing on this'], ['F/G', 2, 'earth could make me', 'earth can make me']] },
  { beats: [['C', 1, 'smile,', 'smile,'], ['Gadd4/B', 1, 'I', 'I'], ['Am6/F#', 1, 'told ya', 'told you'], ['Am6/F#', 1]] },
  { beats: [['F', 2, "Nothin' on this", 'nothing on this'], ['F/G', 2, 'earth could make me', 'earth can make me']] },
  { ending: 1, beats: [['C/G', 4, 'smile']] },
  { ending: 1, repeatEnd: 2, beats: [['C/G', 2], ['C/G', 2, "Well it's the"]] },
  { ending: 2, beats: [['C/G', 3, '', 'smile'], { raw: '3.5.8 2.5.8' }] },
  { beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['F', 2, 'ooh'], ['Em7', 2]] },
  { beats: [['C', 2, 'ooh'], ['Cadd9', 2]] },
  { beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['F', 2, 'ooh'], ['Em7', 2]] },
  { beats: [['F', 2], ['A♭dim', 2]] },
  { doubleBar: true, beats: [['C/G', 3], ['C/G', 1, 'I like my']] },
  { beats: [['C/G', 2, 'toast with'], ['Cmaj7/G', 2, 'jam, love, my']] },
  { beats: [['Ddim7', 2, 'coffee'], ['C (barre)', 2, 'mild. My']] },
  { beats: [['C (barre)', 1, 'troubles'], ['C (barre)', 1, 'stacked like'], ['Cmaj7', 1, 'dishes'], ['C7', 1, 'in a']] },
  { beats: [['Am6', 2, 'crooked'], ['Am6/F#', 2, 'pile, and']] },
  { beats: [['F', 2, 'nothing on this'], ['F/G', 2, 'earth can make me']] },
  { beats: [['C', 1, 'smile,'], ['Gadd4/B', 1, 'no,'], ['Am6/F#', 1, 'no'], ['Am6/F#', 1]] },
  { beats: [['F', 2, 'nothing on this'], ['F/G', 2, 'earth can make me']] },
  { beats: [['C', 1, 'smile,'], ['Gadd4/B', 1, 'I'], ['Am6/F#', 1, 'told you'], ['Am6/F#', 1]] },
  { beats: [['F', 2, 'nothing on this'], ['F/G', 2, 'earth can make me']] },
  { doubleBar: true, beats: [['C/G', 4, 'smile']] },
  { beats: [{ raw: pick('C/G', travisC) }] },
  { beats: [{ raw: pick('Ddim', pickDdim) }] },
  { beats: [{ raw: pick('C/G', travisC) }] },
  { beats: [{ raw: pick('Ddim', pickDdim) }] },
  { beats: [{ raw: '(3.5 2.4 0.3 1.2).1 {ch "C/G"}' }] },
];

// Lyric line 0 holds section names so they stack above the verse lines instead of overlapping them.
const lyrics = lines => lines.map((t, i) => (t ? `lyrics ${i} ${q(t)}` : '')).filter(Boolean).join(' ');

// Boom-chuck in eighths: bass note, then the chord without its bass strings.
const renderBar = ({ beats }) => {
  let alt = 0;
  let prev = null;
  const out = beats.flatMap(entry => {
    if (entry.raw) return [entry.raw];
    const [c, quarters, ...lines] = entry;
    if (!c) return [`r.4 {${lyrics(lines)}}`];
    const out = [];
    for (let k = 0; k < quarters; k++) {
      const strs = bassStrings(c);
      const s = strs[alt++ % strs.length];
      const fx = k === 0 ? [c !== prev && `ch ${q(c)}`, lyrics(lines)].filter(Boolean).join(' ') : '';
      out.push(`${note(c, s)}.8${fx ? ` {${fx}}` : ''}`, `${chuck(c)}.8`);
    }
    prev = c;
    return out;
  });
  return out.join(' ');
};

const tex = [
  `\\title "Nothing on This Earth Can Make Me Smile"`,
  `\\artist "Dougie Poole"`,
  `\\tempo 80`,
  '.',
  `\\track "Guitar"`,
  `\\staff {tabs}`,
  `\\capo 2`,
  ...Object.keys(shapes).map(chordDef),
  bars.map((b, i) => [
    i === 0 ? '\\ts (4 4)' : '',
    b.ac ? '\\ac' : '',
    b.repeatStart ? '\\ro' : '',
    b.ending ? `\\ae (${b.ending})` : '',
    b.repeatEnd ? `\\rc ${b.repeatEnd}` : '',
    b.doubleBar ? '\\db' : '',
    renderBar(b),
  ].filter(Boolean).join(' ')).join(' |\n'),
].join('\n');

fs.writeFileSync(path.join(here, 'song.tex'), tex);
const settings = new alphaTab.Settings();
const imp = new alphaTab.importer.AlphaTexImporter();
imp.initFromString(tex, settings);
fs.writeFileSync(path.join(here, 'Nothing on This Earth Can Make Me Smile.gp'), new alphaTab.exporter.Gp7Exporter().export(imp.readScore(), settings));

// Chord sheet: each line is [chord|null, lyric] segments; a plain string is a note.
const sheet = [
  ['Verse 1', [
    [[null, 'I seen the '], ['C/G', 'plague of '], ['Cmaj7/G', 'locusts, the']],
    [['Ddim7', 'plague of '], ['C (barre)', "lice, an"]],
    [['C (barre)', 'ocean split right '], ['Cmaj7', 'down the '], ['C7', 'middle']],
    [['Am6', "Ain't that "], ['Am6/F#', 'nice, oh honey']],
    [['F', "Nothin' on this "], ['F/G', 'earth could make me']],
    [['C', 'smile, '], ['Gadd4/B', 'I '], ['Am6/F#', 'told ya']],
    [['F', "Nothin' on this "], ['F/G', 'earth could make me']],
    [['C/G', 'smile']],
  ]],
  ['Verse 2', [
    [[null, "Well it's the "], ['C/G', 'sweetest thing '], ['Cmaj7/G', "that I've"]],
    [['Ddim7', 'ever '], ['C (barre)', 'seen']],
    [['C (barre)', 'A photo-cake, for '], ['Cmaj7', 'goodness '], ['C7', 'sake']],
    [['Am6', 'Devotion iced in '], ['Am6/F#', 'green, oh, honey']],
    [['F', 'nothing on this '], ['F/G', 'earth can make me']],
    [['C', 'smile, '], ['Gadd4/B', 'I '], ['Am6/F#', 'told you']],
    [['F', 'nothing on this '], ['F/G', 'earth can make me']],
    [['C/G', 'smile']],
    '(bass walks C–B into the interlude)',
  ]],
  ['Interlude', [
    [['Am6', 'ooh '], ['Am6/F#', ''], ['Am6', 'ooh '], ['Am6/F#', '']],
    [['F', 'ooh '], ['Em7', ''], ['C', 'ooh '], ['Cadd9', '']],
    [['Am6', 'ooh '], ['Am6/F#', ''], ['Am6', 'ooh '], ['Am6/F#', '']],
    [['F', 'ooh '], ['Em7', ''], ['F', ''], ['A♭dim', '']],
    [['C/G', '']],
  ]],
  ['Verse 3', [
    [[null, 'I like my '], ['C/G', 'toast with '], ['Cmaj7/G', 'jam, love, my']],
    [['Ddim7', 'coffee '], ['C (barre)', 'mild. My']],
    [['C (barre)', 'troubles stacked like '], ['Cmaj7', 'dishes '], ['C7', 'in a']],
    [['Am6', 'crooked '], ['Am6/F#', 'pile, and']],
    [['F', 'nothing on this '], ['F/G', 'earth can make me']],
    [['C', 'smile, '], ['Gadd4/B', 'no, '], ['Am6/F#', 'no']],
    [['F', 'nothing on this '], ['F/G', 'earth can make me']],
    [['C', 'smile, '], ['Gadd4/B', 'I '], ['Am6/F#', 'told you']],
    [['F', 'nothing on this '], ['F/G', 'earth can make me']],
    [['C/G', 'smile']],
  ]],
  ['Outro', [
    [['C/G', ''], ['Ddim', ''], ['C/G', ''], ['Ddim', ''], ['C/G', '']],
    '(fingerpicked in 16ths)',
  ]],
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const renderLine = line => {
  if (typeof line === 'string') return `<i>${esc(line)}</i>`;
  let chords = '';
  let lyric = '';
  for (const [c, t] of line) {
    const width = Math.max(t.length, c ? c.length + 1 : 0);
    chords += c ? `<b>${esc(c)}</b>${' '.repeat(width - c.length)}` : ' '.repeat(width);
    lyric += t.padEnd(width);
  }
  return [chords.trimEnd(), esc(lyric.trimEnd())].filter(Boolean).join('\n');
};

const diagram = name => {
  const { frets, thumb } = shapes[name];
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
};

if (!process.argv.includes('--artifact')) {
  const chordsPage = fs.readFileSync(path.join(here, 'chords.template.html'), 'utf8')
    .replace('__DIAGRAMS__', Object.keys(shapes).map(diagram).join(''))
    .replace('__SHEET__', sheet.map(([name, lines]) => `<section><h2>[${esc(name)}]</h2><pre>${lines.map(renderLine).join('\n')}</pre></section>`).join(''));
  fs.writeFileSync(path.join(here, 'chords.html'), chordsPage);
}

// `node build.mjs --artifact <file>` writes a claude.ai artifact body with assets at the root instead of index.html.
const artifactOut = process.argv[process.argv.indexOf('--artifact') + 1];
const page = fs.readFileSync(path.join(here, 'template.html'), 'utf8')
  .replace('__TEX__', tex)
  .replace('__DIAGRAMS__', () => Object.keys(shapes).map(diagram).join(''))
  .replace('__NAV__', process.argv.includes('--artifact') ? '' : '<nav class="views"><a href="./" aria-current="page">Tab</a><a href="chords.html">Chords</a></nav>')
  .replaceAll('__VENDOR__', process.argv.includes('--artifact') ? '' : '../vendor/alphatab/');
if (process.argv.includes('--artifact')) {
  fs.writeFileSync(artifactOut, page);
} else {
  const head = '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';
  fs.writeFileSync(path.join(here, 'index.html'), head + page);
}
