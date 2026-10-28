// Chord shapes: low E -> high e, null = muted. `bass` lists the string indexes boom-chuck alternates through;
// `thumb` marks a low-E note fretted with the thumb. Chords not listed here come from ../chords.mjs.
// Outro bars: bass then B, D, B in 16ths with the G string unpicked; the C bars mute the A string on beats 2 and 4.
const outroBar = (chord, half, words) => [...half, ...half]
  .map((n, i) => (n === 'x' ? 'x.5.16' : `${n}{lr}.16`) + (i === 0 ? ` {ch "${chord}"${words ? ` lyrics 0 "${words}"` : ''}}` : ''))
  .join(' ');
const OUTRO_C = ['3.5', '5.2', '5.4', '5.2', 'x', '5.2', '5.4', '5.2'];
const outroC = outroBar('C (barre)', OUTRO_C);
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

// Bar figures from the editor; %L% marks where each lyric fragment goes.
const lyric = t => (t ? ` lyrics 0 "${t}"` : '');
const fill = (tpl, lyrics = []) => { const rest = [...lyrics]; return { beats: [{ raw: tpl.replace(/%L%/g, () => lyric(rest.shift())) }] }; };
const GRACE_E = '0.6{lr h}.16 {gr} ';
const AM6 = `0.5{lr}.8 {ch "Am6"%L%} (1.2{lr} 4.4{lr}).8 0.5{lr}.16 2.3{lr}.16 4.4{lr}.16 1.2{lr}.16 ${GRACE_E}2.6{lr}.8 {ch "Am6/F#"%L%} (1.2{lr} 4.4{lr}).8 2.6{lr}.16 2.3{lr}.16 4.4{lr}.16 1.2{lr}.16`;
const SMILE_TOLD = '3.5{lr}.8 {ch "C"%L%} (1.2{lr} 2.4{lr}).16 0.5{lr h}.16 2.5{lr}.16 {ch "Gadd4/B"%L%} 0.3{lr}.16 0.4{lr}.16 1.2{lr}.16 2.6{lr}.8 {ch "Am6/F#"%L%} (1.2{lr} 4.4{lr}).8 2.6{lr}.16 2.3{lr}.16 4.4{lr}.16 1.2{lr}.16';
const F_HALF = '1.6{lr}.8 {ch "F"%L%} (1.2{lr} 3.4{lr}).8 1.6{lr}.16 2.3{lr}.16 3.4{lr}.16 1.2{lr}.16';
const F_HALF_V2 = '1.6{lr}.8 {ch "F"%L%} (3.1{lr} 3.4{lr}).8 1.6{lr}.16 0.1{lr}.16 3.4{lr}.8';
const FG_HALF = '3.6{lr}.8 {ch "F/G"%L%} (1.2{lr} 3.4{lr}).16 0.3{lr h}.16 (2.3{lr} 3.6{lr}).16 1.2{lr}.16 3.4{lr}.8';
// Variation 1: plain F, then F/G with the G-string hammer-on. Variation 2 adds the high-e fill to the F half.
const fBar = (variation, grace) => (grace ? GRACE_E : '') + (variation === 2 ? F_HALF_V2 : F_HALF) + ' ' + FG_HALF;
const AM_B = '0.5{lr}.8 {ch "Am"%L%} (3.1{st} 1.2{st} 2.3{st} 2.4{st}).8 0.5{lr}.16 0.1{lr}.16 2.4{lr}.8 2.6{lr}.16 {ch "Am/F#"} 2.3{lr}.16 2.4{lr}.16 0.1{lr ac}.16 2.6{lr}.16 3.1{lr}.16 2.4{lr}.8';
const F_EM7_1 = '1.6{lr}.8 {ch "F"%L%} (1.2{lr} 3.4{lr}).8 1.6{lr}.16 2.3{lr}.16 3.4{lr}.16 0.2{lr}.16 0.6{lr}.16 {ch "Em7"} 0.3{lr}.16 2.4{lr}.16 0.1{lr ac}.16 x.6.16 3.2{lr}.16 (0.3{lr} 2.4{lr}).8';
const F_EM7_2 = '1.6{lr}.8 {ch "F"%L%} (1.2{lr} 3.4{lr}).8 1.6{lr}.16 2.3{lr}.16 3.4{lr}.16 1.2{lr}.16 0.6{lr}.16 {ch "Em7"} 0.3{lr}.16 2.4{lr}.16 0.1{lr ac}.16 x.6.16 3.2{lr}.16 (0.3{lr} 2.4{lr}).8';
const C_CADD9 = '3.5{lr}.8 {ch "C"%L%} (1.2{lr} 2.4{lr}).8 3.5{lr}.16 0.3{lr}.16 2.4{lr}.16 0.2{lr}.16 3.5{lr}.16 {ch "Cadd9"} 3.2{lr}.16 2.4{lr}.16 0.1{lr ac}.16 x.5.16 3.2{lr}.16 (0.3{lr} 2.4{lr}).8';
const F_ABDIM = '1.6{lr}.8 {ch "F"%L%} (1.2{lr} 3.4{lr}).8 1.6{lr}.16 2.3{lr}.16 3.4{lr}.16 1.2{lr}.16 4.6{lr}.16 {ch "A♭dim"} 3.2{lr}.16 0.4{lr}.16 0.1{lr ac}.16 x.6.16 3.2{lr}.16 (4.3{lr} 0.4{lr}).8';

