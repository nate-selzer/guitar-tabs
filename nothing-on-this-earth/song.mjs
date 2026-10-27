// Chord shapes: low E -> high e, null = muted. `bass` lists the string indexes boom-chuck alternates through;
// `thumb` marks a low-E note fretted with the thumb. Chords not listed here come from ../chords.mjs.
// Outro bars: bass then B, D, B in 16ths with the G string unpicked; the C bars mute the A string on beats 2 and 4.
const outroBar = (chord, half) => [...half, ...half]
  .map((n, i) => (n === 'x' ? 'x.5.16' : `${n}{lr}.16`) + (i === 0 ? ` {ch "${chord}"}` : ''))
  .join(' ');
const outroC = outroBar('C (barre)', ['3.5', '5.2', '5.4', '5.2', 'x', '5.2', '5.4', '5.2']);
const outroDdim = outroBar('Ddim7', ['5.5', '6.2', '6.4', '6.2', '5.5', '6.2', '6.4', '6.2']);

// Beats 1/3 pinch D+B on the "and"; beats 2/4 play G, D, B on the "e", "and", "a".
const pinch = (c, quarters, fx, state, { note, bassStrings }) => {
  const out = [];
  for (let k = 0; k < quarters; k++) {
    const strs = bassStrings(c);
    const bass = note(c, strs[state.alt++ % strs.length]);
    const tag = k === 0 && fx ? ` {${fx}}` : '';
    const [D, G, B] = [note(c, 2), note(c, 3), note(c, 4)];
    // Cmaj7's B holds through beat 4 (no bass), then C7 plays G, D on the "e", "and".
    if (c === 'Cmaj7') out.push(`${bass}.16${tag}`, `${G}.16`, `${D}.16`, `${B}.8`);
    else if (c === 'C7') out.push(`${G}.16${tag}`, `${D}.8`);
    else if ((state.pos + k) % 2 === 0) out.push(`${bass}.8${tag}`, `(${D} ${B}).8`);
    else out.push(`${bass}.16${tag}`, `${G}.16`, `${D}.16`, `${B}.16`);
  }
  return out;
};

export default {
  title: 'Nothing on This Earth Can Make Me Smile',
  artist: 'Dougie Poole',
  capo: 2,
  key: 'D',
  tempo: 80,
  ring: 0.5,
  pattern: 'pinch',
  patterns: {
    pinch,
    // F/G: pinch on 3 "and", G string 0 hammered to 2 from 3 "a" onto beat 4 with the bass, then B, D (held).
    fgVariation1: (c, quarters, fx, state, h) => c !== 'F/G' ? pinch(c, quarters, fx, state, h) : [
      `${h.note(c, 0)}.8${fx ? ` {${fx}}` : ''}`, `(${h.note(c, 2)} ${h.note(c, 4)}).16`, '0.3{lr h}.16',
      `(${h.note(c, 0)} 2.3{lr}).16`, `${h.note(c, 4)}.16`, `${h.note(c, 2)}.8`,
    ],
  },
  note: '<b>Thumb over the neck.</b> F, F/G, Am6/F#, Am/F# and A♭dim fret the low E string with your thumb wrapped over the top of the neck (marked <b>T</b> in the chord boxes). Your fingers then handle the D, G and B strings. The shapes look impossible as normal fingerings, but they\'re right.',
  chords: {
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
    'Am':        { frets: [null,0,2,2,1,null] },
    'Am/F#':     { frets: [2,null,2,2,1,null], thumb: true },
    'A♭dim':     { frets: [4,null,0,4,3,null], thumb: true },
    'Cmaj7 (end)': { frets: [null,3,5,0,5,7] },
  },
  // [chord|null, quarter beats, verse 1 lyric, verse 2 lyric]; { raw } is literal alphaTex.
  bars: [
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
    { beats: [['Am', 2, 'ooh'], ['Am/F#', 2]] },
    { beats: [['Am', 2, 'ooh'], ['Am/F#', 2]] },
    { beats: [['F', 2, 'ooh'], ['Em7', 2]] },
    { beats: [['C', 2, 'ooh'], ['Cadd9', 2]] },
    { beats: [['Am', 2, 'ooh'], ['Am/F#', 2]] },
    { beats: [['Am', 2, 'ooh'], ['Am/F#', 2]] },
    { beats: [['F', 2, 'ooh'], ['Em7', 2]] },
    { beats: [['F', 2], ['A♭dim', 2]] },
    { doubleBar: true, beats: [['C/G', 3], ['C/G', 1, 'I like my']] },
    { beats: [['C/G', 2, 'toast with'], ['Cmaj7/G', 2, 'jam, love, my']] },
    { beats: [['Ddim7', 2, 'coffee'], ['C (barre)', 2, 'mild. My']] },
    { beats: [['C (barre)', 1, 'troubles'], ['C (barre)', 1, 'stacked like'], ['Cmaj7', 1, 'dishes'], ['C7', 1, 'in a']] },
    { beats: [['Am6', 2, 'crooked'], ['Am6/F#', 2, 'pile, and']] },
    { beats: [['F', 2, 'nothing on this'], ['F/G', 2, 'earth can make me']] },
    { beats: [['C', 1, 'smile,'], ['Gadd4/B', 1, 'no,'], ['Am6/F#', 1, 'no'], ['Am6/F#', 1]] },
    { pattern: 'fgVariation1', beats: [['F', 2, 'nothing on this'], ['F/G', 2, 'earth can make me']] },
    { beats: [['C', 1, 'smile,'], ['Gadd4/B', 1, 'I'], ['Am6/F#', 1, 'told you'], ['Am6/F#', 1]] },
    { beats: [['F', 2, 'nothing on this'], ['F/G', 2, 'earth can make me']] },
    { doubleBar: true, beats: [['C/G', 4, 'smile']] },
    { beats: [{ raw: outroC }] },
    { beats: [{ raw: outroDdim }] },
    { beats: [{ raw: outroC }] },
    { beats: [{ raw: outroDdim }] },
    { beats: [{ raw: outroC }] },
    { beats: [{ raw: outroDdim }] },
    { beats: [{ raw: outroC }] },
    { beats: [{ raw: outroDdim }] },
    { beats: [{ raw: '(3.5{lr} 5.4{lr} 0.3{lr} 5.2{lr} 7.1{lr}).1 {ch "Cmaj7 (end)"}' }] },
  ],
  sheet: [
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
      [['Am', 'ooh '], ['Am/F#', ''], ['Am', 'ooh '], ['Am/F#', '']],
      [['F', 'ooh '], ['Em7', ''], ['C', 'ooh '], ['Cadd9', '']],
      [['Am', 'ooh '], ['Am/F#', ''], ['Am', 'ooh '], ['Am/F#', '']],
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
      [['C (barre)', ''], ['Ddim7', ''], ['C (barre)', ''], ['Ddim7', ''], ['C (barre)', ''], ['Ddim7', ''], ['C (barre)', ''], ['Ddim7', ''], ['Cmaj7 (end)', '']],
      '(one bar each, fingerpicked in 16ths; mute the A string on beats 2 and 4 of the C bars)',
    ]],
  ],
};
