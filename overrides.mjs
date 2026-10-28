// Hand-edited bars live in an `overrides` export at the end of each song.mjs, keyed by bar index; the bar editors write it here.
import fs from 'fs';

const BLOCK = /\n*\/\/ Bar edits.*\nexport const overrides = (\{[\s\S]*\});\n*$/;

// edits: { [barIndex]: alphaTex, or null to go back to the song's pattern }.
export function updateOverrides(file, edits) {
  const src = fs.readFileSync(file, 'utf8');
  const overrides = JSON.parse(src.match(BLOCK)?.[1] ?? '{}');
  for (const [index, tex] of Object.entries(edits)) {
    if (tex === null) delete overrides[index];
    else overrides[index] = tex;
  }
  const body = src.replace(BLOCK, '').trimEnd() + '\n';
  fs.writeFileSync(file, Object.keys(overrides).length
    ? `${body}\n// Bar edits from the bar editor, keyed by bar index (0-based). Restructuring the bars invalidates them.\nexport const overrides = ${JSON.stringify(overrides, null, 2)};\n`
    : body);
}