// One A section (8 bars): lyrics[i] are bar i's fragments, pickup lands on beat 4 of bar 8, last replaces bar 8.
const A = ({ lyrics = [], variation = 1, pickup, last } = {}) => {
  const L = i => lyrics[i] ?? [];
  return [
    { beats: [['C/G', 2, L(0)[0]], ['Cmaj7/G', 2, L(0)[1]]] },
    { beats: [['Ddim7', 2, L(1)[0]], ['C (barre)', 2, L(1)[1]]] },
    { beats: [['C (barre)', 1, L(2)[0]], ['C (barre)', 1, L(2)[1]], ['Cmaj7', 1, L(2)[2]], ['C7', 1, L(2)[3]]] },
    fill(AM6, L(3)),
    fill(fBar(variation, true), L(4)),
    fill(SMILE_TOLD, L(5)),
    fill(fBar(variation, false), L(6)),
    last ?? (pickup ? { beats: [['C/G', 3, L(7)[0]], ['C/G', 1, pickup]] } : { beats: [['C/G', 4, L(7)[0]]] }),
  ];
};
const sectionEnd = bars => [...bars.slice(0, -1), { ...bars.at(-1), doubleBar: true }];

const LYRICS = {"pickups":["I seen the","Well it's the","I like my"],"ooh":"ooh","verse1":[["plague of","locusts, the"],["plague of","lice, an"],["ocean","split right","down the","middle"],["Ain't that","nice, oh honey"],["Nothin' on this","earth could make me"],["smile,","I","told ya",""],["Nothin' on this","earth could make me"],["smile"]],"verse2":[["sweetest thing","that I've"],["ever","seen"],["A photo-","cake, for","goodness","sake"],["Devotion iced in","green, oh, honey"],["nothing on this","earth can make me"],["smile,","I","told you",""],["nothing on this","earth can make me"],["smile"]],"verse3":[["toast with","jam, love, my"],["coffee","mild. My"],["troubles","stacked like","dishes","in a"],["crooked","pile, and"],["nothing on this","earth can make me"],["smile,","no,","no",""],["nothing on this","earth can make me"],["smile,","I","told you",""],["nothing on this","earth can make me"],["smile"]]};

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
  bars: [
    ...sectionEnd(A({ variation: 2, pickup: LYRICS.pickups[0] })), // Intro
    ...A({ lyrics: LYRICS.verse1 }), // Verse 1
    { doubleBar: true, beats: [['C/G', 4]] }, // extra bar of C
    ...sectionEnd(A({ pickup: LYRICS.pickups[1] })), // Slide guitar interlude
    ...sectionEnd(A({ lyrics: LYRICS.verse2, last: { beats: [['C/G', 3, LYRICS.verse2[7][0]], { raw: '3.5.8 2.5.8' }] } })), // Verse 2, walking down
    ...sectionEnd([AM_B, AM_B, F_EM7_1, C_CADD9].map(tpl => fill(tpl, [LYRICS.ooh]))), // Interlude
    ...sectionEnd([...[AM_B, AM_B, F_EM7_2].map(tpl => fill(tpl, [LYRICS.ooh])), fill(F_ABDIM), { beats: [['C/G', 4]] }]), // Interlude pt 2
    ...sectionEnd(A({ pickup: LYRICS.pickups[2] })), // Slide guitar interlude (with laughter)
    ...A({ lyrics: LYRICS.verse3, last: fill(SMILE_TOLD, LYRICS.verse3[7]) }), // Verse 3
    { ...fill(fBar(2, false), LYRICS.verse3[8]), doubleBar: true }, // extra line, straight into the outro
    { letRing: true, beats: [{ raw: outroBar('C (barre)', OUTRO_C, LYRICS.verse3[9][0]) }] },
    ...[outroDdim, outroC, outroDdim, outroC, outroDdim, outroC, outroDdim].map(raw => ({ letRing: true, beats: [{ raw }] })),
    { beats: [{ raw: '(3.5{lr} 5.4{lr} 0.3{lr} 5.2{lr} 7.1{lr}).1 {ch "Cmaj7 (end)" ad 960}' }] }, // rolled slowly
  ],
  sheet: [
    [
      "Intro",
      [
        [
          [
            "C/G",
            ""
          ],
          [
            "Cmaj7/G",
            ""
          ],
          [
            "Ddim7",
            ""
          ],
          [
            "C (barre)",
            ""
          ],
          [
            "Cmaj7",
            ""
          ],
          [
            "C7",
            ""
          ]
        ],
        [
          [
            "Am6",
            ""
          ],
          [
            "Am6/F#",
            ""
          ],
          [
            "F",
            ""
          ],
          [
            "F/G",
            ""
          ],
          [
            "C",
            ""
          ],
          [
            "Gadd4/B",
            ""
          ],
          [
            "Am6/F#",
            ""
          ],
          [
            "F",
            ""
          ],
          [
            "F/G",
            ""
          ],
          [
            "C/G",
            ""
          ]
        ],
        "(F bars: variation 2, with the high-e fill)"
      ]
    ],
    [
      "Verse 1",
      [
        [
          [
            null,
            "I seen the "
          ],
          [
            "C/G",
            "plague of "
          ],
          [
            "Cmaj7/G",
            "locusts, the"
          ]
        ],
        [
          [
            "Ddim7",
            "plague of "
          ],
          [
            "C (barre)",
            "lice, an"
          ]
        ],
        [
          [
            "C (barre)",
            "ocean split right "
          ],
          [
            "Cmaj7",
            "down the "
          ],
          [
            "C7",
            "middle"
          ]
        ],
        [
          [
            "Am6",
            "Ain't that "
          ],
          [
            "Am6/F#",
            "nice, oh honey"
          ]
        ],
        [
          [
            "F",
            "Nothin' on this "
          ],
          [
            "F/G",
            "earth could make me"
          ]
        ],
        [
          [
            "C",
            "smile, "
          ],
          [
            "Gadd4/B",
            "I "
          ],
          [
            "Am6/F#",
            "told ya"
          ]
        ],
        [
          [
            "F",
            "Nothin' on this "
          ],
          [
            "F/G",
            "earth could make me"
          ]
        ],
        [
          [
            "C/G",
            "smile"
          ]
        ],
        "(one extra bar of C/G)"
      ]
    ],
    [
      "Slide guitar interlude",
      [
        [
          [
            "C/G",
            ""
          ],
          [
            "Cmaj7/G",
            ""
          ],
          [
            "Ddim7",
            ""
          ],
          [
            "C (barre)",
            ""
          ],
          [
            "Cmaj7",
            ""
          ],
          [
            "C7",
            ""
          ]
        ],
        [
          [
            "Am6",
            ""
          ],
          [
            "Am6/F#",
            ""
          ],
          [
            "F",
            ""
          ],
          [
            "F/G",
            ""
          ],
          [
            "C",
            ""
          ],
          [
            "Gadd4/B",
            ""
          ],
          [
            "Am6/F#",
            ""
          ],
          [
            "F",
            ""
          ],
          [
            "F/G",
            ""
          ],
          [
            "C/G",
            ""
          ]
        ]
      ]
    ],
    [
      "Verse 2",
      [
        [
          [
            null,
            "Well it's the "
          ],
          [
            "C/G",
            "sweetest thing "
          ],
          [
            "Cmaj7/G",
            "that I've"
          ]
        ],
        [
          [
            "Ddim7",
            "ever "
          ],
          [
            "C (barre)",
            "seen"
          ]
        ],
        [
          [
            "C (barre)",
            "A photo-cake, for "
          ],
          [
            "Cmaj7",
            "goodness "
          ],
          [
            "C7",
            "sake"
          ]
        ],
        [
          [
            "Am6",
            "Devotion iced in "
          ],
          [
            "Am6/F#",
            "green, oh, honey"
          ]
        ],
        [
          [
            "F",
            "nothing on this "
          ],
          [
            "F/G",
            "earth can make me"
          ]
        ],
        [
          [
            "C",
            "smile, "
          ],
          [
            "Gadd4/B",
            "I "
          ],
          [
            "Am6/F#",
            "told you"
          ]
        ],
        [
          [
            "F",
            "nothing on this "
          ],
          [
            "F/G",
            "earth can make me"
          ]
        ],
        [
          [
            "C/G",
            "smile"
          ]
        ],
        "(bass walks C–B into the interlude)"
      ]
    ],
    [
      "Interlude",
      [
        [
          [
            "Am",
            "ooh "
          ],
          [
            "Am/F#",
            ""
          ],
          [
            "Am",
            "ooh "
          ],
          [
            "Am/F#",
            ""
          ]
        ],
        [
          [
            "F",
            "ooh "
          ],
          [
            "Em7",
            ""
          ],
          [
            "C",
            "ooh "
          ],
          [
            "Cadd9",
            ""
          ]
        ]
      ]
    ],
    [
      "Interlude pt 2",
      [
        [
          [
            "Am",
            "ooh "
          ],
          [
            "Am/F#",
            ""
          ],
          [
            "Am",
            "ooh "
          ],
          [
            "Am/F#",
            ""
          ]
        ],
        [
          [
            "F",
            "ooh "
          ],
          [
            "Em7",
            ""
          ],
          [
            "F",
            ""
          ],
          [
            "A♭dim",
            ""
          ]
        ],
        [
          [
            "C/G",
            ""
          ]
        ]
      ]
    ],
    [
      "Slide guitar interlude (with laughter)",
      [
        [
          [
            "C/G",
            ""
          ],
          [
            "Cmaj7/G",
            ""
          ],
          [
            "Ddim7",
            ""
          ],
          [
            "C (barre)",
            ""
          ],
          [
            "Cmaj7",
            ""
          ],
          [
            "C7",
            ""
          ]
        ],
        [
          [
            "Am6",
            ""
          ],
          [
            "Am6/F#",
            ""
          ],
          [
            "F",
            ""
          ],
          [
            "F/G",
            ""
          ],
          [
            "C",
            ""
          ],
          [
            "Gadd4/B",
            ""
          ],
          [
            "Am6/F#",
            ""
          ],
          [
            "F",
            ""
          ],
          [
            "F/G",
            ""
          ],
          [
            "C/G",
            ""
          ]
        ]
      ]
    ],
    [
      "Verse 3",
      [
        [
          [
            null,
            "I like my "
          ],
          [
            "C/G",
            "toast with "
          ],
          [
            "Cmaj7/G",
            "jam, love, my"
          ]
        ],
        [
          [
            "Ddim7",
            "coffee "
          ],
          [
            "C (barre)",
            "mild. My"
          ]
        ],
        [
          [
            "C (barre)",
            "troubles stacked like "
          ],
          [
            "Cmaj7",
            "dishes "
          ],
          [
            "C7",
            "in a"
          ]
        ],
        [
          [
            "Am6",
            "crooked "
          ],
          [
            "Am6/F#",
            "pile, and"
          ]
        ],
        [
          [
            "F",
            "nothing on this "
          ],
          [
            "F/G",
            "earth can make me"
          ]
        ],
        [
          [
            "C",
            "smile, "
          ],
          [
            "Gadd4/B",
            "no, "
          ],
          [
            "Am6/F#",
            "no"
          ]
        ],
        [
          [
            "F",
            "nothing on this "
          ],
          [
            "F/G",
            "earth can make me"
          ]
        ],
        [
          [
            "C",
            "smile, "
          ],
          [
            "Gadd4/B",
            "I "
          ],
          [
            "Am6/F#",
            "told you"
          ]
        ],
        [
          [
            "F",
            "nothing on this "
          ],
          [
            "F/G",
            "earth can make me"
          ]
        ]
      ]
    ],
    [
      "Outro",
      [
        [
          [
            "C (barre)",
            "smile "
          ],
          [
            "Ddim7",
            ""
          ],
          [
            "C (barre)",
            ""
          ],
          [
            "Ddim7",
            ""
          ],
          [
            "C (barre)",
            ""
          ],
          [
            "Ddim7",
            ""
          ],
          [
            "C (barre)",
            ""
          ],
          [
            "Ddim7",
            ""
          ],
          [
            "Cmaj7 (end)",
            ""
          ]
        ],
        "(one bar each, fingerpicked in 16ths; mute the A string on beats 2 and 4 of the C bars; the last chord is rolled slowly)"
      ]
    ]
  ],
};
