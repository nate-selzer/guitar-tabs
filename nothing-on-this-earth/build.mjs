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
  'Am6/F#':    { frets: [2,null,4,2,1,null] },
  'F':         { frets: [1,null,3,2,1,null] },
  'F/G':       { frets: [3,null,3,2,1,null] },
  'C':         { frets: [null,3,2,0,1,null] },
  'Gadd4/B':   { frets: [null,2,0,0,1,null] },
  'Em7':       { frets: [0,null,2,0,3,null] },
  'Cadd9':     { frets: [null,3,2,0,3,null] },
  'A♭dim':     { frets: [4,null,0,4,3,null] },
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

// [chord|null, quarter beats, verse 1 lyric, verse 2 lyric]
const bars = [
  { section: 'Verses 1 & 2', ac: true, beats: [[null, 1, 'I seen the']] },
  { repeatStart: true, beats: [['C/G', 2, '1. plague of', '2. sweetest thing'], ['Cmaj7/G', 2, 'locusts, the', "that I've"]] },
  { beats: [['Ddim7', 2, 'plague of', 'ever'], ['C (barre)', 2, "lice, an'", 'seen']] },
  { beats: [['C (barre)', 1, 'ocean', 'A photo-'], ['C (barre)', 1, 'split right', 'cake, for'], ['Cmaj7', 1, 'down the', 'goodness'], ['C7', 1, 'middle', 'sake']] },
  { beats: [['Am6', 2, "Ain't that nice,", 'Devotion iced in green'], ['Am6/F#', 2, 'oh honey', 'oh, honey']] },
  { beats: [['F', 2, "Nothin' on this earth", 'nothing on this earth'], ['F/G', 2, 'could make me', 'can make me']] },
  { beats: [['C', 1, 'smile,', 'smile,'], ['Gadd4/B', 1, 'I told', 'I told'], ['Am6/F#', 1, 'ya', 'you'], ['Am6/F#', 1]] },
  { beats: [['F', 2, "Nothin' on this earth", 'nothing on this earth'], ['F/G', 2, 'could make me', 'can make me']] },
  { ending: 1, beats: [['C/G', 4, 'smile']] },
  { ending: 1, repeatEnd: 2, beats: [['C/G', 2], ['C/G', 2, "Well it's the"]] },
  { ending: 2, beats: [['C/G', 3, '', 'smile'], { raw: '3.5.8 2.5.8' }] },
  { label: 'INTERLUDE', beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['F', 2, 'ooh'], ['Em7', 2]] },
  { beats: [['C', 2, 'ooh'], ['Cadd9', 2]] },
  { beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['Am6', 2, 'ooh'], ['Am6/F#', 2]] },
  { beats: [['F', 2, 'ooh'], ['Em7', 2]] },
  { beats: [['F', 2], ['A♭dim', 2]] },
  { beats: [['C/G', 3], ['C/G', 1, 'I like my']] },
  { label: 'VERSE 3', beats: [['C/G', 2, 'toast with'], ['Cmaj7/G', 2, 'jam, love, my']] },
  { beats: [['Ddim7', 2, 'coffee'], ['C (barre)', 2, 'mild. My']] },
  { beats: [['C (barre)', 1, 'troubles'], ['C (barre)', 1, 'stacked like'], ['Cmaj7', 1, 'dishes'], ['C7', 1, 'in a']] },
  { beats: [['Am6', 2, 'crooked pile,'], ['Am6/F#', 2, 'and']] },
  { beats: [['F', 2, 'nothing on this earth'], ['F/G', 2, 'can make me']] },
  { beats: [['C', 1, 'smile,'], ['Gadd4/B', 1, 'no,'], ['Am6/F#', 1, 'no'], ['Am6/F#', 1]] },
  { beats: [['F', 2, 'nothing on this earth'], ['F/G', 2, 'can make me']] },
  { beats: [['C', 1, 'smile,'], ['Gadd4/B', 1, 'I told'], ['Am6/F#', 1, 'you'], ['Am6/F#', 1]] },
  { beats: [['F', 2, 'nothing on this earth'], ['F/G', 2, 'can make me']] },
  { beats: [['C/G', 4, 'smile']] },
  { beats: [{ raw: '(3.5 1.2).8 {ch "C/G" txt "OUTRO (fingerpicked)"} 0.3.8 2.4.8 1.2.8 3.6.8 0.3.8 2.4.8 1.2.8' }] },
  { beats: [{ raw: '(0.4 3.2).8 {ch "Ddim"} 1.3.8 0.4.8 3.2.8 0.4.8 1.3.8 0.4.8 3.2.8' }] },
  { beats: [{ raw: '(3.5 1.2).8 {ch "C/G"} 0.3.8 2.4.8 1.2.8 3.6.8 0.3.8 2.4.8 1.2.8' }] },
  { beats: [{ raw: '(0.4 3.2).8 {ch "Ddim"} 1.3.8 0.4.8 3.2.8 0.4.8 1.3.8 0.4.8 3.2.8' }] },
  { beats: [{ raw: '(3.5 2.4 0.3 1.2).1 {ch "C/G"}' }] },
];

const lyrics = lines => lines.map((t, i) => (t ? `lyrics ${i} ${q(t)}` : '')).filter(Boolean).join(' ');

// Boom-chuck in eighths: bass note, then the chord without its bass strings.
const renderBar = ({ beats, label, endLabel }) => {
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
      const lbl = label && prev === null && k === 0 ? ` {txt ${q(label)}}` : '';
      out.push(`${note(c, s)}.8${fx ? ` {${fx}}` : ''}`, `${chuck(c)}.8${lbl}`);
    }
    prev = c;
    return out;
  });
  if (endLabel) out[out.length - 1] += ` {txt ${q(endLabel)}}`;
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
    b.section ? `\\section ${q(b.section)}` : '',
    b.ac ? '\\ac' : '',
    b.repeatStart ? '\\ro' : '',
    b.ending ? `\\ae (${b.ending})` : '',
    b.repeatEnd ? `\\rc ${b.repeatEnd}` : '',
    renderBar(b),
  ].filter(Boolean).join(' ')).join(' |\n'),
].join('\n');

fs.writeFileSync(path.join(here, 'song.tex'), tex);
const settings = new alphaTab.Settings();
const imp = new alphaTab.importer.AlphaTexImporter();
imp.initFromString(tex, settings);
fs.writeFileSync(path.join(here, 'Nothing on This Earth Can Make Me Smile.gp'), new alphaTab.exporter.Gp7Exporter().export(imp.readScore(), settings));

// `node build.mjs --artifact <file>` writes a claude.ai artifact body with assets at the root instead of index.html.
const artifactOut = process.argv[process.argv.indexOf('--artifact') + 1];
const page = fs.readFileSync(path.join(here, 'template.html'), 'utf8')
  .replace('__TEX__', tex)
  .replaceAll('__VENDOR__', process.argv.includes('--artifact') ? '' : '../vendor/alphatab/');
if (process.argv.includes('--artifact')) {
  fs.writeFileSync(artifactOut, page);
} else {
  const head = '<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';
  fs.writeFileSync(path.join(here, 'index.html'), head + page);
}
