// Editor changes live in exports at the end of each song.mjs: `overrides` (bar alphaTex by bar index) and `chordEdits` (chart fields by chord name).
import fs from 'fs';

const COMMENTS = {
  overrides: '// Bar edits from the bar editor, keyed by bar index (0-based). Restructuring the bars invalidates them.',
  chordEdits: '// Chord chart edits from the chart editor, keyed by chord name; they replace those fields of the chord\'s shape.',
};

// edits: { [key]: value, or null to drop the key }.
export function updateEdits(file, name, edits) {
  const src = fs.readFileSync(file, 'utf8');
  const block = new RegExp(`\\n*// .*\\nexport const ${name} = (\\{[\\s\\S]*?\\n\\});\\n`);
  const match = src.match(block);
  const current = JSON.parse(match?.[1] ?? '{}');
  for (const [key, value] of Object.entries(edits)) {
    if (value === null) delete current[key];
    else current[key] = value;
  }
  const entries = Object.entries(current).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  const text = entries.length ? `\n\n${COMMENTS[name]}\nexport const ${name} = {\n${entries.join(',\n')}\n};\n` : '\n';
  fs.writeFileSync(file, (match ? src.replace(block, () => text) : src.trimEnd() + text).trimEnd() + '\n');
}
