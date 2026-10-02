// Standard open-position shapes, low E -> high e, null = muted. Songs override or add their own.
export const library = {
  'A': [null, 0, 2, 2, 2, 0],
  'Am': [null, 0, 2, 2, 1, 0],
  'A7': [null, 0, 2, 0, 2, 0],
  'Am7': [null, 0, 2, 0, 1, 0],
  'Amaj7': [null, 0, 2, 1, 2, 0],
  'Asus2': [null, 0, 2, 2, 0, 0],
  'Asus4': [null, 0, 2, 2, 3, 0],
  'B': [null, 2, 4, 4, 4, 2],
  'Bm': [null, 2, 4, 4, 3, 2],
  'B7': [null, 2, 1, 2, 0, 2],
  'C': [null, 3, 2, 0, 1, 0],
  'C7': [null, 3, 2, 3, 1, 0],
  'Cmaj7': [null, 3, 2, 0, 0, 0],
  'Cadd9': [null, 3, 2, 0, 3, 0],
  'D': [null, null, 0, 2, 3, 2],
  'Dm': [null, null, 0, 2, 3, 1],
  'D7': [null, null, 0, 2, 1, 2],
  'Dm7': [null, null, 0, 2, 1, 1],
  'Dmaj7': [null, null, 0, 2, 2, 2],
  'Dsus2': [null, null, 0, 2, 3, 0],
  'Dsus4': [null, null, 0, 2, 3, 3],
  'D/F#': [2, 0, 0, 2, 3, 2],
  'E': [0, 2, 2, 1, 0, 0],
  'Em': [0, 2, 2, 0, 0, 0],
  'E7': [0, 2, 0, 1, 0, 0],
  'Em7': [0, 2, 2, 0, 3, 0],
  'Esus4': [0, 2, 2, 2, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'Fmaj7': [null, null, 3, 2, 1, 0],
  'G': [3, 2, 0, 0, 0, 3],
  'G7': [3, 2, 0, 0, 0, 1],
  'G/B': [null, 2, 0, 0, 0, 3],
};

const STANDARD = [4, 9, 2, 7, 11, 4]; // E A D G B E as pitch classes
const ROOTS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// Chord tones as semitones above the root; the 5th (7) may be omitted.
const QUALITIES = {
  '': [0, 4, 7], 'm': [0, 3, 7], '5': [0, 7], 'aug': [0, 4, 8], 'dim': [0, 3, 6],
  '6': [0, 4, 7, 9], 'm6': [0, 3, 7, 9], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11],
  'mmaj7': [0, 3, 7, 11], 'dim7': [0, 3, 6, 9], 'm7b5': [0, 3, 6, 10], '9': [0, 4, 7, 10, 2], 'm9': [0, 3, 7, 10, 2],
  'maj9': [0, 4, 7, 11, 2], 'add9': [0, 4, 7, 2], 'madd9': [0, 3, 7, 2], 'add4': [0, 4, 7, 5], 'sus2': [0, 2, 7],
  'sus4': [0, 5, 7], '7sus4': [0, 5, 7, 10], '11': [0, 4, 7, 10, 2, 5], 'm11': [0, 3, 7, 10, 2, 5], '13': [0, 4, 7, 10, 2, 9],
};
const pitch = s => {
  const m = /^([A-G])([#♯b♭]?)/.exec(s);
  return m && { pc: (ROOTS[m[1]] + (m[2] === '#' || m[2] === '♯' ? 1 : m[2] ? 11 : 0)) % 12, len: m[0].length };
};

// Returns a list of problems comparing a chord's name against the notes its frets actually sound.
export function checkName(name, frets, tuning = STANDARD) {
  const [head, bass] = name.replace(/\s*\(.*?\)\s*/g, '').split('/');
  const root = pitch(head);
  const tones = root && QUALITIES[head.slice(root.len).replace('min', 'm').replace('ø', 'm7b5').replace('°', 'dim')];
  if (!tones) return [`can't parse chord name "${name}"`];
  const played = frets.map((f, i) => (f === null ? null : (tuning[i] + f) % 12));
  const sounding = new Set(played.filter(p => p !== null));
  const allowed = new Set(tones.map(t => (root.pc + t) % 12));
  const bassPc = bass && pitch(bass)?.pc;
  if (bassPc !== undefined) allowed.add(bassPc);
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const problems = [];
  const extra = [...sounding].filter(p => !allowed.has(p));
  if (extra.length) problems.push(`plays ${extra.map(p => names[p]).join(', ')}, which isn't in ${name}`);
  const missing = tones.filter(t => t !== 7 && !sounding.has((root.pc + t) % 12));
  if (missing.length) problems.push(`is missing ${missing.map(t => names[(root.pc + t) % 12]).join(', ')}`);
  const lowest = played.find(p => p !== null);
  if (bassPc !== undefined && lowest !== bassPc) problems.push(`lowest note is ${names[lowest]}, not ${bass}`);
  return problems;
}
